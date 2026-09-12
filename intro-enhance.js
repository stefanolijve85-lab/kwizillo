(()=>{
  const K=window.KWIZILLO_M1;
  if(!K) return;
  let introTimers=[];
  const clearTimers=()=>{introTimers.forEach(clearTimeout);introTimers=[]};
  const schedule=(fn,ms)=>introTimers.push(setTimeout(fn,ms));

  function playCue(name){
    if(K.state.soundOn===false) return;
    try{K.audio.play(name)}catch(e){}
  }

  async function startWithSound(motion,video,gate){
    if(gate.dataset.started==='1') return;
    gate.dataset.started='1';
    gate.classList.add('hide');
    motion.classList.add('cinematic-playing');
    clearTimers();

    try{await K.audio.unlock()}catch(e){}
    try{
      if(K.state.musicOn!==false){
        await K.audio.start(K.state.musicTrack||'magical',.18);
      }
    }catch(e){}

    playCue('world');
    try{video.currentTime=0;await video.play()}catch(e){}

    // Sound design follows the six-world rhythm of the 12s cinematic.
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
    motion.classList.add('kwizillo-cinematic');
    video.muted=true;
    try{video.pause();video.currentTime=0}catch(e){}
    motion.querySelector('.motion-badge')?.remove();

    const brand=document.createElement('div');
    brand.className='intro-brand';
    brand.innerHTML='<img class="intro-brand-logo" src="assets/kwizillo-logo.svg" alt="Kwizillo">';
    motion.appendChild(brand);

    const gate=document.createElement('div');
    gate.className='intro-start-gate';
    gate.innerHTML='<button class="intro-start-btn" type="button" aria-label="Start Kwizillo intro met geluid"><span>🔊</span><span>Start Kwizillo</span></button>';
    motion.appendChild(gate);

    const note=document.createElement('div');
    note.className='intro-sound-note';
    note.textContent='Muziek + spelgeluiden';
    motion.appendChild(note);

    gate.querySelector('.intro-start-btn').onclick=()=>startWithSound(motion,video,gate);

    const stopIntroAudio=()=>{
      clearTimers();
      motion.classList.remove('cinematic-playing');
    };
    const skip=motion.querySelector('.motion-skip');
    if(skip) skip.addEventListener('click',stopIntroAudio,{once:true});
    video.addEventListener('ended',stopIntroAudio,{once:true});
  }

  const run=()=>enhance(document.querySelector('.motion'));
  run();
  const observer=new MutationObserver(run);
  observer.observe(K.app,{childList:true,subtree:true});
})();