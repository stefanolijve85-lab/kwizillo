(()=>{
  const K=window.KWIZILLO_M1=window.KWIZILLO_M1||{};
  // Talen: a child learns words in another language (talen-handover/HANDOVER-talen.md,
  // not in the repo). Phase 1 was Dutch and English; since 2026-10-07 every app
  // language can learn every other one. Ids are language-free: text.<lang> is the
  // word without its article. Words outside Dutch and English still want a
  // native speaker's look.
  //
  // Sound ships with the app (assets/talen/audio/<lang>/), not through the
  // speech server: a word is one recording, made with the app's own voices,
  // model and settings (tools/talen-audio.cjs). <lang>/<id>.mp3 is a word,
  // <lang>/_<line>.mp3 a line Milo says (_goed<n>: praise, _bijna<n>: almost), <lang>/<guide>/_klaar_<theme>.mp3 the
  // closing line in the chosen guide's voice.
  //
  // Pictures: 360x360, cut square from the question pictures with the animal in
  // the middle (tools/talen-img: see the handover's table of centres).
  const img=id=>`assets/talen/img/${id}.jpg`;
  K.TALEN={
    // The languages a child can learn (each is also an app language), and the
    // default for an app language: English, and for an English child Dutch.
    langs:['en','nl','de','fr','es','it','pt','da','ru','ar'],
    defaultLearn:{nl:'en',en:'nl',de:'en',fr:'en',es:'en',it:'en',pt:'en',da:'en',ru:'en',ar:'en'},
    // Lines Milo says in the child's own language (the app language); praise and
    // "almost" in several wordings (_goed1.._goed10, _bijna1.._bijna4).
    lines:['intro','betekent'],praise:10,almost:4,
    rounds:8,
    themes:[
      {id:'dieren',icon:'🐬',free:true,words:[
        {id:'dolphin',img:img('dolphin'),text:{nl:'dolfijn',en:'dolphin',de:'Delfin',fr:'dauphin',es:'delfín',it:'delfino',pt:'golfinho',da:'delfin',ru:'дельфин',ar:'دلفين'}},
        {id:'octopus',img:img('octopus'),text:{nl:'octopus',en:'octopus',de:'Krake',fr:'pieuvre',es:'pulpo',it:'polpo',pt:'polvo',da:'blæksprutte',ru:'осьминог',ar:'أخطبوط'}},
        {id:'whale',img:img('whale'),text:{nl:'walvis',en:'whale',de:'Wal',fr:'baleine',es:'ballena',it:'balena',pt:'baleia',da:'hval',ru:'кит',ar:'حوت'}},
        {id:'seal',img:img('seal'),text:{nl:'zeehond',en:'seal',de:'Robbe',fr:'phoque',es:'foca',it:'foca',pt:'foca',da:'sæl',ru:'тюлень',ar:'فقمة'}},
        {id:'parrot',img:img('parrot'),text:{nl:'papegaai',en:'parrot',de:'Papagei',fr:'perroquet',es:'loro',it:'pappagallo',pt:'papagaio',da:'papegøje',ru:'попугай',ar:'ببغاء'}},
        {id:'frog',img:img('frog'),text:{nl:'kikker',en:'frog',de:'Frosch',fr:'grenouille',es:'rana',it:'rana',pt:'sapo',da:'frø',ru:'лягушка',ar:'ضفدع'}},
        {id:'snake',img:img('snake'),text:{nl:'slang',en:'snake',de:'Schlange',fr:'serpent',es:'serpiente',it:'serpente',pt:'cobra',da:'slange',ru:'змея',ar:'ثعبان'}},
        {id:'gorilla',img:img('gorilla'),text:{nl:'gorilla',en:'gorilla',de:'Gorilla',fr:'gorille',es:'gorila',it:'gorilla',pt:'gorila',da:'gorilla',ru:'горилла',ar:'غوريلا'}},
        {id:'shark',img:img('shark'),text:{nl:'haai',en:'shark',de:'Hai',fr:'requin',es:'tiburón',it:'squalo',pt:'tubarão',da:'haj',ru:'акула',ar:'قرش'}},
        {id:'chicken',img:img('chicken'),text:{nl:'kip',en:'chicken',de:'Huhn',fr:'poule',es:'gallina',it:'gallina',pt:'galinha',da:'høne',ru:'курица',ar:'دجاجة'}}
      ]},
      // The other themes are Premium; their pictures: kleuren and getallen drawn by
      // tools/talen-tiles.cjs, eten, lichaam and vervoer painted (Higgsfield, 2026-10-07).
      {id:'kleuren',icon:'🎨',words:[
        {id:'red',img:img('red'),text:{nl:'rood',en:'red',de:'rot',fr:'rouge',es:'rojo',it:'rosso',pt:'vermelho',da:'rød',ru:'красный',ar:'أحمر'}},
        {id:'blue',img:img('blue'),text:{nl:'blauw',en:'blue',de:'blau',fr:'bleu',es:'azul',it:'blu',pt:'azul',da:'blå',ru:'синий',ar:'أزرق'}},
        {id:'yellow',img:img('yellow'),text:{nl:'geel',en:'yellow',de:'gelb',fr:'jaune',es:'amarillo',it:'giallo',pt:'amarelo',da:'gul',ru:'жёлтый',ar:'أصفر'}},
        {id:'green',img:img('green'),text:{nl:'groen',en:'green',de:'grün',fr:'vert',es:'verde',it:'verde',pt:'verde',da:'grøn',ru:'зелёный',ar:'أخضر'}},
        {id:'orange',img:img('orange'),text:{nl:'oranje',en:'orange',de:'orange',fr:'orange',es:'naranja',it:'arancione',pt:'laranja',da:'orange',ru:'оранжевый',ar:'برتقالي'}},
        {id:'purple',img:img('purple'),text:{nl:'paars',en:'purple',de:'lila',fr:'violet',es:'morado',it:'viola',pt:'roxo',da:'lilla',ru:'фиолетовый',ar:'بنفسجي'}},
        {id:'pink',img:img('pink'),text:{nl:'roze',en:'pink',de:'rosa',fr:'rose',es:'rosa',it:'rosa',pt:'rosa',da:'lyserød',ru:'розовый',ar:'وردي'}},
        {id:'black',img:img('black'),text:{nl:'zwart',en:'black',de:'schwarz',fr:'noir',es:'negro',it:'nero',pt:'preto',da:'sort',ru:'чёрный',ar:'أسود'}},
        {id:'white',img:img('white'),text:{nl:'wit',en:'white',de:'weiß',fr:'blanc',es:'blanco',it:'bianco',pt:'branco',da:'hvid',ru:'белый',ar:'أبيض'}},
        {id:'brown',img:img('brown'),text:{nl:'bruin',en:'brown',de:'braun',fr:'marron',es:'marrón',it:'marrone',pt:'marrom',da:'brun',ru:'коричневый',ar:'بني'}}
      ]},
      {id:'getallen',icon:'🔢',cover:'assets/talen/img/cover-getallen.jpg',words:[
        {id:'one',img:img('one'),text:{nl:'één',en:'one',de:'eins',fr:'un',es:'uno',it:'uno',pt:'um',da:'en',ru:'один',ar:'واحد'}},
        {id:'two',img:img('two'),text:{nl:'twee',en:'two',de:'zwei',fr:'deux',es:'dos',it:'due',pt:'dois',da:'to',ru:'два',ar:'اثنان'}},
        {id:'three',img:img('three'),text:{nl:'drie',en:'three',de:'drei',fr:'trois',es:'tres',it:'tre',pt:'três',da:'tre',ru:'три',ar:'ثلاثة'}},
        {id:'four',img:img('four'),text:{nl:'vier',en:'four',de:'vier',fr:'quatre',es:'cuatro',it:'quattro',pt:'quatro',da:'fire',ru:'четыре',ar:'أربعة'}},
        {id:'five',img:img('five'),text:{nl:'vijf',en:'five',de:'fünf',fr:'cinq',es:'cinco',it:'cinque',pt:'cinco',da:'fem',ru:'пять',ar:'خمسة'}},
        {id:'six',img:img('six'),text:{nl:'zes',en:'six',de:'sechs',fr:'six',es:'seis',it:'sei',pt:'seis',da:'seks',ru:'шесть',ar:'ستة'}},
        {id:'seven',img:img('seven'),text:{nl:'zeven',en:'seven',de:'sieben',fr:'sept',es:'siete',it:'sette',pt:'sete',da:'syv',ru:'семь',ar:'سبعة'}},
        {id:'eight',img:img('eight'),text:{nl:'acht',en:'eight',de:'acht',fr:'huit',es:'ocho',it:'otto',pt:'oito',da:'otte',ru:'восемь',ar:'ثمانية'}},
        {id:'nine',img:img('nine'),text:{nl:'negen',en:'nine',de:'neun',fr:'neuf',es:'nueve',it:'nove',pt:'nove',da:'ni',ru:'девять',ar:'تسعة'}},
        {id:'ten',img:img('ten'),text:{nl:'tien',en:'ten',de:'zehn',fr:'dix',es:'diez',it:'dieci',pt:'dez',da:'ti',ru:'десять',ar:'عشرة'}}
      ]},
      {id:'eten',icon:'🍎',words:[
        {id:'apple',img:img('apple'),text:{nl:'appel',en:'apple',de:'Apfel',fr:'pomme',es:'manzana',it:'mela',pt:'maçã',da:'æble',ru:'яблоко',ar:'تفاحة'}},
        {id:'banana',img:img('banana'),text:{nl:'banaan',en:'banana',de:'Banane',fr:'banane',es:'plátano',it:'banana',pt:'banana',da:'banan',ru:'банан',ar:'موزة'}},
        {id:'bread',img:img('bread'),text:{nl:'brood',en:'bread',de:'Brot',fr:'pain',es:'pan',it:'pane',pt:'pão',da:'brød',ru:'хлеб',ar:'خبز'}},
        {id:'milk',img:img('milk'),text:{nl:'melk',en:'milk',de:'Milch',fr:'lait',es:'leche',it:'latte',pt:'leite',da:'mælk',ru:'молоко',ar:'حليب'}},
        {id:'cheese',img:img('cheese'),text:{nl:'kaas',en:'cheese',de:'Käse',fr:'fromage',es:'queso',it:'formaggio',pt:'queijo',da:'ost',ru:'сыр',ar:'جبن'}},
        {id:'egg',img:img('egg'),text:{nl:'ei',en:'egg',de:'Ei',fr:'œuf',es:'huevo',it:'uovo',pt:'ovo',da:'æg',ru:'яйцо',ar:'بيضة'}},
        {id:'carrot',img:img('carrot'),text:{nl:'wortel',en:'carrot',de:'Karotte',fr:'carotte',es:'zanahoria',it:'carota',pt:'cenoura',da:'gulerod',ru:'морковь',ar:'جزرة'}},
        {id:'strawberry',img:img('strawberry'),text:{nl:'aardbei',en:'strawberry',de:'Erdbeere',fr:'fraise',es:'fresa',it:'fragola',pt:'morango',da:'jordbær',ru:'клубника',ar:'فراولة'}},
        {id:'water',img:img('water'),text:{nl:'water',en:'water',de:'Wasser',fr:'eau',es:'agua',it:'acqua',pt:'água',da:'vand',ru:'вода',ar:'ماء'}},
        {id:'icecream',img:img('icecream'),text:{nl:'ijsje',en:'ice cream',de:'Eis',fr:'glace',es:'helado',it:'gelato',pt:'sorvete',da:'is',ru:'мороженое',ar:'آيس كريم'}}
      ]},
      {id:'lichaam',icon:'🖐️',words:[
        {id:'hand',img:img('hand'),text:{nl:'hand',en:'hand',de:'Hand',fr:'main',es:'mano',it:'mano',pt:'mão',da:'hånd',ru:'рука',ar:'يد'}},
        {id:'foot',img:img('foot'),text:{nl:'voet',en:'foot',de:'Fuß',fr:'pied',es:'pie',it:'piede',pt:'pé',da:'fod',ru:'нога',ar:'قدم'}},
        {id:'eye',img:img('eye'),text:{nl:'oog',en:'eye',de:'Auge',fr:'œil',es:'ojo',it:'occhio',pt:'olho',da:'øje',ru:'глаз',ar:'عين'}},
        {id:'nose',img:img('nose'),text:{nl:'neus',en:'nose',de:'Nase',fr:'nez',es:'nariz',it:'naso',pt:'nariz',da:'næse',ru:'нос',ar:'أنف'}},
        {id:'ear',img:img('ear'),text:{nl:'oor',en:'ear',de:'Ohr',fr:'oreille',es:'oreja',it:'orecchio',pt:'orelha',da:'øre',ru:'ухо',ar:'أذن'}},
        {id:'mouth',img:img('mouth'),text:{nl:'mond',en:'mouth',de:'Mund',fr:'bouche',es:'boca',it:'bocca',pt:'boca',da:'mund',ru:'рот',ar:'فم'}},
        {id:'head',img:img('head'),text:{nl:'hoofd',en:'head',de:'Kopf',fr:'tête',es:'cabeza',it:'testa',pt:'cabeça',da:'hoved',ru:'голова',ar:'رأس'}},
        {id:'hair',img:img('hair'),text:{nl:'haar',en:'hair',de:'Haare',fr:'cheveux',es:'pelo',it:'capelli',pt:'cabelo',da:'hår',ru:'волосы',ar:'شعر'}},
        {id:'tooth',img:img('tooth'),text:{nl:'tand',en:'tooth',de:'Zahn',fr:'dent',es:'diente',it:'dente',pt:'dente',da:'tand',ru:'зуб',ar:'سن'}},
        {id:'belly',img:img('belly'),text:{nl:'buik',en:'belly',de:'Bauch',fr:'ventre',es:'barriga',it:'pancia',pt:'barriga',da:'mave',ru:'живот',ar:'بطن'}}
      ]},
      {id:'vervoer',icon:'🚗',words:[
        {id:'car',img:img('car'),text:{nl:'auto',en:'car',de:'Auto',fr:'voiture',es:'coche',it:'macchina',pt:'carro',da:'bil',ru:'машина',ar:'سيارة'}},
        {id:'bus',img:img('bus'),text:{nl:'bus',en:'bus',de:'Bus',fr:'bus',es:'autobús',it:'autobus',pt:'ônibus',da:'bus',ru:'автобус',ar:'حافلة'}},
        {id:'train',img:img('train'),text:{nl:'trein',en:'train',de:'Zug',fr:'train',es:'tren',it:'treno',pt:'trem',da:'tog',ru:'поезд',ar:'قطار'}},
        {id:'plane',img:img('plane'),text:{nl:'vliegtuig',en:'plane',de:'Flugzeug',fr:'avion',es:'avión',it:'aereo',pt:'avião',da:'fly',ru:'самолёт',ar:'طائرة'}},
        {id:'boat',img:img('boat'),text:{nl:'boot',en:'boat',de:'Boot',fr:'bateau',es:'barco',it:'barca',pt:'barco',da:'båd',ru:'лодка',ar:'قارب'}},
        {id:'bike',img:img('bike'),text:{nl:'fiets',en:'bike',de:'Fahrrad',fr:'vélo',es:'bicicleta',it:'bicicletta',pt:'bicicleta',da:'cykel',ru:'велосипед',ar:'دراجة'}},
        {id:'helicopter',img:img('helicopter'),text:{nl:'helikopter',en:'helicopter',de:'Hubschrauber',fr:'hélicoptère',es:'helicóptero',it:'elicottero',pt:'helicóptero',da:'helikopter',ru:'вертолёт',ar:'مروحية'}},
        {id:'rocket',img:img('rocket'),text:{nl:'raket',en:'rocket',de:'Rakete',fr:'fusée',es:'cohete',it:'razzo',pt:'foguete',da:'raket',ru:'ракета',ar:'صاروخ'}},
        {id:'tractor',img:img('tractor'),text:{nl:'tractor',en:'tractor',de:'Traktor',fr:'tracteur',es:'tractor',it:'trattore',pt:'trator',da:'traktor',ru:'трактор',ar:'جرار'}},
        {id:'firetruck',img:img('firetruck'),text:{nl:'brandweerauto',en:'fire truck',de:'Feuerwehrauto',fr:'camion de pompiers',es:'camión de bomberos',it:'camion dei pompieri',pt:'caminhão de bombeiros',da:'brandbil',ru:'пожарная машина',ar:'سيارة إطفاء'}}
      ]},
      // Sport and Praten (greeting, thanking, yes and no), 2026-10-07: eight themes like the eight
      // worlds of the other games; pictures painted (Higgsfield). Praten's words are short phrases.
      {id:'sport',icon:'⚽',words:[
        {id:'football',img:img('football'),text:{nl:'voetbal',en:'soccer',de:'Fußball',fr:'football',es:'fútbol',it:'calcio',pt:'futebol',da:'fodbold',ru:'футбол',ar:'كرة القدم'}},
        {id:'basketball',img:img('basketball'),text:{nl:'basketbal',en:'basketball',de:'Basketball',fr:'basket',es:'baloncesto',it:'pallacanestro',pt:'basquete',da:'basketball',ru:'баскетбол',ar:'كرة السلة'}},
        {id:'tennis',img:img('tennis'),text:{nl:'tennis',en:'tennis',de:'Tennis',fr:'tennis',es:'tenis',it:'tennis',pt:'tênis',da:'tennis',ru:'теннис',ar:'تنس'}},
        {id:'swimming',img:img('swimming'),text:{nl:'zwemmen',en:'swimming',de:'Schwimmen',fr:'natation',es:'natación',it:'nuoto',pt:'natação',da:'svømning',ru:'плавание',ar:'سباحة'}},
        {id:'running',img:img('running'),text:{nl:'hardlopen',en:'running',de:'Laufen',fr:'course',es:'correr',it:'corsa',pt:'corrida',da:'løb',ru:'бег',ar:'جري'}},
        {id:'skating',img:img('skating'),text:{nl:'schaatsen',en:'ice skating',de:'Eislaufen',fr:'patinage',es:'patinaje',it:'pattinaggio',pt:'patinação',da:'skøjteløb',ru:'коньки',ar:'تزلج على الجليد'}},
        {id:'skiing',img:img('skiing'),text:{nl:'skiën',en:'skiing',de:'Skifahren',fr:'ski',es:'esquí',it:'sci',pt:'esqui',da:'skiløb',ru:'лыжи',ar:'تزلج على الثلج'}},
        {id:'medal',img:img('medal'),text:{nl:'medaille',en:'medal',de:'Medaille',fr:'médaille',es:'medalla',it:'medaglia',pt:'medalha',da:'medalje',ru:'медаль',ar:'ميدالية'}},
        {id:'trophy',img:img('trophy'),text:{nl:'beker',en:'trophy',de:'Pokal',fr:'coupe',es:'trofeo',it:'coppa',pt:'troféu',da:'pokal',ru:'кубок',ar:'كأس'}},
        {id:'skateboard',img:img('skateboard'),text:{nl:'skateboard',en:'skateboard',de:'Skateboard',fr:'skateboard',es:'monopatín',it:'skateboard',pt:'skate',da:'skateboard',ru:'скейтборд',ar:'لوح تزلج'}}
      ]},
      {id:'praten',icon:'💬',words:[
        {id:'hello',img:img('hello'),text:{nl:'hallo',en:'hello',de:'hallo',fr:'salut',es:'hola',it:'ciao',pt:'olá',da:'hej',ru:'привет',ar:'مرحبا'}},
        {id:'goodbye',img:img('goodbye'),text:{nl:'doei',en:'bye',de:'tschüss',fr:'au revoir',es:'adiós',it:'arrivederci',pt:'tchau',da:'farvel',ru:'пока',ar:'مع السلامة'}},
        {id:'thanks',img:img('thanks'),text:{nl:'dank je',en:'thank you',de:'danke',fr:'merci',es:'gracias',it:'grazie',pt:'obrigado',da:'tak',ru:'спасибо',ar:'شكرا'}},
        {id:'please',img:img('please'),text:{nl:'alsjeblieft',en:'please',de:'bitte',fr:'s’il te plaît',es:'por favor',it:'per favore',pt:'por favor',da:'vær sød',ru:'пожалуйста',ar:'من فضلك'}},
        {id:'yes',img:img('yes'),text:{nl:'ja',en:'yes',de:'ja',fr:'oui',es:'sí',it:'sì',pt:'sim',da:'ja',ru:'да',ar:'نعم'}},
        {id:'no',img:img('no'),text:{nl:'nee',en:'no',de:'nein',fr:'non',es:'no',it:'no',pt:'não',da:'nej',ru:'нет',ar:'لا'}},
        {id:'sorry',img:img('sorry'),text:{nl:'sorry',en:'sorry',de:'Entschuldigung',fr:'pardon',es:'perdón',it:'scusa',pt:'desculpa',da:'undskyld',ru:'извини',ar:'آسف'}},
        {id:'goodmorning',img:img('goodmorning'),text:{nl:'goedemorgen',en:'good morning',de:'guten Morgen',fr:'bonjour',es:'buenos días',it:'buongiorno',pt:'bom dia',da:'godmorgen',ru:'доброе утро',ar:'صباح الخير'}},
        {id:'goodnight',img:img('goodnight'),text:{nl:'welterusten',en:'good night',de:'gute Nacht',fr:'bonne nuit',es:'buenas noches',it:'buonanotte',pt:'boa noite',da:'godnat',ru:'спокойной ночи',ar:'تصبح على خير'}},
        {id:'howareyou',img:img('howareyou'),text:{nl:'hoe gaat het?',en:'how are you?',de:'wie geht’s?',fr:'ça va ?',es:'¿qué tal?',it:'come stai?',pt:'tudo bem?',da:'hvordan går det?',ru:'как дела?',ar:'كيف حالك؟'}}
      ]}
    ]
  };
  K.talenAudio=(lang,name,guide)=>`assets/talen/audio/${lang}/${guide?guide.toLowerCase()+'/':''}${name}.mp3`;
})();
