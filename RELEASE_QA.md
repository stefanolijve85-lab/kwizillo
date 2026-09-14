# RELEASE_QA.md — Kwizillo release candidate

**Branch:** `release/kwizillo-rc1`
**Datum:** 2026-09-13
**Versie:** `0.5.0`

Dit document beschrijft wat is getest, hoe, en wat er nog openstaat. Onopgeloste
zaken staan er expliciet in; er is niets weggelaten omdat het slecht uitkwam.

---

## 1. Geautomatiseerde tests

| Suite | Wat | Resultaat |
|---|---|---|
| `tests/questions.test.js` | Beide vragenbanken: aantallen, structuur, integriteit, kruistaal-pariteit | ✅ 240 NL / 240 EN |
| `tests/core.test.js` | Batching, spraaksegmenten, feedback-copy, state-regels, geen hardcoded copy | ✅ |
| `tests/server-static.test.js` | Statische allowlist, `.env`-exposure, TTS-foutafhandeling | ✅ |
| `tests/intro.spec.js` | Cinematic: één keer opgebouwd, skipbaar, geen weesTimers, geen monkeypatch | ✅ 6 tests |
| `tests/ui-smoke.spec.js` | Volledige speelflow, i18n, persistentie, storingsgedrag, iPhone-layouts | ✅ 19 tests |

`npm test` en `npm run test:ui` — **25 browsertests en 3 unit-suites, alles groen.**

---

## 2. Geteste flows

### Eerste start
- Cinematic start automatisch, is overslaanbaar met de knop **en** door ergens te tappen.
- Onboarding: taal → naam → stem → welkom. Verschijnt precies één keer.
- De **naam van het kind wordt niet naar ElevenLabs gestuurd.** Op het scherm staat "Welkom, Mike!", de gesproken tekst is generiek.
- Een nieuwe speler start op 0 XP, 0 coins, 0 streak, level 1 en **nul behaalde prestaties**.

### Spelen
- Alle zes werelden openen, elk met vier onderwerpen en een gemengde quiz.
- Quiz 1 en quiz 2 van dezelfde wereld delen **geen enkele vraag** (geverifieerd op alle 20 vragen).
- Vier quizzen dekken alle 40 wereldvragen precies één keer; pas daarna herstart de cyclus.
- Een onderwerp met 10 vragen recyclet noodzakelijk, en meldt dat in plaats van het te verbergen.
- Resultaatknop leest "Start quiz 2", "Start quiz 3" enzovoort.
- Hint opent en sluit, feedback toont uitleg plus weetje, voortgangsbalk telt correct.
- Een tweede tik op hetzelfde antwoord wordt genegeerd; alle tegels worden uitgeschakeld.
- "Andere vraag" wisselt echt een ongebruikte vraag in; bij een uitgeputte pool is de knop uitgeschakeld met uitleg.

### Taal
- Wisselen op Home of in de Ouderzone vertaalt navigatie, wereldnamen, onderwerpen, quizteksten, feedback, prestaties, collectie, statistieken en instellingen.
- De **vragenbank wisselt mee**: Engelse vragen, antwoorden, hints, uitleg en weetjes.
- De layout verandert niet mee — dezelfde structuur voor beide talen.
- Voortgang en verzamelde kaarten overleven de wissel, omdat beide banken dezelfde vraag-ID's gebruiken.

### Voortgang
- XP, coins, streak, per-wereld- en per-onderwerpstatistieken komen uit echt spel.
- Streak is gebaseerd op werkelijke speeldata: zelfde dag telt niet dubbel, gisteren verlengt, ouder herstart.
- Level is afgeleid van XP en kan dus niet uit de pas lopen.
- Alles overleeft een herlaad; onboarding komt niet terug.

### Storingsgedrag
- **Geen spraak-backend:** de app blijft volledig speelbaar. Na de eerste 503 stopt de client met vragen in plaats van per vraag een mislukt verzoek te doen.
- **Snel tikken en navigeren tijdens een quiz:** geen JS-fouten, geen dubbele feedback.
- **Geen netwerk:** alle kunst is lokaal, dus werelden, quiz en illustraties werken offline. Alleen de stem valt weg.

### Vraagillustraties
- Elk van de 24 onderwerpen heeft een eigen 16:9 illustratie; **geen enkele vraag
  valt nog terug op de wereldachtergrond** (was 60%).
- Vier onderwerpen hergebruiken bestaande subject-kunst (sterren & planeten, ridders,
  slimme proefjes, het lichaam); twintig zijn nieuw gegenereerd in de moodboard-stijl.
