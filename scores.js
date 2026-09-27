(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.KWIZILLO_SCORES=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  // Points and coins, and the rules that keep both finite.
  //
  //   points  earned by answering correctly. They are the game's XP: the level
  //           follows from them. Every point also lands in the running totals
  //           for the exercise, the day, the week, the month and the year, and
  //           the best each of those windows ever reached is kept.
  //   coins   earned by playing the mini-games, above all the runner. Coins buy
  //           special cards and mascots, so they have to be scarce: a day's
  //           play is worth roughly one mascot a week.
  //
  // Two limits stop a child (or a stuck replay loop) from farming forever: a
  // question already answered correctly pays a fraction of its points, and both
  // currencies have a daily ceiling. Past the ceiling the game keeps playing and
  // keeps counting answers — only the wallet stops growing until tomorrow.
  const RULES={
    repeatShare:.4,        // a question answered right before pays 40% of its points
    minRepeat:2,           // but never less than this, so a repeat is never worthless
    dayPoints:1500,        // points a day, from every screen together
    dayCoins:250,          // coins a day, from every game together
    runCoins:150,          // coins from one runner run, however good it goes
    quizCoins:0            // questions pay points, not coins
  };

  const UNITS=['day','week','month','year'];

  const pad=n=>String(n).padStart(2,'0');
  // ISO week: the week of the Thursday in the same week, so a year never ends
  // with a stray one-day week and the count matches what a calendar shows.
  function isoWeek(d){
    const t=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));
    t.setUTCDate(t.getUTCDate()+4-(t.getUTCDay()||7));
    const jan1=new Date(Date.UTC(t.getUTCFullYear(),0,1));
    return {year:t.getUTCFullYear(),week:Math.ceil(((t-jan1)/864e5+1)/7)};
  }
  // The keys of the windows a moment falls in. Local time: a child's day ends
  // at their own midnight, not at UTC's.
  function periodKeys(when=new Date()){
    const d=when instanceof Date?when:new Date(when);
    const w=isoWeek(d);
    return {
      day:`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`,
      week:`${w.year}-W${pad(w.week)}`,
      month:`${d.getFullYear()}-${pad(d.getMonth()+1)}`,
      year:String(d.getFullYear())
    };
  }

  function emptyScores(){
    const periods={};for(const u of UNITS)periods[u]={key:'',points:0};
    return {periods,best:{run:0,day:0,week:0,month:0,year:0},allTime:0,coins:{key:'',earned:0,spent:0},run:{points:0}};
  }
  // Fills in whatever an older save is missing, without touching what it has.
  function normalise(s){
    const out=emptyScores();
    if(!s||typeof s!=='object')return out;
    for(const u of UNITS){const p=s.periods?.[u];if(p&&typeof p==='object'){out.periods[u]={key:String(p.key||''),points:num(p.points)}}}
    for(const k of Object.keys(out.best))out.best[k]=num(s.best?.[k]);
    out.allTime=num(s.allTime);
    out.coins={key:String(s.coins?.key||''),earned:num(s.coins?.earned),spent:num(s.coins?.spent)};
    out.run={points:num(s.run?.points)};
    return out;
  }
  const num=v=>{const n=Math.floor(Number(v)||0);return n>0?n:0};

  // A window that has passed hands its total to the record book and starts at
  // zero. Called before every read and every write, so a screen opened after
  // midnight shows today, not yesterday.
  function roll(scores,keys=periodKeys()){
    const s=normalise(scores);
    for(const u of UNITS){
      const p=s.periods[u];
      if(p.key===keys[u])continue;
      if(p.key&&p.points>s.best[u])s.best[u]=p.points;
      s.periods[u]={key:keys[u],points:0};
    }
    if(s.coins.key!==keys.day)s.coins={key:keys.day,earned:0,spent:s.coins.spent};
    return s;
  }

  // What a correct answer is worth. `repeat` is true when this question was
  // answered correctly before: practice still pays, but far less than discovery.
  function answerPoints(base,{repeat=false}={}){
    const b=Math.max(0,Math.floor(Number(base)||0));
    if(!repeat)return b;
    return b?Math.max(RULES.minRepeat,Math.round(b*RULES.repeatShare)):0;
  }

  // Books points. Returns what was really granted — the day's ceiling can cut
  // an award short or refuse it altogether, and the screen says so.
  function addPoints(scores,amount,{keys=periodKeys(),cap=RULES.dayPoints}={}){
    const s=roll(scores,keys);
    const want=Math.max(0,Math.floor(Number(amount)||0));
    const room=Math.max(0,cap-s.periods.day.points);
    const granted=Math.min(want,room);
    for(const u of UNITS)s.periods[u].points+=granted;
    s.allTime+=granted;
    s.run.points+=granted;
    if(s.run.points>s.best.run)s.best.run=s.run.points;
    return {scores:s,granted,capped:granted<want,room:room-granted};
  }

  // Books coins with the same shape. `runCap` trims one runner run before the
  // day's ceiling is applied.
  function addCoins(scores,amount,{keys=periodKeys(),cap=RULES.dayCoins,runCap=null}={}){
    const s=roll(scores,keys);
    let want=Math.max(0,Math.floor(Number(amount)||0));
    if(runCap!=null)want=Math.min(want,Math.max(0,Math.floor(runCap)));
    const room=Math.max(0,cap-s.coins.earned);
    const granted=Math.min(want,room);
    s.coins.earned+=granted;
    return {scores:s,granted,capped:granted<want,room:room-granted};
  }

  // A new exercise (a quiz, a game) starts its own running total; the best one
  // ever stays in the record book.
  function startRun(scores,keys=periodKeys()){
    const s=roll(scores,keys);
    if(s.run.points>s.best.run)s.best.run=s.run.points;
    s.run={points:0};
    return s;
  }

  // What the scoreboard shows: the running total of every window and the best
  // it has ever been, where "best" counts the window that is still open too.
  function summary(scores,keys=periodKeys()){
    const s=roll(scores,keys);
    const rows=UNITS.map(u=>({unit:u,points:s.periods[u].points,best:Math.max(s.best[u],s.periods[u].points)}));
    return {
      scores:s,
      run:{points:s.run.points,best:Math.max(s.best.run,s.run.points)},
      rows,
      allTime:s.allTime,
      coins:{earned:s.coins.earned,room:Math.max(0,RULES.dayCoins-s.coins.earned)},
      pointsRoom:Math.max(0,RULES.dayPoints-s.periods.day.points)
    };
  }

  return {RULES,UNITS,periodKeys,isoWeek,emptyScores,normalise,roll,answerPoints,addPoints,addCoins,startRun,summary};
});
