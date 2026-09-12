const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 8080);
const HOST = '127.0.0.1';
const API_KEY = process.env.ELEVENLABS_API_KEY || '';
const MODEL = process.env.ELEVENLABS_MODEL || 'eleven_multilingual_v2';
const CACHE_DIR = path.join(ROOT, '.tts-cache');
const SELECTION_FILE = path.join(ROOT, '.voice-selection-v35.json');
fs.mkdirSync(CACHE_DIR, { recursive: true });

let voiceCache = null;
let chosen = { Milo: null, Luna: null };
let selectionMeta = { Milo:null, Luna:null };

const mime = {
  '.html':'text/html; charset=utf-8', '.js':'application/javascript; charset=utf-8', '.css':'text/css; charset=utf-8',
  '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.svg':'image/svg+xml', '.mp4':'video/mp4', '.mp3':'audio/mpeg',
  '.wav':'audio/wav', '.json':'application/json; charset=utf-8', '.ico':'image/x-icon'
};

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
function isDutchVoice(v){
  const labels = v.labels || {};
  const verified = Array.isArray(v.verified_languages) ? v.verified_languages : [];
  return norm(v.language)==='nl' || norm(labels.language)==='nl' || verified.some(x=>norm(x.language)==='nl' || norm(x.locale).startsWith('nl')) || /dutch|nederlands|netherlands|nl-nl/.test([v.name,v.description,v.accent,...Object.values(labels)].filter(Boolean).join(' ').toLowerCase());
}
function scoreCurrentVoice(v, wanted){
  const labels=v.labels||{};
  const hay=[v.name,v.description,...Object.values(labels)].filter(Boolean).join(' ').toLowerCase();
  let s=0;
  if(isDutchVoice(v)) s+=220;
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
  if(isDutchVoice(v)) s+=260;
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
async function listDutchShared(wanted){
  const gender=wanted==='male'?'male':'female';
  const candidates=[];
  const queries=[
    {language:'nl',gender,age:'young',category:'professional'},
    {language:'nl',gender,age:'young',category:'high_quality'},
    {language:'nl',gender,category:'professional'},
    {language:'nl',gender,category:'high_quality'},
    {language:'nl',gender}
  ];
  for(const q of queries){
    const u=new URL('https://api.elevenlabs.io/v1/shared-voices');
    u.searchParams.set('page_size','100');
    u.searchParams.set('sort','usage_character_count_1y');
    u.searchParams.set('include_custom_rates','false');
    u.searchParams.set('include_live_moderated','false');
    Object.entries(q).forEach(([k,v])=>u.searchParams.set(k,v));
    try{
      const data=await fetchJson(u.toString(),{headers:API_KEY?{'xi-api-key':API_KEY}:{}});
      for(const v of (data.voices||[])) if(!candidates.some(x=>x.voice_id===v.voice_id)) candidates.push(v);
      if(candidates.length>=8) break;
    }catch(e){}
  }
  return candidates.sort((a,b)=>scoreSharedVoice(b,wanted)-scoreSharedVoice(a,wanted));
}
function readSavedSelection(){
  try{return JSON.parse(fs.readFileSync(SELECTION_FILE,'utf8'))}catch{return {}}
}
function saveSelection(){
  try{fs.writeFileSync(SELECTION_FILE,JSON.stringify({Milo:selectionMeta.Milo,Luna:selectionMeta.Luna},null,2))}catch(e){}
}
async function addSharedVoice(shared, alias){
  const endpoint=`https://api.elevenlabs.io/v1/voices/add/${encodeURIComponent(shared.public_owner_id)}/${encodeURIComponent(shared.voice_id)}`;
  const data=await fetchJson(endpoint,{
    method:'POST',headers:{'xi-api-key':API_KEY,'Content-Type':'application/json'},
    body:JSON.stringify({new_name:alias,bookmarked:true})
  });
  return data.voice_id || shared.voice_id;
}
async function ensureGuideVoice(guide,wanted){
  const explicit=process.env[guide==='Milo'?'MILO_VOICE_ID':'LUNA_VOICE_ID'];
  const current=await loadCurrentVoices();
  if(explicit){
    const found=current.find(v=>v.voice_id===explicit)||{voice_id:explicit,name:`${guide} custom`,labels:{}};
    return {voice:found,meta:{voice_id:found.voice_id,name:found.name,source:'environment',native_nl:isDutchVoice(found)}};
  }
  const saved=readSavedSelection()[guide];
  if(saved?.voice_id){
    const found=current.find(v=>v.voice_id===saved.voice_id);
    if(found && isDutchVoice(found)) return {voice:found,meta:{...saved,name:found.name||saved.name,source:'saved-native-dutch'}};
  }
  const alias=`Kwizillo ${guide} NL jong v35`;
  const existing=current.find(v=>norm(v.name)===norm(alias));
  if(existing) return {voice:existing,meta:{voice_id:existing.voice_id,name:existing.name,source:'library-native-dutch',native_nl:isDutchVoice(existing),age:existing.labels?.age,gender:existing.labels?.gender}};

  const shared=await listDutchShared(wanted);
  for(const candidate of shared.slice(0,12)){
    const already=current.find(v=>v.voice_id===candidate.voice_id);
    if(already){
      return {voice:already,meta:{voice_id:already.voice_id,name:already.name||candidate.name,source:'already-saved-native-dutch',native_nl:true,age:candidate.age||already.labels?.age,gender:candidate.gender||already.labels?.gender,accent:candidate.accent||already.labels?.accent,preview_url:candidate.preview_url}};
    }
    try{
      const voiceId=await addSharedVoice(candidate,alias);
      voiceCache=null;
      const voice={voice_id:voiceId,name:candidate.name||alias,labels:{gender:candidate.gender,age:candidate.age,language:candidate.language,accent:candidate.accent},description:candidate.description,verified_languages:candidate.verified_languages};
      return {voice,meta:{voice_id:voiceId,name:candidate.name||alias,source:'shared-native-dutch',native_nl:true,age:candidate.age,gender:candidate.gender,accent:candidate.accent,preview_url:candidate.preview_url}};
    }catch(e){
      // If the voice is already present under another name, it may still appear in current voices on the next iteration.
    }
  }
  const dutch=current.filter(isDutchVoice).sort((a,b)=>scoreCurrentVoice(b,wanted)-scoreCurrentVoice(a,wanted));
  if(dutch.length){
    const v=dutch[0];
    return {voice:v,meta:{voice_id:v.voice_id,name:v.name,source:'existing-native-dutch',native_nl:true,age:v.labels?.age,gender:v.labels?.gender}};
  }
  const fallback=[...current].sort((a,b)=>scoreCurrentVoice(b,wanted)-scoreCurrentVoice(a,wanted))[0];
  if(!fallback) throw new Error('Geen ElevenLabs stemmen gevonden');
  return {voice:fallback,meta:{voice_id:fallback.voice_id,name:fallback.name,source:'fallback-non-native',native_nl:false,age:fallback.labels?.age,gender:fallback.labels?.gender}};
}
async function loadVoices(){
  if(!API_KEY) throw new Error('ELEVENLABS_API_KEY ontbreekt');
  if(chosen.Milo && chosen.Luna) return;
  const [m,l]=await Promise.all([ensureGuideVoice('Milo','male'),ensureGuideVoice('Luna','female')]);
  chosen.Milo=m.voice; chosen.Luna=l.voice; selectionMeta.Milo=m.meta; selectionMeta.Luna=l.meta; saveSelection();
  console.log(`Milo stem: ${selectionMeta.Milo.name} (${selectionMeta.Milo.age||'leeftijd onbekend'}, ${selectionMeta.Milo.native_nl?'native NL':'niet native NL'})`);
  console.log(`Luna stem: ${selectionMeta.Luna.name} (${selectionMeta.Luna.age||'leeftijd onbekend'}, ${selectionMeta.Luna.native_nl?'native NL':'niet native NL'})`);
}
async function tts(text, guide){
  await loadVoices();
  const v=guide==='Luna'?chosen.Luna:chosen.Milo;
  const meta=guide==='Luna'?selectionMeta.Luna:selectionMeta.Milo;
  const voiceId=v.voice_id;
  const key=crypto.createHash('sha256').update(`${MODEL}|nl|${voiceId}|${text}`).digest('hex');
  const cached=path.join(CACHE_DIR,`${key}.mp3`);
  if(fs.existsSync(cached)) return {buf:fs.readFileSync(cached),voice:v,meta};
  const r=await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`,{
    method:'POST',
    headers:{'xi-api-key':API_KEY,'Content-Type':'application/json','Accept':'audio/mpeg'},
    body:JSON.stringify({
      text, model_id:MODEL, language_code:'nl',
      voice_settings: guide==='Luna' ? {stability:0.38,similarity_boost:0.8,style:0.46,use_speaker_boost:true} : {stability:0.42,similarity_boost:0.78,style:0.3,use_speaker_boost:true}
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
        await loadVoices();
        return json(res,200,{mode:'elevenlabs-native-nl',milo:selectionMeta.Milo,luna:selectionMeta.Luna,model:MODEL});
      }catch(e){return json(res,200,{mode:'error',message:e.message});}
    }
    if(url.pathname==='/api/tts'&&req.method==='POST'){
      if(!API_KEY)return json(res,503,{error:'ELEVENLABS_API_KEY ontbreekt'});
      let raw='';req.on('data',d=>{raw+=d;if(raw.length>100000)req.destroy()});
      return req.on('end',async()=>{
        try{
          const body=JSON.parse(raw||'{}');
          const text=String(body.text||'').trim().slice(0,2500);
          const voice=body.voice==='Luna'?'Luna':'Milo';
          if(!text)return json(res,400,{error:'Tekst ontbreekt'});
          const out=await tts(text,voice);
          res.writeHead(200,{'Content-Type':'audio/mpeg','Cache-Control':'public, max-age=31536000','X-Kwizillo-Voice':out.meta?.name||voice,'X-Kwizillo-Language':'nl'});
          res.end(out.buf);
        }catch(e){json(res,500,{error:e.message});}
      });
    }
    let rel=decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname).replace(/^\/+/, '');
    const target=path.resolve(ROOT,rel);
    if(!target.startsWith(path.resolve(ROOT)))return json(res,403,{error:'Forbidden'});
    fs.stat(target,(err,st)=>{
      if(err||!st.isFile()){res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});return res.end('Not found');}
      res.writeHead(200,{'Content-Type':mime[path.extname(target).toLowerCase()]||'application/octet-stream','Cache-Control':'no-cache'});
      fs.createReadStream(target).pipe(res);
    });
  }catch(e){json(res,500,{error:e.message});}
});
server.listen(PORT,HOST,async()=>{
  console.log(`\nKwizillo V3.6 draait op http://${HOST}:${PORT}`);
  console.log(API_KEY?'ElevenLabs: ingeschakeld — jonge native Nederlandse stemmen worden gekozen':'ElevenLabs: NIET ingesteld (gebruik ./start.command)');
  if(API_KEY){try{await loadVoices();}catch(e){console.log('Stemselectie fout:',e.message);}}
  console.log('Stoppen: Ctrl+C\n');
});
