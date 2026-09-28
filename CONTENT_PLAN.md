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
| 0 · bron van waarheid | `content/ruimte/zonnestelsel.json` |
| 1 · schrijven | 20 nieuwe vragen, vijf per moeilijkheid, met bron en beeldbrief |
| 2 · lint | `npm run content:lint` — geen blokkerende fouten, in alle tien de talen |
| 3 · feitencontrole | elke vraag met een getal of naam heeft een bron; tweede ronde nog te doen |
| 4 · review | doorlopen, drie punten aangepast (hint van 32 en 34, afleiders van 30) |
| 5 · vertalen | 10 talen, gebouwd met `npm run content:build` |
| 6 · illustraties | 20 platen, eigen beeld per vraag, 800×450 |
| 7 · spraak warmdraaien | nl en en, Milo en Luna: 160 regels, 7290 tekens |

De pilot is af. Wat hij aan echte getallen opleverde, tegenover de schattingen
hierboven:

| | schatting | gemeten |
|---|---|---|
| Platen | — | **3,4 cent per plaat**, 20 stuks ≈ 70 cent, 1280 vragen ≈ 45 euro |
| Plaatgrootte | 60 kB | **113 kB** gemiddeld op 800×450 q78 (hercodering blijft nodig) |
| Spraak | 215 tekens per vraag | **91 tekens** voor vraag + hint; de antwoordregels worden tijdens het spelen warm, want de app schudt de volgorde |
| Bankgrootte | — | 480 → 500 vragen per taal, tien talen, zonder dat een test hoefde te wijken |

De stijlregel voor de platen staat vast en hoort bij elke volgende opdracht:
*vivid semi-realistic 3D render, verzadigde kleuren, helder licht, rustige
compositie, geen cartoongezichten op voorwerpen, nergens tekst.* De eerste
poging mét gezichten paste niet bij de bestaande platen en is weggegooid.

### Wat de lint onderweg vond

Zes vragen stonden twee keer in hun eigen onderwerp, in alle tien de talen —
een kind dat naar niveau 5 klimt kreeg daar een vraag van niveau 1 terug. Ze
zijn vervangen (zie commit) en `tests/questions.test.js` laat het niet meer
terug komen. Vier paren blijven staan die hetzelfde antwoord anders vragen;
`npm run content:lint` noemt ze, en ze horen bij het bijvullen thuis:
zonnestelsel 04/11, sterren_planeten 06/12, egyptenaren 06/18 en
romeinen 03/18.

---

## 7. De nachtronde: alle 24 onderwerpen gevuld

In de nacht van 27 op 28 september 2026 zijn de overige 23 onderwerpen
dezelfde pijplijn door gegaan als de pilot. Stand nu:

| | voor | na |
|---|---|---|
| Vragen per taal | 480 | **960** |
| Vragen in tien talen | 4800 | **9600** |
| Onderwerpen met tien vragen per moeilijkheid | 1 van 24 | **24 van 24** |
| Niveau 6 zonder herhaling | alleen `zonnestelsel` | **elk onderwerp** |
| Eigen vraagillustraties | 480 | 540 (420 wachten nog) |

Elke ronde was dezelfde vier stappen: de bestaande twintig prompts uitlezen
zodat er niets dubbel komt, twintig nieuwe vragen schrijven in nl/en/de/fr/es,
linten en de lengtes bijstellen, dan it/pt/da/ru/ar erbij, opnieuw linten,
`node tools/content-build.cjs`, `npm test`, commit, push.

### Wat de lint in deze ronde tegenhield

- **Kruisdubbel:** "Waarom stijgt warme lucht op?" stond al bij weer en klimaat;
  de nieuwe versie bij slimme proefjes werd het ei in azijn.
- **Antwoord in de vraag:** twee raadsels (de zeventien schapen, de drie appels)
  verklapten hun eigen antwoord. Vervangen door raadsels zonder verklapper.
- **Lengtes:** ruim tachtig antwoorden en afleiders waren langer dan 28 tekens,
  vrijwel allemaal in de/fr/es/it/pt/ru. Allemaal ingekort vóór de build.

### De zes dubbele paren uit de oude bank zijn weg

De vier paren die hierboven nog openstonden, plus twee die deze ronde
bovenkwamen, zijn herschreven zodat ze bij de bestaande illustratie passen —
er hoefde dus geen plaat opnieuw:

| vraag | was | is nu |
|---|---|---|
| `romeinen-18` | welke taal spraken de Romeinen (net als 03) | schrijven op een wastafeltje met een stylus |
| `lichaam-13` | het grootste orgaan (net als 09) | waar het zweet in je huid vandaan komt |
| `natuur_energie-17` | waterkracht (net als 07) | de stuwdam zelf |
| `slimme_proefjes-11` | bakpoeder en azijn (net als 01) | welk gas het schuim maakt |
| `zonnestelsel-11` | een tweede vraag met antwoord Saturnus | hoeveel manen Saturnus heeft |
| `sterren_planeten-12` | een tweede vraag met antwoord blauw | hoe heet de heetste sterren zijn |
| `egyptenaren-18` | een tweede vraag met antwoord papyrus | waarvan papyrus gemaakt werd |

