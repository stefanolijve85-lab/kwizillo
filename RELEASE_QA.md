# RELEASE_QA.md — Kwizillo release candidate

**Branch:** `website-video-assets` (alles van 27 september; `release/kwizillo-rc1` loopt achter)
**Datum:** 2026-09-27 (kop en §1, §1b en §4 herzien; §2, §3, §5 en §6 zijn de rondes van 13–20 september)
**Versie:** `0.5.0`

Dit document beschrijft wat is getest, hoe, en wat er nog openstaat. Onopgeloste
zaken staan er expliciet in; er is niets weggelaten omdat het slecht uitkwam.

---

## 1. Geautomatiseerde tests (27 september)

| Suite | Wat | Resultaat |
|---|---|---|
| `npm test` (7 unit-suites) | Vragenbanken, kernlogica, scores, weetjes, mascottetegels, teksten, server | ✅ |
| `tests/questions.test.js` | Tien banken: aantallen, structuur, integriteit, kruistaal-pariteit | ✅ 480 per taal × 10 talen, 24 onderwerpen |
| `tests/questions.test.js` (kunst) | Eén illustratie per vraag | ✅ 480 vraagillustraties, 24 onderwerpillustraties |
| `tests/strings.test.js` | Sleutelpariteit en geen kindernaam in gesproken tekst | ✅ 10 × 664 sleutels |
| `tests/scores.test.js` | Punten- en coinsplafonds, perioden, records | ✅ |
| `tests/facts.test.js` | 96 weetjes per taal met eigen illustratie | ✅ 960 |
| `tests/mascots.test.js` | Elke buddy heeft een tegel van 640×512 | ✅ 13 |
| `tests/server-static.test.js` | Statische allowlist, `.env`-exposure, TTS-foutafhandeling, origin-allowlist, rate limit | ✅ |
| 20 browsersuites (`npm run test:ui`) | Intro, onboarding, quiz, niveaus, RTL, spraak, lipsync, premium, privacy, zes spellen, iPad | ✅ 154 tests |

**Alles groen.** De suite draait ook in GitHub Actions op `develop` en `release/**`
(`.github/workflows/test.yml`).

---

## 1b. Wat er sinds 13 september bij is gekomen

- Tien talen in plaats van drie (Duits, Frans, Spaans, Italiaans, Deens, Russisch,
  Arabisch erbij), met gespiegelde UI voor het Arabisch.
- 480 vragen per taal in plaats van 240; 96 weetjes per taal.
- Zes extra spellen naast de quiz: Memo, Rekenen, Wat ben ik?, Fotozoom, Weetjes
  en de Runner — elk per wereld of alle werelden door elkaar.
- Punten- en coinssysteem met dag-, week-, maand- en jaarrecords en plafonds;
  winkel voor gouden kaarten en buddy's.
- Niveau per wereld (1–6), gouden wereldkaart bij alle zes niveaus gehaald.
- Premium (StoreKit 2) met paywall, ouderpoort en herstel; de testschakelaar die
  alles opende is verwijderd.
- iPad-versie: twee frames in plaats van één. Rechtop speelt de iPad het tall
  frame (430 × 764) meegeschaald; in landschap schakelt hij naar het wide
  frame (1180 × 820) dat het scherm vult, met de schermen in twee kolommen
  (`landscape.css`, zie §2b).
- Spraak: streaming proxy en `eleven_flash_v2_5` — eerste geluid in 0,13–0,18 s
  in plaats van 0,6–1,0 s.

---

## 2b. De twee frames (28 september)

Op een iPad in landschap stond het spel eerst als een staande kaart in het
midden, met onscherpe wereldkunst eromheen. Dat is nu een eigen indeling.

`m1-runtime.js` kiest het frame en zet `html[data-shape]`:

| scherm | shape | frame | voorbeeld |
|---|---|---|---|
| telefoon (≤ 580 px) | `phone` | het scherm zelf | iPhone 15: 393 × 852 |
| smaller dan breed of te smal | `tall` | 430 × 764, meegeschaald | iPad Pro staand: 760 × 1350 |
| minstens 860 px breed én breder dan hoog | `wide` | 1180 × 820, meegeschaald | iPad Pro liggend: 1350 × 938 |

