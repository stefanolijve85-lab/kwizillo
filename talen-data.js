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
  // <lang>/_<line>.mp3 a line (_goed<n>: praise, _bijna<n>: almost), both in Milo's
  // voice; <lang>/luna/ has the same in Luna's; <lang>/<guide>/_klaar_<theme>.mp3 the
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
    // "almost" in several wordings (_goed1.._goed16, _bijna1.._bijna6).
    lines:['intro','betekent'],praise:16,almost:6,
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
      ]},
      // Since 2026-10-10: five word themes (pictures made with Higgsfield in the look of the
      // first eight) and four sentence themes (kind:'zin', an emoji instead of a picture: the
      // child hears the sentence and taps what it means in their own language).
      {id:'huis',icon:'🏠',words:[
        {id:'bed',img:img('bed'),text:{nl:'bed',en:'bed',de:'Bett',fr:'lit',es:'cama',it:'letto',pt:'cama',da:'seng',ru:'кровать',ar:'سرير'}},
        {id:'chair',img:img('chair'),text:{nl:'stoel',en:'chair',de:'Stuhl',fr:'chaise',es:'silla',it:'sedia',pt:'cadeira',da:'stol',ru:'стул',ar:'كرسي'}},
        {id:'table',img:img('table'),text:{nl:'tafel',en:'table',de:'Tisch',fr:'table',es:'mesa',it:'tavolo',pt:'mesa',da:'bord',ru:'стол',ar:'طاولة'}},
        {id:'door',img:img('door'),text:{nl:'deur',en:'door',de:'Tür',fr:'porte',es:'puerta',it:'porta',pt:'porta',da:'dør',ru:'дверь',ar:'باب'}},
        {id:'window',img:img('window'),text:{nl:'raam',en:'window',de:'Fenster',fr:'fenêtre',es:'ventana',it:'finestra',pt:'janela',da:'vindue',ru:'окно',ar:'نافذة'}},
        {id:'book',img:img('book'),text:{nl:'boek',en:'book',de:'Buch',fr:'livre',es:'libro',it:'libro',pt:'livro',da:'bog',ru:'книга',ar:'كتاب'}},
        {id:'ball',img:img('ball'),text:{nl:'bal',en:'ball',de:'Ball',fr:'ballon',es:'pelota',it:'palla',pt:'bola',da:'bold',ru:'мяч',ar:'كرة'}},
        {id:'lamp',img:img('lamp'),text:{nl:'lamp',en:'lamp',de:'Lampe',fr:'lampe',es:'lámpara',it:'lampada',pt:'luminária',da:'lampe',ru:'лампа',ar:'مصباح'}},
        {id:'key',img:img('key'),text:{nl:'sleutel',en:'key',de:'Schlüssel',fr:'clé',es:'llave',it:'chiave',pt:'chave',da:'nøgle',ru:'ключ',ar:'مفتاح'}},
        {id:'clock',img:img('clock'),text:{nl:'klok',en:'clock',de:'Uhr',fr:'horloge',es:'reloj',it:'orologio',pt:'relógio',da:'ur',ru:'часы',ar:'ساعة'}}
      ]},
      {id:'natuur',icon:'🌳',words:[
        {id:'sun',img:img('sun'),text:{nl:'zon',en:'sun',de:'Sonne',fr:'soleil',es:'sol',it:'sole',pt:'sol',da:'sol',ru:'солнце',ar:'شمس'}},
        {id:'moon',img:img('moon'),text:{nl:'maan',en:'moon',de:'Mond',fr:'lune',es:'luna',it:'luna',pt:'lua',da:'måne',ru:'луна',ar:'قمر'}},
        {id:'star',img:img('star'),text:{nl:'ster',en:'star',de:'Stern',fr:'étoile',es:'estrella',it:'stella',pt:'estrela',da:'stjerne',ru:'звезда',ar:'نجمة'}},
        {id:'rain',img:img('rain'),text:{nl:'regen',en:'rain',de:'Regen',fr:'pluie',es:'lluvia',it:'pioggia',pt:'chuva',da:'regn',ru:'дождь',ar:'مطر'}},
        {id:'snow',img:img('snow'),text:{nl:'sneeuw',en:'snow',de:'Schnee',fr:'neige',es:'nieve',it:'neve',pt:'neve',da:'sne',ru:'снег',ar:'ثلج'}},
        {id:'cloud',img:img('cloud'),text:{nl:'wolk',en:'cloud',de:'Wolke',fr:'nuage',es:'nube',it:'nuvola',pt:'nuvem',da:'sky',ru:'облако',ar:'غيمة'}},
        {id:'tree',img:img('tree'),text:{nl:'boom',en:'tree',de:'Baum',fr:'arbre',es:'árbol',it:'albero',pt:'árvore',da:'træ',ru:'дерево',ar:'شجرة'}},
        {id:'flower',img:img('flower'),text:{nl:'bloem',en:'flower',de:'Blume',fr:'fleur',es:'flor',it:'fiore',pt:'flor',da:'blomst',ru:'цветок',ar:'زهرة'}},
        {id:'mountain',img:img('mountain'),text:{nl:'berg',en:'mountain',de:'Berg',fr:'montagne',es:'montaña',it:'montagna',pt:'montanha',da:'bjerg',ru:'гора',ar:'جبل'}},
        {id:'sea',img:img('sea'),text:{nl:'zee',en:'sea',de:'Meer',fr:'mer',es:'mar',it:'mare',pt:'mar',da:'hav',ru:'море',ar:'بحر'}}
      ]},
      {id:'familie',icon:'👨‍👩‍👧',cover:img('cover-familie'),words:[
        {id:'mom',img:img('mom'),text:{nl:'mama',en:'mom',de:'Mama',fr:'maman',es:'mamá',it:'mamma',pt:'mamãe',da:'mor',ru:'мама',ar:'ماما'}},
        {id:'dad',img:img('dad'),text:{nl:'papa',en:'dad',de:'Papa',fr:'papa',es:'papá',it:'papà',pt:'papai',da:'far',ru:'папа',ar:'بابا'}},
        {id:'brother',img:img('brother'),text:{nl:'broer',en:'brother',de:'Bruder',fr:'frère',es:'hermano',it:'fratello',pt:'irmão',da:'bror',ru:'брат',ar:'أخ'}},
        {id:'sister',img:img('sister'),text:{nl:'zus',en:'sister',de:'Schwester',fr:'sœur',es:'hermana',it:'sorella',pt:'irmã',da:'søster',ru:'сестра',ar:'أخت'}},
        {id:'grandpa',img:img('grandpa'),text:{nl:'opa',en:'grandpa',de:'Opa',fr:'papi',es:'abuelo',it:'nonno',pt:'vovô',da:'bedstefar',ru:'дедушка',ar:'جد'}},
        {id:'grandma',img:img('grandma'),text:{nl:'oma',en:'grandma',de:'Oma',fr:'mamie',es:'abuela',it:'nonna',pt:'vovó',da:'bedstemor',ru:'бабушка',ar:'جدة'}},
        {id:'baby',img:img('baby'),text:{nl:'baby',en:'baby',de:'Baby',fr:'bébé',es:'bebé',it:'bebè',pt:'bebê',da:'baby',ru:'малыш',ar:'رضيع'}},
        {id:'friend',img:img('friend'),text:{nl:'vriend',en:'friend',de:'Freund',fr:'ami',es:'amigo',it:'amico',pt:'amigo',da:'ven',ru:'друг',ar:'صديق'}},
        {id:'teacher',img:img('teacher'),text:{nl:'juf',en:'teacher',de:'Lehrerin',fr:'maîtresse',es:'maestra',it:'maestra',pt:'professora',da:'lærer',ru:'учительница',ar:'معلمة'}},
        {id:'doctor',img:img('doctor'),text:{nl:'dokter',en:'doctor',de:'Arzt',fr:'docteur',es:'médico',it:'dottore',pt:'médico',da:'læge',ru:'врач',ar:'طبيب'}}
      ]},
      {id:'kleding',icon:'👕',words:[
        {id:'coat',img:img('coat'),text:{nl:'jas',en:'coat',de:'Jacke',fr:'manteau',es:'abrigo',it:'cappotto',pt:'casaco',da:'jakke',ru:'куртка',ar:'معطف'}},
        {id:'shoe',img:img('shoe'),text:{nl:'schoen',en:'shoe',de:'Schuh',fr:'chaussure',es:'zapato',it:'scarpa',pt:'sapato',da:'sko',ru:'ботинок',ar:'حذاء'}},
        {id:'pants',img:img('pants'),text:{nl:'broek',en:'pants',de:'Hose',fr:'pantalon',es:'pantalón',it:'pantaloni',pt:'calça',da:'bukser',ru:'штаны',ar:'بنطال'}},
        {id:'beanie',img:img('beanie'),text:{nl:'muts',en:'hat',de:'Mütze',fr:'bonnet',es:'gorro',it:'berretto',pt:'gorro',da:'hue',ru:'шапка',ar:'قبعة'}},
        {id:'dress',img:img('dress'),text:{nl:'jurk',en:'dress',de:'Kleid',fr:'robe',es:'vestido',it:'vestito',pt:'vestido',da:'kjole',ru:'платье',ar:'فستان'}},
        {id:'sock',img:img('sock'),text:{nl:'sok',en:'sock',de:'Socke',fr:'chaussette',es:'calcetín',it:'calzino',pt:'meia',da:'sok',ru:'носок',ar:'جورب'}},
        {id:'tshirt',img:img('tshirt'),text:{nl:'T-shirt',en:'T-shirt',de:'T-Shirt',fr:'tee-shirt',es:'camiseta',it:'maglietta',pt:'camiseta',da:'T-shirt',ru:'футболка',ar:'تيشيرت'}},
        {id:'scarf',img:img('scarf'),text:{nl:'sjaal',en:'scarf',de:'Schal',fr:'écharpe',es:'bufanda',it:'sciarpa',pt:'cachecol',da:'halstørklæde',ru:'шарф',ar:'وشاح'}},
        {id:'gloves',img:img('gloves'),text:{nl:'handschoenen',en:'gloves',de:'Handschuhe',fr:'gants',es:'guantes',it:'guanti',pt:'luvas',da:'handsker',ru:'перчатки',ar:'قفازات'}},
        {id:'sweater',img:img('sweater'),text:{nl:'trui',en:'sweater',de:'Pullover',fr:'pull',es:'jersey',it:'maglione',pt:'suéter',da:'sweater',ru:'свитер',ar:'كنزة'}}
      ]},
      {id:'school',icon:'🎒',words:[
        {id:'pencil',img:img('pencil'),text:{nl:'potlood',en:'pencil',de:'Bleistift',fr:'crayon',es:'lápiz',it:'matita',pt:'lápis',da:'blyant',ru:'карандаш',ar:'قلم رصاص'}},
        {id:'notebook',img:img('notebook'),text:{nl:'schrift',en:'notebook',de:'Heft',fr:'cahier',es:'cuaderno',it:'quaderno',pt:'caderno',da:'hæfte',ru:'тетрадь',ar:'دفتر'}},
        {id:'schoolbag',img:img('schoolbag'),text:{nl:'schooltas',en:'school bag',de:'Schultasche',fr:'cartable',es:'mochila',it:'zaino',pt:'mochila',da:'skoletaske',ru:'рюкзак',ar:'حقيبة مدرسية'}},
        {id:'scissors',img:img('scissors'),text:{nl:'schaar',en:'scissors',de:'Schere',fr:'ciseaux',es:'tijeras',it:'forbici',pt:'tesoura',da:'saks',ru:'ножницы',ar:'مقص'}},
        {id:'eraser',img:img('eraser'),text:{nl:'gum',en:'eraser',de:'Radiergummi',fr:'gomme',es:'goma',it:'gomma',pt:'borracha',da:'viskelæder',ru:'ластик',ar:'ممحاة'}},
        {id:'ruler',img:img('ruler'),text:{nl:'liniaal',en:'ruler',de:'Lineal',fr:'règle',es:'regla',it:'righello',pt:'régua',da:'lineal',ru:'линейка',ar:'مسطرة'}},
        {id:'glue',img:img('glue'),text:{nl:'lijm',en:'glue',de:'Kleber',fr:'colle',es:'pegamento',it:'colla',pt:'cola',da:'lim',ru:'клей',ar:'صمغ'}},
        {id:'paintbrush',img:img('paintbrush'),text:{nl:'kwast',en:'paintbrush',de:'Pinsel',fr:'pinceau',es:'pincel',it:'pennello',pt:'pincel',da:'pensel',ru:'кисточка',ar:'فرشاة'}},
        {id:'blackboard',img:img('blackboard'),text:{nl:'schoolbord',en:'blackboard',de:'Tafel',fr:'tableau',es:'pizarra',it:'lavagna',pt:'lousa',da:'tavle',ru:'доска',ar:'سبورة'}},
        {id:'computer',img:img('computer'),text:{nl:'computer',en:'computer',de:'Computer',fr:'ordinateur',es:'ordenador',it:'computer',pt:'computador',da:'computer',ru:'компьютер',ar:'حاسوب'}}
      ]},
      {id:'vakantie',icon:'🏖️',words:[
        {id:'suitcase',img:img('suitcase'),text:{nl:'koffer',en:'suitcase',de:'Koffer',fr:'valise',es:'maleta',it:'valigia',pt:'mala',da:'kuffert',ru:'чемодан',ar:'حقيبة سفر'}},
        {id:'tent',img:img('tent'),text:{nl:'tent',en:'tent',de:'Zelt',fr:'tente',es:'tienda',it:'tenda',pt:'barraca',da:'telt',ru:'палатка',ar:'خيمة'}},
        {id:'sandcastle',img:img('sandcastle'),text:{nl:'zandkasteel',en:'sandcastle',de:'Sandburg',fr:'château de sable',es:'castillo de arena',it:'castello di sabbia',pt:'castelo de areia',da:'sandslot',ru:'замок из песка',ar:'قلعة رملية'}},
        {id:'sunglasses',img:img('sunglasses'),text:{nl:'zonnebril',en:'sunglasses',de:'Sonnenbrille',fr:'lunettes de soleil',es:'gafas de sol',it:'occhiali da sole',pt:'óculos de sol',da:'solbriller',ru:'солнечные очки',ar:'نظارة شمسية'}},
        {id:'seashell',img:img('seashell'),text:{nl:'schelp',en:'seashell',de:'Muschel',fr:'coquillage',es:'concha',it:'conchiglia',pt:'concha',da:'muslingeskal',ru:'ракушка',ar:'صدفة'}},
        {id:'swimsuit',img:img('swimsuit'),text:{nl:'zwempak',en:'swimsuit',de:'Badeanzug',fr:'maillot de bain',es:'bañador',it:'costume da bagno',pt:'maiô',da:'badedragt',ru:'купальник',ar:'ملابس سباحة'}},
        {id:'passport',img:img('passport'),text:{nl:'paspoort',en:'passport',de:'Reisepass',fr:'passeport',es:'pasaporte',it:'passaporto',pt:'passaporte',da:'pas',ru:'паспорт',ar:'جواز سفر'}},
        {id:'map',img:img('map'),text:{nl:'landkaart',en:'map',de:'Landkarte',fr:'carte',es:'mapa',it:'mappa',pt:'mapa',da:'landkort',ru:'карта',ar:'خريطة'}},
        {id:'camera',img:img('camera'),text:{nl:'fototoestel',en:'camera',de:'Kamera',fr:'appareil photo',es:'cámara',it:'macchina fotografica',pt:'câmera',da:'kamera',ru:'фотоаппарат',ar:'كاميرا'}},
        {id:'flipflops',img:img('flipflops'),text:{nl:'slippers',en:'flip-flops',de:'Flip-Flops',fr:'tongs',es:'chanclas',it:'infradito',pt:'chinelos',da:'klipklappere',ru:'шлёпанцы',ar:'شبشب'}}
      ]},
      {id:'mij',icon:'🙋',cover:img('cover-mij'),kind:'zin',words:[
        {id:'zin_hungry',emoji:'🍽️',text:{nl:'Ik heb honger',en:'I’m hungry',de:'Ich habe Hunger',fr:'J’ai faim',es:'Tengo hambre',it:'Ho fame',pt:'Estou com fome',da:'Jeg er sulten',ru:'Я хочу есть',ar:'أشعر بالجوع'}},
        {id:'zin_thirsty',emoji:'🥤',text:{nl:'Ik heb dorst',en:'I’m thirsty',de:'Ich habe Durst',fr:'J’ai soif',es:'Tengo sed',it:'Ho sete',pt:'Estou com sede',da:'Jeg er tørstig',ru:'Я хочу пить',ar:'أشعر بالعطش'}},
        {id:'zin_sleepy',emoji:'😴',text:{nl:'Ik wil slapen',en:'I want to sleep',de:'Ich will schlafen',fr:'Je veux dormir',es:'Quiero dormir',it:'Voglio dormire',pt:'Quero dormir',da:'Jeg vil sove',ru:'Я хочу спать',ar:'أريد أن أنام'}},
        {id:'zin_likeit',emoji:'👍',text:{nl:'Dat vind ik leuk',en:'I like that',de:'Das mag ich',fr:'J’aime ça',es:'Me gusta',it:'Mi piace',pt:'Eu gosto disso',da:'Det kan jeg lide',ru:'Мне нравится',ar:'يعجبني هذا'}},
        {id:'zin_havedog',emoji:'🐶',text:{nl:'Ik heb een hond',en:'I have a dog',de:'Ich habe einen Hund',fr:'J’ai un chien',es:'Tengo un perro',it:'Ho un cane',pt:'Eu tenho um cachorro',da:'Jeg har en hund',ru:'У меня есть собака',ar:'عندي كلب'}},
        {id:'zin_livehere',emoji:'🏡',text:{nl:'Ik woon hier',en:'I live here',de:'Ich wohne hier',fr:'J’habite ici',es:'Vivo aquí',it:'Abito qui',pt:'Eu moro aqui',da:'Jeg bor her',ru:'Я живу здесь',ar:'أسكن هنا'}},
        {id:'zin_canswim',emoji:'🏊',text:{nl:'Ik kan zwemmen',en:'I can swim',de:'Ich kann schwimmen',fr:'Je sais nager',es:'Sé nadar',it:'So nuotare',pt:'Eu sei nadar',da:'Jeg kan svømme',ru:'Я умею плавать',ar:'أستطيع السباحة'}},
        {id:'zin_lovepizza',emoji:'🍕',text:{nl:'Ik hou van pizza',en:'I love pizza',de:'Ich liebe Pizza',fr:'J’adore la pizza',es:'Me encanta la pizza',it:'Adoro la pizza',pt:'Eu adoro pizza',da:'Jeg elsker pizza',ru:'Я люблю пиццу',ar:'أحب البيتزا'}},
        {id:'zin_seven',emoji:'🎂',text:{nl:'Ik ben zeven jaar',en:'I’m seven years old',de:'Ich bin sieben Jahre alt',fr:'J’ai sept ans',es:'Tengo siete años',it:'Ho sette anni',pt:'Eu tenho sete anos',da:'Jeg er syv år',ru:'Мне семь лет',ar:'عمري سبع سنوات'}},
        {id:'zin_toschool',emoji:'🏫',text:{nl:'Ik ga naar school',en:'I go to school',de:'Ich gehe zur Schule',fr:'Je vais à l’école',es:'Voy al colegio',it:'Vado a scuola',pt:'Eu vou para a escola',da:'Jeg går i skole',ru:'Я хожу в школу',ar:'أذهب إلى المدرسة'}}
      ]},
      {id:'vragen',icon:'❓',cover:img('cover-vragen'),kind:'zin',words:[
        {id:'zin_yourname',emoji:'📛',text:{nl:'Hoe heet jij?',en:'What’s your name?',de:'Wie heißt du?',fr:'Comment tu t’appelles ?',es:'¿Cómo te llamas?',it:'Come ti chiami?',pt:'Qual é o seu nome?',da:'Hvad hedder du?',ru:'Как тебя зовут?',ar:'ما اسمك؟'}},
        {id:'zin_howold',emoji:'🔢',text:{nl:'Hoe oud ben jij?',en:'How old are you?',de:'Wie alt bist du?',fr:'Quel âge as-tu ?',es:'¿Cuántos años tienes?',it:'Quanti anni hai?',pt:'Quantos anos você tem?',da:'Hvor gammel er du?',ru:'Сколько тебе лет?',ar:'كم عمرك؟'}},
        {id:'zin_wherelive',emoji:'🗺️',text:{nl:'Waar woon jij?',en:'Where do you live?',de:'Wo wohnst du?',fr:'Où habites-tu ?',es:'¿Dónde vives?',it:'Dove abiti?',pt:'Onde você mora?',da:'Hvor bor du?',ru:'Где ты живёшь?',ar:'أين تسكن؟'}},
        {id:'zin_wantplay',emoji:'🎲',text:{nl:'Wil je spelen?',en:'Do you want to play?',de:'Willst du spielen?',fr:'Tu veux jouer ?',es:'¿Quieres jugar?',it:'Vuoi giocare?',pt:'Você quer brincar?',da:'Vil du lege?',ru:'Хочешь поиграть?',ar:'هل تريد أن تلعب؟'}},
        {id:'zin_toilet',emoji:'🚻',text:{nl:'Waar is de wc?',en:'Where is the bathroom?',de:'Wo ist die Toilette?',fr:'Où sont les toilettes ?',es:'¿Dónde está el baño?',it:'Dov’è il bagno?',pt:'Onde fica o banheiro?',da:'Hvor er toilettet?',ru:'Где туалет?',ar:'أين الحمام؟'}},
        {id:'zin_time',emoji:'⏰',text:{nl:'Hoe laat is het?',en:'What time is it?',de:'Wie spät ist es?',fr:'Quelle heure est-il ?',es:'¿Qué hora es?',it:'Che ore sono?',pt:'Que horas são?',da:'Hvad er klokken?',ru:'Который час?',ar:'كم الساعة؟'}},
        {id:'zin_whatis',emoji:'🔍',text:{nl:'Wat is dit?',en:'What is this?',de:'Was ist das?',fr:'Qu’est-ce que c’est ?',es:'¿Qué es esto?',it:'Che cos’è?',pt:'O que é isso?',da:'Hvad er det?',ru:'Что это?',ar:'ما هذا؟'}},
        {id:'zin_help',emoji:'🙋',text:{nl:'Kun je me helpen?',en:'Can you help me?',de:'Kannst du mir helfen?',fr:'Tu peux m’aider ?',es:'¿Me ayudas?',it:'Mi aiuti?',pt:'Você pode me ajudar?',da:'Kan du hjælpe mig?',ru:'Ты можешь мне помочь?',ar:'هل يمكنك مساعدتي؟'}},
        {id:'zin_youlike',emoji:'💭',text:{nl:'Wat vind jij leuk?',en:'What do you like?',de:'Was magst du?',fr:'Qu’est-ce que tu aimes ?',es:'¿Qué te gusta?',it:'Cosa ti piace?',pt:'Do que você gosta?',da:'Hvad kan du lide?',ru:'Что тебе нравится?',ar:'ماذا تحب؟'}},
        {id:'zin_howmuch',emoji:'💰',text:{nl:'Hoeveel kost het?',en:'How much is it?',de:'Wie viel kostet das?',fr:'Combien ça coûte ?',es:'¿Cuánto cuesta?',it:'Quanto costa?',pt:'Quanto custa?',da:'Hvad koster det?',ru:'Сколько это стоит?',ar:'بكم هذا؟'}}
      ]},
      {id:'gevoel',icon:'💛',cover:img('cover-gevoel'),kind:'zin',words:[
        {id:'zin_happy',emoji:'😄',text:{nl:'Ik ben blij',en:'I’m happy',de:'Ich bin froh',fr:'Je suis content',es:'Estoy contento',it:'Sono felice',pt:'Estou feliz',da:'Jeg er glad',ru:'Мне весело',ar:'أنا سعيد'}},
        {id:'zin_sad',emoji:'😢',text:{nl:'Ik ben verdrietig',en:'I’m sad',de:'Ich bin traurig',fr:'Je suis triste',es:'Estoy triste',it:'Sono triste',pt:'Estou triste',da:'Jeg er ked af det',ru:'Мне грустно',ar:'أنا حزين'}},
        {id:'zin_scared',emoji:'😨',text:{nl:'Ik ben bang',en:'I’m scared',de:'Ich habe Angst',fr:'J’ai peur',es:'Tengo miedo',it:'Ho paura',pt:'Estou com medo',da:'Jeg er bange',ru:'Мне страшно',ar:'أنا خائف'}},
        {id:'zin_angry',emoji:'😠',text:{nl:'Ik ben boos',en:'I’m angry',de:'Ich bin wütend',fr:'Je suis fâché',es:'Estoy enfadado',it:'Sono arrabbiato',pt:'Estou bravo',da:'Jeg er vred',ru:'Я сержусь',ar:'أنا غاضب'}},
        {id:'zin_sick',emoji:'🤒',text:{nl:'Ik ben ziek',en:'I’m sick',de:'Ich bin krank',fr:'Je suis malade',es:'Estoy enfermo',it:'Sono malato',pt:'Estou doente',da:'Jeg er syg',ru:'Я болею',ar:'أنا مريض'}},
        {id:'zin_cold',emoji:'🥶',text:{nl:'Ik heb het koud',en:'I’m cold',de:'Mir ist kalt',fr:'J’ai froid',es:'Tengo frío',it:'Ho freddo',pt:'Estou com frio',da:'Jeg fryser',ru:'Мне холодно',ar:'أشعر بالبرد'}},
        {id:'zin_hot',emoji:'🥵',text:{nl:'Ik heb het warm',en:'I’m hot',de:'Mir ist warm',fr:'J’ai chaud',es:'Tengo calor',it:'Ho caldo',pt:'Estou com calor',da:'Jeg har det varmt',ru:'Мне жарко',ar:'أشعر بالحر'}},
        {id:'zin_hurts',emoji:'🤕',text:{nl:'Het doet pijn',en:'It hurts',de:'Es tut weh',fr:'J’ai mal',es:'Me duele',it:'Mi fa male',pt:'Está doendo',da:'Det gør ondt',ru:'Мне больно',ar:'هذا يؤلمني'}},
        {id:'zin_loveyou',emoji:'❤️',text:{nl:'Ik hou van jou',en:'I love you',de:'Ich hab dich lieb',fr:'Je t’aime',es:'Te quiero',it:'Ti voglio bene',pt:'Eu te amo',da:'Jeg elsker dig',ru:'Я тебя люблю',ar:'أحبك'}},
        {id:'zin_fun',emoji:'🤩',text:{nl:'Wat leuk!',en:'How fun!',de:'Wie toll!',fr:'Trop bien !',es:'¡Qué divertido!',it:'Che bello!',pt:'Que legal!',da:'Hvor sjovt!',ru:'Как здорово!',ar:'هذا ممتع!'}}
      ]},
      {id:'samen',icon:'🤝',cover:img('cover-samen'),kind:'zin',words:[
        {id:'zin_letsplay',emoji:'🧸',text:{nl:'Zullen we spelen?',en:'Shall we play?',de:'Wollen wir spielen?',fr:'On joue ?',es:'¿Jugamos?',it:'Giochiamo?',pt:'Vamos brincar?',da:'Skal vi lege?',ru:'Давай играть!',ar:'هيا نلعب!'}},
        {id:'zin_myturn',emoji:'☝️',text:{nl:'Ik ben aan de beurt',en:'It’s my turn',de:'Ich bin dran',fr:'C’est mon tour',es:'Me toca a mí',it:'Tocca a me',pt:'É a minha vez',da:'Det er min tur',ru:'Моя очередь',ar:'إنه دوري'}},
        {id:'zin_yourturn',emoji:'👉',text:{nl:'Jij bent aan de beurt',en:'It’s your turn',de:'Du bist dran',fr:'C’est ton tour',es:'Te toca a ti',it:'Tocca a te',pt:'É a sua vez',da:'Det er din tur',ru:'Твоя очередь',ar:'إنه دورك'}},
        {id:'zin_wewon',emoji:'🏆',text:{nl:'We hebben gewonnen!',en:'We won!',de:'Wir haben gewonnen!',fr:'On a gagné !',es:'¡Hemos ganado!',it:'Abbiamo vinto!',pt:'Nós ganhamos!',da:'Vi vandt!',ru:'Мы победили!',ar:'لقد فزنا!'}},
        {id:'zin_comehere',emoji:'👋',text:{nl:'Kom hier!',en:'Come here!',de:'Komm her!',fr:'Viens ici !',es:'¡Ven aquí!',it:'Vieni qui!',pt:'Vem aqui!',da:'Kom her!',ru:'Иди сюда!',ar:'تعال هنا!'}},
        {id:'zin_wait',emoji:'✋',text:{nl:'Wacht even!',en:'Wait a moment!',de:'Warte mal!',fr:'Attends !',es:'¡Espera!',it:'Aspetta!',pt:'Espera aí!',da:'Vent lidt!',ru:'Подожди!',ar:'انتظر!'}},
        {id:'zin_goodjob',emoji:'👏',text:{nl:'Goed gedaan!',en:'Good job!',de:'Gut gemacht!',fr:'Bien joué !',es:'¡Bien hecho!',it:'Ben fatto!',pt:'Mandou bem!',da:'Godt gået!',ru:'Молодец!',ar:'أحسنت!'}},
        {id:'zin_again',emoji:'🔁',text:{nl:'Nog een keer!',en:'One more time!',de:'Noch einmal!',fr:'Encore une fois !',es:'¡Otra vez!',it:'Ancora una volta!',pt:'Mais uma vez!',da:'En gang til!',ru:'Ещё раз!',ar:'مرة أخرى!'}},
        {id:'zin_befriend',emoji:'💛',text:{nl:'Wil je mijn vriend zijn?',en:'Do you want to be my friend?',de:'Willst du mein Freund sein?',fr:'Tu veux être mon ami ?',es:'¿Quieres ser mi amigo?',it:'Vuoi essere mio amico?',pt:'Quer ser meu amigo?',da:'Vil du være min ven?',ru:'Давай дружить?',ar:'هل تريد أن تكون صديقي؟'}},
        {id:'zin_tomorrow',emoji:'🌅',text:{nl:'Tot morgen!',en:'See you tomorrow!',de:'Bis morgen!',fr:'À demain !',es:'¡Hasta mañana!',it:'A domani!',pt:'Até amanhã!',da:'Vi ses i morgen!',ru:'До завтра!',ar:'أراك غدًا!'}}
      ]}
    ]
  };
  K.talenAudio=(lang,name,guide)=>`assets/talen/audio/${lang}/${guide?guide.toLowerCase()+'/':''}${name}.mp3`;
})();
