const http = require('http');
const { speechConfig, VOICES } = require('./speech-config.js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = __dirname;

// Reads KEY=value lines from a gitignored .env so the ElevenLabs key never has to
// be typed on a command line, pasted into a chat, or committed. Values already in
// the environment win, so `ELEVENLABS_API_KEY=... npm start` still overrides it.
// The static server refuses to serve any dot-file, so .env is not reachable over
// HTTP; see resolveStatic below.
function loadEnvFile(){
  const file = path.join(ROOT, '.env');
  let raw;
  try { raw = fs.readFileSync(file, 'utf8'); } catch { return; }
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}
loadEnvFile();

const PORT = Number(process.env.PORT || 8080);
// Loopback by default. HOST=0.0.0.0 opens the server to the local network so a
// phone on the same Wi-Fi can play; the static allowlist and the TTS rate limit
// are what make that acceptable for a home network, never for the open internet.
const HOST = process.env.HOST || '127.0.0.1';
const API_KEY = process.env.ELEVENLABS_API_KEY || '';
// Model, voices, settings and cache key live in speech-config.js, shared with
// the tools that count and record every line. Since 2026-10-01 the whole app is
// recorded ahead of time with eleven_v4_turbo and production serves only that
// cache (TTS_CACHE_ONLY), so the model's latency no longer reaches the child.
// ELEVENLABS_MODEL still overrides it, e.g. eleven_flash_v2_5 for the old set.
const SPEECH = speechConfig(process.env);
const MODEL = SPEECH.model;
const CACHE_DIR = path.join(ROOT, '.tts-cache');
const SELECTION_FILE = path.join(ROOT, '.voice-selection-v35.json');
fs.mkdirSync(CACHE_DIR, { recursive: true });

let voiceCache = null;
let chosen = {};        // { nl: {Milo, Luna}, en: {Milo, Luna} }
let selectionMeta = {};  // same shape, with provenance for the voice-status route

const UPSTREAM_TIMEOUT_MS = Number(process.env.TTS_TIMEOUT_MS || 15000);
const MAX_BODY_BYTES = 8 * 1024;
const RATE_WINDOW_MS = 60000;
// A quiz on a topic nobody played before warms ~15 lines per question (the
// question, its answers, both feedback lines, the hint and the next question),
// so a quick child legitimately reaches 100+ requests a minute; cache hits are
// refunded below and never count.
const RATE_MAX = Number(process.env.TTS_RATE_LIMIT || 240);
const LANGS = new Set(['nl','en','pt','de','es','fr','it','ru','da','ar']);
const hits = new Map();

// Production runs behind Caddy (deploy/Caddyfile), where every socket is
// 127.0.0.1. With TRUST_PROXY=1 the client address comes from the proxy's
// X-Forwarded-For instead, so the per-client cap is per visitor again.
// Never set TRUST_PROXY on a server that is reachable without the proxy:
// anyone could then forge the header and dodge the limit.
const TRUST_PROXY = process.env.TRUST_PROXY === '1';
function clientAddress(req){
  if (TRUST_PROXY) {
    const fwd = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
    if (fwd) return fwd;
  }
  return req.socket.remoteAddress || 'unknown';
}

// ALLOWED_ORIGINS="https://app.kwizillo.nl,capacitor://localhost,https://localhost" restricts
// speech to requests that carry one of those Origin headers. Empty (the
// default for local development) allows any origin. This keeps casual reuse of
// the proxy out; the rate limit and the daily budget below cover the rest.
const ALLOWED_ORIGINS = new Set(String(process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean));
function originAllowed(req){
  if (!ALLOWED_ORIGINS.size) return true;
  return ALLOWED_ORIGINS.has(String(req.headers.origin || ''));
}
// The page and the proxy are the same host in development and different hosts
// in production (and capacitor://localhost inside the app), so an allowed
// origin is echoed back. Without this the browser refuses the answer before
// the app ever sees it.
function corsHeaders(req){
  const origin = String(req.headers.origin || '');
  if (!origin || !originAllowed(req)) return {};
  return { 'Access-Control-Allow-Origin': origin, 'Vary': 'Origin' };
}

// TTS_CACHE_ONLY=1 never asks ElevenLabs for anything: a line that is not in
// .tts-cache answers 404 and the app skips it (a 503 would switch the voice off
// for the whole session). Production runs like this, so players can never cost
// credits; new lines are recorded on a machine without the switch
// (tools/warm-speech.cjs) and the cache is copied over.
const CACHE_ONLY = /^(1|true|yes)$/i.test(process.env.TTS_CACHE_ONLY || '');

// TTS_DAILY_CHARS caps how many characters the whole server sends to
// ElevenLabs per calendar day (0 = no cap). A cache hit costs nothing. The cap
// is the hard ceiling on the credit bill whatever else goes wrong.
const DAILY_CHARS = Number(process.env.TTS_DAILY_CHARS || 0);
let dailyDay = '', dailyUsed = 0;
function dailyBudgetLeft(){
  const day = new Date().toISOString().slice(0, 10);
  if (day !== dailyDay) { dailyDay = day; dailyUsed = 0; }
  return DAILY_CHARS ? DAILY_CHARS - dailyUsed : Infinity;
}
function dailySpend(chars){ dailyBudgetLeft(); dailyUsed += chars; }

// Coarse per-client cap so an open proxy cannot burn ElevenLabs credits.
function rateLimited(req){
  const key = clientAddress(req);
  const now = Date.now();
  const seen = (hits.get(key) || []).filter(t => now - t < RATE_WINDOW_MS);
  seen.push(now);
  hits.set(key, seen);
  if (hits.size > 1000) for (const [k, v] of hits) if (!v.some(t => now - t < RATE_WINDOW_MS)) hits.delete(k);
  return seen.length > RATE_MAX;
}
// A request served from the disk cache costs nothing upstream, so it is not
// held against the client.
function rateRefund(req){ const seen = hits.get(clientAddress(req)); if (seen && seen.length) seen.pop(); }

const mime = {
  '.html':'text/html; charset=utf-8', '.js':'application/javascript; charset=utf-8', '.css':'text/css; charset=utf-8',
  '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.svg':'image/svg+xml', '.mp4':'video/mp4', '.webm':'video/webm', '.mp3':'audio/mpeg',
  '.wav':'audio/wav', '.ico':'image/x-icon', '.json':'application/json; charset=utf-8', '.ttf':'font/ttf', '.woff2':'font/woff2'
};

// Serving is allowlist-based: anything not explicitly permitted is a 404.
// Path traversal was already blocked, but dotfiles were not — `.git/config`,
// `.voice-selection-*.json` and a future `.env` holding the ElevenLabs key were
// all readable over the network.
const ROOT_DENY = new Set(['server.js', 'speech-config.js', 'playwright.config.js', 'package.json', 'package-lock.json']);
const ASSET_DIR = 'assets';

function resolveStatic(pathname){
  let rel;
  try { rel = decodeURIComponent(pathname === '/' ? '/index.html' : pathname); }
  catch { return null; }
  rel = rel.replace(/^\/+/, '');
  if (!rel || rel.includes('\0') || rel.includes('\\')) return null;

  const segments = rel.split('/');
  // Rejects '', '.', '..' and every dot-prefixed file or directory.
  if (segments.some(s => !s || s.startsWith('.'))) return null;
  if (!mime[path.extname(rel).toLowerCase()]) return null;
  // JSON is only ever an asset manifest; the root's own config files stay private.
  if (path.extname(rel).toLowerCase() === '.json' && segments[0] !== ASSET_DIR) return null;

  if (segments.length === 1) {
    if (ROOT_DENY.has(rel)) return null;            // never hand out our own source
  } else if (segments[0] !== ASSET_DIR) {
    return null;                                     // tests/, docs/, .tts-cache/, …
  }

  const target = path.join(ROOT, ...segments);
  return target.startsWith(ROOT + path.sep) ? target : null;
}

function json(res, code, obj){
  res.writeHead(code, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});
  res.end(JSON.stringify(obj));
}
async function fetchJson(url, options={}){
  const r = await fetch(url, options);
  const text = await r.text();
  let data = null;
  try{ data = text ? JSON.parse(text) : {}; }catch{ data = {raw:text}; }
  if(!r.ok){
    const msg = data?.detail?.message || data?.detail || data?.error || data?.raw || `${r.status}`;
    throw new Error(`${r.status}: ${String(msg).slice(0,240)}`);
  }
  return data;
}
function norm(v){ return String(v||'').toLowerCase(); }
// The product direction is Netherlands Dutch. A Flemish/Belgian accent has been
// explicitly rejected, so it must lose the ranking rather than merely not win it.
function isFlemish(v){
  const labels = v.labels || {};
  const hay = [v.accent, labels.accent, v.name, v.description, v.descriptive].filter(Boolean).join(' ').toLowerCase();
  return /flemish|vlaams|belgian|belgisch|be-nl|nl-be/.test(hay);
}
// Base scorers rate gender, age and tone only. Language fit is the rule's job
// (scoreVoiceFor); a "verified for Dutch" bonus here once let an American voice
// win the English slot because it happened to be verified for Dutch as well.
// A children's app: a voice sold as sultry, breathy or raspy is wrong for a guide
// who reads quiz questions to a six-year-old, however well it is labelled.
const GROWN_UP = /sultry|sensual|seduct|sexy|breathy|husky|raspy|asmr|smok|whisper/;
function scoreCurrentVoice(v, wanted){
  const labels=v.labels||{};
  const hay=[v.name,v.description,...Object.values(labels)].filter(Boolean).join(' ').toLowerCase();
  let s=0;
  if(norm(labels.gender)===wanted) s+=110;
  if(/young|youth|jong/.test(norm(labels.age)+' '+hay)) s+=80;
  if(/friendly|warm|cheer|conversational|story|narrat|clear|calm|pleasant|gentle|youthful|bright/.test(hay)) s+=35;
  if(/old|elder|deep|gravel|intense|dramatic|villain|mature/.test(hay)) s-=45;
  if(GROWN_UP.test(hay)) s-=70;
  return s;
}
function scoreSharedVoice(v,wanted){
  const hay=[v.name,v.description,v.descriptive,v.use_case,v.accent,v.age,v.gender,v.language].filter(Boolean).join(' ').toLowerCase();
  let s=0;
  const gender=norm(v.gender);
  if(gender===wanted) s+=120;
  if(norm(v.age)==='young' || /young|youth|jong/.test(hay)) s+=100;
  if(/friendly|warm|cheer|joy|conversational|story|narrat|clear|calm|pleasant|gentle|youthful|bright|character/.test(hay)) s+=45;
  if(/characters_animation|animation|narration|educat/.test(hay)) s+=20;
  if(/old|elder|deep|gravel|intense|dramatic|villain|mature|senior/.test(hay)) s-=65;
  if(GROWN_UP.test(hay)) s-=90;
  s += Math.min(30, Math.log10(1+Number(v.usage_character_count_1y||0))*6);
  return s;
}
async function loadCurrentVoices(){
  if(!API_KEY) throw new Error('ELEVENLABS_API_KEY ontbreekt');
  if(voiceCache) return voiceCache;
  const data=await fetchJson('https://api.elevenlabs.io/v1/voices',{headers:{'xi-api-key':API_KEY}});
  voiceCache=Array.isArray(data.voices)?data.voices:[];
  return voiceCache;
}
function readSavedSelection(){
  try{return JSON.parse(fs.readFileSync(SELECTION_FILE,'utf8'))}catch{return {}}
}
function saveSelection(){
  try{fs.writeFileSync(SELECTION_FILE,JSON.stringify(selectionMeta,null,2))}catch(e){}
}
async function addSharedVoice(shared, alias){
  const endpoint=`https://api.elevenlabs.io/v1/voices/add/${encodeURIComponent(shared.public_owner_id)}/${encodeURIComponent(shared.voice_id)}`;
  const data=await fetchJson(endpoint,{
    method:'POST',
    signal:AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    headers:{'xi-api-key':API_KEY,'Content-Type':'application/json'},
    body:JSON.stringify({new_name:alias,bookmarked:true})
  });
  return data.voice_id || shared.voice_id;
}

