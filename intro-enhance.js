(()=>{
  const K=window.KWIZILLO_M1;
  if(!K) return;
  let introTimers=[];
  const clearTimers=()=>{introTimers.forEach(clearTimeout);introTimers=[]};
  const schedule=(fn,ms)=>introTimers.push(setTimeout(fn,ms));
  const playCue=name=>{if(K.state.soundOn===false)return;try{K.audio.play(name)}catch(e){}};

  async function tryStartSound(){
    try{
      if(K.state.musicOn!==false) await K.audio.start(K.state.musicTrack||'magical',.12);
    }catch(e){}
  }

  function scheduleSoundDesign(){
    clearTimers();
    playCue('world');
    schedule(()=>playCue('tap'),1550);
    schedule(()=>playCue('good'),3200);
    schedule(()=>playCue('tap'),4750);
    schedule(()=>playCue('world'),6350);
    schedule(()=>playCue('good'),7950);
    schedule(()=>playCue('tap'),9450);
    schedule(()=>playCue('reward'),10850);
  }

  function enhance(motion){
    if(!motion||motion.dataset.enhanced==='1')return;
    const video=motion.querySelector('video');
    if(!video)return;
    const current=String(video.currentSrc||video.src||'');
    const home=String(K.MOTION?.home||K.config?.introVideoUrl||'');
    if(!home||!current.includes(home.split('/').pop()))return;

    motion.dataset.enhanced='1';
    motion.classList.add('kwizillo-cinematic','cinematic-playing');
    motion.querySelector('.motion-badge')?.remove();
    motion.querySelector('.motion-skip')?.remove();

    const brand=document.createElement('div');
    brand.className='intro-brand';
    brand.innerHTML=`<img class="intro-brand-logo" src="${K.BRAND_LOGO||''}" alt="Kwizillo">`;
    motion.appendChild(brand);

    // Start the cinematic immediately. Web browsers require muted autoplay;
    // audio is armed in parallel and resumes on the first normal user gesture.
    video.muted=true;
    video.playsInline=true;
    video.autoplay=true;
    try{video.currentTime=0}catch(e){}
    video.play().catch(()=>{});
    tryStartSound();
    scheduleSoundDesign();

    const unlockSound=()=>{
      K.audio.unlock?.().then(()=>tryStartSound()).catch(()=>{});
    };
    document.addEventListener('pointerdown',unlockSound,{once:true,capture:true});

    video.addEventListener('ended',()=>{
      clearTimers();
      motion.classList.remove('cinematic-playing');
    },{once:true});
    video.addEventListener('error',()=>clearTimers(),{once:true});
  }

  const run=()=>enhance(document.querySelector('.motion'));
  run();
  const observer=new MutationObserver(run);
  observer.observe(K.app,{childList:true,subtree:true});
})();