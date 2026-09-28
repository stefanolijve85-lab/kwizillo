(()=>{
  const K=window.KWIZILLO_M1;
  if(!K) return;
  const t=(k,v)=>K.t(k,v);
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};

  // "Wat ben ik?": the guide gives clues about something from a world, one at a
  // time; the child picks it from four pictures. Guessing after the first clue
  // scores 100, after the second 75, after the third 50 — thinking first pays.
  // Everything comes from the question bank: the clues are the question's hint,
  // fact and explanation with the answer word hidden, the pictures are the
  // questions' own art. So every world plays in every language.
  const ROUNDS=5, POINTS=[100,75,50];
  // The per-question timer follows the parent's level like the quiz does (off
  // when the parent switched time limits off). It starts once the tiles have
  // been read out, pauses while a clue is read, and a run-out counts as a miss.
  let timer=null;
  const stopTimer=()=>{if(timer){clearInterval(timer.id);timer=null}};
  const secondsFor=()=>K.state.timeLimitOn===false?0:K.core.questionSeconds(K.state.niveau||1);

  // A question qualifies when its answer is a thing (one or two words, no digits)
  // and it has its own picture — the picture is the answer tile.
  // …and the answer names a thing: it must appear as a whole word in the
  // explanation ("Mars wordt de rode planeet genoemd"), which colours, numbers
  // and yes/no answers do not.
  const candidates=world=>K.questions.filter(q=>(world==='mix'||q.world===world)&&K.answerArtFor?.(q)&&/^\D{2,}$/.test(q.answer)&&q.answer.split(' ').length<=2&&q.hint&&q.explanation&&wordRe(q.answer).test(q.explanation)&&!/^(ja|nee|yes|no|sim|não|waar|niet waar|true|false)$/i.test(q.answer));
  // The answer is hidden in each clue as a whole word ("Mars" in "Mars wordt…",
  // never the "blauw" inside "blauwachtig"); a clue with nothing left but the
  // answer is dropped. Articles are not part of the word to hide.
  const core=answer=>answer.replace(/^(de|het|een|the|a|an|o|a|os|as|um|uma)\s+/i,'');
  const escapeRe=s=>s.replace(/[.*+?^${}()|[\]\\]/g,m=>'\\'+m);
  const wordRe=answer=>new RegExp('(^|[^\\p{L}])'+escapeRe(core(answer))+'(?=$|[^\\p{L}])','giu');
  const mask=(text,answer)=>{const out=text.replace(wordRe(answer),(m,pre)=>pre+'…');return out.replace(/…/g,'').trim().length>=6?out:null};
  const cluesFor=q=>[q.hint,q.fact,q.explanation].map(c=>c&&mask(c,q.answer)).filter(Boolean).slice(0,3);

  K.startWhoAmI=world=>{
    world=world||'mix';
    if(!K.premium.can('memo',world)){K.premiumLocked({kind:'whoami',world,retry:()=>K.startWhoAmI(world)});return}
    K.audio.setTrack('play').catch(()=>{});
    K.startScoreRun();
    K.stopSpeech();
    const pool=shuffle(candidates(world).filter(q=>cluesFor(q).length>=2));
    if(pool.length<4){K.toast(t('memo.none'));K.showHome();return}
    const rounds=pool.slice(0,ROUNDS).map(q=>{
      // Four different pictures on the tiles: no two options may share one.
      // Vier verschillende platen én vier verschillende antwoorden: twee tegels
      // met hetzelfde woord eronder is geen keuze maar een strikvraag. De
      // antwoorden werden alleen tegen het juiste antwoord vergeleken, niet
      // tegen elkaar, dus konden er twee gelijk zijn.
      const arts=new Set([K.answerArtFor(q)]);
      const words=new Set([String(q.answer).toLowerCase()]);
      const fresh=o=>o.id!==q.id&&!words.has(String(o.answer).toLowerCase())&&!arts.has(K.answerArtFor(o));
      const take=o=>{others.push(o);arts.add(K.answerArtFor(o));words.add(String(o.answer).toLowerCase())};
      const others=[];
      for(const o of shuffle(pool.filter(o=>fresh(o)&&o.world===q.world))){if(others.length>=3)break;take(o)}
      for(const o of pool){if(others.length>=3)break;if(fresh(o))take(o)}
      return {q,clues:cluesFor(q),options:shuffle([q,...others])};
    });
    K.whoami={world,rounds,index:0,score:0,correct:0,startedAt:Date.now(),done:false};
    // Every line of the whole game is requested now, so each round starts talking at once.
    const lines=[];for(const r of rounds){lines.push(...r.clues,...r.options.map(o=>`${o.answer}.`),t('whoami.speech.yes',{answer:r.q.answer})+' '+r.q.explanation,t('whoami.speech.almost',{answer:r.q.answer})+' '+r.q.explanation)}
    lines.push(t('whoami.ask'),t('whoami.speech.great'),t('whoami.speech.done'));
    K.prefetchSpeech?.(lines);
    showRound();
  };

  function showRound(){
    const g=K.whoami;const r=g.rounds[g.index];const q=r.q;
    K.stopSpeech();stopTimer();
    let shown=1,locked=false;
    const bgWorld=q.world;
    const f=K.frame(`<section class="quiz-v2 whoami whoami-${bgWorld} fade-in">
            <!-- Eén lucht voor alle minispellen: elk spel staat op zijn eigen eiland
           (assets/games/*-island.jpg), en die zijn onder dezelfde hemel getekend.
           Hiervoor stond hier de wereldplaat, en dan had rekenen in de kunstwereld
           een andere lucht dan memo in de ruimte. -->
<img class="quiz-v2-bg" src="${K.GAME_ART.whoami}" alt="">
      <div class="quiz-v2-dim"></div>
      <div class="quiz-v2-ui">
        <header class="quiz-v2-head">
          <button class="quiz-back" id="whoBack" aria-label="${esc(t('common.back'))}">${K.icon('back')}</button>
          <div class="quiz-brand"><span>${esc(t('whoami.title'))}</span><small>${esc(t(`world.${bgWorld}.title`))}</small></div>
          <div class="quiz-meta"><b>${esc(t('whoami.round',{n:g.index+1,total:g.rounds.length}))}</b><b>⭐ ${g.score}</b></div>
          ${secondsFor()?`<span class="quiz-timer whoami-timer" id="whoTimer" style="--p:100"><b>${secondsFor()}</b></span>`:''}
        </header>
        <main class="quiz-card whoami-card">
          <div class="whoami-guide"><img class="mascot-face" src="${K.guideArt(K.state.voice)}" alt=""><div class="whoami-bubble" id="whoClues"></div></div>
          <div class="whoami-points" id="whoPoints">${esc(t('whoami.points',{n:POINTS[0]}))}</div>
          <div class="whoami-grid">${r.options.map((o,i)=>`<button class="whoami-tile" data-i="${i}" aria-label="${esc(o.answer)}"><img src="${K.answerArtFor(o)}" alt="" decoding="async"><b>${esc(o.answer)}</b></button>`).join('')}</div>
          <div class="quiz-actions whoami-actions"><button class="action hint" id="whoMore">${K.icon('bulb')} ${esc(t('whoami.more'))}</button><button class="action repeat" id="whoRepeat">${K.icon('repeat')} ${esc(t('quiz.repeat'))}</button></div>
        </main>
      </div>
    </section>`);
    const clues=f.querySelector('#whoClues'),points=f.querySelector('#whoPoints'),more=f.querySelector('#whoMore');
    const renderClues=()=>{clues.innerHTML=r.clues.slice(0,shown).map((c,i)=>`<p class="${i===shown-1?'fresh':''}">${esc(c)}</p>`).join('')+`<p class="whoami-ask">${esc(t('whoami.ask'))}</p>`;points.textContent=t('whoami.points',{n:POINTS[Math.min(shown,POINTS.length)-1]});more.disabled=shown>=r.clues.length;more.classList.toggle('spent',shown>=r.clues.length)};
    const tiles=()=>[...f.querySelectorAll('.whoami-tile')];
    const speak=all=>{
      if(locked)return;
      const lines=all?r.clues.slice(0,shown):[r.clues[shown-1]];
      const segs=[...lines.map(text=>({kind:'speech',text})),{kind:'question',text:t('whoami.ask')},...r.options.map((o,i)=>({kind:'option',index:i,text:`${o.answer}.`}))];
      if(timer)timer.paused=true;
      K.speakSequence(segs,{onSegment:seg=>{tiles().forEach(x=>x.classList.remove('spoken-active'));if(seg.kind==='option')tiles()[seg.index]?.classList.add('spoken-active')},onDone:()=>{tiles().forEach(x=>x.classList.remove('spoken-active'))}}).then(()=>{if(timer)timer.paused=false;startTimer()},()=>{if(timer)timer.paused=false;startTimer()});
    };
    const seconds=secondsFor();
    const startTimer=()=>{
      if(!seconds||timer||locked)return;
      const el=f.querySelector('#whoTimer');if(!el)return;
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
    renderClues();speak(false);
    f.querySelector('#whoBack').onclick=()=>{K.stopSpeech();stopTimer();K.sfx('tap');K.showHome()};
    f.querySelector('#whoRepeat').onclick=()=>{K.sfx('tap');speak(true)};
    more.onclick=()=>{if(shown>=r.clues.length)return;K.sfx('hint');shown++;renderClues();speak(false)};
    const pick=b=>{
      if(locked)return;locked=true;K.stopSpeech();stopTimer();
      const choice=b?r.options[Number(b.dataset.i)]:null,ok=!!choice&&choice.id===q.id;
      const earned=ok?POINTS[Math.min(shown,POINTS.length)-1]:0;
      f.querySelectorAll('.whoami-tile').forEach(x=>{x.disabled=true;if(r.options[Number(x.dataset.i)].id===q.id)x.classList.add('correct')});
      if(ok){K.sfx('good');g.score+=earned;g.correct++;K.recordAnswerProgress?.(q,true)}else{K.sfx('bad');b?.classList.add('wrong');K.recordAnswerProgress?.(q,false)}
      // The verdict, then the explanation with the answer in it — a miss teaches too.
      const card=document.createElement('div');card.className='simple-modal whoami-verdict';
      // Goed: confetti in plaats van een toeter-emoji, en soms piept de gids
      // ergens achter de kaart vandaan (celebrate.js, K.cheer). Fout of tijd om:
      // een rustig teken, want daar valt niets te vieren.
      card.innerHTML=`<div class="simple-modal-card">${ok?'':`<div class="simple-icon">${b?'💡':'⏰'}</div>`}<h2>${esc(ok?t('whoami.yes',{answer:q.answer,points:earned}):t(b?'whoami.almost':'whoami.timeUp',{answer:q.answer}))}</h2><p>${esc(q.explanation)}</p><button class="simple-ok" id="whoNext">${esc(t(g.index+1>=g.rounds.length?'feedback.seeResult':'whoami.next'))}</button></div>`;
      f.appendChild(card);
      if(ok)K.cheer?.(card);
      K.speak((ok?t('whoami.speech.yes',{answer:q.answer}):t('whoami.speech.almost',{answer:q.answer}))+' '+q.explanation);
      card.querySelector('#whoNext').onclick=()=>{K.stopSpeech();K.sfx('tap');g.index++;if(g.index>=g.rounds.length)finish();else showRound()};
    };
    f.querySelectorAll('.whoami-tile').forEach(b=>b.onclick=()=>pick(b));
  }

  function finish(){
    const g=K.whoami;if(!g||g.done)return;g.done=true;K.stopSpeech();stopTimer();
    const max=g.rounds.length*POINTS[0];
    const stars=g.score>=max*.8?3:g.score>=max*.5?2:g.correct>0?1:0;
    // Each right guess already paid XP and coins like a quiz answer
    // (K.recordAnswerProgress); the stars add a small bonus on top.
    const xp=stars*6,coins=stars*4;
    const G=K.progress().games||={};const w=G.whoami||={played:0,best:0};
    w.played++;if(g.score>w.best)w.best=g.score;
    K.awardPoints(xp);K.awardCoins(coins);
    K.touchStreak();K.save();
    const bg=g.world==='mix'?'mysterie':g.world;
    const f=K.frame(`<section class="result-v2 fade-in is-pass">
      <img class="result-v2-bg" src="${K.GAME_ART.whoami}" alt="">
      <div class="result-v2-dim"></div>
      <div class="result-v2-card">
        <div class="result-stage"><button class="result-gift" id="resultGift" aria-label="🎁">🎁</button><div class="result-mascot"><img class="mascot-face large" src="${K.guideArt(K.state.voice)}" alt=""></div></div>
        <div class="result-kicker">${esc(t('whoami.doneKicker'))}</div>
        <h1>${esc(t('whoami.doneTitle',{n:g.correct,total:g.rounds.length}))}</h1>
        <div class="result-stars">${[1,2,3].map(n=>`<i class="${n<=stars?'on':''}">★</i>`).join('')}</div>
        <p class="result-rule">${esc(t('whoami.summary',{score:g.score,max}))}</p>
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
    K.speak(t(stars>=2?'whoami.speech.great':'whoami.speech.done'));
    f.querySelector('#againBtn').onclick=()=>{K.sfx('tap');K.startWhoAmI(g.world)};
    f.querySelector('#homeBtn').onclick=()=>{K.stopSpeech();K.sfx('tap');K.showHome()};
    f.querySelector('#shareBtn').onclick=()=>{K.sfx('tap');K.shareScore()};
  }
})();
