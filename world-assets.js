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

  // Question illustrations come in two tiers, both 16:9.
  //
  // 1. Subject art, chosen from the wording of the question itself. This is the
  //    closest match and wins when a question is clearly about one of these.
  K.QUESTION_ART={
    space:'assets/questions/space.jpg',
    body:'assets/questions/body.jpg',
    dissolve:'assets/questions/dissolve.jpg',
    light:'assets/questions/light.jpg',
    lab:'assets/questions/lab.jpg',
    castle:'assets/questions/castle.jpg'
  };

  // 2. Topic art, one illustration per topic, covering all 24. Every question
  //    therefore gets a relevant picture; the world background is never reused
  //    as the question illustration.
  K.TOPIC_ART={
    zonnestelsel:'assets/topics/zonnestelsel.jpg',
    sterren_planeten:'assets/questions/space.jpg',
    astronauten:'assets/topics/astronauten.jpg',
    raket_avontuur:'assets/topics/raket_avontuur.jpg',

    egyptenaren:'assets/topics/egyptenaren.jpg',
    ridders_kastelen:'assets/questions/castle.jpg',
    romeinen:'assets/topics/romeinen.jpg',
    ontdekkingsreizigers:'assets/topics/ontdekkingsreizigers.jpg',

    slimme_proefjes:'assets/questions/lab.jpg',
    lichaam:'assets/questions/body.jpg',
    uitvindingen:'assets/topics/uitvindingen.jpg',
    natuur_energie:'assets/topics/natuur_energie.jpg',

    raadsels:'assets/topics/raadsels.jpg',
    verborgen_schatten:'assets/topics/verborgen_schatten.jpg',
    natuurmysteries:'assets/topics/natuurmysteries.jpg',
    speurtocht:'assets/topics/speurtocht.jpg',

    snelle_dieren:'assets/topics/snelle_dieren.jpg',
    baby_dieren:'assets/topics/baby_dieren.jpg',
    waterdieren:'assets/topics/waterdieren.jpg',
    jungle:'assets/topics/jungle.jpg',

    continenten_landen:'assets/topics/continenten_landen.jpg',
    weer_klimaat:'assets/topics/weer_klimaat.jpg',
    oceanen_natuur:'assets/topics/oceanen_natuur.jpg',
    kaarten_navigatie:'assets/topics/kaarten_navigatie.jpg'
  };

  // Opening cinematic only. Entering a world is immediate, by design.
  // intro.mp4 is H.264 720p with the moov atom in front (fast start), 4.4 MB.
  K.MOTION={home:'assets/brand/intro.mp4'};
  // The intro theme: a 12 s sting built by tools/intro-audio.js + intro-mix.cjs,
  // children call "Kwizillo!" as the logo lands (about 10 s in).
  K.INTRO_THEME='assets/audio/intro_theme.wav';
  K.BRAND_LOGO='assets/brand/logo.png';
  // Same logo with its shadow baked in (tools/logo-shadow.cjs), for the intro.
  K.BRAND_LOGO_SHADOW='assets/brand/logo-shadow.png';
  // Menu tiles for the two extra games.
  // New file names on every re-render: assets are cached for a day, so a replaced image under the same name would show stale.
  K.GAME_ART={memo:'assets/games/memo-island.jpg',math:'assets/games/math-island.jpg',memoAll:'assets/games/worlds-all.jpg',facts:'assets/games/facts-island.jpg',whoami:'assets/games/whoami-island.jpg'};

  // Mascot portraits, used wherever the app shows Milo or Luna as a face:
  // Home HUD, voice pickers, onboarding, feedback and result cards.
  // Assets are cached for a day by the browser; a redrawn file under the same
  // name would show stale. Bump this when a guide image is replaced.
  K.ASSET_V='v16';
  K.assetUrl=p=>`${p}?${K.ASSET_V}`;
  K.MASCOT_ART={
    milo:K.assetUrl('assets/mascots/milo.jpg'),luna:K.assetUrl('assets/mascots/luna.jpg'),
    comet:'assets/mascots/comet.jpg',pootje:'assets/mascots/pootje.jpg',terra:'assets/mascots/terra.jpg',
    sparky:'assets/mascots/sparky.jpg',lumi:'assets/mascots/lumi.jpg'
  };
  // Second wave of buddies (tools/mascot-prompts.md). Add an id here once its
  // 512x512 picture is in assets/mascots/, so the collection never shows an
  // empty tile: nova, kiko, pip, ravi, flora, draco.
  for(const id of ['nova','kiko','pip','ravi','flora','draco']) K.MASCOT_ART[id]=`assets/mascots/${id}.jpg`;
  K.guideArt=voice=>voice==='Luna'?K.MASCOT_ART.luna:K.MASCOT_ART.milo;
})();
