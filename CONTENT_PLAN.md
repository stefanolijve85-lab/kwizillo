# CONTENT_PLAN.md — van 480 naar 1280 vragen

**Datum:** 2026-09-28 · **Branch:** `website-video-assets` · geschreven vóór de winkelrelease

Dit is een voorstel, geen uitgevoerd werk. Het beschrijft wat "1000+ unieke
vragen" concreet betekent voor Kwizillo, hoe de bank efficiënt te vullen is
zonder dat de kwaliteit zakt, en wat het kost aan tijd, megabytes en tekens
spraak. Overal staan de getallen die nu echt in de repo staan.

---

## 1. Waar we nu staan

| | nu |
|---|---|
| Vragen | **480 per taal**, in 10 talen, ids in pariteit (`tests/questions.test.js`) |
| Structuur | 6 werelden × 4 onderwerpen × 20 vragen |
| Moeilijkheid | 1–2 (basisset, ids 01–10) en 3–4 (gevorderd, ids 11–20), toegekend door `KWIZILLO_BUILD_BANK` op positie |
| Niveaus | 6, elk met een band: `[1,1] [1,2] [2,3] [3,3] [3,4] [4,4]` (`quiz-core-v2.js` LEVELS) |
| Weetjes | 96 per taal, elk met eigen illustratie |
| Vraagillustraties | 480 stuks, 800×450, gemiddeld 99 kB → **48 MB** |
| Gesproken tekst | gemiddeld **215 tekens per vraag** (vraag + vier antwoorden + hint + uitleg + weetje) |
| Audio in de app | geen. Alles komt van de proxy en blijft in `.tts-cache` staan |
| Bankgrootte | ~1,7 MB JavaScript voor alle tien de talen samen, alle tien geladen bij het starten |

### Het echte gat

Niveau 6 speelt alleen uit moeilijkheid 4. Per onderwerp zijn er daarvan nu
**vijf** vragen, terwijl een quiz er tien nodig heeft. Een kind op niveau 6
krijgt dus dezelfde vragen opnieuw. Hetzelfde geldt voor niveau 4 (`[3,3]`).
"1000+ vragen" is daarom geen rond getal maar een dekkingsregel:

> **Elk onderwerp kan op elke moeilijkheid een volle quiz van tien vragen
> neerzetten, zonder herhaling.**

- 24 onderwerpen × 4 moeilijkheden × 10 = **960**
- met de twee nieuwe werelden hieronder: 32 × 4 × 10 = **1280**

---

## 2. Twee nieuwe werelden

Plato, Michelangelo, da Vinci, hiphop, klassiek, sport — daar is nu geen plek
voor. Geschiedenis gaat over Egyptenaren, ridders, Romeinen en ontdekkingsreizen;
Wetenschap over proefjes, lichaam, uitvindingen en energie. Muziek en sport
passen nergens, en denkers en kunstenaars passen er maar half in.

Voorstel: **twee werelden erbij**, elk met vier onderwerpen (de UI is op vier
gebouwd, en Home wordt dan een net raster van 4×2):

**Besloten op 2026-09-28:** het worden acht werelden. De namen volgen de
bestaande vorm (`Ruimtewereld`, `Dierenwereld`): **Kunstwereld** (sleutel
`kunst`, Engels *Art World*) en **Sportwereld** (sleutel `sport`, Engels
*Sports World*). Eén woord past op de tegel en op de gouden kaart.

| Wereld 7 — **Kunstwereld** | Wereld 8 — **Sportwereld** |
|---|---|
| `schilders_beeldhouwers` — da Vinci, Michelangelo, Van Gogh, Frida Kahlo | `olympische_spelen` — geschiedenis, symbolen, records |
| `klassiek_tot_hiphop` — componisten, stijlen, van Bach tot Beyoncé | `balsporten` — voetbal, basketbal, tennis, regels |
| `instrumenten_klank` — families, hoe geluid werkt, orkest | `helden_records` — sporters die iets veranderden |
| `dans_theater_film` — ballet tot streetdance, toneel, animatie | `spellen_wereldwijd` — schaken, go, tikkertje, e-sport |

En binnen de bestaande werelden verschuift één onderwerp mee:
- **Geschiedenis** → `ontdekkingsreizigers` houdt schepen, maar krijgt ook
  denkers erbij (Plato, Confucius, Ibn Sina) of, netter: hernoem naar
  `denkers_ontdekkers`.
- **Wetenschap** → `uitvindingen` krijgt de mensen erbij (Einstein, Curie,
  Turing) als `uitvinders_wetenschappers`.