- Daarbovenop kiest een subject-matcher op vraagtekst een nog preciezere afbeelding
  voor oplos-, schaduw-, lichaams- en riddervragen.
- Geen tekst, cijfers of UI in enige illustratie; geen personages, dus geen
  inconsistente Milo. Een test bewaakt dekking én verkeerde matches.
- Een eerdere versie van de matcher stuurde Engelse vragen over "long legs" en
  "nautical chart" naar de anatomie-illustratie, omdat het Nederlandse `long` en
  `hart` als deelstring matchten. Nu woordgrens-gebonden en getest.

### Apparaatformaten
Getest op iPhone SE (375×667), iPhone 14 (390×844) en Pro Max (430×932):
- geen horizontale overflow op Home, wereld of quiz
- elke antwoordtegel minstens 44pt hoog
- safe-area-insets toegepast op elk full-bleed scherm

### Evenredigheidsronde (alle schermen, drie formaten, notch en home-indicator gesimuleerd)
Elk scherm is met een Playwright-harnas vastgelegd op de drie formaten, met
`--sat`/`--sab` gezet op de echte notch/home-indicator-hoogtes (47/34 en 59/34 px).
Gevonden en opgelost:
- **Wereldscherm**: de titel "Geschiedeniswereld" duwde het tandwiel buiten beeld
  (middenkolom was `1fr` in plaats van `minmax(0,1fr)`); lange titels krimpen nu.
- **Wereldscherm**: de wereldschildering vulde het hele scherm en het eiland zat
  daardoor onder de onderwerpkaarten – alleen lucht bleef zichtbaar. De schildering
  staat nu in een hero-band onder de koptekst (per wereld een eigen focuspunt) en
  vloeit over in een vervaagde kopie achter de kaarten.
- **Safe areas**: drie oudere `padding`-declaraties (waarvan één `!important`)
  overschreven de safe-area-regel op wereld-, quiz-, panel- en resultaatscherm.
  De buitenpadding staat nu op precies één plek.
- **Resultaatscherm**: een overgebleven regel uit de oude bouw zette de knoppen
  `position:absolute` bovenop score, sterren en statistieken. Verwijderd; sterren
  tonen nu expliciet verdiend/leeg.
- **Statistieken**: "undefined quizzen" bij een wereld zonder teller; tellers
  worden nu genormaliseerd.
- **Onboarding**: de gidsbeschrijving viel in de icoonkolom en brak per woord.
- **Onderwerpkaarten**: "Ontdekkingsreizigers" werd afgekapt op 375 px; titels
  breken nu af. Antwoord-, hint- en feedbacktekst hebben een hogere minimumgrootte.
Regressietests: tandwiel binnen het scherm, geen afgekapte onderwerptitels,
resultaatstatistieken onbedekt, geen "undefined" in statistieken.

---

### Vraag-illustraties (240 stuks)
Elke vraag heeft nu een eigen 16:9-illustratie in `assets/questions/q/<id>.jpg`
(800×450, ±73 KB, samen 18 MB), gedeeld door NL en EN omdat de ids gelijk zijn.
`question-art.js` is de manifest (gegenereerd met `node tools/question-art-manifest.js`);
`questionArt()` kiest eerst de vraag-illustratie, daarna onderwerp-/thema-art als
vangnet. De volgende vraag wordt vooraf geladen. Prompts beschrijven de scène
zonder het antwoord te tonen of te benoemen; 26 beelden zijn opnieuw gegenereerd
(te leeg, tekst in beeld, of niet herkenbaar). Test: elk id heeft een bestand,
manifest = map op schijf, bestandsgrootte binnen grenzen.

---

### Intro-thema
Muziek + kinderkoor "Kwizillo!" op het logo-moment (`assets/audio/intro_theme.wav`),
enige muziekbron tijdens de intro, crossfade naar de Home-loop. Bouw en
metingen in AUDIO_QA.md §11. In de browser start het pas na een eerste tik
(autoplay-beleid; de tik slaat de intro over) — in de Capacitor-app wordt
autoplay toegestaan zodat het thema bij een koude start speelt.

---

### Ronde 3 (visueel & spel)
- Intro: geen overslaan-knop meer (tik = door); logo opnieuw gerenderd (compleet).
- Feedbackkaart v3: verdict-band, "het juiste antwoord"-blok, grotere uitleg,
  kruisje; "Volgende" pas actief na de stem (of na kruisje); zonder stem direct.