`npm run content:lint` meldt nu geen enkel paar meer met hetzelfde antwoord.

### Wat er nog ligt

1. **420 platen.** Alles na `ruimte/astronauten` staat in `content/` als
   `"art": "todo"`, en `npm test` roept het getal bij elke run. Blokkerend:
   ElevenLabs gaf `quota_exceeded — 0 credits remaining` tijdens de ronde.
   Kosten om het af te maken: 420 × 3,4 cent ≈ **14 euro**.
2. **Spraak warmdraaien** voor diezelfde vragen (`node tools/warm-speech.cjs`),
   geblokkeerd door hetzelfde tegoed.
3. **Eindredactie.** Daarvoor is `review.html` gebouwd:
   `node tools/review-page.cjs` bakt alle 480 nieuwe vragen met plaat,
   antwoorden, hint, uitleg en weetje in één pagina, in alle tien talen, met
   goed/aanpassen per vraag en een downloadknop voor de beslissingen.
   Open hem via `npm start` → `http://localhost:8080/review.html` (dan onthoudt
   de browser je oordelen; bij openen als bestand kan dat niet).
4. **De twee nieuwe werelden** (Kunstwereld, Sportwereld) zijn nog appwerk:
   wereldselectie, muziek, collectie en illustraties, daarna 8 × 4 × 40 = 1280.

---

## 8. De twee nieuwe werelden staan

Op 28 september 2026 zijn Kunstwereld en Sportwereld er als volwaardige
werelden bij gekomen — eerst het appwerk, daarna acht keer veertig vragen.

| | voor | na |
|---|---|---|
| Werelden | 6 | **8** |
| Onderwerpen | 24 | **32** |
| Vragen per taal | 960 | **1280** |
| Vragen in tien talen | 9600 | **12.800** |

### Het appwerk

De wereldlijst stond op vijf plaatsen los in de code. Die is nu één registratie
in `m1-runtime.js` (`K.WORLDS` + `K.TOPIC_KEYS`), met `K.playableWorlds()`
ernaast: die toont alleen werelden waarvan alle vier de onderwerpen vragen
hebben. `m1-ui.js`, `games-memo.js`, `games-whoami.js` en `facts-ui.js` lezen
die lijst nu uit in plaats van hun eigen kopie. Zo kon een wereld al in de code
staan terwijl de vragen nog geschreven werden, zonder een kapot scherm.

Verder: veertien nieuwe tekstsleutels per taal (titels, ondertitels, acht
onderwerpnamen), muziek gekoppeld aan bestaande tracks (geen nieuwe audio),
tien tijdelijke platen gerenderd met Playwright in plaats van AI-credits
(`tools/placeholder-art.cjs`, bijgehouden in `assets/placeholder-art.json`), en
`questions.js` die nu ook werelden bouwt die alleen uit `content/` komen.

### Wat de lint en de tests tegenhielden

- **Kerkorgel werd een orgaan.** De vraag over het orgel in `kunst/muziek`
  kreeg de anatomieplaat, omdat `orgaan`/`organ` in de regexlijst van
  `SUBJECT_ART` stond. Die woorden zijn eruit; een kerkorgel is geen lichaamsdeel.
- **"1.00" op het scorebord.** `tests/core.test.js` vond cijfers die in de
  spraaktekst bleven staan, in het weetje over de eerste tien van Comaneci.
  In tien talen herschreven naar woorden.
- **Lengtes, opnieuw.** Enkele tientallen antwoorden boven de 28 tekens,
  vrijwel allemaal in de/fr/es/it/pt/ru/ar. Allemaal ingekort vóór de build.

### Wat er nog ligt voor deze twee werelden

1. **Tien tijdelijke platen** (twee wereldhelden, acht onderwerpkaarten) wachten
   op echte illustraties. `npm test` noemt het aantal bij elke run.
2. **320 vraagplaten** staan als `"art": "todo"` — samen met de oude achterstand
   nu 740 vragen op de onderwerpplaat.
3. **Weetjes** (`facts`) voor kunst en sport: 16 per wereld × 10 talen, plus 32
   illustraties. `facts-ui.js` verbergt een wereld zonder weetjes, dus het is
   niet stuk — het is er alleen nog niet.
4. Punt 1 en 2 zijn geblokkeerd door hetzelfde ElevenLabs-tegoed als in §7.

---

## 9. De doorlichting: alle 1280 vragen en alle 540 platen nagelopen

Op 28 september 2026 is de hele bank vraag voor vraag nagelezen (Nederlands,
met steekproeven in de andere talen) en is elke vraagplaat naast zijn vraag
gelegd via contactvellen van twaalf platen tegelijk.