Wat twee werelden erbij verder raken (niet vergeten):
wereldkunst + topkunst (8 illustraties), gouden kaart per wereld (2 stuks),
muziektoewijzing, i18n-sleutels voor namen en ondertitels in 10 talen,
`TOPIC_KEYS`, `WORLD_ORDER`, de gratis/premium-regels, en de tests die zes
werelden hardcoderen (`tests/levels.js`, `ui-smoke`, `rtl`, `ipad`).

---

## 3. Hoe we het maken: de pijplijn

De bank staat nu als JavaScript-rijen in `questions*.js`
(`[vraag, antwoord, [drie fouten], hint, uitleg, weetje]`). Dat werkt, maar is
niet te reviewen of te controleren op schaal. Voorstel:

### Stap 0 — bron van waarheid apart
`content/<wereld>/<onderwerp>.json`, in het **Nederlands**, met per vraag:
`id, difficulty (1-4), prompt, answer, wrong[3], hint, explanation, fact,
source, artBrief, status (draft|checked|approved)`.
`tools/content-build.cjs` schrijft daaruit de `questions*.js` die de app laadt.
De app verandert niet; alleen de herkomst van de bank.

Waarom eerst apart: `source` en `artBrief` horen niet in de app, en `status`
maakt zichtbaar wat nog niet nagekeken is.

### Stap 1 — schrijven in blokken van 40
Eén onderwerp × vier moeilijkheden = 40 vragen per blok. Per blok een prompt met:
de doelgroep (groep 2–8), de moeilijkheidsband, wat er al ín de bank staat (zodat
er niet dubbel geschreven wordt), en de regels: één juist antwoord, drie
aannemelijke fouten uit dezelfde categorie, hint die niet verklapt, uitleg van
één zin, weetje dat níét hetzelfde zegt als de uitleg.

### Stap 2 — `tools/content-lint.cjs` (machinaal, keihard)
Draait over de hele bank, niet alleen het nieuwe blok:
- **duplicaten**: genormaliseerde vraag én antwoord, plus bijna-duplicaten via
  trigram-overlap (> 0,75) over alle 1280 — dit is wat "uniek" afdwingt;
- **lekkage**: het antwoord mag niet in de vraag of de hint staan (bestaat al als
  idee in `answer-art.js`, hier als tekstregel);
- **afleiders**: even lang, zelfde soort (geen "Een banaan" tussen drie jaartallen),
  geen "alle bovenstaande", geen dubbele ontkenning;
- **leesniveau** per band: zinslengte en woordlengte binnen grenzen die bij
  niveau 1–2 (voorgelezen) en 5–6 (zelf lezen) horen;
- **lengte**: vraag ≤ 90 tekens, antwoord ≤ 28, uitleg ≤ 120, weetje ≤ 140 —
  anders past het niet op een telefoonscherm en duurt de spraak te lang;
- **kindveilig**: een lijst onderwerpen die niet in een kinderquiz horen;
- **feitmarkering**: alles met een jaartal, getal of eigennaam krijgt automatisch
  `needsCheck`.

