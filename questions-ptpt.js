(() => {
  // European Portuguese bank (Português de Portugal). Same worlds, topics, order and therefore the same
  // question IDs as the Dutch and English banks, so progress, cards and the
  // per-question illustrations survive a language switch.
  const defs = {
    ruimte: {
      zonnestelsel: [
        ["Que planeta está mais perto do Sol?","Mercúrio",["Vénus","Marte","Terra"],"É o planeta mais pequeno e está mesmo à frente.","Mercúrio é o planeta mais próximo do Sol.","Um ano em Mercúrio dura só 88 dias terrestres."],
        ["Que planeta é a nossa casa?","Terra",["Vénus","Marte","Júpiter"],"Pessoas, animais e plantas vivem aqui.","Nós vivemos na Terra.","Cerca de 71% da Terra está coberta por água."],
        ["Que planeta é conhecido como o planeta vermelho?","Marte",["Vénus","Saturno","Neptuno"],"O solo dele tem muito óxido de ferro.","Marte é chamado o planeta vermelho.","Marte tem duas luas pequenas: Fobos e Deimos."],
        ["Que planeta tem os anéis mais famosos?","Saturno",["Terra","Mercúrio","Marte"],"É um grande gigante gasoso.","Saturno tem um sistema de anéis impressionante.","Os anéis são feitos sobretudo de gelo e rocha."],
        ["Qual é o maior planeta do nosso sistema solar?","Júpiter",["Marte","Vénus","Terra"],"Tem a famosa Grande Mancha Vermelha.","Júpiter é o maior planeta.","Mais de mil Terras caberiam dentro de Júpiter."],
        ["Que planeta está mais longe do Sol?","Neptuno",["Júpiter","Terra","Vénus"],"É um gigante de gelo azul e distante.","Neptuno é o planeta mais distante do Sol.","Um ano em Neptuno dura cerca de 165 anos terrestres."],
        ["Que planeta fica entre Vénus e Marte?","Terra",["Mercúrio","Júpiter","Saturno"],"É o nosso próprio planeta.","A ordem é Vénus, Terra, Marte.","A Terra é o terceiro planeta a contar do Sol."],
        ["O que anda à volta da Terra?","A Lua",["Júpiter","O Sol","Marte"],"Vês muitas vezes no céu à noite.","A Lua anda à volta da Terra.","A Lua demora cerca de 27 dias a dar uma volta."],
        ["Quantos planetas tem o nosso sistema solar?","8",["7","9","10"],"Hoje Plutão conta como planeta anão.","O nosso sistema solar tem oito planetas.","Desde 2006 que Plutão é classificado como planeta anão."],
        ["Que planeta é famoso pela sua forte cor azul?","Neptuno",["Mercúrio","Marte","Vénus"],"É um gigante de gelo distante.","Neptuno parece azul profundo.","O metano na atmosfera dele reforça a cor azul."]
      ],
      sterren_planeten: [
        ["O que é o Sol?","Uma estrela",["Um planeta","Uma lua","Um cometa"],"Faz a sua própria luz e o seu próprio calor.","O Sol é uma estrela.","A luz do Sol demora cerca de 8 minutos a chegar à Terra."],
        ["De que é feita sobretudo uma estrela?","Gás quente e plasma",["Rocha fria","Uma lua","Uma nuvem"],"As estrelas emitem a sua própria luz.","As estrelas são feitas de gás e plasma muito quentes.","O nosso Sol é uma estrela de tamanho médio."],
        ["O que é uma galáxia?","Um grupo enorme de estrelas",["Um planeta","Um telescópio","Uma nuvem na Terra"],"A Via Láctea é uma.","Uma galáxia tem muitíssimas estrelas.","A Via Láctea tem centenas de milhares de milhões de estrelas."],
        ["Como se chama a nossa galáxia?","Via Láctea",["Andrómeda","Orionte","Saturno"],"Às vezes vês uma faixa clara no céu escuro.","O nosso sistema solar fica dentro da Via Láctea.","A Via Láctea é uma galáxia em espiral."],
        ["O que é uma supernova?","Uma explosão gigante de estrela",["Uma lua nova","O lançamento de um foguetão","Uma chuvada"],"Acontece no fim da vida de algumas estrelas.","Uma supernova é uma explosão enorme de uma estrela.","Essa explosão pode ficar extremamente brilhante durante algum tempo."],
        ["De que cor costumam ser as estrelas mais quentes?","Azul",["Vermelha","Castanha","Verde"],"Pensa na chama mais quente de um fogão a gás.","Estrelas muito quentes costumam parecer azuladas.","As estrelas vermelhas são geralmente mais frias do que as azuis."],
        ["O que é um exoplaneta?","Um planeta à volta de outra estrela",["Uma lua da Terra","Um cometa","Um satélite"],"Não anda à volta do nosso Sol.","Um exoplaneta orbita uma estrela que não é o Sol.","Já foram encontrados milhares de exoplanetas."],
        ["O que é um buraco negro?","Uma zona com gravidade fortíssima",["Um planeta escuro","Uma nuvem","Um motor de foguetão"],"Nem a luz consegue escapar-lhe com facilidade.","Um buraco negro tem uma gravidade extremamente forte.","Muitos buracos negros formam-se a partir de estrelas gigantes."],
        ["Que estrela está mais perto da Terra?","O Sol",["Sírio","Estrela Polar","Betelgeuse"],"Vês esta estrela todos os dias.","O Sol é a nossa estrela mais próxima.","A estrela seguinte mais perto está muito mais longe."],
        ["Porque é que as estrelas parecem cintilar?","Por causa da atmosfera",["Porque piscam os olhos","Por causa das suas luas","Porque andam às voltas"],"A luz delas curva-se nas camadas de ar pelo caminho.","A atmosfera faz a luz das estrelas tremeluzir um pouco.","Os planetas costumam cintilar menos do que as estrelas."]
      ],
      astronauten: [
        ["Como se chama quem viaja para o espaço?","Astronauta",["Arqueólogo","Mergulhador","Capitão"],"Esta pessoa costuma usar um fato espacial.","Um astronauta viaja e trabalha no espaço.","Os astronautas treinam durante anos."],
        ["Porque é que os astronautas usam fato espacial fora da nave?","Para terem ar e proteção",["Para se aquecerem","Para irem mais depressa","Como uniforme"],"No espaço não dá para simplesmente respirar.","O fato espacial fornece oxigénio e proteção.","O fato também protege contra temperaturas extremas."],
        ["O que sentem os astronautas numa estação espacial?","Ausência de peso",["Chuva forte","Vento forte","Sismos"],"Parece que flutuam.","Em órbita, os astronautas vivem a microgravidade.","Tudo tem de estar preso para não flutuar."],
        ["Onde dormem os astronautas na estação espacial?","Em sacos-cama presos",["Em camas normais","Em redes lá fora","No chão"],"Senão, andariam a flutuar.","Os astronautas dormem em sacos-cama presos.","Na microgravidade não há um em cima nem um em baixo a sério."],
        ["Porque é que os astronautas treinam debaixo de água?","Para imitar a falta de peso",["Para nadarem mais depressa","Para procurar água na Lua","Para relaxarem"],"Debaixo de água dá para treinar movimentos a flutuar.","O treino na água ajuda a ensaiar passeios espaciais.","Piscinas enormes guardam modelos de partes da estação."],
        ["O que é um passeio espacial?","Trabalho fora de uma nave",["Andar na Terra","Correr dentro do foguetão","Passear num museu"],"O astronauta fica preso com sistemas de segurança.","Um passeio espacial também se chama EVA.","Os astronautas usam o fato completo para isso."],
        ["O que acontece aos músculos após muito tempo sem peso?","Podem ficar mais fracos",["Viram aço","Desaparecem logo","Crescem sempre mais depressa"],"Por isso os astronautas fazem muito exercício.","Sem treino, os músculos e os ossos podem enfraquecer.","Na ISS os astronautas treinam todos os dias."],
        ["O que comem os astronautas no espaço?","Comida em embalagens especiais",["Comprimidos","Gelado","Nada"],"Tem de ser segura na microgravidade.","Os astronautas comem comida embalada de forma especial.","As migalhas são um problema porque flutuam."],
        ["O que é a ISS?","Uma estação espacial internacional",["Um planeta","Um motor de foguetão","Uma base na Lua"],"Anda à volta da Terra.","A ISS é uma grande estação espacial em órbita da Terra.","Astronautas de vários países trabalham lá juntos."],
        ["Porque é que um astronauta tem de estar preso enquanto trabalha?","Para não flutuar para longe",["Para ter mais gravidade","Por causa da chuva","Para ir mais depressa"],"Na microgravidade continuas a mexer-te com facilidade.","Um cabo impede que alguém se afaste a flutuar sem controlo.","As ferramentas também ficam presas."]
      ],
      raket_avontuur: [
        ["Para que serve o motor de um foguetão?","Para criar impulso",["Para imprimir fotos","Para fazer oxigénio","Para contar estrelas"],"Empurra gases quentes para trás.","O motor do foguetão produz impulso.","Por ação e reação, o foguetão vai para o outro lado."],
        ["Porque é que um foguetão precisa de tanto combustível?","Para escapar à gravidade",["Para a iluminação","Para o ar condicionado","Para o rádio"],"Descolar exige uma quantidade enorme de energia.","Um lançamento precisa de muitíssima energia.","Na descolagem, a maior parte do foguetão pode ser combustível."],
        ["O que acontece na descolagem?","O foguetão sobe",["O foguetão aterra","O motor para sempre","A Lua chega mais perto"],"É o momento da partida.","A descolagem é o momento em que o foguetão sai do chão.","Os primeiros segundos são tecnicamente muito importantes."],
        ["Porque é que alguns foguetões têm vários andares?","Para largar as partes vazias",["Para ter mais janelas","Para ter sítio para dormir","Por causa das cores"],"Assim o foguetão leva menos massa.","Os foguetões largam andares quando o combustível acaba.","Isso torna a aceleração mais eficiente."],
        ["O que é uma plataforma de lançamento?","O sítio de onde sai o foguetão",["Um satélite","Um jipe lunar","Um banco de cabine"],"O foguetão fica ali antes da partida.","A plataforma segura o foguetão antes do voo.","Há sistemas enormes de combustível, arrefecimento e segurança."],
        ["O que é um satélite?","Um objeto que anda à volta de outro",["Uma explosão de estrela","Um motor de foguetão","Um telescópio"],"Na verdade, a Lua também é um satélite natural.","Os satélites viajam em órbita de um planeta ou de outro corpo.","Os satélites artificiais ajudam na navegação e nas comunicações."],
        ["Porque é que o nariz do foguetão é aerodinâmico?","Para reduzir a resistência do ar",["Para ser mais pesado","Para apanhar mais chuva","Por causa da cor"],"Uma forma lisa passa pelo ar com mais facilidade.","Uma forma aerodinâmica reduz o arrasto.","Fora da atmosfera quase não há resistência do ar."],
        ["O que é uma cápsula?","Uma parte que leva pessoas ou carga",["Uma galáxia","Uma lua","Um combustível"],"Costuma ficar no topo do foguetão.","Uma cápsula espacial leva pessoas ou carga.","Algumas cápsulas regressam com paraquedas."],
        ["O que ajuda uma cápsula a aterrar em segurança?","Paraquedas",["Estrelas","Erupções solares","Asteroides"],"Diminuem a velocidade da descida.","Os paraquedas travam a cápsula que está a regressar.","Alguns veículos também aterram com motores."],
        ["O que é uma órbita à volta da Terra?","Um caminho em que se cai sempre à volta da Terra",["Uma estrada reta até ao Sol","Um túnel","Uma nuvem"],"A velocidade e a gravidade ficam em equilíbrio.","Um satélite em órbita está sempre a cair à volta da Terra.","Por isso não cai a direito no chão."]
      ]
    },
    geschiedenis: {
      egyptenaren: [
        ["Para que foram construídas muitas pirâmides?","Como túmulos",["Como escolas","Como mercados","Como portos"],"Pensa nos faraós e no seu enterro.","Muitas pirâmides eram túmulos de faraós.","A Grande Pirâmide de Gizé tem milhares de anos."],
        ["Como se chamava um governante do Egito antigo?","Faraó",["Senador","Cavaleiro","Viking"],"Estava no topo da sociedade.","Um governante egípcio chamava-se faraó.","Alguns faraós eram vistos como divinos."],
        ["Que rio era muito importante para o Egito?","O Nilo",["O Reno","O Amazonas","O Danúbio"],"Atravessa o país e torna o solo fértil.","O Nilo era essencial para a agricultura e o transporte.","As cheias anuais traziam lodo fértil."],
        ["Como se chama a escrita egípcia com sinais e desenhos?","Hieróglifos",["Latim","Runas","Código Morse"],"Vês esta escrita em templos e túmulos.","Os hieróglifos eram uma escrita egípcia importante.","A escrita usava centenas de sinais."],
        ["O que é uma múmia?","Um corpo conservado",["Uma moeda de ouro","Um templo","Um barco"],"O corpo recebia um tratamento especial depois da morte.","Os egípcios faziam múmias para conservar os corpos.","O processo podia demorar muitas semanas."],
        ["Em que costumavam escrever os egípcios?","Papiro",["Plástico","Betão","Alumínio"],"Era feito de uma planta das margens do Nilo.","O papiro era usado como material de escrita.","A palavra papel vem de papiro."],
        ["O que era a Esfinge de Gizé?","Uma estátua com corpo de leão e cabeça humana",["Uma pirâmide","Um navio","Uma coroa"],"Fica perto das pirâmides.","A Grande Esfinge é uma estátua enorme de pedra.","A Esfinge foi esculpida em calcário."],
        ["Para que usavam os egípcios a rega?","Para regar as plantações",["Para pintar pirâmides","Para escrever","Para fazer moedas"],"A água do Nilo tinha de chegar aos campos.","A rega ajudava na agricultura.","Canais e tanques espalhavam a água pelos campos."],
        ["Que animais eram vistos como especiais no Egito?","Gatos",["Ursos-polares","Pinguins","Cangurus"],"Aparecem muito na arte e na religião.","Os gatos tinham um lugar especial no Egito antigo.","A deusa Bastet era representada como uma gata."],
        ["O que faziam os escribas no Egito antigo?","Tratavam de textos e registos",["Faziam voar pirâmides","Treinavam cavaleiros","Faziam estrelas"],"Escrever era uma habilidade importante.","Os escribas mantinham registos e controlavam os impostos.","Nem toda a gente sabia ler e escrever."]
      ],
      ridders_kastelen: [
        ["O que costumava usar um cavaleiro para se proteger?","Uma armadura",["Um fato espacial","Um roupão","Um fato de mergulho"],"Era feita de metal.","A armadura protegia o corpo.","Uma armadura completa tinha muitas peças."],
        ["Onde costumava morar um senhor poderoso?","Num castelo",["Num foguetão","Numa pirâmide","Num iglu"],"O edifício tinha paredes grossas.","Os castelos eram casas e lugares de defesa.","Muitos castelos tinham torres e muralhas."],
        ["O que é um fosso?","Uma vala com água à volta de um castelo",["Um quarto","Uma praça de mercado","Uma padaria"],"Mantinha longe os visitantes indesejados.","O fosso tornava o castelo difícil de alcançar.","Nem todos os fossos tinham água o tempo todo."],
        ["O que é uma ponte levadiça?","Uma ponte que pode ser levantada",["Uma escada secreta","Uma bandeira","Uma torre"],"Ficava geralmente à entrada.","A ponte levadiça podia fechar a entrada.","Costumava ser combinada com um portão."],
        ["O que acontecia num torneio de cavaleiros?","Cavaleiros entravam em competições",["Pessoas construíam pirâmides","Pessoas navegavam até à América","Pessoas faziam telescópios"],"Pensa em cavalgar e em destreza.","Os torneios eram competições para cavaleiros.","Os torneios atraíam gente de longe, com música e festa."],
        ["O que é um escudo?","Proteção do cavaleiro",["Um instrumento musical","Um mapa","Um copo"],"Os cavaleiros levavam-no num braço.","O cavaleiro segurava o escudo à frente do corpo para se proteger.","Os escudos costumavam mostrar as cores e os símbolos da família."],
        ["Quem geralmente não morava sempre num castelo medieval?","Todos os camponeses da região",["O senhor do castelo","Soldados","Criados"],"Muita gente morava em aldeias à volta do castelo.","A maioria dos camponeses morava fora do castelo.","Em tempos de perigo, as pessoas podiam abrigar-se lá dentro."],
        ["Porque é que os castelos tinham paredes grossas?","Para defesa",["Para internet mais rápida","Para aquecer","Para enfeitar"],"Tinham de ser fortes e resistentes.","Paredes grossas de pedra tornavam os castelos mais fortes.","Algumas muralhas de castelo tinham mais de quatro metros de espessura."],
        ["O que costumava fazer um escudeiro?","Ajudar um cavaleiro e aprender",["Enterrar um faraó","Pilotar um foguetão","Construir um templo"],"Às vezes preparava-se para ser cavaleiro.","Um escudeiro ajudava o cavaleiro e aprendia habilidades.","Nem todos os escudeiros chegavam a cavaleiro."],
        ["O que era uma fortaleza?","Um sítio fortificado para morar",["Uma galáxia","Um navio","Uma disciplina da escola"],"A palavra é usada para castelos.","Uma fortaleza era um lugar fortificado.","As fortalezas ficavam muitas vezes em pontos estratégicos."]
      ],
      romeinen: [
        ["Quem construiu o Coliseu?","Os romanos",["Os vikings","Os maias","Os egípcios"],"Fica em Roma.","O Coliseu foi construído pelos romanos.","Podia receber dezenas de milhares de espectadores."],
        ["O que era um aqueduto?","Uma construção para levar água",["Um elmo de cavaleiro","Um templo para barcos","Uma moeda"],"Levava água até às cidades.","Os aquedutos romanos levavam água por longas distâncias.","Alguns aquedutos ainda hoje se podem ver."],
        ["Que língua falavam muitos romanos?","Latim",["Neerlandês","Japonês","Árabe"],"Muitas palavras europeias vêm dela.","O latim era uma língua importante no Império Romano.","Francês, espanhol, italiano e português são línguas românicas."],
        ["O que era uma legião?","Um grande grupo de soldados romanos",["Um mercado","Uma casa de banhos","Um navio"],"Fazia parte do exército.","Uma legião era uma grande unidade do exército.","Os soldados romanos treinavam com rigor."],
        ["O que era o fórum numa cidade romana?","Uma praça central",["Uma prisão","Uma quinta","Um porto"],"As pessoas iam lá para o comércio e o governo.","O fórum era um centro importante da cidade.","Ali ficavam templos e edifícios públicos."],
        ["Para que serviam as termas romanas?","Para se lavarem e conviverem",["Para construir foguetões","Para guardar cereais","Para treinar cavalos"],"As pessoas também se reuniam ali.","As termas eram lugares importantes de encontro.","Algumas tinham banhos quentes e frios."],
        ["O que costumava usar um soldado romano?","Elmo e escudo",["Fato espacial","Chapéu de cowboy","Fato de mergulho"],"Precisava de proteger a cabeça e o corpo.","Os soldados romanos usavam capacete, um grande escudo e sandálias resistentes.","O equipamento mudou ao longo dos séculos."],
        ["O que significa “Império Romano”?","Uma grande área governada a partir de Roma",["A cidade de Roma","Uma pirâmide","Uma ordem de cavaleiros"],"Estendia-se por grande parte da Europa.","O Império Romano era muito extenso.","No seu auge, cobria terras à volta do Mediterrâneo."],
        ["O que usavam os romanos para longas distâncias por terra?","Uma grande rede de estradas",["Rios","Balões de ar quente","Comboios"],"Muitas estradas eram bem construídas.","Os romanos construíram uma grande rede de estradas.","Algumas estradas modernas seguem antigas rotas romanas."],
        ["O que era um senador em Roma?","Um funcionário importante",["Um padeiro","Um faraó","Um cavaleiro"],"Tinha um papel político.","Os senadores tinham influência no governo.","O Senado romano durou séculos."]
      ],
      ontdekkingsreizigers: [
        ["O que fazia um explorador?","Explorava novas regiões",["Construía planetas","Inventava a eletricidade","Vigiava pirâmides"],"Pensa em viagens longas.","Os exploradores viajavam para regiões desconhecidas.","As suas viagens mudaram os mapas e o comércio."],
        ["Para que usavam os navegadores a bússola?","Para encontrar a direção",["Para cozinhar","Para escrever","Para medir a profundidade"],"A agulha aponta mais ou menos para norte.","A bússola ajuda na navegação.","Tornou as longas viagens por mar mais seguras."],
        ["O que é uma carta náutica?","Um mapa para navegar no mar",["Uma pintura","Um brasão de cavaleiro","Uma constelação"],"Os navios usavam-na para planear rotas.","As cartas náuticas mostram costas, perigos e rotas.","Os navios modernos costumam usar cartas digitais."],
        ["Porque é que as estrelas eram úteis aos navegadores?","Ajudavam a saber a posição",["Para atrair peixes","Para fazer vento","Para aquecer água"],"Sobretudo à noite, davam a direção.","As estrelas podiam ajudar na navegação.","A Estrela Polar era importante no hemisfério norte."],
        ["O que era uma caravela?","Um tipo de navio à vela",["Umas termas romanas","Um castelo","Um templo"],"Era usada em longas viagens.","As caravelas eram navios à vela ágeis.","Fizeram parte das viagens dos Descobrimentos europeus."],
        ["Porque é que os exploradores levavam mantimentos?","As viagens podiam durar muito",["Havia lojas no mar","Para enfeitar","Para construir estrelas"],"No mar não dava para ir simplesmente às compras.","A comida e a água eram essenciais nas viagens longas.","A falta de comida e as doenças eram riscos sérios."],
        ["O que é a navegação?","Saber onde estás e para onde vais",["Pintar um navio","Aprender uma língua","Construir um mercado"],"A bússola e as cartas ajudam nisso.","Navegar é planear e seguir uma rota.","O GPS é uma forma moderna de navegação."],
        ["Qual era um grande perigo nas longas viagens por mar?","Tempestades e doenças",["Semáforos","Neve no deserto","Satélites"],"As viagens às vezes demoravam meses.","Tempestades, doenças e falta de comida eram perigosas.","O escorbuto vinha da falta prolongada de vitamina C."],
        ["Porque se procuravam novas rotas para a Ásia?","Para comerciar produtos valiosos",["Para fazer esqui","Por causa dos dinossauros","Para viagens espaciais"],"As especiarias valiam muito.","O comércio motivou muitas viagens dos Descobrimentos.","As especiarias podiam ser caríssimas na Europa."],
        ["O que faziam os cartógrafos depois de novas viagens?","Melhoravam os seus mapas",["Erguiam pirâmides","Mudavam estrelas de sítio","Mudavam o tempo"],"Juntavam-se novos conhecimentos.","Os relatos de viagem ajudaram a tornar os mapas mais rigorosos.","Os mapas ficaram mais pormenorizados ao longo dos séculos."]
      ]
    },
    wetenschap: {
      slimme_proefjes: [
        ["O que costuma acontecer quando misturas bicarbonato e vinagre?","Aparecem bolhas de gás",["Congela logo","Transforma-se em metal","Não acontece nada"],"Vês muita espuma.","A reação produz dióxido de carbono, entre outras coisas.","Esse gás pode, por exemplo, encher um balão."],
        ["Porque é que usas óculos de proteção em algumas experiências?","Para proteger os olhos",["Para ouvires melhor","Para correres mais depressa","Por causa da cor"],"Algumas substâncias podem salpicar.","Os óculos de proteção protegem os teus olhos.","Trabalhar em segurança é uma parte importante da ciência."],
        ["O que é uma hipótese?","Uma previsão que se pode testar",["Um facto comprovado","Um instrumento de medida","Um líquido"],"Decides o que esperas antes de testar.","Uma hipótese é uma previsão que podes investigar.","Depois da experiência, a hipótese pode ou não confirmar-se."],
        ["Numa experiência justa, o que deves manter o mais igual possível?","As outras condições",["O resultado","A pergunta","O teu nome"],"Queres mudar só uma coisa de cada vez.","Controlar as variáveis torna a experiência mais justa.","Assim sabes melhor o que causou o efeito."],
        ["O que usas para medir com rigor o volume de um líquido?","Uma proveta",["Uma lupa","Uma bússola","Um cronómetro"],"Tem marcas de lado.","A proveta mede o volume.","O volume costuma ser medido em mililitros."],
        ["O que faz um termómetro numa experiência?","Mede a temperatura",["Mede o tempo","Mede o peso","Faz luz"],"Com ele medes o quente e o frio.","O termómetro mede a temperatura.","Cá costumamos usar graus Celsius."],
        ["Porque é que apontas os resultados de uma experiência?","Para os poderes comparar",["Para os esqueceres","Para limpar o vidro","Para enfeitar"],"Os cientistas registam as suas medições.","Registar os resultados ajuda a analisar e a repetir.","A boa ciência tem de poder ser verificada."],
        ["O que acontece ao gelo quando o aqueces?","Derrete",["Vira pedra","Desaparece logo","Fica mais pesado"],"A água sólida passa a líquida.","O gelo derrete e transforma-se em água.","À pressão normal, o gelo derrete perto dos 0 °C."],
        ["De que precisas para fazer uma sombra?","Uma fonte de luz e um objeto",["Som","Água","Vento"],"O objeto bloqueia a luz.","A sombra aparece quando a luz é bloqueada.","O tamanho dela muda com a distância à fonte de luz."],
        ["O que é dissolver, como o açúcar na água?","A substância espalha-se no líquido",["A substância sai do mundo","A substância vira fogo","O líquido congela"],"Já não vês os grãos separados.","As partículas dissolvidas espalham-se pelo líquido.","Se a água evaporar, recuperas o açúcar."]
      ],
      lichaam: [
        ["Que órgão bombeia o sangue pelo corpo?","Coração",["Pulmões","Estômago","Cérebro"],"Sentes-o a bater.","O coração bombeia o sangue.","O teu coração bate cerca de cem mil vezes por dia."],
        ["Com que respiras sobretudo?","Pulmões",["Rins","Estômago","Ossos"],"Ficam dentro do peito.","Os pulmões captam o oxigénio.","Normalmente tens dois pulmões."],
        ["Que órgão te ajuda a pensar?","Cérebro",["Fígado","Coração","Intestinos"],"Fica dentro do crânio.","O cérebro trata informação e controla muitas funções do corpo.","Ali trabalham juntos milhares de milhões de neurónios."],
        ["O que transporta o sangue pelo corpo?","Oxigénio e nutrientes",["Ar","Ossos","Calor"],"O sangue viaja pelos vasos sanguíneos.","O sangue leva oxigénio e nutrientes, entre outras coisas.","Os glóbulos vermelhos ajudam a transportar o oxigénio."],
        ["Onde começa logo a digestão da comida?","Na boca",["No pé","Nos pulmões","Na orelha"],"Mastigas a comida em pedaços pequenos.","A digestão começa na boca.","A saliva tem substâncias que ajudam a desfazer a comida."],
        ["O que protegem as costelas?","Coração e pulmões",["Os teus pés","Os teus dentes","Os teus dedos"],"Formam uma gaiola à volta do peito.","As costelas protegem órgãos importantes.","A maioria das pessoas tem 12 pares de costelas."],
        ["Além de sustentar, para que servem os ossos?","Proteção e movimento",["Cor","Sono","Temperatura"],"Os músculos puxam os ossos.","Os ossos dão sustentação e proteção e ajudam no movimento.","As células do sangue são feitas na medula óssea."],
        ["O que fazem os músculos?","Contraem-se e criam movimento",["Fazem sangue","Digerem a comida","Veem a luz"],"Os músculos trabalham juntamente com os ossos.","Os músculos contraem-se e assim provocam movimento.","O teu corpo tem centenas de músculos."],
        ["O que é a pele?","O maior órgão do corpo",["Um osso","Um músculo","Um vaso sanguíneo"],"Cobre o corpo todo.","A pele protege o corpo.","A pele também ajuda a regular a temperatura."],
        ["Que sentido usas com os ouvidos?","Audição",["Paladar","Olfato","Visão"],"Captas ondas sonoras.","Com os ouvidos percebes os sons.","O ouvido interno também ajuda no equilíbrio."]
      ],
      uitvindingen: [
        ["O que usas para ver coisas muito pequenas?","Microscópio",["Telescópio","Bússola","Barómetro"],"Pensa em células e bactérias.","O microscópio amplia objetos pequenos.","Os microscópios modernos ampliam muitíssimo."],
        ["Com que olhas para estrelas e planetas distantes?","Telescópio",["Microscópio","Termómetro","Íman"],"Torna mais fácil ver objetos distantes.","O telescópio capta a luz de objetos distantes.","Há telescópios na Terra e no espaço."],
        ["Que invenção tornou a cópia de livros muito mais rápida?","A prensa de impressão",["Bússola","Apito a vapor","Lanterna"],"Os textos podiam ser impressos com letras móveis.","A prensa tornou possível produzir livros em massa.","Isso ajudou o conhecimento a espalhar-se mais depressa."],
        ["Para que serve uma pilha?","Guardar e dar energia elétrica",["Medir o vento","Ferver água sem energia","Fazer estrelas"],"Encontras uma em muitos aparelhos.","A pilha fornece energia elétrica.","As baterias recarregáveis podem ser usadas outra vez."],
        ["O que faz um íman?","Pode atrair certos metais",["Faz sempre luz","Congela a água","Para o tempo"],"O ferro reage bem a ele.","Os ímanes exercem força sobre materiais magnéticos.","Um íman tem um polo norte e um polo sul."],
        ["O que produz um painel solar?","Eletricidade a partir da luz",["Chuva a partir das nuvens","Gasolina a partir do ar","Som a partir de pedras"],"O Sol fornece a energia.","As células solares transformam luz em eletricidade.","Os painéis solares não precisam de peças que se mexem."],
        ["O que faz um motor?","Transforma energia em movimento",["Faz cores","Congela a água","Lê papel"],"Os carros e as máquinas usam motores.","Um motor converte energia em movimento.","Há motores elétricos e de combustão."],
        ["Porque é que o telefone foi uma invenção importante?","Dava para falar à distância",["As pessoas podiam voar","Dava para parar o tempo","Viver sem energia"],"O som era enviado à distância.","O telefone mudou muito a comunicação.","Hoje os telemóveis juntam muitas funções."],
        ["O que faz sobretudo um computador?","Trata informação",["Faz música","Dá luz","Purifica a água"],"Executa instruções.","Os computadores tratam dados de acordo com programas.","Até um relógio inteligente tem um computador."],
        ["Que invenção usa ondas de rádio para saber a posição?","GPS",["Íman","Microscópio","Estetoscópio"],"Os satélites ajudam a saber onde estás.","O GPS usa sinais de satélites.","O teu telemóvel usa o GPS para navegar."]
      ],
      natuur_energie: [
        ["Que fonte de energia usa o ar em movimento?","Energia eólica",["Energia solar","Gás natural","Energia nuclear"],"As turbinas rodam por causa dele.","As turbinas eólicas transformam o vento em eletricidade.","Turbinas grandes podem abastecer muitas casas."],
        ["Que fonte de energia usa a luz do Sol?","Energia solar",["Carvão","Petróleo","Gás natural"],"Os painéis captam a luz.","Os painéis solares transformam luz em eletricidade.","O Sol fornece muito mais energia do que a que usamos no mundo."],
        ["O que é energia renovável?","Energia de fontes que se renovam",["Energia que nunca é usada","Gasolina","Carvão"],"Pensa no sol e no vento.","As fontes renováveis não se esgotam depressa.","A energia hídrica e a geotérmica também podem ser renováveis."],
        ["O que faz uma turbina eólica?","Transforma vento em eletricidade",["Faz chuva","Produz gasolina","Mexe as nuvens"],"As pás rodam com o vento.","Um gerador dentro da turbina produz eletricidade.","Há turbinas eólicas em terra e no mar."],
        ["Que substância se liberta quando se queimam combustíveis fósseis?","Dióxido de carbono",["Oxigénio","Ouro","Hélio"],"É um gás com efeito de estufa.","Queimar petróleo, gás e carvão liberta CO₂.","Mais CO₂ reforça o efeito de estufa."],
        ["Porque é que isolamos as casas?","Para guardar melhor o calor",["Janelas mais pesadas","Para fazer água","Para melhorar o wi-fi"],"Um bom isolamento poupa energia.","O isolamento reduz a perda de calor.","Telhados, paredes e chãos podem ser isolados."],
        ["O que é a energia hídrica?","Energia da água que corre ou cai",["Energia da areia","Energia do fumo","Energia do plástico"],"Uma barragem e um rio podem mover turbinas.","As centrais hidroelétricas usam o movimento da água.","É uma fonte renovável importante no mundo, e muito no Brasil."],
        ["O que é poupar energia?","Gastar menos energia para o mesmo",["Acender mais lâmpadas","Janela aberta e aquecimento","Deixar aparelhos ligados"],"Os aparelhos eficientes ajudam.","Poupar energia reduz o consumo.","As lâmpadas LED gastam menos do que as lâmpadas antigas."],
        ["O que faz a bateria de um carro elétrico?","Guarda energia elétrica",["Faz gasolina","Mede o vento","Arrefece a água"],"Alimenta o motor elétrico.","A bateria guarda energia para andar.","Ao travar, às vezes recupera-se parte da energia."],
        ["Que lâmpada costuma ser mais económica?","Lâmpada LED",["Lâmpada incandescente","Vela","Lâmpada de halogéneo"],"Gasta menos eletricidade.","A iluminação LED é muito eficiente.","As lâmpadas LED também costumam durar mais."]
      ]
    },
    mysterie: {
      raadsels: [
        ["Tenho teclas, mas não sou computador nem porta. O que sou?","Piano",["Porta","Baú do tesouro","Bicicleta"],"Usas os dedos para me tocar.","O piano tem teclas que carregas.","Um piano pode ter mais de oitenta teclas."],
        ["Fico mais molhada enquanto seco. O que sou?","Toalha",["Chapéu de chuva","Sol","Uma esponja"],"Usas-me depois do duche.","A toalha fica molhada enquanto te seca.","As toalhas absorvem água com as suas fibras."],
        ["O que tem gargalo, mas não tem cabeça?","Garrafa",["Gato","Pessoa","Coruja"],"Podes beber por ela.","A garrafa tem gargalo.","As garrafas são feitas de vidro ou de plástico."],
        ["O que tem dentes, mas não morde?","Pente",["Tubarão","Cão","Leão"],"Usas no cabelo.","O pente tem dentes, mas não tem boca.","Os pentes existem há milhares de anos."],
        ["O que sobe, mas nunca desce?","A tua idade",["Um elevador","Uma bola","Um pássaro"],"Todos os anos fica maior.","A tua idade aumenta à medida que cresces.","No aniversário soma mais um ano."],
        ["O que tem ponteiros, mas não tem braços?","Relógio",["Robô","Pessoa","Macaco"],"Os ponteiros apontam para alguma coisa.","Um relógio analógico tem ponteiros.","Os ponteiros mostram as horas, os minutos e às vezes os segundos."],
        ["O que podes quebrar sem tocar?","Uma promessa",["Uma pedra","Um copo","Um ramo"],"Tem a ver com confiança.","Podes quebrar uma promessa sem tocar em nada.","As adivinhas costumam usar duplo sentido."],
        ["O que tem um olho, mas não vê?","Agulha",["Coruja","Pessoa","Câmara"],"A linha passa pelo olho.","A agulha tem um olho para a linha.","O olho fica geralmente numa das pontas."],
        ["O que fica maior quanto mais lhe tiras?","Um buraco",["Uma montanha","Uma caixa","Um livro"],"Pensa em cavar.","Quanto mais tiras de um buraco, maior ele fica.","É uma adivinha clássica de lógica."],
        ["O que corre, mas não tem pernas?","A água",["Cão","Pessoa","Cavalo"],"Corre pelos rios.","A água corre sem ter pernas.","As adivinhas de palavras brincam com vários sentidos."]
      ],
      verborgen_schatten: [
        ["O que usas para abrir um baú trancado?","Chave",["Pena","Mapa","Lupa"],"Entra na fechadura.","Com a chave certa abres a fechadura.","As fechaduras existem há milhares de anos."],
        ["O que costuma aparecer num mapa do tesouro?","Um X a marcar o sítio",["Um semáforo","Um código de barras","Um termómetro"],"O X marca o sítio.","Um X costuma marcar o sítio do tesouro.","Isto é famoso por causa das histórias de piratas."],
        ["Para que usas a bússola numa caça ao tesouro?","Para encontrar a direção",["Para pesar ouro","Para fazer chuva","Para cavar buracos"],"A agulha ajuda a encontrar o norte.","A bússola ajuda na navegação.","Uma bússola tradicional reage ao campo magnético da Terra."],
        ["O que é um compartimento secreto?","Um espaço escondido num objeto",["Uma praça aberta","Uma nuvem","A legenda de um mapa"],"Não o vês logo.","Um compartimento secreto esconde coisas.","Os móveis antigos às vezes tinham compartimentos secretos."],
        ["O que é uma pista?","Uma informação que te aproxima",["Sempre a resposta final","Um erro","Um enfeite"],"Um detetive procura-as.","As pistas ajudam a resolver um mistério.","Uma boa pista informa sem revelar tudo."],
        ["Porque é que às vezes numeras as pistas?","Para manter a ordem",["Para as tornar mais pesadas","Para as esconder","Para mudar as cores"],"Assim perdes-te menos.","Numerar ajuda a organizar.","Os detetives ordenam as provas para ver ligações."],
        ["Que sítio faz sentido para um tesouro escondido numa história?","Debaixo de uma pedra marcada",["No meio de uma mesa cheia","Num sinal de trânsito","Numa nuvem"],"Tem de ficar fora de vista.","Nas histórias, o tesouro fica em sítios secretos.","As histórias de tesouros usam símbolos fáceis de reconhecer."],
        ["O que é um código?","Um sistema para esconder informação",["Um tipo de fruta","Um instrumento musical","Uma nuvem"],"Tens de o decifrar.","Um código pode esconder informação.","A criptografia é a ciência da comunicação secreta."],
        ["O que significa decifrar?","Tornar um código compreensível",["Enterrar uma coisa","Queimar um mapa","Forjar uma chave"],"Procuras o significado por trás dos sinais.","Decifrar é ler informação codificada.","Alguns códigos usam números ou símbolos."],
        ["Porque teria um mapa do tesouro uma legenda?","Para explicar os símbolos",["Para tornar o mapa mais pesado","Para fazer som","Para ser à prova de água"],"A legenda diz o que os sinais significam.","A legenda do mapa explica os símbolos.","Os mapas normais também usam legendas."]
      ],
      natuurmysteries: [
        ["Porque é que a lagarta se transforma em borboleta?","Por causa da metamorfose",["Por causa do magnetismo","Por causa de um raio","Por causa da geada"],"O animal muda em diferentes fases da vida.","As borboletas passam pela metamorfose.","Do ovo passa a lagarta, a crisálida e depois a borboleta."],
        ["Porque é que às vezes vemos um arco-íris?","A luz curva-se e divide-se nas gotas",["As nuvens pintam-se","O Sol pisca","A Lua pinta o céu"],"A luz do Sol e a chuva trabalham juntas.","As gotas de água curvam e refletem a luz.","O arco-íris aparece do lado oposto ao Sol."],
        ["Porque é que o pirilampo brilha?","Por bioluminescência",["Por uma pilha","Guarda luz do Sol","Por causa de ímanes"],"Produz luz dentro do próprio corpo.","A bioluminescência é luz de uma reação química.","Alguns animais do mar também fazem a sua própria luz."],
        ["Porque é que os flamingos são cor-de-rosa?","Por pigmentos na comida",["Já nascem pintados","Por causa do Sol","Por causa da água fria"],"A alimentação deles tem pigmentos.","Os carotenoides da comida dão cor-de-rosa às penas.","Os flamingos jovens são bem mais acinzentados."],
        ["Porque é que os girassóis jovens costumam virar-se para o Sol?","Por heliotropismo",["Pela força do vento","Por magnetismo","Pela chuva"],"Reagem à luz.","Os girassóis jovens conseguem seguir o Sol.","As flores maduras costumam ficar viradas para leste."],
        ["Porque é que alguns animais têm camuflagem?","Para darem menos nas vistas",["Para crescerem mais depressa","Para cantarem mais alto","Para fazer mais calor"],"A cor e o padrão combinam com o ambiente.","A camuflagem ajuda a caçar ou a esconder-se.","Os chocos mudam de aspeto muito depressa."],
        ["O que causa sobretudo as marés?","A gravidade da Lua",["Turbinas eólicas","Os vulcões","As nuvens"],"A Lua puxa a água dos oceanos.","A Lua é a principal causa das marés.","O Sol também influencia as marés."],
        ["Porque é que os flocos de neve costumam ter seis lados?","Pela forma como a água cristaliza",["Por causa das turbinas eólicas","Por causa dos pássaros","Por causa da areia"],"O gelo forma um padrão fixo de cristal.","A estrutura molecular do gelo leva a uma simetria de seis lados.","Não há dois flocos grandes exatamente iguais."],
        ["Porque é que o céu costuma ser azul de dia?","A luz azul espalha-se mais",["O oceano pinta o céu","Por causa das árvores","Por causa das nuvens"],"A luz do Sol tem várias cores.","A atmosfera espalha bastante a luz azul.","Ao pôr do sol vemos mais vermelho e laranja."],
        ["Porque é que as osgas andam pelas paredes?","Pelinhos minúsculos nos dedos",["Ventosas com cola","Ímanes","Eletricidade"],"Os dedos delas tocam muito na superfície.","Estruturas microscópicas dão muita aderência.","Essas forças chamam-se forças de van der Waals."]
      ],
      speurtocht: [
        ["Para que usas um mapa de percurso?","Para seguir o caminho",["Para comer um puzzle","Para medir o tempo","Para fazer som"],"O mapa mostra para onde ir.","Um mapa de percurso ajuda na navegação.","Os símbolos podem marcar pontos importantes."],
        ["O que é um ponto de referência (waypoint)?","Um ponto marcado num percurso",["Uma senha secreta","Um tipo de animal","Uma moeda"],"Podes navegar até lá.","Os waypoints marcam locais num percurso.","Os aparelhos de GPS usam waypoints."],
        ["Que ferramenta ajuda a ver melhor pistas pequenas?","Lupa",["Martelo","Colher","Chapéu de chuva"],"Amplia os pormenores.","A lupa amplia pormenores pequenos.","Uma lente convexa curva os raios de luz."],
        ["Uma pegada é sobretudo um…","Rasto",["Planeta","Instrumento","Cor"],"Um detetive procura-os.","Uma pegada pode ser um rasto.","Os rastos podem dizer quem passou por um sítio."],
        ["Porque é que olhas bem à tua volta numa caça ao tesouro?","As pistas podem estar escondidas",["Para parar o tempo","Para fazer chuva","Para crescer mais depressa"],"Nem tudo está no meio do caminho.","Observar com atenção é importante numa busca.","As boas caças juntam olhar, pensar e mexer-se."],
        ["O que significa “vira à esquerda” num percurso?","Virar para o lado esquerdo",["Seguir em frente","Voltar para casa","Subir"],"Pensa na tua mão esquerda.","Virar à esquerda é virar para a esquerda.","As palavras de direção são importantes na navegação."],
        ["O que é uma coordenada?","Uma forma de indicar um sítio exato",["Um tipo de chave","Um rasto de animal","Um prémio"],"Os mapas e o GPS usam-nas.","As coordenadas descrevem uma posição.","A latitude e a longitude são exemplos."],
        ["O que fazes quando duas pistas se contradizem?","Verificas outra vez",["Escolhes uma qualquer","Deitas tudo fora","Rasgas o mapa"],"Talvez tenhas lido alguma coisa mal.","Verificar ajuda a encontrar erros.","Os bons investigadores verificam a sua informação."],
        ["Porque é que trabalhar em equipa é útil numa caça ao tesouro?","Juntam-se ideias e observações",["Alguém pode não fazer nada","Para esconder pistas","Para parar o tempo"],"Dois pares de olhos veem mais.","Trabalhar em conjunto pode resolver problemas mais depressa.","As equipas costumam dividir as tarefas."],
        ["Qual é o objetivo da última pista?","Levar-te ao sítio final",["Mandar-te à pergunta 1","Criar um mundo novo","Apagar o percurso"],"Leva-te à solução.","A última pista costuma levar à meta ou ao tesouro.","Uma boa caça avança passo a passo até ao fim."]
      ]
    },
    dieren: {
      snelle_dieren: [
        ["Qual é o animal terrestre mais rápido?","Chita",["Elefante","Panda","Hipopótamo"],"É um felino magro e malhado.","A chita é o animal terrestre mais rápido.","Numa corrida curta passa dos 90 km/h."],
        ["Que ave nada mais depressa?", "O pinguim", ["O cisne", "O pato", "A gaivota"], "Não sabe voar, mas nada muito bem.", "Um pinguim-papua passa dos trinta quilómetros por hora debaixo de água.", "As penas sobrepõem-se como telhas, por isso a água não passa."],
        ["Que ave é famosa pelos seus voos picados muito rápidos?","Falcão-peregrino",["Pinguim","Galinha","Avestruz"],"Caça a partir do ar.","O falcão-peregrino é um dos animais mais rápidos.","Em voo picado passa dos 300 km/h."],
        ["Porque é que um peixe rápido tem corpo aerodinâmico?","Para ter menos resistência",["Para ser mais pesado","Para cantar mais alto","Para apanhar mais ar"],"Uma forma lisa corta a água com mais facilidade.","A forma aerodinâmica reduz a resistência da água.","Os golfinhos também têm forma aerodinâmica."],
        ["Quem corre mais depressa: um cavalo ou uma tartaruga?","Cavalo",["Tartaruga","Os dois iguais","Nenhum dos dois"],"Tem pernas longas e fortes.","O cavalo é muito mais rápido do que a tartaruga.","A galope, os cavalos atingem grandes velocidades."],
        ["Porque é que as gazelas têm pernas longas?","Para correr e saltar",["Para nadar","Para cavar","Para voar"],"Vivem em planícies abertas.","As pernas longas ajudam as gazelas a fugir depressa.","A velocidade ajuda a escapar aos predadores."],
        ["Que tubarão é conhecido como nadador veloz?","Tubarão-mako",["Tubarão-baleia","Cavalo-marinho","Peixe-leão"],"Tem corpo aerodinâmico.","O tubarão-mako é um dos tubarões mais rápidos.","Caça peixes velozes."],
        ["O que ajuda a avestruz a correr depressa?","Pernas longas e fortes",["Asas para voar","Uma bexiga natatória","Garras para trepar"],"Não voa.","As avestruzes são corredoras rápidas.","Correm a dezenas de quilómetros por hora."],
        ["Porque é que a velocidade é útil para as presas?","Para escapar",["Para fazer crescer árvores","Para fazer frio","Para dormir"],"Os predadores tentam apanhá-las.","A velocidade aumenta a hipótese de sobreviver.","Algumas presas também fazem curvas rápidas."],
        ["Porque é que a velocidade é útil para os predadores?","Para apanhar a presa",["Para regar plantas","Para pintar penas","Para fazer ninhos"],"A caçada costuma ser bem curta.","A velocidade ajuda na perseguição.","Nem todos os predadores usam a velocidade; alguns fazem emboscadas."]
      ],
      baby_dieren: [
        ["Como se chama a cria do cão?", "Um cachorro", ["Um vitelo", "Um potro", "Um pintainho"], "É um cão acabado de nascer.", "Um cão bebé chama-se cachorro.", "Nascem cegos e surdos."],
        ["Como se chama a cria do gato?","Gatinho",["Potro","Cordeiro","Vitelo"],"É um gato muito novo.","Um gato jovem chama-se gatinho.","Os gatinhos dormem muito."],
        ["Como se chama a cria do cavalo?","Potro",["Cachorro","Pintainho","Leãozinho"],"Consegue pôr-se de pé muito depressa.","Um cavalo jovem chama-se potro.","Os potros tentam pôr-se de pé logo depois de nascer."],
        ["Como se chama a cria da ovelha?","Cordeiro",["Vitelo","Cachorro","Gatinho"],"Vês muitos na primavera.","Uma ovelha jovem chama-se cordeiro.","Os cordeiros mamam na mãe."],
        ["Como se chama a cria da vaca?","Vitelo",["Potro","Cordeiro","Pintainho"],"A cria do elefante tem outro nome.","Uma vaca jovem chama-se vitelo.","Os vitelos bebem leite no início."],
        ["Como se chama a cria da galinha?","Pintainho",["Leãozinho","Cachorro","Cordeiro"],"Sai de um ovo.","Um frango jovem chama-se pintainho.","Os pintainhos já piam antes de saírem do ovo."],
        ["Como se chama a cria do leão?", "Um leãozinho", ["Um potro", "Um vitelo", "Um gatinho"], "Fica muito tempo junto do bando.", "Um leão jovem chama-se leãozinho.", "Os mais novos ficam muito tempo com o grupo."],
        ["O que bebem primeiro muitas crias de mamíferos?","Leite",["Água salgada","Gasolina","Refrigerante"],"A mãe produz.","Os mamíferos alimentam as crias com leite.","Esta é uma característica importante dos mamíferos."],
        ["Porque é que muitas crias ficam perto da mãe?","Por proteção e comida",["Para voar mais depressa","Para trepar às árvores","Para fazer frio"],"Ainda têm muito para aprender.","Os pais protegem e cuidam das crias.","O tempo de cuidados varia muito entre espécies."],
        ["Que cria sai de um ovo?","Pintainho",["Cachorro","Vitelo","Potro"],"Pensa numa galinha.","O pintainho sai de um ovo.","Os répteis, os peixes e muitos outros animais também põem ovos."]
      ],
      waterdieren: [
        ["Que mamífero vive no mar e respira ar?","Golfinho",["Atum","Tubarão","Alforreca"],"Tem de vir à superfície com frequência.","Os golfinhos são mamíferos e respiram com pulmões.","Usam um orifício no topo da cabeça."],
        ["Que animal tem oito braços?","Polvo",["Tubarão","Golfinho","Caranguejo"],"Esconde-se muito bem.","O polvo tem oito braços.","Os polvos são moluscos muito inteligentes."],
        ["Que animal marinho é o maior animal da Terra?","Baleia-azul",["Tubarão-branco","Golfinho","Orca"],"É uma baleia enorme.","A baleia-azul é o maior animal conhecido.","Pode passar dos 25 metros de comprimento."],
        ["Como respira a maioria dos peixes?","Com guelras",["Com pulmões","Pela pele","Com penas"],"Tiram o oxigénio da água.","As guelras captam o oxigénio da água.","A água passa pelos filamentos das guelras."],
        ["O que ajuda os peixes a virar e a nadar?","Barbatanas",["Asas","Pernas","Pelos"],"Ficam nas costas, na barriga e na cauda.","As barbatanas ajudam no movimento e no equilíbrio.","A barbatana caudal dá muito impulso."],
        ["Que animal vive tanto no mar como em terra?","Tartaruga-marinha",["Atum","Alforreca","Cavalo-marinho"],"Vai à praia para pôr ovos.","As tartarugas-marinhas vivem no mar, mas põem ovos em terra.","As fêmeas costumam voltar à praia onde nasceram."],
        ["O que é, na verdade, o coral?","Uma colónia de animais pequenos",["Uma planta","Uma pedra","Um peixe"],"Forma recifes.","Os corais são formados por muitíssimos pólipos pequenos.","Os recifes de coral são habitats importantes."],
        ["Porque é que as baleias vêm à superfície?","Para respirar",["Para lavar as guelras","Para dormir na praia","Para cozinhar"],"São mamíferos.","As baleias respiram ar com pulmões.","Respiram por um orifício na cabeça."],
        ["Que animal tem carapaça dura e anda de lado?","Caranguejo",["Golfinho","Alforreca","Lula"],"Vês muitos nas praias.","Os caranguejos têm um esqueleto externo duro.","Muitos caranguejos andam de lado com facilidade."],
        ["Porque é que um corpo aerodinâmico é útil na água?","Reduz a resistência",["Faz mais barulho","Torna o animal mais pesado","Aquece a água"],"Os animais deslizam melhor pela água.","A forma aerodinâmica ajuda a nadar com mais eficiência.","Os golfinhos e os tubarões são bons exemplos."]
      ],
      jungle: [
        ["Que animal costuma balançar-se entre as árvores?","Macaco",["Elefante","Pinguim","Zebra"],"Usa os ramos para subir.","Muitas espécies de macacos vivem nas árvores.","Alguns macacos usam a cauda como apoio extra."],
        ["Que animal tem um bico grande e colorido?","Tucano",["Tigre","Gorila","Crocodilo"],"É uma ave tropical.","Os tucanos têm bicos impressionantes.","O bico deles é surpreendentemente leve."],
        ["Que animal grande vive em florestas tropicais e come muitas plantas?","Gorila",["Pinguim","Camelo","Urso-polar"],"É um grande primata.","Os gorilas vivem em florestas de África.","Comem sobretudo plantas."],
        ["Porque é que muitos animais da selva têm camuflagem?","Para darem menos nas vistas",["Para cantarem mais alto","Para fazer mais chuva","Para crescerem mais depressa"],"Os padrões combinam com folhas e sombras.","A camuflagem ajuda a caçar ou a esconder-se.","Muitos jaguares têm manchas que imitam sombras."],
        ["Que grande felino vive nas selvas das Américas?","Jaguar",["Leão","Leopardo-das-neves","Lince"],"Tem rosetas no pelo.","Os jaguares vivem em partes da América Central e do Sul.","Nadam muito bem."],
        ["Porque é que as árvores da floresta tropical são tão importantes?","Dão comida e abrigo",["Não fazem oxigénio","Param a chuva toda","São só enfeite"],"Muitos animais vivem em diferentes andares das árvores.","As árvores da floresta formam habitats complexos.","Alguns animais quase nunca descem ao chão."],
        ["Que réptil consegue mudar de cor?","Camaleão",["Tartaruga","Crocodilo","A cobra"],"Também usa a cor para comunicar.","Os camaleões ajustam o seu padrão de cores.","A mudança de cor ajuda na temperatura e nos sinais."],
        ["O que é uma floresta tropical?","Uma floresta quente com muita chuva",["Um deserto gelado","Um campo sem árvores","Um mar"],"É riquíssima em espécies.","As florestas tropicais recebem muitíssima chuva.","Estão entre os ecossistemas com mais biodiversidade."],
        ["Porque é que os macacos-uivadores gritam tão alto?","Para comunicar com o grupo",["Para fazer chuva","Para deitar árvores abaixo","Para nadar"],"O grito deles vai longe pela floresta.","Os macacos-uivadores usam sons altos para comunicar.","Uma estrutura na garganta amplifica o grito."],
        ["Que animal apanha insetos com uma língua comprida?","Camaleão",["Elefante","Gorila","Tucano"],"A língua dispara para a frente num instante.","Os camaleões apanham a presa com a língua comprida.","A língua acelera de forma extremamente rápida."]
      ]
    },
    aarde: {
      continenten_landen: [
        ["Em que continente ficam os Países Baixos?","Europa",["África","Ásia","América do Sul"],"Pensa nos países vizinhos.","Os Países Baixos ficam na Europa.","A Europa é um dos sete continentes."],
        ["Qual é o maior continente?","Ásia",["Europa","África","Oceânia"],"A China e a Índia ficam lá.","A Ásia é o maior continente.","Mais de metade das pessoas do mundo vive na Ásia."],
        ["Em que continente fica o Brasil?","América do Sul",["África","Europa","Ásia"],"Pensa na Amazónia.","O Brasil fica na América do Sul.","O Brasil é o maior país da América do Sul."],
        ["Em que continente fica a maior parte do Egito?","África",["Europa","Ásia","América do Norte"],"O Nilo passa por lá.","O Egito fica sobretudo em África.","A península do Sinai fica geograficamente na Ásia."],
        ["Qual é a capital de França?","Paris",["Roma","Madrid","Berlim"],"A Torre Eiffel fica lá.","Paris é a capital de França.","O rio Sena passa por Paris."],
        ["Qual é a capital de Itália?","Roma",["Milão","Veneza","Nápoles"],"O Coliseu fica lá.","Roma é a capital de Itália.","O Vaticano fica dentro de Roma."],
        ["Que país tem a forma de uma bota?","Itália",["Portugal","Noruega","Polónia"],"Olha para o sul da Europa.","A Itália parece uma bota.","A Sicília fica perto da ponta da bota."],
        ["Que oceano fica entre a Europa e a América?","Oceano Atlântico",["Oceano Pacífico","Oceano Índico","Oceano Ártico"],"Os navios atravessam-no.","O Oceano Atlântico fica entre a Europa, a África e a América.","É o segundo maior oceano."],
        ["Que continente fica no Polo Sul?","Antártida",["Europa","África","Ásia"],"Está coberto de gelo.","A Antártida fica à volta do Polo Sul.","É o continente mais frio."],
        ["Que país fica logo a este dos Países Baixos?","Alemanha",["Espanha","Irlanda","Itália"],"É um país vizinho.","A Alemanha faz fronteira com os Países Baixos.","Os Países Baixos também fazem fronteira com a Bélgica."]
      ],
      weer_klimaat: [
        ["O que mede um termómetro?","Temperatura",["Direção do vento","Quantidade de chuva","Pressão do ar"],"Quente ou frio.","O termómetro mede a temperatura.","Costumamos usar graus Celsius."],
        ["O que é a precipitação?","Água que cai do céu",["Vento","Luz do Sol","Nevoeiro"],"A chuva e a neve são exemplos.","A precipitação pode ser chuva, neve ou granizo.","Forma-se a partir da água das nuvens."],
        ["O que é o vento?","Ar em movimento",["Água em movimento","Areia quente","Uma nuvem"],"Sentes, mas não vês.","O vento é ar que se mexe.","As diferenças de pressão do ar causam boa parte do vento."],
        ["Porque é que se forma o nevoeiro?","O vapor condensa junto ao chão",["Por causa das estrelas","Por causa da areia","Por causa de ímanes"],"A visibilidade piora.","O nevoeiro é feito de gotinhas de água no ar.","O nevoeiro é, na verdade, uma nuvem ao nível do chão."],
        ["O que é o clima?","O tempo médio de muitos anos",["O tempo de hoje","Uma tempestade","Um pluviómetro"],"É sobre anos, não sobre um dia.","O clima descreve o tempo típico de um longo período.","O tempo pode mudar muito de um dia para o outro."],
        ["O que causa o relâmpago?","Uma descarga elétrica",["Uma estrela cadente","Um avião","Um arco-íris"],"Acontece muito com nuvens de trovoada.","O relâmpago é uma descarga elétrica enorme.","O ar à volta dele fica extremamente quente."],
        ["Porque é que ouves o trovão depois do relâmpago?","A luz é mais rápida que o som",["O trovão começa depois","As nuvens esperam","O Sol bloqueia o som"],"Primeiro vês o clarão.","A luz chega até ti muito mais depressa do que o som.","O intervalo ajuda a calcular a distância da trovoada."],
        ["Que nuvem costuma trazer chuva forte e trovões?","Cumulonimbus",["Cirrus","Nevoeiro","Nenhuma nuvem"],"Pode crescer até muito alto.","As nuvens cumulonimbus podem trazer trovoadas.","Costumam ter o topo em forma de bigorna."],
        ["O que é uma onda de calor?","Um período invulgarmente quente",["Um nevão repentino","Um sismo","Uma onda alta no mar"],"Dura vários dias.","Uma onda de calor é um período longo de calor forte.","As definições variam de país para país."],
        ["O que é a geada?","Temperatura abaixo de zero",["Vento forte","Chuva muito pesada","Nevoeiro cerrado"],"A água pode congelar.","Na geada, a temperatura desce até perto ou abaixo de 0 °C.","A geada branca forma-se quando o vapor de água congela."]
      ],
      oceanen_natuur: [
        ["O que cobre a maior parte da Terra?","Água",["Deserto","Floresta","Gelo"],"Os oceanos ocupam um espaço enorme.","Cerca de 71% da Terra está coberta por água.","A maior parte dessa água é salgada."],
        ["Qual é o maior oceano?","Oceano Pacífico",["Oceano Atlântico","Oceano Índico","Oceano Ártico"],"Fica entre a Ásia e a América.","O Pacífico é o maior oceano.","Cobre cerca de um terço da superfície da Terra."],
        ["Como se chama a rocha derretida que sai de um vulcão?","Lava",["Magma","Barro","Areia"],"É assim que lhe chamamos cá fora.","À superfície, a rocha derretida chama-se lava.","Debaixo do chão chamamos-lhe magma."],
        ["O que é uma ilha?","Terra toda rodeada de água",["Uma nuvem alta","Um rio","Um deserto"],"Tens de atravessar água para lá chegar.","Uma ilha está rodeada de água por todos os lados.","A Gronelândia é a maior ilha que não é um continente."],
        ["O que é uma cordilheira?","Uma série de montanhas",["Um rio largo","Um mar","Um grupo de ilhas"],"Os Andes são uma.","Uma cordilheira é feita de montanhas ligadas.","Os Himalaias têm as montanhas mais altas da Terra."],
        ["O que é a foz de um rio?","O sítio onde o rio acaba",["A nascente do rio","O topo de uma montanha","Um deserto"],"O rio costuma desaguar num mar ou num lago.","A foz é o fim de um rio.","Alguns rios formam um delta na foz."],
        ["O que é um deserto?","Uma zona com muito pouca chuva",["Sempre uma praia quente","Uma floresta tropical","Um oceano"],"Nem todos os desertos são quentes.","Os desertos recebem pouquíssima precipitação.","Na verdade, a Antártida também é um deserto."],
        ["O que é um glaciar?","Uma massa de gelo que se move devagar",["Uma nuvem","Um rio de lava","Uma duna de areia"],"Forma-se a partir de neve comprimida.","Os glaciares movem-se devagar com o próprio peso.","Moldam vales e paisagens."],
        ["O que é a erosão?","O desgaste e o transporte de rocha e solo",["Árvores a crescer","Estrelas a formar-se","Ar a congelar"],"A água e o vento podem causá-la.","A erosão muda as paisagens.","Os rios podem escavar vales profundos."],
        ["O que é um delta?","Zona onde um rio se divide na foz",["O topo de uma montanha","Uma corrente oceânica","Uma nuvem"],"Pode ter solo fértil.","Um delta forma-se com sedimentos depositados.","O delta do Nilo é um exemplo famoso."]
      ],
      kaarten_navigatie: [
        ["O que mostra uma rosa dos ventos?","As direções",["A temperatura","A altitude","Os fusos horários"],"Norte, este, sul e oeste.","A rosa dos ventos mostra as direções.","Os mapas costumam usar N, E, S e O."],
        ["Para que serve a legenda de um mapa?","Para explicar os símbolos",["Para enfeitar o mapa","Para medir distâncias","Para fazer vento"],"As cores e os sinais ganham significado.","A legenda explica os símbolos do mapa.","Uma linha azul pode representar um rio, por exemplo."],
        ["O que é a escala de um mapa?","A relação entre a distância no mapa e a distância real",["Um instrumento musical","Um medidor de temperatura","Um código de cores"],"1 cm pode significar 1 km, por exemplo.","A escala torna as distâncias do mapa compreensíveis.","Uma escala grande costuma mostrar mais pormenores."],
        ["O que são coordenadas?","Números que indicam um sítio",["Um tipo de nuvem","Uma moeda","Um rio"],"O GPS usa-as.","As coordenadas descrevem uma posição.","A latitude e a longitude são coordenadas conhecidas."],
        ["Que direção fica oposta ao norte?","Sul",["Este","Oeste","Nordeste"],"Pensa na rosa dos ventos.","O sul é o oposto do norte.","O este e o oeste fazem um ângulo reto com o norte e o sul."],
        ["Que direção fica à tua direita quando olhas para norte?","Este",["Oeste","Sul","Norte"],"Em muitos mapas, o norte fica em cima.","Com o norte em cima, o este fica à direita.","Por isso, nesse mapa, o oeste fica à esquerda."],
        ["O que é uma carta topográfica?","Um mapa com relevo e altitude",["Um mapa das estrelas","Uma ementa","Uma linha do tempo"],"Pode ter curvas de nível.","As cartas topográficas mostram a paisagem e a altitude.","Quem faz caminhadas costuma usá-las."],
        ["O que é o GPS?","Um sistema de satélites para saber a posição",["Um tipo de nuvem","Um vulcão","Uma bússola sem satélites"],"O teu telemóvel pode usá-lo.","O GPS usa sinais de satélites para saber a tua posição.","São precisos vários satélites para uma posição exata."],
        ["Porque é que o norte costuma ficar em cima nos mapas?","É uma convenção muito usada",["O norte é mais alto","O Sol está sempre lá","Os rios correm para lá"],"É uma convenção, não uma lei da natureza.","Muitos mapas modernos põem o norte em cima.","Os mapas antigos às vezes usavam outras orientações."],
        ["O que é uma rota?","Um caminho planeado até ao destino",["Uma nuvem de chuva","Uma montanha","Uma fronteira"],"A navegação ajuda a segui-la.","Uma rota descreve como ir de A a B.","Os mapas digitais calculam rotas automaticamente."]
      ]
    }
  };

  window.KWIZILLO_QUESTIONS_PTPT = window.KWIZILLO_BUILD_BANK(defs, window.KWIZILLO_EXTRA_PTPT||{}, window.KWIZILLO_MORE_PTPT||{});
})();