- Stem varieert (8 goed-/4 bijna-zinnen per taal, vaste keuze per vraag+quiz).
- Quizknoppen: Hint · Nog eens (leest vraag opnieuw; verborgen bij Stil) · Andere vraag.
- Confetti bij goed antwoord; op het resultaat schudt een cadeau, knalt open
  in confetti en de gids springt eruit.
- Geluid: negen gesynthetiseerde effecten (tools/sfx-synth.cjs); tools/sfx.js
  staat klaar voor ElevenLabs-effecten zodra de API-key de permissie
  *Sound Effects* heeft (nu 401 missing_permissions).
- Laden: onderwerp-art 480→150 KB, wereld-/subject-art herkodeerd, eager
  decoding, twee vragen vooruit, assets 24 u gecachet door de server.
- Zes mascotte-portretten (Milo sterker; Comet, Pootje, Terra, Sparky, Lumi);
  vergrendelde maatjes als silhouet met slot.
- Kenniskaarten als verzamelkaarten met de vraag-illustratie, wereldkleur en
  zeldzaamheid (moeilijkheid); tik = groot.
- Menubalk als glas in app-blauw met gouden actieve tab; één SVG-iconenset
  (icons.js) voor navigatie, knoppen, munten/vlam/ster; wereld-badges uit de
  wereldschilderingen i.p.v. emoji.
- Prestaties: medailles met voortgangsring, gouden staat bij behaald.
- Profielpagina via de avatar linksboven: naam wijzigen, maatje, stem, taal.
Playwright: 35 tests (kaart-zoom, profiel, feedback-gating, nog-eens-knop).

---

### Ronde 4
- Intro start pas na een tik ("Tik om te starten"); daardoor speelt het thema
  vanaf het eerste beeld, ook op iOS. Logo strak uitgesneden (alleen dekkende
  pixels; de schaduw komt uit CSS).
- Quiz: rij Terug · Hint · Nog eens; kruisje op de uitlegkaart toont dezelfde
  vraag opnieuw (beantwoord) met Terug · Uitleg · Volgende. "Andere vraag" weg.
- Vraagtimer: 30 s op level 1, 2 s minder per level, minimaal 10 s; pauzeert
  onder de hint; time-out = fout met eigen kaart. Aan/uit in Ouderzone.
- Niveau: Auto (groep + level) of handmatig 1–4; vragen in een quiz van makkelijk
  naar moeilijk.
- Vraag-illustratie nooit meer afgesneden (contain over vervaagde vulling).
- Munten/vlam/XP-chips openen Statistieken; lokaal scorebord (beste quiz per
  wereld); "Deel je score" via systeemdeelvenster/klembord achter de oudercheck.
- Portugees (Brazilië): volledige UI (alle sleutels), 240 vragen
  (`questions-pt.js`, zelfde ids), getallen/eenheden uitgesproken in het
  Portugees, server kiest Braziliaanse stemmen (Milo: Wesley Bessa, Luna:
  Raquel; Scribe herkent `por`, tekst exact).
- **Nog niet**: wereldwijd scoreboard, vrienden zoeken/uitnodigen. Dat vraagt
  accounts en een backend; voor de iOS-versie is de passende route Apple Game
  Center (ranglijsten, vrienden, privacy door Apple geregeld) in fase 6.
Playwright: 39 tests.

---

### Ronde 5
- Zes niveaus (Ouderzone): seconden per vraag 30/25/20/16/13/10, toegestane
  fouten 6/5/4/3/2/0, moeilijkheidsvoorkeur 1/2/2/3/4/4. Niet gehaald =
  onderwerp opnieuw (enige knop); gehaald = volgende onderwerp + cadeau.
  Alle 24 onderwerpen gehaald op een niveau → volgende niveau vrijgespeeld.
- Timer start pas nadat de vraag is voorgelezen (direct bij Stil), pauzeert
  onder de hint en bij "Nog eens".
- Rij onder de vragen altijd Terug · Hint · Nog eens; na het kruisje staat
  "Volgende vraag" onder de antwoorden en opent een tegel de uitleg opnieuw.
- Moeilijkheid: vragen onder de niveau-cap eerst, harder vult aan – de hele
  pool blijft roteren, dus 4 unieke gemengde quizzen per wereld blijven gelden.
- Start-knoppen (Home, gemengde quiz) in app-blauw met gouden play-icoon.
- Wereldkop: badge en "KWIZILLO WERELD" op één regel; ondertitel gebalanceerd.
- Intro: eerste beeld van de film staat, één tik start film + geluid.
- Collectie-kaarten: geen horizontale overflow meer (knop kon niet krimpen);
  regressietest op SE en Pro Max, aantoonbaar rood op de oude CSS.
