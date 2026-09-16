(()=>{
  const K=window.KWIZILLO_M1;
  if(!K) return;
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const t=(k,p)=>K.t(k,p);
  const rnd=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
  const pick=a=>a[Math.floor(Math.random()*a.length)];
  const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};

  // Rekenen: ten generated sums per round. Each level (niveau) adds a skill;
  // the timer and the allowed mistakes come from the level rules the quiz
  // uses, so a round is passed or failed the same way.
  //   1  + and - within 10           4  every times table, division
  //   2  + and - within 20, doubles  5  + and - within 1000, x with a 2-digit number
  //   3  tables of 1-5, tens         6  two steps, halves and quarters, percentages
  function makeSum(niveau){
    const L=Math.max(1,Math.min(6,niveau));
    const ops=[];
    // Never a zero operand: "10 + 0" teaches nothing.
    const add=(max)=>{const a=rnd(1,max-1),b=rnd(1,max-a);return{a,b,op:'+',answer:a+b}};
    const sub=(max)=>{const a=rnd(2,max),b=rnd(1,a-1);return{a,b,op:'-',answer:a-b}};
    const mul=(maxTable,maxOther=10)=>{const a=rnd(1,maxTable),b=rnd(1,maxOther);return Math.random()<.5?{a,b,op:'×',answer:a*b}:{a:b,b:a,op:'×',answer:a*b}};
    const div=(maxTable,maxOther=10)=>{const b=rnd(1,maxTable),q=rnd(1,maxOther);return{a:b*q,b,op:'÷',answer:q}};
    if(L===1) ops.push(()=>add(10),()=>sub(10));
    if(L===2) ops.push(()=>add(20),()=>sub(20),()=>{const a=rnd(1,10);return{a:2,b:a,op:'×',answer:2*a,kind:'double'}});
    if(L===3) ops.push(()=>mul(5),()=>div(5),()=>{const a=rnd(1,9)*10,b=rnd(1,9)*10;return{a,b,op:'+',answer:a+b}},()=>{const a=rnd(2,9)*10,b=rnd(1,a/10-1)*10;return{a,b,op:'-',answer:a-b}});
    if(L===4) ops.push(()=>mul(10),()=>div(10),()=>add(100),()=>sub(100));
    if(L===5) ops.push(()=>add(1000),()=>sub(1000),()=>mul(9,25),()=>div(10,12));
    if(L===6) ops.push(
      ()=>{const a=rnd(2,9),b=rnd(2,9),c=rnd(1,30);return{text:`${c} + ${a} × ${b}`,speech:t('math.speech.twoStep',{c,a,b}),answer:c+a*b}},
      ()=>{const n=rnd(2,25)*2;return{text:t('math.half',{n}),speech:t('math.speech.half',{n}),answer:n/2}},
      ()=>{const n=rnd(2,15)*4;return{text:t('math.quarter',{n}),speech:t('math.speech.quarter',{n}),answer:n/4}},
      ()=>{const p=pick([10,25,50]),n=rnd(1,10)*(p===10?10:p===25?4:2)*2;return{text:t('math.percent',{p,n}),speech:t('math.speech.percent',{p,n}),answer:n*p/100}}
    );
    const s=pick(ops)();
    if(!s.text){
      s.text=`${s.a} ${s.op} ${s.b}`;
      const word={'+':t('math.op.plus'),'-':t('math.op.minus'),'×':t('math.op.times'),'÷':t('math.op.divided')}[s.op];
      s.speech=`${s.a} ${word} ${s.b}`;
    }
    // Four options: the answer and three near misses, all distinct and >= 0.
    const opts=new Set([s.answer]);
    const near=[1,-1,2,-2,10,-10,s.answer>20?Math.round(s.answer*.1):3,s.a&&s.b?s.a+s.b:5];
    let guard=0;
    while(opts.size<4&&guard++<60){const d=pick(near);const v=s.answer+d*(Math.random()<.5?1:-1);if(v>=0&&Number.isInteger(v))opts.add(v)}
    while(opts.size<4)opts.add(s.answer+opts.size*3);
    s.options=shuffle([...opts]);
    return s;
  }

  let timer=null;
  function stopTimer(){if(timer){clearInterval(timer.id);timer=null}}
  const secondsFor=()=>K.state.timeLimitOn===false?0:K.core.questionSeconds(K.state.niveau||1);

  K.startMath=world=>{
    K.audio.setTrack('play').catch(()=>{});
    K.stopSpeech();stopTimer();
    world=world||K.state.lastWorld||'ruimte';
    K.currentWorld=world;
    // Free plays the sums of levels 1–3; the parent's level setting is kept and
    // opens fully with Premium.
    const niveau=K.premium.isPremium()?Number(K.state.niveau||1):Math.min(Number(K.state.niveau||1),K.premium.FREE.mathMaxLevel);
    const sums=Array.from({length:10},()=>makeSum(niveau));
    K.math={world,niveau,sums,index:0,score:0,done:false,answers:[]};
    render();
    K.prefetchSpeech([...sums.map(s=>s.speech),t('math.speech.done'),t('math.speech.fail')]);
  };

  function render(){
    const m=K.math,s=m.sums[m.index],total=m.sums.length;
    if(!s)return finish();
    const pct=Math.round(((m.index+1)/total)*100);
    const done=m.answers[m.index]||null;           // an answered sum shows its verdict again
    const seconds=done?0:secondsFor();
    const f=K.frame(`<section class="math quiz-v2 quiz-world-${m.world} fade-in">
      <img class="quiz-v2-bg" src="${K.MASTER[m.world]}" alt="">
      <div class="quiz-v2-dim"></div>
      <div class="quiz-v2-ui">
        <header class="quiz-v2-head">
          <button class="quiz-back" id="mathBack" aria-label="${esc(t('common.back'))}">${K.icon('back')}</button>
          <div class="quiz-brand"><span>${esc(t('math.title'))}</span><small>${esc(t(`world.${m.world}.title`))} · ${esc(t('memo.level',{n:m.niveau}))}</small></div>
          <div class="quiz-meta"><button class="meta-chip" data-stats>${K.icon('coin')} ${Number(K.state.coins||0)}</button><button class="meta-chip" data-stats>${K.icon('flame')} ${Number(K.state.streak||0)}</button></div>
        </header>
        <div class="quiz-progress"><strong>${esc(t('math.progress',{current:m.index+1,total}))}</strong><div><i style="width:${pct}%"></i></div>${seconds?`<span class="quiz-timer" id="mathTimer" style="--p:100"><b>${seconds}</b></span>`:`<span>${m.score} ✓</span>`}</div>
        <main class="quiz-card math-card">
          ${s.op&&!s.text.includes('%')?`<div class="math-sum grid"><b>${s.a}</b><em>${esc(s.op)}</em><b>${s.b} <span class="math-eq">= ${done?`<strong>${s.answer}</strong>`:'?'}</span></b></div>`:`<div class="math-sum ${s.text.length>7?'long':''}"><b>${esc(s.text)} <span class="math-eq">= ${done?`<strong>${s.answer}</strong>`:'?'}</span></b></div>`}
          <div class="answers math-answers">${s.options.map((o,i)=>`<button class="answer ${done?(o===s.answer?'correct':done.value===o?'wrong':''):''}" data-a="${o}" data-index="${i}" ${done?'disabled':''}><span class="answer-letter">${'ABCD'[i]}</span><span class="answer-copy">${o}</span></button>`).join('')}</div>
          <div class="math-feedback" id="mathFeedback" hidden></div>
          ${done?`<button class="review-next" id="mathNext">${esc(t(m.index+1>=total?'feedback.seeResult':'feedback.next'))} ›</button>`:''}
          <div class="quiz-actions ${K.state.voice==='Stil'?'no-voice':''}"><button class="action back" id="mathPrev" ${m.index===0?'disabled':''}>${K.icon('back')} ${esc(t('quiz.back'))}</button><button class="action hint" id="mathHint">${K.icon('bulb')} ${esc(t('quiz.hint'))}</button><button class="action repeat" id="mathRepeat">${K.icon('repeat')} ${esc(t('quiz.repeat'))}</button></div>
        </main>
      </div>
    </section>`);
    const buttons=[...f.querySelectorAll('.answer')];
    f.querySelector('#mathBack').onclick=()=>{K.stopSpeech();stopTimer();K.sfx('tap');K.showWorld(m.world)};
    f.querySelectorAll('[data-stats]').forEach(b=>b.onclick=()=>{K.stopSpeech();stopTimer();K.sfx('tap');K.showStats({back:()=>render()})});
    // The hint shows the counting dots (or the reversed operation) for a moment.
    f.querySelector('#mathHint').onclick=()=>{K.sfx('hint');const h=f.querySelector('#mathFeedback');h.hidden=false;h.className='math-feedback is-hint';h.textContent=hintFor(s);K.speak(h.textContent);setTimeout(()=>{if(h.classList.contains('is-hint'))h.hidden=true},2600)};
    f.querySelector('#mathPrev').onclick=()=>{if(m.index===0)return;K.stopSpeech();stopTimer();K.sfx('swoosh');m.index--;render()};
    if(done){
      f.querySelector('#mathNext').onclick=()=>{K.stopSpeech();K.sfx('tap');m.index++;render()};
      f.querySelector('#mathRepeat').onclick=()=>{K.sfx('tap');K.speak(s.speech)};
      return;
    }
    buttons.forEach(b=>b.onclick=()=>answer(Number(b.dataset.a),b));

    let answered=false;
    const startTimer=()=>{
      if(!seconds||timer||answered)return;
      const el=f.querySelector('#mathTimer');if(!el)return;
      let left=seconds*1000,last=performance.now();el.classList.add('running');
      timer={paused:false,id:setInterval(()=>{const now=performance.now();if(!timer.paused)left-=now-last;last=now;if(!el.isConnected){stopTimer();return}
        el.style.setProperty('--p',String(Math.max(0,left/(seconds*1000))*100));const sec=Math.max(0,Math.ceil(left/1000));if(sec!==timer.sec){timer.sec=sec;K.timerTick?.(sec)}el.querySelector('b').textContent=sec;el.classList.toggle('urgent',left<=5000);
        if(left<=0){stopTimer();answer(null,null)}},100)};
    };
    // The four options are warmed so the chosen number is spoken at once.
    const read=async()=>{if(timer)timer.paused=true;await K.speak(s.speech,{prefetch:buttons.map(b=>`${b.dataset.a}.`)});if(timer)timer.paused=false;startTimer()};
    f.querySelector('#mathRepeat').onclick=()=>{K.sfx('tap');read()};
    read();

    function answer(value,btn){
      if(answered)return;answered=true;stopTimer();K.stopSpeech();
      const correct=value===s.answer;
      buttons.forEach(b=>b.disabled=true);
      if(correct){m.score++;K.sfx('good');btn?.classList.add('correct');K.celebrateAt?.(f,{x:f.clientWidth/2,y:f.clientHeight*.45,count:30})}
      else{K.sfx('bad');btn?.classList.add('wrong');buttons.find(b=>Number(b.dataset.a)===s.answer)?.classList.add('correct')}
      m.answers[m.index]={correct,timedOut:value===null,value};
      K.state.xp=Number(K.state.xp||0)+(correct?10:0);K.state.coins=Number(K.state.coins||0)+(correct?1:0);K.save();
      const h=f.querySelector('#mathFeedback');h.hidden=false;h.className=`math-feedback ${correct?'is-good':'is-try'}`;
      h.innerHTML=`<b>${esc(t(value===null?'feedback.timeKicker':correct?'feedback.goodKicker':'feedback.tryKicker'))}</b><span>${esc(t('math.answerIs',{sum:s.text,answer:s.answer}))}</span>`;
      const line=correct?t(`feedback.speech.good.${1+Math.floor(Math.random()*8)}`):t('math.speech.wrong',{answer:s.answer});
      const go=()=>{m.index++;render()};
      // The voice names the chosen number first, then the praise or the correction.
      const spoken=K.speakSequence([value===null?null:{kind:'answer',text:`${value}.`},{kind:'speech',text:line}]);
      // Move on when the lines have been spoken (or straight away without a voice), never later than 3.4 s.
      let moved=false;const next=()=>{if(moved)return;moved=true;go()};
      Promise.resolve(spoken).then(()=>setTimeout(next,350),()=>setTimeout(next,350));
      setTimeout(next,3400);
      h.onclick=next;
    }
  }

  function hintFor(s){
    if(s.op==='+')return t('math.hint.plus',{a:s.a,b:s.b});
    if(s.op==='-')return t('math.hint.minus',{a:s.a,b:s.b});
    if(s.op==='×')return t('math.hint.times',{a:s.a,b:s.b});
    if(s.op==='÷')return t('math.hint.divided',{a:s.a,b:s.b});
    return t('math.hint.generic');
  }

  K.mathFinishForTest=()=>finish();
  function finish(){
    const m=K.math;if(!m||m.done)return;m.done=true;stopTimer();K.stopSpeech();
    const total=m.sums.length,score=m.score,niveau=m.niveau;
    const passed=K.core.quizPassed({score,total,niveau});
    const pct=Math.round(score/total*100);
    const stars=!passed?0:pct>=90?3:pct>=70?2:1;
    const bonus=passed?stars*5:0;
    const G=K.progress().games||={};const math=G.math||={played:0,won:0,best:{}};
    math.played++;if(passed){math.won++;const best=math.best[niveau]||0;if(score>best)math.best[niveau]=score}
    K.state.xp=Number(K.state.xp||0)+bonus;K.touchStreak();K.save();
    const allowed=K.core.maxWrong(niveau),wrong=total-score;
    const f=K.frame(`<section class="result-v2 fade-in ${passed?'is-pass':'is-fail'}">
      <img class="result-v2-bg" src="${K.MASTER[m.world]}" alt="">
      <div class="result-v2-dim"></div>
      <div class="result-v2-card">
        <div class="result-stage ${passed?'':'open'}">
          ${passed?`<button class="result-gift" id="resultGift" aria-label="🎁">🎁</button>`:''}
          <div class="result-mascot"><img class="mascot-face large" src="${K.guideArt(K.state.voice)}" alt=""></div>
        </div>
        <div class="result-kicker">${esc(t(passed?'result.passKicker':'result.failKicker'))}</div>
        <h1>${esc(t('math.resultTitle',{score,total}))}</h1>
        <div class="result-stars">${[1,2,3].map(n=>`<i class="${n<=stars?'on':''}">★</i>`).join('')}</div>
        <p class="result-rule">${esc(t(passed?'result.passRule':'result.failRule',{niveau,allowed,wrong}))}</p>
        <div class="result-stats"><span><b>${pct}%</b><small>${esc(t('result.score'))}</small></span><span><b>+${score*10+bonus}</b><small>${esc(t('result.xp'))}</small></span><span><b>${Number(K.state.coins||0)}</b><small>${esc(t('result.coins'))}</small></span></div>
        <div class="result-native">
          <button id="againBtn">${esc(t(passed?'math.again':'result.retryNow'))}</button>
          <button id="worldBtn" class="secondary">${esc(t('memo.toWorld'))}</button>
          <button id="shareBtn" class="secondary">${esc(t('result.share'))}</button>
        </div>
      </div>
    </section>`);
    if(passed){
      const stage=f.querySelector('.result-stage'),gift=f.querySelector('#resultGift');
      let opened=false;const open=()=>{if(opened)return;opened=true;stage.classList.add('open');K.sfx('gift');setTimeout(()=>K.sfx('reward'),350);K.celebrate?.('quiz',gift)};
      gift.onclick=open;setTimeout(open,1000);K.speak(t('math.speech.done'));
    }else{K.sfx('bad');K.speak(t('math.speech.fail'))}
    f.querySelector('#againBtn').onclick=()=>{K.sfx('tap');K.startMath(m.world)};
    f.querySelector('#worldBtn').onclick=()=>{K.stopSpeech();K.sfx('tap');K.showWorld(m.world)};
    f.querySelector('#shareBtn').onclick=()=>{K.sfx('tap');K.shareScore()};
  }
})();