### Machinaal gevonden en opgelost

| wat | waar | oplossing |
|---|---|---|
| Onzinnige afleider "… altijd", in tien talen meevertaald | `jungle-07` ("Slang altijd"), `romeinen-10` ("Een gladiator altijd") | afleider rechtgezet in alle talen |
| Afleider met uitleg erin | `oceanen_natuur-03` ("Magma ondergronds") | "Magma" |
| Meervoud als antwoord op een enkelvoudsvraag | `baby_dieren-07` ("Welpen") | "Welp", ook als afleider elders |
| Hint die het antwoord verklapt | `sterren_planeten-06`, `waterdieren-05`, `romeinen-19` | nieuwe hints in tien talen |
| Vraag die haar eigen antwoord noemt (alleen in het Portugees) | `baby_dieren-01`, `baby_dieren-07` | vraag herschreven naar "o bebé do cão/leão" |
| Dezelfde vraag twee keer in één onderwerp | jaguar (`jungle-05`/`18`), hiërogliefen (`egyptenaren-04`/`11`), heilige kat (`egyptenaren-09`/`19`), onweerswolk (`weer_klimaat-08`/`15`), schildknaap (`ridders_kastelen-09`/`11`), slotgracht (`ridders_kastelen-03`/`13`), jachtluipaard (`snelle_dieren-01`/`02`) | zeven vragen vervangen door nieuwe: tapir, de ankh, kalksteen, cirruswolk, de page, hoeveel mensen er in een kasteel woonden, de snelst zwemmende vogel |
| Dezelfde vraag in twee werelden | hattrick (`balsporten-19`/`records_helden-16`), marathonafstand (`olympische_spelen-15`/`records_helden-12`) | `records_helden` kreeg de grandslams van Serena Williams en het polsstokrecord |

### Fouten in de inhoud

- **`continenten_landen-17`** vroeg welk land de meeste buurlanden heeft, met
  China goed en Rusland fout — maar allebei hebben er veertien. De vraag is nu:
  hoeveel buurlanden heeft China.
- **`ridders_kastelen-12`** noemde het lansgevecht een toernooi, terwijl het
  weetje zelf zei dat het een steekspel heet. Nu heet het antwoord steekspel.
- **`verborgen_schatten-15`** (Piet Hein) schreef de zilvervloot aan de VOC toe;
  dat was de WIC.
- **`raket_avontuur-14`** zei dat de Saturnus V hoger was dan de Dom van Utrecht
  (110,6 tegen 112,3 meter). Nu staat er, net als in de negen andere talen, het
  Vrijheidsbeeld.
- **`speurtocht-31`** gaf als anagram van "raadsel" het niet-bestaande woord
  "sladeer"; nu "noten" en "tonen". Het Deense voorbeeld was uit het Duits
  overgenomen en is vervangen door "lampe" en "palme".
- Bewust gelaten: `snelle_dieren-05` ("paard of schildpad?") noemt het antwoord
  in de vraag. Dat is voor de jongste spelers een keuzevraag, geen fout.

### Wat de platen betreft

Alle 540 vraagplaten bestaan, staan in het manifest en horen bij een bestaande
vraag; geen dode verwijzing, geen weespaat. De platen die bij de nieuwe vragen
uit `content/` zijn gemaakt, passen stuk voor stuk. In de oudere reeks (ids 01
tot 10) staan de platen die het onderwerp wel tonen maar de vraag niet:

`zonnestelsel-11` (manen van Saturnus, maar Jupiter in beeld), `egyptenaren-07`
(sfinx gevraagd, piramide getoond), `snelle_dieren-01` (jachtluipaard, zebra's
in beeld), `snelle_dieren-03`, `waterdieren-02` (octopus, lege grot),
`waterdieren-06` (zeeschildpad, leeg strand), `jungle-01`, `jungle-03`,
`jungle-05` (jaguar, alleen rivier), `jungle-07` (kameleon, groene slang),
`speurtocht-03` (vergrootglas, egel), `ridders_kastelen-01` en `-02`,
`lichaam-01`, `-03` en `-07` (beeldspraak in plaats van het orgaan),
`slimme_proefjes-05` en `-06`, en `uitvindingen-14` (Marie Curie, een jongen in
beeld).

Daar komen de vragen bij die in deze ronde zijn herschreven en dus een nieuwe
plaat nodig hebben: `jungle-18` (tapir), `egyptenaren-11` (ankh),
`egyptenaren-19` (kalksteengroeve), `weer_klimaat-15` (cirrus),
`snelle_dieren-02` (pinguïn onder water) en `ridders_kastelen-11` (page).

Samen met de tien tijdelijke platen van de nieuwe werelden en de 740 vragen die
nog op de onderwerpplaat staan, is dat de hele beeldschuld. Alles wacht op
tegoed bij de beeldgenerator.
