# AUDIO_QA.md — Kwizillo spraak-QA

**Datum:** 2026-09-13
**Model:** `eleven_v3` (gekozen in een blinde A/B op 2026-09-13; zie §10)
**Steekproef:** 20 vragen NL + 20 vragen EN, plus één volledige vraag-plus-A/B/C/D-reeks per taal

Alles hieronder is gemeten met `npm run test:audio`, dat de clips genereert
(`tests/audio-qa.js`) en ze daarna terug laat transcriberen met ElevenLabs Scribe
(`tests/audio-transcribe.js`). Wat ik niet kon meten staat er expliciet bij.

---

## 1. Stemselectie

| Taal | Gids | Stem | Accent | Bron |
|---|---|---|---|---|
| nl | Milo | Kwizillo Milo NL-NL v20 | standard | eigen bibliotheek |
| nl | Luna | Kwizillo Luna NL-NL v20 | standard | eigen bibliotheek |
| en | Milo | Kwizillo Milo EN-US v20 | american | eigen bibliotheek |
| en | Luna | Kwizillo Luna EN-US v20 | american | eigen bibliotheek |

De ID's staan in `.env.example` om te pinnen.

**Twee fouten gevonden en verholpen in de eerste live-run:**

1. Nederlandse Luna werd "Ivanna", een **Amerikaanse** stem. ElevenLabs markeert
   populaire Amerikaanse stemmen als *geverifieerd voor Nederlands*; de oude code
   las dat als "native" en haar populariteitsbonus versloeg elke echte Nederlandse
   kandidaat. Nu is het `accent`-label leidend en wordt elk niet-Nederlands accent
   hard afgewezen voor nl.
2. Engelse Luna verloor daarna van diezelfde Ivanna, omdat de basis-scorer +220 gaf
   voor "geverifieerd Nederlands" — ook bij het scoren voor Engels. Basis-scorers
   wegen nu alleen geslacht, leeftijd en toon; taalfit is de regel.

De gecureerde Kwizillo-stemmen uit de eigen bibliotheek gaan nu vóór elke externe
zoektocht, gematcht op labels en niet op naam (één "NL-NL"-stem is als Brits gelabeld).

**Vlaams:** de oude `.voice-selection-v35.json` had letterlijk `"accent": "flemish"`
voor Luna. Vlaamse en Belgische accenten worden nu in elke selectiestap afgewezen.

---

## 2. Taal en accent (objectief)

Scribe geeft per clip de gedetecteerde taal met een waarschijnlijkheid.

| | Volzinnen gehoord als bedoelde taal |
|---|---|
| Nederlands | **20/20** (83–100%) |
| Engels | **20/20** (82–100%) |

Elke Nederlandse vraag wordt woord voor woord correct getranscribeerd, idem Engels.
"ISS" en "GPS" komen in beide talen exact door.

Kanttekening: op clips van één seconde (losse letters, losse getallen) is Scribe's
taalgok ruis — "tien" alleen werd Vietnamees, "A." Japans. Daar telt alleen de
getranscribeerde **tekst**, niet het taallabel. De harnas negeert taallabels op
segmenten korter dan vijf woorden.

---

## 3. Letters A/B/C/D en getallen

### Gevonden probleem