`landscape.css` geldt alleen bij `data-shape="wide"`; de telefoon- en
staande-indeling zijn niet aangeraakt. Wat er in die stand verandert:

- **Home** — acht werelden in vier kolommen, de zes spellen in één rij.
- **Wereld** — de vier onderwerpen naast elkaar, gemengde quiz eronder.
- **Quiz** — vraag linksboven, plaat (16:9) eronder, knoppen onder de plaat,
  de vier antwoorden vullen de hele rechterkolom.
- **Rekenen / Wat ben ik?** — som, respectievelijk Milo met zijn aanwijzingen,
  links; de keuzes rechts.
- **Collectie, prestaties, statistieken, profiel** — lijsten in drie of vier
  kolommen, kaarten gecentreerd tot maximaal 900 px.
- **Kaarten die over een scherm zweven** (uitslag, feedback, hint, geluid)
  blijven een kaart in het midden, geen banier over de hele breedte.

Gemeten na de wijziging: iPad Pro 12,9" liggend 1350 × 938 in 1366 × 1024,
iPad 11" 1178 × 818, iPad 10,2" 1064 × 740, iPad mini 1048 × 728. Staand en
telefoon precies als daarvoor (760 × 1350 en 393 × 852).

### Wat er bij het testen op een echte iPad uit kwam (28 september)

- **De openingsfilm stond ingezoomd en zacht.** Hij is staand (720 × 1280) en
  werd met `cover` in het brede frame anderhalf keer uitvergroot. In liggende
  stand wordt hij nu heel getoond, scherp, met de wereldkunst onscherp erachter.
  Komt er een liggende film, zet die dan neer als `assets/brand/intro-wide.mp4`
  en vul het pad in bij `K.MOTION.homeWide` (world-assets.js); de intro pakt hem
  dan alleen liggend, en valt terug op de staande film als hij ontbreekt.
- **De gids liep het scherm uit.** De rondleiding mat het scherm met
  `getBoundingClientRect()` — schermpixels — en zette de gids neer in de pixels
  van het frame zelf. Zodra `--fit` niet 1 was klopte dat niet: op elke iPad,
  staand én liggend, kwam de gids buiten beeld. De maten worden nu omgerekend
  (milo.js). Gemeten na de fix: gids binnen het frame in beide standen.
- De rondleiding zei nog "de zes werelden"; dat is in tien talen "de werelden"
  geworden.

Nog open: de wereldhelden zijn staande platen (752 × 1344). In landschap wordt
daar een horizontale band uit gesneden en opgeschaald, wat zacht oogt. Een
liggende render per wereld zou dat oplossen.

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

### Memo (nieuw spel)
`games-memo.js`. Paren uit de vraag-illustraties van de wereld; niveau 1–2 twee
dezelfde plaatjes, vanaf niveau 3 plaatje ↔ woord (korte zelfstandige
naamwoorden; fragmenten als "Met kieuwen" uitgesloten; te weinig woorden →
aanvulling met plaatjesparen). Bord 3×4 / 4×4 / 4×4 / 4×5 / 4×5 / 4×6, tijd per
paar 22/18/16/13/11/9 s, timer-ring, pauzeloos. Bij omdraaien zegt de gids het
woord (alle woorden vooraf gecachet), bij een paar chime + confetti, bij
afronden cadeau/confetti + felicitatie; tijd om = geen beloning + opnieuw.
XP = paren×5 + sterren×5, munten = paren; beste aantal beurten per wereld in
Statistieken; prestatie "3 memo's gewonnen". Ingangen: Home ("Speel ook") en
elke wereldpagina. Tests: `tests/memo.spec.js` (4) — bord, mismatch/match,
beloning, niveauregels, time-out; geen JS-fouten op SE/14/Pro Max.

---

