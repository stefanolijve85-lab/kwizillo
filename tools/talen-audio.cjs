#!/usr/bin/env node
// Records the sound of Talen into assets/talen/audio/ (it ships with the app).
//
//   node tools/talen-audio.cjs            records what is missing, then checks what it recorded with Scribe (--hear-all: every clip)
//   node tools/talen-audio.cjs --check    only checks that every clip exists (for npm test)
//   node tools/talen-audio.cjs --redo shark,haai   records those again (or one language: --redo de/shark)
//   node tools/talen-audio.cjs --trim     only cuts the silence (and sets the loudness) again, from the takes in .talen-raw/
//   node tools/talen-audio.cjs --redo all  records every clip again
//
// The model and the settings are the app's own (speech-config.js). One recording
// per word: cutting a list of words out of one take left clipped edges in the
// prototype. Everything in Talen is said by the guide the child chose, in ONE voice
// per guide: "Goed zo! shark betekent haai" in two voices sounded like two people,
// in one voice it is one sentence (Stefan's choice, 2026-10-07, from three samples).
// Until 2026-10-09 that one voice was always Milo's, also for a child who chose
// Luna, who then only heard her in the closing line; Stefan: "uiteraard wil je
// alleen Luna horen als je Luna kiest". So every clip now exists twice: <lang>/<file>
// for Milo and <lang>/luna/<file> for Luna. In Dutch and English a guide speaks
// with their Dutch voice (TALEN_VOICE); the other eight languages keep the guide's
// own voice per language: the Dutch voice spoke them badly ("Godt klaret!" was
// heard as "Hot klar det", "vuol dire" as "fuori dire"), and in a language lesson
// the pronunciation comes first.
// The ElevenLabs key is read from .env at run time and never printed.
const fs = require('fs'); const path = require('path'); const vm = require('vm');
const { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'assets', 'talen', 'audio');
try { for (const line of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split(/\r?\n/)) { const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)$/); if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, ''); } } catch {}
const { speechConfig } = require('../speech-config.js');
const SPEECH = speechConfig(process.env);

const ctx = { window: {} }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'talen-data.js'), 'utf8'), ctx);
const T = ctx.window.KWIZILLO_M1.TALEN;

