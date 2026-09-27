(()=>{
  const K=window.KWIZILLO_M1=window.KWIZILLO_M1||{};

  // One store, one schema, one migration path.
  // Schema 1 was `kwizillo-v4-state` and seeded every new player with 245 coins,
  // 320 XP, level 5 and a 7-day streak, which unlocked achievements nobody earned.
  const KEY='kwizillo-state';
  const LEGACY_KEY='kwizillo-v4-state';
  // Schema 3 added the score book (points per exercise, day, week, month, year
  // with their records) and the shop's owned items.
  const SCHEMA=3;
  const S=window.KWIZILLO_SCORES;

  // The exact values schema 1 handed to a player who had never answered anything.
  const LEGACY_SEED={coins:245,streak:7,level:5,xp:320};

  const DEFAULTS={
    schemaVersion:SCHEMA,
    language:'nl',
    name:'',
    onboardingComplete:false,
    voice:'Milo',
    group:5,
    groupChosen:false,      // true once the child picked the group (age no longer suggests it)
    age:null,
    tourDone:false,
    xp:0,
    coins:0,
    streak:0,
    lastPlayedDate:null,
    answered:0,
    correct:0,
    quizzesPlayed:0,
    lastWorld:'ruimte',
    selectedMascot:'milo',
    soundOn:true,
    musicOn:true,
    sfxVolume:.72,
    musicVolume:.24,
    voiceVolume:1,          // guide voice, separate from effects and music
    musicTrack:'home',
    timeLimitOn:true,       // per-question timer (seconds follow the level)
    timeLimit:45,           // legacy, unused
    niveau:1,               // game level 1..6 (timer, allowed mistakes, difficulty)
    bestScores:{},          // world -> best quiz score out of 10
    scores:S.emptyScores(), // points per window plus the records; see scores.js
    shop:{owned:[]},        // special cards and mascots bought with coins
    progress:{worlds:{},topics:{},runs:{},correctQuestionIds:[],passed:{},games:{},factsSeen:{}}
  };

  const clone=v=>JSON.parse(JSON.stringify(v));
  function read(key){ try{ return JSON.parse(localStorage.getItem(key)||'null') }catch{ return null } }

  // The first four loops were replaced by one track per world; old choices map onto the nearest new one.
  const LEGACY_TRACKS={magical:'home',adventure:'history',calm:'earth'};
  function migrate(old){
    if(!old||typeof old!=='object') return clone(DEFAULTS);
    if(Number(old.schemaVersion)>=SCHEMA){
      // Same schema: only fill in keys added since (niveau, bestScores, passed).
      const merged=Object.assign(clone(DEFAULTS),old);
      merged.progress=Object.assign(clone(DEFAULTS.progress),old.progress||{});
      merged.scores=S.normalise(old.scores);
      merged.shop={owned:Array.isArray(old.shop?.owned)?old.shop.owned.map(String):[]};
      merged.musicTrack=LEGACY_TRACKS[merged.musicTrack]||merged.musicTrack;
      return merged;
    }

    const next=Object.assign(clone(DEFAULTS),old);
    next.schemaVersion=SCHEMA;

    // A schema-1 player who never answered a question is carrying the seed, not
    // progress. Anyone who did play keeps every number they earned.
    const untouched=Number(old.answered||0)===0 && Number(old.quizzesPlayed||0)===0;
    const seeded=Object.entries(LEGACY_SEED).every(([k,v])=>Number(old[k])===v);
    if(untouched&&seeded){
      next.coins=0; next.xp=0; next.streak=0;
    }
    delete next.level;   // always derived from xp now
    // The score book starts today, but the points a player already earned are
    // their all-time total: the record book should not open at zero for someone
    // who has been playing for weeks.
    next.scores=S.normalise(old.scores);
    if(!next.scores.allTime)next.scores.allTime=Math.max(0,Math.floor(Number(old.xp)||0));
    next.shop={owned:Array.isArray(old.shop?.owned)?old.shop.owned.map(String):[]};
    next.musicTrack=LEGACY_TRACKS[next.musicTrack]||next.musicTrack;

    next.progress=Object.assign(clone(DEFAULTS.progress),old.progress||{});
    next.progress.worlds ||= {};
    next.progress.topics ||= {};
    next.progress.runs ||= {};
    next.progress.correctQuestionIds ||= [];
    next.progress.passed ||= {};
    next.progress.games ||= {};
    next.progress.factsSeen ||= {};
    return next;
  }

  // Fresh start: every launch begins at the intro and the onboarding, and
  // nothing from the previous session (name, progress, settings) comes back.
  // On by default for now — Stefan wants each refresh to be a clean first run
  // while the app is shown around; the parent zone turns it off, after which
  // progress persists across launches like any game. The flag itself lives
  // outside the state so wiping the state cannot wipe the choice.
  const FRESH_KEY='kwizillo-fresh-start';
  K.freshStart=()=>{ try{ return localStorage.getItem(FRESH_KEY)!=='0' }catch(e){ return false } };
  K.setFreshStart=on=>{ try{ localStorage.setItem(FRESH_KEY,on?'1':'0') }catch(e){} };
  if(K.freshStart()){ try{ localStorage.removeItem(KEY); localStorage.removeItem(LEGACY_KEY) }catch(e){} }

  const stored=read(KEY)||read(LEGACY_KEY);
  K.state=migrate(stored);
  K.save=()=>{ try{ localStorage.setItem(KEY,JSON.stringify(K.state)) }catch(e){} };
  K.save();

  K.resetProgress=()=>{
    try{ localStorage.removeItem(KEY); localStorage.removeItem(LEGACY_KEY) }catch(e){}
  };

  // "Erase all data" in the parent zone: every key this app ever writes goes,
  // including the fresh-start choice and the cached App Store entitlement, so
  // nothing of the child is left on the device. A bought Premium lives with the
  // Apple account and comes back with "Restore purchases".
  K.eraseAllData=()=>{
    try{
      const gone=[];
      for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); if(k&&k.startsWith('kwizillo-'))gone.push(k) }
      gone.forEach(k=>localStorage.removeItem(k));
      return gone;
    }catch(e){ return [] }
  };

  /* ---------------- Points, coins and the record book ---------------- */

  // Every point and every coin in the game passes through here, so the daily
  // ceilings and the records can never be bypassed by a screen that books a
  // reward on its own. See scores.js for the rules themselves.
  K.scores=()=>{ K.state.scores=S.roll(K.state.scores); return K.state.scores };
  K.scoreSummary=()=>{ const sum=S.summary(K.state.scores); K.state.scores=sum.scores; return sum };
  K.scoreRules=S.RULES;

  // Points are the game's XP: the level follows from them.
  K.awardPoints=amount=>{
    const r=S.addPoints(K.state.scores,amount);
    K.state.scores=r.scores;
    K.state.xp=Number(K.state.xp||0)+r.granted;
    K.save();
    return {granted:r.granted,capped:r.capped,room:r.room};
  };
  // What a question is worth right now: full the first time it is answered
  // correctly, a practice share every time after that.
  K.answerPoints=(base,{repeat=false}={})=>S.answerPoints(base,{repeat});

  K.awardCoins=(amount,opts={})=>{
    const r=S.addCoins(K.state.scores,amount,opts);
    K.state.scores=r.scores;
    K.state.coins=Number(K.state.coins||0)+r.granted;
    K.save();
    return {granted:r.granted,capped:r.capped,room:r.room};
  };
  // Spending never goes below zero, and what was spent is remembered so the
  // shop can show a player what their coins went to.
  K.spendCoins=amount=>{
    const price=Math.max(0,Math.floor(Number(amount)||0));
    if(Number(K.state.coins||0)<price)return false;
    K.state.coins=Number(K.state.coins||0)-price;
    K.state.scores=S.roll(K.state.scores);
    K.state.scores.coins.spent+=price;
    K.save();
    return true;
  };
  // One exercise: a quiz or a game run. Its points are counted apart so the
  // best single exercise can be a record of its own.
  K.startScoreRun=()=>{ K.state.scores=S.startRun(K.state.scores); K.save(); return K.state.scores };

  K.owned=id=>{ K.state.shop||={owned:[]}; K.state.shop.owned||=[]; return K.state.shop.owned.includes(String(id)) };
  K.own=id=>{ K.state.shop||={owned:[]}; K.state.shop.owned||=[]; if(!K.owned(id))K.state.shop.owned.push(String(id)); K.save() };

  // Every world keeps its own level. A world is at level 1 until its four topic
  // quizzes — all forty questions — have been passed at that level; then it
  // moves up, all the way to six. Nothing is stored: the level follows from the
  // topics that were passed, so it can never drift from what the child did.
  K.worldLevel=world=>{
    const P=K.progress().passed||{};
    const keys=K.TOPIC_KEYS?.[world]||[];
    if(!keys.length)return 1;
    const top=K.core?.LEVELS?.length||6;
    let level=1;
    while(level<top&&keys.every(k=>P[level]?.[`${world}:${k}`]))level++;
    return level;
  };
  // How far this world is through its current level (topics passed out of four).
  K.worldLevelProgress=world=>{
    const P=K.progress().passed||{};
    const keys=K.TOPIC_KEYS?.[world]||[];
    const level=K.worldLevel(world);
    return {level,passed:keys.filter(k=>P[level]?.[`${world}:${k}`]).length,total:keys.length||4};
  };

  // Level is derived, never stored, so it can never drift from XP.
  K.level=()=>1+Math.floor(Number(K.state.xp||0)/100);
  K.xpIntoLevel=()=>Number(K.state.xp||0)%100;

  const today=()=>{
    const d=new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  };
  const dayBefore=iso=>{
    const [y,m,d]=String(iso||'').split('-').map(Number);
    if(!y||!m||!d) return null;
    const t=new Date(y,m-1,d); t.setDate(t.getDate()-1);
    return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`;
  };

  // Called once per finished quiz. Same day is a no-op, yesterday extends the
  // streak, anything older restarts it.
  K.touchStreak=()=>{
    const now=today(),last=K.state.lastPlayedDate;
    if(last===now) return K.state.streak;
    K.state.streak = last && dayBefore(now)===last ? Number(K.state.streak||0)+1 : 1;
    K.state.lastPlayedDate=now;
    K.save();
    return K.state.streak;
  };

  K.progress=()=>{
    K.state.progress ||= clone(DEFAULTS.progress);
    K.state.progress.worlds ||= {};
    K.state.progress.topics ||= {};
    K.state.progress.runs ||= {};
    K.state.progress.correctQuestionIds ||= [];
    return K.state.progress;
  };

  K.currentWorld=K.state.lastWorld||'ruimte';
  K.quiz=null;
  K.lastView='home';
})();