### Rekenen (nieuw spel)
`games-math.js`. Tien gegenereerde sommen per ronde, vier antwoorden, timer en
foutregels van het niveau: 1 +/− tot 10 (met teldots) · 2 tot 20, verdubbelen ·
3 tafels 1–5, tientallen · 4 alle tafels en delen · 5 tot 1000, × met tweecijferig ·
6 tweestaps (c + a × b), helft/kwart, 10/25/50 %. Afleiders liggen dicht bij
het antwoord (nooit negatief, altijd vier verschillende). Stem leest de som
("zeven keer acht", "vijfentwintig procent van tachtig") en de antwoorden;
alle tien sommen vooraf gecachet; goed = chime + confetti + variërende lof,
fout = "Bijna. Het is 12."; automatisch door na de zin (max 2,4 s) of tik.
Hint = telstrategie in woorden. Resultaat gehaald/niet gehaald, XP 10 per
som + sterren, munt per som, beste score per niveau in Statistieken,
prestatie "3 rekenrondes". Getallen-uitspraak gecontroleerd (NL/EN/PT) en één
clip getranscribeerd: "Zeven keer acht: A 56, B 48". Tests: `tests/math.spec.js`
(3) — sommen per niveau, goed/fout-flow, geslaagd/niet gehaald.

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

## 4. Wat moet er nog gebeuren voordat we live kunnen (27 september)

Twee dingen kunnen live: **de website** (`site/`) en **de app** (web + iOS).
Ze hangen aan elkaar: de app spreekt via `app.kwizillo.nl`, en de privacypagina's
van de site zijn verplicht voor de App Store. De volgorde hieronder is de
volgorde waarin het moet.

Legenda: **[jij]** alleen jij kunt het (account, DNS, sudo, Apple) · **[ik]** kan ik doen.

### A. Eerst: de server, want daar hangt de rest aan

| # | Wat | Wie | Waarom nu |
|---|---|---|---|
| A1 | DNS bij Hostnet: `@`, `www` en `app` van beide domeinen naar `213.126.59.35` | **[jij]** | Alle drie staan nu nog op Hostnets parkeer-IP `91.184.0.200`; zonder dit bestaat er niets om naartoe te publiceren |
| A2 | Server inrichten: clone, `.env` met de ElevenLabs-sleutel, systemd, nginx (`deploy/DEPLOY.md` §2–§5) | **[jij]** (sudo) | De spraakproxy van de app |
| A3 | Certbot voor beide domeinen + `app.` | **[jij]** | De iOS-app praat alleen over HTTPS |
| A4 | Controleren: `https://app.kwizillo.nl/api/voice-status` en een POST zonder Origin → 403 | **[ik]** zodra A1–A3 staan | Bewijs dat de proxy dicht is |
| A5 | `TTS_DAILY_CHARS` afstemmen op je ElevenLabs-abonnement | **[jij]** | Harde bovengrens op de rekening |

> **Dit is de blokkade voor TestFlight.** De iOS-build wijst naar
> `https://app.kwizillo.nl/api/tts` (`www/config.js`). Tot A1–A3 klaar zijn,
> blijven Milo en Luna stil in de app op een toestel.

### B. De website

| # | Wat | Wie |
|---|---|---|
| B1 | ~~Teksten bijwerken: tien talen, 480 vragen, zes extra spellen~~ | **[ik]** ✅ 27 sep |
| B2 | ~~Screenshots vernieuwen uit de huidige app~~ | **[ik]** ✅ 27 sep (`tools/site-shots.cjs`) |
| B3 | Naam en vestigingsadres van de uitgever invullen in `site/privacy.html` en `site/en/privacy.html` (nu een gemarkeerde placeholder) | **[jij]** |
| B4 | `hallo@kwizillo.nl` en `hello@kwizillo.com` laten aankomen | **[jij]** |
| B5 | Publiceren (statische host of `site/` op de server) en controleren dat `/privacy.html` in beide talen laadt | **[jij]** + **[ik]** |
| B6 | Bij App Store-lancering: "Binnenkort in de App Store" vervangen door de echte link | **[ik]** |

