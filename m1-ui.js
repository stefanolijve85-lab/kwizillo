(()=>{
  const K=window.KWIZILLO_M1;
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const t=(k,p)=>K.t(k,p);

  const WORLD_ORDER=['ruimte','dieren','aarde','geschiedenis','wetenschap','mysterie'];
  const WORLD_ICON={ruimte:'🚀',dieren:'🐾',aarde:'🌍',geschiedenis:'🏛️',wetenschap:'🧪',mysterie:'🔎'};
  // CLAUDE.md section 7: each world gets its own soundtrack, crossfaded on entry.
  const WORLD_MUSIC={ruimte:'space',dieren:'jungle',aarde:'earth',geschiedenis:'history',wetenschap:'science',mysterie:'mystery'};
  const MASCOTS=[
    {id:'milo',icon:'🤖',need:0},
    {id:'comet',icon:'🌠',need:5},
    {id:'pootje',icon:'🐾',need:12},
    {id:'terra',icon:'🌱',need:20},
    {id:'sparky',icon:'⚗️',need:35},
    {id:'lumi',icon:'🔮',need:50},
    // Six more buddies (see tools/mascot-prompts.md); a buddy without art in
    // K.MASCOT_ART stays hidden until its picture is added.
    {id:'nova',icon:'👩‍🚀',need:70},
    {id:'kiko',icon:'🐼',need:90},
    {id:'pip',icon:'🐧',need:115},
    {id:'ravi',icon:'🥽',need:140},
    {id:'flora',icon:'🦋',need:170},
    {id:'draco',icon:'🐉',need:200}
  ].filter(m=>K.MASCOT_ART?.[m.id]);

  // One line per level for the parent zone: time, mistakes, hints, reading.
  function levelSummary(n){
    const h=K.core.hintsAllowed(n);
    const hints=!Number.isFinite(h)?t('settings.hintsFree'):h>0?t('settings.hintsN',{n:h}):t('settings.hintsNone');
    const base=t('settings.levelSub',{seconds:K.core.questionSeconds(n),allowed:K.core.maxWrong(n),hints});
    return K.core.readsAnswers(n)?base:`${base} · ${t('settings.readsQuestionOnly')}`;
  }
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
  // world stands at 100 and all six worlds at 600. Statistics and the
  // collection show this, not the accuracy.
  const POINTS_PER_QUIZ=25;
  K.worldPoints=world=>{
    const P=progress().passed||{};
    const keys=K.TOPIC_KEYS?.[world]||[];
    const done=keys.filter(k=>Object.values(P).some(level=>level&&level[`${world}:${k}`]));
    return {passed:done.length,total:keys.length||4,points:done.length*POINTS_PER_QUIZ,max:(keys.length||4)*POINTS_PER_QUIZ};
  };
  K.totalPoints=()=>WORLD_ORDER.reduce((a,w)=>{const p=K.worldPoints(w);a.points+=p.points;a.max+=p.max;return a},{points:0,max:0});
  const totalCorrect=()=>Number(K.state.correct||0);
  const unlockedMascots=()=>MASCOTS.filter(m=>totalCorrect()>=m.need);

  // A single place that records one answered question across every counter.
  K.recordAnswerProgress=(q,correct)=>{
    if(!q) return;
    const ws=worldStat(q.world),ts=topicStat(q.topic);
    ws.answered++; ts.answered++;
    K.state.answered=Number(K.state.answered||0)+1;
    if(correct){
      ws.correct++; ts.correct++; ws.xp+=Number(q.xp||10);
      K.state.correct=Number(K.state.correct||0)+1;
      K.state.xp=Number(K.state.xp||0)+Number(q.xp||10);
      K.state.coins=Number(K.state.coins||0)+2;
      if(!progress().correctQuestionIds.includes(q.id)) progress().correctQuestionIds.push(q.id);
    }
    K.save();
  };

  function bottomNav(active=''){
    const defs=[['home',K.icon('home'),'nav.home'],['achievements',K.icon('trophy'),'nav.achievements'],['collection',K.icon('cards'),'nav.collection'],['stats',K.icon('stats'),'nav.stats'],['parent',K.icon('gear'),'nav.more']];
    return `<nav class="native-bottom-nav" aria-label="${esc(t('nav.aria'))}">${defs.map(([id,icon,key])=>`<button data-nav="${id}" class="${active===id?'active':''}">${icon}<small>${esc(t(key))}</small></button>`).join('')}</nav>`;
  }
  function bindNav(f){
    const map={home:()=>K.showHome(),achievements:K.showAchievements,collection:()=>K.showCollection('worlds'),stats:K.showStats,parent:K.showParent};
    f.querySelectorAll('[data-nav]').forEach(b=>b.onclick=()=>{K.stopSpeech();K.sfx('tap');map[b.dataset.nav]?.()});
  }
  K.bottomNav=bottomNav;K.bindNav=bindNav;
  function nativeScreen({cls='',title,subtitle='',body,active='',back=()=>K.showHome()}){
    const f=K.frame(`<section class="native-panel-screen ${cls} fade-in"><div class="native-panel-glow"></div><header class="panel-head"><button class="panel-back" aria-label="${esc(t('common.back'))}">${K.icon('back')}</button><div><div class="panel-kicker">${esc(t('common.brand'))}</div><h1>${esc(title)}</h1>${subtitle?`<p>${esc(subtitle)}</p>`:''}</div><button class="panel-settings" aria-label="${esc(t('common.settings'))}">${K.icon('gear')}</button></header><main class="panel-scroll">${body}</main>${bottomNav(active)}</section>`);
    f.querySelector('.panel-back').onclick=()=>{K.stopSpeech();K.sfx('tap');back()};
    f.querySelector('.panel-settings').onclick=()=>{K.stopSpeech();K.sfx('tap');K.showParent()};
    bindNav(f);return f;
  }

  /* ---------------- Home ---------------- */

  K.showHome=()=>{
    K.stopSpeech();K.lastView='home';
    K.audio.setTrack('home').catch(()=>{});
    const name=String(K.state.name||'').trim();
    const greeting=name?t('home.greeting',{name}):t('home.greetingAnon');
    const lvl=K.level(),into=K.xpIntoLevel();
    const last=K.state.lastWorld&&WORLD_ORDER.includes(K.state.lastWorld)?K.state.lastWorld:'ruimte';

    const worldCards=WORLD_ORDER.map(w=>{
      const s=worldStat(w),pct=accuracy(s);
      // Just the name, big and centred: a child reads it in one glance. The
      // bar underneath shows how the world is going once it has been played.
      return `<button class="home-world" data-world="${w}" aria-label="${esc(worldTitle(w))}${s.answered?` · ${s.correct}/${s.answered}`:''}">
        <img class="home-world-art" src="${K.MASTER[w]}" alt="" decoding="async">
        <span class="home-world-veil"></span>
        <span class="home-world-copy">
          <b>${esc(worldTitle(w))}</b>
        </span>
        ${s.answered?`<span class="home-world-bar"><i style="width:${pct}%"></i></span>`:''}
      </button>`;
    }).join('');

    const f=K.frame(`<section class="home fade-in">
      <div class="home-sky"></div>
      <div class="home-ui">
        <header class="home-hud">
          <div class="hud-player">
            <button class="hud-avatar" id="homeProfile" aria-label="${esc(t('profile.title'))}"><img class="mascot-face" src="${K.MASCOT_ART[K.state.selectedMascot]||K.guideArt(K.state.voice)}" alt=""></button>
            <span class="hud-id">
              <b>${esc(greeting)}</b>
              <small>${esc(t('home.level',{level:lvl}))}</small>
              <span class="hud-xp"><i style="width:${into}%"></i></span>
            </span>
          </div>
          <div class="hud-right">
            <button class="hud-chip" data-stats title="${esc(t('home.coins'))}">${K.icon('coin')} ${Number(K.state.coins||0)}</button>
            <button class="hud-chip" data-stats title="${esc(t('home.streak'))}">${K.icon('flame')} ${Number(K.state.streak||0)}</button>
            <button class="hud-gear" id="homeGear" aria-label="${esc(t('common.settings'))}">${K.icon('gear')}</button>
          </div>
        </header>

        <h2 class="home-section">${esc(t('home.pickWorld'))}</h2>
        <div class="home-worlds">${worldCards}</div>

        <h2 class="home-section">${esc(t('home.playMore'))}</h2>
        <div class="home-games">
          <button class="home-game art" id="homeMemo"><img class="home-game-art" src="${K.GAME_ART.memo}" alt="" decoding="async"><span class="home-game-veil"></span><b>${esc(t('memo.title'))}</b></button>
          <button class="home-game art math" id="homeMath"><img class="home-game-art" src="${K.GAME_ART.math}" alt="" decoding="async"><span class="home-game-veil"></span><b>${esc(t('math.title'))}</b></button>
          <button class="home-game art whoami" id="homeWhoAmI"><img class="home-game-art" src="${K.GAME_ART.whoami}" alt="" decoding="async"><span class="home-game-veil"></span><b>${esc(t('whoami.title'))}</b></button>
          <button class="home-game art fotozoom" id="homeFotozoom"><img class="home-game-art" src="${K.GAME_ART.fotozoom}" alt="" decoding="async"><span class="home-game-veil"></span><b>${esc(t('fotozoom.title'))}</b></button>
          <button class="home-game art facts" id="homeFacts"><img class="home-game-art" src="${K.GAME_ART.facts}" alt="" decoding="async"><span class="home-game-veil"></span><b>${esc(t('facts.title'))}</b></button>
          <button class="home-game art jungle" id="homeJungle"><img class="home-game-art" src="${K.GAME_ART.jungle}" alt="" decoding="async"><span class="home-game-veil"></span><b>${esc(t('jungle.title'))}</b></button>
        </div>

        ${bottomNav('home')}
      </div>
    </section>`);

    f.querySelectorAll('[data-world]').forEach(b=>b.onclick=()=>{K.sfx('tap');K.enterWorld(b.dataset.world)});
    f.querySelector('#homeGear').onclick=()=>{K.sfx('tap');K.showParent()};
    f.querySelector('#homeProfile').onclick=()=>{K.sfx('tap');K.showProfile()};
    f.querySelector('#homeMemo').onclick=()=>{K.sfx('tap');K.showMemoPicker()};
    f.querySelector('#homeWhoAmI').onclick=()=>{K.sfx('tap');K.startWhoAmI(K.state.lastWorld||'mix')};
    f.querySelector('#homeJungle').onclick=()=>{K.sfx('tap');K.startJungle()};
    f.querySelector('#homeFotozoom').onclick=()=>{K.sfx('tap');K.startFotozoom(K.state.lastWorld||'mix')};
    f.querySelector('#homeMath').onclick=()=>{K.sfx('world');K.startMath(last)};
    f.querySelector('#homeFacts').onclick=()=>{K.sfx('tap');K.showFacts(K.state.factsWorld||'all')};
    f.querySelectorAll('[data-stats]').forEach(b=>b.onclick=()=>{K.sfx('tap');K.showStats()});
    bindNav(f);
    // The six world names are warmed on Home so the guide calls one out the
    // moment a world opens; the hello of each guide too, ahead of the profile's voice pick.
    K.prefetchSpeech(WORLD_ORDER.map(w=>t('world.speech.enter',{title:worldTitle(w)})));
    // The first two Weetjes are picked and warmed here, so the screen talks the moment it opens.
    const ahead=K.warmFacts?.(K.state.factsWorld||'all')||[];
    if(ahead[0]) K.prefetchSpeech([`${t('facts.kicker')} ${ahead[0].t}`]);   // the first one opens with the facts kicker
    K.prefetchSpeech([t('voice.milo.hello')],{voice:'Milo'});
    K.prefetchSpeech([t('voice.luna.hello')],{voice:'Luna'});
  };

  /* ---------------- World ---------------- */

  K.enterWorld=world=>{
    if(!WORLD_ORDER.includes(world)) return K.showHome();
    K.stopSpeech();K.currentWorld=world;K.state.lastWorld=world;K.save();K.sfx('fanfare');
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
    const topics=keys.map((key,i)=>({key,label:topicLabel(key),i,count:K.core.poolFor({questions:K.questions,world,topicKey:key,grade:Number(K.state.group||5)}).length}));
    const mixRun=K.runFor(world,null);
    const topicFree=tp=>K.premium.can('quiz',world,tp.key,Number(K.runFor(world,tp.key).quizNumber||0)+1);
    const mixFree=K.premium.can('quiz',world,null,mixRun.quizNumber+1);

    const f=K.frame(`<section class="native-world world-${world} fade-in">
      <img class="native-world-bg" src="${K.MASTER[world]}" alt="">
      <div class="native-world-hero"><img src="${K.MASTER[world]}" alt="${esc(worldTitle(world))}"></div>
      <div class="native-world-shade"></div>
      <div class="native-world-ui">
        <header class="native-world-head">
          <button id="worldBack" class="world-round" aria-label="${esc(t('world.backHome'))}">${K.icon('back')}</button>
          <div class="world-title-wrap">
            <div class="world-kicker">${K.worldBadge(world,'tiny')} ${esc(t('world.kicker'))}</div>
            <h1 class="${worldTitle(world).length>14?'long':''}">${esc(worldTitle(world))}</h1>
            <p>${esc(worldSub(world))}</p>
          </div>
          <button id="worldGear" class="world-round" aria-label="${esc(t('common.settings'))}">${K.icon('gear')}</button>
        </header>
        <div class="world-topic-grid">${topics.map(tp=>`<button class="world-topic has-art ${topicFree(tp)?'':'locked'}" data-topic="${tp.i}">
          <img class="world-topic-art" src="${K.TOPIC_ART[tp.key]||K.MASTER[world]}" alt="" decoding="async">
          <span class="world-topic-veil"></span>
          <span class="world-topic-num">${tp.i+1}</span>${topicFree(tp)?'':K.premiumBadge()}
          <span class="world-topic-copy"><b>${esc(tp.label)}</b></span>
          <i>›</i>
        </button>`).join('')}</div>
        <button class="world-mix ${mixFree?'':'locked'}" id="worldMix">
          <span>${mixFree?K.icon('play'):K.icon('lock')}</span>
          <span><b>${esc(t('world.mix'))}</b><small>${esc(t('world.quizNumber',{n:mixRun.quizNumber+1}))} · ${esc(t('world.mixSub'))}</small></span>
          <i>›</i>
        </button>
        ${bottomNav('')}
      </div>
    </section>`);

    f.querySelector('#worldBack').onclick=()=>{K.sfx('tap');K.showHome()};
    f.querySelector('#worldGear').onclick=()=>{K.sfx('tap');K.showParent()};
    f.querySelectorAll('[data-topic]').forEach(b=>b.onclick=()=>{K.stopSpeech();K.sfx('tap');K.startQuiz(world,Number(b.dataset.topic))});
    f.querySelector('#worldMix').onclick=()=>{K.stopSpeech();K.sfx('tap');K.startQuiz(world,null)};
    bindNav(f);
  };

  /* ---------------- Achievements ---------------- */

  K.showAchievements=()=>{
    K.stopSpeech();K.lastView='achievements';
    const cards=progress().correctQuestionIds.length;
    const playedWorlds=WORLD_ORDER.filter(w=>worldStat(w).answered>0).length;
    const defs=[
      {icon:'🎯',key:'achievement.firstQuiz',now:Math.min(1,K.state.quizzesPlayed||0),goal:1},
      {icon:'⭐',key:'achievement.correct10',now:Math.min(10,totalCorrect()),goal:10},
      {icon:'🌟',key:'achievement.correct50',now:Math.min(50,totalCorrect()),goal:50},
      {icon:'🔥',key:'achievement.streak7',now:Math.min(7,K.state.streak||0),goal:7},
      {icon:'🃏',key:'achievement.cards5',now:Math.min(5,cards),goal:5},
      {icon:'🗺️',key:'achievement.allWorlds',now:playedWorlds,goal:6},
      {icon:'🧠',key:'achievement.memo3',now:Math.min(3,Number(progress().games?.memo?.won||0)),goal:3},
      {icon:'🔢',key:'achievement.math3',now:Math.min(3,Number(progress().games?.math?.won||0)),goal:3}
    ].map(a=>({...a,done:a.now>=a.goal}));

    const body=`<div class="summary-hero"><div class="summary-icon">${K.icon('trophy')}</div><div><b>${esc(t('achievements.summary',{done:defs.filter(x=>x.done).length,total:defs.length}))}</b><span>${esc(t('achievements.summarySub'))}</span></div></div>
      <div class="achievement-grid">${defs.map(a=>`<article class="achievement-card ${a.done?'done':''}"><div class="achievement-medal" style="--p:${Math.round(Math.min(100,a.now/a.goal*100))}"><span class="achievement-icon">${a.icon}</span></div><div><b>${esc(t(a.key))}</b><small>${a.done?esc(t('achievements.done')):`${a.now}/${a.goal}`}</small><div class="mini-track"><i style="width:${Math.min(100,a.now/a.goal*100)}%"></i></div></div>${a.done?'<span class="done-badge">✓</span>':''}</article>`).join('')}</div>`;
    nativeScreen({cls:'achievements-screen',title:t('achievements.title'),subtitle:t('achievements.sub'),body,active:'achievements'});
  };

  /* ---------------- Sharing ---------------- */

  // Sharing goes through the system share sheet (or the clipboard) and is
  // gated by the parental check, as it leaves the app. There is no server-side
  // leaderboard in the web build; on iOS this maps to Game Center.
  K.shareText=()=>{
    const best=Object.entries(K.state.bestScores||{}).sort((a,b)=>b[1]-a[1])[0];
    return t('share.text',{
      name:K.state.name||'',level:K.level(),correct:totalCorrect(),cards:progress().correctQuestionIds.length,
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
        <article><span>${K.icon('cards')}</span><b>${progress().correctQuestionIds.length}</b><small>${esc(t('stats.cards'))}</small></article>
      </div>
      <section class="setting-card profile-row"><div><b>${esc(t('profile.buddy'))}</b><small>${esc(t(`mascot.${buddy}`))} · ${esc(t(`mascot.${buddy}.desc`))}</small></div><button class="profile-link" id="profileBuddy">${esc(t('profile.chooseBuddy'))} ›</button></section>
      <section class="setting-card profile-row profile-voice"><div><b>${esc(t('profile.voice'))}</b><small>${esc(t('onboarding.voice.sub'))}</small></div><div class="quick-pills">${guides.map(([id,art])=>`<button class="quick-pill ${K.state.voice===id?'selected':''}" data-voice="${id}" aria-label="${esc(t(id==='Milo'?'voice.milo':id==='Luna'?'voice.luna':'voice.silent'))}">${art?`<img class="mascot-face" src="${art}" alt="">`:'🔇'}</button>`).join('')}</div></section>
      <section class="setting-card profile-row"><div><b>${esc(t('settings.language'))}</b><small>${esc(t('settings.languageSub'))}</small></div><div class="lang-toggle">${K.LANGUAGES.map(l=>`<button data-setlang="${l.id}" class="${K.state.language===l.id?'active':''}">${l.flag} ${esc(l.id.toUpperCase())}</button>`).join('')}</div></section>`;
    const f=nativeScreen({cls:'profile-screen',title:t('profile.title'),subtitle:t('profile.sub'),body,active:''});
    f.querySelector('#profileName').onsubmit=e=>{e.preventDefault();const v=f.querySelector('#profileInput').value.trim();if(!v)return;K.state.name=v;K.save();K.sfx('good');K.toast(t('profile.saved'))};
    f.querySelector('#profileBuddy').onclick=()=>{K.sfx('tap');K.showCollection('mascots')};
    f.querySelector('[data-stats]').onclick=()=>{K.sfx('tap');K.showStats()};
    f.querySelectorAll('[data-voice]').forEach(b=>b.onclick=()=>{K.sfx('tap');K.state.voice=b.dataset.voice;K.save();K.showProfile()});
    f.querySelectorAll('[data-setlang]').forEach(b=>b.onclick=()=>{K.sfx('tap');if(K.setLanguage(b.dataset.setlang)){K.useBank();K.showProfile()}});
  };

  /* ---------------- Collection ---------------- */

  K.showCollection=(tab='worlds')=>{
    K.stopSpeech();K.lastView='collection';
    const ids=progress().correctQuestionIds;
    const cards=ids.map(id=>K.questions.find(q=>q.id===id)).filter(Boolean);
    let content='';
    if(tab==='worlds'){
      const all=K.totalPoints(),allPct=all.max?Math.round(all.points/all.max*100):0;
      content=`<div class="progress-overall"><b>${esc(t('progress.overall',{points:all.points,max:all.max}))}</b><span class="wide-track"><i style="width:${allPct}%"></i></span><small>${esc(t('progress.overallSub'))}</small></div>
        <div class="world-progress-grid">${WORLD_ORDER.map(w=>{const p=K.worldPoints(w);return`<button class="progress-world" data-world="${w}"><span class="progress-world-icon">${K.worldBadge(w)}</span><span><b>${esc(worldTitle(w))}</b><small>${esc(t('progress.worldLine',{passed:p.passed,total:p.total,points:p.points}))}</small><span class="wide-track"><i style="width:${p.max?Math.round(p.points/p.max*100):0}%"></i></span></span><em>${p.points}</em></button>`}).join('')}</div>`;
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
    if(tab==='cards') content=cards.length
      ?`<div class="kcard-grid">${cards.map(card).join('')}</div>`
      :`<div class="empty-state"><div>🃏</div><h2>${esc(t('collection.emptyTitle'))}</h2><p>${esc(t('collection.emptyBody'))}</p></div>`;
    if(tab==='mascots'){
      content=`<div class="mascot-grid">${MASCOTS.map(m=>{
        const ok=totalCorrect()>=m.need,sel=K.state.selectedMascot===m.id;
        // Locked buddies show as a dark silhouette with a lock, so the child
        // can see who is waiting to be unlocked.
        // The character fills the whole tile; only the name sits on it. A
        // locked buddy is a dark silhouette with a lock and how many more
        // correct answers it takes.
        const art=K.MASCOT_ART[m.id];
        const sub=ok?'':`<small>${esc(t('collection.mascotLocked',{n:Math.max(0,m.need-totalCorrect())}))}</small>`;
        const state=sel?`<span class="mascot-state">${esc(t('collection.mascotActive'))}</span>`:'';
        return`<button class="mascot-card ${ok?'unlocked':'locked'} ${sel?'selected':''}" data-mascot="${m.id}" ${ok?'':'disabled'} aria-label="${esc(t(`mascot.${m.id}`))}"><img class="mascot-fill" src="${art}" alt="" decoding="async">${ok?'':'<i class="mascot-lock">🔒</i>'}${state}<b class="mascot-name">${esc(t(`mascot.${m.id}`))}${sub}</b></button>`;
      }).join('')}</div><div class="collection-note">${esc(t('collection.mascotCount',{unlocked:unlockedMascots().length,total:MASCOTS.length}))}</div>`;
    }
    const body=`<div class="collection-tabs"><button data-tab="worlds" class="${tab==='worlds'?'active':''}">${esc(t('collection.tabWorlds'))}</button><button data-tab="cards" class="${tab==='cards'?'active':''}">${esc(t('collection.tabCards'))} <i>${cards.length}</i></button><button data-tab="mascots" class="${tab==='mascots'?'active':''}">${esc(t('collection.tabMascots'))}</button></div>${content}`;
    const f=nativeScreen({cls:'collection-screen',title:t('collection.title'),subtitle:t('collection.sub'),body,active:'collection'});
    f.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{K.sfx('tap');K.showCollection(b.dataset.tab)});
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
    f.querySelectorAll('[data-mascot]:not([disabled])').forEach(b=>b.onclick=()=>{K.sfx('tap');K.state.selectedMascot=b.dataset.mascot;K.save();K.showCollection('mascots')});
  };

  /* ---------------- Stats ---------------- */

  // Opened from inside a quiz, statistics return to that very question.
  K.showStats=({back}={})=>{
    K.stopSpeech();K.lastView='stats';
    const answered=Number(K.state.answered||0),correct=Number(K.state.correct||0);
    const pct=answered?Math.round(correct/answered*100):0;
    const medal=b=>b>=9?'gold':b>=7?'silver':b>0?'bronze':'';
    const medalIcon={gold:'🥇',silver:'🥈',bronze:'🥉'};
    const sparks=Array.from({length:10},(_,i)=>`<i style="--i:${i}"></i>`).join('');
    const tile=(cls,icon,value,label)=>`<article class="stat-tile ${cls}"><span class="stat-tile-icon">${icon}</span><b data-count="${value}">0</b><small>${esc(label)}</small></article>`;
    const board=(items)=>`<div class="scoreboard v2">${items.join('')}</div>`;
    const body=`<div class="stats-hero3d"><div class="stats-fx" aria-hidden="true">${sparks}</div>
        <div class="stat-orb" style="--p:0" data-p="${pct}"><span class="stat-orb-ring"></span><span class="stat-orb-glass"></span><b data-count="${pct}" data-suffix="%">0%</b><small>${esc(t('stats.correctShort'))}</small></div>
        <div class="stats-hero-copy"><h2>${esc(t('stats.heroTitle'))}</h2><p>${esc(t('stats.heroSub',{answered,quizzes:K.state.quizzesPlayed||0,quizWord:t((K.state.quizzesPlayed||0)===1?'stats.quizOne':'stats.quizMany')}))}</p></div></div>
      <div class="stat-tiles">${tile('xp','⭐',Number(K.state.xp||0),t('stats.xpTotal'))}${tile('coins','🪙',Number(K.state.coins||0),t('stats.coins'))}${tile('streak','🔥',Number(K.state.streak||0),t('stats.streak'))}${tile('cards','🃏',progress().correctQuestionIds.length,t('stats.cards'))}</div>
      <button class="share-3d" id="statsShare"><span class="share-3d-icon">📣</span><span class="share-3d-copy"><b>${esc(t('settings.share'))}</b><small>${esc(t('settings.shareSub'))}</small></span><span class="share-3d-arrow">›</span></button>
      <h2 class="section-title">${esc(t('stats.board'))}</h2>
      ${board(WORLD_ORDER.map(w=>{const b=Number((K.state.bestScores||{})[w]||0),m=medal(b);return`<article class="${m}">${m?`<i class="medal">${medalIcon[m]}</i>`:''}<span>${K.worldBadge(w)}</span><b>${b}/10</b><small>${esc(worldTitle(w))}</small></article>`}))}
      <h2 class="section-title">${esc(t('stats.memo'))}</h2>
      ${board(WORLD_ORDER.map(w=>{const b=Number((progress().games?.memo?.best||{})[w]||0);return`<article class="${b?'bronze':''}">${b?'<i class="medal">🧠</i>':''}<span>${K.worldBadge(w)}</span><b>${b?esc(t('stats.memoBest',{n:b})):'–'}</b><small>${esc(worldTitle(w))}</small></article>`}))}
      <p class="collection-note">${esc(t('stats.memoLine',{played:Number(progress().games?.memo?.played||0),won:Number(progress().games?.memo?.won||0)}))}</p>
      <h2 class="section-title">${esc(t('stats.math'))}</h2>
      ${board([1,2,3,4,5,6].map(n=>{const b=Number((progress().games?.math?.best||{})[n]||0),m=medal(b);return`<article class="${m}">${m?`<i class="medal">${medalIcon[m]}</i>`:''}<span class="level-dot">${n}</span><b>${b?`${b}/10`:'–'}</b><small>${esc(t('memo.level',{n}))}</small></article>`}))}
      <p class="collection-note">${esc(t('stats.mathLine',{played:Number(progress().games?.math?.played||0),won:Number(progress().games?.math?.won||0)}))}</p>
      <h2 class="section-title">${esc(t('stats.perWorld'))}</h2>
      <div class="world-stat-list v2">${WORLD_ORDER.map(w=>{const s=worldStat(w),p=K.worldPoints(w),pct=p.max?Math.round(p.points/p.max*100):0;return`<article><span class="world-stat-badge">${K.worldBadge(w)}</span><div><b>${esc(worldTitle(w))}</b><small>${esc(t('progress.worldLine',{passed:p.passed,total:p.total,points:p.points}))} · ${esc(t('stats.worldLine',{correct:s.correct,answered:s.answered,quizzes:s.quizzes,quizWord:t(s.quizzes===1?'stats.quizOne':'stats.quizMany')}))}</small><span class="wide-track"><i style="width:${pct}%"></i></span></div><em>${p.points}</em></article>`}).join('')}</div>`;
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

  K.showPrivacyInfo=()=>showPrivacyInfo();
  // Terms of Use: a plain modal (the Premium screen links here; Apple wants both links reachable).
  K.showTermsInfo=()=>{
    const f=K.app.querySelector('.game-frame');if(!f)return;
    const o=document.createElement('div');o.className='simple-modal';
    o.innerHTML=`<div class="simple-modal-card"><button class="simple-close" aria-label="${esc(t('common.close'))}">×</button><div class="simple-icon">📄</div><h2>${esc(t('settings.terms'))}</h2><p>${esc(t('settings.termsBody'))}</p><button class="simple-ok">${esc(t('common.gotIt'))}</button></div>`;
    f.appendChild(o);const close=()=>o.remove();o.querySelector('.simple-close').onclick=close;o.querySelector('.simple-ok').onclick=close;
  };
  function showPrivacyInfo(){
    const f=K.app.querySelector('.game-frame');if(!f)return;
    const o=document.createElement('div');o.className='simple-modal';
    o.innerHTML=`<div class="simple-modal-card"><button class="simple-close" aria-label="${esc(t('common.close'))}">×</button><div class="simple-icon">🛡️</div><h2>${esc(t('settings.privacy'))}</h2><p>${esc(t('settings.privacyBody'))}</p><button class="simple-ok">${esc(t('common.gotIt'))}</button></div>`;
    f.appendChild(o);
    const close=()=>o.remove();
    o.querySelector('.simple-close').onclick=close;o.querySelector('.simple-ok').onclick=close;
  }
  // Resetting wipes everything, so it sits behind a parental gate rather than a
  // plain confirm a child can tap through (CLAUDE.md section 17, kids/privacy).
  K.parentalGate=onPass=>showParentalGate(onPass);
  function showParentalGate(onPass){
    const f=K.app.querySelector('.game-frame');if(!f)return;
    const a=3+Math.floor(Math.random()*6), b=4+Math.floor(Math.random()*6);
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

  function showResetConfirm(){
    const f=K.app.querySelector('.game-frame');if(!f)return;
    const o=document.createElement('div');o.className='simple-modal';
    o.innerHTML=`<div class="simple-modal-card danger"><button class="simple-close" aria-label="${esc(t('common.close'))}">×</button><div class="simple-icon">♻️</div><h2>${esc(t('settings.resetTitle'))}</h2><p>${esc(t('settings.resetBody'))}</p><div class="confirm-actions"><button class="cancel">${esc(t('common.cancel'))}</button><button class="confirm">${esc(t('settings.resetConfirm'))}</button></div></div>`;
    f.appendChild(o);
    o.querySelector('.simple-close').onclick=()=>o.remove();
    o.querySelector('.cancel').onclick=()=>o.remove();
    o.querySelector('.confirm').onclick=()=>{K.resetProgress();location.reload()};
  }

  K.showParent=()=>{
    K.stopSpeech();K.lastView='parent';
    const voiceLine=K.state.voice==='Stil'?t('settings.soundVoiceOff'):t('settings.soundVoiceOn',{voice:t(K.state.voice==='Milo'?'voice.milo':'voice.luna')});
    const musicLine=t('settings.soundMusic',{state:t(K.state.musicOn===false?'settings.off':'settings.on')});
    const body=`<div class="settings-list">
      ${K.premiumCard()}${K.testUnlockCard()}
      <section class="setting-card"><div class="setting-icon">🎓</div><div><b>${esc(t('settings.group'))}</b><small>${esc(t('settings.groupSub'))}</small></div><div class="stepper"><button data-group="minus">−</button><strong>${esc(t('settings.groupValue',{n:K.state.group}))}</strong><button data-group="plus">+</button></div></section>
      <section class="setting-card"><div class="setting-icon">🌍</div><div><b>${esc(t('settings.language'))}</b><small>${esc(t('settings.languageSub'))}</small></div><div class="lang-toggle">${K.LANGUAGES.map(l=>`<button data-setlang="${l.id}" class="${K.state.language===l.id?'active':''}">${l.flag} ${esc(l.id.toUpperCase())}</button>`).join('')}</div></section>
      <section class="setting-card clickable" id="soundOpen"><div class="setting-icon">🔊</div><div><b>${esc(t('settings.sound'))}</b><small>${esc(voiceLine)} · ${esc(musicLine)}</small></div><em>›</em></section>
      <section class="setting-card"><div class="setting-icon">⏱️</div><div><b>${esc(t('settings.timeLimit'))}</b><small id="timeLabel">${esc(K.state.timeLimitOn===false?t('settings.timeLimitOff'):t('settings.timeLimitValue',{n:K.core.questionSeconds(K.state.niveau||1)}))}</small></div><button class="native-switch ${K.state.timeLimitOn!==false?'on':''}" id="timeToggle" aria-label="${esc(t('settings.timeLimit'))}"><i></i></button></section>
      <section class="setting-card level-card"><div class="setting-icon">🎯</div><div><b>${esc(t('settings.level'))} ${K.state.niveau||1}</b><small>${esc(levelSummary(K.state.niveau||1))}</small></div><div class="level-toggle">${[1,2,3,4,5,6].map(v=>`<button data-level="${v}" class="${Number(K.state.niveau||1)===v?'active':''} ${K.premium.can('math',v)?'':'premium-level'}">${v}</button>`).join('')}</div></section>
      <section class="setting-card"><div class="setting-icon">🔄</div><div><b>${esc(t('settings.freshStart'))}</b><small>${esc(t(K.freshStart()?'settings.freshStartOn':'settings.freshStartOff'))}</small></div><button class="native-switch ${K.freshStart()?'on':''}" id="freshToggle" aria-label="${esc(t('settings.freshStart'))}"><i></i></button></section>
      <section class="setting-card clickable" id="tourOpen"><div class="setting-icon">${K.activeGuide()==='luna'?'🎧':'🤖'}</div><div><b>${esc(t('tour.again',{guide:K.guideName()}))}</b><small>${esc(t('tour.againSub',{guide:K.guideName()}))}</small></div><em>›</em></section>
      <section class="setting-card clickable" id="shareOpen"><div class="setting-icon">📣</div><div><b>${esc(t('settings.share'))}</b><small>${esc(t('settings.shareSub'))}</small></div><em>›</em></section>
      <section class="setting-card clickable" id="privacyOpen"><div class="setting-icon">🛡️</div><div><b>${esc(t('settings.privacy'))}</b><small>${esc(t('settings.privacySub'))}</small></div><em>›</em></section>
      <section class="setting-card clickable reset-card" id="resetOpen"><div class="setting-icon">♻️</div><div><b>${esc(t('settings.reset'))}</b><small>${esc(t('settings.resetSub'))}</small></div><em>›</em></section>
    </div>`;
    const f=nativeScreen({cls:'parent-screen',title:t('settings.title'),subtitle:t('settings.sub'),body,active:'parent'});
    f.querySelectorAll('[data-group]').forEach(b=>b.onclick=()=>{K.sfx('tap');const d=b.dataset.group==='plus'?1:-1;K.state.group=Math.max(1,Math.min(8,(K.state.group||5)+d));K.state.groupChosen=true;K.save();K.showParent()});
    f.querySelectorAll('[data-setlang]').forEach(b=>b.onclick=()=>{K.sfx('tap');if(K.setLanguage(b.dataset.setlang)){K.useBank();K.showParent()}});
    f.querySelector('#soundOpen').onclick=()=>{K.sfx('tap');K.showSoundSettings()};
    f.querySelector('#freshToggle').onclick=()=>{K.sfx('tap');K.setFreshStart(!K.freshStart());K.showParent()};
    f.querySelector('#tourOpen').onclick=()=>{K.sfx('tap');K.showHome();setTimeout(()=>K.startTour(),320)};
    K.warmTour?.();   // "tour again" starts talking at once
    f.querySelector('#timeToggle').onclick=()=>{K.sfx('tap');K.state.timeLimitOn=K.state.timeLimitOn===false;K.save();K.showParent()};
    f.querySelectorAll('[data-level]').forEach(b=>b.onclick=()=>{K.sfx('tap');K.state.niveau=Number(b.dataset.level);K.save();K.showParent()});
    f.querySelector('#shareOpen').onclick=()=>{K.sfx('tap');K.shareScore()};
    f.querySelector('#privacyOpen').onclick=()=>{K.sfx('tap');showPrivacyInfo()};
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
      <div class="sound-row"><div class="sound-label"><b>${esc(t('sound.fx'))}</b></div><button class="sound-toggle ${K.state.soundOn!==false?'on':''}" data-toggle="sfx"><span></span></button></div>
      <div class="volume-row"><span>🔈</span><input type="range" min="0" max="100" value="${Math.round((K.state.sfxVolume??.72)*100)}" data-volume="sfx"><span>🔊</span><button class="sound-test">${esc(t('sound.test'))}</button></div>
      <div class="sound-divider"></div>
      <div class="sound-row"><div class="sound-label"><b>${esc(t('sound.music'))}</b></div><button class="sound-toggle ${K.state.musicOn!==false?'on':''}" data-toggle="music"><span></span></button></div>
      <div class="volume-row"><span>🔈</span><input type="range" min="0" max="100" value="${Math.round((K.state.musicVolume??.24)*100)}" data-volume="music"><span>🔊</span></div>
      <h3>${esc(t('sound.pickMusic'))}</h3><div class="music-choice-grid">${tracks}</div>
      <div class="sound-divider"></div>
      <h3>${esc(t('sound.voiceGuide'))}</h3>
      <div class="sound-voice-grid">
        <button class="sound-voice ${K.state.voice==='Milo'?'selected':''}" data-guide="Milo"><img class="mascot-face" src="${K.MASCOT_ART.milo}" alt=""> <b>${esc(t('voice.milo'))}</b></button>
        <button class="sound-voice ${K.state.voice==='Luna'?'selected':''}" data-guide="Luna"><img class="mascot-face" src="${K.MASCOT_ART.luna}" alt=""> <b>${esc(t('voice.luna'))}</b></button>
        <button class="sound-voice ${K.state.voice==='Stil'?'selected':''}" data-guide="Stil">🔇 <b>${esc(t('voice.silent'))}</b></button>
      </div>
      <div class="volume-row voice-volume"><span>🔈</span><input type="range" min="0" max="100" value="${Math.round((K.state.voiceVolume??1)*100)}" data-volume="voice" ${K.state.voice==='Stil'?'disabled':''}><span>🔊</span><button class="sound-test" data-test="voice" ${K.state.voice==='Stil'?'disabled':''}>${esc(t('sound.test'))}</button></div>
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
    o.querySelectorAll('[data-guide]').forEach(b=>b.onclick=()=>{K.state.voice=b.dataset.guide;K.save();K.stopSpeech();redraw();if(K.state.voice!=='Stil')K.speak(t(K.state.voice==='Milo'?'voice.milo.hello':'voice.luna.hello'))});
  };

  window.addEventListener('keydown',e=>{if(e.key==='Escape'){K.stopSpeech();K.showHome()}});
  K.progress();
})();
