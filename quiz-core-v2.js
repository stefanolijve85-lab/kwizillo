(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.KWIZILLO_CORE=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  function shuffle(items,rng=Math.random){const out=[...items];for(let i=out.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[out[i],out[j]]=[out[j],out[i]]}return out}
  function prepareQuestion(q,rng=Math.random){return{...q,options:shuffle(q.options||[],rng)}}
  function selectQuestions({questions,world,topicKey=null,grade=5,limit=10,rng=Math.random}){let pool=(questions||[]).filter(q=>q.world===world&&(!topicKey||q.topic===topicKey));const gradePool=pool.filter(q=>(q.groupMin||1)<=grade&&(q.groupMax||8)>=grade);if(gradePool.length>=Math.min(6,limit))pool=gradePool;return shuffle(pool,rng).slice(0,Math.min(limit,pool.length)).map(q=>prepareQuestion(q,rng))}
  // The letter is spoken as a plain label, never as "Antwoord A" / "Answer A"
  // (CLAUDE.md section 9). The trailing period gives the voice a natural fall.
  function buildQuestionSpeechSegments(q,{answers=true}={}){const labels=['A','B','C','D','E','F'];if(!answers)return[{kind:'question',text:q.prompt}];return[{kind:'question',text:q.prompt},...(q.options||[]).map((o,i)=>({kind:'answer',index:i,label:labels[i]||String(i+1),text:`${labels[i]||i+1}. ${o}.`}))]}
  function buildQuestionSpeech(q){return buildQuestionSpeechSegments(q).map(s=>s.text).join(' ').trim()}
  // Copy comes from the caller so this stays language-agnostic.
  function buildFeedbackSpeech(q,correct,copy={}){
    const parts=[];
    if(correct){
      parts.push(copy.good||'');
      parts.push(q.explanation||'');
    }else{
      parts.push((copy.tryAgain||'').replace('{answer}',q.answer));
      parts.push(q.explanation||q.hint||'');
    }
    if(q.fact&&copy.fact) parts.push(copy.fact.replace('{fact}',q.fact));
    return parts.filter(Boolean).join(' ').replace(/\s+/g,' ').trim();
  }
  function evaluateAnswer(q,value){return{correct:value===q.answer,answer:q.answer,selected:value}}
  function poolFor({questions,world,topicKey=null,grade=5}){
    let pool=(questions||[]).filter(q=>q.world===world&&(!topicKey||q.topic===topicKey));
    const graded=pool.filter(q=>(q.groupMin||1)<=grade&&(q.groupMax||8)>=grade);
    return graded.length>=6?graded:pool;
  }

  // Successive quizzes on the same world or topic draw unique batches until the
  // pool is used up, then the cycle restarts. A mixed world quiz has 40 questions,
  // so quizzes 1-4 never repeat. A single topic only holds 10, so it necessarily
  // recycles after one quiz; `recycled` reports that honestly to the caller.
  // Six game levels ("niveaus"). Each level shortens the time per question and
  // lowers the number of mistakes a ten-question quiz may contain before the
  // topic has to be played again. The question difficulty cap (1-4) follows.
  // `hints` is the number of hints a ten-question quiz may use (Infinity =
  // free). The voice reads the question and the four answers on every level
  // (the clock only starts once it is done); `readAnswers` stays as the switch.
  // `band` is the difficulty window a level draws from first (questions carry
  // difficulty 1-4: the base set is 1-2, the advanced set 3-4). A batch fills
  // up from the nearest difficulties when the window runs dry.
  const LEVELS=[
    {seconds:30,maxWrong:6,cap:1,band:[1,1],hints:Infinity,readAnswers:true},
    {seconds:25,maxWrong:5,cap:2,band:[1,2],hints:Infinity,readAnswers:true},
    {seconds:20,maxWrong:4,cap:2,band:[2,3],hints:3,readAnswers:true},
    {seconds:16,maxWrong:3,cap:3,band:[3,3],hints:2,readAnswers:true},
    {seconds:13,maxWrong:2,cap:4,band:[3,4],hints:1,readAnswers:true},
    {seconds:10,maxWrong:0,cap:4,band:[4,4],hints:0,readAnswers:true}
  ];
  const levelRule=n=>LEVELS[Math.max(1,Math.min(LEVELS.length,Number(n)||1))-1];
  function questionSeconds(niveau=1){return levelRule(niveau).seconds}
  function maxWrong(niveau=1){return levelRule(niveau).maxWrong}
  function difficultyCap({niveau=1}={}){return levelRule(niveau).cap}
  function difficultyBand({niveau=1}={}){return levelRule(niveau).band}
  function hintsAllowed(niveau=1){return levelRule(niveau).hints}
  function readsAnswers(niveau=1){return levelRule(niveau).readAnswers}
  function quizPassed({score=0,total=10,niveau=1}){return (total-score)<=maxWrong(niveau)}
  function selectQuizBatch({questions,world,topicKey=null,grade=5,limit=10,usedIds=[],rng=Math.random,maxDifficulty=4,band=null}){
    const pool=poolFor({questions,world,topicKey,grade});
    if(!pool.length) return{questions:[],usedIds:[],recycled:false,poolSize:0};
    const used=new Set(usedIds);
    let available=pool.filter(q=>!used.has(q.id));
    let recycled=false;
    if(available.length<Math.min(limit,pool.length)){ available=pool; recycled=true }
    // Questions inside the level's difficulty window come first; the rest fill
    // up a batch by distance to the window (a level-1 quiz reaches for 2s
    // before 3s, a level-6 quiz for 3s before 2s). The whole pool still
    // cycles, so successive mixed quizzes of a world stay unique.
    const [lo,hi]=band||[1,maxDifficulty];
    const dist=q=>{const d=q.difficulty||1;return d<lo?lo-d:d>hi?d-hi:0};
    const inside=shuffle(available.filter(q=>dist(q)===0),rng);
    const outside=shuffle(available.filter(q=>dist(q)>0),rng).sort((a,b)=>dist(a)-dist(b));
    let order=[...inside,...outside];
    // A recycled batch must not open with the question the player just saw last.
    const lastSeen=usedIds[usedIds.length-1];
    if(recycled&&order.length>1&&order[0].id===lastSeen) order=[...order.slice(1),order[0]];
    const picked=order.slice(0,Math.min(limit,pool.length)).map(q=>prepareQuestion(q,rng))
      .sort((a,b)=>(a.difficulty||1)-(b.difficulty||1));
    const nextUsed=recycled?picked.map(q=>q.id):[...usedIds,...picked.map(q=>q.id)];
    return{questions:picked,usedIds:nextUsed,recycled,poolSize:pool.length};
  }

  function createSession({world,topicKey=null,topicLabel='',questions=[],quizNumber=1}){return{world,topicKey,topicLabel,questions,quizNumber,index:0,score:0,xp:0,answeredById:{}}}
  // value === null records a time-out: counted as answered and wrong.
  function recordAnswer(session,q,value){if(!session||!q)return{accepted:false,reason:'invalid'};if(session.answeredById?.[q.id])return{accepted:false,reason:'already-answered'};session.answeredById||={};const result=evaluateAnswer(q,value);session.answeredById[q.id]={value,correct:result.correct,timedOut:value===null};if(result.correct){session.score++;session.xp+=q.xp||10}return{accepted:true,timedOut:value===null,...result}}

  // Picks a subject illustration from the wording of a question. Word-boundary
  // matches only, and no term that means one thing in Dutch and something else
  // inside an English word: "long" is Dutch for lung but matches "long legs",
  // "hart" sits inside "chart", "rib" inside "scribes". Those sent sea charts and
  // gazelles to the anatomy picture. Returns null when no subject clearly applies,
  // which leaves the question to its topic illustration.
  const SUBJECT_ART=[
    ['dissolve',/\b(oplossen|opgelost|oplost|suiker|dissolve|dissolves|dissolving|sugar)\b/],
    ['light',/\b(schaduw|schaduwen|spiegel|shadow|shadows|mirror)\b/],
    // "orgaan/organ" is deliberately not in this list: a church organ is not a
    //  body part, and the word alone sent kunst-muziek to the anatomy picture.
    ['body',/\b(spier|spieren|hersenen|skelet|bloedvaten|muscle|muscles|skeleton)\b/],
    ['castle',/\b(ridder|ridders|kasteel|kastelen|middeleeuws|middeleeuwse|harnas|slotgracht|knight|knights|castle|castles|medieval|armour)\b/]
  ];
  function questionArtKind(q){
    const p=String(q?.prompt||'').toLowerCase();
    for(const [kind,re] of SUBJECT_ART) if(re.test(p)) return kind;
    return null;
  }

  // Digits are spoken as words before they reach the voice. Measured on
  // eleven_multilingual_v2: "B. 7." was voiced as English "Bay seven" inside a
  // Dutch quiz, and "A. 8." in English became "Uh, 80"; "B. zeven." and
  // "A. eight." came back correctly. Display text is never touched, only speech.
  const NL_ONES=['nul','een','twee','drie','vier','vijf','zes','zeven','acht','negen','tien','elf','twaalf','dertien','veertien','vijftien','zestien','zeventien','achttien','negentien'];
  const NL_TENS=['','','twintig','dertig','veertig','vijftig','zestig','zeventig','tachtig','negentig'];
  const EN_ONES=['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
  const EN_TENS=['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];
  function nlNumber(n){
    if(n<20) return NL_ONES[n];
    if(n<100){const t=Math.floor(n/10),o=n%10;return o?`${NL_ONES[o]}${/[eë]$/.test(NL_ONES[o])?'ën':'en'}${NL_TENS[t]}`:NL_TENS[t]}
    if(n<1000){const h=Math.floor(n/100),r=n%100;return (h===1?'honderd':NL_ONES[h]+'honderd')+(r?nlNumber(r):'')}
    if(n<1000000){const k=Math.floor(n/1000),r=n%1000;return (k===1?'duizend':nlNumber(k)+'duizend')+(r?' '+nlNumber(r):'')}
    return String(n);
  }
  function enNumber(n){
    if(n<20) return EN_ONES[n];
    if(n<100){const t=Math.floor(n/10),o=n%10;return EN_TENS[t]+(o?'-'+EN_ONES[o]:'')}
    if(n<1000){const h=Math.floor(n/100),r=n%100;return EN_ONES[h]+' hundred'+(r?' and '+enNumber(r):'')}
    if(n<1000000){const k=Math.floor(n/1000),r=n%1000;return enNumber(k)+' thousand'+(r?(r<100?' and ':' ')+enNumber(r):'')}
    return String(n);
  }
  // Brazilian Portuguese numbers 0-9999 ("e" between all groups: cento e vinte e três).
  const PT_ONES=['zero','um','dois','três','quatro','cinco','seis','sete','oito','nove','dez','onze','doze','treze','quatorze','quinze','dezesseis','dezessete','dezoito','dezenove'];
  const PT_TENS=['','','vinte','trinta','quarenta','cinquenta','sessenta','setenta','oitenta','noventa'];
  const PT_HUNDREDS=['','cento','duzentos','trezentos','quatrocentos','quinhentos','seiscentos','setecentos','oitocentos','novecentos'];
  function ptNumber(n){
    if(n<20) return PT_ONES[n];
    if(n<100){const t=Math.floor(n/10),o=n%10;return PT_TENS[t]+(o?' e '+PT_ONES[o]:'')}
    if(n===100) return 'cem';
    if(n<1000){const h=Math.floor(n/100),r=n%100;return PT_HUNDREDS[h]+(r?' e '+ptNumber(r):'')}
    if(n<1000000){const k=Math.floor(n/1000),r=n%1000;return (k===1?'mil':ptNumber(k)+' mil')+(r?(r<100||r%100===0?' e ':' ')+ptNumber(r):'')}
    return String(n);
  }
  // German, Spanish, French, Italian, Russian and Danish, written the way each
  // language writes numbers out loud: German and Italian as one word, French with
  // "soixante-dix"/"quatre-vingts", Danish with "enogtyve", Russian with the
  // thousands agreeing with the count ("одна тысяча", "две тысячи", "пять тысяч").
  const DE_ONES=['null','eins','zwei','drei','vier','fünf','sechs','sieben','acht','neun','zehn','elf','zwölf','dreizehn','vierzehn','fünfzehn','sechzehn','siebzehn','achtzehn','neunzehn'];
  const DE_TENS=['','','zwanzig','dreißig','vierzig','fünfzig','sechzig','siebzig','achtzig','neunzig'];
  function deNumber(n){
    if(n<20) return DE_ONES[n];
    if(n<100){const t=Math.floor(n/10),o=n%10;return o?`${o===1?'ein':DE_ONES[o]}und${DE_TENS[t]}`:DE_TENS[t]}
    if(n<1000){const h=Math.floor(n/100),r=n%100;return `${h===1?'ein':DE_ONES[h]}hundert${r?deNumber(r):''}`}
    if(n<1000000){const k=Math.floor(n/1000),r=n%1000;return `${k===1?'ein':deNumber(k)}tausend${r?deNumber(r):''}`}
    return String(n);
  }
  const ES_ONES=['cero','uno','dos','tres','cuatro','cinco','seis','siete','ocho','nueve','diez','once','doce','trece','catorce','quince','dieciséis','diecisiete','dieciocho','diecinueve'];
  const ES_TENS=['','','veinte','treinta','cuarenta','cincuenta','sesenta','setenta','ochenta','noventa'];
  const ES_HUNDREDS=['','ciento','doscientos','trescientos','cuatrocientos','quinientos','seiscientos','setecientos','ochocientos','novecientos'];
  const ES_VEINTI={2:'dós',3:'trés',6:'séis'};   // veintidós, veintitrés, veintiséis
  function esNumber(n){
    if(n<20) return ES_ONES[n];
    if(n<30){const o=n%10;return o?'veinti'+(ES_VEINTI[o]||ES_ONES[o]):'veinte'}
    if(n<100){const t=Math.floor(n/10),o=n%10;return ES_TENS[t]+(o?' y '+ES_ONES[o]:'')}
    if(n===100) return 'cien';
    if(n<1000){const h=Math.floor(n/100),r=n%100;return ES_HUNDREDS[h]+(r?' '+esNumber(r):'')}
    if(n<1000000){const k=Math.floor(n/1000),r=n%1000;return (k===1?'mil':esNumber(k)+' mil')+(r?' '+esNumber(r):'')}
    return String(n);
  }
  const FR_ONES=['zéro','un','deux','trois','quatre','cinq','six','sept','huit','neuf','dix','onze','douze','treize','quatorze','quinze','seize','dix-sept','dix-huit','dix-neuf'];
  const FR_TENS={2:'vingt',3:'trente',4:'quarante',5:'cinquante',6:'soixante',8:'quatre-vingt'};
  function frNumber(n){
    if(n<20) return FR_ONES[n];
    if(n<100){
      const t=Math.floor(n/10),o=n%10;
      // Seventy and ninety are counted on from sixty and eighty: soixante-dix, quatre-vingt-onze.
      if(t===7||t===9){const rest=n-(t===7?60:80);return (t===7?'soixante':'quatre-vingt')+(rest===11&&t===7?' et onze':'-'+FR_ONES[rest])}
      if(t===8&&o===0) return 'quatre-vingts';
      return FR_TENS[t]+(o===0?'':o===1&&t!==8?' et un':'-'+FR_ONES[o]);
    }
    if(n<1000){const h=Math.floor(n/100),r=n%100;return (h===1?'cent':FR_ONES[h]+' cent'+(r?'':'s'))+(r?' '+frNumber(r):'')}
    if(n<1000000){const k=Math.floor(n/1000),r=n%1000;return (k===1?'mille':frNumber(k)+' mille')+(r?' '+frNumber(r):'')}
    return String(n);
  }
  const IT_ONES=['zero','uno','due','tre','quattro','cinque','sei','sette','otto','nove','dieci','undici','dodici','tredici','quattordici','quindici','sedici','diciassette','diciotto','diciannove'];
  const IT_TENS=['','','venti','trenta','quaranta','cinquanta','sessanta','settanta','ottanta','novanta'];
  function itWord(n){
    if(n<20) return IT_ONES[n];
    // The tens drop their vowel before uno and otto: ventuno, ventotto.
    if(n<100){const t=Math.floor(n/10),o=n%10;if(!o)return IT_TENS[t];return (o===1||o===8?IT_TENS[t].slice(0,-1):IT_TENS[t])+IT_ONES[o]}
    if(n<1000){const h=Math.floor(n/100),r=n%100;return (h===1?'cento':IT_ONES[h]+'cento')+(r?itWord(r):'')}
    if(n<1000000){const k=Math.floor(n/1000),r=n%1000;return (k===1?'mille':itWord(k)+'mila')+(r?itWord(r):'')}
    return String(n);
  }
  // A compound that ends in tre takes the accent: ventitré, centotré, duemilatré.
  function itNumber(n){const w=itWord(n);return w.length>3&&w.endsWith('tre')?w.slice(0,-3)+'tré':w}
  const RU_ONES=['ноль','один','два','три','четыре','пять','шесть','семь','восемь','девять','десять','одиннадцать','двенадцать','тринадцать','четырнадцать','пятнадцать','шестнадцать','семнадцать','восемнадцать','девятнадцать'];
  const RU_TENS=['','','двадцать','тридцать','сорок','пятьдесят','шестьдесят','семьдесят','восемьдесят','девяносто'];
  const RU_HUNDREDS=['','сто','двести','триста','четыреста','пятьсот','шестьсот','семьсот','восемьсот','девятьсот'];
  function ruNumber(n,fem){
    if(n<20) return fem&&n===1?'одна':fem&&n===2?'две':RU_ONES[n];
    if(n<100){const t=Math.floor(n/10),o=n%10;return RU_TENS[t]+(o?' '+ruNumber(o,fem):'')}
    if(n<1000){const h=Math.floor(n/100),r=n%100;return RU_HUNDREDS[h]+(r?' '+ruNumber(r,fem):'')}
    if(n<1000000){
      const k=Math.floor(n/1000),r=n%1000,m=k%100,u=k%10;
      const word=(m>=11&&m<=14)?'тысяч':u===1?'тысяча':(u>=2&&u<=4)?'тысячи':'тысяч';
      return ruNumber(k,true)+' '+word+(r?' '+ruNumber(r):'');
    }
    return String(n);
  }
  const DA_ONES=['nul','en','to','tre','fire','fem','seks','syv','otte','ni','ti','elleve','tolv','tretten','fjorten','femten','seksten','sytten','atten','nitten'];
  const DA_TENS=['','','tyve','tredive','fyrre','halvtreds','tres','halvfjerds','firs','halvfems'];
  function daNumber(n){
    if(n<20) return DA_ONES[n];
    if(n<100){const t=Math.floor(n/10),o=n%10;return o?`${DA_ONES[o]}og${DA_TENS[t]}`:DA_TENS[t]}
    if(n<1000){const h=Math.floor(n/100),r=n%100;return `${h===1?'et':DA_ONES[h]} hundrede${r?' og '+daNumber(r):''}`}
    if(n<1000000){const k=Math.floor(n/1000),r=n%1000;return `${k===1?'et':daNumber(k)} tusind${r?' og '+daNumber(r):''}`}
    return String(n);
  }
  // Arabic counts units before tens ("واحد وعشرون"), has its own words for the
  // hundreds, and a dual for two thousand. Read aloud, not written: the digits
  // stay on screen.
  const AR_ONES=['صفر','واحد','اثنان','ثلاثة','أربعة','خمسة','ستة','سبعة','ثمانية','تسعة','عشرة'];
  const AR_TEENS=['','أحد عشر','اثنا عشر','ثلاثة عشر','أربعة عشر','خمسة عشر','ستة عشر','سبعة عشر','ثمانية عشر','تسعة عشر'];
  const AR_TENS=['','','عشرون','ثلاثون','أربعون','خمسون','ستون','سبعون','ثمانون','تسعون'];
  const AR_HUNDREDS=['','مئة','مئتان','ثلاثمئة','أربعمئة','خمسمئة','ستمئة','سبعمئة','ثمانمئة','تسعمئة'];
  function arNumber(n){
    if(n<=10) return AR_ONES[n];
    if(n<20) return AR_TEENS[n-10];
    if(n<100){const t=Math.floor(n/10),o=n%10;return o?`${AR_ONES[o]} و${AR_TENS[t]}`:AR_TENS[t]}
    if(n<1000){const h=Math.floor(n/100),r=n%100;return AR_HUNDREDS[h]+(r?` و${arNumber(r)}`:'')}
    if(n<1000000){
      const k=Math.floor(n/1000),r=n%1000;
      // 11 to 99 thousand take the accusative singular ("أحد عشر ألفًا"); from a
      // hundred thousand on it is the plain singular ("مئة ألف").
      const word=k===1?'ألف':k===2?'ألفان':k<=10?`${AR_ONES[k]} آلاف`:k<100?`${arNumber(k)} ألفًا`:`${arNumber(k)} ألف`;
      return word+(r?` و${arNumber(r)}`:'');
    }
    const m=Math.floor(n/1000000),r=n%1000000;
    const word=m===1?'مليون':m===2?'مليونان':m<=10?`${AR_ONES[m]} ملايين`:m<100?`${arNumber(m)} مليونًا`:`${arNumber(m)} مليون`;
    return word+(r?` و${arNumber(r)}`:'');
  }
  const NUMBER_WORDS={nl:nlNumber,en:enNumber,pt:ptNumber,de:deNumber,es:esNumber,fr:frNumber,it:itNumber,ru:ruNumber,da:daNumber,ar:arNumber};
  // 1100 to 1999 the way people say years (and "1500 metres") in these four
  // languages: in hundreds, not thousands. "negentienhonderdzevenendertig",
  // "nineteen thirty-seven", "neunzehnhundertsiebenunddreißig", "nitten hundrede
  // og syvogtredive". French, Spanish, Italian and Portuguese say years with
  // "mille/mil" anyway, so they keep their plain numbers.
  const HUNDREDS={
    nl:(hi,lo)=>`${nlNumber(hi)}honderd${lo?nlNumber(lo):''}`,
    en:(hi,lo)=>`${enNumber(hi)} ${lo===0?'hundred':lo<10?'oh '+enNumber(lo):enNumber(lo)}`,
    de:(hi,lo)=>`${deNumber(hi)}hundert${lo?deNumber(lo):''}`,
    da:(hi,lo)=>`${daNumber(hi)} hundrede${lo?' og '+daNumber(lo):''}`
  };
  const UNITS={
    pt:[[/\s*%/g,' por cento'],[/\bkm\/h\b/g,'quilômetros por hora'],[/\b1 km\b/g,'1 quilômetro'],[/\bkm\b/g,'quilômetros'],[/\s*°\s*C\b/g,' graus Celsius'],[/\b1 cm\b/g,'1 centímetro'],[/\bcm\b/g,'centímetros']],
    nl:[[/\s*%/g,' procent'],[/\bkm\/u\b/g,'kilometer per uur'],[/\bkm\b/g,'kilometer'],[/\s*°\s*C\b/g,' graden Celsius'],[/\bcm\b/g,'centimeter']],
    // English units pluralise, so "1 cm" must become "one centimetre".
    en:[[/\s*%/g,' percent'],[/\b1 km\/h\b/g,'1 kilometre per hour'],[/\bkm\/h\b/g,'kilometres per hour'],[/\b1 km\b/g,'1 kilometre'],[/\bkm\b/g,'kilometres'],[/\s*°\s*C\b/g,' degrees Celsius'],[/\b1 cm\b/g,'1 centimetre'],[/\bcm\b/g,'centimetres']],
    de:[[/\s*%/g,' Prozent'],[/\bkm\/h\b/g,'Kilometer pro Stunde'],[/\bkm\b/g,'Kilometer'],[/\s*°\s*C\b/g,' Grad Celsius'],[/\bcm\b/g,'Zentimeter']],
    es:[[/\s*%/g,' por ciento'],[/\bkm\/h\b/g,'kilómetros por hora'],[/\b1 km\b/g,'1 kilómetro'],[/\bkm\b/g,'kilómetros'],[/\s*°\s*C\b/g,' grados Celsius'],[/\b1 cm\b/g,'1 centímetro'],[/\bcm\b/g,'centímetros']],
    fr:[[/\s*%/g,' pour cent'],[/\bkm\/h\b/g,'kilomètres par heure'],[/\b1 km\b/g,'1 kilomètre'],[/\bkm\b/g,'kilomètres'],[/\s*°\s*C\b/g,' degrés Celsius'],[/\b1 cm\b/g,'1 centimètre'],[/\bcm\b/g,'centimètres']],
    it:[[/\s*%/g,' per cento'],[/\bkm\/h\b/g,"chilometri all'ora"],[/\b1 km\b/g,'1 chilometro'],[/\bkm\b/g,'chilometri'],[/\s*°\s*C\b/g,' gradi Celsius'],[/\b1 cm\b/g,'1 centimetro'],[/\bcm\b/g,'centimetri']],
    ru:[[/\s*%/g,' процентов'],[/\bkm\/h\b/g,'километров в час'],[/\bkm\b/g,'километров'],[/\s*°\s*C\b/g,' градусов Цельсия'],[/\bcm\b/g,'сантиметров']],
    da:[[/\s*%/g,' procent'],[/\bkm\/h\b/g,'kilometer i timen'],[/\bkm\b/g,'kilometer'],[/\s*°\s*C\b/g,' grader celsius'],[/\bcm\b/g,'centimeter']],
    ar:[[/\s*%/g,' بالمئة'],[/\bkm\/h\b/g,'كيلومترًا في الساعة'],[/\bkm\b/g,'كيلومتر'],[/\s*°\s*C\b/g,' درجة مئوية'],[/\bcm\b/g,'سنتيمتر']]
  };
  // Thousands and decimals are written the local way: "28.000" and "9,5" in
  // Dutch and Portuguese, "28,000" and "9.5" in English. A map scale "1:25.000"
  // is read as "één op vijfentwintigduizend" / "one to twenty-five thousand".
  const NUMBER_STYLE={
    nl:{group:'.',decimal:',',point:' komma ',ratio:' op '},
    pt:{group:'.',decimal:',',point:' vírgula ',ratio:' para '},
    en:{group:',',decimal:'.',point:' point ',ratio:' to '},
    de:{group:'.',decimal:',',point:' Komma ',ratio:' zu '},
    es:{group:'.',decimal:',',point:' coma ',ratio:' a '},
    // French and Russian group thousands with a space: "28 000".
    fr:{group:' ',decimal:',',point:' virgule ',ratio:' pour '},
    it:{group:'.',decimal:',',point:' virgola ',ratio:' a '},
    ru:{group:' ',decimal:',',point:' запятая ',ratio:' к '},
    da:{group:'.',decimal:',',point:' komma ',ratio:' til '},
    ar:{group:',',decimal:'.',point:' فاصلة ',ratio:' إلى '}
  };
  // Russian units agree with the number: 1 процент, 2 процента, 5 процентов.
  const ruForm=(n,one,few,many)=>{const m=n%100,u=n%10;return (m>=11&&m<=14)?many:u===1?one:(u>=2&&u<=4)?few:many};
  function spellNumbers(text,lang='nl'){
    let out=String(text||'');
    if(lang==='ru'){
      // The unit agrees with the number, so number and unit are spelled together.
      // "28 000" is one number, hence the space group in the pattern.
      const N='(\\d{1,3}(?:[ \\u00a0\\u202f]\\d{3})+|\\d+)';
      const val=d=>Number(String(d).replace(/[\s\u00a0\u202f]/g,''));
      const unit=(re,one,few,many,tail='')=>{out=out.replace(new RegExp(N+re,'g'),(m,d)=>`${ruNumber(val(d))} ${ruForm(val(d),one,few,many)}${tail}`)};
      unit('\\s*%','процент','процента','процентов');
      unit('\\s*°\\s*C\\b','градус','градуса','градусов',' Цельсия');
      unit('\\s*km/h\\b','километр','километра','километров',' в час');
      unit('\\s*km\\b','километр','километра','километров');
      unit('\\s*cm\\b','сантиметр','сантиметра','сантиметров');
    }
    for(const [re,rep] of (UNITS[lang]||UNITS.nl)) out=out.replace(re,rep);
    const toWords=NUMBER_WORDS[lang]||nlNumber;
    const style=NUMBER_STYLE[lang]||NUMBER_STYLE.nl;
    const g=style.group==='.'?'\\.':style.group===' '?'[ \\u00a0\\u202f]':',';
    const d=style.decimal==='.'?'\\.':',';
    out=out.replace(/(\d)\s*:\s*(?=\d)/g,`$1${style.ratio}`);
    // Grouped thousands first ("28.000"), then decimals ("9,58" → "negen komma vijf acht").
    out=out.replace(new RegExp(`(?<![\\d.,])\\d{1,3}(?:${g}\\d{3})+(?![\\d.,]\\d)`,'g'),m=>toWords(Number(m.replace(/[.,\s\u00a0\u202f]/g,''))));
    out=out.replace(new RegExp(`(?<![\\d.,])(\\d{1,4})${d}(\\d+)(?![\\d.,]\\d)`,'g'),(m,a,b)=>toWords(Number(a))+style.point+[...b].map(ch=>toWords(Number(ch))).join(' '));
    // Up to nine digits: a longer run used to be cut after six, which turned
    // 1000000 into "a hundred thousand" followed by a stray zero. A language
    // whose speller does not reach that far returns the digits unchanged.
    out=out.replace(/(?<![\d.,])\d{1,9}(?![\d.,]\d)/g,m=>{const n=Number(m);return HUNDREDS[lang]&&m.length===4&&n>=1100&&n<=1999?HUNDREDS[lang](Math.floor(n/100),n%100):toWords(n)});
    // Spanish drops the -o of uno before a noun: "veintiún grados", "treinta y un años".
    if(lang==='es') out=out.replace(/\b(veinti)?uno\b(?=\s+\p{L})/gu,(m,p)=>p?'veintiún':'un');
    return out;
  }

  function createCancellationGate(){let version=0;return{begin(){return ++version},cancel(){return ++version},isCurrent(token){return token===version},get version(){return version}}}
  function topicCounts(questions){const counts={};for(const q of questions||[]){counts[q.world]||={};counts[q.world][q.topic]=(counts[q.world][q.topic]||0)+1}return counts}
  return{shuffle,prepareQuestion,selectQuestions,poolFor,selectQuizBatch,difficultyCap,difficultyBand,hintsAllowed,readsAnswers,questionSeconds,maxWrong,quizPassed,LEVELS,questionArtKind,spellNumbers,buildQuestionSpeechSegments,buildQuestionSpeech,buildFeedbackSpeech,evaluateAnswer,createSession,recordAnswer,createCancellationGate,topicCounts};
});