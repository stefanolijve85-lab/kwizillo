(()=>{
  const K=window.KWIZILLO_M1;
  if(!K) return;
  const t=(k,v)=>K.t(k,v);

  // Mike & Mia: Jump & Slide — a 2D platform runner in the Spellenkist. The
  // game itself is an ES module under assets/games/jump/ (engine, levels,
  // drawing, input), loaded only when the child opens it. This file is the host
  // side: the screen, the strings, Kwizillo's music and sound effects, and the
  // reward — booked once per run id, like the Runner's (games-jungle.js). It has
  // its own progress (progress.games.jump) and leaves the Runner's alone.
  const WORLDS=['underwater','candy','space'];
  const MUSIC={underwater:'earth',candy:'play',space:'space'};
  // The game's sounds, through the app's own sound manager (so the FX switch
  // and slider apply). Reused from the Runner's recorded effects.
  const SFX_DIR='assets/games/jungle/sfx/';
  const addSfx=()=>K.audio.addSfx?.({jumpJump:SFX_DIR+'jump.mp3',jumpDouble:SFX_DIR+'double.mp3',jumpLand:SFX_DIR+'land.mp3',jumpStar:SFX_DIR+'coin.mp3',jumpHit:SFX_DIR+'hit.mp3',jumpBounce:SFX_DIR+'swing.mp3',jumpFinish:SFX_DIR+'finish.mp3',jumpCount:SFX_DIR+'count.mp3',jumpSlide:SFX_DIR+'glide.mp3',jumpShield:SFX_DIR+'shield.mp3',jumpBlock:SFX_DIR+'block.mp3'},
    {jumpJump:.45,jumpDouble:.5,jumpLand:.35,jumpStar:.4,jumpHit:.55,jumpBounce:.5,jumpFinish:.7,jumpCount:.4,jumpSlide:.35,jumpShield:.5,jumpBlock:.55});
  const SFX={jump:'jumpJump',double:'jumpDouble',land:'jumpLand',star:'jumpStar',hit:'jumpHit',fall:'jumpHit',bounce:'jumpBounce',finish:'jumpFinish',count:'jumpCount',go:'jumpCount',slide:'jumpSlide',shield:'jumpShield',shieldHit:'jumpBlock',over:'bad'};

  const jumpProgress=()=>{
    const G=K.progress().games||={};
    const j=G.jump||={played:0,finished:0,best:{},stars:{},runs:[],coins:0};
    j.best||={};j.stars||={};j.runs||=[];
    return j;
  };
  K.jumpProgress=jumpProgress;

  // Books a run once per run id. A finished run turns its stars into coins and
  // XP (stars are points inside the run only, never a currency of their own);
  // a run that ended early still counts for the best score and the stats.
  K.jumpReward=reward=>{
    if(!reward||reward.game!=='jump'||typeof reward.runId!=='string'||!reward.runId||!WORLDS.includes(reward.world))return null;
    const j=jumpProgress();
    if(j.runs.includes(reward.runId))return {coins:0,xp:0,duplicate:true,newBest:false};
    j.runs.push(reward.runId);if(j.runs.length>40)j.runs.splice(0,j.runs.length-40);
    const stars=Math.max(0,Math.floor(Number(reward.stars)||0)),score=Math.max(0,Math.floor(Number(reward.score)||0));
    j.played++;
    const newBest=score>Number(j.best[reward.world]||0);
    if(newBest)j.best[reward.world]=score;
    if(stars>Number(j.stars[reward.world]||0))j.stars[reward.world]=stars;
    let coins=0,xp=0,capped=false;
    if(reward.completed===true){
      j.finished++;
      const earned=K.awardCoins(stars+10,{runCap:K.scoreRules.runCoins});
      const paid=K.awardPoints(10+Math.floor(stars/3));
      coins=earned.granted;xp=paid.granted;capped=earned.capped||paid.capped;j.coins+=coins;
      K.touchStreak();
    }
    K.save();
    return {coins,xp,capped,newBest,duplicate:false};
  };

  let active=null;
  const leave=()=>{try{active?.destroy()}catch(e){}active=null;K.jump=null};

  K.startJump=async()=>{
    leave();addSfx();
    K.startScoreRun();
    K.stopSpeech();
    const f=K.frame(`<section class="jump-screen fade-in"><img class="jungle-poster" src="${K.assetUrl(K.GAME_ART.jump)}" alt="" decoding="async"><div class="jump-mount" id="jumpMount"><div class="jungle-loading"><span class="spinner"></span><b>${t('jump.loading')}</b></div></div></section>`);
    const world=WORLDS.includes(K.state.jumpWorld)?K.state.jumpWorld:'underwater';
    K.audio.setTrack(MUSIC[world]).catch(()=>{});
    let mod;
    try{mod=await import(new URL(K.assetUrl('assets/games/jump/game.js'),document.baseURI).href)}
    catch(e){console.warn('Kwizillo jump:',e?.message||e);if(f.isConnected){K.toast(t('jump.loadError'));setTimeout(()=>K.backFromGame(),900)}return}
    if(!f.isConnected)return;   // the child already went elsewhere while the module loaded
    const mount=f.querySelector('#jumpMount');mount.innerHTML='';
    const game=mod.mountJump(mount,{
      text:(k,p)=>t('jump.'+k,p),
      overlay:true,watch:K.app,
      dir:K.state.language==='ar'?'rtl':'ltr',
      hero:K.state.jumpHero==='mia'?'mia':'mike',
      world,
      hintsSeen:K.state.jumpHints||{},
      onHintSeen:kind=>{K.state.jumpHints={...(K.state.jumpHints||{}),[kind]:true};K.save()},
      onHero:h=>{K.state.jumpHero=h;K.save()},
      onWorld:w=>{K.state.jumpWorld=w;K.save();K.audio.setTrack(MUSIC[w]).catch(()=>{})},
      best:w=>Number(jumpProgress().best[w]||0),
      reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches,
      sfx:k=>{const key=SFX[k];if(key)K.sfx(key)},
      onReady:()=>{const poster=f.querySelector('.jungle-poster');if(poster){poster.style.opacity='0';setTimeout(()=>poster.remove(),300)}},
      onStart:w=>{K.audio.unlock().catch(()=>{});K.audio.setTrack(MUSIC[w]).catch(()=>{});K.startScoreRun()},
      onComplete:reward=>{
        const booked=K.jumpReward(reward);
        if(!booked||booked.duplicate)return booked;
        if(reward.completed){K.sfx('fanfare');if(booked.coins)setTimeout(()=>K.sfx('reward'),600)}
        // the day's ceiling is said on the result card (a toast would sit under the game)
        if(booked.capped)booked.note=t('score.coinsCapped',{n:booked.coins,got:Number(reward.stars||0)+10});
        return booked;
      },
      onExit:()=>{active=null;K.jump=null;K.backFromGame()}
    });
    active={destroy:()=>game.destroy()};
    K.jump={game,progress:jumpProgress()};
  };
  // For the tests: the live game and the module's leak counters.
  K.jumpForTest=()=>K.jump?.game||null;
})();
