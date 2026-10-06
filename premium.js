(()=>{
  const K=window.KWIZILLO_M1;
  if(!K) return;

  // Kwizillo Premium — the one place that knows what is free, what is Premium,
  // and whether this player has Premium. The rest of the app asks
  // K.premium.isPremium() or K.premium.can(...) and never looks at storage,
  // flags or product ids itself. The parent pays for access; the child earns
  // every reward by playing, so nothing in here sells coins, cards or mascots.

  /* ---------------- Config ---------------- */

  // The product ids keep the nl.kwizillo.app prefix they were made with; since the
  // app moved to Olijve Holding B.V. its iOS bundle id is com.kwizillo.app.
  const PRODUCT_PREFIX='nl.kwizillo.app',BUNDLE_ID='com.kwizillo.app';
  const CONFIG={
    bundleId:BUNDLE_ID,
    subscriptionGroup:'Kwizillo Premium',
    products:{
      monthly:{id:`${PRODUCT_PREFIX}.premium.monthly`,period:'month',months:1,target:'€6,99'},
      yearly:{id:`${PRODUCT_PREFIX}.premium.yearly`,period:'year',months:12,target:'€49,99',trialDays:7,recommended:true}
    },
    // What Free can play. Everything else is visible with a lock and opens with Premium.
    free:{
      starterWorld:'ruimte',        // the whole world: every topic, every quiz number
      freeQuizzesElsewhere:1,       // in every other world: the first mixed quiz
      mathMaxLevel:3,               // sums up to level 3; 4–6 need Premium
      memoWorlds:['ruimte','mix'],  // memo boards: the starter world and "all worlds"
      factsPerWorld:4,              // the first facts of every other world
    }
  };
  const FREE=CONFIG.free;

  /* ---------------- Entitlement ---------------- */

  // The entitlement lives next to the game state, never inside it: a saved game
  // is not a licence. On iOS a verified StoreKit transaction fills this in; on the
  // web only the development simulator can (and only on a development host).
  // Which native store this build sells through: 'ios', 'android', or none (web).
  const nativeStore=()=>{if(!window.Capacitor?.isNativePlatform?.())return null;const p=window.Capacitor.getPlatform?.();return p==='android'?'android':p==='ios'?'ios':null};
  const ENT_KEY='kwizillo-entitlement';
  const read=()=>{try{return JSON.parse(localStorage.getItem(ENT_KEY)||'null')}catch{return null}};
  const write=e=>{try{if(e)localStorage.setItem(ENT_KEY,JSON.stringify(e));else localStorage.removeItem(ENT_KEY)}catch{}};
  let ent=read();
  const listeners=new Set();
  const notify=()=>{listeners.forEach(fn=>{try{fn(K.premium.status())}catch(e){}})};

  // A store's stamp only counts inside that store's app: an entitlement copied
  // into a browser (or from iOS to Android) is worthless.
  const valid=e=>!!e&&e.status==='active'&&(!e.expiresAt||Date.parse(e.expiresAt)>Date.now())&&((e.store===nativeStore()&&!!window.KwizilloStoreKit)||(e.store==='dev'&&isDevHost()));
  const setEntitlement=e=>{ent=e||null;write(ent);notify()};

  /* ---------------- Development host ---------------- */

  // The purchase simulator exists only where a real store cannot: a plain http
  // page on a development machine or the LAN. The iOS app (capacitor://) and any
  // https deployment never see it, and an entitlement stamped by the simulator
  // is worthless there (see `valid`).
  function isDevHost(){
    const h=location.hostname;
    return location.protocol==='http:'&&(/^(localhost|127\.|0\.0\.0\.0$|192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(h)||h==='');
  }

  /* ---------------- Purchase service ---------------- */

  // One service, pluggable providers. States: idle, loadingProducts, ready,
  // purchasing, purchased, cancelled, pending, failed, restoring, restored.
  const service={state:'idle',error:null,products:null,provider:null};
  const setState=(s,extra={})=>{Object.assign(service,{state:s},extra);notify()};

  // StoreKit 2 on iOS (ios/App/App/KwizilloStoreKitPlugin.swift) behind this contract.
  // In the iOS app Capacitor injects window.Capacitor; the native plugin
  // (ios/App/App/KwizilloStoreKitPlugin.swift) is exposed as
  // Capacitor.Plugins.KwizilloStoreKit. This shim is the `window.KwizilloStoreKit`
  // contract on top of it. A web page has neither, and then the provider is absent.
  // On Android the Google Play twin (android/…/KwizilloBillingPlugin.java) has
  // the same five calls and shapes, so one shim serves both stores.
  const nativePlugin=()=>(window.Capacitor?.isNativePlatform?.()&&(window.Capacitor.Plugins?.KwizilloStoreKit||window.Capacitor.Plugins?.KwizilloBilling))||null;
  if(!window.KwizilloStoreKit&&nativePlugin()){
    const n=nativePlugin();
    window.KwizilloStoreKit={
      products:async ids=>(await n.products({ids})).products||[],
      purchase:async id=>n.purchase({id}),
      restore:async()=>n.restore(),
      currentEntitlement:async()=>(await n.currentEntitlement()).entitlement||null,
      manageSubscriptions:async()=>n.manageSubscriptions()
    };
    n.addListener?.('entitlementChanged',()=>K.premium?.refresh());
  }
  const storeKitProvider={
    get id(){return nativeStore()||'ios'},
    available:()=>!!window.KwizilloStoreKit,
    async products(){return window.KwizilloStoreKit.products(Object.values(CONFIG.products).map(p=>p.id))},
    async purchase(id){return window.KwizilloStoreKit.purchase(id)},
    async restore(){return window.KwizilloStoreKit.restore()},
    async current(){return window.KwizilloStoreKit.currentEntitlement()},
    async manage(){return window.KwizilloStoreKit.manageSubscriptions()}
  };

  // Development simulator: localized prices and every outcome, on demand.
  const dev={outcome:'success',trialEligible:true,storeAvailable:true,delay:600};
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  const devPrices={
    nl:{monthly:'€ 6,99',yearly:'€ 49,99',cur:'EUR'},en:{monthly:'$6.99',yearly:'$49.99',cur:'USD'},
    pt:{monthly:'R$ 34,90',yearly:'R$ 249,90',cur:'BRL'},
    de:{monthly:'6,99 €',yearly:'49,99 €',cur:'EUR'},es:{monthly:'6,99 €',yearly:'49,99 €',cur:'EUR'},
    fr:{monthly:'6,99 €',yearly:'49,99 €',cur:'EUR'},it:{monthly:'6,99 €',yearly:'49,99 €',cur:'EUR'},
    ru:{monthly:'6,99 €',yearly:'49,99 €',cur:'EUR'},da:{monthly:'54,99 kr.',yearly:'399,00 kr.',cur:'DKK'}
  };
  const devProvider={
    id:'dev',
    available:()=>isDevHost()&&dev.storeAvailable,
    async products(){
      await wait(dev.delay);
      const p=devPrices[K.state.language]||devPrices.en;
      const num=s=>Number(s.replace(/[^\d,.]/g,'').replace(/\.(?=\d{3})/g,'').replace(',','.'));
      return Object.entries(CONFIG.products).map(([key,cfg])=>({key,id:cfg.id,displayPrice:p[key],price:num(p[key]),currency:p.cur,period:cfg.period,months:cfg.months,trialDays:cfg.trialDays||0,trialEligible:!!cfg.trialDays&&dev.trialEligible}));
    },
    async purchase(id){
      await wait(dev.delay);
      const o=dev.outcome;
      if(o==='cancel')return{result:'cancelled'};
      if(o==='pending')return{result:'pending'};
      if(o==='error')throw new Error('simulated purchase failure');
      const cfg=Object.values(CONFIG.products).find(p=>p.id===id);
      const exp=new Date(Date.now()+(cfg?.months||1)*30*864e5).toISOString();
      return{result:'purchased',entitlement:{status:'active',productId:id,type:cfg?.period||'month',expiresAt:exp,store:'dev',trial:!!cfg?.trialDays&&dev.trialEligible}};
    },
    async restore(){await wait(dev.delay);if(dev.outcome==='error')throw new Error('simulated restore failure');return dev.restoreHas?{result:'restored',entitlement:{status:'active',productId:CONFIG.products.yearly.id,type:'year',expiresAt:new Date(Date.now()+365*864e5).toISOString(),store:'dev'}}:{result:'none'}},
    async current(){return valid(ent)?ent:null},
    async manage(){return{result:'unavailable'}}
  };

  const providers=[storeKitProvider,devProvider];
  const pickProvider=()=>providers.find(p=>p.available())||null;

  // A cancelled purchase is not a failure; every technical error becomes one
  // calm, translated message. Nothing from StoreKit is shown as-is.
  async function loadProducts(){
    const p=pickProvider();service.provider=p;
    if(!p){setState('failed',{error:'unavailable',products:null});return null}
    setState('loadingProducts',{error:null});
    try{const list=await p.products();setState('ready',{products:list});return list}
    catch(e){console.warn('Kwizillo Premium: products —',e?.message||e);setState('failed',{error:'unavailable',products:null});return null}
  }
  async function purchase(productId){
    const p=service.provider||pickProvider();
    if(!p){setState('failed',{error:'unavailable'});return 'failed'}
    setState('purchasing',{error:null});
    try{
      const r=await p.purchase(productId);
      if(r.result==='purchased'&&r.entitlement){setEntitlement(r.entitlement);setState('purchased');return 'purchased'}
      if(r.result==='pending'){setState('pending');return 'pending'}
      setState('cancelled');return 'cancelled';
    }catch(e){console.warn('Kwizillo Premium: purchase —',e?.message||e);setState('failed',{error:'purchase'});return 'failed'}
  }
  async function restore(){
    const p=service.provider||pickProvider();
    if(!p){setState('failed',{error:'unavailable'});return 'failed'}
    setState('restoring',{error:null});
    try{
      const r=await p.restore();
      if(r.result==='restored'&&r.entitlement){setEntitlement(r.entitlement);setState('restored');return 'restored'}
      setState('ready');return 'none';
    }catch(e){console.warn('Kwizillo Premium: restore —',e?.message||e);setState('failed',{error:'restore'});return 'failed'}
  }
  async function manage(){const p=service.provider||pickProvider();if(!p)return 'unavailable';try{const r=await p.manage();return r?.result||'unavailable'}catch{return 'unavailable'}}
  // Entitlement refresh: at startup, after purchase/restore and when the app
  // comes back to the foreground — a Premium player never restarts into Free.
  async function refresh(){
    const p=pickProvider();
    if(p&&p===storeKitProvider){try{const e=await p.current();setEntitlement(e&&e.status==='active'?{...e,store:p.id}:null)}catch(e){/* offline: keep the cached verified state */}}
    else if(ent&&!valid(ent)&&ent.store!=='dev'){setEntitlement(null)}   // expired: content locks again, progress stays
    else notify();
  }
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refresh()});

  /* ---------------- Gating rules ---------------- */

  const isPremium=()=>valid(ent);

  // Testing on your own phone. There is no switch in the app for this — the
  // parent zone used to carry one and it had no business in a shipping build.
  // Instead the address itself opens the game: ?premium=1 stamps a development
  // entitlement on this device, ?premium=0 takes it away again, and the
  // parameter is wiped from the address bar straight afterwards. It only works
  // on a plain-http development host (localhost or the LAN), so the iOS app and
  // any https deployment cannot be unlocked this way — an entitlement stamped
  // here is worthless there in any case (see `valid`).
  function unlockFromAddress(){
    if(!isDevHost())return;
    let url;try{url=new URL(location.href)}catch(e){return}
    const want=url.searchParams.get('premium');
    if(want===null)return;
    if(want==='0'||want==='off'){setEntitlement(null)}
    else{
      setEntitlement({status:'active',productId:CONFIG.products.yearly.id,type:'year',
        expiresAt:new Date(Date.now()+3650*864e5).toISOString(),store:'dev'});
    }
    url.searchParams.delete('premium');
    try{history.replaceState(null,'',url.pathname+(url.search||'')+url.hash)}catch(e){}
  }
  unlockFromAddress();
  const rules={
    world:world=>world===FREE.starterWorld,
    // A quiz: the whole starter world; elsewhere only the first mixed quiz(zes).
    quiz:(world,topicKey,quizNumber)=>world===FREE.starterWorld||(topicKey==null&&Number(quizNumber||1)<=FREE.freeQuizzesElsewhere),
    math:level=>Number(level||1)<=FREE.mathMaxLevel,
    memo:world=>FREE.memoWorlds.includes(world||'mix'),
    fact:(world,index)=>world===FREE.starterWorld||Number(index)<FREE.factsPerWorld,
    mega:()=>false                // the Mega Quiz asks questions from every world: Premium only
  };
  // can('quiz', world, topicKey, quizNumber) — true when free or Premium.
  const can=(kind,...args)=>isPremium()||!!rules[kind]?.(...args);

  /* ---------------- Pending destination ---------------- */

  // The locked thing the child chose is remembered through the gate and the
  // paywall; once Premium is active it opens by itself.
  let pending=null;
  const setPending=fn=>{pending=typeof fn==='function'?fn:null};
  const runPending=()=>{const fn=pending;pending=null;if(fn)setTimeout(()=>{try{fn()}catch(e){}},60)};

  K.premium={
    CONFIG,FREE,
    isPremium,can,rules,
    status:()=>({isPremium:isPremium(),entitlementStatus:valid(ent)?'active':(ent?'expired':'none'),subscriptionProductId:valid(ent)?ent.productId:null,subscriptionType:valid(ent)?ent.type:null,expirationDate:valid(ent)?ent.expiresAt:null,store:valid(ent)?ent.store:null,trial:!!(valid(ent)&&ent.trial),purchase:service.state,error:service.error,products:service.products,storeAvailable:!!pickProvider()}),
    onChange:fn=>{listeners.add(fn);return()=>listeners.delete(fn)},
    loadProducts,purchase,restore,manage,refresh,
    setPending,runPending,hasPending:()=>!!pending,
    isDevHost,
  };
  // The simulator's controls exist only on a development host.
  if(isDevHost()){
    K.premiumDev={
      set:(o)=>Object.assign(dev,o),
      get:()=>({...dev}),
      grant:(type='year')=>setEntitlement({status:'active',productId:type==='month'?CONFIG.products.monthly.id:CONFIG.products.yearly.id,type,expiresAt:new Date(Date.now()+(type==='month'?30:365)*864e5).toISOString(),store:'dev'}),
      expire:()=>{if(ent)setEntitlement({...ent,status:'active',expiresAt:new Date(Date.now()-1000).toISOString()});refresh()},
      revoke:()=>setEntitlement(null)
    };
  }
  refresh();
})();