// A Dutch voice reading English sounds wrong and the other way round, so Milo and
// Luna are picked per language rather than once for the whole app.
//
// The authoritative signal is the voice's own `accent` label. "Verified for nl" is
// not enough: ElevenLabs verifies popular American voices for Dutch too, and one
// of those beat every native Dutch candidate on popularity alone during QA.
function accentOf(v){ return norm(v.accent || v.labels?.accent || ''); }
function languageOf(v){ return norm(v.language || v.labels?.language || ''); }
const NON_DUTCH_ACCENTS = /american|british|australian|irish|scottish|canadian|indian|african|english|us\b|uk\b/;

// One rule per language. `prefer` is the accent the product wants (a bonus, so a
// voice with no accent label can still win), `avoid` is an accent that must lose
// rather than merely not win, and `veto` looks past the labels at the name and
// the description for the same thing. `strict` also rejects voices labelled for
// another language; Dutch leaves it off so step 6 still has a last resort.
function langRuleFor(label, code, {prefer, avoid, veto, strict=true}={}){
  const bad = v => !!(veto && veto(v)) || !!(avoid && avoid.test(accentOf(v)));
  return {
    label, code,
    matches: v => languageOf(v)===code && !bad(v),
    reject:  v => bad(v) || (strict && !!languageOf(v) && languageOf(v)!==code),
    accentBonus: v => prefer && prefer.test(accentOf(v)) ? 80 : 0
  };
}
const LANG_RULES = {
  nl: langRuleFor('Netherlands Dutch','nl',{prefer:/^(standard|nl-nl|netherlands|dutch)$/,avoid:NON_DUTCH_ACCENTS,veto:isFlemish,strict:false}),
  en: langRuleFor('US English','en',{prefer:/american|en-us/}),
  pt: langRuleFor('Brazilian Portuguese','pt',{prefer:/brazil|brasil|pt-br/,avoid:/portugal|european|pt-pt/}),
  // Added for the six new languages. Each one wants the standard variety of the
  // country the product ships to, so a regional variety that would sound wrong to
  // a child (Swiss German, Quebec French) is pushed down rather than rejected:
  // rejecting it outright can leave a language without any voice at all.
  de: langRuleFor('German','de',{prefer:/^(standard|german|de-de|germany)$/}),
  es: langRuleFor('European Spanish','es',{prefer:/castilian|peninsular|spain|es-es|^(standard|spanish)$/}),
  fr: langRuleFor('French','fr',{prefer:/^(standard|french|fr-fr|france)$/}),
  it: langRuleFor('Italian','it',{prefer:/^(standard|italian|it-it|italy)$/}),
  ru: langRuleFor('Russian','ru',{prefer:/^(standard|russian|ru-ru|russia)$/}),
  da: langRuleFor('Danish','da',{prefer:/^(standard|danish|da-dk|denmark)$/}),
  // Modern Standard Arabic, the variety the questions are written in. A strong
  // regional dialect is pushed down rather than rejected, so the language is
  // never left without a voice at all.
  ar: langRuleFor('Modern Standard Arabic','ar',{prefer:/^(standard|modern standard|msa|arabic|ar-sa|ar-eg)$/})
};
const langRule = lang => LANG_RULES[lang] || LANG_RULES.nl;

