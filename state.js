(()=>{
  const K=window.KWIZILLO_M1=window.KWIZILLO_M1||{};

  // One store, one schema, one migration path.
  // Schema 1 was `kwizillo-v4-state` and seeded every new player with 245 coins,
  // 320 XP, level 5 and a 7-day streak, which unlocked achievements nobody earned.
  const KEY='kwizillo-state';
  const LEGACY_KEY='kwizillo-v4-state';
  const SCHEMA=2;

  // The exact values schema 1 handed to a player who had never answered anything.
  const LEGACY_SEED={coins:245,streak:7,level:5,xp:320};

  const DEFAULTS={
    schemaVersion:SCHEMA,
    language:'nl',
    name:'',
    onboardingComplete:false,
    voice:'Milo',
    group:5,
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
    musicTrack:'magical',
    timeLimitOn:true,       // per-question timer (seconds follow the level)
    timeLimit:45,           // legacy, unused
    niveau:1,               // game level 1..6 (timer, allowed mistakes, difficulty)
    bestScores:{},          // world -> best quiz score out of 10
    progress:{worlds:{},topics:{},runs:{},correctQuestionIds:[],passed:{},games:{}}
  };

  const clone=v=>JSON.parse(JSON.stringify(v));
  function read(key){ try{ return JSON.parse(localStorage.getItem(key)||'null') }catch{ return null } }

  function migrate(old){
    if(!old||typeof old!=='object') return clone(DEFAULTS);
    if(Number(old.schemaVersion)>=SCHEMA){
      // Same schema: only fill in keys added since (niveau, bestScores, passed).
      const merged=Object.assign(clone(DEFAULTS),old);
      merged.progress=Object.assign(clone(DEFAULTS.progress),old.progress||{});
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

    next.progress=Object.assign(clone(DEFAULTS.progress),old.progress||{});
    next.progress.worlds ||= {};
    next.progress.topics ||= {};
    next.progress.runs ||= {};
    next.progress.correctQuestionIds ||= [];
    next.progress.passed ||= {};
    next.progress.games ||= {};
    return next;
  }

  const stored=read(KEY)||read(LEGACY_KEY);
  K.state=migrate(stored);
  K.save=()=>{ try{ localStorage.setItem(KEY,JSON.stringify(K.state)) }catch(e){} };
  K.save();

  K.resetProgress=()=>{
    try{ localStorage.removeItem(KEY); localStorage.removeItem(LEGACY_KEY) }catch(e){}
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
