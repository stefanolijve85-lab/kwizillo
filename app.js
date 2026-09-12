(() => {
  const app = document.getElementById('app');
  const debug = new URLSearchParams(location.search).has('debug');
  const MASTER = {
    home:'assets/home.png', ruimte:'assets/world_space.png', geschiedenis:'assets/world_history.png',
    wetenschap:'assets/world_science.png', mysterie:'assets/world_mystery.png', dieren:'assets/world_animals.png', aarde:'assets/world_earth.png',
    achievements:'assets/achievements.png', collection:'assets/collection.png', stats:'assets/stats.png', parent:'assets/parent.png', result:'assets/result.png',
    spaceQuiz:'assets/quiz_space_master.png', wrong:'assets/quiz_wrong_master.png', mercuryReward:'assets/reward_mercury.png'
  };
  const MOTION = {
    home:'https://d8j0ntlcm91z4.cloudfront.net/user_2yYu0y6DQa27eWwkUPG52d9yApj/hf_20260911_210153_bf123057-1f86-48e5-aac9-10efd794746a.mp4',
    milo:'https://d8j0ntlcm91z4.cloudfront.net/user_2yYu0y6DQa27eWwkUPG52d9yApj/hf_20260911_205120_b2674d42-a4c6-4475-a029-ecddbdd26bbc.mp4',
    ruimte:'https://d8j0ntlcm91z4.cloudfront.net/user_2yYu0y6DQa27eWwkUPG52d9yApj/hf_20260911_205120_165df461-61b6-421b-9717-ea92deb8fe91.mp4',
    mysterie:'https://d8j0ntlcm91z4.cloudfront.net/user_2yYu0y6DQa27eWwkUPG52d9yApj/hf_20260911_210153_3a36c872-6cf6-4e2e-9eaa-1623dd0835a7.mp4'
  };
  const KEY='kwizillo-v3-state';
  const initial={coins:245,streak:7,level:5,xp:320,voice:'Milo',soundOn:true,musicOn:true,sfxVolume:.72,musicVolume:.24,musicTrack:'magical',timeLimitOn:true,timeLimit:45,group:5,answered:0,correct:0,collection:['Mercurius'],mastery:{ruimte:42,geschiedenis:36,wetenschap:41,mysterie:45,dieren:47,aarde:38}};
  let state=Object.assign({},initial,JSON.parse(localStorage.getItem(KEY)||'{}'));

  const CONFIG = window.KWIZILLO_CONFIG || {};
  let activeAudio = null;
  let voiceWarned = false;
  let voiceStatus = {mode:'checking'};

  const AUDIO = (()=>{
    const paths={tap:'assets/audio/tap.wav',good:'assets/audio/correct.wav',bad:'assets/audio/wrong.wav',reward:'assets/audio/reward.wav',world:'assets/audio/world.wav'};
    const tracks={
      magical:{id:'magical',label:'Magisch',icon:'✨',src:'assets/audio/music_magical_loop.wav',desc:'Licht & verwonderend'},
      adventure:{id:'adventure',label:'Avontuur',icon:'🧭',src:'assets/audio/music_adventure_loop.wav',desc:'Vrolijk & energiek'},
      space:{id:'space',label:'Ruimte',icon:'🚀',src:'assets/audio/music_space_loop.wav',desc:'Dromerig & kosmisch'},
      calm:{id:'calm',label:'Rustig',icon:'🌙',src:'assets/audio/music_calm_loop.wav',desc:'Zacht & kalm'}
    };
    const preload={};Object.entries(paths).forEach(([k,src])=>{const a=new Audio(src);a.preload='auto';preload[k]=a});
    let ctx=null,musicMaster=null,currentSource=null,currentSourceGain=null,currentId=null,ducked=false;const buffers=new Map();
    function ensureCtx(){if(!ctx){const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)return null;ctx=new Ctx();musicMaster=ctx.createGain();musicMaster.connect(ctx.destination);musicMaster.gain.value=0}return ctx}
    function wantedMusicGain(){return state.musicOn===false?0:Math.max(0,Math.min(1,Number(state.musicVolume??.24)))*(ducked?.34:1)}
    function rampMaster(seconds=.18){if(!musicMaster||!ctx)return;const now=ctx.currentTime;musicMaster.gain.cancelScheduledValues(now);musicMaster.gain.setValueAtTime(musicMaster.gain.value,now);musicMaster.gain.linearRampToValueAtTime(wantedMusicGain(),now+seconds)}
    async function loadTrack(id){const t=tracks[id]||tracks.magical;if(buffers.has(t.id))return buffers.get(t.id);const c=ensureCtx();if(!c)return null;const r=await fetch(t.src);if(!r.ok)throw new Error('Muziekbestand niet gevonden');const b=await c.decodeAudioData((await r.arrayBuffer()).slice(0));buffers.set(t.id,b);return b}
    async function startTrack(id=state.musicTrack||'magical',crossfade=.45){const c=ensureCtx();if(!c)return;if(c.state==='suspended')await c.resume().catch(()=>{});const t=tracks[id]||tracks.magical;state.musicTrack=t.id;save();const buffer=await loadTrack(t.id);if(!buffer)return;const now=c.currentTime,src=c.createBufferSource(),g=c.createGain();src.buffer=buffer;src.loop=true;src.loopStart=0;src.loopEnd=buffer.duration;g.gain.setValueAtTime(0,now);src.connect(g);g.connect(musicMaster);src.start(now);g.gain.linearRampToValueAtTime(1,now+crossfade);const old=currentSource,oldGain=currentSourceGain;currentSource=src;currentSourceGain=g;currentId=t.id;if(old&&oldGain){try{oldGain.gain.cancelScheduledValues(now);oldGain.gain.setValueAtTime(oldGain.gain.value,now);oldGain.gain.linearRampToValueAtTime(0,now+crossfade);old.stop(now+crossfade+.05)}catch(e){}}rampMaster(.22)}
    async function unlock(){const c=ensureCtx();if(!c)return;if(c.state==='suspended')await c.resume().catch(()=>{});if(state.musicOn!==false&&!currentSource)await startTrack(state.musicTrack||'magical',.25).catch(()=>{});else rampMaster(.12)}
    function play(kind='tap'){if(state.soundOn===false)return;const base=preload[kind]||preload.tap;try{const a=base.cloneNode();const baseVol=kind==='tap'?.42:kind==='bad'?.58:kind==='world'?.62:.68;a.volume=Math.max(0,Math.min(1,Number(state.sfxVolume??.72)))*baseVol;a.play().catch(()=>{})}catch(e){}}
    async function setMusic(on){state.musicOn=!!on;save();await unlock().catch(()=>{});if(on){if(!currentSource||currentId!==(state.musicTrack||'magical'))await startTrack(state.musicTrack||'magical',.28).catch(()=>{});rampMaster(.22)}else rampMaster(.18)}
    function setSfx(on){state.soundOn=!!on;save();if(on)play('good')}
    function setSfxVolume(v){state.sfxVolume=Math.max(0,Math.min(1,Number(v)));save()}
    function setMusicVolume(v){state.musicVolume=Math.max(0,Math.min(1,Number(v)));save();rampMaster(.08)}
    async function setTrack(id){if(!tracks[id])return;state.musicTrack=id;save();await unlock().catch(()=>{});if(state.musicOn!==false)await startTrack(id,.55).catch(()=>{})}
    function duck(on){ducked=!!on;rampMaster(on?.16:.35)}
    document.addEventListener('pointerdown',unlock,{once:true,capture:true});
    return{unlock,play,setMusic,setSfx,setSfxVolume,setMusicVolume,setTrack,duck,tracks,get currentTrack(){return state.musicTrack||'magical'}};
  })();
  const sfx=(kind='tap')=>AUDIO.play(kind);

  async function refreshVoiceStatus(){
    if(!CONFIG.elevenLabsProxyUrl)return {mode:'off'};
    try{
      const r=await fetch(CONFIG.voiceStatusUrl||'/api/voice-status',{cache:'no-store'});
      voiceStatus=r.ok?await r.json():{mode:'unavailable'};
    }catch(e){voiceStatus={mode:'unavailable'}}
    return voiceStatus;
  }
  function stopAudio(){
    AUDIO.duck(false);
    try{if(activeAudio){activeAudio.pause();activeAudio.currentTime=0;activeAudio=null}}catch(e){}
    try{if('speechSynthesis' in window)speechSynthesis.cancel()}catch(e){}
  }
  async function speak(text){
    if(!text||state.voice==='Stil')return;
    stopAudio();
    AUDIO.duck(true);
    if(CONFIG.elevenLabsProxyUrl){
      try{
        const r=await fetch(CONFIG.elevenLabsProxyUrl,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text,voice:state.voice})});
        if(r.ok){
          const blob=await r.blob(),url=URL.createObjectURL(blob);
          activeAudio=new Audio(url);activeAudio.volume=state.voice==='Luna'?1:.86;
          activeAudio.onended=()=>{URL.revokeObjectURL(url);AUDIO.duck(false)};
          await activeAudio.play();return;
        }
        const detail=await r.json().catch(()=>({}));
        if(!voiceWarned){voiceWarned=true;toast(`ElevenLabs stemfout: ${detail.error||r.status}`)}
      }catch(e){AUDIO.duck(false);if(!voiceWarned){voiceWarned=true;toast('ElevenLabs is niet bereikbaar.')}}
    } else {AUDIO.duck(false)}
  }
  let currentWorld='ruimte', quiz=null, lastView='home';

