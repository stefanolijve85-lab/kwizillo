(()=>{
  const K=window.KWIZILLO_M1;
  const H=(x,y,w,h,label,onClick)=>({x,y,w,h,label,onClick});
  const esc=s=>String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[m]));
  const WORLD_META={
    ruimte:{icon:'🚀',title:'Ruimtewereld',sub:'Reis langs planeten, sterren en raketten'},
    dieren:{icon:'🐾',title:'Dierenwereld',sub:'Ontdek dieren op land, in de jungle en in zee'},
    aarde:{icon:'🌍',title:'Aardewereld',sub:'Verken landen, oceanen, weer en kaarten'},
    geschiedenis:{icon:'🏛️',title:'Geschiedeniswereld',sub:'Stap in de tijd van farao’s, ridders en ontdekkers'},
    wetenschap:{icon:'🧪',title:'Wetenschapwereld',sub:'Probeer, ontdek en begrijp hoe dingen werken'},
    mysterie:{icon:'🔎',title:'Mysteriewereld',sub:'Los raadsels op en volg slimme aanwijzingen'}
  };
  const WORLD_ORDER=['ruimte','dieren','aarde','geschiedenis','wetenschap','mysterie'];
  const MASCOTS=[
    {id:'milo',name:'Milo',icon:'🤖',need:0,desc:'Je slimme robotmaatje'},
    {id:'comet',name:'Comet',icon:'🌠',need:5,desc:'Ruimtemaatje'},
    {id:'pootje',name:'Pootje',icon:'🐾',need:12,desc:'Dierenvriend'},
    {id:'terra',name:'Terra',icon:'🌱',need:20,desc:'Aardebeschermer'},
    {id:'sparky',name:'Sparky',icon:'⚗️',need:35,desc:'Proefjesfan'},
    {id:'lumi',name:'Lumi',icon:'🔮',need:50,desc:'Mysteriezoeker'}
  ];

  function ensureProgress(){
    K.state.progress ||= {worlds:{},topics:{},correctQuestionIds:[]};
    K.state.progress.worlds ||= {};
    K.state.progress.topics ||= {};
    K.state.progress.correctQuestionIds ||= [];
    K.state.selectedMascot ||= 'milo';
    K.save();
    return K.state.progress;
  }
  const progress=()=>ensureProgress();
  function worldStat(world){const p=progress();return p.worlds[world]||(p.worlds[world]={answered:0,correct:0,quizzes:0,xp:0})}
  function topicStat(topic){const p=progress();return p.topics[topic]||(p.topics[topic]={answered:0,correct:0})}
  const accuracy=s=>s?.answered?Math.round(s.correct/s.answered*100):0;
  const totalCorrect=()=>Number(K.state.correct||0);
  const unlockedMascots=()=>MASCOTS.filter(m=>totalCorrect()>=m.need);
  function recordAnswerProgress(){
    document.addEventListener('click',e=>{
      const b=e.target.closest?.('.answer');if(!b||!K.quiz)return;
      const q=K.quiz.questions?.[K.quiz.index];if(!q)return;
      K.quiz._progressRecorded ||= {};
      if(K.quiz._progressRecorded[q.id])return;
      K.quiz._progressRecorded[q.id]=true;
      const value=decodeURIComponent(b.dataset.a||'');const correct=value===q.answer;
      const ws=worldStat(q.world),ts=topicStat(q.topic);ws.answered++;ts.answered++;
      if(correct){ws.correct++;ts.correct++;ws.xp+=Number(q.xp||10);if(!progress().correctQuestionIds.includes(q.id))progress().correctQuestionIds.push(q.id)}
      K.save();
    });
  }
  recordAnswerProgress();
  const originalShowResult=K.showResult;
  K.showResult=()=>{
    if(K.quiz&&!K.quiz._quizCounted){K.quiz._quizCounted=true;worldStat(K.quiz.world).quizzes++;K.save()}
    return originalShowResult();
  };

  function hs(h,i){return`<button class="hotspot" aria-label="${h.label}" data-hs="${i}" style="left:${h.x}%;top:${h.y}%;width:${h.w}%;height:${h.h}%">${h.label}</button>`}
  function master(asset,spots=[],cls='fade-in'){
    const f=K.frame(`<img class="master-art ${cls}" src="${asset}" alt=""><div>${spots.map(hs).join('')}</div>`);
    spots.forEach((h,i)=>f.querySelector(`[data-hs="${i}"]`).onclick=()=>{K.stopSpeech();K.sfx('tap');h.onClick()});return f
  }
  const gear=()=>[H(2,1,11,5.5,'Instellingen',K.showParent)];
  const nav=()=>[
    H(0,91.3,20,8.7,'Home',()=>K.showHome(false)),H(20,91.3,20,8.7,'Prestaties',K.showAchievements),H(40,91.3,20,8.7,'Mijn collectie',()=>K.showCollection('worlds')),H(60,91.3,20,8.7,'Statistieken',K.showStats),H(80,91.3,20,8.7,'Meer / Ouderzone',K.showParent)
  ];
  function bottomNav(active=''){
    const defs=[['home','⌂','Home'],['achievements','🏆','Prestaties'],['collection','🃏','Collectie'],['stats','▥','Statistieken'],['parent','⚙','Meer']];
    return `<nav class="native-bottom-nav" aria-label="Hoofdnavigatie">${defs.map(([id,icon,label])=>`<button data-nav="${id}" class="${active===id?'active':''}">${icon}<small>${label}</small></button>`).join('')}</nav>`
  }
  function bindNav(f){
    const map={home:()=>K.showHome(false),achievements:K.showAchievements,collection:()=>K.showCollection('worlds'),stats:K.showStats,parent:K.showParent};
    f.querySelectorAll('[data-nav]').forEach(b=>b.onclick=()=>{K.stopSpeech();K.sfx('tap');map[b.dataset.nav]?.()})
  }
  function nativeScreen({cls='',title,subtitle='',body,active='',back=()=>K.showHome(false)}){
    const f=K.frame(`<section class="native-panel-screen ${cls} fade-in"><div class="native-panel-glow"></div><header class="panel-head"><button class="panel-back" aria-label="Terug">‹</button><div><div class="panel-kicker">KWIZILLO</div><h1>${esc(title)}</h1>${subtitle?`<p>${esc(subtitle)}</p>`:''}</div><button class="panel-settings" aria-label="Instellingen">⚙</button></header><main class="panel-scroll">${body}</main>${bottomNav(active)}</section>`);
    f.querySelector('.panel-back').onclick=()=>{K.stopSpeech();K.sfx('tap');back()};f.querySelector('.panel-settings').onclick=()=>{K.stopSpeech();K.sfx('tap');K.showParent()};bindNav(f);return f
  }
  function motion(kind,next,label){const url=K.MOTION[kind];if(!url)return next();const f=K.frame(`<div class="motion fade-in"><video autoplay muted playsinline preload="auto" src="${url}"></video><button class="motion-skip">Overslaan</button><div class="motion-badge">${label||''}</div></div>`);let done=false;const finish=()=>{if(done)return;done=true;next()};f.querySelector('.motion-skip').onclick=finish;const v=f.querySelector('video');v.onended=finish;v.onerror=finish;setTimeout(finish,4700)}
  function voiceFrames(f){[{name:'Milo',x:5.1,w:26.2},{name:'Luna',x:32.9,w:26.1},{name:'Stil',x:60.1,w:20.3}].forEach(d=>{const e=document.createElement('div');e.className=`voice-choice-frame ${K.state.voice===d.name?'selected':'unselected'} voice-${d.name.toLowerCase()}`;e.style.cssText=`left:${d.x}%;top:80.45%;width:${d.w}%;height:7.75%`;if(K.state.voice===d.name){const c=document.createElement('span');c.className='voice-choice-check';c.textContent='✓';e.appendChild(c)}f.appendChild(e)});if(K.state.voice!=='Milo'){const m=document.createElement('div');m.className='milo-baked-check-mask';f.appendChild(m)}}

  K.showAchievements=()=>{
    K.stopSpeech();K.lastView='achievements';
    const cards=progress().correctQuestionIds.length,playedWorlds=WORLD_ORDER.filter(w=>worldStat(w).answered>0).length;
    const defs=[
      {icon:'🎯',name:'Eerste quiz',done:(K.state.quizzesPlayed||0)>=1,now:Math.min(1,K.state.quizzesPlayed||0),goal:1},
      {icon:'⭐',name:'10 goede antwoorden',done:totalCorrect()>=10,now:Math.min(10,totalCorrect()),goal:10},
      {icon:'🌟',name:'50 goede antwoorden',done:totalCorrect()>=50,now:Math.min(50,totalCorrect()),goal:50},
      {icon:'🔥',name:'7 dagen op rij',done:(K.state.streak||0)>=7,now:Math.min(7,K.state.streak||0),goal:7},
      {icon:'🃏',name:'5 kenniskaarten',done:cards>=5,now:Math.min(5,cards),goal:5},
      {icon:'🗺️',name:'Alle werelden bezocht',done:playedWorlds>=6,now:playedWorlds,goal:6}
    ];
    const body=`<div class="summary-hero"><div class="summary-icon">🏆</div><div><b>${defs.filter(x=>x.done).length}/${defs.length} behaald</b><span>Blijf ontdekken om nieuwe prestaties vrij te spelen.</span></div></div><div class="achievement-grid">${defs.map(a=>`<article class="achievement-card ${a.done?'done':''}"><div class="achievement-icon">${a.icon}</div><div><b>${esc(a.name)}</b><small>${a.done?'Behaald!':`${a.now}/${a.goal}`}</small><div class="mini-track"><i style="width:${Math.min(100,a.now/a.goal*100)}%"></i></div></div>${a.done?'<span class="done-badge">✓</span>':''}</article>`).join('')}</div>`;
    nativeScreen({cls:'achievements-screen',title:'Prestaties',subtitle:'Jouw avonturen en mijlpalen',body,active:'achievements'})
  };

  K.showCollection=(tab='worlds')=>{
    K.stopSpeech();K.lastView='collection';
    const correctIds=progress().correctQuestionIds;const cards=correctIds.map(id=>K.questions.find(q=>q.id===id)).filter(Boolean);
    let content='';
    if(tab==='worlds') content=`<div class="world-progress-grid">${WORLD_ORDER.map(w=>{const m=WORLD_META[w],s=worldStat(w);return`<button class="progress-world" data-world="${w}"><span class="progress-world-icon">${m.icon}</span><span><b>${esc(m.title)}</b><small>${s.correct}/${s.answered} goed · ${accuracy(s)}%</small><span class="wide-track"><i style="width:${accuracy(s)}%"></i></span></span><em>›</em></button>`}).join('')}</div>`;
    if(tab==='cards') content=cards.length?`<div class="knowledge-grid">${cards.map(q=>`<article class="knowledge-card world-${q.world}"><div class="knowledge-art">${WORLD_META[q.world]?.icon||'⭐'}</div><b>${esc(q.answer)}</b><small>${esc(q.topicLabel||K.topics[q.world]?.[q.topic]||q.world)}</small><span>★ Ontdekt</span></article>`).join('')}</div>`:`<div class="empty-state"><div>🃏</div><h2>Nog geen kaarten</h2><p>Beantwoord vragen goed om kenniskaarten te verzamelen.</p></div>`;
    if(tab==='mascots'){const unlocked=unlockedMascots();content=`<div class="mascot-grid">${MASCOTS.map(m=>{const ok=totalCorrect()>=m.need,sel=K.state.selectedMascot===m.id;return`<button class="mascot-card ${ok?'unlocked':'locked'} ${sel?'selected':''}" data-mascot="${m.id}" ${ok?'':'disabled'}><div>${ok?m.icon:'🔒'}</div><b>${esc(m.name)}</b><small>${ok?esc(m.desc):`Nog ${Math.max(0,m.need-totalCorrect())} goede antwoorden`}</small>${sel?'<span>Actief ✓</span>':ok?'<span>Kies maatje</span>':''}</button>`}).join('')}</div><div class="collection-note">${unlocked.length}/${MASCOTS.length} maatjes vrijgespeeld</div>`}
    const body=`<div class="collection-tabs"><button data-tab="worlds" class="${tab==='worlds'?'active':''}">🌍 Werelden</button><button data-tab="cards" class="${tab==='cards'?'active':''}">🃏 Kaarten <i>${cards.length}</i></button><button data-tab="mascots" class="${tab==='mascots'?'active':''}">🐾 Mascottes</button></div>${content}`;
    const f=nativeScreen({cls:'collection-screen',title:'Mijn collectie',subtitle:'Alles wat je hebt ontdekt',body,active:'collection'});
    f.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{K.sfx('tap');K.showCollection(b.dataset.tab)});
    f.querySelectorAll('[data-world]').forEach(b=>b.onclick=()=>{K.sfx('tap');K.enterWorld(b.dataset.world)});
    f.querySelectorAll('[data-mascot]:not([disabled])').forEach(b=>b.onclick=()=>{K.sfx('tap');K.state.selectedMascot=b.dataset.mascot;K.save();K.showCollection('mascots')})
  };

  K.showStats=()=>{
    K.stopSpeech();K.lastView='stats';const answered=Number(K.state.answered||0),correct=Number(K.state.correct||0),pct=answered?Math.round(correct/answered*100):0;
    const body=`<div class="stat-hero"><div class="stat-ring" style="--p:${pct}"><b>${pct}%</b><small>goed</small></div><div><h2>Jouw kennis groeit</h2><p>${answered} vragen beantwoord · ${K.state.quizzesPlayed||0} quizzen gespeeld</p></div></div><div class="stat-cards"><article><span>⭐</span><b>${K.state.xp||0}</b><small>XP totaal</small></article><article><span>🪙</span><b>${K.state.coins||0}</b><small>KwizCoins</small></article><article><span>🔥</span><b>${K.state.streak||0}</b><small>Dagen op rij</small></article><article><span>🃏</span><b>${progress().correctQuestionIds.length}</b><small>Kaarten</small></article></div><h2 class="section-title">Per wereld</h2><div class="world-stat-list">${WORLD_ORDER.map(w=>{const m=WORLD_META[w],s=worldStat(w);return`<article><span>${m.icon}</span><div><b>${esc(m.title)}</b><small>${s.correct} goed van ${s.answered} · ${s.quizzes} quiz${s.quizzes===1?'':'zen'}</small><div class="wide-track"><i style="width:${accuracy(s)}%"></i></div></div><strong>${accuracy(s)}%</strong></article>`}).join('')}</div>`;
    nativeScreen({cls:'stats-screen',title:'Statistieken',subtitle:'Echte voortgang uit jouw gespeelde vragen',body,active:'stats'})
  };

  function showPrivacyInfo(){const f=K.app.querySelector('.game-frame');if(!f)return;const o=document.createElement('div');o.className='simple-modal';o.innerHTML=`<div class="simple-modal-card"><button class="simple-close" aria-label="Sluiten">×</button><div class="simple-icon">🛡️</div><h2>Privacy & veiligheid</h2><p>Kwizillo bewaart deze prototype-voortgang lokaal op dit apparaat. Er zijn geen advertenties en de ElevenLabs-sleutel blijft op de lokale server.</p><button class="simple-ok">Begrepen</button></div>`;f.appendChild(o);const close=()=>o.remove();o.querySelector('.simple-close').onclick=close;o.querySelector('.simple-ok').onclick=close}
  function showResetConfirm(){const f=K.app.querySelector('.game-frame');if(!f)return;const o=document.createElement('div');o.className='simple-modal';o.innerHTML=`<div class="simple-modal-card danger"><button class="simple-close" aria-label="Sluiten">×</button><div class="simple-icon">♻️</div><h2>Voortgang resetten?</h2><p>XP, coins, kaarten, statistieken en gespeelde voortgang gaan terug naar de beginstand.</p><div class="confirm-actions"><button class="cancel">Annuleren</button><button class="confirm">Ja, reset</button></div></div>`;f.appendChild(o);o.querySelector('.simple-close').onclick=()=>o.remove();o.querySelector('.cancel').onclick=()=>o.remove();o.querySelector('.confirm').onclick=()=>{localStorage.removeItem('kwizillo-v4-state');location.reload()}}
  K.showParent=()=>{
    K.stopSpeech();K.lastView='parent';
    const body=`<div class="settings-list"><section class="setting-card"><div class="setting-icon">🎓</div><div><b>Schoolgroep</b><small>Pas de moeilijkheid aan</small></div><div class="stepper"><button data-group="minus">−</button><strong>Groep ${K.state.group}</strong><button data-group="plus">+</button></div></section><section class="setting-card clickable" id="soundOpen"><div class="setting-icon">🔊</div><div><b>Geluid, muziek & stem</b><small>${K.state.voice==='Stil'?'Stem uit':`Stem: ${esc(K.state.voice)}`} · muziek ${K.state.musicOn===false?'uit':'aan'}</small></div><em>›</em></section><section class="setting-card"><div class="setting-icon">⏱️</div><div><b>Tijdslimiet</b><small id="timeLabel">${K.state.timeLimitOn===false?'Uit':`${K.state.timeLimit||45} minuten`}</small></div><button class="native-switch ${K.state.timeLimitOn!==false?'on':''}" id="timeToggle"><span></span></button></section><section class="range-setting"><input id="timeRange" type="range" min="15" max="90" step="15" value="${K.state.timeLimit||45}" ${K.state.timeLimitOn===false?'disabled':''}></section><section class="setting-card clickable" id="privacyOpen"><div class="setting-icon">🛡️</div><div><b>Privacy & veiligheid</b><small>Bekijk hoe deze build gegevens gebruikt</small></div><em>›</em></section><section class="setting-card clickable reset-card" id="resetOpen"><div class="setting-icon">♻️</div><div><b>Voortgang resetten</b><small>Begin opnieuw met een schone voortgang</small></div><em>›</em></section></div>`;
    const f=nativeScreen({cls:'parent-screen',title:'Ouderzone',subtitle:'Instellingen voor een fijne speelervaring',body,active:'parent'});
    f.querySelectorAll('[data-group]').forEach(b=>b.onclick=()=>{K.sfx('tap');const d=b.dataset.group==='plus'?1:-1;K.state.group=Math.max(1,Math.min(8,(K.state.group||5)+d));K.save();K.showParent()});
    f.querySelector('#soundOpen').onclick=()=>{K.sfx('tap');K.showSoundSettings()};
    f.querySelector('#timeToggle').onclick=()=>{K.sfx('tap');K.state.timeLimitOn=K.state.timeLimitOn===false;K.save();K.showParent()};
    f.querySelector('#timeRange').oninput=e=>{K.state.timeLimit=Number(e.target.value);K.state.timeLimitOn=true;K.save();f.querySelector('#timeLabel').textContent=`${K.state.timeLimit} minuten`};
    f.querySelector('#privacyOpen').onclick=()=>{K.sfx('tap');showPrivacyInfo()};f.querySelector('#resetOpen').onclick=()=>{K.sfx('tap');showResetConfirm()}
  };

  K.showSoundSettings=()=>{K.stopSpeech();const f=K.app.querySelector('.game-frame');if(!f)return;f.querySelector('.sound-settings-overlay')?.remove();const o=document.createElement('div');o.className='sound-settings-overlay';const tracks=Object.values(K.audio.tracks).map(t=>`<button class="music-choice ${K.state.musicTrack===t.id?'selected':''}" data-track="${t.id}"><span class="music-icon">${t.icon}</span><span><b>${t.label}</b></span>${K.state.musicTrack===t.id?'<i>✓</i>':''}</button>`).join('');o.innerHTML=`<div class="sound-settings-card"><div class="sound-head"><div><span class="sound-kicker">INSTELLINGEN</span><h2>🔊 Geluid & muziek</h2></div><button class="sound-close" aria-label="Sluiten">×</button></div><div class="sound-row"><div class="sound-label"><b>✨ Geluidseffecten</b></div><button class="sound-toggle ${K.state.soundOn!==false?'on':''}" data-toggle="sfx"><span></span></button></div><div class="volume-row"><span>🔈</span><input type="range" min="0" max="100" value="${Math.round((K.state.sfxVolume??.72)*100)}" data-volume="sfx"><span>🔊</span><button class="sound-test">Test</button></div><div class="sound-divider"></div><div class="sound-row"><div class="sound-label"><b>🎵 Achtergrondmuziek</b></div><button class="sound-toggle ${K.state.musicOn!==false?'on':''}" data-toggle="music"><span></span></button></div><div class="volume-row"><span>🔈</span><input type="range" min="0" max="100" value="${Math.round((K.state.musicVolume??.24)*100)}" data-volume="music"><span>🔊</span></div><h3>Kies je muziek</h3><div class="music-choice-grid">${tracks}</div><div class="sound-divider"></div><h3>Stemgids</h3><div class="sound-voice-grid"><button class="sound-voice ${K.state.voice==='Milo'?'selected':''}" data-guide="Milo">🤖 <b>Milo</b></button><button class="sound-voice ${K.state.voice==='Luna'?'selected':''}" data-guide="Luna">🎧 <b>Luna</b></button><button class="sound-voice ${K.state.voice==='Stil'?'selected':''}" data-guide="Stil">🔇 <b>Stil</b></button></div></div>`;f.appendChild(o);const redraw=()=>{o.remove();K.showSoundSettings()};o.querySelector('.sound-close').onclick=()=>{K.stopSpeech();o.remove()};o.querySelector('[data-toggle="sfx"]').onclick=()=>{K.audio.setSfx(K.state.soundOn===false);redraw()};o.querySelector('[data-toggle="music"]').onclick=async()=>{await K.audio.setMusic(K.state.musicOn===false);redraw()};o.querySelector('[data-volume="sfx"]').oninput=e=>K.audio.setSfxVolume(e.target.value/100);o.querySelector('[data-volume="music"]').oninput=e=>K.audio.setMusicVolume(e.target.value/100);o.querySelector('.sound-test').onclick=()=>K.audio.play('reward');o.querySelectorAll('[data-track]').forEach(b=>b.onclick=async()=>{await K.audio.setTrack(b.dataset.track);redraw()});o.querySelectorAll('[data-guide]').forEach(b=>b.onclick=()=>{K.state.voice=b.dataset.guide;K.save();K.stopSpeech();redraw();if(K.state.voice!=='Stil')K.speak(K.state.voice==='Milo'?'Hoi! Ik ben Milo.':'Hoi! Ik ben Luna.')})};

  K.showHome=(withMotion=false)=>{K.lastView='home';const open=()=>{const f=master(K.MASTER.home,[...gear(),H(7,22,43,14,'Ruimtewereld',()=>K.enterWorld('ruimte')),H(57,20,39,15,'Dierenwereld',()=>K.enterWorld('dieren')),H(4,35,48,18,'Aardewereld',()=>K.enterWorld('aarde')),H(54,37,43,17,'Geschiedeniswereld',()=>K.enterWorld('geschiedenis')),H(4,51,49,17,'Wetenschapwereld',()=>K.enterWorld('wetenschap')),H(54,52,43,17,'Mysteriewereld',()=>K.enterWorld('mysterie')),H(22,69,55,7.5,'Start avontuur',()=>K.enterWorld(K.currentWorld)),H(5,80,27,8.2,'Stem Milo',()=>selectVoice('Milo')),H(33,80,27,8.2,'Stem Luna',()=>selectVoice('Luna')),H(61,80,25,8.2,'Zonder stem',()=>selectVoice('Stil')),...nav()]);voiceFrames(f)};withMotion?motion('home',open,'Welkom in Kwizillo'):open()};
  function selectVoice(v){K.state.voice=v;K.save();K.showHome(false);if(v!=='Stil')K.speak(v==='Milo'?'Hoi! Ik ben Milo. Klaar om te spelen?':'Hoi! Ik ben Luna. Zullen we samen ontdekken?')}
  K.enterWorld=world=>{if(!WORLD_META[world])return K.showHome(false);K.stopSpeech();K.currentWorld=world;K.state.lastWorld=world;K.save();K.sfx('world');const open=()=>K.showWorld(world);if(world==='ruimte'||world==='mysterie')motion(world,open,world==='ruimte'?'Op reis naar de sterren…':'Het portaal wordt geopend…');else open()};
  K.showWorld=world=>{K.stopSpeech();K.lastView='world';K.currentWorld=world;const meta=WORLD_META[world]||WORLD_META.ruimte,keys=K.TOPIC_KEYS[world]||[],topics=keys.map((key,i)=>({key,label:K.topics[world]?.[key]||`Onderwerp ${i+1}`,i}));const f=K.frame(`<section class="native-world world-${world} fade-in"><img class="native-world-bg" src="${K.MASTER[world]}" alt="${esc(meta.title)}"><div class="native-world-shade"></div><div class="native-world-ui"><header class="native-world-head"><button id="worldBack" class="world-round" aria-label="Terug naar home">‹</button><div class="world-title-wrap"><div class="world-kicker">${meta.icon} KWIZILLO WERELD</div><h1>${esc(meta.title)}</h1><p>${esc(meta.sub)}</p></div><button id="worldGear" class="world-round" aria-label="Instellingen">⚙</button></header><div class="world-topic-grid">${topics.map(t=>`<button class="world-topic" data-topic="${t.i}"><span class="world-topic-num">${t.i+1}</span><span><b>${esc(t.label)}</b><small>10 vragen · groep ${K.state.group}</small></span><i>›</i></button>`).join('')}</div><button class="world-mix" id="worldMix"><span>▶</span><span><b>Start gemengde quiz</b><small>Vragen uit alle vier onderwerpen</small></span><i>›</i></button>${bottomNav('')}</div></section>`);f.querySelector('#worldBack').onclick=()=>{K.sfx('tap');K.showHome(false)};f.querySelector('#worldGear').onclick=()=>{K.sfx('tap');K.showParent()};f.querySelectorAll('[data-topic]').forEach(b=>b.onclick=()=>{K.stopSpeech();K.sfx('tap');K.startQuiz(world,Number(b.dataset.topic))});f.querySelector('#worldMix').onclick=()=>{K.stopSpeech();K.sfx('tap');K.startQuiz(world,null)};bindNav(f)};

  window.addEventListener('keydown',e=>{if(e.key==='Escape'){K.stopSpeech();K.showHome(false)}});
  ensureProgress();const intro=sessionStorage.getItem('kwizillo-intro-v4');if(!intro){sessionStorage.setItem('kwizillo-intro-v4','1');K.showHome(true)}else K.showHome(false);
})();
