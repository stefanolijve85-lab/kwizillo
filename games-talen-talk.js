(()=>{
  const K=window.KWIZILLO_M1;
  if(!K) return;
  // Talen, Gesprekjes and Spreken (2026-10-10), the third and fourth tile of the passport.
  //
  // Gesprekjes: a very short conversation in the language the child learns (the boy
  // on the left, the girl on the right, each line lighting up as it is said), then a
  // question in the child's own language. Data: talen-gesprekjes.js. Sound: one clip
  // per line in the learning language and one per question in the child's own
  // language, in the chosen guide's voice like every Talen clip (tools/talen-audio.cjs).
  //
  // Spreken: the child hears a word or a sentence that is already recorded and says
  // it out loud. The microphone only tells whether something was said (local voice
  // activity, Web Audio); nothing is recorded, kept or sent anywhere, and no score is
  // claimed for the pronunciation. Without a microphone the child says it and taps
  // "Ik heb het gezegd". Progress is metadata only: how many were practised, when.
  const t=(k,v)=>K.t(k,v);
  const kit=()=>K.talenKit;
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const T=()=>K.TALEN;
  const learn=()=>kit().learn(),own=()=>kit().own();
  const audio=(lang,name)=>kit().audio(lang,name);
  const shuffle=a=>kit().shuffle(a);

  // ---- progress, per learning language, next to themes and words (backward compatible:
  // an old store simply has neither key yet)
  const convRec=(cat,make=false)=>{const s=kit().store();s.conversations||={};const k=`${learn()}:${cat}`;return s.conversations[k]||(make?(s.conversations[k]={played:0,answered:0,correct:0,stars:0,lastPlayed:0}):null)};
  const speakRec=(make=false)=>{const s=kit().store();s.speaking||={};const l=learn();return s.speaking[l]||(make?(s.speaking[l]={practised:0,completed:0,lastPlayed:0}):null)};
  K.talenTalkSummary=()=>({conversations:convRec,speaking:speakRec});

  const cats=()=>T().conversations||[];
  const catLabel=id=>id==='mix'?t('talen.theme.mix'):t(`talen.conv.cat.${id}`);
  const setLabel=id=>id==='mix'?t('talen.theme.mix'):t(`talen.speaking.set.${id}`);
  const CAT_ICON={intro:'👋',school:'🏫',food:'🍎',family:'👨‍👩‍👧',shop:'🛒',travel:'🧳'};
  // The tiles carry a Talen picture (the same painted style as the word themes).
  const CAT_ART={intro:'hello',school:'schoolbag',food:'icecream',family:'mom',shop:'bread',travel:'suitcase'};
  const SET_ART={basics:'thanks',greetings:'goodmorning',sentences:'friend'};
  const art=id=>`assets/talen/img/${id}.jpg`;
  const optText=o=>typeof o==='string'?o:(o.text?.[own()]||o.text?.en||'');
  const starsHtml=n=>kit().badge(n);
  const lockedTile=free=>free?'':K.premiumBadge();

  /* ---------------- Gesprekjes: the six situations ---------------- */
  K.showTalenConv=()=>{
    const l=learn();if(!l)return K.showTalen();
    const body=`${K.talenMixTile('mix',Number(convRec('mix')?.stars||0),'data-conv')}<div class="talen-fill-grid conv">${cats().map(c=>{const open=K.premium.can('talen',`conv:${c.id}`),n=Number(convRec(c.id)?.stars||0);
        return `<button class="memo-pick talen-pick fit conv ${n?'done':''} ${open?'':'locked'}" data-conv="${c.id}"><img class="talen-pick-art" src="${art(CAT_ART[c.id]||'hello')}" alt="" decoding="async"><span class="home-game-veil"></span>${lockedTile(open)}${starsHtml(n)}<b>${esc(t(`talen.conv.cat.${c.id}`))}</b></button>`}).join('')}</div>`;
    const f=kit().passport(kit().passSub(l),body,()=>K.showTalen(),{title:t('talen.section.conversations'),cls:'talen-fill'});
    f.querySelectorAll('[data-conv]').forEach(b=>b.onclick=()=>{K.sfx('world');K.startTalenConv(b.dataset.conv)});
  };

  K.startTalenConv=id=>{
    const l=learn(),mix=id==='mix',c=mix?null:cats().find(x=>x.id===id);
    if(!l||(!mix&&!c))return K.showTalenConv();
    if(!K.premium.can('talen',mix?'mix':`conv:${id}`)){K.premiumLocked({kind:'talen',retry:()=>K.startTalenConv(id)});return}
    K.audio.setTrack('play').catch(()=>{});
    // the mix: six conversations from every situation
    const convs=mix?shuffle(cats().flatMap(x=>x.convs)).slice(0,6):c.convs;
    K.talenConv={cat:id,convs,i:0,firstTry:0,missed:false,locked:false,learn:l};
    convRound();
  };
  K.talenConvForTest=()=>K.talenConv;

  function convRound(){
    const g=K.talenConv,c=g.convs[g.i],l=learn(),o=own(),n=g.convs.length;
    g.missed=false;g.locked=false;g.heard=false;
    const opts=shuffle(c.opts.map((x,k)=>({x,right:k===0})));
    const pct=Math.round(g.i/n*100);
    const f=K.frame(`<section class="quiz-v2 whoami talen-game talen-conv fade-in">
      <img class="quiz-v2-bg" src="${K.GAME_ART.talen}" alt="">
      <div class="quiz-v2-dim"></div>
      <div class="quiz-v2-ui">
        <header class="quiz-v2-head">
          <button class="quiz-back" id="convBack" aria-label="${esc(t('common.back'))}">${K.icon('back')}</button>
          <div class="quiz-brand"><span>${esc(t('talen.section.conversations'))}</span><small>${esc(catLabel(g.cat))}</small></div>
          <div class="quiz-meta"><b>⭐ ${g.firstTry}</b></div>
        </header>
        <div class="quiz-progress"><strong>${esc(t('talen.conv.round',{n:g.i+1,total:n}))}</strong><div><i style="width:${pct}%"></i></div><span>🔊</span></div>
        <main class="quiz-card talen-card conv-card">
          <div class="conv-chat" lang="${l}" dir="auto">${c.lines.map((line,k)=>`<div class="conv-line ${line.who}" data-line="${k}"><span class="conv-face" aria-hidden="true">${line.who==='a'?'👦':'👧'}</span><span class="conv-bubble"><span class="conv-dots" aria-hidden="true">•••</span><span class="conv-text">${esc(line.text[l])}</span></span></div>`).join('')}</div>
          <div class="conv-ask" hidden>
            <p class="conv-q" dir="auto">${esc(c.q[o]||c.q.en)}</p>
            <div class="conv-opts">${opts.map((op,k)=>`<button class="answer conv-opt" data-right="${op.right?1:0}" data-k="${k}" dir="auto">${op.x.e?`<span class="conv-emoji" aria-hidden="true">${op.x.e}</span>`:''}<span class="answer-copy">${esc(optText(op.x))}</span></button>`).join('')}</div>
          </div>
          <div class="quiz-actions whoami-actions talen-actions"><button class="action repeat" id="convAgain">${K.icon('repeat')} ${esc(t('talen.conv.listenAgain'))}</button><button class="action hint" id="convHint">${K.icon('bulb')} ${esc(t('quiz.hint'))}</button></div>
        </main>
      </div>
    </section>`);
    K.audio.setSteady(true);
    const lineEls=[...f.querySelectorAll('.conv-line')],ask=f.querySelector('.conv-ask');
    const lineClips=c.lines.map((_,k)=>audio(l,`c_${c.id}_${k+1}`)),qClip=audio(o,`_q_${c.id}`);
    K.preloadClips?.([...lineClips,qClip,...Array.from({length:T().praise},(_,i)=>audio(o,`_goed${i+1}`)),...Array.from({length:T().almost},(_,i)=>audio(o,`_bijna${i+1}`))]);
    let token=0;
    // The whole conversation, line by line, each bubble lighting up while it is said; then the question.
    const play=async()=>{
      const me=++token;K.stopSpeech();
      lineEls.forEach(x=>x.classList.remove('on'));
      for(let k=0;k<lineEls.length;k++){
        if(me!==token||!f.isConnected)return;
        lineEls[k].classList.add('shown','on');
        await K.playClips([lineClips[k]]);
        if(me!==token||!f.isConnected)return;
        lineEls[k].classList.remove('on');
        await new Promise(r=>setTimeout(r,260));
      }
      if(me!==token||!f.isConnected)return;
      ask.hidden=false;g.heard=true;
      await K.playClips([qClip]);
    };
    f.querySelector('#convBack').onclick=()=>{token++;K.stopSpeech();K.sfx('tap');K.showTalenConv()};
    f.querySelector('#convAgain').onclick=()=>{K.sfx('tap');if(!g.locked)play()};
    const hint=f.querySelector('#convHint');
    hint.onclick=()=>{
      if(g.locked)return;ask.hidden=false;
      const wrong=[...f.querySelectorAll('.conv-opt')].filter(b=>b.dataset.right==='0'&&!b.disabled);
      if(wrong.length<=1){hint.disabled=true;return}
      K.sfx('tap');g.missed=true;
      const b=wrong[Math.floor(Math.random()*wrong.length)];b.classList.add('hinted');b.disabled=true;
      if(wrong.length<=2)hint.disabled=true;
    };
    f.querySelectorAll('.conv-opt').forEach(b=>b.onclick=async()=>{
      if(g.locked||b.disabled)return;
      token++;K.stopSpeech();
      const rec=convRec(g.cat,true);
      if(b.dataset.right==='1'){
        g.locked=true;if(!g.missed)g.firstTry++;
        rec.answered++;if(!g.missed)rec.correct++;K.save();
        b.classList.add('correct');
        const r=b.getBoundingClientRect(),fr=f.getBoundingClientRect();
        K.celebrateAt?.(f,{x:r.left-fr.left+r.width/2,y:r.top-fr.top+r.height/2,count:18});
        await K.playClips([kit().vary('goed',T().praise)]);
        if(!f.isConnected||K.talenConv!==g)return;
        await new Promise(r=>setTimeout(r,350));
        if(!f.isConnected||K.talenConv!==g)return;
        g.i++;g.i<g.convs.length?convRound():convFinish();
      }else{
        g.missed=true;b.classList.add('wrong');b.disabled=true;
        await K.playClips([kit().vary('bijna',T().almost)]);
      }
    });
    play();
  }

  function convFinish(){
    const g=K.talenConv,n=g.convs.length,share=g.firstTry/n,stars=share>=1?3:share>=.75?2:1;
    const rec=convRec(g.cat,true);rec.played++;rec.stars=Math.max(rec.stars||0,stars);rec.lastPlayed=Date.now();
    const xp=stars*6+n*2,coins=stars*3;
    K.awardPoints(xp);K.awardCoins(coins);K.touchStreak();K.save();
    resultScreen({icon:CAT_ICON[g.cat]||'💬',title:t('talen.conv.done'),stars,stat:`${g.firstTry}/${n}`,statLabel:t('talen.firstTry'),xp,
      again:()=>K.startTalenConv(g.cat),back:()=>K.showTalenConv(),againLabel:t('talen.again',{theme:catLabel(g.cat)})});
  }

  // One result card for both: the same frame, stars, XP and coins as a word lesson.
  function resultScreen({icon,title,stars,stat,statLabel,xp,again,back,againLabel}){
    const f=K.frame(`<section class="result-v2 talen-result fade-in is-pass">
      <img class="result-v2-bg" src="${K.GAME_ART.talen}" alt="">
      <div class="result-v2-dim"></div>
      <div class="result-v2-card">
        <div class="result-stage open"><div class="result-mascot"><img class="mascot-face large" src="${K.guideArt(K.state.voice)}" alt=""></div><span class="talen-stamp-fly" aria-hidden="true">${icon}</span></div>
        <div class="result-kicker">${esc(t('talen.title'))}</div>
        <h1>${esc(title)}</h1>
        <div class="result-stars">${[1,2,3].map(k=>`<i class="${k<=stars?'on':''}">★</i>`).join('')}</div>
        <div class="result-stats"><span><b>${esc(stat)}</b><small>${esc(statLabel)}</small></span><span><b>+${xp}</b><small>${esc(t('result.xp'))}</small></span><span><b>${Number(K.state.coins||0)}</b><small>${esc(t('result.coins'))}</small></span></div>
        <div class="result-native">
          <button id="againBtn">${esc(againLabel)}</button>
          <button id="passBtn" class="secondary">${esc(t('talen.passport'))}</button>
        </div>
      </div>
    </section>`);
    K.sfx('reward');setTimeout(()=>K.celebrate?.('quiz',f.querySelector('.result-stage')),250);
    if(K.state.voice!=='Stil')setTimeout(()=>{if(f.isConnected)K.playClips([kit().vary('goed',T().praise)])},700);
    f.querySelector('#againBtn').onclick=()=>{K.sfx('tap');again()};
    f.querySelector('#passBtn').onclick=()=>{K.stopSpeech();K.sfx('tap');back()};
  }

  /* ---------------- the microphone: voice activity only, nothing kept ---------------- */
  // A small abstraction so a real on-device recogniser can take its place later
  // (start() would then also return what was understood). Cloud speech-to-text and
  // the Web Speech API are not used: on several platforms they send the audio away.
  const speechPractice=(()=>{
    let run=null;
    const AC=()=>window.AudioContext||window.webkitAudioContext;
    const cleanup=()=>{
      if(!run)return;
      clearInterval(run.timer);
      try{run.stream?.getTracks().forEach(tr=>tr.stop())}catch(e){}
      try{run.ctx?.close()}catch(e){}
      const r=run;run=null;return r;
    };
    return {
      isSupported:()=>!!(navigator.mediaDevices?.getUserMedia&&AC()),
      // Asks once (the system dialog); the stream is closed again at once.
      async requestPermission(){
        const s=await navigator.mediaDevices.getUserMedia({audio:true});
        s.getTracks().forEach(tr=>tr.stop());
        return true;
      },
      // Listens until something was said and a short silence followed, or after maxMs.
      // Resolves {heard, voicedMs}; null when cancelled. onLevel(0..1) drives the waveform.
      start({onLevel=()=>{},maxMs=6000}={}){
        cleanup();
        return new Promise(async(resolve,reject)=>{
          let stream;
          try{stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}})}catch(e){reject(e);return}
          const ctx=new (AC())(),src=ctx.createMediaStreamSource(stream),an=ctx.createAnalyser();
          an.fftSize=1024;src.connect(an);
          const buf=new Float32Array(an.fftSize);
          // The room's own level is the quietest moment heard so far (rising slowly, so a
          // fan or traffic is followed); speech is well above it. A child who starts
          // talking at once is still heard: no fixed "measure the silence first".
          let floor=Infinity,voiced=0,silence=0,elapsed=0;
          const STEP=50;
          run={stream,ctx,resolve,timer:setInterval(()=>{
            an.getFloatTimeDomainData(buf);
            let sum=0;for(let i=0;i<buf.length;i++)sum+=buf[i]*buf[i];
            const rms=Math.sqrt(sum/buf.length);elapsed+=STEP;
            floor=Math.min(floor===Infinity?rms:floor*1.01+1e-5,rms);
            const thr=Math.max(.015,floor*3);
            onLevel(Math.min(1,rms/(thr*4)));
            if(rms>thr){voiced+=STEP;silence=0}else if(voiced)silence+=STEP;
            if(run)run.voiced=voiced;
            if((voiced>=300&&silence>=700)||elapsed>=maxMs){const r=cleanup();r?.resolve({heard:voiced>=300,voicedMs:voiced})}
          },STEP)};
        });
      },
      // A second tap ends listening early: what was said so far counts.
      stop(){const r=cleanup();r?.resolve({heard:(r.voiced||0)>=300,voicedMs:r.voiced||0})},
      cancel(){const r=cleanup();r?.resolve(null)},
      active:()=>!!run
    };
  })();
  K.speechPractice=speechPractice;
  // Leaving the screen, the app or the voice: the microphone goes off at once.
  const stopSpeech=K.stopSpeech;
  K.stopSpeech=(...a)=>{speechPractice.cancel();return stopSpeech?.(...a)};
  document.addEventListener('visibilitychange',()=>{if(document.hidden)speechPractice.cancel()});

  /* ---------------- Spreken: three sets ---------------- */
  const sets=()=>T().speaking||[];
  const SET_ICON={basics:'👋',greetings:'🙋',sentences:'💬'};
  K.showTalenSpeak=()=>{
    const l=learn();if(!l)return K.showTalen();
    const rec=speakRec();
    // Three wide tiles under each other, like the choice in Rekenen; a few of the set's words in the language learned.
    const body=`${K.talenMixTile('mix',null,'data-speak-set')}<div class="talen-fill-list speak">${sets().map(s=>{const open=K.premium.can('talen',`speak:${s.id}`),sample=s.words.slice(0,3).map(w=>kit().word(w)?.text[l]).filter(Boolean).join(' · ');
        return `<button class="memo-pick math-pick-tile talen-speak-tile ${open?'':'locked'}" data-speak-set="${s.id}"><img class="home-game-art" src="${art(SET_ART[s.id]||'hello')}" alt="" decoding="async"><span class="home-game-veil"></span>${lockedTile(open)}<b>${esc(t(`talen.speaking.set.${s.id}`))}<small lang="${l}" dir="auto">${esc(sample)}</small></b></button>`}).join('')}</div>
      ${rec?.practised?`<p class="talen-speak-count">🎤 ${rec.practised}</p>`:''}`;
    const f=kit().passport(kit().passSub(l),body,()=>K.showTalen(),{title:t('talen.section.speaking'),cls:'talen-fill'});
    f.querySelectorAll('[data-speak-set]').forEach(b=>b.onclick=()=>{K.sfx('world');K.startTalenSpeak(b.dataset.speakSet)});
  };

  K.startTalenSpeak=id=>{
    const l=learn(),mix=id==='mix',s=mix?null:sets().find(x=>x.id===id);
    if(!l||(!mix&&!s))return K.showTalenSpeak();
    if(!K.premium.can('talen',mix?'mix':`speak:${id}`)){K.premiumLocked({kind:'talen',retry:()=>K.startTalenSpeak(id)});return}
    const ids=mix?shuffle(sets().flatMap(x=>x.words)).slice(0,8):s.words;   // the mix: eight from every set
    const words=ids.map(w=>kit().word(w)).filter(w=>w&&w.text[l]);
    if(!words.length)return K.showTalenSpeak();
    K.audio.setTrack('play').catch(()=>{});
    K.talenSpeak={set:id,words,i:0,done:0,mic:speechPractice.isSupported()&&K.state.talenMicOk?'on':null};
    if(!speechPractice.isSupported())return micOff();
    if(!K.state.talenMicOk)return micAsk();   // asked here, the first time Spreken is opened — never at app start
    speakItem();
  };
  K.talenSpeakForTest=()=>K.talenSpeak;

  // Before the system asks: why Kwizillo wants the microphone.
  function micAsk(){
    const f=speakFrame(`<div class="speak-panel speak-ask">
        <span class="speak-mic-icon" aria-hidden="true">🎤</span>
        <h2>${esc(t('talen.speaking.permissionTitle'))}</h2>
        <p>${esc(t('talen.speaking.permissionBody'))}</p>
        <button class="talen-start" id="micEnable">${esc(t('talen.speaking.enableMic'))}</button>
        <button class="talen-start secondary" id="micSkip">${esc(t('talen.speaking.withoutMic'))}</button>
      </div>`);
    f.querySelector('#micEnable').onclick=async()=>{
      K.sfx('tap');
      try{await speechPractice.requestPermission();K.state.talenMicOk=true;K.save();K.talenSpeak.mic='on';speakItem()}
      catch(e){micOff()}
    };
    f.querySelector('#micSkip').onclick=()=>{K.sfx('tap');K.talenSpeak.mic='off';speakItem()};
  }
  // No microphone, or not allowed: never a dead end.
  function micOff(){
    K.talenSpeak.mic=null;
    const f=speakFrame(`<div class="speak-panel speak-off" role="status">
        <span class="speak-mic-icon off" aria-hidden="true">🎙️</span>
        <h2>${esc(t('talen.speaking.micOff'))}</h2>
        <p>${esc(t('talen.speaking.micOffBody'))}</p>
        ${speechPractice.isSupported()?`<button class="talen-start" id="micRetry">${esc(t('talen.speaking.retry'))}</button>`:''}
        <button class="talen-start ${speechPractice.isSupported()?'secondary':''}" id="micSkip">${esc(t('talen.speaking.withoutMic'))}</button>
        <button class="talen-start secondary" id="micBack">${esc(t('common.back'))}</button>
      </div>`);
    f.querySelector('#micRetry')?.addEventListener('click',async()=>{K.sfx('tap');try{await speechPractice.requestPermission();K.state.talenMicOk=true;K.save();K.talenSpeak.mic='on';speakItem()}catch(e){micOff()}});
    f.querySelector('#micSkip').onclick=()=>{K.sfx('tap');K.talenSpeak.mic='off';speakItem()};
    f.querySelector('#micBack').onclick=()=>{K.sfx('tap');K.showTalenSpeak()};
  }
  function speakFrame(inner){
    const g=K.talenSpeak,n=g.words.length,pct=Math.round(g.i/n*100);
    const f=K.frame(`<section class="quiz-v2 whoami talen-game talen-speak fade-in">
      <img class="quiz-v2-bg" src="${K.GAME_ART.talen}" alt="">
      <div class="quiz-v2-dim"></div>
      <div class="quiz-v2-ui">
        <header class="quiz-v2-head">
          <button class="quiz-back" id="speakBack" aria-label="${esc(t('common.back'))}">${K.icon('back')}</button>
          <div class="quiz-brand"><span>${esc(t('talen.section.speaking'))}</span><small>${esc(setLabel(g.set))}</small></div>
          <div class="quiz-meta"><b>🎤 ${g.done}</b></div>
        </header>
        <div class="quiz-progress"><strong>${esc(t('talen.speaking.round',{n:Math.min(g.i+1,n),total:n}))}</strong><div><i style="width:${pct}%"></i></div><span>🎤</span></div>
        <main class="quiz-card talen-card speak-card">${inner}</main>
      </div>
    </section>`);
    f.querySelector('#speakBack').onclick=()=>{K.stopSpeech();K.sfx('tap');K.showTalenSpeak()};
    return f;
  }

  function speakItem(){
    const g=K.talenSpeak,w=g.words[g.i],l=learn(),o=own();
    const micOn=g.mic==='on';
    const f=speakFrame(`<div class="speak-panel">
        <div class="talen-ask"><img class="mascot-face" src="${K.guideArt(K.state.voice)}" alt=""><b class="talen-ask-bubble">${esc(t('talen.speaking.sayIt'))}</b></div>
        <button class="speak-word" id="speakHear" aria-label="${esc(t('talen.listen'))}">${kit().pic(w,'speak-pic')}<b lang="${l}" dir="auto">${esc(w.text[l])}</b><small dir="auto">${esc(w.text[o]||'')} · 🔊</small></button>
        <div class="speak-act">
        <div class="speak-status" id="speakStatus" aria-live="polite"></div>
        ${micOn?`<button class="speak-mic" id="speakMic" aria-label="${esc(t('talen.speaking.tapMic'))}"><span class="speak-mic-glyph" aria-hidden="true">🎤</span><span class="speak-wave" aria-hidden="true">${'<i></i>'.repeat(7)}</span></button><p class="speak-tip">${esc(t('talen.speaking.tapMic'))}</p>`
          :`<button class="talen-start" id="speakSaid">✅ ${esc(t('talen.speaking.iSaidIt'))}</button>`}
        <div class="speak-after" hidden><button class="talen-start secondary" id="speakAgain">${K.icon('repeat')} ${esc(t('talen.speaking.tryAgain'))}</button><button class="talen-start" id="speakNext">${esc(t('talen.speaking.next'))} ›</button></div>
        </div>
      </div>`);
    const status=f.querySelector('#speakStatus'),after=f.querySelector('.speak-after'),mic=f.querySelector('#speakMic');
    const hear=()=>{K.stopSpeech();K.playClips([audio(l,w.id)])};
    f.querySelector('#speakHear').onclick=()=>{K.sfx('tap');hear()};
    const success=()=>{
      g.done++;const rec=speakRec(true);rec.practised++;rec.lastPlayed=Date.now();K.save();
      status.className='speak-status good';status.textContent=`🌟 ${t('talen.speaking.goodPractice')}`;
      after.hidden=false;mic&&(mic.disabled=true);f.querySelector('#speakSaid')?.setAttribute('hidden','');
      K.sfx('good');K.playClips([kit().vary('goed',T().praise)]);
    };
    f.querySelector('#speakSaid')?.addEventListener('click',()=>{K.sfx('tap');success()});
    mic?.addEventListener('click',async()=>{
      if(speechPractice.active()){speechPractice.stop();return}
      K.stopSpeech();
      mic.classList.add('live');mic.setAttribute('aria-pressed','true');
      status.className='speak-status live';status.innerHTML=`<span class="speak-dot" aria-hidden="true"></span>${esc(t('talen.speaking.listening'))} <span class="sr-only">${esc(t('talen.speaking.micActive'))}</span>`;
      const bars=[...mic.querySelectorAll('.speak-wave i')];
      let res;
      try{res=await speechPractice.start({onLevel:v=>bars.forEach((b,k)=>b.style.setProperty('--h',String(.15+v*(.6+.4*Math.sin((Date.now()/90)+k)))))})}
      catch(e){micOff();return}
      if(!f.isConnected)return;
      mic.classList.remove('live');mic.removeAttribute('aria-pressed');
      bars.forEach(b=>b.style.removeProperty('--h'));
      if(res===null)return;   // cancelled: the screen changed
      if(res.heard)success();
      else{status.className='speak-status try';status.textContent=t('talen.speaking.notHeard');}
    });
    f.querySelector('#speakAgain').onclick=()=>{K.sfx('tap');speakItem()};
    f.querySelector('#speakNext').onclick=()=>{K.sfx('tap');g.i++;g.i<g.words.length?speakItem():speakFinish()};
    hear();
  }

  function speakFinish(){
    const g=K.talenSpeak,n=g.words.length;
    const rec=speakRec(true);rec.completed++;rec.lastPlayed=Date.now();
    const stars=g.done>=n?3:g.done>=n/2?2:1,xp=g.done*2+5,coins=3;
    K.awardPoints(xp);K.awardCoins(coins);K.touchStreak();K.save();
    resultScreen({icon:SET_ICON[g.set]||'🎤',title:t('talen.speaking.done'),stars,stat:`${g.done}/${n}`,statLabel:t('talen.section.speaking'),xp,
      again:()=>K.startTalenSpeak(g.set),back:()=>K.showTalenSpeak(),againLabel:t('talen.speaking.tryAgain')});
  }
})();
