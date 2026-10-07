#!/usr/bin/env node
// Records the sound of Talen into assets/talen/audio/ (it ships with the app).
//
//   node tools/talen-audio.cjs            records what is missing, then checks every clip with Scribe
//   node tools/talen-audio.cjs --check    only checks that every clip exists (for npm test)
//   node tools/talen-audio.cjs --redo shark,haai   records those again (or one language: --redo de/shark)
//   node tools/talen-audio.cjs --trim     only trims the silence off every clip again
//
// The voices, the model and the settings are the app's own (speech-config.js),
// so Milo sounds in Talen as he does everywhere else. One recording per word:
// cutting a list of words out of one take left clipped edges in the prototype.
// Words are said by Milo; the lines around them by Milo in the child's own
// language; the closing line per theme by the guide the child chose (Milo or Luna).
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
// "almost" come in several wordings (_goed1.._goed10, _bijna1.._bijna4): the same
// "Goed zo!" after every word got dull (2026-10-07). The closing line does not
// name the language being learned: with ten languages that would be a recording
// per pair.
const PRAISE = {
  nl: {
    goed: ["Goed zo!","Super!","Yes!","Top!","Perfect!","Heel goed!","Lekker bezig!","Ga zo door!","Knap!","Wauw!"],
    bijna: ["Bijna! Luister nog een keer.","Net niet! Luister nog eens.","Oeps! Probeer het nog eens.","Hmm, luister nog even goed."] },
  en: {
    goed: ["Well done!","Super!","Yes!","Great!","Perfect!","Very good!","Nice one!","Keep going!","Clever!","Wow!"],
    bijna: ["Almost! Listen again.","Not quite! Listen once more.","Oops! Try again.","Hmm, listen carefully again."] },
  de: {
    goed: ["Gut gemacht!","Super!","Ja!","Toll!","Perfekt!","Sehr gut!","Klasse!","Weiter so!","Schlau!","Wow!"],
    bijna: ["Fast! Hör noch mal zu.","Nicht ganz! Hör noch einmal hin.","Hoppla! Versuch es noch mal.","Hmm, hör noch mal genau hin."] },
  fr: {
    goed: ["Bravo !","Super !","Oui !","Génial !","Parfait !","Très bien !","Bien joué !","Continue !","Malin !","Waouh !"],
    bijna: ["Presque ! Écoute encore une fois.","Pas tout à fait ! Écoute encore.","Oups ! Essaie encore.","Hmm, écoute bien encore une fois."] },
  es: {
    goed: ["¡Muy bien!","¡Genial!","¡Sí!","¡Estupendo!","¡Perfecto!","¡Fenomenal!","¡Bien hecho!","¡Sigue así!","¡Qué listo!","¡Guau!"],
    bijna: ["¡Casi! Escucha otra vez.","¡No del todo! Escucha una vez más.","¡Uy! Inténtalo otra vez.","Mmm, escucha bien otra vez."] },
  it: {
    goed: ["Bravo!","Super!","Sì!","Grande!","Perfetto!","Molto bene!","Ben fatto!","Continua così!","Che bravo!","Wow!"],
    bijna: ["Quasi! Ascolta ancora.","Non proprio! Ascolta di nuovo.","Ops! Riprova.","Mmm, ascolta bene ancora una volta."] },
  pt: {
    goed: ["Muito bem!","Boa!","Sim!","Fantástico!","Perfeito!","Excelente!","Bem feito!","Continua assim!","Que esperto!","Uau!"],
    bijna: ["Quase! Ouve outra vez.","Ainda não! Ouve mais uma vez.","Ups! Tenta outra vez.","Hmm, ouve bem outra vez."] },
  da: {
    goed: ["Godt klaret!","Super!","Ja!","Fedt!","Perfekt!","Rigtig godt!","Flot!","Bliv ved!","Sådan!","Wow!"],
    bijna: ["Næsten! Lyt igen.","Ikke helt! Lyt en gang til.","Ups! Prøv igen.","Hmm, lyt godt efter igen."] },
  ru: {
    goed: ["Молодец!","Супер!","Да!","Здорово!","Идеально!","Очень хорошо!","Отлично!","Так держать!","Умница!","Ух ты!"],
    bijna: ["Почти! Послушай ещё раз.","Не совсем! Послушай снова.","Ой! Попробуй ещё раз.","Хм, послушай внимательно ещё раз."] },
  ar: {
    goed: ["أحسنت!","رائع!","نعم!","ممتاز!","مثالي!","جيد جدًا!","عمل جميل!","استمر!","يا لك من ذكي!","واو!"],
    bijna: ["اقتربت! استمع مرة أخرى.","ليس تمامًا! استمع مرة أخرى.","أوه! حاول مرة أخرى.","همم، استمع جيدًا مرة أخرى."] }
};
const LINES = {
  nl: { intro: 'Luister goed, en tik op het juiste plaatje!', betekent: 'betekent', klaar_dieren: 'Wauw, je kent nu alle dieren!',
    ...Object.fromEntries(PRAISE.nl.goed.map((x, i) => [`goed${i + 1}`, x])), ...Object.fromEntries(PRAISE.nl.bijna.map((x, i) => [`bijna${i + 1}`, x])) },
  en: { intro: 'Listen carefully, and tap the right picture!', betekent: 'means', klaar_dieren: 'Wow, you know all the animals now!',
    ...Object.fromEntries(PRAISE.en.goed.map((x, i) => [`goed${i + 1}`, x])), ...Object.fromEntries(PRAISE.en.bijna.map((x, i) => [`bijna${i + 1}`, x])) },
  de: { intro: 'Hör gut zu und tippe auf das richtige Bild!', betekent: 'heißt', klaar_dieren: 'Wow, jetzt kennst du alle Tiere!',
    ...Object.fromEntries(PRAISE.de.goed.map((x, i) => [`goed${i + 1}`, x])), ...Object.fromEntries(PRAISE.de.bijna.map((x, i) => [`bijna${i + 1}`, x])) },
  fr: { intro: 'Écoute bien, et touche la bonne image !', betekent: 'veut dire', klaar_dieren: 'Waouh, tu connais maintenant tous les animaux !',
    ...Object.fromEntries(PRAISE.fr.goed.map((x, i) => [`goed${i + 1}`, x])), ...Object.fromEntries(PRAISE.fr.bijna.map((x, i) => [`bijna${i + 1}`, x])) },
  es: { intro: '¡Escucha bien y toca la imagen correcta!', betekent: 'significa', klaar_dieren: '¡Guau, ya conoces todos los animales!',
    ...Object.fromEntries(PRAISE.es.goed.map((x, i) => [`goed${i + 1}`, x])), ...Object.fromEntries(PRAISE.es.bijna.map((x, i) => [`bijna${i + 1}`, x])) },
  it: { intro: "Ascolta bene e tocca l'immagine giusta!", betekent: 'vuol dire', klaar_dieren: 'Wow, ora conosci tutti gli animali!',
    ...Object.fromEntries(PRAISE.it.goed.map((x, i) => [`goed${i + 1}`, x])), ...Object.fromEntries(PRAISE.it.bijna.map((x, i) => [`bijna${i + 1}`, x])) },
  pt: { intro: 'Ouve bem e toca na imagem certa!', betekent: 'significa', klaar_dieren: 'Uau, agora já conheces todos os animais!',
    ...Object.fromEntries(PRAISE.pt.goed.map((x, i) => [`goed${i + 1}`, x])), ...Object.fromEntries(PRAISE.pt.bijna.map((x, i) => [`bijna${i + 1}`, x])) },
  da: { intro: 'Lyt godt efter, og tryk på det rigtige billede!', betekent: 'betyder', klaar_dieren: 'Wow, nu kender du alle dyrene!',
    ...Object.fromEntries(PRAISE.da.goed.map((x, i) => [`goed${i + 1}`, x])), ...Object.fromEntries(PRAISE.da.bijna.map((x, i) => [`bijna${i + 1}`, x])) },
  ru: { intro: 'Слушай внимательно и нажми на правильную картинку!', betekent: 'значит', klaar_dieren: 'Ух ты, теперь ты знаешь всех животных!',
    ...Object.fromEntries(PRAISE.ru.goed.map((x, i) => [`goed${i + 1}`, x])), ...Object.fromEntries(PRAISE.ru.bijna.map((x, i) => [`bijna${i + 1}`, x])) },
  ar: { intro: 'استمع جيدًا، واضغط على الصورة الصحيحة!', betekent: 'تعني', klaar_dieren: 'واو، أنت الآن تعرف كل الحيوانات!',
    ...Object.fromEntries(PRAISE.ar.goed.map((x, i) => [`goed${i + 1}`, x])), ...Object.fromEntries(PRAISE.ar.bijna.map((x, i) => [`bijna${i + 1}`, x])) },
};

