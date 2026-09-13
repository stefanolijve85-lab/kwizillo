# AUDIT.md — Kwizillo release-candidate audit (Fase 1)

**Branch:** `release/kwizillo-rc1`
**Datum:** 2026-09-13
**Laatste commit bij audit:** `bd1e71b test: cover moodboard world art and restored quiz flow`
**Scope:** alleen analyse. Er is in deze fase **geen applicatiecode gewijzigd, verwijderd of heringericht** en er zijn **geen dependencies geïnstalleerd**.

**Uncommitted werk bij start (niet weggegooid):** `CLAUDE.md`, `CLAUDE_FIRST_PROMPT.txt`, `KWIZILLO_HANDOVER.md` (untracked). Deze blijven staan.

**Wat wel is uitgevoerd:** statische code-inspectie van alle 108 getrackte bestanden, programmatische validatie van de vragenbank, `npm test` (unit), en een draaiende `node server.js` met HTTP-probes tegen `/`, `/api/tts`, `/api/voice-status` en padexposure. `npm run test:ui` (Playwright) kon **niet** draaien: `node_modules/` ontbreekt en installeren was in deze fase niet toegestaan.

---

## 1. Huidige architectuur

### 1.1 Type applicatie
Statische vanilla-JS single-page app zonder build step, bundler, framework of module-systeem. Alles hangt aan één globale namespace `window.KWIZILLO_M1` (`K`). Script-volgorde in `index.html` *is* de architectuur: latere bestanden overschrijven eerdere.

### 1.2 Laadvolgorde (`index.html:9-35`)

CSS, in cascade-volgorde:
```
styles.css → milestone1.css → world-native.css → world-clean.css → moodboard-polish.css → intro-enhance.css
```

JS, in executievolgorde:
```
questions.js → quiz-core-v2.js → m1-runtime.js → world-assets.js → m1-quiz.js
→ quiz-visual-v2.js → intro-v2.js → m1-ui.js → boot-intro.js → intro-enhance.js
```

### 1.3 Verantwoordelijkheden per laag

| Bestand | Rol | Status |
|---|---|---|
| `questions.js` | NL-vragenbank (240), genereert `window.KWIZILLO_QUESTIONS` + `KWIZILLO_TOPICS` | Actief, gezond |
| `quiz-core-v2.js` | Pure logica: shuffle, selectie, speech-segmenten, scoring, cancellation gate. Dual UMD/browser | Actief, enige testbare laag |
| `m1-runtime.js` | State-store, audio-manager (Web Audio muziek + HTMLAudio FX), TTS-client, `K.frame()` renderer | Actief, kern |
| `world-assets.js` | **Overschrijft** `K.MASTER` wereldkunst met externe CloudFront-URL's | Actief, risicovol |
| `m1-quiz.js` | Quiz-render v1 + procedurele SVG-illustraties | **Volledig dood** (zie 3.2) |
| `quiz-visual-v2.js` | Quiz-render v2: herdefinieert `K.startQuiz`, `K.showQuiz`, `K.showResult` | Actief, wint |
| `intro-v2.js` | Monkeypatcht `window.setTimeout` | Actief, fragiel |
| `m1-ui.js` | Home, Wereld, Prestaties, Collectie, Statistieken, Ouderzone, navigatie, progressie | Actief, kern |
| `boot-intro.js` | Roept `K.showHome(true)` aan | Actief, veroorzaakt dubbele render |
| `intro-enhance.js` | Brandt logo in cinematic, verwijdert skip-knop, sound-design timers | Actief, verwijdert functionaliteit |
| `server.js` | Statische fileserver + ElevenLabs-proxy | Actief, dev-only |
| `app.js` | Volledige vorige-generatie app | **Volledig dood**, nergens geladen |

### 1.4 Twee onverenigbare renderparadigma's naast elkaar

Dit is de kern van de technische schuld:

**Paradigma A — screenshot + onzichtbare hotspots** (`m1-ui.js:58-66, 132`)
Een volledige PNG-screenshot mét ingebakken UI wordt als `<img class="master-art">` getoond, met daarbovenop procentueel gepositioneerde onzichtbare `<button class="hotspot">` elementen. Gebruikt op: **Home**.

**Paradigma B — echte DOM-UI** (`m1-ui.js:75-78` `nativeScreen()`, `m1-ui.js:135` `showWorld`, `quiz-visual-v2.js`)
Achtergrondkunst + echte HTML-componenten. Gebruikt op: Wereld, Quiz, Resultaat, Prestaties, Collectie, Statistieken, Ouderzone.

Gevolg: er bestaan **twee bottom-navigatie-implementaties** die naast elkaar leven — `nav()` (`m1-ui.js:64-66`, hotspots op de Home-screenshot) en `bottomNav()` (`m1-ui.js:67-70`, echte DOM). Ze zien er verschillend uit en leven op verschillende schermen.

### 1.5 State
Eén `localStorage`-sleutel: `kwizillo-v4-state` (`m1-runtime.js:7`). Geen schema-versie, geen migratiepad. Twee `sessionStorage`-sleutels voor intro-gating: `kwizillo-intro-v4` (actief) en `kwizillo-intro` (alleen in het dode `app.js`).

### 1.6 Audio
Drie parallelle audiokanalen, allemaal in `m1-runtime.js`:
- **Muziek:** Web Audio `AudioBufferSourceNode`, gapless loop, crossfade, ducking (`m1-runtime.js:9-10`)
- **FX:** `HTMLAudioElement.cloneNode()` per afspeling (`m1-runtime.js:10`)
- **Stem:** Web Audio met RMS-normalisatie + compressor + limiter, plus HTMLAudio-fallback (`m1-runtime.js:15-18`)

Dit is één manager. Positief punt: geen concurrerende managers in de actieve laag.

