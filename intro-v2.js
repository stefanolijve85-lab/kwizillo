(()=>{
  // One-time migration so existing testers see the new cinematic once.
  const INTRO_VERSION='kwizillo-intro-cinematic-v2';
  if(localStorage.getItem(INTRO_VERSION)!=='seen'){
    sessionStorage.removeItem('kwizillo-intro-v4');
    localStorage.setItem(INTRO_VERSION,'seen');
  }

  // m1-ui's original prototype motion helper had a 4.7s safety timeout.
  // Keep that helper untouched but extend only that one timeout during boot so
  // the new 12s opening cinematic is allowed to finish normally.
  const nativeSetTimeout=window.setTimeout.bind(window);
  window.setTimeout=(fn,delay,...args)=>nativeSetTimeout(fn,Number(delay)===4700?12500:delay,...args);
  nativeSetTimeout(()=>{window.setTimeout=nativeSetTimeout},0);
})();