Playwright: 44 tests.

---

## 3. Beveiliging

| Controle | Status |
|---|---|
| API-key in frontend, assets of git-historie | ✅ geen enkele; key komt alleen uit `process.env` |
| `GET /.env` | ✅ 404 (was 200 met de sleutel erin) |
| `GET /.git/config` | ✅ 404 |
| `GET /server.js` | ✅ 404 |
| Pathtraversal | ✅ 404 |
| TTS-proxy rate limiting | ✅ 60/min per IP |
| Upstream-timeout | ✅ 15s |
| Upstream-foutlek naar client | ✅ dicht; details blijven in het serverlog |

---

## 4. Wat nog openstaat

### P1 — vóór TestFlight

**Live spraak is niet geverifieerd.**
Alle TTS-code is aangepast: stem per taal, `language_code` per verzoek, Vlaams
afgestraft, "Antwoord A" verwijderd, pauzes toegevoegd. **Geen daarvan is met een
echte ElevenLabs-sleutel getest**, want die heb ik niet. `AUDIO_QA.md` kan pas
worden ingevuld na een sessie met een geldige key. Dit is de grootste
niet-geverifieerde aanname in deze release.

**Productie-backend bestaat nog niet.**
`server.js` is een dev-server op loopback. Voor productie is nodig: HTTPS-host,
secret store, en validatie dat de aangevraagde tekst uit de vragenbank komt in
plaats van vrije tekst.

### P2

- ~~`assets/brand/intro.mp4` is 25 MB.~~ Opgelost: met macOS `avconvert`
  (Preset1280x720, multipass) hergecodeerd naar 10 MB H.264 mét fast-start (moov
  vooraan). Het origineel had de moov-atom achteraan, wat op de iPhone een
  zwart scherm en een directe 'error' gaf. Poster `intro-poster.jpg` toegevoegd.
- Inhoudelijke feitencontrole van de 480 vragen is niet uitgevoerd. De structuur
  is gevalideerd, de juistheid steekproefsgewijs.
- De Engelse bank is een vertaling van de Nederlandse. Dat geeft pariteit, maar
  een native-Engelse redactieronde zou de formuleringen natuurlijker maken.
- Nog geen Capacitor/Xcode-project. Dat is fase 6.

---

## 5. Wat er sinds de audit is veranderd

| Bevinding | Status |
|---|---|
| 4.1 dubbele cinematic + 90s-timer | ✅ opgelost |
| 4.2 intro niet overslaanbaar | ✅ opgelost |
| 4.3 nul i18n, geen EN-bank | ✅ opgelost |
| 4.4 onboarding ontbreekt | ✅ opgelost |
| 4.5 server exposeert projectmap | ✅ opgelost |
| 4.6 TTS-proxy ongelimiteerd | ✅ grotendeels; tekstvalidatie open |
| 4.7 Luna is Vlaams | ✅ code opgelost, live niet geverifieerd |
| 4.8 "Antwoord A" + pauzes | ✅ opgelost, live niet geverifieerd |
| 4.9 "Nog een quiz" herhaalt | ✅ opgelost |
| 4.10 nepvoortgang | ✅ opgelost |
| 4.11 vraagillustraties | ✅ opgelost — 24 onderwerpillustraties, 0 terugval |
| 4.12 Home is screenshot | ✅ opgelost |
| 4.13 geen safe areas | ✅ opgelost |
| 4.14 kunst op externe CDN | ✅ opgelost |
| 4.15 setTimeout-monkeypatch | ✅ opgelost |
| 4.16 MutationObserver | ✅ opgelost |
| 4.17 drievoudige showResult | ✅ opgelost |
| 4.18 losgekoppelde tellers | ✅ opgelost |
| 4.19 "Andere vraag" zonder gevolg | ✅ opgelost |
| 4.20 43 dubbele CSS-selectors | ✅ opgelost |
| 4.21 privacy + parental gate | ✅ opgelost |
| 4.22 CI draait niet op branch | ✅ opgelost |
| 4.23 server op loopback | ⚠️ bewust; productie-backend is fase 6 |

---

## 6. Codebase nu

```
±2.800 regels applicatiecode over 13 bestanden
±46 MB assets (18 MB vraag-illustraties, 10 MB intro-video)
26 illustraties in gebruik: 24 onderwerpen + 2 subject-specifiek
geen externe runtime-URL's behalve api.elevenlabs.io vanaf de server
```

Eén Home, één wereldscherm, één quiz, één navigatie, één state-model, één
audiomanager, één TTS-client, één localisatiesysteem, twee stylesheets.
