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
  // free). From level 4 the voice reads only the question: the child reads the
  // four answers alone, which is the step from listening to reading.
  // `band` is the difficulty window a level draws from first (questions carry
  // difficulty 1-4: the base set is 1-2, the advanced set 3-4). A batch fills
  // up from the nearest difficulties when the window runs dry.
  const LEVELS=[
    {seconds:30,maxWrong:6,cap:1,band:[1,1],hints:Infinity,readAnswers:true},
    {seconds:25,maxWrong:5,cap:2,band:[1,2],hints:Infinity,readAnswers:true},
    {seconds:20,maxWrong:4,cap:2,band:[2,3],hints:3,readAnswers:true},
    {seconds:16,maxWrong:3,cap:3,band:[3,3],hints:2,readAnswers:false},
    {seconds:13,maxWrong:2,cap:4,band:[3,4],hints:1,readAnswers:false},
    {seconds:10,maxWrong:0,cap:4,band:[4,4],hints:0,readAnswers:false}
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
    ['body',/\b(spier|spieren|orgaan|organen|hersenen|skelet|bloedvaten|muscle|muscles|organ|organs|skeleton)\b/],
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
  const UNITS={
    pt:[[/\s*%/g,' por cento'],[/\bkm\/h\b/g,'quilômetros por hora'],[/\b1 km\b/g,'1 quilômetro'],[/\bkm\b/g,'quilômetros'],[/\s*°\s*C\b/g,' graus Celsius'],[/\b1 cm\b/g,'1 centímetro'],[/\bcm\b/g,'centímetros']],
    nl:[[/\s*%/g,' procent'],[/\bkm\/u\b/g,'kilometer per uur'],[/\bkm\b/g,'kilometer'],[/\s*°\s*C\b/g,' graden Celsius'],[/\bcm\b/g,'centimeter']],
    // English units pluralise, so "1 cm" must become "one centimetre".
    en:[[/\s*%/g,' percent'],[/\b1 km\/h\b/g,'1 kilometre per hour'],[/\bkm\/h\b/g,'kilometres per hour'],[/\b1 km\b/g,'1 kilometre'],[/\bkm\b/g,'kilometres'],[/\s*°\s*C\b/g,' degrees Celsius'],[/\b1 cm\b/g,'1 centimetre'],[/\bcm\b/g,'centimetres']]
  };
  // Thousands and decimals are written the local way: "28.000" and "9,5" in
  // Dutch and Portuguese, "28,000" and "9.5" in English. A map scale "1:25.000"
  // is read as "één op vijfentwintigduizend" / "one to twenty-five thousand".
  const NUMBER_STYLE={
    nl:{group:'.',decimal:',',point:' komma ',ratio:' op '},
    pt:{group:'.',decimal:',',point:' vírgula ',ratio:' para '},
    en:{group:',',decimal:'.',point:' point ',ratio:' to '}
  };
  function spellNumbers(text,lang='nl'){
    let out=String(text||'');
    for(const [re,rep] of (UNITS[lang]||UNITS.nl)) out=out.replace(re,rep);
    const toWords=lang==='en'?enNumber:lang==='pt'?ptNumber:nlNumber;
    const style=NUMBER_STYLE[lang]||NUMBER_STYLE.nl;
    const g=style.group==='.'?'\\.':',';
    const d=style.decimal==='.'?'\\.':',';
    out=out.replace(/(\d)\s*:\s*(?=\d)/g,`$1${style.ratio}`);
    // Grouped thousands first ("28.000"), then decimals ("9,58" → "negen komma vijf acht").
    out=out.replace(new RegExp(`(?<![\\d.,])\\d{1,3}(?:${g}\\d{3})+(?![\\d.,]\\d)`,'g'),m=>toWords(Number(m.replace(/[.,]/g,''))));
    out=out.replace(new RegExp(`(?<![\\d.,])(\\d{1,4})${d}(\\d+)(?![\\d.,]\\d)`,'g'),(m,a,b)=>toWords(Number(a))+style.point+[...b].map(ch=>toWords(Number(ch))).join(' '));
    return out.replace(/(?<![\d.,])\d{1,6}(?![\d.,]\d)/g,m=>toWords(Number(m)));
  }

  function createCancellationGate(){let version=0;return{begin(){return ++version},cancel(){return ++version},isCurrent(token){return token===version},get version(){return version}}}
  function topicCounts(questions){const counts={};for(const q of questions||[]){counts[q.world]||={};counts[q.world][q.topic]=(counts[q.world][q.topic]||0)+1}return counts}
  return{shuffle,prepareQuestion,selectQuestions,poolFor,selectQuizBatch,difficultyCap,difficultyBand,hintsAllowed,readsAnswers,questionSeconds,maxWrong,quizPassed,LEVELS,questionArtKind,spellNumbers,buildQuestionSpeechSegments,buildQuestionSpeech,buildFeedbackSpeech,evaluateAnswer,createSession,recordAnswer,createCancellationGate,topicCounts};
});