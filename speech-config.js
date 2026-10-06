// Everything that decides which recording a line maps to: the model, the 20
// voices, their settings and the cache key. server.js speaks with it, and
// tools/speech-inventory.cjs and tools/warm-speech.cjs count and record with
// it, so a recording made on one machine is found by the other.
//
// The voices were chosen by ear on 2026-10-01 from the ElevenLabs library
// (young, upbeat, native for each language) and added to the account under
// "Kwizillo <guide> <LANG> v4t". Changing one here changes every key of that
// language and voice: the lines must then be recorded again.
const crypto = require('crypto');

const DEFAULT_MODEL = 'eleven_v4_turbo';

const VOICES = {
  nl: { Milo: 'jfwdd64Nlhnj6vcFqRHZ', Luna: '7qdUFMklKPaaAVMsBTBt' },   // Koen · Roos
  en: { Milo: 'lE5ZJB6jGeeuvSNxOvs2', Luna: 'Nggzl2QAXh3OijoXD116' },   // Marshal · Candy
  de: { Milo: '2HDQZbLZn0MJCgru92h7', Luna: '3t6439mGAsHvQFPpoPdf' },   // Knurps · Raya
  fr: { Milo: 'mvhJVdVoTWVUtL4keT7W', Luna: 'fBpCO0Kf0krKLYGOu65w' },   // Simon · Émilie
  es: { Milo: 'tGjegxe7yxhGMzd3SOmH', Luna: 'dNjJKg63Fr5AXwIdkATa' },   // Eric · Cristina
  it: { Milo: 'GOAZNavLupajyL3YafaD', Luna: 'uV2Bhcm1HwmAqPqkbjfl' },   // Francesco · Sara
  pt: { Milo: '4dlXQwYXFHlCAUmQAu9j', Luna: 'ORgG8rwdAiMYRug8RJwR' },   // Zozo · Ana Alice
  da: { Milo: 'V34B5u5UbLdNJVEkcgXp', Luna: 'h5TGSgjuArqhPBRRe0mM' },   // Noam · Freja
  ru: { Milo: 'iLf2ADS3z6hSHT4AgzER', Luna: 'NhY0kyTmsKuEpHvDMngm' },   // Mikhail · Nataly
  ar: { Milo: 'JoySr0ZYKEotnyhsN3Fi', Luna: 'w4LX7bK479eHGM1k15Em' },   // Jawad · Habibah
};

// A letter on its own ("B.") gives the model no clue which language it is in,
// so it often says the English letter. When a bare answer letter is recorded,
// ElevenLabs is shown the alphabet around it (previous_text / next_text): that
// text is context only and is not spoken. Chosen by ear on 2026-10-06. Arabic
// says its own letter names (alif, baa ...) and needs no context.
const ALPHABET_INTRO = {
  nl: 'Ik zeg het Nederlandse alfabet op:',
  en: 'I am saying the English alphabet:',
  de: 'Ich sage das deutsche Alphabet auf:',
  fr: "Je récite l'alphabet français :",
  es: 'Digo el abecedario español:',
  it: "Recito l'alfabeto italiano:",
  pt: 'Digo o alfabeto português:',
  da: 'Jeg siger det danske alfabet:',
  ru: 'Я называю латинские буквы:',
};
const LETTERS = ['A', 'B', 'C', 'D'];
function letterContext(text, lang) {
  const i = LETTERS.indexOf(String(text).replace(/\.$/, ''));
  if (i < 0 || !/\.$/.test(text) || !ALPHABET_INTRO[lang]) return null;
  return {
    previous_text: `${ALPHABET_INTRO[lang]} ${LETTERS.slice(0, i).map(l => `${l}, `).join('')}`.trim(),
    next_text: LETTERS.slice(i + 1).join(', '),
  };
}

// env: the server's environment (ELEVENLABS_MODEL, MILO_SPEED, LUNA_SPEED).
function speechConfig(env = process.env) {
  const model = env.ELEVENLABS_MODEL || DEFAULT_MODEL;
  const settings = /multilingual_v2/.test(model) ? {
    Milo: { stability: 0.42, similarity_boost: 0.78, style: 0.3, use_speaker_boost: true, speed: Number(env.MILO_SPEED || 0.88) },
    Luna: { stability: 0.38, similarity_boost: 0.8, style: 0.46, use_speaker_boost: true, speed: Number(env.LUNA_SPEED || 1.0) }
  } : /v4/.test(model) ? {
    // Measured by ear on the v4 samples, 2026-10-01: these voices are lively
    // already, so they keep close to their natural pace.
    Milo: { stability: 0.5, similarity_boost: 0.8, use_speaker_boost: true, speed: Number(env.MILO_SPEED || 0.95) },
    Luna: { stability: 0.5, similarity_boost: 0.8, use_speaker_boost: true, speed: Number(env.LUNA_SPEED || 0.95) }
  } : {
    Milo: { stability: 0.5, similarity_boost: 0.8, use_speaker_boost: true, speed: Number(env.MILO_SPEED || 0.92) },
    Luna: { stability: 0.5, similarity_boost: 0.8, use_speaker_boost: true, speed: Number(env.LUNA_SPEED || 0.95) }
  };
  // Audio tags such as "[excited]" are understood by v3 and v4; any other
  // model would read them out, so they are dropped there.
  const keepsTags = /v3|v4/.test(model);
  const clean = text => keepsTags ? text : text.replace(/\[[a-z][a-z ]*\]\s*/gi, '').trim();
  const voiceId = (lang, guide) => VOICES[lang]?.[guide === 'Luna' ? 'Luna' : 'Milo'] || null;
  // Voice settings are part of the key: a speed change must not replay old audio.
  // The context is part of the key too: a letter said with the alphabet around
  // it is a different recording from the bare one made before.
  const cacheKey = (text, lang, guide, id = voiceId(lang, guide)) => {
    const ctx = letterContext(text, lang);
    return crypto.createHash('sha256').update(`${model}|${lang}|${id}|${JSON.stringify(settings[guide === 'Luna' ? 'Luna' : 'Milo'])}|${text}${ctx ? `|${JSON.stringify(ctx)}` : ''}`).digest('hex');
  };
  return { model, settings, keepsTags, clean, voiceId, cacheKey, letterContext };
}

module.exports = { DEFAULT_MODEL, VOICES, speechConfig, letterContext };
