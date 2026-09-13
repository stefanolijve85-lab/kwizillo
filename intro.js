(()=>{
  const K=window.KWIZILLO_M1;
  if(!K) return;

  // The opening cinematic plays once per app launch and then hands over to Home.
  // Everything the intro owns lives here: playback, branding, sound design and exit.
  // There is exactly one exit path (`finish`) and it is idempotent, so a skip, a
  // natural end, a load error and the safety net can never navigate twice.

  const SAFETY_MS=30000; // Upper bound only. Never the normal way out.
  const SOUND_CUES=[[0,'world'],[1550,'tap'],[3200,'good'],[4750,'tap'],[6350,'world'],[7950,'good'],[9450,'tap'],[10850,'reward']];

  function playCue(name){
    if(K.state.soundOn===false) return;
    try{K.audio.play(name)}catch(e){}
  }

  async function startMusic(){
    try{ if(K.state.musicOn!==false) await K.audio.start(K.state.musicTrack||'magical',.12) }catch(e){}
  }

  K.playIntro=onDone=>{
    const url=K.MOTION?.home||K.config?.introVideoUrl||'';
    if(!url) return onDone();

    const frame=K.frame(`<div class="motion kwizillo-cinematic cinematic-playing fade-in">
      <video muted playsinline preload="auto" src="${url}"></video>
      <div class="intro-brand"><img class="intro-brand-logo" src="${K.BRAND_LOGO||''}" alt="Kwizillo"></div>
      <button class="motion-skip" aria-label="Intro overslaan">Overslaan</button>
    </div>`);

    const el=frame.querySelector('.motion');
    const video=el.querySelector('video');
    let timers=[],done=false;
    const schedule=(fn,ms)=>timers.push(setTimeout(fn,ms));

    const finish=()=>{
      if(done) return;
      done=true;
      timers.forEach(clearTimeout);
      timers=[];
      try{video.pause()}catch(e){}
      onDone();
    };

    // Tapping anywhere on the cinematic continues immediately (CLAUDE.md §5).
    el.addEventListener('pointerdown',finish);
    el.querySelector('.motion-skip').addEventListener('click',e=>{e.stopPropagation();finish()});
    video.addEventListener('ended',finish,{once:true});
    video.addEventListener('error',finish,{once:true});
    schedule(finish,SAFETY_MS);

    video.play().catch(()=>{});
    startMusic();
    SOUND_CUES.forEach(([ms,cue])=>ms?schedule(()=>playCue(cue),ms):playCue(cue));

    // Browsers need a real gesture before audio may start; arm it once.
    document.addEventListener('pointerdown',()=>{K.audio.unlock?.().then(startMusic).catch(()=>{})},{once:true,capture:true});
  };

  K.playIntro(()=>K.showHome());
})();
