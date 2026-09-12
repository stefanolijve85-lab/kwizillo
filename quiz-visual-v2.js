(()=>{
  const K=window.KWIZILLO_M1;
  if(!K) return;
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const ART={
    space:'https://d8j0ntlcm91z4.cloudfront.net/user_2yYu0y6DQa27eWwkUPG52d9yApj/hf_20260912_144041_9bcd0e74-e46b-496a-9a36-a4e06fd75107.png',
    body:'https://d8j0ntlcm91z4.cloudfront.net/user_2yYu0y6DQa27eWwkUPG52d9yApj/hf_20260912_144041_4e87d44f-4e69-4d59-a4b9-f503c55cc5e2.png',
    dissolve:'https://d8j0ntlcm91z4.cloudfront.net/user_2yYu0y6DQa27eWwkUPG52d9yApj/hf_20260912_144041_98f42d2b-d80f-4a80-98d4-213c16ad9625.png',
    light:'https://d8j0ntlcm91z4.cloudfront.net/user_2yYu0y6DQa27eWwkUPG52d9yApj/hf_20260912_143922_8f456f90-a516-4917-845c-be6387e01102.png',
    lab:'https://d8j0ntlcm91z4.cloudfront.net/user_2yYu0y6DQa27eWwkUPG52d9yApj/hf_20260912_143922_a7507b06-6d1a-48df-b2aa-22a7acea442d.png',
    castle:'https://d8j0ntlcm91z4.cloudfront.net/user_2yYu0y6DQa27eWwkUPG52d9yApj/hf_20260912_143922_f63116c4-b0f5-4d20-8313-55ac3d22bb64.png'
  };
  const letters=['A','B','C','D'];

  function artKind(q){
    const p=String(q.prompt||'').toLowerCase();
    if(/oplossen|suiker|meng|vloeistof|verdamp/.test(p))return'dissolve';
    if(/schaduw|licht|spiegel/.test(p))return'light';
    if(/spier|lichaam|orgaan|hart|long|bloed|hersenen|skelet/.test(p))return'body';
    if(q.world==='ruimte'||/planeet|zon|maan|ster|astronaut|raket|satelliet/.test(p))return'space';
    if(q.world==='wetenschap')return'lab';
    if(q.topic==='ridders_kastelen'||/ridder|kasteel|middeleeuw/.test(p))return'castle';
    return null;
  }
  function questionArt(q){return ART[artKind(q)]||K.MASTER[q.world]||K.MASTER.ruimte}
  function answerSize(text){const n=String(text||'').length;return n>52?'xlong':n>34?'long':''}
  function clearSpoken(){K.app.querySelectorAll('.answer.spoken-active').forEach(b=>b.classList.remove('spoken-active'));K.clearSpeechHighlight=null}

  K.startQuiz=(world,topicIndex=null)=>{
    K.stopSpeech();
    K.currentWorld=world;
    const key=topicIndex===null?null:(K.TOPIC_KEYS[world]||[])[topicIndex];
    const label=key?(K.topics[world]?.[key]||key):'Gemengde quiz';
    const selected=K.core.selectQuestions({questions:K.questions,world,topicKey:key,grade:Number(K.state.group||5),limit:10});
    if(!selected.length){K.toast('Voor dit onderwerp zijn nog geen vragen beschikbaar.');K.showWorld(world);return}
    K.quiz=K.core.createSession({world,topicKey:key,topicLabel:label,questions:selected});
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
    const idx=K.quiz.index,total=K.quiz.questions.length,pct=Math.round(((idx+1)/Math.max(1,total))*100),bg=K.MASTER[q.world];
    const f=K.frame(`<section class="quiz-v2 quiz-world-${q.world} fade-in">
      <img class="quiz-v2-bg" src="${bg}" alt="">
      <div class="quiz-v2-dim"></div>
      <div class="quiz-v2-ui">
        <header class="quiz-v2-head">
          <button class="quiz-back" id="qBack" aria-label="Terug">‹</button>
          <div class="quiz-brand"><span>Kwizillo</span><small>${esc(K.quiz.topicLabel)}</small></div>
          <div class="quiz-meta"><b>🪙 ${K.state.coins}</b><b>🔥 ${K.state.streak}</b></div>
        </header>
        <div class="quiz-progress"><strong>Vraag ${idx+1} van ${total}</strong><div><i style="width:${pct}%"></i></div><span>${K.state.voice==='Stil'?'🔇':`🔊 ${esc(K.state.voice)}`}</span></div>
        <main class="quiz-card">
          <h1>${esc(q.prompt)}</h1>
          <div class="quiz-art"><img src="${questionArt(q)}" alt="Illustratie bij de vraag"></div>
          <div class="answers">${q.options.map((o,i)=>`<button class="answer ${answerSize(o)}" data-a="${encodeURIComponent(o)}" data-index="${i}"><span class="answer-letter">${letters[i]}</span><span class="answer-copy">${esc(o)}</span></button>`).join('')}</div>
          <div class="quiz-actions"><button class="action hint" id="hintBtn">💡 Hint</button><button class="action next" id="skipBtn">Andere vraag ›</button></div>
        </main>
      </div>
    </section>`);

    const buttons=[...f.querySelectorAll('.answer')];
    K.clearSpeechHighlight=()=>buttons.forEach(b=>b.classList.remove('spoken-active'));
    f.querySelector('#qBack').onclick=()=>{K.stopSpeech();K.sfx('tap');K.showWorld(K.quiz.world)};
    f.querySelector('#hintBtn').onclick=()=>showHint(q);
    f.querySelector('#skipBtn').onclick=()=>{K.stopSpeech();K.sfx('tap');next()};
    buttons.forEach(b=>b.onclick=()=>{K.stopSpeech();evaluate(q,decodeURIComponent(b.dataset.a),b)});

    const segments=K.core.buildQuestionSpeechSegments(q);
    K.speakSequence(segments,{
      onSegment:segment=>{K.clearSpeechHighlight?.();if(segment.kind==='answer')buttons[segment.index]?.classList.add('spoken-active')},
      onDone:()=>K.clearSpeechHighlight?.()
    });
  }

  function showHint(q){
    K.stopSpeech();K.sfx('tap');
    const f=K.app.querySelector('.game-frame');if(!f)return;
    const x=document.createElement('div');x.className=`hint-float hint-v2 world-${q.world}`;
    x.innerHTML=`<div class="hint-card"><button class="hint-close" aria-label="Hint sluiten">×</button><div class="hint-kicker">💡 ${esc(K.quiz.topicLabel)}-tip</div><div class="hint-visual"><img src="${questionArt(q)}" alt="Visuele hint"></div><h2>Een kleine aanwijzing</h2><p>${esc(q.hint||'Kijk nog eens goed naar de vraag en de afbeelding.')}</p><button class="hint-ok">Verder denken</button></div>`;
    f.appendChild(x);
    const close=()=>{K.stopSpeech();x.remove()};
    x.querySelector('.hint-close').onclick=close;x.querySelector('.hint-ok').onclick=()=>{K.sfx('tap');close()};x.addEventListener('pointerdown',e=>{if(e.target===x)close()});
    K.speak(q.hint||'Kijk nog eens goed naar de vraag en de afbeelding.');
  }

  function evaluate(q,value,button){
    const r=K.core.recordAnswer(K.quiz,q,value);if(!r.accepted)return;
    const buttons=[...K.app.querySelectorAll('.answer')];buttons.forEach(b=>b.disabled=true);
    K.state.answered=(K.state.answered||0)+1;
    if(r.correct){K.state.correct=(K.state.correct||0)+1;K.state.xp=(K.state.xp||0)+(q.xp||10);K.state.coins=(K.state.coins||0)+2;K.sfx('good');button.classList.add('correct')}
    else{K.sfx('bad');button.classList.add('wrong');buttons.find(b=>decodeURIComponent(b.dataset.a)===q.answer)?.classList.add('correct')}
    K.save();setTimeout(()=>feedback(q,r.correct),120);
  }

  function feedback(q,correct){
    K.stopSpeech();
    const f=K.app.querySelector('.game-frame');if(!f)return;
    const x=document.createElement('div');x.className=`feedback-float feedback-v2 ${correct?'is-good':'is-try'} world-${q.world}`;
    x.innerHTML=`<div class="feedback-card ${correct?'good':'try'}"><div class="feedback-glow"></div><div class="feedback-guide">${K.state.voice==='Luna'?'🎧':'🤖'}</div><div class="feedback-kicker">${correct?'GOED GEDAAN!':'BIJNA!'}</div><h2>${correct?'Sterk gespeeld!':'Slim geprobeerd!'}</h2><p class="feedback-explain">${correct?esc(q.explanation||'Dat klopt!'):`Het juiste antwoord is <strong>${esc(q.answer)}</strong>. ${esc(q.explanation||q.hint||'')}`}</p>${correct?`<div class="reward-strip"><span>⭐ +${q.xp||10} XP</span><span>🪙 +2</span></div>`:''}${q.fact?`<div class="fact-card"><b>Wist je dat?</b><span>${esc(q.fact)}</span></div>`:''}<button class="feedback-next" id="feedbackNext">${K.quiz.index+1>=K.quiz.questions.length?'Bekijk resultaat':'Volgende vraag'} <span>›</span></button></div>`;
    f.appendChild(x);
    K.speak(K.core.buildFeedbackSpeech(q,correct));
    x.querySelector('#feedbackNext').onclick=()=>{K.stopSpeech();K.sfx('tap');next()};
  }

  function next(){clearSpoken();K.quiz.index++;K.showQuiz()}

  K.showResult=()=>{
    K.stopSpeech();
    K.state.quizzesPlayed=(K.state.quizzesPlayed||0)+1;K.save();
    const q=K.quiz,total=q?.questions.length||0,score=q?.score||0,xp=q?.xp||0,pct=total?Math.round(score/total*100):0,bg=K.MASTER[K.currentWorld]||K.MASTER.ruimte;
    const f=K.frame(`<section class="result-v2 fade-in"><img class="result-v2-bg" src="${bg}" alt=""><div class="result-v2-dim"></div><div class="result-v2-card"><div class="result-mascot">🤖</div><div class="result-kicker">QUIZ VOLTOOID</div><h1>${score} van ${total} goed!</h1><div class="result-stars">${pct>=90?'★★★':pct>=70?'★★☆':'★☆☆'}</div><div class="result-stats"><span><b>${pct}%</b><small>score</small></span><span><b>+${xp}</b><small>XP</small></span><span><b>${K.state.coins}</b><small>coins</small></span></div><div class="result-native"><button id="againBtn">Nog een quiz</button><button id="collectionBtn" class="secondary">Naar mijn collectie</button></div></div></section>`);
    f.querySelector('#againBtn').onclick=()=>{K.stopSpeech();K.sfx('tap');K.startQuiz(K.currentWorld,q?.topicKey?K.TOPIC_KEYS[K.currentWorld].indexOf(q.topicKey):null)};
    f.querySelector('#collectionBtn').onclick=()=>{K.stopSpeech();K.sfx('tap');K.showCollection?.('worlds')};
  };
})();