const clips = [];
for (const lang of T.langs) {
  // A word on its own gave the model too little to go on ("haai" came out as English "hi"):
  // it is recorded after a short sentence in its language, as context that is not spoken.
  for (const th of T.themes) for (const w of th.words) clips.push({ file: `${lang}/${w.id}.mp3`, text: w.text[lang], lang, guide: 'Milo', word: true });
  for (const [k, text] of Object.entries(LINES[lang])) {
    if (k.startsWith('klaar_')) for (const g of ['Milo', 'Luna']) clips.push({ file: `${lang}/${g.toLowerCase()}/_${k}.mp3`, text, lang, guide: g });
    else clips.push({ file: `${lang}/_${k}.mp3`, text, lang, guide: 'Milo' });
  }
}

const missing = clips.filter(c => !fs.existsSync(path.join(OUT, c.file)));
if (process.argv.includes('--check')) {
  if (missing.length) { console.error(`talen audio: ${missing.length} clips missing, e.g. ${missing.slice(0, 4).map(c => c.file).join(', ')}\nrun: node tools/talen-audio.cjs`); process.exit(1); }
  console.log(`talen audio: ${clips.length} clips present ✔`); process.exit(0);
}
const redo = (process.argv[process.argv.indexOf('--redo') + 1] || '').split(',').filter(Boolean);
const todo = clips.filter(c => !fs.existsSync(path.join(OUT, c.file)) || redo.includes(c.text) || redo.includes(path.basename(c.file, '.mp3')) || redo.includes(c.file.replace(/\.mp3$/, '')));

