# Kwizillo Runner — aan te leveren afbeeldingen

Alle bestanden zijn PNG (transparant waar aangegeven) en komen in
`assets/games/jungle/img/`. Zet na het toevoegen de bestandsnaam (zonder `.png`)
in `assets/games/jungle/img/manifest.json` — alleen wat daarin staat wordt geladen;
wat ontbreekt krijgt automatisch een jungle-plaatje als tijdelijke vervanger, dus het
spel blijft altijd werken terwijl je bezig bent.

Stijl: dezelfde als de huidige jungle-set (3D-cartoon, schuin van achteren belicht,
zachte schaduwen). Figuren en objecten worden **van achteren / schuin van achteren**
gezien, want de camera rent achter de speler aan.

## 1. Held: meisje (jongen bestaat al)

Zelfde maten en poses als de jongen (`hero-boy-*`), transparant, gecentreerd, voeten
op ±20 px van de onderrand.

| Bestand | Maat | Inhoud |
|---|---|---|
| `hero-girl-run-01.png` … `hero-girl-run-04.png` | 384×448 | rencyclus in 4 frames (zoals `hero-boy-run-01..04`) |
| `hero-girl-jump.png` | 384×448 | sprongpose |
| `hero-girl-flip.png` | 1774×887 | salto-atlas: 4 kolommen × 2 rijen van 443×443, links-boven = begin van de salto |
| `hero-girl-glide.png` | 640×448 | hangend aan een deltavlieger (vleugel bovenin, kind eronder), van achteren |
| `hero-boy-glide.png` | 640×448 | idem voor de jongen (tot die er is, gebruikt het spel de sprongpose) |

## 2. Level Stad

| Bestand | Maat | Inhoud |
|---|---|---|
| `city-day.png` | 587×887 | achtergrond-schilderij. **Bovenste 45 %** = skyline/verte die je aan de horizon ziet (gebouwen, lucht, zon). **Onderste 20 %** (y 710–887), **middelste 40 %** van de breedte (x 176–411) = het wegdek als textuur die verticaal doorloopt/herhaalt (asfalt met wegmarkering); de rest van de onderste band wordt niet gebruikt (stoep komt uit code). |
| `obstacle-barrier.png` | ±365×205, transparant | laag obstakel waar je **overheen springt** (wegafzetting/hek), van achteren |
| `obstacle-cone.png` | ±339×276, transparant | hoog obstakel dat je **ontwijkt** (bv. groot verkeersbord, vuilcontainer, pion-stapel) |
| `scenery-lamp.png` | ±335×397, transparant | lantaarnpaal (staat langs de stoeprand) |
| `scenery-building.png` | ±400×500, transparant | los gebouw/gevel, onderkant = straatniveau |
| `scenery-tree-city.png` | ±335×397, transparant | stadsboom in plantenbak |
| `collectible-city-card.png` | 237×307 | verzamelkaart voor dit level (bv. "Stadsster") |

## 3. Level Lucht (rennen op wolken + vliegen aan een deltavlieger)

| Bestand | Maat | Inhoud |
|---|---|---|
| `sky-day.png` | 587×887 | achtergrond: bovenste 45 % = lucht, verre bergen/wolken, zon; onderste 20 % middenstrook = het wolkenpad als textuur (wit/lichtblauw, zacht, verticaal herhalend) |
| `obstacle-bird.png` | ±365×205, transparant | vogel die op je afvliegt (laag obstakel: eroverheen springen/zwiepen) |
| `obstacle-storm.png` | ±339×276, transparant | onweerswolk met bliksem (hoog obstakel: ontwijken) |
| `scenery-cloud.png` | ±353×290, transparant | wolkje langs het pad |
| `scenery-balloon.png` | ±335×397, transparant | luchtballon (zweeft hoger naast het pad) |
| `scenery-island.png` | ±400×400, transparant | zwevend eilandje |
| `collectible-sky-card.png` | 237×307 | verzamelkaart voor dit level (bv. "Wolkenveer") |

## 4. Optioneel (Jungle)

De jungle is compleet (`jungle-watervallen`, `jungle-tempel`, `jungle-avond`, log, rots,
boom, varen, brug, kaart). Alleen `hero-boy-glide.png` mist nog, maar de jungle vliegt niet.

## Hoe het spel ze gebruikt

- Levels en helden kies je op het startscherm; het spel onthoudt de keuze.
- In **Lucht** valt het wolkenpad twee keer weg (op 22–46 % en 66–88 % van de rit):
  de held hangt dan aan de deltavlieger, munten en vogels zweven in de lucht,
  daarna land je weer op de wolken.
- De baan buigt nu ook in bochten (alle levels).

## 5. Nog te maken (na de dev-pack van 18 sept)

| Bestand | Maat | Inhoud |
|---|---|---|
| `hero-boy-portrait.png`, `hero-girl-portrait.png` | ±600×700, transparant | portret **van voren** (glimlach, zwaaien) voor de keuzekaarten op het startscherm |
| `hero-boy-swing.png`, `hero-girl-swing.png` | 384×560, transparant | hangend aan een liaan met beide handen boven het hoofd, van achteren, benen los (jungle-slingerstukken; tot dan wordt de sprongpose gebruikt) |

Nieuw in het spel: **Turbo** (⚡-bol: 5 seconden supersnel, alle munten dubbel) in elk level, en in de jungle twee **slingerstukken** aan een liaan boven een ravijn (30–41 % en 70–81 % van de rit).