// What Milo says around the words, in the child's own language. Praise and
// "almost" come in several wordings (_goed1.._goed16, _bijna1.._bijna6; six and two more in
// words children use since 2026-10-10): the same
// "Goed zo!" after every word got dull (2026-10-07). The closing line does not
// name the language being learned: with ten languages that would be a recording
// per pair.
const PRAISE = {
  nl: {
    goed: ["Goed zo!","Super!","Yes!","Top!","Perfect!","Heel goed!","Lekker bezig!","Ga zo door!","Knap!","Wauw!","Vet goed!","Gaaf!","Te gek!","Toppie!","Kanon!","Nice!"],
    bijna: ["Bijna! Luister nog een keer.","Net niet! Luister nog eens.","Oeps! Probeer het nog eens.","Hmm, luister nog even goed.","Ai, net niet! Luister nog eens.","Bijna raak! Nog een keer."] },
  en: {
    goed: ["Well done!","Super!","Yes!","Great!","Perfect!","Very good!","Nice one!","Keep going!","Clever!","Wow!","Boom!","Sweet!","Epic!","You rock!","Nailed it!","So cool!"],
    bijna: ["Almost! Listen again.","Not quite! Listen once more.","Oops! Try again.","Hmm, listen carefully again.","So close! Listen again.","Nearly! One more try."] },
  de: {
    goed: ["Gut gemacht!","Super!","Ja!","Toll!","Perfekt!","Sehr gut!","Klasse!","Weiter so!","Schlau!","Wow!","Mega!","Krass!","Stark!","Hammer!","Cool!","Spitze!"],
    bijna: ["Fast! Hör noch mal zu.","Nicht ganz! Hör noch einmal hin.","Hoppla! Versuch es noch mal.","Hmm, hör noch mal genau hin.","Knapp daneben! Hör noch mal.","Fast! Noch ein Versuch."] },
  fr: {
    goed: ["Bravo !","Super !","Oui !","Génial !","Parfait !","Très bien !","Bien joué !","Continue !","Malin !","Waouh !","Trop fort !","Énorme !","Trop bien !","Chapeau !","La classe !","Bien vu !"],
    bijna: ["Presque ! Écoute encore une fois.","Pas tout à fait ! Écoute encore.","Oups ! Essaie encore.","Hmm, écoute bien encore une fois.","Tout près ! Écoute encore.","Presque ! Encore un essai."] },
  es: {
    goed: ["¡Muy bien!","¡Genial!","¡Sí!","¡Estupendo!","¡Perfecto!","¡Fenomenal!","¡Bien hecho!","¡Sigue así!","¡Qué listo!","¡Guau!","¡Qué crack!","¡Guay!","¡Toma ya!","¡Olé!","¡Brutal!","¡De lujo!"],
    bijna: ["¡Casi! Escucha otra vez.","¡No del todo! Escucha una vez más.","¡Uy! Inténtalo otra vez.","Mmm, escucha bien otra vez.","¡Por poco! Escucha otra vez.","¡Casi! Otro intento."] },
  it: {
    goed: ["Bravo!","Super!","Sì!","Grande!","Perfetto!","Molto bene!","Ben fatto!","Continua così!","Che bravo!","Wow!","Mitico!","Fortissimo!","Spettacolo!","Bomba!","Che forza!","Pazzesco!"],
    bijna: ["Quasi! Ascolta ancora.","Non proprio! Ascolta di nuovo.","Ops! Riprova.","Mmm, ascolta bene ancora una volta.","Per un pelo! Ascolta ancora.","Quasi! Un altro tentativo."] },
  pt: {
    goed: ["Muito bem!","Boa!","Sim!","Fantástico!","Perfeito!","Excelente!","Mandou bem!","Continue assim!","Que esperto!","Uau!","Arrasou!","Show!","Massa!","Irado!","Demais!","Top!"],
    bijna: ["Quase! Escute de novo.","Ainda não! Escute mais uma vez.","Ops! Tente de novo.","Hmm, escute bem de novo.","Por pouco! Escute de novo.","Quase! Mais uma vez."] },
  da: {
    goed: ["Godt klaret!","Super!","Ja!","Fedt!","Perfekt!","Rigtig godt!","Flot!","Bliv ved!","Sådan!","Wow!","Sejt!","Vildt!","Mega!","Sådan der!","Nice!","Pletskud!"],
    bijna: ["Næsten! Lyt igen.","Ikke helt! Lyt en gang til.","Ups! Prøv igen.","Hmm, lyt godt efter igen.","Tæt på! Lyt igen.","Næsten! Prøv en gang til."] },
  ru: {
    goed: ["Молодец!","Супер!","Да!","Здорово!","Идеально!","Очень хорошо!","Отлично!","Так держать!","Умница!","Ух ты!","Круто!","Класс!","Огонь!","Блестяще!","Шикарно!","Вот это да!"],
    bijna: ["Почти! Послушай ещё раз.","Не совсем! Послушай снова.","Ой! Попробуй ещё раз.","Хм, послушай внимательно ещё раз.","Чуть-чуть! Послушай ещё.","Почти! Ещё попытка."] },
  ar: {
    goed: ["أحسنت!","رائع!","نعم!","ممتاز!","مثالي!","جيد جدًا!","عمل جميل!","استمر!","يا لك من ذكي!","واو!","رهيب!","يا سلام!","برافو!","كفو!","هايل!","مذهل!"],
    bijna: ["اقتربت! استمع مرة أخرى.","ليس تمامًا! استمع مرة أخرى.","أوه! حاول مرة أخرى.","همم، استمع جيدًا مرة أخرى.","قريب جدًا! استمع مرة أخرى.","تقريبًا! حاول مرة أخرى."] }
};
const LINES = {
  nl: { intro: 'Luister goed, en tik op het juiste plaatje!', betekent: 'betekent', klaar_dieren: 'Wauw, je kent nu alle dieren!', klaar_kleuren: 'Wauw, je kent nu alle kleuren!', klaar_getallen: 'Super, je kunt nu tellen tot tien!', klaar_eten: 'Smakelijk! Je kent nu al het eten en drinken!', klaar_lichaam: 'Wauw, je kent nu je hele lichaam!', klaar_vervoer: 'Toet toet! Je kent nu alle voertuigen!', klaar_sport: "Goed gespeeld! Je kent nu alle sporten!", klaar_praten: "Super, nu kun je met iedereen praten!",
    ...Object.fromEntries(PRAISE.nl.goed.map((x, i) => [`goed${i + 1}`, x])), ...Object.fromEntries(PRAISE.nl.bijna.map((x, i) => [`bijna${i + 1}`, x])) },
  en: { intro: 'Listen carefully, and tap the right picture!', betekent: 'means', klaar_dieren: 'Wow, you know all the animals now!', klaar_kleuren: 'Wow, you know all the colors now!', klaar_getallen: 'Super, you can count to ten now!', klaar_eten: 'Yummy! You know all the food and drinks now!', klaar_lichaam: 'Wow, you know your whole body now!', klaar_vervoer: 'Beep beep! You know all the vehicles now!', klaar_sport: "Great game! You know all the sports now!", klaar_praten: "Super, now you can talk to everyone!",
    ...Object.fromEntries(PRAISE.en.goed.map((x, i) => [`goed${i + 1}`, x])), ...Object.fromEntries(PRAISE.en.bijna.map((x, i) => [`bijna${i + 1}`, x])) },
  de: { intro: 'Hör gut zu und tippe auf das richtige Bild!', betekent: 'heißt', klaar_dieren: 'Wow, jetzt kennst du alle Tiere!', klaar_kleuren: 'Wow, jetzt kennst du alle Farben!', klaar_getallen: 'Super, jetzt kannst du bis zehn zählen!', klaar_eten: 'Lecker! Jetzt kennst du alles zum Essen und Trinken!', klaar_lichaam: 'Wow, jetzt kennst du deinen ganzen Körper!', klaar_vervoer: 'Tut tut! Jetzt kennst du alle Fahrzeuge!', klaar_sport: "Gut gespielt! Jetzt kennst du alle Sportarten!", klaar_praten: "Super, jetzt kannst du mit allen sprechen!",
    ...Object.fromEntries(PRAISE.de.goed.map((x, i) => [`goed${i + 1}`, x])), ...Object.fromEntries(PRAISE.de.bijna.map((x, i) => [`bijna${i + 1}`, x])) },
  fr: { intro: 'Écoute bien, et touche la bonne image !', betekent: 'veut dire', klaar_dieren: 'Waouh, tu connais maintenant tous les animaux !', klaar_kleuren: 'Waouh, tu connais maintenant toutes les couleurs !', klaar_getallen: 'Super, tu sais compter jusqu’à dix !', klaar_eten: 'Miam ! Tu connais maintenant tout ce qu’on mange et ce qu’on boit !', klaar_lichaam: 'Waouh, tu connais maintenant tout ton corps !', klaar_vervoer: 'Tut tut ! Tu connais maintenant tous les véhicules !', klaar_sport: "Bien joué ! Tu connais maintenant tous les sports !", klaar_praten: "Super, maintenant tu peux parler avec tout le monde !",
    ...Object.fromEntries(PRAISE.fr.goed.map((x, i) => [`goed${i + 1}`, x])), ...Object.fromEntries(PRAISE.fr.bijna.map((x, i) => [`bijna${i + 1}`, x])) },
  es: { intro: '¡Escucha bien y toca la imagen correcta!', betekent: 'significa', klaar_dieren: '¡Guau, ya conoces todos los animales!', klaar_kleuren: '¡Guau, ya conoces todos los colores!', klaar_getallen: '¡Genial, ya sabes contar hasta diez!', klaar_eten: '¡Qué rico! ¡Ya conoces toda la comida y la bebida!', klaar_lichaam: '¡Guau, ya conoces todo tu cuerpo!', klaar_vervoer: '¡Pi pi! ¡Ya conoces todos los vehículos!', klaar_sport: "¡Bien jugado! ¡Ya conoces todos los deportes!", klaar_praten: "¡Genial, ya puedes hablar con todo el mundo!",
    ...Object.fromEntries(PRAISE.es.goed.map((x, i) => [`goed${i + 1}`, x])), ...Object.fromEntries(PRAISE.es.bijna.map((x, i) => [`bijna${i + 1}`, x])) },
  it: { intro: "Ascolta bene e tocca l'immagine giusta!", betekent: 'vuol dire', klaar_dieren: 'Wow, ora conosci tutti gli animali!', klaar_kleuren: 'Wow, ora conosci tutti i colori!', klaar_getallen: 'Super, ora sai contare fino a dieci!', klaar_eten: 'Gnam! Ora conosci tutto il cibo e le bevande!', klaar_lichaam: 'Wow, ora conosci tutto il tuo corpo!', klaar_vervoer: 'Bip bip! Ora conosci tutti i veicoli!', klaar_sport: "Ben giocato! Ora conosci tutti gli sport!", klaar_praten: "Super, ora puoi parlare con tutti!",
    ...Object.fromEntries(PRAISE.it.goed.map((x, i) => [`goed${i + 1}`, x])), ...Object.fromEntries(PRAISE.it.bijna.map((x, i) => [`bijna${i + 1}`, x])) },
  pt: { intro: 'Escute bem e toque na imagem certa!', betekent: 'significa', klaar_dieren: 'Uau, agora você conhece todos os animais!', klaar_kleuren: 'Uau, agora você conhece todas as cores!', klaar_getallen: 'Demais, agora você sabe contar até dez!', klaar_eten: 'Que delícia! Agora você conhece todas as comidas e bebidas!', klaar_lichaam: 'Uau, agora você conhece o seu corpo todo!', klaar_vervoer: 'Bi bi! Agora você conhece todos os veículos!', klaar_sport: "Mandou bem! Agora você conhece todos os esportes!", klaar_praten: "Demais, agora você pode conversar com todo mundo!",
    ...Object.fromEntries(PRAISE.pt.goed.map((x, i) => [`goed${i + 1}`, x])), ...Object.fromEntries(PRAISE.pt.bijna.map((x, i) => [`bijna${i + 1}`, x])) },
  da: { intro: 'Lyt godt efter, og tryk på det rigtige billede!', betekent: 'betyder', klaar_dieren: 'Wow, nu kender du alle dyrene!', klaar_kleuren: 'Wow, nu kender du alle farverne!', klaar_getallen: 'Super, nu kan du tælle til ti!', klaar_eten: 'Mums! Nu kender du al maden og drikken!', klaar_lichaam: 'Wow, nu kender du hele din krop!', klaar_vervoer: 'Dyt dyt! Nu kender du alle køretøjerne!', klaar_sport: "Godt spillet! Nu kender du alle sportsgrenene!", klaar_praten: "Super, nu kan du snakke med alle!",
    ...Object.fromEntries(PRAISE.da.goed.map((x, i) => [`goed${i + 1}`, x])), ...Object.fromEntries(PRAISE.da.bijna.map((x, i) => [`bijna${i + 1}`, x])) },
  ru: { intro: 'Слушай внимательно и нажми на правильную картинку!', betekent: 'значит', klaar_dieren: 'Ух ты, теперь ты знаешь всех животных!', klaar_kleuren: 'Ух ты, теперь ты знаешь все цвета!', klaar_getallen: 'Супер, теперь ты умеешь считать до десяти!', klaar_eten: 'Вкусно! Теперь ты знаешь всю еду и напитки!', klaar_lichaam: 'Ух ты, теперь ты знаешь всё своё тело!', klaar_vervoer: 'Би-би! Теперь ты знаешь весь транспорт!', klaar_sport: "Отличная игра! Теперь ты знаешь все виды спорта!", klaar_praten: "Супер, теперь ты можешь разговаривать со всеми!",
    ...Object.fromEntries(PRAISE.ru.goed.map((x, i) => [`goed${i + 1}`, x])), ...Object.fromEntries(PRAISE.ru.bijna.map((x, i) => [`bijna${i + 1}`, x])) },
  ar: { intro: 'استمع جيدًا، واضغط على الصورة الصحيحة!', betekent: 'تعني', klaar_dieren: 'واو، أنت الآن تعرف كل الحيوانات!', klaar_kleuren: 'واو، أنت الآن تعرف كل الألوان!', klaar_getallen: 'رائع، أنت الآن تعرف العد حتى عشرة!', klaar_eten: 'لذيذ! أنت الآن تعرف كل الطعام والشراب!', klaar_lichaam: 'واو، أنت الآن تعرف جسمك كله!', klaar_vervoer: 'بيب بيب! أنت الآن تعرف كل وسائل النقل!', klaar_sport: "أحسنت اللعب! أنت الآن تعرف كل الرياضات!", klaar_praten: "رائع، الآن يمكنك التحدث مع الجميع!",
    ...Object.fromEntries(PRAISE.ar.goed.map((x, i) => [`goed${i + 1}`, x])), ...Object.fromEntries(PRAISE.ar.bijna.map((x, i) => [`bijna${i + 1}`, x])) },
};

