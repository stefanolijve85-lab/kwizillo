(()=>{
  const K=window.KWIZILLO_M1;
  if(!K) return;
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const t=(k,p)=>K.t(k,p);

  // Memo: pairs of identical pictures from the world's own question
  // illustrations; the guide names each picture when it is turned. Rules per
  // level (niveau): board size and seconds per pair. Everything is generated,
  // so it works in every language and for every world.
  // Every level pairs two identical pictures; higher levels only add cards
  // and take time away.
  const RULES=[
    {cols:4,rows:4,words:false,secPerPair:20},
    {cols:4,rows:5,words:false,secPerPair:16},
    {cols:4,rows:5,words:false,secPerPair:14},
    {cols:4,rows:6,words:false,secPerPair:12},
    {cols:4,rows:6,words:false,secPerPair:10},
    {cols:4,rows:7,words:false,secPerPair:9}
  ];
  const rule=()=>RULES[Math.max(1,Math.min(6,Number(K.state.niveau||1)))-1];
  const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};

  // Short, concrete answers make good word cards ("Mercurius", "De Nijl");
  // fragments that start with a preposition or pronoun ("Met kieuwen") do not.
  const NOT_A_NOUN=/^(met|door|om|voor|in|op|naar|uit|bij|zonder|alle|ze|zij|het is|with|by|to|for|on|at|from|they|it|because|com|por|para|em|no|na|eles|ela|porque)\b/i;
  // world 'mix' draws from every world (the Memo on Home).
  function pickQuestions(world,n){
    const good=K.questions.filter(q=>(world==='mix'||q.world===world)&&K.questionArtFor?.(q.id)&&String(q.answer).length<=16&&String(q.answer).split(' ').length<=2&&!/^\d+$/.test(q.answer)&&!NOT_A_NOUN.test(q.answer));
    const seen=new Set();const uniq=good.filter(q=>{const k=q.answer.toLowerCase();if(seen.has(k))return false;seen.add(k);return true});
    return shuffle(uniq).slice(0,n);
  }

  let timer=null;
  function stopTimer(){if(timer){clearInterval(timer.id);timer=null}}

  // Picker: which world's pictures (or all of them) the board is made of.
  K.showMemoPicker=()=>{
    K.stopSpeech();stopTimer();
    const worlds=['ruimte','dieren','aarde','geschiedenis','wetenschap','mysterie'];
    const f=K.frame(`<section class="native-panel-screen memo-picker fade-in">
      <div class="native-panel-glow"></div>
      <header class="panel-head"><button class="panel-back" aria-label="${esc(t('common.back'))}">${K.icon('back')}</button><div><div class="panel-kicker">${esc(t('memo.title'))}</div><h1>${esc(t('memo.pickTitle'))}</h1><p>${esc(t('memo.pickSub',{n:K.state.niveau||1}))}</p></div><button class="panel-settings" aria-label="${esc(t('common.settings'))}">${K.icon('gear')}</button></header>
      <div class="panel-scroll">
        <button class="memo-pick mix" data-memo="mix"><img class="home-game-art" src="${K.GAME_ART.memo}" alt="" decoding="async"><span class="home-game-veil"></span><b>${esc(t('memo.allWorlds'))}</b><small>${esc(t('memo.allWorldsSub'))}</small></button>
        <div class="memo-pick-grid">${worlds.map(w=>`<button class="memo-pick" data-memo="${w}"><img class="home-game-art" src="${K.MASTER[w]}" alt="" decoding="async" style="object-position:${K.WORLD_FOCUS?.[w]||'center 45%'}"><span class="home-game-veil"></span><b>${esc(t(`world.${w}.title`))}</b></button>`).join('')}</div>
      </div>
    </section>`);
    f.querySelector('.panel-back').onclick=()=>{K.sfx('tap');K.showHome()};
    f.querySelector('.panel-settings').onclick=()=>{K.sfx('tap');K.showParent()};
    f.querySelectorAll('[data-memo]').forEach(b=>b.onclick=()=>{K.sfx('world');K.startMemo(b.dataset.memo)});
  };

  K.startMemo=world=>{
    K.stopSpeech();stopTimer();
    world=world||'mix';
    const bgWorld=world==='mix'?(K.state.lastWorld||'ruimte'):world;
    K.currentWorld=bgWorld;
    const r=rule();
    const pairs=(r.cols*r.rows)/2;
    // Word pairs first; when a world has too few short answers for a big
    // board, the rest of the board is filled with picture pairs.
    const wordQs=pickQuestions(world,pairs);
    const used=new Set(wordQs.map(q=>q.id));
    const fill=shuffle(K.questions.filter(q=>(world==='mix'||q.world===world)&&K.questionArtFor?.(q.id)&&!used.has(q.id))).slice(0,Math.max(0,pairs-wordQs.length));
    const qs=[...wordQs,...fill];
    if(qs.length<pairs){K.toast(t('memo.none'));return K.showWorld(world)}
    const cards=shuffle(qs.flatMap((q,i)=>[
      {id:`${i}a`,pair:i,kind:'art',q},
      {id:`${i}b`,pair:i,kind:r.words&&i<wordQs.length?'word':'art',q}
    ]));
    K.memo={world,bgWorld,pairs,cards,found:0,moves:0,open:[],locked:false,startedAt:Date.now(),seconds:K.state.timeLimitOn===false?0:pairs*r.secPerPair,done:false,cols:r.cols,rows:r.rows};
    render();
    // Every word on the board is warmed now, so a flip speaks at once.
    K.prefetchSpeech([...qs.map(q=>q.answer),t('memo.speech.done'),t('memo.speech.time')]);
  };

  function render(){
    const m=K.memo;
    const f=K.frame(`<section class="memo quiz-v2 quiz-world-${m.bgWorld} fade-in">
      <img class="quiz-v2-bg" src="${K.MASTER[m.bgWorld]}" alt="">
      <div class="quiz-v2-dim"></div>
      <div class="quiz-v2-ui memo-ui">
        <header class="quiz-v2-head">
          <button class="quiz-back" id="memoBack" aria-label="${esc(t('common.back'))}">${K.icon('back')}</button>
          <div class="quiz-brand"><span>Memo</span><small>${esc(m.world==='mix'?t('memo.allWorlds'):t(`world.${m.world}.title`))} · ${esc(t('memo.level',{n:K.state.niveau||1}))}</small></div>
          <div class="quiz-meta"><button class="meta-chip" data-stats>${K.icon('coin')} ${Number(K.state.coins||0)}</button><button class="meta-chip" data-stats>${K.icon('flame')} ${Number(K.state.streak||0)}</button></div>
        </header>
        <div class="quiz-progress memo-progress"><strong id="memoPairs">${esc(t('memo.pairs',{found:0,total:m.pairs}))}</strong><div><i id="memoBar" style="width:0%"></i></div>${m.seconds?`<span class="quiz-timer running" id="memoTimer" style="--p:100"><b>${m.seconds}</b></span>`:`<span id="memoMoves">${esc(t('memo.moves',{n:0}))}</span>`}</div>
        <main class="memo-board" style="--cols:${m.cols};--rows:${m.rows}" role="grid" aria-label="Memo">
          ${m.cards.map(c=>`<button class="memo-card" data-card="${c.id}" aria-label="${esc(t('memo.card'))}">
            <span class="memo-face memo-back">${K.icon('star')}</span>
            <span class="memo-face memo-front ${c.kind}">${c.kind==='art'?`<img src="${K.questionArt(c.q)}" alt="" decoding="async">`:`<b>${esc(c.q.answer)}</b>`}</span>
          </button>`).join('')}
        </main>
        <div class="memo-foot"><span id="memoMovesFoot">${esc(t('memo.moves',{n:0}))}</span><span>${esc(t('memo.hintLine'))}</span></div>
      </div>
    </section>`);
    const home=()=>K.showMemoPicker();
    f.querySelector('#memoBack').onclick=()=>{K.stopSpeech();stopTimer();K.sfx('tap');home()};
    f.querySelectorAll('[data-stats]').forEach(b=>b.onclick=()=>{K.stopSpeech();stopTimer();K.sfx('tap');K.showStats({back:home})});
    f.querySelectorAll('[data-card]').forEach(b=>b.onclick=()=>flip(b));
    // Preload the pictures so the first flip shows the art at once.
    m.cards.forEach(c=>{if(c.kind==='art'){const i=new Image();i.src=K.questionArt(c.q)}});

    if(m.seconds){
      const el=f.querySelector('#memoTimer');
      let left=m.seconds*1000,last=performance.now();
      timer={id:setInterval(()=>{
        const now=performance.now();left-=now-last;last=now;
        if(!el.isConnected){stopTimer();return}
        el.style.setProperty('--p',String(Math.max(0,left/(m.seconds*1000))*100));
        const sec=Math.max(0,Math.ceil(left/1000));if(sec!==timer.sec){timer.sec=sec;K.timerTick?.(sec)}
        el.querySelector('b').textContent=sec;
        el.classList.toggle('urgent',left<=10000);
        if(left<=0){stopTimer();finish(false)}
      },100)};
    }
  }

  function flip(btn){
    const m=K.memo;if(!m||m.done||m.locked)return;
    const card=m.cards.find(c=>c.id===btn.dataset.card);
    if(!card||card.matched||m.open.includes(card))return;
    K.sfx('tap');
    btn.classList.add('is-open');
    m.open.push(card);
    // Say the word of every flipped card; the picture gets its name too.
    K.speak(card.q.answer);
    if(m.open.length<2)return;
    m.moves++;
    const f=K.app.querySelector('.game-frame');
    f.querySelector('#memoMovesFoot').textContent=t('memo.moves',{n:m.moves});
    f.querySelector('#memoMoves')&&(f.querySelector('#memoMoves').textContent=t('memo.moves',{n:m.moves}));
    const [a,b]=m.open;
    if(a.pair===b.pair){
      a.matched=b.matched=true;m.found++;m.open=[];
      const els=[a,b].map(c=>f.querySelector(`[data-card="${c.id}"]`));
      els.forEach(el=>el.classList.add('is-matched'));
      setTimeout(()=>{K.sfx('good')},120);
      const r1=els[1].getBoundingClientRect(),fr=f.getBoundingClientRect();
      K.celebrateAt?.(f,{x:r1.left-fr.left+r1.width/2,y:r1.top-fr.top+r1.height/2,count:22});
      f.querySelector('#memoPairs').textContent=t('memo.pairs',{found:m.found,total:m.pairs});
      f.querySelector('#memoBar').style.width=`${Math.round(m.found/m.pairs*100)}%`;
      if(m.found>=m.pairs){stopTimer();setTimeout(()=>finish(true),650)}
    }else{
      m.locked=true;
      setTimeout(()=>{
        K.sfx('swoosh');
        [a,b].forEach(c=>f.querySelector(`[data-card="${c.id}"]`)?.classList.remove('is-open'));
        m.open=[];m.locked=false;
      },750);
    }
  }

  K.memoFinishForTest=won=>finish(won);   // deterministic time-out in tests
  function finish(won){
    const m=K.memo;if(!m||m.done)return;m.done=true;stopTimer();K.stopSpeech();
    const secs=Math.round((Date.now()-m.startedAt)/1000);
    const stars=!won?0:m.moves<=m.pairs+2?3:m.moves<=Math.ceil(m.pairs*1.7)?2:1;
    const xp=won?m.pairs*5+stars*5:0,coins=won?m.pairs:0;
    // Progress: XP, coins, best moves per world and a games counter that the
    // statistics and achievements read.
    const G=K.progress().games||={};const memo=G.memo||={played:0,won:0,best:{}};
    memo.played++;if(won){memo.won++;const best=memo.best[m.world];if(!best||m.moves<best)memo.best[m.world]=m.moves}
    K.state.xp=Number(K.state.xp||0)+xp;K.state.coins=Number(K.state.coins||0)+coins;
    K.touchStreak();K.save();

    const f=K.frame(`<section class="result-v2 fade-in ${won?'is-pass':'is-fail'}">
      <img class="result-v2-bg" src="${K.MASTER[m.bgWorld]}" alt="">
      <div class="result-v2-dim"></div>
      <div class="result-v2-card">
        <div class="result-stage ${won?'':'open'}">
          ${won?`<button class="result-gift" id="resultGift" aria-label="🎁">🎁</button>`:''}
          <div class="result-mascot"><img class="mascot-face large" src="${K.guideArt(K.state.voice)}" alt=""></div>
        </div>
        <div class="result-kicker">${esc(t(won?'memo.doneKicker':'memo.timeKicker'))}</div>
        <h1>${esc(t(won?'memo.doneTitle':'memo.timeTitle'))}</h1>
        <div class="result-stars">${[1,2,3].map(n=>`<i class="${n<=stars?'on':''}">★</i>`).join('')}</div>
        <p class="result-rule">${esc(t(won?'memo.summary':'memo.summaryTime',{moves:m.moves,pairs:m.pairs,found:m.found,secs}))}</p>
        <div class="result-stats"><span><b>${m.moves}</b><small>${esc(t('memo.movesShort'))}</small></span><span><b>+${xp}</b><small>${esc(t('result.xp'))}</small></span><span><b>${Number(K.state.coins||0)}</b><small>${esc(t('result.coins'))}</small></span></div>
        <div class="result-native">
          <button id="againBtn">${esc(t(won?'memo.again':'memo.retry'))}</button>
          <button id="worldBtn" class="secondary">${esc(t('memo.otherWorld'))}</button>
          <button id="shareBtn" class="secondary">${esc(t('result.share'))}</button>
        </div>
      </div>
    </section>`);
    if(won){
      const stage=f.querySelector('.result-stage'),gift=f.querySelector('#resultGift');
      let opened=false;
      const open=()=>{if(opened)return;opened=true;stage.classList.add('open');K.sfx('gift');setTimeout(()=>K.sfx('reward'),350);K.celebrate?.('quiz',gift)};
      gift.onclick=open;setTimeout(open,1000);
      K.speak(t('memo.speech.done'));
    }else{K.sfx('bad');K.speak(t('memo.speech.time'))}
    f.querySelector('#againBtn').onclick=()=>{K.sfx('tap');K.startMemo(m.world)};
    f.querySelector('#worldBtn').onclick=()=>{K.stopSpeech();K.sfx('tap');K.showMemoPicker()};
    f.querySelector('#shareBtn').onclick=()=>{K.sfx('tap');K.shareScore()};
  }
})();
