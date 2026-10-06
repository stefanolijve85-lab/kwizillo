(()=>{
  const K=window.KWIZILLO_M1=window.KWIZILLO_M1||{};

  // Plaatjes worden een dag lang door de browser bewaard (server.js stuurt
  // max-age=86400). Wordt een bestand onder dezelfde naam opnieuw getekend, dan
  // blijft een iPad die het gisteren ophaalde de oude versie tonen. Daarom
  // hangt achter elk pad een versiemerk. Bump dit nummer zodra er kunst wordt
  // vervangen; alle kaarten hieronder worden er in één keer mee gestempeld
  // (zie `stamp`, onderaan), zodat geen enkel gebruik het kan vergeten.
  K.ASSET_V='v35';
  // Idempotent: een pad dat al een merk draagt krijgt er geen tweede bij.
  K.assetUrl=p=>p&&!p.includes('?')?`${p}?${K.ASSET_V}`:p;

  // All artwork ships with the app. Nothing here reaches out to a CDN, so the
  // game works offline and an App Review reviewer never sees an empty screen.
  // These assets contain no baked-in UI, logo, labels or buttons.
  K.MASTER={
    ruimte:'assets/worlds/ruimte.jpg',
    dieren:'assets/worlds/dieren.jpg',
    aarde:'assets/worlds/aarde.jpg',
    geschiedenis:'assets/worlds/geschiedenis.jpg',
    wetenschap:'assets/worlds/wetenschap.jpg',
    mysterie:'assets/worlds/mysterie.jpg',
    kunst:'assets/worlds/kunst.jpg',
    sport:'assets/worlds/sport.jpg'
  };

  // The golden world cards: one painting per world, earned by finishing that
  // world at all six levels (or bought in the shop). A world whose painting has
  // not been dropped in yet falls back to its master art, so the card is never
  // an empty frame.
  K.GOLD_ART={};
  for(const w of Object.keys(K.MASTER)) K.GOLD_ART[w]=`assets/cards/gold/${w}.jpg`;
  // The cards the runner hands out, one per level of the game.
  // The painting of a world's golden card, or the world art while its own
  // painting has not been added yet (see K.wireFallbacks).
  K.goldArt=w=>K.assetUrl(K.GOLD_ART?.[w]||K.MASTER[w]||'');
  // Drop the painting in as assets/cards/gold/<world>.jpg (or .png); until it
  // is there the card falls back to the world art, in that order.
  K.goldFallback=w=>[K.assetUrl(`assets/cards/gold/${w}.png`),K.assetUrl(K.MASTER[w]||'')].join('|');
  K.RUNNER_CARDS=[
    {id:'jungle-leaf',level:'jungle',art:'assets/games/jungle/img/collectible-jungle-card.png'},
    {id:'city-star',level:'stad',art:'assets/games/jungle/img/collectible-city-card.png'},
    {id:'sky-feather',level:'lucht',art:'assets/games/jungle/img/collectible-sky-card.png'}
  ];

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

  // 2. Topic art, one illustration per topic, covering all 32. Every question
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
    kaarten_navigatie:'assets/topics/kaarten_navigatie.jpg',

    schilderkunst:'assets/topics/schilderkunst.jpg',
    muziek:'assets/topics/muziek.jpg',
    bouwkunst:'assets/topics/bouwkunst.jpg',
    dans_theater:'assets/topics/dans_theater.jpg',

    balsporten:'assets/topics/balsporten.jpg',
    olympische_spelen:'assets/topics/olympische_spelen.jpg',
    water_wintersport:'assets/topics/water_wintersport.jpg',
    records_helden:'assets/topics/records_helden.jpg'
  };

  // Opening cinematic only. Entering a world is immediate, by design.
  // De openingsfilm: `home` staand (720 × 1280) voor de telefoon, `homeWide`
  // liggend (1920 × 1440, 4:3) voor de tablet op zijn kant. De liggende is met
  // Higgsfield reframe uit de staande verbreed en daarna naar 2K opgeschaald
  // (ByteDance, AIGC): dezelfde beelden op dezelfde tijden, dus het introgeluid
  // (Kwizillo! op ~10 s) valt op beide goed.
  K.MOTION={home:'assets/brand/intro.mp4',homeWide:'assets/brand/intro-wide.mp4'};
  // The intro theme: a 12 s sting built by tools/intro-audio.js + intro-mix.cjs,
  // children call "Kwizillo!" as the logo lands (about 10 s in).
  K.INTRO_THEME='assets/audio/intro_theme.wav';
  K.BRAND_LOGO='assets/brand/logo.png';
  // Same logo with its shadow baked in (tools/logo-shadow.cjs), for the intro.
  K.BRAND_LOGO_SHADOW='assets/brand/logo-shadow.png';
  // Menu tiles for the two extra games.
  // New file names on every re-render: assets are cached for a day, so a replaced image under the same name would show stale.
  K.GAME_ART={memo:'assets/games/memo-island.jpg',math:'assets/games/math-island.jpg',memoAll:'assets/games/worlds-all.jpg',facts:'assets/games/facts-island.jpg',whoami:'assets/games/whoami-island.jpg',jungle:'assets/games/jungle-runner.jpg',fotozoom:'assets/games/fotozoom-island.jpg',talen:'assets/games/talen-island.jpg'};

  // Mascot portraits, used wherever the app shows Milo or Luna as a face:
  // Home HUD, voice pickers, onboarding, feedback and result cards.
  K.MASCOT_ART={
    milo:K.assetUrl('assets/mascots/milo.jpg'),luna:K.assetUrl('assets/mascots/luna.jpg'),
    comet:'assets/mascots/comet.jpg',pootje:'assets/mascots/pootje.jpg',terra:'assets/mascots/terra.jpg',
    sparky:'assets/mascots/sparky.jpg',lumi:'assets/mascots/lumi.jpg'
  };
  // Second wave of buddies (tools/mascot-prompts.md). Add an id here once its
  // 512x512 picture is in assets/mascots/, so the collection never shows an
  // empty tile: nova, kiko, pip, ravi, flora, draco.
  for(const id of ['nova','kiko','pip','ravi','flora','draco']) K.MASCOT_ART[id]=`assets/mascots/${id}.jpg`;
  // The same pictures, redrawn to one tile shape by tools/mascot-tiles.cjs: the
  // renders came in two formats, so a tile that cropped to fill showed one buddy
  // in full and zoomed into the next one's nose. The round avatars keep using
  // the originals.
  K.MASCOT_TILE={};
  for(const id of Object.keys(K.MASCOT_ART)) K.MASCOT_TILE[id]=K.assetUrl(`assets/mascots/tile/${id}.png`);
  K.guideArt=voice=>voice==='Luna'?K.MASCOT_ART.luna:K.MASCOT_ART.milo;

  // De wereldtegels (Home, de spelkiezers). Meestal de wereldplaat zelf, maar in
  // de mysterieplaat beslaat het eiland de hele breedte, zodat hij als enige van
  // dichtbij in zijn tegel stond. Die tegel heeft een uitgezoomde versie van
  // dezelfde plaat: het eiland zwevend in de lucht, zoals bij de andere.
  K.TILE_ART={mysterie:'assets/worlds/mysterie-tile.jpg'};
  K.tileArt=w=>K.TILE_ART[w]||K.MASTER[w];
  // Een tegelplaat is al op het eiland gecentreerd; alleen de wereldplaten hebben een uitsnede nodig.
  // The tiles are flat (about 5:2 on a phone, 2:1 in the pickers), so each
  // painting is shifted until its island sits in the middle of the tile. The
  // numbers come from where the island is in the portrait painting (its
  // centre at 40-60% of the height), worked out for a 5:2 tile.
  K.TILE_FOCUS={ruimte:'center 37%',dieren:'center 40%',aarde:'center 63%',geschiedenis:'center 60%',wetenschap:'center 53%',kunst:'center 47%',sport:'center 50%'};
  K.tileFocus=w=>K.TILE_ART[w]?'center':(K.TILE_FOCUS[w]||K.WORLD_FOCUS?.[w]||'center 45%');
  // The mystery tile is a zoomed-out painting: its island fills only half the
  // width, so next to the others it looked far away. It is scaled up around
  // the island (the separate `scale` property leaves a tile's own transforms alone).
  K.TILE_ZOOM={mysterie:{scale:1.5,origin:'50% 55%'}};
  K.tileStyle=w=>{const z=K.TILE_ZOOM[w];return `object-position:${K.tileFocus(w)}`+(z?`;scale:${z.scale};transform-origin:${z.origin}`:'')};

  // Eén plek waar het versiemerk op alle kunst wordt gezet. De kaarten
  // hierboven staan met kale paden in het bestand, zodat ze leesbaar blijven en
  // het gereedschap ze kan vinden; hier krijgen ze allemaal hun merk.
  const stamp=o=>{for(const k of Object.keys(o)) if(typeof o[k]==='string') o[k]=K.assetUrl(o[k])};
  for(const map of [K.MASTER,K.TILE_ART,K.GOLD_ART,K.QUESTION_ART,K.TOPIC_ART,K.GAME_ART,K.MASCOT_ART,K.MASCOT_TILE,K.MOTION]) stamp(map);
  for(const c of K.RUNNER_CARDS) c.art=K.assetUrl(c.art);
  K.INTRO_THEME=K.assetUrl(K.INTRO_THEME);
  K.BRAND_LOGO=K.assetUrl(K.BRAND_LOGO);
  K.BRAND_LOGO_SHADOW=K.assetUrl(K.BRAND_LOGO_SHADOW);
})();
