(() => {
  // Danish bank. Same worlds, topics, order and therefore the same question ids
  // as the other banks, so progress, cards and the per-question illustrations
  // survive a language switch.
  const defs = {
    ruimte: {
      zonnestelsel: [
        ["Hvilken planet er tættest på Solen?","Merkur",["Venus","Mars","Jorden"],"Det er den mindste planet, og den ligger helt forrest.","Merkur er den planet, der er tættest på Solen.","Et år på Merkur varer kun 88 jorddøgn."],
        ["Hvilken planet er vores hjemplanet?","Jorden",["Venus","Mars","Jupiter"],"Her bor mennesker, dyr og planter.","Vi bor på Jorden.","Cirka 71% af Jorden er dækket af vand."],
        ["Hvilken planet er kendt som den røde planet?","Mars",["Venus","Saturn","Neptun"],"Dens jord indeholder meget jernoxid.","Mars kaldes den røde planet.","Mars har to små måner: Phobos og Deimos."],
        ["Hvilken planet har de mest berømte ringe?","Saturn",["Jorden","Merkur","Mars"],"Den er en stor gaskæmpe.","Saturn har et meget tydeligt ringsystem.","Ringene består mest af is og sten."],
        ["Hvilken planet er den største i vores solsystem?","Jupiter",["Mars","Venus","Jorden"],"Den har den berømte Store Røde Plet.","Jupiter er den største planet.","Der ville kunne være mere end tusind Jorde inde i Jupiter."],
        ["Hvilken planet er længst væk fra Solen?","Neptun",["Jupiter","Jorden","Venus"],"Det er en fjern blå iskæmpe.","Neptun er den planet, der er længst fra Solen.","Et år på Neptun varer cirka 165 jordår."],
        ["Hvilken planet ligger mellem Venus og Mars?","Jorden",["Merkur","Jupiter","Saturn"],"Det er vores egen planet.","Rækkefølgen er Venus, Jorden, Mars.","Jorden er den tredje planet fra Solen."],
        ["Hvad drejer rundt om Jorden?","Månen",["Jupiter","Solen","Mars"],"Du ser den tit på nattehimlen.","Månen drejer rundt om Jorden.","Månen bruger cirka 27 dage på én omgang."],
        ["Hvor mange planeter har vores solsystem?","8",["7","9","10"],"Pluto tæller i dag som dværgplanet.","Vores solsystem har otte planeter.","Siden 2006 er Pluto regnet som dværgplanet."],
        ["Hvilken planet er berømt for sin stærke blå farve?","Neptun",["Merkur","Mars","Venus"],"Det er en fjern iskæmpe.","Neptun ser dybblå ud.","Metan i dens atmosfære gør den blå farve stærkere."]
      ],
      sterren_planeten: [
        ["Hvad er Solen?","En stjerne",["En planet","En måne","En komet"],"Den laver selv sit lys og sin varme.","Solen er en stjerne.","Sollyset er cirka 8 minutter om at nå Jorden."],
        ["Hvad består en stjerne mest af?","Meget varm gas og plasma",["Kold sten","En måne","En sky"],"Stjerner lyser selv.","Stjerner består af ekstremt varm gas og plasma.","Vores Sol er en mellemstor stjerne."],
        ["Hvad er en galakse?","En kæmpe gruppe af stjerner",["En planet","Et teleskop","En sky på Jorden"],"Mælkevejen er en af dem.","En galakse indeholder utrolig mange stjerner.","Mælkevejen har hundredvis af milliarder stjerner."],
        ["Hvad hedder vores galakse?","Mælkevejen",["Andromeda","Orion","Saturn"],"Nogle gange ser du et blegt bånd på en mørk himmel.","Vores solsystem ligger i Mælkevejen.","Mælkevejen er en spiralgalakse."],
        ["Hvad er en supernova?","En kæmpe stjerneeksplosion",["En nymåne","En raketopsendelse","En regnbyge"],"Det sker ved slutningen af nogle stjerners liv.","En supernova er en kæmpe eksplosion af en stjerne.","Sådan en eksplosion kan lyse ekstremt kraftigt et kort stykke tid."],
        ["Hvilken farve har de varmeste stjerner som regel?","Blå",["Røde","Brune","Grønne"],"Tænk på den varmeste flamme på et gaskomfur.","Meget varme stjerner ser tit blålige ud.","Røde stjerner er som regel køligere end blå."],
        ["Hvad er en exoplanet?","En planet ved en anden stjerne",["En måne om Jorden","En komet","En satellit"],"Den drejer ikke om vores Sol.","En exoplanet drejer om en anden stjerne end Solen.","Der er nu fundet tusindvis af exoplaneter."],
        ["Hvad er et sort hul?","Et område med ekstremt stærk tyngdekraft",["En mørk planet","En sky","En raketmotor"],"Selv lys slipper ikke nemt ud.","Et sort hul har ekstremt stærk tyngdekraft.","Mange sorte huller opstår af meget tunge stjerner."],
        ["Hvilken stjerne er tættest på Jorden?","Solen",["Sirius","Nordstjernen","Betelgeuse"],"Du ser den hver dag.","Solen er vores nærmeste stjerne.","Den næste stjerne er meget længere væk."],
        ["Hvorfor ser det ud, som om stjerner blinker?","På grund af atmosfæren",["Fordi de tænder og slukker","På grund af deres måner","Fordi de drejer"],"Deres lys bøjes gennem luftlag på vejen.","Atmosfæren får stjernelyset til at dirre lidt.","Planeter blinker som regel mindre end stjerner."]
      ],
      astronauten: [
        ["Hvad kalder man en, der rejser ud i rummet?","Astronaut",["Arkæolog","Dykker","Kaptajn"],"Den person har tit en rumdragt på.","En astronaut rejser og arbejder i rummet.","Astronauter træner tit i årevis."],
        ["Hvorfor har astronauter rumdragt på uden for rumskibet?","For at få luft og beskyttelse",["For varmens skyld","For farten","Som uniform"],"I rummet kan man ikke bare trække vejret.","En rumdragt giver ilt og beskyttelse.","Den beskytter også mod ekstreme temperaturer."],
        ["Hvad mærker astronauter tit på en rumstation?","Vægtløshed",["Kraftig regn","Kraftig vind","Jordskælv"],"Det ser ud, som om de svæver.","I kredsløb lever astronauter i mikrotyngde.","Alt skal spændes fast, ellers svæver det væk."],
        ["Hvor sover astronauter som regel på rumstationen?","I soveposer, der er spændt fast",["I almindelige senge","I hængekøjer udenfor","På gulvet"],"Ellers ville de svæve væk.","Astronauter sover i soveposer, der er spændt fast til væggen.","I mikrotyngde findes der ikke rigtig op og ned."],
        ["Hvorfor træner astronauter under vandet?","For at efterligne vægtløshed",["For at svømme hurtigere","For at lede efter månevand","For at slappe af"],"Under vandet kan man øve svævende bevægelser.","Træning under vand bruges til at øve rumvandringer.","I store bassiner står der nogle gange modeller af stationen."],
        ["Hvad er en rumvandring?","Arbejde uden for rumfartøjet",["At gå på Jorden","At løbe inde i en raket","En tur på museum"],"Astronauten er hele tiden koblet til sikkerhedssystemer.","En rumvandring kaldes også en EVA.","Astronauten har en komplet rumdragt på."],
        ["Hvad sker der med musklerne efter lang tid i vægtløshed?","De kan blive svagere",["De bliver af stål","De forsvinder med det samme","De vokser altid hurtigere"],"Derfor træner astronauter meget.","Uden træning bliver muskler og knogler svagere.","Astronauter træner hver dag på ISS."],
        ["Hvad spiser astronauter i rummet?","Specielt indpakket mad",["Piller","Is","Ingenting"],"Det skal være sikkert i mikrotyngde.","Astronauter spiser specielt indpakket mad.","Krummer er besværlige, fordi de svæver rundt."],
        ["Hvad er ISS?","En international rumstation",["En planet","En raketmotor","En månebase"],"Den kredser om Jorden.","ISS er en stor rumstation i kredsløb om Jorden.","Der arbejder astronauter fra flere lande sammen."],
        ["Hvorfor skal en astronaut spænde sig fast, mens han arbejder?","For ikke at svæve væk",["For at få mere tyngdekraft","Mod regn","For fartens skyld"],"I mikrotyngde bliver man nemt ved med at bevæge sig.","At spænde sig fast forhindrer, at nogen driver ukontrolleret væk.","Værktøj bliver også sikret."]
      ],
      raket_avontuur: [
        ["Hvad bruges en raketmotor til?","Til at skabe fremdrift",["Til at printe fotos","Til at lave ilt","Til at tælle stjerner"],"Den skubber varme gasser bagud.","En raketmotor giver fremdrift.","Ved virkning og modvirkning flyver raketten den anden vej."],
        ["Hvorfor skal en raket bruge så meget brændstof?","For at slippe væk fra tyngdekraften",["Til belysningen","Til aircondition","Til radioen"],"Opsendelsen koster enormt meget energi.","En opsendelse kræver enorme mængder energi.","Ved opsendelsen kan det meste af en raket være brændstof."],
        ["Hvad sker der ved opsendelsen?","Raketten stiger til vejrs",["Raketten lander","Motoren stopper altid","Månen kommer tættere på"],"Det er afgangens øjeblik.","Opsendelsen er det øjeblik, hvor raketten forlader jorden.","De første sekunder er teknisk set meget vigtige."],
        ["Hvorfor har nogle raketter flere trin?","For at smide de tomme dele væk",["For at få flere vinduer","For at få sovepladser","For farvernes skyld"],"Så slæber raketten mindre masse rundt.","En raket smider et trin væk, når brændstoffet er brugt.","Så bliver det billigere at sætte farten yderligere op."],
        ["Hvad er en affyringsrampe?","Det sted, en raket letter fra",["En satellit","En månebil","Et sæde i cockpittet"],"Der står raketten før afgang.","En affyringsrampe holder raketten før flyvningen.","Der er store anlæg til brændstof, køling og sikkerhed."],
        ["Hvad er en satellit?","En genstand, der kredser om en anden genstand",["En stjerneeksplosion","En raketmotor","Et teleskop"],"Månen er faktisk også en naturlig satellit.","Satellitter kredser om en planet eller et andet himmellegeme.","Kunstige satellitter hjælper med navigation og kommunikation."],
        ["Hvorfor er spidsen af en raket strømlinet?","For at mindske luftmodstanden",["For at veje mere","For at fange mere regn","For farvens skyld"],"En glat form bevæger sig lettere gennem luften.","En strømlinet form mindsker luftmodstanden.","Uden for atmosfæren er der næsten ingen luftmodstand tilbage."],
        ["Hvad er en kapsel?","En del, hvor mennesker eller last kan rejse",["En galakse","En måne","Et brændstof"],"Den sidder tit øverst på raketten.","En rumkapsel fragter mennesker eller last.","Nogle kapsler kommer tilbage med faldskærme."],
        ["Hvad hjælper en kapsel med at lande sikkert?","Faldskærme",["Stjerner","Soludbrud","Asteroider"],"De bremser faldet.","Faldskærme bremser en kapsel, der vender tilbage.","Nogle fartøjer lander også ved hjælp af motorer."],
        ["Hvad er et kredsløb om Jorden?","En bane, hvor man hele tiden falder rundt om Jorden",["En lige vej til Solen","En tunnel","En sky"],"Fart og tyngdekraft er i balance.","En satellit i kredsløb falder hele tiden rundt om Jorden.","Derfor styrter den ikke bare ned."]
      ]
    },
    geschiedenis: {
      egyptenaren: [
        ["Hvad blev mange pyramider bygget til?","Som gravsteder",["Som skoler","Som markeder","Som havne"],"Tænk på faraoer og deres begravelse.","Mange pyramider var gravsteder for faraoer.","Den Store Pyramide i Giza er tusinder af år gammel."],
        ["Hvad kaldte man en hersker i det gamle Egypten?","Farao",["Senator","Ridder","Viking"],"Han stod øverst i samfundet.","En egyptisk hersker blev kaldt farao.","Nogle faraoer blev regnet for guddommelige."],
        ["Hvilken flod var meget vigtig for Egypten?","Nilen",["Rhinen","Amazonfloden","Donau"],"Den løber gennem landet og gør jorden frugtbar.","Nilen var vigtig for landbrug og transport.","De årlige oversvømmelser bragte frugtbart mudder."],
        ["Hvad hedder den egyptiske skrift med tegn og billeder?","Hieroglyffer",["Latin","Runer","Morsekode"],"Du ser dem på templer og i grave.","Hieroglyffer var en vigtig egyptisk skrift.","Skriften brugte hundredvis af tegn."],
        ["Hvad er en mumie?","En bevaret krop",["En guldmønt","Et tempel","En båd"],"Kroppen blev behandlet på en særlig måde efter døden.","Egypterne lavede mumier for at bevare kroppene.","Processen kunne tage mange uger."],
        ["Hvad skrev egypterne tit på?","Papyrus",["Plastik","Beton","Aluminium"],"Det blev lavet af en plante ved Nilen.","Papyrus blev brugt som skrivemateriale.","Ordet papir kommer fra papyrus."],
        ["Hvad var Sfinksen i Giza?","En statue med løvekrop og menneskehoved",["En pyramide","Et skib","En krone"],"Den står tæt ved pyramiderne.","Den Store Sfinks er en kæmpe stenstatue.","Sfinksen er hugget ud af kalksten."],
        ["Hvad brugte egypterne kunstvanding til?","Til at vande markerne",["Til at male pyramider","Til at skrive","Til at lave mønter"],"Vandet fra Nilen skulle nå markerne.","Kunstvanding hjalp landbruget.","Kanaler og bassiner fordelte vandet over markerne."],
        ["Hvilke dyr blev tit set som noget særligt i Egypten?","Katte",["Isbjørne","Pingviner","Kænguruer"],"De optræder meget i kunst og religion.","Katte havde en særlig plads i det gamle Egypten.","Gudinden Bastet blev tit vist som en kat."],
        ["Hvad lavede skrivere i det gamle Egypten?","De førte tekster og regnskaber",["De fik pyramider til at flyve","De trænede riddere","De lavede stjerner"],"At skrive var en vigtig færdighed.","Skrivere førte regnskaber og holdt styr på skatter.","Ikke alle kunne læse og skrive."]
      ],
      ridders_kastelen: [
        ["Hvad havde en ridder tit på for at beskytte sig?","En rustning",["En rumdragt","En badekåbe","En dykkerdragt"],"Den var af metal.","Rustningen beskyttede kroppen.","En komplet rustning havde mange enkeltdele."],
        ["Hvor boede en mægtig herre tit?","På en borg",["I en raket","I en pyramide","I en iglo"],"Bygningen havde tykke mure.","Borge var både boliger og forsvarsanlæg.","Mange borge havde tårne og mure."],
        ["Hvad er en voldgrav?","En vandgrav rundt om en borg",["Et soveværelse","En markedsplads","Et bageri"],"Den holdt ubudne gæster på afstand.","En voldgrav gjorde borgen svær at komme ind på.","Ikke alle voldgrave havde altid vand."],
        ["Hvad er en vindebro?","En bro, man kan hejse op",["En hemmelig trappe","Et flag","Et tårn"],"Den var tit ved indgangen.","En vindebro kunne spærre vejen ind.","Den var tit bygget sammen med en port."],
        ["Hvad skete der ved en ridderturnering?","Riddere dystede i konkurrencer",["Man byggede pyramider","Man sejlede til Amerika","Man byggede teleskoper"],"Tænk på ridning og behændighed.","Turneringer var konkurrencer for riddere.","Turneringer trak publikum fra nær og fjern, med musik og fest."],
        ["Hvad er et skjold?","Beskyttelse for en ridder",["Et musikinstrument","Et kort","Et krus"],"Riddere bar det tit på den ene arm.","En ridder holdt sit skjold foran sig for at beskytte sig.","Skjoldene viste ofte familiens farver og tegn."],
        ["Hvem boede som regel ikke fast på en borg?","Alle bønderne fra egnen",["Borgherren","Soldaterne","Tjenestefolkene"],"Mange mennesker boede i landsbyerne omkring.","De fleste bønder boede uden for borgen.","I farlige tider kunne de nogle gange søge ly der."],
        ["Hvorfor havde borge tykke mure?","For at kunne forsvares",["For at få hurtigere internet","For varmens skyld","Som pynt"],"De skulle være stærke og solide.","Tykke stenmure gjorde borge stærkere.","Nogle borgmure var mere end fire meter tykke."],
        ["Hvad lavede en væbner tit?","Hjalp en ridder og lærte af ham",["Begravede en farao","Fløj en raket","Byggede et tempel"],"Nogle gange forberedte han sig på at blive ridder.","En væbner hjalp en ridder og lærte håndværket.","Ikke alle væbnere blev riddere."],
        ["Hvad var en fæstning?","Et befæstet sted at bo",["En galakse","Et skib","Et skolefag"],"Ordet bruges tit om borge.","En fæstning var et befæstet sted.","Fæstninger lå tit på strategiske steder."]
      ],
      romeinen: [
        ["Hvem byggede Colosseum?","Romerne",["Vikingerne","Mayaerne","Egypterne"],"Det ligger i Rom.","Colosseum blev bygget af romerne.","Der var plads til titusindvis af tilskuere."],
        ["Hvad var en akvædukt?","Et bygværk til at føre vand",["En ridderhjelm","Et tempel til både","En mønt"],"Den førte vand ind i byerne.","Romerske akvædukter førte vand over lange afstande.","Nogle akvædukter kan stadig ses i dag."],
        ["Hvilket sprog talte mange romere?","Latin",["Hollandsk","Japansk","Arabisk"],"Mange europæiske ord kommer derfra.","Latin var et vigtigt sprog i Romerriget.","Fransk, spansk og italiensk stammer fra latin."],
        ["Hvad var en legion?","En stor gruppe romerske soldater",["Et marked","Et badehus","Et skib"],"Den var en del af hæren.","En legion var en stor hærenhed.","Romerske soldater trænede meget hårdt."],
        ["Hvad var et forum i en romersk by?","En central plads",["Et fængsel","En bondegård","En havn"],"Der kom man for handel og styre.","Forummet var et vigtigt centrum i byen.","Der lå tit templer og offentlige bygninger."],
        ["Hvad blev de romerske badehuse brugt til?","Til at vaske sig og mødes",["Til at bygge raketter","Til at opbevare korn","Til at træne heste"],"Folk mødtes også der for at snakke.","Badeanlæg var vigtige mødesteder.","Nogle havde både varme og kolde bade."],
        ["Hvad havde en romersk soldat tit på?","En hjelm og et skjold",["En rumdragt","En cowboyhat","En dykkerdragt"],"Han skulle beskytte hoved og krop.","Romerske soldater bar hjelm, et stort skjold og solide sandaler.","Deres udstyr ændrede sig gennem århundrederne."],
        ["Hvad betyder „Romerriget“?","Et stort område, der blev styret fra Rom",["Byen Rom","En pyramide","En ridderorden"],"Det strakte sig over store dele af Europa.","Romerriget var meget stort.","På sit højeste omkransede det hele Middelhavet."],
        ["Hvad brugte romerne til lange ture over land?","Et stort vejnet",["Floder","Luftballoner","Tog"],"Mange veje var meget solidt bygget.","Romerne byggede et stort vejnet.","Nogle af nutidens veje følger gamle romerveje."],
        ["Hvad var en senator i Rom?","En vigtig embedsmand",["En bager","En farao","En ridder"],"Han havde en politisk rolle.","Senatorer havde indflydelse på styret.","Det romerske senat bestod i århundreder."]
      ],
      ontdekkingsreizigers: [
        ["Hvad lavede en opdagelsesrejsende?","Udforskede nye områder",["Byggede planeter","Opfandt elektricitet","Vogtede pyramider"],"Tænk på lange rejser.","Opdagelsesrejsende rejste til ukendte egne.","Deres rejser ændrede kort og handel."],
        ["Hvad brugte sømænd et kompas til?","Til at finde retningen",["Til at lave mad","Til at skrive","Til at måle dybden"],"Nålen peger cirka mod nord.","Et kompas hjælper med navigation.","Det gjorde lange sørejser mere sikre."],
        ["Hvad er et søkort?","Et kort til sejlads på havet",["Et maleri","Et riddervåben","Et stjernebillede"],"Skibe brugte det til at planlægge ruten.","Søkort viser kyster, farer og ruter.","Moderne skibe bruger tit digitale kort."],
        ["Hvorfor var stjernerne nyttige for sømænd?","De hjalp med at finde positionen",["Til at lokke fisk","Til at lave vind","Til at varme vand"],"Især om natten gav de retningen.","Stjerner kunne hjælpe med navigation.","Nordstjernen var vigtig på den nordlige halvkugle."],
        ["Hvad var en karavel?","En slags sejlskib",["Et romersk bad","En borg","Et tempel"],"Den blev brugt til lange rejser.","Karaveller var kvikke sejlskibe.","De spillede en rolle i de europæiske opdagelsesrejser."],
        ["Hvorfor tog opdagelsesrejsende proviant med?","Fordi rejserne kunne vare længe",["Fordi der var butikker på havet","Som pynt","For at bygge stjerner"],"På havet kunne man ikke lige handle ind.","Mad og vand var afgørende på lange rejser.","Mangel og sygdom var alvorlige farer."],
        ["Hvad er navigation?","At finde ud af, hvor du er, og hvor du skal hen",["At male et skib","At lære et sprog","At bygge et marked"],"Kompas og kort hjælper med det.","At navigere er at planlægge og følge en rute.","GPS er en moderne form for navigation."],
        ["Hvad var en stor fare på lange sørejser?","Storme og sygdomme",["Trafiklys","Sne i ørkenen","Satellitter"],"Rejserne varede nogle gange måneder.","Storme, sygdom og madmangel var farlige.","Skørbug kom af mangel på C-vitamin i lang tid."],
        ["Hvorfor ledte man efter nye ruter til Asien?","På grund af handel med værdifulde varer",["For at stå på ski","På grund af dinosaurer","På grund af rumfart"],"Krydderier var ekstremt værdifulde.","Handel drev mange opdagelsesrejser.","Krydderier kunne være meget dyre i Europa."],
        ["Hvad gjorde kortmagere efter nye rejser?","Forbedrede deres kort",["Rejste pyramider","Flyttede stjerner","Ændrede tiden"],"Ny viden kom til.","Rejseberetninger gjorde kortene mere præcise.","Kortene blev mere detaljerede gennem århundrederne."]
      ]
    },
    wetenschap: {
      slimme_proefjes: [
        ["Hvad sker der tit, når du blander natron og eddike?","Der kommer bobler af gas",["Det fryser med det samme","Det bliver til metal","Der sker ingenting"],"Du ser masser af skum.","Reaktionen laver blandt andet kuldioxid.","Den gas kan for eksempel puste en ballon op."],
        ["Hvorfor har man beskyttelsesbriller på ved nogle forsøg?","For at beskytte øjnene",["For at høre bedre","For at løbe hurtigere","For farvens skyld"],"Nogle stoffer kan sprøjte.","Beskyttelsesbriller beskytter øjnene.","At arbejde sikkert hører med til videnskab."],
        ["Hvad er en hypotese?","En forventning, man kan teste",["En fastslået kendsgerning","Et måleapparat","En væske"],"Du bestemmer på forhånd, hvad du forventer.","En hypotese er et gæt, du kan undersøge.","Efter et forsøg kan den blive bekræftet eller ej."],
        ["Hvad skal holdes så ens som muligt i et retfærdigt forsøg?","De øvrige betingelser",["Resultatet","Spørgsmålet","Dit navn"],"Du ændrer kun én ting ad gangen.","Ens betingelser gør et forsøg mere retfærdigt.","Så ved du bedre, hvad der gav en virkning."],
        ["Hvad måler du en væskemængde præcist med?","Med et målecylinderglas",["Med et forstørrelsesglas","Med et kompas","Med et stopur"],"Det har streger på siden.","Et målecylinderglas måler rumfang.","Rumfang måles tit i milliliter."],
        ["Hvad gør et termometer i et forsøg?","Det måler temperaturen",["Det måler tiden","Det måler vægten","Det laver lys"],"Med det kan du måle varmt eller koldt.","Et termometer måler temperaturen.","Hos os måler man tit i grader celsius."],
        ["Hvorfor skriver du resultaterne af et forsøg ned?","Så du kan sammenligne dem",["For at glemme dem","For at pudse glasset","Som pynt"],"Forskere noterer deres målinger.","At skrive resultaterne ned hjælper med at analysere og gentage.","God videnskab skal kunne kontrolleres."],
        ["Hvad sker der med is, når du varmer den op?","Den smelter",["Den bliver til sten","Den forsvinder med det samme","Den bliver tungere"],"Fast vand bliver flydende.","Is smelter og bliver til vand.","Ved normalt tryk smelter is omkring 0 °C."],
        ["Hvad skal du bruge for at lave en skygge?","En lyskilde og en genstand",["Lyd","Vand","Vind"],"Genstanden stopper lyset.","En skygge opstår, når lys bliver stoppet.","Dens størrelse ændrer sig med afstanden til lyskilden."],
        ["Hvad er det at opløses, som sukker i vand?","Stoffet fordeler sig i væsken",["Stoffet forlader verden","Stoffet bliver til ild","Væsken fryser"],"Du kan ikke længere se kornene hver for sig.","Opløste partikler fordeler sig i væsken.","Fordamper du vandet, får du tit sukkeret tilbage."]
      ],
      lichaam: [
        ["Hvilket organ pumper blodet rundt i kroppen?","Hjertet",["Lungerne","Maven","Hjernen"],"Du kan mærke det slå.","Hjertet pumper blodet rundt.","Dit hjerte slår cirka hundrede tusind gange om dagen."],
        ["Hvad trækker du mest vejret med?","Med lungerne",["Med nyrerne","Med maven","Med knoglerne"],"De sidder inde i brystkassen.","Lungerne optager ilt.","Normalt har du to lunger."],
        ["Hvilket organ hjælper dig med at tænke?","Hjernen",["Leveren","Hjertet","Tarmen"],"Den sidder inde i kraniet.","Hjernen behandler information og styrer mange funktioner i kroppen.","Der arbejder milliarder af nerveceller sammen."],
        ["Hvad fører blodet rundt i kroppen?","Ilt og næringsstoffer",["Luft","Knogler","Varme"],"Blodet løber gennem blodkarrene.","Blodet transporterer blandt andet ilt og næringsstoffer.","De røde blodlegemer hjælper med at føre ilten rundt."],
        ["Hvor begynder fordøjelsen af mad allerede?","I munden",["I foden","I lungen","I øret"],"Du tygger maden i små stykker.","Fordøjelsen begynder i munden.","Spyt indeholder stoffer, der hjælper med at nedbryde maden."],
        ["Hvad beskytter dine ribben?","Hjertet og lungerne",["Dine fødder","Dine tænder","Dine fingre"],"De danner et bur om brystkassen.","Ribbenene beskytter vigtige organer.","De fleste mennesker har 12 par ribben."],
        ["Ud over at holde kroppen oppe, hvad er knogler så til?","Beskyttelse og bevægelse",["Farve","Søvn","Temperatur"],"Musklerne trækker i knoglerne.","Knogler giver støtte og beskyttelse og hjælper med bevægelse.","I knoglemarven dannes blodceller."],
        ["Hvad gør musklerne?","De trækker sig sammen og skaber bevægelse",["De laver kun blod","De fordøjer mad","De ser lys"],"Musklerne arbejder tit sammen med knoglerne.","Muskler kan trække sig sammen og dermed skabe bevægelse.","Din krop har hundredvis af muskler."],
        ["Hvad er huden?","Kroppens største organ",["En knogle","En muskel","Et blodkar"],"Den dækker hele kroppen.","Huden beskytter kroppen.","Huden hjælper også med at styre temperaturen."],
        ["Hvilken sans bruger du med ørerne?","Hørelsen",["Smagen","Lugtesansen","Synet"],"Du opfanger lydbølger.","Med ørerne opfanger du lyd.","Dit indre øre hjælper også med balancen."]
      ],
      uitvindingen: [
        ["Hvad kan du se meget små ting med?","Et mikroskop",["Et teleskop","Et kompas","Et barometer"],"Tænk på celler og bakterier.","Et mikroskop forstørrer små ting.","Moderne mikroskoper forstørrer ekstremt meget."],
        ["Hvad kigger du på fjerne stjerner og planeter med?","Et teleskop",["Et mikroskop","Et termometer","En magnet"],"Det gør fjerne ting lettere at se.","Et teleskop samler lys fra fjerne objekter.","Der findes teleskoper på Jorden og i rummet."],
        ["Hvilken opfindelse gjorde det meget hurtigere at kopiere bøger?","Bogtrykkerkunsten",["Kompasset","Dampfløjten","Faklen"],"Man kunne trykke med løse bogstaver.","Bogtrykkerkunsten gjorde det muligt at lave mange bøger.","Sådan bredte viden sig hurtigere."],
        ["Hvad bruges et batteri til?","Til at gemme og levere elektrisk energi",["Til at måle vind","Til at koge vand uden energi","Til at lave stjerner"],"Du finder et i mange apparater.","Et batteri leverer elektrisk energi.","Genopladelige batterier kan bruges igen."],
        ["Hvad gør en magnet?","Den kan tiltrække visse metaller",["Den laver altid lys","Den fryser vand","Den stopper tiden"],"Jern reagerer godt på den.","Magneter virker med kræfter på magnetiske materialer.","En magnet har en nordpol og en sydpol."],
        ["Hvad laver et solpanel?","Strøm ud af lys",["Regn ud af skyer","Benzin ud af luft","Lyd ud af sten"],"Solen giver energien.","Solceller laver lys om til strøm.","Solpaneler har ingen bevægelige dele."],
        ["Hvad gør en motor?","Den laver energi om til bevægelse",["Den laver farver","Den fryser vand","Den læser papir"],"Biler og maskiner bruger motorer.","En motor laver energi om til bevægelse.","Der findes elmotorer og forbrændingsmotorer."],
        ["Hvorfor var telefonen en vigtig opfindelse?","Folk kunne tale sammen over lang afstand",["Folk kunne flyve","Folk kunne stoppe tiden","Folk kunne leve uden strøm"],"Lyd blev sendt over afstand.","Telefonen ændrede kommunikationen meget.","Mobiler samler i dag mange funktioner."],
        ["Hvad gør en computer mest af alt?","Den behandler information",["Den laver musik","Den giver lys","Den renser vand"],"Den udfører instruktioner.","Computere behandler data efter programmer.","Selv et smartur har en computer indeni."],
        ["Hvilken opfindelse bruger radiobølger til at finde positionen?","GPS",["Magneten","Mikroskopet","Stetoskopet"],"Satellitter hjælper med at finde ud af, hvor du er.","GPS bruger signaler fra satellitter.","Din telefon bruger GPS til navigation."]
      ],
      natuur_energie: [
        ["Hvilken energikilde bruger luft i bevægelse?","Vindenergi",["Solenergi","Naturgas","Atomkraft"],"Vindmøller drejer rundt på grund af den.","Vindmøller laver vind om til strøm.","Store vindmøller kan forsyne mange husstande."],
        ["Hvilken energikilde bruger sollys?","Solenergi",["Kul","Olie","Naturgas"],"Paneler opfanger lyset.","Solpaneler laver lys om til strøm.","Solen giver langt mere energi, end vi bruger i hele verden."],
        ["Hvad er vedvarende energi?","Energi fra kilder, der hele tiden fyldes op igen",["Energi, der aldrig bliver brugt","Benzin","Kul"],"Tænk på sol og vind.","Vedvarende kilder slipper ikke hurtigt op.","Også vandkraft og jordvarme kan være vedvarende."],
        ["Hvad gør en vindmølle?","Den laver vind om til strøm",["Den laver regn","Den laver benzin","Den skubber skyer"],"Vingerne drejer rundt i vinden.","En generator inde i møllen laver strøm.","Vindmøller står både på land og på havet."],
        ["Hvilket stof bliver frigivet, når fossile brændstoffer brænder?","Kuldioxid",["Ilt","Guld","Helium"],"Det er en drivhusgas.","Når olie, gas og kul brænder, frigives CO₂.","Mere CO₂ forstærker drivhuseffekten."],
        ["Hvorfor isolerer vi huse?","For bedre at holde på varmen inde eller ude",["For at gøre vinduerne tungere","For at lave vand","For at forstærke wifi"],"God isolering sparer energi.","Isolering mindsker varmetabet.","Tag, vægge og gulve kan alle isoleres."],
        ["Hvad er vandkraft?","Energi fra vand, der strømmer eller falder",["Energi fra sand","Energi fra røg","Energi fra plastik"],"En dæmning og en flod kan drive turbiner.","Vandkraft bruger vandets bevægelse.","I verden er det en vigtig vedvarende kilde."],
        ["Hvad vil det sige at spare på energien?","At bruge mindre energi til det samme resultat",["At tænde flere lamper","Åbne vinduer med varmen tændt","At lade apparater køre"],"Sparsomme apparater hjælper.","At spare på energien sænker forbruget.","LED-pærer bruger mindre strøm end gamle glødepærer."],
        ["Hvad gør batteriet i en elbil?","Det gemmer elektrisk energi",["Det laver benzin","Det måler vind","Det køler vand"],"Det forsyner elmotoren.","Batteriet gemmer energi til at køre på.","Når man bremser, kan noget energi nogle gange vindes tilbage."],
        ["Hvilken pære bruger som regel mindst strøm?","LED-pæren",["Glødepæren","Stearinlyset","Halogenpæren"],"Den bruger mindre strøm.","LED-lys bruger meget lidt energi.","LED-pærer holder også tit længere."]
      ]
    },
    mysterie: {
      raadsels: [
        ["Jeg har sorte og hvide tangenter og laver musik. Hvad er jeg?","Et klaver",["En dør","En skattekiste","En cykel"],"Du spiller på mig med fingrene.","Et klaver har tangenter, du trykker på.","Et klaver kan have mere end firs tangenter."],
        ["Jo mere jeg tørrer, jo vådere bliver jeg. Hvad er jeg?","Et håndklæde",["En paraply","Solen","En svamp"],"Du bruger mig efter badet.","Et håndklæde bliver vådt, mens det tørrer dig.","Håndklæder suger vandet op med deres fibre."],
        ["Hvad har en hals, men intet hoved?","En flaske",["En kat","Et menneske","En ugle"],"Du kan drikke af den.","En flaske har en hals.","Flasker er af glas eller plastik."],
        ["Hvad har tænder, men kan ikke bide?","En kam",["En haj","En hund","En løve"],"Du bruger den til håret.","En kam har tænder, men ingen mund.","Kamme har været brugt i tusinder af år."],
        ["Hvad bliver hele tiden større og aldrig mindre?","Din alder",["En elevator","En bold","En fugl"],"Hvert år bliver den større.","Din alder vokser, efterhånden som du bliver ældre.","På din fødselsdag kommer der et år mere."],
        ["Jeg har visere, men ingen hænder. Hvad er jeg?","Et ur",["En robot","Et menneske","En abe"],"Mine visere peger på noget.","Et ur med visere har en skive og visere.","Viserne viser timer, minutter og nogle gange sekunder."],
        ["Hvad kan du bryde uden at røre det?","Et løfte",["En sten","Et glas","En gren"],"Det handler om tillid.","Et løfte kan du bryde uden at røre noget.","Gåder leger tit med dobbelte betydninger."],
        ["Hvad har et øje, men kan ikke se?","En nål",["En ugle","Et menneske","Et kamera"],"Gennem øjet går en tråd.","En nål har et nåleøje til tråden.","Øjet sidder som regel i den ene ende."],
        ["Hvad bliver større, jo mere du tager væk?","Et hul",["Et bjerg","En kasse","En bog"],"Tænk på at grave.","Jo mere du tager væk fra et hul, jo større bliver det.","Det er en klassisk tankegåde."],
        ["Hvad løber uden at have ben?","Vandet",["En hund","Et menneske","En hest"],"Det løber gennem floderne.","Vand kan løbe uden ben.","Ordgåder leger med flere betydninger."]
      ],
      verborgen_schatten: [
        ["Hvad åbner du en låst skattekiste med?","Med en nøgle",["Med en fjer","Med et kort","Med et forstørrelsesglas"],"Den passer i en lås.","Med den rigtige nøgle åbner du låsen.","Låse har været brugt i tusinder af år."],
        ["Hvad står der tit på et skattekort?","Et kryds ved stedet",["Et trafiklys","En stregkode","Et termometer"],"Krydset markerer stedet.","Et kryds markerer tit stedet med skatten.","Det kender man mest fra piratfortællinger."],
        ["Hvad bruger du et kompas til på en skattejagt?","Til at finde retningen",["Til at veje guld","Til at lave regn","Til at grave huller"],"Nålen hjælper dig med at finde nord.","Et kompas hjælper med navigation.","Et almindeligt kompas reagerer på Jordens magnetfelt."],
        ["Hvad er et hemmeligt rum?","Et skjult rum inde i en genstand",["En åben plads","En sky","En kortsignatur"],"Du ser det ikke med det samme.","I et hemmeligt rum kan man gemme ting.","Gamle møbler havde nogle gange hemmelige skuffer."],
        ["Hvad er et spor?","En oplysning, der bringer dig tættere på løsningen",["Altid det endelige svar","En fejl","En pynt"],"En detektiv leder efter dem.","Spor hjælper med at løse et mysterium.","Et godt spor giver noget uden at afsløre alt."],
        ["Hvorfor nummererer du nogle gange dine spor?","For at holde dem i rækkefølge",["For at gøre dem tungere","For at gemme dem","For at skifte farver"],"Så mister du ikke overblikket så nemt.","Nummerering hjælper med at holde orden.","Detektiver ordner beviser for at se sammenhænge."],
        ["Hvilket sted giver mening til en skjult skat i en fortælling?","Under en mærket sten",["Midt på et travlt bord","På et vejskilt","Inde i en sky"],"Den skal være ude af syne.","I fortællinger bliver skatte gemt på hemmelige steder.","Skattefortællinger bruger tit velkendte symboler."],
        ["Hvad er en kode?","Et system, der viser oplysninger i skjult form",["En slags frugt","Et musikinstrument","En sky"],"Du skal tyde den.","En kode kan skjule oplysninger.","Kryptografi er videnskaben om hemmelige beskeder."],
        ["Hvad betyder det at tyde?","At gøre en kode forståelig",["At begrave noget","At brænde et kort","At kopiere en nøgle"],"Du leder efter betydningen bag tegnene.","At tyde er at læse kodede oplysninger.","Nogle koder bruger tal eller symboler."],
        ["Hvorfor skulle et skattekort have en signaturforklaring?","For at forklare symbolerne",["For at gøre kortet tungere","For at lave lyd","For at gøre det vandtæt"],"Forklaringen fortæller dig, hvad tegnene betyder.","Signaturforklaringer forklarer symbolerne på et kort.","Almindelige kort har også en forklaring."]
      ],
      natuurmysteries: [
        ["Hvorfor bliver en larve til en sommerfugl?","På grund af forvandlingen",["På grund af magnetisme","På grund af lyn","På grund af frost"],"Dyret ændrer sig gennem flere livsstadier.","Sommerfugle gennemgår en forvandling.","Fra æg går det via larve og puppe til sommerfugl."],
        ["Hvorfor ser vi nogle gange en regnbue?","Lyset bøjes og deles i vanddråberne",["Skyerne maler sig selv","Solen blinker","Månen maler den"],"Sol og regn arbejder sammen.","Vanddråber bøjer og spejler lyset.","En regnbue kommer på den modsatte side af Solen."],
        ["Hvorfor lyser en ildflue?","På grund af bioluminescens",["På grund af et batteri","Fordi den gemmer sollys","På grund af magneter"],"Den laver lys inde i sin egen krop.","Bioluminescens er lys fra en kemisk reaktion.","Nogle havdyr kan også lave deres eget lys."],
        ["Hvorfor er flamingoer lyserøde?","På grund af farvestoffer i deres mad",["Fordi de fødes malet","Kun på grund af sollys","På grund af koldt vand"],"Deres mad indeholder farvestoffer.","Karotenoider i maden farver fjerene lyserøde.","Unge flamingoer er meget mere grå."],
        ["Hvorfor følger unge solsikkeknopper tit Solen?","På grund af heliotropisme",["På grund af vindens kraft","På grund af magnetisme","På grund af regn"],"De reagerer på lys.","Unge solsikker kan følge Solen.","Voksne blomster vender mest mod øst."],
        ["Hvorfor har nogle dyr camouflage?","For at falde mindre i øjnene",["For at vokse hurtigere","For at synge højere","For at lave mere varme"],"Farve og mønster ligner omgivelserne.","Camouflage hjælper med at jage eller gemme sig.","Blæksprutter kan skifte udseende meget hurtigt."],
        ["Hvad er hovedårsagen til tidevandet?","Månens tyngdekraft",["Vindmøller","Vulkaner","Skyer"],"Månen trækker i havvandet.","Månen er en vigtig årsag til tidevandet.","Solen påvirker også tidevandet."],
        ["Hvorfor har snefnug tit seks spidser?","På grund af den måde, vandmolekyler danner krystaller på",["På grund af vindmøller","På grund af fugle","På grund af sand"],"Is danner et fast krystalmønster.","Isens opbygning giver tit en seksdelt symmetri.","Der findes ikke to store snefnug, der er helt ens."],
        ["Hvorfor er himlen som regel blå om dagen?","Blåt lys spredes kraftigere",["Fordi havet maler himlen","På grund af træerne","Kun på grund af skyerne"],"Sollys indeholder flere farver.","Atmosfæren spreder det kortbølgede blå lys kraftigt.","Ved solnedgang ser vi mere rødt og orange."],
        ["Hvorfor kan gekkoer gå op ad vægge?","Millioner af bittesmå hår på tæerne",["Sugekopper med lim","Magneter","Elektricitet"],"Deres tæer rører fladen utrolig mange steder.","Mikroskopiske strukturer giver enormt godt fat.","Kræfterne hedder van der Waals-kræfter."]
      ],
      speurtocht: [
        ["Hvad bruger du et rutekort til?","Til at følge vejen",["Til at spise et puslespil","Til at måle tiden","Til at lave lyd"],"Kortet viser, hvor du skal hen.","Et rutekort hjælper med navigation.","Symboler kan markere vigtige punkter."],
        ["Hvad er et rutepunkt?","Et aftalt punkt på en rute",["Et hemmeligt kodeord","En slags dyr","En mønt"],"Du kan styre efter det.","Rutepunkter markerer steder på en rute.","GPS-apparater bruger tit rutepunkter."],
        ["Hvilket redskab hjælper dig med at se små spor bedre?","Et forstørrelsesglas",["En hammer","En ske","En paraply"],"Det gør detaljerne større.","Et forstørrelsesglas gør små detaljer større.","En buet linse bøjer lysstrålerne."],
        ["Et fodaftryk er først og fremmest et…","Spor",["Planet","Instrument","Farve"],"En detektiv leder efter dem.","Et fodaftryk kan være et spor.","Spor kan fortælle, hvem der har været et sted."],
        ["Hvorfor kigger du godt omkring dig på en skattejagt?","Spor kan være gemt",["For at stoppe tiden","For at lave regn","For at vokse hurtigere"],"Alting ligger ikke midt på stien.","At kigge godt efter er vigtigt på en jagt.","Gode jagter blander kiggen, tænkning og bevægelse."],
        ["Hvad betyder „drej til venstre“ på en rute?","Drej mod venstre side",["Lige ud","Hjem igen","Op ad bakke"],"Tænk på din venstre hånd.","At dreje til venstre er at gå mod venstre.","Retningsord er vigtige i navigation."],
        ["Hvad er en koordinat?","En måde at angive et sted præcist på",["En slags nøgle","Et dyrespor","En belønning"],"Kort og GPS bruger dem.","Koordinater beskriver en position.","Bredde og længde er eksempler."],
        ["Hvad gør du, når to spor modsiger hinanden?","Tjekker dem en gang til",["Vælger bare et af dem","Smider det hele ud","River kortet i stykker"],"Måske har du læst noget forkert.","At tjekke hjælper med at finde fejl.","Gode søgere kontrollerer deres oplysninger."],
        ["Hvorfor er det nyttigt at lede sammen?","Man kan lægge idéer og iagttagelser sammen",["Fordi den ene må lave ingenting","For at gemme spor","For at stoppe tiden"],"To par øjne ser mere.","Samarbejde kan løse problemer hurtigere.","Hold deler tit opgaverne mellem sig."],
        ["Hvad er det sidste spor til?","Det fører dig til det sidste sted",["Det sender dig tilbage til spørgsmål 1","Det laver en ny verden","Det sletter ruten"],"Det bringer dig til løsningen.","Det sidste spor fører som regel til målet eller skatten.","En god jagt bygger trin for trin op mod slutningen."]
      ]
    },
    dieren: {
      snelle_dieren: [
        ["Hvilket landdyr er det hurtigste?","Geparden",["Elefanten","Pandaen","Flodhesten"],"Det er en slank, plettet kat.","Geparden er det hurtigste landdyr.","På en kort spurt kan den komme over 90 km/h."],
        ["Hvilken fugl svømmer hurtigst?", "Pingvinen", ["Svanen", "Anden", "Mågen"], "Den kan ikke flyve, men svømme så meget desto bedre.", "En æselpingvin når over tredive kilometer i timen under vandet.", "Fjerene ligger som tagsten, så der ikke kommer vand igennem."],
        ["Hvilken fugl er berømt for ekstremt hurtige styrtdyk?","Vandrefalken",["Pingvinen","Hønen","Strudsen"],"Den jager fra luften.","Vandrefalken er et af de hurtigste dyr.","I styrtdyk kan den komme over 300 km/h."],
        ["Hvorfor har en hurtig fisk en strømlinet krop?","For at have mindre modstand",["For at veje mere","For at synge højere","For at fange mere luft"],"En glat form skærer lettere gennem vandet.","Strømlinet form mindsker vandmodstanden.","Delfiner har også en strømlinet form."],
        ["Hvem løber hurtigst: en hest eller en skildpadde?","Hesten",["Skildpadden","Lige hurtigt","Ingen af dem"],"Den har lange, stærke ben.","En hest er meget hurtigere end en skildpadde.","I galop kommer heste op på høj fart."],
        ["Hvorfor har gazeller lange ben?","For at løbe og springe hurtigt",["For at svømme","For at grave","For at flyve"],"De lever på åbne sletter.","Lange ben hjælper gazeller med at flygte hurtigt.","Farten hjælper dem med at slippe fra rovdyr."],
        ["Hvilken haj er kendt som en hurtig svømmer?","Makohajen",["Hvalhajen","Søhesten","Dragefisken"],"Den har en strømlinet krop.","Makohajer er blandt de hurtigste hajer.","De jager hurtige fisk."],
        ["Hvad hjælper en struds med at løbe hurtigt?","Stærke, lange ben",["Vinger til at flyve med","En svømmeblære","Kløer til at klatre med"],"Den kan ikke flyve.","Strudse er hurtige løbere.","De kan løbe op til 70 kilometer i timen."],
        ["Hvorfor er fart nyttig for byttedyr?","For at slippe væk",["For at få træer til at gro","For at lave kulde","For at sove"],"Rovdyr prøver at fange dem.","Fart kan gøre deres chance for at overleve bedre.","Nogle byttedyr laver også skarpe sving."],
        ["Hvorfor er fart nyttig for rovdyr?","For at fange bytte",["For at vande planter","For at farve fjer","For at bygge reder"],"En jagt er tit meget kort.","Fart hjælper under forfølgelsen.","Ikke alle rovdyr bruger fart; nogle ligger på lur."]
      ],
      baby_dieren: [
        ["Hvad hedder en hundeunge?","En hvalp",["En kalv","Et føl","En kylling"],"Ordet begynder med hv.","En ung hund hedder en hvalp.","Hvalpe fødes blinde og døve."],
        ["Hvad hedder en katteunge?","En killing",["Et føl","Et lam","En kalv"],"Det er en ung kat.","En ung kat hedder en killing.","Killinger sover rigtig meget."],
        ["Hvad hedder en ung hest?","Et føl",["En hvalp","En kylling","En løveunge"],"Den kommer hurtigt op at stå.","En ung hest hedder et føl.","Føl prøver at rejse sig kort efter fødslen."],
        ["Hvad hedder et ungt får?","Et lam",["En kalv","En hvalp","En killing"],"Du ser dem tit om foråret.","Et ungt får hedder et lam.","Lam drikker mælk fra deres mor."],
        ["Hvad hedder en kos unge?","En kalv",["Et føl","Et lam","En kylling"],"En ung elefant hedder også det.","En ung ko hedder en kalv.","Kalve drikker mælk i starten."],
        ["Hvad hedder en nyudklækket høne?","En kylling",["En løveunge","En hvalp","Et lam"],"Den kommer ud af et æg.","En nyudklækket høne hedder en kylling.","Kyllinger pipper allerede, før de kommer ud af ægget."],
        ["Hvad hedder en ung løve?","En løveunge",["Et føl","En kalv","En killing"],"Unge ulve har også deres eget navn.","En ung løve er en løveunge.","Løveunger bliver længe i flokken."],
        ["Hvad drikker mange pattedyrunger først?","Mælk",["Saltvand","Benzin","Sodavand"],"Deres mor laver den.","Pattedyr giver deres unger mælk.","Det er et vigtigt kendetegn ved pattedyr."],
        ["Hvorfor bliver mange dyreunger tæt ved deres mor?","For beskyttelse og mad",["For at flyve hurtigere","For at klatre i træer","For at lave kulde"],"De har stadig meget at lære.","Forældre beskytter og passer tit deres unger.","Hvor længe det varer, er meget forskelligt fra art til art."],
        ["Hvilken dyreunge kommer ud af et æg?","Kyllingen",["Hvalpen","Kalven","Føllet"],"Tænk på en høne.","En kylling kommer ud af et æg.","Krybdyr, fisk og mange andre dyr lægger også æg."]
      ],
      waterdieren: [
        ["Hvilket pattedyr lever i havet og trækker vejret i luft?","Delfinen",["Tunfisken","Hajen","Vandmanden"],"Den skal op med jævne mellemrum.","Delfiner er pattedyr og trækker vejret med lunger.","De bruger et blåsthul oven på hovedet."],
        ["Hvilket dyr har otte arme?","Blæksprutten",["Hajen","Delfinen","Krabben"],"Den kan gemme sig rigtig godt.","En blæksprutte har otte arme.","Blæksprutter er meget kloge bløddyr."],
        ["Hvilket havdyr er det største dyr på Jorden?","Blåhvalen",["Den hvide haj","Delfinen","Spækhuggeren"],"Det er en kæmpestor hval.","Blåhvalen er det største kendte dyr.","Den kan blive mere end 25 meter lang."],
        ["Hvordan trækker de fleste fisk vejret?","Med gæller",["Med lunger","Gennem huden","Med fjer"],"De henter ilten fra vandet.","Gæller optager ilt fra vandet.","Vandet strømmer forbi gællebladene."],
        ["Hvad hjælper fisk med at styre og svømme?","Finnerne",["Vingerne","Benene","Hårene"],"De sidder på ryggen, bugen og halen.","Finner hjælper med bevægelse og balance.","Halefinnen giver tit meget fremdrift."],
        ["Hvilket dyr kan leve både i havet og på land?","Havskildpadden",["Tunfisken","Vandmanden","Søhesten"],"Den går på land for at lægge æg.","Havskildpadder lever i havet, men lægger æg på land.","Hunnerne vender tit tilbage til den strand, hvor de selv blev klækket."],
        ["Hvad er koraller egentlig?","En koloni af små dyr",["En plante","En sten","En fisk"],"De danner rev.","Koraller består af rigtig mange små polypper.","Koralrev er vigtige levesteder."],
        ["Hvorfor kommer hvaler op til overfladen?","For at trække vejret",["For at vaske gællerne","For at sove på stranden","For at lave mad"],"De er pattedyr.","Hvaler trækker vejret i luft med lunger.","De ånder gennem deres blåsthuller."],
        ["Hvilket dyr har et hårdt skjold og går sidelæns?","Krabben",["Delfinen","Vandmanden","Blæksprutten"],"Du ser dem tit på stranden.","Krabber har et hårdt ydre skelet.","Mange krabber bevæger sig nemt sidelæns."],
        ["Hvorfor er en strømlinet krop nyttig i vandet?","Den mindsker modstanden",["Den larmer mere","Den gør dyret tungere","Den varmer vandet"],"Dyrene glider lettere gennem vandet.","Strømlinet form hjælper med at svømme med mindre kraft.","Delfiner og hajer er gode eksempler."]
      ],
      jungle: [
        ["Hvilket dyr svinger sig tit gennem træerne?","Aben",["Elefanten","Pingvinen","Zebraen"],"Den klatrer på grenene.","Mange abearter lever i træerne.","Nogle aber bruger halen som et ekstra greb."],
        ["Hvilket dyr har et stort farverigt næb?","Tukanen",["Tigeren","Gorillaen","Krokodillen"],"Det er en tropisk fugl.","Tukaner har meget iøjnefaldende næb.","Deres næb er overraskende let."],
        ["Hvilket stort dyr lever i regnskove og spiser mange planter?","Gorillaen",["Pingvinen","Kamelen","Isbjørnen"],"Det er en menneskeabe.","Gorillaer lever i afrikanske skove.","De spiser mest planter."],
        ["Hvorfor har mange jungledyr camouflage?","For at falde mindre i øjnene",["For at synge højere","For at lave mere regn","For at vokse hurtigere"],"Mønstrene ligner blade og skygger.","Camouflage hjælper dyr med at jage eller gemme sig.","Mange jaguarers pletter ligner skygger."],
        ["Hvilken stor kat lever i junglen i Amerika?","Jaguaren",["Løven","Sneleoparden","Los"],"Den har rosetter i pelsen.","Jaguarer lever i dele af Mellem- og Sydamerika.","De svømmer overraskende godt."],
        ["Hvorfor er regnskovens træer så vigtige?","De giver mad og levesteder",["De laver ingen ilt","De stopper al regnen","De er kun pynt"],"Mange dyr lever i forskellige lag af træerne.","Regnskovens træer danner rige levesteder.","Nogle dyr kommer næsten aldrig ned på skovbunden."],
        ["Hvilket krybdyr kan skifte farve?","Kamæleonen",["Skildpadden","Krokodillen","Slangen"],"Den bruger også farven til at kommunikere.","Kamæleoner kan ændre deres farvemønster.","Farveskiftet hjælper med temperatur og signaler."],
        ["Hvad er en regnskov?","En varm skov med rigtig meget regn",["En frossen ørken","En græsslette uden træer","Et hav"],"Den har utrolig mange arter.","Tropiske regnskove får rigtig meget regn.","De er blandt de mest artsrige steder på Jorden."],
        ["Hvorfor råber brøleaber så højt?","For at kommunikere med deres flok",["For at lave regn","For at skubbe træer","For at svømme"],"Deres råb bærer langt gennem skoven.","Brøleaber kommunikerer med meget høje råb.","En forstørret struktur i halsen forstærker råbet."],
        ["Hvilket dyr kan fange insekter med en lang tunge?","Kamæleonen",["Elefanten","Gorillaen","Tukanen"],"Tungen skyder lynhurtigt frem.","Kamæleoner fanger byttet med deres lange tunge.","Tungen kan sætte farten op ekstremt hurtigt."]
      ]
    },
    aarde: {
      continenten_landen: [
        ["Hvilken verdensdel ligger Holland i?","Europa",["Afrika","Asien","Sydamerika"],"Tænk på nabolandene.","Holland ligger i Europa.","Europa er en af de syv verdensdele."],
        ["Hvad er den største verdensdel?","Asien",["Europa","Afrika","Australien"],"Kina og Indien ligger der.","Asien er den største verdensdel.","Mere end halvdelen af alle mennesker bor i Asien."],
        ["Hvilken verdensdel ligger Brasilien i?","Sydamerika",["Afrika","Europa","Asien"],"Tænk på Amazonas.","Brasilien ligger i Sydamerika.","Brasilien er det største land i Sydamerika."],
        ["Hvilken verdensdel ligger det meste af Egypten i?","Afrika",["Europa","Asien","Nordamerika"],"Nilen løber igennem.","Egypten ligger for det meste i Afrika.","Sinaihalvøen hører geografisk til Asien."],
        ["Hvad er Frankrigs hovedstad?","Paris",["Rom","Madrid","Berlin"],"Eiffeltårnet står der.","Paris er Frankrigs hovedstad.","Seinen løber gennem Paris."],
        ["Hvad er Italiens hovedstad?","Rom",["Milano","Venedig","Napoli"],"Colosseum står der.","Rom er Italiens hovedstad.","Vatikanstaten ligger inde i Rom."],
        ["Hvilket land har form som en støvle?","Italien",["Portugal","Norge","Polen"],"Kig på Sydeuropa.","Italien ligner en støvle.","Sicilien ligger tæt ved støvlespidsen."],
        ["Hvilket ocean ligger mellem Europa og Amerika?","Atlanterhavet",["Stillehavet","Det Indiske Ocean","Ishavet"],"Skibe sejler over det.","Atlanterhavet ligger mellem Europa, Afrika og Amerika.","Det er det næststørste ocean."],
        ["Hvilken verdensdel ligger ved Sydpolen?","Antarktis",["Europa","Afrika","Asien"],"Den er dækket af is.","Antarktis ligger rundt om Sydpolen.","Det er den koldeste verdensdel."],
        ["Hvilket land ligger lige øst for Holland?","Tyskland",["Spanien","Irland","Italien"],"Det er et naboland.","Tyskland grænser op til Holland.","Holland grænser også op til Belgien."]
      ],
      weer_klimaat: [
        ["Hvad måler et termometer?","Temperaturen",["Vindretningen","Regnmængden","Lufttrykket"],"Varmt eller koldt.","Et termometer måler temperaturen.","Vi bruger tit grader celsius."],
        ["Hvad er nedbør?","Vand, der falder fra himlen",["Vind","Sollys","Tåge"],"Regn og sne er eksempler.","Nedbør kan være regn, sne eller hagl.","Det opstår af vandet i skyerne."],
        ["Hvad er vind?","Luft i bevægelse",["Vand i bevægelse","Varmt sand","En sky"],"Du mærker den, men ser den ikke.","Vind er luft, der bevæger sig.","Forskelle i lufttryk laver det meste af vinden."],
        ["Hvorfor opstår der tit tåge?","Vanddamp fortættes tæt ved jorden",["På grund af stjernerne","På grund af sand","På grund af magneter"],"Man kan se dårligere.","Tåge består af bittesmå vanddråber i luften.","Tåge er faktisk en sky nede ved jorden."],
        ["Hvad er klima?","Det gennemsnitlige vejr over lang tid",["Vejret i dag","Et tordenvejr","En regnmåler"],"Det handler om år, ikke om én dag.","Klima beskriver det typiske vejr over en lang periode.","Vejret kan ændre sig meget fra dag til dag."],
        ["Hvad laver et lyn?","En elektrisk udladning",["Et stjerneskud","Et fly","En regnbue"],"Det sker tit ved tordenskyer.","Et lyn er en kæmpe elektrisk udladning.","Luften omkring bliver ekstremt varm."],
        ["Hvorfor hører du tordenen efter lynet?","Lys er hurtigere end lyd",["Tordenen begynder senere","Skyerne venter","Solen stopper lyden"],"Du ser lynet først.","Lyset når dig meget hurtigere end lyden.","Tidsforskellen hjælper med at gætte afstanden til tordenvejret."],
        ["Hvilken sky følger tit med kraftige byger og torden?","Tordenskyen",["Fjerskyen","Tågen","Ingen sky"],"Den kan blive meget høj.","Tordenskyer kan give tordenvejr.","Øverst har de tit form som en ambolt."],
        ["Hvad er en hedebølge?","En periode med usædvanlig varmt vejr",["En pludselig snebyge","Et jordskælv","En høj bølge på havet"],"Den varer flere dage.","En hedebølge er en længere periode med meget varmt vejr.","Definitionerne er forskellige fra land til land."],
        ["Hvad er frost?","En temperatur under frysepunktet",["Kraftig vind","Meget kraftig regn","Tæt tåge"],"Så kan vand fryse.","Ved frost falder temperaturen til omkring 0 °C eller derunder.","Rim kan opstå, når vanddamp fryser."]
      ],
      oceanen_natuur: [
        ["Hvad dækker det meste af Jorden?","Vand",["Ørken","Skov","Is"],"Oceanerne fylder enormt meget.","Cirka 71% af Jorden er dækket af vand.","Det meste af det er salt havvand."],
        ["Hvilket ocean er det største?","Stillehavet",["Atlanterhavet","Det Indiske Ocean","Ishavet"],"Det ligger mellem Asien og Amerika.","Stillehavet er det største ocean.","Det dækker cirka en tredjedel af Jordens overflade."],
        ["Hvad hedder den smeltede sten, der kommer ud af en vulkan?","Lava",["Magma","Ler","Sand"],"Uden for Jorden kalder vi det sådan.","På overfladen hedder smeltet sten lava.","Under jorden kalder vi det magma."],
        ["Hvad er en ø?","Land, der er helt omgivet af vand",["En høj sky","En flod","En ørken"],"Du skal over vand for at komme derhen.","En ø er omgivet af vand på alle sider.","Grønland er den største ø, der ikke er en verdensdel."],
        ["Hvad er en bjergkæde?","En række af bjerge",["En bred flod","Et hav","En øgruppe"],"Alperne er en af dem.","En bjergkæde består af bjerge, der hænger sammen.","I Himalaya står Jordens højeste bjerge."],
        ["Hvad er en flods udmunding?","Det sted, hvor floden ender",["Flodens kilde","En bjergtop","En ørken"],"Floden løber tit ud i et hav eller en sø.","Udmundingen er enden på en flod.","Nogle floder danner et delta ved udmundingen."],
        ["Hvad er en ørken?","Et område med meget lidt nedbør",["Altid en varm strand","En regnskov","Et ocean"],"Ikke alle ørkener er varme.","Ørkener får meget lidt nedbør.","Teknisk set er Antarktis også en ørken."],
        ["Hvad er en gletsjer?","En ismasse, der bevæger sig langsomt",["En sky","En lavaflod","En sandklit"],"Den dannes af sammenpresset sne.","Gletsjere bevæger sig langsomt på grund af deres egen vægt.","De former dale og landskaber."],
        ["Hvad er erosion?","Nedslidning og flytning af sten og jord",["Træer, der vokser","Stjerner, der dannes","Luft, der fryser"],"Vand og vind kan skabe den.","Erosion ændrer landskaber.","Floder kan grave dybe dale ud."],
        ["Hvad er et delta?","Et område, hvor en flod deler sig ved udmundingen",["En bjergtop","En havstrøm","En sky"],"Der kan være frugtbar jord.","Et delta dannes af aflejret materiale.","Nildeltaet er et kendt eksempel."]
      ],
      kaarten_navigatie: [
        ["Hvad viser en kompasrose?","Retningerne",["Temperaturen","Højden","Tidszonerne"],"Nord, øst, syd og vest.","En kompasrose viser retningerne.","Kort bruger tit N, Ø, S og V."],
        ["Hvad bruges signaturforklaringen på et kort til?","Til at forklare symbolerne",["Til at pynte kortet","Til at måle afstande","Til at lave vind"],"Farver og tegn får en betydning.","Forklaringen fortæller, hvad tegnene på kortet betyder.","En blå streg kan for eksempel være en flod."],
        ["Hvad er målestokken på et kort?","Forholdet mellem afstanden på kortet og i virkeligheden",["Et musikinstrument","En temperaturmåler","En farvekode"],"1 cm kan for eksempel betyde 1 km.","Målestokken gør afstandene på kortet forståelige.","En stor målestok viser som regel flere detaljer."],
        ["Hvad er koordinater?","Tal eller værdier, der angiver et sted",["En slags sky","En mønt","En flod"],"GPS bruger dem.","Koordinater beskriver en position.","Bredde og længde er kendte koordinater."],
        ["Hvilken retning ligger over for nord?","Syd",["Øst","Vest","Nordøst"],"Tænk på kompasrosen.","Syd ligger over for nord.","Øst og vest står vinkelret på nord og syd."],
        ["Hvilken retning har du til højre, når du kigger mod nord?","Øst",["Vest","Syd","Nord"],"På mange kort er nord opad.","Med nord opad ligger øst til højre.","Derfor ligger vest til venstre på sådan et kort."],
        ["Hvad er et topografisk kort?","Et kort med terræn og højder",["Et stjernekort","En menu","En tidslinje"],"Det kan have højdekurver.","Topografiske kort viser landskabet og højderne.","Vandrere bruger dem tit."],
        ["Hvad er GPS?","Et satellitsystem til at finde positionen",["En slags sky","En vulkan","Et kompas uden satellitter"],"Din telefon kan bruge det.","GPS bruger signaler fra satellitter til at finde din position.","Der skal flere satellitter til en præcis position."],
        ["Hvorfor er nord tit opad på kort?","Det er en udbredt vane",["Fordi nord ligger højere","Fordi Solen altid er der","Fordi floderne løber derhen"],"Det er en aftale, ikke en naturlov.","Mange moderne kort sætter nord opad.","Gamle kort vendte nogle gange anderledes."],
        ["Hvad er en rute?","En planlagt vej fra start til mål",["En regnsky","Et bjerg","En landegrænse"],"Navigation hjælper dig med at følge den.","En rute beskriver, hvordan du kommer fra A til B.","Digitale kort beregner ruter helt af sig selv."]
      ]
    }
  };

  window.KWIZILLO_QUESTIONS_DA = window.KWIZILLO_BUILD_BANK(defs, window.KWIZILLO_EXTRA_DA||{}, window.KWIZILLO_MORE_DA||{});
})();
