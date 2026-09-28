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
  // Waar het bord groeit. Op een telefoon (staand) komt er per niveau een rij
  // onder: vier kaarten breed, dat is wat er past. Op een tablet op zijn kant
  // groeit het de andere kant op — vier rijen hoog, en er komt per niveau een
  // kolom naast. Zo houden de kaarten de grootte die ze op niveau 1 hebben in
  // plaats van steeds platter te worden, en vult het bord het brede scherm.
  // De vorm wordt bij elke tekening opnieuw bepaald, zodat draaien meteen klopt.
  const boardShape=cards=>{
    const wide=document.documentElement.dataset.shape==='wide';
    return wide?{cols:Math.ceil(cards/4),rows:4}:{cols:4,rows:Math.ceil(cards/4)};
  };
  const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};

  // Short, concrete answers make good word cards ("Mercurius", "De Nijl");
  // fragments that start with a preposition or pronoun ("Met kieuwen") do not.
  const NOT_A_NOUN=/^(met|door|om|voor|in|op|naar|uit|bij|zonder|alle|ze|zij|het is|with|by|to|for|on|at|from|they|it|because|com|por|para|em|no|na|eles|ela|porque)\b/i;
  // world 'mix' draws from every world (the Memo on Home).
  function pickQuestions(world,n){
    const good=K.questions.filter(q=>(world==='mix'||q.world===world)&&K.answerArtFor?.(q)&&String(q.answer).length<=16&&String(q.answer).split(' ').length<=2&&!/^\d+$/.test(q.answer)&&!NOT_A_NOUN.test(q.answer));
    // One card per answer and per picture: two answers that share a picture
    // ("Gorilla" / "De gorilla") would make four identical cards.
    const seen=new Set();const uniq=good.filter(q=>{const k=q.answer.toLowerCase(),a=K.answerArtFor(q);if(seen.has(k)||seen.has(a))return false;seen.add(k);seen.add(a);return true});
    return shuffle(uniq).slice(0,n);
  }

  let timer=null;
  function stopTimer(){if(timer){clearInterval(timer.id);timer=null}}

  // Picker: which world's pictures (or all of them) the board is made of.
  // Solo or two players taking turns on one phone. The choice is remembered.
  const memoMode=()=>K.state.memoMode==='duel'?'duel':'solo';
  K.showMemoPicker=()=>{
    K.audio.setTrack('play').catch(()=>{});
    K.stopSpeech();stopTimer();
    const mode=memoMode();
    const worlds=K.playableWorlds();
    const f=K.frame(`<section class="native-panel-screen memo-picker fade-in">
      <div class="native-panel-glow"></div>
      <header class="panel-head"><button class="panel-back" aria-label="${esc(t('common.back'))}">${K.icon('back')}</button><div><div class="panel-kicker">${esc(t('memo.title'))}</div><h1>${esc(t('memo.pickTitle'))}</h1><p>${esc(t('memo.pickSub',{n:K.state.niveau||1}))}</p></div><button class="panel-settings" aria-label="${esc(t('common.settings'))}">${K.icon('gear')}</button></header>
      <div class="panel-scroll">
        <div class="memo-mode" role="radiogroup" aria-label="${esc(t('memo.modeTitle'))}">
          <button class="memo-mode-btn solo ${mode==='solo'?'active':''}" data-mode="solo" role="radio" aria-checked="${mode==='solo'}"><span class="memo-mode-faces"><img class="mascot-face" src="${K.guideArt(K.state.voice)}" alt=""></span><b>${esc(t('memo.solo'))}</b><small>${esc(t('memo.soloSub'))}</small>${mode==='solo'?`<i class="memo-mode-check">${K.icon('check')}</i>`:''}</button>
          <button class="memo-mode-btn duel ${mode==='duel'?'active':''}" data-mode="duel" role="radio" aria-checked="${mode==='duel'}"><span class="memo-mode-faces two"><img class="mascot-face" src="${K.MASCOT_ART.milo}" alt=""><em>VS</em><img class="mascot-face" src="${K.MASCOT_ART.luna}" alt=""></span><b>${esc(t('memo.duel'))}</b><small>${esc(t('memo.duelSub'))}</small>${mode==='duel'?`<i class="memo-mode-check">${K.icon('check')}</i>`:''}</button>
        <label class="memo-p2" ${mode==='duel'?'':'hidden'}><span>${esc(t('memo.p2Label'))}</span><input id="memoP2" type="text" maxlength="14" autocomplete="off" placeholder="${esc(t('memo.player2'))}" value="${esc(K.state.memoPlayer2||'')}" aria-label="${esc(t('memo.p2Label'))}"></label>
        </div>
        <button class="memo-pick mix" data-memo="mix"><img class="home-game-art" src="${K.GAME_ART.memoAll}" alt="" decoding="async"><span class="home-game-veil"></span><b>${esc(t('game.mixAll'))}</b></button>
        <div class="memo-pick-grid">${worlds.map(w=>`<button class="memo-pick ${K.premium.can('memo',w)?'':'locked'}" data-memo="${w}"><img class="home-game-art" src="${K.MASTER[w]}" alt="" decoding="async" style="object-position:${K.WORLD_FOCUS?.[w]||'center 45%'}"><span class="home-game-veil"></span>${K.premium.can('memo',w)?'':K.premiumBadge()}<b>${esc(t(`world.${w}.title`))}</b></button>`).join('')}</div>
      </div>
    </section>`);
    f.querySelector('.panel-back').onclick=()=>{K.sfx('tap');K.showHome()};
    f.querySelector('.panel-settings').onclick=()=>{K.sfx('tap');K.showParent()};
    f.querySelectorAll('[data-memo]').forEach(b=>b.onclick=()=>{K.sfx('world');K.startMemo(b.dataset.memo)});
    f.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{
      K.sfx('tap');K.state.memoMode=b.dataset.mode;K.save();
      const p2=f.querySelector('.memo-p2');if(p2)p2.hidden=b.dataset.mode!=='duel';
      f.querySelectorAll('[data-mode]').forEach(x=>{const on=x===b;x.classList.toggle('active',on);x.setAttribute('aria-checked',String(on));x.querySelector('.memo-mode-check')?.remove();if(on)x.insertAdjacentHTML('beforeend',`<i class="memo-mode-check">${K.icon('check')}</i>`)});
    });
    // Player 2 can have a name of their own (remembered), so the turn hint and
    // the winner's line say who it is.
    const p2=f.querySelector('#memoP2');if(p2)p2.addEventListener('input',()=>{K.state.memoPlayer2=p2.value.trim().slice(0,14);K.save()});
  };
  const playerName=i=>i===0?(K.state.name||t('memo.player1')):(K.state.memoPlayer2||t('memo.player2'));

  K.startMemo=world=>{
    world=world||'mix';
    if(!K.premium.can('memo',world)){K.premiumLocked({kind:'memo',world,retry:()=>K.startMemo(world)});return}
    K.audio.setTrack('play').catch(()=>{});
    K.startScoreRun();
    K.stopSpeech();stopTimer();
    const bgWorld=world==='mix'?(K.state.lastWorld||'ruimte'):world;
    K.currentWorld=bgWorld;
    const r=rule();
    const pairs=(r.cols*r.rows)/2;
    // Word pairs first; when a world has too few short answers for a big
    // board, the rest of the board is filled with picture pairs.
    const wordQs=pickQuestions(world,pairs);
    const used=new Set(wordQs.map(q=>q.id)),usedArt=new Set(wordQs.map(q=>K.answerArtFor(q)));
    const fill=shuffle(K.questions.filter(q=>(world==='mix'||q.world===world)&&K.answerArtFor?.(q)&&!used.has(q.id)&&!usedArt.has(K.answerArtFor(q)))).slice(0,Math.max(0,pairs-wordQs.length));
    const qs=[...wordQs,...fill];
    if(qs.length<pairs){K.toast(t('memo.none'));return K.showWorld(world)}
    const cards=shuffle(qs.flatMap((q,i)=>[
      {id:`${i}a`,pair:i,kind:'art',q},
      {id:`${i}b`,pair:i,kind:r.words&&i<wordQs.length?'word':'art',q}
    ]));
    const duel=memoMode()==='duel';
    // Two players: no clock, the score decides; turns swap after every two cards.
    K.memo={world,bgWorld,pairs,cards,found:0,moves:0,open:[],locked:false,startedAt:Date.now(),seconds:duel||K.state.timeLimitOn===false?0:pairs*r.secPerPair,done:false,cols:r.cols,rows:r.rows,duel,turn:0,scores:[0,0]};
    render();
    // Pictures first, words second: the board's images get the connections
    // before the speech warm-up starts, so no tile is still empty when the
    // child flips it.
    loadBoardArt(qs).then(()=>K.prefetchSpeech([...qs.map(q=>q.answer),t('memo.speech.done'),t('memo.speech.time')]));
  };

  // Loads every picture on the board, four at a time, and resolves when all
  // are in the cache (a failed load resolves too; the tile's own onerror
  // retries it).
  function loadBoardArt(qs){
    const urls=[...new Set(qs.map(q=>K.answerArtFor(q)))];
    let i=0;
    const worker=()=>new Promise(done=>{const step=()=>{if(i>=urls.length)return done();const img=new Image();img.onload=img.onerror=step;img.src=urls[i++]};step()});
    return Promise.all([0,1,2,3].map(worker));
  }

  // A tile whose picture fails (a dropped Wi-Fi request shows Safari's grey
  // "?") reloads it once with a fresh URL, and after that shows the word so the
  // pair can still be found.
  function armArt(img,word){
    img.onerror=()=>{
      if(!img.dataset.retry){img.dataset.retry='1';setTimeout(()=>{img.src=img.src.split('?')[0]+'?r='+Date.now()},700);return}
      const b=document.createElement('b');b.textContent=word;img.parentElement.classList.add('word');img.replaceWith(b);
    };
  }

  function render(){
    const m=K.memo;
    const shape=boardShape(m.cards.length);
    const f=K.frame(`<section class="memo quiz-v2 quiz-world-${m.bgWorld} fade-in">
            <!-- Eén lucht voor alle minispellen: elk spel staat op zijn eigen eiland
           (assets/games/*-island.jpg), en die zijn onder dezelfde hemel getekend.
           Hiervoor stond hier de wereldplaat, en dan had rekenen in de kunstwereld
           een andere lucht dan memo in de ruimte. -->
<img class="quiz-v2-bg" src="${K.GAME_ART.memo}" alt="">
      <div class="quiz-v2-dim"></div>
      <div class="quiz-v2-ui memo-ui">
        <header class="quiz-v2-head">
          <button class="quiz-back" id="memoBack" aria-label="${esc(t('common.back'))}">${K.icon('back')}</button>
          <div class="quiz-brand"><span>Memo</span><small>${esc(m.world==='mix'?t('game.mixAll'):t(`world.${m.world}.title`))} · ${esc(t('memo.level',{n:K.state.niveau||1}))}</small></div>
          <div class="quiz-meta"><button class="meta-chip" data-stats>${K.icon('coin')} ${Number(K.state.coins||0)}</button><button class="meta-chip" data-stats>${K.icon('flame')} ${Number(K.state.streak||0)}</button></div>
        </header>
        ${m.duel?`<div class="memo-duel" id="memoDuel">${[0,1].map(i=>`<span class="memo-player ${i===m.turn?'active':''}" data-player="${i}"><b>${esc(playerName(i))}</b><em>${m.scores[i]}</em></span>`).join('')}</div>`:''}
        <div class="quiz-progress memo-progress"><strong id="memoPairs">${esc(t('memo.pairs',{found:0,total:m.pairs}))}</strong><div><i id="memoBar" style="width:0%"></i></div>${m.seconds?`<span class="quiz-timer running" id="memoTimer" style="--p:100"><b>${m.seconds}</b></span>`:`<span id="memoMoves">${esc(t('memo.moves',{n:0}))}</span>`}</div>
        <main class="memo-board" style="--cols:${shape.cols};--rows:${shape.rows}" role="grid" aria-label="Memo">
          ${m.cards.map(c=>`<button class="memo-card" data-card="${c.id}" aria-label="${esc(t('memo.card'))}">
            <span class="memo-face memo-back">${K.icon('star')}</span>
            <span class="memo-face memo-front ${c.kind}">${c.kind==='art'?`<img src="${K.answerArtFor(c.q)}" alt="" decoding="async">`:`<b>${esc(c.q.answer)}</b>`}</span>
          </button>`).join('')}
        </main>
        <div class="memo-foot"><span id="memoMovesFoot">${esc(t('memo.moves',{n:0}))}</span><span id="memoHint">${esc(m.duel?t('memo.turn',{name:playerName(m.turn)}):t('memo.hintLine'))}</span></div>
      </div>
    </section>`);
    const home=()=>K.showMemoPicker();
    f.querySelector('#memoBack').onclick=()=>{K.stopSpeech();stopTimer();K.sfx('tap');home()};
    f.querySelectorAll('[data-stats]').forEach(b=>b.onclick=()=>{K.stopSpeech();stopTimer();K.sfx('tap');K.showStats({back:home})});
    f.querySelectorAll('[data-card]').forEach(b=>b.onclick=()=>flip(b));
    m.cards.forEach(c=>{const img=f.querySelector(`[data-card="${c.id}"] .memo-front img`);if(img)armArt(img,c.q.answer)});

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
      if(m.duel){m.scores[m.turn]++;const em=f.querySelector(`[data-player="${m.turn}"] em`);if(em)em.textContent=m.scores[m.turn]}
      const els=[a,b].map(c=>f.querySelector(`[data-card="${c.id}"]`));
      els.forEach(el=>el.classList.add('is-matched'));
      setTimeout(()=>{K.sfx('good')},120);
      const r1=els[1].getBoundingClientRect(),fr=f.getBoundingClientRect();
      K.celebrateAt?.(f,{x:r1.left-fr.left+r1.width/2,y:r1.top-fr.top+r1.height/2,count:22});
      f.querySelector('#memoPairs').textContent=t('memo.pairs',{found:m.found,total:m.pairs});
      f.querySelector('#memoBar').style.width=`${Math.round(m.found/m.pairs*100)}%`;
      if(m.found>=m.pairs){stopTimer();setTimeout(()=>finish(true),650);return}
      // Classic rule: a pair earns another turn, so no swap here.
    }else{
      m.locked=true;
      setTimeout(()=>{
        K.sfx('swoosh');
        [a,b].forEach(c=>f.querySelector(`[data-card="${c.id}"]`)?.classList.remove('is-open'));
        m.open=[];m.locked=false;
        if(m.duel)swapTurn(f);
      },750);
    }
  }
  // Duel: the other player is up after a miss; a pair keeps the turn.
  function swapTurn(f){
    const m=K.memo;if(!m||m.done)return;
    m.turn=1-m.turn;
    f.querySelectorAll('[data-player]').forEach(el=>el.classList.toggle('active',Number(el.dataset.player)===m.turn));
    const hint=f.querySelector('#memoHint');if(hint)hint.textContent=t('memo.turn',{name:playerName(m.turn)});
  }

  K.memoFinishForTest=won=>finish(won);   // deterministic time-out in tests
  function finish(won){
    const m=K.memo;if(!m||m.done)return;m.done=true;stopTimer();K.stopSpeech();
    if(m.duel)return finishDuel();
    const secs=Math.round((Date.now()-m.startedAt)/1000);
    const stars=!won?0:m.moves<=m.pairs+2?3:m.moves<=Math.ceil(m.pairs*1.7)?2:1;
    const xp=won?m.pairs*5+stars*5:0,coins=won?m.pairs:0;
    // Progress: XP, coins, best moves per world and a games counter that the
    // statistics and achievements read.
    const G=K.progress().games||={};const memo=G.memo||={played:0,won:0,best:{}};
    memo.played++;if(won){memo.won++;const best=memo.best[m.world];if(!best||m.moves<best)memo.best[m.world]=m.moves}
    const paid=K.awardPoints(xp),earned=K.awardCoins(coins);
    K.touchStreak();K.save();

    const f=K.frame(`<section class="result-v2 fade-in ${won?'is-pass':'is-fail'}">
      <img class="result-v2-bg" src="${K.GAME_ART.memo}" alt="">
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

  // Two players: the higher score wins, a tie is a tie. The profile gets a
  // small XP reward for playing; the games counter counts a win for player 1
  // (the profile's owner).
  function finishDuel(){
    const m=K.memo;
    const [s1,s2]=m.scores;
    const tie=s1===s2,winner=tie?null:(s1>s2?0:1);
    const xp=m.pairs*3,coins=Math.ceil(m.pairs/2);
    const G=K.progress().games||={};const memo=G.memo||={played:0,won:0,best:{}};
    memo.played++;if(winner===0)memo.won++;
    const paid=K.awardPoints(xp);K.awardCoins(coins);
    K.touchStreak();K.save();
    const title=tie?t('memo.duelTie'):t('memo.duelWin',{name:playerName(winner)});
    const f=K.frame(`<section class="result-v2 fade-in is-pass">
      <img class="result-v2-bg" src="${K.GAME_ART.memo}" alt="">
      <div class="result-v2-dim"></div>
      <div class="result-v2-card">
        <div class="result-stage">
          <button class="result-gift" id="resultGift" aria-label="🎁">🎁</button>
          <div class="result-mascot"><img class="mascot-face large" src="${K.guideArt(K.state.voice)}" alt=""></div>
        </div>
        <div class="result-kicker">${esc(t('memo.duelKicker'))}</div>
        <h1>${esc(title)}</h1>
        <div class="memo-duel result" >${[0,1].map(i=>`<span class="memo-player ${winner===i?'active':''}"><b>${esc(playerName(i))}</b><em>${m.scores[i]}</em></span>`).join('')}</div>
        <p class="result-rule">${esc(t('memo.duelSummary',{pairs:m.pairs,moves:m.moves}))}</p>
        <div class="result-stats"><span><b>${m.moves}</b><small>${esc(t('memo.movesShort'))}</small></span><span><b>+${xp}</b><small>${esc(t('result.xp'))}</small></span><span><b>${Number(K.state.coins||0)}</b><small>${esc(t('result.coins'))}</small></span></div>
        <div class="result-native">
          <button id="againBtn">${esc(t('memo.rematch'))}</button>
          <button id="worldBtn" class="secondary">${esc(t('memo.otherWorld'))}</button>
          <button id="shareBtn" class="secondary">${esc(t('result.share'))}</button>
        </div>
      </div>
    </section>`);
    const stage=f.querySelector('.result-stage'),gift=f.querySelector('#resultGift');
    let opened=false;
    const open=()=>{if(opened)return;opened=true;stage.classList.add('open');K.sfx('gift');setTimeout(()=>K.sfx('reward'),350);K.celebrate?.('quiz',gift)};
    gift.onclick=open;setTimeout(open,1000);
    K.speak(tie?t('memo.speech.tie'):t('memo.speech.win'));   /* the winner's name stays on screen: it never goes to the speech service */
    f.querySelector('#againBtn').onclick=()=>{K.sfx('tap');K.startMemo(m.world)};
    f.querySelector('#worldBtn').onclick=()=>{K.stopSpeech();K.sfx('tap');K.showMemoPicker()};
    f.querySelector('#shareBtn').onclick=()=>{K.sfx('tap');K.shareScore()};
  }
})();
