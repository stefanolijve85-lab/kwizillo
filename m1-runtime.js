(()=>{
  const K=window.KWIZILLO_M1=window.KWIZILLO_M1||{};
  K.app=document.getElementById('app');K.core=window.KWIZILLO_CORE;K.config=window.KWIZILLO_CONFIG||{};
  // The active question bank follows the selected language.
  K.banks={nl:window.KWIZILLO_QUESTIONS_NL||[],en:window.KWIZILLO_QUESTIONS_EN||[],pt:window.KWIZILLO_QUESTIONS_PT||[]};
  K.useBank=()=>{K.questions=K.banks[K.state.language]||K.banks.nl||[];return K.questions};
  K.useBank();
  K.TOPIC_KEYS={ruimte:['zonnestelsel','sterren_planeten','astronauten','raket_avontuur'],geschiedenis:['egyptenaren','ridders_kastelen','romeinen','ontdekkingsreizigers'],wetenschap:['slimme_proefjes','lichaam','uitvindingen','natuur_energie'],mysterie:['raadsels','verborgen_schatten','natuurmysteries','speurtocht'],dieren:['snelle_dieren','baby_dieren','waterdieren','jungle'],aarde:['continenten_landen','weer_klimaat','oceanen_natuur','kaarten_navigatie']};
  const paths={fanfare:'assets/audio/fanfare.wav',good:'assets/audio/correct.wav',bad:'assets/audio/wrong.wav',reward:'assets/audio/reward.wav',world:'assets/audio/world.wav',confetti:'assets/audio/confetti.wav',gift:'assets/audio/gift.wav',hint:'assets/audio/hint.wav',swoosh:'assets/audio/swoosh.wav',tick:'assets/audio/tick.wav',tock:'assets/audio/tock.wav'};/* Background music: one loop per world plus the hub and the mini-games. Each file is built by tools/music-loop.cjs: `loop` is the exact loop length and `lead` the run-in before it (the loop window slides over continuous music, so an mp3 decoder's start delay cannot cause a click). Decoded buffers are big (~10 MB per minute), so only the current and previous track stay cached. */const tracks={home:{id:'home',icon:'🏝️',src:'assets/audio/music/home.mp3',loop:61.9276,lead:.6},space:{id:'space',icon:'🚀',src:'assets/audio/music/space.mp3',loop:61.0917,lead:.6},jungle:{id:'jungle',icon:'🐒',src:'assets/audio/music/jungle.mp3',loop:52.3610,lead:.6},earth:{id:'earth',icon:'🌍',src:'assets/audio/music/earth.mp3',loop:47.9956,lead:.6},history:{id:'history',icon:'🏰',src:'assets/audio/music/history.mp3',loop:50.5266,lead:.6},science:{id:'science',icon:'🔬',src:'assets/audio/music/science.mp3',loop:50.5266,lead:.6},mystery:{id:'mystery',icon:'🔮',src:'assets/audio/music/mystery.mp3',loop:62.6707,lead:.6},play:{id:'play',icon:'🎲',src:'assets/audio/music/play.mp3',loop:60.0004,lead:.6}};const LEGACY_TRACKS={magical:'home',adventure:'history',calm:'earth'};function trackFor(id){return tracks[id]||tracks[LEGACY_TRACKS[id]]||tracks.home}const BUFFER_KEEP=2;const preload={};Object.entries(paths).forEach(([k,s])=>{const a=new Audio(s);a.preload='auto';preload[k]=a});let ctx=null,master=null,src=null,srcGain=null,currentId=null,ducked=false;let stingLive=false;const buffers=new Map();
  /* iOS parks the context as "interrupted" (not "suspended") when the app is swiped away or a call comes in; both need resume() */const stalled=c=>!!c&&(c.state==='suspended'||c.state==='interrupted');function ensure(){if(ctx&&ctx.state==='closed'){ctx=null;master=null;src=null;srcGain=null;buffers.clear();sfxBuf.clear()}if(!ctx){const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;ctx=new C();master=ctx.createGain();master.connect(ctx.destination);master.gain.value=0}return ctx}function wanted(){return K.state.musicOn===false?0:Math.max(0,Math.min(1,Number(K.state.musicVolume??.24)))*(ducked?.34:1)}function ramp(sec=.18){if(!ctx||!master)return;const n=ctx.currentTime;master.gain.cancelScheduledValues(n);master.gain.setValueAtTime(master.gain.value,n);master.gain.linearRampToValueAtTime(wanted(),n+sec)}async function load(id){const t=trackFor(id);if(buffers.has(t.id))return buffers.get(t.id);const c=ensure();if(!c)return null;const r=await fetch(t.src);const b=await c.decodeAudioData((await r.arrayBuffer()).slice(0));buffers.set(t.id,b);for(const k of [...buffers.keys()]){if(buffers.size<=BUFFER_KEEP)break;if(k!==t.id&&k!==currentId)buffers.delete(k)}return b}async function start(id=K.state.musicTrack||'home',cross=.35){const c=ensure();if(!c)return;if(stalled(c))await c.resume().catch(()=>{});const t=trackFor(id),b=await load(t.id);if(!b)return;const n=c.currentTime,s=c.createBufferSource(),g=c.createGain();s.buffer=b;s.loop=true;s.playbackRate.value=tempo;s.loopStart=Math.min(t.lead||0,b.duration);s.loopEnd=t.loop?Math.min(b.duration,s.loopStart+t.loop):b.duration;g.gain.setValueAtTime(0,n);s.connect(g);g.connect(master);s.start(n);g.gain.linearRampToValueAtTime(1,n+cross);const os=src,og=srcGain;src=s;srcGain=g;currentId=t.id;K.state.musicTrack=t.id;K.save();if(os&&og){try{og.gain.linearRampToValueAtTime(0,n+cross);os.stop(n+cross+.05)}catch(e){}}ramp(.15)}let primed=false;const SILENCE='data:audio/wav;base64,UklGRmQGAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YUAGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';/* 0.1 s of digital silence: unlocks HTMLAudio on iOS without a single audible sample (the tap sound at 1% was still a faint click on the intro) */function primePlayback(){if(primed)return;primed=true;try{const a=new Audio(SILENCE);a.volume=1;a.muted=false;const p=a.play();if(p&&p.catch)p.catch(()=>{})}catch(e){}}async function unlock(){const c=ensure();if(!c)return;primePlayback();if(stalled(c))await c.resume().catch(()=>{});Object.keys(paths).forEach(k=>sfxBuffer(k));if(K.state.musicOn!==false&&!src&&!stingLive&&!K.audio?.holdMusic)await start().catch(()=>{});else ramp(.1)}const SFX_LEVEL={fanfare:.45,swoosh:.5,hint:.6,tick:.22,tock:.4};const sfxBuf=new Map();
  function sfxBuffer(kind){const c=ensure();if(!c||!paths[kind])return Promise.resolve(null);if(!sfxBuf.has(kind))sfxBuf.set(kind,fetch(paths[kind]).then(r=>r.arrayBuffer()).then(ab=>c.decodeAudioData(ab)).catch(()=>null));return sfxBuf.get(kind)}
  // Effects play through Web Audio so the FX slider works on iOS too (Safari
  // ignores HTMLAudio.volume, which is why the slider used to do nothing on the
  // phone). The plain tap sound is gone for good: a tap makes no noise.
  function play(kind='good'){if(K.state.soundOn===false||kind==='tap'||!paths[kind])return;const vol=Math.max(0,Math.min(1,Number(K.state.sfxVolume??.72)))*(SFX_LEVEL[kind]??.68);if(vol<=0)return;const c=ensure();if(c&&c.state==='running'){sfxBuffer(kind).then(buf=>{if(!buf)return;const src=c.createBufferSource();src.buffer=buf;const g=c.createGain();g.gain.value=vol;src.connect(g);g.connect(c.destination);src.onended=()=>{try{src.disconnect();g.disconnect()}catch(e){}};src.start()});return}try{const a=preload[kind].cloneNode();a.volume=vol;a.play().catch(()=>{})}catch(e){}}async function setMusic(on){K.state.musicOn=!!on;K.save();await unlock().catch(()=>{});if(on){if(!src)await start().catch(()=>{});ramp()}else ramp()}function setSfx(on){K.state.soundOn=!!on;K.save();if(on)play('good')}function setSfxVolume(v){K.state.sfxVolume=Math.max(0,Math.min(1,Number(v)));K.save()}function setMusicVolume(v){K.state.musicVolume=Math.max(0,Math.min(1,Number(v)));K.save();ramp(.08)}function setVoiceVolume(v){K.state.voiceVolume=Math.max(0,Math.min(1,Number(v)));K.save()}async function setTrack(id){const t=trackFor(id);K.state.musicTrack=t.id;K.save();if(K.audio?.holdMusic)return;/* the intro starts the loop itself when it hands over */if(src&&currentId===t.id){ramp(.1);return}await unlock();if(K.state.musicOn!==false&&src&&currentId!==t.id)await start(t.id,.9)}function duck(on){ducked=!!on;ramp(on?.1:.25)}/* tempo: the music speeds up with the runner's turbo and settles back afterwards */let tempo=1;function setTempo(rate=1,sec=.35){tempo=Math.max(.5,Math.min(2,Number(rate)||1));if(!ctx||!src)return;const n=ctx.currentTime;try{src.playbackRate.cancelScheduledValues(n);src.playbackRate.setValueAtTime(src.playbackRate.value,n);src.playbackRate.linearRampToValueAtTime(tempo,n+sec)}catch(e){}}
  // A one-shot piece on the music bus (the intro theme). It obeys the music
  // toggle and volume like the loops do, can start mid-way to stay in sync with
  // a video, and returns a handle whose stop() fades it under the next loop.
  async function sting(url,{at=0,force=false}={}){const c=ensure();if(!c||c.state!=='running')return null;const key='sting:'+url;let b=buffers.get(key);if(!b){const r=await fetch(url);b=await c.decodeAudioData((await r.arrayBuffer()).slice(0));buffers.set(key,b)}if(c.state!=='running')return null;const n=c.currentTime,s=c.createBufferSource(),g=c.createGain();s.buffer=b;/* force: the child asked for this sound explicitly, so it plays even when game music is switched off (own gain, not the muted music bus) */g.gain.value=force&&K.state.musicOn===false?Math.max(.12,Math.min(1,Number(K.state.musicVolume??.24))):1;s.connect(g);g.connect(force&&K.state.musicOn===false?c.destination:master);s.start(n,Math.max(0,Math.min(at,b.duration-.05)));ramp(.1);let live=true;stingLive=true;s.onended=()=>{live=false;stingLive=false};return{get live(){return live},stop(fade=.45){if(!live)return;live=false;stingLive=false;try{const t=c.currentTime;g.gain.cancelScheduledValues(t);g.gain.setValueAtTime(g.gain.value,t);g.gain.linearRampToValueAtTime(0.0001,t+fade);s.stop(t+fade+.05)}catch(e){}}}}
  // iOS counts touchend/click as the activation that lets audio start, not pointerdown; listen to both.
  for(const ev of ['pointerdown','touchend','click']) document.addEventListener(ev,()=>{unlock().catch(()=>{})},{capture:true,passive:true});
  // Coming back after the app was swiped away (or a call, or the lock screen):
  // iOS leaves both contexts "interrupted" and sometimes throws the music
  // context away altogether. Resume them; if the music context is gone, build
  // a new one and start the same track again. Resuming outside a gesture may be
  // refused — then the next tap (the listeners above) finishes the job.
  async function wake(){
    if(document.visibilityState!=='visible')return;
    let c=ensure();if(!c)return;
    if(stalled(c))await c.resume().catch(()=>{});
    // A context that says "running" but whose clock stands still is dead (iOS
    // after a long background): throw it away and start the track afresh.
    if(c.state==='running'){const t0=c.currentTime;await new Promise(r=>setTimeout(r,250));if(c.currentTime===t0){try{c.close()}catch(e){}ctx=null;c=ensure();if(!c)return}}
    if(c.state==='running'){if(K.state.musicOn!==false&&!src&&!stingLive&&!K.audio?.holdMusic)await start(currentId||undefined).catch(()=>{});else ramp(.2)}
    const v=ensureVoiceCtx();if(stalled(v))v.resume().catch(()=>{});
  }
  // Swiped away mid-sentence: the line is dropped rather than resumed later out of context.
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'){try{K.stopSpeech?.()}catch(e){}}else wake().catch(()=>{})});window.addEventListener('pageshow',()=>{wake().catch(()=>{})});window.addEventListener('focus',()=>{wake().catch(()=>{})});
  K.audio={tracks,play,unlock,start,sting,setMusic,setSfx,setSfxVolume,setMusicVolume,setVoiceVolume,setTrack,duck,setTempo,wake,get currentId(){return currentId},get stingLive(){return stingLive}};

  let abort=null,voiceCtx=null,voiceSource=null,voiceUrl=null;const gate=K.core.createCancellationGate();
  function ensureVoiceCtx(){if(voiceCtx&&voiceCtx.state==='closed')voiceCtx=null;if(!voiceCtx){const C=window.AudioContext||window.webkitAudioContext;if(C)voiceCtx=new C()}return voiceCtx}
  // iOS only lets an AudioContext start inside a user gesture. The voice context
  // used to be created after the speech fetch resolved, outside any gesture, so
  // Safari kept it suspended and the phone stayed silent while the Mac played.
  // Create and resume it on every tap instead; the calls are no-ops once running.
  for(const ev of ['pointerdown','touchend','click']) document.addEventListener(ev,()=>{const c=ensureVoiceCtx();if(stalled(c))c.resume().catch(()=>{})},{capture:true,passive:true});
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
  const VOICE_CACHE_MAX=48;
  function voiceKey(text,lang,voice=K.state.voice){return `${lang}|${voice}|${text}`}
  function remember(key,blob){voiceCache.delete(key);voiceCache.set(key,blob);while(voiceCache.size>VOICE_CACHE_MAX)voiceCache.delete(voiceCache.keys().next().value)}
  // In-flight requests are shared: a prefetch and the real playback of the
  // same line never hit the server twice.
  const inFlight=new Map();
  async function fetchVoiceBlob(text,signal,voice=K.state.voice){
    if(!speechAvailable) throw Object.assign(new Error('speech-unavailable'),{name:'AbortError'});
    if(voice==='Stil') throw Object.assign(new Error('silent'),{name:'AbortError'});
    const lang=K.speechLang?.()||K.state.language||'nl';
    const key=voiceKey(text,lang,voice);
    if(voiceCache.has(key)) return voiceCache.get(key);
    if(inFlight.has(key)) return inFlight.get(key);
    const job=fetchVoiceBlobNow(text,signal,voice,lang,key).finally(()=>inFlight.delete(key));
    inFlight.set(key,job);
    return job;
  }
  async function fetchVoiceBlobNow(text,signal,voice,lang,key,attempt=0){
    // Digits become words here, at the voice boundary, so "B. 7." is voiced as
    // "B. zeven." and not as English "Bay seven". The screen keeps the digits.
    const spoken=K.core.spellNumbers(text,lang);
    const r=await fetch(K.config.elevenLabsProxyUrl||'/api/tts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:spoken,voice,lang}),signal});
    if(!r.ok){
      if(r.status===503||r.status===501){speechAvailable=false;console.info('Kwizillo: speech is not configured, continuing without a voice.')}
      // A momentary refusal (too many requests, upstream hiccup or timeout) is
      // tried once more after a short pause, so a line is not silently skipped.
      if((r.status===429||r.status===502||r.status===504)&&attempt<1&&!signal?.aborted){
        await new Promise(res=>setTimeout(res,r.status===429?900:450));
        if(signal?.aborted) throw Object.assign(new Error('aborted'),{name:'AbortError'});
        return fetchVoiceBlobNow(text,signal,voice,lang,key,attempt+1);
      }
      throw new Error(`TTS ${r.status}`);
    }
    const blob=await r.blob();
    remember(key,blob);
    return blob;
  }
  // Warm the cache for texts that will be spoken next. Never throws, never
  // plays anything, and is a no-op without a voice.
  // Warm-ups go two at a time: the browser allows about six connections per
  // host, and a Memo board that fired fourteen speech requests at once left no
  // connection for its own pictures on the iPhone. A tap that needs a line
  // now still jumps the queue, because K.speak fetches directly and shares an
  // in-flight request when one exists.
  const warm=[];let warming=0;const WARM_PARALLEL=2;
  function pumpWarm(){
    while(warming<WARM_PARALLEL&&warm.length){
      const {text,voice}=warm.shift();warming++;
      fetchVoiceBlob(text,undefined,voice).catch(()=>{}).finally(()=>{warming--;pumpWarm()});
    }
  }
  K.prefetchSpeech=(texts,{voice=K.state.voice}={})=>{
    if(!speechAvailable||voice==='Stil') return;
    for(const text of (texts||[]).filter(Boolean)) if(!warm.some(w=>w.text===text&&w.voice===voice)) warm.push({text,voice});
    pumpWarm();
  };
  function measureVoiceGain(buffer){let sum=0,count=0;const step=24;for(let ch=0;ch<buffer.numberOfChannels;ch++){const data=buffer.getChannelData(ch);for(let i=0;i<data.length;i+=step){const v=data[i];sum+=v*v;count++}}const rms=Math.sqrt(sum/Math.max(1,count));return Math.max(.7,Math.min(5,.16/Math.max(rms,.02)))}
  async function playVoiceBlob(blob,token,onStart){if(!gate.isCurrent(token))return false;const c=ensureVoiceCtx();if(c){if(stalled(c))await c.resume().catch(()=>{});if(!gate.isCurrent(token))return false;const data=await blob.arrayBuffer();if(!gate.isCurrent(token))return false;const buffer=await c.decodeAudioData(data.slice(0));if(!gate.isCurrent(token))return false;return new Promise(resolve=>{const source=c.createBufferSource(),pre=c.createGain(),compressor=c.createDynamicsCompressor(),makeup=c.createGain(),limiter=c.createDynamicsCompressor();voiceSource=source;source.buffer=buffer;voiceNow={buffer,startedAt:0};pre.gain.value=measureVoiceGain(buffer);compressor.threshold.value=-20;compressor.knee.value=14;compressor.ratio.value=4;compressor.attack.value=.002;compressor.release.value=.14;makeup.gain.value=Math.max(0,Math.min(1.5,Number(K.state.voiceVolume??1)));limiter.threshold.value=-4;limiter.knee.value=2;limiter.ratio.value=20;limiter.attack.value=.001;limiter.release.value=.08;source.connect(pre);pre.connect(compressor);compressor.connect(makeup);makeup.connect(limiter);limiter.connect(c.destination);source.onended=()=>{if(voiceSource===source){voiceSource=null;voiceNow=null}resolve(gate.isCurrent(token))};try{source.start();voiceNow.startedAt=performance.now();onStart?.(buffer.duration)}catch(e){voiceNow=null;resolve(false)}})}
    return new Promise(resolve=>{const url=URL.createObjectURL(blob),a=new Audio(url);voiceUrl=url;a.volume=Math.max(0,Math.min(1,Number(K.state.voiceVolume??1)));a.onended=()=>{URL.revokeObjectURL(url);if(voiceUrl===url)voiceUrl=null;resolve(gate.isCurrent(token))};a.onerror=()=>{URL.revokeObjectURL(url);resolve(false)};a.onplaying=()=>onStart?.(a.duration||0);a.play().catch(()=>resolve(false))})
  }
  // Mouth level of the line playing right now (0..1), for a guide portrait
  // that talks along with the voice: the loudness envelope of the clip is
  // measured once per clip (30 ms windows, scaled to its own loud parts) and
  // read back against the playback clock. Nothing is sent anywhere.
  let voiceNow=null;const envelopes=new WeakMap();const ENV_STEP=.03;
  function envelopeOf(buffer){
    let env=envelopes.get(buffer);if(env)return env;
    const data=buffer.getChannelData(0),win=Math.max(1,Math.round(buffer.sampleRate*ENV_STEP)),n=Math.ceil(data.length/win);
    env=new Float32Array(n);
    for(let i=0;i<n;i++){let sum=0;const s0=i*win,s1=Math.min(data.length,s0+win);for(let j=s0;j<s1;j++)sum+=data[j]*data[j];env[i]=Math.sqrt(sum/Math.max(1,s1-s0))}
    const sorted=Array.from(env).sort((x,y)=>x-y),ref=sorted[Math.floor(sorted.length*.95)]||1;
    for(let i=0;i<n;i++)env[i]=Math.min(1,env[i]/(ref||1));
    // Scaled against the loudest sound of the surrounding 0.6 s (floored, so
    // silence stays shut): a soft phrase opens the mouth as far as a loud one,
    // and every syllable pulses — the same rule the clips' drawn mouth uses.
    const span=Math.round(.3/ENV_STEP),out=new Float32Array(n);
    for(let i=0;i<n;i++){let m=.35;for(let j=Math.max(0,i-span);j<=Math.min(n-1,i+span);j++)if(env[j]>m)m=env[j];out[i]=env[i]<.06?0:Math.pow(Math.min(1,env[i]/m),.85)}
    envelopes.set(buffer,out);return out;
  }
  // Read against the wall clock from the moment the source started: it stays
  // in step with playback and never depends on the context clock ticking.
  // How far the line playing right now is (0..1), for progress bars that follow the voice.
  K.voiceProgress=()=>{if(!voiceNow||!voiceNow.startedAt||!voiceNow.buffer)return null;return Math.max(0,Math.min(1,(performance.now()-voiceNow.startedAt)/1000/voiceNow.buffer.duration))};
  K.voiceLevel=()=>{if(!voiceNow||!voiceNow.startedAt)return 0;const env=envelopeOf(voiceNow.buffer);const i=Math.floor((performance.now()-voiceNow.startedAt)/1000/ENV_STEP);return i>=0&&i<env.length?env[i]:0};
  K.stopSpeech=()=>{voiceNow=null;gate.cancel();K.audio.duck(false);try{abort?.abort()}catch(e){}abort=null;try{if(voiceSource){voiceSource.onended=null;voiceSource.stop();voiceSource.disconnect();voiceSource=null}}catch(e){}if(voiceUrl){try{URL.revokeObjectURL(voiceUrl)}catch(e){}voiceUrl=null}try{speechSynthesis?.cancel()}catch(e){}try{K.clearSpeechHighlight?.()}catch(e){}};
  // Natural pacing per CLAUDE.md section 9: a beat after the question, a shorter
  // one between answers. The wait is cancellable, so a tap still stops speech instantly.
  const GAP={question:520,answer:300,option:120,speech:0};
  function pause(ms,token){return ms>0?new Promise(resolve=>{const id=setTimeout(resolve,ms);const check=setInterval(()=>{if(!gate.isCurrent(token)){clearTimeout(id);clearInterval(check);resolve()}},60);setTimeout(()=>clearInterval(check),ms+80)}):Promise.resolve()}
  // One failed segment must not silence the rest of the question: it is logged,
  // skipped, and the sequence carries on with the next answer. Before this, a
  // single upstream 429 on segment B meant the child heard the question and "A"
  // and nothing else.
  K.speakSequence=async(segments,{onSegment,onStart,onDone,prefetch,voice}={})=>{segments=(segments||[]).filter(s=>s&&s.text);/* `voice` lets a character speak in its own voice (Milo hosts onboarding and the tour); a child who chose silence stays silent either way */const v=K.state.voice==='Stil'?'Stil':(voice||K.state.voice);if(!segments.length||v==='Stil')return;K.stopSpeech();const token=gate.begin();abort=new AbortController();const signal=abort.signal;K.audio.duck(true);const requests=segments.map(s=>fetchVoiceBlob(s.text,signal,v).then(blob=>({ok:true,blob})).catch(error=>({ok:false,error})));/* the feedback lines are queued right behind the question so they are ready however fast the child answers */if(prefetch?.length)K.prefetchSpeech(prefetch);try{for(let i=0;i<segments.length;i++){const result=await requests[i];if(!gate.isCurrent(token))return;if(!result.ok){if(result.error?.name!=='AbortError')console.warn('Kwizillo TTS: segment skipped —',result.error?.message||result.error);continue}try{onSegment?.(segments[i],i)}catch(e){}const finished=await playVoiceBlob(result.blob,token,d=>{try{onStart?.(segments[i],i,d)}catch(e){}});if(!finished||!gate.isCurrent(token))return;if(i<segments.length-1){await pause(GAP[segments[i].kind]??260,token);if(!gate.isCurrent(token))return}}try{onDone?.()}catch(e){}}catch(e){if(e?.name!=='AbortError'&&gate.isCurrent(token))console.warn('Kwizillo TTS:',e?.message||e)}finally{if(gate.isCurrent(token)){K.audio.duck(false);abort=null}}};
  K.speak=(text,opts)=>K.speakSequence([{kind:'speech',text}],opts);

  // ?debug shows an on-screen log (for phones without a console). Always mirrors to console.info.
  const DEBUG=new URLSearchParams(location.search).has('debug');
  K.debugLog=(...a)=>{const line=a.map(x=>typeof x==='object'?JSON.stringify(x):String(x)).join(' ');console.info('[kwizillo]',line);if(!DEBUG)return;let el=document.getElementById('kwDebug');if(!el){el=document.createElement('pre');el.id='kwDebug';el.style.cssText='position:fixed;left:0;right:0;bottom:0;max-height:38%;overflow:auto;margin:0;padding:6px 8px;background:rgba(0,0,0,.78);color:#8f8;font:11px/1.35 monospace;z-index:99999;pointer-events:none;white-space:pre-wrap';document.body.appendChild(el)}el.textContent+=new Date().toISOString().slice(11,19)+' '+line+'\n';el.scrollTop=el.scrollHeight};
  // Titles on tiles and cards never get a word cut in two: when the longest
  // word does not fit, the font shrinks (down to a floor) instead. Runs after
  // every frame; K.fitTitles(root) can be called again after a partial update.
  const FIT='.home-world-copy b,.world-topic b,.home-game.art b,.world-game.art b,.memo-pick b,.fact-chip,.onboarding-choice b,.kcard-top b,.memo-front.word b,.quiz-card .answer-copy,.stat-tiles b,.setting-card b,.world-title-wrap h1,.mascot-card b';
  K.fitTitles=(root=K.app)=>{
    root.querySelectorAll(FIT).forEach(el=>{
      if(el.dataset.fitBase)el.style.fontSize=el.dataset.fitBase;
      const cs=getComputedStyle(el);let size=parseFloat(cs.fontSize);if(!size)return;
      el.dataset.fitBase=el.style.fontSize||'';
      const floor=Math.max(9,size*.6);
      // scrollWidth grows past clientWidth only when a single word is wider than the box
      let guard=0;while(el.scrollWidth>el.clientWidth+1&&size>floor&&guard++<14){size=Math.max(floor,size-.75);el.style.fontSize=size+'px'}
    });
  };
  K.frame=html=>{K.stopSpeech();K.app.innerHTML=`<section class="game-frame ${new URLSearchParams(location.search).has('debug')?'debug':''}">${html}</section>`;const f=K.app.firstElementChild;requestAnimationFrame(()=>K.fitTitles(f));return f};K.toast=text=>{const f=K.app.querySelector('.game-frame');if(!f)return;const t=document.createElement('div');t.className='toast';t.textContent=text;f.appendChild(t);setTimeout(()=>t.remove(),2200)};K.sfx=(k='tap')=>K.audio.play(k);K.timerTick=sec=>{if(sec<=0||sec>10)return;K.audio.play(sec<=5?'tock':'tick')};
})();