// The lines for the next themes (talen-data.js next, 2026-10-10): the closing line per
// theme and the opening line of the sentence game (hear a sentence, tap its meaning).
const NEXT_LINES = {
  nl: { intro_zin: 'Luister goed, en tik op wat het betekent!', klaar_huis: 'Wauw, je kent nu alle spullen in huis!', klaar_natuur: 'Wauw, je kent nu de hele natuur!', klaar_familie: 'Super, je kent nu de hele familie!', klaar_kleding: 'Wauw, je kent nu alle kleren!', klaar_school: 'Top, je kent nu alle schoolspullen!', klaar_mij: 'Super, nu kun je over jezelf vertellen!', klaar_vragen: 'Knap, nu kun je vragen stellen!', klaar_gevoel: 'Wauw, nu kun je zeggen hoe je je voelt!', klaar_samen: 'Goed gespeeld! Nu kun je samen spelen!', klaar_vakantie: 'Hoera, je bent klaar voor de vakantie!' },
  en: { intro_zin: 'Listen carefully, and tap what it means!', klaar_huis: 'Wow, you know everything in the house now!', klaar_natuur: 'Wow, you know all about nature now!', klaar_familie: 'Super, you know the whole family now!', klaar_kleding: 'Wow, you know all the clothes now!', klaar_school: 'Great, you know all the school things now!', klaar_mij: 'Super, now you can talk about yourself!', klaar_vragen: 'Clever, now you can ask questions!', klaar_gevoel: 'Wow, now you can say how you feel!', klaar_samen: 'Well played! Now you can play together!', klaar_vakantie: 'Hooray, you are ready for the holidays!' },
  de: { intro_zin: 'Hör gut zu und tippe auf das, was es heißt!', klaar_huis: 'Wow, jetzt kennst du alle Sachen im Haus!', klaar_natuur: 'Wow, jetzt kennst du die ganze Natur!', klaar_familie: 'Super, jetzt kennst du die ganze Familie!', klaar_kleding: 'Wow, jetzt kennst du alle Kleidungsstücke!', klaar_school: 'Toll, jetzt kennst du alle Schulsachen!', klaar_mij: 'Super, jetzt kannst du von dir erzählen!', klaar_vragen: 'Klasse, jetzt kannst du Fragen stellen!', klaar_gevoel: 'Wow, jetzt kannst du sagen, wie du dich fühlst!', klaar_samen: 'Gut gespielt! Jetzt könnt ihr zusammen spielen!', klaar_vakantie: 'Hurra, jetzt bist du bereit für den Urlaub!' },
  fr: { intro_zin: 'Écoute bien, et touche ce que ça veut dire !', klaar_huis: 'Waouh, tu connais maintenant tout ce qu’il y a dans la maison !', klaar_natuur: 'Waouh, tu connais maintenant toute la nature !', klaar_familie: 'Super, tu connais maintenant toute la famille !', klaar_kleding: 'Waouh, tu connais maintenant tous les vêtements !', klaar_school: 'Génial, tu connais maintenant toutes les affaires d’école !', klaar_mij: 'Super, maintenant tu peux parler de toi !', klaar_vragen: 'Bravo, maintenant tu sais poser des questions !', klaar_gevoel: 'Waouh, maintenant tu sais dire ce que tu ressens !', klaar_samen: 'Bien joué ! Maintenant vous pouvez jouer ensemble !', klaar_vakantie: 'Youpi, tu es prêt pour les vacances !' },
  es: { intro_zin: '¡Escucha bien y toca lo que significa!', klaar_huis: '¡Guau, ya conoces todas las cosas de la casa!', klaar_natuur: '¡Guau, ya conoces toda la naturaleza!', klaar_familie: '¡Genial, ya conoces a toda la familia!', klaar_kleding: '¡Guau, ya conoces toda la ropa!', klaar_school: '¡Estupendo, ya conoces todas las cosas del colegio!', klaar_mij: '¡Genial, ya puedes hablar de ti!', klaar_vragen: '¡Muy bien, ya sabes hacer preguntas!', klaar_gevoel: '¡Guau, ya sabes decir cómo te sientes!', klaar_samen: '¡Bien jugado! ¡Ya podéis jugar juntos!', klaar_vakantie: '¡Hurra, ya estás listo para las vacaciones!' },
  it: { intro_zin: 'Ascolta bene e tocca cosa vuol dire!', klaar_huis: 'Wow, ora conosci tutte le cose di casa!', klaar_natuur: 'Wow, ora conosci tutta la natura!', klaar_familie: 'Super, ora conosci tutta la famiglia!', klaar_kleding: 'Wow, ora conosci tutti i vestiti!', klaar_school: 'Grande, ora conosci tutte le cose per la scuola!', klaar_mij: 'Super, ora puoi parlare di te!', klaar_vragen: 'Bravo, ora sai fare domande!', klaar_gevoel: 'Wow, ora sai dire come ti senti!', klaar_samen: 'Ben giocato! Ora potete giocare insieme!', klaar_vakantie: 'Evviva, ora sei pronto per le vacanze!' },
  pt: { intro_zin: 'Escute bem e toque no que significa!', klaar_huis: 'Uau, agora você conhece todas as coisas da casa!', klaar_natuur: 'Uau, agora você conhece toda a natureza!', klaar_familie: 'Demais, agora você conhece a família toda!', klaar_kleding: 'Uau, agora você conhece todas as roupas!', klaar_school: 'Demais, agora você conhece todo o material escolar!', klaar_mij: 'Demais, agora você pode falar de você!', klaar_vragen: 'Muito bem, agora você sabe fazer perguntas!', klaar_gevoel: 'Uau, agora você sabe dizer como se sente!', klaar_samen: 'Mandou bem! Agora vocês podem brincar juntos!', klaar_vakantie: 'Oba, agora você está pronto para as férias!' },
  da: { intro_zin: 'Lyt godt efter, og tryk på det, det betyder!', klaar_huis: 'Wow, nu kender du alle tingene i huset!', klaar_natuur: 'Wow, nu kender du hele naturen!', klaar_familie: 'Super, nu kender du hele familien!', klaar_kleding: 'Wow, nu kender du alt tøjet!', klaar_school: 'Fedt, nu kender du alle skoletingene!', klaar_mij: 'Super, nu kan du fortælle om dig selv!', klaar_vragen: 'Flot, nu kan du stille spørgsmål!', klaar_gevoel: 'Wow, nu kan du sige, hvordan du har det!', klaar_samen: 'Godt spillet! Nu kan I lege sammen!', klaar_vakantie: 'Hurra, nu er du klar til ferien!' },
  ru: { intro_zin: 'Слушай внимательно и нажми, что это значит!', klaar_huis: 'Ух ты, теперь ты знаешь все вещи в доме!', klaar_natuur: 'Ух ты, теперь ты знаешь всю природу!', klaar_familie: 'Супер, теперь ты знаешь всю семью!', klaar_kleding: 'Ух ты, теперь ты знаешь всю одежду!', klaar_school: 'Здорово, теперь ты знаешь все школьные вещи!', klaar_mij: 'Супер, теперь ты можешь рассказать о себе!', klaar_vragen: 'Молодец, теперь ты умеешь задавать вопросы!', klaar_gevoel: 'Ух ты, теперь ты можешь сказать, что чувствуешь!', klaar_samen: 'Отлично! Теперь вы можете играть вместе!', klaar_vakantie: 'Ура, теперь ты готов к каникулам!' },
  ar: { intro_zin: 'استمع جيدًا، واضغط على معناه!', klaar_huis: 'واو، أنت الآن تعرف كل أشياء البيت!', klaar_natuur: 'واو، أنت الآن تعرف كل الطبيعة!', klaar_familie: 'رائع، أنت الآن تعرف كل العائلة!', klaar_kleding: 'واو، أنت الآن تعرف كل الملابس!', klaar_school: 'ممتاز، أنت الآن تعرف كل أدوات المدرسة!', klaar_mij: 'رائع، الآن يمكنك أن تتحدث عن نفسك!', klaar_vragen: 'أحسنت، الآن تعرف كيف تسأل!', klaar_gevoel: 'واو، الآن يمكنك أن تقول بماذا تشعر!', klaar_samen: 'أحسنت اللعب! الآن يمكنكم اللعب معًا!', klaar_vakantie: 'هيا، أنت الآن جاهز للعطلة!' },
};
for (const l of Object.keys(LINES)) Object.assign(LINES[l], NEXT_LINES[l]);

