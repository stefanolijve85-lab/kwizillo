(()=>{
  // The opening film starts before the rest of the app has loaded (4.8 MB of
  // scripts: every language's questions). intro.js adopts this very element
  // once the game is ready, so there is one decoder and the film never
  // restarts. Only where the intro fills the screen: a phone, and a tablet on
  // its side (which gets the wide film).
  //
  // It runs from <head>, before the stylesheets, so it does not wait for them.
  // Even so the web view needs about 0.7 s to start a film (measured in the
  // simulator on 2026-10-01). Showing the film's first frame meanwhile read as
  // "a picture, then the film", so there is no picture: the launch screen is
  // the plain brand blue, the page is that same blue, and the film fades in
  // from it the moment it really moves.
  const phone=window.matchMedia('(max-width:580px)').matches;
  const wide=!phone&&window.matchMedia('(min-width:860px) and (min-aspect-ratio:5/4)').matches;
  if(!phone&&!wide) return;
  const BLUE='#1d5fa8';   // = capacitor.config.json backgroundColor and the launch screen
  const root=document.documentElement;
  root.style.background=BLUE;
  // Same colour on both sides, so the launch screen can go at once.
  try{window.Capacitor?.Plugins?.SplashScreen?.hide?.({fadeOutDuration:0})}catch(e){}

  const v=document.createElement('video');
  v.id='introEarly';
  v.muted=true;v.playsInline=true;v.autoplay=true;v.preload='auto';
  v.setAttribute('playsinline','');v.setAttribute('aria-hidden','true');
  v.src=wide?'assets/brand/intro-wide.mp4':'assets/brand/intro.mp4';
  v.style.cssText=`position:fixed;inset:0;width:100%;height:100%;object-fit:cover;z-index:9999;background:${BLUE};pointer-events:none;opacity:0;transition:opacity .25s ease-out`;
  // The page keeps its own background once the film covers it.
  v.addEventListener('playing',()=>{v.style.opacity='1';setTimeout(()=>{root.style.background=''},400)},{once:true});
  root.appendChild(v);
  const p=v.play();if(p&&p.catch)p.catch(()=>{});
  // Never left behind: intro.js takes it (and drops the id) or removes it.
  setTimeout(()=>{if(v.id==='introEarly')v.remove()},30000);
})();
