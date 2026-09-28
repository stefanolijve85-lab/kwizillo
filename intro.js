(()=>{
  const K=window.KWIZILLO_M1;
  if(!K) return;

  // The opening cinematic plays once per app launch and then hands over to Home.
  // Everything the intro owns lives here: playback, branding, sound design and exit.
  // There is exactly one exit path (`finish`) and it is idempotent, so a skip, a
  // natural end, a load error and the safety net can never navigate twice.

  const SAFETY_MS=30000; // Upper bound only. Never the normal way out.

  async function startMusic(){
    try{ if(K.state.musicOn!==false) await K.audio.start(K.state.musicTrack||'home',.6) }catch(e){}
  }

  K.playIntro=onDone=>{
    // De staande film is 720 bij 1280. In het brede frame (tablet op zijn kant)
    // zou "cover" daar een smalle band uit snijden en die anderhalf keer
    // uitvergroten: ingezoomd en zacht. Er is dus een liggende film als die er
    // staat, en anders wordt de staande film heel getoond (landscape.css) met
    // de wereldkunst onscherp erachter.
    const wide=document.documentElement.dataset.shape==='wide';
    const url=(wide&&K.MOTION?.homeWide)||K.MOTION?.home||K.config?.introVideoUrl||'';
    if(!url) return onDone();

    const wideFilm=wide&&url===K.MOTION?.homeWide;
    const frame=K.frame(`<div class="motion kwizillo-cinematic cinematic-playing fade-in${wideFilm?' wide-film':''}">
      <video muted playsinline autoplay preload="auto" src="${url}"></video>
      <div class="intro-brand"><img class="intro-brand-logo" src="${K.BRAND_LOGO_SHADOW||K.BRAND_LOGO||''}" alt="Kwizillo"></div>
      <div class="intro-sound" id="introSound">🔊 ${K.t('intro.tapForSound')}</div>
    </div>`);

    const el=frame.querySelector('.motion');
    const video=el.querySelector('video');
    let timers=[],done=false,theme=null,soundOn=false,videoFailed=false,triedFallback=false;
    K.audio.holdMusic=true;   // the loop must not start under the theme; finish() releases it
    const schedule=(fn,ms)=>timers.push(setTimeout(fn,ms));
    const log=(...a)=>{try{K.debugLog?.('intro',...a)}catch(e){}};

    // The theme (music + children calling the name) runs in step with the
    // video: it starts at the video's current position, so a late audio unlock
    // still lands the shout on the logo. There is only ever one music source:
    // the theme during the intro, the game loop from Home onwards (CLAUDE.md §5).
    const startTheme=async()=>{
      if(theme||done||!K.INTRO_THEME) return;
      try{
        // "Tik voor geluid" is an explicit request: the theme plays even when
        // game music is off; the game itself stays silent afterwards.
        const h=await K.audio.sting?.(K.INTRO_THEME,{at:video.currentTime||0,force:true});
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

    // The film starts by itself (muted autoplay is allowed everywhere). The
    // first tap is the gesture that turns sound on: the theme joins at the
    // film's current position. The second tap continues to Home.
    // If autoplay is refused (Low Power Mode) the same first tap starts the film.
    const soundOnNow=()=>{
      if(soundOn||done) return;
      soundOn=true;
      el.querySelector('#introSound')?.remove();
      if(video.paused&&!videoFailed){const p=video.play();if(p&&p.catch)p.catch(()=>{})}
      K.audio.unlock?.().then(startTheme).catch(()=>{});
    };
    // iOS only treats touchend/click as a user activation for media, not
    // touchstart/pointerdown, so the taps are handled on click.
    el.addEventListener('click',()=>{soundOn?finish():soundOnNow()});
    el.setAttribute('role','button');el.setAttribute('aria-label',K.t('intro.tapForSound'));
    video.addEventListener('ended',finish,{once:true});
    for(const ev of ['loadedmetadata','canplay','playing','stalled','suspend','abort']) video.addEventListener(ev,()=>log(ev,'readyState',video.readyState),{once:true});
    video.addEventListener('error',()=>{
      // De liggende film is optioneel. Staat hij er niet, dan valt de intro
      // terug op de staande film in plaats van op een zwart scherm.
      const fallback=K.MOTION?.home||'';
      if(url!==fallback&&fallback&&!triedFallback){
        triedFallback=true;log('wide intro ontbreekt, val terug op',fallback);
        el.classList.remove('wide-film');
        video.src=fallback;video.load();const r=video.play();if(r&&r.catch)r.catch(()=>{});
        return;
      }
      videoFailed=true;
      const err=video.error;
      console.warn('Kwizillo intro: video failed to load',err?.code,err?.message||'');
      log('error',err?.code,err?.message||'');
      // Nothing to show: the logo animation carries on over the dark
      // background and the theme still gets its 12 seconds after the tap.
      el.classList.add('poster-only');
      timers.forEach(clearTimeout);timers=[];
      schedule(finish,soundOn?12500:SAFETY_MS);
    });
    schedule(finish,SAFETY_MS);
    const p=video.play();
    if(p&&p.catch) p.catch(e=>{log('autoplay refused',e?.name);el.querySelector('#introSound').textContent='▶ '+K.t('intro.tapToStart')});
  };

  // First run goes to onboarding, returning players go straight to Home.
  K.playIntro(()=>K.needsOnboarding()?K.startOnboarding():K.showHome());
})();
