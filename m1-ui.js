(()=>{
  const K=window.KWIZILLO_M1;
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const t=(k,p)=>K.t(k,p);

  const WORLD_ORDER=['ruimte','dieren','aarde','geschiedenis','wetenschap','mysterie'];
  const WORLD_ICON={ruimte:'🚀',dieren:'🐾',aarde:'🌍',geschiedenis:'🏛️',wetenschap:'🧪',mysterie:'🔎'};
  // CLAUDE.md section 7: each world gets its own soundtrack, crossfaded on entry.
  const WORLD_MUSIC={ruimte:'space',dieren:'adventure',aarde:'calm',geschiedenis:'adventure',wetenschap:'magical',mysterie:'calm'};
  const MASCOTS=[
    {id:'milo',icon:'🤖',need:0},
    {id:'comet',icon:'🌠',need:5},
    {id:'pootje',icon:'🐾',need:12},
    {id:'terra',icon:'🌱',need:20},
    {id:'sparky',icon:'⚗️',need:35},
    {id:'lumi',icon:'🔮',need:50}
  ];

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
    const defs=[['home','⌂','nav.home'],['achievements','🏆','nav.achievements'],['collection','🃏','nav.collection'],['stats','▥','nav.stats'],['parent','⚙','nav.more']];
    return `<nav class="native-bottom-nav" aria-label="${esc(t('nav.aria'))}">${defs.map(([id,icon,key])=>`<button data-nav="${id}" class="${active===id?'active':''}">${icon}<small>${esc(t(key))}</small></button>`).join('')}</nav>`;
  }
  function bindNav(f){
    const map={home:()=>K.showHome(),achievements:K.showAchievements,collection:()=>K.showCollection('worlds'),stats:K.showStats,parent:K.showParent};
    f.querySelectorAll('[data-nav]').forEach(b=>b.onclick=()=>{K.stopSpeech();K.sfx('tap');map[b.dataset.nav]?.()});
  }
  function nativeScreen({cls='',title,subtitle='',body,active='',back=()=>K.showHome()}){
    const f=K.frame(`<section class="native-panel-screen ${cls} fade-in"><div class="native-panel-glow"></div><header class="panel-head"><button class="panel-back" aria-label="${esc(t('common.back'))}">‹</button><div><div class="panel-kicker">${esc(t('common.brand'))}</div><h1>${esc(title)}</h1>${subtitle?`<p>${esc(subtitle)}</p>`:''}</div><button class="panel-settings" aria-label="${esc(t('common.settings'))}">⚙</button></header><main class="panel-scroll">${body}</main>${bottomNav(active)}</section>`);
    f.querySelector('.panel-back').onclick=()=>{K.stopSpeech();K.sfx('tap');back()};
    f.querySelector('.panel-settings').onclick=()=>{K.stopSpeech();K.sfx('tap');K.showParent()};
    bindNav(f);return f;
  }

  /* ---------------- Home ---------------- */

  K.showHome=()=>{
    K.stopSpeech();K.lastView='home';
    const name=String(K.state.name||'').trim();
    const greeting=name?t('home.greeting',{name}):t('home.greetingAnon');
    const lvl=K.level(),into=K.xpIntoLevel();
    const last=K.state.lastWorld&&WORLD_ORDER.includes(K.state.lastWorld)?K.state.lastWorld:'ruimte';

    const worldCards=WORLD_ORDER.map(w=>{
      const s=worldStat(w),pct=accuracy(s);
      const pool=K.core.poolFor({questions:K.questions,world:w,grade:Number(K.state.group||5)}).length;
      const meta=s.answered?`${s.correct}/${s.answered} · ${pct}%`:t('world.topicMeta',{count:pool,group:K.state.group});
      return `<button class="home-world" data-world="${w}">
        <img class="home-world-art" src="${K.MASTER[w]}" alt="" decoding="async">
        <span class="home-world-veil"></span>
        <span class="home-world-copy">
          <b>${esc(worldTitle(w))}</b>
          <small>${esc(meta)}</small>
        </span>
        ${s.answered?`<span class="home-world-bar"><i style="width:${pct}%"></i></span>`:''}
      </button>`;
    }).join('');

    const voiceIcon=id=>id==='Stil'?'🔇':`<img class="mascot-face" src="${K.guideArt(id)}" alt="">`;
    const voices=['Milo','Luna','Stil'].map(id=>
      `<button class="quick-pill ${K.state.voice===id?'selected':''}" data-voice="${id}" aria-label="${esc(t(id==='Milo'?'voice.milo':id==='Luna'?'voice.luna':'voice.silent'))}">${voiceIcon(id)}</button>`).join('');
    const langs=K.LANGUAGES.map(l=>
      `<button class="quick-pill ${K.state.language===l.id?'selected':''}" data-lang="${l.id}" aria-label="${esc(l.label)}">${l.flag}</button>`).join('');

    const f=K.frame(`<section class="home fade-in">
      <div class="home-sky"></div>
      <div class="home-ui">
        <header class="home-hud">
          <div class="hud-player">
            <span class="hud-avatar"><img class="mascot-face" src="${K.guideArt(K.state.voice)}" alt=""></span>
            <span class="hud-id">
              <b>${esc(greeting)}</b>
              <small>${esc(t('home.level',{level:lvl}))}</small>
              <span class="hud-xp"><i style="width:${into}%"></i></span>
            </span>
          </div>
          <div class="hud-right">
            <span class="hud-chip" title="${esc(t('home.coins'))}">🪙 ${Number(K.state.coins||0)}</span>
            <span class="hud-chip" title="${esc(t('home.streak'))}">🔥 ${Number(K.state.streak||0)}</span>
            <button class="hud-gear" id="homeGear" aria-label="${esc(t('common.settings'))}">⚙</button>
          </div>
        </header>

        <h2 class="home-section">${esc(t('home.pickWorld'))}</h2>
        <div class="home-worlds">${worldCards}</div>

        <button class="home-cta" id="homeCta">
          <span class="home-cta-icon">▶</span>
          <span><b>${esc(t('home.cta'))}</b><small>${esc(t('home.ctaSub',{world:worldTitle(last)}))}</small></span>
          <i>›</i>
        </button>

        <div class="home-quick">
          <div class="quick-group" role="group" aria-label="${esc(t('home.voiceLabel'))}">${voices}</div>
          <div class="quick-group" role="group" aria-label="${esc(t('home.languageLabel'))}">${langs}</div>
        </div>

        ${bottomNav('home')}
      </div>
    </section>`);

    f.querySelectorAll('[data-world]').forEach(b=>b.onclick=()=>{K.sfx('tap');K.enterWorld(b.dataset.world)});
    f.querySelector('#homeCta').onclick=()=>{K.sfx('tap');K.enterWorld(last)};
    f.querySelector('#homeGear').onclick=()=>{K.sfx('tap');K.showParent()};
    f.querySelectorAll('[data-voice]').forEach(b=>b.onclick=()=>{K.sfx('tap');selectVoice(b.dataset.voice)});
    f.querySelectorAll('[data-lang]').forEach(b=>b.onclick=()=>{K.sfx('tap');switchLanguage(b.dataset.lang)});
    bindNav(f);
  };

  function selectVoice(v){
    K.state.voice=v;K.save();K.showHome();
    if(v!=='Stil') K.speak(t(v==='Milo'?'voice.milo.hello':'voice.luna.hello'));
  }
  function switchLanguage(id){
    if(!K.setLanguage(id)) return;
    K.useBank();
    K.showHome();
  }

  /* ---------------- World ---------------- */

  K.enterWorld=world=>{
    if(!WORLD_ORDER.includes(world)) return K.showHome();
    K.stopSpeech();K.currentWorld=world;K.state.lastWorld=world;K.save();K.sfx('world');
    K.audio.setTrack(WORLD_MUSIC[world]||'magical').catch(()=>{});
    K.showWorld(world);
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

    const f=K.frame(`<section class="native-world world-${world} fade-in">
      <img class="native-world-bg" src="${K.MASTER[world]}" alt="">
      <div class="native-world-hero"><img src="${K.MASTER[world]}" alt="${esc(worldTitle(world))}"></div>
      <div class="native-world-shade"></div>
      <div class="native-world-ui">
        <header class="native-world-head">
          <button id="worldBack" class="world-round" aria-label="${esc(t('world.backHome'))}">‹</button>
          <div class="world-title-wrap">
            <div class="world-kicker">${WORLD_ICON[world]} ${esc(t('world.kicker'))}</div>
            <h1 class="${worldTitle(world).length>14?'long':''}">${esc(worldTitle(world))}</h1>
            <p>${esc(worldSub(world))}</p>
          </div>
          <button id="worldGear" class="world-round" aria-label="${esc(t('common.settings'))}">⚙</button>
        </header>
        <div class="world-topic-grid">${topics.map(tp=>`<button class="world-topic has-art" data-topic="${tp.i}">
          <img class="world-topic-art" src="${K.TOPIC_ART[tp.key]||K.MASTER[world]}" alt="" decoding="async">
          <span class="world-topic-veil"></span>
          <span class="world-topic-num">${tp.i+1}</span>
          <span class="world-topic-copy"><b>${esc(tp.label)}</b><small>${esc(t('world.topicMeta',{count:tp.count,group:K.state.group}))}</small></span>
          <i>›</i>
        </button>`).join('')}</div>
        <button class="world-mix" id="worldMix">
          <span>▶</span>
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
      {icon:'🗺️',key:'achievement.allWorlds',now:playedWorlds,goal:6}
    ].map(a=>({...a,done:a.now>=a.goal}));

    const body=`<div class="summary-hero"><div class="summary-icon">🏆</div><div><b>${esc(t('achievements.summary',{done:defs.filter(x=>x.done).length,total:defs.length}))}</b><span>${esc(t('achievements.summarySub'))}</span></div></div>
      <div class="achievement-grid">${defs.map(a=>`<article class="achievement-card ${a.done?'done':''}"><div class="achievement-icon">${a.icon}</div><div><b>${esc(t(a.key))}</b><small>${a.done?esc(t('achievements.done')):`${a.now}/${a.goal}`}</small><div class="mini-track"><i style="width:${Math.min(100,a.now/a.goal*100)}%"></i></div></div>${a.done?'<span class="done-badge">✓</span>':''}</article>`).join('')}</div>`;
    nativeScreen({cls:'achievements-screen',title:t('achievements.title'),subtitle:t('achievements.sub'),body,active:'achievements'});
  };

  /* ---------------- Collection ---------------- */

  K.showCollection=(tab='worlds')=>{
    K.stopSpeech();K.lastView='collection';
    const ids=progress().correctQuestionIds;
    const cards=ids.map(id=>K.questions.find(q=>q.id===id)).filter(Boolean);
    let content='';
    if(tab==='worlds') content=`<div class="world-progress-grid">${WORLD_ORDER.map(w=>{const s=worldStat(w);return`<button class="progress-world" data-world="${w}"><span class="progress-world-icon">${WORLD_ICON[w]}</span><span><b>${esc(worldTitle(w))}</b><small>${esc(t('collection.worldStat',{correct:s.correct,answered:s.answered,pct:accuracy(s)}))}</small><span class="wide-track"><i style="width:${accuracy(s)}%"></i></span></span><em>›</em></button>`}).join('')}</div>`;
    if(tab==='cards') content=cards.length
      ?`<div class="knowledge-grid">${cards.map(q=>`<article class="knowledge-card world-${q.world}"><div class="knowledge-art">${WORLD_ICON[q.world]||'⭐'}</div><b>${esc(q.answer)}</b><small>${esc(topicLabel(q.topic))}</small><span>${esc(t('collection.discovered'))}</span></article>`).join('')}</div>`
      :`<div class="empty-state"><div>🃏</div><h2>${esc(t('collection.emptyTitle'))}</h2><p>${esc(t('collection.emptyBody'))}</p></div>`;
    if(tab==='mascots'){
      content=`<div class="mascot-grid">${MASCOTS.map(m=>{
        const ok=totalCorrect()>=m.need,sel=K.state.selectedMascot===m.id;
        const face=ok&&K.MASCOT_ART[m.id]?`<img class="mascot-face large" src="${K.MASCOT_ART[m.id]}" alt="">`:(ok?m.icon:'🔒');
        return`<button class="mascot-card ${ok?'unlocked':'locked'} ${sel?'selected':''}" data-mascot="${m.id}" ${ok?'':'disabled'}><div>${face}</div><b>${esc(t(`mascot.${m.id}`))}</b><small>${ok?esc(t(`mascot.${m.id}.desc`)):esc(t('collection.mascotLocked',{n:Math.max(0,m.need-totalCorrect())}))}</small>${sel?`<span>${esc(t('collection.mascotActive'))}</span>`:ok?`<span>${esc(t('collection.mascotChoose'))}</span>`:''}</button>`;
      }).join('')}</div><div class="collection-note">${esc(t('collection.mascotCount',{unlocked:unlockedMascots().length,total:MASCOTS.length}))}</div>`;
    }
    const body=`<div class="collection-tabs"><button data-tab="worlds" class="${tab==='worlds'?'active':''}">${esc(t('collection.tabWorlds'))}</button><button data-tab="cards" class="${tab==='cards'?'active':''}">${esc(t('collection.tabCards'))} <i>${cards.length}</i></button><button data-tab="mascots" class="${tab==='mascots'?'active':''}">${esc(t('collection.tabMascots'))}</button></div>${content}`;
    const f=nativeScreen({cls:'collection-screen',title:t('collection.title'),subtitle:t('collection.sub'),body,active:'collection'});
    f.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{K.sfx('tap');K.showCollection(b.dataset.tab)});
    f.querySelectorAll('[data-world]').forEach(b=>b.onclick=()=>{K.sfx('tap');K.enterWorld(b.dataset.world)});
    f.querySelectorAll('[data-mascot]:not([disabled])').forEach(b=>b.onclick=()=>{K.sfx('tap');K.state.selectedMascot=b.dataset.mascot;K.save();K.showCollection('mascots')});
  };

  /* ---------------- Stats ---------------- */

  K.showStats=()=>{
    K.stopSpeech();K.lastView='stats';
    const answered=Number(K.state.answered||0),correct=Number(K.state.correct||0);
    const pct=answered?Math.round(correct/answered*100):0;
    const body=`<div class="stat-hero"><div class="stat-ring" style="--p:${pct}"><b>${pct}%</b><small>${esc(t('stats.correctShort'))}</small></div><div><h2>${esc(t('stats.heroTitle'))}</h2><p>${esc(t('stats.heroSub',{answered,quizzes:K.state.quizzesPlayed||0,quizWord:t((K.state.quizzesPlayed||0)===1?'stats.quizOne':'stats.quizMany')}))}</p></div></div>
      <div class="stat-cards"><article><span>⭐</span><b>${Number(K.state.xp||0)}</b><small>${esc(t('stats.xpTotal'))}</small></article><article><span>🪙</span><b>${Number(K.state.coins||0)}</b><small>${esc(t('stats.coins'))}</small></article><article><span>🔥</span><b>${Number(K.state.streak||0)}</b><small>${esc(t('stats.streak'))}</small></article><article><span>🃏</span><b>${progress().correctQuestionIds.length}</b><small>${esc(t('stats.cards'))}</small></article></div>
      <h2 class="section-title">${esc(t('stats.perWorld'))}</h2>
      <div class="world-stat-list">${WORLD_ORDER.map(w=>{const s=worldStat(w);return`<article><span>${WORLD_ICON[w]}</span><div><b>${esc(worldTitle(w))}</b><small>${esc(t('stats.worldLine',{correct:s.correct,answered:s.answered,quizzes:s.quizzes,quizWord:t(s.quizzes===1?'stats.quizOne':'stats.quizMany')}))}</small><div class="wide-track"><i style="width:${accuracy(s)}%"></i></div></div><strong>${accuracy(s)}%</strong></article>`}).join('')}</div>`;
    nativeScreen({cls:'stats-screen',title:t('stats.title'),subtitle:t('stats.sub'),body,active:'stats'});
  };

  /* ---------------- Parent zone ---------------- */

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
      <section class="setting-card"><div class="setting-icon">🎓</div><div><b>${esc(t('settings.group'))}</b><small>${esc(t('settings.groupSub'))}</small></div><div class="stepper"><button data-group="minus">−</button><strong>${esc(t('settings.groupValue',{n:K.state.group}))}</strong><button data-group="plus">+</button></div></section>
      <section class="setting-card"><div class="setting-icon">🌍</div><div><b>${esc(t('settings.language'))}</b><small>${esc(t('settings.languageSub'))}</small></div><div class="lang-toggle">${K.LANGUAGES.map(l=>`<button data-setlang="${l.id}" class="${K.state.language===l.id?'active':''}">${l.flag} ${esc(l.id.toUpperCase())}</button>`).join('')}</div></section>
      <section class="setting-card clickable" id="soundOpen"><div class="setting-icon">🔊</div><div><b>${esc(t('settings.sound'))}</b><small>${esc(voiceLine)} · ${esc(musicLine)}</small></div><em>›</em></section>
      <section class="setting-card"><div class="setting-icon">⏱️</div><div><b>${esc(t('settings.timeLimit'))}</b><small id="timeLabel">${esc(K.state.timeLimitOn===false?t('settings.timeLimitOff'):t('settings.timeLimitValue',{n:K.state.timeLimit||45}))}</small></div><button class="native-switch ${K.state.timeLimitOn!==false?'on':''}" id="timeToggle"><span></span></button></section>
      <section class="range-setting"><input id="timeRange" type="range" min="15" max="90" step="15" value="${K.state.timeLimit||45}" ${K.state.timeLimitOn===false?'disabled':''}></section>
      <section class="setting-card clickable" id="privacyOpen"><div class="setting-icon">🛡️</div><div><b>${esc(t('settings.privacy'))}</b><small>${esc(t('settings.privacySub'))}</small></div><em>›</em></section>
      <section class="setting-card clickable reset-card" id="resetOpen"><div class="setting-icon">♻️</div><div><b>${esc(t('settings.reset'))}</b><small>${esc(t('settings.resetSub'))}</small></div><em>›</em></section>
    </div>`;
    const f=nativeScreen({cls:'parent-screen',title:t('settings.title'),subtitle:t('settings.sub'),body,active:'parent'});
    f.querySelectorAll('[data-group]').forEach(b=>b.onclick=()=>{K.sfx('tap');const d=b.dataset.group==='plus'?1:-1;K.state.group=Math.max(1,Math.min(8,(K.state.group||5)+d));K.save();K.showParent()});
    f.querySelectorAll('[data-setlang]').forEach(b=>b.onclick=()=>{K.sfx('tap');if(K.setLanguage(b.dataset.setlang)){K.useBank();K.showParent()}});
    f.querySelector('#soundOpen').onclick=()=>{K.sfx('tap');K.showSoundSettings()};
    f.querySelector('#timeToggle').onclick=()=>{K.sfx('tap');K.state.timeLimitOn=K.state.timeLimitOn===false;K.save();K.showParent()};
    f.querySelector('#timeRange').oninput=e=>{K.state.timeLimit=Number(e.target.value);K.state.timeLimitOn=true;K.save();f.querySelector('#timeLabel').textContent=t('settings.timeLimitValue',{n:K.state.timeLimit})};
    f.querySelector('#privacyOpen').onclick=()=>{K.sfx('tap');showPrivacyInfo()};
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
      </div></div>`;
    f.appendChild(o);
    const redraw=()=>{o.remove();K.showSoundSettings()};
    o.querySelector('.sound-close').onclick=()=>{K.stopSpeech();o.remove()};
    o.querySelector('[data-toggle="sfx"]').onclick=()=>{K.audio.setSfx(K.state.soundOn===false);redraw()};
    o.querySelector('[data-toggle="music"]').onclick=async()=>{await K.audio.setMusic(K.state.musicOn===false);redraw()};
    o.querySelector('[data-volume="sfx"]').oninput=e=>K.audio.setSfxVolume(e.target.value/100);
    o.querySelector('[data-volume="music"]').oninput=e=>K.audio.setMusicVolume(e.target.value/100);
    o.querySelector('.sound-test').onclick=()=>K.audio.play('reward');
    o.querySelectorAll('[data-track]').forEach(b=>b.onclick=async()=>{await K.audio.setTrack(b.dataset.track);redraw()});
    o.querySelectorAll('[data-guide]').forEach(b=>b.onclick=()=>{K.state.voice=b.dataset.guide;K.save();K.stopSpeech();redraw();if(K.state.voice!=='Stil')K.speak(t(K.state.voice==='Milo'?'voice.milo.hello':'voice.luna.hello'))});
  };

  window.addEventListener('keydown',e=>{if(e.key==='Escape'){K.stopSpeech();K.showHome()}});
  K.progress();
})();
