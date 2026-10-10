(()=>{
  // The Android back button (and the back gesture). The game has no browser
  // history, so without this Capacitor would close the app from any screen.
  // It does what the child would tap: close what lies on top, else the screen's
  // own back button, else go Home; on Home it puts the app away (not closed, so
  // progress and music resume as they were).
  const K=window.KWIZILLO_M1;
  const App=window.Capacitor?.isNativePlatform?.()&&window.Capacitor.Plugins?.App;
  if(!K||!App?.addListener)return;

  const shown=el=>!!el&&el.isConnected&&el.getClientRects().length>0&&getComputedStyle(el).visibility!=='hidden';
  const first=sel=>[...document.querySelectorAll(sel)].reverse().find(shown);   // the topmost is last in the DOM

  // What lies on top of a screen, most recent first.
  const OVERLAYS='.mascot-unlock-ok,#feedbackClose,.hint-close,.simple-close,.sound-close,.confirm-actions .cancel';
  // Each screen's own way back.
  const BACKS='#qBack,#worldBack,#whoBack,#memoBack,#mathBack,#fzBack,#premiumBack,#obBack,#wbBack,.panel-back,.quiz-back,.onboarding-back';

  K.nativeBack=()=>{
    const runner=document.querySelector('kwizillo-jungle');
    if(runner){
      if(['playing','countdown'].includes(runner.phase)){runner.pause();return 'pause'}
      const exit=runner.shadowRoot?.querySelector('[data-act="exit"]');
      if(exit){exit.click();return 'exit'}
    }
    const jump=K.jumpForTest?.();
    if(jump&&jump.element?.isConnected){
      if(['play','count'].includes(jump.screen)){jump.pause();return 'pause'}
      const exit=jump.element.querySelector('[data-act="exit"]');
      if(exit){exit.click();return 'exit'}
    }
    const top=first(OVERLAYS)||first(BACKS);
    if(top){top.click();return 'back'}
    if(document.querySelector('.kwizillo-cinematic')){document.querySelector('.motion')?.click();return 'skip'}
    if(!document.querySelector('.home')&&K.state?.onboardingComplete){K.showHome();return 'home'}
    App.minimizeApp?.();return 'minimize';
  };
  App.addListener('backButton',()=>{try{K.nativeBack()}catch(e){K.showHome?.()}});
})();
