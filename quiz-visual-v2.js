(()=>{
  const K=window.KWIZILLO_M1;
  if(!K) return;
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const t=(k,p)=>K.t(k,p);

  // Subject art first, then the topic illustration. The world background is only
  // a last resort and, with all 24 topics covered, is never reached in practice.
  // Every question has its own illustration (question-art.js). The subject and
  // topic pictures remain as fallbacks for a question added without one.
  function questionArt(q){return K.questionArtFor?.(q.id)||K.QUESTION_ART[K.core.questionArtKind(q)]||K.TOPIC_ART[q.topic]||K.MASTER[q.world]||K.MASTER.ruimte}
  // Warm the browser cache for the next question so its picture appears with
  // the card instead of a beat later.
  K.questionArt=questionArt;
  // What the child sees while the question is open: the question's own picture,
  // unless that would show the answer (answer-art.js decides: Mars for "the
  // red planet", a mako for "which shark is fast") — then the topic's picture,
  // and the question's own one is the reward on the feedback card.
  function quizArt(q){return K.artRevealsAnswer?.(q)?(K.safeQuestionArt?.(q)||K.TOPIC_ART[q.topic]||K.MASTER[q.world]||K.MASTER.ruimte):questionArt(q)}
  K.quizArt=quizArt;
  function preloadNextArt(){for(const n of (K.quiz?.questions||[]).slice(K.quiz.index,K.quiz.index+3)){for(const src of [quizArt(n),questionArt(n)]){const i=new Image();i.src=src}}}
  function answerSize(text){const n=String(text||'').length;return n>52?'xlong':n>34?'long':''}
  function clearSpoken(){K.app.querySelectorAll('.answer.spoken-active').forEach(b=>b.classList.remove('spoken-active'));K.clearSpeechHighlight=null}

  K.startQuiz=(world,topicIndex=null)=>{
    K.stopSpeech();
    K.currentWorld=world;
    const key=topicIndex===null?null:(K.TOPIC_KEYS[world]||[])[topicIndex];
    const salt=Math.floor(Math.random()*1e6);   // varies the spoken praise per quiz
    const label=key?t(`topic.${key}`):t('quiz.mixed');
    const run=K.runFor(world,key);
    // Premium gate — here, not in the tiles: the UI is never the only lock.
    if(!K.premium.can('quiz',world,key,Number(run.quizNumber||0)+1)){K.premiumLocked({kind:'quiz',world,topicIndex,retry:()=>K.startQuiz(world,topicIndex)});return}
    const batch=K.core.selectQuizBatch({
      questions:K.questions,world,topicKey:key,
      grade:Number(K.state.group||5),limit:10,usedIds:run.usedIds,
      band:K.core.difficultyBand({niveau:K.playLevel(world)})
    });
    if(!batch.questions.length){K.toast(t('quiz.none'));K.showWorld(world);return}
    run.usedIds=batch.usedIds;
    run.quizNumber=Number(run.quizNumber||0)+1;
    K.save();
    K.quiz=K.core.createSession({world,topicKey:key,topicLabel:label,questions:batch.questions,quizNumber:run.quizNumber});
    K.startScoreRun();   // this quiz counts as one exercise in the record book
    K.quiz.salt=salt;
    K.quiz.hintsUsed=0;
    K.showQuiz();
    // The result's "did you know" is picked and its voice warmed while the quiz runs.
    setTimeout(()=>K.warmFacts?.(world,null,1),4000);
  };

  // The Mega Quiz (Home, Premium): ten questions from every world, dealt so
  // that the worlds take turns (quiz-core-v2.js, selectMegaBatch). It runs on
  // the quiz screen of a world quiz; every answer counts for the world of its
  // question. It plays at one level for the whole quiz: the average of the
  // worlds' own levels.
  K.MEGA_SIZE=80;
  // A Mega Quiz is as long as eight world quizzes: hints and mistakes allowed grow with it.
  const megaScale=()=>K.quiz?.mega?Math.max(1,K.quiz.questions.length/10):1;
  // The level the Mega Quiz plays at (and its Home tile shows): the average of the worlds' own levels.
  K.megaLevel=()=>{const ws=K.playableWorlds();return Math.round(ws.reduce((n,w)=>n+K.playLevel(w),0)/Math.max(1,ws.length))||1};
  K.startMega=()=>{
    K.stopSpeech();
    if(!K.premium.can('mega')){K.premiumLocked({kind:'mega',retry:()=>K.startMega()});return}
    const worlds=K.playableWorlds();
    const run=K.runFor('mega',null);
    const batch=K.core.selectMegaBatch({
      questions:K.questions,worlds,grade:Number(K.state.group||5),limit:K.MEGA_SIZE,usedIds:run.usedIds,
      bandFor:w=>K.core.difficultyBand({niveau:K.playLevel(w)})
    });
    if(!batch.questions.length){K.toast(t('quiz.none'));K.showHome();return}
    run.usedIds=batch.usedIds;
    run.quizNumber=Number(run.quizNumber||0)+1;
    K.save();
    K.quiz=K.core.createSession({world:'mega',topicKey:null,topicLabel:t('mega.title'),questions:batch.questions,quizNumber:run.quizNumber});
    K.quiz.mega=true;
    K.quiz.level=K.megaLevel();
    K.startScoreRun();
    K.quiz.salt=Math.floor(Math.random()*1e6);
    K.quiz.hintsUsed=0;
    K.audio.setTrack('play').catch(()=>{});
    K.showQuiz();
    setTimeout(()=>K.warmFacts?.('all',null,1),4000);
  };

  K.showQuiz=()=>{
    if(!K.quiz)return K.showWorld(K.currentWorld);
    const q=K.quiz.questions[K.quiz.index];
    if(!q)return K.showResult();
    render(q);
  };

  // Live mode: the child still has to answer (timer runs, Hint / Again).
  // Review mode: the question was answered (or timed out); the tiles show the
  // verdict and the row offers Back / Explanation / Next. Closing the feedback
  // card or stepping back through the quiz lands here.
  let timer=null;
  function stopTimer(){if(timer){clearInterval(timer.id);timer=null}}
  // The level of the world being played, not a setting: every world climbs on
  // its own (state.js, K.worldLevel).
  // Het niveau waarop gespeeld wordt: het verdiende niveau van de wereld, of
  // hoger als dat in de ouderzone is gekozen (state.js, K.playLevel). Hieraan
  // hangen de seconden per vraag, het aantal fouten dat mag en de hints.
  const level=()=>K.quiz?.mega?K.quiz.level:K.playLevel(K.quiz?.world||K.currentWorld);
  function questionSecondsFor(){return K.state.timeLimitOn===false?0:K.core.questionSeconds(level())}

  function render(q){
    K.stopSpeech();stopTimer();
    const idx=K.quiz.index,total=K.quiz.questions.length;
    const answered=K.quiz.answeredById?.[q.id]||null;
    const retry=!!(answered&&K.quiz.retrying?.[q.id]);   // "Nog eens": clean tiles, answer again
    const pct=Math.round(((idx+1)/Math.max(1,total))*100);
    const seconds=answered?0:questionSecondsFor();
    // The row is always Back / Hint / Again. On an answered question the
    // tiles reopen the explanation card (which carries "next").
    // Hints are budgeted per level (free on 1-2, none on 6); the tile shows
    // what is left and greys out when the budget is spent.
    const hintsLeft=hintsLeftNow();
    const hintLabel=Number.isFinite(hintsLeft)?`${esc(t('quiz.hint'))} <i class="hint-count">${hintsLeft}</i>`:esc(t('quiz.hint'));
    const actions=`<button class="action back" id="prevBtn" ${idx===0?'disabled':''}>${K.icon('back')} ${esc(t('quiz.back'))}</button><button class="action hint ${hintsLeft<=0?'spent':''}" id="hintBtn">${K.icon('bulb')} ${hintLabel}</button><button class="action repeat" id="repeatBtn" aria-label="${esc(t('quiz.repeatAria'))}">${K.icon('repeat')} ${esc(t('quiz.repeat'))}</button>`;
    const f=K.frame(`<section class="quiz-v2 quiz-world-${q.world} fade-in ${answered?'is-review':''}">
      <img class="quiz-v2-bg" src="${K.MASTER[q.world]}" alt="">
      <div class="quiz-v2-dim"></div>
      <div class="quiz-v2-ui">
        <header class="quiz-v2-head">
          <button class="quiz-back" id="qBack" aria-label="${esc(t('common.back'))}">${K.icon('back')}</button>
          <div class="quiz-brand"><span>Kwizillo</span><small>${esc(K.quiz.topicLabel)} · ${esc(t('quiz.quizLabel',{n:K.quiz.quizNumber}))}</small></div>
          <div class="quiz-meta"><button class="meta-chip" data-stats>${K.icon('coin')} ${Number(K.state.coins||0)}</button><button class="meta-chip" data-stats>${K.icon('flame')} ${Number(K.state.streak||0)}</button></div>
        </header>
        <div class="quiz-progress"><strong>${esc(t('quiz.progress',{current:idx+1,total}))}</strong><div><i style="width:${pct}%"></i></div>${seconds?`<span class="quiz-timer" id="quizTimer" style="--p:100"><b>${seconds}</b></span>`:`<span>${K.state.voice==='Stil'?'🔇':`🔊 ${esc(t(K.state.voice==='Milo'?'voice.milo':'voice.luna'))}`}</span>`}</div>
        <main class="quiz-card">
          <h1>${esc(q.prompt)}</h1>
          <div class="quiz-art"><img class="art-main" src="${quizArt(q)}" alt="${esc(t('quiz.artAlt'))}"></div>
          <div class="answers">${q.options.map((o,i)=>`<button class="answer ${answerSize(o)} ${answered&&!retry?(o===q.answer?'correct':answered.value===o?'wrong':''):''}" data-a="${encodeURIComponent(o)}" data-index="${i}"><span class="answer-letter">${K.core.answerLetters(K.state.language)[i]}</span><span class="answer-copy">${esc(o)}</span></button>`).join('')}</div>
          ${answered?`<button class="review-next" id="nextBtn">${esc(t(idx+1>=total?'feedback.seeResult':'feedback.next'))} ›</button>`:''}
          <div class="quiz-actions ${K.state.voice==='Stil'?'no-voice':''}">${actions}</div>
        </main>
      </div>
    </section>`);

    const buttons=[...f.querySelectorAll('.answer')];
    preloadNextArt();
    K.clearSpeechHighlight=()=>buttons.forEach(b=>b.classList.remove('spoken-active'));
    f.querySelector('#qBack').onclick=()=>{K.stopSpeech();stopTimer();K.sfx('tap');K.quiz.mega?K.showHome():K.showWorld(K.quiz.world)};
    // Coins/streak open the statistics; "back" there lands on this same question.
    f.querySelectorAll('[data-stats]').forEach(b=>b.onclick=()=>{K.stopSpeech();stopTimer();K.sfx('tap');K.showStats({back:()=>K.showQuiz()})});
    f.querySelector('#prevBtn').onclick=()=>{if(idx===0)return;K.stopSpeech();stopTimer();K.sfx('swoosh');K.quiz.index--;K.showQuiz()};

    f.querySelector('#hintBtn').onclick=()=>showHint(q);
    if(answered&&!retry){
      const reopen=()=>{K.sfx('tap');feedback(q,answered.correct,{timedOut:answered.timedOut,silent:true})};
      buttons.forEach(b=>b.onclick=reopen);
      f.querySelector('#nextBtn').onclick=()=>{K.stopSpeech();K.sfx('tap');next()};
    }else if(retry){
      // A retry after "Nog eens": the tiles are live again; the answer that
      // counted stays on record, this one only shows right or wrong.
      buttons.forEach(b=>b.onclick=()=>{K.stopSpeech();K.sfx('tap');const ok=decodeURIComponent(b.dataset.a)===q.answer;buttons.forEach(x=>x.disabled=true);K.sfx(ok?'good':'bad');b.classList.add(ok?'correct':'wrong');if(!ok)buttons.find(x=>decodeURIComponent(x.dataset.a)===q.answer)?.classList.add('correct');delete K.quiz.retrying[q.id];setTimeout(()=>feedback(q,ok,{timedOut:false}),120)});
      f.querySelector('#nextBtn').onclick=()=>{K.stopSpeech();K.sfx('tap');delete K.quiz.retrying[q.id];next()};
    }else{
      buttons.forEach(b=>b.onclick=()=>{K.stopSpeech();evaluate(q,decodeURIComponent(b.dataset.a),b)});
    }

    // The timer only starts once the question has been read out (at once
    // without a voice), pauses while the hint card is open or the question is
    // read again, and stops on an answer. At zero the question counts as wrong.
    const startTimer=()=>{
      if(!seconds||timer||answered||K.quiz.answeredById?.[q.id])return;
      const el=f.querySelector('#quizTimer');if(!el)return;
      let left=seconds*1000,last=performance.now();
      el.classList.add('running');
      timer={paused:false,id:setInterval(()=>{
        const now=performance.now();
        if(!timer.paused) left-=now-last; last=now;
        if(!el.isConnected){stopTimer();return}
        const sec=Math.max(0,Math.ceil(left/1000));
        if(sec!==timer.sec){timer.sec=sec;K.timerTick?.(sec)}
        el.style.setProperty('--p',String(Math.max(0,left/(seconds*1000))*100));
        el.querySelector('b').textContent=sec;
        el.classList.toggle('urgent',left<=5000);
        if(left<=0){stopTimer();evaluate(q,null,null)}
      },100)};
    };

    const readQuestion=async()=>{
      if(answered){K.speak(q.prompt);return}   // review: only on "Nog eens"
      K.pauseTimer(true);
      // Everything this question can still say is queued right behind it:
      // both feedback lines, the hint, then the next question and its lines,
      // so every voice starts the moment its card appears.
      const nextQ=K.quiz.questions[K.quiz.index+1];
      // The question and the four answers are read on every level (see LEVELS).
      const speech={answers:K.core.readsAnswers(level()),lang:K.state.language};
      const lines=segs=>segs.map(s=>s.text);
      const warm=[...lines(feedbackSpeech(q,true)),...lines(feedbackSpeech(q,false)),q.hint||t('hint.fallback')];
      if(nextQ&&!K.quiz.answeredById?.[nextQ.id]) warm.push(...K.core.buildQuestionSpeechSegments(nextQ,speech).map(s=>s.text),...lines(feedbackSpeech(nextQ,true)),...lines(feedbackSpeech(nextQ,false)));
      await K.speakSequence(K.core.buildQuestionSpeechSegments(q,speech),{
        onSegment:segment=>{K.clearSpeechHighlight?.();if(segment.index!==undefined)buttons[segment.index]?.classList.add('spoken-active')},
        onDone:()=>K.clearSpeechHighlight?.(),
        prefetch:warm
      });
      K.pauseTimer(false);
      startTimer();
    };
    f.querySelector('#repeatBtn').onclick=()=>{K.sfx('tap');if(answered&&!retry){(K.quiz.retrying||={})[q.id]=true;K.showQuiz();return}readQuestion()};
    if(!answered||retry) readQuestion();   // an answered question is shown, not read, until asked
  }
  K.pauseTimer=on=>{if(timer)timer.paused=!!on};

  function hintsLeftNow(){return K.core.hintsAllowed(level())*megaScale()-Number(K.quiz?.hintsUsed||0)}
  function showHint(q){
    // Reopening the hint of the same question is free.
    const again=!!K.quiz.hintedIds?.[q.id];
    if(!again&&hintsLeftNow()<=0){K.sfx('bad');K.toast(t(K.core.hintsAllowed(level())?'quiz.hintsSpent':'quiz.noHints'));return}
    if(!again){(K.quiz.hintedIds||={})[q.id]=true;K.quiz.hintsUsed=Number(K.quiz.hintsUsed||0)+1;const c=K.app.querySelector('#hintBtn .hint-count');if(c)c.textContent=hintsLeftNow();if(hintsLeftNow()<=0)K.app.querySelector('#hintBtn')?.classList.add('spent')}
    K.stopSpeech();K.sfx('hint');
    const f=K.app.querySelector('.game-frame');if(!f)return;
    const x=document.createElement('div');x.className=`hint-float hint-v2 world-${q.world}`;
    const hint=q.hint||t('hint.fallback');
    x.innerHTML=`<div class="hint-card"><button class="hint-close" aria-label="${esc(t('hint.close'))}">×</button><div class="hint-kicker">${K.icon('bulb')} ${esc(t('hint.kicker',{topic:K.quiz.topicLabel}))}</div><div class="hint-visual"><img src="${quizArt(q)}" alt="${esc(t('hint.alt'))}"></div><h2>${esc(t('hint.title'))}</h2><p>${esc(hint)}</p><button class="hint-ok">${esc(t('hint.ok'))}</button></div>`;
    f.appendChild(x);
    K.pauseTimer(true);
    const close=()=>{K.stopSpeech();x.remove();K.pauseTimer(false)};
    x.querySelector('.hint-close').onclick=close;
    x.querySelector('.hint-ok').onclick=()=>{K.sfx('tap');close()};
    x.addEventListener('pointerdown',e=>{if(e.target===x)close()});
    K.speak(hint);
  }

  function evaluate(q,value,button){
    const r=K.core.recordAnswer(K.quiz,q,value);
    if(!r.accepted)return;
    stopTimer();
    const buttons=[...K.app.querySelectorAll('.answer')];
    buttons.forEach(b=>b.disabled=true);
    const award=K.recordAnswerProgress(q,r.correct);
    K.quiz.points=Number(K.quiz.points||0)+award.points;
    K.quiz.lastAward=award;
    if(r.correct){K.sfx('good');button?.classList.add('correct')}
    else{K.sfx('bad');button?.classList.add('wrong');buttons.find(b=>decodeURIComponent(b.dataset.a)===q.answer)?.classList.add('correct')}
    setTimeout(()=>feedback(q,r.correct,{timedOut:r.timedOut}),120);
  }

  // The praise varies from question to question. The pick is fixed per
  // question and quiz (a hash, not Math.random) so the line prefetched while
  // the child is thinking is the line that gets spoken.
  // Praise varies per quiz (eight short lines, recorded once per language). The
  // "almost, it is {answer}" line names the answer, so every variant is a new
  // recording per question: it is fixed per question instead of per quiz.
  function variant(q,kind,count,salted=true){
    let h=salted?(K.quiz?.salt||0):0;for(const ch of q.id)h=(h*31+ch.charCodeAt(0))>>>0;
    // The answer is left as {answer}: buildFeedbackSegments says it with its own recording.
    return t(`feedback.speech.${kind}.${(h%count)+1}`);
  }
  function feedbackSpeech(q,correct){
    return K.core.buildFeedbackSegments(q,correct,{
      good:variant(q,'good',8),
      tryAgain:variant(q,'try',4,false),
      fact:t('feedback.speech.fact')
    });
  }

  // The answer card: verdict + the right answer on top, then the explanation
  // and the fact, then Next. No mascot on the card — on a correct answer the
  // guide pops in from the corner for a moment and throws confetti. Next is
  // live once the voice is done; while the explanation is still being read,
  // two quick taps move on anyway.
  // What the last answer paid: the points it was worth, "practice" when the
  // question had been answered right before, and the day's ceiling when the
  // wallet has stopped for today.
  function rewardBadge(){
    const a=K.quiz?.lastAward||{points:0};
    if(a.capped&&!a.points)return `<span class="feedback-reward is-cap">${K.icon('star')} ${esc(t('score.dayFull'))}</span>`;
    return `<span class="feedback-reward${a.repeat?' is-repeat':''}">${K.icon('star')} +${a.points} ${esc(t('score.points'))}${a.repeat?` · ${esc(t('score.practice'))}`:''}</span>`;
  }

  function feedback(q,correct,{timedOut=false,silent=false}={}){
    K.stopSpeech();
    const f=K.app.querySelector('.game-frame');if(!f)return;
    f.querySelector('.feedback-float')?.remove();
    const x=document.createElement('div');x.className=`feedback-float feedback-v2 ${correct?'is-good':'is-try'} ${timedOut?'is-time':''} world-${q.world}`;
    const explain=esc(q.explanation||(correct?t('feedback.thatsRight'):q.hint||''));
    const last=K.quiz.index+1>=K.quiz.questions.length;
    x.innerHTML=`<div class="feedback-card ${correct?'good':'try'}" role="dialog" aria-live="polite">
      <button class="feedback-close" id="feedbackClose" aria-label="${esc(t('feedback.close'))}">×</button>
      <div class="feedback-verdict">
        <span class="feedback-kicker">${timedOut?'⏱':correct?'✓':'✗'} ${esc(t(timedOut?'feedback.timeKicker':correct?'feedback.goodKicker':'feedback.tryKicker'))}</span>
        ${correct?rewardBadge():''}
      </div>
      ${K.artRevealsAnswer?.(q)&&K.questionArtFor?.(q.id)?`<div class="feedback-art"><img src="${questionArt(q)}" alt="" decoding="async"></div>`:''}
      <div class="feedback-answer">${correct?'':`<small>${esc(t('feedback.answerLabel'))}</small>`}<b>${esc(q.answer)}</b></div>
      <p class="feedback-explain">${explain}</p>
      ${q.fact?`<div class="feedback-fact"><b>${esc(t('feedback.didYouKnow'))}</b><span>${esc(q.fact)}</span></div>`:''}
      <button class="feedback-next" id="feedbackNext" disabled><i class="feedback-bar"></i><span class="feedback-next-label">${esc(t(last?'feedback.seeResult':'feedback.next'))} <span>›</span></span></button>
    </div>`;
    f.appendChild(x);
    if(correct&&!silent){
      // The guide rises from behind the top edge of the card to the waist, cheers and ducks away again (celebrate.js).
      K.riseGuide?.(x,x.querySelector('.feedback-card'));
      setTimeout(()=>K.celebrate?.('answer',x),140);
    }
    const nextBtn=x.querySelector('#feedbackNext');
    // A bar runs through the button for exactly as long as the clip plays;
    // when it reaches the right edge the button turns gold and unlocks. The
    // close button skips the voice; without a voice the button is live at once.
    // The bar follows the voice's own clock frame by frame (a CSS transition
    // could snap when a prefetched line starts instantly), and fills up only
    // when the explanation has really been heard to the end.
    let armed=false,raf=0;
    const bar=nextBtn.querySelector('.feedback-bar');
    const arm=()=>{if(armed)return;armed=true;cancelAnimationFrame(raf);x.classList.add('spoken');bar.style.width='100%'};
    let follow=()=>{if(armed||!x.isConnected)return;const p=K.voiceProgress?.();if(p!==null&&p!==undefined)bar.style.width=(p*100).toFixed(1)+'%';raf=requestAnimationFrame(follow)};
    if(silent||K.state.voice==='Stil'||!K.speechAvailable?.()) arm();
    else{
      // Two lines (verdict, explanation): the bar runs over both as one,
      // each line taking its share by length.
      const segs=feedbackSpeech(q,correct),total=segs.reduce((n,s)=>n+s.text.length,0)||1;
      let from=0,share=1;
      follow=()=>{if(armed||!x.isConnected)return;const p=K.voiceProgress?.();if(p!==null&&p!==undefined)bar.style.width=((from+p*share)*100).toFixed(1)+'%';raf=requestAnimationFrame(follow)};
      raf=requestAnimationFrame(follow);
      K.speakSequence(segs,{onSegment:(s,i)=>{from=segs.slice(0,i).reduce((n,x)=>n+x.text.length,0)/total;share=s.text.length/total}}).then(arm,arm)
    }
    nextBtn.disabled=false;
    // The cross puts the question back on screen, answered, so the child can
    // look at it again; "Uitleg" reopens this card, "Volgende" moves on.
    x.querySelector('#feedbackClose').onclick=()=>{K.stopSpeech();K.sfx('tap');x.remove();render(q)};
    // A buddy that was just earned is introduced between the explanation and
    // the next question, so the child sees who it is while it happens.
    const go=()=>{K.stopSpeech();K.sfx('tap');x.remove();if(K.showMascotUnlock?.(()=>next()))return;next()};
    // One tap moves on, also while the explanation is still being read: the bar
    // only shows how far the voice is, it is not a lock.
    nextBtn.onclick=go;
  }

  function next(){clearSpoken();stopTimer();K.quiz.index++;K.showQuiz()}

  // A world finished at all six levels: its golden card flies in, turns once
  // and stays. Tapping anywhere puts it away; the card is already in the
  // collection by then.
  function goldUnlock(frame,world){
    const el=document.createElement('div');
    el.className='gold-unlock';
    el.innerHTML=`<div class="gold-unlock-card">
      <span class="gold-rays" aria-hidden="true"></span>
      <span class="gold-unlock-frame"><img class="gold-unlock-art" src="${K.goldArt(world)}" data-fallback="${K.goldFallback(world)}" alt="">${K.goldBand?.(world)||''}</span>
      <b>${esc(t('result.worldMastered',{world:t(`world.${world}.title`)}))}</b>
      <span class="gold-unlock-sub">${esc(t('result.goldCardEarned',{world:t(`world.${world}.title`)}))}</span>
      <button class="gold-unlock-ok">${esc(t('common.gotIt'))}</button>
    </div>`;
    frame.appendChild(el);
    K.wireFallbacks?.(el);
    K.sfx('reward');
    setTimeout(()=>K.sfx('gift'),420);
    K.celebrate?.('gold',el);
    K.speak?.(t('result.goldCardSpeech',{world:t(`world.${world}.title`)}));
    const close=()=>{el.remove()};
    el.onclick=close;
    el.querySelector('.gold-unlock-ok').onclick=e=>{e.stopPropagation();K.sfx('tap');close()};
  }

  K.showResult=()=>{
    K.stopSpeech();
    const q=K.quiz;
    const total=q?.questions.length||0,score=q?.score||0,xp=Number(q?.points||0);
    const niveau=level();
    const mega=!!q?.mega;
    const allowed=K.core.maxWrong(niveau)*megaScale(),wrong=total-score;
    const passed=wrong<=allowed;
    const keys=K.TOPIC_KEYS[K.currentWorld]||[];
    const topicIdx=q?.topicKey?keys.indexOf(q.topicKey):-1;
    const isTopic=topicIdx>=0;
    let unlocked=null,mastered=false;
    if(q&&!q._counted){
      q._counted=true;
      K.state.quizzesPlayed=Number(K.state.quizzesPlayed||0)+1;
      const ws=K.progress().worlds[q.world];
      if(ws) ws.quizzes=Number(ws.quizzes||0)+1;
      // bestScores is per world and out of 10; the Mega Quiz keeps its own best.
      if(mega){const run=K.runFor('mega',null);run.played=Number(run.played||0)+1;run.best=Math.max(Number(run.best||0),q.score||0);run.total=total}
      else{K.state.bestScores||={};if((q.score||0)>Number(K.state.bestScores[q.world]||0)) K.state.bestScores[q.world]=q.score||0}
      // A passed topic is ticked off for this level. Once all four topics of
      // this world are ticked, the world itself moves up a level — every world
      // climbs on its own, at the pace of the child playing it.
      if(passed&&isTopic){
        const P=K.progress().passed||={};
        (P[niveau]||={})[`${q.world}:${q.topicKey}`]=true;
        const now=K.worldLevel(q.world);
        if(now>niveau) unlocked=now;
        // All four topics passed at all six levels: the world is finished for
        // good and its golden card is earned — not bought.
        if(K.worldMastered?.(q.world)&&!K.owned(`gold:${q.world}`)){K.own(`gold:${q.world}`);mastered=true;}
      }
      K.touchStreak();
      K.save();
    }
    const pct=total?Math.round(score/total*100):0;
    // A "did you know" from this world, read by the guide once the gift has opened.
    const factWorld=mega?'all':K.currentWorld;
    const bonus=K.bonusFact?.(factWorld)||null;
    if(bonus) K.prefetchSpeech(bonus.speech);
    const nextNumber=(K.runFor(mega?'mega':K.currentWorld,q?.topicKey||null).quizNumber||0)+1;
    const nextIdx=isTopic&&topicIdx<keys.length-1?topicIdx+1:null;
    // Passed: move on (next topic, or the mixed quiz after the last one).
    // Failed: the same topic again is the only way forward.
    const primaryLabel=mega?t('mega.again')
      :!passed?t('result.retryNow')
      :!isTopic?t('result.againNumbered',{n:nextNumber})
      :nextIdx!==null?t('result.nextTopic',{topic:t(`topic.${keys[nextIdx]}`)})
      :t('result.finishWorld');
    const f=K.frame(`<section class="result-v2 fade-in ${passed?'is-pass':'is-fail'}">
      <img class="result-v2-bg" src="${mega?K.GAME_ART.memoAll:K.MASTER[K.currentWorld]||K.MASTER.ruimte}" alt="">
      <div class="result-v2-dim"></div>
      <div class="result-v2-card">
        <div class="result-stage ${passed?'':'open'}">
          ${passed?`<button class="result-gift" id="resultGift" aria-label="🎁">🎁</button>`:''}
          <div class="result-mascot"><img class="mascot-face large" src="${K.guideArt(K.state.voice)}" alt=""></div>
        </div>
        <div class="result-kicker">${esc(t(passed?'result.passKicker':'result.failKicker'))}</div>
        <h1>${esc(t('result.title',{score,total}))}</h1>
        <div class="result-stars" aria-label="${pct>=90?3:pct>=70?2:1}/3">${[1,2,3].map(n=>`<i class="${passed&&n<=(pct>=90?3:pct>=70?2:1)?'on':''}">★</i>`).join('')}</div>
        <p class="result-rule">${esc(mega?t('mega.rule',{worlds:K.playableWorlds().length,score,total}):t(passed?'result.passRule':'result.failRule',{niveau,allowed,wrong}))}</p>
        ${unlocked?`<p class="result-unlock">${esc(t('result.worldLevelUp',{world:t(`world.${q.world}.title`),niveau:unlocked}))}</p>`:''}
        ${mastered?`<p class="result-unlock is-gold">${esc(t('result.worldMastered',{world:t(`world.${q.world}.title`)}))}</p>`:''}
        <div class="result-stats"><span><b>${pct}%</b><small>${esc(t('result.score'))}</small></span><span><b>+${xp}</b><small>${esc(t('result.xp'))}</small></span><span><b>${Number(K.state.coins||0)}</b><small>${esc(t('result.coins'))}</small></span></div>
        ${bonus?.html||''}
        <div class="result-native">
          <button id="againBtn">${esc(primaryLabel)}</button>
          ${passed&&isTopic?`<button id="retryBtn" class="secondary">${esc(t('result.retryTopic'))}</button>`:''}
          <button id="collectionBtn" class="secondary">${esc(t('result.toCollection'))}</button>
          <button id="shareBtn" class="secondary">${esc(t('result.share'))}</button>
        </div>
      </div>
    </section>`);
    if(passed){
      // The gift shakes, bursts into confetti and the guide pops out of it.
      // Tapping the gift opens it early.
      const stage=f.querySelector('.result-stage'), gift=f.querySelector('#resultGift');
      let opened=false;
      const open=()=>{
        if(opened)return;opened=true;
        stage.classList.add('open');
        K.sfx('gift');
        setTimeout(()=>K.sfx('reward'),350);
        K.celebrate?.('quiz',gift);
      };
      gift.onclick=open;
      setTimeout(open,1100);
      // The whole world finished: the golden card comes in on its own screen,
      // with a triumphant fanfare, before anything else is read out.
      if(mastered) setTimeout(()=>{if(f.isConnected)goldUnlock(f,q.world)},1500);
    }else{
      K.sfx('bad');
    }

    f.querySelector('#againBtn').onclick=()=>{
      K.stopSpeech();K.sfx('tap');
      if(mega) return K.startMega();
      if(!passed) return K.startQuiz(K.currentWorld,isTopic?topicIdx:null);
      K.startQuiz(K.currentWorld,isTopic?nextIdx:null);   // nextIdx null after the last topic = mixed quiz
    };
    f.querySelector('#shareBtn').onclick=()=>{K.sfx('tap');K.shareScore()};
    f.querySelector('#retryBtn')?.addEventListener('click',()=>{K.stopSpeech();K.sfx('tap');K.startQuiz(K.currentWorld,topicIdx)});
    f.querySelector('#collectionBtn').onclick=()=>{K.stopSpeech();K.sfx('tap');K.showCollection('worlds')};
    // The bonus fact opens the Weetjes screen on this world.
    f.querySelector('#resultFact')?.addEventListener('click',e=>{K.stopSpeech();K.sfx('tap');K.showFacts(factWorld,{open:e.currentTarget.dataset.fact})});
    if(bonus) setTimeout(()=>{if(f.isConnected)K.speakSequence(bonus.speech.map((text,i)=>({kind:i?'speech':'lead',text})))},passed?1900:900);
  };
})();