async function record(c) {
  const CONTEXT = { nl: 'In het Nederlands heet dit dier', en: 'In English this animal is called', de: 'Auf Deutsch heißt dieses Tier', fr: 'En français, cet animal s’appelle', es: 'En español, este animal se llama', it: 'In italiano, questo animale si chiama', pt: 'Em português, este animal chama-se', da: 'På dansk hedder dette dyr', ru: 'По-русски это животное называется', ar: 'بالعربية، اسم هذا الحيوان' };
  const body = { text: c.text, model_id: SPEECH.model, voice_settings: SPEECH.settings[c.guide], language_code: c.lang, ...(c.word ? { previous_text: CONTEXT[c.lang] } : {}) };
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${SPEECH.voiceId(c.lang, c.guide)}?output_format=mp3_44100_128`, { method: 'POST', headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`${c.file}: ${r.status} ${(await r.text()).slice(0, 120)}`);
  const out = path.join(OUT, c.file); fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, Buffer.from(await r.arrayBuffer()));
  trim(out);
}
// The answer is heard as one sentence ("shark ... betekent ... haai"), in two voices:
// ElevenLabs leaves up to a fifth of a second of silence at both ends of a clip, and
// strung together that sounded like separate words. Each clip keeps 20 ms in front
// and 40 ms behind (tools/bin/ffmpeg, the copy the repo already uses).
const FFMPEG = path.join(ROOT, 'tools', 'bin', 'ffmpeg');
function trim(file) {
  const tmp = file + '.trim.mp3';
  execFileSync(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-y', '-i', file, '-af',
    'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.02,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.04,areverse',
    '-c:a', 'libmp3lame', '-b:a', '128k', tmp]);
  fs.renameSync(tmp, file);
}
if (process.argv.includes('--trim')) {
  for (const c of clips) trim(path.join(OUT, c.file));
  console.log(`trimmed ${clips.length} clips`); process.exit(0);
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
  for (const c of clips) {
    const heard = await hear(c);
    const ok = c.word ? norm(heard).endsWith(norm(c.text)) : norm(heard) === norm(c.text);
    if (!ok) off++;
    console.log(`${ok ? '✔' : '✘'} ${c.file.padEnd(28)} "${c.text}"${ok ? '' : `  heard: "${heard}"`}`);
  }
  console.log(`\n${clips.length} clips, ${todo.length} recorded now, ${off} heard differently`);
})();
