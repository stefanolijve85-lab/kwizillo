(()=>{
  const K=window.KWIZILLO_M1;
  if(!K) return;
  const t=(k,v)=>K.t(k,v);
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};

  // Fotozoom: a question's picture starts zoomed right in on a small detail;
  // the child picks what it is from four names. Guessing at the first zoom
  // scores 100, one zoom-out later 75, at the third view 50 — a miss or a
  // run-out zooms all the way out and explains. Pictures and names come from
  // the question bank, so every world plays in every language.
  const ROUNDS=5, POINTS=[100,75,50], ZOOMS=[4.2,2.4,1.4];   // eerst flink ingezoomd: je ziet één stukje
  let timer=null;
  const stopTimer=()=>{if(timer){clearInterval(timer.id);timer=null}};
  const secondsFor=()=>K.state.timeLimitOn===false?0:K.core.questionSeconds(K.state.niveau||1);

  // Same rule as "Wat ben ik?": the answer names a thing (whole word in the
  // explanation, no digits, no yes/no) and the question has its own picture.
  const core=answer=>answer.replace(/^(de|het|een|the|a|an|o|a|os|as|um|uma)\s+/i,'');
  const escapeRe=s=>s.replace(/[.*+?^${}()|[\]\\]/g,m=>'\\'+m);
  const wordRe=answer=>new RegExp('(^|[^\\p{L}])'+escapeRe(core(answer))+'(?=$|[^\\p{L}])','giu');
  const candidates=world=>K.questions.filter(q=>(world==='mix'||q.world===world)&&K.answerArtFor?.(q)&&/^\D{2,}$/.test(q.answer)&&q.answer.split(' ').length<=2&&q.explanation&&wordRe(q.answer).test(q.explanation)&&!/^(ja|nee|yes|no|sim|não|waar|niet waar|true|false)$/i.test(q.answer));
  const answerSize=text=>{const n=String(text||'').length;return n>52?'xlong':n>34?'long':''};
  const letters=['A','B','C','D'];

  K.startFotozoom=world=>{
    world=world||'mix';
    if(!K.premium.can('memo',world)){K.premiumLocked({kind:'fotozoom',world,retry:()=>K.startFotozoom(world)});return}
    K.audio.setTrack('play').catch(()=>{});
    K.startScoreRun();
    K.stopSpeech();
    const pool=shuffle(candidates(world));
    if(pool.length<4){K.toast(t('memo.none'));K.showHome();return}
    const rounds=pool.slice(0,ROUNDS).map(q=>{
      const others=shuffle(pool.filter(o=>o.id!==q.id&&o.answer!==q.answer&&o.world===q.world)).slice(0,3);
      while(others.length<3){const o=pool.find(x=>x.id!==q.id&&x.answer!==q.answer&&!others.includes(x));if(!o)break;others.push(o)}
      // The zoom lands near the middle, where the picture's subject is, never
      // on a corner of sky or lawn.
      return {q,options:shuffle([q,...others]),fx:38+Math.random()*24,fy:34+Math.random()*26};
    });
    K.fotozoom={world,rounds,index:0,score:0,correct:0,startedAt:Date.now(),done:false};
    const lines=[t('fotozoom.ask')];
    for(const r of rounds){lines.push(...r.options.map(o=>K.core.answerText(o.answer)),...['fotozoom.speech.yes','fotozoom.speech.almost'].flatMap(k=>K.core.answerSegments(t(k),r.q.answer).map(x=>x.text)),r.q.explanation)}
    lines.push(t('fotozoom.speech.great'),t('fotozoom.speech.done'));
    K.prefetchSpeech?.(lines);
    showRound();
  };

  function showRound(){
    const g=K.fotozoom;const r=g.rounds[g.index];const q=r.q;
    K.stopSpeech();stopTimer();
    let level=0,locked=false;
    const bgWorld=q.world;
    const f=K.frame(`<section class="quiz-v2 fotozoom fotozoom-${bgWorld} fade-in">
            <!-- Eén lucht voor alle minispellen: elk spel staat op zijn eigen eiland
           (assets/games/*-island.jpg), en die zijn onder dezelfde hemel getekend.
           Hiervoor stond hier de wereldplaat, en dan had rekenen in de kunstwereld
           een andere lucht dan memo in de ruimte. -->
<img class="quiz-v2-bg" src="${K.GAME_ART.fotozoom}" alt="">
      <div class="quiz-v2-dim"></div>
      <div class="quiz-v2-ui">
        <header class="quiz-v2-head">
          <button class="quiz-back" id="fzBack" aria-label="${esc(t('common.back'))}">${K.icon('back')}</button>
          <div class="quiz-brand"><span>${esc(t('fotozoom.title'))}</span><small>${esc(t(`world.${bgWorld}.title`))}</small></div>
          <div class="quiz-meta"><b>${esc(t('fotozoom.round',{n:g.index+1,total:g.rounds.length}))}</b><b>⭐ ${g.score}</b></div>
          ${secondsFor()?`<span class="quiz-timer whoami-timer" id="fzTimer" style="--p:100"><b>${secondsFor()}</b></span>`:''}
        </header>
        <main class="quiz-card fotozoom-card">
          <div class="fotozoom-row"><h1>${esc(t('fotozoom.ask'))}</h1><span class="fotozoom-points" id="fzPoints">${esc(t('fotozoom.points',{n:POINTS[0]}))}</span></div>
          <div class="fotozoom-stage" id="fzStage"><img src="${K.answerArtFor(q)}" alt="" decoding="async" style="transform-origin:${r.fx}% ${r.fy}%;transform:scale(${ZOOMS[0]})"><span class="fotozoom-lens" aria-hidden="true">🔍</span></div>
          <div class="answers fotozoom-answers">${r.options.map((o,i)=>`<button class="answer ${answerSize(o.answer)}" data-i="${i}" aria-label="${esc(o.answer)}"><span class="answer-letter">${letters[i]}</span><span class="answer-copy">${esc(o.answer)}</span></button>`).join('')}</div>
          <div class="quiz-actions whoami-actions"><button class="action hint" id="fzOut">🔍 ${esc(t('fotozoom.out'))}</button><button class="action repeat" id="fzRepeat">${K.icon('repeat')} ${esc(t('quiz.repeat'))}</button></div>
        </main>
      </div>
    </section>`);
    const img=f.querySelector('#fzStage img'),points=f.querySelector('#fzPoints'),out=f.querySelector('#fzOut');
    const tiles=()=>[...f.querySelectorAll('.fotozoom-answers .answer')];
    const zoomTo=z=>{img.style.transform=`scale(${z})`};
    const speak=()=>{
      if(locked)return;
      const segs=[{kind:'question',text:t('fotozoom.ask')},...r.options.map((o,i)=>({kind:'option',index:i,text:K.core.answerText(o.answer)}))];
      if(timer)timer.paused=true;
      K.speakSequence(segs,{onSegment:seg=>{tiles().forEach(x=>x.classList.remove('spoken-active'));if(seg.kind==='option')tiles()[seg.index]?.classList.add('spoken-active')},onDone:()=>{tiles().forEach(x=>x.classList.remove('spoken-active'))}}).then(()=>{if(timer)timer.paused=false;startTimer()});
    };
    const seconds=secondsFor();
    const startTimer=()=>{
      if(!seconds||timer||locked)return;
      const el=f.querySelector('#fzTimer');if(!el)return;
      let left=seconds*1000,last=performance.now();
      el.classList.add('running');
      timer={paused:false,id:setInterval(()=>{
        const now=performance.now();if(!timer.paused)left-=now-last;last=now;
        if(!el.isConnected){stopTimer();return}
        const sec=Math.max(0,Math.ceil(left/1000));if(sec!==timer.sec){timer.sec=sec;K.timerTick?.(sec)}
        el.style.setProperty('--p',String(Math.max(0,left/(seconds*1000))*100));el.querySelector('b').textContent=sec;el.classList.toggle('urgent',left<=5000);
        if(left<=0){stopTimer();pick(null)}
      },100)};
    };
    speak();
    f.querySelector('#fzBack').onclick=()=>{K.stopSpeech();stopTimer();K.sfx('tap');K.showHome()};
    f.querySelector('#fzRepeat').onclick=()=>{K.sfx('tap');speak()};
    out.onclick=()=>{
      if(locked||level>=ZOOMS.length-1)return;
      K.sfx('hint');level++;zoomTo(ZOOMS[level]);
      points.textContent=t('fotozoom.points',{n:POINTS[level]});
      if(level>=ZOOMS.length-1)out.disabled=true;
    };
    const pick=b=>{
      if(locked)return;locked=true;K.stopSpeech();stopTimer();
      const choice=b?r.options[Number(b.dataset.i)]:null,ok=!!choice&&choice.id===q.id;
      const earned=ok?POINTS[level]:0;
      zoomTo(1);out.disabled=true;
      tiles().forEach(x=>{x.disabled=true;if(r.options[Number(x.dataset.i)].id===q.id)x.classList.add('correct')});
      if(ok){K.sfx('good');g.score+=earned;g.correct++;K.recordAnswerProgress?.(q,true)}else{K.sfx('bad');b?.classList.add('wrong');K.recordAnswerProgress?.(q,false)}
      // The whole picture first (the zoom-out is the reveal), then the verdict card.
      setTimeout(()=>{
        if(!f.isConnected)return;
        const card=document.createElement('div');card.className='simple-modal whoami-verdict fotozoom-verdict';
        card.innerHTML=`<div class="simple-modal-card"><img class="fotozoom-reveal" src="${K.answerArtFor(q)}" alt="">${ok?'':`<div class="simple-icon">${b?'💡':'⏰'}</div>`}<h2>${esc(ok?t('fotozoom.yes',{answer:q.answer,points:earned}):t(b?'fotozoom.almost':'fotozoom.timeUp',{answer:q.answer}))}</h2><p>${esc(q.explanation)}</p><button class="simple-ok" id="fzNext">${esc(t(g.index+1>=g.rounds.length?'feedback.seeResult':'fotozoom.next'))}</button></div>`;
        f.appendChild(card);
        if(ok)K.cheer?.(card);
        // The verdict reuses the answer's recording and the quiz's explanation recording.
        K.speakSequence([...K.core.answerSegments(t(ok?'fotozoom.speech.yes':'fotozoom.speech.almost'),q.answer),{kind:'speech',text:q.explanation}]);
        card.querySelector('#fzNext').onclick=()=>{K.stopSpeech();K.sfx('tap');g.index++;if(g.index>=g.rounds.length)finish();else showRound()};
      },ok?650:900);
    };
    tiles().forEach(b=>b.onclick=()=>pick(b));
  }

  function finish(){
    const g=K.fotozoom;if(!g||g.done)return;g.done=true;K.stopSpeech();stopTimer();
    const max=g.rounds.length*POINTS[0];
    const stars=g.score>=max*.8?3:g.score>=max*.5?2:g.correct>0?1:0;
    // Each right guess already paid XP and coins like a quiz answer
    // (K.recordAnswerProgress); the stars add a small bonus on top.
    const xp=stars*6,coins=stars*4;
    const G=K.progress().games||={};const w=G.fotozoom||={played:0,best:0};
    w.played++;if(g.score>w.best)w.best=g.score;
    K.awardPoints(xp);K.awardCoins(coins);
    K.touchStreak();K.save();
    const bg=g.world==='mix'?'aarde':g.world;
    const f=K.frame(`<section class="result-v2 fade-in is-pass">
      <img class="result-v2-bg" src="${K.GAME_ART.fotozoom}" alt="">
      <div class="result-v2-dim"></div>
      <div class="result-v2-card">
        <div class="result-stage"><button class="result-gift" id="resultGift" aria-label="🎁">🎁</button><div class="result-mascot"><img class="mascot-face large" src="${K.guideArt(K.state.voice)}" alt=""></div></div>
        <div class="result-kicker">${esc(t('fotozoom.doneKicker'))}</div>
        <h1>${esc(t('fotozoom.doneTitle',{n:g.correct,total:g.rounds.length}))}</h1>
        <div class="result-stars">${[1,2,3].map(n=>`<i class="${n<=stars?'on':''}">★</i>`).join('')}</div>
        <p class="result-rule">${esc(t('fotozoom.summary',{score:g.score,max}))}</p>
        <div class="result-stats"><span><b>${g.score}</b><small>⭐</small></span><span><b>+${xp}</b><small>${esc(t('result.xp'))}</small></span><span><b>${Number(K.state.coins||0)}</b><small>${esc(t('result.coins'))}</small></span></div>
        <div class="result-native">
          <button id="againBtn">${esc(t('memo.again'))}</button>
          <button id="homeBtn" class="secondary">${esc(t('world.backHome'))}</button>
          <button id="shareBtn" class="secondary">${esc(t('result.share'))}</button>
        </div>
      </div>
    </section>`);
    const stage=f.querySelector('.result-stage'),gift=f.querySelector('#resultGift');
    let opened=false;const open=()=>{if(opened)return;opened=true;stage.classList.add('open');K.sfx('gift');setTimeout(()=>K.sfx('reward'),350);K.celebrate?.('quiz',gift)};
    gift.onclick=open;setTimeout(open,1000);
    K.speak(t(stars>=2?'fotozoom.speech.great':'fotozoom.speech.done'));
    f.querySelector('#againBtn').onclick=()=>{K.sfx('tap');K.startFotozoom(g.world)};
    f.querySelector('#homeBtn').onclick=()=>{K.stopSpeech();K.sfx('tap');K.showHome()};
    f.querySelector('#shareBtn').onclick=()=>{K.sfx('tap');K.shareScore()};
  }
})();