// A curated Kwizillo voice is named after its language ("Kwizillo Luna NL-NL v20").
// When labels tie, the name that agrees with the requested language wins and a
// name that names the other language loses; that keeps a mislabelled leftover from
// outranking the voice that was actually reviewed for this language.
function nameLanguageBias(v, lang){
  const name=norm(v.name);
  if(!name.startsWith('kwizillo')) return 0;
  // "Kwizillo Luna NL-NL v20" names its language; "Kwizillo Milo DE auto" too.
  const named=Object.keys(LANG_RULES).filter(c=>new RegExp(`\\b${c}(-[a-z]{2})?\\b`).test(name));
  if(!named.length) return 0;
  return named.includes(lang) ? 50 : -50;
}
function scoreVoiceFor(v, wanted, lang, shared){
  const rule=langRule(lang);
  let s = shared ? scoreSharedVoice(v,wanted) : scoreCurrentVoice(v,wanted);
  if(rule.matches(v)) s+=200;
  if(rule.reject(v)) s-=1000;
  s+=rule.accentBonus(v);
  s+=nameLanguageBias(v,lang);
  return s;
}

async function listSharedVoices(wanted, lang){
  const gender=wanted==='male'?'male':'female';
  const candidates=[];
  const queries=[
    {language:lang,gender,age:'young',category:'professional'},
    {language:lang,gender,age:'young',category:'high_quality'},
    {language:lang,gender,category:'professional'},
    {language:lang,gender,category:'high_quality'},
    {language:lang,gender}
  ];
  for(const q of queries){
    const u=new URL('https://api.elevenlabs.io/v1/shared-voices');
    u.searchParams.set('page_size','100');
    u.searchParams.set('sort','usage_character_count_1y');
    u.searchParams.set('include_custom_rates','false');
    u.searchParams.set('include_live_moderated','false');
    Object.entries(q).forEach(([k,v])=>u.searchParams.set(k,v));
    try{
      const data=await fetchJson(u.toString(),{signal:AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),headers:API_KEY?{'xi-api-key':API_KEY}:{}});
      for(const v of (data.voices||[])) if(!candidates.some(x=>x.voice_id===v.voice_id)) candidates.push(v);
      if(candidates.length>=8) break;
    }catch(e){}
  }
  return candidates.sort((a,b)=>scoreVoiceFor(b,wanted,lang,true)-scoreVoiceFor(a,wanted,lang,true));
}