const clips = [];
for (const lang of T.langs) {
  // A word on its own gave the model too little to go on ("haai" came out as English "hi"):
  // it is recorded after a short sentence in its language, as context that is not spoken.
  for (const g of ['Milo', 'Luna']) {
    const dir = g === 'Luna' ? `${lang}/luna/` : `${lang}/`;
    for (const th of [...T.themes, ...(T.next || [])]) for (const w of th.words) clips.push({ file: `${dir}${w.id}.mp3`, text: w.text[lang], lang, guide: g, word: true });
    for (const [k, text] of Object.entries(LINES[lang]))
      clips.push({ file: k.startsWith('klaar_') ? `${lang}/${g.toLowerCase()}/_${k}.mp3` : `${dir}_${k}.mp3`, text, lang, guide: g });
  }
}

const missing = clips.filter(c => !fs.existsSync(path.join(OUT, c.file)));
if (process.argv.includes('--check')) {
  if (missing.length) { console.error(`talen audio: ${missing.length} clips missing, e.g. ${missing.slice(0, 4).map(c => c.file).join(', ')}\nrun: node tools/talen-audio.cjs`); process.exit(1); }
  console.log(`talen audio: ${clips.length} clips present ✔`); process.exit(0);
}
const redo = (process.argv[process.argv.indexOf('--redo') + 1] || '').split(',').filter(Boolean);
// --only nl/luna/ limits a run to the clips under that path (a first try of a new voice)
const only = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : '';
const todo = clips.filter(c => c.file.startsWith(only)).filter(c => !fs.existsSync(path.join(OUT, c.file)) || redo.includes('all') || redo.includes(c.text) || redo.includes(path.basename(c.file, '.mp3')) || redo.includes(c.file.replace(/\.mp3$/, '')));