### 1.7 Backend
`server.js`: Node core `http`, geen dependencies. Twee routes (`/api/tts`, `/api/voice-status`) plus een statische fileserver. Bindt hard op `127.0.0.1` (`server.js:8`).

---

## 2. Daadwerkelijk actieve bestanden

Bewezen actief bij runtime:

```
index.html
questions.js            quiz-core-v2.js       m1-runtime.js
world-assets.js         quiz-visual-v2.js     intro-v2.js
m1-ui.js                boot-intro.js         intro-enhance.js
styles.css              milestone1.css        world-native.css
world-clean.css         moodboard-polish.css  intro-enhance.css
server.js               start.command
assets/home.png                      ← enige PNG die daadwerkelijk gerenderd wordt
assets/audio/*.wav (10 bestanden)    ← allemaal gebruikt
tests/milestone1.test.js             ← draait, groen
tests/ui-smoke.spec.js               ← kan lokaal niet draaien (geen node_modules)
playwright.config.js  package.json  .github/workflows/test.yml
```

Externe runtime-afhankelijkheden (**niet in de repo**, 22 hardcoded URL's):
- 6× wereldkunst → `d8j0ntlcm91z4.cloudfront.net` (`world-assets.js:8-13`)
- 6× vraagillustratie → `d8j0ntlcm91z4.cloudfront.net` (`quiz-visual-v2.js:6-11`)
- 1× intro-video → `d8j0ntlcm91z4.cloudfront.net` (`index.html:23`, `world-assets.js:18`)
- 1× merklogo → `d2ol7oe51mr4n9.cloudfront.net` (`world-assets.js:23`)

---

## 3. Legacy / vermoedelijk ongebruikte bestanden

### 3.1 `app.js` — 40 KB, 100% dood
Niet geladen door `index.html`, niet gerefereerd door tests, server of CI. Bevat een volledige eerdere app: eigen `MASTER`-map, eigen audio-manager, eigen `showSoundSettings` (bijna identiek aan `m1-ui.js:130`), eigen inline vragenbank (`app.js:238`). Definieert overlappende globals (`window.KWIZILLO_CONFIG`, `KWIZILLO_QUESTIONS`, `KWIZILLO_TOPICS`) — zou bij per ongeluk herladen de actieve app corrumperen.
**Verificatie:** `grep -rn "app\.js"` over `index.html`, `tests/`, `.github/`, `playwright.config.js`, `server.js`, `start.command` → geen treffers.

### 3.2 `m1-quiz.js` — 17 KB, 100% gemaskeerd
Exporteert uitsluitend `K.startQuiz` (regel 10), `K.showQuiz` (regel 11) en `K.showResult` (regel 21). Alle drie worden 60 regels later door `quiz-visual-v2.js` (regels 29, 40, 115) overschreven. De interne functies (`render`, `showHint`, `evaluate`, `feedback`, `next`, `art`, `scene`, `kind`, palettes `PAL`/`TOPIC_PROPS`) zijn module-lokaal en daarmee onbereikbaar.
Hiermee is ook de volledige procedurele SVG-illustratiegenerator (`m1-quiz.js:5-7`, ±9 KB) dood.

### 3.3 Ongebruikte assets — ±33 MB
Gedeclareerd in `K.MASTER` maar nooit gerenderd (de schermen gebruiken `nativeScreen()`, geen `master()`):
```
assets/achievements.png  assets/collection.png  assets/stats.png
assets/parent.png        assets/result.png
```
Overschreven door `world-assets.js` en daarmee onbereikbaar:
```
assets/world_space.png     assets/world_animals.png   assets/world_earth.png
assets/world_history.png   assets/world_science.png   assets/world_mystery.png
assets/world_earth_safe.svg
```
Alleen genoemd in de nergens-gelezen array `K.LEGACY_WORLD_MOCKUPS` (`world-assets.js:25-30`):
```
assets/world_space_clean.svg    assets/world_animals_clean.svg
assets/world_earth_clean.svg    assets/world_history_clean.svg
assets/world_science_clean.svg  assets/world_mystery_clean.svg
```
Alleen in `app.js` (dood):
```
assets/quiz_space_master.png  assets/quiz_wrong_master.png  assets/reward_mercury.png
```
Nergens gerefereerd:
```
assets/kwizillo-logo.svg     ← het intro gebruikt in plaats hiervan een CloudFront-URL
```

### 3.4 `.tts-cache/` — 45 mp3's, 2,3 MB, in git
`.gitignore:6` negeert `.tts-cache/`, maar de bestanden zijn vóór die regel gecommit en staan dus nog steeds in de index. Hetzelfde geldt voor `.voice-selection-v35.json` (`.gitignore:7`).

### 3.5 Dode CSS
Selectors voor de markup van het dode `m1-quiz.js`, uitsluitend aanwezig in `styles.css` / `milestone1.css`:
`.quiz-shell`, `.q-top`, `.voice-pill`, `.progress-panel`, `.question-panel`, `.question-title`, `.illustration`, `.illustration img`

### 3.6 Documentatie-drift
`README.md` beschrijft "V3.6" en verwijst naar een download-pad `~/Downloads/kwizillo_v3_2_audio_voice_fixed`. `package.json` zegt `0.4.2`. `index.html:8` zegt "Milestone 1.7 Moodboard Restore". `MILESTONE1.md` en `MILESTONE_1_1_POLISH.md` beschrijven een quiz-implementatie die inmiddels dood is (`m1-quiz.js`).

---

## 4. Gevonden bugs en risico's

### 4.1 Verweesde 90-seconden-timer navigeert de speler weg — **P0, functioneel**

Keten:
1. `m1-ui.js:138` roept bij first-run `K.showHome(true)` aan → `motion()` (`m1-ui.js:79`) rendert video #1 en zet `setTimeout(finish, 4700)`.
2. `intro-v2.js:12-14` heeft `window.setTimeout` gepatcht zodat elke delay van exact `4700` wordt vervangen door **`90000`**.
3. `boot-intro.js:6` roept daarna nogmaals `K.showHome(true)` aan → `K.frame()` wist de DOM en rendert video #2.

Video #1 is nu losgekoppeld. Zijn `onended` vuurt nooit, dus zijn `done`-guard blijft `false` en zijn timer blijft staan. **90 seconden na app-start roept die timer `open()` aan**, wat via `K.frame()` het volledige scherm vervangt door Home — ongeacht of de speler dan midden in een quiz zit. Antwoorden van de lopende quiz gaan verloren.

Twee video-elementen betekenen bovendien twee gelijktijdige downloads en een kort moment met dubbele mediaplayback.

### 4.2 De intro is niet overslaanbaar — **P0, functioneel**

`intro-enhance.js:38` verwijdert `.motion-skip` uit de DOM. Er bestaat geen tap-anywhere-handler: de enige klikbinding in `motion()` (`m1-ui.js:79`) zit op precies die verwijderde knop. Resultaat: de speler kan de cinematic **op geen enkele manier afbreken** en moet wachten tot `video.onended` of `video.onerror`. Als de CloudFront-video traag laadt maar niet faalt, blijft het scherm hangen tot de 90s-timer uit 4.1 hem alsnog doorzet.

Dit is een directe schending van CLAUDE.md §5 ("intro is clickable/tappable anywhere to continue", "no required start button").

### 4.3 Nul internationalisatie — **P0, scope**

CLAUDE.md §13 en de handover gaan uit van NL + EN. De werkelijkheid:
- Geen `language`-veld in de state (`m1-runtime.js:7`).
- Geen taalkeuzescherm, nergens.
- Geen enkele vertaalstructuur, `i18n`-map of string-tabel in de actieve code.
- **Alle** UI-strings zijn hardcoded Nederlands: wereldnamen (`m1-ui.js:5-12`), navigatielabels (`m1-ui.js:68`), prestaties (`m1-ui.js:86-91`), instellingen (`m1-ui.js:121`), quizteksten (`quiz-visual-v2.js:56-64`), feedback (`quiz-visual-v2.js:107`).
- Feedback-spraak is hardcoded Nederlands in de core: `"Goed gedaan."`, `"Bijna goed."`, `"Wist je dat?"` (`quiz-core-v2.js:7`).
- **De Engelse vragenbank bestaat niet.** `questions.js` bevat uitsluitend Nederlands; er is geen `lang`/`locale`-veld op enige vraag (programmatisch geverifieerd).
- `server.js:176` zet `language_code:'nl'` **hardcoded** in elke TTS-aanroep. Engelse spraak is technisch onmogelijk zonder serverwijziging.

De claim van "240 EN vragen" in de handover is **niet waar** voor deze repository.

### 4.4 Onboarding-flow ontbreekt volledig — **P0, scope**

CLAUDE.md §4 stappen 4 t/m 8 (first-run onboarding → taalkeuze → naam invoeren → stemkeuze → welkom) bestaan niet. Er is geen enkel `<input>`-element in de actieve code. De state kent geen `name` en geen `onboardingComplete`. De app springt na de cinematic direct naar Home.

### 4.5 Statische server exposeert de volledige projectmap — **P0, security**

`server.js:214-221` resolvet elk pad onder `ROOT` en serveert het. Pathtraversal *is* geblokkeerd (`server.js:216`), maar dotfiles en broncode zijn dat niet. Live geverifieerd tegen de draaiende server:

| Verzoek | Resultaat |
|---|---|
| `GET /.git/config` | **200** — volledige git-config |
| `GET /.voice-selection-v35.json` | **200** — voice-ID's en metadata |
| `GET /server.js` | **200** — volledige serverbroncode |
| `GET /../../etc/passwd` | 404 (correct geblokkeerd) |

`.gitignore:2-3` anticipeert expliciet op een `.env`-bestand. Zodra iemand er één aanmaakt met `ELEVENLABS_API_KEY=...`, is **`GET /.env` een 200 met de geheime sleutel erin** — bereikbaar voor iedereen op hetzelfde netwerk zodra de server niet meer op loopback draait. De handover beschrijft precies dat LAN-scenario (`http://192.168.x.x:8080`).

Aanvullend: `/.git/` serveren maakt volledige repo-reconstructie mogelijk, inclusief de complete commit-historie.

### 4.6 TTS-proxy is ongelimiteerd en lekt upstream-fouten — **P1, security**

`server.js:199-212`:
- Geen rate limiting, geen authenticatie, geen origin-check. Elke POST met willekeurige tekst (tot 2500 tekens) verbruikt ElevenLabs-credits.
- Geen timeout op de upstream `fetch` (`server.js:172`). Een hangende ElevenLabs-verbinding houdt de requesthandler onbeperkt open.
- `server.js:211` stuurt `e.message` rechtstreeks naar de client. Die message bevat via `server.js:182` letterlijk de eerste 260 tekens van het ElevenLabs-antwoord — een upstream error-lek.
- Cachebestanden worden zonder groottelimiet in de repo-map geschreven (`server.js:185`).

CLAUDE.md §9 eist expliciet rate limiting, request validation, timeouts en safe error handling. Geen daarvan is aanwezig.

**Positief en bevestigd:** er staat **geen enkele API-key** in frontend-code, assets, config of git-historie. De sleutel komt uitsluitend uit `process.env.ELEVENLABS_API_KEY` (`server.js:9`), interactief ingelezen door `start.command:8`. Dit deel is correct.

### 4.7 Luna is Vlaams — **P0, product**

`.voice-selection-v35.json` (in git gecommit) legt de huidige stemselectie vast:
```json
"Luna": { "voice_id": "wwW0aOSbbYgXMec1zRTp", "accent": "flemish", "native_nl": true }
```
De handover noemt "Luna Vlaams/Belgisch in plaats van Nederlands-Nederlands" als expliciet afgewezen. De scoringlogica in `server.js:57-69` beloont `isDutchVoice()` maar **straft `accent: "flemish"` niet af**, dus de selectie reproduceert zichzelf. Het bestand wordt bovendien als "saved" hergebruikt (`server.js:123-127`) waardoor een nieuwe selectie nooit plaatsvindt.

### 4.8 TTS zegt "Antwoord A" — **P1, product**

`quiz-core-v2.js:5` bouwt elk antwoordsegment als:
```js
text: `Antwoord ${labels[i]}: ${o}.`
```
CLAUDE.md §9 zegt letterlijk: *"Do not say 'Antwoord A' / 'Answer A' unless explicitly requested."* De handover herhaalt het.

Let op: `tests/milestone1.test.js` **assert deze string expliciet**. Het gedrag is dus in de tests vastgelegd; Fase 2 moet code én test tegelijk aanpassen.

Er is daarnaast geen ingebouwde pauze tussen segmenten — de segmenten worden strak achter elkaar afgespeeld (`m1-runtime.js:20`), zonder de door §9 gevraagde korte stiltes.

### 4.9 "Nog een quiz" opent geen Quiz 2 — **P0, gameplay**

`quiz-visual-v2.js:120` roept bij "Nog een quiz" simpelweg `K.startQuiz()` opnieuw aan. `selectQuestions()` (`quiz-core-v2.js:4`) shuffelt de hele pool zonder enige herinnering aan eerder getoonde vragen. Er is:
- geen quiznummer in de state,
- geen bijhouden van gebruikte vraag-ID's per wereld/topic,
- geen "4 unieke batches daarna reshuffle"-logica.

Bij een gemengde wereldquiz (40 vragen, batch van 10) is de kans op herhaalde vragen in quiz 2 aanzienlijk. Bij een topicquiz (exact 10 vragen) is quiz 2 **gegarandeerd dezelfde 10 vragen**, alleen anders geschud. Dit is precies het probleem dat de handover als "opgelost" wilde zien.

De UI belooft dit bovendien onterecht: `m1-ui.js:135` toont bij elk topic hard `"10 vragen"` — maar er staat geen quiznummer in de quiz-header (`quiz-visual-v2.js:59` toont alleen "Vraag X van Y").

### 4.10 Nepvoortgang bij een nieuwe speler — **P1, product**

`m1-runtime.js:7`:
```js
const initial={coins:245,streak:7,level:5,xp:320, ...}
```
Een kind dat de app voor het eerst opent, ziet meteen 245 coins, 320 XP, level 5 en een streak van 7 dagen. Gevolg: de prestatie **"🔥 7 dagen op rij"** (`m1-ui.js:89`) is bij eerste start al behaald zonder ooit gespeeld te hebben. CLAUDE.md §12 eist dat prestaties op echte state gebaseerd zijn.

`streak` en `level` worden nergens in de actieve code opgehoogd — er is geen datumlogica en geen levelberekening. Beide zijn permanent statisch.

### 4.11 Vraagillustraties zijn niet vraagspecifiek — **P1, visueel**

`quiz-visual-v2.js:15-25`: er bestaan exact **6** vraagillustraties (`space`, `body`, `dissolve`, `light`, `lab`, `castle`) voor **240** vragen. `artKind()` matcht op regex; matcht niets, dan valt `questionArt()` terug op `K.MASTER[q.world]` — **dezelfde afbeelding als de achtergrond van hetzelfde scherm** (`quiz-visual-v2.js:51` gebruikt `K.MASTER[q.world]` als `.quiz-v2-bg`).

Gevolg: voor het overgrote deel van de vragen staat de wereldachtergrond zowel wazig op de achtergrond als scherp in het illustratiekader. Geen enkele vraag heeft een `imageAsset` (programmatisch geverifieerd: 0 van 240). CLAUDE.md §8 verbiedt expliciet "a random world image".

### 4.12 Home is een screenshot met ingebakken UI — **P0, visueel**

`m1-ui.js:132` rendert `assets/home.png` (2,4 MB) als volledige screenshot en legt er 15 onzichtbare hotspots overheen. Het hardste bewijs dat de PNG echte UI bevat, staat in de code zelf:

```js
// m1-ui.js:80
if(K.state.voice!=='Milo'){ const m=document.createElement('div');
  m.className='milo-baked-check-mask'; f.appendChild(m) }
```
Er wordt een CSS-masker over de afbeelding gelegd om een **ingebakken vinkje bij Milo** af te dekken, plus drie `.voice-choice-frame` overlays om een selectierand na te bootsen (`m1-ui.js:80`). Dit is exact wat CLAUDE.md harde regel 6 verbiedt.

Gevolgen: coins/streak/level/spelernaam op Home zijn **niet dynamisch** (ze zitten in de pixels), de hotspot-coördinaten zijn hardcoded percentages die alleen kloppen bij de aspect-ratio van die ene PNG, en er is geen enkele tekst op Home vertaalbaar.

### 4.13 Geen safe-area-ondersteuning — **P0, iOS**

`index.html:5` zet `viewport-fit=cover`, wat betekent dat de app tot onder de Dynamic Island en over de home-indicator heen tekent. Er is echter **nul gebruik van `env(safe-area-inset-*)`** in alle zes CSS-bestanden (geverifieerd). De bottom-navigatie (`m1-ui.js:69`) en de hotspot-navigatiebalk op 91,3% hoogte (`m1-ui.js:65`) komen daarmee op iPhone onder de home-indicator te liggen.

`.game-frame` heeft bovendien twee conflicterende definities in `styles.css`: een letterbox-variant met `aspect-ratio:941/1672` en een full-viewport-override met `aspect-ratio:auto`. Welke wint hangt af van een media query — dat moet expliciet worden.

### 4.14 Volledige kunstlaag hangt aan een externe CDN — **P0, iOS/TestFlight**

22 hardcoded CloudFront-URL's onder een generatiepad (`.../user_2yYu0y6DQa27eWwkUPG52d9yApj/hf_20260912_...`). Dit zijn output-URL's van een generatiedienst, geen eigen infrastructuur. Risico's:
- Geen enkele garantie op levensduur of stabiliteit.
- De app is **onbruikbaar zonder internet** — voor een kinderapp die in de auto of op school gebruikt wordt is dat een echt product-probleem, niet alleen een technisch.
- Bij App Review met een trage of geblokkeerde verbinding toont de app lege schermen.
- `tests/ui-smoke.spec.js:4-9` assert **op de CloudFront-bestandsnamen**, dus de testsuite faalt zodra de kunst lokaal wordt gemaakt of de URL's wijzigen.
- Er is geen `onerror`-fallback op enige `<img>`; een mislukte load geeft een kapot afbeeldingsicoon.

### 4.15 Monkeypatch op `window.setTimeout` — **P1, engineering**

`intro-v2.js:12-14` vervangt globaal `window.setTimeout` om één specifieke delay-waarde (`4700`) te onderscheppen, en herstelt hem in een `setTimeout(...,0)`. Dit werkt alleen omdat `m1-ui.js` en `boot-intro.js` synchroon tijdens script-parsing draaien. Elke herordening van scripts, elke async-conversie of elke andere plek die toevallig 4700 ms gebruikt, breekt of wordt gebroken. Dit is de fragielste constructie in de codebase.

### 4.16 Niet-ontkoppelde MutationObserver — **P2, performance**

`intro-enhance.js:69-70` zet een `MutationObserver` op `K.app` met `{childList:true, subtree:true}` die nooit `disconnect()` krijgt. Bij elke DOM-mutatie in de hele app (elke quizvraag, elke navigatie, elke feedbackpopup) draait `enhance()` opnieuw. De `dataset.enhanced`-guard voorkomt dubbel werk, maar de observer zelf blijft de volledige app-lifetime actief.

### 4.17 `K.showResult` is drie keer gedefinieerd — **P1, engineering**

Volgorde: `m1-quiz.js:21` definieert → `quiz-visual-v2.js:115` overschrijft → `m1-ui.js:52-56` wrapt de dan geldende versie via monkeypatch om `worldStat().quizzes` op te hogen. Werkt, maar uitsluitend door toeval van de scriptvolgorde in `index.html`. Hetzelfde geldt voor `K.startQuiz` (2×) en `K.showQuiz` (2×).

### 4.18 Voortgangsregistratie via een document-brede click-listener — **P1, engineering**

`m1-ui.js:38-51` registreert een listener op `document` die elke `.answer`-klik onderschept om wereld-/topicstatistieken bij te werken. De hoofdscore wordt ondertussen ergens anders bijgehouden (`quiz-visual-v2.js:97-99`). Twee losgekoppelde tellers voor dezelfde gebeurtenis, met eigen guards (`_progressRecorded` vs. `session.answeredById`). Ze kunnen uit de pas raken zodra één pad wijzigt.

### 4.19 "Andere vraag" slaat vragen over zonder gevolg — **P2, gameplay**

`quiz-visual-v2.js:73` laat `#skipBtn` direct `next()` aanroepen. De vraag wordt niet geregistreerd, niet vervangen en telt niet mee. Een speler kan tien keer skippen en komt met 0/10 op het resultaatscherm. De knoptekst suggereert "een andere vraag krijgen", maar de vraag wordt niet vervangen. CLAUDE.md noemt deze knop optioneel — de beslissing om hem te houden of te schrappen is een productkeuze.

### 4.20 CSS-overridestapeling — **P1, engineering**

**43 selectors zijn in meer dan één CSS-bestand gedefinieerd.** De zwaarste gevallen staan in drie bestanden tegelijk:
```
.native-world-bg, .native-world-shade, .world-title-wrap h1, .world-title-wrap p,
.world-topic-grid, .world-topic, .world-mix, .native-bottom-nav
    → world-native.css + world-clean.css + moodboard-polish.css
```
`world-clean.css` en `moodboard-polish.css` zijn in de praktijk patchlagen bovenop `world-native.css`. Dit is precies het patroon dat CLAUDE.md harde regel 7 verbiedt.

### 4.21 Privacy-tekst dekt de lading niet — **P1, App Store**

`m1-ui.js:117` toont: *"Kwizillo bewaart deze prototype-voortgang lokaal op dit apparaat. Er zijn geen advertenties en de ElevenLabs-sleutel blijft op de lokale server."*

Dit klopt vandaag, maar zodra er een productie-backend komt gaat vraagtekst wél naar een derde partij (ElevenLabs). Voor de Kids Category is een echte privacy policy vereist, geen modal met de tekst "prototype". Er is geen parental gate.

Positief: er wordt op dit moment **geen kindernaam** naar ElevenLabs gestuurd, simpelweg omdat er geen naaminvoer bestaat (4.4). Bij het bouwen van de onboarding moet dat expliciet zo blijven — CLAUDE.md §9 schrijft een generieke gesproken welkomsttekst voor.

### 4.22 CI draait niet op deze branch — **P2, proces**

`.github/workflows/test.yml:5-7` triggert alleen op push naar `develop` en PR's naar `main`. Commits op `release/kwizillo-rc1` draaien geen tests.

### 4.23 Server bindt op loopback — **P2, dev**

`server.js:8` zet `HOST = '127.0.0.1'` hardcoded. De handover beschrijft iPhone-tests via `http://192.168.x.x:8080`. Met deze binding werkt dat niet. Dit betekent dat de beschreven LAN-testopstelling op dit moment niet reproduceerbaar is zonder codewijziging. (Let op de samenhang met 4.5: zodra deze binding verruimd wordt, wordt de fileserver-exposure een netwerk-bereikbaar lek.)

---

## 5. Wat veilig verwijderd of samengevoegd kan worden

### 5.1 Veilig te verwijderen — verificatie afgerond

| Item | Omvang | Bewijs |
|---|---|---|
| `app.js` | 40 KB | Niet geladen door `index.html`, tests, CI, server of start-script |
| `m1-quiz.js` | 17 KB | Alle drie exports overschreven door `quiz-visual-v2.js`; interne functies module-lokaal |
| Dode CSS in `styles.css`/`milestone1.css` | — | `.quiz-shell`, `.q-top`, `.voice-pill`, `.progress-panel`, `.question-panel`, `.question-title`, `.illustration` horen bij `m1-quiz.js` |
| `.tts-cache/*.mp3` uit git-index | 2,3 MB | Al genegeerd door `.gitignore:6`; regenereert zichzelf; **bestanden op schijf laten staan** |
| `.voice-selection-v35.json` uit git-index | — | Al genegeerd door `.gitignore:7`; runtime state, geen broncode |
| `assets/quiz_space_master.png`, `quiz_wrong_master.png`, `reward_mercury.png` | 6,8 MB | Alleen in `app.js` |
| `assets/*_clean.svg` (6×) | 17 KB | Alleen in de nergens-gelezen `K.LEGACY_WORLD_MOCKUPS` |

**Subtotaal: ±9 MB en 57 KB dode JS, met volledige zekerheid.**

### 5.2 Verwijderbaar, maar pas ná een vervangingsbesluit

| Item | Omvang | Afhankelijkheid |
|---|---|---|
| `assets/achievements.png`, `collection.png`, `stats.png`, `parent.png`, `result.png` | 11,2 MB | Runtime ongebruikt, maar dit zijn de **designreferenties** voor die schermen. Vraag: archiveren in `docs/` of weggooien? |
| `assets/world_*.png` (6×) | 15,9 MB | Overschreven door CloudFront. **Dit zijn de enige wereldkunst-bestanden die je daadwerkelijk bezit.** Zie 6.2 — mogelijk juist de basis voor de lokale kunstlaag. Niet weggooien voor die keuze gemaakt is. |
| `assets/world_earth_safe.svg` | 2,6 KB | Runtime ongebruikt, maar `tests/milestone1.test.js` assert er expliciet op |
| `assets/kwizillo-logo.svg` | 2 KB | Ongebruikt, maar het intro gebruikt nu een CloudFront-logo — dit lokale bestand is waarschijnlijk juist de oplossing |
| `assets/home.png` | 2,4 MB | Nu actief. Verdwijnt pas als Home echte DOM-UI wordt (6.1) |

### 5.3 Samen te voegen

| Nu | Doel |
|---|---|
| `world-native.css` + `world-clean.css` + `moodboard-polish.css` | Eén `world.css`; los de 43 dubbele selectors op door de laatst-winnende waarde als enige waarde te nemen |
| `styles.css` + `milestone1.css` | Eén `base.css` + design tokens |
| `intro-v2.js` + `boot-intro.js` + `intro-enhance.js` | Eén `intro.js` met een expliciete state machine; hiermee verdwijnen 4.1, 4.2, 4.15 en 4.16 in één klap |
| `m1-runtime.js` audio + TTS | Splitsen in `audio.js` en `tts.js`; de logica is gezond, alleen samengepakt |
| `K.showResult` ×3, `K.startQuiz` ×2, `K.showQuiz` ×2 | Eén definitie per functie, geen monkeypatch-wrappers |
| `m1-ui.js:38-51` document-listener + `quiz-visual-v2.js:97-99` | Eén `recordAnswer()` die alle tellers tegelijk bijwerkt |

---

## 6. Aanbevolen architectuur voor de release candidate

Geen framework, geen build step — dat past bij het project en houdt de Capacitor-stap simpel. Wel expliciete modules en één definitie per verantwoordelijkheid.

```
index.html                  één entry point, geen versienummer in de <title>

/src
  core/
    state.js                één store, schemaversie + migratie
    i18n.js                 t(key, params), taalwissel zonder herladen
    router.js               één plek die bepaalt welk scherm actief is
  data/
    questions.nl.js         240 NL (bestaand, ongewijzigd)
    questions.en.js         240 EN (NIEUW — bestaat nog niet)
    topics.js               wereld/topic-metadata, vertaalbaar
  audio/
    audio.js                muziek + FX (uit m1-runtime.js)
    tts.js                  spraakclient + cancellation gate
  screens/
    intro.js                één state machine, tap-to-skip, geen setTimeout-patch
    onboarding.js           NIEUW — taal → naam → stem → welkom
    home.js                 NIEUW — echte DOM, geen screenshot
    world.js                uit m1-ui.js:135
    quiz.js                 uit quiz-visual-v2.js
    result.js               met quiznummer
    collection.js           uit m1-ui.js:97
    achievements.js         uit m1-ui.js:82
    stats.js                uit m1-ui.js:111
    settings.js             uit m1-ui.js:119 + 130
  ui/
    nav.js                  ÉÉN bottom-nav, overal dezelfde
    components.js           knop, kaart, modal, toast

/styles
  tokens.css                kleuren, radii, schaduwen, typografie
  base.css                  reset, layout, safe-areas
  screens.css               per-scherm, geen overrides

/assets                     lokaal; geen externe CDN in de runtime

/server                     productie-backend (apart deploybaar)
```

### 6.1 Home moet echte UI worden
Dit is de enige manier om 4.12, 4.3 en 4.10 tegelijk op te lossen. Zolang Home een screenshot is, kunnen coins, streak, naam en level niet dynamisch zijn en kan Home niet vertaald worden. Aanpak: gebruik de bestaande wereldkunst als achtergrondlaag en bouw de HUD als DOM — exact het patroon dat `showWorld` (`m1-ui.js:135`) al met succes toepast. Die functie is het referentiepatroon; het bestaat al en werkt.

### 6.2 Kunst lokaal maken
Download de 22 CloudFront-assets één keer naar `/assets`, comprimeer ze (de huidige PNG's zijn 2–2,7 MB per stuk; als WebP op de juiste resolutie moet dat richting 150–300 KB kunnen) en verwijder alle externe URL's uit de runtime. Dit lost 4.14 op en maakt de app offline speelbaar. Herzie daarna `tests/ui-smoke.spec.js:4-9`, die nu op CloudFront-bestandsnamen assert.

### 6.3 State-schema
```js
{
  schemaVersion: 2,
  language: 'nl' | 'en',
  name: string,
  onboardingComplete: boolean,
  voice: 'Milo' | 'Luna' | 'Stil',
  group: 1-8,
  xp: 0, coins: 0, level: 1,
  streak: { count: 0, lastPlayedDate: null },   // echte datumlogica
  progress: {
    worlds: { [world]: { answered, correct, quizzes, xp } },
    topics: { [topic]: { answered, correct } },
    quizRuns: { [world|topic]: { quizNumber, usedQuestionIds: [] } },  // lost 4.9 op
    correctQuestionIds: []
  },
  collection: { mascots: [], selectedMascot: 'milo' },
  audio: { musicOn, sfxOn, musicVolume, sfxVolume, musicTrack }
}
```
Migratie vanaf `kwizillo-v4-state`: alle nieuwe velden krijgen defaults, `coins`/`xp`/`streak` van bestaande testers blijven behouden. Nieuwe spelers starten op nul (lost 4.10 op).

### 6.4 Productie-backend
De huidige `server.js` moet worden opgesplitst. De statische app hoort op een CDN/static host; de TTS-proxy wordt een aparte HTTPS-service met:
- ElevenLabs-sleutel uit een secret store
- rate limiting per IP en per sessie
- **allowlist-validatie**: accepteer geen vrije tekst, maar alleen tekst die overeenkomt met de bekende vragenbank + een vaste set UI-zinnen. Dit sluit misbruik structureel uit in plaats van het af te remmen.
- `language_code` uit de request (`nl` of `en`) in plaats van hardcoded (`server.js:176`)
- upstream-timeout, en generieke foutmeldingen naar de client
- gedeelde cache, niet in de repo-map
- **geen** kindernaam in de payload

Infrastructuurkeuze (Render / Railway / Cloudflare / Vercel) is een aparte beslissing; de handover vraagt dat expliciet eerst te bespreken.

---

## 7. Prioriteiten

### P0 — blokkeert de release candidate

| # | Bevinding | Waarom blokkerend |
|---|---|---|
| 4.3 | Nul i18n, geen EN-vragenbank | Halve productscope ontbreekt |
| 4.4 | Onboarding ontbreekt volledig | CLAUDE.md §4 stappen 4–8 |
| 4.5 | Server serveert `.git`, `.env`, broncode | Sleutellek zodra LAN-testen hervat wordt |
| 4.1 | Verweesde 90s-timer gooit speler uit de quiz | Datavernietigend in normale flow |
| 4.2 | Intro niet overslaanbaar | Directe schending §5; potentieel vastlopend scherm |
| 4.7 | Luna is Vlaams | Expliciet afgewezen door gebruiker |
| 4.9 | "Nog een quiz" herhaalt dezelfde vragen | Kernloop-belofte niet waargemaakt |
| 4.12 | Home = screenshot met ingebakken UI | Harde regel 6; blokkeert i18n + dynamische HUD |
| 4.13 | Geen safe-area-ondersteuning | Onbruikbaar op moderne iPhone |
| 4.14 | Kunstlaag op externe CDN | Geen offline gebruik; App Review-risico |

### P1 — moet vóór TestFlight

4.6 TTS-proxy ongelimiteerd · 4.8 "Antwoord A" + ontbrekende pauzes · 4.10 nepvoortgang bij nieuwe speler · 4.11 vraagillustraties niet vraagspecifiek · 4.15 `setTimeout`-monkeypatch · 4.17 drievoudige `showResult` · 4.18 losgekoppelde voortgangstellers · 4.20 43 dubbele CSS-selectors · 4.21 privacy-tekst + parental gate

### P2 — opruimen en netheid

4.16 niet-ontkoppelde MutationObserver · 4.19 "Andere vraag" zonder gevolg · 4.22 CI draait niet op deze branch · 4.23 server op loopback · documentatiedrift (3.6) · ±33 MB ongebruikte assets · `.tts-cache` in git

---

## 8. Voorstel voor Fase 2

Fase 2 in CLAUDE.md §18 is *cleanup* — geen herontwerp. Het voorstel houdt zich daaraan en splitst in vier commits, elk apart te reviewen. **Geen enkele stap verandert zichtbaar gedrag**, behalve waar het een bug wegneemt.

### Stap 2.1 — Dode code verwijderen
Verwijderen: `app.js`, `m1-quiz.js`, de dode CSS-selectors uit 5.1, en de drie `app.js`-only assets. `.tts-cache/*.mp3` en `.voice-selection-v35.json` uit de git-index halen met `git rm --cached` (bestanden blijven op schijf staan).
*Verwacht:* −57 KB JS, −6,8 MB assets, −2,3 MB git.
*Verificatie:* `npm test` groen; app handmatig doorlopen; console leeg.

### Stap 2.2 — Intro-laag consolideren
`intro-v2.js`, `boot-intro.js` en `intro-enhance.js` samenvoegen tot één `intro.js` met een expliciete state machine. Dit verwijdert de `setTimeout`-monkeypatch (4.15), de dubbele `showHome(true)`-aanroep en daarmee de verweesde 90s-timer (4.1), herstelt tap-anywhere-to-skip (4.2) en ontkoppelt de MutationObserver (4.16).
*Dit is de hoogste waarde-per-regel in de hele fase: vier bevindingen, waarvan twee P0, in één module.*

### Stap 2.3 — Server dichttimmeren
In `server.js` een expliciete allowlist voor statische bestanden (extensie- én padgebaseerd), zodat dotfiles, `.git/`, `.tts-cache/` en `*.js` in de root niet meer geserveerd worden. Plus een upstream-timeout en generieke foutmeldingen richting client.
*Verificatie:* de probes uit 4.5 opnieuw draaien — `/.git/config` en `/.voice-selection-v35.json` moeten 403/404 geven, `/` en `/assets/*` moeten 200 blijven.

### Stap 2.4 — CSS consolideren
`world-native.css` + `world-clean.css` + `moodboard-polish.css` → één `world.css`; `styles.css` + `milestone1.css` → één `base.css`. De 43 dubbele selectors worden opgelost door per selector de laatst-winnende waarde als enige waarde te behouden. `.game-frame` krijgt één eenduidige definitie.
*Verificatie:* screenshot-vergelijking vóór/na per scherm; de cascade mag niets zichtbaar veranderen.

### Wat Fase 2 expliciet **niet** doet
i18n, EN-vragenbank, onboarding, Home-herbouw, quiznummering, lokale kunst en de productie-backend zijn Fase 3+. Ze staan hier alleen als geregistreerde P0's.

### Beslissingen die jouw goedkeuring nodig hebben vóór Fase 2

1. **`assets/world_*.png` (15,9 MB)** — weggooien, of juist gebruiken als basis voor de lokale kunstlaag (6.2)? Ik gooi deze niet weg zonder jouw akkoord; het is de enige wereldkunst die je daadwerkelijk bezit.
2. **`assets/achievements.png`, `collection.png`, `stats.png`, `parent.png`, `result.png` (11,2 MB)** — weggooien of archiveren in `docs/` als designreferentie?
3. **`.tts-cache` uit git** — akkoord met `git rm --cached` (bestanden blijven lokaal staan)?
4. **`MILESTONE1.md` / `MILESTONE_1_1_POLISH.md`** — beschrijven het inmiddels dode `m1-quiz.js`. Bijwerken, archiveren of laten staan als historie?
5. **"Andere vraag"-knop (4.19)** — behouden en echt laten werken, of schrappen?

---

## Bijlage A — Validatie van de vragenbank

Programmatisch uitgevoerd tegen `questions.js`:

| Controle | Verwacht | Werkelijk | |
|---|---|---|---|
| Totaal aantal vragen NL | 240 | **240** | ✅ |
| Werelden | 6 | **6** | ✅ |
| Vragen per wereld | 40 | **40 × 6** | ✅ |
| Topics | 24 | **24** | ✅ |
| Vragen per topic | 10 | **10 × 24** | ✅ |
| Unieke ID's | alle | **0 duplicaten** | ✅ |
| Precies 4 antwoorden | alle | **240/240** | ✅ |
| Correct antwoord in opties | alle | **240/240** | ✅ |
| Dubbele optietekst binnen vraag | 0 | **0** | ✅ |
| Dubbele vraagteksten | 0 | **0** | ✅ |
| `hint` aanwezig | alle | **240/240** | ✅ |
| `explanation` aanwezig | alle | **240/240** | ✅ |
| `fact` aanwezig | alle | **240/240** | ✅ |
| Groepsmetadata geldig | alle | **2–8 / 3–8 / 4–8** | ✅ |
| **Totaal aantal vragen EN** | **240** | **0** | ❌ |
| **Taalveld op vraag** | aanwezig | **geen** | ❌ |
| **`imageAsset` per vraag** | vraagspecifiek | **0 van 240** | ❌ |

De Nederlandse vragenbank is structureel in uitstekende staat en heeft geen opschoning nodig. Een inhoudelijke steekproef op feitelijke juistheid en leeftijdsgeschiktheid is nog niet uitgevoerd — dat hoort bij Fase 5.

## Bijlage B — Uitgevoerde en niet-uitgevoerde controles

**Uitgevoerd:** structuurinventarisatie (108 getrackte bestanden) · `package.json`/`playwright.config.js`/CI-workflow gelezen · alle actieve JS regel voor regel gelezen · alle 6 CSS-bestanden geanalyseerd op dubbele selectors · `server.js` volledig gelezen · vragenbank programmatisch gevalideerd · asset-referentiecontrole per bestand · secret-scan over werkbestanden **én** volledige git-historie · live HTTP-probes tegen de draaiende server · `npm test` (groen).

**Niet uitgevoerd, met reden:**
- `npm run test:ui` (Playwright) — `node_modules/` ontbreekt; installeren was in deze fase niet toegestaan. De 5 UI-tests zijn **niet** geverifieerd.
- Visuele QA op echte iPhone-viewports — Fase 3.
- Live ElevenLabs-spraaktest NL/EN — vereist een geldige API-key; Fase 4.
- Inhoudelijke feitencontrole van de 240 vragen — Fase 5.
- Capacitor/Xcode-build — Fase 6.

**Bevestigd veilig:** geen enkele API-key of credential in frontend-code, assets, config of git-historie. De ElevenLabs-sleutel komt uitsluitend uit `process.env` (`server.js:9`), interactief ingelezen (`start.command:8`). De bestaande sleutelhygiëne is correct — het risico zit uitsluitend in de fileserver-exposure (4.5).
