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
  function selectQuizBatch({questions,world,topicKey=null,grade=5,limit=10,usedIds=[],rng=Math.random}){
    const pool=poolFor({questions,world,topicKey,grade});
    if(!pool.length) return{questions:[],usedIds:[],recycled:false,poolSize:0};
    const used=new Set(usedIds);
    let available=pool.filter(q=>!used.has(q.id));
    let recycled=false;
    if(available.length<Math.min(limit,pool.length)){ available=pool; recycled=true }
    const picked=shuffle(available,rng).slice(0,Math.min(limit,pool.length)).map(q=>prepareQuestion(q,rng));
    const nextUsed=recycled?picked.map(q=>q.id):[...usedIds,...picked.map(q=>q.id)];
    return{questions:picked,usedIds:nextUsed,recycled,poolSize:pool.length};
  }

  function createSession({world,topicKey=null,topicLabel='',questions=[],quizNumber=1}){return{world,topicKey,topicLabel,questions,quizNumber,index:0,score:0,xp:0,answeredById:{}}}
  function recordAnswer(session,q,value){if(!session||!q)return{accepted:false,reason:'invalid'};if(session.answeredById?.[q.id])return{accepted:false,reason:'already-answered'};session.answeredById||={};session.answeredById[q.id]=true;const result=evaluateAnswer(q,value);if(result.correct){session.score++;session.xp+=q.xp||10}return{accepted:true,...result}}
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

  function createCancellationGate(){let version=0;return{begin(){return ++version},cancel(){return ++version},isCurrent(token){return token===version},get version(){return version}}}
  function topicCounts(questions){const counts={};for(const q of questions||[]){counts[q.world]||={};counts[q.world][q.topic]=(counts[q.world][q.topic]||0)+1}return counts}
  return{shuffle,prepareQuestion,selectQuestions,poolFor,selectQuizBatch,questionArtKind,buildQuestionSpeechSegments,buildQuestionSpeech,buildFeedbackSpeech,evaluateAnswer,createSession,recordAnswer,createCancellationGate,topicCounts};
});