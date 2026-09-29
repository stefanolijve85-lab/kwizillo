(()=>{
  const K=window.KWIZILLO_M1;
  if(!K) return;
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const t=(k,p)=>K.t(k,p);

  // Weetjes: one fun fact at a time on a world-art card, read aloud by the
  // guide. The bank (facts.js) is aligned across languages, so a fact keeps its
  // id `${world}-${index}` whatever language is on; "discovered" facts are kept
  // in progress.factsSeen. New facts come first; once every fact of the chosen
  // set has been seen they simply come round again.
  // Only the worlds that have fact cards; a world whose weetjes are still
  // being written keeps its chip out of the row instead of showing an empty set.
  // De werelden waarvoor weetjes geschreven zijn. De kiezer op Home leest deze
  // ook, zodat er nooit een wereld aangeboden wordt die niets te tonen heeft.
  const WORLDS=()=>K.WORLDS.filter(w=>(bank()[w]||[]).length);
  K.factWorlds=WORLDS;
  const WORLD_EMOJI={ruimte:'🚀',dieren:'🦁',aarde:'🌍',geschiedenis:'🏰',wetenschap:'🔬',mysterie:'🔮',kunst:'🎨',sport:'🏅'};
  const bank=()=>window.KWIZILLO_FACTS?.[K.state.language]||window.KWIZILLO_FACTS?.nl||{};
  const seenMap=()=>{const P=K.progress();P.factsSeen||={};return P.factsSeen};
  // Every fact of a world (or all), and the ones this player may read: Free gets
  // the whole starter world and the first few of every other world.
  K.factsAll=world=>{
    const b=bank();
    const list=[];
    for(const w of (world&&world!=='all'?[world]:WORLDS())) (b[w]||[]).forEach((f,i)=>list.push({id:`${w}-${i}`,world:w,e:f.e,t:f.t}));
    return list;
  };
  K.facts=world=>K.factsAll(world).filter(f=>K.premium.can('fact',f.world,Number(String(f.id).split('-').pop())));
  K.factsSeenCount=world=>{const seen=seenMap();return K.facts(world).filter(f=>seen[f.id]).length};
  // Picks the next fact: an unseen one when there is any, else any not in `avoid`.
  K.pickFact=(world,avoid)=>{
    const all=K.facts(world);
    if(!all.length) return null;
    const skip=new Set([].concat(avoid||[]));
    const seen=seenMap();
    let pool=all.filter(f=>!seen[f.id]&&!skip.has(f.id));
    if(!pool.length) pool=all.filter(f=>!skip.has(f.id));
    if(!pool.length) pool=all;
    return pool[Math.floor(Math.random()*pool.length)];
  };
  K.markFactSeen=fact=>{if(!fact)return;const seen=seenMap();if(!seen[fact.id]){seen[fact.id]=true;K.save()}};
  // "Wist je dat…" is said once, when the screen opens; every next fact is just the fact.
  const factSpeech=(fact,kicker=false)=>kicker?`${t('facts.kicker')} ${fact.t}`:fact.t;
  // Spoken by whichever guide the child chose; silent for "Stil".
  const readFact=(fact,kicker=false)=>{K.stopSpeech();return K.speak(factSpeech(fact,kicker)).catch(()=>{})};
  // The next facts are chosen ahead of time and their voice lines warmed, so
  // "Volgend weetje" (and the first fact when the screen opens) starts talking
  // at once instead of after a round trip to the speech service. One queue per
  // world; a queue is dropped when the language or the voice changes, because
  // the warmed lines would no longer match.
  const ahead={};let aheadKey='';
  const queueFor=world=>{const key=`${K.state.language}|${K.state.voice}`;if(key!==aheadKey){for(const k in ahead)delete ahead[k];aheadKey=key}return ahead[world]||=[]};
  K.warmFacts=(world='all',current=null,n=2)=>{
    const q=queueFor(world);
    while(q.length<n){
      const f=K.pickFact(world,[current?.id,...q.map(x=>x.id)].filter(Boolean));
      if(!f||q.some(x=>x.id===f.id))break;
      q.push(f);
    }
    K.prefetchSpeech(q.map(f=>factSpeech(f)));
    for(const f of q){const i=new Image();i.src=K.factArt(f)}   // the pictures too
    return q;
  };
  // Every fact has its own portrait illustration (assets/facts/<id>.jpg, made
  // from tools/fact-art-prompts.json); the world's hero art stands in should
  // one ever be missing.
  // With the version stamp: a replaced picture keeps its file name, and art is cached for a day.
  K.factArt=fact=>K.assetUrl(`assets/facts/${fact.id}.jpg`);
  const nextFact=(world,current)=>{const q=queueFor(world);let f=q.shift();while(f&&current&&f.id===current.id)f=q.shift();return f||K.pickFact(world,current?.id)};

  const card=(fact,{fresh})=>`<article class="fact-card fact-${fact.world} fade-in" data-fact="${fact.id}">
      <img class="fact-art" src="${K.factArt(fact)}" alt="" decoding="async" onerror="this.onerror=null;this.src='${K.MASTER[fact.world]}'">
      <span class="fact-veil"></span>
      <div class="fact-body">
        <div class="fact-top"><span class="fact-world">${WORLD_EMOJI[fact.world]} ${esc(t(`world.${fact.world}.title`))}</span>${fresh?`<span class="fact-new">${esc(t('facts.new'))}</span>`:''}</div>
        <div class="fact-kicker">${esc(t('facts.kicker'))}</div>
        <p class="fact-text">${esc(fact.t)}</p>
      </div>
    </article>`;

  // `open` shows that fact first (the result screen's bonus fact, in full).
  K.showFacts=(world='all',{open}={})=>{
    // Een wereld zonder weetjes gaf ooit een leeg scherm (kunst en sport kwamen
    // later). Dan maar alle weetjes: er valt altijd iets te ontdekken.
    if(world!=='all'&&!WORLDS().includes(world)) world='all';
    K.audio.setTrack('play').catch(()=>{});
    K.stopSpeech();K.lastView='facts';
    K.state.factsWorld=world;K.save();
    let current=null,firstShown=true;
    const total=K.facts(world).length;
    const f=K.frame(`<section class="native-panel-screen facts-screen fade-in">
      <div class="native-panel-glow"></div>
      <header class="panel-head"><button class="panel-back" aria-label="${esc(t('common.back'))}">${K.icon('back')}</button><div><div class="panel-kicker">${esc(t('home.playMore'))}</div><h1>${esc(t('facts.title'))}</h1><p id="factsSub">${esc(t('facts.sub',{seen:K.factsSeenCount(world),total}))}</p></div><button class="panel-settings" aria-label="${esc(t('common.settings'))}">${K.icon('gear')}</button></header>
      <div class="panel-scroll">
        <div class="fact-chips" role="tablist">
          <button class="fact-chip ${world==='all'?'active':''}" data-fworld="all" role="tab" aria-selected="${world==='all'}">✨ ${esc(t('game.mixAll'))}</button>
          ${WORLDS().map(w=>`<button class="fact-chip ${world===w?'active':''}" data-fworld="${w}" role="tab" aria-selected="${world===w}">${WORLD_EMOJI[w]} ${esc(t(`world.${w}.short`))}</button>`).join('')}
        </div>
        <div class="fact-stage" id="factStage"></div>
        ${K.premium.isPremium()||K.factsAll(world).length===K.facts(world).length?'':`<button class="fact-premium" id="factPremium">${K.icon('lock')} ${esc(t('premium.factsMore',{n:K.factsAll(world).length-K.facts(world).length}))}</button>`}
        <div class="fact-actions">
          <button class="fact-next" id="factNext">${esc(t('facts.next'))} ›</button>
          <button class="fact-listen" id="factListen" aria-label="${esc(t('facts.listen'))}">${K.icon('repeat')}</button>
        </div>
      </div>
      ${K.bottomNav('home')}
    </section>`);
    const stage=f.querySelector('#factStage'),sub=f.querySelector('#factsSub');
    const show=()=>{
      const next=(open&&!current&&K.facts(world).find(f=>f.id===open))||nextFact(world,current);
      if(!next){stage.innerHTML=`<p class="fact-empty">…</p>`;return}
      const fresh=!seenMap()[next.id]||next.id===open;
      current=next;
      stage.innerHTML=card(next,{fresh});
      // Geen los woord op de laatste regel: dat doet `text-wrap: balance` op
      // .fact-text (screens.css). Bewust niet met een harde no-break spatie in
      // de tekst zelf — die tekst wordt ook uitgesproken en vergeleken.
      K.markFactSeen(next);
      const seen=K.factsSeenCount(world);
      sub.textContent=seen>=total&&fresh?t('facts.allSeen'):t('facts.sub',{seen,total});
      readFact(next,firstShown);firstShown=false;
      K.warmFacts(world,current);   // the two after this one start loading now
    };
    f.querySelector('.panel-back').onclick=()=>{K.stopSpeech();K.sfx('tap');K.showHome()};
    f.querySelector('.panel-settings').onclick=()=>{K.stopSpeech();K.sfx('tap');K.showParent()};
    f.querySelector('#factNext').onclick=()=>{K.sfx('tap');show()};
    f.querySelector('#factListen').onclick=()=>{K.sfx('tap');if(current)readFact(current)};
    const fp=f.querySelector('#factPremium');if(fp)fp.onclick=()=>{K.sfx('tap');K.premiumLocked({kind:'facts',world,retry:()=>K.showFacts(world)})};
    f.querySelectorAll('[data-fworld]').forEach(b=>b.onclick=()=>{K.sfx('tap');K.showFacts(b.dataset.fworld)});
    K.bindNav(f);
    show();
  };

  // A small "did you know" for the result screen: a fact from the quiz's world,
  // unseen first, marked as discovered when shown.
  K.bonusFact=world=>{
    world=WORLDS().includes(world)?world:'all';
    const fact=nextFact(world,null);
    if(!fact) return null;
    K.markFactSeen(fact);
    fact.speech=`${t('facts.kicker')} ${fact.t}`;
    fact.html=`<button class="result-fact" id="resultFact" data-fact="${fact.id}"><span class="result-fact-emoji" aria-hidden="true">${fact.e}</span><span class="result-fact-copy"><small>${esc(t('facts.kicker'))}</small><b>${esc(fact.t)}</b><em>${esc(t('facts.more'))} ›</em></span></button>`;
    return fact;
  };
})();
