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
  // "a picture, then the film". Instead the launch screen is the app icon on the
  // brand blue, the page holds that same picture, and the film fades in over it
  // the moment it really moves.
  const phone=window.matchMedia('(max-width:580px)').matches;
  const wide=!phone&&window.matchMedia('(min-width:860px) and (min-aspect-ratio:5/4)').matches;
  if(!phone&&!wide) return;
  const BLUE='#1d5fa8';   // = capacitor.config.json backgroundColor and the launch screen
  const root=document.documentElement;
  root.style.background=BLUE;
  // The launch screen shows the app icon in the middle of that blue
  // (tools/splash.swift). The page draws the very same mark at the very same
  // spot: the icon is 18.485% of the screen's longer side (an aspect-filled
  // square grows with the longer side), plus 14% shadow margin each side. So
  // the launch screen can go at once without anything moving, and the mark
  // fades as the film comes in.
  const mark=new Image();
  mark.src='assets/brand/splash-mark.png';mark.alt='';mark.setAttribute('aria-hidden','true');
  mark.style.cssText='position:fixed;left:50%;top:50%;width:calc(18.485vmax * 1.28);height:auto;transform:translate(-50%,-50%);z-index:10000;pointer-events:none;transition:opacity .25s ease-out';
  let markGone=false;
  const markOut=()=>{if(markGone)return;markGone=true;mark.style.opacity='0';setTimeout(()=>mark.remove(),300)};
  window.KWIZILLO_INTRO_MARK_OUT=markOut;
  const showMark=()=>{if(markGone)return;root.appendChild(mark);requestAnimationFrame(()=>requestAnimationFrame(()=>{try{window.Capacitor?.Plugins?.SplashScreen?.hide?.({fadeOutDuration:0})}catch(e){}}))};
  (mark.decode?mark.decode():Promise.resolve()).then(showMark,showMark);
  setTimeout(markOut,8000);   // never left behind

  const v=document.createElement('video');
  v.id='introEarly';
  v.muted=true;v.playsInline=true;v.autoplay=true;v.preload='auto';
  v.setAttribute('playsinline','');v.setAttribute('aria-hidden','true');
  v.src=wide?'assets/brand/intro-wide.mp4':'assets/brand/intro.mp4';
  v.style.cssText=`position:fixed;inset:0;width:100%;height:100%;object-fit:cover;z-index:9999;background:${BLUE};pointer-events:none;opacity:0;transition:opacity .25s ease-out`;
  // The page keeps its own background once the film covers it.
  v.addEventListener('playing',()=>{v.style.opacity='1';markOut();setTimeout(()=>{root.style.background=''},400)},{once:true});
  root.appendChild(v);
  const p=v.play();if(p&&p.catch)p.catch(()=>{});
  // Never left behind: intro.js takes it (and drops the id) or removes it.
  setTimeout(()=>{if(v.id==='introEarly')v.remove()},30000);
})();
