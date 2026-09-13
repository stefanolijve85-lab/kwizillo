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

    const frame=K.frame(`<div class="motion kwizillo-cinematic fade-in">
      <video muted playsinline preload="auto" src="${url}"></video>
      <div class="intro-brand"><img class="intro-brand-logo" src="${K.BRAND_LOGO||''}" alt="Kwizillo"></div>
      <div class="intro-start" id="introStart"><span>${K.t('intro.tapToStart')}</span></div>
    </div>`);

    const el=frame.querySelector('.motion');
    const video=el.querySelector('video');
    let timers=[],done=false,theme=null,started=false;
    K.audio.holdMusic=true;   // the loop must not start under the theme; finish() releases it
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
      K.audio.holdMusic=false;
      startMusic();
      onDone();
    };

    // The cinematic waits for one tap: that tap is the gesture every browser
    // needs before sound may play, so the theme is heard from the first frame.
    // A second tap anywhere continues to Home; there is no separate skip button.
    let videoFailed=false;
    const start=async()=>{
      if(started||done) return;
      started=true;
      try{await K.audio.unlock?.()}catch(e){}
      if(videoFailed||done){finish();return}  // nothing to show: straight on
      el.classList.add('cinematic-playing');
      el.querySelector('#introStart')?.remove();
      video.addEventListener('playing',startTheme,{once:true});
      video.play().catch(()=>{});
      startTheme();
      schedule(finish,SAFETY_MS);
    };
    el.addEventListener('pointerdown',()=>{started?finish():start()});
    el.setAttribute('role','button');el.setAttribute('aria-label',K.t('intro.tapToStart'));
    video.addEventListener('ended',finish,{once:true});
    video.addEventListener('error',()=>{videoFailed=true;if(started)finish()},{once:true});
  };

  // First run goes to onboarding, returning players go straight to Home.
  K.playIntro(()=>K.needsOnboarding()?K.startOnboarding():K.showHome());
})();
