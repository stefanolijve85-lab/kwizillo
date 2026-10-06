(()=>{
  const K=window.KWIZILLO_M1;
  if(!K) return;
  // Talen, phase 1 ("Leer Engels met Milo"): the passport with a stamp per theme
  // and the game "Hoor en tik". Everything works without reading: Milo says a
  // word in the language being learned, the child taps its picture. The rules,
  // the order of the sounds and the timing follow the prototype in the handover.
  const t=(k,v)=>K.t(k,v);
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
  const T=()=>K.TALEN;
  const app=()=>K.state.language;
  // The language the child learns: the parent's choice, else the default for the app language.
  // null when the app language has no learning language yet (phase 1: Dutch and English only).
  K.talenLearnLang=()=>{
    const a=app();if(!T().langs.includes(a))return null;
    const l=K.state.learnLang;return l&&l!==a&&T().langs.includes(l)?l:T().defaultLearn[a]||null;
  };
  const learn=()=>K.talenLearnLang();
  const store=()=>{const p=K.progress();p.talen||={themes:{},words:{}};p.talen.themes||={};p.talen.words||={};return p.talen};
  const theme=id=>T().themes.find(x=>x.id===id);
  const word=id=>T().themes.flatMap(x=>x.words).find(w=>w.id===id);
  const audio=(lang,name,guide)=>K.talenAudio(lang,name,guide);
  // A theme can be played when it has its words; the free one always, the others with Premium.
  const ready=th=>th.words.length>=4;
  const open=th=>ready(th)&&(th.free||K.premium.can('talen',th.id));
  // The scene behind a lesson: the world the theme belongs to (the animals: Dierenwereld).
  const SCENE={dieren:'dieren'};
  const sceneOf=g=>K.MASTER?.[SCENE[g.theme]]||K.GAME_ART.talen;

  // ---- Repetition (Leitner): box 1..5, due again after 1, 2, 4, 7, 14 days.
  const DAYS=[1,2,4,7,14];
  const key=id=>`${learn()}:${id}`;
  function remember(id,firstTryOk){
    const s=store(),k=key(id),r=s.words[k]||={seen:0,firstTryOk:0,lastSeen:0,box:1};
    r.seen++;r.lastSeen=Date.now();
    if(firstTryOk){r.firstTryOk++;r.box=Math.min(5,(r.box||1)+1)}else r.box=1;
  }
  const learnedIds=()=>{const pre=`${learn()}:`;return Object.keys(store().words).filter(k=>k.startsWith(pre)).map(k=>k.slice(pre.length)).filter(word)};
  K.talenDue=(now=Date.now())=>learnedIds().filter(id=>{const r=store().words[key(id)];return now-(r.lastSeen||0)>=DAYS[Math.max(1,Math.min(5,r.box||1))-1]*864e5}).slice(0,8);
  // Stamps for the Home tile: themes with at least one star, out of all themes.
  K.talenStamps=()=>{const th=T().themes;return {done:th.filter(x=>Number(store().themes[x.id]?.stars||0)>0).length,total:th.length}};

  // For the overviews (statistics, collection, achievements).
  K.talenSummary=()=>{
    const s=store(),l=learn();
    const words=l?learnedIds():[];
    const lessons=Object.values(s.themes).reduce((n,x)=>n+Number(x.played||0),0);
    return {learn:l,stamps:K.talenStamps(),words,lessons,themes:T().themes.map(th=>({id:th.id,icon:th.icon,ready:ready(th),stars:Number(s.themes[th.id]?.stars||0),img:th.words[0]?.img||null}))};
  };
  K.talenWord=word;
  K.talenHear=id=>hear(id);
  const hear=id=>{const l=learn(),w=word(id);if(!l||!w)return;K.playClips([audio(l,id),audio(app(),'_betekent'),audio(app(),id)])};
  const back=()=>{K.stopSpeech();K.sfx('tap');K.showTalen()};

  /* ---------------- Taalpaspoort ---------------- */
  K.showTalen=()=>{
    K.audio.setTrack('play').catch(()=>{});
    K.stopSpeech();K.lastView='home';
    const l=learn();
    const s=store();
    const stamps=T().themes.map(th=>{
      const stars=Number(s.themes[th.id]?.stars||0);
      if(!ready(th))return `<div class="talen-stamp soon"><span class="talen-stamp-icon" aria-hidden="true">${th.icon}</span><b>${esc(t(`talen.theme.${th.id}`))}</b><small>${esc(t('talen.soon'))}</small></div>`;
      const locked=!open(th);
      return `<button class="talen-stamp ${stars?'done':''} ${locked?'locked':''}" data-theme="${th.id}"><img src="${th.words[0].img}" alt="" decoding="async">${locked?K.premiumBadge():''}<b>${esc(t(`talen.theme.${th.id}`))}</b><span class="talen-stars" aria-label="${stars}/3">${[1,2,3].map(n=>`<i class="${n<=stars?'on':''}">★</i>`).join('')}</span></button>`;
    }).join('');
    const first=T().themes.find(ready);
    const played=Number(s.themes[first?.id]?.stars||0)>0;
    const due=l?K.talenDue():[];
    const body=!l?`<div class="talen-soon-lang"><span aria-hidden="true">🌍</span><b>${esc(t('talen.soonLang'))}</b></div>`
      :`<p class="talen-msg">${esc(t(played?'talen.msgPlayed':'talen.msgNew'))}</p>
        <div class="talen-stamps">${stamps}</div>
        <button class="talen-start" id="talenStart">${K.icon('play')} ${esc(played?t('talen.again',{theme:t(`talen.theme.${first.id}`)}):t('talen.start'))}</button>
        ${due.length&&learnedIds().length>=4?`<section class="talen-review"><div><b>${esc(t('talen.review'))}</b><small>${esc(t('talen.reviewSub',{n:due.length}))}</small></div>
          <div class="talen-chips">${due.map(id=>`<button class="talen-chip" data-hear="${id}"><img src="${word(id).img}" alt="">${esc(word(id).text[l])}</button>`).join('')}</div>
          <button class="talen-start secondary" id="talenReview">${K.icon('repeat')} ${esc(t('talen.review'))}</button></section>`:''}`;
    const f=K.frame(`<section class="native-panel-screen memo-picker game-picker talen-pass fade-in">
      <div class="native-panel-glow"></div>
      <header class="panel-head"><button class="panel-back" aria-label="${esc(t('common.back'))}">${K.icon('back')}</button><div><div class="panel-kicker">${esc(t('talen.title'))}</div><h1>${esc(t('talen.passport'))}</h1><p>${esc(l?t('talen.passportSub',{lang:t(`talen.lang.${l}`)}):t('talen.soon'))}</p></div><span class="panel-settings panel-spacer" aria-hidden="true"></span></header>
      <div class="panel-scroll talen-scroll">${body}</div>
      ${K.bottomNav('home')}
    </section>`);
    f.querySelector('.panel-back').onclick=()=>{K.stopSpeech();K.sfx('tap');K.showHome()};
    f.querySelector('#talenStart')?.addEventListener('click',()=>{K.sfx('world');K.startTalen(first.id)});
    f.querySelector('#talenReview')?.addEventListener('click',()=>{K.sfx('world');K.startTalen(null,{review:true})});
    f.querySelectorAll('[data-theme]').forEach(b=>b.onclick=()=>{K.sfx('world');K.startTalen(b.dataset.theme)});
    f.querySelectorAll('[data-hear]').forEach(b=>b.onclick=()=>{K.sfx('tap');hear(b.dataset.hear)});
    K.bindNav(f);
  };

  /* ---------------- Hoor en tik ---------------- */
  // review: up to eight words that are due, with distractors from everything learned.
  K.startTalen=(themeId,{review=false}={})=>{
    const l=learn();if(!l)return K.showTalen();
    let pool,words;
    if(review){pool=learnedIds().map(word);words=shuffle(K.talenDue().map(word)).slice(0,T().rounds)}
    else{
      const th=theme(themeId);if(!th||!ready(th))return K.showTalen();
      if(!open(th)){K.premiumLocked({kind:'talen',retry:()=>K.startTalen(themeId)});return}
      pool=th.words;words=shuffle(th.words).slice(0,T().rounds);
    }
    if(pool.length<4||!words.length)return K.showTalen();
    K.audio.setTrack('play').catch(()=>{});
    K.talen={theme:review?null:themeId,review,pool,words,round:0,firstTry:0,missed:false,locked:false,intro:true};
    showRound();
  };
  K.talenForTest=()=>K.talen;

  function showRound(){
    const g=K.talen,w=g.words[g.round],l=learn();
    g.missed=false;g.locked=false;
    const opts=shuffle([w,...shuffle(g.pool.filter(x=>x.id!==w.id)).slice(0,3)]);
    const pct=Math.round(g.round/g.words.length*100);
    const f=K.frame(`<section class="quiz-v2 whoami talen-game fade-in">
      <img class="quiz-v2-bg" src="${sceneOf(g)}" alt="">
      <div class="quiz-v2-dim"></div>
      <div class="quiz-v2-ui">
        <header class="quiz-v2-head">
          <button class="quiz-back" id="talenBack" aria-label="${esc(t('common.back'))}">${K.icon('back')}</button>
          <div class="quiz-brand"><span>${esc(t('talen.title'))}</span><small>${esc(g.review?t('talen.review'):t(`talen.theme.${g.theme}`))}</small></div>
          <div class="quiz-meta"><b>${esc(t('talen.round',{n:g.round+1,total:g.words.length}))}</b><b>⭐ ${g.firstTry}</b></div>
        </header>
        <div class="quiz-progress"><strong>${esc(t('talen.round',{n:g.round+1,total:g.words.length}))}</strong><div><i style="width:${pct}%"></i></div><span>🔊</span></div>
        <main class="quiz-card whoami-card talen-card">
          <div class="whoami-guide"><img class="mascot-face talen-milo" src="${K.MASCOT_ART.milo}" alt=""><button class="whoami-bubble talen-say" id="talenSay" aria-label="${esc(t('talen.listen'))}"><span aria-hidden="true">🔊</span></button></div>
          <div class="whoami-grid">${opts.map(o=>`<button class="whoami-tile talen-tile" data-pick="${o.id}" aria-label="${esc(t('talen.picture'))}"><img src="${o.img}" alt="" decoding="async"><b class="talen-label"><span>${esc(o.text[l])}</span><small>${esc(t('talen.means',{word:o.text[app()]}))}</small></b></button>`).join('')}</div>
          <div class="quiz-actions whoami-actions talen-actions"><button class="action repeat" id="talenReplay">${K.icon('repeat')} ${esc(t('talen.replay'))}</button></div>
        </main>
      </div>
    </section>`);
    const say=f.querySelector('#talenSay'),milo=f.querySelector('.talen-milo');
    const talking=on=>{say.classList.toggle('pulse',on);milo.classList.toggle('talking',on)};
    const speakWord=async()=>{
      talking(true);
      const clips=[];if(g.intro){g.intro=false;clips.push(audio(app(),'_intro'))}
      clips.push(audio(l,w.id));
      await K.playClips(clips,{gap:260});
      if(f.isConnected)talking(false);
    };
    f.querySelector('#talenBack').onclick=back;
    say.onclick=()=>{if(!g.locked)speakWord()};
    f.querySelector('#talenReplay').onclick=()=>{K.sfx('tap');if(!g.locked)speakWord()};
    f.querySelectorAll('[data-pick]').forEach(b=>b.onclick=async()=>{
      if(g.locked||b.classList.contains('wrong'))return;
      if(b.dataset.pick===w.id){
        g.locked=true;if(!g.missed)g.firstTry++;
        remember(w.id,!g.missed);K.save();
        b.classList.add('correct');say.innerHTML=`<span>${esc(w.text[l])}</span>`;
        const r=b.getBoundingClientRect(),fr=f.getBoundingClientRect();
        K.celebrateAt?.(f,{x:r.left-fr.left+r.width/2,y:r.top-fr.top+r.height/2,count:18});
        talking(true);
        // praise, the word, "betekent", the word in the child's own language (the handover's exact order)
        const done=await K.playClips([audio(app(),g.round%2?'_super':'_goedzo'),audio(l,w.id),audio(app(),'_betekent'),audio(app(),w.id)],{gap:200});
        if(!f.isConnected||K.talen!==g)return;
        talking(false);
        if(done===false&&!f.isConnected)return;
        await new Promise(r=>setTimeout(r,450));
        if(!f.isConnected||K.talen!==g)return;
        g.round++;
        if(g.round<g.words.length)showRound();else finish();
      }else{
        g.missed=true;b.classList.add('wrong');b.disabled=true;
        talking(true);await K.playClips([audio(app(),'_bijna'),audio(l,w.id)],{gap:200});if(f.isConnected)talking(false);
      }
    });
    speakWord();
  }

  function finish(){
    const g=K.talen,n=g.words.length;
    // 8 rounds: 7-8 right first time = 3 stars, 5-6 = 2, otherwise 1 (scaled for a shorter review)
    const share=g.firstTry/n,stars=share>=7/8?3:share>=5/8?2:1;
    if(g.theme){const th=store().themes[g.theme]||={stars:0,played:0};th.played++;th.stars=Math.max(th.stars||0,stars)}
    const xp=stars*6+n,coins=stars*3;
    K.awardPoints(xp);K.awardCoins(coins);K.touchStreak();K.save();
    const l=learn();
    const f=K.frame(`<section class="result-v2 talen-result fade-in is-pass">
      <img class="result-v2-bg" src="${sceneOf(g)}" alt="">
      <div class="result-v2-dim"></div>
      <div class="result-v2-card">
        <div class="result-stage open"><div class="result-mascot"><img class="mascot-face large" src="${K.guideArt(K.state.voice)}" alt=""></div><span class="talen-stamp-fly" aria-hidden="true">${g.theme?theme(g.theme).icon:'🔁'}</span></div>
        <div class="result-kicker">${esc(t('talen.title'))}</div>
        <h1>${esc(g.theme?t(`talen.done.${g.theme}`):t('talen.reviewDone'))}</h1>
        <div class="result-stars">${[1,2,3].map(k=>`<i class="${k<=stars?'on':''}">★</i>`).join('')}</div>
        <div class="result-stats"><span><b>${g.firstTry}/${n}</b><small>${esc(t('talen.firstTry'))}</small></span><span><b>+${xp}</b><small>${esc(t('result.xp'))}</small></span><span><b>${Number(K.state.coins||0)}</b><small>${esc(t('result.coins'))}</small></span></div>
        <p class="result-rule">${esc(t('talen.learned'))}</p>
        <div class="talen-learned">${g.words.map(w=>`<button class="talen-chip" data-hear="${w.id}"><img src="${w.img}" alt=""><span><b>${esc(w.text[l])}</b><small>${esc(t('talen.means',{word:w.text[app()]}))} 🔊</small></span></button>`).join('')}</div>
        <div class="result-native">
          <button id="againBtn">${esc(g.theme?t('talen.again',{theme:t(`talen.theme.${g.theme}`)}):t('talen.review'))}</button>
          <button id="passBtn" class="secondary">${esc(t('talen.passport'))}</button>
        </div>
      </div>
    </section>`);
    K.sfx('reward');setTimeout(()=>K.celebrate?.('quiz',f.querySelector('.result-stage')),250);
    // the closing line in the chosen guide's voice; a silent guide stays silent
    if(g.theme&&K.state.voice!=='Stil')setTimeout(()=>{if(f.isConnected)K.playClips([audio(app(),`_klaar_${g.theme}`,K.state.voice==='Luna'?'Luna':'Milo')])},700);
    f.querySelectorAll('[data-hear]').forEach(b=>b.onclick=()=>{K.sfx('tap');hear(b.dataset.hear)});
    f.querySelector('#againBtn').onclick=()=>{K.sfx('tap');g.theme?K.startTalen(g.theme):K.startTalen(null,{review:true})};
    f.querySelector('#passBtn').onclick=back;
  }
})();