// What the voice is given when the word on the tile would be read as something
// else: "sept" and "dez" are the abbreviations of septembre and dezembro, and
// that is what came out (2026-10-07). The digit is said as the number.
const SAY = { 'fr/seven': '7', 'pt/ten': '10' };
const TALEN_VOICE = { lang: 'nl', for: ['nl', 'en'] };
const voiceFor = c => SPEECH.voiceId(TALEN_VOICE.for.includes(c.lang) ? TALEN_VOICE.lang : c.lang, c.guide);
// SAY and IN_SENTENCE are per word, the same for both guides: 'nl/luna/snake' looks up 'nl/snake'.
const key = c => c.file.replace(/\.mp3$/, '').replace(/\/(?:milo|luna)\//, '/');
// A word that is also an English word can come out English with the context only as
// previous_text: Dutch "slang" was said as English "slang" (sleng), twice (2026-10-08
// and 10-09; measured, the second formant of the vowel was 1600-2000 Hz, as in English
// "hand", where a Dutch a as in "hand", "tand" or "zwart" is about 1000 Hz). Alone or at
// the end of a sentence it stayed English; in the middle of a Dutch sentence it is
// Dutch (about 1050 Hz). So these are spoken inside that sentence and cut out of it at
// the times ElevenLabs gives per character; trim() then cuts the silence as for any clip.
const IN_SENTENCE = { 'nl/snake': ['Zij zag een ', ', een grote slang.'], 'nl/bed': ['Zij sliep in het ', ' van haar oma.'], 'nl/lamp': ['Op de tafel stond een ', '. Hij was geel.'], 'nl/teacher': ['Dit is onze ', '. Zij is heel lief.'], 'nl/glue': ['Ik plak het met ', '. Dat houdt goed.'], 'fr/bed': ['Il dort dans son ', '. Il fait bien chaud.'], 'en/scarf': ['She wore a warm ', '. It was snowing.'], 'it/table': ['Il libro è sul ', '. È di legno.'] };
async function recordInSentence(c, body) {
  const [before, after] = IN_SENTENCE[key(c)], text = before + body.text + after;
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceFor(c)}/with-timestamps?output_format=mp3_44100_128`, { method: 'POST', headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, text, previous_text: undefined }) });
  if (!r.ok) throw new Error(`${c.file}: ${r.status} ${(await r.text()).slice(0, 120)}`);
  const { audio_base64, alignment } = await r.json();
  const start = alignment.character_start_times_seconds, end = alignment.character_end_times_seconds;
  const i = before.length, j = i + body.text.length - 1;
  const from = Math.max(end[i - 2] ?? 0, start[i] - 0.05), to = Math.min(end[j] + 0.12, start[j + 2] ?? Infinity);
  const whole = path.join(require('os').tmpdir(), 'kwizillo-talen-sentence.mp3');
  fs.writeFileSync(whole, Buffer.from(audio_base64, 'base64'));
  return execFileSync(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-ss', from.toFixed(3), '-to', to.toFixed(3), '-i', whole, '-c:a', 'libmp3lame', '-b:a', '128k', '-f', 'mp3', '-'], { maxBuffer: 1e8 });
}
async function record(c) {
  // Said before the word as context, not spoken: without it a lone word came out in the wrong language ("haai" as "hi").
  const CONTEXT = { nl: 'In het Nederlands zeg je', en: 'In English you say', de: 'Auf Deutsch sagt man', fr: 'En français, on dit', es: 'En español se dice', it: 'In italiano si dice', pt: 'Em português se diz', da: 'På dansk siger man', ru: 'По-русски говорят', ar: 'بالعربية نقول' };
  const body = { text: SAY[key(c)] || c.text, model_id: SPEECH.model, voice_settings: { ...SPEECH.settings[c.guide], speed: TALEN_SPEED }, language_code: c.lang, ...(c.word ? { previous_text: CONTEXT[c.lang] } : {}) };
  const raw = path.join(RAW, c.file); fs.mkdirSync(path.dirname(raw), { recursive: true });
  if (c.word && IN_SENTENCE[key(c)]) { fs.writeFileSync(raw, await recordInSentence(c, body)); return trim(c.file); }
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceFor(c)}?output_format=mp3_44100_128`, { method: 'POST', headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`${c.file}: ${r.status} ${(await r.text()).slice(0, 120)}`);
  fs.writeFileSync(raw, Buffer.from(await r.arrayBuffer()));
  trim(c.file);
}
// The answer is heard as one sentence ("shark ... betekent ... haai"): ElevenLabs leaves
// up to a fifth of a second of silence at both ends of a clip, and strung together that
// sounded like separate words, so the silence is cut off. The first cut (2026-10-07,
// -45 dB, 20 ms in front and 40 ms behind) also cut into the words: the "t" of
// "betekent" and the start of "requin" were gone. Now the speech is found at -50 dB,
// 40 ms is kept in front and 90 ms behind (a soft consonant fades out there), with a
// short fade at both ends against clicks. The take as it came from ElevenLabs is kept
// in .talen-raw/ (not in git), so the cut can be changed without recording again;
// the app overlaps the quiet ends a little when it joins the clips (K.playClips).
// Talen speaks a little faster than the quiz (0.95): words strung into a sentence.
// 64 kb/s mono (2026-10-10, was 128): speech sounds the same and Talen ships with the app, so
// it halves 80 MB of sound — the Android bundle has a 200 MB limit (ANDROID_RELEASE_CHECKLIST.md).
const TALEN_SPEED = 1.05;
const RAW = path.join(ROOT, '.talen-raw');
const FFMPEG = path.join(ROOT, 'tools', 'bin', 'ffmpeg');
const RATE = 44100, KEEP_IN = 0.04, KEEP_OUT = 0.09, FADE_IN = 0.008, FADE_OUT = 0.03;
// Every clip at the same loudness as the ear hears it (EBU R128, LUFS), so a Portuguese
// word after a Dutch "betekent" is not suddenly louder: the voices of the ten
// languages came out of ElevenLabs up to 9 LU apart (nl about -28, pt about -19).
// Measured with a second of silence on either side (R128 gates silence out, and a
// short word then still fills its 400 ms blocks); the gain never lifts a peak past -1 dBFS.
const LOUDNESS = -20, PEAK = Math.pow(10, -1 / 20);
function loudnessOf(samples) {
  const pad = new Int16Array(RATE), buf = new Int16Array(pad.length * 2 + samples.length);
  buf.set(samples, pad.length);
  const r = require('child_process').spawnSync(FFMPEG, ['-hide_banner', '-nostats', '-f', 's16le', '-ar', String(RATE), '-ac', '1', '-i', '-', '-af', 'ebur128', '-f', 'null', '-'], { input: Buffer.from(buf.buffer), maxBuffer: 1e8 });
  const m = String(r.stderr).match(/I:\s+(-?[\d.]+) LUFS\s*\n\s*Threshold/);
  return m ? Number(m[1]) : null;
}
function level(samples) {
  const lufs = loudnessOf(samples); if (lufs === null || lufs < -60) return;
  let peak = 0; for (const v of samples) peak = Math.max(peak, Math.abs(v) / 32768);
  const gain = Math.min(Math.pow(10, (LOUDNESS - lufs) / 20), PEAK / Math.max(peak, 1e-4));
  for (let j = 0; j < samples.length; j++) samples[j] = Math.max(-32768, Math.min(32767, Math.round(samples[j] * gain)));
}
function trim(file) {
  const pcm = execFileSync(FFMPEG, ['-loglevel', 'error', '-i', path.join(RAW, file), '-ac', '1', '-ar', String(RATE), '-f', 's16le', '-'], { maxBuffer: 1e8 });
  const s = new Int16Array(pcm.buffer.slice(pcm.byteOffset, pcm.byteOffset + pcm.length));
  const thr = 32768 * Math.pow(10, -50 / 20);
  let i0 = 0; while (i0 < s.length && Math.abs(s[i0]) < thr) i0++;
  let i1 = s.length - 1; while (i1 > i0 && Math.abs(s[i1]) < thr) i1--;
  const from = Math.max(0, i0 - Math.round(KEEP_IN * RATE)), to = Math.min(s.length, i1 + 1 + Math.round(KEEP_OUT * RATE));
  const out = s.slice(from, to), fi = Math.round(FADE_IN * RATE), fo = Math.round(FADE_OUT * RATE);
  for (let j = 0; j < fi && j < out.length; j++) out[j] = Math.round(out[j] * j / fi);
  for (let j = 0; j < fo && j < out.length; j++) out[out.length - 1 - j] = Math.round(out[out.length - 1 - j] * j / fo);
  level(out);
  const dest = path.join(OUT, file); fs.mkdirSync(path.dirname(dest), { recursive: true });
  execFileSync(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-y', '-f', 's16le', '-ar', String(RATE), '-ac', '1', '-i', '-', '-c:a', 'libmp3lame', '-b:a', '64k', dest], { input: Buffer.from(out.buffer) });
}
if (process.argv.includes('--trim')) {
  const have = clips.filter(c => fs.existsSync(path.join(RAW, c.file)));
  for (const c of have) trim(c.file);
  console.log(`trimmed ${have.length} clips from .talen-raw/`); process.exit(0);
}
// Spelling that sounds the same is not a fault: ещё/еще, accents, Arabic vowel marks.
const norm = s => String(s).toLowerCase().normalize('NFKD').replace(/[̀-ًͯ-ْ]/g, '').replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
// A word on its own is too little for Scribe as well ("phoque" came back as "fuck",
// "Frosch" right one run and "Was?" the next): a word clip is checked after a short
// lead-in in its own language ("The next word is ..."), recorded once into the
// system's temp folder; the transcript must end with the word.
const LEAD = { nl: 'Het volgende woord is', en: 'The next word is', de: 'Das nächste Wort ist', fr: 'Le mot suivant est', es: 'La siguiente palabra es', it: 'La prossima parola è', pt: 'A próxima palavra é', da: 'Det næste ord er', ru: 'Следующее слово', ar: 'الكلمة التالية هي' };
const LEAD_DIR = path.join(require('os').tmpdir(), 'kwizillo-talen-lead');
async function withLead(c) {
  const lead = path.join(LEAD_DIR, `${c.lang}.mp3`);
  if (!fs.existsSync(lead)) {
    fs.mkdirSync(LEAD_DIR, { recursive: true });
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${SPEECH.voiceId(c.lang, 'Milo')}?output_format=mp3_44100_128`, { method: 'POST', headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ text: LEAD[c.lang], model_id: SPEECH.model, voice_settings: SPEECH.settings.Milo, language_code: c.lang }) });
    fs.writeFileSync(lead, Buffer.from(await r.arrayBuffer()));
  }
  const out = path.join(LEAD_DIR, `check-${c.lang}.mp3`);
  execFileSync(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-y', '-i', lead, '-i', path.join(OUT, c.file), '-filter_complex', '[0:a]apad=pad_dur=0.25[a];[a][1:a]concat=n=2:v=0:a=1', '-c:a', 'libmp3lame', '-b:a', '128k', out]);
  return out;
}
async function hear(c) {
  const form = new FormData(); form.append('model_id', 'scribe_v1'); form.append('language_code', c.lang);
  form.append('file', new Blob([fs.readFileSync(c.word ? await withLead(c) : path.join(OUT, c.file))], { type: 'audio/mpeg' }), 'a.mp3');
  const r = await fetch('https://api.elevenlabs.io/v1/speech-to-text', { method: 'POST', headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY }, body: form });
  return (await r.json()).text || '';
}

(async () => {
  for (const c of todo) { await record(c); console.log(`recorded ${c.file}  "${c.text}"`); }
  let off = 0;
  // only the clips recorded now are checked (Scribe costs credits too); --hear-all checks every clip
  for (const c of process.argv.includes('--hear-all') ? clips : todo) {
    const heard = await hear(c);
    const ok = c.word ? norm(heard).endsWith(norm(c.text)) : norm(heard) === norm(c.text);
    if (!ok) off++;
    console.log(`${ok ? '✔' : '✘'} ${c.file.padEnd(28)} "${c.text}"${ok ? '' : `  heard: "${heard}"`}`);
  }
  console.log(`\n${clips.length} clips, ${todo.length} recorded now, ${off} heard differently`);
})();
