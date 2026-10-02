(()=>{
  // The opening film starts before the rest of the app has loaded (4.8 MB of
  // scripts: every language's questions). intro.js adopts this very element
  // once the game is ready, so there is one decoder and the film never
  // restarts. Only where the intro fills the screen: a phone, and a tablet on
  // its side (which gets the wide film).
  //
  // It runs from <head>, before the stylesheets, so it does not wait for them.
  // Even so the web view needs about 0.7 s to start a film (measured in the
  // simulator on 2026-10-01). That wait is covered by the film's own first
  // frame, exactly: the launch screen is that frame (tools/splash.swift), the
  // page shows the same file, cropped the same way, and the film appears on
  // top of it the moment it plays. Same pixels on every layer, nothing moves,
  // so there is nothing to see but the film starting.
  const phone=window.matchMedia('(max-width:580px)').matches;
  const wide=!phone&&window.matchMedia('(min-width:860px) and (min-aspect-ratio:5/4)').matches;
  if(!phone&&!wide) return;
  const BLUE='#1d5fa8';   // = capacitor.config.json backgroundColor
  const root=document.documentElement;
  root.style.background=BLUE;
  const full='position:fixed;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none;';

  const still=new Image();
  still.src=wide?'assets/brand/intro-wide-first.png':'assets/brand/intro-first.png';
  still.alt='';still.setAttribute('aria-hidden','true');
  still.style.cssText=full+'z-index:9998';
  let stillGone=false;
  // Only ever under a film that is on screen, so its going is invisible.
  const stillOut=()=>{if(stillGone)return;stillGone=true;still.remove()};
  window.KWIZILLO_INTRO_MARK_OUT=stillOut;
  const showStill=()=>{if(stillGone)return;root.appendChild(still);requestAnimationFrame(()=>requestAnimationFrame(()=>{try{window.Capacitor?.Plugins?.SplashScreen?.hide?.({fadeOutDuration:0})}catch(e){}}))};
  (still.decode?still.decode():Promise.resolve()).then(showStill,showStill);

  const v=document.createElement('video');
  v.id='introEarly';
  v.muted=true;v.playsInline=true;v.autoplay=true;v.preload='auto';
  v.setAttribute('playsinline','');v.setAttribute('aria-hidden','true');
  v.src=wide?'assets/brand/intro-wide.mp4':'assets/brand/intro.mp4';
  // Never hidden: iOS does not autoplay a video it considers invisible
  // (opacity 0 kept it waiting for ever on a real iPhone; the simulator plays
  // it anyway). Its poster is the same first frame, so nothing shows until
  // the film moves.
  v.poster=still.src;
  v.style.cssText=full+'z-index:9999;background:transparent';
  // The still under it goes a couple of frames after the film really plays.
  // intro.js reads data-playing when it takes the element over.
  v.addEventListener('playing',()=>{v.dataset.playing='1';setTimeout(()=>{stillOut();root.style.background=''},150)},{once:true});
  root.appendChild(v);
  const p=v.play();if(p&&p.catch)p.catch(()=>{});
  // Never left behind: intro.js takes it (and drops the id) or removes it.
  setTimeout(()=>{if(v.id==='introEarly')v.remove()},30000);
  setTimeout(stillOut,30000);
})();
