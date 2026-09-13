(()=>{
  const K=window.KWIZILLO_M1;
  if(!K) return;
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const t=(k,p)=>K.t(k,p);
  const letters=['A','B','C','D'];

  function artKind(q){
    const p=String(q.prompt||'').toLowerCase();
    if(/oplossen|suiker|meng|vloeistof|verdamp|dissolv|sugar|mix|liquid|evaporat/.test(p))return'dissolve';
    if(/schaduw|licht|spiegel|shadow|light|mirror/.test(p))return'light';
    if(/spier|lichaam|orgaan|hart|long|bloed|hersenen|skelet|muscle|organ|heart|lung|blood|brain|skeleton|skin|rib/.test(p))return'body';
    if(q.world==='ruimte'||/planeet|zon|maan|ster|astronaut|raket|satelliet|planet|sun|moon|star|rocket|satellite/.test(p))return'space';
    if(q.world==='wetenschap')return'lab';
    if(q.topic==='ridders_kastelen'||/ridder|kasteel|middeleeuw|knight|castle|medieval/.test(p))return'castle';
    return null;
  }
  function questionArt(q){return K.QUESTION_ART[artKind(q)]||K.MASTER[q.world]||K.MASTER.ruimte}
  // With only six subject illustrations, most questions still fall back to their
  // world art. Vary the crop per question so the card is not a straight copy of
  // the blurred background behind it. Proper per-question art is still needed.
  function artFraming(q){
    if(K.QUESTION_ART[artKind(q)]) return '';
    let h=0; for(const ch of String(q.id)) h=(h*31+ch.charCodeAt(0))|0;
    const x=20+Math.abs(h)%61, y=18+Math.abs(h>>5)%50;
    return `object-position:${x}% ${y}%;transform:scale(1.18)`;
  }
  function answerSize(text){const n=String(text||'').length;return n>52?'xlong':n>34?'long':''}
  function clearSpoken(){K.app.querySelectorAll('.answer.spoken-active').forEach(b=>b.classList.remove('spoken-active'));K.clearSpeechHighlight=null}

  K.startQuiz=(world,topicIndex=null)=>{
    K.stopSpeech();
    K.currentWorld=world;
    const key=topicIndex===null?null:(K.TOPIC_KEYS[world]||[])[topicIndex];
    const label=key?t(`topic.${key}`):t('quiz.mixed');
    const run=K.runFor(world,key);
    const batch=K.core.selectQuizBatch({
      questions:K.questions,world,topicKey:key,
      grade:Number(K.state.group||5),limit:10,usedIds:run.usedIds
    });
    if(!batch.questions.length){K.toast(t('quiz.none'));K.showWorld(world);return}
    run.usedIds=batch.usedIds;
    run.quizNumber=Number(run.quizNumber||0)+1;
    K.save();
    K.quiz=K.core.createSession({world,topicKey:key,topicLabel:label,questions:batch.questions,quizNumber:run.quizNumber});
    K.showQuiz();
  };

  K.showQuiz=()=>{
    if(!K.quiz)return K.showWorld(K.currentWorld);
    const q=K.quiz.questions[K.quiz.index];
    if(!q)return K.showResult();
    render(q);
  };

  function render(q){
    K.stopSpeech();
    const idx=K.quiz.index,total=K.quiz.questions.length;
    const pct=Math.round(((idx+1)/Math.max(1,total))*100);
    const f=K.frame(`<section class="quiz-v2 quiz-world-${q.world} fade-in">
      <img class="quiz-v2-bg" src="${K.MASTER[q.world]}" alt="">
      <div class="quiz-v2-dim"></div>
      <div class="quiz-v2-ui">
        <header class="quiz-v2-head">
          <button class="quiz-back" id="qBack" aria-label="${esc(t('common.back'))}">‹</button>
          <div class="quiz-brand"><span>Kwizillo</span><small>${esc(K.quiz.topicLabel)} · ${esc(t('quiz.quizLabel',{n:K.quiz.quizNumber}))}</small></div>
          <div class="quiz-meta"><b>🪙 ${Number(K.state.coins||0)}</b><b>🔥 ${Number(K.state.streak||0)}</b></div>
        </header>
        <div class="quiz-progress"><strong>${esc(t('quiz.progress',{current:idx+1,total}))}</strong><div><i style="width:${pct}%"></i></div><span>${K.state.voice==='Stil'?'🔇':`🔊 ${esc(t(K.state.voice==='Milo'?'voice.milo':'voice.luna'))}`}</span></div>
        <main class="quiz-card">
          <h1>${esc(q.prompt)}</h1>
          <div class="quiz-art"><img src="${questionArt(q)}" style="${artFraming(q)}" alt="${esc(t('quiz.artAlt'))}"></div>
          <div class="answers">${q.options.map((o,i)=>`<button class="answer ${answerSize(o)}" data-a="${encodeURIComponent(o)}" data-index="${i}"><span class="answer-letter">${letters[i]}</span><span class="answer-copy">${esc(o)}</span></button>`).join('')}</div>
          <div class="quiz-actions"><button class="action hint" id="hintBtn">${esc(t('quiz.hint'))}</button><button class="action next" id="skipBtn">${esc(t('quiz.skip'))}</button></div>
        </main>
      </div>
    </section>`);

    const buttons=[...f.querySelectorAll('.answer')];
    K.clearSpeechHighlight=()=>buttons.forEach(b=>b.classList.remove('spoken-active'));
    f.querySelector('#qBack').onclick=()=>{K.stopSpeech();K.sfx('tap');K.showWorld(K.quiz.world)};
    f.querySelector('#hintBtn').onclick=()=>showHint(q);
    const skip=f.querySelector('#skipBtn');
    const spare=spareQuestions(q).length;
    if(!spare){ skip.disabled=true; skip.title=t('quiz.noSpare') }
    else skip.onclick=()=>{K.stopSpeech();K.sfx('tap');swapQuestion()};
    buttons.forEach(b=>b.onclick=()=>{K.stopSpeech();evaluate(q,decodeURIComponent(b.dataset.a),b)});

    K.speakSequence(K.core.buildQuestionSpeechSegments(q),{
      onSegment:segment=>{K.clearSpeechHighlight?.();if(segment.kind==='answer')buttons[segment.index]?.classList.add('spoken-active')},
      onDone:()=>K.clearSpeechHighlight?.()
    });
  }

  function showHint(q){
    K.stopSpeech();K.sfx('tap');
    const f=K.app.querySelector('.game-frame');if(!f)return;
    const x=document.createElement('div');x.className=`hint-float hint-v2 world-${q.world}`;
    const hint=q.hint||t('hint.fallback');
    x.innerHTML=`<div class="hint-card"><button class="hint-close" aria-label="${esc(t('hint.close'))}">×</button><div class="hint-kicker">💡 ${esc(t('hint.kicker',{topic:K.quiz.topicLabel}))}</div><div class="hint-visual"><img src="${questionArt(q)}" alt="${esc(t('hint.alt'))}"></div><h2>${esc(t('hint.title'))}</h2><p>${esc(hint)}</p><button class="hint-ok">${esc(t('hint.ok'))}</button></div>`;
    f.appendChild(x);
    const close=()=>{K.stopSpeech();x.remove()};
    x.querySelector('.hint-close').onclick=close;
    x.querySelector('.hint-ok').onclick=()=>{K.sfx('tap');close()};
    x.addEventListener('pointerdown',e=>{if(e.target===x)close()});
    K.speak(hint);
  }

  function evaluate(q,value,button){
    const r=K.core.recordAnswer(K.quiz,q,value);
    if(!r.accepted)return;
    const buttons=[...K.app.querySelectorAll('.answer')];
    buttons.forEach(b=>b.disabled=true);
    K.recordAnswerProgress(q,r.correct);
    if(r.correct){K.sfx('good');button.classList.add('correct')}
    else{K.sfx('bad');button.classList.add('wrong');buttons.find(b=>decodeURIComponent(b.dataset.a)===q.answer)?.classList.add('correct')}
    setTimeout(()=>feedback(q,r.correct),120);
  }

  function feedback(q,correct){
    K.stopSpeech();
    const f=K.app.querySelector('.game-frame');if(!f)return;
    const x=document.createElement('div');x.className=`feedback-float feedback-v2 ${correct?'is-good':'is-try'} world-${q.world}`;
    const explain=correct
      ? esc(q.explanation||t('feedback.thatsRight'))
      : `${t('feedback.correctIs',{answer:esc(q.answer)})} ${esc(q.explanation||q.hint||'')}`;
    const last=K.quiz.index+1>=K.quiz.questions.length;
    x.innerHTML=`<div class="feedback-card ${correct?'good':'try'}"><div class="feedback-glow"></div><div class="feedback-guide">${K.state.voice==='Luna'?'🎧':'🤖'}</div><div class="feedback-kicker">${esc(t(correct?'feedback.goodKicker':'feedback.tryKicker'))}</div><h2>${esc(t(correct?'feedback.goodTitle':'feedback.tryTitle'))}</h2><p class="feedback-explain">${explain}</p>${correct?`<div class="reward-strip"><span>⭐ +${q.xp||10} XP</span><span>🪙 +2</span></div>`:''}${q.fact?`<div class="fact-card"><b>${esc(t('feedback.didYouKnow'))}</b><span>${esc(q.fact)}</span></div>`:''}<button class="feedback-next" id="feedbackNext">${esc(t(last?'feedback.seeResult':'feedback.next'))} <span>›</span></button></div>`;
    f.appendChild(x);
    K.speak(K.core.buildFeedbackSpeech(q,correct,{
      good:t('feedback.speech.good'),
      tryAgain:t('feedback.speech.try',{answer:q.answer}),
      fact:t('feedback.speech.fact')
    }));
    x.querySelector('#feedbackNext').onclick=()=>{K.stopSpeech();K.sfx('tap');next()};
  }

  // Questions already in this quiz are off limits, so a swap is a genuinely new
  // question rather than a reshuffle of the same ten.
  function spareQuestions(current){
    const inQuiz=new Set(K.quiz.questions.map(x=>x.id));
    return K.core.poolFor({
      questions:K.questions,world:K.quiz.world,topicKey:K.quiz.topicKey,
      grade:Number(K.state.group||5)
    }).filter(x=>!inQuiz.has(x.id));
  }

  function swapQuestion(){
    const current=K.quiz.questions[K.quiz.index];
    const spare=spareQuestions(current);
    if(!spare.length) return;
    const replacement=K.core.prepareQuestion(spare[Math.floor(Math.random()*spare.length)]);
    K.quiz.questions[K.quiz.index]=replacement;
    const run=K.runFor(K.quiz.world,K.quiz.topicKey);
    run.usedIds=[...new Set([...run.usedIds.filter(id=>id!==current.id),replacement.id])];
    K.save();
    clearSpoken();
    K.showQuiz();
  }

  function next(){clearSpoken();K.quiz.index++;K.showQuiz()}

  K.showResult=()=>{
    K.stopSpeech();
    const q=K.quiz;
    if(q&&!q._counted){
      q._counted=true;
      K.state.quizzesPlayed=Number(K.state.quizzesPlayed||0)+1;
      const ws=K.progress().worlds[q.world];
      if(ws) ws.quizzes=Number(ws.quizzes||0)+1;
      K.touchStreak();
      K.save();
    }
    const total=q?.questions.length||0,score=q?.score||0,xp=q?.xp||0;
    const pct=total?Math.round(score/total*100):0;
    const nextNumber=(K.runFor(K.currentWorld,q?.topicKey||null).quizNumber||0)+1;
    const f=K.frame(`<section class="result-v2 fade-in">
      <img class="result-v2-bg" src="${K.MASTER[K.currentWorld]||K.MASTER.ruimte}" alt="">
      <div class="result-v2-dim"></div>
      <div class="result-v2-card">
        <div class="result-mascot">${K.state.voice==='Luna'?'🎧':'🤖'}</div>
        <div class="result-kicker">${esc(t('result.kicker'))}</div>
        <h1>${esc(t('result.title',{score,total}))}</h1>
        <div class="result-stars">${pct>=90?'★★★':pct>=70?'★★☆':'★☆☆'}</div>
        <div class="result-stats"><span><b>${pct}%</b><small>${esc(t('result.score'))}</small></span><span><b>+${xp}</b><small>${esc(t('result.xp'))}</small></span><span><b>${Number(K.state.coins||0)}</b><small>${esc(t('result.coins'))}</small></span></div>
        <div class="result-native">
          <button id="againBtn">${esc(t('result.againNumbered',{n:nextNumber}))}</button>
          <button id="collectionBtn" class="secondary">${esc(t('result.toCollection'))}</button>
        </div>
      </div>
    </section>`);
    f.querySelector('#againBtn').onclick=()=>{
      K.stopSpeech();K.sfx('tap');
      const idx=q?.topicKey?(K.TOPIC_KEYS[K.currentWorld]||[]).indexOf(q.topicKey):null;
      K.startQuiz(K.currentWorld,idx===-1?null:idx);
    };
    f.querySelector('#collectionBtn').onclick=()=>{K.stopSpeech();K.sfx('tap');K.showCollection('worlds')};
  };
})();
