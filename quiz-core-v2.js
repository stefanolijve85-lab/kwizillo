(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.KWIZILLO_CORE=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  function shuffle(items,rng=Math.random){const out=[...items];for(let i=out.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[out[i],out[j]]=[out[j],out[i]]}return out}
  function prepareQuestion(q,rng=Math.random){return{...q,options:shuffle(q.options||[],rng)}}
  function selectQuestions({questions,world,topicKey=null,grade=5,limit=10,rng=Math.random}){let pool=(questions||[]).filter(q=>q.world===world&&(!topicKey||q.topic===topicKey));const gradePool=pool.filter(q=>(q.groupMin||1)<=grade&&(q.groupMax||8)>=grade);if(gradePool.length>=Math.min(6,limit))pool=gradePool;return shuffle(pool,rng).slice(0,Math.min(limit,pool.length)).map(q=>prepareQuestion(q,rng))}
  // The letter is spoken as a plain label, never as "Antwoord A" / "Answer A"
  // (CLAUDE.md section 9). The trailing period gives the voice a natural fall.
  function buildQuestionSpeechSegments(q){const labels=['A','B','C','D','E','F'];return[{kind:'question',text:q.prompt},...(q.options||[]).map((o,i)=>({kind:'answer',index:i,label:labels[i]||String(i+1),text:`${labels[i]||i+1}. ${o}.`}))]}
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
  // The difficulty cap: a manual level (1-4) wins; otherwise it follows the
  // school group and grows with the player's level, so quizzes get harder as
  // the child progresses. Questions inside a quiz are ordered easy -> hard.
  function difficultyCap({level='auto',grade=5,playerLevel=1}={}){
    const manual=Number(level);
    if(manual>=1&&manual<=4) return manual;
    const base=grade<=3?1:grade<=5?2:grade<=7?3:4;
    return Math.max(1,Math.min(4,base+Math.floor(Math.max(0,playerLevel-1)/4)));
  }
  function selectQuizBatch({questions,world,topicKey=null,grade=5,limit=10,usedIds=[],rng=Math.random,maxDifficulty=4}){
    let pool=poolFor({questions,world,topicKey,grade});
    // Cap the difficulty when enough questions remain under the cap; a small
    // topic keeps its full set rather than repeating five questions forever.
    const capped=pool.filter(q=>(q.difficulty||1)<=maxDifficulty);
    if(capped.length>=Math.max(limit,8)) pool=capped;
    if(!pool.length) return{questions:[],usedIds:[],recycled:false,poolSize:0};
    const used=new Set(usedIds);
    let available=pool.filter(q=>!used.has(q.id));
    let recycled=false;
    if(available.length<Math.min(limit,pool.length)){ available=pool; recycled=true }
    let order=shuffle(available,rng);
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
  // Seconds per question: 30 at level 1, two fewer per level, never under 10.
  function questionSeconds(playerLevel=1){return Math.max(10,30-2*(Math.max(1,playerLevel)-1))}
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
    if(n<10000){const k=Math.floor(n/1000),r=n%1000;return (k===1?'duizend':NL_ONES[k]+'duizend')+(r?' '+nlNumber(r):'')}
    return String(n);
  }
  function enNumber(n){
    if(n<20) return EN_ONES[n];
    if(n<100){const t=Math.floor(n/10),o=n%10;return EN_TENS[t]+(o?'-'+EN_ONES[o]:'')}
    if(n<1000){const h=Math.floor(n/100),r=n%100;return EN_ONES[h]+' hundred'+(r?' and '+enNumber(r):'')}
    if(n<10000){const k=Math.floor(n/1000),r=n%1000;return EN_ONES[k]+' thousand'+(r?(r<100?' and ':' ')+enNumber(r):'')}
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
    if(n<10000){const k=Math.floor(n/1000),r=n%1000;return (k===1?'mil':PT_ONES[k]+' mil')+(r?(r<100||r%100===0?' e ':' ')+ptNumber(r):'')}
    return String(n);
  }
  const UNITS={
    pt:[[/\s*%/g,' por cento'],[/\bkm\/h\b/g,'quilômetros por hora'],[/\b1 km\b/g,'1 quilômetro'],[/\bkm\b/g,'quilômetros'],[/\s*°\s*C\b/g,' graus Celsius'],[/\b1 cm\b/g,'1 centímetro'],[/\bcm\b/g,'centímetros']],
    nl:[[/\s*%/g,' procent'],[/\bkm\/u\b/g,'kilometer per uur'],[/\bkm\b/g,'kilometer'],[/\s*°\s*C\b/g,' graden Celsius'],[/\bcm\b/g,'centimeter']],
    // English units pluralise, so "1 cm" must become "one centimetre".
    en:[[/\s*%/g,' percent'],[/\b1 km\/h\b/g,'1 kilometre per hour'],[/\bkm\/h\b/g,'kilometres per hour'],[/\b1 km\b/g,'1 kilometre'],[/\bkm\b/g,'kilometres'],[/\s*°\s*C\b/g,' degrees Celsius'],[/\b1 cm\b/g,'1 centimetre'],[/\bcm\b/g,'centimetres']]
  };
  function spellNumbers(text,lang='nl'){
    let out=String(text||'');
    for(const [re,rep] of (UNITS[lang]||UNITS.nl)) out=out.replace(re,rep);
    const toWords=lang==='en'?enNumber:lang==='pt'?ptNumber:nlNumber;
    // Plain integers only; anything with a decimal separator is left as is.
    return out.replace(/(?<![\d.,])\d{1,4}(?![\d.,]\d)/g,m=>toWords(Number(m)));
  }

  function createCancellationGate(){let version=0;return{begin(){return ++version},cancel(){return ++version},isCurrent(token){return token===version},get version(){return version}}}
  function topicCounts(questions){const counts={};for(const q of questions||[]){counts[q.world]||={};counts[q.world][q.topic]=(counts[q.world][q.topic]||0)+1}return counts}
  return{shuffle,prepareQuestion,selectQuestions,poolFor,selectQuizBatch,difficultyCap,questionSeconds,questionArtKind,spellNumbers,buildQuestionSpeechSegments,buildQuestionSpeech,buildFeedbackSpeech,evaluateAnswer,createSession,recordAnswer,createCancellationGate,topicCounts};
});