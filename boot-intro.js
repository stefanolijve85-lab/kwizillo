(()=>{
  const K=window.KWIZILLO_M1;
  if(!K||typeof K.showHome!=='function')return;
  // App launch always begins with the cinematic, then flows directly into Home.
  // Home/world navigation later in the same session never replays it.
  K.showHome(true);
})();