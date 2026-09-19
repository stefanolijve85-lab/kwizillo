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
    'aarde-kaarten_navigatie-20':1                        // De evenaar
  };
  K.ANSWER_ART=A;
  // URL of the picture that shows a question's answer, or null when there is
  // none. Takes a question or its id.
  K.answerArtFor=q=>{
    const id=typeof q==='string'?q:q?.id;
    const v=A[id];
    if(!v)return null;
    if(v===1)return K.questionArtFor(id);
    return v.startsWith('a/')?'assets/questions/'+v+'.jpg':K.questionArtFor(v);
  };
})();
