(()=>{
  const K=window.KWIZILLO_M1;
  if(!K) return;
  const t=(k,v)=>K.t(k,v);
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const P=K.premium;

  // The Premium screens, in the game's own design: a small lock badge on tiles,
  // a friendly "this is Premium" card for the child, the parental gate, then
  // the paywall for the parent, a Kwizillo celebration when it is done, and the
  // status card in the parent zone. No timers, no scarcity, no sad mascots.

  K.premiumBadge=()=>`<span class="premium-badge" aria-label="${esc(t('premium.label'))}">${K.icon('lock')} ${esc(t('premium.label'))}</span>`;

  // A locked thing was chosen: explain in one line, then the parent decides.
  // `retry` reopens exactly what the child chose once Premium is active.
  K.premiumLocked=({kind,world,retry}={})=>{
    const f=K.app.querySelector('.game-frame');if(!f)return;
    K.stopSpeech();K.sfx('tap');
    if(retry)P.setPending(retry);
    const o=document.createElement('div');o.className='simple-modal premium-teaser';
    o.innerHTML=`<div class="simple-modal-card">
      <button class="simple-close" aria-label="${esc(t('common.close'))}">×</button>
      <img class="premium-teaser-face" src="${K.guideArt?.(K.state.voice)||K.MASCOT_ART.milo}" alt="">
      <h2>${esc(t('premium.teaserTitle'))}</h2>
      <p>${esc(t(`premium.teaser.${kind||'quiz'}`))}</p>
      <button class="simple-ok" id="teaserParent">${esc(t('premium.askParent'))}</button>
    </div>`;
    f.appendChild(o);
    o.querySelector('.simple-close').onclick=()=>{K.sfx('tap');P.setPending(null);o.remove()};
    o.querySelector('#teaserParent').onclick=()=>{K.sfx('tap');o.remove();K.parentalGate(()=>K.showPremium({from:'locked'}))};
  };

  /* ---------------- Paywall ---------------- */

  const money=(n,cur,lang)=>{try{return new Intl.NumberFormat({nl:'nl-NL',en:'en-US',pt:'pt-BR'}[lang]||'en-US',{style:'currency',currency:cur}).format(n)}catch{return n.toFixed(2)}};

  K.showPremium=({from}={})=>{
    K.stopSpeech();K.lastView='premium';
    const lang=K.state.language;
    const benefits=['worlds','questions','math','memo','facts','guides','collect','stats','new'];
    const f=K.frame(`<section class="native-panel-screen premium-screen fade-in">
      <div class="native-panel-glow"></div>
      <header class="panel-head"><button class="panel-back" aria-label="${esc(t('common.back'))}">${K.icon('back')}</button><div><div class="panel-kicker">${esc(t('premium.kicker'))}</div><h1>${esc(t('premium.title'))}</h1><p>${esc(t('premium.subtitle'))}</p></div><span></span></header>
      <div class="panel-scroll">
        <div class="premium-hero"><img src="${K.MASCOT_ART.milo}" alt=""><img src="${K.MASCOT_ART.luna}" alt=""></div>
        <ul class="premium-benefits">${benefits.map(b=>`<li>${K.icon('check')} ${esc(t(`premium.benefit.${b}`))}</li>`).join('')}</ul>
        <div class="premium-plans" id="premiumPlans"><div class="premium-loading">${esc(t('premium.loading'))}</div></div>
        <p class="premium-legal" id="premiumLegal">${esc(t('premium.legal'))}</p>
        <div class="premium-links">
          <button id="premiumRestore">${esc(t('premium.restore'))}</button>
          <button id="premiumManage">${esc(t('premium.manage'))}</button>
          <button id="premiumPrivacy">${esc(t('premium.privacy'))}</button>
          <button id="premiumTerms">${esc(t('premium.terms'))}</button>
        </div>
      </div>
    </section>`);
    f.querySelector('.panel-back').onclick=()=>{K.sfx('tap');P.setPending(null);from==='parent'?K.showParent():K.showHome()};
    f.querySelector('#premiumRestore').onclick=()=>{K.sfx('tap');K.premiumRestore(()=>K.showPremium({from}))};
    f.querySelector('#premiumManage').onclick=()=>{K.sfx('tap');K.premiumManage()};
    f.querySelector('#premiumPrivacy').onclick=()=>{K.sfx('tap');K.showPrivacyInfo?.()};
    f.querySelector('#premiumTerms').onclick=()=>{K.sfx('tap');K.showTermsInfo?.()};
    const plans=f.querySelector('#premiumPlans');

    const renderPlans=list=>{
      const yearly=list.find(p=>p.key==='yearly'),monthly=list.find(p=>p.key==='monthly');
      const perMonth=yearly&&yearly.price&&yearly.months?money(yearly.price/yearly.months,yearly.currency,lang):null;
      const plan=p=>{
        const isY=p.key==='yearly',trial=isY&&p.trialEligible&&p.trialDays;
        return `<button class="premium-plan ${isY?'yearly':'monthly'} ${isY?'recommended':''}" data-plan="${p.id}" aria-label="${esc(t(isY?'premium.yearly':'premium.monthly'))} ${esc(p.displayPrice)}">
          ${isY?`<span class="premium-best">${esc(t('premium.best'))}</span>`:''}
          <b>${esc(t('premium.name'))}</b><small>${esc(t(isY?'premium.yearly':'premium.monthly'))}</small>
          <strong>${esc(p.displayPrice)} <em>/ ${esc(t(isY?'premium.perYear':'premium.perMonth'))}</em></strong>
          ${isY&&perMonth?`<span class="premium-permonth">${esc(t('premium.perMonthCalc',{price:perMonth}))}</span>`:''}
          ${trial?`<span class="premium-trial">${esc(t('premium.trial',{days:p.trialDays}))}</span>`:''}
          <span class="premium-cta">${esc(trial?t('premium.ctaTrial',{days:p.trialDays}):t(isY?'premium.ctaYearly':'premium.ctaMonthly'))}</span>
        </button>`;
      };
      plans.innerHTML=[yearly,monthly].filter(Boolean).map(plan).join('');
      plans.querySelectorAll('[data-plan]').forEach(b=>b.onclick=()=>{K.sfx('tap');buy(b.dataset.plan)});
    };
    const status=el=>{plans.innerHTML=`<div class="premium-status">${el}</div>`};

    const buy=async id=>{
      plans.querySelectorAll('[data-plan]').forEach(b=>b.disabled=true);
      status(`<div class="premium-loading">${esc(t('premium.purchasing'))}</div>`);
      const r=await P.purchase(id);
      if(r==='purchased'){K.premiumWelcome();return}
      if(r==='pending'){status(`<p>${esc(t('premium.pending'))}</p><button class="simple-ok" id="premiumBack">${esc(t('common.ok'))}</button>`);plans.querySelector('#premiumBack').onclick=()=>{K.sfx('tap');from==='parent'?K.showParent():K.showHome()};return}
      if(r==='cancelled'){K.toast(t('premium.cancelled'));load();return}
      status(`<p>${esc(t('premium.failed'))}</p><button class="simple-ok" id="premiumAgain">${esc(t('common.retry'))}</button>`);plans.querySelector('#premiumAgain').onclick=()=>{K.sfx('tap');load()};
    };
    const load=async()=>{
      if(P.isPremium()){status(`<p>${esc(t('premium.already'))}</p>`);return}
      const list=await P.loadProducts();
      if(!list||!list.length){status(`<p>${esc(t('premium.unavailable'))}</p>`);return}
      renderPlans(list);
    };
    load();
  };

  // Restore purchases: really syncs with the store, then says what it found.
  K.premiumRestore=async(back)=>{
    K.toast(t('premium.restoring'));
    const r=await P.restore();
    if(r==='restored'){K.premiumWelcome();return}
    if(back)back();   // re-render first: a new frame would wipe the toast
    K.toast(t(r==='none'?'premium.restoreNone':r==='failed'&&P.status().error==='unavailable'?'premium.unavailable':'premium.failed'));
  };
  K.premiumManage=async()=>{
    const r=await P.manage();
    if(r!=='opened')K.toast(t('premium.manageUnavailable'));
  };

  // After a purchase: a Kwizillo moment, then the thing the child chose opens.
  K.premiumWelcome=()=>{
    const f=K.frame(`<section class="native-panel-screen premium-screen premium-welcome fade-in">
      <div class="native-panel-glow"></div>
      <div class="premium-welcome-card">
        <div class="premium-hero"><img src="${K.MASCOT_ART.milo}" alt=""><img src="${K.MASCOT_ART.luna}" alt=""></div>
        <h1>${esc(t('premium.welcome'))}</h1>
        <p>${esc(t('premium.welcomeSub'))}</p>
        <button class="simple-ok" id="premiumGo">${esc(t(P.hasPending()?'premium.continue':'premium.play'))}</button>
      </div>
    </section>`);
    K.sfx('reward');K.celebrate?.('quiz',f.querySelector('.premium-hero'));
    f.querySelector('#premiumGo').onclick=()=>{K.sfx('tap');if(P.hasPending())P.runPending();else K.showHome()};
  };

  /* ---------------- Parent zone ---------------- */

  K.premiumCard=()=>{
    const s=P.status();
    const line=s.isPremium?t(s.trial?'premium.statusTrial':'premium.statusActive',{type:t(s.subscriptionType==='year'?'premium.yearly':'premium.monthly')}):t(s.entitlementStatus==='expired'?'premium.statusExpired':'premium.statusFree');
    return `<section class="setting-card clickable premium-card ${s.isPremium?'active':''}" id="premiumOpen"><div class="setting-icon">⭐</div><div><b>${esc(t('premium.name'))}</b><small>${esc(line)}</small></div><em>›</em></section>`;
  };
  // Development hosts only: a switch that opens everything for testing.
  K.testUnlockCard=()=>P.isDevHost()?`<section class="setting-card test-card"><div class="setting-icon">🧪</div><div><b>${esc(t('premium.testTitle'))}</b><small>${esc(t('premium.testSub'))}</small></div><button class="native-switch ${P.testUnlock()?'on':''}" id="testUnlockToggle" aria-label="${esc(t('premium.testTitle'))}"><i></i></button></section>`:'';
  K.bindPremiumCard=f=>{
    const tg=f.querySelector('#testUnlockToggle');if(tg)tg.onclick=()=>{K.sfx('tap');P.setTestUnlock(!P.testUnlock());K.showParent()};
    const c=f.querySelector('#premiumOpen');if(!c)return;
    c.onclick=()=>{K.sfx('tap');K.parentalGate(()=>P.isPremium()?K.showPremiumStatus():K.showPremium({from:'parent'}))};
  };
  K.showPremiumStatus=()=>{
    const s=P.status();
    const f=K.frame(`<section class="native-panel-screen premium-screen fade-in">
      <div class="native-panel-glow"></div>
      <header class="panel-head"><button class="panel-back" aria-label="${esc(t('common.back'))}">${K.icon('back')}</button><div><div class="panel-kicker">${esc(t('premium.kicker'))}</div><h1>${esc(t('premium.name'))}</h1><p>${esc(t(s.trial?'premium.statusTrial':'premium.statusActive',{type:t(s.subscriptionType==='year'?'premium.yearly':'premium.monthly')}))}</p></div><span></span></header>
      <div class="panel-scroll"><div class="settings-list">
        ${s.expirationDate?`<section class="setting-card"><div class="setting-icon">📅</div><div><b>${esc(t('premium.renews'))}</b><small>${esc(new Date(s.expirationDate).toLocaleDateString({nl:'nl-NL',en:'en-US',pt:'pt-BR'}[K.state.language]||'en-US'))}</small></div></section>`:''}
        <section class="setting-card clickable" id="premiumManage"><div class="setting-icon">⚙️</div><div><b>${esc(t('premium.manage'))}</b><small>${esc(t('premium.manageSub'))}</small></div><em>›</em></section>
        <section class="setting-card clickable" id="premiumRestore"><div class="setting-icon">🔄</div><div><b>${esc(t('premium.restore'))}</b><small>${esc(t('premium.restoreSub'))}</small></div><em>›</em></section>
      </div></div>
    </section>`);
    f.querySelector('.panel-back').onclick=()=>{K.sfx('tap');K.showParent()};
    f.querySelector('#premiumManage').onclick=()=>{K.sfx('tap');K.premiumManage()};
    f.querySelector('#premiumRestore').onclick=()=>{K.sfx('tap');K.premiumRestore(()=>K.showPremiumStatus())};
  };

  // Locked things re-render when the entitlement changes under an open screen.
  P.onChange(()=>{const v=K.lastView;if(v==='world'&&K.currentWorld&&K.app.querySelector('.native-world'))K.showWorld(K.currentWorld)});
})();
