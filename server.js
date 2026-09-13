const http = require('http');
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
const HOST = '127.0.0.1';
const API_KEY = process.env.ELEVENLABS_API_KEY || '';
const MODEL = process.env.ELEVENLABS_MODEL || 'eleven_multilingual_v2';
const CACHE_DIR = path.join(ROOT, '.tts-cache');
const SELECTION_FILE = path.join(ROOT, '.voice-selection-v35.json');
fs.mkdirSync(CACHE_DIR, { recursive: true });

let voiceCache = null;
let chosen = {};        // { nl: {Milo, Luna}, en: {Milo, Luna} }
let selectionMeta = {};  // same shape, with provenance for the voice-status route

const UPSTREAM_TIMEOUT_MS = Number(process.env.TTS_TIMEOUT_MS || 15000);
const MAX_BODY_BYTES = 8 * 1024;
const RATE_WINDOW_MS = 60000;
const RATE_MAX = Number(process.env.TTS_RATE_LIMIT || 60);
const LANGS = new Set(['nl','en']);
const hits = new Map();

// Coarse per-client cap so an open proxy cannot burn ElevenLabs credits.
// This is a development safeguard; production needs a real gateway plus
// validation that the requested text actually comes from the question bank.
function rateLimited(req){
  const key = req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const seen = (hits.get(key) || []).filter(t => now - t < RATE_WINDOW_MS);
  seen.push(now);
  hits.set(key, seen);
  if (hits.size > 1000) for (const [k, v] of hits) if (!v.some(t => now - t < RATE_WINDOW_MS)) hits.delete(k);
  return seen.length > RATE_MAX;
}

const mime = {
  '.html':'text/html; charset=utf-8', '.js':'application/javascript; charset=utf-8', '.css':'text/css; charset=utf-8',
  '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.svg':'image/svg+xml', '.mp4':'video/mp4', '.mp3':'audio/mpeg',
  '.wav':'audio/wav', '.ico':'image/x-icon'
};

