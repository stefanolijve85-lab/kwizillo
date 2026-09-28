(() => {
  const defs = {
    ruimte: {
      zonnestelsel: [
        ['Welke planeet staat het dichtst bij de zon?','Mercurius',['Venus','Mars','Aarde'],'Het is de kleinste planeet en staat helemaal vooraan.','Mercurius staat het dichtst bij de zon.','Een jaar op Mercurius duurt maar 88 aardse dagen.'],
        ['Welke planeet is onze thuisplaneet?','Aarde',['Venus','Mars','Jupiter'],'Hier wonen mensen, dieren en planten.','Wij wonen op de aarde.','Ongeveer 71% van de aarde is bedekt met water.'],
        ['Welke planeet staat bekend als de rode planeet?','Mars',['Venus','Saturnus','Neptunus'],'De bodem bevat veel ijzeroxide.','Mars wordt de rode planeet genoemd.','Mars heeft twee kleine manen: Phobos en Deimos.'],
        ['Welke planeet heeft de bekendste ringen?','Saturnus',['Aarde','Mercurius','Mars'],'Hij is een grote gasreus.','Saturnus heeft een opvallend ringsysteem.','De ringen bestaan vooral uit ijs en gesteente.'],
        ['Welke planeet is de grootste van ons zonnestelsel?','Jupiter',['Mars','Venus','Aarde'],'Hij heeft een beroemde Grote Rode Vlek.','Jupiter is de grootste planeet.','In Jupiter passen meer dan duizend aardes.'],
        ['Welke planeet staat het verst van de zon?','Neptunus',['Jupiter','Aarde','Venus'],'Het is een verre blauwe ijsreus.','Neptunus is de verste planeet van de zon.','Een jaar op Neptunus duurt ongeveer 165 aardse jaren.'],
        ['Welke planeet ligt tussen Venus en Mars?','Aarde',['Mercurius','Jupiter','Saturnus'],'Het is onze eigen planeet.','De volgorde is Venus, Aarde, Mars.','De aarde is de derde planeet vanaf de zon.'],
        ['Wat draait om de aarde?','De maan',['Jupiter','De zon','Mars'],'Je ziet hem vaak aan de nachtelijke hemel.','De maan draait om de aarde.','De maan doet ongeveer 27 dagen over één omloop.'],
        ['Hoeveel planeten heeft ons zonnestelsel?','8',['7','9','10'],'Pluto telt tegenwoordig als dwergplaneet.','Ons zonnestelsel heeft acht planeten.','Sinds 2006 wordt Pluto als dwergplaneet ingedeeld.'],
        ['Welke planeet is beroemd om zijn sterke blauwe kleur?','Neptunus',['Mercurius','Mars','Venus'],'Hij is een verre ijsreus.','Neptunus ziet er diepblauw uit.','Methaan in de atmosfeer draagt bij aan zijn blauwe kleur.']
      ],
      sterren_planeten: [
        ['Wat is de zon?','Een ster',['Een planeet','Een maan','Een komeet'],'Hij maakt zelf licht en warmte.','De zon is een ster.','Zonlicht doet er ongeveer 8 minuten over om de aarde te bereiken.'],
        ['Wat is een ster vooral?','Een hete bol gas en plasma',['Een koude rots','Een maan','Een wolk'],'Sterren geven zelf licht.','Sterren bestaan uit extreem heet gas en plasma.','Onze zon is een middelgrote ster.'],
        ['Wat is een sterrenstelsel?','Een enorme groep sterren',['Eén planeet','Een telescoop','Een wolk op aarde'],'De Melkweg is er één.','Een sterrenstelsel bevat heel veel sterren.','De Melkweg bevat honderden miljarden sterren.'],
        ['Hoe heet ons sterrenstelsel?','De Melkweg',['Andromeda','Orion','Saturnus'],'Je ziet soms een lichte band aan een donkere hemel.','Ons zonnestelsel ligt in de Melkweg.','De Melkweg is een spiraalstelsel.'],
        ['Wat is een supernova?','Een enorme sterexplosie',['Een nieuwe maan','Een raketlancering','Een regenbui'],'Het gebeurt aan het einde van het leven van sommige sterren.','Een supernova is een enorme explosie van een ster.','Zo’n explosie kan tijdelijk extreem helder zijn.'],
        ['Welke kleur hebben de heetste sterren meestal?','Blauw',['Rood','Bruin','Groen'],'Blauw licht hoort bij zeer hoge temperaturen.','Zeer hete sterren zien vaak blauwachtig uit.','Rode sterren zijn doorgaans koeler dan blauwe.'],
        ['Wat is een exoplaneet?','Een planeet bij een andere ster',['Een maan van de aarde','Een komeet','Een satelliet'],'Hij draait niet om onze zon.','Een exoplaneet draait om een andere ster dan de zon.','Er zijn inmiddels duizenden exoplaneten ontdekt.'],
        ['Wat is een zwart gat?','Een gebied met extreem sterke zwaartekracht',['Een donkere planeet','Een wolk','Een raketmotor'],'Zelfs licht kan er niet makkelijk uit ontsnappen.','Een zwart gat heeft extreem sterke zwaartekracht.','Veel zwarte gaten ontstaan uit zware sterren.'],
        ['Welke ster staat het dichtst bij de aarde?','De zon',['Sirius','Polaris','Betelgeuze'],'Je ziet hem iedere dag.','De zon is onze dichtstbijzijnde ster.','De volgende dichtstbijzijnde ster is veel verder weg.'],
        ['Waarom lijken sterren te fonkelen?','Door de aardse atmosfeer',['Omdat ze knipperen','Door hun manen','Omdat ze draaien'],'Hun licht wordt onderweg door luchtlagen gebogen.','De atmosfeer laat sterrenlicht een beetje trillen.','Planeten fonkelen meestal minder sterk dan sterren.']
      ],
      astronauten: [
        ['Hoe heet iemand die naar de ruimte reist?','Astronaut',['Archeoloog','Duiker','Kapitein'],'Die persoon draagt vaak een ruimtepak.','Een astronaut reist en werkt in de ruimte.','Astronauten trainen vaak jarenlang.'],
        ['Waarom dragen astronauten een ruimtepak buiten een ruimteschip?','Voor lucht en bescherming',['Voor warmte','Voor snelheid','Als uniform'],'In de ruimte kun je niet gewoon ademhalen.','Een ruimtepak levert zuurstof en bescherming.','Een ruimtepak beschermt ook tegen extreme temperaturen.'],
        ['Wat voelen astronauten in een ruimtestation vaak?','Gewichtloosheid',['Zware regen','Sterke wind','Aardbevingen'],'Ze lijken te zweven.','In een baan om de aarde ervaren astronauten microzwaartekracht.','Alles moet worden vastgezet zodat het niet wegzweeft.'],
        ['Waar slapen astronauten vaak in het ruimtestation?','In vastgemaakte slaapzakken',['In gewone bedden','In hangmatten buiten','Op de vloer'],'Anders zouden ze wegzweven.','Astronauten slapen vaak in vastgemaakte slaapzakken.','Er is in microzwaartekracht geen echte boven- of onderkant.'],
        ['Waarom trainen astronauten onder water?','Om gewichtloosheid na te bootsen',['Om sneller te zwemmen','Om maanwater te zoeken','Voor ontspanning'],'Onder water kun je zwevende bewegingen oefenen.','Onderwatertraining helpt bij het oefenen van ruimtewandelingen.','Grote zwembaden bevatten soms modellen van ruimtestationdelen.'],
        ['Wat is een ruimtewandeling?','Werk buiten een ruimtevaartuig',['Lopen op aarde','Rennen in een raket','Wandelen in een museum'],'De astronaut blijft met veiligheidssystemen verbonden.','Een ruimtewandeling heet ook EVA.','Astronauten dragen daarbij een volledig ruimtepak.'],
        ['Wat gebeurt er met spieren in langdurige gewichtloosheid?','Ze kunnen zwakker worden',['Ze worden van staal','Ze verdwijnen direct','Ze groeien altijd sneller'],'Daarom sporten astronauten veel.','Zonder training kunnen spieren en botten verzwakken.','Astronauten trainen dagelijks in het ISS.'],
        ['Wat eten astronauten in de ruimte?','Speciaal verpakt voedsel',['Pillen','IJs','Niets'],'Het moet veilig zijn in microzwaartekracht.','Astronauten eten speciaal verpakt voedsel.','Kruimels zijn lastig omdat ze kunnen rondzweven.'],
        ['Wat is het ISS?','Een internationaal ruimtestation',['Een planeet','Een raketmotor','Een maanbasis'],'Het draait om de aarde.','Het ISS is een groot ruimtestation in een baan om de aarde.','Astronauten uit verschillende landen werken er samen.'],
        ['Waarom moet een astronaut zich vastmaken tijdens werk?','Om niet weg te zweven',['Voor extra zwaartekracht','Tegen regen','Voor snelheid'],'In microzwaartekracht blijf je makkelijk bewegen.','Vastmaken voorkomt dat iemand ongecontroleerd wegdrijft.','Ook gereedschap wordt vaak gezekerd.']
      ],
      raket_avontuur: [
        ['Waarvoor dient een raketmotor?','Om stuwkracht te maken',['Om foto\'s te printen','Om zuurstof te maken','Om sterren te tellen'],'Hij duwt hete gassen naar achteren.','Een raketmotor levert stuwkracht.','Volgens actie-reactie beweegt de raket de andere kant op.'],
        ['Waarom heeft een raket veel brandstof nodig?','Om aan de zwaartekracht te ontsnappen',['Voor verlichting','Voor airco','Voor de radio'],'Liftoff kost heel veel energie.','Een lancering vereist enorme hoeveelheden energie.','Het grootste deel van een raket bij vertrek kan uit brandstof bestaan.'],
        ['Wat gebeurt er bij liftoff?','De raket stijgt op',['De raket landt','De motor stopt altijd','De maan komt dichterbij'],'Dit is het startmoment.','Liftoff is het moment waarop de raket opstijgt.','De eerste seconden zijn technisch zeer belangrijk.'],
        ['Waarom hebben sommige raketten meerdere trappen?','Om lege delen af te werpen',['Voor extra ramen','Voor slaapruimtes','Voor kleuren'],'Zo hoeft de raket minder massa mee te nemen.','Raketten kunnen trappen afwerpen zodra brandstof op is.','Dat maakt verdere versnelling efficiënter.'],
        ['Wat is een lanceerplatform?','De plek waar een raket vertrekt',['Een satelliet','Een maanvoertuig','Een cockpitstoel'],'De raket staat er voor de start.','Een lanceerplatform ondersteunt de raket voor de vlucht.','Er zijn enorme systemen voor brandstof, koeling en veiligheid.'],
        ['Wat is een satelliet?','Een object dat om een ander object draait',['Een sterexplosie','Een raketmotor','Een telescoop'],'Ook de maan is technisch een natuurlijke satelliet.','Satellieten draaien in een baan om een planeet of ander hemellichaam.','Kunstmatige satellieten helpen bij navigatie en communicatie.'],
        ['Waarom is de neus van een raket gestroomlijnd?','Om luchtweerstand te verminderen',['Om zwaarder te zijn','Om meer regen te vangen','Voor kleur'],'Een gladde vorm gaat makkelijker door de lucht.','Een gestroomlijnde vorm vermindert weerstand.','Na het verlaten van de atmosfeer is luchtweerstand bijna weg.'],
        ['Wat is een capsule?','Een deel waarin mensen of vracht kunnen reizen',['Een sterrenstelsel','Een maan','Een motorbrandstof'],'Hij zit vaak bovenop de raket.','Een ruimtecapsule vervoert mensen of lading.','Sommige capsules keren terug met parachutes.'],
        ['Wat helpt een capsule veilig landen?','Parachutes',['Sterren','Zonnevlammen','Asteroïden'],'Ze remmen de daling af.','Parachutes vertragen een terugkerende capsule.','Sommige voertuigen landen ook met motoren.'],
        ['Wat is een baan om de aarde?','Een route waarbij je rond de aarde blijft vallen',['Een rechte weg naar de zon','Een tunnel','Een wolk'],'Snelheid en zwaartekracht zijn samen in balans.','Een satelliet in een baan blijft voortdurend om de aarde vallen.','Daarom stort hij niet meteen naar beneden.']
      ]
    },
    geschiedenis: {
      egyptenaren: [
        ['Waarvoor werden veel piramides gebouwd?','Als grafmonument',['Als school','Als markt','Als haven'],'Denk aan farao’s en hun begrafenis.','Veel piramides waren grafmonumenten voor farao’s.','De Grote Piramide van Gizeh is duizenden jaren oud.'],
        ['Hoe heette een heerser in het oude Egypte?','Farao',['Senator','Ridder','Viking'],'Hij stond bovenaan de samenleving.','Een Egyptische heerser werd farao genoemd.','Sommige farao’s werden als goddelijk beschouwd.'],
        ['Welke rivier was zeer belangrijk voor Egypte?','De Nijl',['De Rijn','De Amazone','De Donau'],'Hij stroomt door het land en zorgt voor vruchtbare grond.','De Nijl was essentieel voor landbouw en vervoer.','Jaarlijkse overstromingen brachten vruchtbaar slib.'],
        ['Hoe heet het Egyptische schrift met tekens en afbeeldingen?','Hiërogliefen',['Latijn','Runen','Morsecode'],'Je ziet het op tempels en graven.','Hiërogliefen waren een belangrijk Egyptisch schrift.','Het schrift gebruikte honderden tekens.'],
        ['Wat is een mummie?','Een bewaard lichaam',['Een gouden munt','Een tempel','Een boot'],'Het lichaam werd speciaal behandeld na de dood.','Egyptenaren maakten mummies om lichamen te bewaren.','Het proces kon vele weken duren.'],
        ['Waar schreven Egyptenaren vaak op?','Papyrus',['Plastic','Beton','Aluminium'],'Het werd gemaakt van een plant langs de Nijl.','Papyrus werd gebruikt als schrijfmateriaal.','Ons woord papier is verwant aan papyrus.'],
        ['Wat was de Sfinx van Gizeh?','Een beeld met leeuwenlichaam en mensenhoofd',['Een piramide','Een schip','Een kroon'],'Hij staat vlak bij de piramides.','De Grote Sfinx is een enorm stenen beeld.','De Sfinx is uit kalksteen gehouwen.'],
        ['Waarvoor gebruikten Egyptenaren irrigatie?','Om akkers water te geven',['Om piramides te schilderen','Om te schrijven','Om munten te maken'],'Water uit de Nijl moest naar velden worden geleid.','Irrigatie hielp de landbouw.','Kanalen en bassins verdeelden water over akkers.'],
        ['Welke dieren werden in Egypte vaak als bijzonder beschouwd?','Katten',['IJsberen','Pinguïns','Kangoeroes'],'Ze kwamen veel voor in kunst en religie.','Katten hadden een bijzondere plaats in het oude Egypte.','De godin Bastet werd vaak als kat afgebeeld.'],
        ['Wat deden schrijvers in het oude Egypte?','Teksten en administratie bijhouden',['Piramides vliegen','Ridders trainen','Sterren maken'],'Schrijven was een belangrijke vaardigheid.','Schrijvers hielden informatie en belastingen bij.','Niet iedereen kon lezen en schrijven.']
      ],
      ridders_kastelen: [
        ['Wat droeg een ridder vaak ter bescherming?','Een harnas',['Een ruimtepak','Een badjas','Een duikpak'],'Het was gemaakt van metaal.','Een harnas beschermde het lichaam.','Een volledig harnas bestond uit veel losse onderdelen.'],
        ['Waar woonde een machtige heer vaak?','In een kasteel',['In een raket','In een piramide','In een iglo'],'Het gebouw had dikke muren.','Kastelen waren woon- en verdedigingsplaatsen.','Veel kastelen hadden torens en muren.'],
        ['Wat is een slotgracht?','Een watergracht rond een kasteel',['Een slaapkamer','Een marktplein','Een wapenkamer'],'Hij maakte aanvallen moeilijker.','Een slotgracht hielp een kasteel verdedigen.','Niet iedere slotgracht bevatte altijd water.'],
        ['Wat is een ophaalbrug?','Een brug die omhoog kan',['Een geheime trap','Een vlag','Een toren'],'Hij lag vaak bij de ingang.','Een ophaalbrug kon de toegang blokkeren.','Hij werd vaak gecombineerd met een poort.'],
        ['Wat gebeurde bij een riddertoernooi?','Ridders namen deel aan wedstrijden',['Men bouwde piramides','Men voer naar Amerika','Men maakte telescopen'],'Denk aan steekspelen.','Toernooien waren wedstrijden voor ridders.','Steekspelen waren spectaculaire onderdelen.'],
        ['Wat is een schild?','Bescherming tegen aanvallen',['Een muziekinstrument','Een kaart','Een drinkbeker'],'Ridders droegen het vaak aan één arm.','Een schild beschermt tegen wapens.','Schilden droegen vaak symbolen of wapens.'],
        ['Wie woonde meestal niet permanent in een middeleeuws kasteel?','Alle boeren uit de omgeving',['De kasteelheer','Soldaten','Bedienden'],'Veel mensen woonden in dorpen rondom het kasteel.','De meeste boeren woonden buiten het kasteel.','Bij gevaar konden mensen soms beschutting zoeken.'],
        ['Waarom hadden kastelen dikke muren?','Voor verdediging',['Voor sneller internet','Voor warmte','Voor decoratie'],'Ze moesten aanvallen kunnen weerstaan.','Dikke stenen muren maakten kastelen sterker.','Later maakten kanonnen veel muren minder effectief.'],
        ['Wat deed een schildknaap vaak?','Een ridder helpen en leren',['Een farao begraven','Een raket besturen','Een tempel bouwen'],'Hij bereidde zich soms voor op ridderschap.','Een schildknaap hielp een ridder en leerde vaardigheden.','Niet iedere schildknaap werd uiteindelijk ridder.'],
        ['Wat was een burcht?','Een versterkte woonplaats',['Een sterrenstelsel','Een schip','Een schoolvak'],'Het woord wordt vaak voor kastelen gebruikt.','Een burcht was een versterkte plek.','Burchten stonden vaak op strategische locaties.']
      ],
      romeinen: [
        ['Wie bouwden het Colosseum?','De Romeinen',['De Vikingen','De Maya’s','De Egyptenaren'],'Het staat in Rome.','Het Colosseum werd door de Romeinen gebouwd.','Het kon tienduizenden toeschouwers ontvangen.'],
        ['Wat was een aquaduct?','Een bouwwerk om water te vervoeren',['Een ridderhelm','Een tempel voor boten','Een munt'],'Het bracht water naar steden.','Romeinse aquaducten vervoerden water over grote afstanden.','Sommige aquaducten zijn nog steeds zichtbaar.'],
        ['Welke taal spraken veel Romeinen?','Latijn',['Nederlands','Japans','Arabisch'],'Veel Europese woorden komen eruit voort.','Latijn was een belangrijke taal in het Romeinse Rijk.','Frans, Spaans en Italiaans zijn Romaanse talen.'],
        ['Wat was een legioen?','Een grote groep Romeinse soldaten',['Een markt','Een badhuis','Een schip'],'Het hoorde bij het leger.','Een legioen was een grote leger-eenheid.','Romeinse soldaten trainden streng.'],
        ['Wat was een forum in een Romeinse stad?','Een centraal plein',['Een gevangenis','Een boerderij','Een haven'],'Mensen kwamen er voor handel en bestuur.','Het forum was een belangrijk stadscentrum.','Er stonden vaak tempels en openbare gebouwen.'],
        ['Waarvoor waren Romeinse badhuizen?','Wassen en ontmoeten',['Raketten bouwen','Graan opslaan','Paarden trainen'],'Mensen kwamen er ook sociaal samen.','Badhuiscomplexen waren belangrijke ontmoetingsplekken.','Sommige hadden warme en koude baden.'],
        ['Wat droeg een Romeinse soldaat vaak?','Een helm en schild',['Een ruimtepak','Een cowboyhoed','Een duikpak'],'Hij moest zich beschermen in gevechten.','Romeinse soldaten gebruikten helmen, schilden en wapens.','Hun uitrusting veranderde door de eeuwen heen.'],
        ['Wat betekent “Romeinse Rijk”?','Een groot gebied bestuurd vanuit Rome',['De stad Rome','Een piramide','Een ridderorde'],'Het strekte zich over grote delen van Europa uit.','Het Romeinse Rijk was zeer uitgestrekt.','Op zijn hoogtepunt omvatte het gebieden rond de Middellandse Zee.'],
        ['Wat gebruikten Romeinen voor lange afstanden over land?','Uitgebreide wegen',['Rivieren','Luchtballonnen','Treinen'],'Veel wegen waren stevig aangelegd.','Romeinen bouwden een groot wegennet.','Sommige moderne wegen volgen oude Romeinse routes.'],
        ['Wat was een senator in Rome?','Een belangrijk bestuurder',['Een gladiator altijd','Een farao','Een ridder'],'Hij had een politieke rol.','Senatoren hadden invloed op het bestuur.','De Romeinse Senaat bestond eeuwenlang.']
      ],
      ontdekkingsreizigers: [
        ['Wat deed een ontdekkingsreiziger?','Nieuwe gebieden verkennen',['Planeten bouwen','Elektriciteit uitvinden','Piramides bewaken'],'Denk aan verre reizen.','Ontdekkingsreizigers trokken naar onbekende gebieden.','Hun reizen veranderden kaarten en handel.'],
        ['Waarvoor gebruikten zeevaarders een kompas?','Om richting te bepalen',['Om eten te koken','Om te schrijven','Om diepte te meten'],'De naald wijst ongeveer naar het noorden.','Een kompas helpt bij navigatie.','Het maakte lange zeereizen betrouwbaarder.'],
        ['Wat is een zeekaart?','Een kaart voor varen op zee',['Een schilderij','Een ridderwapen','Een sterrenbeeld'],'Schepen gebruikten hem voor routes.','Zeekaarten tonen kusten, gevaren en routes.','Moderne schepen gebruiken vaak digitale kaarten.'],
        ['Waarom waren sterren nuttig voor zeevaarders?','Om de positie te helpen bepalen',['Om vis te lokken','Om wind te maken','Om water te verwarmen'],'Vooral ’s nachts gaven ze richting.','Sterren konden helpen bij navigatie.','De Poolster was belangrijk op het noordelijk halfrond.'],
        ['Wat was een karveel?','Een type zeilschip',['Een Romeins bad','Een kasteel','Een tempel'],'Het werd gebruikt voor verre reizen.','Karvelen waren wendbare zeilschepen.','Ze speelden een rol in Europese ontdekkingsreizen.'],
        ['Waarom namen ontdekkingsreizigers voorraden mee?','Omdat reizen lang konden duren',['Omdat winkels op zee waren','Voor decoratie','Om sterren te bouwen'],'Op zee kon je niet zomaar boodschappen doen.','Voedsel en water waren cruciaal voor lange reizen.','Tekorten en ziekten vormden grote risico’s.'],
        ['Wat is navigatie?','Bepalen waar je bent en waar je heen gaat',['Een schip schilderen','Een taal leren','Een markt bouwen'],'Kompas en kaarten helpen daarbij.','Navigatie is het plannen en volgen van een route.','GPS is een moderne vorm van navigatie.'],
        ['Wat was een belangrijk gevaar op lange zeereizen?','Stormen en ziekte',['Verkeerslichten','Sneeuw in de woestijn','Satellieten'],'Reizen duurden soms maanden.','Stormen, ziekten en voedseltekorten waren gevaarlijk.','Scheurbuik kwam door langdurig vitamine-C-tekort.'],
        ['Waarom werden nieuwe routes naar Azië gezocht?','Voor handel in kostbare goederen',['Voor skiën','Voor dinosaurussen','Voor ruimtevaart'],'Specerijen waren zeer waardevol.','Handel stimuleerde veel ontdekkingsreizen.','Specerijen konden in Europa zeer duur zijn.'],
        ['Wat deden kaartenmakers na nieuwe reizen?','Kaarten verbeteren',['Piramides verhogen','Sterren verplaatsen','Tijd veranderen'],'Nieuwe kennis werd toegevoegd.','Reisverslagen hielpen kaarten nauwkeuriger maken.','Kaarten werden door de eeuwen steeds gedetailleerder.']
      ]
    },
    wetenschap: {
      slimme_proefjes: [
        ['Wat gebeurt er vaak als je bakpoeder en azijn mengt?','Er ontstaan belletjes gas',['Het bevriest meteen','Het wordt metaal','Er gebeurt niets'],'Je ziet veel bruisen.','Bij de reactie ontstaat onder andere koolstofdioxide.','Dat gas kan bijvoorbeeld een ballon opblazen.'],
        ['Waarom draag je bij sommige proefjes een veiligheidsbril?','Om je ogen te beschermen',['Om beter te horen','Om sneller te rennen','Voor kleur'],'Sommige stoffen kunnen spatten.','Een veiligheidsbril beschermt je ogen.','Veilig werken is een belangrijk onderdeel van wetenschap.'],
        ['Wat is een hypothese?','Een testbare verwachting',['Een vaststaand feit','Een meetinstrument','Een vloeistof'],'Je bedenkt wat je verwacht voordat je test.','Een hypothese is een voorspelling die je kunt onderzoeken.','Na een experiment kan de hypothese wel of niet worden ondersteund.'],
        ['Wat moet je bij een eerlijk experiment zoveel mogelijk gelijk houden?','Andere omstandigheden',['De uitkomst','De vraag','Je naam'],'Je verandert liefst maar één ding tegelijk.','Controle van variabelen maakt een experiment eerlijker.','Zo weet je beter waardoor een effect komt.'],
        ['Wat gebruik je om vloeistofvolume nauwkeurig te meten?','Een maatcilinder',['Een vergrootglas','Een kompas','Een stopwatch'],'Hij heeft streepjes aan de zijkant.','Een maatcilinder meet volume.','Volume wordt vaak in milliliters gemeten.'],
        ['Wat doet een thermometer in een proef?','Temperatuur meten',['Tijd meten','Gewicht meten','Licht maken'],'Warm of koud kun je ermee meten.','Een thermometer meet temperatuur.','Bij ons gebruiken we vaak graden Celsius.'],
        ['Waarom noteer je resultaten van een proef?','Om ze te kunnen vergelijken',['Om ze te vergeten','Om het glas schoon te maken','Voor versiering'],'Wetenschappers schrijven metingen op.','Resultaten noteren helpt bij analyse en herhaling.','Goede wetenschap moet controleerbaar zijn.'],
        ['Wat gebeurt er met ijs als je het verwarmt?','Het smelt',['Het wordt steen','Het verdwijnt meteen','Het wordt zwaarder'],'Vast water wordt vloeibaar.','IJs smelt tot water.','Bij normale druk smelt ijs rond 0 °C.'],
        ['Wat heb je nodig voor een schaduw?','Een lichtbron en een voorwerp',['Geluid','Water','Wind'],'Het voorwerp blokkeert licht.','Een schaduw ontstaat wanneer licht wordt tegengehouden.','De grootte verandert met de afstand tot de lichtbron.'],
        ['Wat is oplossen, zoals suiker in water?','De stof verspreidt zich in de vloeistof',['De stof verdwijnt uit de wereld','De stof wordt vuur','De vloeistof bevriest'],'Je ziet de korrels niet meer apart.','Opgeloste deeltjes verspreiden zich door de vloeistof.','Je kunt suiker vaak terugkrijgen door water te verdampen.']
      ],
      lichaam: [
        ['Welk orgaan pompt bloed door je lichaam?','Hart',['Longen','Maag','Hersenen'],'Je kunt het voelen kloppen.','Het hart pompt bloed rond.','Je hart klopt ongeveer honderdduizend keer per dag.'],
        ['Waarmee adem je vooral?','Longen',['Nieren','Maag','Botten'],'Ze zitten in je borstkas.','De longen nemen zuurstof op.','Je hebt normaal twee longen.'],
        ['Welk orgaan helpt je denken?','Hersenen',['Lever','Hart','Darmen'],'Het zit in je schedel.','De hersenen verwerken informatie en sturen veel lichaamsfuncties.','Miljarden zenuwcellen werken er samen.'],
        ['Wat vervoert bloed door je lichaam?','Zuurstof en voedingsstoffen',['Lucht','Botten','Warmte'],'Bloed reist door bloedvaten.','Bloed vervoert onder andere zuurstof en voedingsstoffen.','Rode bloedcellen helpen zuurstof vervoeren.'],
        ['Waar begint vertering van voedsel al?','In de mond',['In de voet','In de longen','In het oor'],'Je kauwt voedsel fijn.','Vertering begint in de mond.','Speeksel bevat stoffen die voedsel helpen afbreken.'],
        ['Wat beschermen je ribben?','Hart en longen',['Je voeten','Je tanden','Je vingers'],'Ze vormen een kooi rond de borstkas.','Ribben beschermen belangrijke organen.','De meeste mensen hebben 12 paar ribben.'],
        ['Waarvoor dienen botten behalve steun?','Bescherming en beweging',['Kleur','Slaap','Temperatuur'],'Spieren trekken aan botten.','Botten geven steun, bescherming en helpen bij beweging.','In beenmerg worden bloedcellen gemaakt.'],
        ['Wat doen spieren?','Ze trekken samen om beweging te maken',['Ze maken alleen bloed','Ze verteren eten','Ze zien licht'],'Spieren werken vaak samen met botten.','Spieren kunnen samentrekken en zo beweging veroorzaken.','Je lichaam heeft honderden spieren.'],
        ['Wat is de huid?','Het grootste orgaan van je lichaam',['Een bot','Een spier','Een bloedvat'],'Hij bedekt je hele lichaam.','De huid beschermt het lichaam.','De huid helpt ook bij temperatuurregeling.'],
        ['Welke zintuig gebruik je met je oren?','Gehoor',['Smaak','Reuk','Zicht'],'Je hoort geluidsgolven.','Met je oren neem je geluid waar.','Je binnenoor helpt ook bij evenwicht.']
      ],
      uitvindingen: [
        ['Waarmee kun je heel kleine dingen bekijken?','Microscoop',['Telescoop','Kompas','Barometer'],'Denk aan cellen en bacteriën.','Een microscoop vergroot kleine objecten.','Moderne microscopen kunnen extreem sterk vergroten.'],
        ['Waarmee kijk je naar verre sterren en planeten?','Telescoop',['Microscoop','Thermometer','Magneet'],'Hij maakt verre objecten beter zichtbaar.','Een telescoop verzamelt licht van verre objecten.','Er bestaan telescopen op aarde en in de ruimte.'],
        ['Welke uitvinding maakte boeken veel sneller te kopiëren?','Drukpers',['Kompas','Stoomfluit','Zaklamp'],'Tekst kon met losse letters worden gedrukt.','De drukpers maakte massaproductie van boeken mogelijk.','Dat hielp kennis sneller verspreiden.'],
        ['Waarvoor wordt een batterij gebruikt?','Elektrische energie opslaan en leveren',['Wind meten','Water koken zonder energie','Sterren maken'],'Je vindt hem in veel apparaten.','Een batterij levert elektrische energie.','Oplaadbare batterijen kunnen opnieuw worden gebruikt.'],
        ['Wat doet een magneet?','Hij kan bepaalde metalen aantrekken',['Hij maakt altijd licht','Hij bevriest water','Hij stopt tijd'],'IJzer reageert er goed op.','Magneten oefenen krachten uit op magnetische materialen.','Een magneet heeft een noord- en zuidpool.'],
        ['Wat maakt een zonnepaneel?','Elektriciteit uit licht',['Regen uit wolken','Benzine uit lucht','Geluid uit stenen'],'De zon levert de energie.','Zonnecellen zetten licht om in elektriciteit.','Zonnepanelen hebben geen bewegende delen nodig.'],
        ['Wat doet een motor?','Energie omzetten in beweging',['Kleuren maken','Water bevriezen','Papier lezen'],'Auto’s en machines gebruiken motoren.','Een motor zet energie om in beweging.','Er zijn elektrische en verbrandingsmotoren.'],
        ['Waarom was de telefoon een belangrijke uitvinding?','Mensen konden op afstand spreken',['Mensen konden vliegen','Mensen konden tijd stoppen','Mensen konden zonder stroom leven'],'Geluid werd over afstand verzonden.','De telefoon veranderde communicatie sterk.','Mobiele telefoons combineren nu veel functies.'],
        ['Wat doet een computer vooral?','Informatie verwerken',['Muziek maken','Licht geven','Water zuiveren'],'Hij voert instructies uit.','Computers verwerken gegevens volgens programma’s.','Zelfs een smartwatch bevat een computer.'],
        ['Welke uitvinding gebruikt radiogolven om positie te bepalen?','GPS',['Magneet','Microscoop','Stethoscoop'],'Satellieten helpen bepalen waar je bent.','GPS gebruikt signalen van satellieten.','Je telefoon gebruikt GPS voor navigatie.']
      ],
      natuur_energie: [
        ['Welke energiebron gebruikt bewegende lucht?','Windenergie',['Zonne-energie','Aardgas','Kernenergie'],'Windmolens draaien erdoor.','Windturbines zetten wind om in elektriciteit.','Grotere turbines kunnen veel huishoudens voorzien.'],
        ['Welke energiebron gebruikt zonlicht?','Zonne-energie',['Steenkool','Olie','Aardgas'],'Panelen vangen licht op.','Zonnepanelen zetten licht om in elektriciteit.','De zon levert veel meer energie dan wij wereldwijd gebruiken.'],
        ['Wat is hernieuwbare energie?','Energie uit bronnen die steeds worden aangevuld',['Energie die nooit wordt gebruikt','Benzine','Steenkool'],'Denk aan zon en wind.','Hernieuwbare bronnen raken niet snel op.','Ook waterkracht en geothermie kunnen hernieuwbaar zijn.'],
        ['Wat doet een windturbine?','Wind omzetten in elektriciteit',['Regen maken','Benzine produceren','Wolken verplaatsen'],'De wieken draaien door de wind.','Een generator in de turbine maakt elektriciteit.','Windturbines staan op land en op zee.'],
        ['Welke stof komt vrij bij verbranding van fossiele brandstoffen?','Koolstofdioxide',['Zuurstof','Goud','Helium'],'Het is een broeikasgas.','Verbranding van olie, gas en kolen geeft CO₂ vrij.','Meer CO₂ versterkt het broeikaseffect.'],
        ['Waarom isoleren we huizen?','Om warmte beter binnen of buiten te houden',['Om ramen zwaarder te maken','Om water te maken','Om wifi te versterken'],'Goede isolatie bespaart energie.','Isolatie vermindert warmteverlies.','Daken, muren en vloeren kunnen worden geïsoleerd.'],
        ['Wat is waterkracht?','Energie uit stromend of vallend water',['Energie uit zand','Energie uit rook','Energie uit plastic'],'Dam en rivier kunnen turbines aandrijven.','Waterkracht gebruikt beweging van water.','Het is wereldwijd een belangrijke hernieuwbare bron.'],
        ['Wat is energiebesparing?','Minder energie gebruiken voor hetzelfde resultaat',['Meer lampen aanzetten','Ramen open met verwarming aan','Apparaten altijd laten draaien'],'Efficiënte apparaten helpen.','Energiebesparing verlaagt verbruik.','LED-lampen gebruiken minder stroom dan oude gloeilampen.'],
        ['Wat doet een accu in een elektrische auto?','Elektrische energie opslaan',['Benzine maken','Wind meten','Water koelen'],'Hij voedt de elektromotor.','De accu slaat energie op voor het rijden.','Tijdens remmen kan soms energie worden teruggewonnen.'],
        ['Welke lamp is meestal zuiniger?','LED-lamp',['Gloeilamp','Kaars','Halogeenlamp'],'Hij gebruikt minder elektriciteit.','LED-verlichting is zeer energiezuinig.','LED-lampen gaan vaak ook langer mee.']
      ]
    },
    mysterie: {
      raadsels: [
        ['Ik heb sleutels maar geen sloten. Wat ben ik?','Piano',['Deur','Schatkist','Fiets'],'Je gebruikt je vingers om mij te bespelen.','Een piano heeft toetsen die ook “keys” worden genoemd.','Een piano kan meer dan tachtig toetsen hebben.'],
        ['Ik word natter terwijl ik droog. Wat ben ik?','Handdoek',['Paraplu','Zon','Spons'],'Je gebruikt mij na het wassen.','Een handdoek wordt nat terwijl hij jou droogt.','Handdoeken nemen water op met hun vezels.'],
        ['Wat heeft een nek maar geen hoofd?','Fles',['Kat','Mens','Uil'],'Je kunt eruit drinken.','Een fles heeft een hals of nek.','Flessen worden van glas of plastic gemaakt.'],
        ['Wat heeft tanden maar kan niet bijten?','Kam',['Haai','Hond','Leeuw'],'Je gebruikt hem voor je haar.','Een kam heeft tanden maar geen mond.','Kammen bestaan al duizenden jaren.'],
        ['Wat gaat omhoog maar komt nooit omlaag?','Je leeftijd',['Een lift','Een bal','Een vogel'],'Ieder jaar wordt het groter.','Je leeftijd neemt toe naarmate je ouder wordt.','Op je verjaardag telt er weer een jaar bij.'],
        ['Wat heeft handen maar geen armen?','Klok',['Robot','Mens','Aap'],'De handen wijzen iets aan.','Een analoge klok heeft wijzers die “handen” worden genoemd.','De wijzers tonen uren, minuten en soms seconden.'],
        ['Wat kun je breken zonder het aan te raken?','Een belofte',['Een steen','Een glas','Een tak'],'Het gaat om vertrouwen.','Een belofte kun je figuurlijk breken.','Raadsels gebruiken vaak dubbele betekenissen.'],
        ['Wat heeft één oog maar kan niet zien?','Naald',['Uil','Mens','Camera'],'Door het oog gaat draad.','Een naald heeft een oog voor de draad.','Het oog zit meestal aan één uiteinde.'],
        ['Wat wordt groter als je er meer van afhaalt?','Een gat',['Een berg','Een doos','Een boek'],'Denk aan graven.','Hoe meer je uit een gat haalt, hoe groter het wordt.','Dit is een klassiek logisch raadsel.'],
        ['Wat loopt maar heeft geen benen?','Water',['Hond','Mens','Paard'],'Het stroomt door rivieren.','Water kan “lopen” of stromen.','Taalraadsels spelen met meerdere betekenissen.']
      ],
      verborgen_schatten: [
        ['Wat gebruik je om een gesloten schatkist te openen?','Sleutel',['Veer','Kaart','Vergrootglas'],'Hij past in een slot.','Met de juiste sleutel open je het slot.','Sloten bestaan al duizenden jaren.'],
        ['Wat staat vaak op een schatkaart?','Een X voor de plek',['Een stoplicht','Een barcode','Een thermometer'],'“X marks the spot”.','Een X wordt vaak gebruikt om de schatplek aan te geven.','Dit is vooral bekend uit verhalen over piraten.'],
        ['Waarvoor gebruik je een kompas tijdens een schattenjacht?','Om richting te bepalen',['Om goud te wegen','Om regen te maken','Om gaten te graven'],'De naald helpt je noord vinden.','Een kompas helpt bij navigatie.','Een traditioneel kompas reageert op het aardmagnetisch veld.'],
        ['Wat is een verborgen vak?','Een geheime ruimte in een voorwerp',['Een open plein','Een wolk','Een kaartlegenda'],'Je ziet het niet meteen.','Een verborgen vak kan spullen uit het zicht bewaren.','Oude meubels hadden soms geheime compartimenten.'],
        ['Wat is een aanwijzing?','Informatie die je dichter bij de oplossing brengt',['Een eindantwoord altijd','Een fout','Een decoratie'],'Een detective zoekt ernaar.','Aanwijzingen helpen een mysterie oplossen.','Een goede aanwijzing geeft informatie zonder alles weg te geven.'],
        ['Waarom nummer je aanwijzingen soms?','Om de volgorde te bewaren',['Om ze zwaarder te maken','Om ze te verstoppen','Om kleuren te veranderen'],'Zo raak je minder snel de draad kwijt.','Nummeren helpt bij ordenen.','Detectives ordenen bewijs om verbanden te zien.'],
        ['Welke plek is logisch voor een verborgen schat in een verhaal?','Onder een gemarkeerde steen',['Midden op een drukke tafel','Op een verkeersbord','In een wolk'],'Hij moet uit het zicht liggen.','Schatten worden in verhalen vaak verborgen op geheime plekken.','Schatverhalen gebruiken vaak herkenbare symbolen.'],
        ['Wat is een code?','Een systeem om informatie verborgen weer te geven',['Een soort fruit','Een muziekinstrument','Een wolk'],'Je moet hem ontcijferen.','Een code kan informatie verbergen.','Cryptografie is de wetenschap van geheime communicatie.'],
        ['Wat betekent ontcijferen?','Een code begrijpelijk maken',['Iets begraven','Een kaart verbranden','Een sleutel smeden'],'Je zoekt de betekenis achter tekens.','Ontcijferen is gecodeerde informatie lezen.','Sommige codes gebruiken cijfers of symbolen.'],
        ['Waarom zou een schatkaart een legenda hebben?','Om symbolen uit te leggen',['Om de kaart zwaarder te maken','Om geluid te maken','Om hem waterdicht te maken'],'Een legenda vertelt wat tekens betekenen.','Kaartlegenda’s leggen symbolen uit.','Ook gewone landkaarten gebruiken legenda’s.']
      ],
      natuurmysteries: [
        ['Waarom verandert een rups in een vlinder?','Door metamorfose',['Door magnetisme','Door bliksem','Door vorst'],'Het dier verandert in verschillende levensfasen.','Vlinders ondergaan metamorfose.','Van ei gaat het via rups en pop naar vlinder.'],
        ['Waarom zien we soms een regenboog?','Licht wordt gebroken en gesplitst in waterdruppels',['De wolken kleuren zichzelf','De zon knippert','De maan schildert hem'],'Zonlicht en regen werken samen.','Waterdruppels breken en weerkaatsen licht.','Een regenboog verschijnt tegenover de zon.'],
        ['Waarom licht een vuurvliegje op?','Door bioluminescentie',['Door een batterij','Door zonlicht op te slaan','Door magneten'],'Het maakt zelf licht in zijn lichaam.','Bioluminescentie is licht uit een chemische reactie.','Ook sommige zeedieren kunnen zelf licht maken.'],
        ['Waarom zijn flamingo’s roze?','Door kleurstoffen in hun voedsel',['Omdat ze zo geboren worden met verf','Door zonlicht','Door koud water'],'Hun dieet bevat pigmenten.','Carotenoïden in voedsel kleuren veren roze.','Jonge flamingo’s zijn veel grijzer.'],
        ['Waarom draaien zonnebloemen jonge knoppen vaak mee met de zon?','Door heliotropisme',['Door windkracht','Door magnetisme','Door regen'],'Ze reageren op licht.','Jonge zonnebloemen kunnen de zon volgen.','Volwassen bloemen richten zich meestal meer naar het oosten.'],
        ['Waarom hebben sommige dieren camouflage?','Om minder op te vallen',['Om sneller te groeien','Om harder te zingen','Om meer warmte te maken'],'Kleur en patroon passen bij de omgeving.','Camouflage helpt bij jagen of verstoppen.','Inktvissen kunnen hun uiterlijk snel aanpassen.'],
        ['Wat veroorzaakt eb en vloed vooral?','De zwaartekracht van de maan',['Windmolens','Vulkanen','Wolken'],'De maan trekt aan het oceaanwater.','De maan is een belangrijke oorzaak van getijden.','De zon heeft ook invloed op de getijden.'],
        ['Waarom zijn sneeuwvlokken vaak zeshoekig?','Door de manier waarop watermoleculen kristallen vormen',['Door windmolens','Door vogels','Door zand'],'IJs vormt een vast kristalpatroon.','De moleculaire structuur van ijs leidt vaak tot zesvoudige symmetrie.','Geen twee grote sneeuwvlokken zijn exact gelijk.'],
        ['Waarom is de lucht overdag meestal blauw?','Blauw licht wordt sterker verstrooid',['Omdat de oceaan de lucht verft','Door bomen','Door wolken'],'Zonlicht bevat meerdere kleuren.','De atmosfeer verstrooit kortgolvig blauw licht sterk.','Bij zonsondergang zien we meer rood en oranje.'],
        ['Waarom kunnen gekko’s tegen muren lopen?','Miljoenen kleine haartjes aan hun tenen',['Zuignappen met lijm','Magneten','Elektriciteit'],'Hun tenen maken heel veel contact met het oppervlak.','Microscopische structuren geven veel grip.','De krachten heten van-der-Waalskrachten.']
      ],
      speurtocht: [
        ['Waarvoor gebruik je een routekaart?','Om de weg te volgen',['Om een puzzel te eten','Om tijd te meten','Om geluid te maken'],'De kaart toont waar je heen moet.','Een routekaart helpt bij navigatie.','Symbolen kunnen belangrijke punten aangeven.'],
        ['Wat is een waypoint?','Een afgesproken punt op een route',['Een geheim wachtwoord','Een soort dier','Een munt'],'Je kunt er naartoe navigeren.','Waypoints markeren locaties op een route.','GPS-apparaten gebruiken vaak waypoints.'],
        ['Welke tool helpt je kleine aanwijzingen beter bekijken?','Vergrootglas',['Hamer','Lepel','Paraplu'],'Het maakt details groter.','Een vergrootglas vergroot kleine details.','Een bolle lens buigt lichtstralen.'],
        ['Een voetafdruk is vooral een…','Spoor',['Planeet','Instrument','Kleur'],'Een detective zoekt ernaar.','Een voetafdruk kan een spoor zijn.','Sporen kunnen vertellen wie ergens geweest is.'],
        ['Waarom kijk je bij een speurtocht goed om je heen?','Aanwijzingen kunnen verborgen zijn',['Om de tijd stil te zetten','Om regen te maken','Om sneller te groeien'],'Niet alles ligt midden op het pad.','Observeren is belangrijk bij een speurtocht.','Goede speurtochten combineren kijken, denken en bewegen.'],
        ['Wat betekent “linksaf” op een route?','Naar de linkerkant draaien',['Rechtdoor','Terug naar huis','Naar boven klimmen'],'Denk aan je linkerhand.','Linksaf betekent naar links draaien.','Richtingstaal is belangrijk bij navigatie.'],
        ['Wat is een coördinaat?','Een manier om een precieze locatie aan te geven',['Een soort sleutel','Een dierenspoor','Een beloning'],'Kaarten en GPS gebruiken ze.','Coördinaten beschrijven een positie.','Breedte- en lengtegraden zijn voorbeelden.'],
        ['Wat doe je als twee aanwijzingen elkaar tegenspreken?','Ze opnieuw controleren',['Zomaar één kiezen','Alles weggooien','De kaart scheuren'],'Misschien heb je iets verkeerd gelezen.','Controle helpt fouten vinden.','Goede speurders verifiëren informatie.'],
        ['Waarom is samenwerken handig tijdens een speurtocht?','Je kunt ideeën en observaties combineren',['Omdat één persoon niets mag doen','Om aanwijzingen te verstoppen','Om tijd te stoppen'],'Twee paar ogen zien meer.','Samenwerken kan problemen sneller oplossen.','Teams verdelen vaak taken.'],
        ['Wat is het doel van de laatste aanwijzing?','Je naar de eindplek leiden',['Je terug naar vraag 1 sturen','Een nieuwe wereld maken','De route verwijderen'],'Hij brengt je bij de oplossing.','De laatste aanwijzing leidt meestal naar de finish of schat.','Een goede speurtocht bouwt stap voor stap naar het einde.']
      ]
    },
    dieren: {
      snelle_dieren: [
        ['Welk landdier is het snelst?','Jachtluipaard',['Olifant','Panda','Nijlpaard'],'Het is een slanke gevlekte kat.','Het jachtluipaard is het snelste landdier.','Bij een korte sprint kan het boven 90 km/u komen.'],
        ['Welk dier is gebouwd voor snelle sprintjes?','Jachtluipaard',['Luiaard','Schildpad','Panda'],'Lange poten en een lichte bouw helpen.','Jachtluipaarden zijn echte sprinters.','Ze houden topsnelheid maar kort vol.'],
        ['Welke vogel is beroemd om extreem snelle duikvluchten?','Slechtvalk',['Pinguïn','Kip','Struisvogel'],'Hij jaagt vanuit de lucht.','De slechtvalk is een van de snelste dieren.','Tijdens een duik kan hij boven 300 km/u komen.'],
        ['Waarom heeft een snelle vis een gestroomlijnd lichaam?','Om minder weerstand te hebben',['Om zwaarder te zijn','Om harder te zingen','Om meer lucht te vangen'],'Een gladde vorm snijdt makkelijker door water.','Stroomlijning vermindert waterweerstand.','Ook dolfijnen hebben een gestroomlijnde vorm.'],
        ['Welk dier rent sneller: een paard of een schildpad?','Paard',['Schildpad','Even snel','Geen van beide'],'Het heeft lange krachtige benen.','Een paard is veel sneller dan een schildpad.','Paarden kunnen in galop hoge snelheden halen.'],
        ['Waarom hebben gazellen lange poten?','Voor snel rennen en springen',['Om te zwemmen','Om te graven','Om te vliegen'],'Ze leven op open vlaktes.','Lange poten helpen gazellen snel vluchten.','Snelheid helpt ontsnappen aan roofdieren.'],
        ['Welke haai staat bekend als een snelle zwemmer?','Makohaai',['Walvishaai','Zeepaardje','Koraalduivel'],'Hij heeft een gestroomlijnd lichaam.','Makohaaien behoren tot de snelste haaien.','Ze jagen op snelle vissen.'],
        ['Wat helpt een struisvogel snel rennen?','Sterke lange poten',['Vleugels om te vliegen','Een zwemblaas','Klauwen om te klimmen'],'Hij kan niet vliegen.','Struisvogels zijn snelle hardlopers.','Ze kunnen tientallen kilometers per uur lopen.'],
        ['Waarom is snelheid handig voor prooidieren?','Om te ontsnappen',['Om bomen te laten groeien','Om kou te maken','Om te slapen'],'Roofdieren proberen ze te vangen.','Snelheid kan overleving vergroten.','Sommige prooidieren gebruiken ook scherpe bochten.'],
        ['Waarom is snelheid handig voor roofdieren?','Om prooi te vangen',['Om planten water te geven','Om veren te kleuren','Om nesten te bouwen'],'Een jacht duurt vaak maar kort.','Snelheid helpt tijdens de achtervolging.','Niet elk roofdier gebruikt snelheid; sommige gebruiken hinderlagen.']
      ],
      baby_dieren: [
        ['Hoe heet een babyhond?','Pup',['Kalf','Veulen','Kuiken'],'Het woord begint met een p.','Een jonge hond heet een pup.','Pups worden blind en doof geboren.'],
        ['Hoe heet een babykat?','Kitten',['Veulen','Lam','Kalf'],'Het is een jong poesje.','Een jonge kat heet een kitten.','Kittens slapen heel veel.'],
        ['Hoe heet een jong paard?','Veulen',['Pup','Kuiken','Welpen'],'Het kan al snel staan.','Een jong paard heet een veulen.','Veulens proberen kort na de geboorte te staan.'],
        ['Hoe heet een jong schaap?','Lam',['Kalf','Pup','Kitten'],'Je ziet ze vaak in het voorjaar.','Een jong schaap heet een lam.','Lammeren drinken melk bij hun moeder.'],
        ['Hoe heet een babykoe?','Kalf',['Veulen','Lam','Kuiken'],'Ook een jonge olifant heet zo.','Een jonge koe heet een kalf.','Kalveren drinken in het begin melk.'],
        ['Hoe heet een jonge kip?','Kuiken',['Welpen','Pup','Lam'],'Hij komt uit een ei.','Een jonge kip heet een kuiken.','Kuikens communiceren al voor het uitkomen met piepjes.'],
        ['Hoe heet een jonge leeuw?','Welpen',['Veulen','Kalf','Kitten'],'Ook wolvenjongen worden zo genoemd.','Een jonge leeuw is een welp.','Leeuwenwelpen blijven lang bij de groep.'],
        ['Wat drinken veel zoogdierbaby’s eerst?','Melk',['Zout water','Benzine','Limonade'],'Hun moeder maakt het.','Zoogdieren voeden hun jongen met melk.','Dit is een belangrijk kenmerk van zoogdieren.'],
        ['Waarom blijven veel jonge dieren dicht bij hun moeder?','Voor bescherming en voedsel',['Om sneller te vliegen','Om bomen te beklimmen','Om kou te maken'],'Ze moeten nog veel leren.','Ouders beschermen en verzorgen vaak hun jongen.','De duur van ouderzorg verschilt sterk per diersoort.'],
        ['Welk baby-dier komt uit een ei?','Kuiken',['Pup','Kalf','Veulen'],'Denk aan een kip.','Een kuiken komt uit een ei.','Ook reptielen, vissen en veel andere dieren leggen eieren.']
      ],
      waterdieren: [
        ['Welk zoogdier leeft in zee en ademt lucht?','Dolfijn',['Tonijn','Haai','Kwal'],'Hij moet regelmatig boven water komen.','Dolfijnen zijn zoogdieren en ademen met longen.','Ze gebruiken een blaasgat boven op hun hoofd.'],
        ['Welk dier heeft acht armen?','Octopus',['Haai','Dolfijn','Krab'],'Hij kan zich goed verstoppen.','Een octopus heeft acht armen.','Octopussen zijn zeer intelligente weekdieren.'],
        ['Welk zeedier is het grootste dier op aarde?','Blauwe vinvis',['Witte haai','Dolfijn','Orka'],'Het is een enorme walvis.','De blauwe vinvis is het grootste bekende dier.','Hij kan meer dan 25 meter lang worden.'],
        ['Hoe ademen de meeste vissen?','Met kieuwen',['Met longen','Door hun huid','Met veren'],'Ze halen zuurstof uit water.','Kieuwen nemen zuurstof uit water op.','Water stroomt langs de kieuwlamellen.'],
        ['Wat helpt vissen sturen en zwemmen?','Vinnen',['Vleugels','Poten','Haar'],'Ze hebben verschillende vinnen.','Vinnen helpen bij voortbeweging en balans.','De staartvin levert vaak veel stuwkracht.'],
        ['Welk dier kan zowel in zee als op land leven?','Zeeschildpad',['Tonijn','Kwal','Zeepaardje'],'Hij komt aan land om eieren te leggen.','Zeeschildpadden leven in zee maar leggen eieren op land.','Vrouwtjes keren vaak terug naar stranden om te nestelen.'],
        ['Wat is koraal eigenlijk?','Een kolonie kleine dieren',['Een plant','Een steen','Een vis'],'Het vormt riffen.','Koralen bestaan uit heel veel kleine poliepen.','Koraalriffen zijn belangrijke leefgebieden.'],
        ['Waarom komen walvissen boven water?','Om adem te halen',['Om hun kieuwen te wassen','Om te slapen op het strand','Om voedsel te koken'],'Ze zijn zoogdieren.','Walvissen ademen lucht met longen.','Ze ademen via blaasgaten.'],
        ['Welk dier heeft een harde schaal en loopt zijwaarts?','Krab',['Dolfijn','Kwal','Inktvis'],'Je ziet hem vaak op stranden.','Krabben hebben een hard uitwendig skelet.','Veel krabben bewegen makkelijk zijwaarts.'],
        ['Waarom is een gestroomlijnd lichaam handig in water?','Het vermindert weerstand',['Het maakt meer geluid','Het maakt het dier zwaarder','Het maakt water warmer'],'Dieren bewegen soepeler door water.','Stroomlijning helpt efficiënter zwemmen.','Dolfijnen en haaien zijn mooie voorbeelden.']
      ],
      jungle: [
        ['Welk dier slingert vaak door bomen?','Aap',['Olifant','Pinguïn','Zebra'],'Hij gebruikt takken om te klimmen.','Veel apensoorten leven in bomen.','Sommige apen gebruiken hun staart als extra grijphulp.'],
        ['Welk dier heeft een grote kleurrijke snavel?','Toekan',['Tijger','Gorilla','Krokodil'],'Het is een tropische vogel.','Toekans hebben opvallende snavels.','Hun snavel is verrassend licht.'],
        ['Welk groot dier leeft in tropische bossen en eet veel planten?','Gorilla',['Pinguïn','Kameel','IJsbeer'],'Hij is een mensaap.','Gorilla’s leven in Afrikaanse bossen.','Ze eten vooral planten.'],
        ['Waarom hebben veel jungledieren camouflage?','Om minder op te vallen',['Om harder te zingen','Om meer regen te maken','Om sneller te groeien'],'Patronen passen bij bladeren en schaduw.','Camouflage helpt dieren jagen of schuilen.','Veel jaguars hebben vlekken die schaduwen nabootsen.'],
        ['Welke grote kat leeft in de jungle van Amerika?','Jaguar',['Leeuw','Sneeuwpanter','Lynx'],'Hij heeft rozetten op zijn vacht.','Jaguars leven in delen van Midden- en Zuid-Amerika.','Ze zwemmen opvallend goed.'],
        ['Waarom zijn bomen in het regenwoud zo belangrijk?','Ze bieden voedsel en leefruimte',['Ze maken geen zuurstof','Ze stoppen alle regen','Ze zijn alleen decoratie'],'Veel dieren leven in verschillende boomlagen.','Regenwoudbomen vormen complexe leefgebieden.','Sommige dieren komen bijna nooit op de bosbodem.'],
        ['Welk reptiel kan van kleur veranderen?','Kameleon',['Schildpad','Krokodil','Slang altijd'],'Hij gebruikt kleur ook voor communicatie.','Kameleons kunnen hun kleurpatroon aanpassen.','Kleurverandering helpt bij temperatuur en signalen.'],
        ['Wat is een regenwoud?','Een warm bos met veel neerslag',['Een bevroren woestijn','Een grasveld zonder bomen','Een zee'],'Het is zeer rijk aan soorten.','Tropische regenwouden krijgen veel regen.','Ze behoren tot de meest biodiverse ecosystemen.'],
        ['Waarom roepen brulapen zo hard?','Om met groepen te communiceren',['Om regen te maken','Om bomen om te duwen','Om te zwemmen'],'Hun roep draagt ver door het bos.','Brulapen gebruiken luide geluiden voor communicatie.','Hun vergrote keelstructuur versterkt de roep.'],
        ['Welk dier kan met een lange tong insecten pakken?','Kameleon',['Olifant','Gorilla','Toekan'],'De tong schiet snel naar voren.','Kameleons vangen prooi met hun lange tong.','De tong kan zeer snel versnellen.']
      ]
    },
    aarde: {
      continenten_landen: [
        ['Op welk continent ligt Nederland?','Europa',['Afrika','Azië','Zuid-Amerika'],'Denk aan onze buurlanden.','Nederland ligt in Europa.','Europa is één van de zeven continenten.'],
        ['Wat is het grootste continent?','Azië',['Europa','Afrika','Australië'],'China en India liggen er.','Azië is het grootste continent.','Meer dan de helft van de wereldbevolking woont in Azië.'],
        ['Op welk continent ligt Brazilië?','Zuid-Amerika',['Afrika','Europa','Azië'],'Denk aan de Amazone.','Brazilië ligt in Zuid-Amerika.','Brazilië is het grootste land van Zuid-Amerika.'],
        ['Op welk continent ligt Egypte grotendeels?','Afrika',['Europa','Azië','Noord-Amerika'],'De Nijl stroomt erdoor.','Egypte ligt grotendeels in Afrika.','Het Sinaï-schiereiland ligt geografisch in Azië.'],
        ['Wat is de hoofdstad van Frankrijk?','Parijs',['Rome','Madrid','Berlijn'],'De Eiffeltoren staat er.','Parijs is de hoofdstad van Frankrijk.','De Seine stroomt door Parijs.'],
        ['Wat is de hoofdstad van Italië?','Rome',['Milaan','Venetië','Napels'],'Het Colosseum staat er.','Rome is de hoofdstad van Italië.','Vaticaanstad ligt binnen Rome.'],
        ['Welk land heeft de vorm van een laars?','Italië',['Portugal','Noorwegen','Polen'],'Kijk naar Zuid-Europa.','Italië lijkt op een laars.','Sicilië ligt vlak bij de “teen”.'],
        ['Welke oceaan ligt tussen Europa en Amerika?','Atlantische Oceaan',['Stille Oceaan','Indische Oceaan','Noordelijke IJszee'],'Schepen steken hem over.','De Atlantische Oceaan ligt tussen Europa/Afrika en Amerika.','Hij is de op één na grootste oceaan.'],
        ['Welk continent ligt op de Zuidpool?','Antarctica',['Europa','Afrika','Azië'],'Het is bedekt met ijs.','Antarctica ligt rond de Zuidpool.','Het is het koudste continent.'],
        ['Welk land ligt direct ten oosten van Nederland?','Duitsland',['Spanje','Ierland','Italië'],'Het is een buurland.','Duitsland grenst aan Nederland.','Nederland grenst ook aan België.']
      ],
      weer_klimaat: [
        ['Wat meet een thermometer?','Temperatuur',['Windrichting','Regenhoeveelheid','Luchtdruk'],'Warm of koud.','Een thermometer meet temperatuur.','Wij gebruiken vaak graden Celsius.'],
        ['Wat is neerslag?','Water dat uit de lucht valt',['Wind','Zonlicht','Mist'],'Regen en sneeuw zijn voorbeelden.','Neerslag kan regen, sneeuw of hagel zijn.','Het ontstaat uit water in wolken.'],
        ['Wat is wind?','Bewegende lucht',['Bewegend water','Warm zand','Een wolk'],'Je kunt het voelen maar niet zien.','Wind is lucht die beweegt.','Verschillen in luchtdruk veroorzaken veel wind.'],
        ['Waarom ontstaat vaak mist?','Waterdamp condenseert dicht bij de grond',['Door sterren','Door zand','Door magneten'],'Het zicht wordt slechter.','Mist bestaat uit kleine waterdruppels in de lucht.','Mist is eigenlijk een wolk aan de grond.'],
        ['Wat is klimaat?','Het gemiddelde weer over lange tijd',['Het weer van vandaag','Een onweersbui','Een regenmeter'],'Het gaat over jaren, niet één dag.','Klimaat beschrijft typische weersomstandigheden over lange tijd.','Weer kan per dag sterk veranderen.'],
        ['Wat veroorzaakt bliksem?','Een elektrische ontlading',['Een vallende ster','Een vliegtuig','Een regenboog'],'Het gebeurt vaak bij onweerswolken.','Bliksem is een enorme elektrische ontlading.','De lucht eromheen wordt extreem heet.'],
        ['Waarom hoor je donder na bliksem?','Licht gaat sneller dan geluid',['Donder ontstaat later','Wolken wachten','De zon blokkeert geluid'],'Je ziet de flits eerst.','Licht bereikt je veel sneller dan geluid.','Het tijdsverschil helpt de afstand tot onweer schatten.'],
        ['Welke wolk hoort vaak bij zware buien en onweer?','Cumulonimbus',['Cirrus','Mist','Geen wolk'],'Hij kan heel hoog worden.','Cumulonimbuswolken kunnen onweer veroorzaken.','Ze hebben vaak een aambeeldvorm aan de top.'],
        ['Wat is een hittegolf?','Een periode met uitzonderlijk warm weer',['Een plotselinge sneeuwbui','Een aardbeving','Een hoge golf in zee'],'Het duurt meerdere dagen.','Een hittegolf is een langdurige periode van zeer warm weer.','Definities verschillen per land.'],
        ['Wat is vorst?','Temperatuur onder het vriespunt',['Sterke wind','Heel veel regen','Dichte mist'],'Water kan dan bevriezen.','Bij vorst daalt temperatuur rond of onder 0 °C.','Rijp kan ontstaan als waterdamp bevriest.']
      ],
      oceanen_natuur: [
        ['Wat bedekt het grootste deel van de aarde?','Water',['Woestijn','Bos','IJs'],'Oceanen nemen enorm veel ruimte in.','Ongeveer 71% van de aarde is bedekt met water.','Het meeste water is zout zeewater.'],
        ['Welke oceaan is de grootste?','Stille Oceaan',['Atlantische Oceaan','Indische Oceaan','Noordelijke IJszee'],'Hij ligt tussen Azië en Amerika.','De Stille Oceaan is de grootste oceaan.','Hij beslaat ongeveer een derde van het aardoppervlak.'],
        ['Hoe heet gesmolten gesteente dat uit een vulkaan komt?','Lava',['Magma ondergronds','Klei','Zand'],'Buiten de aarde noemen we het zo.','Aan het oppervlak heet gesmolten gesteente lava.','Onder de grond noemen we het magma.'],
        ['Wat is een eiland?','Land volledig omgeven door water',['Een hoge wolk','Een rivier','Een woestijn'],'Je moet water oversteken om er te komen.','Een eiland is aan alle kanten door water omringd.','Groenland is het grootste eiland dat geen continent is.'],
        ['Wat is een bergketen?','Een reeks bergen',['Een brede rivier','Een zee','Een groep eilanden'],'De Alpen zijn er één.','Een bergketen bestaat uit verbonden bergen.','De Himalaya bevat de hoogste bergen op aarde.'],
        ['Wat is een riviermonding?','De plek waar een rivier uitkomt',['De bron van een rivier','Een bergtop','Een woestijn'],'Vaak komt de rivier uit in zee of een meer.','Een riviermonding is het einde van een rivier.','Sommige rivieren vormen een delta bij de monding.'],
        ['Wat is een woestijn?','Een gebied met heel weinig neerslag',['Altijd een heet strand','Een tropisch regenwoud','Een oceaan'],'Niet alle woestijnen zijn heet.','Woestijnen krijgen zeer weinig neerslag.','Antarctica is technisch ook een woestijn.'],
        ['Wat is een gletsjer?','Een langzaam bewegende massa ijs',['Een wolk','Een rivier van lava','Een zandduin'],'Hij ontstaat uit samengeperste sneeuw.','Gletsjers bewegen langzaam door hun eigen gewicht.','Ze vormen valleien en landschappen.'],
        ['Wat is erosie?','Het afslijten en verplaatsen van gesteente en grond',['Het groeien van bomen','Het ontstaan van sterren','Het bevriezen van lucht'],'Water en wind kunnen het veroorzaken.','Erosie verandert landschappen.','Rivieren kunnen diepe dalen uitslijten.'],
        ['Wat is een delta?','Een gebied waar een rivier zich vertakt bij de monding',['Een bergtop','Een oceaanstroom','Een wolk'],'Het kan vruchtbare grond bevatten.','Een rivierdelta ontstaat door afzetting van sediment.','De Nijldelta is een bekend voorbeeld.']
      ],
      kaarten_navigatie: [
        ['Wat toont een kompasroos?','Windrichtingen',['Temperatuur','Hoogte','Tijdzones'],'Noord, oost, zuid en west.','Een kompasroos toont richtingen.','Kaarten gebruiken vaak N, O, Z en W.'],
        ['Waarvoor dient een legenda op een kaart?','Om symbolen uit te leggen',['Om de kaart te versieren','Om afstand te meten','Om wind te maken'],'Kleuren en tekens krijgen betekenis.','Een legenda legt kaartsymbolen uit.','Een blauwe lijn kan bijvoorbeeld een rivier voorstellen.'],
        ['Wat is schaal op een kaart?','De verhouding tussen kaartafstand en echte afstand',['Een muziekinstrument','Een temperatuurmeter','Een kleurcode'],'1 cm kan bijvoorbeeld 1 km betekenen.','Schaal maakt afstanden op kaarten begrijpelijk.','Grote schaal toont vaak meer detail.'],
        ['Wat zijn coördinaten?','Getallen of waarden die een locatie aangeven',['Een soort wolken','Een munt','Een rivier'],'GPS gebruikt ze.','Coördinaten beschrijven een positie.','Breedte- en lengtegraden zijn bekende coördinaten.'],
        ['Welke richting ligt tegenover noord?','Zuid',['Oost','West','Noordoost'],'Denk aan de kompasroos.','Zuid ligt tegenover noord.','Oost en west liggen haaks op noord-zuid.'],
        ['Welke richting ligt rechts als je naar het noorden kijkt?','Oost',['West','Zuid','Noord'],'Op veel kaarten staat noord boven.','Als noord boven is, ligt oost rechts.','Daarom ligt west links op zo’n kaart.'],
        ['Wat is een topografische kaart?','Een kaart met terrein en hoogte-informatie',['Een sterrenkaart','Een menukaart','Een tijdlijn'],'Hoogtelijnen kunnen erop staan.','Topografische kaarten tonen landschap en hoogte.','Wandelaars gebruiken ze vaak.'],
        ['Wat is GPS?','Een satellietsysteem voor plaatsbepaling',['Een type wolk','Een vulkaan','Een kompas zonder satellieten'],'Je telefoon kan het gebruiken.','GPS gebruikt satellietsignalen om je positie te bepalen.','Meerdere satellieten zijn nodig voor een nauwkeurige positie.'],
        ['Waarom staat noord vaak boven op kaarten?','Dat is een veelgebruikte afspraak',['Omdat noord hoger ligt','Omdat de zon daar altijd staat','Omdat rivieren daarheen stromen'],'Het is een conventie, geen natuurwet.','Veel moderne kaarten zetten noord boven.','Historische kaarten gebruikten soms andere oriëntaties.'],
        ['Wat is een route?','Een geplande weg van start naar bestemming',['Een regenwolk','Een berg','Een landgrens'],'Navigatie helpt hem volgen.','Een route beschrijft hoe je van A naar B gaat.','Digitale kaarten kunnen routes automatisch berekenen.']
      ]
    }
  };

  // Shared by every language bank. IDs are derived from world, topic and position,
  // so the same question carries the same id in Dutch and in English.
  // Topic display names live in i18n.js, never on the question itself.
  // `extra` (questions-extra*.js) holds the advanced set: ten more questions
  // per topic, ids 11-20. The base set is difficulty 1-2, the advanced set
  // 3-4, which is what the six levels draw from (quiz-core LEVELS.band).
  // A row is [prompt, answer, [three wrong], hint, explanation, fact] and may
  // carry a seventh field: its own difficulty. The first twenty rows of a topic
  // predate that field and still take their difficulty from their position (1-10
  // easy, 11-20 advanced); everything written after them states it, because a
  // level-1 quiz and a level-6 quiz both need ten questions of their own and
  // position can no longer decide that. Group and xp follow the difficulty, which
  // is what they always did.
  window.KWIZILLO_BUILD_BANK = (source,extra={},more={}) => {
    const out=[];
    // A world or topic may live in any of the three layers. The two newest
    // worlds were written straight into content/ and so arrive through `more`
    // alone; walking the union means they need no empty stub in this file.
    const union=(...objs)=>[...new Set(objs.flatMap(o=>Object.keys(o||{})))];
    union(source,extra,more).forEach(world=>{
      const topics=source[world]||{};
      union(topics,extra[world],more[world]).forEach(topic=>{
        const items=topics[topic]||[];
        [...items,...((extra[world]||{})[topic]||[]),...((more[world]||{})[topic]||[])].forEach((row,i)=>{
          const [prompt,answer,wrongs,hint,explanation,fact,stated]=row;
          const advanced=i>=10;
          const difficulty=Number(stated)||(advanced?3+(i%2):1+(i%2));
          const easy=difficulty<=2;
          out.push({
            id:`${world}-${topic}-${String(i+1).padStart(2,'0')}`,
            world,topic,
            groupMin:easy?2+(i%3):3+(i%3),groupMax:8,difficulty,type:'multiple_choice',
            prompt,options:[answer,...wrongs],answer,hint,explanation,fact,xp:difficulty>=4?18:difficulty===3?14:10
          });
        });
      });
    });
    return out;
  };

  window.KWIZILLO_QUESTIONS_NL = window.KWIZILLO_BUILD_BANK(defs, window.KWIZILLO_EXTRA_NL||{}, window.KWIZILLO_MORE_NL||{});
})();
