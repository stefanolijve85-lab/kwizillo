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
  const WORLDS=['ruimte','dieren','aarde','geschiedenis','wetenschap','mysterie'];
  const WORLD_EMOJI={ruimte:'🚀',dieren:'🦁',aarde:'🌍',geschiedenis:'🏰',wetenschap:'🔬',mysterie:'🔮'};
  const bank=()=>window.KWIZILLO_FACTS?.[K.state.language]||window.KWIZILLO_FACTS?.nl||{};
  const seenMap=()=>{const P=K.progress();P.factsSeen||={};return P.factsSeen};
  K.facts=world=>{
    const b=bank();
    const list=[];
    for(const w of (world&&world!=='all'?[world]:WORLDS)) (b[w]||[]).forEach((f,i)=>list.push({id:`${w}-${i}`,world:w,e:f.e,t:f.t}));
    return list;
  };
  K.factsSeenCount=world=>{const seen=seenMap();return K.facts(world).filter(f=>seen[f.id]).length};
  // Picks the next fact: an unseen one when there is any, else any other than `avoid`.
  K.pickFact=(world,avoid)=>{
    const all=K.facts(world);
    if(!all.length) return null;
    const seen=seenMap();
    let pool=all.filter(f=>!seen[f.id]&&f.id!==avoid);
    if(!pool.length) pool=all.filter(f=>f.id!==avoid);
    if(!pool.length) pool=all;
    return pool[Math.floor(Math.random()*pool.length)];
  };
  K.markFactSeen=fact=>{if(!fact)return;const seen=seenMap();if(!seen[fact.id]){seen[fact.id]=true;K.save()}};
  // Spoken by whichever guide the child chose; silent for "Stil".
  const readFact=fact=>{K.stopSpeech();return K.speak(fact.t).catch(()=>{})};

  const card=(fact,{fresh})=>`<article class="fact-card fact-${fact.world} fade-in" data-fact="${fact.id}">
      <img class="fact-art" src="${K.MASTER[fact.world]}" alt="" style="object-position:${K.WORLD_FOCUS?.[fact.world]||'center 40%'}" decoding="async">
      <span class="fact-veil"></span>
      <div class="fact-body">
        <div class="fact-top"><span class="fact-world">${WORLD_EMOJI[fact.world]} ${esc(t(`world.${fact.world}.title`))}</span>${fresh?`<span class="fact-new">${esc(t('facts.new'))}</span>`:''}</div>
        <div class="fact-emoji" aria-hidden="true">${fact.e}</div>
        <div class="fact-kicker">${esc(t('facts.kicker'))}</div>
        <p class="fact-text">${esc(fact.t)}</p>
      </div>
    </article>`;

  // `open` shows that fact first (the result screen's bonus fact, in full).
  K.showFacts=(world='all',{open}={})=>{
    K.audio.setTrack('play').catch(()=>{});
    K.stopSpeech();K.lastView='facts';
    K.state.factsWorld=world;K.save();
    let current=null;
    const total=K.facts(world).length;
    const f=K.frame(`<section class="native-panel-screen facts-screen fade-in">
      <div class="native-panel-glow"></div>
      <header class="panel-head"><button class="panel-back" aria-label="${esc(t('common.back'))}">${K.icon('back')}</button><div><div class="panel-kicker">${esc(t('home.playMore'))}</div><h1>${esc(t('facts.title'))}</h1><p id="factsSub">${esc(t('facts.sub',{seen:K.factsSeenCount(world),total}))}</p></div><button class="panel-settings" aria-label="${esc(t('common.settings'))}">${K.icon('gear')}</button></header>
      <div class="panel-scroll">
        <div class="fact-chips" role="tablist">
          <button class="fact-chip ${world==='all'?'active':''}" data-fworld="all" role="tab" aria-selected="${world==='all'}">✨ ${esc(t('facts.all'))}</button>
          ${WORLDS.map(w=>`<button class="fact-chip ${world===w?'active':''}" data-fworld="${w}" role="tab" aria-selected="${world===w}">${WORLD_EMOJI[w]} ${esc(t(`world.${w}.short`))}</button>`).join('')}
        </div>
        <div class="fact-stage" id="factStage"></div>
        <div class="fact-actions">
          <button class="fact-next" id="factNext">${esc(t('facts.next'))} ›</button>
          <button class="fact-listen" id="factListen" aria-label="${esc(t('facts.listen'))}">${K.icon('repeat')}</button>
        </div>
      </div>
      ${K.bottomNav('home')}
    </section>`);
    const stage=f.querySelector('#factStage'),sub=f.querySelector('#factsSub');
    const show=()=>{
      const next=(open&&!current&&K.facts(world).find(f=>f.id===open))||K.pickFact(world,current?.id);
      if(!next){stage.innerHTML=`<p class="fact-empty">…</p>`;return}
      const fresh=!seenMap()[next.id]||next.id===open;
      current=next;
      stage.innerHTML=card(next,{fresh});
      K.markFactSeen(next);
      const seen=K.factsSeenCount(world);
      sub.textContent=seen>=total&&fresh?t('facts.allSeen'):t('facts.sub',{seen,total});
      readFact(next);
    };
    f.querySelector('.panel-back').onclick=()=>{K.stopSpeech();K.sfx('tap');K.showHome()};
    f.querySelector('.panel-settings').onclick=()=>{K.stopSpeech();K.sfx('tap');K.showParent()};
    f.querySelector('#factNext').onclick=()=>{K.sfx('tap');show()};
    f.querySelector('#factListen').onclick=()=>{K.sfx('tap');if(current)readFact(current)};
    f.querySelectorAll('[data-fworld]').forEach(b=>b.onclick=()=>{K.sfx('tap');K.showFacts(b.dataset.fworld)});
    K.bindNav(f);
    show();
  };

  // A small "did you know" for the result screen: a fact from the quiz's world,
  // unseen first, marked as discovered when shown.
  K.bonusFactHtml=world=>{
    const fact=K.pickFact(WORLDS.includes(world)?world:'all');
    if(!fact) return '';
    K.markFactSeen(fact);
    return `<button class="result-fact" id="resultFact" data-fact="${fact.id}"><span class="result-fact-emoji" aria-hidden="true">${fact.e}</span><span class="result-fact-copy"><small>${esc(t('facts.kicker'))}</small><b>${esc(fact.t)}</b><em>${esc(t('facts.more'))} ›</em></span></button>`;
  };
})();
