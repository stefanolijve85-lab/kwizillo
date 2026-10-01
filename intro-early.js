(()=>{
  // The opening film starts before the rest of the app has loaded (4.8 MB of
  // scripts: every language's questions). Without this the launch screen, the
  // film's first frame, stood still for a second or two before anything moved.
  // intro.js adopts this very element once the game is ready, so there is one
  // decoder and the film never restarts. Only where the intro fills the screen:
  // a phone, and a tablet on its side (which gets the wide film).
  //
  // It runs from <head>, before the stylesheets, so it does not wait for them.
  // Even so, the web view needs about 0.7 s to start a film (measured in the
  // simulator on 2026-10-01, and barely shorter with a ten times smaller file).
  // That wait is covered by the film's own first frame, gently moving in the
  // direction the camera flies, so the launch screen is never a frozen picture;
  // it fades into the film the moment the film really plays.
  const phone=window.matchMedia('(max-width:580px)').matches;
  const wide=!phone&&window.matchMedia('(min-width:860px) and (min-aspect-ratio:5/4)').matches;
  if(!phone&&!wide) return;
  const root=document.documentElement;
  const hideSplash=()=>{try{window.Capacitor?.Plugins?.SplashScreen?.hide?.({fadeOutDuration:200})}catch(e){}};

  const css=document.createElement('style');
  css.textContent='@keyframes introStill{from{transform:scale(1)}to{transform:scale(1.07)}}'
    +'#introStill{position:fixed;inset:0;z-index:10000;pointer-events:none;background:#1d5fa8 center/cover no-repeat;transform-origin:50% 52%;animation:introStill 5s cubic-bezier(.3,.2,.4,1) forwards;transition:opacity .3s ease}'
    +'#introStill.gone{opacity:0}';
  root.appendChild(css);
  const first=wide?'assets/brand/intro-wide-first.jpg':'assets/brand/intro-first.jpg';
  const still=document.createElement('div');
  still.id='introStill';still.setAttribute('aria-hidden','true');
  const shot=new Image();shot.src=first;
  // The launch screen goes once the moving copy is really on screen.
  let dropped=false;
  const show=()=>{if(dropped)return;still.style.backgroundImage=`url("${first}")`;root.appendChild(still);requestAnimationFrame(()=>requestAnimationFrame(hideSplash))};
  (shot.decode?shot.decode():Promise.resolve()).then(show,show);
  // Gone with the film playing, a refusal, or at the latest after 8 s; intro.js also clears it.
  const drop=()=>{dropped=true;still.classList.add('gone');setTimeout(()=>{still.remove();css.remove()},350)};
  setTimeout(drop,8000);

  const v=document.createElement('video');
  v.id='introEarly';
  v.muted=true;v.playsInline=true;v.autoplay=true;v.preload='auto';
  v.setAttribute('playsinline','');v.setAttribute('aria-hidden','true');
  v.src=wide?'assets/brand/intro-wide.mp4':'assets/brand/intro.mp4';
  v.style.cssText='position:fixed;inset:0;width:100%;height:100%;object-fit:cover;z-index:9999;background:#0b3a7a;pointer-events:none';
  v.addEventListener('playing',()=>{hideSplash();drop()},{once:true});
  root.appendChild(v);
  const p=v.play();if(p&&p.catch)p.catch(drop);
  // Never left behind: intro.js takes it (and drops the id) or removes it.
  setTimeout(()=>{if(v.id==='introEarly')v.remove()},30000);
  window.KWIZILLO_DROP_INTRO_STILL=drop;
})();
