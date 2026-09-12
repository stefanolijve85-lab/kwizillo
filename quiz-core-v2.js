(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.KWIZILLO_CORE=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  function shuffle(items,rng=Math.random){const out=[...items];for(let i=out.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[out[i],out[j]]=[out[j],out[i]]}return out}
  function prepareQuestion(q,rng=Math.random){return{...q,options:shuffle(q.options||[],rng)}}
  function selectQuestions({questions,world,topicKey=null,grade=5,limit=10,rng=Math.random}){let pool=(questions||[]).filter(q=>q.world===world&&(!topicKey||q.topic===topicKey));const gradePool=pool.filter(q=>(q.groupMin||1)<=grade&&(q.groupMax||8)>=grade);if(gradePool.length>=Math.min(6,limit))pool=gradePool;return shuffle(pool,rng).slice(0,Math.min(limit,pool.length)).map(q=>prepareQuestion(q,rng))}
  function buildQuestionSpeech(q){const labels=['A','B','C','D','E','F'];return `${q.prompt} ${(q.options||[]).map((o,i)=>`Antwoord ${labels[i]||i+1}: ${o}.`).join(' ')}`.trim()}
  function evaluateAnswer(q,value){return{correct:value===q.answer,answer:q.answer,selected:value}}
  function createSession({world,topicKey=null,topicLabel='Gemengde quiz',questions=[]}){return{world,topicKey,topicLabel,questions,index:0,score:0,xp:0,answeredById:{}}}
  function recordAnswer(session,q,value){if(!session||!q)return{accepted:false,reason:'invalid'};if(session.answeredById?.[q.id])return{accepted:false,reason:'already-answered'};session.answeredById||={};session.answeredById[q.id]=true;const result=evaluateAnswer(q,value);if(result.correct){session.score++;session.xp+=q.xp||10}return{accepted:true,...result}}
  function createCancellationGate(){let version=0;return{begin(){return ++version},cancel(){return ++version},isCurrent(token){return token===version},get version(){return version}}}
  function topicCounts(questions){const counts={};for(const q of questions||[]){counts[q.world]||={};counts[q.world][q.topic]=(counts[q.world][q.topic]||0)+1}return counts}
  return{shuffle,prepareQuestion,selectQuestions,buildQuestionSpeech,evaluateAnswer,createSession,recordAnswer,createCancellationGate,topicCounts};
});
