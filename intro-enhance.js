(()=>{
  const K=window.KWIZILLO_M1;
  if(!K) return;
  let introTimers=[];
  const clearTimers=()=>{introTimers.forEach(clearTimeout);introTimers=[]};
  const schedule=(fn,ms)=>introTimers.push(setTimeout(fn,ms));

  async function startWithSound(motion,video,gate){
    if(gate.dataset.started==='1') return;
    gate.dataset.started='1';
    gate.classList.add('hide');
    clearTimers();
    try{await K.audio.unlock()}catch(e){}
    try{
      if(K.state.musicOn!==false){
        await K.audio.setTrack('magical');
        K.audio.setMusicVolume(Math.max(.24,Number(K.state.musicVolume||.24)));
      }
    }catch(e){}
    if(K.state.soundOn!==false) K.audio.play('world');
    try{video.currentTime=0;await video.play()}catch(e){}
    schedule(()=>{if(K.state.soundOn!==false)K.audio.play('tap')},2900);
    schedule(()=>{if(K.state.soundOn!==false)K.audio.play('world')},5750);
    schedule(()=>{if(K.state.soundOn!==false)K.audio.play('reward')},10350);
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
    const brand=document.createElement('div');brand.className='intro-brand';brand.innerHTML='<div class="intro-brand-logo">Kwizillo</div><div class="intro-brand-star">★</div>';motion.appendChild(brand);
    const gate=document.createElement('div');gate.className='intro-start-gate';gate.innerHTML='<button class="intro-start-btn" type="button"><span>🔊</span><span>Start Kwizillo</span></button>';motion.appendChild(gate);
    const note=document.createElement('div');note.className='intro-sound-note';note.textContent='Intro met muziek en geluidseffecten';motion.appendChild(note);
    gate.querySelector('.intro-start-btn').onclick=()=>startWithSound(motion,video,gate);
    const skip=motion.querySelector('.motion-skip');
    if(skip) skip.addEventListener('click',()=>clearTimers(),{once:true});
    video.addEventListener('ended',()=>clearTimers(),{once:true});
  }

  const run=()=>enhance(document.querySelector('.motion'));
  run();
  const observer=new MutationObserver(run);observer.observe(K.app,{childList:true,subtree:true});
})();