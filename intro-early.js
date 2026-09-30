(()=>{
  // The opening film starts before the rest of the app has loaded (4.8 MB of
  // scripts: every language's questions). Without this the launch screen, the
  // film's first frame, stood still for a second or two before anything moved.
  // intro.js adopts this very element once the game is ready, so there is one
  // decoder and the film never restarts. Only where the intro fills the screen:
  // a phone, and a tablet on its side (which gets the wide film).
  const phone=window.matchMedia('(max-width:580px)').matches;
  const wide=!phone&&window.matchMedia('(min-width:860px) and (min-aspect-ratio:5/4)').matches;
  if(!phone&&!wide) return;
  const v=document.createElement('video');
  v.id='introEarly';
  v.muted=true;v.playsInline=true;v.autoplay=true;v.preload='auto';
  v.setAttribute('playsinline','');v.setAttribute('aria-hidden','true');
  v.src=wide?'assets/brand/intro-wide.mp4':'assets/brand/intro.mp4';
  v.style.cssText='position:fixed;inset:0;width:100%;height:100%;object-fit:cover;z-index:9999;background:#0b3a7a;pointer-events:none';
  v.addEventListener('playing',()=>{try{window.Capacitor?.Plugins?.SplashScreen?.hide?.({fadeOutDuration:200})}catch(e){}},{once:true});
  document.body.appendChild(v);
  const p=v.play();if(p&&p.catch)p.catch(()=>{});
  // Never left behind: intro.js takes it (and drops the id) or removes it.
  setTimeout(()=>{if(v.id==='introEarly')v.remove()},30000);
})();
