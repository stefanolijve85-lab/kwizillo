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
    const a=own();if(!T().langs.includes(a))return null;
    const l=K.state.learnLang;return l&&l!==a&&T().langs.includes(l)?l:T().defaultLearn[a]||null;
  };
  const learn=()=>K.talenLearnLang();
  // The language the child speaks (2026-10-10): the meanings, the praise and Milo's
  // lines in Talen. The app language, unless the child picks another one in Talen.
  K.talenSpeakLang=()=>{const s=K.state.talenSpeak;return s&&T().langs.includes(s)?s:app()};
  const own=()=>K.talenSpeakLang();
  const store=()=>{const p=K.progress();p.talen||={themes:{},words:{}};p.talen.themes||={};p.talen.words||={};return p.talen};
  // "Alles door elkaar": a lesson with words from every theme, like the mix of
  // all worlds in the other games. Premium (premium.js: only the animals are free).
  const MIX={id:'mix',icon:'🌍'};
  const theme=id=>id==='mix'?MIX:T().themes.find(x=>x.id===id);
  // Stars per theme are kept per learning language ("en:dieren"): a child who
  // switches from English to German starts German with an empty stamp. Phase 1
  // kept them per theme only; such a record belongs to the language learned then.
  const themeRec=(id,make=false)=>{
    const s=store(),l=learn(),k=`${l}:${id}`;
    if(!s.themes[k]&&s.themes[id]&&l){s.themes[k]=s.themes[id];delete s.themes[id]}
    return s.themes[k]||(make?(s.themes[k]={stars:0,played:0}):null);
  };
  const word=id=>T().themes.flatMap(x=>x.words).find(w=>w.id===id);
  const audio=(lang,name,guide)=>K.talenAudio(lang,name,guide||(K.state.voice==='Luna'?'Luna':null));   // Luna's clips live in <lang>/luna/, Milo's (and Stil's, for the words) in <lang>/
  // A theme can be played when it has its words; the free one always, the others with Premium.
  const ready=th=>th.words.length>=4;
  // A sentence theme (kind:'zin') has an emoji per sentence instead of a picture: the
  // child hears the sentence and taps what it means in their own language.
  const isZin=w=>!!w.emoji;
  const pic=(w,cls='')=>w.emoji?`<span class="talen-emoji ${cls}" aria-hidden="true">${w.emoji}</span>`:`<img class="${cls}" src="${w.img}" alt="" decoding="async">`;
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
  K.talenStamps=()=>{const th=T().themes;return {done:th.filter(x=>Number(themeRec(x.id)?.stars||0)>0).length,total:th.length}};

  // For the overviews (statistics, collection, achievements).
  K.talenSummary=()=>{
    const s=store(),l=learn();
    const words=l?learnedIds():[];
    const lessons=Object.values(s.themes).reduce((n,x)=>n+Number(x.played||0),0);
    return {learn:l,stamps:K.talenStamps(),words,lessons,themes:T().themes.map(th=>({id:th.id,icon:th.icon,ready:ready(th),stars:Number(themeRec(th.id)?.stars||0),img:th.words[0]?.img||null}))};
  };
  K.talenWord=word;
  K.talenHear=id=>hear(id);
  const hear=id=>{const l=learn(),w=word(id);if(!l||!w)return;K.playClips([audio(l,id),audio(own(),'_betekent'),audio(own(),id)],{gap:0})};
  const back=()=>{K.stopSpeech();K.sfx('tap');toThemes()};
  // Praise and "almost" vary: a random wording, never the one heard just before.
  const lastSaid={};
  const vary=(kind,n)=>{let i;do i=1+Math.floor(Math.random()*n);while(n>1&&i===lastSaid[kind]);lastSaid[kind]=i;return audio(own(),`_${kind}${i}`)};

  /* ---------------- Welke taal wil je leren? ---------------- */
  // The learning language is chosen here, in Talen, not in the parents' menu
  // (2026-10-09, Stefan: after choosing it there a child did not know what to
  // do next). A flag per language with "hello" in it; a tap says hello in that
  // language in the chosen guide's voice, and one big button opens the passport.
  const guideName=()=>t(K.state.voice==='Luna'?'voice.luna':'voice.milo');
  const langName=l=>{const n=t(`talen.lang.${l}`);return n.charAt(0).toLocaleUpperCase()+n.slice(1)};
  const flagOf=l=>(K.LANGUAGES.find(x=>x.id===l)||{}).flag||'🌍';
  // Since 2026-10-10 the child also says which language they speak: Milo then
  // gives the meanings and the praise in that one (every language has its own
  // recordings), whatever the app language is. Both choices on one screen.
  K.showTalenPick=()=>{
    K.audio.setTrack('play').catch(()=>{});
    K.stopSpeech();K.lastView='home';
    const first=!K.state.learnLang;
    const order=l=>l==='en'?0:l==='nl'?1:2;
    let speak=own(),pick=first?null:learn();
    const hello=word('hello');
    const flag=(l,attr,on)=>`<button class="talen-flag ${on?'active':''}" ${attr}="${l}" dir="auto"><span class="talen-flag-icon" aria-hidden="true">${flagOf(l)}</span><b>${esc(langName(l))}</b><small lang="${l}">${esc(hello?hello.text[l]:'')}!</small></button>`;
    const speaks=()=>[speak,...T().langs.filter(l=>l!==speak).sort((x,y)=>(x===app()?-1:y===app()?1:order(x)-order(y)))];
    const learns=()=>T().langs.filter(l=>l!==speak).sort((x,y)=>order(x)-order(y));
    const f=K.frame(`<section class="native-panel-screen memo-picker game-picker talen-pass talen-langpick fade-in">
      <div class="native-panel-glow"></div>
      <header class="panel-head"><button class="panel-back" aria-label="${esc(t('common.back'))}">${K.icon('back')}</button><div><h1 class="game-name">${esc(t('talen.title'))}</h1><p>${esc(t('talen.pickSub'))}</p></div><span class="panel-settings panel-spacer" aria-hidden="true"></span></header>
      <div class="panel-scroll">
        <h2 class="talen-section">${esc(t('talen.speakHead'))}</h2>
        <div class="talen-speaks"></div>
        <div class="talen-ask"><img class="mascot-face" src="${K.guideArt(K.state.voice)}" alt=""><b class="talen-ask-bubble">${esc(t('talen.pickTitle'))}</b></div>
        <div class="talen-flags"></div>
        <button class="talen-start talen-go" id="talenGo" hidden></button>
      </div>
      ${K.bottomNav('home')}
    </section>`);
    const go=f.querySelector('#talenGo'),speakRow=f.querySelector('.talen-speaks'),grid=f.querySelector('.talen-flags');
    const draw=()=>{
      speakRow.innerHTML=speaks().map(l=>flag(l,'data-speak',l===speak)).join('');
      grid.innerHTML=learns().map(l=>flag(l,'data-learn',l===pick)).join('');
      go.hidden=!pick;if(pick)go.innerHTML=`${esc(t('talen.pickGo',{lang:langName(pick)}))} ${K.icon('play')}`;
      speakRow.querySelectorAll('[data-speak]').forEach(b=>b.onclick=()=>{
        speak=b.dataset.speak;if(pick===speak)pick=null;
        K.stopSpeech();K.sfx('tap');if(hello)K.playClips([audio(speak,'hello')]);
        draw();speakRow.scrollTo?.({left:0,behavior:'smooth'});
      });
      grid.querySelectorAll('[data-learn]').forEach(b=>b.onclick=()=>{
        pick=b.dataset.learn;draw();
        K.stopSpeech();if(hello)K.playClips([audio(pick,'hello')]);
        go.scrollIntoView?.({block:'nearest',behavior:'smooth'});
      });
    };
    draw();
    f.querySelector('.panel-back').onclick=()=>{K.stopSpeech();K.sfx('tap');first?K.showHome():K.showTalen()};
    go.onclick=()=>{if(!pick)return;K.stopSpeech();K.sfx('world');K.state.talenSpeak=speak===app()?null:speak;K.state.learnLang=pick;K.save();K.showTalen()};
    K.bindNav(f);
  };

  /* ---------------- Taalpaspoort ---------------- */
  // The passport (2026-10-10): wide tiles per kind of lesson (words, sentences,
  // and later more: K.TALEN.categories), each opens its own themes.
  const starsOf=id=>Number(themeRec(id)?.stars||0);
  const badge=n=>`<span class="talen-stars" aria-label="${n}/3">${[1,2,3].map(i=>`<i class="${i<=n?'on':''}">★</i>`).join('')}</span>`;
  const catThemes=c=>T().themes.filter(th=>(th.kind||'woord')===c.kind);
  const firstVisit=()=>{
    // The first time the child chooses the languages; a child who already played
    // with the default (before the choice moved here) keeps it without asking.
    if(T().langs.includes(own())&&!K.state.learnLang){
      if(!Object.keys(store().themes).length&&!Object.keys(store().words).length){K.showTalenPick();return true}
      K.state.learnLang=learn();K.save();
    }
    return false;
  };
  const passport=(sub,body,onBack)=>{
    K.audio.setTrack('play').catch(()=>{});
    K.stopSpeech();K.lastView='home';
    const f=K.frame(`<section class="native-panel-screen memo-picker game-picker talen-pass fade-in">
      <div class="native-panel-glow"></div>
      <header class="panel-head"><button class="panel-back" aria-label="${esc(t('common.back'))}">${K.icon('back')}</button><div><h1 class="game-name">${esc(t('talen.title'))}</h1><p>${esc(sub)}</p></div><span class="panel-settings panel-spacer" aria-hidden="true"></span></header>
      <div class="panel-scroll">${body}</div>
      ${K.bottomNav('home')}
    </section>`);
    f.querySelector('.panel-back').onclick=()=>{K.stopSpeech();K.sfx('tap');onBack()};
    f.querySelector('#talenLang')?.addEventListener('click',()=>{K.sfx('tap');K.showTalenPick()});
    f.querySelectorAll('[data-theme]').forEach(b=>b.onclick=()=>{K.sfx('world');K.startTalen(b.dataset.theme)});
    f.querySelectorAll('[data-hear]').forEach(b=>b.onclick=()=>{K.sfx('tap');hear(b.dataset.hear)});
    K.bindNav(f);
    return f;
  };
  const passSub=l=>l?t(K.state.voice==='Luna'?'talen.passportSubLuna':'talen.passportSub',{lang:t(`talen.lang.${l}`)}):t('talen.soon');
  K.showTalen=()=>{
    if(firstVisit())return;
    K.talenCat=null;
    const l=learn();
    const catTile=c=>{
      const list=catThemes(c),done=list.filter(th=>starsOf(th.id)>0).length;
      const arts=list.slice(0,3).map(th=>th.cover||th.words[0].img);
      return `<button class="talen-cat" data-cat="${c.id}"><span class="talen-cat-copy"><b>${esc(t(`talen.section.${c.id}`))}</b><small>${esc(t('talen.catThemes',{n:list.length}))}${done?` · ★ ${done}/${list.length}`:''}</small></span><span class="talen-cat-fan" aria-hidden="true">${arts.map(a=>`<img src="${a}" alt="" decoding="async">`).join('')}</span><span class="talen-cat-go" aria-hidden="true">›</span></button>`;
    };
    const due=l?K.talenDue():[];
    const body=!l?`<div class="talen-soon-lang"><span aria-hidden="true">🌍</span><b>${esc(t('talen.soonLang'))}</b></div>`
      :`<button class="talen-lang-switch" id="talenLang"><span class="talen-flag-icon" aria-hidden="true">${flagOf(own())}</span><span class="talen-lang-arrow" aria-hidden="true">→</span><span class="talen-flag-icon" aria-hidden="true">${flagOf(l)}</span><b>${esc(langName(l))}</b><small>${esc(t('talen.switchLang'))}</small></button>
        <div class="talen-cats">${T().categories.filter(c=>catThemes(c).length).map(catTile).join('')}</div>
        ${due.length&&learnedIds().length>=4?`<section class="talen-review"><div><b>${esc(t('talen.review'))}</b><small>${esc(t('talen.reviewSub',{n:due.length}))}</small></div>
          <div class="talen-chips">${due.map(id=>`<button class="talen-chip" data-hear="${id}">${pic(word(id))}${esc(word(id).text[l])}</button>`).join('')}</div>
          <button class="talen-start secondary" id="talenReview">${K.icon('repeat')} ${esc(t('talen.review'))}</button></section>`:''}`;
    const f=passport(passSub(l),body,()=>K.showHome());
    f.querySelector('#talenReview')?.addEventListener('click',()=>{K.sfx('world');K.startTalen(null,{review:true})});
    f.querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>{K.sfx('tap');K.showTalenCat(b.dataset.cat)});
  };
  // One kind of lesson: its themes, the words with "Alles door elkaar" on top.
  K.showTalenCat=id=>{
    if(firstVisit())return;
    const l=learn(),c=T().categories.find(x=>x.id===id);
    if(!l||!c)return K.showTalen();
    K.talenCat=id;
    // Elk plaatje vult zijn hele tegel; een thema mag een eigen omslag hebben (`cover`).
    const tile=(id,img,label,{locked=false,cls=''}={})=>{const n=starsOf(id);return `<button class="memo-pick talen-pick fit ${cls} ${n?'done':''} ${locked?'locked':''}" data-theme="${id}" style="--art:url('${img}')"><img class="talen-pick-art" src="${img}" alt="" decoding="async"><span class="home-game-veil"></span>${locked?K.premiumBadge():''}${badge(n)}<b>${esc(label)}</b></button>`};
    const stampOf=th=>{
      if(!ready(th))return `<div class="memo-pick talen-pick soon"><span class="talen-stamp-icon" aria-hidden="true">${th.icon}</span><b>${esc(t(`talen.theme.${th.id}`))}</b></div>`;
      if(th.kind==='zin'&&!th.cover)return `<button class="memo-pick talen-pick zin ${starsOf(th.id)?'done':''} ${open(th)?'':'locked'}" data-theme="${th.id}"><span class="talen-stamp-icon" aria-hidden="true">${th.icon}</span><span class="home-game-veil"></span>${open(th)?'':K.premiumBadge()}${badge(starsOf(th.id))}<b>${esc(t(`talen.theme.${th.id}`))}</b></button>`;
      return tile(th.id,th.cover||th.words[0].img,t(`talen.theme.${th.id}`),{locked:!open(th),cls:th.kind==='zin'?'zin':''});
    };
    const mixTile=c.mix?`<button class="memo-pick mix talen-pick ${starsOf('mix')?'done':''} ${K.premium.can('talen','mix')?'':'locked'}" data-theme="mix"><img class="home-game-art" src="${K.GAME_ART.talen}" alt="" decoding="async"><span class="home-game-veil"></span>${K.premium.can('talen','mix')?'':K.premiumBadge()}${badge(starsOf('mix'))}<b>${esc(t('talen.theme.mix'))}</b></button>`:'';
    const list=catThemes(c);
    passport(passSub(l),`<h2 class="talen-section talen-cat-title">${esc(t(`talen.section.${c.id}`))}</h2>${mixTile}<div class="memo-pick-grid talen-picks ${c.kind==='zin'?'zinnen':''}">${list.map(stampOf).join('')}</div>`,()=>{K.talenCat=null;K.showTalen()});
  };
  // Back from a lesson: to the themes it came from.
  const toThemes=()=>K.talenCat?K.showTalenCat(K.talenCat):K.showTalen();

  /* ---------------- Hoor en tik ---------------- */
  // review: up to eight words that are due, with distractors from everything learned.
  K.startTalen=(themeId,{review=false}={})=>{
    const l=learn();if(!l)return K.showTalen();
    let pool,words;
    if(review){pool=learnedIds().map(word);words=shuffle(K.talenDue().map(word)).slice(0,T().rounds)}
    else{
      if(themeId==='mix'){
        if(!K.premium.can('talen','mix')){K.premiumLocked({kind:'talen',retry:()=>K.startTalen('mix')});return}
        pool=T().themes.filter(x=>ready(x)&&x.kind!=='zin').flatMap(x=>x.words);   // words only: a sentence among pictures would give itself away
      }else{
        const th=theme(themeId);if(!th||!ready(th))return K.showTalen();
        if(!open(th)){K.premiumLocked({kind:'talen',retry:()=>K.startTalen(themeId)});return}
        pool=th.words;
      }
      words=shuffle(pool).slice(0,T().rounds);
    }
    if(pool.length<4||!words.length)return K.showTalen();
    if(review)words=words.filter(w=>pool.filter(x=>isZin(x)===isZin(w)).length>=4);   // a review round needs three others of its kind
    if(!words.length)return K.showTalen();
    K.audio.setTrack('play').catch(()=>{});
    K.talen={theme:review?null:themeId,review,pool,words,round:0,firstTry:0,missed:false,locked:false,intro:true};
    showRound();
  };
  K.talenForTest=()=>K.talen;

  function showRound(){
    const g=K.talen,w=g.words[g.round],l=learn();
    g.missed=false;g.locked=false;
    const zin=isZin(w);
    const opts=shuffle([w,...shuffle(g.pool.filter(x=>x.id!==w.id&&isZin(x)===zin)).slice(0,3)]);
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
          <div class="whoami-grid">${opts.map(o=>zin
            // a sentence: its meaning is on the card from the start, the sentence itself appears once it is found
            ?`<button class="whoami-tile talen-tile zin" data-pick="${o.id}" aria-label="${esc(o.text[own()])}">${pic(o)}<b class="talen-meaning">${esc(o.text[own()])}</b><b class="talen-label"><span>${esc(o.text[l])}</span></b></button>`
            :`<button class="whoami-tile talen-tile fit" data-pick="${o.id}" aria-label="${esc(t('talen.picture'))}" style="--art:url('${o.img}')"><img src="${o.img}" alt="" decoding="async"><b class="talen-label"><span>${esc(o.text[l])}</span><small>${esc(t('talen.means',{word:o.text[own()]}))}</small></b></button>`).join('')}</div>
          <div class="quiz-actions whoami-actions talen-actions"><button class="action repeat" id="talenReplay">${K.icon('repeat')} ${esc(t('talen.replay'))}</button><button class="action hint" id="talenHint">${K.icon('bulb')} ${esc(t('quiz.hint'))}</button></div>
        </main>
      </div>
    </section>`);
    K.audio.setSteady(true);   // the music stays as soft as under the voice the whole lesson, not louder between the words
    const say=f.querySelector('#talenSay'),milo=f.querySelector('.talen-milo');
    const talking=on=>{say.classList.toggle('pulse',on);milo.classList.toggle('talking',on)};
    // decoded now, while the child listens and looks: the answer sentence is joined from these at once
    K.preloadClips?.([...(g.intro?[audio(own(),zin?'_intro_zin':'_intro')]:[]),audio(l,w.id),audio(own(),'_betekent'),audio(own(),w.id),...Array.from({length:T().praise},(_,i)=>audio(own(),`_goed${i+1}`)),...Array.from({length:T().almost},(_,i)=>audio(own(),`_bijna${i+1}`))]);
    const speakWord=async()=>{
      talking(true);
      const clips=[];if(g.intro){g.intro=false;clips.push(audio(own(),zin?'_intro_zin':'_intro'))}
      clips.push(audio(l,w.id));
      await K.playClips(clips,{gap:200});
      if(f.isConnected)talking(false);
    };
    f.querySelector('#talenBack').onclick=back;
    say.onclick=()=>{if(!g.locked)speakWord()};
    f.querySelector('#talenReplay').onclick=()=>{K.sfx('tap');if(!g.locked)speakWord()};
    // Hint: one wrong picture fades away (two at most, so a choice is left). The
    // word then no longer counts as right first time, like a wrong tap.
    const hintBtn=f.querySelector('#talenHint');
    hintBtn.onclick=()=>{
      if(g.locked)return;
      const wrong=[...f.querySelectorAll('.talen-tile')].filter(b=>b.dataset.pick!==w.id&&!b.disabled);
      if(wrong.length<=1){hintBtn.disabled=true;return}
      K.sfx('tap');g.missed=true;
      const b=wrong[Math.floor(Math.random()*wrong.length)];b.classList.add('hinted');b.disabled=true;
      if(wrong.length<=2)hintBtn.disabled=true;
      speakWord();
    };
    f.querySelectorAll('[data-pick]').forEach(b=>b.onclick=async()=>{
      if(g.locked||b.classList.contains('wrong'))return;
      if(b.dataset.pick===w.id){
        g.locked=true;if(!g.missed)g.firstTry++;
        remember(w.id,!g.missed);K.save();
        b.classList.add('correct');
        // "parrot betekent papegaai" is written out piece by piece as Milo says it
        const [pre,post]=t('talen.means',{word:'\u0000'}).split('\u0000');
        say.innerHTML=`<span class="talen-line"><b class="talen-piece" data-at="1">${esc(w.text[l])}</b> <span class="talen-piece" data-at="2">${esc(pre.trim())}</span> <b class="talen-piece native" data-at="3">${esc(w.text[own()])}</b>${post?`<span class="talen-piece" data-at="3">${esc(post)}</span>`:''}</span>`;
        const show=i=>say.querySelectorAll(`.talen-piece[data-at="${i}"]`).forEach(x=>x.classList.add('on'));
        const r=b.getBoundingClientRect(),fr=f.getBoundingClientRect();
        K.celebrateAt?.(f,{x:r.left-fr.left+r.width/2,y:r.top-fr.top+r.height/2,count:18});
        talking(true);
        // praise (one of ten), the word, "betekent", the word in the child's own language (the handover's exact order)
        const done=await K.playClips([vary('goed',T().praise),audio(l,w.id),audio(own(),'_betekent'),audio(own(),w.id)],{gap:[60,0,0],onClip:show});   // one flowing sentence: silent ends cut off, the words straight after each other, nothing on top of each other
        for(const i of [1,2,3])show(i);   // all of it in view once the sentence is over (also when it was not heard)
        if(!f.isConnected||K.talen!==g)return;
        talking(false);
        if(done===false&&!f.isConnected)return;
        await new Promise(r=>setTimeout(r,450));
        if(!f.isConnected||K.talen!==g)return;
        g.round++;
        if(g.round<g.words.length)showRound();else finish();
      }else{
        g.missed=true;b.classList.add('wrong');b.disabled=true;
        talking(true);await K.playClips([vary('bijna',T().almost),audio(l,w.id)],{gap:30});if(f.isConnected)talking(false);
      }
    });
    speakWord();
  }

  function finish(){
    const g=K.talen,n=g.words.length;
    // 8 rounds: 7-8 right first time = 3 stars, 5-6 = 2, otherwise 1 (scaled for a shorter review)
    const share=g.firstTry/n,stars=share>=7/8?3:share>=5/8?2:1;
    if(g.theme){const th=themeRec(g.theme,true);th.played++;th.stars=Math.max(th.stars||0,stars)}
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
        <div class="talen-learned">${g.words.map(w=>`<button class="talen-chip" data-hear="${w.id}" aria-label="${esc(w.text[l])}, ${esc(t('talen.means',{word:w.text[own()]}))}">${pic(w)}<span><b>${esc(w.text[l])}</b><small>${esc(w.text[own()])} 🔊</small></span></button>`).join('')}</div>
        <div class="result-native">
          <button id="againBtn">${esc(g.theme?t('talen.again',{theme:t(`talen.theme.${g.theme}`)}):t('talen.review'))}</button>
          <button id="passBtn" class="secondary">${esc(t('talen.passport'))}</button>
        </div>
      </div>
    </section>`);
    K.sfx('reward');setTimeout(()=>K.celebrate?.('quiz',f.querySelector('.result-stage')),250);
    // the closing line in the chosen guide's voice; a silent guide stays silent
    if(g.theme&&K.state.voice!=='Stil')setTimeout(()=>{if(f.isConnected)K.playClips([g.theme==='mix'?vary('goed',T().praise):audio(own(),`_klaar_${g.theme}`,K.state.voice==='Luna'?'Luna':'Milo')])},700);
    f.querySelectorAll('[data-hear]').forEach(b=>b.onclick=()=>{K.sfx('tap');hear(b.dataset.hear)});
    f.querySelector('#againBtn').onclick=()=>{K.sfx('tap');g.theme?K.startTalen(g.theme):K.startTalen(null,{review:true})};
    f.querySelector('#passBtn').onclick=back;
  }
})();
