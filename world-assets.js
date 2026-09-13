(()=>{
  const K=window.KWIZILLO_M1=window.KWIZILLO_M1||{};

  // All artwork ships with the app. Nothing here reaches out to a CDN, so the
  // game works offline and an App Review reviewer never sees an empty screen.
  // These assets contain no baked-in UI, logo, labels or buttons.
  K.MASTER={
    ruimte:'assets/worlds/ruimte.jpg',
    dieren:'assets/worlds/dieren.jpg',
    aarde:'assets/worlds/aarde.jpg',
    geschiedenis:'assets/worlds/geschiedenis.jpg',
    wetenschap:'assets/worlds/wetenschap.jpg',
    mysterie:'assets/worlds/mysterie.jpg'
  };

  // 16:9 question illustrations, matched to a question by subject.
  K.QUESTION_ART={
    space:'assets/questions/space.jpg',
    body:'assets/questions/body.jpg',
    dissolve:'assets/questions/dissolve.jpg',
    light:'assets/questions/light.jpg',
    lab:'assets/questions/lab.jpg',
    castle:'assets/questions/castle.jpg'
  };

  // Opening cinematic only. Entering a world is immediate, by design.
  K.MOTION={home:'assets/brand/intro.mp4'};
  K.BRAND_LOGO='assets/brand/logo.png';
})();
