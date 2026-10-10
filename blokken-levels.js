/* Blokkenpret — level data and the puzzle logic (no DOM).

   Ten fixed levels. Each level is drawn as a small picture: every letter is one
   piece of the stored solution, a dot is not part of the figure. The picture is
   only the SOURCE of the data: what the game uses is derived from it below and
   checked by validateLevel() (tests/blokken.test.js runs it for every level):

     board      the figure, as [x,y] cells
     pieces     stable id, local cells (as the piece lies in the tray at the
                start), allowed rotations, colour and symbol
     solution   one stored full solution {id,x,y,rot}

   The game accepts ANY full cover of the figure by all pieces (isComplete), not
   only the stored one, and the hints are computed by the solver from the
   current board, so a child who goes another way is never told it is wrong.

   Rotation is in quarter turns clockwise (0..3); there is no mirroring. Levels
   1–5 lie in the tray the way they fit (rotation 0 only); from level 6 a piece
   can be turned and some start turned (startRot), so turning is needed.

   This file also loads in node (module.exports) for the validator test. */
(function(root){
  'use strict';

  // Bump whenever a level changes: a saved attempt of another version is never
  // restored (the finished levels are kept).
  const LEVEL_DATA_VERSION=1;

  // One colour per piece within a level (never repeated in a level), and one
  // symbol per piece so colour is never the only cue.
  const COLORS={
    red:{base:'#ff5b52',dark:'#c7302c',light:'#ff9a90'},
    orange:{base:'#ff9b26',dark:'#d06a09',light:'#ffc477'},
    yellow:{base:'#ffd33d',dark:'#d9a10c',light:'#fff0a3'},
    green:{base:'#2fcf7a',dark:'#159456',light:'#8af0b6'},
    cyan:{base:'#2fd0ee',dark:'#1497b8',light:'#9cecfb'},
    blue:{base:'#3279ff',dark:'#1b4ec4',light:'#8fb6ff'},
    purple:{base:'#9b5cf6',dark:'#6a33c4',light:'#c9a6ff'},
    pink:{base:'#ff6fb4',dark:'#d23f85',light:'#ffb2d8'},
    lime:{base:'#9ad93b',dark:'#64a10f',light:'#ccf28f'}
  };
  const SYMBOLS=['star','heart','dot','diamond','moon','drop','flower','triangle','ring'];

  // A per level: rows (the picture), the pieces' colour, symbol and start rotation.
  // The letters are in the order the pieces lie in the tray.
  const SOURCE=[
    {n:1,rotate:false,guided:true,rows:[
      'AAB',
      'AAB',
      'CCB'],
     pieces:{A:['red','star'],B:['blue','heart'],C:['yellow','dot']}},
    {n:2,rotate:false,rows:[
      '.A.',
      'AAA',
      'BBC',
      'BBC'],
     pieces:{A:['purple','star'],B:['orange','diamond'],C:['green','dot']}},
    {n:3,rotate:false,rows:[
      'AA..',
      'AB..',
      'AB..',
      'CBBD',
      'CCDD'],
     pieces:{A:['blue','moon'],B:['pink','star'],C:['yellow','heart'],D:['green','drop']}},
    {n:4,rotate:false,rows:[
      '.AA.',
      'BAAC',
      'BBCC',
      'BDDC',
      '.DD.'],
     pieces:{A:['yellow','star'],B:['red','heart'],C:['cyan','diamond'],D:['purple','flower']}},
    {n:5,rotate:false,rows:[
      'A.....',
      'AA....',
      'AAB...',
      'CBBB..',
      'CCDDE.',
      'CCDDEE'],
     pieces:{A:['orange','star'],B:['blue','heart'],C:['green','moon'],D:['pink','dot'],E:['yellow','triangle']}},
    {n:6,rotate:true,rows:[
      'AA.BB',
      'AACBB',
      'DDCEE',
      '.DCE.',
      '..C..'],
     pieces:{A:['pink','heart',0],B:['purple','star',0],C:['cyan','drop',1],D:['orange','diamond',2],E:['green','moon',1]}},
    {n:7,rotate:true,rows:[
      '..AA..',
      '.BAAC.',
      'BBDDCC',
      'BEDDCF',
      'EEE.FF'],
     pieces:{A:['yellow','star',0],B:['red','flower',1],C:['blue','heart',2],D:['green','dot',0],E:['purple','moon',2],F:['orange','triangle',3]}},
    {n:8,rotate:true,rows:[
      'A....B',
      'AACCBB',
      'DACFEB',
      'DDFFEE',
      '.DGGG.'],
     pieces:{A:['green','star',1],B:['pink','heart',3],C:['yellow','dot',2],D:['blue','moon',1],E:['red','diamond',0],F:['cyan','drop',2],G:['purple','flower',1]}},
    {n:9,rotate:true,rows:[
      '..AAB..',
      '..AAB..',
      'CCADBEE',
      'CDDDFFE',
      'CGGHFFE',
      '..GHH..',
      '..GHH..'],
     pieces:{A:['red','star',2],B:['lime','triangle',1],C:['blue','heart',1],D:['yellow','moon',2],E:['purple','diamond',3],F:['green','dot',0],G:['orange','drop',3],H:['pink','flower',1]}},
    {n:10,rotate:true,rows:[
      'A..BB..C',
      'AA.BB.CC',
      'DAEEBFCG',
      'DDEHHFCG',
      'DIEHHFGG',
      '.IIIHFG.'],
     pieces:{A:['red','star',1],B:['blue','heart',2],C:['yellow','moon',3],D:['green','dot',1],E:['purple','diamond',2],F:['cyan','drop',1],G:['orange','flower',2],H:['pink','triangle',3],I:['lime','ring',1]}}
  ];

  /* ---------------- geometry ---------------- */
  const key=(x,y)=>x+','+y;
  const sortCells=c=>c.slice().sort((a,b)=>a[1]-b[1]||a[0]-b[0]);
  const normalize=cells=>{
    let mx=Infinity,my=Infinity;for(const [x,y] of cells){if(x<mx)mx=x;if(y<my)my=y}
    return sortCells(cells.map(([x,y])=>[x-mx,y-my]));
  };
  // A quarter turn clockwise on screen (y down): (x,y) -> (-y,x).
  const rot90=cells=>normalize(cells.map(([x,y])=>[-y,x]));
  const rotate=(cells,r)=>{let c=normalize(cells);for(let i=0;i<((r%4)+4)%4;i++)c=rot90(c);return c};
  const shapeKey=cells=>normalize(cells).map(([x,y])=>key(x,y)).join(';');
  const dims=cells=>{let w=0,h=0;for(const [x,y] of cells){if(x+1>w)w=x+1;if(y+1>h)h=y+1}return{w,h}};
  const connected=cells=>{
    if(!cells.length)return false;
    const set=new Set(cells.map(([x,y])=>key(x,y)));const seen=new Set([key(...cells[0])]);const todo=[cells[0]];
    while(todo.length){const [x,y]=todo.pop();for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const k=key(x+dx,y+dy);if(set.has(k)&&!seen.has(k)){seen.add(k);todo.push([x+dx,y+dy])}}}
    return seen.size===set.size;
  };

  /* ---------------- the levels, built from SOURCE ---------------- */
  function build(src){
    const board=[],groups={};
    src.rows.forEach((row,y)=>[...row].forEach((ch,x)=>{if(ch==='.')return;board.push([x,y]);(groups[ch]||=[]).push([x,y])}));
    const letters=Object.keys(src.pieces);
    const pieces=[],solution=[];
    letters.forEach((L,i)=>{
      const [color,symbol,startRot=0]=src.pieces[L];
      const placed=groups[L]||[];
      const solved=normalize(placed);
      // The tray shape is the solved shape turned by startRot; turning it back
      // by (4-startRot) gives the solved shape again.
      const cells=rotate(solved,startRot);
      const id=`b${src.n}-${String.fromCharCode(97+i)}`;
      pieces.push({id,letter:L,cells,color,symbol,rotations:src.rotate?[0,1,2,3]:[0]});
      let mx=Infinity,my=Infinity;for(const [x,y] of placed){if(x<mx)mx=x;if(y<my)my=y}
      solution.push({id,x:mx,y:my,rot:(4-startRot)%4});
    });
    const {w,h}=dims(board);
    return {n:src.n,cols:w,rows:h,board:sortCells(board),pieces,solution,rotate:!!src.rotate,guided:!!src.guided,boost:src.n>=4};
  }
  const LEVELS=SOURCE.map(build);
  const level=n=>LEVELS[n-1]||null;

  /* ---------------- placement rules ---------------- */
  // placements: {pieceId:{x,y,rot}} for the pieces on the board.
  const pieceById=(lv,id)=>lv.pieces.find(p=>p.id===id)||null;
  const cellsAt=(piece,x,y,rot)=>rotate(piece.cells,rot).map(([cx,cy])=>[cx+x,cy+y]);
  const boardSet=lv=>lv._set||(Object.defineProperty(lv,'_set',{value:new Set(lv.board.map(([x,y])=>key(x,y)))}),lv._set);

  // Which cell belongs to which piece, or null if two pieces overlap or one
  // sticks out of the figure.
  function occupancy(lv,placements,skipId){
    const occ=new Map(),bs=boardSet(lv);
    for(const [id,p] of Object.entries(placements||{})){
      if(id===skipId)continue;
      const piece=pieceById(lv,id);if(!piece||!piece.rotations.includes(p.rot))return null;
      for(const [x,y] of cellsAt(piece,p.x,p.y,p.rot)){const k=key(x,y);if(!bs.has(k)||occ.has(k))return null;occ.set(k,id)}
    }
    return occ;
  }
  const validPlacements=(lv,placements)=>occupancy(lv,placements)!==null;
  // Can piece `id` go to (x,y,rot)? Its own old spot does not count as taken.
  function canPlace(lv,placements,id,x,y,rot){
    const piece=pieceById(lv,id);if(!piece||!piece.rotations.includes(rot))return false;
    if(!Number.isInteger(x)||!Number.isInteger(y))return false;
    const occ=occupancy(lv,placements,id);if(!occ)return false;
    const bs=boardSet(lv);
    return cellsAt(piece,x,y,rot).every(([cx,cy])=>{const k=key(cx,cy);return bs.has(k)&&!occ.has(k)});
  }
  // Done when every piece lies on the board and together they cover every cell
  // exactly once. Any such cover counts, not just the stored solution.
  function isComplete(lv,placements){
    if(!placements||lv.pieces.some(p=>!placements[p.id]))return false;
    const occ=occupancy(lv,placements);
    return !!occ&&occ.size===lv.board.length;
  }

  /* ---------------- solver ---------------- */
  // Backtracking on the first empty cell (reading order): some unused piece
  // must cover it, with the first cell of one of its orientations. Identical
  // free pieces are tried once per branch, failed states are remembered, and a
  // node budget keeps it from ever hanging the page.
  function solve(lv,fixed={},{budget=400000,all=0}={}){
    const occ=occupancy(lv,fixed);if(!occ)return {ok:false,reason:'invalid'};
    const bs=boardSet(lv);
    const order=lv.board;               // reading order (sorted in build)
    const idx=new Map(order.map(([x,y],i)=>[key(x,y),i]));
    const filled=new Uint8Array(order.length);
    for(const k of occ.keys())filled[idx.get(k)]=1;
    const free=lv.pieces.filter(p=>!fixed[p.id]);
    // Orientations per free piece, each with its cells relative to its first cell.
    const opts=free.map(p=>{
      const seen=new Set(),list=[];
      for(const r of p.rotations){const c=rotate(p.cells,r);const k=shapeKey(c);if(seen.has(k))continue;seen.add(k);const [ax,ay]=c[0];list.push({rot:r,rel:c.map(([x,y])=>[x-ax,y-ay]),ax,ay})}
      return {piece:p,list,sig:[...seen].sort().join('|'),size:p.cells.length};
    });
    const used=new Array(opts.length).fill(false);
    const out=[],found=[];const dead=new Set();let nodes=0,over=false,stop=false;
    const freeCount=order.length-occ.size;
    if(freeCount!==opts.reduce((s,o)=>s+o.size,0))return {ok:false,reason:'area'};
    const stateKey=()=>{let s='';for(let i=0;i<filled.length;i++)s+=filled[i];return s+'/'+used.map(u=>u?1:0).join('')};
    // true = at least one solution below this node.
    function rec(start){
      if(++nodes>budget){over=true;return false}
      let i=start;while(i<filled.length&&filled[i])i++;
      if(i>=filled.length){found.push(out.slice());if(!all||found.length>=all)stop=true;return true}
      const sk=stateKey();if(dead.has(sk))return false;
      const [fx,fy]=order[i];const tried=new Set();let any=false;
      for(let pi=0;pi<opts.length;pi++){
        if(used[pi])continue;const o=opts[pi];
        // In "all" mode identical pieces are still distinct pieces: swapping two
        // of them gives another layout of ids, so they are not skipped there.
        if(!all){if(tried.has(o.sig))continue;tried.add(o.sig)}
        for(const v of o.list){
          const ids=[];let fits=true;
          for(const [dx,dy] of v.rel){const k=key(fx+dx,fy+dy);if(!bs.has(k)){fits=false;break}const j=idx.get(k);if(filled[j]){fits=false;break}ids.push(j)}
          if(!fits)continue;
          for(const j of ids)filled[j]=1;used[pi]=true;
          out.push({id:o.piece.id,x:fx-v.ax,y:fy-v.ay,rot:v.rot});
          if(rec(i+1))any=true;
          out.pop();used[pi]=false;for(const j of ids)filled[j]=0;
          if(stop)return true;
          if(over)return any;
        }
      }
      if(!any)dead.add(sk);
      return any;
    }
    rec(0);
    if(found.length)return {ok:true,moves:found[0],solutions:found,nodes};
    return over?{ok:false,reason:'budget',nodes}:{ok:false,reason:'none',nodes};
  }

  // Counts full solutions (for the validator and the tests), up to `limit`.
  function countSolutions(lv,limit=50,fixed={}){
    const r=solve(lv,fixed,{all:limit,budget:2000000});
    return {count:r.ok?r.solutions.length:0,solutions:r.ok?r.solutions:[]};
  }

  /* ---------------- hints ---------------- */
  // What a child can do next from THIS board:
  //   {kind:'place', id, x, y, rot}  a free piece and where it fits in a full continuation
  //   {kind:'takeBack', id, ids}     the board cannot be finished; taking `id` back fixes it
  //                                  (ids: the smallest set the solver found)
  //   {kind:'done'}                  already complete
  // `order` is the order the pieces were placed in (most recent last): the most
  // recent one is offered first when several would do.
  const hintCache=new Map();
  function hint(lv,placements,order=[],{exclude=[]}={}){
    placements=placements||{};
    if(isComplete(lv,placements))return {kind:'done'};
    const ck=lv.n+'|'+Object.keys(placements).sort().map(id=>{const p=placements[id];return id+':'+p.x+','+p.y+','+p.rot}).join(' ')+'|'+exclude.join(',');
    if(hintCache.has(ck))return hintCache.get(ck);
    let res=null;
    const r=solve(lv,placements);
    if(r.ok&&r.moves.length){
      // The move that covers the first empty cell; a piece the caller excludes
      // (the one just hinted) is skipped if another one is possible.
      const pick=r.moves.find(m=>!exclude.includes(m.id))||r.moves[0];
      res={kind:'place',id:pick.id,x:pick.x,y:pick.y,rot:pick.rot};
    }else{
      const placed=Object.keys(placements);
      const recent=placed.slice().sort((a,b)=>{const ia=order.indexOf(a),ib=order.indexOf(b);return ib-ia});
      // The smallest set of pieces to take back, most recently placed first.
      outer:for(let k=1;k<=recent.length;k++){
        for(const combo of combos(recent,k)){
          const rest={...placements};for(const id of combo)delete rest[id];
          if(solve(lv,rest).ok){res={kind:'takeBack',id:combo[0],ids:combo};break outer}
        }
      }
      if(!res)res={kind:'takeBack',id:recent[0],ids:recent};
    }
    if(hintCache.size>400)hintCache.clear();
    hintCache.set(ck,res);
    return res;
  }
  function* combos(arr,k,start=0,acc=[]){
    if(acc.length===k){yield acc.slice();return}
    for(let i=start;i<arr.length;i++){acc.push(arr[i]);yield* combos(arr,k,i+1,acc);acc.pop()}
  }

  /* ---------------- validator ---------------- */
  // Every rule the game relies on. Returns a list of problems (empty = valid).
  function validateLevel(lv){
    const errs=[];const e=m=>errs.push(`level ${lv.n}: ${m}`);
    const bset=new Set();for(const [x,y] of lv.board){const k=key(x,y);if(bset.has(k))e('duplicate board cell '+k);bset.add(k)}
    if(!connected(lv.board))e('figure is not connected');
    const ids=new Set(),cols=new Set(),syms=new Set();
    for(const p of lv.pieces){
      if(ids.has(p.id))e('duplicate id '+p.id);ids.add(p.id);
      if(cols.has(p.color))e('colour used twice: '+p.color);cols.add(p.color);
      if(!COLORS[p.color])e('unknown colour '+p.color);
      if(syms.has(p.symbol))e('symbol used twice: '+p.symbol);syms.add(p.symbol);
      if(!SYMBOLS.includes(p.symbol))e('unknown symbol '+p.symbol);
      if(p.cells.length<2||p.cells.length>5)e(`${p.id} has ${p.cells.length} cells`);
      if(new Set(p.cells.map(c=>key(...c))).size!==p.cells.length)e(p.id+' has a duplicate cell');
      if(!connected(p.cells))e(p.id+' is not edge-connected');
      if(shapeKey(p.cells)!==p.cells.map(c=>key(...c)).join(';'))e(p.id+' cells not normalized');
      if(!p.rotations.length||p.rotations.some(r=>![0,1,2,3].includes(r)))e(p.id+' bad rotations');
      if(!lv.rotate&&p.rotations.join()!=='0')e(p.id+' may turn on a level without turning');
    }
    const area=lv.pieces.reduce((s,p)=>s+p.cells.length,0);
    if(area!==lv.board.length)e(`area ${area} != figure ${lv.board.length}`);
    const sol={};for(const m of lv.solution){if(sol[m.id])e('solution places '+m.id+' twice');sol[m.id]={x:m.x,y:m.y,rot:m.rot}}
    if(!isComplete(lv,sol))e('stored solution does not cover the figure exactly');
    const r=solve(lv,{});
    if(!r.ok)e('solver finds no solution ('+r.reason+')');
    else{const s={};for(const m of r.moves)s[m.id]=m;if(!isComplete(lv,s))e('solver solution is not complete')}
    return errs;
  }

  const api={LEVEL_DATA_VERSION,LEVELS,COLORS,SYMBOLS,level,count:LEVELS.length,
    rotate,normalize,shapeKey,dims,connected,cellsAt,pieceById,occupancy,validPlacements,canPlace,isComplete,solve,countSolutions,hint,validateLevel};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root&&root.KWIZILLO_M1)root.KWIZILLO_M1.blokkenData=api;
})(typeof window!=='undefined'?window:null);
