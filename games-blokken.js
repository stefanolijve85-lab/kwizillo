/* Blokkenpret — a polyomino puzzle in the Spellenkist.

   Ten fixed levels (blokken-levels.js holds the data and the solver). The child
   drags whole pieces from the tray onto the figure until it is exactly full.
   No timers, no lives, no penalties: a piece that does not fit just goes back.

   One screen, one style; only the layout changes with the frame (tall: board on
   top, tray below; wide: board left, tray right). The puzzle itself — cells,
   pieces, colours, orientations, state — is the same on every device, and a
   resize or a turn of the screen never changes it.

   Everything lives under one root element (.blokken-root). Listeners on window
   and document are registered with one AbortController and removed when the
   root leaves the page (any K.frame), together with timers, observers and
   sound. Progress: K.progress().games.blokken. */
(()=>{
  const K=window.KWIZILLO_M1;
  if(!K) return;
  const D=K.blokkenData;
  if(!D){console.warn('Blokkenpret: blokken-levels.js missing');return}
  const t=(k,p)=>K.t(k,p);
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const TOTAL=D.count;

  // Timing (ms), in one place so it can be tuned.
  const TIME={lift:120,snap:150,back:220,sparkle:340,toast:1100,mega:1300,dragStart:6};
  const BOOST_NEED=3;        // different pieces placed without help → one boost
  const reduced=()=>{try{return matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){return false}};

  /* ---------------- progress ---------------- */
  const store=()=>{
    const G=K.progress().games||={};
    const b=G.blokken||={};
    if(!Array.isArray(b.done))b.done=[];
    b.done=[...new Set(b.done.map(Number).filter(n=>n>=1&&n<=TOTAL))].sort((a,b)=>a-b);
    if(!Array.isArray(b.booked))b.booked=[];
    if(!b.attempts||typeof b.attempts!=='object')b.attempts={};
    if(!(b.last>=1&&b.last<=TOTAL))b.last=1;
    b.plays=Number(b.plays||0);
    b.seen||={};
    return b;
  };
  const devAll=()=>{try{return new URLSearchParams(location.search).get('blokkenAll')==='1'||K.blokkenDevAll===true}catch(e){return false}};
  const unlocked=n=>n===1||devAll()||store().done.includes(n-1)||store().done.includes(n);
  const newAttemptId=n=>`bk${n}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
  const freshBoost=()=>({credited:[],helped:[],earned:false,available:false,used:false});

  // A saved attempt is only restored when it is of this level version and every
  // part of it is still valid for the level; otherwise the level starts fresh.
  function restoreAttempt(lv,a){
    if(!a||a.v!==D.LEVEL_DATA_VERSION||typeof a.id!=='string')return null;
    const ids=new Set(lv.pieces.map(p=>p.id));
    const placements={};
    for(const [id,p] of Object.entries(a.placements||{})){
      if(!ids.has(id)||!p||!Number.isInteger(p.x)||!Number.isInteger(p.y)||!Number.isInteger(p.rot))return null;
      placements[id]={x:p.x,y:p.y,rot:p.rot};
    }
    if(!D.validPlacements(lv,placements))return null;
    if(D.isComplete(lv,placements))return null;                      // a finished board is never resumed
    const trayRot={};
    for(const [id,r] of Object.entries(a.trayRot||{})){if(ids.has(id)&&D.pieceById(lv,id).rotations.includes(r))trayRot[id]=r}
    const order=(Array.isArray(a.order)?a.order:[]).filter(id=>placements[id]);
    for(const id of Object.keys(placements))if(!order.includes(id))order.push(id);
    const bs=a.boost||{};
    const boost={credited:(bs.credited||[]).filter(id=>ids.has(id)),helped:(bs.helped||[]).filter(id=>ids.has(id)),earned:!!bs.earned,available:!!bs.available&&!!bs.earned&&!bs.used,used:!!bs.used};
    let hint=null;
    if(a.hint&&a.hint.kind==='place'&&ids.has(a.hint.id)&&!placements[a.hint.id]&&D.canPlace(lv,placements,a.hint.id,a.hint.x,a.hint.y,a.hint.rot))hint={...a.hint};
    return {id:a.id,placements,trayRot,order,boost,hint};
  }

  /* ---------------- sound: one soft arcade sound world ---------------- */
  // Synthesised on the app's own audio context (K.audio.ctx, unlocked by the
  // app on the first tap). Off when the app's sound is off, never two of the
  // same sound at once, everything stops when the tab hides or the game closes.
  const Snd=(()=>{
    const live=new Set();const lastAt={};
    const ctx=()=>{const c=K.audio?.ctx;return c&&c.state==='running'?c:null};
    const vol=()=>K.state.soundOn===false?0:Math.max(0,Math.min(1,Number(K.state.sfxVolume??.72)));
    function out(c,level){const g=c.createGain();g.gain.value=level*vol();g.connect(c.destination);return g}
    function tone(c,dest,{f=440,f2,type='sine',at=0,dur=.12,peak=.5,attack=.006}){
      const o=c.createOscillator(),g=c.createGain();const t0=c.currentTime+at;
      o.type=type;o.frequency.setValueAtTime(f,t0);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t0+dur);
      g.gain.setValueAtTime(0.0001,t0);g.gain.exponentialRampToValueAtTime(peak,t0+attack);g.gain.exponentialRampToValueAtTime(0.0001,t0+dur);
      o.connect(g);g.connect(dest);o.start(t0);o.stop(t0+dur+.03);track(o,[g]);
    }
    function noise(c,dest,{at=0,dur=.25,from=600,to=3000,q=1.2,peak=.25}){
      const len=Math.ceil(c.sampleRate*dur),buf=c.createBuffer(1,len,c.sampleRate),d=buf.getChannelData(0);
      for(let i=0;i<len;i++)d[i]=Math.random()*2-1;
      const s=c.createBufferSource(),bp=c.createBiquadFilter(),g=c.createGain();const t0=c.currentTime+at;
      s.buffer=buf;bp.type='bandpass';bp.Q.value=q;bp.frequency.setValueAtTime(from,t0);bp.frequency.exponentialRampToValueAtTime(to,t0+dur);
      g.gain.setValueAtTime(0.0001,t0);g.gain.exponentialRampToValueAtTime(peak,t0+dur*.35);g.gain.exponentialRampToValueAtTime(0.0001,t0+dur);
      s.connect(bp);bp.connect(g);g.connect(dest);s.start(t0);s.stop(t0+dur+.03);track(s,[bp,g]);
    }
    function track(node,extra){live.add(node);node.onended=()=>{live.delete(node);try{node.disconnect();extra.forEach(n=>n.disconnect())}catch(e){}}}
    const glitter=(c,o,at,n=5)=>{for(let i=0;i<n;i++)tone(c,o,{f:2400+Math.random()*2200,at:at+i*.045,dur:.09,peak:.12,type:'sine'})};
    const SOUNDS={
      pick:(c,o)=>{tone(c,o,{f:620,f2:380,dur:.07,peak:.5,type:'triangle'})},
      rotate:(c,o)=>{tone(c,o,{f:1500,dur:.03,peak:.25,type:'triangle'});noise(c,o,{at:.01,dur:.14,from:800,to:2600,peak:.12})},
      place:(c,o)=>{tone(c,o,{f:260,f2:520,dur:.09,peak:.55});tone(c,o,{f:1318,at:.06,dur:.42,peak:.22});tone(c,o,{f:2636,at:.06,dur:.25,peak:.06})},
      invalid:(c,o)=>{const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=700;lp.connect(o);tone(c,lp,{f:240,f2:170,dur:.17,peak:.35});setTimeout(()=>{try{lp.disconnect()}catch(e){}},400)},
      undo:(c,o)=>{tone(c,o,{f:980,dur:.05,peak:.22,type:'triangle'});tone(c,o,{f:720,at:.07,dur:.06,peak:.2,type:'triangle'})},
      back:(c,o)=>{tone(c,o,{f:520,f2:330,dur:.12,peak:.3,type:'triangle'})},
      boostEarned:(c,o)=>{[1046.5,1318.5,1568].forEach((f,i)=>tone(c,o,{f,at:i*.11,dur:.2,peak:.32,type:'triangle'}));glitter(c,o,.34,6)},
      boostUsed:(c,o)=>{noise(c,o,{dur:.36,from:500,to:5000,peak:.2,q:.8});glitter(c,o,.14,7)},
      mega:(c,o)=>{[523.25,659.25,783.99].forEach(f=>tone(c,o,{f,dur:.6,peak:.2,type:'triangle'}));[783.99,880,1046.5,1318.5,1568].forEach((f,i)=>tone(c,o,{f,at:.18+i*.1,dur:.24,peak:.26,type:'triangle'}));glitter(c,o,.7,6)},
      finale:(c,o)=>{const m=[523.25,659.25,783.99,1046.5,783.99,1046.5,1318.5,1568];m.forEach((f,i)=>tone(c,o,{f,at:i*.14,dur:.26,peak:.26,type:'triangle'}));[523.25,659.25,783.99,1046.5].forEach(f=>tone(c,o,{f,at:1.2,dur:1.3,peak:.16,type:'sine'}));glitter(c,o,1.3,10);glitter(c,o,1.9,8)}
    };
    const LEVEL={pick:.5,rotate:.5,place:.6,invalid:.45,undo:.5,back:.45,boostEarned:.6,boostUsed:.6,mega:.7,finale:.7};
    function play(k){
      const now=performance.now();if(lastAt[k]&&now-lastAt[k]<70)return;lastAt[k]=now;
      if(vol()<=0||!SOUNDS[k]||!document.querySelector('.blokken-root'))return;const c=ctx();if(!c)return;
      if(live.size>48)return;
      try{SOUNDS[k](c,out(c,LEVEL[k]||.5))}catch(e){}
    }
    function stopAll(){for(const n of live){try{n.stop()}catch(e){}}live.clear()}
    return {play,stopAll,get live(){return live.size}};
  })();

  /* ---------------- drawing ---------------- */
  // Outline loops of a set of cells, as an SVG path in cell units.
  function outlinePath(cells,inset=0){
    const set=new Set(cells.map(([x,y])=>x+','+y));const has=(x,y)=>set.has(x+','+y);
    const edges=new Map();const add=(a,b)=>edges.set(a.join(','),b);
    for(const [x,y] of cells){
      if(!has(x,y-1))add([x,y],[x+1,y]);
      if(!has(x+1,y))add([x+1,y],[x+1,y+1]);
      if(!has(x,y+1))add([x+1,y+1],[x,y+1]);
      if(!has(x-1,y))add([x,y+1],[x,y]);
    }
    let d='';const used=new Set();
    for(const start of edges.keys()){
      if(used.has(start))continue;
      let cur=start;const pts=[];
      while(!used.has(cur)&&edges.has(cur)){used.add(cur);pts.push(cur.split(',').map(Number));const nx=edges.get(cur);cur=nx.join(',')}
      // drop the points in the middle of a straight run
      const simple=pts.filter((p,i)=>{const a=pts[(i-1+pts.length)%pts.length],b=pts[(i+1)%pts.length];return !((a[0]===p[0]&&p[0]===b[0])||(a[1]===p[1]&&p[1]===b[1]))});
      d+='M'+simple.map(p=>p.join(' ')).join('L')+'Z';
    }
    return d;
  }
  const SYM={
    star:'M.5 .2l.088.18.198.029-.143.14.034.197L.5 .653l-.177.093.034-.197-.143-.14.198-.029z',
    heart:'M.5 .74C.3 .6.22 .5.22 .4a.14.14 0 0 1 .28-.06.14.14 0 0 1 .28.06c0 .1-.08.2-.28.34z',
    dot:'M.5 .3a.2.2 0 1 1 0 .4.2.2 0 1 1 0-.4z',
    diamond:'M.5 .24.74.5.5.76.26.5z',
    moon:'M.58 .24a.27.27 0 1 0 .18.42.22.22 0 1 1-.18-.42z',
    drop:'M.5 .22C.6 .38.7 .48.7 .58a.2.2 0 0 1-.4 0c0-.1.1-.2.2-.36z',
    flower:'M.5 .25a.09.09 0 0 1 .09.12.09.09 0 1 1 .06.17.09.09 0 1 1-.06.17.09.09 0 1 1-.18 0 .09.09 0 1 1-.06-.17.09.09 0 1 1 .06-.17A.09.09 0 0 1 .5 .25z',
    triangle:'M.5 .25.76.72H.24z',
    ring:'M.5 .27a.23.23 0 1 1 0 .46.23.23 0 1 1 0-.46zm0 .11a.12.12 0 1 0 0 .24.12.12 0 1 0 0-.24z'
  };
  // The cell the symbol sits on: the one closest to the piece's middle.
  function symbolCell(cells){
    let sx=0,sy=0;for(const [x,y] of cells){sx+=x+.5;sy+=y+.5}sx/=cells.length;sy/=cells.length;
    let best=cells[0],bd=Infinity;for(const c of cells){const d=(c[0]+.5-sx)**2+(c[1]+.5-sy)**2;if(d<bd-1e-9){bd=d;best=c}}return best;
  }
  // One glossy piece: a shared body and outer border, a block per cell (the
  // gaps between them are the seams), a highlight per block and the symbol.
  function pieceSVG(piece,rot,cls=''){
    const cells=D.rotate(piece.cells,rot);const {w,h}=D.dims(cells);const C=D.COLORS[piece.color];
    const body=outlinePath(cells);const [sx,sy]=symbolCell(cells);
    // each cell wears the glossy block of the piece's colour (art-source/blokken/cells.png, cut by
    // tools/blokken-art.cjs); the dark body behind it is the piece's shared outline and its seams
    const blocks=cells.map(([x,y])=>`<image href="${CELL_ART(piece.color)}" x="${x+.03}" y="${y+.03}" width=".94" height=".94" preserveAspectRatio="none"/>`).join('');
    return `<svg class="bk-svg ${cls}" viewBox="0 0 ${w} ${h}" width="100%" height="100%" aria-hidden="true" focusable="false">
      <path d="${body}" fill="${C.dark}" stroke="${C.dark}" stroke-width=".07" stroke-linejoin="round"/>
      ${blocks}
      <g transform="translate(${sx} ${sy})"><path d="${SYM[piece.symbol]}" fill="${C.dark}" opacity=".5" transform="translate(.02 .03)"/><path d="${SYM[piece.symbol]}" fill="#fff" opacity=".92"/></g>
    </svg>`;
  }
  const ART='assets/games/blokken/';
  const CELL_ART=c=>`${ART}cell-${c}.webp`;
  const preloadArt=()=>{for(const src of [...Object.keys(D.COLORS).map(CELL_ART),`${ART}mega.jpg`,`${ART}boost-banner.webp`]){const i=new Image();i.src=src}};
  // MEGA ZET!: the emblem as drawn (Dutch lettering) in Dutch; in every other
  // language its star and rays with the translated title as live text.
  // MEGA ZET!: one picture without lettering for every language, the words live on it (Stefan, 2026-10-10)
  const megaEmblem=(cls='')=>`<span class="bk-emblem live pic ${cls}"><img src="${ART}mega.jpg" alt="" draggable="false"><b>${esc(t('blokken.mega'))}</b></span>`;

  // The title. In Dutch the drawn logo (its lettering is Dutch); in every other
  // language live text in the logo's colours (turquoise, then yellow, cream
  // outline, purple depth) next to the blocks emblem. Arabic letters join, so a
  // split word would fall apart there: it gets one gradient instead.
  function rainbowTitle(text,tag='h1',cls=''){
    if(K.state.language==='nl')return `<${tag} class="bk-title logo ${cls}"><img src="${ART}logo-nl.webp" alt="${esc(text)}" draggable="false"></${tag}>`;
    const emblem=`<img class="bk-title-emblem" src="${ART}emblem.webp" alt="" draggable="false">`;
    if(K.isRTL?.())return `<${tag} class="bk-title rtl ${cls}">${emblem}<span class="bk-title-text">${esc(text)}</span></${tag}>`;
    const chars=[...text],split=Math.ceil(chars.filter(c=>c!==' ').length*.6);let i=0;
    const letters=chars.map(ch=>ch===' '?'<span class="bk-sp"> </span>':`<span style="--c:${(i++)<split?'#2fd6f2':'#ffd23a'}">${esc(ch)}</span>`).join('');
    return `<${tag} class="bk-title ${cls}" aria-label="${esc(text)}">${emblem}<span class="bk-title-text" aria-hidden="true">${letters}</span></${tag}>`;
  }

  const ICON={
    back:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10.5 5 4 12l6.5 7M4.8 12H20" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    soundOn:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M15.5 9a4.2 4.2 0 0 1 0 6M18 6.5a7.6 7.6 0 0 1 0 11" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"/></svg>',
    soundOff:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="m15.5 9.5 5 5m0-5-5 5" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"/></svg>',
    grid:'<svg viewBox="0 0 24 24" aria-hidden="true"><g fill="currentColor"><rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/></g></svg>',
    undo:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 14 4 9l5-5" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M4.8 9H14a6 6 0 0 1 0 12h-3" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/></svg>',
    restart:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.4 13.5A7.5 7.5 0 1 1 17 6.6" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="M18.6 2.8 18 7.6l-4.8-.6" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    bulb:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8a6.6 6.6 0 0 0-3.9 11.9c.6.5 1 1.2 1 2V17h5.8v-.3c0-.8.4-1.5 1-2A6.6 6.6 0 0 0 12 2.8z" fill="currentColor"/><path d="M9.4 19.2h5.2M10.2 21.6h3.6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M9.7 7.4a3.4 3.4 0 0 1 2.3-1.3" stroke="#fff" stroke-width="1.8" stroke-linecap="round" fill="none" opacity=".8"/></svg>',
    bolt:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.6 2 5 13.4h5.6L9.4 22 19 9.8h-5.7z" fill="currentColor" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>',
    rotate:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12a7 7 0 1 0 2.1-5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="M6.4 2.6 6.8 7.4l4.7-.6" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    check:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.4 4.3L19 7.4" fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    play:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.2v13.6a1 1 0 0 0 1.5.9l10.6-6.8a1 1 0 0 0 0-1.7L9.5 4.3A1 1 0 0 0 8 5.2z" fill="currentColor"/></svg>',
    close:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6.5 6.5 11 11m0-11-11 11" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>',
    star:'<svg viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="bkStarG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3a1"/><stop offset=".5" stop-color="#ffc928"/><stop offset="1" stop-color="#f08c00"/></linearGradient></defs><path d="M32 4.5l8.3 17 18.7 2.7-13.5 13.2 3.2 18.6L32 47.2l-16.7 8.8 3.2-18.6L5 24.2l18.7-2.7z" fill="url(#bkStarG)" stroke="#d27800" stroke-width="2.6" stroke-linejoin="round"/><path d="M24 20.5c3-1.6 6.5-2 9.8-1.1" stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none" opacity=".75"/></svg>'
  };

  /* ---------------- the game ---------------- */
  let G=null;            // the running level (one at a time)

  function destroy(){
    if(!G)return;const g=G;G=null;
    try{g.ac.abort()}catch(e){}
    try{g.ro?.disconnect();g.mo?.disconnect()}catch(e){}
    for(const id of g.timers)clearTimeout(id);g.timers.clear();
    Snd.stopAll();
  }
  const later=(fn,ms)=>{const g=G;if(!g)return;const id=setTimeout(()=>{g.timers.delete(id);if(G===g&&g.root.isConnected)fn()},ms);g.timers.add(id)};

  // When any other screen replaces this one, the game cleans up after itself.
  function watchLeave(root){
    const mo=new MutationObserver(()=>{if(!root.isConnected)destroy()});
    mo.observe(K.app,{childList:true});return mo;
  }

  function save(){
    if(!G||G.phase!=='play')return;
    const b=store();
    b.attempts[G.lv.n]={v:D.LEVEL_DATA_VERSION,id:G.attemptId,placements:G.placements,trayRot:G.trayRot,order:G.order,boost:G.boost,hint:G.hint&&G.hint.kind==='place'?G.hint:null};
    b.last=G.lv.n;K.save();
  }

  K.showBlokken=()=>K.showBlokkenLevels();

  /* ---------------- level overview ---------------- */
  K.showBlokkenLevels=()=>{
    destroy();
    K.audio.setTrack('play').catch(()=>{});
    K.stopSpeech?.();
    const b=store();
    let next=1;while(next<TOTAL&&b.done.includes(next))next++;
    const tiles=Array.from({length:TOTAL},(_,i)=>{
      const n=i+1,done=b.done.includes(n),open=unlocked(n),cur=n===next&&!done;
      const label=done?t('blokken.tileDone',{n}):open?t('blokken.tileOpen',{n}):t('blokken.tileLocked',{n,prev:n-1});
      return `<button class="bk-level-tile ${done?'done':''} ${open?'':'locked'} ${n===b.last&&open?'last':''} ${cur?'current':''}" data-level="${n}" ${open?'':'aria-disabled="true"'} aria-label="${esc(label)}">
        <b>${n}</b>
      </button>`;
    }).join('');
    const f=K.frame(`<section class="blokken-root bk-levels fade-in">
      <div class="bk-bg" aria-hidden="true"></div>
      <header class="bk-head">
        ${rainbowTitle(t('blokken.title'))}
        <div class="bk-tools">
          <button class="bk-round" id="bkBack" aria-label="${esc(t('blokken.toGames'))}">${ICON.back}</button>
          <button class="bk-round bk-sound" aria-label="${esc(t('blokken.sound'))}" aria-pressed="${K.state.soundOn!==false}">${K.state.soundOn!==false?ICON.soundOn:ICON.soundOff}</button>
        </div>
      </header>
      <div class="bk-levels-card">
        <img class="bk-deco" src="${ART}emblem.webp" alt="" draggable="false">
        <h2>${esc(t('blokken.pickLevel'))}</h2>
        <p>${esc(t('blokken.levelsDone',{n:b.done.length,total:TOTAL}))}</p>
        <div class="bk-level-grid">${tiles}</div>
        <button class="bk-btn yellow bk-go" data-level="${next}">${ICON.play}<span>${esc(t('blokken.levelOf',{n:next,total:TOTAL}))}</span></button>
        ${b.badge?`<div class="bk-badge-row"><span class="bk-badge-mini">${ICON.star}</span><b>${esc(t('blokken.badge'))}</b></div>`:''}
      </div>
    </section>`);
    f.querySelector('#bkBack').onclick=()=>{K.sfx('tap');K.backFromGame?K.backFromGame():K.showGameChest()};
    bindSound(f);
    f.querySelectorAll('[data-level]').forEach(btn=>btn.onclick=()=>{
      const n=Number(btn.dataset.level);
      if(!unlocked(n)){Snd.play('invalid');wiggle(btn);K.toast(t('blokken.tileLocked',{n,prev:n-1}));return}
      K.sfx('tap');K.startBlokken(n);
    });
    K.blokkenScreen='levels';
  };

  function bindSound(f){
    const b=f.querySelector('.bk-sound');if(!b)return;
    b.onclick=async()=>{
      const on=K.state.soundOn!==false||K.state.musicOn!==false;
      K.audio.setSfx(!on);
      const now=K.state.soundOn!==false;b.innerHTML=now?ICON.soundOn:ICON.soundOff;b.setAttribute('aria-pressed',String(now));
      if(now)Snd.play('pick');
      await K.audio.setMusic(!on).catch(()=>{});
    };
  }
  function wiggle(el){if(!el||reduced())return;el.classList.remove('bk-wiggle');void el.offsetWidth;el.classList.add('bk-wiggle');setTimeout(()=>el.classList.remove('bk-wiggle'),420)}

  /* ---------------- start a level ---------------- */
  K.startBlokken=(n,{fresh=false}={})=>{
    preloadArt();
    n=Math.max(1,Math.min(TOTAL,Math.floor(Number(n)||1)));
    if(!unlocked(n))return K.showBlokkenLevels();
    destroy();
    const lv=D.level(n);const b=store();
    let a=fresh?null:restoreAttempt(lv,b.attempts[n]);
    if(!a){a={id:newAttemptId(n),placements:{},trayRot:{},order:[],boost:freshBoost(),hint:null};K.startScoreRun?.()}
    b.last=n;
    K.audio.setTrack('play').catch(()=>{});
    K.stopSpeech?.();
    const f=K.frame(`<section class="blokken-root bk-play fade-in" data-level="${n}" style="--cols:${lv.cols};--rows:${lv.rows}">
      <div class="bk-bg" aria-hidden="true"></div>
      <header class="bk-head">
        ${rainbowTitle(t('blokken.title'))}
        <div class="bk-prog">
          <ol class="bk-dots" aria-hidden="true">${Array.from({length:TOTAL},(_,i)=>{const k=i+1,d=b.done.includes(k);return `<li class="${d?'done':''} ${k===n?'cur':''}">${d&&k!==n?ICON.check:`<span>${k}</span>`}</li>`}).join('')}</ol>
          <span class="bk-pill bk-level-pill">${esc(t('blokken.levelOf',{n,total:TOTAL}))}</span>
        </div>
        <div class="bk-tools">
          <button class="bk-round" id="bkLevels" aria-label="${esc(t('blokken.levels'))}">${ICON.grid}</button>
          <button class="bk-round" id="bkBack" aria-label="${esc(t('blokken.toGames'))}">${ICON.back}</button>
          <button class="bk-round bk-sound" aria-label="${esc(t('blokken.sound'))}" aria-pressed="${K.state.soundOn!==false}">${K.state.soundOn!==false?ICON.soundOn:ICON.soundOff}</button>
        </div>
      </header>
      <div class="bk-board-panel">
        <div class="bk-board-wrap">
          <div class="bk-board" role="application" tabindex="-1" aria-roledescription="${esc(t('blokken.boardRole'))}" aria-label="${esc(t('blokken.boardLabel'))}" aria-describedby="bkKbHelp">
            <div class="bk-cells"><svg class="bk-plate" viewBox="0 0 ${lv.cols} ${lv.rows}" preserveAspectRatio="none" aria-hidden="true"><path d="${outlinePath(lv.board)}"/></svg>${lv.board.map(([x,y])=>`<i class="bk-cell" style="--x:${x};--y:${y}" data-cell="${x},${y}"></i>`).join('')}</div>
            <div class="bk-hint-layer" aria-hidden="true"></div>
            <div class="bk-preview" aria-hidden="true"></div>
            <div class="bk-on"></div>
            <svg class="bk-outline" viewBox="0 0 ${lv.cols} ${lv.rows}" preserveAspectRatio="none" aria-hidden="true"><path d="${outlinePath(lv.board)}" pathLength="100"/></svg>
          </div>
        </div>
      </div>
      <div class="bk-side">
        <div class="bk-tray-panel">
          <div class="bk-tray-head"><b class="bk-ribbon">${esc(t('blokken.drag'))}</b><small>${esc(t('blokken.fill'))}</small>${lv.boost?`<span class="bk-meter" id="bkMeter"></span><button class="bk-btn tiny yellow boost" id="bkBoost" hidden>${ICON.bolt}<span>${esc(t('blokken.boostUse'))}</span></button>`:''}<span class="bk-pill bk-count" aria-live="polite"></span></div>
          <div class="bk-banner" role="status" aria-live="polite" hidden></div>
          <div class="bk-tray" role="list" aria-label="${esc(t('blokken.trayLabel'))}"></div>
        </div>
      </div>
      <footer class="bk-foot">
        <div class="bk-actions">
          <button class="bk-btn small blue" id="bkUndo">${ICON.undo}<span>${esc(t('blokken.undo'))}</span></button>
          <button class="bk-btn small blue" id="bkRestart">${ICON.restart}<span>${esc(t('blokken.restart'))}</span></button>
          <button class="bk-btn small yellow" id="bkHelp">${ICON.bulb}<span>${esc(t('blokken.help'))}</span></button>
        </div>
      </footer>
      <button class="bk-rotate" id="bkRotate" hidden aria-label="${esc(t('blokken.rotate'))}">${ICON.rotate}<small>${esc(t('blokken.rotate'))}</small></button>
      <div class="bk-drag-layer" aria-hidden="true"></div>
      <p class="bk-sr" id="bkKbHelp">${esc(t('blokken.kbHelp'))}</p>
      <p class="bk-sr bk-say" aria-live="assertive"></p>
    </section>`);
    const root=f.querySelector('.blokken-root');
    G={lv,root,f,attemptId:a.id,placements:a.placements,trayRot:a.trayRot,order:a.order,boost:a.boost,hint:a.hint,
       undo:[],selected:null,carry:null,drag:null,phase:'play',cell:40,tc:24,timers:new Set(),ac:new AbortController(),booked:null};
    const g=G;
    g.ro=new ResizeObserver(()=>{if(G===g){if(g.drag)cancelDrag('resize');layout()}});
    g.ro.observe(root);
    g.mo=watchLeave(root);
    bindPlay();
    render();layout();
    save();
    // First visit of a level that brings something new: a short coach bubble.
    const seen=store().seen;
    if(lv.guided&&!Object.keys(g.placements).length)later(()=>{if(!g.hint)showHint('guide')},250);
    if(lv.n===6&&!seen.rotate)later(()=>coach('rotate'),350);
    else if(lv.n===4&&!seen.boost)later(()=>coach('boost'),350);
    K.blokkenScreen='play';
  };

  /* ---------------- layout: sizes only, never the puzzle ---------------- */
  function layout(){
    const g=G;if(!g)return;const {root,lv}=g;
    const wrap=root.querySelector('.bk-board-wrap'),board=root.querySelector('.bk-board');
    if(!wrap||!board)return;
    const max=76;
    const wide=document.documentElement.dataset.shape==='wide';
    if(!wide&&root.classList.contains('bk-play')){
      // Tall frame: the board panel is as high as the figure needs at the
      // width it has (never more than 60% of the room), the tray gets the rest.
      const cs=getComputedStyle(root);const head=root.querySelector('.bk-head'),foot=root.querySelector('.bk-foot');
      const room=root.clientHeight-parseFloat(cs.paddingTop)-parseFloat(cs.paddingBottom)-head.offsetHeight-foot.offsetHeight-3*8;
      const panel=root.querySelector('.bk-board-panel');const inner=wrap.clientWidth;
      const cw=Math.min(inner/lv.cols,max);
      const want=Math.ceil(cw*lv.rows+(panel.offsetHeight-wrap.clientHeight));
      root.style.setProperty('--board-h',Math.max(140,Math.min(want,Math.round(room*.6)))+'px');
    }else root.style.removeProperty('--board-h');
    const W=wrap.clientWidth,H=wrap.clientHeight;
    const cell=Math.max(14,Math.floor(Math.min(W/lv.cols,H/lv.rows,max)));
    g.cell=cell;board.style.setProperty('--cell',cell+'px');
    board.style.width=cell*lv.cols+'px';board.style.height=cell*lv.rows+'px';
    // Tray: the biggest piece size at which every slot fits; below the minimum the tray scrolls.
    const tray=root.querySelector('.bk-tray');
    if(!tray)return;                       // the result card is up
    const tcs=getComputedStyle(tray);
    const tw=tray.clientWidth-parseFloat(tcs.paddingLeft)-parseFloat(tcs.paddingRight),th=tray.clientHeight-parseFloat(tcs.paddingTop)-parseFloat(tcs.paddingBottom);
    const slots=lv.pieces.filter(p=>!g.placements[p.id]).map(p=>{const {w,h}=D.dims(p.cells);return lv.rotate?{w:Math.max(w,h),h:Math.max(w,h)}:{w,h}});
    const gap=8,pad=10,minSlot=46;
    const fits=tc=>{
      let x=0,rowH=0,y=0;
      for(const s of slots){const sw=Math.max(minSlot,s.w*tc+pad*2),sh=Math.max(minSlot,s.h*tc+pad*2);
        if(sw>tw)return false;
        if(x>0&&x+sw>tw){y+=rowH+gap;x=0;rowH=0}
        x+=sw+gap;rowH=Math.max(rowH,sh)}
      return y+rowH<=th;
    };
    let tc=Math.min(Math.round(cell*.82),44);
    while(tc>14&&!fits(tc))tc--;
    tray.style.setProperty('--tc',tc+'px');
    // The real layout has the last word (fonts, rounding): shrink until nothing is cut off.
    tray.classList.remove('scrolls');
    while(tc>14&&tray.scrollHeight>tray.clientHeight+1){tc--;tray.style.setProperty('--tc',tc+'px')}
    g.tc=tc;
    tray.classList.toggle('scrolls',tray.scrollHeight>tray.clientHeight+1);
    placeRotate();
  }

  /* ---------------- rendering ---------------- */
  const pieceNo=id=>G.lv.pieces.findIndex(p=>p.id===id)+1;
  const pieceName=p=>t('blokken.pieceName',{n:pieceNo(p.id),color:t('blokken.color.'+p.color),symbol:t('blokken.sym.'+p.symbol)});
  const rotOf=id=>G.placements[id]?G.placements[id].rot:(G.trayRot[id]||0);

  function render(){
    const g=G;if(!g)return;const {root,lv}=g;
    // board pieces
    const on=root.querySelector('.bk-on');
    on.innerHTML=lv.pieces.filter(p=>g.placements[p.id]).map(p=>{
      const pl=g.placements[p.id];const {w,h}=D.dims(D.rotate(p.cells,pl.rot));
      const take=g.hint?.kind==='takeBack'&&g.hint.id===p.id;
      return `<button class="bk-piece on ${g.selected===p.id?'sel':''} ${take?'take':''}" data-piece="${p.id}" style="--x:${pl.x};--y:${pl.y};--w:${w};--h:${h}" aria-label="${esc(pieceName(p)+' · '+t('blokken.onBoard'))}">${pieceSVG(p,pl.rot)}</button>`;
    }).join('');
    // tray: one slot per piece, in a fixed order; an empty slot keeps its place
    const tray=root.querySelector('.bk-tray');
    tray.innerHTML=lv.pieces.map(p=>{
      const {w,h}=D.dims(p.cells);const sw=lv.rotate?Math.max(w,h):w,sh=lv.rotate?Math.max(w,h):h;
      if(g.placements[p.id])return '';
      const r=g.trayRot[p.id]||0;const d=D.dims(D.rotate(p.cells,r));
      const hinted=g.hint&&g.hint.kind==='place'&&g.hint.id===p.id;
      return `<div class="bk-slot" role="listitem" style="--sw:${sw};--sh:${sh}"><button class="bk-piece tray ${g.selected===p.id?'sel':''} ${hinted?'hinted':''}" data-piece="${p.id}" style="--w:${d.w};--h:${d.h}" aria-label="${esc(pieceName(p)+' · '+t('blokken.inTray'))}">${pieceSVG(p,r)}</button></div>`;
    }).join('');
    // hint layer
    const hl=root.querySelector('.bk-hint-layer');hl.innerHTML='';
    if(g.hint&&g.hint.kind==='place'){
      const p=D.pieceById(lv,g.hint.id);const cells=D.cellsAt(p,g.hint.x,g.hint.y,g.hint.rot);const {w,h}=D.dims(D.rotate(p.cells,g.hint.rot));
      hl.innerHTML=`<div class="bk-hint ${g.hint.source||''}" style="--x:${g.hint.x};--y:${g.hint.y};--w:${w};--h:${h}">${pieceSVG(p,g.hint.rot,'ghosty')}</div>`+
        cells.map(([x,y])=>`<i class="bk-hint-cell ${g.hint.source||''}" style="--x:${x};--y:${y}"></i>`).join('');
    }
    // counter, buttons, banner
    const placed=Object.keys(g.placements).length;
    root.querySelector('.bk-count').innerHTML=t('blokken.placed',{n:`<b>${placed}</b>`,total:`<b>${lv.pieces.length}</b>`});
    root.querySelector('#bkUndo').disabled=!g.undo.length;
    root.querySelector('#bkRestart').disabled=!placed&&!Object.values(g.trayRot).some(Boolean);
    const boostBtn=root.querySelector('#bkBoost'),meter=root.querySelector('#bkMeter');
    if(boostBtn){
      boostBtn.hidden=!g.boost.available;
      const n=Math.min(BOOST_NEED,g.boost.credited.length);
      meter.hidden=g.boost.available;
      meter.className=`bk-meter ${g.boost.used?'used':''}`;
      meter.innerHTML=`${ICON.bolt}${Array.from({length:BOOST_NEED},(_,i)=>`<i class="${g.boost.earned||i<n?'on':''}"></i>`).join('')}`;
      meter.setAttribute('aria-label',g.boost.used?t('blokken.boostUsedLabel'):t('blokken.boostMeter',{n:g.boost.earned?BOOST_NEED:n,total:BOOST_NEED}));
      meter.setAttribute('role','img');
    }
    renderBanner();
    layout();
  }

  function renderBanner(){
    const g=G;const el=g.root.querySelector('.bk-banner');const h=g.hint;
    if(!h){el.hidden=true;el.innerHTML='';return}
    el.hidden=false;
    if(h.kind==='place'){
      const p=D.pieceById(g.lv,h.id);const turn=g.lv.rotate&&rotOf(h.id)!==h.rot;
      const text=h.source==='guide'?t('blokken.guide'):h.source==='boost'?t('blokken.boostHint'):t('blokken.helpPlace');
      el.className=`bk-banner ${h.source||''}`;
      el.innerHTML=`${h.source==='boost'?`<b class="bk-boost-tag">${ICON.bolt}${esc(t('blokken.boost'))}</b>`:''}<span>${esc(text)}${turn?' '+esc(t('blokken.helpTurn')):''}</span>${h.source==='guide'?'':`<button class="bk-x bk-close" aria-label="${esc(t('blokken.cancel'))}">${ICON.close}</button>`}`;
    }else{
      el.className='bk-banner take';
      el.innerHTML=`<span>${esc(h.boost?t('blokken.boostNeedMove'):t('blokken.helpTakeBack'))}</span><button class="bk-btn tiny blue" data-act="takeBack">${esc(t('blokken.takeBack'))}</button><button class="bk-x bk-close" aria-label="${esc(t('blokken.cancel'))}">${ICON.close}</button>`;
    }
  }

  // The rotate button sits at the selected piece (levels with turning only).
  function placeRotate(){
    const g=G;if(!g)return;const btn=g.root.querySelector('#bkRotate');if(!btn)return;
    const el=g.selected&&g.phase==='play'&&!g.drag?g.root.querySelector(`.bk-piece[data-piece="${g.selected}"]`):null;
    if(!g.lv.rotate||!el){btn.hidden=true;return}
    const L=localRect(el);const R=localRect(el.closest('.bk-tray,.bk-board-panel')||g.root);
    btn.hidden=false;
    const bw=btn.offsetWidth||52,bh=btn.offsetHeight||52;
    // next to the piece (never on top of it, so the piece stays grabbable),
    // inside the tray or the board panel when there is room
    const tries=[[L.right+4,L.top+L.height/2-bh/2],[L.left-bw-4,L.top+L.height/2-bh/2],[L.left+L.width/2-bw/2,L.top-bh-4],[L.left+L.width/2-bw/2,L.bottom+4]];
    const inside=([x,y])=>x>=R.left&&y>=R.top&&x+bw<=R.right&&y+bh<=R.bottom;
    let [x,y]=tries.find(inside)||tries.find(([x,y])=>x>=0&&y>=0&&x+bw<=localRect(g.root).width&&y+bh<=localRect(g.root).height)||tries[0];
    x=Math.max(2,x);y=Math.max(2,y);
    btn.style.left=x+'px';btn.style.top=y+'px';
  }

  /* ---------------- coordinates ---------------- */
  // The frame is scaled with a CSS transform on big screens; everything inside
  // the root is laid out in its own (unscaled) pixels.
  function scale(){const r=G.root.getBoundingClientRect();return r.width/(G.root.offsetWidth||r.width)||1}
  function toLocal(cx,cy){const r=G.root.getBoundingClientRect(),s=scale();return {x:(cx-r.left)/s,y:(cy-r.top)/s}}
  function localRect(el){const r=el.getBoundingClientRect(),o=G.root.getBoundingClientRect(),s=scale();return {left:(r.left-o.left)/s,top:(r.top-o.top)/s,width:r.width/s,height:r.height/s,right:(r.right-o.left)/s,bottom:(r.bottom-o.top)/s}}

  /* ---------------- actions (every change of the board goes through here) ---------------- */
  const snapshot=()=>({placements:JSON.parse(JSON.stringify(G.placements)),trayRot:{...G.trayRot},order:G.order.slice()});
  function pushUndo(){G.undo.push(snapshot());if(G.undo.length>60)G.undo.shift()}
  function checkHint(){
    const g=G,h=g.hint;if(!h)return;
    if(h.kind==='place'&&(g.placements[h.id]||!D.canPlace(g.lv,g.placements,h.id,h.x,h.y,h.rot)))g.hint=null;
    else if(h.kind==='takeBack'&&!g.placements[h.id])g.hint=null;
  }

  // Put piece `id` at (x,y,rot). Returns false (and changes nothing) when it does not fit.
  function place(id,x,y,rot,{from}={}){
    const g=G;if(!g||g.phase!=='play')return false;
    if(!D.canPlace(g.lv,g.placements,id,x,y,rot))return false;
    const was=g.placements[id];
    if(was&&was.x===x&&was.y===y&&was.rot===rot)return true;
    pushUndo();
    const helped=(g.hint&&g.hint.kind==='place'&&g.hint.id===id)||g.boost.helped.includes(id);
    g.placements[id]={x,y,rot};delete g.trayRot[id];
    g.order=g.order.filter(o=>o!==id);g.order.push(id);
    if(g.hint&&g.hint.kind==='place'&&g.hint.id===id)g.hint=null;
    checkHint();
    g.selected=null;
    // BONUS BOOST: three different pieces put down without help earn one boost,
    // at most once per level attempt. A piece counts once, however often it moves.
    let earned=false;
    if(g.lv.boost&&!was&&!helped&&!g.boost.credited.includes(id)){
      g.boost.credited.push(id);
      if(!g.boost.earned&&g.boost.credited.length>=BOOST_NEED){g.boost.earned=true;g.boost.available=true;earned=true}
    }
    const done=D.isComplete(g.lv,g.placements);
    render();save();
    Snd.play('place');sparkle(id);
    say(t('blokken.saidPlaced',{piece:pieceName(D.pieceById(g.lv,id))}));
    if(earned&&!done)boostToast();
    if(done)complete();
    return true;
  }
  function toTray(id){
    const g=G;if(!g||g.phase!=='play'||!g.placements[id])return;
    pushUndo();
    g.trayRot[id]=g.placements[id].rot;delete g.placements[id];
    g.order=g.order.filter(o=>o!==id);
    if(g.selected===id)g.selected=null;
    checkHint();render();save();Snd.play('back');
  }
  function rotateSelected(){
    const g=G;if(!g||!g.lv.rotate||g.phase!=='play')return;
    if(g.carry){g.carry.rot=(g.carry.rot+1)%4;Snd.play('rotate');drawCarry();return}
    if(g.drag&&g.drag.active){g.drag.rot=(g.drag.rot+1)%4;Snd.play('rotate');paintGhost();moveDrag(g.drag.lastX,g.drag.lastY);return}
    const id=g.selected;if(!id)return;
    const p=D.pieceById(g.lv,id);
    if(g.placements[id]){
      // On the board: turn in place around the piece's middle; if it does not fit there, nothing changes.
      const pl=g.placements[id];const r=(pl.rot+1)%4;
      const a=D.dims(D.rotate(p.cells,pl.rot)),b=D.dims(D.rotate(p.cells,r));
      const cx=pl.x+a.w/2,cy=pl.y+a.h/2;
      const tries=[[Math.round(cx-b.w/2),Math.round(cy-b.h/2)],[pl.x,pl.y],[Math.floor(cx-b.w/2),Math.floor(cy-b.h/2)],[Math.ceil(cx-b.w/2),Math.ceil(cy-b.h/2)]];
      const ok=tries.find(([x,y])=>D.canPlace(g.lv,g.placements,id,x,y,r));
      if(!ok){Snd.play('invalid');wiggle(g.root.querySelector(`.bk-piece[data-piece="${id}"]`));return}
      pushUndo();g.placements[id]={x:ok[0],y:ok[1],rot:r};checkHint();
      Snd.play('rotate');render();save();spin(id);
      if(D.isComplete(g.lv,g.placements))complete();
      return;
    }
    pushUndo();g.trayRot[id]=((g.trayRot[id]||0)+1)%4;
    Snd.play('rotate');render();save();spin(id);
    store().seen.rotate=true;
  }
  function spin(id){if(reduced())return;const el=G.root.querySelector(`.bk-piece[data-piece="${id}"]`);if(!el)return;el.classList.add('bk-spin');setTimeout(()=>el.classList.remove('bk-spin'),220)}
  function undo(){
    const g=G;if(!g||g.phase!=='play'||!g.undo.length)return;
    cancelDrag('undo');cancelCarry(false);
    const s=g.undo.pop();g.placements=s.placements;g.trayRot=s.trayRot;g.order=s.order;g.selected=null;
    checkHint();render();save();Snd.play('undo');
  }
  // Restart clears the board of this attempt only. The attempt id stays, and so
  // does its BONUS BOOST state: pieces already counted stay counted, an earned
  // boost is not earned again, an unused one is kept, a used one stays used.
  function restart(confirmed=false){
    const g=G;if(!g||g.phase!=='play')return;
    const placed=Object.keys(g.placements).length;
    if(placed&&!confirmed)return askRestart();
    cancelDrag('restart');cancelCarry(false);
    g.placements={};g.trayRot={};g.order=[];g.undo=[];g.selected=null;g.hint=null;
    render();save();Snd.play('undo');
  }
  function askRestart(){
    const g=G;
    const o=document.createElement('div');o.className='bk-modal';o.setAttribute('role','dialog');o.setAttribute('aria-modal','true');
    o.innerHTML=`<div class="bk-modal-card"><h2>${esc(t('blokken.restartAsk'))}</h2><p>${esc(t('blokken.restartSub'))}</p><div class="bk-modal-actions"><button class="bk-btn blue bk-close" data-no>${esc(t('blokken.restartNo'))}</button><button class="bk-btn yellow" data-yes>${ICON.restart}<span>${esc(t('blokken.restartYes'))}</span></button></div></div>`;
    g.root.appendChild(o);o.querySelector('[data-yes]').focus();
    const close=()=>o.remove();
    o.querySelector('[data-no]').onclick=()=>{K.sfx('tap');close()};
    o.querySelector('[data-yes]').onclick=()=>{close();restart(true)};
    o.addEventListener('pointerdown',e=>{if(e.target===o)close()});
  }

  /* ---------------- help and BONUS BOOST ---------------- */
  // Both look at the board as it is NOW. Help is always there; the boost is
  // used up only once it really showed a spot that leads to a full figure.
  function showHint(source='help'){
    const g=G;if(!g||g.phase!=='play')return;
    cancelCarry(false);
    const h=D.hint(g.lv,g.placements,g.order);
    if(h.kind==='done')return;
    if(h.kind==='place'){
      g.hint={kind:'place',id:h.id,x:h.x,y:h.y,rot:h.rot,source};
      if(!g.boost.helped.includes(h.id))g.boost.helped.push(h.id);   // a helped placement never counts for the boost
      if(source==='boost'){g.boost.available=false;g.boost.used=true;Snd.play('boostUsed')}
      else Snd.play('pick');
      g.selected=h.id;
    }else{
      g.hint={kind:'takeBack',id:h.id,ids:h.ids,boost:source==='boost'};
      Snd.play('invalid');
    }
    render();save();
    say(g.root.querySelector('.bk-banner')?.textContent||'');
  }
  function boostToast(){
    const g=G;Snd.play('boostEarned');
    const el=document.createElement('div');el.className='bk-boost-toast';el.setAttribute('role','status');
    // the banner art carries only the feature's fixed name, so it is the same in every language
    el.innerHTML=`<img class="bk-boost-art" src="${ART}boost-banner.webp" alt="${esc(t('blokken.boost'))}" draggable="false"><small>${esc(t('blokken.boostEarned'))}</small>`;
    g.root.appendChild(el);later(()=>el.remove(),TIME.toast+300);
    const btn=g.root.querySelector('#bkBoost');if(btn&&!reduced()){btn.classList.add('bk-glow');later(()=>btn.classList.remove('bk-glow'),1600)}
  }
  function coach(kind){
    const g=G;if(!g||g.phase!=='play')return;
    store().seen[kind]=true;K.save();
    const el=document.createElement('div');el.className=`bk-coach ${kind}`;el.setAttribute('role','dialog');el.setAttribute('aria-label',t(`blokken.${kind}IntroTitle`));
    el.innerHTML=`<div class="bk-coach-art" aria-hidden="true">${kind==='rotate'?`<span class="bk-coach-spin">${pieceSVG({cells:[[0,0],[0,1],[1,1]],color:'cyan',symbol:'drop'},0)}</span>${ICON.rotate}`:ICON.bolt}</div><div><b>${esc(t(`blokken.${kind}IntroTitle`))}</b><p>${esc(t(`blokken.${kind}Intro`))}</p></div><button class="bk-btn tiny yellow bk-close">${esc(t('blokken.ok'))}</button>`;
    g.root.querySelector('.bk-board-panel').appendChild(el);
    el.querySelector('button').onclick=()=>{K.sfx('tap');el.remove()};
    later(()=>el.remove(),9000);
  }

  /* ---------------- MEGA ZET! and the result ---------------- */
  function complete(){
    const g=G;if(!g||g.phase!=='play')return;
    // The whole board is checked again, from the state (not from the screen).
    if(!D.isComplete(g.lv,g.placements))return;
    cancelDrag('complete');cancelCarry(false);
    g.phase='mega';g.selected=null;g.hint=null;
    // Booked at once and exactly once per attempt id — the celebration is only a show.
    g.booked=K.blokkenReward({level:g.lv.n,attemptId:g.attemptId,completed:true});
    const b=store();delete b.attempts[g.lv.n];K.save();
    render();
    const root=g.root;root.classList.add('bk-done');
    later(()=>{
      root.classList.add('bk-mega');
      Snd.play(g.lv.n===TOTAL?'finale':'mega');
      const m=document.createElement('div');m.className='bk-mega-text';m.setAttribute('role','status');
      m.innerHTML=megaEmblem();root.querySelector('.bk-board-panel').appendChild(m);
      if(!reduced())K.celebrateAt?.(K.app.querySelector('.game-frame'),{...center(root.querySelector('.bk-board')),count:g.lv.n===TOTAL?60:30});
      say(t('blokken.mega'));
    },TIME.snap+80);
    later(()=>showResult(),TIME.snap+80+TIME.mega);
  }
  function center(el){const fr=K.app.querySelector('.game-frame').getBoundingClientRect(),r=el.getBoundingClientRect();return {x:r.left-fr.left+r.width/2,y:r.top-fr.top+r.height/2}}

  function showResult(){
    const g=G;if(!g)return;g.phase='result';
    const {root,lv}=g;const last=lv.n===TOTAL;const bk=g.booked||{};
    root.classList.add('bk-result');
    const side=root.querySelector('.bk-tray-panel');
    const chips=[bk.xp?`<span class="bk-chip">+${bk.xp} XP</span>`:'',bk.coins?`<span class="bk-chip coin">${K.icon?K.icon('coin'):''}+${bk.coins}</span>`:''].join('');
    side.innerHTML=`<div class="bk-result-card ${last?'final':''}" role="dialog" aria-label="${esc(last?t('blokken.allDone'):t('blokken.done'))}">
      <div class="bk-result-star">${megaEmblem()}</div>
      <h2>${esc(last?t('blokken.allDone'):t('blokken.done'))}</h2>
      ${last?`<p class="bk-badge-line">${esc(t('blokken.badge'))}</p>`:''}
      <div class="bk-chips">${chips}</div>
    </div>`;
    const foot=root.querySelector('.bk-foot');
    foot.innerHTML=last?`<div class="bk-actions result">
        <button class="bk-btn blue" id="bkAgain">${ICON.restart}<span>${esc(t('blokken.playAgain'))}</span></button>
        <button class="bk-btn yellow" id="bkGames">${ICON.play}<span>${esc(t('blokken.backToGames'))}</span></button></div>`
      :`<div class="bk-actions result">
        <button class="bk-btn yellow" id="bkNext">${ICON.play}<span>${esc(t('blokken.next'))}</span></button>
        <button class="bk-btn blue" id="bkAgain">${ICON.restart}<span>${esc(t('blokken.replay'))}</span></button>
        <button class="bk-btn small ghost" id="bkToLevels">${ICON.grid}<span>${esc(t('blokken.toLevels'))}</span></button>
        <button class="bk-btn small ghost" id="bkGames">${ICON.back}<span>${esc(t('blokken.toGames'))}</span></button></div>`;
    foot.querySelector('#bkAgain').onclick=()=>{K.sfx('tap');K.startBlokken(lv.n,{fresh:true})};
    foot.querySelector('#bkGames').onclick=()=>{K.sfx('tap');leaveToGames()};
    foot.querySelector('#bkNext')?.addEventListener('click',()=>{K.sfx('tap');K.startBlokken(lv.n+1)});
    foot.querySelector('#bkToLevels')?.addEventListener('click',()=>{K.sfx('tap');K.showBlokkenLevels()});
    if(!reduced())K.celebrate?.(last?'gold':'quiz',last?K.app.querySelector('.game-frame'):side.querySelector('.bk-result-star'));
    if(last)later(()=>{if(!reduced())K.celebrate?.('quiz',side.querySelector('.bk-result-star'))},900);
    layout();
    (foot.querySelector('#bkNext')||foot.querySelector('#bkAgain')).focus({preventScroll:true});
    if(bk.coins)later(()=>K.sfx('reward'),300);
  }
  const leaveToGames=()=>{destroy();K.backFromGame?K.backFromGame():K.showGameChest()};

  // Books one finished level: XP and coins exactly once per attempt id, so a
  // reload, a result window opened twice or a repeated event never pays twice.
  // The first time a level is finished pays the most; replaying a level pays a little.
  K.blokkenReward=r=>{
    if(!r||r.completed!==true||typeof r.attemptId!=='string'||!r.attemptId)return null;
    const n=Math.floor(Number(r.level));if(!(n>=1&&n<=TOTAL))return null;
    const b=store();
    if(b.booked.includes(r.attemptId))return {xp:0,coins:0,duplicate:true};
    b.booked.push(r.attemptId);if(b.booked.length>60)b.booked.splice(0,b.booked.length-60);
    const first=!b.done.includes(n);
    if(first)b.done.push(n);b.done.sort((a,c)=>a-c);
    b.plays++;
    const xp=first?10+3*n:4;
    const coins=first?2+n+(n===TOTAL?10:0):0;
    const paid=K.awardPoints(xp);
    const earned=coins?K.awardCoins(coins,{runCap:K.scoreRules.runCoins}):{granted:0};
    let badge=false;
    if(b.done.length>=TOTAL&&!b.badge){b.badge=true;badge=true}
    if(n<TOTAL)b.last=n+1;
    K.touchStreak?.();K.save();
    return {xp:paid.granted,coins:earned.granted,first,badge,duplicate:false};
  };

  /* ---------------- effects ---------------- */
  function sparkle(id){
    if(reduced())return;const g=G;const el=g.root.querySelector(`.bk-on .bk-piece[data-piece="${id}"]`);if(!el)return;
    el.classList.add('bk-plop');later(()=>el.classList.remove('bk-plop'),TIME.sparkle);
    const L=localRect(el);const layer=g.root.querySelector('.bk-drag-layer');
    for(let i=0;i<6;i++){
      const s=document.createElement('i');s.className='bk-spark';
      const a=(i/6)*Math.PI*2+Math.random()*.6,r=Math.max(L.width,L.height)*.55;
      s.style.left=L.left+L.width/2+'px';s.style.top=L.top+L.height/2+'px';
      s.style.setProperty('--dx',Math.cos(a)*r+'px');s.style.setProperty('--dy',Math.sin(a)*r+'px');
      layer.appendChild(s);later(()=>s.remove(),TIME.sparkle+60);
    }
  }
  const say=text=>{const el=G?.root.querySelector('.bk-say');if(el){el.textContent='';requestAnimationFrame(()=>{el.textContent=text})}};
  // FLIP: the element starts where the dragged copy was and glides home.
  function glide(id,from,ms,{wig=false}={}){
    if(reduced()||!from)return;const el=G.root.querySelector(`.bk-piece[data-piece="${id}"]`);if(!el)return;
    const to=localRect(el);if(!to.width)return;
    const sx=from.width/to.width,dx=from.left-to.left,dy=from.top-to.top;
    el.style.transition='none';el.style.transformOrigin='0 0';el.style.transform=`translate(${dx}px,${dy}px) scale(${sx})`;el.style.zIndex='6';
    void el.offsetWidth;
    el.style.transition=`transform ${ms}ms cubic-bezier(.2,.9,.3,1.15)`;el.style.transform='';
    later(()=>{el.style.transition='';el.style.zIndex='';el.style.transformOrigin='';if(wig)wiggle(el)},ms+10);
  }

  /* ---------------- pointer drag ---------------- */
  function bindPlay(){
    const g=G;const {root,ac}=g;const sig={signal:ac.signal};
    root.querySelector('#bkBack').onclick=()=>{K.sfx('tap');leaveToGames()};
    root.querySelector('#bkLevels').onclick=()=>{K.sfx('tap');K.showBlokkenLevels()};
    bindSound(root);
    root.querySelector('#bkUndo').onclick=()=>undo();
    root.querySelector('#bkRestart').onclick=()=>restart();
    root.querySelector('#bkHelp').onclick=()=>showHint('help');
    root.querySelector('#bkBoost')?.addEventListener('click',()=>{if(G?.boost.available)showHint('boost')});
    root.querySelector('#bkRotate').addEventListener('pointerdown',e=>e.stopPropagation());
    root.querySelector('#bkRotate').onclick=e=>{e.stopPropagation();rotateSelected()};
    root.querySelector('.bk-banner').addEventListener('click',e=>{
      const b=e.target.closest('button');if(!b)return;
      if(b.dataset.act==='takeBack'&&G.hint?.kind==='takeBack'){const id=G.hint.id;G.hint=null;toTray(id);return}
      if(b.classList.contains('bk-x')){G.hint=null;render();save();Snd.play('back')}
    });
    root.addEventListener('pointerdown',onDown,sig);
    root.addEventListener('pointermove',onMove,sig);
    root.addEventListener('pointerup',onUp,sig);
    root.addEventListener('pointercancel',()=>cancelDrag('pointercancel'),sig);
    root.addEventListener('lostpointercapture',e=>{if(G?.drag&&G.drag.pointerId===e.pointerId&&!G.drag.ending)cancelDrag('lostcapture')},sig);
    // Keyboard activation of a piece (Enter/Space on its button): pick it up for the arrow keys.
    root.addEventListener('click',e=>{
      const b=e.target.closest('.bk-piece');if(!b||e.detail!==0)return;
      if(G.phase!=='play')return;startCarry(b.dataset.piece);
    },sig);
    root.querySelector('.bk-board').addEventListener('click',e=>{
      // A tap on an empty cell with a tray piece selected puts it there (no drag needed).
      if(e.detail===0||!G||G.phase!=='play'||!G.selected||e.target.closest('.bk-piece'))return;
      const c=cellAt(e.clientX,e.clientY);if(!c)return;tapPlace(G.selected,c.x,c.y);
    },sig);
    window.addEventListener('blur',()=>cancelDrag('blur'),sig);
    window.addEventListener('orientationchange',()=>{cancelDrag('orientation');setTimeout(layout,150)},sig);
    window.addEventListener('resize',()=>{if(G?.drag)cancelDrag('resize')},sig);
    document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelDrag('hidden');Snd.stopAll()}},sig);
    document.addEventListener('keydown',onKey,sig);
  }
  function cellAt(cx,cy){
    const b=G.root.querySelector('.bk-board');const r=b.getBoundingClientRect();
    const x=Math.floor((cx-r.left)/(r.width/G.lv.cols)),y=Math.floor((cy-r.top)/(r.height/G.lv.rows));
    return x>=0&&y>=0&&x<G.lv.cols&&y<G.lv.rows?{x,y}:null;
  }
  function tapPlace(id,cx,cy){
    const g=G;const p=D.pieceById(g.lv,id);const rot=rotOf(id);
    const cells=D.rotate(p.cells,rot);
    // Some cell of the piece lands on the tapped cell; the first spot that fits wins.
    for(const [px,py] of cells){if(D.canPlace(g.lv,g.placements,id,cx-px,cy-py,rot)){place(id,cx-px,cy-py,rot);return}}
    Snd.play('invalid');wiggle(g.root.querySelector(`.bk-piece[data-piece="${id}"]`));
  }

  function onDown(e){
    const g=G;if(!g||g.phase!=='play')return;
    if(e.button!==undefined&&e.button!==0&&e.pointerType==='mouse')return;
    const el=e.target.closest('.bk-piece');
    if(!el){ if(!e.target.closest('.bk-board,#bkRotate,.bk-banner,.bk-coach,.bk-modal,button')&&g.selected){g.selected=null;render()} return }
    if(g.drag)return;                                   // one finger at a time
    cancelCarry(false);
    const id=el.dataset.piece;const r=el.getBoundingClientRect();
    g.drag={id,pointerId:e.pointerId,type:e.pointerType||'mouse',sx:e.clientX,sy:e.clientY,lastX:e.clientX,lastY:e.clientY,
      fx:Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),fy:Math.max(0,Math.min(1,(e.clientY-r.top)/r.height)),
      from:g.placements[id]?'board':'tray',rot:rotOf(id),active:false,ending:false,cand:null,wasSelected:g.selected===id};
    try{g.root.setPointerCapture(e.pointerId)}catch(err){}
    e.preventDefault();
  }
  function onMove(e){
    const g=G;const d=g?.drag;if(!d||e.pointerId!==d.pointerId)return;
    d.lastX=e.clientX;d.lastY=e.clientY;
    if(!d.active){
      const s=scale();
      if(Math.hypot(e.clientX-d.sx,e.clientY-d.sy)/s<TIME.dragStart*(d.type==='touch'?1.4:1))return;
      startDrag();
    }
    moveDrag(e.clientX,e.clientY);
  }
  function startDrag(){
    const g=G,d=g.drag;d.active=true;g.selected=d.id;
    const src=g.root.querySelector(`.bk-piece[data-piece="${d.id}"]`);
    d.srcRect=src?localRect(src):null;
    src?.classList.add('lifted');
    const ghost=document.createElement('div');ghost.className='bk-ghost';
    g.root.querySelector('.bk-drag-layer').appendChild(ghost);d.ghost=ghost;
    paintGhost();
    g.root.classList.add('dragging');
    g.root.querySelector('#bkRotate').hidden=true;
    Snd.play('pick');
  }
  function paintGhost(){
    const g=G,d=g.drag;const p=D.pieceById(g.lv,d.id);const {w,h}=D.dims(D.rotate(p.cells,d.rot));
    d.w=w;d.h=h;d.ghost.style.width=w*g.cell+'px';d.ghost.style.height=h*g.cell+'px';
    d.ghost.innerHTML=pieceSVG(p,d.rot);
  }
  function moveDrag(cx,cy){
    const g=G,d=g.drag;if(!d?.active)return;
    const P=toLocal(cx,cy);const W=d.w*g.cell,H=d.h*g.cell;
    // Touch: the piece floats above the finger, so the child can see where it goes.
    const lift=d.type==='touch'?g.cell*.75+22:0;
    const left=P.x-d.fx*W,top=P.y-d.fy*H-lift;
    d.ghost.style.transform=`translate(${left}px,${top}px)`;d.gx=left;d.gy=top;
    const B=localRect(g.root.querySelector('.bk-board'));
    const x=Math.round((left-B.left)/g.cell),y=Math.round((top-B.top)/g.cell);
    const near=left+W>B.left-g.cell*.5&&left<B.right+g.cell*.5&&top+H>B.top-g.cell*.5&&top<B.bottom+g.cell*.5;
    d.cand=near?{x,y,ok:D.canPlace(g.lv,g.placements,d.id,x,y,d.rot)}:null;
    const T=localRect(g.root.querySelector('.bk-tray-panel'));
    d.overTray=P.x>=T.left&&P.x<=T.right&&P.y>=T.top&&P.y<=T.bottom;
    drawPreview(d.cand?{id:d.id,x,y,rot:d.rot,ok:d.cand.ok}:null);
  }
  function drawPreview(pv){
    const g=G;const layer=g.root.querySelector('.bk-preview');
    if(!pv){layer.innerHTML='';return}
    const p=D.pieceById(g.lv,pv.id);const bs=new Set(g.lv.board.map(c=>c.join(',')));
    layer.innerHTML=D.cellsAt(p,pv.x,pv.y,pv.rot).filter(([x,y])=>x>=0&&y>=0&&x<g.lv.cols&&y<g.lv.rows).map(([x,y])=>`<i class="bk-pv ${pv.ok?'ok':'no'} ${bs.has(x+','+y)?'':'out'}" style="--x:${x};--y:${y};--pc:${D.COLORS[p.color].base}"></i>`).join('');
  }
  function onUp(e){
    const g=G;const d=g?.drag;if(!d||e.pointerId!==d.pointerId)return;
    d.ending=true;
    try{g.root.releasePointerCapture(e.pointerId)}catch(err){}
    if(!d.active){
      // A tap: select the piece; a tap on the selected piece turns it (from level 6).
      g.drag=null;
      if(d.wasSelected&&g.lv.rotate){rotateSelected();return}
      g.selected=d.wasSelected?null:d.id;Snd.play('pick');render();
      return;
    }
    const from=ghostRect();
    endDragVisual();
    const c=d.cand;
    if(c&&c.ok){
      if(place(d.id,c.x,c.y,d.rot))glide(d.id,from,TIME.snap);
      return;
    }
    if(d.from==='board'&&d.overTray){toTray(d.id);glide(d.id,from,TIME.back);return}
    // Not a valid spot: back to where it was, with a small wiggle and a soft boop.
    if(d.from==='tray'&&d.overTray){render();glide(d.id,from,TIME.back);return}
    Snd.play('invalid');render();glide(d.id,from,TIME.back,{wig:true});
    say(t('blokken.noFit'));
  }
  function ghostRect(){const d=G.drag;return d?.ghost?{left:d.gx,top:d.gy,width:d.w*G.cell,height:d.h*G.cell}:null}
  function endDragVisual(){
    const g=G,d=g.drag;if(!d)return;
    d.ghost?.remove();g.root.querySelector('.bk-preview').innerHTML='';
    g.root.querySelectorAll('.bk-piece.lifted').forEach(el=>el.classList.remove('lifted'));
    g.root.classList.remove('dragging');
    // a rotation made while dragging is kept for a tray piece
    if(d.active&&d.from==='tray'&&g.lv.rotate)g.trayRot[d.id]=d.rot;
    if(d.active)g.selected=null;        // a drag ends without a selection (the turn button is for a tapped piece)
    g.drag=null;
  }
  // pointercancel, blur, resize, turning the screen: the piece stays where it
  // was in the state (nothing was changed yet), only the floating copy goes.
  function cancelDrag(){
    const g=G;const d=g?.drag;if(!d)return;
    try{g.root.releasePointerCapture(d.pointerId)}catch(err){}
    const from=ghostRect();const was=d.active;
    endDragVisual();render();
    if(was)glide(d.id,from,TIME.back);
  }

  /* ---------------- keyboard ---------------- */
  function startCarry(id){
    const g=G;if(!g||g.phase!=='play')return;
    const p=D.pieceById(g.lv,id);const rot=rotOf(id);
    let x=0,y=0;
    if(g.placements[id]){x=g.placements[id].x;y=g.placements[id].y}
    else{const free=g.lv.board.find(([cx,cy])=>D.canPlace(g.lv,g.placements,id,cx,cy,rot));if(free){x=free[0];y=free[1]}}
    g.carry={id,x,y,rot};g.selected=id;render();
    g.root.querySelector('.bk-board').focus({preventScroll:true});
    drawCarry();Snd.play('pick');
    say(t('blokken.kbPicked',{piece:pieceName(p)})+' '+t('blokken.kbHelp'));
  }
  function drawCarry(){
    const g=G,c=g.carry;if(!c)return;
    const ok=D.canPlace(g.lv,g.placements,c.id,c.x,c.y,c.rot);
    drawPreview({id:c.id,x:c.x,y:c.y,rot:c.rot,ok});
    g.root.querySelector('.bk-board').classList.add('kb');
    say(t(ok?'blokken.kbFits':'blokken.kbNoFit',{x:c.x+1,y:c.y+1}));
  }
  function cancelCarry(refocus=true){
    const g=G;if(!g?.carry)return;const id=g.carry.id;g.carry=null;
    g.root.querySelector('.bk-preview').innerHTML='';g.root.querySelector('.bk-board').classList.remove('kb');
    if(refocus)g.root.querySelector(`.bk-piece[data-piece="${id}"]`)?.focus();
  }
  function onKey(e){
    const g=G;if(!g||!g.root.isConnected){destroy();return}
    if(g.phase!=='play'||g.root.querySelector('.bk-modal'))return;
    if(e.target&&/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName))return;
    const k=e.key;
    if((k==='r'||k==='R')&&!e.metaKey&&!e.ctrlKey){if(g.lv.rotate){rotateSelected();e.preventDefault()}return}
    // Escape cancels what is going on here first; only with nothing to cancel does it reach the app (Home).
    if(k==='Escape'){
      if(g.drag){cancelDrag('escape')}else if(g.carry){cancelCarry();Snd.play('back')}else if(g.selected||g.hint){g.selected=null;if(g.hint&&g.hint.source!=='boost'){g.hint=null;save()}render()}else return;
      e.preventDefault();e.stopPropagation();return;
    }
    if(!g.carry)return;
    const c=g.carry;const mv={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[k];
    if(mv){
      const p=D.pieceById(g.lv,c.id);const {w,h}=D.dims(D.rotate(p.cells,c.rot));
      c.x=Math.max(0,Math.min(g.lv.cols-w,c.x+mv[0]));c.y=Math.max(0,Math.min(g.lv.rows-h,c.y+mv[1]));
      drawCarry();e.preventDefault();return;
    }
    if(k==='Enter'||k===' '){
      e.preventDefault();
      if(D.canPlace(g.lv,g.placements,c.id,c.x,c.y,c.rot)){
        const id=c.id;g.carry=null;g.root.querySelector('.bk-board').classList.remove('kb');g.root.querySelector('.bk-preview').innerHTML='';
        g.trayRot[id]=c.rot;
        place(id,c.x,c.y,c.rot);
        if(G?.phase==='play'){const next=G.root.querySelector('.bk-piece.tray')||G.root.querySelector('.bk-piece');next?.focus()}
      }else{Snd.play('invalid');say(t('blokken.noFit'))}
      return;
    }
    if(k==='Delete'||k==='Backspace'){
      e.preventDefault();const id=c.id;cancelCarry(false);if(g.placements[id])toTray(id);
    }
  }

  // Test hooks (the Playwright suite reads the state; nothing here changes the rules).
  K.blokken={
    get state(){if(!G)return null;return {level:G.lv.n,phase:G.phase,attemptId:G.attemptId,placements:JSON.parse(JSON.stringify(G.placements)),trayRot:{...G.trayRot},order:G.order.slice(),boost:JSON.parse(JSON.stringify(G.boost)),hint:G.hint?{...G.hint}:null,selected:G.selected,undo:G.undo.length,cell:G.cell,tc:G.tc,dragging:!!G.drag,booked:G.booked}},
    data:D,store,destroy,
    // Puts a piece down through the same rules a drop uses (false if it does not fit).
    place:(id,x,y,rot)=>G?place(id,x,y,rot):false,
    layout:()=>layout(),
    get sounds(){return Snd.live}
  };
})();