De steekproef trof een vraag met cijferantwoorden ("Hoeveel planeten heeft ons
zonnestelsel?" → 8/7/9/10). De losse segmenten werden **in het Engels** uitgesproken:

| Bedoeld | Gehoord (vóór fix) |
|---|---|
| nl "B. 7." | **"Bay seven"** |
| nl "D. 10." | **"Day 10"** |
| en "A. 8." | **"Uh, 80"** (A als lidwoord) |
| en "D. 10." | **"The ten"** |

Dit is het "Engelse uitspraak binnen Nederlandse spraak" uit de handover,
objectief gereproduceerd. Zonder taalcontext valt `multilingual_v2` op Engels terug.

### Getest en verworpen

Aanhalingstekens rond de letter, dubbele punt, streepje en komma — alle vier
**slechter** dan het huidige "A. X."-formaat ("Een Mercurius", "I ate", "Uh, Mercury").
Phoneme-tags werken volgens de documentatie niet op `multilingual_v2` (alleen
Flash/Turbo v2 voor Engels, en v3 meertalig).

### Fix

Cijfers worden **als woorden** gesproken, per taal, op de TTS-grens. Het scherm
blijft cijfers tonen. `quiz-core-v2.js` → `spellNumbers()`:

| Bedoeld | Gesproken | Gehoord (ná fix) |
|---|---|---|
| nl "B. 7." | "B. zeven." | **"B7"** |
| nl "D. 10." | "D. tien." | **"D10"** |
| en "A. 8." | "A. eight." | **"A eight"** |
| en "D. 10." | "D. ten." | **"DE10"** |

Dekt alle 15 getallen die in beide banken voorkomen (0–2006), plus %, km/u, km/h,
°C en cm. Een test bewaakt dat geen enkel cijfer de stem nog bereikt.

De letter A blijft de lastigste in isolatie; "A. woord." is het beste dat dit model
biedt. Verdere winst vraagt `eleven_v3` (IPA in alle talen) — niet nu.

---

## 4. Luidheid (objectief)

Gemeten door de mp3's te decoderen in Chromium en de RMS te berekenen.

| | Bron (dBFS) | Na client-normalisatie |
|---|---|---|
| nl Milo | −29,2 | −15,9 |
| nl Luna | −20,9 | −15,9 |
| en Milo | −26,0 | −15,9 |
| en Luna | −24,6 | −15,9 |

**Gevonden:** de nieuwe NL-Luna is aan de bron **8 dB luider** dan Milo — het
omgekeerde van wat de code aannam. `m1-runtime.js` gaf Luna een vaste ×1,85
versterking (afgestemd op de oude, zachte Vlaamse stem) die het gat tot ~10 dB zou
vergroten. Die is weg; RMS-normalisatie doet het werk, met het plafond verhoogd van
3,1 naar 5 zodat de zachte Milo het doel ook echt haalt. Resultaat: **0,0 dB verschil**
na normalisatie in beide talen.

---

## 5. Tempo

| | Vóór | Ná (`speed`) |
|---|---|---|
| nl Milo | 18,0 tekens/s | 15,8 |
| nl Luna | 15,7 | 15,2 |
| en Milo | 17,8 | 16,4 |
| en Luna | 14,5 | 15,1 |

Milo sprak merkbaar sneller dan Luna. `voice_settings.speed` (0,7–1,2, bevestigd
via de API-docs) staat nu op 0,88 voor Milo. Alle vier tussen 15 en 16,4 tekens/s.
Instelbaar via `MILO_SPEED` / `LUNA_SPEED` in `.env`.

Pauzes: elke clip heeft 250–400 ms stilte aan het eind; de client wacht daarbovenop
520 ms na de vraag en 300 ms tussen antwoorden. Totaal ~0,6–0,9 s — rustig voor een
kind, en annuleerbaar mid-pauze.

---

## 6. Cache en annulering

- Nieuwe zin: ~950 ms upstream, herhaling: 2 ms uit cache. ✅
- Dezelfde tekst in nl en en levert **verschillende audio** (inhoudshash). ✅
- Cache-sleutel bevat model, taal, stem, voice-settings en tekst — een
  snelheidswijziging speelt geen oude audio meer af.
- Annulering (tap, navigatie, taalwissel) is gedekt door de browsertests;
  de cancellation gate maakt lopende én wachtende segmenten direct ongeldig.

---

## 7. `language_code`

De server stuurde `language_code` mee. Volgens de API-documentatie wordt die
parameter **niet ondersteund door `multilingual_v2`**. Nu alleen meegestuurd voor
modellen die hem honoreren; de native stem per taal draagt het accent.

---

## 8. Wat alleen een oor kan beoordelen

Samples staan in `audio-qa-output/` (gitignored). Per taal 20 clips, afwisselend
Milo en Luna, plus `sequence-*/` met vraag en A/B/C/D los.

1. **Klinkt het Nederlands als Nederlands-Nederlands?** Scribe zegt ja (20/20),
   maar Scribe hoort geen regionale kleuring. Luister naar `nl/*-Luna.mp3`.
2. **Klinkt de Engelse stem consistent Amerikaans?**
3. **"Wat is GPS?"** (`nl/aarde-kaarten_navigatie-08-Luna.mp3`): de woorden zijn
   correct, maar klinkt de G als Nederlandse "gee" of Engelse "jee"?
4. **Zijn A/B/C/D duidelijk letters?** Objectief ja; beoordeel de klank van de A.
5. **Is het tempo rustig genoeg?** 15–16 tekens/s; zo niet, verlaag `MILO_SPEED`.

---

## 9. Nog open

- **Productie:** de proxy accepteert vrije tekst. Vóór release moet hij valideren
  dat de tekst uit de vragenbank of een vaste UI-set komt.
- **`eleven_v3`** zou letters en uitspraak in alle talen via IPA kunnen sturen.
  Niet gedaan: ander kwaliteits-/kostenprofiel, en `multilingual_v2` presteert nu
  meetbaar goed.

---

## Herhalen

```bash
npm run test:audio      # genereert, meet, transcribeert, rapporteert
```

Vereist `ELEVENLABS_API_KEY` in `.env` met `voices_read`-recht.

---

## 10. Model: v2 → v3

Na de telefoontest oordeelde de gebruiker dat uitspraak en intonatie op
`multilingual_v2` nog niet goed waren. Blinde A/B met dezelfde zin, zes varianten:
huidig (A/C), `eleven_v3` (B/D), en v2 stabieler afgesteld (E/F). Gekozen: **B en D**.

`eleven_v3` is nu het standaardmodel. Instellingen exact zoals beluisterd:
Milo `stability 0.5, similarity 0.8, speed 0.92`; Luna `stability 0.5, similarity 0.8,
speed 0.95`. `style` bestaat niet op v3. Alle metingen uit §2–§3 zijn op v3 herhaald:
40/40 clips, elke volzin in de juiste taal, letters en cijfers correct, nul problemen.

Kanttekening: v3 heeft een ander tarief per teken dan v2. Het cachet (één keer per
zin per taal per stem) beperkt dat in de praktijk.

## 11. Intro-thema (muziek + kinderstemmen)

`assets/audio/intro_theme.wav` (12,4 s, mono 16-bit, 1,1 MB) is de enige
muziekbron tijdens de cinematic; bij het einde of een tik vloeit hij in 0,6 s
over in de Home-loop (één bron tegelijk, CLAUDE.md §5).

**Bouw** (reproduceerbaar, sleutel uit `.env`):
1. `node tools/intro-audio.js build/intro-audio all` — ElevenLabs Music
   (`music_v2`, instrumentaal, 12 s) en vier kinder-/cartoonstemmen uit de
   bibliotheek (Teddy Twinkle, Lulu Lolipop, Mini, Leo) die "[excited] Kwizillo!"
   roepen (v3).
2. `node tools/intro-mix.cjs analyse build/intro-audio` — RMS-envelop per 0,25 s
   om de muzikale "hit" te vinden (music-2: 9,5 s).
3. `node tools/intro-mix.cjs render build/intro-audio out.wav --music music-2.mp3
   --musicAt 0.5 --kids <vier a-clips> --kidsAt 9.75 --musicGain 1 --kidGain 1.1
   --earlyBoost 2.6 --earlyUntil 4.4 --duck .5` — Web Audio (OfflineAudioContext
   in headless Chromium, geen ffmpeg): muziek +0,5 s zodat de hit op 10,0 s valt
   (het logo verschijnt op 9,1–10,1 s in de animatie), koor start op 9,75 s met
   45 ms spreiding en stereo-spreiding, muziek dipt naar 50% onder het koor,
   opbouw (te stil gegenereerd, −34 dBFS) 2,6× opgetild, compressor + limiter,
   fade-out in de laatste 0,6 s.

**Objectief gecontroleerd**
- Scribe-transcriptie van elke kinderclip: "Quizillo/Kwizilla" op 0,10–0,18 s
  (onset), ~1 s lang; de b-varianten met [laughs] afgekeurd (minder duidelijk).
- Koor zonder muziek: transcriptie "Quizillo @ 10.02 s".
- Niveau in het roepvenster (9,75–11 s): koor RMS 0,30 vs. gedimde muziek
  0,12–0,15 → koor ≈ +7 dB.
- Piek na limiter 0,85; envelop: opbouw 0,02–0,06, hit+koor 0,29–0,32, stilte na 11,5 s.
- Playwright (`tests/intro-theme.spec.js`, autoplay toegestaan): thema speelt
  tijdens de intro, geen loop-track actief, na tik Home-loop actief en thema uit,
  geen JS-fouten.
- AAC (m4a) werd níet gedecodeerd door Playwright-Chromium; daarom WAV.

**Alleen met een oor**: of de kinderen "Kwi-ZIL-lo" zeggen zoals jij het wilt
(Leo is een Spaanse stem: "Kwizilla"), en of de balans muziek/koor op een
telefoonspeaker klopt. Variant-clips staan in `build/intro-audio/` (niet in git).
