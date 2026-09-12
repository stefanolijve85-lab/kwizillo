(()=>{
  // One-time migration so existing testers see the branded soundtrack cinematic once.
  const INTRO_VERSION='kwizillo-intro-cinematic-v4';
  if(localStorage.getItem(INTRO_VERSION)!=='seen'){
    sessionStorage.removeItem('kwizillo-intro-v4');
    localStorage.setItem(INTRO_VERSION,'seen');
  }

  // m1-ui still contains the prototype 4.7s fallback. Extend only that exact
  // fallback during boot so the 12s cinematic can finish; normal timers remain untouched.
  const nativeSetTimeout=window.setTimeout.bind(window);
  window.setTimeout=(fn,delay,...args)=>nativeSetTimeout(fn,Number(delay)===4700?13500:delay,...args);
  nativeSetTimeout(()=>{window.setTimeout=nativeSetTimeout},0);
})();