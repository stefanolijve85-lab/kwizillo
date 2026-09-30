(()=>{
  const K=window.KWIZILLO_M1=window.KWIZILLO_M1||{};
  // Pictures that show the ANSWER of a question, for the games where the
  // child sees a picture and hears or reads its name: Memo, Wat ben ik? and
  // Fotozoom. A question's own illustration shows the question's scene, which
  // is often not the answer ("Which planet is the red planet?" is drawn as a
  // child at a telescope), so those games only use questions listed here.
  //
  // Curated by eye (2026-09-19) over all 480 illustrations: the value is the
  // question id whose picture depicts this answer (the same id when its own
  // picture does), or "a/<name>" for an extra picture made for the answer in
  // assets/questions/a/. Questions that are not listed stay out of these games.
  const A={
    // Ruimte
    'ruimte-zonnestelsel-02':'aarde-oceanen_natuur-01',   // Aarde: the Earth in space
    'ruimte-zonnestelsel-03':'ruimte-zonnestelsel-18',    // Mars: the red planet
    'ruimte-zonnestelsel-04':'ruimte-raket_avontuur-16',  // Saturnus: ringed planet with probe
    'ruimte-zonnestelsel-05':'ruimte-zonnestelsel-15',    // Jupiter: the Great Red Spot
    'ruimte-zonnestelsel-06':'a/neptunus',                // Neptunus
    'ruimte-zonnestelsel-07':'aarde-oceanen_natuur-01',   // Aarde
    'ruimte-zonnestelsel-08':'a/maan',                    // De maan
    'ruimte-zonnestelsel-10':'a/neptunus',                // Neptunus
    'ruimte-zonnestelsel-11':'ruimte-raket_avontuur-16',  // Saturnus
    'ruimte-zonnestelsel-12':1,                           // Uranus
    'ruimte-zonnestelsel-14':1,                           // Venus
    'ruimte-zonnestelsel-17':1,                           // Een meteoriet
    'ruimte-zonnestelsel-19':'ruimte-raket_avontuur-16',  // Saturnus
    'ruimte-sterren_planeten-01':1,                       // Een ster
    'ruimte-sterren_planeten-04':1,                       // De Melkweg
    'ruimte-sterren_planeten-09':'a/zon',                 // De zon
    'ruimte-sterren_planeten-14':1,                       // Sirius
    'ruimte-sterren_planeten-15':1,                       // Een supernova
    'ruimte-sterren_planeten-18':1,                       // Een exoplaneet
    'ruimte-astronauten-01':1,                            // Astronaut
    'ruimte-astronauten-03':1,                            // Gewichtloosheid
    'ruimte-astronauten-11':1,                            // Joeri Gagarin
    'ruimte-astronauten-16':1,                            // André Kuipers
    'ruimte-astronauten-19':1,                            // Artemis
    'ruimte-raket_avontuur-09':1,                         // Parachutes
    'ruimte-raket_avontuur-14':1,                         // Saturnus V
    'ruimte-raket_avontuur-15':1,                         // Kourou
    'ruimte-raket_avontuur-17':1,                         // Perseverance
    'ruimte-raket_avontuur-18':1,                         // Stuwkracht
    'ruimte-raket_avontuur-20':1,                         // James Webb
    // Geschiedenis
    'geschiedenis-egyptenaren-03':1,                      // De Nijl
    'geschiedenis-egyptenaren-04':'geschiedenis-egyptenaren-11', // Hiërogliefen
    'geschiedenis-egyptenaren-06':'geschiedenis-egyptenaren-18', // Papyrus
    'geschiedenis-egyptenaren-09':1,                      // Katten
    'geschiedenis-egyptenaren-11':1,                      // Hiërogliefen
    'geschiedenis-egyptenaren-14':1,                      // Toetanchamon
    'geschiedenis-egyptenaren-15':1,                      // De Nijl
    'geschiedenis-egyptenaren-16':1,                      // De Sfinx
    'geschiedenis-egyptenaren-17':1,                      // Anubis
    'geschiedenis-egyptenaren-18':1,                      // Papyrus
    'geschiedenis-egyptenaren-19':1,                      // De kat
    'geschiedenis-egyptenaren-20':1,                      // Cleopatra
    'geschiedenis-ridders_kastelen-01':'geschiedenis-ridders_kastelen-06', // Een harnas
    'geschiedenis-ridders_kastelen-11':1,                 // Een schildknaap
    'geschiedenis-ridders_kastelen-12':1,                 // Een toernooi
    'geschiedenis-ridders_kastelen-13':1,                 // Een slotgracht
    'geschiedenis-ridders_kastelen-14':1,                 // De donjon
    'geschiedenis-ridders_kastelen-15':1,                 // Een maliënkolder
    'geschiedenis-ridders_kastelen-16':1,                 // Een katapult
    'geschiedenis-ridders_kastelen-19':1,                 // De riddercode
    'geschiedenis-ridders_kastelen-20':1,                 // De pest
    'geschiedenis-romeinen-01':'geschiedenis-romeinen-04', // De Romeinen: soldiers
    'geschiedenis-romeinen-11':1,                         // Het Colosseum
    'geschiedenis-romeinen-12':1,                         // De Muur van Hadrianus
    'geschiedenis-romeinen-13':1,                         // De Limes
    'geschiedenis-romeinen-15':1,                         // Pompeï
    'geschiedenis-romeinen-16':1,                         // Julius Caesar
    'geschiedenis-romeinen-19':1,                         // Een legioen
    'geschiedenis-ontdekkingsreizigers-13':1,             // Willem Barentsz
    'geschiedenis-ontdekkingsreizigers-14':1,             // Abel Tasman
    'geschiedenis-ontdekkingsreizigers-15':1,             // Marco Polo
    'geschiedenis-ontdekkingsreizigers-16':1,             // Roald Amundsen
    'geschiedenis-ontdekkingsreizigers-18':1,             // Een sextant
    // Wetenschap
    'wetenschap-slimme_proefjes-05':1,                    // Een maatcilinder
    'wetenschap-lichaam-01':'wetenschap-lichaam-14',      // Hart
    'wetenschap-lichaam-02':'wetenschap-lichaam-16',      // Longen
    'wetenschap-lichaam-03':'wetenschap-lichaam-18',      // Hersenen
    'wetenschap-lichaam-10':1,                            // Gehoor
    'wetenschap-lichaam-12':1,                            // De nieren
    'wetenschap-lichaam-13':1,                            // De huid
    'wetenschap-uitvindingen-01':'wetenschap-uitvindingen-14', // Microscoop
    'wetenschap-uitvindingen-02':'wetenschap-uitvindingen-19', // Telescoop
    'wetenschap-uitvindingen-03':'wetenschap-uitvindingen-12', // Drukpers
    'wetenschap-uitvindingen-10':1,                       // GPS
    'wetenschap-uitvindingen-16':1,                       // Ada Lovelace
    'wetenschap-uitvindingen-18':1,                       // Tim Berners-Lee
    'wetenschap-natuur_energie-01':1,                     // Windenergie
    'wetenschap-natuur_energie-02':'wetenschap-natuur_energie-16', // Zonne-energie
    'wetenschap-natuur_energie-10':1,                     // LED-lamp
    'wetenschap-natuur_energie-11':1,                     // Fotosynthese
    'wetenschap-natuur_energie-12':1,                     // Geothermie
    'wetenschap-natuur_energie-17':1,                     // Waterkracht
    'wetenschap-natuur_energie-19':1,                     // Aardolie
    // Mysterie
    'mysterie-raadsels-08':'mysterie-raadsels-20',        // Naald
    'mysterie-raadsels-09':1,                             // Een gat
    'mysterie-raadsels-10':1,                             // Water
    'mysterie-raadsels-11':1,                             // Een landkaart
    'mysterie-raadsels-12':1,                             // Een gat
    'mysterie-raadsels-16':1,                             // Een echo
    'mysterie-raadsels-20':1,                             // Een naald
    'mysterie-verborgen_schatten-12':1,                   // Atlantis
    'mysterie-verborgen_schatten-13':1,                   // El Dorado
    'mysterie-verborgen_schatten-15':1,                   // Piet Hein
    'mysterie-verborgen_schatten-16':1,                   // Machu Picchu
    'mysterie-verborgen_schatten-19':1,                   // Petra
    'mysterie-natuurmysteries-13':1,                      // Bioluminescentie
    'mysterie-speurtocht-03':'mysterie-speurtocht-12',    // Vergrootglas
    'mysterie-speurtocht-04':1,                           // Spoor
    'mysterie-speurtocht-13':1,                           // Sherlock Holmes
    'mysterie-speurtocht-16':1,                           // Een speurhond
    'mysterie-speurtocht-20':1,                           // Spiegelschrift
    // Dieren
    'dieren-snelle_dieren-01':'dieren-snelle_dieren-02',  // Jachtluipaard
    'dieren-snelle_dieren-02':1,                          // Jachtluipaard
    'dieren-snelle_dieren-03':'dieren-snelle_dieren-11',  // Slechtvalk
    'dieren-snelle_dieren-05':1,                          // Paard
    'dieren-snelle_dieren-07':1,                          // Makohaai
    'dieren-snelle_dieren-11':1,                          // De slechtvalk
    'dieren-snelle_dieren-12':1,                          // De zeilvis
    'dieren-snelle_dieren-13':1,                          // De paardenhorzel
    'dieren-snelle_dieren-15':1,                          // De struisvogel
    'dieren-snelle_dieren-16':1,                          // De gaffelantilope
    'dieren-snelle_dieren-19':1,                          // De kolibrie
    'dieren-snelle_dieren-20':1,                          // De zwarte mamba
    'dieren-baby_dieren-03':1,                            // Veulen
    'dieren-baby_dieren-05':1,                            // Kalf
    'dieren-baby_dieren-06':1,                            // Kuiken
    'dieren-baby_dieren-07':1,                            // Welpen
    'dieren-baby_dieren-10':'dieren-baby_dieren-06',      // Kuiken
    'dieren-baby_dieren-13':1,                            // Het vogelbekdier
    'dieren-baby_dieren-14':1,                            // Een zwanenkuiken
    'dieren-baby_dieren-15':1,                            // Het zeepaardje
    'dieren-baby_dieren-17':1,                            // Een kalf (fawn)
    'dieren-baby_dieren-20':1,                            // Een zeehond
    'dieren-waterdieren-01':'dieren-waterdieren-16',      // Dolfijn
    'dieren-waterdieren-02':'dieren-waterdieren-12',      // Octopus
    'dieren-waterdieren-03':1,                            // Blauwe vinvis
    'dieren-waterdieren-11':1,                            // De blauwe vinvis
    'dieren-waterdieren-15':1,                            // De platvis
    'dieren-waterdieren-16':1,                            // Een school
    'dieren-waterdieren-17':1,                            // De sidderrog
    'dieren-waterdieren-20':1,                            // De inktvis
    'dieren-jungle-01':'dieren-jungle-11',                // Aap
    'dieren-jungle-03':'dieren-jungle-13',                // Gorilla
    'dieren-jungle-05':'dieren-jungle-18',                // Jaguar
    'dieren-jungle-11':1,                                 // Het bladerdak
    'dieren-jungle-12':1,                                 // Het Amazonewoud
    'dieren-jungle-13':1,                                 // De gorilla
    'dieren-jungle-14':1,                                 // De papegaai
    'dieren-jungle-15':1,                                 // De luiaard
    'dieren-jungle-16':1,                                 // De pijlgifkikker
    'dieren-jungle-17':1,                                 // De anaconda
    'dieren-jungle-18':1,                                 // De jaguar
    // Aarde
    'aarde-continenten_landen-04':1,                      // Afrika
    'aarde-continenten_landen-05':'a/parijs',             // Parijs: Eiffel Tower
    'aarde-continenten_landen-06':'a/rome',               // Rome: Colosseum from outside
    'aarde-continenten_landen-07':1,                      // Italië
    'aarde-continenten_landen-08':1,                      // Atlantische Oceaan
    'aarde-continenten_landen-09':1,                      // Antarctica
    'aarde-continenten_landen-11':1,                      // India
    'aarde-continenten_landen-12':1,                      // Rusland
    'aarde-continenten_landen-13':1,                      // Vaticaanstad
    'aarde-continenten_landen-14':1,                      // Afrika
    'aarde-continenten_landen-15':1,                      // Canberra
    'aarde-continenten_landen-16':1,                      // De Oeral
    'aarde-continenten_landen-20':1,                      // Turkije
    'aarde-weer_klimaat-01':'aarde-weer_klimaat-17',      // Temperatuur: thermometer
    'aarde-weer_klimaat-08':1,                            // Cumulonimbus
    'aarde-weer_klimaat-14':1,                            // Een orkaan
    'aarde-weer_klimaat-15':1,                            // De cumulonimbus
    'aarde-weer_klimaat-18':1,                            // De troposfeer
    'aarde-weer_klimaat-19':1,                            // Windkracht
    'aarde-oceanen_natuur-03':1,                          // Lava
    'aarde-oceanen_natuur-11':1,                          // De Marianentrog
    'aarde-oceanen_natuur-14':1,                          // De Golfstroom
    'aarde-oceanen_natuur-20':1,                          // De plasticsoep
    'aarde-kaarten_navigatie-01':1,                       // Windrichtingen
    'aarde-kaarten_navigatie-16':1,                       // Een globe
    'aarde-kaarten_navigatie-18':1,                       // GIS
    'aarde-kaarten_navigatie-20':1,                       // De evenaar
    // 30-09-2026, the Kids 4+ replacements: each picture shows its answer
    'geschiedenis-ridders_kastelen-12':1,
    'geschiedenis-ridders_kastelen-16':1,
    'geschiedenis-ridders_kastelen-17':1,
    'geschiedenis-ridders_kastelen-22':1,
    'geschiedenis-ridders_kastelen-33':1,
    'geschiedenis-ridders_kastelen-34':1,
    'geschiedenis-ridders_kastelen-38':1,
    'geschiedenis-ridders_kastelen-40':1,
    'geschiedenis-romeinen-26':1,
    'sport-water_wintersport-28':1
  };
  K.ANSWER_ART=A;
  // Whether a question's own illustration would give the answer away while the
  // question is on screen. It does when the picture depicts the answer (the map
  // above) or when the answer is a concrete thing — a short noun ("Mars", "De
  // Nijl", "Makohaai"): the illustration was drawn from question and answer
  // together, so it shows that thing. A person's name is the exception: a
  // drawing of an explorer does not tell the child which explorer. Such a
  // question is illustrated with its topic's picture until it is answered; its
  // own picture is the reward on the feedback card. Explanatory answers ("Anders
  // krijgen ze geen zuurstof") keep their picture: it shows the situation.
  // "Met een barometer" / "Met kieuwen" name a thing as much as "Barometer" does.
  const NOT_A_NOUN=/^(door|om|voor|in|op|naar|uit|bij|zonder|alle|ze|zij|het is|by|to|for|on|at|from|they|it|because|por|para|em|no|na|eles|ela|porque)\b/i;
  const concrete=a=>{a=String(a||'');const n=a.split(' ').length;if(/^\d+$/.test(a)||NOT_A_NOUN.test(a))return false;return (a.length<=16&&n<=2)||(n<=3&&/^(de|het|een|the|a|an|o|a|um|uma|os|as)\s/i.test(a))||(n<=3&&/^(met|with|com)\s(een|de|het|a|an|the|um|uma)?\s?/i.test(a))};
  const PERSON=new Set(['ruimte-astronauten-11','ruimte-astronauten-12','ruimte-astronauten-16','geschiedenis-romeinen-16','geschiedenis-ontdekkingsreizigers-11','geschiedenis-ontdekkingsreizigers-12','geschiedenis-ontdekkingsreizigers-13','geschiedenis-ontdekkingsreizigers-14','geschiedenis-ontdekkingsreizigers-15','geschiedenis-ontdekkingsreizigers-16','geschiedenis-ontdekkingsreizigers-17','wetenschap-uitvindingen-11','wetenschap-uitvindingen-12','wetenschap-uitvindingen-13','wetenschap-uitvindingen-14','wetenschap-uitvindingen-16','wetenschap-uitvindingen-17','wetenschap-uitvindingen-19','mysterie-verborgen_schatten-15']);
  let revealed=null;
  K.artRevealsAnswer=q=>{
    if(!revealed){
      revealed=new Set(Object.keys(A));
      for(const bank of Object.values(K.banks||{}))for(const x of bank||[])if(concrete(x.answer))revealed.add(x.id);
      for(const id of PERSON)revealed.delete(id);
    }
    return revealed.has(typeof q==='string'?q:q?.id);
  };
  // The picture shown WITH such a question. First choice: a bespoke
  // "question-only" illustration in assets/questions/s/<id>.jpg (drawn without
  // the answer; tools/safe-art-prompts.json lists what to draw — none rendered
  // yet). Until then: the illustration of a neighbour in the same topic whose
  // own answer is explanatory (so its picture reveals nothing) and whose
  // question shares the rarest word with this one — "haai" finds the streamlined
  // fish for the mako question, "planeet" the orrery — never a picture of one of
  // this question's options. Failing that, the topic's picture.
  const STOP=new Set('welke welk wat waar wie hoe hoeveel waarom waarvoor waardoor noem noemen heet heten staat bekend wordt worden word zijn kan kunnen moet moeten heeft hebben doet doen gebruik gebruiken gebruikt over voor door naar deze dit dat een het de van met als ook nog vaak meestal soms altijd nooit vooral eigenlijk precies ongeveer eerste grootste kleinste snelste langste hoogste beste meeste dier dieren mens mensen naam soort soorten belangrijk bekende beroemde veel groot grote niet maar toch zelfs lang sterkste maakt maken helpt helpen komt komen gaat gaan geeft geven zien ziet kijkt kijken vindt vinden leeft leven kunt weet weten bouwt bouwen which what where who how many why does do the a an is are can of for with from into about name called known most first biggest largest fastest longest qual quais como quantos porque onde quem'.split(' '));
  const words=t=>String(t||'').toLowerCase().replace(/[^\p{L}\s]/gu,' ').split(/\s+/).filter(x=>x.length>=4&&!STOP.has(x));
  // "planeet" ~ "planeten", "haai" ~ "haaien": same first five letters and about the same length
  const same=(a,b)=>a.slice(0,5)===b.slice(0,5)&&Math.abs(a.length-b.length)<=3;
  const safe=new Map();
  K.safeQuestionArt=q=>{
    if(!q)return null;
    if(K.SAFE_ART_IDS?.has(q.id))return 'assets/questions/s/'+q.id+'.jpg';
    if(safe.has(q.id))return safe.get(q.id);
    let url=null;
    const bank=K.banks?.[K.state?.language]||K.banks?.nl||[];
    const topic=bank.filter(o=>o.id!==q.id&&o.topic===q.topic&&!K.artRevealsAnswer(o)&&K.questionArtFor(o.id));
    const opts=new Set((q.options||[]).map(o=>String(o).toLowerCase()));
    const mine=words(q.prompt),cnt={};for(const k of mine)cnt[k]=(cnt[k]||0)+1;
    const df=k=>topic.filter(o=>words(o.prompt).some(w=>same(w,k))).length;
    // the question's own subject first (a word it repeats), then the rarest word
    for(const k of [...new Set(mine)].sort((a,b)=>(cnt[b]-cnt[a])||(df(a)-df(b)))){
      const o=topic.find(o=>!opts.has(String(o.answer).toLowerCase())&&words(o.prompt).some(w=>same(w,k)));
      if(o){url=K.questionArtFor(o.id);break}
    }
    safe.set(q.id,url);return url;
  };
  // De kaart hierboven is met de hand samengesteld over de 480 platen die er
  // toen waren. Kunst en sport kwamen later en staan er met geen enkele vraag
  // in; Memo, Wat ben ik? en Fotozoom vonden daar dus niets en stuurden het
  // kind terug naar Home. Inmiddels heeft élke vraag zijn eigen plaat, getekend
  // uit de artBrief, en die plaat toont het onderwerp van de vraag. Voor een
  // wereld die niet in de kaart staat geldt daarom: is het antwoord een
  // concreet ding (dezelfde toets als artRevealsAnswer) en heeft de vraag een
  // eigen plaat, dan is dat de antwoordplaat.
  const curatedWorlds=new Set(Object.keys(A).map(id=>id.split('-')[0]));
  const question=id=>{
    for(const bank of Object.values(K.banks||{})){const q=(bank||[]).find(x=>x.id===id);if(q)return q}
    return null;
  };
  // URL of the picture that shows a question's answer, or null when there is
  // none. Takes a question or its id.
  K.answerArtFor=q=>{
    const id=typeof q==='string'?q:q?.id;
    const v=A[id];
    if(!v){
      const world=String(id||'').split('-')[0];
      if(!world||curatedWorlds.has(world))return null;
      const full=typeof q==='object'&&q?q:question(id);
      return full&&concrete(full.answer)?K.questionArtFor(id):null;
    }
    if(v===1)return K.questionArtFor(id);
    return v.startsWith('a/')?'assets/questions/'+v+'.jpg':K.questionArtFor(v);
  };
})();