### Stap 3 — feitencontrole
Alles met `needsCheck` gaat door een tweede ronde met een andere bron dan die het
geschreven heeft, en krijgt een `source` (één regel, bijvoorbeeld "NASA, mission
pages" of "Rijksmuseum"). Een kinderapp die beweert dat Einstein iets zei wat hij
nooit zei, is een probleem dat je niet terugdraait met een update.

### Stap 4 — review door een mens (de echte bottleneck)
`tools/review/` — een pagina in de repo die per blok van 40 laat zien: vraag,
vier antwoorden, hint, uitleg, weetje, en de illustratie ernaast, met
goedkeuren/afkeuren/aantekening. Schrijft terug naar `content/`. Genereren is
goedkoop, nakijken niet: dít is waar het scherm voor gebouwd wordt.

Reken op ~1 minuut per vraag voor een volwassene die oplet → **1280 vragen ≈ 21
uur** review. Dat is het eerlijke getal. Verdeel over twee mensen en twee weken.

### Stap 5 — vertalen
Per taal in blokken, met een woordenlijst (wereldnamen, onderwerpnamen,
mascottenamen blijven staan), ids nooit vertaald. Daarna:
`tests/questions.test.js` bewaakt pariteit, en een steekproef van 5% gaat door
een terugvertaling om te zien of de betekenis overeind bleef. Eigennamen en
maten controleren per taal (Fahrenheit/Celsius, komma/punt).

### Stap 6 — illustraties
`tools/art-briefs.cjs` maakt per vraag een brief uit `artBrief` + de regel "toon
het onderwerp, nooit het antwoord". Na het genereren:
`tools/art-check.cjs` met perceptuele hash tegen alle bestaande platen
(duplicaten eruit), formaat naar 800×450, en een steekproef door een
beeldmodel met de vraag "staat het antwoord op deze plaat?" — precies wat
`K.artRevealsAnswer` nu met de hand beslist.

### Stap 7 — spraak vooraf warmdraaien
Er is niets te bouwen: `tools/warm-speech.cjs` loopt de bank af en vraagt elke
regel één keer op bij de proxy, die hem in `.tts-cache` legt. Daarna is elke
vraag voor elk kind meteen hoorbaar.

---

## 4. Wat het kost

### Megabytes
| | nu | met 1280 vragen |
|---|---|---|
| Vraagillustraties | 48 MB (480 × 99 kB) | **127 MB** als we zo doorgaan |
| Idem, opnieuw gecodeerd op 800×450 q0.78 (~60 kB) | 29 MB | **77 MB** |
| Assets totaal | 156 MB | ~205 MB (of ~155 MB mét hercodering) |

Advies: **hercodeer eerst de bestaande 480** (bespaart 19 MB, kost niets aan
kwaliteit op een telefoonscherm) en zet het nieuwe werk meteen op dat budget.
Anders groeit de app naar ruim 200 MB, en dat voelt een ouder bij het downloaden.

### Spraak
1280 vragen × 215 tekens = **~275.000 tekens per taal**, ~2,75 miljoen voor alle
tien. Met de huidige dagrem (`TTS_DAILY_CHARS=300000`) is dat tien dagen warm
draaien, of één keer de rem omhoog tijdens een warmvenster. Advies: **nl en en
vóór de release warmdraaien, de rest op aanvraag** — de cache vult zich vanzelf
zodra iemand in die taal speelt, en een zin kost maar één keer.

### JavaScript
De banken groeien van ~1,7 MB naar ~4,5 MB voor tien talen, nu allemaal geladen
bij het starten. Advies: **alleen de actieve taal laden** (en de rest bij het
wisselen), wat ook de eerste start sneller maakt.

---

## 5. Volgorde

1. **Pilot, één onderwerp, helemaal af** — 40 vragen over vier moeilijkheden,
   door de lint, feitgecheckt, gereviewd, vertaald naar 10 talen, 40 platen,
   spraak warm. Levert echte getallen op voor tijd en kosten in plaats van de
   schattingen hierboven.
2. **De twee nieuwe werelden bouwen** (art, i18n, gouden kaarten, tests) — dat is
   app-werk en kan parallel aan het schrijven.
3. **Bestaande 24 onderwerpen bijvullen** naar 10 per moeilijkheid: +20 per
   onderwerp, 480 nieuwe vragen.
4. **Nieuwe 8 onderwerpen vullen**: 320 vragen.
5. **Weetjes mee laten groeien** van 96 naar ~200 per taal.
6. **Hercoderen, warmdraaien, release-QA.**

---

## 6. Besloten, en wat er nog ligt

Besloten op 2026-09-28: acht werelden (Kunstwereld, Sportwereld), één
stijlreferentie voor de illustraties, spraaktekens mogen worden uitgegeven voor
het warmdraaien, en er komt eindredactie door een mens. De pilot begint bij
`zonnestelsel`.

### Stand van de pilot

| stap | stand |
|---|---|
| 0 · bron van waarheid | `content/ruimte/zonnestelsel.json` staat er |
| 1 · schrijven | 20 nieuwe vragen, vijf per moeilijkheid, met bron en beeldbrief |
| 2 · lint | `npm run content:lint` — geen blokkerende fouten |
| 3 · feitencontrole | elke vraag met een getal of naam heeft een bron; tweede ronde nog te doen |
| 4 · review door een mens | wacht op jou — dit is de poort voor de vertaling |
| 5 · vertalen | 9 talen, gebeurt pas na goedkeuring |
| 6 · illustraties | 20 platen, geen beeldtegoed op dit moment |
| 7 · spraak warmdraaien | na de vertaling |

### Wat de lint onderweg vond

Zes vragen stonden twee keer in hun eigen onderwerp, in alle tien de talen —
een kind dat naar niveau 5 klimt kreeg daar een vraag van niveau 1 terug. Ze
zijn vervangen (zie commit) en `tests/questions.test.js` laat het niet meer
terug komen. Vijf paren blijven staan die hetzelfde antwoord anders vragen;
`npm run content:lint` noemt ze, en ze horen bij het bijvullen thuis:
zonnestelsel 04/11, sterren_planeten 06/12, egyptenaren 06/18,
romeinen 03/18, raadsels 09/12.
