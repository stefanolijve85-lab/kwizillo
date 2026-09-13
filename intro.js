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
      <video muted playsinline preload="auto" poster="${K.MOTION?.poster||''}" src="${url}"></video>
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
    //
    // video.play() is called synchronously inside the tap (iOS Low Power Mode
    // refuses a play() that comes after an await), the audio unlock follows.
    // If the video cannot play at all, the poster stays and the theme still
    // runs for its 12 seconds, so the child never lands on Home in silence.
    let videoFailed=false;
    const log=(...a)=>{try{K.debugLog?.('intro',...a)}catch(e){}};
    const posterFallback=()=>{
      log('poster fallback');
      el.classList.add('cinematic-playing','poster-only');
      startTheme();
      schedule(finish,12500);
    };
    const start=()=>{
      if(started||done) return;
      started=true;
      el.querySelector('#introStart')?.remove();
      schedule(finish,SAFETY_MS);
      if(videoFailed){K.audio.unlock?.().catch(()=>{});posterFallback();return}
      el.classList.add('cinematic-playing');
      video.addEventListener('playing',startTheme,{once:true});
      const p=video.play();
      if(p&&p.catch) p.catch(e=>{log('play() rejected',e?.name,e?.message);if(!done)posterFallback()});
      K.audio.unlock?.().then(startTheme).catch(()=>{});
    };
    el.addEventListener('pointerdown',()=>{started?finish():start()});
    el.setAttribute('role','button');el.setAttribute('aria-label',K.t('intro.tapToStart'));
    video.addEventListener('ended',finish,{once:true});
    for(const ev of ['loadedmetadata','canplay','stalled','suspend','abort']) video.addEventListener(ev,()=>log(ev,'readyState',video.readyState),{once:true});
    video.addEventListener('error',()=>{
      videoFailed=true;
      const err=video.error;
      console.warn('Kwizillo intro: video failed to load',err?.code,err?.message||'');
      log('error',err?.code,err?.message||'');
      if(started&&!done&&!el.classList.contains('poster-only')){timers.forEach(clearTimeout);timers=[];posterFallback()}
    },{once:true});
  };

  // First run goes to onboarding, returning players go straight to Home.
  K.playIntro(()=>K.needsOnboarding()?K.startOnboarding():K.showHome());
})();
