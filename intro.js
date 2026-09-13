(()=>{
  const K=window.KWIZILLO_M1;
  if(!K) return;

  // The opening cinematic plays once per app launch and then hands over to Home.
  // Everything the intro owns lives here: playback, branding, sound design and exit.
  // There is exactly one exit path (`finish`) and it is idempotent, so a skip, a
  // natural end, a load error and the safety net can never navigate twice.

  const SAFETY_MS=30000; // Upper bound only. Never the normal way out.

  async function startMusic(){
    try{ if(K.state.musicOn!==false) await K.audio.start(K.state.musicTrack||'magical',.6) }catch(e){}
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
    el.querySelector('.motion-skip').textContent=K.t('intro.skip');
    el.querySelector('.motion-skip').setAttribute('aria-label',K.t('intro.skip'));
    let timers=[],done=false,theme=null;
    const schedule=(fn,ms)=>timers.push(setTimeout(fn,ms));

    // The theme (music + children calling the name) runs in step with the
    // video: it starts at the video's current position, so a late audio unlock
    // still lands the shout on the logo. There is only ever one music source:
    // the theme during the intro, the game loop from Home onwards (CLAUDE.md §5).
    const startTheme=async()=>{
      if(theme||done||!K.INTRO_THEME||K.state.musicOn===false) return;
      try{
        const h=await K.audio.sting?.(K.INTRO_THEME,{at:video.currentTime||0});
        if(!h) return;
        if(done) h.stop(.1); else theme=h;
      }catch(e){}
    };

    const finish=()=>{
      if(done) return;
      done=true;
      timers.forEach(clearTimeout);
      timers=[];
      try{video.pause()}catch(e){}
      theme?.stop(.6);
      startMusic();
      onDone();
    };

    // Tapping anywhere on the cinematic continues immediately (CLAUDE.md §5).
    el.addEventListener('pointerdown',finish);
    el.querySelector('.motion-skip').addEventListener('click',e=>{e.stopPropagation();finish()});
    video.addEventListener('ended',finish,{once:true});
    video.addEventListener('error',finish,{once:true});
    schedule(finish,SAFETY_MS);

    video.addEventListener('playing',startTheme,{once:true});
    video.play().catch(()=>{});
    startTheme();
  };

  // First run goes to onboarding, returning players go straight to Home.
  K.playIntro(()=>K.needsOnboarding()?K.startOnboarding():K.showHome());
})();