### C. De app zelf (web release candidate)

| # | Wat | Wie |
|---|---|---|
| C1 | Audio-QA opnieuw op het nieuwe model: `npm run test:audio` (20 NL + 20 EN, Scribe-controle) en `AUDIO_QA.md` bijwerken | **[ik]**, sleutel nodig |
| C2 | Steekproef vraagillustraties: bij het maken van de screenshots kwam er één mis (een vis bij "wat rent sneller, een paard of een schildpad?") | **[ik]** |
| C3 | Inhoudelijke feitencontrole van de 480 vragen per taal (structuur is getest, juistheid steekproefsgewijs) | **[jij]** / redacteur |
| C4 | Native-redactieronde op de vertaalde banken (nu vertaald vanuit het Nederlands) | **[jij]** / redacteur |
| C5 | `release/kwizillo-rc1` en `website-video-assets` weer samenbrengen | **[ik]**, jouw keuze welke kant op |

### D. iOS naar TestFlight

| # | Wat | Wie |
|---|---|---|
| D1 | Signing met jouw team + In-App Purchase-capability in Xcode | **[jij]** |
| D2 | Draaien op een echte iPhone **en** een echte iPad (landschap!) | **[jij]** |
| D3 | App Store Connect: bundle-id, contracten, belasting, bankgegevens | **[jij]** |
| D4 | Abonnementen aanmaken: maand, jaar met 7 dagen proef, prijzen, drie localisaties, reviewscreenshot | **[jij]** (`APP_STORE_MONETIZATION_SETUP.md`) |
| D5 | Sandbox-tester en een echte koop/herstel/verlooptest | **[jij]** |
| D6 | Schermafbeeldingen voor de store: iPhone 6.9″ en iPad 13″ | **[ik]** maakt ze, **[jij]** uploadt |
| D7 | TestFlight-ronde met echte kinderen | **[jij]** |

### E. Kids Category en juridisch (`KIDS_COMPLIANCE.md` §8)

| # | Wat | Wie |
|---|---|---|
| E1 | Statutaire naam, adres, telefoon, e-mail van de uitgever (DSA-handelaarstatus + beide privacypagina's) | **[jij]** |
| E2 | Leeftijdsband kiezen (advies: 6–8) | **[jij]** |
| E3 | Vragenlijsten: Apple leeftijdsclassificatie, App Privacy ("Data Not Collected") | **[jij]** |
| E4 | Verwerkersovereenkomst met ElevenLabs op papier | **[jij]** |
| E5 | Het korte beveiligingsprogramma uit `KIDS_COMPLIANCE.md` §6 schrijven | **[ik]** in concept |
| E6 | `KIDS_COMPLIANCE.md` opnieuw lezen vlak vóór indiening — winkelregels veranderen | **[ik]** |

### Kortste pad naar een testbare app op een toestel

A1 → A2 → A3 (server en DNS) → D1 → D2. Daarmee speelt Kwizillo mét stem op je
eigen iPhone en iPad. Alles in D3–D7 en E is pas nodig voor TestFlight-testers
en de indiening.

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
| 4.7 Luna is Vlaams | ✅ opgelost en live geverifieerd (native stem per taal, Scribe-controle) |
| 4.8 "Antwoord A" + pauzes | ✅ opgelost en live geverifieerd |
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
| 4.23 server op loopback | ⚠️ nog steeds: de productieserver bestaat nog niet (zie §4 A) |

---

## 6. Codebase (stand 20 september; de app is sindsdien flink gegroeid)

```
±2.800 regels applicatiecode over 13 bestanden
±46 MB assets (18 MB vraag-illustraties, 10 MB intro-video)
26 illustraties in gebruik: 24 onderwerpen + 2 subject-specifiek
geen externe runtime-URL's behalve api.elevenlabs.io vanaf de server
```

Eén Home, één wereldscherm, één quiz, één navigatie, één state-model, één
audiomanager, één TTS-client, één localisatiesysteem, twee stylesheets.
