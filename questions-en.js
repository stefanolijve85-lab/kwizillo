(() => {
  // English bank. Same worlds, topics, order and therefore the same question IDs
  // as the Dutch bank, so progress and collected cards survive a language switch.
  const defs = {
    ruimte: {
      zonnestelsel: [
        ["Which planet is closest to the sun?","Mercury",["Venus","Mars","Earth"],"It is the smallest planet and sits right at the front.","Mercury is closest to the sun.","A year on Mercury lasts only 88 Earth days."],
        ["Which planet is our home planet?","Earth",["Venus","Mars","Jupiter"],"People, animals and plants live here.","We live on Earth.","About 71% of Earth is covered by water."],
        ["Which planet is known as the red planet?","Mars",["Venus","Saturn","Neptune"],"Its soil contains a lot of iron oxide.","Mars is called the red planet.","Mars has two small moons: Phobos and Deimos."],
        ["Which planet has the most famous rings?","Saturn",["Earth","Mercury","Mars"],"It is a big gas giant.","Saturn has a striking ring system.","The rings are mostly made of ice and rock."],
        ["Which planet is the largest in our solar system?","Jupiter",["Mars","Venus","Earth"],"It has a famous Great Red Spot.","Jupiter is the largest planet.","More than a thousand Earths would fit inside Jupiter."],
        ["Which planet is farthest from the sun?","Neptune",["Jupiter","Earth","Venus"],"It is a distant blue ice giant.","Neptune is the farthest planet from the sun.","A year on Neptune lasts about 165 Earth years."],
        ["Which planet lies between Venus and Mars?","Earth",["Mercury","Jupiter","Saturn"],"It is our own planet.","The order is Venus, Earth, Mars.","Earth is the third planet from the sun."],
        ["What orbits the Earth?","The moon",["Jupiter","The sun","Mars"],"You often see it in the night sky.","The moon orbits the Earth.","The moon takes about 27 days for one orbit."],
        ["How many planets does our solar system have?","8",["7","9","10"],"Pluto counts as a dwarf planet these days.","Our solar system has eight planets.","Since 2006 Pluto has been classed as a dwarf planet."],
        ["Which planet is famous for its strong blue colour?","Neptune",["Mercury","Mars","Venus"],"It is a distant ice giant.","Neptune looks deep blue.","Methane in its atmosphere adds to the blue colour."]
      ],
      sterren_planeten: [
        ["What is the sun?","A star",["A planet","A moon","A comet"],"It makes its own light and heat.","The sun is a star.","Sunlight takes about 8 minutes to reach Earth."],
        ["What is a star mostly made of?","Hot gas and plasma",["Cold rock","A moon","A cloud"],"Stars give off their own light.","Stars are made of extremely hot gas and plasma.","Our sun is a medium-sized star."],
        ["What is a galaxy?","A huge group of stars",["One planet","A telescope","A cloud on Earth"],"The Milky Way is one.","A galaxy contains a great many stars.","The Milky Way holds hundreds of billions of stars."],
        ["What is our galaxy called?","The Milky Way",["Andromeda","Orion","Saturn"],"You sometimes see a pale band in a dark sky.","Our solar system sits inside the Milky Way.","The Milky Way is a spiral galaxy."],
        ["What is a supernova?","A huge star explosion",["A new moon","A rocket launch","A rain shower"],"It happens at the end of the life of some stars.","A supernova is an enormous explosion of a star.","Such an explosion can briefly be extremely bright."],
        ["What colour are the hottest stars usually?","Blue",["Red","Brown","Green"],"Think of the hottest flame on a gas hob.","Very hot stars often look bluish.","Red stars are generally cooler than blue ones."],
        ["What is an exoplanet?","A planet around another star",["A moon of Earth","A comet","A satellite"],"It does not orbit our sun.","An exoplanet orbits a star other than the sun.","Thousands of exoplanets have been found by now."],
        ["What is a black hole?","A region with extremely strong gravity",["A dark planet","A cloud","A rocket engine"],"Even light cannot easily escape from it.","A black hole has extremely strong gravity.","Many black holes form from massive stars."],
        ["Which star is closest to Earth?","The sun",["Sirius","Polaris","Betelgeuse"],"You see it every day.","The sun is our nearest star.","The next nearest star is much farther away."],
        ["Why do stars seem to twinkle?","Because of the atmosphere",["Because they blink","Because of their moons","Because they spin"],"Their light bends through layers of air on the way.","The atmosphere makes starlight shimmer a little.","Planets usually twinkle less than stars."]
      ],
      astronauten: [
        ["What do you call someone who travels to space?","Astronaut",["Archaeologist","Diver","Captain"],"That person often wears a spacesuit.","An astronaut travels and works in space.","Astronauts often train for years."],
        ["Why do astronauts wear a spacesuit outside a spacecraft?","For air and protection",["For warmth","For speed","As a uniform"],"You cannot simply breathe in space.","A spacesuit supplies oxygen and protection.","A spacesuit also protects against extreme temperatures."],
        ["What do astronauts often feel in a space station?","Weightlessness",["Heavy rain","Strong wind","Earthquakes"],"They seem to float.","In orbit astronauts experience microgravity.","Everything has to be strapped down so it does not float away."],
        ["Where do astronauts usually sleep on the space station?","In sleeping bags that are strapped down",["In normal beds","In hammocks outside","On the floor"],"Otherwise they would float away.","Astronauts often sleep in attached sleeping bags.","In microgravity there is no real up or down."],
        ["Why do astronauts train under water?","To imitate weightlessness",["To swim faster","To look for moon water","To relax"],"Under water you can practise floating movements.","Underwater training helps rehearse spacewalks.","Big pools sometimes hold models of space station parts."],
        ["What is a spacewalk?","Work outside a spacecraft",["Walking on Earth","Running inside a rocket","Strolling in a museum"],"The astronaut stays attached with safety systems.","A spacewalk is also called an EVA.","Astronauts wear a full spacesuit for it."],
        ["What happens to muscles in long periods of weightlessness?","They can get weaker",["They turn to steel","They vanish at once","They always grow faster"],"That is why astronauts exercise a lot.","Without training muscles and bones can weaken.","Astronauts train every day on the ISS."],
        ["What do astronauts eat in space?","Specially packaged food",["Pills","Ice cream","Nothing"],"It has to be safe in microgravity.","Astronauts eat specially packaged food.","Crumbs are tricky because they can float around."],
        ["What is the ISS?","An international space station",["A planet","A rocket engine","A moon base"],"It orbits the Earth.","The ISS is a large space station in orbit around Earth.","Astronauts from different countries work there together."],
        ["Why must an astronaut stay tethered while working?","So they do not float away",["For extra gravity","Against rain","For speed"],"In microgravity you keep on moving easily.","A tether stops someone drifting off uncontrolled.","Tools are usually secured too."]
      ],
      raket_avontuur: [
        ["What is a rocket engine for?","To create thrust",["To print photos","To make oxygen","To count stars"],"It pushes hot gases backwards.","A rocket engine provides thrust.","By action and reaction the rocket moves the other way."],
        ["Why does a rocket need so much fuel?","To escape gravity",["For lighting","For air conditioning","For the radio"],"Liftoff takes an enormous amount of energy.","A launch needs huge amounts of energy.","Most of a rocket at launch can be fuel."],
        ["What happens at liftoff?","The rocket rises",["The rocket lands","The engine always stops","The moon comes closer"],"This is the moment of departure.","Liftoff is the moment the rocket leaves the ground.","The first seconds are technically very important."],
        ["Why do some rockets have several stages?","To drop empty parts",["For extra windows","For sleeping areas","For colours"],"That way the rocket carries less mass.","Rockets can drop stages once their fuel is gone.","That makes further acceleration more efficient."],
        ["What is a launch pad?","The place where a rocket departs",["A satellite","A moon rover","A cockpit seat"],"The rocket stands there before the start.","A launch pad supports the rocket before flight.","There are huge systems for fuel, cooling and safety."],
        ["What is a satellite?","An object that orbits another object",["A star explosion","A rocket engine","A telescope"],"The moon is technically a natural satellite too.","Satellites travel in orbit around a planet or other body.","Artificial satellites help with navigation and communication."],
        ["Why is the nose of a rocket streamlined?","To reduce air resistance",["To be heavier","To catch more rain","For colour"],"A smooth shape moves through air more easily.","A streamlined shape reduces drag.","Once out of the atmosphere air resistance is almost gone."],
        ["What is a capsule?","A part where people or cargo can travel",["A galaxy","A moon","An engine fuel"],"It often sits on top of the rocket.","A space capsule carries people or cargo.","Some capsules come back down with parachutes."],
        ["What helps a capsule land safely?","Parachutes",["Stars","Solar flares","Asteroids"],"They slow the descent.","Parachutes slow down a returning capsule.","Some vehicles land using engines as well."],
        ["What is an orbit around the Earth?","A path where you keep falling around the Earth",["A straight road to the sun","A tunnel","A cloud"],"Speed and gravity are in balance together.","A satellite in orbit keeps falling around the Earth.","That is why it does not crash straight down."]
      ]
    },
    geschiedenis: {
      egyptenaren: [
        ["What were many pyramids built for?","As tombs",["As schools","As markets","As harbours"],"Think of pharaohs and their burial.","Many pyramids were tombs for pharaohs.","The Great Pyramid of Giza is thousands of years old."],
        ["What was a ruler in ancient Egypt called?","Pharaoh",["Senator","Knight","Viking"],"They stood at the top of society.","An Egyptian ruler was called a pharaoh.","Some pharaohs were regarded as divine."],
        ["Which river was very important to Egypt?","The Nile",["The Rhine","The Amazon","The Danube"],"It flows through the land and makes the soil fertile.","The Nile was essential for farming and transport.","Yearly floods brought fertile silt."],
        ["What is the Egyptian writing with signs and pictures called?","Hieroglyphs",["Latin","Runes","Morse code"],"You see it on temples and tombs.","Hieroglyphs were an important Egyptian script.","The script used hundreds of signs."],
        ["What is a mummy?","A preserved body",["A gold coin","A temple","A boat"],"The body was specially treated after death.","Egyptians made mummies to preserve bodies.","The process could take many weeks."],
        ["What did Egyptians often write on?","Papyrus",["Plastic","Concrete","Aluminium"],"It was made from a plant along the Nile.","Papyrus was used as writing material.","Our word paper is related to papyrus."],
        ["What was the Sphinx of Giza?","A statue with a lion body and a human head",["A pyramid","A ship","A crown"],"It stands close to the pyramids.","The Great Sphinx is an enormous stone statue.","The Sphinx was carved out of limestone."],
        ["What did Egyptians use irrigation for?","To water their fields",["To paint pyramids","To write","To make coins"],"Water from the Nile had to reach the fields.","Irrigation helped farming.","Canals and basins spread water across the fields."],
        ["Which animals were often seen as special in Egypt?","Cats",["Polar bears","Penguins","Kangaroos"],"They appear a lot in art and religion.","Cats held a special place in ancient Egypt.","The goddess Bastet was often shown as a cat."],
        ["What did scribes do in ancient Egypt?","Keep texts and records",["Fly pyramids","Train knights","Make stars"],"Writing was an important skill.","Scribes kept records and tracked taxes.","Not everyone could read and write."]
      ],
      ridders_kastelen: [
        ["What did a knight often wear for protection?","Armour",["A spacesuit","A bathrobe","A wetsuit"],"It was made of metal.","Armour protected the body.","A full suit of armour had many separate pieces."],
        ["Where did a powerful lord often live?","In a castle",["In a rocket","In a pyramid","In an igloo"],"The building had thick walls.","Castles were homes and defensive places.","Many castles had towers and walls."],
        ["What is a moat?","A water ditch around a castle",["A bedroom","A market square","An armoury"],"It made attacks harder.","A moat helped defend a castle.","Not every moat always held water."],
        ["What is a drawbridge?","A bridge that can be raised",["A secret staircase","A flag","A tower"],"It was often at the entrance.","A drawbridge could block the way in.","It was often combined with a gate."],
        ["What happened at a knights tournament?","Knights took part in contests",["People built pyramids","People sailed to America","People made telescopes"],"Think of jousting.","Tournaments were contests for knights.","Jousting was a spectacular event."],
        ["What is a shield?","Protection against attacks",["A musical instrument","A map","A drinking cup"],"Knights often carried it on one arm.","A shield protects against weapons.","Shields often carried symbols or coats of arms."],
        ["Who usually did not live permanently in a medieval castle?","All the farmers from the area",["The lord of the castle","Soldiers","Servants"],"Many people lived in villages around the castle.","Most farmers lived outside the castle.","In times of danger people could sometimes shelter there."],
        ["Why did castles have thick walls?","For defence",["For faster internet","For warmth","For decoration"],"They had to withstand attacks.","Thick stone walls made castles stronger.","Later, cannons made many walls far less effective."],
        ["What did a squire often do?","Help a knight and learn",["Bury a pharaoh","Fly a rocket","Build a temple"],"He was sometimes preparing for knighthood.","A squire helped a knight and learned skills.","Not every squire eventually became a knight."],
        ["What was a stronghold?","A fortified place to live",["A galaxy","A ship","A school subject"],"The word is often used for castles.","A stronghold was a fortified place.","Strongholds often stood in strategic spots."]
      ],
      romeinen: [
        ["Who built the Colosseum?","The Romans",["The Vikings","The Maya","The Egyptians"],"It stands in Rome.","The Colosseum was built by the Romans.","It could hold tens of thousands of spectators."],
        ["What was an aqueduct?","A structure to carry water",["A knight helmet","A temple for boats","A coin"],"It brought water to cities.","Roman aqueducts carried water over long distances.","Some aqueducts are still visible today."],
        ["Which language did many Romans speak?","Latin",["Dutch","Japanese","Arabic"],"Many European words come from it.","Latin was an important language in the Roman Empire.","French, Spanish and Italian are Romance languages."],
        ["What was a legion?","A large group of Roman soldiers",["A market","A bathhouse","A ship"],"It was part of the army.","A legion was a large army unit.","Roman soldiers trained strictly."],
        ["What was a forum in a Roman town?","A central square",["A prison","A farm","A harbour"],"People came there for trade and government.","The forum was an important town centre.","Temples and public buildings often stood there."],
        ["What were Roman bathhouses for?","Washing and meeting",["Building rockets","Storing grain","Training horses"],"People also gathered there socially.","Bath complexes were important meeting places.","Some had hot and cold baths."],
        ["What did a Roman soldier often wear?","A helmet and shield",["A spacesuit","A cowboy hat","A wetsuit"],"He had to protect himself in battle.","Roman soldiers used helmets, shields and weapons.","Their equipment changed over the centuries."],
        ["What does “Roman Empire” mean?","A large area governed from Rome",["The city of Rome","A pyramid","An order of knights"],"It stretched across large parts of Europe.","The Roman Empire was very extensive.","At its height it covered lands around the Mediterranean."],
        ["What did Romans use for long distances over land?","An extensive road network",["Rivers","Hot air balloons","Trains"],"Many roads were solidly built.","The Romans built a large road network.","Some modern roads follow old Roman routes."],
        ["What was a senator in Rome?","An important official",["A gladiator","A pharaoh","A knight"],"He had a political role.","Senators had influence on government.","The Roman Senate lasted for centuries."]
      ],
      ontdekkingsreizigers: [
        ["What did an explorer do?","Explore new areas",["Build planets","Invent electricity","Guard pyramids"],"Think of long journeys.","Explorers travelled to unknown regions.","Their voyages changed maps and trade."],
        ["What did sailors use a compass for?","To find direction",["To cook food","To write","To measure depth"],"The needle points roughly north.","A compass helps with navigation.","It made long sea voyages more reliable."],
        ["What is a nautical chart?","A map for sailing at sea",["A painting","A knight coat of arms","A constellation"],"Ships used it to plan routes.","Nautical charts show coasts, hazards and routes.","Modern ships often use digital charts."],
        ["Why were stars useful to sailors?","To help work out their position",["To attract fish","To make wind","To heat water"],"At night especially they gave direction.","Stars could help with navigation.","The North Star was important in the northern hemisphere."],
        ["What was a caravel?","A type of sailing ship",["A Roman bath","A castle","A temple"],"It was used for long voyages.","Caravels were nimble sailing ships.","They played a part in European voyages of discovery."],
        ["Why did explorers take supplies with them?","Because voyages could last a long time",["Because there were shops at sea","For decoration","To build stars"],"At sea you could not simply go shopping.","Food and water were crucial on long voyages.","Shortages and disease were serious risks."],
        ["What is navigation?","Working out where you are and where you are going",["Painting a ship","Learning a language","Building a market"],"Compass and charts help with it.","Navigation is planning and following a route.","GPS is a modern form of navigation."],
        ["What was a major danger on long sea voyages?","Storms and disease",["Traffic lights","Snow in the desert","Satellites"],"Journeys sometimes took months.","Storms, illness and food shortages were dangerous.","Scurvy came from a long lack of vitamin C."],
        ["Why were new routes to Asia sought?","For trade in valuable goods",["For skiing","For dinosaurs","For spaceflight"],"Spices were extremely valuable.","Trade drove many voyages of discovery.","Spices could be very expensive in Europe."],
        ["What did mapmakers do after new voyages?","Improve their maps",["Raise pyramids","Move stars","Change time"],"New knowledge was added.","Travel reports helped make maps more accurate.","Maps grew more detailed over the centuries."]
      ]
    },
    wetenschap: {
      slimme_proefjes: [
        ["What often happens when you mix baking soda and vinegar?","Bubbles of gas appear",["It freezes at once","It turns into metal","Nothing happens"],"You see a lot of fizzing.","The reaction produces carbon dioxide among other things.","That gas can inflate a balloon, for example."],
        ["Why do you wear safety glasses for some experiments?","To protect your eyes",["To hear better","To run faster","For colour"],"Some substances can splash.","Safety glasses protect your eyes.","Working safely is an important part of science."],
        ["What is a hypothesis?","A testable expectation",["An established fact","A measuring instrument","A liquid"],"You decide what you expect before you test.","A hypothesis is a prediction you can investigate.","After an experiment a hypothesis may or may not be supported."],
        ["In a fair experiment, what should you keep as equal as possible?","The other conditions",["The outcome","The question","Your name"],"You want to change only one thing at a time.","Controlling variables makes an experiment fairer.","That way you know better what caused an effect."],
        ["What do you use to measure liquid volume accurately?","A measuring cylinder",["A magnifying glass","A compass","A stopwatch"],"It has marks along the side.","A measuring cylinder measures volume.","Volume is often measured in millilitres."],
        ["What does a thermometer do in an experiment?","Measure temperature",["Measure time","Measure weight","Make light"],"You can measure hot or cold with it.","A thermometer measures temperature.","Here we often use degrees Celsius."],
        ["Why do you write down the results of an experiment?","So you can compare them",["To forget them","To clean the glass","For decoration"],"Scientists record their measurements.","Recording results helps with analysis and repetition.","Good science has to be checkable."],
        ["What happens to ice when you heat it?","It melts",["It turns to stone","It disappears at once","It gets heavier"],"Solid water becomes liquid.","Ice melts into water.","At normal pressure ice melts around 0 °C."],
        ["What do you need to make a shadow?","A light source and an object",["Sound","Water","Wind"],"The object blocks the light.","A shadow appears when light is blocked.","Its size changes with the distance to the light source."],
        ["What is dissolving, like sugar in water?","The substance spreads through the liquid",["The substance leaves the world","The substance becomes fire","The liquid freezes"],"You can no longer see the grains separately.","Dissolved particles spread through the liquid.","You can often get sugar back by evaporating the water."]
      ],
      lichaam: [
        ["Which organ pumps blood around your body?","Heart",["Lungs","Stomach","Brain"],"You can feel it beating.","The heart pumps blood around.","Your heart beats about a hundred thousand times a day."],
        ["What do you mainly breathe with?","Lungs",["Kidneys","Stomach","Bones"],"They sit inside your chest.","The lungs take in oxygen.","You normally have two lungs."],
        ["Which organ helps you think?","Brain",["Liver","Heart","Intestines"],"It sits inside your skull.","The brain processes information and controls many body functions.","Billions of nerve cells work together there."],
        ["What does blood carry around your body?","Oxygen and nutrients",["Air","Bones","Warmth"],"Blood travels through blood vessels.","Blood carries oxygen and nutrients among other things.","Red blood cells help carry oxygen."],
        ["Where does digesting food already begin?","In the mouth",["In the foot","In the lungs","In the ear"],"You chew food into small pieces.","Digestion begins in the mouth.","Saliva contains substances that help break food down."],
        ["What do your ribs protect?","Heart and lungs",["Your feet","Your teeth","Your fingers"],"They form a cage around the chest.","Ribs protect important organs.","Most people have 12 pairs of ribs."],
        ["Besides support, what are bones for?","Protection and movement",["Colour","Sleep","Temperature"],"Muscles pull on bones.","Bones give support and protection and help with movement.","Blood cells are made in bone marrow."],
        ["What do muscles do?","They contract to create movement",["They only make blood","They digest food","They see light"],"Muscles often work together with bones.","Muscles can contract and so cause movement.","Your body has hundreds of muscles."],
        ["What is the skin?","The largest organ of your body",["A bone","A muscle","A blood vessel"],"It covers your whole body.","The skin protects the body.","The skin also helps regulate temperature."],
        ["Which sense do you use with your ears?","Hearing",["Taste","Smell","Sight"],"You pick up sound waves.","With your ears you sense sound.","Your inner ear also helps with balance."]
      ],
      uitvindingen: [
        ["What can you use to look at very small things?","Microscope",["Telescope","Compass","Barometer"],"Think of cells and bacteria.","A microscope magnifies small objects.","Modern microscopes can magnify extremely strongly."],
        ["What do you look at distant stars and planets with?","Telescope",["Microscope","Thermometer","Magnet"],"It makes distant objects easier to see.","A telescope collects light from distant objects.","There are telescopes on Earth and in space."],
        ["Which invention made books much faster to copy?","The printing press",["Compass","Steam whistle","Torch"],"Text could be printed with movable letters.","The printing press made mass production of books possible.","That helped knowledge spread faster."],
        ["What is a battery used for?","Storing and supplying electrical energy",["Measuring wind","Boiling water without energy","Making stars"],"You find one in many devices.","A battery supplies electrical energy.","Rechargeable batteries can be used again."],
        ["What does a magnet do?","It can attract certain metals",["It always makes light","It freezes water","It stops time"],"Iron responds to it well.","Magnets exert forces on magnetic materials.","A magnet has a north and a south pole."],
        ["What does a solar panel make?","Electricity from light",["Rain from clouds","Petrol from air","Sound from stones"],"The sun supplies the energy.","Solar cells turn light into electricity.","Solar panels need no moving parts."],
        ["What does an engine do?","Turn energy into movement",["Make colours","Freeze water","Read paper"],"Cars and machines use engines.","An engine converts energy into movement.","There are electric and combustion engines."],
        ["Why was the telephone an important invention?","People could speak over a distance",["People could fly","People could stop time","People could live without power"],"Sound was sent across a distance.","The telephone changed communication greatly.","Mobile phones now combine many functions."],
        ["What does a computer mainly do?","Process information",["Make music","Give light","Purify water"],"It carries out instructions.","Computers process data according to programs.","Even a smartwatch contains a computer."],
        ["Which invention uses radio waves to work out position?","GPS",["Magnet","Microscope","Stethoscope"],"Satellites help work out where you are.","GPS uses signals from satellites.","Your phone uses GPS for navigation."]
      ],
      natuur_energie: [
        ["Which energy source uses moving air?","Wind energy",["Solar energy","Natural gas","Nuclear energy"],"Wind turbines spin because of it.","Wind turbines turn wind into electricity.","Larger turbines can supply many households."],
        ["Which energy source uses sunlight?","Solar energy",["Coal","Oil","Natural gas"],"Panels capture the light.","Solar panels turn light into electricity.","The sun supplies far more energy than we use worldwide."],
        ["What is renewable energy?","Energy from sources that keep being replenished",["Energy that is never used","Petrol","Coal"],"Think of sun and wind.","Renewable sources do not run out quickly.","Hydropower and geothermal energy can be renewable too."],
        ["What does a wind turbine do?","Turn wind into electricity",["Make rain","Produce petrol","Move clouds"],"The blades turn in the wind.","A generator inside the turbine makes electricity.","Wind turbines stand on land and at sea."],
        ["Which substance is released when fossil fuels burn?","Carbon dioxide",["Oxygen","Gold","Helium"],"It is a greenhouse gas.","Burning oil, gas and coal releases CO₂.","More CO₂ strengthens the greenhouse effect."],
        ["Why do we insulate houses?","To keep heat in or out better",["To make windows heavier","To make water","To boost wi-fi"],"Good insulation saves energy.","Insulation reduces heat loss.","Roofs, walls and floors can all be insulated."],
        ["What is hydropower?","Energy from flowing or falling water",["Energy from sand","Energy from smoke","Energy from plastic"],"A dam and a river can drive turbines.","Hydropower uses the movement of water.","It is an important renewable source worldwide."],
        ["What is saving energy?","Using less energy for the same result",["Switching on more lamps","Windows open with the heating on","Leaving appliances running"],"Efficient appliances help.","Saving energy lowers consumption.","LED lamps use less power than old light bulbs."],
        ["What does the battery in an electric car do?","Store electrical energy",["Make petrol","Measure wind","Cool water"],"It feeds the electric motor.","The battery stores energy for driving.","Braking can sometimes recover some energy."],
        ["Which lamp is usually more efficient?","LED lamp",["Light bulb","Candle","Halogen lamp"],"It uses less electricity.","LED lighting is very energy efficient.","LED lamps also often last longer."]
      ]
    },
    mysterie: {
      raadsels: [
        ["I have keys but no locks. What am I?","Piano",["Door","Treasure chest","Bicycle"],"You use your fingers to play me.","A piano has keys you press.","A piano can have more than eighty keys."],
        ["I get wetter while I dry. What am I?","Towel",["Umbrella","Sun","A sponge"],"You use me after washing.","A towel gets wet while it dries you.","Towels soak up water with their fibres."],
        ["What has a neck but no head?","Bottle",["Cat","Human","Owl"],"You can drink from it.","A bottle has a neck.","Bottles are made of glass or plastic."],
        ["What has teeth but cannot bite?","Comb",["Shark","Dog","Lion"],"You use it for your hair.","A comb has teeth but no mouth.","Combs have existed for thousands of years."],
        ["What goes up but never comes down?","Your age",["A lift","A ball","A bird"],"Every year it gets bigger.","Your age increases as you get older.","On your birthday another year is added."],
        ["What has hands but no arms?","Clock",["Robot","Human","Monkey"],"The hands point at something.","An analogue clock has hands.","The hands show hours, minutes and sometimes seconds."],
        ["What can you break without touching it?","A promise",["A stone","A glass","A branch"],"It is about trust.","You can break a promise without touching anything.","Riddles often use double meanings."],
        ["What has one eye but cannot see?","Needle",["Owl","Human","Camera"],"Thread goes through the eye.","A needle has an eye for the thread.","The eye is usually at one end."],
        ["What gets bigger the more you take away?","A hole",["A mountain","A box","A book"],"Think of digging.","The more you take out of a hole, the bigger it gets.","This is a classic logic riddle."],
        ["What runs but has no legs?","Water",["Dog","Human","Horse"],"It flows through rivers.","Water can run without legs.","Language riddles play with several meanings."]
      ],
      verborgen_schatten: [
        ["What do you use to open a locked treasure chest?","Key",["Feather","Map","Magnifying glass"],"It fits into a lock.","With the right key you open the lock.","Locks have existed for thousands of years."],
        ["What is often on a treasure map?","An X for the spot",["A traffic light","A barcode","A thermometer"],"X marks the spot.","An X is often used to mark the treasure spot.","This is best known from pirate stories."],
        ["What do you use a compass for on a treasure hunt?","To find direction",["To weigh gold","To make rain","To dig holes"],"The needle helps you find north.","A compass helps with navigation.","A traditional compass responds to the magnetic field of the Earth."],
        ["What is a hidden compartment?","A secret space inside an object",["An open square","A cloud","A map legend"],"You do not see it straight away.","A hidden compartment can keep things out of sight.","Old furniture sometimes had secret compartments."],
        ["What is a clue?","Information that brings you closer to the solution",["Always a final answer","A mistake","A decoration"],"A detective looks for them.","Clues help solve a mystery.","A good clue gives information without giving everything away."],
        ["Why do you sometimes number your clues?","To keep them in order",["To make them heavier","To hide them","To change colours"],"That way you lose track less easily.","Numbering helps with sorting.","Detectives order evidence to see connections."],
        ["Which place makes sense for hidden treasure in a story?","Under a marked stone",["In the middle of a busy table","On a road sign","In a cloud"],"It has to be out of sight.","In stories treasure is often hidden in secret places.","Treasure stories often use recognisable symbols."],
        ["What is a code?","A system to show information in hidden form",["A kind of fruit","A musical instrument","A cloud"],"You have to decipher it.","A code can hide information.","Cryptography is the science of secret communication."],
        ["What does deciphering mean?","Making a code understandable",["Burying something","Burning a map","Forging a key"],"You look for the meaning behind the signs.","Deciphering is reading coded information.","Some codes use numbers or symbols."],
        ["Why would a treasure map have a legend?","To explain the symbols",["To make the map heavier","To make sound","To make it waterproof"],"A legend tells you what the signs mean.","Map legends explain symbols.","Ordinary maps use legends too."]
      ],
      natuurmysteries: [
        ["Why does a caterpillar turn into a butterfly?","Through metamorphosis",["Through magnetism","Through lightning","Through frost"],"The animal changes through different life stages.","Butterflies go through metamorphosis.","From egg it goes via caterpillar and pupa to butterfly."],
        ["Why do we sometimes see a rainbow?","Light is bent and split in water droplets",["The clouds colour themselves","The sun blinks","The moon paints it"],"Sunlight and rain work together.","Water droplets bend and reflect light.","A rainbow appears opposite the sun."],
        ["Why does a firefly light up?","Through bioluminescence",["Through a battery","By storing sunlight","Through magnets"],"It makes light inside its own body.","Bioluminescence is light from a chemical reaction.","Some sea creatures can make their own light too."],
        ["Why are flamingos pink?","Because of pigments in their food",["Because they are born painted","From sunlight alone","From cold water"],"Their diet contains pigments.","Carotenoids in their food colour the feathers pink.","Young flamingos are much greyer."],
        ["Why do young sunflower buds often turn with the sun?","Through heliotropism",["Through wind force","Through magnetism","Through rain"],"They respond to light.","Young sunflowers can follow the sun.","Mature flowers usually face more towards the east."],
        ["Why do some animals have camouflage?","To stand out less",["To grow faster","To sing louder","To make more heat"],"Colour and pattern match the surroundings.","Camouflage helps with hunting or hiding.","Cuttlefish can change their appearance very quickly."],
        ["What mainly causes the tides?","The gravity of the moon",["Wind turbines","Volcanoes","Clouds"],"The moon pulls on the ocean water.","The moon is a major cause of the tides.","The sun affects the tides as well."],
        ["Why are snowflakes often six-sided?","Because of the way water molecules form crystals",["Because of wind turbines","Because of birds","Because of sand"],"Ice forms a fixed crystal pattern.","The molecular structure of ice often leads to six-fold symmetry.","No two large snowflakes are exactly alike."],
        ["Why is the sky usually blue during the day?","Blue light is scattered more strongly",["Because the ocean paints the sky","Because of trees","Because of clouds alone"],"Sunlight contains several colours.","The atmosphere scatters short-wave blue light strongly.","At sunset we see more red and orange."],
        ["Why can geckos walk up walls?","Millions of tiny hairs on their toes",["Suction cups with glue","Magnets","Electricity"],"Their toes make a huge amount of contact with the surface.","Microscopic structures give a great deal of grip.","The forces are called van der Waals forces."]
      ],
      speurtocht: [
        ["What do you use a route map for?","To follow the way",["To eat a puzzle","To measure time","To make sound"],"The map shows where you need to go.","A route map helps with navigation.","Symbols can mark important points."],
        ["What is a waypoint?","An agreed point on a route",["A secret password","A kind of animal","A coin"],"You can navigate towards it.","Waypoints mark locations on a route.","GPS devices often use waypoints."],
        ["Which tool helps you look at small clues better?","Magnifying glass",["Hammer","Spoon","Umbrella"],"It makes details bigger.","A magnifying glass enlarges small details.","A convex lens bends light rays."],
        ["A footprint is mainly a…","Trace",["Planet","Instrument","Colour"],"A detective looks for them.","A footprint can be a trace.","Traces can tell you who has been somewhere."],
        ["Why do you look around carefully on a treasure hunt?","Clues can be hidden",["To stop time","To make rain","To grow faster"],"Not everything lies in the middle of the path.","Observing carefully is important on a search.","Good hunts combine looking, thinking and moving."],
        ["What does “turn left” mean on a route?","Turn towards the left side",["Straight on","Back home","Climb upwards"],"Think of your left hand.","Turn left means turning to the left.","Direction words are important in navigation."],
        ["What is a coordinate?","A way to give a precise location",["A kind of key","An animal track","A reward"],"Maps and GPS use them.","Coordinates describe a position.","Latitude and longitude are examples."],
        ["What do you do when two clues contradict each other?","Check them again",["Just pick one","Throw everything away","Tear up the map"],"Maybe you read something wrong.","Checking helps you find mistakes.","Good searchers verify their information."],
        ["Why is working together useful on a treasure hunt?","You can combine ideas and observations",["Because one person may do nothing","To hide clues","To stop time"],"Two pairs of eyes see more.","Working together can solve problems faster.","Teams often divide the tasks."],
        ["What is the purpose of the last clue?","To lead you to the final place",["To send you back to question 1","To make a new world","To delete the route"],"It brings you to the solution.","The last clue usually leads to the finish or the treasure.","A good hunt builds step by step towards the end."]
      ]
    },
    dieren: {
      snelle_dieren: [
        ["Which land animal is the fastest?","Cheetah",["Elephant","Panda","Hippo"],"It is a slender spotted cat.","The cheetah is the fastest land animal.","In a short sprint it can pass 90 km/h."],
        ["Which bird is the fastest swimmer?", "The penguin", ["The swan", "The duck", "The seagull"], "It cannot fly, but it swims all the better.", "A gentoo penguin reaches over thirty kilometres an hour under water.", "Its feathers overlap like roof tiles, so no water gets through."],
        ["Which bird is famous for extremely fast dives?","Peregrine falcon",["Penguin","Chicken","Ostrich"],"It hunts from the air.","The peregrine falcon is one of the fastest animals.","In a dive it can exceed 300 km/h."],
        ["Why does a fast fish have a streamlined body?","To have less resistance",["To be heavier","To sing louder","To catch more air"],"A smooth shape cuts through water more easily.","Streamlining reduces water resistance.","Dolphins have a streamlined shape too."],
        ["Which one runs faster: a horse or a tortoise?","Horse",["Tortoise","Equally fast","Neither of them"],"It has long powerful legs.","A horse is much faster than a tortoise.","Horses can reach high speeds at a gallop."],
        ["Why do gazelles have long legs?","For running and jumping fast",["To swim","To dig","To fly"],"They live on open plains.","Long legs help gazelles flee quickly.","Speed helps them escape predators."],
        ["Which shark is known as a fast swimmer?","Mako shark",["Whale shark","Seahorse","Lionfish"],"It has a streamlined body.","Mako sharks are among the fastest sharks.","They hunt fast fish."],
        ["What helps an ostrich run fast?","Strong long legs",["Wings for flying","A swim bladder","Claws for climbing"],"It cannot fly.","Ostriches are fast runners.","They can run at tens of kilometres per hour."],
        ["Why is speed useful for prey animals?","To escape",["To make trees grow","To make cold","To sleep"],"Predators try to catch them.","Speed can improve their chance of survival.","Some prey animals also use sharp turns."],
        ["Why is speed useful for predators?","To catch prey",["To water plants","To colour feathers","To build nests"],"A hunt is often very short.","Speed helps during the chase.","Not every predator uses speed; some use ambush."]
      ],
      baby_dieren: [
        ["What is a baby dog called?","Puppy",["Calf","Foal","Chick"],"The word begins with a p.","A young dog is called a puppy.","Puppies are born blind and deaf."],
        ["What is a baby cat called?","Kitten",["Foal","Lamb","Calf"],"It is a young cat.","A young cat is called a kitten.","Kittens sleep a great deal."],
        ["What is a young horse called?","Foal",["Puppy","Chick","Cub"],"It can stand up quickly.","A young horse is called a foal.","Foals try to stand soon after birth."],
        ["What is a young sheep called?","Lamb",["Calf","Puppy","Kitten"],"You often see them in spring.","A young sheep is called a lamb.","Lambs drink milk from their mother."],
        ["What is a baby cow called?","Calf",["Foal","Lamb","Chick"],"A young elephant is called this too.","A young cow is called a calf.","Calves drink milk at first."],
        ["What is a young chicken called?","Chick",["Cub","Puppy","Lamb"],"It comes out of an egg.","A young chicken is called a chick.","Chicks already peep before they hatch."],
        ["What is a young lion called?","Cub",["Foal","Calf","Kitten"],"Young wolves are called this too.","A young lion is a cub.","Lion cubs stay with the group for a long time."],
        ["What do many mammal babies drink first?","Milk",["Salt water","Petrol","Lemonade"],"Their mother makes it.","Mammals feed their young with milk.","This is an important feature of mammals."],
        ["Why do many young animals stay close to their mother?","For protection and food",["To fly faster","To climb trees","To make cold"],"They still have a lot to learn.","Parents often protect and care for their young.","How long parental care lasts varies a lot by species."],
        ["Which baby animal comes out of an egg?","Chick",["Puppy","Calf","Foal"],"Think of a chicken.","A chick comes out of an egg.","Reptiles, fish and many other animals lay eggs too."]
      ],
      waterdieren: [
        ["Which mammal lives in the sea and breathes air?","Dolphin",["Tuna","Shark","Jellyfish"],"It has to come up regularly.","Dolphins are mammals and breathe with lungs.","They use a blowhole on top of their head."],
        ["Which animal has eight arms?","Octopus",["Shark","Dolphin","Crab"],"It can hide very well.","An octopus has eight arms.","Octopuses are highly intelligent molluscs."],
        ["Which sea animal is the largest animal on Earth?","Blue whale",["Great white shark","Dolphin","Orca"],"It is an enormous whale.","The blue whale is the largest known animal.","It can grow more than 25 metres long."],
        ["How do most fish breathe?","With gills",["With lungs","Through their skin","With feathers"],"They take oxygen from the water.","Gills take up oxygen from water.","Water flows past the gill filaments."],
        ["What helps fish steer and swim?","Fins",["Wings","Legs","Hair"],"They sit on the back, the belly and the tail.","Fins help with movement and balance.","The tail fin often provides a lot of thrust."],
        ["Which animal can live both in the sea and on land?","Sea turtle",["Tuna","Jellyfish","Seahorse"],"It comes ashore to lay eggs.","Sea turtles live in the sea but lay eggs on land.","Females often return to the beach where they hatched."],
        ["What is coral actually?","A colony of small animals",["A plant","A stone","A fish"],"It forms reefs.","Corals consist of very many small polyps.","Coral reefs are important habitats."],
        ["Why do whales come to the surface?","To breathe",["To wash their gills","To sleep on the beach","To cook food"],"They are mammals.","Whales breathe air with lungs.","They breathe through blowholes."],
        ["Which animal has a hard shell and walks sideways?","Crab",["Dolphin","Jellyfish","Squid"],"You often see it on beaches.","Crabs have a hard external skeleton.","Many crabs move sideways easily."],
        ["Why is a streamlined body useful in water?","It reduces resistance",["It makes more noise","It makes the animal heavier","It warms the water"],"Animals move more smoothly through water.","Streamlining helps them swim more efficiently.","Dolphins and sharks are fine examples."]
      ],
      jungle: [
        ["Which animal often swings through the trees?","Monkey",["Elephant","Penguin","Zebra"],"It uses branches to climb.","Many monkey species live in trees.","Some monkeys use their tail as an extra grip."],
        ["Which animal has a large colourful beak?","Toucan",["Tiger","Gorilla","Crocodile"],"It is a tropical bird.","Toucans have striking beaks.","Their beak is surprisingly light."],
        ["Which large animal lives in tropical forests and eats a lot of plants?","Gorilla",["Penguin","Camel","Polar bear"],"It is a great ape.","Gorillas live in African forests.","They mostly eat plants."],
        ["Why do many jungle animals have camouflage?","To stand out less",["To sing louder","To make more rain","To grow faster"],"Patterns match leaves and shadow.","Camouflage helps animals hunt or hide.","Many jaguars have spots that mimic shadows."],
        ["Which big cat lives in the jungles of the Americas?","Jaguar",["Lion","Snow leopard","Lynx"],"It has rosettes on its coat.","Jaguars live in parts of Central and South America.","They swim remarkably well."],
        ["Why are rainforest trees so important?","They provide food and living space",["They make no oxygen","They stop all the rain","They are only decoration"],"Many animals live in different tree layers.","Rainforest trees form complex habitats.","Some animals almost never come down to the forest floor."],
        ["Which reptile can change colour?","Chameleon",["Tortoise","Crocodile","A snake"],"It also uses colour to communicate.","Chameleons can adjust their colour pattern.","Colour change helps with temperature and signals."],
        ["What is a rainforest?","A warm forest with a lot of rainfall",["A frozen desert","A grassland without trees","A sea"],"It is very rich in species.","Tropical rainforests get a great deal of rain.","They are among the most biodiverse ecosystems."],
        ["Why do howler monkeys call so loudly?","To communicate with their group",["To make rain","To push trees over","To swim"],"Their call carries far through the forest.","Howler monkeys use loud sounds to communicate.","An enlarged throat structure amplifies the call."],
        ["Which animal can catch insects with a long tongue?","Chameleon",["Elephant","Gorilla","Toucan"],"The tongue shoots forward very quickly.","Chameleons catch prey with their long tongue.","The tongue can accelerate extremely fast."]
      ]
    },
    aarde: {
      continenten_landen: [
        ["On which continent is the Netherlands?","Europe",["Africa","Asia","South America"],"Think of its neighbouring countries.","The Netherlands is in Europe.","Europe is one of the seven continents."],
        ["What is the largest continent?","Asia",["Europe","Africa","Australia"],"China and India are there.","Asia is the largest continent.","More than half the people in the world live in Asia."],
        ["On which continent is Brazil?","South America",["Africa","Europe","Asia"],"Think of the Amazon.","Brazil is in South America.","Brazil is the largest country in South America."],
        ["On which continent is most of Egypt?","Africa",["Europe","Asia","North America"],"The Nile flows through it.","Egypt lies mostly in Africa.","The Sinai Peninsula is geographically in Asia."],
        ["What is the capital of France?","Paris",["Rome","Madrid","Berlin"],"The Eiffel Tower is there.","Paris is the capital of France.","The Seine flows through Paris."],
        ["What is the capital of Italy?","Rome",["Milan","Venice","Naples"],"The Colosseum is there.","Rome is the capital of Italy.","Vatican City lies inside Rome."],
        ["Which country is shaped like a boot?","Italy",["Portugal","Norway","Poland"],"Look at southern Europe.","Italy looks like a boot.","Sicily lies close to the toe."],
        ["Which ocean lies between Europe and America?","Atlantic Ocean",["Pacific Ocean","Indian Ocean","Arctic Ocean"],"Ships cross it.","The Atlantic Ocean lies between Europe, Africa and America.","It is the second largest ocean."],
        ["Which continent is at the South Pole?","Antarctica",["Europe","Africa","Asia"],"It is covered in ice.","Antarctica lies around the South Pole.","It is the coldest continent."],
        ["Which country lies directly east of the Netherlands?","Germany",["Spain","Ireland","Italy"],"It is a neighbouring country.","Germany borders the Netherlands.","The Netherlands also borders Belgium."]
      ],
      weer_klimaat: [
        ["What does a thermometer measure?","Temperature",["Wind direction","Amount of rain","Air pressure"],"Hot or cold.","A thermometer measures temperature.","We often use degrees Celsius."],
        ["What is precipitation?","Water that falls from the sky",["Wind","Sunlight","Fog"],"Rain and snow are examples.","Precipitation can be rain, snow or hail.","It forms from water in clouds."],
        ["What is wind?","Moving air",["Moving water","Warm sand","A cloud"],"You can feel it but not see it.","Wind is air that moves.","Differences in air pressure cause much of the wind."],
        ["Why does fog often form?","Water vapour condenses close to the ground",["Because of stars","Because of sand","Because of magnets"],"Visibility gets worse.","Fog is made of tiny water droplets in the air.","Fog is really a cloud at ground level."],
        ["What is climate?","The average weather over a long time",["The weather today","A thunderstorm","A rain gauge"],"It is about years, not one day.","Climate describes typical weather over a long period.","Weather can change a lot from day to day."],
        ["What causes lightning?","An electrical discharge",["A falling star","An aeroplane","A rainbow"],"It often happens with thunderclouds.","Lightning is an enormous electrical discharge.","The air around it becomes extremely hot."],
        ["Why do you hear thunder after lightning?","Light travels faster than sound",["Thunder starts later","Clouds wait","The sun blocks sound"],"You see the flash first.","Light reaches you much faster than sound.","The time gap helps you estimate the distance to a storm."],
        ["Which cloud often goes with heavy showers and thunder?","Cumulonimbus",["Cirrus","Fog","No cloud"],"It can grow very tall.","Cumulonimbus clouds can bring thunderstorms.","They often have an anvil shape at the top."],
        ["What is a heatwave?","A period of unusually warm weather",["A sudden snow shower","An earthquake","A high wave at sea"],"It lasts several days.","A heatwave is a long spell of very warm weather.","Definitions differ from country to country."],
        ["What is frost?","A temperature below freezing",["Strong wind","Very heavy rain","Thick fog"],"Water can freeze then.","In frost the temperature drops to around or below 0 °C.","Hoar frost can form when water vapour freezes."]
      ],
      oceanen_natuur: [
        ["What covers most of the Earth?","Water",["Desert","Forest","Ice"],"Oceans take up an enormous amount of space.","About 71% of the Earth is covered by water.","Most of that water is salty sea water."],
        ["Which ocean is the largest?","Pacific Ocean",["Atlantic Ocean","Indian Ocean","Arctic Ocean"],"It lies between Asia and America.","The Pacific is the largest ocean.","It covers about a third of the surface of the Earth."],
        ["What is melted rock that comes out of a volcano called?","Lava",["Magma","Clay","Sand"],"Outside the Earth we call it this.","At the surface melted rock is called lava.","Underground we call it magma."],
        ["What is an island?","Land completely surrounded by water",["A high cloud","A river","A desert"],"You have to cross water to get there.","An island is surrounded by water on all sides.","Greenland is the largest island that is not a continent."],
        ["What is a mountain range?","A series of mountains",["A wide river","A sea","A group of islands"],"The Alps are one.","A mountain range is made of connected mountains.","The Himalayas contain the highest mountains on Earth."],
        ["What is a river mouth?","The place where a river ends",["The source of a river","A mountain top","A desert"],"The river often flows into a sea or a lake.","A river mouth is the end of a river.","Some rivers form a delta at the mouth."],
        ["What is a desert?","An area with very little precipitation",["Always a hot beach","A tropical rainforest","An ocean"],"Not all deserts are hot.","Deserts get very little precipitation.","Antarctica is technically a desert too."],
        ["What is a glacier?","A slowly moving mass of ice",["A cloud","A river of lava","A sand dune"],"It forms from compressed snow.","Glaciers move slowly under their own weight.","They shape valleys and landscapes."],
        ["What is erosion?","The wearing away and moving of rock and soil",["Trees growing","Stars forming","Air freezing"],"Water and wind can cause it.","Erosion changes landscapes.","Rivers can carve out deep valleys."],
        ["What is a delta?","An area where a river splits at its mouth",["A mountain top","An ocean current","A cloud"],"It can hold fertile soil.","A river delta forms from deposited sediment.","The Nile delta is a well-known example."]
      ],
      kaarten_navigatie: [
        ["What does a compass rose show?","Directions",["Temperature","Height","Time zones"],"North, east, south and west.","A compass rose shows directions.","Maps often use N, E, S and W."],
        ["What is a legend on a map for?","To explain the symbols",["To decorate the map","To measure distance","To make wind"],"Colours and signs get a meaning.","A legend explains the symbols on a map.","A blue line can represent a river, for example."],
        ["What is scale on a map?","The ratio between map distance and real distance",["A musical instrument","A temperature gauge","A colour code"],"1 cm can mean 1 km, for example.","Scale makes distances on maps understandable.","A large scale usually shows more detail."],
        ["What are coordinates?","Numbers or values that give a location",["A kind of cloud","A coin","A river"],"GPS uses them.","Coordinates describe a position.","Latitude and longitude are well-known coordinates."],
        ["Which direction is opposite north?","South",["East","West","North-east"],"Think of the compass rose.","South is opposite north.","East and west are at right angles to north and south."],
        ["Which direction is on your right when you face north?","East",["West","South","North"],"On many maps north is at the top.","With north at the top, east is on the right.","That is why west is on the left on such a map."],
        ["What is a topographic map?","A map with terrain and height information",["A star chart","A menu","A timeline"],"It can have contour lines.","Topographic maps show landscape and height.","Hikers often use them."],
        ["What is GPS?","A satellite system for finding position",["A type of cloud","A volcano","A compass without satellites"],"Your phone can use it.","GPS uses satellite signals to work out your position.","Several satellites are needed for an accurate position."],
        ["Why is north often at the top of maps?","It is a widely used convention",["Because north is higher up","Because the sun is always there","Because rivers flow that way"],"It is a convention, not a law of nature.","Many modern maps put north at the top.","Historical maps sometimes used other orientations."],
        ["What is a route?","A planned way from start to destination",["A rain cloud","A mountain","A national border"],"Navigation helps you follow it.","A route describes how you get from A to B.","Digital maps can calculate routes automatically."]
      ]
    }
  };

  window.KWIZILLO_QUESTIONS_EN = window.KWIZILLO_BUILD_BANK(defs, window.KWIZILLO_EXTRA_EN||{}, window.KWIZILLO_MORE_EN||{});
})();