const save=()=>localStorage.setItem(KEY,JSON.stringify(state));
const WORLD_PALETTE={ruimte:['#102862','#2b65f1','#7ad5ff'],geschiedenis:['#6e4a1f','#d7a65d','#f8e5b7'],wetenschap:['#174e8c','#35b8ff','#c7f7ff'],mysterie:['#31115b','#7a2dff','#ffcc63'],dieren:['#20592a','#67c25d','#eefec8'],aarde:['#155781','#33a6d9','#b5f0ff']};
function xml(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function wrapWords(text,maxLen=18){
  const words=String(text||'').split(/\s+/); const lines=[]; let line='';
  words.forEach(w=>{if((line+' '+w).trim().length>maxLen){if(line)lines.push(line.trim()); line=w;} else line=(line+' '+w).trim();});
  if(line)lines.push(line.trim());
  return lines.slice(0,2);
}
function relevantLabel(q){
  const p=String(q.prompt||'');
  if(/planeet|zon|maan|ruimte/i.test(p)) return q.answer;
  if(/orgaan|bloed|lichaam/i.test(p)) return 'Menselijk lichaam';
  if(/piramide|egypte/i.test(p)) return 'Oude Egypte';
  if(/vogel|dier|slurf|strepen|zwem/i.test(p)) return q.answer;
  if(/kaart|speurtocht|schatkist|sleutel|vergrootglas/i.test(p)) return q.answer;
  if(/thermometer|kracht|temperatuur/i.test(p)) return q.answer;
  return q.answer || 'Ontdek';
}
function questionArt(q){
  if(q.image) return q.image;
  const [c1,c2,c3]=(WORLD_PALETTE[q.world]||WORLD_PALETTE.ruimte);
  const emoji=answerIcon(q.answer||'⭐');
  const label=xml(relevantLabel(q));
  const lines=wrapWords(label,17);
  const subtitle=wrapWords((q.hint||'').replace(/^./, m=>m.toUpperCase()),30)[0]||'';
  const bubbles=(q.options||[]).slice(0,4).map((o,i)=>{
    const x=[18,82,20,80][i], y=[26,26,72,72][i];
    return `<g opacity="0.16"><circle cx="${x}%" cy="${y}%" r="8.5%" fill="#fff"/><text x="${x}%" y="${y+1}%" text-anchor="middle" font-size="30">${xml(answerIcon(o))}</text></g>`
  }).join('');
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 720">
    <defs>
      <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="${c2}"/><stop offset="1" stop-color="${c1}"/></linearGradient>
      <linearGradient id="card" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="rgba(255,255,255,.18)"/><stop offset="1" stop-color="rgba(255,255,255,.05)"/></linearGradient>
    </defs>
    <rect width="1200" height="720" rx="56" fill="url(#bg)"/>
    <circle cx="1070" cy="120" r="190" fill="${c3}" opacity="0.30"/>
    <circle cx="140" cy="610" r="180" fill="#ffffff" opacity="0.16"/>
    ${bubbles}
    <rect x="48" y="46" width="1104" height="628" rx="44" fill="url(#card)" stroke="rgba(255,255,255,.38)" stroke-width="4"/>
    <text x="600" y="312" text-anchor="middle" font-size="210">${xml(emoji)}</text>
    <text x="600" y="468" text-anchor="middle" font-size="66" font-weight="900" fill="#ffffff" style="font-family: Arial, sans-serif;">${xml(lines[0] || "")}</text>
    ${lines[1] ? `<text x="600" y="540" text-anchor="middle" font-size="58" font-weight="900" fill="#ffffff" style="font-family: Arial, sans-serif;">${xml(lines[1])}</text>` : ""}
    <text x="600" y="604" text-anchor="middle" font-size="28" font-weight="700" fill="rgba(255,255,255,.94)" style="font-family: Arial, sans-serif;">${xml(subtitle)}</text>
  </svg>`;
  return 'data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(svg);
}
function gearHotspots(){return [H(2,1,11,5.5,'Instellingen',showParent)]}
function renderParentNativeControls(f){
  if(!f)return;const controls=document.createElement('div');controls.className='parent-controls-layer';controls.innerHTML=`<button class="pc-time-toggle ${state.timeLimitOn!==false?'on':''}" aria-label="Tijdslimiet aan of uit"><span></span></button><input class="pc-time-range" type="range" min="15" max="90" step="15" value="${state.timeLimit||45}" aria-label="Tijdslimiet in minuten"><div class="pc-time-value">${state.timeLimitOn===false?'Uit':`${state.timeLimit||45} min`}</div><div class="pc-audio-hint">🎚️ Open geluid</div>`;f.appendChild(controls);controls.querySelector('.pc-time-toggle').onclick=()=>{sfx('tap');state.timeLimitOn=state.timeLimitOn===false;save();showParent()};controls.querySelector('.pc-time-range').oninput=e=>{state.timeLimit=Number(e.target.value);state.timeLimitOn=true;save();controls.querySelector('.pc-time-value').textContent=`${state.timeLimit} min`};controls.querySelector('.pc-audio-hint').onclick=()=>{sfx('tap');showSoundSettings()};
}
function showSoundSettings(){
  const f=app.querySelector('.game-frame');if(!f)return;f.querySelector('.sound-settings-overlay')?.remove();const overlay=document.createElement('div');overlay.className='sound-settings-overlay';const trackButtons=Object.values(AUDIO.tracks).map(t=>`<button class="music-choice ${state.musicTrack===t.id?'selected':''}" data-track="${t.id}"><span class="music-icon">${t.icon}</span><span><b>${t.label}</b><small>${t.desc}</small></span>${state.musicTrack===t.id?'<i>✓</i>':''}</button>`).join('');overlay.innerHTML=`<div class="sound-settings-card"><div class="sound-head"><div><span class="sound-kicker">INSTELLINGEN</span><h2>🔊 Geluid & muziek</h2><p>Effecten, muziek en stem werken onafhankelijk van elkaar.</p></div><button class="sound-close" aria-label="Sluiten">×</button></div><div class="sound-row"><div class="sound-label"><b>✨ Geluidseffecten</b><small>Knoppen, goed/fout en beloningen</small></div><button class="sound-toggle ${state.soundOn!==false?'on':''}" data-toggle="sfx"><span></span></button></div><div class="volume-row"><span>🔈</span><input type="range" min="0" max="100" value="${Math.round((state.sfxVolume??.72)*100)}" data-volume="sfx"><span>🔊</span><button class="sound-test">Test</button></div><div class="sound-divider"></div><div class="sound-row"><div class="sound-label"><b>🎵 Achtergrondmuziek</b><small>Blijft ook werken als de stem op Stil staat</small></div><button class="sound-toggle ${state.musicOn!==false?'on':''}" data-toggle="music"><span></span></button></div><div class="volume-row"><span>🔈</span><input type="range" min="0" max="100" value="${Math.round((state.musicVolume??.24)*100)}" data-volume="music"><span>🔊</span></div><h3>Kies je muziek</h3><div class="music-choice-grid">${trackButtons}</div><div class="sound-divider"></div><h3>Stemgids</h3><div class="sound-voice-grid"><button class="sound-voice ${state.voice==='Milo'?'selected':''}" data-guide="Milo">🤖 <b>Milo</b><small>Vrolijk & enthousiast</small></button><button class="sound-voice ${state.voice==='Luna'?'selected':''}" data-guide="Luna">🎧 <b>Luna</b><small>Rustig & vriendelijk</small></button><button class="sound-voice ${state.voice==='Stil'?'selected':''}" data-guide="Stil">🔇 <b>Stil</b><small>Zonder stem</small></button></div><div class="loop-note">♾️ De muziek gebruikt exacte 16-seconden WAV-loops via Web Audio. Er zit geen laadpauze tussen het einde en het begin; bij wisselen crossfadet de muziek.</div></div>`;f.appendChild(overlay);const rerender=()=>{overlay.remove();showSoundSettings()};overlay.querySelector('.sound-close').onclick=()=>{sfx('tap');overlay.remove()};overlay.addEventListener('pointerdown',e=>{if(e.target===overlay)overlay.remove()});overlay.querySelector('[data-toggle="sfx"]').onclick=()=>{AUDIO.setSfx(state.soundOn===false);rerender()};overlay.querySelector('[data-toggle="music"]').onclick=async()=>{await AUDIO.setMusic(state.musicOn===false);rerender()};overlay.querySelector('[data-volume="sfx"]').oninput=e=>AUDIO.setSfxVolume(e.target.value/100);overlay.querySelector('[data-volume="music"]').oninput=e=>AUDIO.setMusicVolume(e.target.value/100);overlay.querySelector('.sound-test').onclick=()=>{AUDIO.unlock();AUDIO.play('reward')};overlay.querySelectorAll('[data-guide]').forEach(btn=>btn.onclick=()=>{sfx('tap');state.voice=btn.dataset.guide;save();if(state.voice==='Stil'){stopAudio();rerender()}else{rerender();setTimeout(()=>speak(state.voice==='Milo'?'Hoi! Ik ben Milo. Klaar om te spelen?':'Hoi! Ik ben Luna. Zullen we samen ontdekken?'),80)}});overlay.querySelectorAll('[data-track]').forEach(btn=>btn.onclick=async()=>{sfx('tap');await AUDIO.setTrack(btn.dataset.track);rerender()});
}

  const H=(x,y,w,h,label,onClick)=>({x,y,w,h,label,onClick});
  function frame(content=''){app.innerHTML=`<section class="game-frame ${debug?'debug':''}">${content}</section>`;return app.firstElementChild}
  function hsMarkup(h,i){return `<button class="hotspot" aria-label="${h.label}" data-hs="${i}" style="left:${h.x}%;top:${h.y}%;width:${h.w}%;height:${h.h}%">${h.label}</button>`}
  function master(asset,hotspots=[],cls='fade-in'){
    const f=frame(`<img class="master-art ${cls}" src="${asset}" alt=""><div>${hotspots.map(hsMarkup).join('')}</div>`);
    hotspots.forEach((h,i)=>f.querySelector(`[data-hs="${i}"]`).onclick=()=>{sfx('tap');h.onClick()});
    return f;
  }
  function toast(text){const f=app.querySelector('.game-frame');if(!f)return;const t=document.createElement('div');t.className='toast';t.textContent=text;f.appendChild(t);setTimeout(()=>t.remove(),2200)}
  function renderVoiceSelection(f){
    if(!f)return;
    const defs=[
      {name:'Milo',x:5.1,y:80.45,w:26.2,h:7.75},
      {name:'Luna',x:32.9,y:80.45,w:26.1,h:7.75},
      {name:'Stil',x:60.1,y:80.45,w:20.3,h:7.75}
    ];
    defs.forEach(d=>{
      const el=document.createElement('div');
      el.className=`voice-choice-frame ${state.voice===d.name?'selected':'unselected'} voice-${d.name.toLowerCase()}`;
      el.style.cssText=`left:${d.x}%;top:${d.y}%;width:${d.w}%;height:${d.h}%`;
      if(state.voice===d.name){const c=document.createElement('span');c.className='voice-choice-check';c.textContent='✓';el.appendChild(c)}
      f.appendChild(el);
    });
    if(state.voice!=='Milo'){
      const mask=document.createElement('div');mask.className='milo-baked-check-mask';f.appendChild(mask);
    }
  }
  function playMotion(kind,next,label='Even de wereld tot leven brengen…'){
    const url=MOTION[kind]; if(!url){next();return}
    const f=frame(`<div class="motion fade-in"><video autoplay muted playsinline preload="auto" src="${url}"></video><button class="motion-skip">Overslaan</button><div class="motion-badge">${label}</div></div>`);
    const v=f.querySelector('video'), skip=f.querySelector('.motion-skip'); let done=false;
    const finish=()=>{if(done)return;done=true;next()};
    skip.onclick=finish; v.onended=finish; v.onerror=finish; setTimeout(finish,4700);
  }
  function bottomNavHotspots(){return [
    H(0,91.3,20,8.7,'Home',()=>showHome(false)),
    H(20,91.3,20,8.7,'Prestaties',showAchievements),
    H(40,91.3,20,8.7,'Mijn collectie',showCollection),
    H(60,91.3,20,8.7,'Statistieken',showStats),
    H(80,91.3,20,8.7,'Meer / Ouderzone',showParent)
  ]}
  function showHome(withMotion=false){
    lastView='home';
    const open=()=>{
      const f=master(MASTER.home,[
        ...gearHotspots(),
        H(7,22,43,14,'Ruimtewereld',()=>enterWorld('ruimte')),
        H(57,20,39,15,'Dierenwereld',()=>enterWorld('dieren')),
        H(4,35,48,18,'Aardewereld',()=>enterWorld('aarde')),
        H(54,37,43,17,'Geschiedeniswereld',()=>enterWorld('geschiedenis')),
        H(4,51,49,17,'Wetenschapwereld',()=>enterWorld('wetenschap')),
        H(54,52,43,17,'Mysteriewereld',()=>enterWorld('mysterie')),
        H(22,69,55,7.5,'Start avontuur',()=>enterWorld(currentWorld||'ruimte')),
        H(5,80,27,8.2,'Stem Milo',()=>{state.voice='Milo';voiceWarned=false;save();showHome(false);setTimeout(()=>speak('Hoi avonturier! Ik ben Milo. Klaar om samen iets nieuws te ontdekken?'),120)}),
        H(33,80,27,8.2,'Stem Luna',()=>{state.voice='Luna';voiceWarned=false;save();showHome(false);setTimeout(()=>speak('Hoi avonturier! Ik ben Luna. Zullen we samen op ontdekking gaan?'),120)}),
        H(61,80,25,8.2,'Zonder stem',()=>{state.voice='Stil';stopAudio();save();showHome(false);toast('Alleen de stem staat uit. Muziek en effecten blijven aan.')}),
        ...bottomNavHotspots()
      ]);
      renderVoiceSelection(f);
      return f;
    };
    withMotion?playMotion('home',open,'Welkom in Kwizillo'):open();
  }
  function enterWorld(world){currentWorld=world;state.lastWorld=world;save();sfx('world');const open=()=>showWorld(world);if(world==='ruimte'||world==='mysterie')playMotion(world,open,world==='ruimte'?'Op reis naar de sterren…':'Het portaal wordt geopend…');else open()}
  const worldAsset=w=>MASTER[w]||MASTER.ruimte;
  const TOPIC_KEYS={
    ruimte:['zonnestelsel','sterren_planeten','astronauten','raket_avontuur'],
    geschiedenis:['egyptenaren','ridders_kastelen','romeinen','ontdekkingsreizigers'],
    wetenschap:['slimme_proefjes','lichaam','uitvindingen','natuur_energie'],
    mysterie:['raadsels','verborgen_schatten','natuurmysteries','speurtocht'],
    dieren:['snelle_dieren','baby_dieren','waterdieren','jungle'],
    aarde:['continenten_landen','weer_klimaat','oceanen_natuur','kaarten_navigatie']
  };
  function showWorld(world){lastView='world';currentWorld=world;const topicActions=[0,1,2,3].map((n)=>H(n%2?50:3,n<2?46:59,47,12,`Onderwerp ${n+1}`,()=>startQuiz(world,n)));
    master(worldAsset(world),[
      ...gearHotspots(),
      ...topicActions,
      H(22,82,56,7.5,'Start gemengde quiz',()=>startQuiz(world,null)),
      ...bottomNavHotspots()
    ]);
  }
  const extraQuestions=[
    {id:'sp2',world:'ruimte',prompt:'Welke planeet is de grootste in ons zonnestelsel?',options:['Mars','Jupiter','Saturnus','Aarde'],answer:'Jupiter',hint:'Hij heeft een grote rode storm.',explanation:'Jupiter is de grootste planeet.',fact:'Er passen meer dan duizend aardes in Jupiter.',xp:10},
    {id:'sp3',world:'ruimte',prompt:'De zon is een…',options:['planeet','ster','maan','komeet'],answer:'ster',hint:'Hij geeft zelf licht.',explanation:'De zon is onze ster.',fact:'Zonlicht doet er ongeveer 8 minuten over om de aarde te bereiken.',xp:10},
    {id:'sp4',world:'ruimte',prompt:'Welke planeet staat bekend om zijn opvallende ringen?',options:['Venus','Saturnus','Mars','Mercurius'],answer:'Saturnus',hint:'Hij heeft een enorm ringsysteem.',explanation:'Saturnus heeft de bekendste ringen.',fact:'De ringen bestaan vooral uit ijs en steen.',xp:10},
    {id:'sp5',world:'ruimte',prompt:'Hoe heet iemand die naar de ruimte reist?',options:['Duiker','Astronaut','Archeoloog','Kapitein'],answer:'Astronaut',hint:'Je ziet hem vaak in een wit ruimtepak.',explanation:'Een astronaut reist en werkt in de ruimte.',fact:'Astronauten trainen jarenlang.',xp:10},
    {id:'sp6',world:'ruimte',prompt:'Welke planeet noemen we de rode planeet?',options:['Mars','Aarde','Neptunus','Jupiter'],answer:'Mars',hint:'De bodem bevat veel ijzeroxide.',explanation:'Mars wordt de rode planeet genoemd.',fact:'Mars heeft twee kleine manen.',xp:10},
    {id:'sp7',world:'ruimte',prompt:'Wat draait om de aarde?',options:['De maan','Mars','De zon elke dag','Jupiter'],answer:'De maan',hint:'Je ziet hem vaak ’s nachts.',explanation:'De maan draait om de aarde.',fact:'Een rondje duurt ongeveer 27 dagen.',xp:10},
    {id:'sp8',world:'ruimte',prompt:'Welke planeet is onze thuisplaneet?',options:['Venus','Aarde','Saturnus','Mars'],answer:'Aarde',hint:'Hier wonen wij.',explanation:'Wij wonen op de aarde.',fact:'Ongeveer 71% van het oppervlak is water.',xp:10},
    {id:'sp9',world:'ruimte',prompt:'Wat is een komeet vooral?',options:['IJs, stof en gesteente','Een kleine zon','Een satelliet','Een wolk'],answer:'IJs, stof en gesteente',hint:'Dicht bij de zon kan hij een staart krijgen.',explanation:'Kometen bestaan uit ijs, stof en gesteente.',fact:'De staart wijst van de zon af.',xp:10},
    {id:'sp10',world:'ruimte',prompt:'Welke planeet staat het verst van de zon?',options:['Neptunus','Aarde','Venus','Jupiter'],answer:'Neptunus',hint:'Het is een verre blauwe ijsreus.',explanation:'Neptunus is de verste planeet.',fact:'Een jaar op Neptunus duurt ongeveer 165 aardse jaren.',xp:10},
    {id:'hi2',world:'geschiedenis',prompt:'Wie bouwden het Colosseum?',options:['Romeinen','Vikingen','Maya’s','Ridders'],answer:'Romeinen',hint:'Denk aan Italië.',explanation:'Het Colosseum werd door de Romeinen gebouwd.',fact:'Het staat in Rome.',xp:10},
    {id:'hi3',world:'geschiedenis',prompt:'Een ridder droeg vaak een…',options:['Harnas','Ruimtepak','Duikpak','Labjas'],answer:'Harnas',hint:'Het beschermde tegen wapens.',explanation:'Ridders droegen harnassen.',fact:'Een volledig harnas bestond uit veel metalen delen.',xp:10},
    {id:'hi4',world:'geschiedenis',prompt:'Welke beschaving gebruikte farao’s?',options:['Egyptenaren','Romeinen','Vikingen','Azteken'],answer:'Egyptenaren',hint:'Denk aan piramides.',explanation:'Farao’s waren heersers van het oude Egypte.',fact:'Sommige farao’s werden in enorme graven begraven.',xp:10},
    {id:'hi5',world:'geschiedenis',prompt:'Waarvoor gebruikte men vroeger een kompas?',options:['Navigeren','Koken','Schrijven','Muziek maken'],answer:'Navigeren',hint:'Het helpt richting bepalen.',explanation:'Een kompas helpt bij navigatie.',fact:'De naald wijst ongeveer naar het magnetische noorden.',xp:10},
    {id:'hi6',world:'geschiedenis',prompt:'Wat deed een ontdekkingsreiziger?',options:['Nieuwe gebieden verkennen','Planeten bouwen','Dieren uitvinden','Elektriciteit maken'],answer:'Nieuwe gebieden verkennen',hint:'Denk aan verre reizen.',explanation:'Ontdekkingsreizigers trokken naar onbekende gebieden.',fact:'Veel reizen veranderden kaarten van de wereld.',xp:10},
    {id:'sc2',world:'wetenschap',prompt:'Welk orgaan pompt bloed door je lichaam?',options:['Hart','Longen','Maag','Hersenen'],answer:'Hart',hint:'Je voelt het kloppen.',explanation:'Het hart pompt bloed rond.',fact:'Je hart klopt ongeveer honderdduizend keer per dag.',xp:10},
    {id:'sc3',world:'wetenschap',prompt:'Welke energiebron gebruikt zonlicht?',options:['Zonnepaneel','Windmolen','Batterij alleen','Stoomtrein'],answer:'Zonnepaneel',hint:'De naam verraadt het al.',explanation:'Zonnepanelen zetten licht om in elektriciteit.',fact:'Zonnecellen bestaan vaak uit silicium.',xp:10},
    {id:'sc4',world:'wetenschap',prompt:'Waarmee bekijk je heel kleine dingen?',options:['Microscoop','Telescoop','Kompas','Thermometer'],answer:'Microscoop',hint:'In een laboratorium zie je hem vaak.',explanation:'Met een microscoop vergroot je kleine structuren.',fact:'Sommige microscopen kunnen cellen zichtbaar maken.',xp:10},
    {id:'sc5',world:'wetenschap',prompt:'Wat meet een thermometer?',options:['Temperatuur','Afstand','Gewicht','Tijd'],answer:'Temperatuur',hint:'Warm of koud.',explanation:'Een thermometer meet temperatuur.',fact:'Temperatuur wordt bij ons vaak in graden Celsius gemeten.',xp:10},
    {id:'sc6',world:'wetenschap',prompt:'Welke kracht trekt dingen naar de aarde?',options:['Zwaartekracht','Magnetisme altijd','Wind','Licht'],answer:'Zwaartekracht',hint:'Daardoor val je weer naar beneden.',explanation:'Zwaartekracht trekt massa’s naar elkaar.',fact:'Op de maan is de zwaartekracht veel zwakker.',xp:10},
    {id:'my2',world:'mysterie',prompt:'Ik ben ’s nachts wakker, heb grote ogen en vlieg stil. Wat ben ik?',options:['Uil','Meeuw','Kip','Pinguïn'],answer:'Uil',hint:'Hoor je soms in het bos.',explanation:'Dat is een uil.',fact:'Uilen kunnen hun kop heel ver draaien.',xp:10},
    {id:'my3',world:'mysterie',prompt:'Wat gebruik je om een gesloten schatkist te openen?',options:['Sleutel','Veer','Kaart','Vergrootglas'],answer:'Sleutel',hint:'Hij past in een slot.',explanation:'Met de juiste sleutel open je het slot.',fact:'Sloten bestaan al duizenden jaren.',xp:10},
    {id:'my4',world:'mysterie',prompt:'Waarop staan vaak routes en symbolen bij een speurtocht?',options:['Kaart','Kussen','Bord','Glas'],answer:'Kaart',hint:'Je gebruikt hem om de weg te vinden.',explanation:'Een kaart helpt je de route vinden.',fact:'Kaarten kunnen ook hoogtes, wegen en grenzen tonen.',xp:10},
    {id:'my5',world:'mysterie',prompt:'Welke tool helpt je kleine aanwijzingen beter bekijken?',options:['Vergrootglas','Hamer','Lepel','Paraplu'],answer:'Vergrootglas',hint:'Het maakt iets groter voor je ogen.',explanation:'Een vergrootglas vergroot details.',fact:'Een bolle lens buigt lichtstralen.',xp:10},
    {id:'my6',world:'mysterie',prompt:'Een voetafdruk is vooral een…',options:['Spoor','Planeet','Instrument','Kleur'],answer:'Spoor',hint:'Een detective zoekt ernaar.',explanation:'Een voetafdruk kan een spoor zijn.',fact:'Sporen kunnen vertellen wie of wat ergens geweest is.',xp:10},
    {id:'an1',world:'dieren',prompt:'Welk dier is het grootste landdier?',options:['Olifant','Leeuw','Paard','Gorilla'],answer:'Olifant',hint:'Hij heeft een slurf.',explanation:'De Afrikaanse olifant is het grootste landdier.',fact:'Een volwassen mannetje kan meer dan 6.000 kilo wegen.',xp:10},
    {id:'an2',world:'dieren',prompt:'Welk dier heeft zwart-witte strepen?',options:['Zebra','Giraffe','Tijgerhaai','Kangoeroe'],answer:'Zebra',hint:'Hij lijkt een beetje op een paard.',explanation:'Een zebra heeft kenmerkende strepen.',fact:'Geen twee zebra’s hebben exact hetzelfde strepenpatroon.',xp:10},
    {id:'an3',world:'dieren',prompt:'Welke vogel kan niet vliegen maar wel goed zwemmen?',options:['Pinguïn','Adelaar','Mus','Uil'],answer:'Pinguïn',hint:'Hij leeft vaak in koude gebieden.',explanation:'Pinguïns kunnen niet vliegen maar zwemmen uitstekend.',fact:'Hun vleugels werken als vinnen.',xp:10},
    {id:'an4',world:'dieren',prompt:'Wat eet een panda vooral?',options:['Bamboe','Vis','Graszaad','Vlees'],answer:'Bamboe',hint:'Een lange groene plant.',explanation:'Reuzenpanda’s eten vooral bamboe.',fact:'Ze besteden veel uren per dag aan eten.',xp:10},
    {id:'an5',world:'dieren',prompt:'Welk dier verandert van rups in een gevleugeld dier?',options:['Vlinder','Slak','Spin','Kikker'],answer:'Vlinder',hint:'Denk aan een cocon.',explanation:'Een rups verandert via een pop in een vlinder.',fact:'Dit heet metamorfose.',xp:10},
    {id:'ea1',world:'aarde',prompt:'Op welk continent ligt Nederland?',options:['Europa','Afrika','Azië','Zuid-Amerika'],answer:'Europa',hint:'Denk aan onze buurlanden.',explanation:'Nederland ligt in Europa.',fact:'Europa is één van de zeven continenten.',xp:10},
    {id:'ea2',world:'aarde',prompt:'Wat is het grootste deel van het aardoppervlak?',options:['Water','Woestijn','Bos','IJs'],answer:'Water',hint:'Oceanen bedekken enorm veel.',explanation:'Het grootste deel van de aarde is bedekt met water.',fact:'Ongeveer 71% van de aarde is water.',xp:10},
    {id:'ea3',world:'aarde',prompt:'Hoe heet gesmolten gesteente dat uit een vulkaan komt?',options:['Lava','Regen','Zand','Klei'],answer:'Lava',hint:'Het is gloeiend heet.',explanation:'Aan het oppervlak heet gesmolten gesteente lava.',fact:'Onder de grond noemen we het magma.',xp:10},
    {id:'ea4',world:'aarde',prompt:'Welke oceaan is de grootste?',options:['Stille Oceaan','Atlantische Oceaan','Noordelijke IJszee','Indische Oceaan'],answer:'Stille Oceaan',hint:'Hij ligt tussen Azië en Amerika.',explanation:'De Stille Oceaan is de grootste oceaan.',fact:'Hij beslaat ongeveer een derde van het aardoppervlak.',xp:10},
    {id:'ea5',world:'aarde',prompt:'Wat gebruiken kaarten om noord, oost, zuid en west te tonen?',options:['Kompasroos','Thermometer','Liniaal alleen','Klok'],answer:'Kompasroos',hint:'Hij toont windrichtingen.',explanation:'Een kompasroos toont de windrichtingen.',fact:'Oude kaarten hadden soms prachtig versierde kompasrozen.',xp:10}
  ];
  const allQuestions=(window.KWIZILLO_QUESTIONS||[]).map(q=>({...q,options:q.options||['Ja','Nee'],xp:q.xp||10}));
  function shuffle(a){return [...a].sort(()=>Math.random()-.5)}
  function startQuiz(world,topicIndex=null){
    currentWorld=world;
    const topicKey=topicIndex===null?null:(TOPIC_KEYS[world]||[])[topicIndex];
    let pool=allQuestions.filter(q=>q.world===world && (!topicKey || q.topic===topicKey));
    const grade=Number(state.group||5);
    const gradePool=pool.filter(q=>(q.groupMin||1)<=grade && (q.groupMax||8)>=grade);
    if(gradePool.length>=6) pool=gradePool;
    pool=shuffle(pool);
    const topicLabel=topicKey ? (window.KWIZILLO_TOPICS?.[world]?.[topicKey]||topicKey) : 'Gemengde quiz';
    quiz={world,topicKey,topicLabel,questions:pool.slice(0,Math.min(10,pool.length)),index:0,score:0,xp:0,answered:false,selected:null,hint:false};
    toast(topicKey?`${topicLabel}: 10 vragen`:`Gemengde ${world}-quiz: 10 vragen`);
    showQuiz();
  }
  function showQuiz(){const q=quiz.questions[quiz.index];if(!q){showResult();return}
    if(q.id==='space-merc-01'&&!quiz.answered){showSpaceMasterQuestion(q);return} renderDynamicQuestion(q)}
  function showSpaceMasterQuestion(q){master(MASTER.spaceQuiz,[
    H(2,1,10,5.5,'Terug',()=>showWorld('ruimte')),
    H(4,64,45,9,'Venus',()=>answerMaster(q,'Venus')),
    H(51,64,45,9,'Mars',()=>answerMaster(q,'Mars')),
    H(4,74,45,9,'Mercurius',()=>answerMaster(q,'Mercurius')),
    H(51,74,45,9,'Aarde',()=>answerMaster(q,'Aarde')),
    H(4,86,31,7,'Hint',()=>toast(q.hint||'Kijk goed naar de eerste planeet bij de zon.'))
  ])}
  function answerMaster(q,value){if(value===q.answer){sfx('good');rewardMercury(q)}else{sfx('bad');state.answered++;save();showWrongMaster(q)}}
  function showWrongMaster(q){master(MASTER.wrong,[
    H(6,88,55,7,'Probeer opnieuw',()=>showSpaceMasterQuestion(q)),
    H(64,88,30,7,'Hint',()=>toast(q.hint||'Kijk nog eens goed.')),
    H(2,1,10,5.5,'Terug',()=>showWorld('ruimte'))
  ],'zoom-in')}
  function rewardMercury(q){sfx('reward');state.answered++;state.correct++;state.xp=(state.xp||0)+(q.xp||10);state.coins=(state.coins||245)+10;if(!state.collection.includes('Mercurius'))state.collection.push('Mercurius');save();quiz.score++;quiz.xp+=q.xp||10;quiz.answered=true;
    master(MASTER.mercuryReward,[H(22,75.2,58,7.5,'Volgende vraag',()=>{quiz.index++;quiz.answered=false;showQuiz()}),H(29,84,43,5.7,'Meer weten',()=>toast(q.fact||q.explanation))],'zoom-in')}
  const answerIcon=v=>{
    const x=String(v||'').toLowerCase();
    const exact={mercuur:'☿',mercurius:'☿',venus:'🟠',mars:'🔴',aarde:'🌍',jupiter:'🪐',saturnus:'🪐',neptunus:'🔵','de maan':'🌙','de zon':'☀️','een ster':'⭐',astronaut:'🧑‍🚀',hart:'❤️',longen:'🫁',hersenen:'🧠',uil:'🦉',olifant:'🐘',zebra:'🦓',pinguïn:'🐧',vlinder:'🦋',europa:'🌍',water:'🌊',lava:'🌋',jachtluipaard:'🐆',dolfijn:'🐬',octopus:'🐙',piano:'🎹',sleutel:'🔑',kompas:'🧭',parijs:'🗼',rome:'🏛️'};
    if(exact[x])return exact[x];
    if(/planeet|sterren|melkweg|supernova|zwart gat/.test(x))return '🌌';
    if(/raket|lanc|capsule|satelliet/.test(x))return '🚀';
    if(/kasteel|ridder|harnas|burcht/.test(x))return '🏰';
    if(/romein|legioen|senator|latijn|aquaduct/.test(x))return '🏛️';
    if(/egypte|farao|piramide|mummie|nijl|hiëro/.test(x))return '🔺';
    if(/kaart|route|gps|coördinaat|kompas/.test(x))return '🗺️';
    if(/energie|zonne|wind|batterij|accu|elektr/.test(x))return '⚡';
    if(/microscoop|proef|thermometer|maatcilinder/.test(x))return '🔬';
    if(/dier|kat|hond|aap|gorilla|jaguar|kameleon|krab|vis|walvis|haai|paard/.test(x))return '🐾';
    if(/regen|wolk|wind|klimaat|mist|bliksem/.test(x))return '🌦️';
    if(/oceaan|rivier|gletsjer|delta/.test(x))return '🌊';
    return '⭐';
  };
  function renderDynamicQuestion(q){const p=Math.round(((quiz.index)/Math.max(1,quiz.questions.length))*100);const bg=worldAsset(quiz.world);const art=questionArt(q);const f=frame(`<section class="quiz-shell fade-in"><img class="world-bg" src="${bg}" alt=""><div class="voice-pill">${quiz.topicLabel?`${quiz.topicLabel} · `:''}🔊 ${state.voice === 'Stil' ? 'Stem uit' : state.voice}</div><div class="quiz-ui"><div class="q-top"><button class="back-orb" id="qBack">‹</button><div class="q-logo">Kwizillo</div><div class="top-chips"><div class="chip">🪙 ${state.coins}</div><div class="chip">🔥 ${state.streak} dagen</div></div></div><div class="progress-panel"><span>Vraag ${quiz.index+1} van ${quiz.questions.length}</span><div class="progress-track"><div class="progress-fill" style="width:${Math.max(8,p)}%"></div></div><span>+${q.xp||10} XP</span></div><div class="question-panel"><h1 class="question-title">${q.prompt}</h1>${quiz.hint?`<div class="clue">💡 ${q.hint||'Kijk goed naar de aanwijzingen.'}</div>`:''}<div class="illustration"><img src="${art}" alt="${q.answer||''}"></div><div class="answers">${q.options.map((o,i)=>`<button class="answer" data-a="${encodeURIComponent(o)}"><span>${answerIcon(o)}&nbsp;&nbsp;</span>${o}</button>`).join('')}</div><div class="quiz-actions"><button class="action hint" id="hintBtn">💡 Hint</button><button class="action next" id="skipBtn">Andere vraag ›</button></div></div></div></section>`);
    f.querySelector('#qBack').onclick=()=>showWorld(quiz.world);f.querySelector('#hintBtn').onclick=()=>{sfx('tap'); quiz.hint=true; renderDynamicQuestion(q); speak(q.hint||'Kijk goed naar de aanwijzingen.');};f.querySelector('#skipBtn').onclick=()=>{sfx('tap'); quiz.index++;quiz.hint=false;showQuiz()};f.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>evaluateDynamic(q,decodeURIComponent(b.dataset.a),b));setTimeout(()=>speak(q.prompt),120);}
  function evaluateDynamic(q,value,button){const correct=value===q.answer;state.answered++;sfx(correct?'good':'bad');if(correct){state.correct++;state.xp=(state.xp||0)+(q.xp||10);state.coins=(state.coins||245)+2;quiz.score++;quiz.xp+=q.xp||10;button.classList.add('correct')}else button.classList.add('wrong');save();setTimeout(()=>showFeedback(q,correct),220)}
  function showFeedback(q,correct){const f=app.querySelector('.game-frame');const layer=document.createElement('div');layer.className='feedback-float';layer.innerHTML=`<div class="feedback-card ${correct?'good':''}"><div class="feedback-icon">${correct?'✅':'💡'}</div><h2>${correct?'Goed gedaan!':'Bijna goed!'}</h2><p>${correct?q.explanation||`Het juiste antwoord is ${q.answer}.`:`Het juiste antwoord is <strong>${q.answer}</strong>. ${q.hint||''}`}</p>${correct?`<div class="collect-pop">⭐ +${q.xp||10} XP &nbsp; 🪙 +2</div>`:''}<p>${q.fact?`Wist je dat? ${q.fact}`:''}</p><button class="action next" id="feedbackNext">${quiz.index+1>=quiz.questions.length?'Bekijk resultaat':'Volgende vraag'} ›</button></div>`;f.appendChild(layer);speak(correct?`Goed gedaan. ${q.explanation || `Het juiste antwoord is ${q.answer}.`}`:`Bijna goed. Het juiste antwoord is ${q.answer}. ${q.hint || ''}`);layer.querySelector('#feedbackNext').onclick=()=>{sfx('tap'); quiz.index++;quiz.hint=false;showQuiz()}}
  function showResult(){master(MASTER.result,[...gearHotspots(),H(20,77,61,7,'Nog een quiz',()=>startQuiz(currentWorld)),H(22,85,57,6,'Naar collectie',showCollection),...bottomNavHotspots()],'zoom-in')}
  function showAchievements(){lastView='achievements';master(MASTER.achievements,[...gearHotspots(),...bottomNavHotspots()])}
  function showCollection(){lastView='collection';master(MASTER.collection,[...gearHotspots(),...bottomNavHotspots()])}
  function showStats(){lastView='stats';master(MASTER.stats,[...gearHotspots(),...bottomNavHotspots()])}
  function showParent(){lastView='parent';const f=master(MASTER.parent,[...gearHotspots(),...bottomNavHotspots(),H(50,44,46,18,'Geluid & stem',showSoundSettings),H(51,50,14,11,'Stem Milo',()=>{state.voice='Milo';save();speak('Hoi! Ik ben Milo. Klaar om te spelen?');showParent()}),H(65,50,14,11,'Stem Luna',()=>{state.voice='Luna';save();speak('Hoi! Ik ben Luna. Zullen we samen ontdekken?');showParent()}),H(79,50,15,11,'Stem uit',()=>{state.voice='Stil';save();stopAudio();showParent()}),H(4,44,45,18,'Tijdslimiet',()=>{state.timeLimitOn=!state.timeLimitOn;save();toast(state.timeLimitOn?`Tijdslimiet: ${state.timeLimit||45} minuten`:'Tijdslimiet uit');showParent()}),H(4,62,45,18,'Moeilijkheid / groep',()=>{state.group=state.group>=8?1:state.group+1;save();toast(`Groep ${state.group}`);showParent()}),H(50,62,46,18,'Privacy & veiligheid',()=>toast('Privacy-instellingen zijn actief.')),H(3,82,94,8,'Rapport & delen',()=>toast('Rapportage wordt voorbereid.'))]);renderParentNativeControls(f)}
  window.addEventListener('keydown',e=>{if(e.key==='Escape'){if(lastView==='world')showHome(false);else showHome(false)}});
  refreshVoiceStatus();const introDone=sessionStorage.getItem('kwizillo-intro'); if(!introDone){sessionStorage.setItem('kwizillo-intro','1');showHome(true)}else showHome(false);
})();