const guideMeta = (v, extra={}) => ({
  voice_id:v.voice_id, name:v.name,
  age:v.age||v.labels?.age, gender:v.gender||v.labels?.gender,
  accent:accentOf(v)||undefined, language:languageOf(v)||undefined,
  ...extra
});

async function ensureGuideVoice(guide, wanted, lang){
  const rule=langRule(lang);
  const envKey=`${guide.toUpperCase()}_VOICE_ID_${lang.toUpperCase()}`;
  const explicit=process.env[envKey] || (lang==='nl' ? process.env[guide==='Milo'?'MILO_VOICE_ID':'LUNA_VOICE_ID'] : '');
  const current=await loadCurrentVoices();

  // 0. Chosen by ear and pinned in speech-config.js (all ten languages).
  const pinned=VOICES[lang]?.[guide];
  if(pinned && !explicit){
    const found=current.find(v=>v.voice_id===pinned)||{voice_id:pinned,name:`Kwizillo ${guide} ${lang.toUpperCase()} v4t`,labels:{}};
    return {voice:found,meta:guideMeta(found,{source:'speech-config',lang,native:true})};
  }

  // 1. Pinned in .env. Wins over the config, for trying a voice out.
  if(explicit){
    const found=current.find(v=>v.voice_id===explicit)||{voice_id:explicit,name:`${guide} custom`,labels:{}};
    return {voice:found,meta:guideMeta(found,{source:'environment',lang,native:rule.matches(found)})};
  }

  // 2. Saved from a previous run, still present and still acceptable.
  const saved=readSavedSelection()?.[lang]?.[guide];
  if(saved?.voice_id){
    const found=current.find(v=>v.voice_id===saved.voice_id);
    if(found && rule.matches(found)) return {voice:found,meta:guideMeta(found,{source:'saved',lang,native:true})};
  }

  // 3. The account's own curated Kwizillo voices. Earlier milestones already
  //    added "Kwizillo Luna NL-NL v20" and friends; those beat any shared search.
  //    Match on labels, not on the name: one "NL-NL" voice is labelled British.
  const curated=current
    .filter(v=>norm(v.name).startsWith(`kwizillo ${guide.toLowerCase()}`) && rule.matches(v) && (norm(v.labels?.gender)===wanted || !v.labels?.gender))
    .sort((a,b)=>scoreVoiceFor(b,wanted,lang,false)-scoreVoiceFor(a,wanted,lang,false));
  if(curated.length){
    const v=curated[0];
    return {voice:v,meta:guideMeta(v,{source:'library-curated',lang,native:true})};
  }

  // 4. Any other acceptable voice already in the library.
  const own=current
    .filter(v=>rule.matches(v) && norm(v.labels?.gender)===wanted)
    .sort((a,b)=>scoreVoiceFor(b,wanted,lang,false)-scoreVoiceFor(a,wanted,lang,false));
  if(own.length){
    const v=own[0];
    return {voice:v,meta:guideMeta(v,{source:'library',lang,native:true})};
  }

  // 5. Shared voice library, strictly filtered, then added under a Kwizillo alias.
  const alias=`Kwizillo ${guide} ${lang.toUpperCase()} auto`;
  const shared=(await listSharedVoices(wanted,lang)).filter(v=>rule.matches(v)&&!rule.reject(v));
  for(const candidate of shared.slice(0,12)){
    const already=current.find(v=>v.voice_id===candidate.voice_id);
    if(already) return {voice:already,meta:guideMeta(candidate,{name:already.name||candidate.name,source:'already-saved',lang,native:true})};
    try{
      const voiceId=await addSharedVoice(candidate,alias);
      voiceCache=null;
      const voice={voice_id:voiceId,name:candidate.name||alias,labels:{gender:candidate.gender,age:candidate.age,language:candidate.language,accent:candidate.accent},description:candidate.description,verified_languages:candidate.verified_languages};
      return {voice,meta:guideMeta(voice,{source:'shared',lang,native:true})};
    }catch(e){
      // Already present under another name; it may surface in current voices next round.
    }
  }

  // 6. Last resort. Reported as non-native so it is visible in voice-status.
  const fallback=[...current].filter(v=>!rule.reject(v)).sort((a,b)=>scoreVoiceFor(b,wanted,lang,false)-scoreVoiceFor(a,wanted,lang,false))[0];
  if(!fallback) throw new Error('No ElevenLabs voices available');
  return {voice:fallback,meta:guideMeta(fallback,{source:'fallback-non-native',lang,native:false})};
}

