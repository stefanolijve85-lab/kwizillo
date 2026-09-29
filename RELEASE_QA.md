# Kwizillo — stand van zaken

Bijgewerkt: 29 september 2026. Branch `website-video-assets`.

Dit is het lopende verslag: wat er af is, wat er getest is, en wat er nog ligt.
Het vervangt geen testrapport per scherm — dat staat in de doorloop hieronder.

---

## 1 · Waar de app nu staat

| | |
|---|---|
| Vragen | 1280 per taal × 10 talen, 8 werelden × 4 onderwerpen |
| Vraagplaten | **1280 van 1280** — elke vraag een eigen plaat |
| Vraag-only platen | 162 (voor vragen waarvan de eigen plaat het antwoord verraadt) |
| Onderwerpplaten | 32 van 32 |
| Wereldplaten | 8 van 8 |
| Weetjes | 128 (acht werelden × 16), elk met een eigen plaat |
| Buddy's | 13, allemaal vierkant en heel in beeld |
| Talen | nl, en, de, fr, es, it, pt, da, ru, ar — 692 sleutels, in pariteit |
| Minispellen | Memo, Rekenen, Wat ben ik?, Fotozoom, Weetjes, Runner |

---

## 2 · De doorloop van 29 september

Elk scherm geopend op **telefoon (430 × 932)** en **iPad liggend (1194 × 834)**,
gemeten op horizontaal schuiven, elementen buiten het frame, aanraakvlakken
onder 44 pt, gebroken plaatjes en fouten in de console.

Zestien schermen × twee formaten. Begonnen met **34 bevindingen**, geëindigd
met **3**, en die drie zijn geen fout:

| Bevinding | Oordeel |
|---|---|
| `native-switch` is 28 px hoog | Zo hoort een schakelaar eruit te zien; het raakvlak eromheen is 44 pt (`::before`) |
| `memo-pick` meet 4 px | Een knop die half uit het scrollvak staat op het moment van meten |

### Wat de doorloop opleverde en is rechtgezet

- **De klok van Wat ben ik? en Fotozoom stond buiten het scherm.**
  `.whoami-timer` staat op `position:absolute; top:100%`, maar de kopregel was
  geen positioned ancestor, dus rekende hij tegen het hele scherm: de klok hing
  onder de onderrand. Je hoorde hem aftikken en zag hem nooit. De kopregel is nu
  `position:relative`. Gemeten: 46 px op de telefoon, 56 px op de iPad, in beeld.
- **Aanraakvlakken onder 44 pt**: de munt- en vlamtellers op Home en in een spel
  (34 en 28 px), de wereldknopjes bij de weetjes (30), de stemrondjes (36), de
  profielknop (32), de taalknoppen (38) en de plus/min van de schoolgroep (30).
  Allemaal op 44 pt gebracht; het uiterlijk blijft.
- **De zes niveauknoppen in de ouderzone** werden in de smalle rechterkolom tot
  30 px platgeknepen. Ze staan nu op een eigen regel over de volle breedte.

---

## 3 · Wat er deze ronde nog meer is gedaan

### Beeld
- Kunst en sport waren op de iPad onzichtbaar: het versiemerk achter de paden
  stond alleen op de mascottes, dus een vervangen plaat bleef een dag oud in de
  cache. `K.ASSET_V` staat nu bovenaan en stempelt élke kunstkaart in één keer.
- De beeldstand van de tegels stond twee keer in het project (CSS én
  `K.WORLD_FOCUS`); de CSS-regels zijn weg. Het wereldscherm leest nu dezelfde
  kaart, zodat het eiland per wereld goed staat in plaats van overal de
  middenband.
- Mysterie stond te dicht op de poort: van 25 % naar 33 %, zodat je net als bij
  de rest wat meer van het eiland ziet.
- Zes buddy's waren 288 × 512 aangeleverd en verloren in de ronde pasfoto hun
  zijkanten (pip zijn vleugels). `tools/mascot-square.cjs` vult ze bij in plaats
  van bij te snijden.
- De popup van een vrijgespeelde buddy toont de hele portretplaat in een ronde
  lijst; de uitsnede liet bij terra een pluk gras staan.
- De munt in de runner draait om zijn as met zichtbare dikte.

### Spel
- **Niveau werkt nu overal.** De tijd per vraag volgde alleen het niveau dat een
  wereld zelf had verdiend. `K.playLevel` neemt het hoogste van verdiend en
  gekozen: 30 / 25 / 20 / 16 / 13 / 10 seconden. De voortgangsrekening blijft
  het verdiende niveau gebruiken.
