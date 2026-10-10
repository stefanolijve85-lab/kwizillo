(()=>{
  const K=window.KWIZILLO_M1=window.KWIZILLO_M1||{};
  // Gesprekjes (2026-10-10): very short conversations in the language the child learns,
  // then a question in the child's own language. A is the boy (left), B the girl (right).
  // The first option is the right one (the game shuffles them). An option is either a
  // plain string (the same in every language: names, numbers, times) or {e:'emoji',text:{...}}.
  // Sound: assets/talen/audio/<lang>/c_<id>_<n>.mp3 per line (tools/talen-audio.cjs),
  // _q_<id>.mp3 for the question in the child's own language.
  K.TALEN=K.TALEN||{};
  K.TALEN.conversations=[
    {id:'intro',free:true,convs:[
      {id:'intro1',lines:[
        {who:'a',text:{en:'Hello! What\'s your name?',nl:'Hallo! Hoe heet jij?',de:'Hallo! Wie heißt du?',fr:'Salut ! Tu t\'appelles comment ?',es:'¡Hola! ¿Cómo te llamas?',it:'Ciao! Come ti chiami?',pt:'Oi! Qual é o seu nome?',da:'Hej! Hvad hedder du?',ru:'Привет! Как тебя зовут?',ar:'مرحبا! ما اسمك؟'}},
        {who:'b',text:{en:'My name is Sofia.',nl:'Ik heet Sofia.',de:'Ich heiße Sofia.',fr:'Je m\'appelle Sofia.',es:'Me llamo Sofia.',it:'Mi chiamo Sofia.',pt:'Meu nome é Sofia.',da:'Jeg hedder Sofia.',ru:'Меня зовут София.',ar:'اسمي صوفيا.'}}],
       q:{en:'What is the girl\'s name?',nl:'Hoe heet het meisje?',de:'Wie heißt das Mädchen?',fr:'Comment s\'appelle la fille ?',es:'¿Cómo se llama la niña?',it:'Come si chiama la bambina?',pt:'Qual é o nome da menina?',da:'Hvad hedder pigen?',ru:'Как зовут девочку?',ar:'ما اسم البنت؟'},
       opts:[
        'Sofia',
        'Luna',
        'Maria',
        'Ana']},
      {id:'intro2',lines:[
        {who:'a',text:{en:'How old are you?',nl:'Hoe oud ben jij?',de:'Wie alt bist du?',fr:'Tu as quel âge ?',es:'¿Cuántos años tienes?',it:'Quanti anni hai?',pt:'Quantos anos você tem?',da:'Hvor gammel er du?',ru:'Сколько тебе лет?',ar:'كم عمرك؟'}},
        {who:'b',text:{en:'I\'m eight.',nl:'Ik ben acht.',de:'Ich bin acht.',fr:'J\'ai huit ans.',es:'Tengo ocho años.',it:'Ho otto anni.',pt:'Tenho oito anos.',da:'Jeg er otte.',ru:'Мне восемь.',ar:'عمري ثماني سنوات.'}}],
       q:{en:'How old is the girl?',nl:'Hoe oud is het meisje?',de:'Wie alt ist das Mädchen?',fr:'Quel âge a la fille ?',es:'¿Cuántos años tiene la niña?',it:'Quanti anni ha la bambina?',pt:'Quantos anos a menina tem?',da:'Hvor gammel er pigen?',ru:'Сколько лет девочке?',ar:'كم عمر البنت؟'},
       opts:[
        '8',
        '6',
        '10',
        '12']},
      {id:'intro3',lines:[
        {who:'a',text:{en:'Where do you live?',nl:'Waar woon jij?',de:'Wo wohnst du?',fr:'Tu habites où ?',es:'¿Dónde vives?',it:'Dove abiti?',pt:'Onde você mora?',da:'Hvor bor du?',ru:'Где ты живёшь?',ar:'أين تسكنين؟'}},
        {who:'b',text:{en:'I live in Madrid.',nl:'Ik woon in Madrid.',de:'Ich wohne in Madrid.',fr:'J\'habite à Madrid.',es:'Vivo en Madrid.',it:'Abito a Madrid.',pt:'Eu moro em Madri.',da:'Jeg bor i Madrid.',ru:'Я живу в Мадриде.',ar:'أسكن في مدريد.'}},
        {who:'a',text:{en:'How nice!',nl:'Wat leuk!',de:'Wie schön!',fr:'Trop bien !',es:'¡Qué guay!',it:'Che bello!',pt:'Que legal!',da:'Hvor fedt!',ru:'Здорово!',ar:'رائع!'}}],
       q:{en:'Where does the girl live?',nl:'Waar woont het meisje?',de:'Wo wohnt das Mädchen?',fr:'Où habite la fille ?',es:'¿Dónde vive la niña?',it:'Dove abita la bambina?',pt:'Onde a menina mora?',da:'Hvor bor pigen?',ru:'Где живёт девочка?',ar:'أين تسكن البنت؟'},
       opts:[
        {text:{en:'Madrid',nl:'Madrid',de:'Madrid',fr:'Madrid',es:'Madrid',it:'Madrid',pt:'Madri',da:'Madrid',ru:'Мадрид',ar:'مدريد'}},
        {text:{en:'Paris',nl:'Parijs',de:'Paris',fr:'Paris',es:'París',it:'Parigi',pt:'Paris',da:'Paris',ru:'Париж',ar:'باريس'}},
        {text:{en:'Rome',nl:'Rome',de:'Rom',fr:'Rome',es:'Roma',it:'Roma',pt:'Roma',da:'Rom',ru:'Рим',ar:'روما'}},
        {text:{en:'London',nl:'Londen',de:'London',fr:'Londres',es:'Londres',it:'Londra',pt:'Londres',da:'London',ru:'Лондон',ar:'لندن'}}]},
      {id:'intro4',lines:[
        {who:'a',text:{en:'This is my brother Tom.',nl:'Dit is mijn broer Tom.',de:'Das ist mein Bruder Tom.',fr:'C\'est mon frère Tom.',es:'Este es mi hermano Tom.',it:'Questo è mio fratello Tom.',pt:'Este é meu irmão Tom.',da:'Det er min bror Tom.',ru:'Это мой брат Том.',ar:'هذا أخي توم.'}},
        {who:'b',text:{en:'Hi Tom! How old is he?',nl:'Hoi Tom! Hoe oud is hij?',de:'Hallo Tom! Wie alt ist er?',fr:'Salut Tom ! Il a quel âge ?',es:'¡Hola, Tom! ¿Cuántos años tiene?',it:'Ciao Tom! Quanti anni ha?',pt:'Oi, Tom! Quantos anos ele tem?',da:'Hej Tom! Hvor gammel er han?',ru:'Привет, Том! Сколько ему лет?',ar:'مرحبا يا توم! كم عمره؟'}},
        {who:'a',text:{en:'He\'s ten.',nl:'Hij is tien.',de:'Er ist zehn.',fr:'Il a dix ans.',es:'Tiene diez años.',it:'Ha dieci anni.',pt:'Ele tem dez anos.',da:'Han er ti.',ru:'Ему десять.',ar:'عمره عشر سنوات.'}}],
       q:{en:'Who is Tom?',nl:'Wie is Tom?',de:'Wer ist Tom?',fr:'Qui est Tom ?',es:'¿Quién es Tom?',it:'Chi è Tom?',pt:'Quem é o Tom?',da:'Hvem er Tom?',ru:'Кто такой Том?',ar:'من هو توم؟'},
       opts:[
        {text:{en:'His brother',nl:'Zijn broer',de:'Sein Bruder',fr:'Son frère',es:'Su hermano',it:'Suo fratello',pt:'O irmão dele',da:'Hans bror',ru:'Его брат',ar:'أخوه'}},
        {text:{en:'His father',nl:'Zijn vader',de:'Sein Vater',fr:'Son père',es:'Su padre',it:'Suo padre',pt:'O pai dele',da:'Hans far',ru:'Его папа',ar:'أبوه'}},
        {text:{en:'His friend',nl:'Zijn vriend',de:'Sein Freund',fr:'Son copain',es:'Su amigo',it:'Suo amico',pt:'O amigo dele',da:'Hans ven',ru:'Его друг',ar:'صديقه'}},
        {text:{en:'His grandpa',nl:'Zijn opa',de:'Sein Opa',fr:'Son grand-père',es:'Su abuelo',it:'Suo nonno',pt:'O avô dele',da:'Hans bedstefar',ru:'Его дедушка',ar:'جده'}}]}
    ]},
    {id:'school',convs:[
      {id:'school1',lines:[
        {who:'a',text:{en:'Do you have a pen?',nl:'Heb jij een pen?',de:'Hast du einen Stift?',fr:'Tu as un stylo ?',es:'¿Tienes un boli?',it:'Hai una penna?',pt:'Você tem uma caneta?',da:'Har du en kuglepen?',ru:'У тебя есть ручка?',ar:'هل عندك قلم؟'}},
        {who:'b',text:{en:'Yes, here you go!',nl:'Ja, hier!',de:'Ja, hier!',fr:'Oui, tiens !',es:'¡Sí, toma!',it:'Sì, tieni!',pt:'Tenho, toma!',da:'Ja, værsgo!',ru:'Да, держи!',ar:'نعم، تفضل!'}}],
       q:{en:'What does the boy want?',nl:'Wat wil de jongen hebben?',de:'Was möchte der Junge haben?',fr:'Que veut le garçon ?',es:'¿Qué quiere el niño?',it:'Cosa vuole il bambino?',pt:'O que o menino quer?',da:'Hvad vil drengen have?',ru:'Что хочет мальчик?',ar:'ماذا يريد الولد؟'},
       opts:[
        {e:'🖊️',text:{en:'a pen',nl:'een pen',de:'einen Stift',fr:'un stylo',es:'un boli',it:'una penna',pt:'uma caneta',da:'en kuglepen',ru:'ручку',ar:'قلم'}},
        {e:'📕',text:{en:'a book',nl:'een boek',de:'ein Buch',fr:'un livre',es:'un libro',it:'un libro',pt:'um livro',da:'en bog',ru:'книгу',ar:'كتاب'}},
        {e:'🎒',text:{en:'a bag',nl:'een tas',de:'eine Tasche',fr:'un sac',es:'una mochila',it:'uno zaino',pt:'uma mochila',da:'en taske',ru:'рюкзак',ar:'حقيبة'}},
        {e:'🧽',text:{en:'an eraser',nl:'een gum',de:'einen Radiergummi',fr:'une gomme',es:'una goma',it:'una gomma',pt:'uma borracha',da:'et viskelæder',ru:'ластик',ar:'ممحاة'}}]},
      {id:'school2',lines:[
        {who:'a',text:{en:'What\'s your favorite subject?',nl:'Wat is jouw lievelingsvak?',de:'Was ist dein Lieblingsfach?',fr:'C\'est quoi ta matière préférée ?',es:'¿Cuál es tu asignatura favorita?',it:'Qual è la tua materia preferita?',pt:'Qual é a sua matéria favorita?',da:'Hvad er dit yndlingsfag?',ru:'Какой твой любимый урок?',ar:'ما مادتك المفضلة؟'}},
        {who:'b',text:{en:'Gym!',nl:'Gym!',de:'Sport!',fr:'Le sport !',es:'¡Educación física!',it:'Ginnastica!',pt:'Educação física!',da:'Idræt!',ru:'Физкультура!',ar:'الرياضة!'}}],
       q:{en:'What does the girl like best?',nl:'Wat vindt het meisje het leukst?',de:'Was mag das Mädchen am liebsten?',fr:'Que préfère la fille ?',es:'¿Qué le gusta más a la niña?',it:'Cosa piace di più alla bambina?',pt:'Do que a menina mais gosta?',da:'Hvad kan pigen bedst lide?',ru:'Что девочка любит больше всего?',ar:'ماذا تحب البنت أكثر؟'},
       opts:[
        {e:'⚽',text:{en:'gym',nl:'gym',de:'Sport',fr:'le sport',es:'educación física',it:'ginnastica',pt:'educação física',da:'idræt',ru:'физкультура',ar:'الرياضة'}},
        {e:'➕',text:{en:'math',nl:'rekenen',de:'Mathe',fr:'les maths',es:'matemáticas',it:'matematica',pt:'matemática',da:'matematik',ru:'математика',ar:'الرياضيات'}},
        {e:'🎨',text:{en:'art',nl:'tekenen',de:'Kunst',fr:'le dessin',es:'plástica',it:'disegno',pt:'artes',da:'billedkunst',ru:'рисование',ar:'الرسم'}},
        {e:'🎵',text:{en:'music',nl:'muziek',de:'Musik',fr:'la musique',es:'música',it:'musica',pt:'música',da:'musik',ru:'музыка',ar:'الموسيقى'}}]},
      {id:'school3',lines:[
        {who:'a',text:{en:'What time does school start?',nl:'Hoe laat begint school?',de:'Wann fängt die Schule an?',fr:'L\'école commence à quelle heure ?',es:'¿A qué hora empieza el cole?',it:'A che ora inizia la scuola?',pt:'Que horas começa a aula?',da:'Hvornår starter skolen?',ru:'Во сколько начинаются уроки?',ar:'متى تبدأ المدرسة؟'}},
        {who:'b',text:{en:'At eight o\'clock.',nl:'Om acht uur.',de:'Um acht Uhr.',fr:'À huit heures.',es:'A las ocho.',it:'Alle otto.',pt:'Às oito horas.',da:'Klokken otte.',ru:'В восемь часов.',ar:'في الساعة الثامنة.'}}],
       q:{en:'What time does school start?',nl:'Hoe laat begint school?',de:'Wann beginnt die Schule?',fr:'À quelle heure commence l\'école ?',es:'¿A qué hora empieza el cole?',it:'A che ora inizia la scuola?',pt:'Que horas a aula começa?',da:'Hvornår starter skolen?',ru:'Во сколько начинаются уроки?',ar:'متى تبدأ المدرسة؟'},
       opts:[
        '8:00',
        '9:00',
        '7:00',
        '10:00']},
      {id:'school4',lines:[
        {who:'a',text:{en:'Where\'s the teacher?',nl:'Waar is de juf?',de:'Wo ist die Lehrerin?',fr:'Elle est où, la maîtresse ?',es:'¿Dónde está la profe?',it:'Dov\'è la maestra?',pt:'Cadê a professora?',da:'Hvor er læreren?',ru:'Где учительница?',ar:'أين المعلمة؟'}},
        {who:'b',text:{en:'She\'s in the library.',nl:'Ze is in de bibliotheek.',de:'Sie ist in der Bücherei.',fr:'Elle est à la bibliothèque.',es:'Está en la biblioteca.',it:'È in biblioteca.',pt:'Ela está na biblioteca.',da:'Hun er på biblioteket.',ru:'Она в библиотеке.',ar:'هي في المكتبة.'}},
        {who:'a',text:{en:'Then I\'ll go there.',nl:'Dan ga ik daar naartoe.',de:'Dann gehe ich dahin.',fr:'Alors j\'y vais.',es:'Pues voy para allá.',it:'Allora vado lì.',pt:'Então eu vou lá.',da:'Så går jeg derhen.',ru:'Тогда я пойду туда.',ar:'إذن سأذهب إلى هناك.'}}],
       q:{en:'Where is the teacher?',nl:'Waar is de juf?',de:'Wo ist die Lehrerin?',fr:'Où est la maîtresse ?',es:'¿Dónde está la profe?',it:'Dov\'è la maestra?',pt:'Onde está a professora?',da:'Hvor er læreren?',ru:'Где учительница?',ar:'أين المعلمة؟'},
       opts:[
        {e:'📚',text:{en:'in the library',nl:'in de bibliotheek',de:'in der Bücherei',fr:'à la bibliothèque',es:'en la biblioteca',it:'in biblioteca',pt:'na biblioteca',da:'på biblioteket',ru:'в библиотеке',ar:'في المكتبة'}},
        {e:'🤸',text:{en:'in the gym',nl:'in de gymzaal',de:'in der Turnhalle',fr:'au gymnase',es:'en el gimnasio',it:'in palestra',pt:'no ginásio',da:'i gymnastiksalen',ru:'в спортзале',ar:'في الصالة الرياضية'}},
        {e:'🏫',text:{en:'in the classroom',nl:'in de klas',de:'im Klassenzimmer',fr:'en classe',es:'en clase',it:'in classe',pt:'na sala de aula',da:'i klassen',ru:'в классе',ar:'في الفصل'}},
        {e:'🛝',text:{en:'in the playground',nl:'op het schoolplein',de:'auf dem Schulhof',fr:'dans la cour',es:'en el patio',it:'in cortile',pt:'no pátio',da:'i skolegården',ru:'во дворе',ar:'في الساحة'}}]}
    ]},
    {id:'food',convs:[
      {id:'food1',lines:[
        {who:'a',text:{en:'Would you like an apple?',nl:'Wil jij een appel?',de:'Möchtest du einen Apfel?',fr:'Tu veux une pomme ?',es:'¿Quieres una manzana?',it:'Vuoi una mela?',pt:'Você quer uma maçã?',da:'Vil du have et æble?',ru:'Хочешь яблоко?',ar:'هل تريدين تفاحة؟'}},
        {who:'b',text:{en:'Yes, please!',nl:'Ja, graag!',de:'Ja, gerne!',fr:'Oui, merci !',es:'¡Sí, gracias!',it:'Sì, grazie!',pt:'Quero, obrigada!',da:'Ja tak!',ru:'Да, спасибо!',ar:'نعم، شكرا!'}}],
       q:{en:'What does the girl get?',nl:'Wat krijgt het meisje?',de:'Was bekommt das Mädchen?',fr:'Qu\'est-ce que la fille reçoit ?',es:'¿Qué le dan a la niña?',it:'Cosa riceve la bambina?',pt:'O que a menina ganha?',da:'Hvad får pigen?',ru:'Что получает девочка?',ar:'ماذا تأخذ البنت؟'},
       opts:[
        {e:'🍎',text:{en:'an apple',nl:'een appel',de:'einen Apfel',fr:'une pomme',es:'una manzana',it:'una mela',pt:'uma maçã',da:'et æble',ru:'яблоко',ar:'تفاحة'}},
        {e:'🍌',text:{en:'a banana',nl:'een banaan',de:'eine Banane',fr:'une banane',es:'un plátano',it:'una banana',pt:'uma banana',da:'en banan',ru:'банан',ar:'موزة'}},
        {e:'🍐',text:{en:'a pear',nl:'een peer',de:'eine Birne',fr:'une poire',es:'una pera',it:'una pera',pt:'uma pera',da:'en pære',ru:'грушу',ar:'كمثرى'}},
        {e:'🍇',text:{en:'grapes',nl:'druiven',de:'Trauben',fr:'du raisin',es:'uvas',it:'l\'uva',pt:'uvas',da:'vindruer',ru:'виноград',ar:'عنب'}}]},
      {id:'food2',lines:[
        {who:'a',text:{en:'What would you like to drink?',nl:'Wat wil jij drinken?',de:'Was möchtest du trinken?',fr:'Tu veux boire quoi ?',es:'¿Qué quieres beber?',it:'Cosa vuoi bere?',pt:'O que você quer beber?',da:'Hvad vil du have at drikke?',ru:'Что ты будешь пить?',ar:'ماذا تريدين أن تشربي؟'}},
        {who:'b',text:{en:'Water, please.',nl:'Water, alsjeblieft.',de:'Wasser, bitte.',fr:'De l\'eau, s\'il te plaît.',es:'Agua, por favor.',it:'Acqua, per favore.',pt:'Água, por favor.',da:'Vand, tak.',ru:'Воду, пожалуйста.',ar:'ماء، من فضلك.'}}],
       q:{en:'What does the girl want to drink?',nl:'Wat wil het meisje drinken?',de:'Was möchte das Mädchen trinken?',fr:'Que veut boire la fille ?',es:'¿Qué quiere beber la niña?',it:'Cosa vuole bere la bambina?',pt:'O que a menina quer beber?',da:'Hvad vil pigen drikke?',ru:'Что хочет пить девочка?',ar:'ماذا تريد البنت أن تشرب؟'},
       opts:[
        {e:'💧',text:{en:'water',nl:'water',de:'Wasser',fr:'de l\'eau',es:'agua',it:'acqua',pt:'água',da:'vand',ru:'воду',ar:'ماء'}},
        {e:'🥛',text:{en:'milk',nl:'melk',de:'Milch',fr:'du lait',es:'leche',it:'latte',pt:'leite',da:'mælk',ru:'молоко',ar:'حليب'}},
        {e:'🧃',text:{en:'juice',nl:'sap',de:'Saft',fr:'du jus',es:'zumo',it:'succo',pt:'suco',da:'juice',ru:'сок',ar:'عصير'}},
        {e:'🍵',text:{en:'tea',nl:'thee',de:'Tee',fr:'du thé',es:'té',it:'tè',pt:'chá',da:'te',ru:'чай',ar:'شاي'}}]},
      {id:'food3',lines:[
        {who:'a',text:{en:'I\'m hungry.',nl:'Ik heb honger.',de:'Ich habe Hunger.',fr:'J\'ai faim.',es:'Tengo hambre.',it:'Ho fame.',pt:'Estou com fome.',da:'Jeg er sulten.',ru:'Я хочу есть.',ar:'أنا جائع.'}},
        {who:'b',text:{en:'Would you like a sandwich?',nl:'Wil je een boterham?',de:'Willst du ein Brot?',fr:'Tu veux un sandwich ?',es:'¿Quieres un bocadillo?',it:'Vuoi un panino?',pt:'Quer um sanduíche?',da:'Vil du have en sandwich?',ru:'Хочешь бутерброд?',ar:'هل تريد شطيرة؟'}},
        {who:'a',text:{en:'No, I want pizza!',nl:'Nee, ik wil pizza!',de:'Nein, ich will Pizza!',fr:'Non, je veux de la pizza !',es:'No, ¡quiero pizza!',it:'No, voglio la pizza!',pt:'Não, eu quero pizza!',da:'Nej, jeg vil have pizza!',ru:'Нет, я хочу пиццу!',ar:'لا، أريد بيتزا!'}}],
       q:{en:'What does the boy want to eat?',nl:'Wat wil de jongen eten?',de:'Was möchte der Junge essen?',fr:'Que veut manger le garçon ?',es:'¿Qué quiere comer el niño?',it:'Cosa vuole mangiare il bambino?',pt:'O que o menino quer comer?',da:'Hvad vil drengen spise?',ru:'Что хочет съесть мальчик?',ar:'ماذا يريد الولد أن يأكل؟'},
       opts:[
        {e:'🍕',text:{en:'pizza',nl:'pizza',de:'Pizza',fr:'de la pizza',es:'pizza',it:'la pizza',pt:'pizza',da:'pizza',ru:'пиццу',ar:'بيتزا'}},
        {e:'🥪',text:{en:'a sandwich',nl:'een boterham',de:'ein Brot',fr:'un sandwich',es:'un bocadillo',it:'un panino',pt:'um sanduíche',da:'en sandwich',ru:'бутерброд',ar:'شطيرة'}},
        {e:'🍲',text:{en:'soup',nl:'soep',de:'Suppe',fr:'de la soupe',es:'sopa',it:'la minestra',pt:'sopa',da:'suppe',ru:'суп',ar:'حساء'}},
        {e:'🍦',text:{en:'an ice cream',nl:'een ijsje',de:'ein Eis',fr:'une glace',es:'un helado',it:'un gelato',pt:'um sorvete',da:'en is',ru:'мороженое',ar:'آيس كريم'}}]},
      {id:'food4',lines:[
        {who:'a',text:{en:'Can I have an ice cream?',nl:'Mag ik een ijsje?',de:'Darf ich ein Eis?',fr:'Je peux avoir une glace ?',es:'¿Me das un helado?',it:'Posso avere un gelato?',pt:'Me dá um sorvete?',da:'Må jeg få en is?',ru:'Можно мне мороженое?',ar:'هل يمكنني أن آخذ آيس كريم؟'}},
        {who:'b',text:{en:'Which flavor?',nl:'Welke smaak?',de:'Welche Sorte?',fr:'Quel parfum ?',es:'¿De qué sabor?',it:'Che gusto?',pt:'De que sabor?',da:'Hvilken smag?',ru:'С каким вкусом?',ar:'أي نكهة؟'}},
        {who:'a',text:{en:'Chocolate, please.',nl:'Chocolade, graag.',de:'Schoko, bitte.',fr:'Au chocolat, s\'il te plaît.',es:'De chocolate, por favor.',it:'Al cioccolato, per favore.',pt:'De chocolate, por favor.',da:'Chokolade, tak.',ru:'Шоколадное, пожалуйста.',ar:'شوكولاتة، من فضلك.'}},
        {who:'b',text:{en:'Here you go!',nl:'Alsjeblieft!',de:'Bitte schön!',fr:'Tiens !',es:'¡Toma!',it:'Ecco!',pt:'Aqui está!',da:'Værsgo!',ru:'Держи!',ar:'تفضل!'}}],
       q:{en:'Which flavor does the boy choose?',nl:'Welke smaak kiest de jongen?',de:'Welche Sorte nimmt der Junge?',fr:'Quel parfum choisit le garçon ?',es:'¿Qué sabor elige el niño?',it:'Che gusto sceglie il bambino?',pt:'Qual sabor o menino escolhe?',da:'Hvilken smag vælger drengen?',ru:'Какое мороженое выбрал мальчик?',ar:'أي نكهة يختار الولد؟'},
       opts:[
        {e:'🍫',text:{en:'chocolate',nl:'chocolade',de:'Schoko',fr:'chocolat',es:'chocolate',it:'cioccolato',pt:'chocolate',da:'chokolade',ru:'шоколадное',ar:'شوكولاتة'}},
        {e:'🍓',text:{en:'strawberry',nl:'aardbei',de:'Erdbeere',fr:'fraise',es:'fresa',it:'fragola',pt:'morango',da:'jordbær',ru:'клубничное',ar:'فراولة'}},
        {e:'🍨',text:{en:'vanilla',nl:'vanille',de:'Vanille',fr:'vanille',es:'vainilla',it:'vaniglia',pt:'baunilha',da:'vanilje',ru:'ванильное',ar:'فانيليا'}},
        {e:'🍋',text:{en:'lemon',nl:'citroen',de:'Zitrone',fr:'citron',es:'limón',it:'limone',pt:'limão',da:'citron',ru:'лимонное',ar:'ليمون'}}]}
    ]},
    {id:'family',convs:[
      {id:'family1',lines:[
        {who:'a',text:{en:'Who\'s that?',nl:'Wie is dat?',de:'Wer ist das?',fr:'C\'est qui ?',es:'¿Quién es esa?',it:'Chi è quella?',pt:'Quem é essa?',da:'Hvem er det?',ru:'Кто это?',ar:'من هذه؟'}},
        {who:'b',text:{en:'That\'s my mom.',nl:'Dat is mijn moeder.',de:'Das ist meine Mama.',fr:'C\'est ma maman.',es:'Es mi mamá.',it:'È la mia mamma.',pt:'É a minha mãe.',da:'Det er min mor.',ru:'Это моя мама.',ar:'هذه أمي.'}}],
       q:{en:'Who is that?',nl:'Wie is dat?',de:'Wer ist das?',fr:'Qui est-ce ?',es:'¿Quién es?',it:'Chi è?',pt:'Quem é?',da:'Hvem er det?',ru:'Кто это?',ar:'من هذه؟'},
       opts:[
        {e:'👩',text:{en:'her mom',nl:'haar moeder',de:'ihre Mama',fr:'sa maman',es:'su mamá',it:'la sua mamma',pt:'a mãe dela',da:'hendes mor',ru:'её мама',ar:'أمها'}},
        {e:'👧',text:{en:'her sister',nl:'haar zus',de:'ihre Schwester',fr:'sa sœur',es:'su hermana',it:'sua sorella',pt:'a irmã dela',da:'hendes søster',ru:'её сестра',ar:'أختها'}},
        {e:'👵',text:{en:'her grandma',nl:'haar oma',de:'ihre Oma',fr:'sa mamie',es:'su abuela',it:'sua nonna',pt:'a avó dela',da:'hendes bedstemor',ru:'её бабушка',ar:'جدتها'}},
        {e:'👩‍🏫',text:{en:'her teacher',nl:'haar juf',de:'ihre Lehrerin',fr:'sa maîtresse',es:'su profe',it:'la sua maestra',pt:'a professora dela',da:'hendes lærer',ru:'её учительница',ar:'معلمتها'}}]},
      {id:'family2',lines:[
        {who:'a',text:{en:'Do you have a dog?',nl:'Heb jij een hond?',de:'Hast du einen Hund?',fr:'Tu as un chien ?',es:'¿Tienes perro?',it:'Hai un cane?',pt:'Você tem cachorro?',da:'Har du en hund?',ru:'У тебя есть собака?',ar:'هل عندك كلب؟'}},
        {who:'b',text:{en:'No, I have a cat.',nl:'Nee, ik heb een kat.',de:'Nein, ich habe eine Katze.',fr:'Non, j\'ai un chat.',es:'No, tengo un gato.',it:'No, ho un gatto.',pt:'Não, eu tenho um gato.',da:'Nej, jeg har en kat.',ru:'Нет, у меня кошка.',ar:'لا، عندي قطة.'}}],
       q:{en:'Which pet does the girl have?',nl:'Welk dier heeft het meisje?',de:'Welches Tier hat das Mädchen?',fr:'Quel animal a la fille ?',es:'¿Qué mascota tiene la niña?',it:'Che animale ha la bambina?',pt:'Que animal a menina tem?',da:'Hvilket dyr har pigen?',ru:'Какое животное у девочки?',ar:'ما الحيوان الذي عند البنت؟'},
       opts:[
        {e:'🐈',text:{en:'a cat',nl:'een kat',de:'eine Katze',fr:'un chat',es:'un gato',it:'un gatto',pt:'um gato',da:'en kat',ru:'кошка',ar:'قطة'}},
        {e:'🐶',text:{en:'a dog',nl:'een hond',de:'einen Hund',fr:'un chien',es:'un perro',it:'un cane',pt:'um cachorro',da:'en hund',ru:'собака',ar:'كلب'}},
        {e:'🐰',text:{en:'a rabbit',nl:'een konijn',de:'ein Kaninchen',fr:'un lapin',es:'un conejo',it:'un coniglio',pt:'um coelho',da:'en kanin',ru:'кролик',ar:'أرنب'}},
        {e:'🐟',text:{en:'a fish',nl:'een vis',de:'einen Fisch',fr:'un poisson',es:'un pez',it:'un pesce',pt:'um peixe',da:'en fisk',ru:'рыбка',ar:'سمكة'}}]},
      {id:'family3',lines:[
        {who:'a',text:{en:'Do you want to come and play?',nl:'Kom je spelen?',de:'Kommst du spielen?',fr:'Tu viens jouer ?',es:'¿Vienes a jugar?',it:'Vieni a giocare?',pt:'Vamos brincar?',da:'Vil du komme og lege?',ru:'Пойдёшь играть?',ar:'هل تأتين لنلعب؟'}},
        {who:'b',text:{en:'Yes! After dinner.',nl:'Ja! Na het eten.',de:'Ja! Nach dem Essen.',fr:'Oui ! Après le dîner.',es:'¡Sí! Después de cenar.',it:'Sì! Dopo cena.',pt:'Vamos! Depois do jantar.',da:'Ja! Efter aftensmaden.',ru:'Да! После ужина.',ar:'نعم! بعد العشاء.'}}],
       q:{en:'When will the girl come and play?',nl:'Wanneer komt het meisje spelen?',de:'Wann kommt das Mädchen spielen?',fr:'Quand la fille vient-elle jouer ?',es:'¿Cuándo va a jugar la niña?',it:'Quando viene a giocare la bambina?',pt:'Quando a menina vai brincar?',da:'Hvornår kommer pigen og leger?',ru:'Когда девочка пойдёт играть?',ar:'متى ستأتي البنت لتلعب؟'},
       opts:[
        {e:'🍽️',text:{en:'after dinner',nl:'na het eten',de:'nach dem Essen',fr:'après le dîner',es:'después de cenar',it:'dopo cena',pt:'depois do jantar',da:'efter aftensmaden',ru:'после ужина',ar:'بعد العشاء'}},
        {e:'⏱️',text:{en:'right now',nl:'nu meteen',de:'sofort',fr:'tout de suite',es:'ahora mismo',it:'subito',pt:'agora mesmo',da:'lige nu',ru:'прямо сейчас',ar:'الآن'}},
        {e:'📅',text:{en:'tomorrow',nl:'morgen',de:'morgen',fr:'demain',es:'mañana',it:'domani',pt:'amanhã',da:'i morgen',ru:'завтра',ar:'غدا'}},
        {e:'🚫',text:{en:'not at all',nl:'niet',de:'gar nicht',fr:'pas du tout',es:'nunca',it:'mai',pt:'nunca',da:'slet ikke',ru:'никогда',ar:'لن تأتي'}}]},
      {id:'family4',lines:[
        {who:'a',text:{en:'It\'s my grandma\'s birthday.',nl:'Mijn oma is jarig.',de:'Meine Oma hat Geburtstag.',fr:'C\'est l\'anniversaire de ma mamie.',es:'Mi abuela cumple años.',it:'È il compleanno di mia nonna.',pt:'Hoje é aniversário da minha avó.',da:'Min mormor har fødselsdag.',ru:'У моей бабушки день рождения.',ar:'اليوم عيد ميلاد جدتي.'}},
        {who:'b',text:{en:'How old will she be?',nl:'Hoe oud wordt ze?',de:'Wie alt wird sie?',fr:'Elle va avoir quel âge ?',es:'¿Cuántos cumple?',it:'Quanti anni compie?',pt:'Quantos anos ela vai fazer?',da:'Hvor gammel bliver hun?',ru:'Сколько ей исполнится?',ar:'كم سيصبح عمرها؟'}},
        {who:'a',text:{en:'Seventy!',nl:'Zeventig!',de:'Siebzig!',fr:'Soixante-dix !',es:'¡Setenta!',it:'Settanta!',pt:'Setenta!',da:'Halvfjerds!',ru:'Семьдесят!',ar:'سبعون!'}}],
       q:{en:'How old will grandma be?',nl:'Hoe oud wordt de oma?',de:'Wie alt wird die Oma?',fr:'Quel âge va avoir la mamie ?',es:'¿Cuántos años cumple la abuela?',it:'Quanti anni compie la nonna?',pt:'Quantos anos a avó vai fazer?',da:'Hvor gammel bliver hans mormor?',ru:'Сколько лет исполнится бабушке?',ar:'كم سيصبح عمر الجدة؟'},
       opts:[
        '70',
        '60',
        '80',
        '7']}
    ]},
    {id:'shop',convs:[
      {id:'shop1',lines:[
        {who:'a',text:{en:'How many apples do you want?',nl:'Hoeveel appels wil jij?',de:'Wie viele Äpfel möchtest du?',fr:'Tu veux combien de pommes ?',es:'¿Cuántas manzanas quieres?',it:'Quante mele vuoi?',pt:'Quantas maçãs você quer?',da:'Hvor mange æbler vil du have?',ru:'Сколько тебе яблок?',ar:'كم تفاحة تريدين؟'}},
        {who:'b',text:{en:'Three, please.',nl:'Drie, alsjeblieft.',de:'Drei, bitte.',fr:'Trois, s\'il vous plaît.',es:'Tres, por favor.',it:'Tre, per favore.',pt:'Três, por favor.',da:'Tre, tak.',ru:'Три, пожалуйста.',ar:'ثلاثا، من فضلك.'}}],
       q:{en:'How many apples does the girl want?',nl:'Hoeveel appels wil het meisje?',de:'Wie viele Äpfel möchte das Mädchen?',fr:'Combien de pommes veut la fille ?',es:'¿Cuántas manzanas quiere la niña?',it:'Quante mele vuole la bambina?',pt:'Quantas maçãs a menina quer?',da:'Hvor mange æbler vil pigen have?',ru:'Сколько яблок хочет девочка?',ar:'كم تفاحة تريد البنت؟'},
       opts:[
        '3',
        '2',
        '4',
        '5']},
      {id:'shop2',lines:[
        {who:'a',text:{en:'I\'d like some bread, please.',nl:'Ik wil graag brood.',de:'Ich hätte gern ein Brot.',fr:'Je voudrais du pain, s\'il vous plaît.',es:'Quería pan, por favor.',it:'Vorrei del pane, per favore.',pt:'Eu queria um pão, por favor.',da:'Jeg vil gerne have et brød.',ru:'Мне хлеб, пожалуйста.',ar:'أريد خبزا، من فضلك.'}},
        {who:'b',text:{en:'Here you go.',nl:'Alsjeblieft.',de:'Bitte schön.',fr:'Voilà.',es:'Aquí tienes.',it:'Ecco a te.',pt:'Aqui está.',da:'Værsgo.',ru:'Пожалуйста.',ar:'تفضل.'}}],
       q:{en:'What does the boy buy?',nl:'Wat koopt de jongen?',de:'Was kauft der Junge?',fr:'Qu\'achète le garçon ?',es:'¿Qué compra el niño?',it:'Cosa compra il bambino?',pt:'O que o menino compra?',da:'Hvad køber drengen?',ru:'Что покупает мальчик?',ar:'ماذا يشتري الولد؟'},
       opts:[
        {e:'🍞',text:{en:'bread',nl:'brood',de:'Brot',fr:'du pain',es:'pan',it:'il pane',pt:'pão',da:'brød',ru:'хлеб',ar:'خبز'}},
        {e:'🧀',text:{en:'cheese',nl:'kaas',de:'Käse',fr:'du fromage',es:'queso',it:'il formaggio',pt:'queijo',da:'ost',ru:'сыр',ar:'جبن'}},
        {e:'🥛',text:{en:'milk',nl:'melk',de:'Milch',fr:'du lait',es:'leche',it:'il latte',pt:'leite',da:'mælk',ru:'молоко',ar:'حليب'}},
        {e:'🥚',text:{en:'eggs',nl:'eieren',de:'Eier',fr:'des œufs',es:'huevos',it:'le uova',pt:'ovos',da:'æg',ru:'яйца',ar:'بيض'}}]},
      {id:'shop3',lines:[
        {who:'a',text:{en:'Which color do you want?',nl:'Welke kleur wil je?',de:'Welche Farbe möchtest du?',fr:'Tu veux quelle couleur ?',es:'¿Qué color quieres?',it:'Che colore vuoi?',pt:'Qual cor você quer?',da:'Hvilken farve vil du have?',ru:'Какой цвет ты хочешь?',ar:'أي لون تريدين؟'}},
        {who:'b',text:{en:'Red, please.',nl:'Rood, graag.',de:'Rot, bitte.',fr:'Rouge, s\'il vous plaît.',es:'Rojo, por favor.',it:'Rosso, per favore.',pt:'Vermelho, por favor.',da:'Rød, tak.',ru:'Красный, пожалуйста.',ar:'الأحمر، من فضلك.'}},
        {who:'a',text:{en:'Here\'s your red T-shirt.',nl:'Hier is je rode T-shirt.',de:'Hier ist dein rotes T-Shirt.',fr:'Voici ton T-shirt rouge.',es:'Aquí tienes tu camiseta roja.',it:'Ecco la tua maglietta rossa.',pt:'Aqui está sua camiseta vermelha.',da:'Her er din røde T-shirt.',ru:'Вот твоя красная футболка.',ar:'هذا قميصك الأحمر.'}}],
       q:{en:'What does the girl buy?',nl:'Wat koopt het meisje?',de:'Was kauft das Mädchen?',fr:'Qu\'achète la fille ?',es:'¿Qué compra la niña?',it:'Cosa compra la bambina?',pt:'O que a menina compra?',da:'Hvad køber pigen?',ru:'Что покупает девочка?',ar:'ماذا تشتري البنت؟'},
       opts:[
        {e:'👕',text:{en:'a red T-shirt',nl:'een rood T-shirt',de:'ein rotes T-Shirt',fr:'un T-shirt rouge',es:'una camiseta roja',it:'una maglietta rossa',pt:'uma camiseta vermelha',da:'en rød T-shirt',ru:'красную футболку',ar:'قميص أحمر'}},
        {e:'👕',text:{en:'a blue T-shirt',nl:'een blauw T-shirt',de:'ein blaues T-Shirt',fr:'un T-shirt bleu',es:'una camiseta azul',it:'una maglietta blu',pt:'uma camiseta azul',da:'en blå T-shirt',ru:'синюю футболку',ar:'قميص أزرق'}},
        {e:'🧢',text:{en:'a red cap',nl:'een rode pet',de:'eine rote Kappe',fr:'une casquette rouge',es:'una gorra roja',it:'un cappellino rosso',pt:'um boné vermelho',da:'en rød kasket',ru:'красную кепку',ar:'قبعة حمراء'}},
        {e:'👟',text:{en:'red shoes',nl:'rode schoenen',de:'rote Schuhe',fr:'des chaussures rouges',es:'zapatillas rojas',it:'scarpe rosse',pt:'tênis vermelho',da:'røde sko',ru:'красные кроссовки',ar:'حذاء أحمر'}}]},
      {id:'shop4',lines:[
        {who:'a',text:{en:'Good morning! What would you like?',nl:'Goedemorgen! Wat mag het zijn?',de:'Guten Morgen! Was darf\'s sein?',fr:'Bonjour ! Qu\'est-ce que tu veux ?',es:'¡Buenos días! ¿Qué quieres?',it:'Buongiorno! Cosa desideri?',pt:'Bom dia! O que você vai querer?',da:'Godmorgen! Hvad skulle det være?',ru:'Доброе утро! Что тебе дать?',ar:'صباح الخير! ماذا تريدين؟'}},
        {who:'b',text:{en:'Two rolls and some milk.',nl:'Twee broodjes en een melk.',de:'Zwei Brötchen und eine Milch.',fr:'Deux petits pains et du lait.',es:'Dos panecillos y una leche.',it:'Due panini e un latte.',pt:'Dois pães e um leite.',da:'To boller og en mælk.',ru:'Две булочки и молоко.',ar:'رغيفان وحليب.'}},
        {who:'a',text:{en:'Anything else?',nl:'Nog iets?',de:'Sonst noch was?',fr:'Autre chose ?',es:'¿Algo más?',it:'Altro?',pt:'Mais alguma coisa?',da:'Ellers andet?',ru:'Что-нибудь ещё?',ar:'شيء آخر؟'}},
        {who:'b',text:{en:'No, thank you.',nl:'Nee, dank u.',de:'Nein, danke.',fr:'Non, merci.',es:'No, gracias.',it:'No, grazie.',pt:'Não, obrigada.',da:'Nej tak.',ru:'Нет, спасибо.',ar:'لا، شكرا.'}}],
       q:{en:'What does the girl buy?',nl:'Wat koopt het meisje?',de:'Was kauft das Mädchen?',fr:'Qu\'achète la fille ?',es:'¿Qué compra la niña?',it:'Cosa compra la bambina?',pt:'O que a menina compra?',da:'Hvad køber pigen?',ru:'Что покупает девочка?',ar:'ماذا تشتري البنت؟'},
       opts:[
        {e:'🥖',text:{en:'2 rolls and milk',nl:'2 broodjes en melk',de:'2 Brötchen und Milch',fr:'2 petits pains et du lait',es:'2 panecillos y leche',it:'2 panini e latte',pt:'2 pães e leite',da:'2 boller og mælk',ru:'2 булочки и молоко',ar:'رغيفان وحليب'}},
        {e:'🥖',text:{en:'1 roll and milk',nl:'1 broodje en melk',de:'1 Brötchen und Milch',fr:'1 petit pain et du lait',es:'1 panecillo y leche',it:'1 panino e latte',pt:'1 pão e leite',da:'1 bolle og mælk',ru:'1 булочка и молоко',ar:'رغيف واحد وحليب'}},
        {e:'🧃',text:{en:'2 rolls and juice',nl:'2 broodjes en sap',de:'2 Brötchen und Saft',fr:'2 petits pains et du jus',es:'2 panecillos y zumo',it:'2 panini e succo',pt:'2 pães e suco',da:'2 boller og juice',ru:'2 булочки и сок',ar:'رغيفان وعصير'}},
        {e:'🧀',text:{en:'milk and cheese',nl:'melk en kaas',de:'Milch und Käse',fr:'du lait et du fromage',es:'leche y queso',it:'latte e formaggio',pt:'leite e queijo',da:'mælk og ost',ru:'молоко и сыр',ar:'حليب وجبن'}}]}
    ]},
    {id:'travel',convs:[
      {id:'travel1',lines:[
        {who:'a',text:{en:'Where\'s the beach?',nl:'Waar is het strand?',de:'Wo ist der Strand?',fr:'Elle est où, la plage ?',es:'¿Dónde está la playa?',it:'Dov\'è la spiaggia?',pt:'Cadê a praia?',da:'Hvor er stranden?',ru:'Где пляж?',ar:'أين الشاطئ؟'}},
        {who:'b',text:{en:'Over there!',nl:'Daar!',de:'Da drüben!',fr:'Là-bas !',es:'¡Allí!',it:'Laggiù!',pt:'Ali!',da:'Derovre!',ru:'Вон там!',ar:'هناك!'}}],
       q:{en:'What is the boy looking for?',nl:'Wat zoekt de jongen?',de:'Was sucht der Junge?',fr:'Que cherche le garçon ?',es:'¿Qué busca el niño?',it:'Cosa cerca il bambino?',pt:'O que o menino está procurando?',da:'Hvad leder drengen efter?',ru:'Что ищет мальчик?',ar:'عن ماذا يبحث الولد؟'},
       opts:[
        {e:'🏖️',text:{en:'the beach',nl:'het strand',de:'den Strand',fr:'la plage',es:'la playa',it:'la spiaggia',pt:'a praia',da:'stranden',ru:'пляж',ar:'الشاطئ'}},
        {e:'🚉',text:{en:'the station',nl:'het station',de:'den Bahnhof',fr:'la gare',es:'la estación',it:'la stazione',pt:'a estação',da:'stationen',ru:'вокзал',ar:'المحطة'}},
        {e:'🏪',text:{en:'the store',nl:'de winkel',de:'den Laden',fr:'le magasin',es:'la tienda',it:'il negozio',pt:'a loja',da:'butikken',ru:'магазин',ar:'المتجر'}},
        {e:'🌳',text:{en:'the park',nl:'het park',de:'den Park',fr:'le parc',es:'el parque',it:'il parco',pt:'o parque',da:'parken',ru:'парк',ar:'الحديقة'}}]},
      {id:'travel2',lines:[
        {who:'a',text:{en:'Are we going by train?',nl:'Gaan we met de trein?',de:'Fahren wir mit dem Zug?',fr:'On y va en train ?',es:'¿Vamos en tren?',it:'Andiamo in treno?',pt:'A gente vai de trem?',da:'Skal vi tage toget?',ru:'Мы поедем на поезде?',ar:'هل سنذهب بالقطار؟'}},
        {who:'b',text:{en:'No, by car.',nl:'Nee, met de auto.',de:'Nein, mit dem Auto.',fr:'Non, en voiture.',es:'No, en coche.',it:'No, in macchina.',pt:'Não, de carro.',da:'Nej, i bil.',ru:'Нет, на машине.',ar:'لا، بالسيارة.'}}],
       q:{en:'How are they going?',nl:'Hoe gaan ze?',de:'Womit fahren sie?',fr:'Comment y vont-ils ?',es:'¿Cómo van?',it:'Come ci vanno?',pt:'Como eles vão?',da:'Hvordan skal de rejse?',ru:'На чём они поедут?',ar:'كيف سيذهبون؟'},
       opts:[
        {e:'🚗',text:{en:'by car',nl:'met de auto',de:'mit dem Auto',fr:'en voiture',es:'en coche',it:'in macchina',pt:'de carro',da:'i bil',ru:'на машине',ar:'بالسيارة'}},
        {e:'🚆',text:{en:'by train',nl:'met de trein',de:'mit dem Zug',fr:'en train',es:'en tren',it:'in treno',pt:'de trem',da:'med tog',ru:'на поезде',ar:'بالقطار'}},
        {e:'🚌',text:{en:'by bus',nl:'met de bus',de:'mit dem Bus',fr:'en bus',es:'en autobús',it:'in autobus',pt:'de ônibus',da:'med bus',ru:'на автобусе',ar:'بالحافلة'}},
        {e:'✈️',text:{en:'by plane',nl:'met het vliegtuig',de:'mit dem Flugzeug',fr:'en avion',es:'en avión',it:'in aereo',pt:'de avião',da:'med fly',ru:'на самолёте',ar:'بالطائرة'}}]},
      {id:'travel3',lines:[
        {who:'a',text:{en:'Where are we going?',nl:'Waar gaan we heen?',de:'Wo fahren wir hin?',fr:'On va où ?',es:'¿Adónde vamos?',it:'Dove andiamo?',pt:'Aonde a gente vai?',da:'Hvor skal vi hen?',ru:'Куда мы едем?',ar:'إلى أين نذهب؟'}},
        {who:'b',text:{en:'To the zoo!',nl:'Naar de dierentuin!',de:'In den Zoo!',fr:'Au zoo !',es:'¡Al zoo!',it:'Allo zoo!',pt:'Ao zoológico!',da:'I zoologisk have!',ru:'В зоопарк!',ar:'إلى حديقة الحيوانات!'}},
        {who:'a',text:{en:'Yay!',nl:'Joepie!',de:'Juhu!',fr:'Youpi !',es:'¡Bien!',it:'Evviva!',pt:'Oba!',da:'Juhu!',ru:'Ура!',ar:'يا سلام!'}}],
       q:{en:'Where are they going?',nl:'Waar gaan ze heen?',de:'Wohin fahren sie?',fr:'Où vont-ils ?',es:'¿Adónde van?',it:'Dove vanno?',pt:'Aonde eles vão?',da:'Hvor skal de hen?',ru:'Куда они едут?',ar:'إلى أين يذهبون؟'},
       opts:[
        {e:'🦁',text:{en:'to the zoo',nl:'naar de dierentuin',de:'in den Zoo',fr:'au zoo',es:'al zoo',it:'allo zoo',pt:'ao zoológico',da:'i zoologisk have',ru:'в зоопарк',ar:'إلى حديقة الحيوانات'}},
        {e:'🌊',text:{en:'to the sea',nl:'naar zee',de:'ans Meer',fr:'à la mer',es:'a la playa',it:'al mare',pt:'à praia',da:'til havet',ru:'на море',ar:'إلى البحر'}},
        {e:'🏫',text:{en:'to school',nl:'naar school',de:'in die Schule',fr:'à l\'école',es:'al cole',it:'a scuola',pt:'à escola',da:'i skole',ru:'в школу',ar:'إلى المدرسة'}},
        {e:'👵',text:{en:'to grandma\'s',nl:'naar oma',de:'zu Oma',fr:'chez mamie',es:'a casa de la abuela',it:'dalla nonna',pt:'à casa da vovó',da:'hen til bedstemor',ru:'к бабушке',ar:'إلى بيت الجدة'}}]},
      {id:'travel4',lines:[
        {who:'a',text:{en:'What time does the bus leave?',nl:'Hoe laat vertrekt de bus?',de:'Wann fährt der Bus?',fr:'Le bus part à quelle heure ?',es:'¿A qué hora sale el autobús?',it:'A che ora parte l\'autobus?',pt:'Que horas o ônibus sai?',da:'Hvornår kører bussen?',ru:'Во сколько уходит автобус?',ar:'متى تنطلق الحافلة؟'}},
        {who:'b',text:{en:'At ten o\'clock.',nl:'Om tien uur.',de:'Um zehn Uhr.',fr:'À dix heures.',es:'A las diez.',it:'Alle dieci.',pt:'Às dez horas.',da:'Klokken ti.',ru:'В десять часов.',ar:'في الساعة العاشرة.'}},
        {who:'a',text:{en:'Then we have time for ice cream.',nl:'Dan hebben we nog tijd voor een ijsje.',de:'Dann haben wir noch Zeit für ein Eis.',fr:'Alors on a le temps de manger une glace.',es:'Pues nos da tiempo a tomar un helado.',it:'Allora c\'è tempo per un gelato.',pt:'Então dá tempo de tomar sorvete.',da:'Så har vi tid til en is.',ru:'Тогда успеем съесть мороженое.',ar:'إذن عندنا وقت لنأكل آيس كريم.'}}],
       q:{en:'What will they do first?',nl:'Wat doen ze eerst?',de:'Was machen sie zuerst?',fr:'Que font-ils d\'abord ?',es:'¿Qué hacen primero?',it:'Cosa fanno prima?',pt:'O que eles vão fazer primeiro?',da:'Hvad gør de først?',ru:'Что они сделают сначала?',ar:'ماذا سيفعلون أولا؟'},
       opts:[
        {e:'🍦',text:{en:'eat ice cream',nl:'een ijsje eten',de:'ein Eis essen',fr:'manger une glace',es:'tomar un helado',it:'mangiare un gelato',pt:'tomar sorvete',da:'spise en is',ru:'съесть мороженое',ar:'أكل آيس كريم'}},
        {e:'😴',text:{en:'sleep',nl:'slapen',de:'schlafen',fr:'dormir',es:'dormir',it:'dormire',pt:'dormir',da:'sove',ru:'поспать',ar:'النوم'}},
        {e:'🏊',text:{en:'go swimming',nl:'zwemmen',de:'schwimmen',fr:'nager',es:'nadar',it:'nuotare',pt:'nadar',da:'svømme',ru:'поплавать',ar:'السباحة'}},
        {e:'🏠',text:{en:'go home',nl:'naar huis gaan',de:'nach Hause gehen',fr:'rentrer à la maison',es:'ir a casa',it:'andare a casa',pt:'ir para casa',da:'gå hjem',ru:'пойти домой',ar:'العودة إلى البيت'}}]}
    ]}
  ];
})();
