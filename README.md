# Kwizillo

A premium educational adventure game for primary-school children, in Dutch and
English. Six themed worlds, 24 topics, 240 questions per language, XP, coins,
collectible knowledge cards and mascots.

## Running locally

```bash
./start.command          # prompts for the ElevenLabs key, then opens the browser
```

or, without a voice guide:

```bash
npm start                # http://127.0.0.1:8080
```

The ElevenLabs key is read from `ELEVENLABS_API_KEY` and only ever lives in the
server process. It is never written into the app files and never reaches the
browser. Without a key the game is fully playable; Milo and Luna simply stay
silent.

Generated speech is cached in `.tts-cache/` so the same sentence does not spend
credits twice. That directory is git-ignored.

## Tests

```bash
npm test                 # question banks, gameplay core, static-serving security
npm run test:ui          # Playwright: onboarding, six worlds, quiz flow, i18n
```

`npm run test:ui` needs a browser once: `npx playwright install chromium`.

## Layout

| File | Role |
|---|---|
| `index.html` | single entry point, script order is the load order |
| `state.js` | one store, schema 2, migration, streak and level derivation |
| `i18n.js` | every user-facing string, Dutch and English |
| `questions.js` / `questions-en.js` | the two question banks and their shared builder |
| `quiz-core-v2.js` | pure logic: batching, scoring, speech segments, cancellation |
| `m1-runtime.js` | audio manager, TTS client, renderer |
| `world-assets.js` | artwork paths, all local |
| `m1-ui.js` | Home, world, collection, achievements, stats, parent zone |
| `quiz-visual-v2.js` | the quiz, hint, feedback and result screens |
| `games-memo.js` / `games-math.js` | the Memo and Rekenen games |
| `facts.js` / `facts-ui.js` | the Weetjes bank (96 facts per language, aligned by id) and its screen |
| `milo.js` / `guide-talks.js` | the guide host (Milo or Luna): poses, bubbles, lip-synced clips, the Home tour |
| `onboarding.js` | first-run language, name, age, school group and guide, hosted by the guide |
| `intro.js` | the opening cinematic |
| `base.css` / `screens.css` | the two stylesheets |
| `server.js` | static host plus the ElevenLabs proxy |

All artwork ships in `assets/`; nothing is fetched from a CDN at runtime, so the
game works offline.

## Status

See `AUDIT.md` for the architecture review and the remaining open items.