- **Wat ben ik?, Fotozoom en Memo deden niets bij kunst en sport**, omdat
  `answer-art.js` met de hand is samengesteld over de 480 platen van toen. Voor
  een wereld die daar niet in staat geldt nu een afleiding uit de eigen plaat:
  kunst 68 en sport 77 vragen doen mee.
- **Memo groeit op een tablet de breedte in**: vier rijen hoog, per niveau een
  kolom erbij, zodat de kaarten hun grootte van niveau 1 houden.
- **Fotozoom**: vierkante uitsnede, verder ingezoomd, liggend vult hij de
  linkerkolom.
- **Rekenen** ging bij "Terug" naar een wereldscherm; het spel start vanaf Home,
  dus terug gaat naar Home.
- **Weetjes bood kunst en sport aan en gaf dan een leeg scherm.** De kiezer toont
  nu alleen werelden waarvoor weetjes geschreven zijn, en `showFacts` valt
  terug op "alles" in plaats van niets te tonen.
- Eén lucht voor alle minispellen: elk spel staat op zijn eigen eiland
  (`assets/games/*-island.jpg`), en die zijn onder dezelfde hemel getekend.

### Speler en gids
- **Terugkeerscherm**: "Hoi Jan!", je niveau, munten, reeks en waar je gebleven
  was, met verder spelen of iemand anders. Meer spelers op één toestel
  (`K.players`); niemands voortgang gaat verloren bij een wissel.
- **De gekozen stem is nu ook een gezicht.** Wie Luna koos zag overal Milo.
  `K.setVoice` laat de buddy meeverhuizen, tenzij het kind zelf een andere uit
  de collectie koos.
- De gids die bij een goed antwoord achter de popup vandaan piept, is nu een
  pratend portret: de mond gaat open op de luidheid van de uitleg die op dat
  moment wordt voorgelezen. Hij komt verder naar buiten en staat niet meer
  scheef.
- De rondleiding: de zin over de spellen was te lang en werd afgekapt, de zin
  over de bovenbalk zei "level" en "streak" en stotterde ("zie je je"). Beide
  herschreven in alle tien de talen.

---

## 4 · Getest

| Suite | Uitkomst |
|---|---|
| `npm test` (vragen, kern, scores, weetjes, mascottes, teksten, server, content) | groen |
| `ui-smoke`, `levels`, `whoami`, `fotozoom`, `memo`, `math`, `facts`, `milo` | zie laatste run |
| Doorloop 16 schermen × 2 formaten | 3 bevindingen, alle drie verklaard |

Onderweg zijn zeven verouderde testverwachtingen rechtgezet die al fout stonden
sinds kunst en sport erbij kwamen (zes werelden in plaats van acht, 600 in
plaats van 800 punten, zeven memo-werelden in plaats van negen).

---

## 5 · Wat er nog ligt

### Inhoud
1. ~~**32 weetjes voor kunst en sport**~~ — gedaan op 29 september: 16 per wereld,
   tien talen, 32 platen (ElevenLabs-flow “Kwizillo weetjes kunst en sport”).
2. **Spraak in de andere acht talen** — niet vooruit betaald; de cache vult zich
   tijdens het spelen.
3. ~~**Milo's `worlds`-clip** opnieuw inspreken~~ — gedaan op 29 september (tekst
   en timing gecontroleerd met `clipcheck`). Let op: de rondleiding speelt bewust
   géén clips (`milo.js`, stop-lus), dus deze clip is nu nergens te zien. `K.warmTour`
   laadt de tourclips wel vooraf (±3 MB per clip) — dat kan eruit.

### Techniek
4. **`tests/ipad.spec.js`**: drie tests over de liggende stand verwachten nog de
   staande verhouding 430 : 764, terwijl het brede frame 1180 × 820 is. Bestaande
   achterstand, geen fout in de app.
5. **De liggende openingsfilm** (`assets/brand/intro-wide.mp4`): Higgsfield heeft
   geen tegoed meer. Tot die tijd toont het brede frame de staande film heel.
6. **`tools/eleven-balance.cjs`** krijgt HTTP 401 `missing permission user_read`;
   het saldo is niet af te lezen. Rechteninstelling op de sleutel.

### Voor de release
7. Audio-QA: twintig vragen nl en twintig en beluisteren (`AUDIO_QA.md`).
8. Foutsituaties: geen internet, trage verbinding, ElevenLabs-time-out, snel
   tikken, taal wisselen tijdens een quiz, app naar de achtergrond.
9. iOS: Capacitor-build, pictogram, opstartscherm, TestFlight
   (`IOS_RELEASE_CHECKLIST.md`).
