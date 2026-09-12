(()=>{
  // One-time migration so existing testers see the branded + sound-designed cinematic once.
  const INTRO_VERSION='kwizillo-intro-cinematic-v5';
  if(localStorage.getItem(INTRO_VERSION)!=='seen'){
    sessionStorage.removeItem('kwizillo-intro-v4');
    localStorage.setItem(INTRO_VERSION,'seen');
  }

  // The prototype helper still carries a 4.7s fallback. The cinematic now waits
  // for the user's Start Kwizillo gesture (needed for reliable web audio), so
  // give that fallback a long safety window. Video ended/error/skip still exits immediately.
  const nativeSetTimeout=window.setTimeout.bind(window);
  window.setTimeout=(fn,delay,...args)=>nativeSetTimeout(fn,Number(delay)===4700?90000:delay,...args);
  nativeSetTimeout(()=>{window.setTimeout=nativeSetTimeout},0);
})();