async function loadVoices(lang){
  if(!API_KEY) throw new Error('ELEVENLABS_API_KEY missing');
  if(chosen[lang]?.Milo && chosen[lang]?.Luna) return;
  const [m,l]=await Promise.all([ensureGuideVoice('Milo','male',lang),ensureGuideVoice('Luna','female',lang)]);
  chosen[lang]={Milo:m.voice,Luna:l.voice};
  selectionMeta[lang]={Milo:m.meta,Luna:l.meta};
  saveSelection();
  const rule=langRule(lang);
  for(const [guide,meta] of Object.entries(selectionMeta[lang])){
    console.log(`${guide} (${lang}): ${meta.name} — ${meta.native?`native ${rule.label}`:`NOT native ${rule.label}`}${meta.accent?`, accent ${meta.accent}`:''}`);
  }
}

// Measured on 2026-09-13 with the curated v20 voices: Milo spoke at ~18 chars/s,
// Luna at ~15. CLAUDE.md section 9 asks for calm, child-friendly pacing, so Milo
// is slowed towards Luna. Range is 0.7-1.2; extremes degrade quality.
const VOICE_SETTINGS = SPEECH.settings;

// ElevenLabs allows a fixed number of concurrent requests per subscription (5 on
// this account) and answers the rest with 429 concurrent_limit_exceeded. A quiz
// question alone is five segments fired at once, so requests are funnelled through
// a small semaphore and a 429 is retried after a short pause instead of being
// handed to the client as a failed segment.
const UPSTREAM_CONCURRENCY = Number(process.env.TTS_CONCURRENCY || 3);
let upstreamActive = 0;
const upstreamQueue = [];
function acquireUpstream(){
  return new Promise(resolve => {
    const tryStart = () => { if (upstreamActive < UPSTREAM_CONCURRENCY) { upstreamActive++; resolve(); } else upstreamQueue.push(tryStart); };
    tryStart();
  });
}
function releaseUpstream(){
  upstreamActive = Math.max(0, upstreamActive - 1);
  const next = upstreamQueue.shift();
  if (next) next();
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function tts(text, guide, lang, {stream=false, signal=null}={}){
  // Audio tags such as "[excited]" are kept for v3/v4 and dropped elsewhere.
  text=SPEECH.clean(text);
  await loadVoices(lang);
  const v=chosen[lang][guide==='Luna'?'Luna':'Milo'];
  const meta=selectionMeta[lang][guide==='Luna'?'Luna':'Milo'];
  const voiceId=v.voice_id;
  // Language is part of the cache key: the same sentence in two languages is
  // two different recordings.
  const settings=VOICE_SETTINGS[guide==='Luna'?'Luna':'Milo'];
  const key=SPEECH.cacheKey(text,lang,guide,voiceId);
  const cached=path.join(CACHE_DIR,`${key}.mp3`);
  if(fs.existsSync(cached)) return {buf:fs.readFileSync(cached),voice:v,meta,cached:true};
  // Logged with the text so a line the warm-up missed can be found and recorded.
  if(CACHE_ONLY){ const e=new Error(`not in cache: ${lang}/${guide} "${text.slice(0,120)}"`); e.name='CacheMiss'; throw e; }
  if(dailyBudgetLeft()<text.length){ const e=new Error('daily TTS budget spent'); e.name='BudgetError'; throw e; }
  dailySpend(text.length);

  const body=JSON.stringify({
    text, model_id:MODEL,
    // language_code is documented only for the flash/turbo models; the native
    // voice per language carries the accent on multilingual_v2 and v3.
    ...(/flash|turbo|v4/.test(MODEL) ? { language_code: lang } : {}),
    voice_settings: settings,
    // A bare answer letter is recorded with the alphabet around it (speech-config.js).
    ...(SPEECH.letterContext(text, lang) || {})
  });

  // Streaming asks for the same audio, but ElevenLabs starts sending it while
  // it is still being made: the first sound reaches the child in a fraction of
  // the time the whole clip takes. The bytes are collected on the way past and
  // written to the cache, so the second time the line is instant either way.
  const endpoint=`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}${stream?'/stream':''}`;
  let handedOff=false;   // a streaming body keeps the upstream slot until it ends
  await acquireUpstream();
  try{
    let r, attempt=0;
    for(;;){
      r=await fetch(endpoint,{
        method:'POST',
        // A streamed answer stays open while the audio plays out, so it gets a
        // longer leash; either way the client's own signal can cut it short.
        signal:signal?AbortSignal.any([signal,AbortSignal.timeout(UPSTREAM_TIMEOUT_MS*4)]):AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
        headers:{'xi-api-key':API_KEY,'Content-Type':'application/json','Accept':'audio/mpeg'},
        body
      });
      if(r.status!==429 || attempt>=3) break;
      attempt++;
      await sleep(350*attempt);
    }
    if(!r.ok){
      const detail=await r.text().catch(()=>String(r.status));
      throw new Error(`ElevenLabs TTS ${r.status}: ${detail.slice(0,260)}`);
    }
    if(stream&&r.body){
      // The caller pipes this, calls save() once the last chunk is through and
      // done() whatever happens, which frees the upstream slot.
      handedOff=true;
      return {body:r.body,voice:v,meta,save:buf=>{try{fs.writeFileSync(cached,buf)}catch(e){}},done:releaseUpstream};
    }
    const buf=Buffer.from(await r.arrayBuffer());
    fs.writeFileSync(cached,buf);
    return {buf,voice:v,meta};
  }finally{
    if(!handedOff) releaseUpstream();
  }
}

const server=http.createServer(async(req,res)=>{
  try{
    // 0.0.0.0 is not a host a URL can be built on, and a path like "//" is not
    // a path at all — both used to come out as a 500 instead of a plain 404.
    let url;
    try{ url=new URL(req.url,`http://127.0.0.1:${PORT}`) }
    catch(e){ res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'}); return res.end('Not found') }
    if(url.pathname==='/api/voice-status'){
      if(!API_KEY)return json(res,200,{mode:'not-configured'});
      try{
        const lang=LANGS.has(url.searchParams.get('lang'))?url.searchParams.get('lang'):'nl';
        await loadVoices(lang);
        res.writeHead(200,{'Content-Type':'application/json; charset=utf-8',...corsHeaders(req)});
        return res.end(JSON.stringify({mode:'elevenlabs',lang,milo:selectionMeta[lang].Milo,luna:selectionMeta[lang].Luna,model:MODEL}));
      }catch(e){console.error('Kwizillo voice-status:',e?.message||e);return json(res,200,{mode:'error'});}
    }
    if(url.pathname.startsWith('/api/')&&req.method==='OPTIONS'){
      res.writeHead(204,{...corsHeaders(req),'Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Access-Control-Max-Age':'86400'});
      return res.end();
    }
    // GET /api/tts?text=…&voice=…&lang=… — the line as a plain audio URL, sent
    // while it is still being made. An <audio> element can start playing on the
    // first chunk, which is what makes the guide answer at once instead of
    // after a round trip. POST still returns the whole clip in one piece, for
    // the lines the app fetches ahead of time.
    if(url.pathname==='/api/tts'&&req.method==='GET'){
      if(!originAllowed(req))return json(res,403,{error:'Spraak is alleen beschikbaar in de app'});
      if(rateLimited(req))return json(res,429,{error:'Te veel spraakverzoeken'});
      if(!API_KEY)return json(res,503,{error:'Spraak is niet geconfigureerd'});
      const text=String(url.searchParams.get('text')||'').trim().slice(0,2500);
      const voice=url.searchParams.get('voice')==='Luna'?'Luna':'Milo';
      const lang=LANGS.has(url.searchParams.get('lang'))?url.searchParams.get('lang'):'nl';
      if(!text)return json(res,400,{error:'Missing text'});
      // The child taps away, the page closes, the phone locks: whatever ends the
      // connection also ends the generation and frees the upstream slot. Before
      // this, a cancelled stream left the writer waiting for a drain that would
      // never come, and after a handful of them the proxy stopped answering.
      const gone=new AbortController();
      res.on('close',()=>gone.abort());
      try{
        const out=await tts(text,voice,lang,{stream:true,signal:gone.signal});
        const head={'Content-Type':'audio/mpeg','Cache-Control':'public, max-age=31536000','X-Kwizillo-Voice':out.meta?.name||voice,'X-Kwizillo-Language':lang,...corsHeaders(req)};
        if(out.cached){ rateRefund(req); res.writeHead(200,{...head,'Content-Length':out.buf.length}); return res.end(out.buf) }
        // Nothing may sit in a buffer on the way out: the point of this route
        // is that the first chunk of audio reaches the child at once.
        try{ req.socket.setNoDelay(true) }catch(e){}
        res.writeHead(200,head);
        res.flushHeaders?.();
        const chunks=[];
        let whole=true;
        try{
          for await (const chunk of out.body){
            if(res.writableEnded||res.destroyed){ whole=false; break }
            const buf=Buffer.from(chunk);
            chunks.push(buf);
            if(!res.write(buf)) await new Promise(r=>{
              const go=()=>{res.off('drain',go);res.off('close',go);res.off('error',go);r()};
              res.once('drain',go);res.once('close',go);res.once('error',go);
            });
          }
          // Only a clip that arrived in full goes into the cache: half a
          // sentence must never be replayed as the whole line.
          if(whole&&!res.destroyed) out.save(Buffer.concat(chunks));
        }catch(e){
          if(e?.name!=='AbortError'&&e?.name!=='TimeoutError')console.error('Kwizillo TTS stream:',e?.message||e);
        }finally{ out.done?.(); res.end() }
        return;
      }catch(e){
        console.error('Kwizillo TTS stream:',e?.message||e);
        if(res.headersSent)return res.end();
        const timeout=e?.name==='TimeoutError'||e?.name==='AbortError';
        if(e?.name==='BudgetError')return json(res,503,{error:'Spraak is tijdelijk niet beschikbaar'});
        if(e?.name==='CacheMiss')return json(res,404,{error:'Deze zin is niet opgenomen'});
        return json(res,timeout?504:502,{error:timeout?'Spraak duurde te lang':'Spraak is tijdelijk niet beschikbaar'});
      }
    }
    if(url.pathname==='/api/tts'&&req.method==='POST'){
      // Abuse checks first, so they hold whether or not a key is configured.
      if(!originAllowed(req))return json(res,403,{error:'Spraak is alleen beschikbaar in de app'});
      if(rateLimited(req))return json(res,429,{error:'Te veel spraakverzoeken'});
      if(!API_KEY)return json(res,503,{error:'Spraak is niet geconfigureerd'});
      let raw='',aborted=false;
      req.on('data',d=>{raw+=d;if(raw.length>MAX_BODY_BYTES){aborted=true;req.destroy()}});
      return req.on('end',async()=>{
        if(aborted)return;
        try{
          let body;
          try{ body=JSON.parse(raw||'{}') }catch{ return json(res,400,{error:'Ongeldig verzoek'}) }
          const text=String(body.text||'').trim().slice(0,2500);
          const voice=body.voice==='Luna'?'Luna':'Milo';
          const lang=LANGS.has(body.lang)?body.lang:'nl';
          if(!text)return json(res,400,{error:'Missing text'});
          const out=await tts(text,voice,lang);
          if(out.cached) rateRefund(req);
          res.writeHead(200,{'Content-Type':'audio/mpeg','Cache-Control':'public, max-age=31536000','X-Kwizillo-Voice':out.meta?.name||voice,'X-Kwizillo-Language':lang,'X-Kwizillo-Cache':out.cached?'hit':'miss',...corsHeaders(req)});
          res.end(out.buf);
        }catch(e){
          // Upstream detail stays in the server log; the client gets a generic message.
          console.error('Kwizillo TTS:',e?.message||e);
          const timeout=e?.name==='TimeoutError'||e?.name==='AbortError';
          if(e?.name==='BudgetError')return json(res,503,{error:'Spraak is tijdelijk niet beschikbaar'});
          if(e?.name==='CacheMiss')return json(res,404,{error:'Deze zin is niet opgenomen'});
          json(res,timeout?504:502,{error:timeout?'Spraak duurde te lang':'Spraak is tijdelijk niet beschikbaar'});
        }
      });
    }
    if(process.env.LOG_REQUESTS && /intro|\/api\//.test(url.pathname)){
      const range=req.headers.range||'-';
      res.once('finish',()=>console.log(`[req] ${req.method} ${url.pathname} range=${range} -> ${res.statusCode} ua=${(req.headers['user-agent']||'').slice(0,60)}`));
    }
    const target=resolveStatic(url.pathname);
    if(!target){res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});return res.end('Not found');}
    fs.stat(target,(err,st)=>{
      if(err||!st.isFile()){res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});return res.end('Not found');}
      const type=mime[path.extname(target).toLowerCase()]||'application/octet-stream';
      // Artwork and audio are immutable per build and heavy; let the phone keep
      // them. Code and HTML stay revalidated so a refresh picks up changes.
      // paintings, audio and fonts may be cached for a day; code, styles and manifests under assets/ (the mini-games) must always revalidate, or a phone keeps yesterday's game
      const cache=/^\/assets\//.test(url.pathname)&&!/\.(js|mjs|css|json)$/i.test(url.pathname)?'public, max-age=86400':'no-cache';
      // Byte ranges: Safari (and therefore every iPhone) refuses to play a
      // <video> from a server that cannot answer a Range request, which made the
      // intro fail instantly and drop the player straight onto Home.
      const range=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range||'');
      if(range&&(range[1]||range[2])){
        let start=range[1]?Number(range[1]):Math.max(0,st.size-Number(range[2]));
        let end=range[1]&&range[2]?Math.min(Number(range[2]),st.size-1):st.size-1;
        if(!Number.isFinite(start)||!Number.isFinite(end)||start>end||start>=st.size){
          res.writeHead(416,{'Content-Range':`bytes */${st.size}`});return res.end();
        }
        res.writeHead(206,{'Content-Type':type,'Cache-Control':cache,'Accept-Ranges':'bytes','Content-Range':`bytes ${start}-${end}/${st.size}`,'Content-Length':end-start+1});
        if(req.method==='HEAD') return res.end();
        return fs.createReadStream(target,{start,end}).pipe(res);
      }
      res.writeHead(200,{'Content-Type':type,'Cache-Control':cache,'Accept-Ranges':'bytes','Content-Length':st.size});
      if(req.method==='HEAD') return res.end();
      fs.createReadStream(target).pipe(res);
    });
  }catch(e){console.error('Kwizillo server:',e);json(res,500,{error:'Serverfout'});}
});
server.listen(PORT,HOST,async()=>{
  console.log(`\nKwizillo runs on http://${HOST==='0.0.0.0'?'127.0.0.1':HOST}:${PORT}`);
  if(HOST==='0.0.0.0'){
    const nets=Object.values(require('os').networkInterfaces()).flat().filter(n=>n&&n.family==='IPv4'&&!n.internal);
    for(const n of nets) console.log(`On your phone (same Wi-Fi): http://${n.address}:${PORT}`);
    console.log('Open to the local network. Stop with Ctrl+C when you are done testing.');
  }
  console.log(API_KEY?'ElevenLabs: enabled — picking a native voice per language':'ElevenLabs: not configured (use ./start.command)');
  // Nine languages times two guides is eighteen lookups; warming them all in
  // series delayed the first quiz. Languages whose choice is already saved are
  // warmed (that is a file read), the rest are resolved on their first request.
  if(API_KEY){
    const saved=readSavedSelection()||{};
    const warm=[...LANGS].filter(l=>saved[l]?.Milo&&saved[l]?.Luna);
    for(const lang of (warm.length?warm:['nl'])){try{await loadVoices(lang)}catch(e){console.log(`Voice selection failed for ${lang}:`,e.message)}}
    const rest=[...LANGS].filter(l=>!warm.includes(l));
    if(rest.length) console.log(`Voices for ${rest.join(', ')} are picked on the first line spoken in that language.`);
  }
  console.log('Stop: Ctrl+C\n');
});
