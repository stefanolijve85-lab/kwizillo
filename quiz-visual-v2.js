(()=>{
  const K=window.KWIZILLO_M1;
  if(!K) return;
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const t=(k,p)=>K.t(k,p);
  const letters=['A','B','C','D'];

  // Subject art first, then the topic illustration. The world background is only
  // a last resort and, with all 24 topics covered, is never reached in practice.
  // Every question has its own illustration (question-art.js). The subject and
  // topic pictures remain as fallbacks for a question added without one.
  function questionArt(q){return K.questionArtFor?.(q.id)||K.QUESTION_ART[K.core.questionArtKind(q)]||K.TOPIC_ART[q.topic]||K.MASTER[q.world]||K.MASTER.ruimte}
  // Warm the browser cache for the next question so its picture appears with
  // the card instead of a beat later.
  K.questionArt=questionArt;
  function preloadNextArt(){for(const n of (K.quiz?.questions||[]).slice(K.quiz.index+1,K.quiz.index+3)){const i=new Image();i.src=questionArt(n)}}
  function answerSize(text){const n=String(text||'').length;return n>52?'xlong':n>34?'long':''}
  function clearSpoken(){K.app.querySelectorAll('.answer.spoken-active').forEach(b=>b.classList.remove('spoken-active'));K.clearSpeechHighlight=null}

  K.startQuiz=(world,topicIndex=null)=>{
    K.stopSpeech();
    K.currentWorld=world;
    const key=topicIndex===null?null:(K.TOPIC_KEYS[world]||[])[topicIndex];
    const salt=Math.floor(Math.random()*1e6);   // varies the spoken praise per quiz
    const label=key?t(`topic.${key}`):t('quiz.mixed');
    const run=K.runFor(world,key);
    const batch=K.core.selectQuizBatch({
      questions:K.questions,world,topicKey:key,
      grade:Number(K.state.group||5),limit:10,usedIds:run.usedIds,
      maxDifficulty:K.core.difficultyCap({niveau:K.state.niveau||1})
    });
    if(!batch.questions.length){K.toast(t('quiz.none'));K.showWorld(world);return}
    run.usedIds=batch.usedIds;
    run.quizNumber=Number(run.quizNumber||0)+1;
    K.save();
    K.quiz=K.core.createSession({world,topicKey:key,topicLabel:label,questions:batch.questions,quizNumber:run.quizNumber});
    K.quiz.salt=salt;
    K.showQuiz();
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
  function questionSecondsFor(){return K.state.timeLimitOn===false?0:K.core.questionSeconds(K.state.niveau||1)}

  function render(q){
    K.stopSpeech();stopTimer();
    const idx=K.quiz.index,total=K.quiz.questions.length;
    const answered=K.quiz.answeredById?.[q.id]||null;
    const pct=Math.round(((idx+1)/Math.max(1,total))*100);
    const seconds=answered?0:questionSecondsFor();
    // The row is always Back / Hint / Again. On an answered question the
    // tiles reopen the explanation card (which carries "next").
    const actions=`<button class="action back" id="prevBtn" ${idx===0?'disabled':''}>${K.icon('back')} ${esc(t('quiz.back'))}</button><button class="action hint" id="hintBtn">${K.icon('bulb')} ${esc(t('quiz.hint'))}</button><button class="action repeat" id="repeatBtn" aria-label="${esc(t('quiz.repeatAria'))}">${K.icon('repeat')} ${esc(t('quiz.repeat'))}</button>`;
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
          <div class="quiz-art"><img class="art-fill" src="${questionArt(q)}" alt="" aria-hidden="true"><img class="art-main" src="${questionArt(q)}" alt="${esc(t('quiz.artAlt'))}"></div>
          <div class="answers">${q.options.map((o,i)=>`<button class="answer ${answerSize(o)} ${answered?(o===q.answer?'correct':answered.value===o?'wrong':''):''}" data-a="${encodeURIComponent(o)}" data-index="${i}"><span class="answer-letter">${letters[i]}</span><span class="answer-copy">${esc(o)}</span></button>`).join('')}</div>
          ${answered?`<button class="review-next" id="nextBtn">${esc(t(idx+1>=total?'feedback.seeResult':'feedback.next'))} ›</button>`:''}
          <div class="quiz-actions ${K.state.voice==='Stil'?'no-voice':''}">${actions}</div>
        </main>
      </div>
    </section>`);

    const buttons=[...f.querySelectorAll('.answer')];
    preloadNextArt();
    K.clearSpeechHighlight=()=>buttons.forEach(b=>b.classList.remove('spoken-active'));
    f.querySelector('#qBack').onclick=()=>{K.stopSpeech();stopTimer();K.sfx('tap');K.showWorld(K.quiz.world)};
    // Coins/streak open the statistics; "back" there lands on this same question.
    f.querySelectorAll('[data-stats]').forEach(b=>b.onclick=()=>{K.stopSpeech();stopTimer();K.sfx('tap');K.showStats({back:()=>K.showQuiz()})});
    f.querySelector('#prevBtn').onclick=()=>{if(idx===0)return;K.stopSpeech();stopTimer();K.sfx('swoosh');K.quiz.index--;K.showQuiz()};

    f.querySelector('#hintBtn').onclick=()=>showHint(q);
    if(answered){
      const reopen=()=>{K.sfx('tap');feedback(q,answered.correct,{timedOut:answered.timedOut,silent:true})};
      buttons.forEach(b=>b.onclick=reopen);
      f.querySelector('#nextBtn').onclick=()=>{K.stopSpeech();K.sfx('tap');next()};
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
        el.style.setProperty('--p',String(Math.max(0,left/(seconds*1000))*100));
        el.querySelector('b').textContent=sec;
        el.classList.toggle('urgent',left<=5000);
        if(left<=0){stopTimer();evaluate(q,null,null)}
      },100)};
    };

    const readQuestion=async()=>{
      if(answered){K.speak(q.prompt);return}   // review: just hear it again
      K.pauseTimer(true);
      await K.speakSequence(K.core.buildQuestionSpeechSegments(q),{
        onSegment:segment=>{K.clearSpeechHighlight?.();if(segment.kind==='answer')buttons[segment.index]?.classList.add('spoken-active')},
        onDone:()=>K.clearSpeechHighlight?.(),
        // Both feedback lines are fetched once the question itself has loaded, so
        // the voice starts together with the feedback card.
        prefetch:[feedbackSpeech(q,true),feedbackSpeech(q,false)]
      });
      K.pauseTimer(false);
      startTimer();
    };
    f.querySelector('#repeatBtn').onclick=()=>{K.sfx('tap');readQuestion()};
    readQuestion();
  }
  K.pauseTimer=on=>{if(timer)timer.paused=!!on};

  function showHint(q){
    K.stopSpeech();K.sfx('hint');
    const f=K.app.querySelector('.game-frame');if(!f)return;
    const x=document.createElement('div');x.className=`hint-float hint-v2 world-${q.world}`;
    const hint=q.hint||t('hint.fallback');
    x.innerHTML=`<div class="hint-card"><button class="hint-close" aria-label="${esc(t('hint.close'))}">×</button><div class="hint-kicker">${K.icon('bulb')} ${esc(t('hint.kicker',{topic:K.quiz.topicLabel}))}</div><div class="hint-visual"><img src="${questionArt(q)}" alt="${esc(t('hint.alt'))}"></div><h2>${esc(t('hint.title'))}</h2><p>${esc(hint)}</p><button class="hint-ok">${esc(t('hint.ok'))}</button></div>`;
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
    K.recordAnswerProgress(q,r.correct);
    if(r.correct){K.sfx('good');button?.classList.add('correct')}
    else{K.sfx('bad');button?.classList.add('wrong');buttons.find(b=>decodeURIComponent(b.dataset.a)===q.answer)?.classList.add('correct')}
    setTimeout(()=>feedback(q,r.correct,{timedOut:r.timedOut}),120);
  }

  // The praise varies from question to question. The pick is fixed per
  // question and quiz (a hash, not Math.random) so the line prefetched while
  // the child is thinking is the line that gets spoken.
  function variant(q,kind,count){
    let h=K.quiz?.salt||0;for(const ch of q.id)h=(h*31+ch.charCodeAt(0))>>>0;
    return t(`feedback.speech.${kind}.${(h%count)+1}`,{answer:q.answer});
  }
  function feedbackSpeech(q,correct){
    return K.core.buildFeedbackSpeech(q,correct,{
      good:variant(q,'good',8),
      tryAgain:variant(q,'try',4),
      fact:t('feedback.speech.fact')
    });
  }

  function feedback(q,correct,{timedOut=false,silent=false}={}){
    K.stopSpeech();
    const f=K.app.querySelector('.game-frame');if(!f)return;
    f.querySelector('.feedback-float')?.remove();
    const x=document.createElement('div');x.className=`feedback-float feedback-v2 ${correct?'is-good':'is-try'} world-${q.world}`;
    const explain=esc(q.explanation||(correct?t('feedback.thatsRight'):q.hint||''));
    const last=K.quiz.index+1>=K.quiz.questions.length;
    x.innerHTML=`<div class="feedback-card ${correct?'good':'try'}" role="dialog" aria-live="polite">
      <button class="feedback-close" id="feedbackClose" aria-label="${esc(t('feedback.close'))}">×</button>
      <div class="feedback-head">
        <div class="feedback-guide"><img class="mascot-face" src="${K.guideArt(K.state.voice)}" alt=""></div>
        <div class="feedback-kicker">${esc(t(timedOut?'feedback.timeKicker':correct?'feedback.goodKicker':'feedback.tryKicker'))}</div>
        <h2>${esc(t(timedOut?'feedback.timeTitle':correct?'feedback.goodTitle':'feedback.tryTitle'))}</h2>
      </div>
      <div class="feedback-answer"><small>${esc(t('feedback.answerLabel'))}</small><b>${esc(q.answer)}</b></div>
      <p class="feedback-explain">${explain}</p>
      ${correct?`<div class="reward-strip"><span>${K.icon('star')} +${q.xp||10} XP</span><span>${K.icon('coin')} +2</span></div>`:''}
      ${q.fact?`<div class="fact-card"><b>${esc(t('feedback.didYouKnow'))}</b><span>${esc(q.fact)}</span></div>`:''}
      <button class="feedback-next" id="feedbackNext" disabled><em class="feedback-wait">${esc(t('feedback.listening'))}</em><span class="feedback-next-label">${esc(t(last?'feedback.seeResult':'feedback.next'))} <span>›</span></span></button>
    </div>`;
    f.appendChild(x);
    if(correct&&!silent) K.celebrate?.('answer',x);
    const nextBtn=x.querySelector('#feedbackNext');
    // "Next" waits for the voice: the child hears the explanation before moving
    // on. The close button skips the voice and unlocks at once; without a
    // voice the button is live immediately.
    let armed=false;
    const arm=()=>{if(armed)return;armed=true;nextBtn.disabled=false;x.classList.add('spoken')};
    if(silent||K.state.voice==='Stil'||!K.speechAvailable?.()) arm();
    else K.speak(feedbackSpeech(q,correct)).then(arm,arm);
    // The cross puts the question back on screen, answered, so the child can
    // look at it again; "Uitleg" reopens this card, "Volgende" moves on.
    x.querySelector('#feedbackClose').onclick=()=>{K.stopSpeech();K.sfx('tap');x.remove();render(q)};
    nextBtn.onclick=()=>{if(nextBtn.disabled)return;K.stopSpeech();K.sfx('tap');next()};
  }

  function next(){clearSpoken();stopTimer();K.quiz.index++;K.showQuiz()}

  K.showResult=()=>{
    K.stopSpeech();
    const q=K.quiz;
    const total=q?.questions.length||0,score=q?.score||0,xp=q?.xp||0;
    const niveau=Number(K.state.niveau||1);
    const passed=K.core.quizPassed({score,total,niveau});
    const keys=K.TOPIC_KEYS[K.currentWorld]||[];
    const topicIdx=q?.topicKey?keys.indexOf(q.topicKey):-1;
    const isTopic=topicIdx>=0;
    let unlocked=null;
    if(q&&!q._counted){
      q._counted=true;
      K.state.quizzesPlayed=Number(K.state.quizzesPlayed||0)+1;
      const ws=K.progress().worlds[q.world];
      if(ws) ws.quizzes=Number(ws.quizzes||0)+1;
      K.state.bestScores||={};
      if((q.score||0)>Number(K.state.bestScores[q.world]||0)) K.state.bestScores[q.world]=q.score||0;
      // A passed topic is ticked off for this level; once every topic of every
      // world is passed, the next level opens.
      if(passed&&isTopic){
        const P=K.progress().passed||={};
        (P[niveau]||={})[`${q.world}:${q.topicKey}`]=true;
        const all=Object.values(K.TOPIC_KEYS).reduce((n,k)=>n+k.length,0);
        if(Object.keys(P[niveau]).length>=all&&niveau<K.core.LEVELS.length){K.state.niveau=niveau+1;unlocked=niveau+1}
      }
      K.touchStreak();
      K.save();
    }
    const pct=total?Math.round(score/total*100):0;
    const nextNumber=(K.runFor(K.currentWorld,q?.topicKey||null).quizNumber||0)+1;
    const nextIdx=isTopic&&topicIdx<keys.length-1?topicIdx+1:null;
    // Passed: move on (next topic, or the mixed quiz after the last one).
    // Failed: the same topic again is the only way forward.
    const primaryLabel=!passed?t('result.retryNow')
      :!isTopic?t('result.againNumbered',{n:nextNumber})
      :nextIdx!==null?t('result.nextTopic',{topic:t(`topic.${keys[nextIdx]}`)})
      :t('result.finishWorld');
    const allowed=K.core.maxWrong(niveau),wrong=total-score;
    const f=K.frame(`<section class="result-v2 fade-in ${passed?'is-pass':'is-fail'}">
      <img class="result-v2-bg" src="${K.MASTER[K.currentWorld]||K.MASTER.ruimte}" alt="">
      <div class="result-v2-dim"></div>
      <div class="result-v2-card">
        <div class="result-stage ${passed?'':'open'}">
          ${passed?`<button class="result-gift" id="resultGift" aria-label="🎁">🎁</button>`:''}
          <div class="result-mascot"><img class="mascot-face large" src="${K.guideArt(K.state.voice)}" alt=""></div>
        </div>
        <div class="result-kicker">${esc(t(passed?'result.passKicker':'result.failKicker'))}</div>
        <h1>${esc(t('result.title',{score,total}))}</h1>
        <div class="result-stars" aria-label="${pct>=90?3:pct>=70?2:1}/3">${[1,2,3].map(n=>`<i class="${passed&&n<=(pct>=90?3:pct>=70?2:1)?'on':''}">★</i>`).join('')}</div>
        <p class="result-rule">${esc(t(passed?'result.passRule':'result.failRule',{niveau,allowed,wrong}))}</p>
        ${unlocked?`<p class="result-unlock">${esc(t('result.levelUnlocked',{niveau:unlocked}))}</p>`:''}
        <div class="result-stats"><span><b>${pct}%</b><small>${esc(t('result.score'))}</small></span><span><b>+${xp}</b><small>${esc(t('result.xp'))}</small></span><span><b>${Number(K.state.coins||0)}</b><small>${esc(t('result.coins'))}</small></span></div>
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
    }else{
      K.sfx('bad');
    }

    f.querySelector('#againBtn').onclick=()=>{
      K.stopSpeech();K.sfx('tap');
      if(!passed) return K.startQuiz(K.currentWorld,isTopic?topicIdx:null);
      K.startQuiz(K.currentWorld,isTopic?nextIdx:null);   // nextIdx null after the last topic = mixed quiz
    };
    f.querySelector('#shareBtn').onclick=()=>{K.sfx('tap');K.shareScore()};
    f.querySelector('#retryBtn')?.addEventListener('click',()=>{K.stopSpeech();K.sfx('tap');K.startQuiz(K.currentWorld,topicIdx)});
    f.querySelector('#collectionBtn').onclick=()=>{K.stopSpeech();K.sfx('tap');K.showCollection('worlds')};
  };
})();