// Serving is allowlist-based: anything not explicitly permitted is a 404.
// Path traversal was already blocked, but dotfiles were not — `.git/config`,
// `.voice-selection-*.json` and a future `.env` holding the ElevenLabs key were
// all readable over the network.
const ROOT_DENY = new Set(['server.js', 'playwright.config.js', 'package.json', 'package-lock.json']);
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
function scoreCurrentVoice(v, wanted){
  const labels=v.labels||{};
  const hay=[v.name,v.description,...Object.values(labels)].filter(Boolean).join(' ').toLowerCase();
  let s=0;
  if(norm(labels.gender)===wanted) s+=110;
  if(/young|youth|jong/.test(norm(labels.age)+' '+hay)) s+=80;
  if(/friendly|warm|cheer|conversational|story|narrat|clear|calm|pleasant|gentle|youthful|bright/.test(hay)) s+=35;
  if(/old|elder|deep|gravel|intense|dramatic|villain|mature/.test(hay)) s-=45;
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

const LANG_RULES = {
  nl: {
    label:'Netherlands Dutch',
    matches:v => languageOf(v)==='nl' && !isFlemish(v) && !NON_DUTCH_ACCENTS.test(accentOf(v)),
    reject:v => isFlemish(v) || NON_DUTCH_ACCENTS.test(accentOf(v)),
    accentBonus:v => /^(standard|nl-nl|netherlands|dutch)$/.test(accentOf(v)) ? 80 : 0
  },
  en: {
    label:'US English',
    matches:v => languageOf(v)==='en',
    reject:v => languageOf(v) && languageOf(v)!=='en',
    accentBonus:v => /american|en-us/.test(accentOf(v)) ? 80 : 0
  }
};
const langRule = lang => LANG_RULES[lang] || LANG_RULES.nl;

// A curated Kwizillo voice is named after its language ("Kwizillo Luna NL-NL v20").
// When labels tie, the name that agrees with the requested language wins and a
// name that names the other language loses; that keeps a mislabelled leftover from
// outranking the voice that was actually reviewed for this language.
function nameLanguageBias(v, lang){
  const name=norm(v.name);
  if(!name.startsWith('kwizillo')) return 0;
  const saysNl=/\bnl(-nl)?\b/.test(name), saysEn=/\ben(-us|-gb)?\b/.test(name);
  if(lang==='nl') return saysNl?50:saysEn?-50:0;
  if(lang==='en') return saysEn?50:saysNl?-50:0;
  return 0;
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

  // 1. Pinned in .env. Always wins; this is how a reviewed voice is locked in.
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
const VOICE_SETTINGS = {
  Milo: { stability:0.42, similarity_boost:0.78, style:0.3,  use_speaker_boost:true, speed:Number(process.env.MILO_SPEED||0.88) },
  Luna: { stability:0.38, similarity_boost:0.8,  style:0.46, use_speaker_boost:true, speed:Number(process.env.LUNA_SPEED||1.0) }
};

async function tts(text, guide, lang){
  await loadVoices(lang);
  const v=chosen[lang][guide==='Luna'?'Luna':'Milo'];
  const meta=selectionMeta[lang][guide==='Luna'?'Luna':'Milo'];
  const voiceId=v.voice_id;
  // Language is part of the cache key: the same sentence in two languages is
  // two different recordings.
  const settings=VOICE_SETTINGS[guide==='Luna'?'Luna':'Milo'];
  // Voice settings are part of the key: a speed change must not replay old audio.
  const key=crypto.createHash('sha256').update(`${MODEL}|${lang}|${voiceId}|${JSON.stringify(settings)}|${text}`).digest('hex');
  const cached=path.join(CACHE_DIR,`${key}.mp3`);
  if(fs.existsSync(cached)) return {buf:fs.readFileSync(cached),voice:v,meta};
  const r=await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`,{
    method:'POST',
    signal:AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    headers:{'xi-api-key':API_KEY,'Content-Type':'application/json','Accept':'audio/mpeg'},
    body:JSON.stringify({
      text, model_id:MODEL,
      // language_code is not supported by multilingual_v2 (docs: "This parameter
      // is not supported for multilingual_v2 models"); the native voice per
      // language carries the accent. Sent only for models that honour it.
      ...(/multilingual_v2/.test(MODEL) ? {} : { language_code: lang }),
      voice_settings: settings
    })
  });
  if(!r.ok){
    const detail=await r.text().catch(()=>String(r.status));
    throw new Error(`ElevenLabs TTS ${r.status}: ${detail.slice(0,260)}`);
  }
  const buf=Buffer.from(await r.arrayBuffer());
  fs.writeFileSync(cached,buf);
  return {buf,voice:v,meta};
}

const server=http.createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,`http://${HOST}:${PORT}`);
    if(url.pathname==='/api/voice-status'){
      if(!API_KEY)return json(res,200,{mode:'not-configured'});
      try{
        const lang=LANGS.has(url.searchParams.get('lang'))?url.searchParams.get('lang'):'nl';
        await loadVoices(lang);
        return json(res,200,{mode:'elevenlabs',lang,milo:selectionMeta[lang].Milo,luna:selectionMeta[lang].Luna,model:MODEL});
      }catch(e){console.error('Kwizillo voice-status:',e?.message||e);return json(res,200,{mode:'error'});}
    }
    if(url.pathname==='/api/tts'&&req.method==='POST'){
      if(!API_KEY)return json(res,503,{error:'Spraak is niet geconfigureerd'});
      if(rateLimited(req))return json(res,429,{error:'Te veel spraakverzoeken'});
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
          res.writeHead(200,{'Content-Type':'audio/mpeg','Cache-Control':'public, max-age=31536000','X-Kwizillo-Voice':out.meta?.name||voice,'X-Kwizillo-Language':lang});
          res.end(out.buf);
        }catch(e){
          // Upstream detail stays in the server log; the client gets a generic message.
          console.error('Kwizillo TTS:',e?.message||e);
          const timeout=e?.name==='TimeoutError'||e?.name==='AbortError';
          json(res,timeout?504:502,{error:timeout?'Spraak duurde te lang':'Spraak is tijdelijk niet beschikbaar'});
        }
      });
    }
    const target=resolveStatic(url.pathname);
    if(!target){res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});return res.end('Not found');}
    fs.stat(target,(err,st)=>{
      if(err||!st.isFile()){res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});return res.end('Not found');}
      res.writeHead(200,{'Content-Type':mime[path.extname(target).toLowerCase()]||'application/octet-stream','Cache-Control':'no-cache'});
      fs.createReadStream(target).pipe(res);
    });
  }catch(e){console.error('Kwizillo server:',e);json(res,500,{error:'Serverfout'});}
});
server.listen(PORT,HOST,async()=>{
  console.log(`\nKwizillo runs on http://${HOST}:${PORT}`);
  console.log(API_KEY?'ElevenLabs: enabled — picking a native voice per language':'ElevenLabs: not configured (use ./start.command)');
  if(API_KEY){for(const lang of LANGS){try{await loadVoices(lang)}catch(e){console.log(`Voice selection failed for ${lang}:`,e.message)}}}
  console.log('Stop: Ctrl+C\n');
});
