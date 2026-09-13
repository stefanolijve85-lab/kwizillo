(()=>{
  const K=window.KWIZILLO_M1=window.KWIZILLO_M1||{};
  K.app=document.getElementById('app');K.core=window.KWIZILLO_CORE;K.config=window.KWIZILLO_CONFIG||{};
  // The active question bank follows the selected language.
  K.banks={nl:window.KWIZILLO_QUESTIONS_NL||[],en:window.KWIZILLO_QUESTIONS_EN||[]};
  K.useBank=()=>{K.questions=K.banks[K.state.language]||K.banks.nl||[];return K.questions};
  K.useBank();
  K.TOPIC_KEYS={ruimte:['zonnestelsel','sterren_planeten','astronauten','raket_avontuur'],geschiedenis:['egyptenaren','ridders_kastelen','romeinen','ontdekkingsreizigers'],wetenschap:['slimme_proefjes','lichaam','uitvindingen','natuur_energie'],mysterie:['raadsels','verborgen_schatten','natuurmysteries','speurtocht'],dieren:['snelle_dieren','baby_dieren','waterdieren','jungle'],aarde:['continenten_landen','weer_klimaat','oceanen_natuur','kaarten_navigatie']};
  const paths={tap:'assets/audio/tap.wav',good:'assets/audio/correct.wav',bad:'assets/audio/wrong.wav',reward:'assets/audio/reward.wav',world:'assets/audio/world.wav',confetti:'assets/audio/confetti.wav',gift:'assets/audio/gift.wav',hint:'assets/audio/hint.wav',swoosh:'assets/audio/swoosh.wav'};const tracks={magical:{id:'magical',icon:'✨',src:'assets/audio/music_magical_loop.wav'},adventure:{id:'adventure',icon:'🧭',src:'assets/audio/music_adventure_loop.wav'},space:{id:'space',icon:'🚀',src:'assets/audio/music_space_loop.wav'},calm:{id:'calm',icon:'🌙',src:'assets/audio/music_calm_loop.wav'}};const preload={};Object.entries(paths).forEach(([k,s])=>{const a=new Audio(s);a.preload='auto';preload[k]=a});let ctx=null,master=null,src=null,srcGain=null,currentId=null,ducked=false;let stingLive=false;const buffers=new Map();
  function ensure(){if(!ctx){const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;ctx=new C();master=ctx.createGain();master.connect(ctx.destination);master.gain.value=0}return ctx}function wanted(){return K.state.musicOn===false?0:Math.max(0,Math.min(1,Number(K.state.musicVolume??.24)))*(ducked?.34:1)}function ramp(sec=.18){if(!ctx||!master)return;const n=ctx.currentTime;master.gain.cancelScheduledValues(n);master.gain.setValueAtTime(master.gain.value,n);master.gain.linearRampToValueAtTime(wanted(),n+sec)}async function load(id){const t=tracks[id]||tracks.magical;if(buffers.has(t.id))return buffers.get(t.id);const c=ensure();if(!c)return null;const r=await fetch(t.src);const b=await c.decodeAudioData((await r.arrayBuffer()).slice(0));buffers.set(t.id,b);return b}async function start(id=K.state.musicTrack||'magical',cross=.35){const c=ensure();if(!c)return;if(c.state==='suspended')await c.resume().catch(()=>{});const t=tracks[id]||tracks.magical,b=await load(t.id),n=c.currentTime,s=c.createBufferSource(),g=c.createGain();s.buffer=b;s.loop=true;s.loopStart=0;s.loopEnd=b.duration;g.gain.setValueAtTime(0,n);s.connect(g);g.connect(master);s.start(n);g.gain.linearRampToValueAtTime(1,n+cross);const os=src,og=srcGain;src=s;srcGain=g;currentId=t.id;K.state.musicTrack=t.id;K.save();if(os&&og){try{og.gain.linearRampToValueAtTime(0,n+cross);os.stop(n+cross+.05)}catch(e){}}ramp(.15)}async function unlock(){const c=ensure();if(!c)return;if(c.state==='suspended')await c.resume().catch(()=>{});if(K.state.musicOn!==false&&!src&&!stingLive)await start().catch(()=>{});else ramp(.1)}function play(kind='tap'){if(K.state.soundOn===false)return;try{const a=(preload[kind]||preload.tap).cloneNode();a.volume=Math.max(0,Math.min(1,Number(K.state.sfxVolume??.72)))*({tap:.42,swoosh:.5,hint:.6}[kind]??.68);a.play().catch(()=>{})}catch(e){}}async function setMusic(on){K.state.musicOn=!!on;K.save();await unlock().catch(()=>{});if(on){if(!src)await start().catch(()=>{});ramp()}else ramp()}function setSfx(on){K.state.soundOn=!!on;K.save();if(on)play('good')}function setSfxVolume(v){K.state.sfxVolume=Math.max(0,Math.min(1,Number(v)));K.save()}function setMusicVolume(v){K.state.musicVolume=Math.max(0,Math.min(1,Number(v)));K.save();ramp(.08)}async function setTrack(id){if(!tracks[id])return;K.state.musicTrack=id;K.save();await unlock();if(K.state.musicOn!==false)await start(id,.45)}function duck(on){ducked=!!on;ramp(on?.1:.25)}
  // A one-shot piece on the music bus (the intro theme). It obeys the music
  // toggle and volume like the loops do, can start mid-way to stay in sync with
  // a video, and returns a handle whose stop() fades it under the next loop.
  async function sting(url,{at=0}={}){const c=ensure();if(!c||c.state!=='running')return null;const key='sting:'+url;let b=buffers.get(key);if(!b){const r=await fetch(url);b=await c.decodeAudioData((await r.arrayBuffer()).slice(0));buffers.set(key,b)}if(c.state!=='running')return null;const n=c.currentTime,s=c.createBufferSource(),g=c.createGain();s.buffer=b;g.gain.value=1;s.connect(g);g.connect(master);s.start(n,Math.max(0,Math.min(at,b.duration-.05)));ramp(.1);let live=true;stingLive=true;s.onended=()=>{live=false;stingLive=false};return{get live(){return live},stop(fade=.45){if(!live)return;live=false;stingLive=false;try{const t=c.currentTime;g.gain.cancelScheduledValues(t);g.gain.setValueAtTime(g.gain.value,t);g.gain.linearRampToValueAtTime(0.0001,t+fade);s.stop(t+fade+.05)}catch(e){}}}}
  document.addEventListener('pointerdown',unlock,{once:true,capture:true});K.audio={tracks,play,unlock,start,sting,setMusic,setSfx,setSfxVolume,setMusicVolume,setTrack,duck,get currentId(){return currentId},get stingLive(){return stingLive}};

  let abort=null,voiceCtx=null,voiceSource=null,voiceUrl=null;const gate=K.core.createCancellationGate();
  function ensureVoiceCtx(){if(!voiceCtx){const C=window.AudioContext||window.webkitAudioContext;if(C)voiceCtx=new C()}return voiceCtx}
  // iOS only lets an AudioContext start inside a user gesture. The voice context
  // used to be created after the speech fetch resolved, outside any gesture, so
  // Safari kept it suspended and the phone stayed silent while the Mac played.
  // Create and resume it on every tap instead; the calls are no-ops once running.
  document.addEventListener('pointerdown',()=>{const c=ensureVoiceCtx();if(c&&c.state==='suspended')c.resume().catch(()=>{})},{capture:true});
  // When the speech backend is absent or unreachable, stop asking for the rest of
  // the session instead of firing a failing request per question. The game stays
  // fully playable without a voice (CLAUDE.md section 16, backend unavailable).
  let speechAvailable=true;
  K.speechAvailable=()=>speechAvailable;
  // A small client-side clip cache. Its purpose is the feedback card: both
  // outcomes of the current question are fetched while the child is still
  // thinking, so the voice starts the moment the card appears instead of after
  // a round trip to the speech service. Keyed by voice and language, so a
  // change of either simply misses.
  const voiceCache=new Map();
  const VOICE_CACHE_MAX=24;
  function voiceKey(text,lang){return `${lang}|${K.state.voice}|${text}`}
  function remember(key,blob){voiceCache.delete(key);voiceCache.set(key,blob);while(voiceCache.size>VOICE_CACHE_MAX)voiceCache.delete(voiceCache.keys().next().value)}
  async function fetchVoiceBlob(text,signal){
    if(!speechAvailable) throw Object.assign(new Error('speech-unavailable'),{name:'AbortError'});
    const lang=K.speechLang?.()||K.state.language||'nl';
    const key=voiceKey(text,lang);
    if(voiceCache.has(key)) return voiceCache.get(key);
    // Digits become words here, at the voice boundary, so "B. 7." is voiced as
    // "B. zeven." and not as English "Bay seven". The screen keeps the digits.
    const spoken=K.core.spellNumbers(text,lang);
    const r=await fetch(K.config.elevenLabsProxyUrl||'/api/tts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:spoken,voice:K.state.voice,lang}),signal});
    if(!r.ok){
      if(r.status===503||r.status===501){speechAvailable=false;console.info('Kwizillo: speech is not configured, continuing without a voice.')}
      throw new Error(`TTS ${r.status}`);
    }
    const blob=await r.blob();
    remember(key,blob);
    return blob;
  }
  // Warm the cache for texts that will be spoken next. Never throws, never
  // plays anything, and is a no-op without a voice.
  K.prefetchSpeech=texts=>{
    if(!speechAvailable||K.state.voice==='Stil') return;
    for(const text of (texts||[]).filter(Boolean)) fetchVoiceBlob(text).catch(()=>{});
  };
  function measureVoiceGain(buffer){let sum=0,count=0;const step=24;for(let ch=0;ch<buffer.numberOfChannels;ch++){const data=buffer.getChannelData(ch);for(let i=0;i<data.length;i+=step){const v=data[i];sum+=v*v;count++}}const rms=Math.sqrt(sum/Math.max(1,count));return Math.max(.7,Math.min(5,.16/Math.max(rms,.02)))}
  async function playVoiceBlob(blob,token){if(!gate.isCurrent(token))return false;const c=ensureVoiceCtx();if(c){if(c.state==='suspended')await c.resume().catch(()=>{});if(!gate.isCurrent(token))return false;const data=await blob.arrayBuffer();if(!gate.isCurrent(token))return false;const buffer=await c.decodeAudioData(data.slice(0));if(!gate.isCurrent(token))return false;return new Promise(resolve=>{const source=c.createBufferSource(),pre=c.createGain(),compressor=c.createDynamicsCompressor(),makeup=c.createGain(),limiter=c.createDynamicsCompressor();voiceSource=source;source.buffer=buffer;pre.gain.value=measureVoiceGain(buffer);compressor.threshold.value=-20;compressor.knee.value=14;compressor.ratio.value=4;compressor.attack.value=.002;compressor.release.value=.14;makeup.gain.value=1;limiter.threshold.value=-4;limiter.knee.value=2;limiter.ratio.value=20;limiter.attack.value=.001;limiter.release.value=.08;source.connect(pre);pre.connect(compressor);compressor.connect(makeup);makeup.connect(limiter);limiter.connect(c.destination);source.onended=()=>{if(voiceSource===source)voiceSource=null;resolve(gate.isCurrent(token))};try{source.start()}catch(e){resolve(false)}})}
    return new Promise(resolve=>{const url=URL.createObjectURL(blob),a=new Audio(url);voiceUrl=url;a.volume=1;a.onended=()=>{URL.revokeObjectURL(url);if(voiceUrl===url)voiceUrl=null;resolve(gate.isCurrent(token))};a.onerror=()=>{URL.revokeObjectURL(url);resolve(false)};a.play().catch(()=>resolve(false))})
  }
  K.stopSpeech=()=>{gate.cancel();K.audio.duck(false);try{abort?.abort()}catch(e){}abort=null;try{if(voiceSource){voiceSource.onended=null;voiceSource.stop();voiceSource.disconnect();voiceSource=null}}catch(e){}if(voiceUrl){try{URL.revokeObjectURL(voiceUrl)}catch(e){}voiceUrl=null}try{speechSynthesis?.cancel()}catch(e){}try{K.clearSpeechHighlight?.()}catch(e){}};
  // Natural pacing per CLAUDE.md section 9: a beat after the question, a shorter
  // one between answers. The wait is cancellable, so a tap still stops speech instantly.
  const GAP={question:520,answer:300,speech:0};
  function pause(ms,token){return ms>0?new Promise(resolve=>{const id=setTimeout(resolve,ms);const check=setInterval(()=>{if(!gate.isCurrent(token)){clearTimeout(id);clearInterval(check);resolve()}},60);setTimeout(()=>clearInterval(check),ms+80)}):Promise.resolve()}
  // One failed segment must not silence the rest of the question: it is logged,
  // skipped, and the sequence carries on with the next answer. Before this, a
  // single upstream 429 on segment B meant the child heard the question and "A"
  // and nothing else.
  K.speakSequence=async(segments,{onSegment,onDone,prefetch}={})=>{segments=(segments||[]).filter(s=>s&&s.text);if(!segments.length||K.state.voice==='Stil')return;K.stopSpeech();const token=gate.begin();abort=new AbortController();const signal=abort.signal;K.audio.duck(true);const requests=segments.map(s=>fetchVoiceBlob(s.text,signal).then(blob=>({ok:true,blob})).catch(error=>({ok:false,error})));if(prefetch?.length)Promise.allSettled(requests).then(()=>{if(gate.isCurrent(token))K.prefetchSpeech(prefetch)});try{for(let i=0;i<segments.length;i++){const result=await requests[i];if(!gate.isCurrent(token))return;if(!result.ok){if(result.error?.name!=='AbortError')console.warn('Kwizillo TTS: segment skipped —',result.error?.message||result.error);continue}try{onSegment?.(segments[i],i)}catch(e){}const finished=await playVoiceBlob(result.blob,token);if(!finished||!gate.isCurrent(token))return;if(i<segments.length-1){await pause(GAP[segments[i].kind]??260,token);if(!gate.isCurrent(token))return}}try{onDone?.()}catch(e){}}catch(e){if(e?.name!=='AbortError'&&gate.isCurrent(token))console.warn('Kwizillo TTS:',e?.message||e)}finally{if(gate.isCurrent(token)){K.audio.duck(false);abort=null}}};
  K.speak=text=>K.speakSequence([{kind:'speech',text}]);

  K.frame=html=>{K.stopSpeech();K.app.innerHTML=`<section class="game-frame ${new URLSearchParams(location.search).has('debug')?'debug':''}">${html}</section>`;return K.app.firstElementChild};K.toast=text=>{const f=K.app.querySelector('.game-frame');if(!f)return;const t=document.createElement('div');t.className='toast';t.textContent=text;f.appendChild(t);setTimeout(()=>t.remove(),2200)};K.sfx=(k='tap')=>K.audio.play(k);
})();