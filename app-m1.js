(() => {
  const app = document.getElementById('app');
  const core = window.KWIZILLO_CORE;
  const questions = window.KWIZILLO_QUESTIONS || [];
  const topics = window.KWIZILLO_TOPICS || {};
  const debug = new URLSearchParams(location.search).has('debug');

  const MASTER = {
    home:'assets/home.png', ruimte:'assets/world_space.png', geschiedenis:'assets/world_history.png',
    wetenschap:'assets/world_science.png', mysterie:'assets/world_mystery.png', dieren:'assets/world_animals.png', aarde:'assets/world_earth.png',
    achievements:'assets/achievements.png', collection:'assets/collection.png', stats:'assets/stats.png', parent:'assets/parent.png', result:'assets/result.png'
  };
  const MOTION = {
    home:'https://d8j0ntlcm91z4.cloudfront.net/user_2yYu0y6DQa27eWwkUPG52d9yApj/hf_20260911_210153_bf123057-1f86-48e5-aac9-10efd794746a.mp4',
    ruimte:'https://d8j0ntlcm91z4.cloudfront.net/user_2yYu0y6DQa27eWwkUPG52d9yApj/hf_20260911_205120_165df461-61b6-421b-9717-ea92deb8fe91.mp4',
    mysterie:'https://d8j0ntlcm91z4.cloudfront.net/user_2yYu0y6DQa27eWwkUPG52d9yApj/hf_20260911_210153_3a36c872-6cf6-4e2e-9eaa-1623dd0835a7.mp4'
  };
  const TOPIC_KEYS = {
    ruimte:['zonnestelsel','sterren_planeten','astronauten','raket_avontuur'],
    geschiedenis:['egyptenaren','ridders_kastelen','romeinen','ontdekkingsreizigers'],
    wetenschap:['slimme_proefjes','lichaam','uitvindingen','natuur_energie'],
    mysterie:['raadsels','verborgen_schatten','natuurmysteries','speurtocht'],
    dieren:['snelle_dieren','baby_dieren','waterdieren','jungle'],
    aarde:['continenten_landen','weer_klimaat','oceanen_natuur','kaarten_navigatie']
  };

  const KEY='kwizillo-v4-state';
  const initial={coins:245,streak:7,level:5,xp:320,voice:'Milo',soundOn:true,musicOn:true,sfxVolume:.72,musicVolume:.24,musicTrack:'magical',timeLimitOn:true,timeLimit:45,group:5,answered:0,correct:0,quizzesPlayed:0,lastWorld:'ruimte'};
  let state=Object.assign({},initial,JSON.parse(localStorage.getItem(KEY)||'{}'));
  let currentWorld=state.lastWorld||'ruimte';
  let quiz=null;
  let lastView='home';
  const CONFIG=window.KWIZILLO_CONFIG||{};

  const save=()=>localStorage.setItem(KEY,JSON.stringify(state));
  const sfx=(kind='tap')=>AUDIO.play(kind);

  const AUDIO=(()=>{
    const paths={tap:'assets/audio/tap.wav',good:'assets/audio/correct.wav',bad:'assets/audio/wrong.wav',reward:'assets/audio/reward.wav',world:'assets/audio/world.wav'};
    const tracks={
      magical:{id:'magical',src:'assets/audio/music_magical_loop.wav'}, adventure:{id:'adventure',src:'assets/audio/music_adventure_loop.wav'},
      space:{id:'space',src:'assets/audio/music_space_loop.wav'}, calm:{id:'calm',src:'assets/audio/music_calm_loop.wav'}
    };
    const preload={}; Object.entries(paths).forEach(([k,src])=>{const a=new Audio(src);a.preload='auto';preload[k]=a});
    let ctx=null,musicMaster=null,currentSource=null,currentGain=null,currentId=null,ducked=false;const buffers=new Map();
    function ensureCtx(){if(!ctx){const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)return null;ctx=new Ctx();musicMaster=ctx.createGain();musicMaster.connect(ctx.destination);musicMaster.gain.value=0}return ctx}
    function targetGain(){return state.musicOn===false?0:Math.max(0,Math.min(1,Number(state.musicVolume??.24)))*(ducked?.34:1)}
    function ramp(seconds=.18){if(!ctx||!musicMaster)return;const now=ctx.currentTime;musicMaster.gain.cancelScheduledValues(now);musicMaster.gain.setValueAtTime(musicMaster.gain.value,now);musicMaster.gain.linearRampToValueAtTime(targetGain(),now+seconds)}
    async function load(id){const t=tracks[id]||tracks.magical;if(buffers.has(t.id))return buffers.get(t.id);const c=ensureCtx();if(!c)return null;const r=await fetch(t.src);const b=await c.decodeAudioData((await r.arrayBuffer()).slice(0));buffers.set(t.id,b);return b}
    async function start(id=state.musicTrack||'magical',cross=.35){const c=ensureCtx();if(!c)return;if(c.state==='suspended')await c.resume().catch(()=>{});const t=tracks[id]||tracks.magical;const buffer=await load(t.id);const now=c.currentTime;const src=c.createBufferSource();const g=c.createGain();src.buffer=buffer;src.loop=true;src.loopStart=0;src.loopEnd=buffer.duration;g.gain.setValueAtTime(0,now);src.connect(g);g.connect(musicMaster);src.start(now);g.gain.linearRampToValueAtTime(1,now+cross);const old=currentSource,oldGain=currentGain;currentSource=src;currentGain=g;currentId=t.id;state.musicTrack=t.id;save();if(old&&oldGain){try{oldGain.gain.linearRampToValueAtTime(0,now+cross);old.stop(now+cross+.05)}catch(e){}}ramp(.15)}
    async function unlock(){const c=ensureCtx();if(!c)return;if(c.state==='suspended')await c.resume().catch(()=>{});if(state.musicOn!==false&&!currentSource)await start(state.musicTrack||'magical',.2).catch(()=>{});else ramp(.1)}
    function play(kind='tap'){if(state.soundOn===false)return;try{const a=(preload[kind]||preload.tap).cloneNode();a.volume=Math.max(0,Math.min(1,Number(state.sfxVolume??.72)))*(kind==='tap'?.42:.68);a.play().catch(()=>{})}catch(e){}}
    function duck(on){ducked=!!on;ramp(on?.12:.28)}
    document.addEventListener('pointerdown',unlock,{once:true,capture:true});
    return{play,duck,unlock,start,tracks,get currentId(){return currentId}};
  })();

  let activeAudio=null;
  let speechAbort=null;
  let speechGeneration=0;
  function stopSpeech(){
    speechGeneration++;
    AUDIO.duck(false);
    try{speechAbort?.abort()}catch(e){}
    speechAbort=null;
    try{if(activeAudio){activeAudio.pause();activeAudio.currentTime=0;activeAudio.src='';activeAudio=null}}catch(e){}
    try{speechSynthesis?.cancel()}catch(e){}
  }
  async function speak(text){
    if(!text||state.voice==='Stil')return;
    stopSpeech();
    const generation=speechGeneration;
    const abort=new AbortController(); speechAbort=abort;
    AUDIO.duck(true);
    try{
      if(!CONFIG.elevenLabsProxyUrl){AUDIO.duck(false);return}
      const r=await fetch(CONFIG.elevenLabsProxyUrl,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text,voice:state.voice}),signal:abort.signal});
      if(!r.ok)throw new Error(`TTS ${r.status}`);
      if(generation!==speechGeneration)return;
      const blob=await r.blob(); if(generation!==speechGeneration)return;
      const url=URL.createObjectURL(blob); const audio=new Audio(url); activeAudio=audio; audio.volume=state.voice==='Luna'?1:.88;
      audio.onended=()=>{URL.revokeObjectURL(url);if(activeAudio===audio)activeAudio=null;AUDIO.duck(false)};
      audio.onerror=()=>{URL.revokeObjectURL(url);AUDIO.duck(false)};
      await audio.play();
    }catch(e){if(e.name!=='AbortError')AUDIO.duck(false)}
  }
  function speakQuestion(q){return speak(core.buildQuestionSpeech(q))}

  const H=(x,y,w,h,label,onClick)=>({x,y,w,h,label,onClick});
  function frame(content=''){stopSpeech();app.innerHTML=`<section class="game-frame ${debug?'debug':''}">${content}</section>`;return app.firstElementChild}
  function hsMarkup(h,i){return `<button class="hotspot" aria-label="${h.label}" data-hs="${i}" style="left:${h.x}%;top:${h.y}%;width:${h.w}%;height:${h.h}%">${h.label}</button>`}
  function master(asset,hotspots=[],cls='fade-in'){
    const f=frame(`<img class="master-art ${cls}" src="${asset}" alt=""><div>${hotspots.map(hsMarkup).join('')}</div>`);
    hotspots.forEach((h,i)=>f.querySelector(`[data-hs="${i}"]`).onclick=()=>{stopSpeech();sfx('tap');h.onClick()});
    return f;
  }
  function toast(text){const f=app.querySelector('.game-frame');if(!f)return;const t=document.createElement('div');t.className='toast';t.textContent=text;f.appendChild(t);setTimeout(()=>t.remove(),2200)}
  function gearHotspots(){return [H(2,1,11,5.5,'Instellingen',showParent)]}
  function bottomNavHotspots(){return [H(0,91.3,20,8.7,'Home',()=>showHome(false)),H(20,91.3,20,8.7,'Prestaties',showAchievements),H(40,91.3,20,8.7,'Mijn collectie',showCollection),H(60,91.3,20,8.7,'Statistieken',showStats),H(80,91.3,20,8.7,'Meer / Ouderzone',showParent)]}

  function playMotion(kind,next,label){const url=MOTION[kind];if(!url){next();return}const f=frame(`<div class="motion fade-in"><video autoplay muted playsinline preload="auto" src="${url}"></video><button class="motion-skip">Overslaan</button><div class="motion-badge">${label||''}</div></div>`);let done=false;const finish=()=>{if(done)return;done=true;next()};f.querySelector('.motion-skip').onclick=finish;const v=f.querySelector('video');v.onended=finish;v.onerror=finish;setTimeout(finish,4700)}

  function showHome(withMotion=false){
    lastView='home'; const open=()=>master(MASTER.home,[...gearHotspots(),H(7,22,43,14,'Ruimtewereld',()=>enterWorld('ruimte')),H(57,20,39,15,'Dierenwereld',()=>enterWorld('dieren')),H(4,35,48,18,'Aardewereld',()=>enterWorld('aarde')),H(54,37,43,17,'Geschiedeniswereld',()=>enterWorld('geschiedenis')),H(4,51,49,17,'Wetenschapwereld',()=>enterWorld('wetenschap')),H(54,52,43,17,'Mysteriewereld',()=>enterWorld('mysterie')),H(22,69,55,7.5,'Start avontuur',()=>enterWorld(currentWorld)),H(5,80,27,8.2,'Stem Milo',()=>selectVoice('Milo')),H(33,80,27,8.2,'Stem Luna',()=>selectVoice('Luna')),H(61,80,25,8.2,'Zonder stem',()=>selectVoice('Stil')),...bottomNavHotspots()]);
    withMotion?playMotion('home',open,'Welkom in Kwizillo'):open();
  }
  function selectVoice(voice){state.voice=voice;save();showHome(false);if(voice!=='Stil')setTimeout(()=>speak(voice==='Milo'?'Hoi! Ik ben Milo. Klaar om te spelen?':'Hoi! Ik ben Luna. Zullen we samen ontdekken?'),100)}
  function enterWorld(world){currentWorld=world;state.lastWorld=world;save();sfx('world');const open=()=>showWorld(world);if(world==='ruimte'||world==='mysterie')playMotion(world,open,world==='ruimte'?'Op reis naar de sterren…':'Het portaal wordt geopend…');else open()}
  const worldAsset=world=>MASTER[world]||MASTER.ruimte;

  function showWorld(world){
    lastView='world';currentWorld=world;const actions=[0,1,2,3].map(n=>H(n%2?50:3,n<2?46:59,47,12,(topics[world]&&topics[world][TOPIC_KEYS[world][n]])||`Onderwerp ${n+1}`,()=>startQuiz(world,n)));
    master(worldAsset(world),[...gearHotspots(),...actions,H(22,82,56,7.5,'Start gemengde quiz',()=>startQuiz(world,null)),...bottomNavHotspots()]);
  }

  function startQuiz(world,topicIndex=null){
    stopSpeech();currentWorld=world;const topicKey=topicIndex===null?null:(TOPIC_KEYS[world]||[])[topicIndex];const topicLabel=topicKey?(topics[world]?.[topicKey]||topicKey):'Gemengde quiz';const selected=core.selectQuestions({questions,world,topicKey,grade:Number(state.group||5),limit:10});
    if(!selected.length){toast('Voor dit onderwerp zijn nog geen vragen beschikbaar.');showWorld(world);return}
    quiz=core.createSession({world,topicKey,topicLabel,questions:selected});showQuiz();
  }
  function showQuiz(){if(!quiz)return showWorld(currentWorld);const q=quiz.questions[quiz.index];if(!q){showResult();return}quiz.hint=false;renderQuestion(q)}

  const SCENES={
    zonnestelsel:['☀️','🌀','✨'],sterren_planeten:['🔭','✨','🌌'],astronauten:['🛰️','🧑‍🚀','🌍'],raket_avontuur:['🚀','☁️','✨'],
    egyptenaren:['🏜️','🔺','☀️'],ridders_kastelen:['🏰','🛡️','🌳'],romeinen:['🏛️','🛣️','🏺'],ontdekkingsreizigers:['⛵','🗺️','🌊'],
    slimme_proefjes:['🧪','🔬','✨'],lichaam:['🫀','🫁','🧠'],uitvindingen:['⚙️','💡','🛠️'],natuur_energie:['☀️','🌬️','💧'],
    raadsels:['❓','🔎','✨'],verborgen_schatten:['🗺️','🧭','✨'],natuurmysteries:['🌲','🌙','🔎'],speurtocht:['👣','🔎','🗺️'],
    snelle_dieren:['💨','🐾','🌾'],baby_dieren:['🥚','🐾','🌱'],waterdieren:['🌊','🫧','🐚'],jungle:['🌿','🐾','🌴'],
    continenten_landen:['🌍','🗺️','📍'],weer_klimaat:['☁️','🌦️','🌬️'],oceanen_natuur:['🌊','🐚','⛰️'],kaarten_navigatie:['🧭','🗺️','📍']
  };
  const PALETTES={ruimte:['#0b1d5a','#2f66ed','#8edcff'],geschiedenis:['#73451c','#d99b46','#ffe2a2'],wetenschap:['#0f4778','#21a9ed','#b7f4ff'],mysterie:['#2c0c58','#7332d8','#ffd46c'],dieren:['#1b592b','#56b95c','#dbf4ae'],aarde:['#0e5684','#39a7d6','#b7efff']};
  function questionArt(q){
    if(q.imageAsset)return q.imageAsset;
    const [a,b,c]=PALETTES[q.world]||PALETTES.ruimte;const scene=SCENES[q.topic]||['✨','🔎','⭐'];
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 720"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${b}"/><stop offset="1" stop-color="${a}"/></linearGradient><radialGradient id="r"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient></defs><rect width="1200" height="720" rx="50" fill="url(#g)"/><circle cx="950" cy="150" r="240" fill="url(#r)"/><circle cx="180" cy="620" r="240" fill="#fff" opacity=".09"/><path d="M0 590 C220 500 330 660 540 575 S900 470 1200 575 V720 H0Z" fill="#fff" opacity=".13"/><g text-anchor="middle" font-family="Apple Color Emoji,Segoe UI Emoji,sans-serif"><text x="600" y="410" font-size="220">${scene[0]}</text><text x="310" y="345" font-size="120" opacity=".92">${scene[1]}</text><text x="910" y="330" font-size="105" opacity=".92">${scene[2]}</text></g><g fill="#fff" opacity=".7"><circle cx="140" cy="130" r="8"/><circle cx="1070" cy="520" r="7"/><circle cx="1030" cy="100" r="5"/><circle cx="250" cy="500" r="6"/></g></svg>`;
    return 'data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(svg);
  }

  function renderQuestion(q){
    const p=Math.round((quiz.index/Math.max(1,quiz.questions.length))*100);const bg=worldAsset(quiz.world);const art=questionArt(q);const f=frame(`<section class="quiz-shell fade-in"><img class="world-bg" src="${bg}" alt=""><div class="voice-pill">${quiz.topicLabel} · ${state.voice==='Stil'?'🔇':'🔊 '+state.voice}</div><div class="quiz-ui"><div class="q-top"><button class="back-orb" id="qBack">‹</button><div class="q-logo">Kwizillo</div><div class="top-chips"><div class="chip">🪙 ${state.coins}</div><div class="chip">🔥 ${state.streak} dagen</div></div></div><div class="progress-panel"><span>Vraag ${quiz.index+1} van ${quiz.questions.length}</span><div class="progress-track"><div class="progress-fill" style="width:${Math.max(8,p)}%"></div></div><span>+${q.xp||10} XP</span></div><div class="question-panel"><h1 class="question-title">${q.prompt}</h1><div class="illustration"><img src="${art}" alt="Illustratie bij de vraag"></div><div class="answers">${q.options.map((o,i)=>`<button class="answer" data-a="${encodeURIComponent(o)}"><span class="answer-letter">${['A','B','C','D'][i]||i+1}</span>${o}</button>`).join('')}</div><div class="quiz-actions"><button class="action hint" id="hintBtn">💡 Hint</button><button class="action next" id="skipBtn">Andere vraag ›</button></div></div></div></section>`);
    const cancelThen=fn=>()=>{stopSpeech();fn()};
    f.querySelector('#qBack').onclick=cancelThen(()=>showWorld(quiz.world));
    f.querySelector('#hintBtn').onclick=cancelThen(()=>{sfx('tap');toast(q.hint||'Kijk goed naar de aanwijzingen.');speak(q.hint||'Kijk goed naar de aanwijzingen.')});
    f.querySelector('#skipBtn').onclick=cancelThen(()=>{sfx('tap');nextQuestion()});
    f.querySelectorAll('[data-a]').forEach(btn=>btn.onclick=()=>{stopSpeech();evaluate(q,decodeURIComponent(btn.dataset.a),btn)});
    setTimeout(()=>{if(app.contains(f))speakQuestion(q)},140);
  }

  function evaluate(q,value,button){
    const result=core.recordAnswer(quiz,q,value);if(!result.accepted)return;
    const answerButtons=[...app.querySelectorAll('.answer')];answerButtons.forEach(b=>b.disabled=true);
    state.answered++;if(result.correct){state.correct++;state.xp+=(q.xp||10);state.coins+=2;sfx('good');button.classList.add('correct')}else{sfx('bad');button.classList.add('wrong');const correctBtn=answerButtons.find(b=>decodeURIComponent(b.dataset.a)===q.answer);correctBtn?.classList.add('correct')}
    save();setTimeout(()=>showFeedback(q,result.correct),180);
  }

  function showFeedback(q,correct){const f=app.querySelector('.game-frame');if(!f)return;const layer=document.createElement('div');layer.className='feedback-float';layer.innerHTML=`<div class="feedback-card ${correct?'good':''}"><div class="feedback-icon">${correct?'✅':'💡'}</div><h2>${correct?'Goed gedaan!':'Bijna goed!'}</h2><p>${correct?(q.explanation||'Dat klopt!'):`Het juiste antwoord is <strong>${q.answer}</strong>. ${q.hint||''}`}</p>${correct?`<div class="collect-pop">⭐ +${q.xp||10} XP &nbsp; 🪙 +2</div>`:''}${q.fact?`<p>Wist je dat? ${q.fact}</p>`:''}<button class="action next" id="feedbackNext">${quiz.index+1>=quiz.questions.length?'Bekijk resultaat':'Volgende vraag'} ›</button></div>`;f.appendChild(layer);speak(correct?`Goed gedaan. ${q.explanation||''}`:`Bijna goed. Het juiste antwoord is ${q.answer}. ${q.hint||''}`);layer.querySelector('#feedbackNext').onclick=()=>{stopSpeech();sfx('tap');nextQuestion()}}
  function nextQuestion(){quiz.index++;quiz.hint=false;showQuiz()}

  function showResult(){
    stopSpeech();state.quizzesPlayed=(state.quizzesPlayed||0)+1;save();const total=quiz?.questions.length||0;const score=quiz?.score||0;const xp=quiz?.xp||0;const f=frame(`<img class="master-art fade-in" src="${MASTER.result}" alt=""><div class="result-native"><div class="result-native-score">${score}/${total} goed · +${xp} XP</div><button id="againBtn">Nog een quiz</button><button id="collectionBtn" class="secondary">Naar mijn collectie</button></div>`);f.querySelector('#againBtn').onclick=()=>{stopSpeech();sfx('tap');startQuiz(currentWorld,quiz?.topicKey?TOPIC_KEYS[currentWorld].indexOf(quiz.topicKey):null)};f.querySelector('#collectionBtn').onclick=()=>{stopSpeech();sfx('tap');showCollection()};
  }

  function showAchievements(){lastView='achievements';master(MASTER.achievements,[...gearHotspots(),...bottomNavHotspots()])}
  function showCollection(){lastView='collection';master(MASTER.collection,[...gearHotspots(),...bottomNavHotspots()])}
  function showStats(){lastView='stats';master(MASTER.stats,[...gearHotspots(),...bottomNavHotspots()])}
  function showParent(){lastView='parent';master(MASTER.parent,[...gearHotspots(),...bottomNavHotspots(),H(50,44,46,18,'Geluid & stem',()=>toast('Geluidinstellingen blijven in de V3.6 basis beschikbaar.')),H(4,62,45,18,'Moeilijkheid / groep',()=>{state.group=state.group>=8?1:state.group+1;save();toast(`Groep ${state.group}`)})])}

  window.addEventListener('keydown',e=>{if(e.key==='Escape'){stopSpeech();lastView==='world'?showHome(false):showHome(false)}});
  const introDone=sessionStorage.getItem('kwizillo-intro-v4');if(!introDone){sessionStorage.setItem('kwizillo-intro-v4','1');showHome(true)}else showHome(false);
})();
