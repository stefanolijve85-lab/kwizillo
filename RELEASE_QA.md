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

### Apparaatformaten
Getest op iPhone SE (375×667), iPhone 14 (390×844) en Pro Max (430×932):
- geen horizontale overflow op Home, wereld of quiz
- elke antwoordtegel minstens 44pt hoog
- safe-area-insets toegepast op elk full-bleed scherm

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

**Vraagillustraties dekken 60% van de vragen niet.**
Er zijn zes onderwerpillustraties voor 240 vragen. Ruimte, wetenschap, lichaam en
ridders zijn gedekt; **geschiedenis, mysterie, dieren en aarde hebben er geen**.
Die vragen vallen terug op de wereldkunst met een per-vraag uitsnede, zodat de
kaart niet identiek is aan de achtergrond — maar het is een verzachting, geen
oplossing. Dit vraagt nieuwe illustraties en dus jouw akkoord (CLAUDE.md regel 4
verbiedt nieuwe AI-kunst zonder expliciete goedkeuring).

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

- `assets/brand/intro.mp4` is 25 MB. Zonder `ffmpeg` lokaal kon ik hem niet
  hercomprimeren; halveren moet eenvoudig kunnen.
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
| 4.11 vraagillustraties | ⚠️ verzacht, niet opgelost |
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
2.761 regels applicatiecode over 13 bestanden, 62 getrackte bestanden
34 MB assets, waarvan 25 MB de intro-video
geen externe runtime-URL's behalve api.elevenlabs.io vanaf de server
```

Eén Home, één wereldscherm, één quiz, één navigatie, één state-model, één
audiomanager, één TTS-client, één localisatiesysteem, twee stylesheets.
