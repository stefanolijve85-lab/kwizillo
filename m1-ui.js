(()=>{
  const K=window.KWIZILLO_M1;
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const t=(k,p)=>K.t(k,p);

  // The worlds come from the registration in m1-runtime.js; the ones the child
  // sees are those whose questions are in the bank (K.playableWorlds).
  const shown=()=>K.playableWorlds();
  const WORLD_ICON={ruimte:'🚀',dieren:'🐾',aarde:'🌍',geschiedenis:'🏛️',wetenschap:'🧪',mysterie:'🔎',kunst:'🎨',sport:'🏅'};
  // CLAUDE.md section 7: each world gets its own soundtrack, crossfaded on entry.
  // Art plays on the hub theme (soft, magical) and Sport on the mini-game loop
  // (upbeat); no new music had to be written for the two newcomers.
  const WORLD_MUSIC={ruimte:'space',dieren:'jungle',aarde:'earth',geschiedenis:'history',wetenschap:'science',mysterie:'mystery',kunst:'home',sport:'play'};
  const MASCOTS=[
    // need: different questions answered right. The eleven buddies after Milo
    // are spread evenly over all 1280 questions (2026-10-06: they came far too
    // fast at 5…200). was: the old ladder, which still sets the shop price and
    // decides what a player who started before the change has already earned.
    {id:'milo',icon:'🤖',need:0,was:0},
    {id:'comet',icon:'🌠',need:115,was:5},
    {id:'pootje',icon:'🐾',need:235,was:12},
    {id:'terra',icon:'🌱',need:350,was:20},
    {id:'sparky',icon:'⚗️',need:465,was:35},
    {id:'lumi',icon:'🔮',need:580,was:50},
    // Six more buddies (see tools/mascot-prompts.md); a buddy without art in
    // K.MASCOT_ART stays hidden until its picture is added.
    {id:'nova',icon:'👩‍🚀',need:700,was:70},
    {id:'kiko',icon:'🐼',need:815,was:90},
    {id:'pip',icon:'🐧',need:930,was:115},
    {id:'ravi',icon:'🥽',need:1045,was:140},
    {id:'flora',icon:'🦋',need:1165,was:170},
    {id:'draco',icon:'🐉',need:1280,was:200},
    // Only in the shop (2026-10-07): no number of answers opens him, 1500 coins buy him.
    {id:'mike',icon:'🎧',need:Infinity,price:1500},
    // Third wave (2026-10-10, Stefan's renders): shop only, like Mike — the 1280
    // questions are already shared out over the first twelve.
    {id:'zibo',icon:'👽',need:Infinity,price:400},
    {id:'leo',icon:'🦁',need:Infinity,price:600},
    {id:'pixi',icon:'🎨',need:Infinity,price:800},
    {id:'olli',icon:'🦉',need:Infinity,price:1000},
    {id:'finn',icon:'🐬',need:Infinity,price:1200},
    {id:'ember',icon:'🐲',need:Infinity,price:1400}
  ].filter(m=>K.MASCOT_ART?.[m.id]);

  // One line per level for the parent zone: time, mistakes, hints, reading.
  function levelSummary(n){
    const h=K.core.hintsAllowed(n);
    const hints=!Number.isFinite(h)?t('settings.hintsFree'):h>0?t('settings.hintsN',{n:h}):t('settings.hintsNone');
    const base=t('settings.levelSub',{seconds:K.core.questionSeconds(n),allowed:K.core.maxWrong(n),hints});
    return K.core.readsAnswers(n)?base:`${base} · ${t('settings.readsQuestionOnly')}`;
  }
  // The language buttons (parent zone, profile): English first, then Dutch, then the rest.
  const langOrder=()=>{const r=l=>l.id==='en'?0:l.id==='nl'?1:2;return [...K.LANGUAGES].sort((a,b)=>r(a)-r(b))};
  const worldTitle=w=>t(`world.${w}.title`);
  const worldSub=w=>t(`world.${w}.sub`);
  const topicLabel=key=>t(`topic.${key}`);

  const progress=()=>K.progress();
  function worldStat(world){
    const p=progress();
    const s=p.worlds[world]||(p.worlds[world]={});
    // Older saves may lack a counter; never let "undefined" reach the screen.
    for(const k of ['answered','correct','quizzes','xp']) s[k]=Number(s[k]||0);
    return s;
  }
  function topicStat(topic){const p=progress();return p.topics[topic]||(p.topics[topic]={answered:0,correct:0})}
  const accuracy=s=>s?.answered?Math.round(s.correct/s.answered*100):0;
  // World points: a world has four quizzes (its four topics); every one the
  // child has passed, at any level, is worth 25 points, so a fully played
  // world stands at 100 and all eight worlds at 800. Statistics and the
  // collection show this, not the accuracy.
  const POINTS_PER_QUIZ=25;
  K.worldPoints=world=>{
    const P=progress().passed||{};
    const keys=K.TOPIC_KEYS?.[world]||[];
    const done=keys.filter(k=>Object.values(P).some(level=>level&&level[`${world}:${k}`]));
    return {passed:done.length,total:keys.length||4,points:done.length*POINTS_PER_QUIZ,max:(keys.length||4)*POINTS_PER_QUIZ};
  };
  K.totalPoints=()=>shown().reduce((a,w)=>{const p=K.worldPoints(w);a.points+=p.points;a.max+=p.max;return a},{points:0,max:0});
  const totalCorrect=()=>Number(K.state.correct||0);
  // A buddy is earned by answering, or bought with coins in the shop; both
  // paths end in the same unlocked tile.
  // Buddies count different questions answered right (at most 1280), so the
  // same easy quiz played again does not bring the next one closer.
  const mascotProgress=()=>(progress().correctQuestionIds||[]).length;
  // Whoever played before the new ladder keeps every buddy the old one gave
  // them: those become owned, once per player (the state carries the mark).
  function keepEarnedBuddies(){
    if(K.state.mascotLadder===1280) return;
    for(const m of MASCOTS) if(m.need&&totalCorrect()>=m.was&&!K.owned(`mascot:${m.id}`)) K.own(`mascot:${m.id}`);
    K.state.mascotLadder=1280;K.save();
  }
  const mascotOwned=m=>{keepEarnedBuddies();return mascotProgress()>=m.need||K.owned(`mascot:${m.id}`)};
  const unlockedMascots=()=>MASCOTS.filter(mascotOwned);
  // What a buddy costs: the answers it would otherwise take, at six coins each,
  // rounded to fifty. Roughly a day of games for the first, a week for the last.
  // What the shop asks. A golden world card is the big one: it is a whole world
  // on one card. The buddies climb from a first one that a day of playing pays
  // for to a dragon that takes a while — the ladder follows how far into the
  // game the buddy would otherwise unlock itself.
  const mascotPrice=m=>m.price||Math.max(100,Math.round((60+m.was*8)/50)*50);   // the shop keeps its prices
  const GOLD_PRICE=1000;

  // A single place that records one answered question across every counter, and
  // the only place a question turns into points. A question answered correctly
  // before pays the practice share, so playing the same ten questions all
  // afternoon cannot outrun a child who keeps discovering new ones; the daily
  // ceiling in scores.js catches the rest. Questions pay no coins: those come
  // from the games, and they are what the shop runs on.
  K.recordAnswerProgress=(q,correct)=>{
    if(!q) return {points:0,capped:false,repeat:false};
    const hadBuddies=unlockedMascots().map(m=>m.id);
    const ws=worldStat(q.world),ts=topicStat(q.topic);
    ws.answered++; ts.answered++;
    K.state.answered=Number(K.state.answered||0)+1;
    let award={granted:0,capped:false},repeat=false;
    if(correct){
      repeat=progress().correctQuestionIds.includes(q.id);
      ws.correct++; ts.correct++;
      K.state.correct=Number(K.state.correct||0)+1;
      award=K.awardPoints(K.answerPoints(Number(q.xp||10),{repeat}));
      ws.xp+=award.granted;
      if(!repeat) progress().correctQuestionIds.push(q.id);
    }
    // A buddy that just came free is worth saying out loud: the child sees who
    // it is the moment it is earned, not the next time the collection is opened.
    const fresh=unlockedMascots().filter(m=>!hadBuddies.includes(m.id));
    if(fresh.length) K.pendingUnlocks=(K.pendingUnlocks||[]).concat(fresh.map(m=>m.id));
    K.save();
    return {points:award.granted,capped:award.capped,repeat};
  };

  // Shows the first buddy waiting to be introduced, if there is one. Returns
  // true when something was shown, so the caller can wait with what it was
  // about to do; `after` runs when the child taps it away.
  K.showMascotUnlock=(after)=>{
    const id=(K.pendingUnlocks||[])[0];
    if(!id) return false;
    const m=MASCOTS.find(x=>x.id===id);
    const f=K.app.querySelector('.game-frame');
    if(!m||!f){K.pendingUnlocks=[];return false}
    K.pendingUnlocks=K.pendingUnlocks.slice(1);
    // De hele portretplaat in een lijst, niet de uitgesneden tegel: het masker
    // van macOS laat bij sommige buddy's een stuk achtergrond staan (terra hield
    // een pluk gras vast) of snijdt er juist iets af (milo's voet). In het
    // raster is de uitsnede nodig — daar staan er dertien naast elkaar en moet
    // elke kaart dezelfde vorm hebben — maar hier staat er één, groot, en dan
    // is de eigen plaat heel netjes.
    const art=K.MASCOT_ART[m.id]||K.MASCOT_TILE[m.id];
    const el=document.createElement('div');
    el.className='mascot-unlock';
    el.innerHTML=`<div class="mascot-unlock-card">
      <span class="mascot-unlock-rays" aria-hidden="true"></span>
      <span class="mascot-unlock-kicker">${esc(t('collection.unlockKicker'))}</span>
      <img class="mascot-unlock-art" src="${art}" alt="">
      <b>${esc(t(`mascot.${m.id}`))}</b>
      <span class="mascot-unlock-sub">${esc(t(`mascot.${m.id}.desc`))}</span>
      <span class="mascot-unlock-line">${esc(t('collection.unlockLine',{n:m.need}))}</span>
      <button class="mascot-unlock-ok">${esc(t('common.gotIt'))}</button>
    </div>`;
    f.appendChild(el);
    K.sfx('reward');
    K.celebrate?.('gold',el);
    const close=()=>{el.remove();if(typeof after==='function')after()};
    el.onclick=close;
    el.querySelector('.mascot-unlock-ok').onclick=e=>{e.stopPropagation();K.sfx('tap');close()};
    return true;
  };

  function bottomNav(active=''){
    // Home in the middle, a little lifted (Stefan, 2026-10-10)
    const defs=[['achievements',K.icon('trophy'),'nav.achievements'],['collection',K.icon('cards'),'nav.collection'],['home',K.icon('home'),'nav.home'],['stats',K.icon('stats'),'nav.stats'],['parent',K.icon('gear'),'nav.more']];
    return `<nav class="native-bottom-nav" aria-label="${esc(t('nav.aria'))}">${defs.map(([id,icon,key])=>`<button data-nav="${id}" class="${active===id?'active':''}">${icon}<small>${esc(t(key))}</small></button>`).join('')}</nav>`;
  }
  function bindNav(f){
    const map={home:()=>K.showHome(),achievements:K.showAchievements,collection:()=>K.showCollection('worlds'),stats:K.showStats,parent:K.showParent};
    f.querySelectorAll('[data-nav]').forEach(b=>b.onclick=()=>{K.stopSpeech();K.sfx('tap');map[b.dataset.nav]?.()});
  }
  K.bottomNav=bottomNav;K.bindNav=bindNav;
  function nativeScreen({cls='',title,subtitle='',body,active='',back=()=>K.showHome()}){
    const f=K.frame(`<section class="native-panel-screen ${cls} fade-in"><div class="native-panel-glow"></div><header class="panel-head"><button class="panel-back" aria-label="${esc(t('common.back'))}">${K.icon('back')}</button><div><img class="panel-logo" src="${K.BRAND_LOGO}" alt="${esc(t('common.brand'))}" decoding="async"><h1>${esc(title)}</h1>${subtitle?`<p>${esc(subtitle)}</p>`:''}</div><span class="panel-settings panel-spacer" aria-hidden="true"></span></header><main class="panel-scroll">${body}</main>${bottomNav(active)}</section>`);
    f.querySelector('.panel-back').onclick=()=>{K.stopSpeech();K.sfx('tap');back()};
    // The blue band ends just under the header, whatever its height (a compact header leaves more page).
    const scr=f.querySelector('.native-panel-screen'),head=f.querySelector('.panel-head');
    const band=()=>scr.style.setProperty('--head-end',`${head.offsetTop+head.offsetHeight+8}px`);band();
    if(window.ResizeObserver)new ResizeObserver(band).observe(head);
    bindNav(f);return f;
  }

  /* ---------------- Home ---------------- */

  K.showHome=()=>{K.fromRunners=false;K.fromChest=false;
    K.stopSpeech();K.lastView='home';
    K.audio.setTrack('home').catch(()=>{});
    const name=String(K.state.name||'').trim();
    const greeting=name?t('home.greeting',{name}):t('home.greetingAnon');
    const lvl=K.level(),into=K.xpIntoLevel();
    const last=K.state.lastWorld&&shown().includes(K.state.lastWorld)?K.state.lastWorld:'ruimte';

    const worldCards=shown().map(w=>{
      // Just the name, big and centred: a child reads it in one glance. The
      // bar underneath shows how the world is going once it has been played.
      // Every world carries its own level, and the tile says which: four passed
      // topic quizzes take this world — and only this world — one step up.
      const lv=K.worldLevelProgress(w);
      // The bar is the world as a whole: its four topic quizzes at each of the
      // six levels. It was the share of answers that were right, which said
      // nothing about how far the world had come — two right answers filled it.
      const wp=K.worldProgress(w);
      return `<button class="home-world" data-world="${w}" aria-label="${esc(worldTitle(w))} · ${esc(t('settings.level'))} ${lv.level} · ${esc(t('world.worldProgress',{done:wp.done,total:wp.total}))}">
        <img class="home-world-art" src="${K.tileArt(w)}" alt="" decoding="async" style="${K.tileStyle(w)}">
        <span class="home-world-veil"></span>
        <span class="home-world-level">${esc(t('settings.level'))} ${lv.level}${lv.passed?` · ${lv.passed}/${lv.total}`:''}</span>
        <span class="home-world-copy">
          <b>${esc(worldTitle(w))}</b>
        </span>
        <span class="home-world-bar" title="${esc(t('world.worldProgress',{done:wp.done,total:wp.total}))}"><i style="width:${wp.pct}%"></i></span>
      </button>`;
    }).join('');

    const f=K.frame(`<section class="home fade-in">
      <div class="home-sky"></div>
      <div class="home-ui">
        <header class="home-hud with-logo">
          <button class="hud-avatar" id="homeProfile" aria-label="${esc(t('profile.title'))}"><img class="mascot-face" src="${K.MASCOT_ART[K.state.selectedMascot]||K.guideArt(K.state.voice)}" alt=""></button>
          <div class="hud-center">
            <img class="hud-logo" src="${K.BRAND_LOGO}" alt="Kwizillo" decoding="async">
            <span class="hud-id"><b>${esc(greeting)}</b></span>
          </div>
          <div class="hud-right" aria-hidden="true">
          </div>
        </header>

        <button class="home-mega ${K.premium.can('mega')?'':'locked'}" id="homeMega" aria-label="${esc(t('mega.title'))} · ${esc(t('mega.sub',{n:K.MEGA_SIZE}))}">
          <img class="home-game-art" src="${K.GAME_ART.memoAll}" alt="" decoding="async"><span class="home-mega-veil"></span>
          ${K.premium.can('mega')?'':K.premiumBadge()}
          <span class="home-world-level">${esc(t('settings.level'))} ${K.megaEarnedLevel()}</span>
          <span class="home-mega-copy"><b>${esc(t('mega.title'))}</b><small>${esc(t('mega.sub',{n:K.MEGA_SIZE}))}</small></span>
        </button>

        <h2 class="home-section">${esc(t('home.pickWorld'))}</h2>
        <div class="home-worlds">${worldCards}</div>

        <h2 class="home-section">${esc(t('home.playMore'))}</h2>
        <!-- Speel ook (Stefan, 2026-10-10): four tiles like the worlds — Talen and Rekenen, the
             Runner and the Spellenkist, which holds Memo, Weetjes, Fotozoom and Wat ben ik? -->
        <div class="home-worlds home-play">
          ${playTile('homeTalen',K.GAME_ART.talen,t('talen.title'),(s=>s.done?`★ ${s.done}/${s.total}`:'')(K.talenStamps?.()||{done:0}))}
          ${playTile('homeMath',K.GAME_ART.math,t('math.title'))}
          ${playTile('homeJungle',K.GAME_ART.runnerTile,t('runner.pickTitle'),(b=>b?`${K.icon('trophy')} ${b}`:'')(Number(K.progress().games?.jungle?.best||0)),true)}
          <button class="home-world home-play-tile chest" id="homeChest" aria-label="${esc(t('chest.title'))}">
            <span class="home-chest-mosaic" aria-hidden="true">${CHEST.slice(0,4).map(g=>`<img src="${K.GAME_ART[g.art]}" alt="" decoding="async">`).join('')}</span>
            <span class="home-world-veil"></span>
            <span class="home-world-copy"><b>${esc(t('chest.title'))}</b></span>
          </button>
        </div>

        ${bottomNav('home')}
      </div>
    </section>`);

    f.querySelectorAll('[data-world]').forEach(b=>b.onclick=()=>{K.sfx('tap');K.enterWorld(b.dataset.world)});
    f.querySelector('#homeMega').onclick=()=>{K.sfx('world');K.startMega()};
    f.querySelector('#homeProfile').onclick=()=>{K.sfx('tap');K.showProfile()};
    f.querySelector('#homeTalen').onclick=()=>{K.sfx('tap');openGame('talen.title',K.showTalen)};
    f.querySelector('#homeJungle').onclick=()=>{K.sfx('tap');openGame('runner.pickTitle',K.showRunnerPick)};   // the Kwizillo Runner and Mike & Mia
    f.querySelector('#homeMath').onclick=()=>{K.sfx('world');openGame('math.title',()=>K.showMathPick(last))};   // sums, money or measuring (games-money.js)
    f.querySelector('#homeChest').onclick=()=>{K.sfx('tap');openGame('chest.title',K.showGameChest)};
    f.querySelectorAll('[data-stats]').forEach(b=>b.onclick=()=>{K.sfx('tap');K.showStats()});
    bindNav(f);
    // The six world names are warmed on Home so the guide calls one out the
    // moment a world opens; the hello of each guide too, ahead of the profile's voice pick.
    K.prefetchSpeech(shown().map(w=>t('world.speech.enter',{title:worldTitle(w)})));
    // The first two Weetjes are picked and warmed here, so the screen talks the moment it opens.
    const ahead=K.warmFacts?.(K.state.factsWorld||'all')||[];
    if(ahead[0]) K.prefetchSpeech([t('facts.kicker'),ahead[0].t]);   // the first one opens with the facts kicker
    K.prefetchSpeech([t('voice.milo.hello')],{voice:'Milo'});
    K.prefetchSpeech([t('voice.luna.hello')],{voice:'Luna'});
  };

  // Speel ook: a tile in the style of a world tile (same frame, veil, badge and name).
  const playTile=(id,art,title,badge='',runner=false)=>`<button class="home-world home-play-tile ${runner?'runner':''}" id="${id}" aria-label="${esc(title)}">
      <img class="home-world-art" src="${art}" alt="" decoding="async">
      <span class="home-world-veil"></span>
      ${badge?`<span class="home-world-level">${badge}</span>`:''}
      <span class="home-world-copy"><b>${esc(title)}</b></span>
    </button>`;
  // The Spellenkist: the smaller games behind one tile (Stefan, 2026-10-10); Home shows the first four as its mosaic.
  const CHEST=[
    {id:'homeMemo',art:'memo',title:'memo.title',open:()=>K.showMemoPicker()},
    {id:'homeFacts',art:'facts',title:'facts.title',open:()=>K.showGamePicker('facts')},
    {id:'homeFotozoom',art:'fotozoom',title:'fotozoom.title',open:()=>K.showGamePicker('fotozoom')},
    {id:'homeWhoAmI',art:'whoami',title:'whoami.title',open:()=>K.showGamePicker('whoami')},
    // Blokkenpret (games-blokken.js): the polyomino puzzle, ten levels.
    {id:'homeBlokken',art:'blokken',title:'blokken.title',open:()=>K.showBlokkenLevels()}
  ];
  K.showGameChest=()=>{
    K.audio.setTrack('play').catch(()=>{});
    K.stopSpeech();K.lastView='home';K.fromChest=true;K.fromRunners=false;
    const f=K.frame(`<section class="native-panel-screen memo-picker game-picker math-pick chest-pick fade-in">
      <div class="native-panel-glow"></div>
      <header class="panel-head"><button class="panel-back" aria-label="${esc(t('common.back'))}">${K.icon('back')}</button><div><h1 class="game-name">${esc(t('chest.title'))}</h1><p>${esc(t('chest.sub'))}</p></div><span class="panel-settings panel-spacer" aria-hidden="true"></span></header>
      <div class="panel-scroll">
        <div class="chest-grid">${CHEST.map((g,i)=>`<button class="memo-pick math-pick-tile ${i===4?'wide':''}" id="${g.id}" data-art="${g.art}"><img class="home-game-art" src="${K.GAME_ART[g.art]}" alt="" decoding="async"><span class="home-game-veil"></span><b>${esc(t(g.title))}</b></button>`).join('')}</div>
      </div>
      ${bottomNav('home')}
    </section>`);
    f.querySelector('.panel-back').onclick=()=>{K.sfx('tap');K.showHome()};
    for(const g of CHEST)f.querySelector('#'+g.id).onclick=()=>{K.sfx('tap');openGame(g.title,g.open)};
    bindNav(f);
  };
  // The Runner tile (2026-10-10): the two runners, the Kwizillo Runner and Mike & Mia: Jump & Slide.
  const RUNNERS=[
    {id:'homeRunnerJungle',art:'runnerTile',title:'jungle.name',open:()=>K.startJungle(),badge:()=>Number(K.progress().games?.jungle?.best||0)},
    {id:'homeJump',art:'jump',title:'jump.title',open:()=>K.startJump(),badge:()=>Math.max(0,...Object.values(K.progress().games?.jump?.best||{}).map(Number).filter(Number.isFinite))}
  ];
  K.showRunnerPick=()=>{
    K.audio.setTrack('play').catch(()=>{});
    K.stopSpeech();K.lastView='home';K.fromChest=false;K.fromRunners=true;
    const f=K.frame(`<section class="native-panel-screen memo-picker game-picker math-pick chest-pick runner-pick fade-in">
      <div class="native-panel-glow"></div>
      <header class="panel-head"><button class="panel-back" aria-label="${esc(t('common.back'))}">${K.icon('back')}</button><div><h1 class="game-name">${esc(t('runner.pickTitle'))}</h1><p>${esc(t('chest.sub'))}</p></div><span class="panel-settings panel-spacer" aria-hidden="true"></span></header>
      <div class="panel-scroll">
        ${RUNNERS.map(g=>{const b=g.badge();return `<button class="memo-pick math-pick-tile" id="${g.id}" data-art="${g.art}"><img class="home-game-art" src="${K.GAME_ART[g.art]}" alt="" decoding="async"><span class="home-game-veil"></span>${b?`<span class="home-world-level">${K.icon('trophy')} ${b}</span>`:''}<b>${esc(t(g.title))}</b></button>`}).join('')}
      </div>
      ${bottomNav('home')}
    </section>`);
    f.querySelector('.panel-back').onclick=()=>{K.sfx('tap');K.showHome()};
    for(const g of RUNNERS)f.querySelector('#'+g.id).onclick=()=>{K.sfx('tap');openGame(g.title,g.open)};
    bindNav(f);
  };
  // Back from a game: to the Spellenkist or the runner choice when it was opened from there.
  K.backFromGame=()=>K.fromRunners?K.showRunnerPick():K.fromChest?K.showGameChest():K.showHome();

  // A game opened from Home: the guide calls out its name, as for a world
  // (Stefan, 2026-10-10). Only while that screen is still there.
  const openGame=(key,open)=>{
    K.noteStop('game',key.split('.')[0]);
    open();const f=K.app.firstElementChild;
    setTimeout(()=>{if(f?.isConnected)K.speak(t('world.speech.enter',{title:t(key)}))},420);
  };

  // Where the child was, for the welcome-back screen (welcome-back.js): the last
  // world or game it opened. Before 2026-10-10 only the world was kept, so after a
  // round of Rekenen the app still said "you were in the Animal world".
  K.noteStop=(kind,id)=>{K.state.lastStop={kind,id};K.save()};

  /* ---------------- World ---------------- */

  K.enterWorld=world=>{
    if(!shown().includes(world)) return K.showHome();
    K.stopSpeech();K.currentWorld=world;K.state.lastWorld=world;K.noteStop('world',world);K.sfx('fanfare');
    K.audio.setTrack(WORLD_MUSIC[world]||'home').catch(()=>{});
    K.showWorld(world);
    // The guide calls out the world's name, cheering, once the fanfare peaks.
    setTimeout(()=>{if(K.currentWorld===world&&K.app.querySelector('.native-world-bg'))K.speak(t('world.speech.enter',{title:worldTitle(world)}))},420);
  };

  const runKey=(world,topicKey)=>topicKey?`${world}:${topicKey}`:world;
  K.runFor=(world,topicKey)=>{
    const runs=progress().runs;
    return runs[runKey(world,topicKey)] ||= {quizNumber:0,usedIds:[]};
  };

  K.showWorld=world=>{
    K.stopSpeech();K.lastView='world';K.currentWorld=world;
    const keys=K.TOPIC_KEYS[world]||[];
    const level=K.playLevel(world);
    const passedAt=K.progress().passed?.[level]||{};
    // Wat het kind hier al gedaan heeft: gehaald op dit niveau, of hoeveel
    // quizzen er gespeeld zijn en hoe het ging.
    const topics=keys.map((key,i)=>{
      const run=K.runFor(world,key),st=topicStat(key);
      return {key,label:topicLabel(key),i,
        count:K.core.poolFor({questions:K.questions,world,topicKey:key,grade:Number(K.state.group||5)}).length,
        passed:!!passedAt[`${world}:${key}`],
        quizzes:Number(run.quizNumber||0),
        answered:Number(st.answered||0),correct:Number(st.correct||0)};
    });
    const mixRun=K.runFor(world,null);
    const topicFree=tp=>K.premium.can('quiz',world,tp.key,Number(K.runFor(world,tp.key).quizNumber||0)+1);
    const mixFree=K.premium.can('quiz',world,null,mixRun.quizNumber+1);

    const f=K.frame(`<section class="native-world world-${world} fade-in">
      <img class="native-world-bg" src="${K.MASTER[world]}" alt="" style="object-position:${K.WORLD_FOCUS?.[world]||'center 38%'}">
      <div class="native-world-hero"><img src="${K.MASTER[world]}" alt="${esc(worldTitle(world))}"></div>
      <div class="native-world-shade"></div>
      <div class="native-world-ui">
        <header class="native-world-head">
          <button id="worldBack" class="world-round" aria-label="${esc(t('world.backHome'))}">${K.icon('back')}</button>
          <div class="world-title-wrap">
            <div class="world-kicker">${K.worldBadge(world,'tiny')} ${esc(t('world.kicker'))} · ${esc(t('settings.level'))} ${K.playLevel(world)}</div>
            <h1 class="${worldTitle(world).length>14?'long':''}">${esc(worldTitle(world))}</h1>
            <p>${esc(worldSub(world))}</p>
          </div>
          <span class="world-round panel-spacer" aria-hidden="true"></span>
        </header>
        <p class="world-progress-line">${esc(t('world.progressLine',{passed:topics.filter(x=>x.passed).length,total:topics.length||4}))}</p>
        <div class="world-topic-grid">${topics.map(tp=>`<button class="world-topic has-art ${topicFree(tp)?'':'locked'}" data-topic="${tp.i}">
          <img class="world-topic-art" src="${K.TOPIC_ART[tp.key]||K.MASTER[world]}" alt="" decoding="async">
          <span class="world-topic-veil"></span>
          <span class="world-topic-num">${tp.i+1}</span>${topicFree(tp)?'':K.premiumBadge()}
          <span class="world-topic-copy"><b>${esc(tp.label)}</b>${tp.passed?`<small class="world-topic-done">${K.icon('check')} ${esc(t('world.topicPassed'))}</small>`:tp.quizzes?`<small class="world-topic-played">${esc(t('world.topicPlayed',{n:tp.quizzes,correct:tp.correct,answered:tp.answered}))}</small>`:''}</span>
          <i>›</i>
        </button>`).join('')}</div>
        <button class="world-mix ${mixFree?'':'locked'}" id="worldMix">
          <span>${mixFree?K.icon('play'):K.icon('lock')}</span>
          <span><b>${esc(t('world.mix'))}</b><small>${esc(t('world.quizNumber',{n:mixRun.quizNumber+1}))} · ${mixRun.quizNumber?esc(t('world.mixDone',{n:mixRun.quizNumber})):esc(t('world.mixSub'))}</small></span>
          <i>›</i>
        </button>
        ${bottomNav('')}
      </div>
    </section>`);

    f.querySelector('#worldBack').onclick=()=>{K.sfx('tap');K.showHome()};
    f.querySelectorAll('[data-topic]').forEach(b=>b.onclick=()=>{K.stopSpeech();K.sfx('tap');K.startQuiz(world,Number(b.dataset.topic))});
    f.querySelector('#worldMix').onclick=()=>{K.stopSpeech();K.sfx('tap');K.startQuiz(world,null)};
    bindNav(f);
  };

  /* ---------------- Achievements ---------------- */

  K.showAchievements=()=>{
    K.stopSpeech();K.lastView='achievements';
    const cards=K.cardCount();
    const playedWorlds=shown().filter(w=>worldStat(w).answered>0).length;
    const defs=[
      {icon:'🎯',key:'achievement.firstQuiz',now:Math.min(1,K.state.quizzesPlayed||0),goal:1},
      {icon:'⭐',key:'achievement.correct10',now:Math.min(10,totalCorrect()),goal:10},
      {icon:'🌟',key:'achievement.correct50',now:Math.min(50,totalCorrect()),goal:50},
      {icon:'🔥',key:'achievement.streak7',now:Math.min(7,K.state.streak||0),goal:7},
      {icon:'🃏',key:'achievement.cards5',now:Math.min(5,cards),goal:5},
      {icon:'🗺️',key:'achievement.allWorlds',now:playedWorlds,goal:6},
      {icon:'🧠',key:'achievement.memo3',now:Math.min(3,Number(progress().games?.memo?.won||0)),goal:3},
      {icon:'🔢',key:'achievement.math3',now:Math.min(3,Number(progress().games?.math?.won||0)),goal:3},
      {icon:'🗣️',key:'achievement.talenFirst',now:Math.min(1,K.talenSummary?.().lessons||0),goal:1},
      {icon:'📖',key:'achievement.talen10',now:Math.min(10,K.talenSummary?.().words.length||0),goal:10}
    ].map(a=>({...a,done:a.now>=a.goal}));

    const body=`<div class="summary-hero"><div class="summary-icon">${K.icon('trophy')}</div><div><b>${esc(t('achievements.summary',{done:defs.filter(x=>x.done).length,total:defs.length}))}</b><span>${esc(t('achievements.summarySub'))}</span></div></div>
      <div class="achievement-grid">${defs.map(a=>`<article class="achievement-card ${a.done?'done':''}"><div class="achievement-medal" style="--p:${Math.round(Math.min(100,a.now/a.goal*100))}"><span class="achievement-icon">${a.icon}</span></div><div><b>${esc(t(a.key))}</b><small>${a.done?esc(t('achievements.done')):`${a.now}/${a.goal}`}</small><div class="mini-track"><i style="width:${Math.min(100,a.now/a.goal*100)}%"></i></div></div>${a.done?'<span class="done-badge">✓</span>':''}</article>`).join('')}</div>`;
    nativeScreen({cls:'achievements-screen',title:t('achievements.title'),subtitle:t('achievements.sub'),body,active:'achievements'});
  };

  /* ---------------- Sharing ---------------- */

  // Sharing goes through the system share sheet (or the clipboard) and is
  // gated by the parental check, as it leaves the app. There is no leaderboard,
  // no Game Center and no online score: players never compete with each other.
  K.shareText=()=>{
    const best=Object.entries(K.state.bestScores||{}).sort((a,b)=>b[1]-a[1])[0];
    return t('share.text',{
      name:K.state.name||'',level:K.level(),correct:totalCorrect(),cards:K.cardCount(),
      best:best?`${best[1]}/10 (${worldTitle(best[0])})`:'–'
    });
  };
  K.shareScore=()=>showParentalGate(async()=>{
    const text=K.shareText();
    try{
      if(navigator.share){await navigator.share({title:'Kwizillo',text});return}
      await navigator.clipboard.writeText(text);K.toast(t('share.copied'));
    }catch(e){ if(e?.name!=='AbortError') K.toast(t('share.copied')) }
  });

  /* ---------------- Profile ---------------- */

  K.showProfile=()=>{
    K.stopSpeech();K.lastView='profile';
    const lvl=K.level(),into=K.xpIntoLevel();
    const answered=Number(K.state.answered||0),correct=totalCorrect();
    const pct=answered?Math.round(correct/answered*100):0;
    const buddy=K.state.selectedMascot||'milo';
    const guides=[['Milo',K.MASCOT_ART.milo],['Luna',K.MASCOT_ART.luna],['Stil',null]];
    const body=`
      <div class="profile-hero">
        <div class="profile-portrait"><img class="mascot-face" src="${K.MASCOT_ART[buddy]||K.guideArt(K.state.voice)}" alt=""><span class="profile-level">${lvl}</span></div>
        <form class="profile-name" id="profileName" autocomplete="off">
          <input id="profileInput" type="text" maxlength="18" value="${esc(K.state.name||'')}" aria-label="${esc(t('onboarding.name.placeholder'))}">
          <button type="submit" aria-label="${esc(t('profile.saveName'))}">${K.icon('check')}</button>
        </form>
        <div class="profile-xp"><span>${esc(t('home.level',{level:lvl}))}</span><i><b style="width:${into}%"></b></i><span>${into}%</span></div>
      </div>
      <div class="stat-cards profile-stats" data-stats role="button" tabindex="0">
        <article><span>${K.icon('coin')}</span><b>${Number(K.state.coins||0)}</b><small>${esc(t('stats.coins'))}</small></article>
        <article><span>${K.icon('flame')}</span><b>${Number(K.state.streak||0)}</b><small>${esc(t('stats.streak'))}</small></article>
        <article><span>${K.icon('star')}</span><b>${pct}%</b><small>${esc(t('stats.correctShort'))}</small></article>
        <article><span>${K.icon('cards')}</span><b>${K.cardCount()}</b><small>${esc(t('stats.cards'))}</small></article>
      </div>
      <section class="setting-card profile-row"><div><b>${esc(t('profile.buddy'))}</b><small>${esc(t(`mascot.${buddy}`))} · ${esc(t(`mascot.${buddy}.desc`))}</small></div><button class="profile-link" id="profileBuddy">${esc(t('profile.chooseBuddy'))} ›</button></section>
      <section class="setting-card profile-row profile-voice"><div><b>${esc(t('profile.voice'))}</b><small>${esc(t('onboarding.voice.sub'))}</small></div><div class="quick-pills">${guides.map(([id,art])=>`<button class="quick-pill ${K.state.voice===id?'selected':''}" data-voice="${id}" aria-label="${esc(t(id==='Milo'?'voice.milo':id==='Luna'?'voice.luna':'voice.silent'))}">${art?`<img class="mascot-face" src="${art}" alt="">`:'🔇'}</button>`).join('')}</div></section>
      <section class="setting-card profile-row lang-card"><div><b>${esc(t('settings.language'))}</b><small>${esc(t('settings.languageSub'))}</small></div><div class="lang-toggle">${langOrder().map(l=>`<button data-setlang="${l.id}" class="${K.state.language===l.id?'active':''}">${l.flag} ${esc(l.id.toUpperCase())}</button>`).join('')}</div></section>`;
    const f=nativeScreen({cls:'profile-screen',title:t('profile.title'),subtitle:t('profile.sub'),body,active:''});
    f.querySelector('#profileName').onsubmit=e=>{e.preventDefault();const v=f.querySelector('#profileInput').value.trim();if(!v)return;K.state.name=v;K.save();K.sfx('good');K.toast(t('profile.saved'))};
    f.querySelector('#profileBuddy').onclick=()=>{K.sfx('tap');K.showCollection('mascots')};
    f.querySelector('[data-stats]').onclick=()=>{K.sfx('tap');K.showStats()};
    f.querySelectorAll('[data-voice]').forEach(b=>b.onclick=()=>{K.sfx('tap');K.setVoice(b.dataset.voice);K.showProfile()});
    f.querySelectorAll('[data-setlang]').forEach(b=>b.onclick=()=>{K.sfx('tap');if(K.setLanguage(b.dataset.setlang)){K.useBank();K.showProfile()}});
  };

  /* ---------------- Choosing a world for a game ---------------- */

  // Wat ben ik?, Fotozoom and Weetjes are played in one world or in all of them
  // at once — the same choice Memo has always had. One picker serves all three:
  // the mix first, then the eight worlds, each behind its own painting.
  // `worlds` zegt welke werelden een spel aankan. Weetjes leest dat uit de
  // bank zelf: een wereld zonder weetjes staat niet in de kiezer, want een knop
  // die op een leeg scherm uitkomt is erger dan een knop die er niet is.
  const GAME_PICKERS={
    whoami:{kicker:'whoami.title',art:()=>K.GAME_ART.whoami,mix:'mix',start:w=>K.startWhoAmI(w),locked:w=>!K.premium.can('memo',w)},
    fotozoom:{kicker:'fotozoom.title',art:()=>K.GAME_ART.fotozoom,mix:'mix',start:w=>K.startFotozoom(w),locked:w=>!K.premium.can('memo',w)},
    facts:{kicker:'facts.title',art:()=>K.GAME_ART.facts,mix:'all',start:w=>K.showFacts(w),locked:()=>false,worlds:()=>K.factWorlds?.()||shown()}
  };
  K.showGamePicker=game=>{
    const P=GAME_PICKERS[game];if(!P)return;
    K.audio.setTrack('play').catch(()=>{});
    K.stopSpeech();K.lastView='home';
    const mixArt=game==='facts'?K.GAME_ART.facts:K.GAME_ART.memoAll;
    const f=K.frame(`<section class="native-panel-screen memo-picker game-picker fade-in">
      <div class="native-panel-glow"></div>
      <header class="panel-head"><button class="panel-back" aria-label="${esc(t('common.back'))}">${K.icon('back')}</button><div><h1 class="game-name">${esc(t(P.kicker))}</h1><p>${esc(t('game.pickSub'))}</p></div><span class="panel-settings panel-spacer" aria-hidden="true"></span></header>
      <div class="panel-scroll">
        <button class="memo-pick mix" data-pick="${P.mix}"><img class="home-game-art" src="${mixArt}" alt="" decoding="async"><span class="home-game-veil"></span><b>${esc(t('game.mixAll'))}</b></button>
        <div class="memo-pick-grid">${(P.worlds?P.worlds():shown()).map(w=>`<button class="memo-pick ${P.locked(w)?'locked':''}" data-pick="${w}"><img class="home-game-art" src="${K.tileArt(w)}" alt="" decoding="async" style="${K.tileStyle(w)}"><span class="home-game-veil"></span>${P.locked(w)?K.premiumBadge():''}<b>${esc(worldTitle(w))}</b></button>`).join('')}</div>
      </div>
      ${K.bottomNav('home')}
    </section>`);
    f.querySelector('.panel-back').onclick=()=>{K.sfx('tap');K.backFromGame()};
    f.querySelectorAll('[data-pick]').forEach(b=>b.onclick=()=>{K.sfx('world');P.start(b.dataset.pick)});
    K.bindNav(f);
  };

  /* ---------------- Collection ---------------- */

  // The golden world cards are their own paintings; a world whose painting has
  // not been added yet falls back to the world art (see wireFallbacks).
  const goldArt=w=>K.goldArt(w);
  // The painted banner on a golden card carries the world's name in Dutch,
  // because that is the language the art was made in. In any other language the
  // app lays its own band over it, in the same gold, with the name the child
  // reads everywhere else. (The lasting fix is a set of cards without text; the
  // band can then simply be shown in every language.)
  // Kunst and Sport carry a two-line painted title ("Gouden Kunstwereld"): a taller band covers it.
  const goldBand=w=>K.state.language==='nl'?'':`<span class="gold-band ${w==='kunst'||w==='sport'?'tall':''}">${esc(worldTitle(w))}</span>`;
  K.goldBand=goldBand;
  // An <img> may not carry an inline onerror (the page's CSP forbids inline
  // script), so the fallback is wired here, once per screen.
  const wireFallbacks=K.wireFallbacks=root=>root.querySelectorAll('img[data-fallback]').forEach(im=>{
    const step=()=>{const list=(im.dataset.fallback||'').split('|').filter(Boolean),next=list.shift();im.dataset.fallback=list.join('|');if(!next)return;im.src=next;if(list.length)im.addEventListener('error',step,{once:true})};
    im.addEventListener('error',step,{once:true});
  });


  // The Mega Quiz in the collection: how often it was played and the best score.
  const megaRun=()=>K.runFor('mega',null);
  const megaRow=()=>{const r=megaRun(),total=Number(r.total||K.MEGA_SIZE||80),best=Number(r.best||0);
    return `<button class="progress-world mega-progress" id="megaProgress"><span class="progress-world-icon"><img class="world-badge" src="${K.GAME_ART.memoAll}" alt=""></span><span><b>${esc(t('mega.title'))}</b><small>${esc(t('mega.collectionLine',{played:Number(r.played||0),best,total}))}</small><span class="wide-track"><i style="width:${total?Math.round(best/total*100):0}%"></i></span></span><em>${best}</em></button>`};
  K.showCollection=(tab='worlds')=>{
    K.stopSpeech();K.lastView='collection';
    const ids=progress().correctQuestionIds;
    const cards=ids.map(id=>K.questions.find(q=>q.id===id)).filter(Boolean);
    let content='';
    if(tab==='worlds'){
      const all=K.totalPoints(),allPct=all.max?Math.round(all.points/all.max*100):0;
      content=`<div class="progress-overall"><b>${esc(t('progress.overall',{points:all.points,max:all.max}))}</b><span class="wide-track"><i style="width:${allPct}%"></i></span><small>${esc(t('progress.overallSub'))}</small></div>
        <div class="world-progress-grid">${shown().map(w=>{const p=K.worldPoints(w);return`<button class="progress-world" data-world="${w}"><span class="progress-world-icon">${K.worldBadge(w)}</span><span><b>${esc(worldTitle(w))}</b><small>${esc(t('progress.worldLine',{passed:p.passed,total:p.total,points:p.points}))}</small><span class="wide-track"><i style="width:${p.max?Math.round(p.points/p.max*100):0}%"></i></span></span><em>${p.points}</em></button>`}).join('')}${megaRow()}</div>`;
    }
    // Knowledge cards: a collectable trading card per correctly answered
    // question, with that question's own illustration. Rarity follows the
    // question's difficulty (1-4).
    const RARITY=['common','common','rare','epic','legendary'];
    // The card is filled edge to edge: the world's own painting is the
    // frame texture, the question art sits in the window, and the fact is a
    // dark glass panel — no flat or white areas anywhere.
    const card=q=>`<button class="kcard world-${q.world} ${RARITY[q.difficulty]||'common'}" data-card="${q.id}">
        <span class="kcard-frame">
          <img class="kcard-bg" src="${K.MASTER[q.world]}" alt="" style="object-position:${K.WORLD_FOCUS?.[q.world]||'center'}" decoding="async">
          <span class="kcard-tint"></span>
          <span class="kcard-top"><b>${esc(q.answer)}</b><i>${'★'.repeat(Math.max(1,Math.min(4,q.difficulty||1)))}</i></span>
          <span class="kcard-art"><img src="${K.questionArt?.(q)||K.MASTER[q.world]}" alt="" loading="lazy" decoding="async"></span>
          <span class="kcard-type">${K.worldBadge(q.world,'tiny')} ${esc(worldTitle(q.world))} · ${esc(topicLabel(q.topic))}</span>
          <span class="kcard-text">${esc(q.fact||q.explanation||'')}</span>
          <span class="kcard-foot"><span>#${String(K.questions.indexOf(q)+1).padStart(3,'0')}</span><span>${esc(t('collection.discovered'))}</span></span>
        </span>
      </button>`;
    // A golden card is one whole world on one card: bought with coins, it sits
    // in front of the cards that were answered for.
    // A golden card is one whole world on one card, earned by finishing that
    // world at all six levels (or bought in the shop). The painting is a
    // finished card in itself — frame, title and all — so it is shown edge to
    // edge with nothing but a line saying how it was come by.
    const goldCard=w=>`<button class="kcard gold is-art world-${w}" data-gold="${w}" aria-label="${esc(t('shop.goldCard',{world:worldTitle(w)}))}">
        <span class="kcard-frame">
          <img class="kcard-bg" src="${goldArt(w)}" data-fallback="${K.goldFallback(w)}" alt="" decoding="async">
          ${goldBand(w)}
          <span class="kcard-own">${esc(K.worldMastered(w)?t('shop.earned'):t('shop.owned'))}</span>
        </span>
      </button>`;
    // A card the runner handed out: its own painting, its own level.
    const runnerCard=c=>{const art=K.assetUrl(c.art),scene=K.assetUrl(`assets/games/jungle/img/picker-${c.level}.jpg`),level=t('jungle.level'+c.level[0].toUpperCase()+c.level.slice(1));
      return `<button class="kcard runner" data-runner="${c.id}">
        <span class="kcard-frame">
          <img class="kcard-bg" src="${scene}" data-fallback="${art}" alt="" decoding="async">
          <span class="kcard-tint"></span>
          <span class="kcard-top"><b>${esc(t('card.'+c.id))}</b><i>★★★</i></span>
          <span class="kcard-art"><img src="${art}" alt="" loading="lazy" decoding="async"></span>
          <span class="kcard-type">🏃 ${esc(t('jungle.name'))} · ${esc(level)}</span>
          <span class="kcard-text">${esc(t('jungle.cardSub'))}</span>
          <span class="kcard-foot"><span>${esc(t('jungle.cardEyebrow'))}</span><span>${esc(t('collection.discovered'))}</span></span>
        </span>
      </button>`;};
    const goldOwned=K.goldCards();
    const runnerOwned=K.runnerCards();
    if(tab==='cards') content=cards.length||goldOwned.length||runnerOwned.length
      ?`<div class="kcard-grid">${goldOwned.map(goldCard).join('')}${runnerOwned.map(runnerCard).join('')}${cards.map(card).join('')}</div>`
      :`<div class="empty-state"><div>🃏</div><h2>${esc(t('collection.emptyTitle'))}</h2><p>${esc(t('collection.emptyBody'))}</p></div>`;
    if(tab==='mascots'){
      content=`<div class="mascot-grid">${MASCOTS.map(m=>{
        const ok=mascotOwned(m),sel=K.state.selectedMascot===m.id;
        // Locked buddies show as a dark silhouette with a lock, so the child
        // can see who is waiting to be unlocked.
        // The character fills the whole tile; only the name sits on it. A
        // locked buddy is a dark silhouette with a lock and how many more
        // correct answers it takes.
        const art=K.MASCOT_TILE[m.id]||K.MASCOT_ART[m.id];
        const sub=ok?'':`<small>${esc(Number.isFinite(m.need)?t('collection.mascotLocked',{n:Math.max(0,m.need-mascotProgress())}):t('collection.mascotShop',{n:mascotPrice(m)}))}</small>`;
        const state=sel?`<span class="mascot-state">${esc(t('collection.mascotActive'))}</span>`:'';
        return`<button class="mascot-card ${ok?'unlocked':'locked'} ${sel?'selected':''}" data-mascot="${m.id}" ${ok?'':'disabled'} aria-label="${esc(t(`mascot.${m.id}`))}"><img class="mascot-fill" src="${art}" alt="" decoding="async">${ok?'':'<i class="mascot-lock">🔒</i>'}${state}<b class="mascot-name">${esc(t(`mascot.${m.id}`))}${sub}</b></button>`;
      }).join('')}</div><div class="collection-note">${esc(t('collection.mascotCount',{unlocked:unlockedMascots().length,total:MASCOTS.length}))}</div>`;
    }
    // The shop: coins from the games buy a golden card or a buddy the child has
    // not reached yet. Nothing here can be bought with money — see premium.js.
    // Talen: the passport's stamps and every word learned; a tap says it again.
    if(tab==='words'){
      const T=K.talenSummary?.();
      const l=T?.learn,app=K.talenSpeakLang?.()||K.state.language;
      content=!T||!T.words.length
        ?`<div class="empty-state"><div>🗣️</div><h2>${esc(t('collection.wordsEmpty'))}</h2><p>${esc(t('collection.wordsEmptyBody'))}</p><button class="talen-start" id="toTalen">${K.icon('play')} ${esc(t('talen.title'))}</button></div>`
        :`<div class="talen-stamps talen-stamps-mini">${T.themes.map(th=>`<div class="talen-stamp ${th.stars?'done':''} ${th.ready?'':'soon'}">${th.img?`<img src="${th.img}" alt="">`:`<span class="talen-stamp-icon" aria-hidden="true">${th.icon}</span>`}<b>${esc(t('talen.theme.'+th.id))}</b><span class="talen-stars">${[1,2,3].map(n=>`<i class="${n<=th.stars?'on':''}">★</i>`).join('')}</span></div>`).join('')}</div>
          <p class="talen-msg">${esc(t('collection.wordsCount',{n:T.words.length,lang:t('talen.lang.'+l)}))}</p>
          <div class="talen-learned talen-words-grid">${T.words.map(id=>{const w=K.talenWord(id);return `<button class="talen-chip" data-hear="${id}">${w.emoji?`<span class="talen-emoji" aria-hidden="true">${w.emoji}</span>`:`<img src="${w.img}" alt="">`}<span><b>${esc(w.text[l])}</b><small>${esc(t('talen.means',{word:w.text[app]}))} 🔊</small></span></button>`}).join('')}</div>`;
    }
    if(tab==='shop'){
      const wallet=Number(K.state.coins||0);
      const tile=(id,title,sub,price,art,cls='',fallback='')=>{
        const owned=K.owned(id),short=Math.max(0,price-wallet);
        return `<article class="shop-item ${cls} ${owned?'is-owned':''}">
          <img class="shop-art" src="${art}"${fallback?` data-fallback="${fallback}"`:''} alt="" loading="lazy" decoding="async">
          <div class="shop-copy"><b>${esc(title)}</b><small>${esc(sub)}</small></div>
          ${owned?`<span class="shop-owned">${esc(t('shop.owned'))}</span>`
            :`<button class="shop-buy${short?' is-short':''}" data-buy="${id}" data-price="${price}" data-title="${esc(title)}">${K.icon('coin')} ${esc(t('shop.price',{n:price}))}</button>
               ${short?`<small class="shop-short">${esc(t('shop.need',{n:short}))}</small>`:''}`}
        </article>`;
      };
      const golds=shown().map(w=>tile(`gold:${w}`,t('shop.goldCard',{world:worldTitle(w)}),t('shop.goldCardSub'),GOLD_PRICE,goldArt(w),'is-gold',K.goldFallback(w)));
      const buddies=MASCOTS.filter(m=>mascotProgress()<m.need).sort((a,b)=>mascotPrice(a)-mascotPrice(b)).map(m=>tile(`mascot:${m.id}`,t(`mascot.${m.id}`),t(`mascot.${m.id}.desc`),mascotPrice(m),K.MASCOT_TILE[m.id]||K.MASCOT_ART[m.id]));
      const sold=[...golds,...buddies].length&&[...golds,...buddies].every(h=>/is-owned/.test(h));
      content=`<div class="shop-wallet"><span>${K.icon('coin')}</span><b>${wallet}</b><small>${esc(t('shop.earnHint'))}</small></div>
        <h2 class="section-title">${esc(t('shop.cards'))}</h2><div class="shop-grid">${golds.join('')}</div>
        ${buddies.length?`<h2 class="section-title">${esc(t('shop.mascots'))}</h2><div class="shop-grid">${buddies.join('')}</div>`:''}
        ${sold?`<p class="collection-note">${esc(t('shop.empty'))}</p>`:''}`;
    }
    const body=`<div class="collection-tabs"><button data-tab="worlds" class="${tab==='worlds'?'active':''}">${esc(t('collection.tabWorlds'))}</button><button data-tab="cards" class="${tab==='cards'?'active':''}">${esc(t('collection.tabCards'))}</button><button data-tab="mascots" class="${tab==='mascots'?'active':''}">${esc(t('collection.tabMascots'))}</button><button data-tab="words" class="${tab==='words'?'active':''}">${esc(t('collection.tabWords'))}</button><button data-tab="shop" class="${tab==='shop'?'active':''}">${esc(t('shop.tab'))}</button></div>${content}`;
    const f=nativeScreen({cls:'collection-screen',title:t('collection.title'),subtitle:t('collection.sub'),body,active:'collection'});
    wireFallbacks(f);
    f.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{K.sfx('tap');K.showCollection(b.dataset.tab)});
    f.querySelectorAll('[data-hear]').forEach(b=>b.onclick=()=>{K.sfx('tap');K.talenHear?.(b.dataset.hear)});
    f.querySelector('#toTalen')?.addEventListener('click',()=>{K.sfx('tap');K.showTalen()});
    // A golden or runner card opens large as well.
    const zoom=html=>{K.sfx('swoosh');const z=document.createElement('div');z.className='kcard-zoom fade-in';z.innerHTML=html;z.querySelector('.kcard').removeAttribute('data-gold');z.querySelector('.kcard').removeAttribute('data-runner');wireFallbacks(z);z.onclick=()=>{K.sfx('tap');z.remove()};f.appendChild(z)};
    f.querySelectorAll('[data-gold]').forEach(b=>b.onclick=()=>zoom(goldCard(b.dataset.gold)));
    f.querySelectorAll('[data-runner]').forEach(b=>b.onclick=()=>zoom(runnerCard(runnerOwned.find(c=>c.id===b.dataset.runner))));
    // Tapping a card shows it large; tapping anywhere closes it.
    f.querySelectorAll('[data-card]').forEach(b=>b.onclick=()=>{
      K.sfx('swoosh');
      const q=cards.find(x=>x.id===b.dataset.card);if(!q)return;
      const z=document.createElement('div');z.className='kcard-zoom fade-in';z.innerHTML=card(q);
      z.querySelector('.kcard').removeAttribute('data-card');
      z.onclick=()=>{K.sfx('tap');z.remove()};
      f.appendChild(z);
    });
    f.querySelectorAll('[data-world]').forEach(b=>b.onclick=()=>{K.sfx('tap');K.enterWorld(b.dataset.world)});
    f.querySelector('#megaProgress')?.addEventListener('click',()=>{K.sfx('world');K.startMega()});
    f.querySelectorAll('[data-mascot]:not([disabled])').forEach(b=>b.onclick=()=>{K.sfx('tap');K.state.selectedMascot=b.dataset.mascot;K.save();K.showCollection('mascots')});
    f.querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>{K.sfx('tap');confirmBuy(b.dataset.buy,Number(b.dataset.price),b.dataset.title)});
  };

  // Buying asks once, then pays. A child with too few coins is told how many
  // are missing instead of being shown a dead button.
  function confirmBuy(id,price,title){
    const f=K.app.querySelector('.game-frame');if(!f)return;
    const short=Math.max(0,price-Number(K.state.coins||0));
    const o=document.createElement('div');o.className='simple-modal';
    o.innerHTML=`<div class="simple-modal-card"><button class="simple-close" aria-label="${esc(t('common.close'))}">×</button><div class="simple-icon">${short?'🪙':'🛒'}</div>
      <h2>${esc(short?t('shop.need',{n:short}):t('shop.confirmTitle',{item:title}))}</h2>
      <p>${esc(short?t('shop.earnHint'):t('shop.confirmBody',{item:title,n:price}))}</p>
      ${short?`<button class="simple-ok">${esc(t('common.gotIt'))}</button>`
        :`<div class="confirm-actions"><button class="cancel">${esc(t('common.cancel'))}</button><button class="confirm buy">${esc(t('shop.buy'))}</button></div>`}</div>`;
    f.appendChild(o);
    const close=()=>o.remove();
    o.querySelector('.simple-close').onclick=close;
    o.querySelector('.simple-ok')?.addEventListener('click',close);
    o.querySelector('.cancel')?.addEventListener('click',close);
    o.querySelector('.buy')?.addEventListener('click',()=>{
      if(!K.spendCoins(price)){close();return}
      K.own(id);K.sfx('reward');close();
      K.toast(t('shop.bought',{item:title}));
      K.showCollection('shop');
    });
  }

  /* ---------------- Stats ---------------- */

  // Opened from inside a quiz, statistics return to that very question.
  K.showStats=({back}={})=>{
    K.stopSpeech();K.lastView='stats';
    const answered=Number(K.state.answered||0),correct=Number(K.state.correct||0);
    const pct=answered?Math.round(correct/answered*100):0;
    const medal=b=>b>=9?'gold':b>=7?'silver':b>0?'bronze':'';
    const medalIcon={gold:'🥇',silver:'🥈',bronze:'🥉'};
    const sparks=Array.from({length:10},(_,i)=>`<i style="--i:${i}"></i>`).join('');
    const sum=K.scoreSummary();
    const G=progress().games||{};
    // The hero: who is playing, how far the level has come, and how much of
    // everything answered was right — one panel instead of three.
    const hero=`<div class="stats-hero3d"><div class="stats-fx" aria-hidden="true">${sparks}</div>
      <div class="stat-orb" style="--p:0" data-p="${pct}"><span class="stat-orb-ring"></span><span class="stat-orb-glass"></span><b data-count="${pct}" data-suffix="%">0%</b><small>${esc(t('stats.correctShort'))}</small></div>
      <div class="stats-hero-copy">
        <span class="stats-hero-who"><img class="mascot-face" src="${K.guideArt(K.state.voice)}" alt=""><b>${esc(K.state.name||t('profile.title'))}</b></span>
        <h2>${esc(t('home.level',{level:K.level()}))}</h2>
        <span class="stats-xp"><i style="width:${K.xpIntoLevel()}%"></i></span>
        <p>${esc(t('stats.heroSub',{answered,quizzes:K.state.quizzesPlayed||0,quizWord:t((K.state.quizzesPlayed||0)===1?'stats.quizOne':'stats.quizMany')}))}</p>
      </div></div>`;
    // Four numbers that never need explaining, side by side.
    const chip=(cls,icon,value,label)=>`<article class="stat-tile ${cls}"><span class="stat-tile-icon">${icon}</span><b data-count="${value}">0</b><small>${esc(label)}</small></article>`;
    const chips=`<div class="stat-tiles">${chip('xp','⭐',Number(K.state.xp||0),t('stats.xpTotal'))}${chip('coins','🪙',Number(K.state.coins||0),t('stats.coins'))}${chip('streak','🔥',Number(K.state.streak||0),t('stats.streak'))}${chip('cards','🃏',K.cardCount(),t('stats.cards'))}</div>`;
    // The record book: every period as one row — what it stands at now, how far
    // that is along its own record, and the record itself.
    const rows=[{label:t('score.run'),now:sum.run.points,best:sum.run.best},
      ...sum.rows.map(r=>({label:t(`score.${r.unit}`),now:r.points,best:r.best}))];
    const records=`<section class="stat-card records">
      <div class="record-alltime"><span>${K.icon('trophy')}</span><div><b data-count="${sum.allTime}">0</b><small>${esc(t('score.allTime'))} · ${esc(t('score.points'))}</small></div></div>
      <div class="record-rows">${rows.map(r=>`<article><span class="record-label">${esc(r.label)}<em>${esc(t('score.best'))} ${r.best}</em></span><b>${r.now}</b><span class="record-track"><i style="width:${r.best?Math.min(100,Math.round(r.now/r.best*100)):0}%"></i></span></article>`).join('')}</div>
      <p class="record-note">${esc(t('score.todayPoints',{n:sum.rows[0].points,max:K.scoreRules.dayPoints}))} · ${esc(t('score.todayCoins',{n:sum.coins.earned,max:K.scoreRules.dayCoins}))}</p>
    </section>`;
    // Per world: the level it stands at, its best quiz, its points — the old
    // separate medal board said the same thing twice.
    const worlds=`<div class="world-stat-list v3">${shown().map(w=>{
      const st=worldStat(w),p=K.worldPoints(w),wp=p.max?Math.round(p.points/p.max*100):0;
      const b=Number((K.state.bestScores||{})[w]||0),m=medal(b);
      return`<article class="${m}"><img class="world-stat-art" src="${K.MASTER[w]}" alt="" loading="lazy" decoding="async" style="object-position:${K.WORLD_FOCUS?.[w]||'center'}">
        <div class="world-stat-copy"><b>${esc(worldTitle(w))}</b>
          <small>${esc(t('settings.level'))} ${K.worldLevel(w)} · ${esc(t('progress.worldLine',{passed:p.passed,total:p.total,points:p.points}))}</small>
          <small class="dim">${esc(t('stats.worldLine',{correct:st.correct,answered:st.answered,quizzes:st.quizzes,quizWord:t(st.quizzes===1?'stats.quizOne':'stats.quizMany')}))}</small>
          <span class="wide-track"><i style="width:${wp}%"></i></span></div>
        <div class="world-stat-best"><b>${b}/10</b>${m?`<i>${medalIcon[m]}</i>`:''}</div></article>`}).join('')}</div>`;
    // The games, each in one line, with their own best beside them.
    const memoBest=Object.values(G.memo?.best||{}).filter(Boolean);
    const mathBest=Object.values(G.math?.best||{}).filter(Boolean);
    const game=(icon,title,line,best)=>`<article class="game-stat"><span class="game-stat-icon">${icon}</span><div><b>${esc(title)}</b><small>${esc(line)}</small></div>${best?`<em>${esc(best)}</em>`:''}</article>`;
    const games=`<div class="game-stat-list">
      ${(r=>game('🌍',t('mega.title'),t('mega.collectionLine',{played:Number(r.played||0),best:Number(r.best||0),total:Number(r.total||K.MEGA_SIZE||80)}),r.best?`${r.best}/${r.total||K.MEGA_SIZE||80}`:''))(megaRun())}
      ${game('🧠',t('memo.title'),t('stats.memoLine',{played:Number(G.memo?.played||0),won:Number(G.memo?.won||0)}),memoBest.length?t('stats.memoBest',{n:Math.min(...memoBest)}):'')}
      ${game('🔢',t('math.title'),t('stats.mathLine',{played:Number(G.math?.played||0),won:Number(G.math?.won||0)}),mathBest.length?`${Math.max(...mathBest)}/10`:'')}
      ${game('🏃',t('jungle.name'),t('stats.runnerLine',{played:Number(G.jungle?.played||0),coins:Number(G.jungle?.coins||0)}),G.jungle?.best?`${G.jungle.best} 🪙`:'')}
      ${game('❓',t('whoami.title'),t('stats.playedLine',{played:Number(G.whoami?.played||0)}),G.whoami?.best?`${G.whoami.best} ⭐`:'')}
      ${game('🔍',t('fotozoom.title'),t('stats.playedLine',{played:Number(G.fotozoom?.played||0)}),G.fotozoom?.best?`${G.fotozoom.best} ⭐`:'')}
      ${(T=>T?game('🗣️',t('talen.title'),t('stats.talenLine',{words:T.words.length,lessons:T.lessons}),T.stamps.done?`★ ${T.stamps.done}/${T.stamps.total}`:''):'')(K.talenSummary?.())}
    </div>`;
    const body=`${hero}${chips}
      <h2 class="section-title">${esc(t('score.title'))}</h2>${records}
      <h2 class="section-title">${esc(t('stats.perWorld'))}</h2>${worlds}
      <h2 class="section-title">${esc(t('stats.games'))}</h2>${games}
      <button class="share-3d" id="statsShare"><span class="share-3d-icon">📣</span><span class="share-3d-copy"><b>${esc(t('settings.share'))}</b><small>${esc(t('settings.shareSub'))}</small></span><span class="share-3d-arrow">›</span></button>
      <p class="collection-note">${esc(t('score.capNote'))}</p>`;
    const f=nativeScreen({cls:'stats-screen',title:t('stats.title'),subtitle:t('stats.sub'),body,active:'stats',back:back||(()=>K.showHome())});
    f.querySelector('#statsShare').onclick=()=>{K.sfx('tap');K.shareScore()};
    // Numbers count up and the ring fills once the screen is on: the figures are
    // real, the motion just makes them feel earned.
    requestAnimationFrame(()=>{
      const orb=f.querySelector('.stat-orb');if(orb)orb.style.setProperty('--p',orb.dataset.p);
      f.querySelectorAll('[data-count]').forEach(el=>{const target=Number(el.dataset.count||0),suffix=el.dataset.suffix||'',t0=performance.now(),dur=900;
        const step=now=>{const k=Math.min(1,(now-t0)/dur),e=1-Math.pow(1-k,3);el.textContent=Math.round(target*e)+suffix;if(k<1)requestAnimationFrame(step)};requestAnimationFrame(step)});
    });
  };

  /* ---------------- Parent zone ---------------- */

  // Terms of Use: a plain modal (the Premium screen links here; Apple wants both links reachable).
  K.showTermsInfo=()=>{
    const f=K.app.querySelector('.game-frame');if(!f)return;
    const o=document.createElement('div');o.className='simple-modal';
    o.innerHTML=`<div class="simple-modal-card"><button class="simple-close" aria-label="${esc(t('common.close'))}">×</button><div class="simple-icon">📄</div><h2>${esc(t('settings.terms'))}</h2><p>${esc(t('settings.termsBody'))}</p><button class="simple-ok">${esc(t('common.gotIt'))}</button></div>`;
    f.appendChild(o);const close=()=>o.remove();o.querySelector('.simple-close').onclick=close;o.querySelector('.simple-ok').onclick=close;
  };
  // The privacy screen of the parent zone: what sits on this device (with the
  // real values, so a parent can see it instead of taking our word for it), what
  // leaves it, what the app never does, how long anything is kept, and one
  // button that erases the lot. Apple's Kids Category and the COPPA rule both
  // want the retention and deletion lines inside the notice itself, so they live
  // here in the app, in every language, not only on the website.
  const PRIVACY_UPDATED='2026-10-03';
  // The date written out in the reader's language: 3 oktober 2026, 3 October 2026.
  const updatedOn=()=>{const lang=K.state.language==='en'?'en-GB':K.state.language||'nl';try{return new Intl.DateTimeFormat(lang,{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(PRIVACY_UPDATED+'T00:00:00Z'))}catch(e){return PRIVACY_UPDATED}};
  // Who answers for the data (GDPR art. 13, the stores' trader details). A name
  // and an address read the same in every language.
  const PUBLISHER='Olijve Holding B.V. · Hunenoord 20, 7822 BP Emmen · KvK 89749685';
  const contactMail=()=>'stefan@kwizillo.com';
  K.showPrivacy=({back}={})=>{
    K.stopSpeech();K.lastView='privacy';
    const p=progress();
    const stored=[
      t('privacy.itemName',{value:String(K.state.name||'').trim()||'–'}),
      t('privacy.itemSettings'),
      t('privacy.itemProgress',{answered:Number(K.state.answered||0),correct:Number(K.state.correct||0),cards:K.cardCount()}),
      t('privacy.itemPremium')
    ];
    const block=(icon,title,text,list)=>`<section class="privacy-block"><header><span aria-hidden="true">${icon}</span><h2>${esc(title)}</h2></header><p>${esc(text)}</p>${list?`<ul>${list.map(i=>`<li>${esc(i)}</li>`).join('')}</ul>`:''}</section>`;
    const body=`${block('📱',t('privacy.device'),t('privacy.deviceBody'),stored)}
      ${block('🗣️',t('privacy.leaves'),t('privacy.leavesBody'))}
      ${block('🚫',t('privacy.none'),t('privacy.noneBody'))}
      ${block('⏳',t('privacy.keep'),t('privacy.keepBody'))}
      <p class="collection-note">${esc(t('privacy.noAccount'))}</p>
      <section class="setting-card clickable" id="privacyContact"><div class="setting-icon">✉️</div><div><b>${esc(t('privacy.contact'))}</b><small>${esc(t('privacy.contactSub',{email:contactMail()}))}</small></div><em>›</em></section>
      <section class="setting-card clickable reset-card" id="eraseOpen"><div class="setting-icon">🗑️</div><div><b>${esc(t('privacy.erase'))}</b><small>${esc(t('privacy.eraseSub'))}</small></div><em>›</em></section>
      <p class="privacy-updated">${esc(t('privacy.updated',{date:updatedOn()}))}</p>
      <p class="privacy-publisher">${esc(PUBLISHER)}</p>`;
    const f=nativeScreen({cls:'privacy-screen',title:t('settings.privacy'),subtitle:t('privacy.sub'),body,active:'parent',back:back||(()=>K.showParent())});
    // Writing mail leaves the app and erasing cannot be undone: both wait for a grown-up.
    f.querySelector('#privacyContact').onclick=()=>{K.sfx('tap');showParentalGate(()=>{location.href=`mailto:${contactMail()}`})};
    f.querySelector('#eraseOpen').onclick=()=>{K.sfx('tap');showParentalGate(showEraseConfirm)};
  };
  K.showPrivacyInfo=()=>K.showPrivacy();   // the Premium screen links here too

  function showEraseConfirm(){
    const f=K.app.querySelector('.game-frame');if(!f)return;
    const o=document.createElement('div');o.className='simple-modal';
    o.innerHTML=`<div class="simple-modal-card danger"><button class="simple-close" aria-label="${esc(t('common.close'))}">×</button><div class="simple-icon">🗑️</div><h2>${esc(t('privacy.eraseTitle'))}</h2><p>${esc(t('privacy.eraseBody'))}</p><div class="confirm-actions"><button class="cancel">${esc(t('common.cancel'))}</button><button class="confirm">${esc(t('privacy.eraseConfirm'))}</button></div></div>`;
    f.appendChild(o);
    o.querySelector('.simple-close').onclick=()=>o.remove();
    o.querySelector('.cancel').onclick=()=>o.remove();
    o.querySelector('.confirm').onclick=()=>{K.eraseAllData();location.reload()};
  }

  // Resetting wipes everything, so it sits behind a parental gate rather than a
  // plain confirm a child can tap through (CLAUDE.md section 17, kids/privacy).
  K.parentalGate=onPass=>showParentalGate(onPass);
  // Ideas and feedback from the players: an idea, something that is not right, or
  // a compliment, in their own words. It leaves the app as an e-mail the parent
  // sends (behind the parental gate, like the privacy contact): no server, no
  // account, and no name of the child. What goes along is the app language and the
  // level, so a "this is not right" can be found.
  function showFeedback(){
    const f=K.app.querySelector('.game-frame');if(!f)return;
    const kinds=['idea','bug','love'],icons={idea:'💡',bug:'📝',love:'💛'};
    let kind='idea';
    const guide=K.state.voice==='Luna'?'luna':'milo';
    const o=document.createElement('div');o.className='simple-modal feedback-modal';
    o.innerHTML=`<div class="simple-modal-card"><button class="simple-close" aria-label="${esc(t('common.close'))}">×</button>
      <div class="ideas-hero"><img class="ideas-guide" src="${K.MASCOT_ART[guide]}" alt=""><span class="ideas-bubble">💬</span></div>
      <h2 class="ideas-title">${esc(t('feedback.title'))}</h2><p class="ideas-lead">${esc(t('feedback.lead'))}</p>
      <div class="feedback-kinds" role="radiogroup">${kinds.map(k=>`<button type="button" role="radio" data-kind="${k}" class="kind-${k}${k===kind?' active':''}" aria-checked="${k===kind}"><span class="ideas-emoji">${icons[k]}</span><b>${esc(t('feedback.kind.'+k))}</b></button>`).join('')}</div>
      <textarea id="feedbackText" maxlength="1200" rows="5" placeholder="${esc(t('feedback.placeholder'))}" aria-label="${esc(t('feedback.title'))}"></textarea>
      <p class="feedback-error" hidden>${esc(t('feedback.empty'))}</p>
      <button class="simple-ok ideas-send" id="feedbackSend">✉️ ${esc(t('feedback.send'))}</button><small class="feedback-note">${esc(t('feedback.note'))}</small></div>`;
    f.appendChild(o);
    const text=o.querySelector('#feedbackText'),err=o.querySelector('.feedback-error');
    o.querySelector('.simple-close').onclick=()=>{K.sfx('tap');o.remove()};
    o.querySelectorAll('[data-kind]').forEach(b=>b.onclick=()=>{K.sfx('tap');kind=b.dataset.kind;o.querySelectorAll('[data-kind]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-checked',String(x===b))})});
    o.querySelector('#feedbackSend').onclick=()=>{
      const msg=text.value.trim();
      if(!msg){err.hidden=false;text.focus();return}
      K.sfx('tap');
      showParentalGate(()=>{
        const subject=`Kwizillo feedback: ${t('feedback.kind.'+kind)}`;
        const body=`${msg}\n\n---\n${t('feedback.kind.'+kind)} · ${K.state.language} · ${t('settings.level')} ${K.state.niveau||1}`;
        location.href=`mailto:${contactMail()}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        o.querySelector('.simple-modal-card').innerHTML=`<div class="ideas-hero"><img class="ideas-guide" src="${K.MASCOT_ART[guide]}" alt=""><span class="ideas-bubble">🙏</span></div><h2 class="ideas-title">${esc(t('feedback.thanksTitle'))}</h2><p class="ideas-lead">${esc(t('feedback.thanks'))}</p><button class="simple-ok ideas-send" id="feedbackDone">${esc(t('common.close'))}</button>`;
        o.querySelector('#feedbackDone').onclick=()=>{K.sfx('tap');o.remove()};
        K.cheer?.(o.querySelector('.simple-modal-card'));
      });
    };
    setTimeout(()=>text.focus(),150);
  }
  K.showFeedback=showFeedback;

  function showParentalGate(onPass){
    const f=K.app.querySelector('.game-frame');if(!f)return;
    // Beyond a six-to-eight-year-old, trivial for a grown-up: two digits times
    // one is what App Review 1.3 asks a parental gate to be.
    const a=11+Math.floor(Math.random()*9), b=3+Math.floor(Math.random()*7);
    const o=document.createElement('div');o.className='simple-modal';
    o.innerHTML=`<div class="simple-modal-card"><button class="simple-close" aria-label="${esc(t('common.close'))}">×</button><div class="simple-icon">🔐</div><h2>${esc(t('gate.title'))}</h2><p>${esc(t('gate.body',{a,b}))}</p><form class="gate-form"><input id="gateInput" type="text" inputmode="numeric" autocomplete="off" placeholder="${esc(t('gate.placeholder'))}" aria-label="${esc(t('gate.placeholder'))}"><small class="gate-error" hidden>${esc(t('gate.wrong'))}</small><button type="submit" class="simple-ok">${esc(t('gate.continue'))}</button></form></div>`;
    f.appendChild(o);
    const input=o.querySelector('#gateInput'),err=o.querySelector('.gate-error');
    o.querySelector('.simple-close').onclick=()=>o.remove();
    o.querySelector('.gate-form').onsubmit=e=>{
      e.preventDefault();
      if(Number(input.value.trim())===a*b){o.remove();onPass()}
      else{err.hidden=false;input.value='';input.focus()}
    };
    setTimeout(()=>input.focus(),100);
  }

  function showConfirm({icon,title,body,confirm,onConfirm}){
    const f=K.app.querySelector('.game-frame');if(!f)return;
    const o=document.createElement('div');o.className='simple-modal';
    o.innerHTML=`<div class="simple-modal-card danger"><button class="simple-close" aria-label="${esc(t('common.close'))}">×</button><div class="simple-icon">${icon}</div><h2>${esc(title)}</h2><p>${esc(body)}</p><div class="confirm-actions"><button class="cancel">${esc(t('common.cancel'))}</button><button class="confirm">${esc(confirm)}</button></div></div>`;
    f.appendChild(o);
    o.querySelector('.simple-close').onclick=()=>o.remove();
    o.querySelector('.cancel').onclick=()=>o.remove();
    o.querySelector('.confirm').onclick=()=>{o.remove();onConfirm()};
  }

  function confirmDelete(name){
    showConfirm({icon:'🗑️',title:t('players.deleteTitle',{name}),body:t('players.deleteBody',{name}),confirm:t('players.delete'),onConfirm:()=>{const r=K.players.remove(name);if(r==='fresh')return K.startOnboarding({from:'name'});if(r==='switched')return K.showWelcomeBack();K.showParent()}});
  }
  function showPlayerPick(players,onPick){
    const f=K.app.querySelector('.game-frame');if(!f)return;
    const o=document.createElement('div');o.className='simple-modal';
    o.innerHTML=`<div class="simple-modal-card"><button class="simple-close" aria-label="${esc(t('common.close'))}">×</button><div class="simple-icon">🗑️</div><h2>${esc(t('players.deletePick'))}</h2><div class="player-pick">${players.map(p=>`<button data-pick="${esc(p.name)}"><span class="player-face">${esc((p.name[0]||'?').toUpperCase())}</span><b>${esc(p.name)}</b>${p.current?`<small>${esc(t('players.current'))}</small>`:''}</button>`).join('')}</div></div>`;
    f.appendChild(o);
    o.querySelector('.simple-close').onclick=()=>o.remove();
    o.querySelectorAll('[data-pick]').forEach(b=>b.onclick=()=>{K.sfx('tap');o.remove();onPick(b.dataset.pick)});
  }

  // "Voortgang resetten" puts the player who plays now back to 0; the name,
  // language, guide and settings stay (K.players.resetProgress).
  function showResetConfirm(){
    const f=K.app.querySelector('.game-frame');if(!f)return;
    const o=document.createElement('div');o.className='simple-modal';
    o.innerHTML=`<div class="simple-modal-card danger"><button class="simple-close" aria-label="${esc(t('common.close'))}">×</button><div class="simple-icon">♻️</div><h2>${esc(t('settings.resetTitle'))}</h2><p>${esc(t('settings.resetBody'))}</p><div class="confirm-actions"><button class="cancel">${esc(t('common.cancel'))}</button><button class="confirm">${esc(t('settings.resetConfirm'))}</button></div></div>`;
    f.appendChild(o);
    o.querySelector('.simple-close').onclick=()=>o.remove();
    o.querySelector('.cancel').onclick=()=>o.remove();
    o.querySelector('.confirm').onclick=()=>{o.remove();K.players.resetProgress(K.state.name);K.showParent()};
  }

  K.showParent=()=>{
    K.stopSpeech();K.lastView='parent';
    const voiceLine=K.state.voice==='Stil'?t('settings.soundVoiceOff'):t('settings.soundVoiceOn',{voice:t(K.state.voice==='Milo'?'voice.milo':'voice.luna')});
    const musicLine=t('settings.soundMusic',{state:t(K.state.musicOn===false?'settings.off':'settings.on')});
    const body=`<div class="settings-list">
      ${K.premiumCard()}
      <section class="setting-card level-card"><div class="setting-icon">🎯</div><div><b>${esc(t('settings.levelMath'))} ${K.state.niveau||1}</b><small>${esc(levelSummary(K.state.niveau||1))}</small></div><div class="level-toggle">${[1,2,3,4,5,6].map(v=>`<button data-level="${v}" class="${Number(K.state.niveau||1)===v?'active':''} ${K.premium.can('math',v)?'':'premium-level'}">${v}</button>`).join('')}</div></section>
      <section class="setting-card lang-card"><div class="setting-icon">🌍</div><div><b>${esc(t('settings.language'))}</b><small>${esc(t('settings.languageSub'))}</small></div><div class="lang-toggle">${langOrder().map(l=>`<button data-setlang="${l.id}" class="${K.state.language===l.id?'active':''}">${l.flag} ${esc(l.id.toUpperCase())}</button>`).join('')}</div></section>
      <section class="setting-card clickable" id="soundOpen"><div class="setting-icon">🔊</div><div><b>${esc(t('settings.sound'))}</b><small>${esc(voiceLine)} · ${esc(musicLine)}</small></div><em>›</em></section>
      <section class="setting-card"><div class="setting-icon">⏱️</div><div><b>${esc(t('settings.timeLimit'))}</b><small id="timeLabel">${esc(K.state.timeLimitOn===false?t('settings.timeLimitOff'):t('settings.timeLimitPerWorld'))}</small></div><button class="native-switch ${K.state.timeLimitOn!==false?'on':''}" id="timeToggle" aria-label="${esc(t('settings.timeLimit'))}"><i></i></button></section>
      <section class="setting-card world-levels"><div class="setting-icon">🗺️</div><div><b>${esc(t('settings.levelWorlds'))}</b><small>${esc(t('settings.levelWorldsSub'))}</small></div><div class="world-level-row">${shown().map(w=>`<span title="${esc(worldTitle(w))}">${K.worldBadge(w,'tiny')}<i>${K.worldLevel(w)}</i></span>`).join('')}</div></section>
      <section class="setting-card tour-card"><div class="setting-icon">🧭</div><div><b>${esc(t('tour.pick'))}</b><small>${esc(t('tour.pickSub'))}</small></div><div class="tour-guides"><button data-tour="milo"><img class="mascot-face" src="${K.MASCOT_ART.milo}" alt="">${esc(t('voice.milo'))}</button><button data-tour="luna"><img class="mascot-face" src="${K.MASCOT_ART.luna}" alt="">${esc(t('voice.luna'))}</button></div></section>
      <section class="setting-card players-card"><div class="setting-icon">👨‍👩‍👧</div><div><b>${esc(t('players.title'))}</b><small>${esc(t('players.sub'))}</small></div><div class="player-list">${K.players.all().map(p=>`<div class="player-row"><span class="player-face">${esc((p.name[0]||'?').toUpperCase())}</span><span class="player-name"><b>${esc(p.name)}</b><small>${esc(p.current?t('players.current'):t('settings.level')+' '+Math.max(1,1+Math.floor(Number(p.state?.xp||0)/100)))}</small></span></div>`).join('')}</div></section>
      <section class="setting-card clickable ideas-open" id="feedbackOpen"><div class="setting-icon">💬</div><div><b>${esc(t('settings.feedback'))}</b><small>${esc(t('settings.feedbackSub'))}</small></div><em>›</em></section>
      <section class="setting-card clickable" id="shareOpen"><div class="setting-icon">📣</div><div><b>${esc(t('settings.share'))}</b><small>${esc(t('settings.shareSub'))}</small></div><em>›</em></section>
      <section class="setting-card clickable" id="privacyOpen"><div class="setting-icon">🛡️</div><div><b>${esc(t('settings.privacy'))}</b><small>${esc(t('privacy.sub'))}</small></div><em>›</em></section>
      <section class="setting-card clickable reset-card" id="resetOpen"><div class="setting-icon">♻️</div><div><b>${esc(t('settings.reset'))}</b><small>${esc(t('settings.resetSub'))}</small></div><em>›</em></section>
      <section class="setting-card clickable" id="logoutOpen"><div class="setting-icon">🚪</div><div><b>${esc(t('settings.logout'))}</b><small>${esc(t('settings.logoutSub'))}</small></div><em>›</em></section>
      <section class="setting-card clickable reset-card" id="deleteOpen"><div class="setting-icon">🗑️</div><div><b>${esc(t('players.deleteCard'))}</b><small>${esc(t('players.deleteCardSub'))}</small></div><em>›</em></section>
    </div>`;
    const f=nativeScreen({cls:'parent-screen',title:t('settings.title'),subtitle:t('settings.sub'),body,active:'parent'});
    f.querySelectorAll('[data-setlang]').forEach(b=>b.onclick=()=>{K.sfx('tap');if(K.setLanguage(b.dataset.setlang)){K.useBank();K.showParent()}});
    f.querySelector('#feedbackOpen')?.addEventListener('click',()=>{K.sfx('tap');showFeedback()});
    f.querySelector('#soundOpen').onclick=()=>{K.sfx('tap');K.showSoundSettings()};
    f.querySelectorAll('[data-tour]').forEach(b=>b.onclick=()=>{K.sfx('tap');const guide=b.dataset.tour;K.showHome();setTimeout(()=>K.startTour({guide}),320)});
    K.warmTour?.('milo');K.warmTour?.('luna');   // either tour starts talking at once
    // Log out: who plays now is put away safely, then the device asks who plays.
    f.querySelector('#logoutOpen').onclick=()=>{K.sfx('tap');K.players.stash();K.showPlayerPicker()};
    // Delete a player: behind the parental gate, then (with more than one player)
    // which one, then a confirm.
    f.querySelector('#deleteOpen').onclick=()=>{K.sfx('tap');showParentalGate(()=>{const all=K.players.all();if(all.length===1)return confirmDelete(all[0].name);showPlayerPick(all,confirmDelete)})};
    f.querySelector('#timeToggle').onclick=()=>{K.sfx('tap');K.state.timeLimitOn=K.state.timeLimitOn===false;K.save();K.showParent()};
    f.querySelectorAll('[data-level]').forEach(b=>b.onclick=()=>{K.sfx('tap');K.state.niveau=Number(b.dataset.level);K.save();K.showParent()});
    f.querySelector('#shareOpen').onclick=()=>{K.sfx('tap');K.shareScore()};
    f.querySelector('#privacyOpen').onclick=()=>{K.sfx('tap');K.showPrivacy()};
    K.bindPremiumCard(f);
    f.querySelector('#resetOpen').onclick=()=>{K.sfx('tap');showParentalGate(showResetConfirm)};
  };

  K.showSoundSettings=()=>{
    K.stopSpeech();
    const f=K.app.querySelector('.game-frame');if(!f)return;
    f.querySelector('.sound-settings-overlay')?.remove();
    const o=document.createElement('div');o.className='sound-settings-overlay';
    const tracks=Object.values(K.audio.tracks).map(tr=>`<button class="music-choice ${K.state.musicTrack===tr.id?'selected':''}" data-track="${tr.id}"><span class="music-icon">${tr.icon}</span><span><b>${esc(t(`track.${tr.id}`))}</b></span>${K.state.musicTrack===tr.id?'<i>✓</i>':''}</button>`).join('');
    o.innerHTML=`<div class="sound-settings-card">
      <div class="sound-head"><div><span class="sound-kicker">${esc(t('sound.kicker'))}</span><h2>${esc(t('sound.title'))}</h2></div><button class="sound-close" aria-label="${esc(t('common.close'))}">×</button></div>
      <h3>${esc(t('sound.voiceGuide'))}</h3>
      <div class="sound-voice-grid">
        <button class="sound-voice ${K.state.voice==='Milo'?'selected':''}" data-guide="Milo"><img class="mascot-face" src="${K.MASCOT_ART.milo}" alt=""> <b>${esc(t('voice.milo'))}</b></button>
        <button class="sound-voice ${K.state.voice==='Luna'?'selected':''}" data-guide="Luna"><img class="mascot-face" src="${K.MASCOT_ART.luna}" alt=""> <b>${esc(t('voice.luna'))}</b></button>
        <button class="sound-voice ${K.state.voice==='Stil'?'selected':''}" data-guide="Stil">🔇 <b>${esc(t('voice.silent'))}</b></button>
      </div>
      <div class="volume-row voice-volume"><span>🔈</span><input type="range" min="0" max="100" value="${Math.round((K.state.voiceVolume??1)*100)}" data-volume="voice" ${K.state.voice==='Stil'?'disabled':''}><span>🔊</span><button class="sound-test" data-test="voice" ${K.state.voice==='Stil'?'disabled':''}>${esc(t('sound.test'))}</button></div>
      <div class="sound-divider"></div>
      <div class="sound-row"><div class="sound-label"><b>${esc(t('sound.fx'))}</b></div><button class="sound-toggle ${K.state.soundOn!==false?'on':''}" data-toggle="sfx"><span></span></button></div>
      <div class="volume-row"><span>🔈</span><input type="range" min="0" max="100" value="${Math.round((K.state.sfxVolume??.72)*100)}" data-volume="sfx"><span>🔊</span><button class="sound-test">${esc(t('sound.test'))}</button></div>
      <div class="sound-divider"></div>
      <div class="sound-row"><div class="sound-label"><b>${esc(t('sound.music'))}</b></div><button class="sound-toggle ${K.state.musicOn!==false?'on':''}" data-toggle="music"><span></span></button></div>
      <div class="volume-row"><span>🔈</span><input type="range" min="0" max="100" value="${Math.round((K.state.musicVolume??.24)*100)}" data-volume="music"><span>🔊</span></div>
      <h3>${esc(t('sound.pickMusic'))}</h3><div class="music-choice-grid">${tracks}</div>
      </div>`;
    f.appendChild(o);
    const redraw=()=>{o.remove();K.showSoundSettings()};
    o.querySelector('.sound-close').onclick=()=>{K.stopSpeech();o.remove()};
    o.querySelector('[data-toggle="sfx"]').onclick=()=>{K.audio.setSfx(K.state.soundOn===false);redraw()};
    o.querySelector('[data-toggle="music"]').onclick=async()=>{await K.audio.setMusic(K.state.musicOn===false);redraw()};
    o.querySelector('[data-volume="sfx"]').oninput=e=>K.audio.setSfxVolume(e.target.value/100);
    o.querySelector('[data-volume="music"]').oninput=e=>K.audio.setMusicVolume(e.target.value/100);
    o.querySelector('.sound-test:not([data-test])').onclick=()=>K.audio.play('reward');
    o.querySelector('[data-volume="voice"]').oninput=e=>K.audio.setVoiceVolume(e.target.value/100);
    o.querySelector('[data-test="voice"]').onclick=()=>{K.stopSpeech();K.speak(t(K.state.voice==='Luna'?'voice.luna.hello':'voice.milo.hello'))};
    o.querySelectorAll('[data-track]').forEach(b=>b.onclick=async()=>{await K.audio.setTrack(b.dataset.track);redraw()});
    K.prefetchSpeech([t('voice.milo.hello')],{voice:'Milo'});K.prefetchSpeech([t('voice.luna.hello')],{voice:'Luna'});
    o.querySelectorAll('[data-guide]').forEach(b=>b.onclick=()=>{K.setVoice(b.dataset.guide);K.stopSpeech();redraw();if(K.state.voice!=='Stil')K.speak(t(K.state.voice==='Milo'?'voice.milo.hello':'voice.luna.hello'))});
  };

  window.addEventListener('keydown',e=>{if(e.key==='Escape'){K.stopSpeech();K.showHome()}});
  K.progress();
})();
