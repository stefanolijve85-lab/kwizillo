(() => {
  // Brazilian Portuguese bank. Same worlds, topics, order and therefore the same
  // question IDs as the Dutch and English banks, so progress, cards and the
  // per-question illustrations survive a language switch.
  const defs = {
    ruimte: {
      zonnestelsel: [
        ["Qual planeta fica mais perto do Sol?","Mercúrio",["Vênus","Marte","Terra"],"É o menor planeta e fica bem na frente.","Mercúrio é o planeta mais próximo do Sol.","Um ano em Mercúrio dura só 88 dias terrestres."],
        ["Qual planeta é o nosso lar?","Terra",["Vênus","Marte","Júpiter"],"Pessoas, animais e plantas vivem aqui.","Nós vivemos na Terra.","Cerca de 71% da Terra é coberta por água."],
        ["Qual planeta é conhecido como o planeta vermelho?","Marte",["Vênus","Saturno","Netuno"],"Seu solo tem muito óxido de ferro.","Marte é chamado de planeta vermelho.","Marte tem duas luas pequenas: Fobos e Deimos."],
        ["Qual planeta tem os anéis mais famosos?","Saturno",["Terra","Mercúrio","Marte"],"É um grande gigante gasoso.","Saturno tem um sistema de anéis impressionante.","Os anéis são feitos principalmente de gelo e rocha."],
        ["Qual é o maior planeta do nosso sistema solar?","Júpiter",["Marte","Vênus","Terra"],"Ele tem a famosa Grande Mancha Vermelha.","Júpiter é o maior planeta.","Mais de mil Terras caberiam dentro de Júpiter."],
        ["Qual planeta fica mais longe do Sol?","Netuno",["Júpiter","Terra","Vênus"],"É um gigante de gelo azul e distante.","Netuno é o planeta mais distante do Sol.","Um ano em Netuno dura cerca de 165 anos terrestres."],
        ["Qual planeta fica entre Vênus e Marte?","Terra",["Mercúrio","Júpiter","Saturno"],"É o nosso próprio planeta.","A ordem é Vênus, Terra, Marte.","A Terra é o terceiro planeta a partir do Sol."],
        ["O que gira em volta da Terra?","A Lua",["Júpiter","O Sol","Marte"],"Você a vê muitas vezes no céu à noite.","A Lua gira em volta da Terra.","A Lua leva cerca de 27 dias para dar uma volta."],
        ["Quantos planetas tem o nosso sistema solar?","8",["7","9","10"],"Hoje Plutão conta como planeta anão.","Nosso sistema solar tem oito planetas.","Desde 2006 Plutão é classificado como planeta anão."],
        ["Qual planeta é famoso pela forte cor azul?","Netuno",["Mercúrio","Marte","Vênus"],"É um gigante de gelo distante.","Netuno parece azul profundo.","O metano na atmosfera dele reforça a cor azul."]
      ],
      sterren_planeten: [
        ["O que é o Sol?","Uma estrela",["Um planeta","Uma lua","Um cometa"],"Ele faz sua própria luz e calor.","O Sol é uma estrela.","A luz do Sol leva cerca de 8 minutos para chegar à Terra."],
        ["Do que uma estrela é feita principalmente?","Gás quente e plasma",["Rocha fria","Uma lua","Uma nuvem"],"As estrelas emitem sua própria luz.","As estrelas são feitas de gás e plasma muito quentes.","Nosso Sol é uma estrela de tamanho médio."],
        ["O que é uma galáxia?","Um grupo enorme de estrelas",["Um planeta","Um telescópio","Uma nuvem na Terra"],"A Via Láctea é uma.","Uma galáxia contém muitíssimas estrelas.","A Via Láctea tem centenas de bilhões de estrelas."],
        ["Como se chama a nossa galáxia?","Via Láctea",["Andrômeda","Órion","Saturno"],"Às vezes você vê uma faixa clara no céu escuro.","Nosso sistema solar fica dentro da Via Láctea.","A Via Láctea é uma galáxia espiral."],
        ["O que é uma supernova?","Uma explosão gigante de estrela",["Uma lua nova","O lançamento de um foguete","Uma chuva"],"Acontece no fim da vida de algumas estrelas.","Uma supernova é uma explosão enorme de uma estrela.","Essa explosão pode ficar extremamente brilhante por um tempo."],
        ["Qual cor as estrelas mais quentes costumam ter?","Azul",["Vermelha","Marrom","Verde"],"Pensa na chama mais quente de um fogão a gás.","Estrelas muito quentes costumam parecer azuladas.","Estrelas vermelhas geralmente são mais frias que as azuis."],
        ["O que é um exoplaneta?","Um planeta em volta de outra estrela",["Uma lua da Terra","Um cometa","Um satélite"],"Ele não gira em volta do nosso Sol.","Um exoplaneta orbita uma estrela que não é o Sol.","Milhares de exoplanetas já foram encontrados."],
        ["O que é um buraco negro?","Uma região com gravidade extremamente forte",["Um planeta escuro","Uma nuvem","Um motor de foguete"],"Nem a luz consegue escapar dele com facilidade.","Um buraco negro tem gravidade extremamente forte.","Muitos buracos negros se formam a partir de estrelas gigantes."],
        ["Qual estrela fica mais perto da Terra?","O Sol",["Sirius","Estrela Polar","Betelgeuse"],"Você a vê todo dia.","O Sol é a nossa estrela mais próxima.","A próxima estrela mais perto fica muito mais longe."],
        ["Por que as estrelas parecem piscar?","Por causa da atmosfera",["Porque elas piscam","Por causa das luas delas","Porque elas giram"],"A luz delas se curva nas camadas de ar pelo caminho.","A atmosfera faz a luz das estrelas tremular um pouco.","Os planetas costumam piscar menos que as estrelas."]
      ],
      astronauten: [
        ["Como se chama quem viaja para o espaço?","Astronauta",["Arqueólogo","Mergulhador","Capitão"],"Essa pessoa costuma usar um traje espacial.","Um astronauta viaja e trabalha no espaço.","Astronautas treinam por anos."],
        ["Por que os astronautas usam traje espacial fora da nave?","Para ter ar e proteção",["Para se aquecer","Para ir mais rápido","Como uniforme"],"No espaço não dá para simplesmente respirar.","O traje espacial fornece oxigênio e proteção.","O traje também protege contra temperaturas extremas."],
        ["O que os astronautas costumam sentir numa estação espacial?","Ausência de peso",["Chuva forte","Vento forte","Terremotos"],"Eles parecem flutuar.","Em órbita os astronautas vivem a microgravidade.","Tudo precisa ficar preso para não flutuar."],
        ["Onde os astronautas costumam dormir na estação espacial?","Em sacos de dormir presos",["Em camas normais","Em redes do lado de fora","No chão"],"Senão eles flutuariam.","Astronautas dormem em sacos de dormir presos.","Na microgravidade não existe um em cima ou embaixo de verdade."],
        ["Por que os astronautas treinam embaixo d'água?","Para imitar a ausência de peso",["Para nadar mais rápido","Para procurar água na Lua","Para relaxar"],"Embaixo d'água dá para treinar movimentos flutuando.","O treino na água ajuda a ensaiar caminhadas espaciais.","Piscinas enormes guardam modelos de partes da estação."],
        ["O que é uma caminhada espacial?","Trabalho fora de uma nave",["Andar na Terra","Correr dentro do foguete","Passear num museu"],"O astronauta fica preso com sistemas de segurança.","Uma caminhada espacial também se chama EVA.","Os astronautas usam o traje completo para isso."],
        ["O que acontece com os músculos em longos períodos sem peso?","Eles podem ficar mais fracos",["Viram aço","Somem na hora","Crescem sempre mais rápido"],"Por isso os astronautas se exercitam muito.","Sem treino, músculos e ossos podem enfraquecer.","Na ISS os astronautas treinam todos os dias."],
        ["O que os astronautas comem no espaço?","Comida em embalagens especiais",["Comprimidos","Sorvete","Nada"],"Precisa ser segura na microgravidade.","Astronautas comem comida embalada de forma especial.","Migalhas são um problema porque flutuam."],
        ["O que é a ISS?","Uma estação espacial internacional",["Um planeta","Um motor de foguete","Uma base na Lua"],"Ela gira em volta da Terra.","A ISS é uma grande estação espacial em órbita da Terra.","Astronautas de vários países trabalham juntos lá."],
        ["Por que um astronauta precisa ficar preso enquanto trabalha?","Para não flutuar para longe",["Para ter mais gravidade","Contra a chuva","Para ir mais rápido"],"Na microgravidade você continua se movendo com facilidade.","Um cabo impede que alguém saia flutuando sem controle.","As ferramentas também ficam presas."]
      ],
      raket_avontuur: [
        ["Para que serve o motor de um foguete?","Para criar empuxo",["Para imprimir fotos","Para fazer oxigênio","Para contar estrelas"],"Ele empurra gases quentes para trás.","O motor do foguete produz empuxo.","Por ação e reação, o foguete vai para o outro lado."],
        ["Por que um foguete precisa de tanto combustível?","Para escapar da gravidade",["Para a iluminação","Para o ar-condicionado","Para o rádio"],"Decolar exige uma quantidade enorme de energia.","Um lançamento precisa de muitíssima energia.","Na decolagem, a maior parte do foguete pode ser combustível."],
        ["O que acontece na decolagem?","O foguete sobe",["O foguete pousa","O motor sempre para","A Lua chega mais perto"],"É o momento da partida.","A decolagem é o momento em que o foguete deixa o chão.","Os primeiros segundos são tecnicamente muito importantes."],
        ["Por que alguns foguetes têm vários estágios?","Para soltar as partes vazias",["Para ter mais janelas","Para ter lugar de dormir","Pelas cores"],"Assim o foguete carrega menos massa.","Foguetes soltam estágios quando o combustível acaba.","Isso torna a aceleração mais eficiente."],
        ["O que é uma plataforma de lançamento?","O lugar de onde o foguete parte",["Um satélite","Um jipe lunar","Um assento de cabine"],"O foguete fica ali antes da partida.","A plataforma sustenta o foguete antes do voo.","Há sistemas enormes de combustível, refrigeração e segurança."],
        ["O que é um satélite?","Um objeto que gira em volta de outro objeto",["Uma explosão de estrela","Um motor de foguete","Um telescópio"],"Tecnicamente a Lua também é um satélite natural.","Satélites viajam em órbita de um planeta ou outro corpo.","Satélites artificiais ajudam na navegação e na comunicação."],
        ["Por que o bico do foguete é aerodinâmico?","Para reduzir a resistência do ar",["Para ser mais pesado","Para pegar mais chuva","Pela cor"],"Uma forma lisa passa pelo ar com mais facilidade.","Uma forma aerodinâmica reduz o arrasto.","Fora da atmosfera quase não há resistência do ar."],
        ["O que é uma cápsula?","Uma parte onde pessoas ou carga viajam",["Uma galáxia","Uma lua","Um combustível"],"Ela costuma ficar no topo do foguete.","Uma cápsula espacial leva pessoas ou carga.","Algumas cápsulas voltam com paraquedas."],
        ["O que ajuda uma cápsula a pousar com segurança?","Paraquedas",["Estrelas","Erupções solares","Asteroides"],"Eles diminuem a velocidade da descida.","Paraquedas freiam a cápsula que está voltando.","Alguns veículos também pousam usando motores."],
        ["O que é uma órbita em volta da Terra?","Um caminho em que você continua caindo ao redor da Terra",["Uma estrada reta até o Sol","Um túnel","Uma nuvem"],"Velocidade e gravidade ficam em equilíbrio.","Um satélite em órbita fica caindo ao redor da Terra.","Por isso ele não cai direto no chão."]
      ]
    },
    geschiedenis: {
      egyptenaren: [
        ["Para que muitas pirâmides foram construídas?","Como túmulos",["Como escolas","Como mercados","Como portos"],"Pense nos faraós e no enterro deles.","Muitas pirâmides eram túmulos de faraós.","A Grande Pirâmide de Gizé tem milhares de anos."],
        ["Como se chamava um governante do Egito antigo?","Faraó",["Senador","Cavaleiro","Viking"],"Ele ficava no topo da sociedade.","Um governante egípcio era chamado de faraó.","Alguns faraós eram vistos como divinos."],
        ["Qual rio era muito importante para o Egito?","O Nilo",["O Reno","O Amazonas","O Danúbio"],"Ele corta o país e deixa o solo fértil.","O Nilo era essencial para a agricultura e o transporte.","As cheias anuais traziam lodo fértil."],
        ["Como se chama a escrita egípcia com sinais e desenhos?","Hieróglifos",["Latim","Runas","Código Morse"],"Você a vê em templos e túmulos.","Os hieróglifos eram uma escrita egípcia importante.","A escrita usava centenas de sinais."],
        ["O que é uma múmia?","Um corpo conservado",["Uma moeda de ouro","Um templo","Um barco"],"O corpo recebia um tratamento especial depois da morte.","Os egípcios faziam múmias para conservar os corpos.","O processo podia levar muitas semanas."],
        ["Em que os egípcios costumavam escrever?","Papiro",["Plástico","Concreto","Alumínio"],"Era feito de uma planta das margens do Nilo.","O papiro era usado como material de escrita.","A palavra papel vem de papiro."],
        ["O que era a Esfinge de Gizé?","Uma estátua com corpo de leão e cabeça humana",["Uma pirâmide","Um navio","Uma coroa"],"Ela fica perto das pirâmides.","A Grande Esfinge é uma estátua enorme de pedra.","A Esfinge foi esculpida em calcário."],
        ["Para que os egípcios usavam a irrigação?","Para molhar as plantações",["Para pintar pirâmides","Para escrever","Para fazer moedas"],"A água do Nilo precisava chegar aos campos.","A irrigação ajudava na agricultura.","Canais e tanques espalhavam a água pelos campos."],
        ["Quais animais eram vistos como especiais no Egito?","Gatos",["Ursos-polares","Pinguins","Cangurus"],"Eles aparecem muito na arte e na religião.","Os gatos tinham um lugar especial no Egito antigo.","A deusa Bastet era representada como uma gata."],
        ["O que os escribas faziam no Egito antigo?","Cuidavam de textos e registros",["Faziam pirâmides voar","Treinavam cavaleiros","Faziam estrelas"],"Escrever era uma habilidade importante.","Os escribas mantinham registros e controlavam impostos.","Nem todo mundo sabia ler e escrever."]
      ],
      ridders_kastelen: [
        ["O que um cavaleiro costumava usar para se proteger?","Uma armadura",["Um traje espacial","Um roupão","Uma roupa de mergulho"],"Era feita de metal.","A armadura protegia o corpo.","Uma armadura completa tinha muitas peças."],
        ["Onde um senhor poderoso costumava morar?","Em um castelo",["Em um foguete","Em uma pirâmide","Em um iglu"],"O prédio tinha paredes grossas.","Castelos eram moradias e lugares de defesa.","Muitos castelos tinham torres e muralhas."],
        ["O que é um fosso?","Uma vala com água em volta de um castelo",["Um quarto","Uma praça de mercado","Um depósito de armas"],"Ele dificultava os ataques.","O fosso ajudava a defender o castelo.","Nem todo fosso tinha água o tempo todo."],
        ["O que é uma ponte levadiça?","Uma ponte que pode ser levantada",["Uma escada secreta","Uma bandeira","Uma torre"],"Ficava geralmente na entrada.","A ponte levadiça podia fechar a entrada.","Costumava ser combinada com um portão."],
        ["O que acontecia em um torneio de cavaleiros?","Cavaleiros participavam de competições",["Pessoas construíam pirâmides","Pessoas navegavam até a América","Pessoas faziam telescópios"],"Pense nas justas.","Torneios eram competições para cavaleiros.","A justa era um evento espetacular."],
        ["O que é um escudo?","Proteção contra ataques",["Um instrumento musical","Um mapa","Um copo"],"Os cavaleiros o levavam em um braço.","Um escudo protege contra armas.","Os escudos costumavam ter símbolos ou brasões."],
        ["Quem geralmente não morava sempre em um castelo medieval?","Todos os camponeses da região",["O senhor do castelo","Soldados","Criados"],"Muita gente morava em vilarejos em volta do castelo.","A maioria dos camponeses morava fora do castelo.","Em tempos de perigo as pessoas podiam se abrigar lá."],
        ["Por que os castelos tinham paredes grossas?","Para defesa",["Para internet mais rápida","Para aquecer","Para enfeitar"],"Elas precisavam aguentar ataques.","Paredes grossas de pedra deixavam os castelos mais fortes.","Depois, os canhões tornaram muitas muralhas bem menos eficazes."],
        ["O que um escudeiro costumava fazer?","Ajudar um cavaleiro e aprender",["Enterrar um faraó","Pilotar um foguete","Construir um templo"],"Às vezes ele se preparava para virar cavaleiro.","Um escudeiro ajudava o cavaleiro e aprendia habilidades.","Nem todo escudeiro virava cavaleiro."],
        ["O que era uma fortaleza?","Um lugar fortificado para morar",["Uma galáxia","Um navio","Uma matéria da escola"],"A palavra é usada para castelos.","Uma fortaleza era um lugar fortificado.","As fortalezas costumavam ficar em pontos estratégicos."]
      ],
      romeinen: [
        ["Quem construiu o Coliseu?","Os romanos",["Os vikings","Os maias","Os egípcios"],"Ele fica em Roma.","O Coliseu foi construído pelos romanos.","Ele podia receber dezenas de milhares de espectadores."],
        ["O que era um aqueduto?","Uma construção para transportar água",["Um elmo de cavaleiro","Um templo para barcos","Uma moeda"],"Ele levava água até as cidades.","Os aquedutos romanos levavam água por longas distâncias.","Alguns aquedutos ainda podem ser vistos hoje."],
        ["Qual língua muitos romanos falavam?","Latim",["Holandês","Japonês","Árabe"],"Muitas palavras europeias vêm dela.","O latim era uma língua importante no Império Romano.","Francês, espanhol, italiano e português são línguas românicas."],
        ["O que era uma legião?","Um grande grupo de soldados romanos",["Um mercado","Uma casa de banhos","Um navio"],"Fazia parte do exército.","Uma legião era uma grande unidade do exército.","Os soldados romanos treinavam com rigor."],
        ["O que era o fórum em uma cidade romana?","Uma praça central",["Uma prisão","Uma fazenda","Um porto"],"As pessoas iam lá para comércio e governo.","O fórum era um centro importante da cidade.","Templos e prédios públicos ficavam ali."],
        ["Para que serviam as casas de banho romanas?","Para se lavar e se encontrar",["Para construir foguetes","Para guardar grãos","Para treinar cavalos"],"As pessoas também se reuniam ali.","As termas eram lugares importantes de encontro.","Algumas tinham banhos quentes e frios."],
        ["O que um soldado romano costumava usar?","Elmo e escudo",["Traje espacial","Chapéu de caubói","Roupa de mergulho"],"Ele precisava se proteger na batalha.","Soldados romanos usavam elmos, escudos e armas.","O equipamento mudou ao longo dos séculos."],
        ["O que significa “Império Romano”?","Uma grande área governada a partir de Roma",["A cidade de Roma","Uma pirâmide","Uma ordem de cavaleiros"],"Ele se estendia por grande parte da Europa.","O Império Romano era muito extenso.","No auge, cobria terras em volta do Mediterrâneo."],
        ["O que os romanos usavam para longas distâncias por terra?","Uma grande rede de estradas",["Rios","Balões de ar quente","Trens"],"Muitas estradas eram bem construídas.","Os romanos construíram uma grande rede de estradas.","Algumas estradas modernas seguem rotas romanas antigas."],
        ["O que era um senador em Roma?","Um funcionário importante",["Um gladiador","Um faraó","Um cavaleiro"],"Ele tinha um papel político.","Os senadores tinham influência no governo.","O Senado romano durou séculos."]
      ],
      ontdekkingsreizigers: [
        ["O que um explorador fazia?","Explorava novas regiões",["Construía planetas","Inventava a eletricidade","Vigiava pirâmides"],"Pense em viagens longas.","Exploradores viajavam para regiões desconhecidas.","As viagens deles mudaram os mapas e o comércio."],
        ["Para que os navegadores usavam a bússola?","Para encontrar a direção",["Para cozinhar","Para escrever","Para medir a profundidade"],"A agulha aponta mais ou menos para o norte.","A bússola ajuda na navegação.","Ela deixou as longas viagens marítimas mais confiáveis."],
        ["O que é uma carta náutica?","Um mapa para navegar no mar",["Uma pintura","Um brasão de cavaleiro","Uma constelação"],"Os navios a usavam para planejar rotas.","Cartas náuticas mostram costas, perigos e rotas.","Navios modernos costumam usar cartas digitais."],
        ["Por que as estrelas eram úteis para os navegadores?","Para ajudar a descobrir a posição",["Para atrair peixes","Para fazer vento","Para esquentar água"],"À noite, principalmente, elas davam a direção.","As estrelas podiam ajudar na navegação.","A Estrela Polar era importante no hemisfério norte."],
        ["O que era uma caravela?","Um tipo de navio a vela",["Uma terma romana","Um castelo","Um templo"],"Era usada em longas viagens.","As caravelas eram navios a vela ágeis.","Elas fizeram parte das viagens de descobrimento europeias."],
        ["Por que os exploradores levavam mantimentos?","Porque as viagens podiam durar muito",["Porque havia lojas no mar","Para enfeitar","Para construir estrelas"],"No mar não dava para simplesmente fazer compras.","Comida e água eram cruciais nas viagens longas.","Falta de comida e doenças eram riscos sérios."],
        ["O que é navegação?","Descobrir onde você está e para onde vai",["Pintar um navio","Aprender uma língua","Construir um mercado"],"Bússola e cartas ajudam nisso.","Navegação é planejar e seguir uma rota.","O GPS é uma forma moderna de navegação."],
        ["Qual era um grande perigo nas longas viagens marítimas?","Tempestades e doenças",["Semáforos","Neve no deserto","Satélites"],"As viagens às vezes levavam meses.","Tempestades, doenças e falta de comida eram perigosas.","O escorbuto vinha da falta prolongada de vitamina C."],
        ["Por que se buscavam novas rotas para a Ásia?","Para o comércio de produtos valiosos",["Para esquiar","Para dinossauros","Para viagens espaciais"],"As especiarias valiam muito.","O comércio motivou muitas viagens de descobrimento.","Especiarias podiam ser caríssimas na Europa."],
        ["O que os cartógrafos faziam depois de novas viagens?","Melhoravam seus mapas",["Erguiam pirâmides","Moviam estrelas","Mudavam o tempo"],"Novos conhecimentos eram acrescentados.","Relatos de viagem ajudaram a tornar os mapas mais precisos.","Os mapas ficaram mais detalhados ao longo dos séculos."]
      ]
    },
    wetenschap: {
      slimme_proefjes: [
        ["O que costuma acontecer quando você mistura bicarbonato e vinagre?","Aparecem bolhas de gás",["Congela na hora","Vira metal","Não acontece nada"],"Você vê muita espuma.","A reação produz gás carbônico, entre outras coisas.","Esse gás pode encher um balão, por exemplo."],
        ["Por que você usa óculos de proteção em alguns experimentos?","Para proteger os olhos",["Para ouvir melhor","Para correr mais rápido","Pela cor"],"Algumas substâncias podem respingar.","Os óculos de proteção protegem seus olhos.","Trabalhar com segurança é parte importante da ciência."],
        ["O que é uma hipótese?","Uma expectativa que pode ser testada",["Um fato comprovado","Um instrumento de medida","Um líquido"],"Você decide o que espera antes de testar.","Uma hipótese é uma previsão que você pode investigar.","Depois do experimento, a hipótese pode ou não ser confirmada."],
        ["Em um experimento justo, o que você deve manter o mais igual possível?","As outras condições",["O resultado","A pergunta","Seu nome"],"Você quer mudar só uma coisa de cada vez.","Controlar as variáveis torna o experimento mais justo.","Assim você sabe melhor o que causou o efeito."],
        ["O que você usa para medir o volume de um líquido com precisão?","Uma proveta",["Uma lupa","Uma bússola","Um cronômetro"],"Ela tem marcas na lateral.","A proveta mede volume.","O volume costuma ser medido em mililitros."],
        ["O que um termômetro faz em um experimento?","Mede a temperatura",["Mede o tempo","Mede o peso","Faz luz"],"Com ele você mede quente ou frio.","O termômetro mede a temperatura.","Aqui costumamos usar graus Celsius."],
        ["Por que você anota os resultados de um experimento?","Para poder compará-los",["Para esquecê-los","Para limpar o vidro","Para enfeitar"],"Os cientistas registram suas medições.","Registrar resultados ajuda na análise e na repetição.","A boa ciência precisa poder ser conferida."],
        ["O que acontece com o gelo quando você o aquece?","Ele derrete",["Vira pedra","Some na hora","Fica mais pesado"],"A água sólida vira líquida.","O gelo derrete e vira água.","Em pressão normal o gelo derrete perto de 0 °C."],
        ["O que você precisa para fazer uma sombra?","Uma fonte de luz e um objeto",["Som","Água","Vento"],"O objeto bloqueia a luz.","A sombra aparece quando a luz é bloqueada.","O tamanho dela muda com a distância da fonte de luz."],
        ["O que é dissolver, como o açúcar na água?","A substância se espalha pelo líquido",["A substância some do mundo","A substância vira fogo","O líquido congela"],"Você não vê mais os grãos separados.","As partículas dissolvidas se espalham pelo líquido.","Dá para recuperar o açúcar evaporando a água."]
      ],
      lichaam: [
        ["Qual órgão bombeia o sangue pelo corpo?","Coração",["Pulmões","Estômago","Cérebro"],"Você sente ele batendo.","O coração bombeia o sangue.","Seu coração bate cerca de cem mil vezes por dia."],
        ["Com o que você respira principalmente?","Pulmões",["Rins","Estômago","Ossos"],"Eles ficam dentro do peito.","Os pulmões captam o oxigênio.","Normalmente você tem dois pulmões."],
        ["Qual órgão ajuda você a pensar?","Cérebro",["Fígado","Coração","Intestinos"],"Fica dentro do crânio.","O cérebro processa informações e controla muitas funções do corpo.","Bilhões de células nervosas trabalham juntas ali."],
        ["O que o sangue transporta pelo corpo?","Oxigênio e nutrientes",["Ar","Ossos","Calor"],"O sangue viaja pelos vasos sanguíneos.","O sangue leva oxigênio e nutrientes, entre outras coisas.","Os glóbulos vermelhos ajudam a carregar o oxigênio."],
        ["Onde já começa a digestão da comida?","Na boca",["No pé","Nos pulmões","Na orelha"],"Você mastiga a comida em pedaços pequenos.","A digestão começa na boca.","A saliva tem substâncias que ajudam a quebrar a comida."],
        ["O que as costelas protegem?","Coração e pulmões",["Seus pés","Seus dentes","Seus dedos"],"Elas formam uma gaiola em volta do peito.","As costelas protegem órgãos importantes.","A maioria das pessoas tem 12 pares de costelas."],
        ["Além de sustentar, para que servem os ossos?","Proteção e movimento",["Cor","Sono","Temperatura"],"Os músculos puxam os ossos.","Os ossos dão sustentação e proteção e ajudam no movimento.","As células do sangue são feitas na medula óssea."],
        ["O que os músculos fazem?","Eles se contraem para criar movimento",["Fazem sangue","Digerem a comida","Veem a luz"],"Os músculos trabalham junto com os ossos.","Os músculos se contraem e assim causam movimento.","Seu corpo tem centenas de músculos."],
        ["O que é a pele?","O maior órgão do corpo",["Um osso","Um músculo","Um vaso sanguíneo"],"Ela cobre o corpo inteiro.","A pele protege o corpo.","A pele também ajuda a regular a temperatura."],
        ["Qual sentido você usa com as orelhas?","Audição",["Paladar","Olfato","Visão"],"Você capta ondas sonoras.","Com as orelhas você percebe os sons.","O ouvido interno também ajuda no equilíbrio."]
      ],
      uitvindingen: [
        ["O que você usa para olhar coisas bem pequenas?","Microscópio",["Telescópio","Bússola","Barômetro"],"Pense em células e bactérias.","O microscópio aumenta objetos pequenos.","Microscópios modernos aumentam muitíssimo."],
        ["Com o que você olha estrelas e planetas distantes?","Telescópio",["Microscópio","Termômetro","Ímã"],"Ele deixa objetos distantes mais fáceis de ver.","O telescópio capta a luz de objetos distantes.","Há telescópios na Terra e no espaço."],
        ["Qual invenção tornou a cópia de livros muito mais rápida?","A prensa de impressão",["Bússola","Apito a vapor","Lanterna"],"Textos podiam ser impressos com letras móveis.","A prensa tornou possível produzir livros em massa.","Isso ajudou o conhecimento a se espalhar mais rápido."],
        ["Para que serve uma pilha?","Guardar e fornecer energia elétrica",["Medir o vento","Ferver água sem energia","Fazer estrelas"],"Você encontra uma em muitos aparelhos.","A pilha fornece energia elétrica.","Baterias recarregáveis podem ser usadas de novo."],
        ["O que um ímã faz?","Ele pode atrair certos metais",["Sempre faz luz","Congela a água","Para o tempo"],"O ferro reage bem a ele.","Os ímãs exercem força sobre materiais magnéticos.","Um ímã tem um polo norte e um polo sul."],
        ["O que um painel solar produz?","Eletricidade a partir da luz",["Chuva a partir das nuvens","Gasolina a partir do ar","Som a partir de pedras"],"O Sol fornece a energia.","As células solares transformam luz em eletricidade.","Painéis solares não precisam de peças que se movem."],
        ["O que um motor faz?","Transforma energia em movimento",["Faz cores","Congela a água","Lê papel"],"Carros e máquinas usam motores.","Um motor converte energia em movimento.","Existem motores elétricos e a combustão."],
        ["Por que o telefone foi uma invenção importante?","As pessoas podiam falar a distância",["As pessoas podiam voar","As pessoas podiam parar o tempo","As pessoas podiam viver sem energia"],"O som era enviado a distância.","O telefone mudou muito a comunicação.","Hoje os celulares reúnem muitas funções."],
        ["O que um computador faz principalmente?","Processa informações",["Faz música","Dá luz","Purifica a água"],"Ele executa instruções.","Computadores processam dados de acordo com programas.","Até um relógio inteligente tem um computador."],
        ["Qual invenção usa ondas de rádio para descobrir a posição?","GPS",["Ímã","Microscópio","Estetoscópio"],"Satélites ajudam a descobrir onde você está.","O GPS usa sinais de satélites.","Seu celular usa GPS para navegar."]
      ],
      natuur_energie: [
        ["Qual fonte de energia usa o ar em movimento?","Energia eólica",["Energia solar","Gás natural","Energia nuclear"],"As turbinas giram por causa dele.","As turbinas eólicas transformam vento em eletricidade.","Turbinas grandes podem abastecer muitas casas."],
        ["Qual fonte de energia usa a luz do Sol?","Energia solar",["Carvão","Petróleo","Gás natural"],"Painéis captam a luz.","Painéis solares transformam luz em eletricidade.","O Sol fornece muito mais energia do que usamos no mundo."],
        ["O que é energia renovável?","Energia de fontes que se renovam sempre",["Energia que nunca é usada","Gasolina","Carvão"],"Pense no sol e no vento.","Fontes renováveis não acabam rápido.","Energia hidrelétrica e geotérmica também podem ser renováveis."],
        ["O que uma turbina eólica faz?","Transforma vento em eletricidade",["Faz chuva","Produz gasolina","Move nuvens"],"As pás giram com o vento.","Um gerador dentro da turbina produz eletricidade.","Turbinas eólicas ficam em terra e no mar."],
        ["Qual substância é liberada quando combustíveis fósseis queimam?","Gás carbônico",["Oxigênio","Ouro","Hélio"],"É um gás de efeito estufa.","Queimar petróleo, gás e carvão libera CO₂.","Mais CO₂ reforça o efeito estufa."],
        ["Por que isolamos as casas?","Para manter melhor o calor dentro ou fora",["Para deixar as janelas mais pesadas","Para fazer água","Para melhorar o wi-fi"],"Um bom isolamento economiza energia.","O isolamento reduz a perda de calor.","Telhados, paredes e pisos podem ser isolados."],
        ["O que é energia hidrelétrica?","Energia da água que corre ou cai",["Energia da areia","Energia da fumaça","Energia do plástico"],"Uma represa e um rio podem mover turbinas.","A hidrelétrica usa o movimento da água.","É uma fonte renovável importante no mundo, e muito no Brasil."],
        ["O que é economizar energia?","Usar menos energia para o mesmo resultado",["Acender mais lâmpadas","Janela aberta com aquecedor ligado","Deixar aparelhos ligados"],"Aparelhos eficientes ajudam.","Economizar energia reduz o consumo.","Lâmpadas LED gastam menos que as lâmpadas antigas."],
        ["O que a bateria de um carro elétrico faz?","Guarda energia elétrica",["Faz gasolina","Mede o vento","Esfria a água"],"Ela alimenta o motor elétrico.","A bateria guarda energia para andar.","Ao frear, às vezes parte da energia é recuperada."],
        ["Qual lâmpada costuma ser mais econômica?","Lâmpada LED",["Lâmpada incandescente","Vela","Lâmpada halógena"],"Ela usa menos eletricidade.","A iluminação LED é muito eficiente.","Lâmpadas LED também costumam durar mais."]
      ]
    },
    mysterie: {
      raadsels: [
        ["Tenho teclas, mas não sou computador nem porta. O que sou?","Piano",["Porta","Baú do tesouro","Bicicleta"],"Você usa os dedos para me tocar.","O piano tem teclas que você aperta.","Um piano pode ter mais de oitenta teclas."],
        ["Fico mais molhada enquanto seco. O que sou?","Toalha",["Guarda-chuva","Sol","Uma esponja"],"Você me usa depois do banho.","A toalha fica molhada enquanto seca você.","As toalhas absorvem água com suas fibras."],
        ["O que tem gargalo, mas não tem cabeça?","Garrafa",["Gato","Pessoa","Coruja"],"Você pode beber dela.","A garrafa tem gargalo.","Garrafas são feitas de vidro ou plástico."],
        ["O que tem dentes, mas não morde?","Pente",["Tubarão","Cachorro","Leão"],"Você usa no cabelo.","O pente tem dentes, mas não tem boca.","Pentes existem há milhares de anos."],
        ["O que sobe, mas nunca desce?","Sua idade",["Um elevador","Uma bola","Um pássaro"],"A cada ano ela fica maior.","Sua idade aumenta conforme você cresce.","No aniversário soma mais um ano."],
        ["O que tem ponteiros, mas não tem braços?","Relógio",["Robô","Pessoa","Macaco"],"Os ponteiros apontam para algo.","Um relógio analógico tem ponteiros.","Os ponteiros mostram horas, minutos e às vezes segundos."],
        ["O que você pode quebrar sem tocar?","Uma promessa",["Uma pedra","Um copo","Um galho"],"Tem a ver com confiança.","Dá para quebrar uma promessa sem tocar em nada.","Charadas costumam usar duplo sentido."],
        ["O que tem um olho, mas não enxerga?","Agulha",["Coruja","Pessoa","Câmera"],"A linha passa pelo olho.","A agulha tem um olho para a linha.","O olho fica geralmente numa das pontas."],
        ["O que fica maior quanto mais você tira?","Um buraco",["Uma montanha","Uma caixa","Um livro"],"Pense em cavar.","Quanto mais você tira de um buraco, maior ele fica.","É uma charada clássica de lógica."],
        ["O que corre, mas não tem pernas?","A água",["Cachorro","Pessoa","Cavalo"],"Ela corre pelos rios.","A água corre sem ter pernas.","Charadas de linguagem brincam com vários sentidos."]
      ],
      verborgen_schatten: [
        ["O que você usa para abrir um baú trancado?","Chave",["Pena","Mapa","Lupa"],"Ela entra na fechadura.","Com a chave certa você abre a fechadura.","Fechaduras existem há milhares de anos."],
        ["O que costuma aparecer em um mapa do tesouro?","Um X marcando o lugar",["Um semáforo","Um código de barras","Um termômetro"],"O X marca o lugar.","Um X costuma marcar o lugar do tesouro.","Isso é famoso por causa das histórias de piratas."],
        ["Para que você usa a bússola numa caça ao tesouro?","Para encontrar a direção",["Para pesar ouro","Para fazer chuva","Para cavar buracos"],"A agulha ajuda a achar o norte.","A bússola ajuda na navegação.","Uma bússola tradicional reage ao campo magnético da Terra."],
        ["O que é um compartimento secreto?","Um espaço escondido dentro de um objeto",["Uma praça aberta","Uma nuvem","A legenda de um mapa"],"Você não o vê de imediato.","Um compartimento secreto esconde coisas.","Móveis antigos às vezes tinham compartimentos secretos."],
        ["O que é uma pista?","Uma informação que te aproxima da solução",["Sempre a resposta final","Um erro","Um enfeite"],"Um detetive procura por elas.","As pistas ajudam a resolver um mistério.","Uma boa pista informa sem entregar tudo."],
        ["Por que às vezes você numera as pistas?","Para manter a ordem",["Para deixá-las mais pesadas","Para escondê-las","Para mudar as cores"],"Assim você se perde menos.","Numerar ajuda a organizar.","Detetives ordenam as provas para ver ligações."],
        ["Qual lugar faz sentido para um tesouro escondido numa história?","Embaixo de uma pedra marcada",["No meio de uma mesa cheia","Numa placa de trânsito","Numa nuvem"],"Precisa ficar fora de vista.","Nas histórias o tesouro fica em lugares secretos.","Histórias de tesouro usam símbolos reconhecíveis."],
        ["O que é um código?","Um sistema para mostrar informações de forma escondida",["Um tipo de fruta","Um instrumento musical","Uma nuvem"],"Você precisa decifrá-lo.","Um código pode esconder informações.","Criptografia é a ciência da comunicação secreta."],
        ["O que significa decifrar?","Tornar um código compreensível",["Enterrar algo","Queimar um mapa","Forjar uma chave"],"Você procura o significado por trás dos sinais.","Decifrar é ler informações codificadas.","Alguns códigos usam números ou símbolos."],
        ["Por que um mapa do tesouro teria uma legenda?","Para explicar os símbolos",["Para deixar o mapa mais pesado","Para fazer som","Para ser à prova d'água"],"A legenda diz o que os sinais significam.","A legenda do mapa explica os símbolos.","Mapas comuns também usam legendas."]
      ],
      natuurmysteries: [
        ["Por que a lagarta vira borboleta?","Por causa da metamorfose",["Por causa do magnetismo","Por causa de um raio","Por causa da geada"],"O animal muda em diferentes fases da vida.","As borboletas passam pela metamorfose.","Do ovo vai para lagarta, pupa e depois borboleta."],
        ["Por que às vezes vemos um arco-íris?","A luz se curva e se divide nas gotas de água",["As nuvens se pintam","O Sol pisca","A Lua pinta o céu"],"Luz do Sol e chuva trabalham juntas.","As gotas de água curvam e refletem a luz.","O arco-íris aparece do lado oposto ao Sol."],
        ["Por que o vaga-lume brilha?","Por bioluminescência",["Por uma pilha","Guardando luz do Sol","Por ímãs"],"Ele produz luz dentro do próprio corpo.","Bioluminescência é luz de uma reação química.","Alguns animais do mar também fazem a própria luz."],
        ["Por que os flamingos são rosa?","Por causa de pigmentos na comida",["Porque nascem pintados","Por causa do Sol","Por causa da água fria"],"A alimentação deles tem pigmentos.","Carotenoides da comida colorem as penas de rosa.","Flamingos jovens são bem mais cinzentos."],
        ["Por que os girassóis jovens costumam virar com o Sol?","Por heliotropismo",["Pela força do vento","Por magnetismo","Pela chuva"],"Eles reagem à luz.","Girassóis jovens conseguem seguir o Sol.","As flores maduras costumam ficar viradas para o leste."],
        ["Por que alguns animais têm camuflagem?","Para chamar menos atenção",["Para crescer mais rápido","Para cantar mais alto","Para fazer mais calor"],"Cor e padrão combinam com o ambiente.","A camuflagem ajuda a caçar ou a se esconder.","As sibas mudam de aparência muito rápido."],
        ["O que causa principalmente as marés?","A gravidade da Lua",["Turbinas eólicas","Os vulcões","As nuvens"],"A Lua puxa a água dos oceanos.","A Lua é a principal causa das marés.","O Sol também influencia as marés."],
        ["Por que os flocos de neve costumam ter seis lados?","Pelo jeito como as moléculas de água formam cristais",["Por causa das turbinas eólicas","Por causa dos pássaros","Por causa da areia"],"O gelo forma um padrão fixo de cristal.","A estrutura molecular do gelo leva a uma simetria de seis lados.","Não há dois flocos grandes exatamente iguais."],
        ["Por que o céu costuma ser azul de dia?","A luz azul se espalha mais",["Porque o oceano pinta o céu","Por causa das árvores","Por causa das nuvens"],"A luz do Sol tem várias cores.","A atmosfera espalha bastante a luz azul.","No pôr do sol vemos mais vermelho e laranja."],
        ["Por que as lagartixas andam nas paredes?","Milhões de pelinhos minúsculos nos dedos",["Ventosas com cola","Ímãs","Eletricidade"],"Os dedos delas fazem muito contato com a superfície.","Estruturas microscópicas dão muita aderência.","Essas forças se chamam forças de van der Waals."]
      ],
      speurtocht: [
        ["Para que você usa um mapa de rota?","Para seguir o caminho",["Para comer um quebra-cabeça","Para medir o tempo","Para fazer som"],"O mapa mostra para onde ir.","Um mapa de rota ajuda na navegação.","Símbolos podem marcar pontos importantes."],
        ["O que é um ponto de referência (waypoint)?","Um ponto combinado em uma rota",["Uma senha secreta","Um tipo de animal","Uma moeda"],"Você pode navegar até ele.","Waypoints marcam locais em uma rota.","Aparelhos de GPS usam waypoints."],
        ["Qual ferramenta ajuda a ver melhor pistas pequenas?","Lupa",["Martelo","Colher","Guarda-chuva"],"Ela aumenta os detalhes.","A lupa aumenta detalhes pequenos.","Uma lente convexa curva os raios de luz."],
        ["Uma pegada é principalmente um…","Rastro",["Planeta","Instrumento","Cor"],"Um detetive procura por eles.","Uma pegada pode ser um rastro.","Rastros podem dizer quem passou por um lugar."],
        ["Por que você olha bem em volta numa caça ao tesouro?","As pistas podem estar escondidas",["Para parar o tempo","Para fazer chuva","Para crescer mais rápido"],"Nem tudo fica no meio do caminho.","Observar com atenção é importante numa busca.","Boas caças combinam olhar, pensar e se mover."],
        ["O que significa “vire à esquerda” numa rota?","Virar para o lado esquerdo",["Seguir em frente","Voltar para casa","Subir"],"Pense na sua mão esquerda.","Virar à esquerda é virar para a esquerda.","Palavras de direção são importantes na navegação."],
        ["O que é uma coordenada?","Uma forma de indicar um lugar exato",["Um tipo de chave","Um rastro de animal","Um prêmio"],"Mapas e GPS as usam.","Coordenadas descrevem uma posição.","Latitude e longitude são exemplos."],
        ["O que você faz quando duas pistas se contradizem?","Confere de novo",["Escolhe uma qualquer","Joga tudo fora","Rasga o mapa"],"Talvez você tenha lido algo errado.","Conferir ajuda a achar erros.","Bons investigadores verificam suas informações."],
        ["Por que trabalhar em equipe é útil numa caça ao tesouro?","Dá para juntar ideias e observações",["Porque alguém pode não fazer nada","Para esconder pistas","Para parar o tempo"],"Dois pares de olhos veem mais.","Trabalhar junto pode resolver problemas mais rápido.","Equipes costumam dividir as tarefas."],
        ["Qual é o objetivo da última pista?","Levar você ao lugar final",["Mandar você de volta à pergunta 1","Criar um mundo novo","Apagar a rota"],"Ela leva você à solução.","A última pista costuma levar à chegada ou ao tesouro.","Uma boa caça avança passo a passo até o fim."]
      ]
    },
    dieren: {
      snelle_dieren: [
        ["Qual animal terrestre é o mais rápido?","Guepardo",["Elefante","Panda","Hipopótamo"],"É um felino magro e pintado.","O guepardo é o animal terrestre mais rápido.","Num sprint curto ele passa dos 90 km/h."],
        ["Que ave nada mais depressa?", "O pinguim", ["O cisne", "O pato", "A gaivota"], "Não sabe voar, mas nada muito bem.", "Um pinguim-gentoo passa dos trinta quilómetros por hora debaixo de água.", "As penas sobrepõem-se como telhas, por isso a água não passa."],
        ["Qual ave é famosa por mergulhos muito rápidos?","Falcão-peregrino",["Pinguim","Galinha","Avestruz"],"Ela caça a partir do ar.","O falcão-peregrino é um dos animais mais rápidos.","No mergulho ele passa dos 300 km/h."],
        ["Por que um peixe rápido tem corpo aerodinâmico?","Para ter menos resistência",["Para ser mais pesado","Para cantar mais alto","Para pegar mais ar"],"Uma forma lisa corta a água com mais facilidade.","A forma aerodinâmica reduz a resistência da água.","Os golfinhos também têm forma aerodinâmica."],
        ["Quem corre mais rápido: um cavalo ou uma tartaruga?","Cavalo",["Tartaruga","Os dois iguais","Nenhum dos dois"],"Ele tem pernas longas e fortes.","O cavalo é muito mais rápido que a tartaruga.","No galope, cavalos alcançam grandes velocidades."],
        ["Por que as gazelas têm pernas longas?","Para correr e pular rápido",["Para nadar","Para cavar","Para voar"],"Elas vivem em planícies abertas.","Pernas longas ajudam as gazelas a fugir rápido.","A velocidade ajuda a escapar dos predadores."],
        ["Qual tubarão é conhecido como nadador veloz?","Tubarão-mako",["Tubarão-baleia","Cavalo-marinho","Peixe-leão"],"Ele tem corpo aerodinâmico.","O tubarão-mako é um dos tubarões mais rápidos.","Ele caça peixes velozes."],
        ["O que ajuda o avestruz a correr rápido?","Pernas longas e fortes",["Asas para voar","Uma bexiga natatória","Garras para escalar"],"Ele não voa.","Avestruzes são corredores rápidos.","Eles correm a dezenas de quilômetros por hora."],
        ["Por que a velocidade é útil para as presas?","Para escapar",["Para fazer as árvores crescerem","Para fazer frio","Para dormir"],"Os predadores tentam pegá-las.","A velocidade aumenta a chance de sobreviver.","Algumas presas também usam curvas rápidas."],
        ["Por que a velocidade é útil para os predadores?","Para pegar a presa",["Para regar plantas","Para colorir penas","Para fazer ninhos"],"A caçada costuma ser bem curta.","A velocidade ajuda na perseguição.","Nem todo predador usa velocidade; alguns usam emboscada."]
      ],
      baby_dieren: [
        ["Como se chama o bebé do cão?", "Um cachorrinho", ["Um bezerro", "Um potro", "Um pintainho"], "É um cão acabado de nascer.", "Um cão jovem chama-se cachorrinho.", "Nascem cegos e surdos."],
        ["Como se chama o filhote de gato?","Gatinho",["Potro","Cordeiro","Bezerro"],"É um gato bem novo.","Um gato jovem é chamado de gatinho.","Gatinhos dormem muito."],
        ["Como se chama o filhote de cavalo?","Potro",["Filhote de cachorro","Pintinho","Filhote de leão"],"Ele consegue ficar de pé rapidinho.","Um cavalo jovem é chamado de potro.","Potros tentam ficar de pé logo depois de nascer."],
        ["Como se chama o filhote de ovelha?","Cordeiro",["Bezerro","Filhote de cachorro","Gatinho"],"Você os vê muito na primavera.","Uma ovelha jovem é chamada de cordeiro.","Cordeiros mamam na mãe."],
        ["Como se chama o filhote de vaca?","Bezerro",["Potro","Cordeiro","Pintinho"],"O filhote de elefante tem outro nome.","Uma vaca jovem é chamada de bezerro.","Bezerros bebem leite no começo."],
        ["Como se chama o filhote de galinha?","Pintinho",["Filhote de leão","Filhote de cachorro","Cordeiro"],"Ele sai de um ovo.","Um frango jovem é chamado de pintinho.","Pintinhos já piam antes de sair do ovo."],
        ["Como se chama o bebé do leão?", "Um leãozinho", ["Um potro", "Um bezerro", "Um gatinho"], "Fica muito tempo junto do bando.", "Um leão jovem chama-se leãozinho.", "Os mais novos ficam muito tempo com o grupo."],
        ["O que muitos filhotes de mamíferos bebem primeiro?","Leite",["Água salgada","Gasolina","Refrigerante"],"A mãe produz.","Mamíferos alimentam os filhotes com leite.","Essa é uma característica importante dos mamíferos."],
        ["Por que muitos filhotes ficam perto da mãe?","Por proteção e comida",["Para voar mais rápido","Para subir em árvores","Para fazer frio"],"Eles ainda têm muito a aprender.","Os pais protegem e cuidam dos filhotes.","O tempo de cuidado varia muito entre as espécies."],
        ["Qual filhote sai de um ovo?","Pintinho",["Filhote de cachorro","Bezerro","Potro"],"Pense numa galinha.","O pintinho sai de um ovo.","Répteis, peixes e muitos outros animais também botam ovos."]
      ],
      waterdieren: [
        ["Qual mamífero vive no mar e respira ar?","Golfinho",["Atum","Tubarão","Água-viva"],"Ele precisa subir regularmente.","Golfinhos são mamíferos e respiram com pulmões.","Eles usam um orifício no topo da cabeça."],
        ["Qual animal tem oito braços?","Polvo",["Tubarão","Golfinho","Caranguejo"],"Ele se esconde muito bem.","O polvo tem oito braços.","Polvos são moluscos muito inteligentes."],
        ["Qual animal marinho é o maior animal da Terra?","Baleia-azul",["Tubarão-branco","Golfinho","Orca"],"É uma baleia enorme.","A baleia-azul é o maior animal conhecido.","Ela pode passar de 25 metros de comprimento."],
        ["Como a maioria dos peixes respira?","Com brânquias",["Com pulmões","Pela pele","Com penas"],"Eles tiram o oxigênio da água.","As brânquias captam o oxigênio da água.","A água passa pelos filamentos das brânquias."],
        ["O que ajuda os peixes a virar e nadar?","Nadadeiras",["Asas","Pernas","Pelos"],"Ficam nas costas, na barriga e na cauda.","As nadadeiras ajudam no movimento e no equilíbrio.","A nadadeira caudal dá muito impulso."],
        ["Qual animal vive tanto no mar quanto na terra?","Tartaruga-marinha",["Atum","Água-viva","Cavalo-marinho"],"Ela vai à praia para botar ovos.","Tartarugas-marinhas vivem no mar, mas botam ovos na terra.","As fêmeas costumam voltar à praia onde nasceram."],
        ["O que é o coral na verdade?","Uma colônia de animais pequenos",["Uma planta","Uma pedra","Um peixe"],"Ele forma recifes.","Corais são formados por muitíssimos pólipos pequenos.","Recifes de coral são habitats importantes."],
        ["Por que as baleias sobem à superfície?","Para respirar",["Para lavar as brânquias","Para dormir na praia","Para cozinhar"],"Elas são mamíferos.","Baleias respiram ar com pulmões.","Elas respiram por um orifício na cabeça."],
        ["Qual animal tem casca dura e anda de lado?","Caranguejo",["Golfinho","Água-viva","Lula"],"Você o vê muito nas praias.","Caranguejos têm um esqueleto externo duro.","Muitos caranguejos andam de lado com facilidade."],
        ["Por que um corpo aerodinâmico é útil na água?","Ele reduz a resistência",["Faz mais barulho","Deixa o animal mais pesado","Esquenta a água"],"Os animais deslizam melhor pela água.","A forma aerodinâmica ajuda a nadar com mais eficiência.","Golfinhos e tubarões são bons exemplos."]
      ],
      jungle: [
        ["Qual animal costuma se balançar entre as árvores?","Macaco",["Elefante","Pinguim","Zebra"],"Ele usa os galhos para subir.","Muitas espécies de macacos vivem nas árvores.","Alguns macacos usam a cauda como apoio extra."],
        ["Qual animal tem um bico grande e colorido?","Tucano",["Tigre","Gorila","Crocodilo"],"É uma ave tropical.","Os tucanos têm bicos impressionantes.","O bico deles é surpreendentemente leve."],
        ["Qual animal grande vive em florestas tropicais e come muitas plantas?","Gorila",["Pinguim","Camelo","Urso-polar"],"É um grande primata.","Gorilas vivem em florestas da África.","Eles comem principalmente plantas."],
        ["Por que muitos animais da selva têm camuflagem?","Para chamar menos atenção",["Para cantar mais alto","Para fazer mais chuva","Para crescer mais rápido"],"Os padrões combinam com folhas e sombras.","A camuflagem ajuda a caçar ou a se esconder.","Muitas onças têm pintas que imitam sombras."],
        ["Qual felino grande vive nas selvas das Américas?","Onça-pintada",["Leão","Leopardo-das-neves","Lince"],"Ela tem rosetas no pelo.","Onças vivem em partes da América Central e do Sul.","Elas nadam muito bem."],
        ["Por que as árvores da floresta tropical são tão importantes?","Elas dão comida e moradia",["Elas não fazem oxigênio","Elas param toda a chuva","Elas são só enfeite"],"Muitos animais vivem em diferentes andares das árvores.","As árvores da floresta formam habitats complexos.","Alguns animais quase nunca descem até o chão."],
        ["Qual réptil consegue mudar de cor?","Camaleão",["Tartaruga","Crocodilo","A cobra"],"Ele também usa a cor para se comunicar.","Camaleões ajustam seu padrão de cores.","A mudança de cor ajuda na temperatura e nos sinais."],
        ["O que é uma floresta tropical?","Uma floresta quente com muita chuva",["Um deserto congelado","Um campo sem árvores","Um mar"],"Ela é riquíssima em espécies.","Florestas tropicais recebem muitíssima chuva.","Estão entre os ecossistemas com mais biodiversidade."],
        ["Por que os bugios gritam tão alto?","Para se comunicar com o grupo",["Para fazer chuva","Para derrubar árvores","Para nadar"],"O grito deles vai longe pela floresta.","Bugios usam sons altos para se comunicar.","Uma estrutura na garganta amplifica o grito."],
        ["Qual animal pega insetos com uma língua comprida?","Camaleão",["Elefante","Gorila","Tucano"],"A língua dispara para a frente rapidinho.","Camaleões pegam a presa com a língua comprida.","A língua acelera extremamente rápido."]
      ]
    },
    aarde: {
      continenten_landen: [
        ["Em que continente fica a Holanda?","Europa",["África","Ásia","América do Sul"],"Pense nos países vizinhos dela.","A Holanda fica na Europa.","A Europa é um dos sete continentes."],
        ["Qual é o maior continente?","Ásia",["Europa","África","Oceania"],"China e Índia ficam lá.","A Ásia é o maior continente.","Mais da metade das pessoas do mundo vive na Ásia."],
        ["Em que continente fica o Brasil?","América do Sul",["África","Europa","Ásia"],"Pense na Amazônia.","O Brasil fica na América do Sul.","O Brasil é o maior país da América do Sul."],
        ["Em que continente fica a maior parte do Egito?","África",["Europa","Ásia","América do Norte"],"O Nilo passa por ele.","O Egito fica principalmente na África.","A península do Sinai fica geograficamente na Ásia."],
        ["Qual é a capital da França?","Paris",["Roma","Madri","Berlim"],"A Torre Eiffel fica lá.","Paris é a capital da França.","O rio Sena passa por Paris."],
        ["Qual é a capital da Itália?","Roma",["Milão","Veneza","Nápoles"],"O Coliseu fica lá.","Roma é a capital da Itália.","O Vaticano fica dentro de Roma."],
        ["Qual país tem o formato de uma bota?","Itália",["Portugal","Noruega","Polônia"],"Olhe para o sul da Europa.","A Itália parece uma bota.","A Sicília fica perto da ponta da bota."],
        ["Qual oceano fica entre a Europa e a América?","Oceano Atlântico",["Oceano Pacífico","Oceano Índico","Oceano Ártico"],"Os navios o atravessam.","O Oceano Atlântico fica entre a Europa, a África e a América.","É o segundo maior oceano."],
        ["Qual continente fica no Polo Sul?","Antártida",["Europa","África","Ásia"],"Ele é coberto de gelo.","A Antártida fica em volta do Polo Sul.","É o continente mais frio."],
        ["Qual país fica logo a leste da Holanda?","Alemanha",["Espanha","Irlanda","Itália"],"É um país vizinho.","A Alemanha faz fronteira com a Holanda.","A Holanda também faz fronteira com a Bélgica."]
      ],
      weer_klimaat: [
        ["O que um termômetro mede?","Temperatura",["Direção do vento","Quantidade de chuva","Pressão do ar"],"Quente ou frio.","O termômetro mede a temperatura.","Costumamos usar graus Celsius."],
        ["O que é precipitação?","Água que cai do céu",["Vento","Luz do Sol","Neblina"],"Chuva e neve são exemplos.","A precipitação pode ser chuva, neve ou granizo.","Ela se forma a partir da água das nuvens."],
        ["O que é o vento?","Ar em movimento",["Água em movimento","Areia quente","Uma nuvem"],"Você sente, mas não vê.","Vento é ar que se move.","Diferenças de pressão do ar causam boa parte do vento."],
        ["Por que a neblina costuma se formar?","O vapor de água condensa perto do chão",["Por causa das estrelas","Por causa da areia","Por causa de ímãs"],"A visibilidade piora.","A neblina é feita de gotinhas de água no ar.","A neblina é, na verdade, uma nuvem no nível do chão."],
        ["O que é clima?","O tempo médio ao longo de muitos anos",["O tempo de hoje","Uma tempestade","Um pluviômetro"],"É sobre anos, não um dia.","O clima descreve o tempo típico de um longo período.","O tempo pode mudar muito de um dia para o outro."],
        ["O que causa o relâmpago?","Uma descarga elétrica",["Uma estrela cadente","Um avião","Um arco-íris"],"Acontece muito com nuvens de tempestade.","O relâmpago é uma descarga elétrica enorme.","O ar em volta dele fica extremamente quente."],
        ["Por que você ouve o trovão depois do relâmpago?","A luz viaja mais rápido que o som",["O trovão começa depois","As nuvens esperam","O Sol bloqueia o som"],"Você vê o clarão primeiro.","A luz chega até você muito mais rápido que o som.","O intervalo ajuda a estimar a distância da tempestade."],
        ["Qual nuvem costuma vir com chuva forte e trovões?","Cumulonimbus",["Cirrus","Neblina","Nenhuma nuvem"],"Ela pode crescer muito alto.","Nuvens cumulonimbus podem trazer tempestades.","Elas costumam ter o topo em forma de bigorna."],
        ["O que é uma onda de calor?","Um período de tempo excepcionalmente quente",["Uma nevasca repentina","Um terremoto","Uma onda alta no mar"],"Dura vários dias.","Uma onda de calor é um período longo de calor forte.","As definições variam de país para país."],
        ["O que é geada?","Temperatura abaixo do ponto de congelamento",["Vento forte","Chuva muito pesada","Neblina densa"],"A água pode congelar.","Na geada a temperatura cai para perto ou abaixo de 0 °C.","A geada branca se forma quando o vapor de água congela."]
      ],
      oceanen_natuur: [
        ["O que cobre a maior parte da Terra?","Água",["Deserto","Floresta","Gelo"],"Os oceanos ocupam um espaço enorme.","Cerca de 71% da Terra é coberta por água.","A maior parte dessa água é salgada."],
        ["Qual oceano é o maior?","Oceano Pacífico",["Oceano Atlântico","Oceano Índico","Oceano Ártico"],"Fica entre a Ásia e a América.","O Pacífico é o maior oceano.","Ele cobre cerca de um terço da superfície da Terra."],
        ["Como se chama a rocha derretida que sai de um vulcão?","Lava",["Magma","Argila","Areia"],"Fora da Terra chamamos assim.","Na superfície, a rocha derretida se chama lava.","No subsolo chamamos de magma."],
        ["O que é uma ilha?","Terra totalmente cercada de água",["Uma nuvem alta","Um rio","Um deserto"],"Você precisa cruzar a água para chegar lá.","Uma ilha é cercada de água por todos os lados.","A Groenlândia é a maior ilha que não é um continente."],
        ["O que é uma cordilheira?","Uma série de montanhas",["Um rio largo","Um mar","Um grupo de ilhas"],"Os Andes são uma.","Uma cordilheira é feita de montanhas ligadas.","O Himalaia tem as montanhas mais altas da Terra."],
        ["O que é a foz de um rio?","O lugar onde o rio termina",["A nascente do rio","O topo de uma montanha","Um deserto"],"O rio costuma desaguar num mar ou lago.","A foz é o fim de um rio.","Alguns rios formam um delta na foz."],
        ["O que é um deserto?","Uma área com muito pouca chuva",["Sempre uma praia quente","Uma floresta tropical","Um oceano"],"Nem todo deserto é quente.","Desertos recebem pouquíssima precipitação.","Tecnicamente a Antártida também é um deserto."],
        ["O que é uma geleira?","Uma massa de gelo que se move devagar",["Uma nuvem","Um rio de lava","Uma duna de areia"],"Ela se forma de neve comprimida.","Geleiras se movem devagar pelo próprio peso.","Elas moldam vales e paisagens."],
        ["O que é erosão?","O desgaste e o transporte de rocha e solo",["Árvores crescendo","Estrelas se formando","Ar congelando"],"Água e vento podem causá-la.","A erosão muda as paisagens.","Rios podem cavar vales profundos."],
        ["O que é um delta?","Uma área onde um rio se divide na foz",["O topo de uma montanha","Uma corrente oceânica","Uma nuvem"],"Pode ter solo fértil.","Um delta se forma com sedimentos depositados.","O delta do Nilo é um exemplo famoso."]
      ],
      kaarten_navigatie: [
        ["O que uma rosa dos ventos mostra?","As direções",["A temperatura","A altitude","Os fusos horários"],"Norte, leste, sul e oeste.","A rosa dos ventos mostra as direções.","Os mapas costumam usar N, L, S e O."],
        ["Para que serve a legenda de um mapa?","Para explicar os símbolos",["Para enfeitar o mapa","Para medir distâncias","Para fazer vento"],"Cores e sinais ganham significado.","A legenda explica os símbolos do mapa.","Uma linha azul pode representar um rio, por exemplo."],
        ["O que é a escala de um mapa?","A relação entre a distância no mapa e a distância real",["Um instrumento musical","Um medidor de temperatura","Um código de cores"],"1 cm pode significar 1 km, por exemplo.","A escala torna as distâncias do mapa compreensíveis.","Uma escala grande costuma mostrar mais detalhes."],
        ["O que são coordenadas?","Números ou valores que indicam um lugar",["Um tipo de nuvem","Uma moeda","Um rio"],"O GPS as usa.","Coordenadas descrevem uma posição.","Latitude e longitude são coordenadas conhecidas."],
        ["Qual direção fica oposta ao norte?","Sul",["Leste","Oeste","Nordeste"],"Pense na rosa dos ventos.","O sul é o oposto do norte.","Leste e oeste ficam em ângulo reto com norte e sul."],
        ["Qual direção fica à sua direita quando você olha para o norte?","Leste",["Oeste","Sul","Norte"],"Em muitos mapas o norte fica em cima.","Com o norte em cima, o leste fica à direita.","Por isso o oeste fica à esquerda nesse mapa."],
        ["O que é um mapa topográfico?","Um mapa com informações de terreno e altitude",["Um mapa das estrelas","Um cardápio","Uma linha do tempo"],"Ele pode ter curvas de nível.","Mapas topográficos mostram a paisagem e a altitude.","Quem faz trilha costuma usá-los."],
        ["O que é o GPS?","Um sistema de satélites para descobrir a posição",["Um tipo de nuvem","Um vulcão","Uma bússola sem satélites"],"Seu celular pode usá-lo.","O GPS usa sinais de satélites para descobrir sua posição.","São necessários vários satélites para uma posição precisa."],
        ["Por que o norte costuma ficar em cima nos mapas?","É uma convenção muito usada",["Porque o norte fica mais alto","Porque o Sol está sempre lá","Porque os rios correm para lá"],"É uma convenção, não uma lei da natureza.","Muitos mapas modernos colocam o norte em cima.","Mapas antigos às vezes usavam outras orientações."],
        ["O que é uma rota?","Um caminho planejado do início ao destino",["Uma nuvem de chuva","Uma montanha","Uma fronteira"],"A navegação ajuda a segui-la.","Uma rota descreve como ir de A a B.","Mapas digitais calculam rotas automaticamente."]
      ]
    }
  };

  window.KWIZILLO_QUESTIONS_PT = window.KWIZILLO_BUILD_BANK(defs, window.KWIZILLO_EXTRA_PT||{}, window.KWIZILLO_MORE_PT||{});
})();
