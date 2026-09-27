(()=>{
  const K=window.KWIZILLO_M1;
  if(!K) return;
  const t=(k,v)=>K.t(k,v);
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  // Kwizillo Runner (three levels: jungle, city, sky; a boy or a girl) lives as
  // an ES module under assets/games/jungle/ (its own shadow root, canvas, engine
  // and sound) and is loaded only when the child opens it. This file is the
  // host side: the screen, the language table, Kwizillo's music instead of the
  // runner's own loop, and the reward — coins for a finished run, booked once
  // per run id.
  const LEVELS=['jungle','stad','lucht'];
  const MUSIC={jungle:'jungle',stad:'science',lucht:'home'};

  // Every string the runner shows, in the app language (game.js keys → i18n keys).
  const textTable=()=>{
    const map={};
    for(const key of ['brand','eyebrow','title','titleA','titleB','back','easyShort','backShort','levelLabel','heroLabel','heroBoy','heroGirl','glideOn','glideOff','swingOn','swingOff','powerSpeed','popSpeed','popSpeedSub','labelSpeed','levelJungle','levelStad','levelLucht','canvasLabel','pause','sound','controls','left','right','jump','loading','loadErrorTitle','intro','legendMagnet','legendShield','legendGold','legendDouble','easy','music','on','off','start','help','countFollow','countReady','pauseEyebrow','pauseTitle','pauseBody','resume','exit','hit','hitLost','labelHit','lostCoins','cardFound','powerDouble','powerMagnet','powerShield','powerStreak','popDouble','popDoubleSub','popGold','popGoldSub','popCombo','popComboSub','popMagnet','popMagnetSub','popShield','popShieldSub','popBlock','popBlockSub','popCard','popCardSub','popClear','popClearSub','popDoubleflip','popDoubleflipSub','labelGold','labelCombo','labelCard','labelClear','labelMagnet','labelShield','labelBlock','labelDouble','saving','saved','saveError','finishEyebrow','finish','finishSub','coinsEarned','bestStreak','bonusCoins','cardAlt','cardEyebrow','cardSub','cardTitle','retry','take','again','replay'])map[key]=t('jungle.'+key);
    map.loadError=t('jungle.loadErrorBody');map.savedNoHost=map.saved;
    return map;
  };

  K.jungleText=textTable;

  const jungleProgress=()=>{const G=K.progress().games||={};const j=G.jungle||={played:0,best:0,coins:0,runs:[],cards:[]};j.runs||=[];j.cards||=[];return j};

  // Books a finished run: coins go to the wallet exactly once per run id, so a
  // retried save or a replayed callback can never pay twice. Returns what was booked.
  K.jungleReward=reward=>{
    if(!reward||reward.game!=='jungle-runner'||reward.completed!==true||typeof reward.runId!=='string'||!reward.runId)return null;
    const coins=Math.max(0,Math.floor(Number(reward.coins)||0));
    const j=jungleProgress();
    if(j.runs.includes(reward.runId))return {coins:0,xp:0,duplicate:true};
    j.runs.push(reward.runId);if(j.runs.length>40)j.runs.splice(0,j.runs.length-40);
    // One run can pay at most RULES.runCoins, and every run together at most a
    // day's worth: the runner is the way to coins, not a tap that never ends.
    const earned=K.awardCoins(coins,{runCap:K.scoreRules.runCoins});
    const xp=10+Math.min(20,Math.floor(earned.granted/5))+(reward.cardId?5:0);
    const paid=K.awardPoints(xp);
    j.played++;j.coins+=earned.granted;if(earned.granted>j.best)j.best=earned.granted;
    let card=null;
    if(reward.cardId&&!j.cards.includes(reward.cardId)){card=String(reward.cardId);j.cards.push(card);}
    K.touchStreak();K.save();
    return {coins:earned.granted,xp:paid.granted,capped:earned.capped,card,duplicate:false};
  };

  let active=null;
  const leave=()=>{try{active?.destroy()}catch(e){}active=null;K.audio.setTempo?.(1)};

  K.startJungle=async()=>{
    leave();
    K.startScoreRun();
    K.stopSpeech();
    const f=K.frame(`<section class="jungle-screen fade-in"><div class="jungle-mount" id="jungleMount"><div class="jungle-loading"><span class="spinner"></span><b>${esc(t('jungle.loading'))}</b></div></div></section>`);
    const level=LEVELS.includes(K.state.runnerLevel)?K.state.runnerLevel:'jungle';
    K.audio.setTrack(MUSIC[level]).catch(()=>{});
    let mod;
    try{mod=await import(new URL(K.assetUrl('assets/games/jungle/game.js'),document.baseURI).href)}
    catch(e){console.warn('Kwizillo jungle:',e?.message||e);if(f.isConnected){K.toast(t('jungle.loadError'));setTimeout(()=>K.showHome(),900)}return}
    if(!f.isConnected)return; // the child already went elsewhere while the module loaded
    const mount=f.querySelector('#jungleMount');mount.innerHTML='';
    const j=jungleProgress();
    const game=mod.mountJungle(mount,{
      duration:40,
      level,
      hero:K.state.runnerHero==='girl'?'girl':'boy',
      onLevel:l=>{K.state.runnerLevel=l;K.save();K.audio.setTrack(MUSIC[l]||'jungle').catch(()=>{})},
      onHero:h=>{K.state.runnerHero=h;K.save()},
      easy:(K.state.niveau||1)<=2,
      muted:K.state.soundOn===false,
      music:false,
      musicState:()=>K.state.musicOn!==false,
      onMusic:()=>K.audio.setMusic(K.state.musicOn===false),
      reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches,
      text:textTable(),
      onStart:()=>K.audio.unlock().catch(()=>{}),
      onTempo:rate=>K.audio.setTempo?.(rate),
      onComplete:reward=>{const booked=K.jungleReward(reward);if(booked&&booked.coins)K.sfx('reward');if(booked&&booked.card)K.toast(t('collection.cardAdded',{title:t('card.'+booked.card)}))},
      onExit:()=>{K.audio.setTempo?.(1);leave();K.showHome()}
    });
    active={destroy:()=>game.destroy()};
    K.jungle={game,progress:j};
  };
})();
