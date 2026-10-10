(()=>{
  const K=window.KWIZILLO_M1;
  if(!K) return;
  // Meten & Wegen (2026-10-10), the third part of Rekenen: a ruler, a kitchen scale,
  // a measuring jug, comparing, estimating and converting. Ten questions a round,
  // passed or failed by the same level rules as the sums (games-math.js finish).
  //
  // Every picture is drawn here (SVG) from the same numbers as the answer: the
  // object starts and ends on the ruler where the question says, the needle points
  // at the weight, the water stands at the mark. Nothing is decoration.
  //
  // The voice only says recorded lines (closed-set rule, tools/speech-inventory.cjs):
  // the question per object, Milo's tip, "bijna" and the praise. Numbers are on
  // screen only, so no amount ever needs a recording.
  const t=(k,v)=>K.t(k,v);
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const rnd=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
  const pick=a=>a[Math.floor(Math.random()*a.length)];
  const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
  const lang=()=>K.state.language||'nl';
  const LOCALE={nl:'nl-NL',en:'en-US',de:'de-DE',fr:'fr-FR',es:'es-ES',it:'it-IT',pt:'pt-BR',da:'da-DK',ru:'ru-RU',ar:'ar-AE-u-nu-latn'};
  // 1500 g, not 1.500 g: a grouping dot reads as a decimal to a child.
  const num=v=>new Intl.NumberFormat(LOCALE[lang()]||'nl-NL',{useGrouping:false,maximumFractionDigits:2}).format(v);
  const U=u=>t(`measure.u.${u}`);
  const qty=(v,u)=>`${num(v)} ${U(u)}`;
  const same=(a,b)=>Math.abs(a-b)<1e-9;
  const bdi=s=>`<bdi dir="ltr">${esc(s)}</bdi>`;

  // Four options around the answer: the answer and distinct, positive mistakes a
  // child really makes (one step off, the end of the ruler instead of the length).
  function numberOptions(answer,wrongs,unit,step=1,n=4){
    const vals=[answer];
    for(const w of wrongs){if(vals.length>=n)break;if(w>0&&!vals.some(v=>same(v,w)))vals.push(Math.round(w*1000)/1000)}
    for(let k=1;vals.length<n&&k<20;k++){const w=Math.round((answer+(k%2?1:-1)*Math.ceil(k/2)*step)*1000)/1000;if(w>0&&!vals.some(v=>same(v,w)))vals.push(w)}
    return shuffle(vals).map(v=>({id:String(v),label:qty(v,unit),ok:same(v,answer)}));
  }
  const nameOptions=(ids,right)=>ids.map(id=>({id,label:t(`measure.obj.${id}`),ok:id===right}));

  /* ---------------- drawings ---------------- */
  // A long object from x1 to x2, its two ends exactly there.
  function drawObj(type,x1,x2,y,h){
    const cy=y+h/2,w=x2-x1;
    switch(type){
      case 'pencil':return `<rect x="${x1}" y="${y+2}" width="9" height="${h-4}" rx="3" fill="#f48fb1"/><rect x="${x1+8}" y="${y+1}" width="6" height="${h-2}" fill="#b0bec5"/><rect x="${x1+14}" y="${y}" width="${w-30}" height="${h}" fill="#ffca28"/><rect x="${x1+14}" y="${y}" width="${w-30}" height="${h/3}" fill="#ffd54f"/><polygon points="${x2-16},${y} ${x2},${cy} ${x2-16},${y+h}" fill="#ffe0b2"/><polygon points="${x2-5.5},${cy-2.6} ${x2},${cy} ${x2-5.5},${cy+2.6}" fill="#37474f"/>`;
      case 'crayon':return `<rect x="${x1}" y="${y+2}" width="${w-12}" height="${h-4}" rx="4" fill="#e53935"/><rect x="${x1+w*.22}" y="${y+2}" width="${w*.4}" height="${h-4}" fill="#ffcdd2"/><polygon points="${x2-13},${y+4} ${x2},${cy} ${x2-13},${y+h-4}" fill="#c62828"/>`;
      case 'straw':return `<rect x="${x1}" y="${y+6}" width="${w}" height="${h-12}" rx="${(h-12)/2}" fill="url(#mStripe)" stroke="#90caf9" stroke-width="1.2"/>`;
      case 'brush':return `<rect x="${x1}" y="${y+7}" width="${w-26}" height="${h-14}" rx="5" fill="#8d6e63"/><rect x="${x2-27}" y="${y+4}" width="11" height="${h-8}" rx="2" fill="#cfd8dc"/><path d="M${x2-16} ${y+3} Q${x2-6} ${y+5} ${x2} ${cy} Q${x2-6} ${y+h-5} ${x2-16} ${y+h-3} Z" fill="#5d4037"/>`;
      case 'ribbon':return `<polygon points="${x1},${y+4} ${x2},${y+4} ${x2-7},${cy} ${x2},${y+h-4} ${x1},${y+h-4} ${x1+7},${cy}" fill="#ab47bc"/><rect x="${x1+7}" y="${cy-1.5}" width="${w-14}" height="3" fill="#ce93d8"/>`;
      case 'nail':return `<rect x="${x1}" y="${y+1}" width="5" height="${h-2}" rx="1.5" fill="#78909c"/><rect x="${x1+5}" y="${cy-3}" width="${w-15}" height="6" fill="#b0bec5"/><polygon points="${x2-10},${cy-3} ${x2},${cy} ${x2-10},${cy+3}" fill="#90a4ae"/>`;
    }
    return '';
  }
  const DEFS='<defs><pattern id="mStripe" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="10" height="10" fill="#fff"/><rect width="5" height="10" fill="#ef5350"/></pattern></defs>';

  // Ruler: S units per centimetre, the object on top, its ends dashed down to the scale.
  function rulerSvg(v){
    const S=20,M=16,R=v.R,W=M*2+R*S,x=c=>M+c*S,top=50;
    let ticks='';
    for(let i=0;i<=R*10;i++){
      const c=i/10,len=i%10===0?15:i%5===0?10:v.mm?6:0;if(!len)continue;
      ticks+=`<line x1="${x(c)}" y1="${top}" x2="${x(c)}" y2="${top+len}" class="m-tick${i%10?'':' big'}"/>`;
      if(i%10===0)ticks+=`<text x="${x(c)}" y="${top+29}" class="m-num">${c}</text>`;
    }
    return `<svg viewBox="0 0 ${W} 96" class="m-svg m-ruler-svg" role="img">${DEFS}
      <line x1="${x(v.start)}" y1="10" x2="${x(v.start)}" y2="${top}" class="m-guide"/><line x1="${x(v.end)}" y1="10" x2="${x(v.end)}" y2="${top}" class="m-guide"/>
      ${drawObj(v.obj,x(v.start),x(v.end),10,24)}
      <rect x="${M-9}" y="${top}" width="${R*S+18}" height="40" rx="5" class="m-ruler"/>${ticks}
      <rect x="${x(v.start)}" y="${top}" width="${(v.end-v.start)*S}" height="5" class="rv m-span"/>
      <circle cx="${x(v.start)}" cy="${top}" r="4.5" class="rv m-dot"/><circle cx="${x(v.end)}" cy="${top}" r="4.5" class="rv m-dot"/>
    </svg>`;
  }
  // Two long objects one above the other, both starting at the left.
  function twoLengthsSvg(v){
    const S=20,M=16,W=M*2+12*S;
    return `<svg viewBox="0 0 ${W} 112" class="m-svg" role="img">${DEFS}
      <text x="${M}" y="14" class="m-label">${esc(t(`measure.obj.${v.a.obj}`))}</text>${drawObj(v.a.obj,M,M+v.a.len*S,20,24)}
      <text x="${M}" y="70" class="m-label">${esc(t(`measure.obj.${v.b.obj}`))}</text>${drawObj(v.b.obj,M,M+v.b.len*S,76,24)}
    </svg>`;
  }
  // Kitchen scale: a 300-degree dial like a real one, 0 at the lower left and the
  // highest mark at the lower right; the unit sits in the gap at the bottom.
  function scaleSvg(v){
    const cx=110,cy=154,{max,minor,major}=v.dial;
    const at=(val,r)=>{const a=(-150+val/max*300)*Math.PI/180;return [cx+r*Math.sin(a),cy-r*Math.cos(a)]};
    let marks='';
    for(let k=0;k*minor<=max+1e-9;k++){
      const val=k*minor,big=Math.abs(val/major-Math.round(val/major))<1e-9,[x1,y1]=at(val,57),[x2,y2]=at(val,big?45:51);
      marks+=`<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" class="m-tick${big?' big':''}"/>`;
      if(big){const [lx,ly]=at(val,34);marks+=`<text x="${lx.toFixed(2)}" y="${(ly+3.5).toFixed(2)}" class="m-num small">${num(val/v.dial.show)}</text>`}
    }
    const [nx,ny]=at(v.value,52);
    return `<svg viewBox="0 0 220 236" class="m-svg m-scale-svg" role="img">
      <text x="110" y="54" class="m-emoji" font-size="50">${v.emoji}</text>
      <ellipse cx="110" cy="62" rx="74" ry="11" fill="#cfd8dc"/><ellipse cx="110" cy="59" rx="74" ry="9" fill="#eceff1"/>
      <rect x="100" y="68" width="20" height="14" fill="#b0bec5"/>
      <rect x="32" y="80" width="156" height="150" rx="30" fill="#ef5350"/><rect x="32" y="80" width="156" height="24" rx="12" fill="#f26b68"/>
      <circle cx="${cx}" cy="${cy}" r="64" fill="#fff" stroke="#ffcdd2" stroke-width="4"/>${marks}
      <text x="${cx}" y="${cy+50}" class="m-num unit">${esc(U(v.dial.unit))}</text>
      <line x1="${cx}" y1="${cy}" x2="${nx.toFixed(2)}" y2="${ny.toFixed(2)}" class="m-needle"/><circle cx="${cx}" cy="${cy}" r="6" fill="#c62828"/>
      <g class="rv"><rect x="66" y="${cy+16}" width="88" height="22" rx="11" fill="#c62828"/><text x="110" y="${cy+31.5}" class="m-num badge light">${esc(qty(v.value/v.dial.show,v.dial.unit))}</text></g>
    </svg>`;
  }
  // Measuring jug: the inside from y=200 (empty) up to y=50 (full), marks on the left.
  function jugSvg(v){
    const {cap,minor,major,unit,show}=v.jug,y=val=>200-val/cap*150;
    let marks='';
    for(let k=1;k*minor<=cap+1e-9;k++){
      const val=k*minor,big=Math.abs(val/major-Math.round(val/major))<1e-9;
      marks+=`<line x1="48" y1="${y(val).toFixed(2)}" x2="${big?74:62}" y2="${y(val).toFixed(2)}" class="m-jugmark${big?' big':''}"/>`;
      if(big)marks+=`<text x="79" y="${(y(val)+4).toFixed(2)}" class="m-num jug">${esc(qty(val/show,unit))}</text>`;
    }
    const lv=y(v.value);
    return `<svg viewBox="0 0 200 222" class="m-svg m-jug-svg" role="img">
      <path d="M150 64 C186 64 186 150 150 150" fill="none" stroke="#b3d4ee" stroke-width="10" stroke-linecap="round"/>
      <rect x="47" y="${lv.toFixed(2)}" width="100" height="${(203-lv).toFixed(2)}" fill="#4fc3f7" opacity=".55"/>
      <line x1="47" y1="${lv.toFixed(2)}" x2="147" y2="${lv.toFixed(2)}" stroke="#0288d1" stroke-width="2"/>
      <path d="M44 22 L44 196 Q44 206 54 206 L140 206 Q150 206 150 196 L150 22 L160 14" fill="rgba(225,242,255,.35)" stroke="#90c2e6" stroke-width="3.5" stroke-linejoin="round"/>
      ${marks}
      <g class="rv"><rect x="96" y="${(lv-28).toFixed(2)}" width="96" height="22" rx="11" fill="#0288d1"/><text x="144" y="${(lv-12.5).toFixed(2)}" class="m-num badge light">${esc(qty(v.value/show,unit))}</text></g>
    </svg>`;
  }
  // A seesaw balance: the heavier side goes down.
  function balanceSvg(v){
    const a=(v.leftHeavy?1:-1)*11*Math.PI/180,L=86,lx=120-L*Math.cos(a),ly=74+L*Math.sin(a),rx=120+L*Math.cos(a),ry=74-L*Math.sin(a);
    const pan=(x,y,e)=>`<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${x.toFixed(1)}" y2="${(y+22).toFixed(1)}" stroke="#78909c" stroke-width="2.5"/><path d="M${(x-30).toFixed(1)} ${(y+22).toFixed(1)} Q${x.toFixed(1)} ${(y+40).toFixed(1)} ${(x+30).toFixed(1)} ${(y+22).toFixed(1)} Z" fill="#b0bec5"/><text x="${x.toFixed(1)}" y="${(y+18).toFixed(1)}" class="m-emoji" font-size="34">${e}</text>`;
    return `<svg viewBox="0 0 240 170" class="m-svg" role="img"><polygon points="120,74 98,162 142,162" fill="#ffb300"/>
      <line x1="${lx.toFixed(1)}" y1="${ly.toFixed(1)}" x2="${rx.toFixed(1)}" y2="${ry.toFixed(1)}" stroke="#6d4c41" stroke-width="7" stroke-linecap="round"/><circle cx="120" cy="74" r="6" fill="#4e342e"/>
      ${pan(lx,ly,v.left.emoji)}${pan(rx,ry,v.right.emoji)}</svg>`;
  }
  // Two equal glasses, a red and a blue one, filled to different heights.
  function glassesSvg(v){
    const g=(x,c,f)=>{const top=40,bot=150,lvl=bot-f*(bot-top);return `<rect x="${x+4}" y="${lvl}" width="62" height="${bot-lvl}" fill="#4fc3f7" opacity=".6"/><path d="M${x} ${top} L${x+4} ${bot} Q${x+4} ${bot+6} ${x+10} ${bot+6} L${x+60} ${bot+6} Q${x+66} ${bot+6} ${x+66} ${bot} L${x+70} ${top}" fill="none" stroke="${c}" stroke-width="5" stroke-linejoin="round"/>`};
    return `<svg viewBox="0 0 240 170" class="m-svg" role="img">${g(25,'#e53935',v.red)}${g(145,'#1e88e5',v.blue)}</svg>`;
  }
  const cardsHtml=v=>`<div class="m-cards">${[v.a,v.b].map(c=>`<div class="m-card"><span class="m-big-emoji">${c.emoji}</span><b>${esc(t(`measure.obj.${c.obj}`))}</b><strong>${bdi(c.label)}</strong></div>`).join('')}</div>`;

  /* ---------------- the question makers ---------------- */
  const LEN_OBJ=['pencil','crayon','straw','brush','ribbon','nail'];
  function lengthQ(L){
    const obj=pick(LEN_OBJ);
    if(L>=5&&Math.random()<.5){
      // in millimetres: whole or half centimetres, from a mark other than 0
      const R=15,start=rnd(0,4),len=rnd(6,(R-start)*2)/2,end=start+len,ans=len*10;
      return {kind:'length',ask:`measure.len.${obj}`,visual:rulerSvg({R,start,end,obj,mm:true}),
        options:numberOptions(ans,[ans+5,ans-5,end*10,ans+10],'mm',5),explain:start?`${num(end*10)} − ${num(start*10)} = ${qty(ans,'mm')}`:qty(ans,'mm')};
    }
    const R=L<=1?10:L<=2?15:20;
    const start=L>=4?rnd(1,6):0,len=rnd(3,Math.min(R-start,L<=1?9:R)),end=start+len;
    return {kind:'length',ask:`measure.len.${obj}`,visual:rulerSvg({R,start,end,obj,mm:false}),
      options:numberOptions(len,start?[end,len+1,len-1]:[len+1,len-1,len+2],'cm'),explain:start?`${end} − ${start} = ${qty(len,'cm')}`:qty(len,'cm')};
  }
  // Objects on the scale, each with weights that suit it (grams).
  const WEIGHT_OBJ={
    kg:[{id:'melon',e:'🍉'},{id:'pumpkin',e:'🎃'},{id:'cat',e:'🐈'},{id:'potatoes',e:'🥔'}],
    g:[{id:'apple',e:'🍎'},{id:'cheese',e:'🧀'},{id:'book',e:'📕'},{id:'potatoes',e:'🥔'}]
  };
  function weightQ(L){
    if(L<=2||(L===4&&Math.random()<.4)){
      // whole (or half) kilograms on a 5 kg dial
      const o=pick(WEIGHT_OBJ.kg),step=L>=4?.5:1,val=rnd(L>=4?3:1,Math.round(5/step-(L>=4?1:0)))*step;
      return {kind:'weight',ask:`measure.wt.${o.id}`,visual:scaleSvg({emoji:o.e,value:val,dial:{max:5,minor:.5,major:1,unit:'kg',show:1}}),
        options:numberOptions(val,[val+step,val-step,val+1,val*2],'kg',step),explain:qty(val,'kg')};
    }
    if(L>=5){
      // a 2 kg dial marked in kilograms, the answer in grams: reading and converting
      const o=pick(WEIGHT_OBJ.kg),g=rnd(3,19)*100;
      return {kind:'weight',ask:`measure.wt.${o.id}`,visual:scaleSvg({emoji:o.e,value:g,dial:{max:2000,minor:100,major:500,unit:'kg',show:1000}}),
        options:numberOptions(g,[g+100,g-100,g/10,g+500],'g',100),explain:`${qty(g/1000,'kg')} = ${qty(g,'g')}`};
    }
    const o=pick(WEIGHT_OBJ.g),step=L>=4?50:100,g=rnd(2,1000/step-1)*step;
    return {kind:'weight',ask:`measure.wt.${o.id}`,visual:scaleSvg({emoji:o.e,value:g,dial:{max:1000,minor:50,major:200,unit:'g',show:1}}),
      options:numberOptions(g,[g+step,g-step,g+2*step,g-2*step],'g',step),explain:qty(g,'g')};
  }
  function volumeQ(L){
    if(L<=2){
      const l=rnd(1,3);   // never the top mark: a full jug is hard to read
      return {kind:'volume',ask:'measure.vol.read',visual:jugSvg({value:l,jug:{cap:4,minor:.5,major:1,unit:'l',show:1}}),options:numberOptions(l,[l+1,l-1,l+2],'l',1),explain:qty(l,'l')};
    }
    const step=L>=4?50:100,jug={cap:1000,minor:step,major:L>=4?250:200,unit:'ml',show:1};
    const ml=rnd(L>=4?3:2,1000/step-2)*step;
    if(L>=3&&Math.random()<.35){
      const rest=1000-ml;
      return {kind:'volume',ask:'measure.vol.more',visual:jugSvg({value:ml,jug}),options:numberOptions(rest,[ml,rest+step,rest-step,rest+2*step],'ml',step),explain:`1000 − ${ml} = ${qty(rest,'ml')}`};
    }
    if(L>=5&&ml%10===0&&Math.random()<.4)
      return {kind:'volume',ask:'measure.vol.read',visual:jugSvg({value:ml,jug}),options:numberOptions(ml/10,[ml,ml/100,ml/10+5,ml/10-5],'cl',5),explain:`${qty(ml,'ml')} = ${qty(ml/10,'cl')}`};
    return {kind:'volume',ask:'measure.vol.read',visual:jugSvg({value:ml,jug}),options:numberOptions(ml,[ml+step,ml-step,ml+2*step,ml-2*step],'ml',step),explain:qty(ml,'ml')};
  }
  // Comparing: pictures without numbers for the youngest, real amounts later.
  const HEAVY_PAIRS=[[{obj:'elephant',emoji:'🐘'},{obj:'mouse',emoji:'🐭'}],[{obj:'cow',emoji:'🐄'},{obj:'chicken',emoji:'🐔'}],[{obj:'melon',emoji:'🍉'},{obj:'strawberry',emoji:'🍓'}],[{obj:'book',emoji:'📕'},{obj:'feather',emoji:'🪶'}]];
  function compareQ(L){
    const dim=pick(['length','weight','volume']);
    if(L<=2){
      if(dim==='length'){
        const [o1,o2]=shuffle(LEN_OBJ).slice(0,2),l1=rnd(3,11);let l2=rnd(3,11);while(Math.abs(l1-l2)<3)l2=rnd(3,11);
        const longer=pick([true,false]),right=(l1>l2)===longer?o1:o2;
        return {kind:'compare',ask:longer?'measure.cmp.longer':'measure.cmp.shorter',visual:twoLengthsSvg({a:{obj:o1,len:l1},b:{obj:o2,len:l2}}),options:nameOptions(shuffle([o1,o2]),right),explain:''};
      }
      if(dim==='weight'){
        const [heavy,light]=pick(HEAVY_PAIRS),heavier=pick([true,false]),leftHeavy=pick([true,false]);
        const left=leftHeavy?heavy:light,right=leftHeavy?light:heavy;
        const visual=L<=1?balanceSvg({left,right,leftHeavy}):`<div class="m-cards">${[left,right].map(c=>`<div class="m-card"><span class="m-big-emoji">${c.emoji}</span><b>${esc(t(`measure.obj.${c.obj}`))}</b></div>`).join('')}</div>`;
        return {kind:'compare',ask:heavier?'measure.cmp.heavier':'measure.cmp.lighter',visual,options:nameOptions([left.obj,right.obj],heavier?heavy.obj:light.obj),explain:''};
      }
      const r=rnd(2,9)/10;let b=rnd(2,9)/10;while(Math.abs(r-b)<.3)b=rnd(2,9)/10;
      const more=pick([true,false]),right=(r>b)===more?'glassRed':'glassBlue';
      return {kind:'compare',ask:more?'measure.cmp.more':'measure.cmp.less',visual:glassesSvg({red:r,blue:b}),options:nameOptions(['glassRed','glassBlue'],right),explain:''};
    }
    // real amounts; from level 4 in two different units
    const mixed=L>=4;
    const make={
      length:()=>{const a=rnd(40,180),b=Math.max(20,a+pick([-1,1])*rnd(10,60));return [{obj:'rope',emoji:'🪢',v:a},{obj:'ribbon',emoji:'🎀',v:b}].map(c=>({...c,label:mixed&&c.obj==='rope'&&c.v>=100?qty(c.v/100,'m'):qty(c.v,'cm'),base:'cm'}))},
      weight:()=>{const a=rnd(6,24)*100,b=Math.max(200,a+pick([-1,1])*rnd(1,6)*100);return [{obj:'package',emoji:'📦',v:a},{obj:'schoolbag',emoji:'🎒',v:b}].map(c=>({...c,label:mixed&&c.obj==='package'&&c.v>=1000?qty(c.v/1000,'kg'):qty(c.v,'g'),base:'g'}))},
      volume:()=>{const a=rnd(4,18)*100,b=Math.max(200,a+pick([-1,1])*rnd(1,5)*100);return [{obj:'bottle',emoji:'🍶',v:a},{obj:'carton',emoji:'🧃',v:b}].map(c=>({...c,label:mixed&&c.obj==='bottle'&&c.v>=1000?qty(c.v/1000,'l'):qty(c.v,'ml'),base:'ml'}))}
    };
    let [a,b]=make[dim]();
    if(a.v===b.v)return compareQ(L);
    const bigger=pick([true,false]),win=(a.v>b.v)===bigger?a:b;
    const ask={length:bigger?'measure.cmp.longer':'measure.cmp.shorter',weight:bigger?'measure.cmp.heavier':'measure.cmp.lighter',volume:bigger?'measure.cmp.more':'measure.cmp.less'}[dim];
    const lo=a.v<b.v?a:b,hi=a.v<b.v?b:a;
    return {kind:'compare',ask,visual:cardsHtml({a,b}),options:nameOptions([a.obj,b.obj],win.obj),explain:`${qty(lo.v,lo.base)} < ${qty(hi.v,hi.base)}`};
  }
  // Estimating: a real thing and four sizes, one sensible.
  const EST=[
    {id:'shoe',e:'👟',ans:[25,'cm'],wrong:[[2,'cm'],[1,'m'],[3,'m']],from:2},
    {id:'door',e:'🚪',ans:[2,'m'],wrong:[[20,'cm'],[50,'cm'],[10,'m']],from:2},
    {id:'apple',e:'🍎',ans:[150,'g'],wrong:[[2,'g'],[3,'kg'],[20,'kg']],from:3},
    {id:'bag',e:'🎒',ans:[4,'kg'],wrong:[[40,'g'],[40,'kg'],[400,'kg']],from:3},
    {id:'glass',e:'🥛',ans:[250,'ml'],wrong:[[2,'ml'],[5,'l'],[50,'l']],from:3},
    {id:'bath',e:'🛁',ans:[150,'l'],wrong:[[2,'l'],[15,'l'],[5000,'l']],from:4},
    {id:'car',e:'🚗',ans:[4,'m'],wrong:[[40,'cm'],[40,'m'],[400,'m']],from:2},
    {id:'elephant',e:'🐘',ans:[5000,'kg'],wrong:[[50,'kg'],[500,'g'],[50,'g']],from:4},
    {id:'bucket',e:'🪣',ans:[10,'l'],wrong:[[100,'ml'],[1,'ml'],[1000,'l']],from:3},
    {id:'pencil',e:'✏️',ans:[18,'cm'],wrong:[[2,'mm'],[1,'m'],[5,'m']],from:2}
  ];
  function estimateQ(L){
    const it=pick(EST.filter(x=>x.from<=Math.max(2,L)));
    const opts=shuffle([[...it.ans,true],...it.wrong.map(w=>[...w,false])]).map(([v,u,ok])=>({id:`${v}${u}`,label:qty(v,u),ok}));
    return {kind:'estimate',ask:`measure.est.${it.id}`,visual:`<div class="m-estimate"><span class="m-big-emoji">${it.e}</span></div>`,options:opts,explain:`≈ ${qty(...it.ans)}`};
  }
  // Converting: whole numbers first, decimals later.
  const CONV={
    4:[()=>{const m=rnd(1,9);return [m,'m',m*100,'cm','1 m = 100 cm']},()=>{const c=rnd(1,9)*100;return [c,'cm',c/100,'m','100 cm = 1 m']},()=>{const k=rnd(1,9);return [k,'kg',k*1000,'g','1 kg = 1000 g']},
       ()=>{const g=rnd(1,9)*1000;return [g,'g',g/1000,'kg','1000 g = 1 kg']},()=>{const l=rnd(1,5);return [l,'l',l*1000,'ml','1 L = 1000 ml']},()=>{const k=rnd(1,5);return [k,'km',k*1000,'m','1 km = 1000 m']},()=>{const c=rnd(2,15);return [c,'cm',c*10,'mm','1 cm = 10 mm']}],
    5:[()=>{const k=rnd(1,4)+.5;return [k,'kg',k*1000,'g','1 kg = 1000 g']},()=>{const g=(rnd(1,4)+.5)*1000;return [g,'g',g/1000,'kg','1000 g = 1 kg']},()=>{const l=pick([.5,1.5,2.5]);return [l,'l',l*1000,'ml','1 L = 1000 ml']},
       ()=>{const m=(rnd(1,4)+.5)*1000;return [m,'m',m/1000,'km','1000 m = 1 km']},()=>{const m=rnd(1,4)+.5;return [m,'m',m*100,'cm','1 m = 100 cm']},()=>{const c=pick([25,50,75]);return [c,'cl',c*10,'ml','1 cl = 10 ml']}],
    6:[()=>{const k=rnd(1,4)+pick([.25,.75]);return [k,'kg',k*1000,'g','1 kg = 1000 g']},()=>{const l=rnd(1,2)+pick([.25,.75]);return [l,'l',l*1000,'ml','1 L = 1000 ml']},()=>{const c=rnd(1,4)*100+pick([25,75]);return [c,'cm',c/100,'m','100 cm = 1 m']},
       ()=>{const m=pick([250,750]);return [m,'m',m/1000,'km','1000 m = 1 km']}]
  };
  function convertQ(L){
    const lv=Math.min(6,Math.max(4,L)),[from,fu,to,tu,rule]=pick(Math.random()<.35&&lv>4?CONV[lv-1]:CONV[lv])();
    return {kind:'convert',ask:'measure.convert',visual:`<div class="m-convert">${bdi(`${qty(from,fu)} = ? ${U(tu)}`)}</div>`,
      options:numberOptions(to,[to*10,to/10,to*100,to/100],tu,to>=100?100:to>=10?10:1),explain:rule.replace(/\b(cm|mm|m|km|g|kg|ml|cl|L)\b/g,u=>U(u==='L'?'l':u))};
  }
  // Story sums (level 6): more than one step.
  const STORY=[
    ()=>{const a=pick([1,1.5,2]),b=pick([150,200,250]),n=rnd(2,Math.floor(a*1000/b)-1),r=a*1000-n*b;return {key:'bottle',p:{a:num(a),n,b},ans:r,unit:'ml',wrong:[n*b,r+b,r-b,a*1000-b],explain:`${a*1000} − ${n} × ${b} = ${qty(r,'ml')}`}},
    ()=>{const a=pick([2,3]),b=pick([20,25,30,40,45]),n=rnd(2,Math.floor(a*100/b)-1),r=a*100-n*b;return {key:'ribbon',p:{a,n,b},ans:r,unit:'cm',wrong:[n*b,r+b,r-b,a*100-b],explain:`${a*100} − ${n} × ${b} = ${qty(r,'cm')}`}},
    ()=>{const a=pick([1,2]),b=pick([150,200,250,300]),n=rnd(2,Math.floor(a*1000/b)-1),r=a*1000-n*b;return {key:'flour',p:{a,n,b},ans:r,unit:'g',wrong:[n*b,r+b,r-b,a*1000-b],explain:`${a*1000} − ${n} × ${b} = ${qty(r,'g')}`}},
    ()=>{const s=pick([2,5,10]),d=rnd(3,9),r=s*d;return {key:'map',p:{s,d},ans:r,unit:'km',wrong:[s+d,r+s,r-s,d],explain:`${d} × ${s} = ${qty(r,'km')}`}}
  ];
  function storyQ(){
    const s=pick(STORY)();
    return {kind:'story',ask:'measure.story',visual:`<div class="m-story">${esc(t(`measure.story.${s.key}`,s.p))}</div>`,options:numberOptions(s.ans,s.wrong,s.unit,s.unit==='km'?s.p.s:50),explain:s.explain};
  }
  const MAKERS={length:lengthQ,weight:weightQ,volume:volumeQ,compare:compareQ,estimate:estimateQ,convert:convertQ,story:storyQ};
  // What a round of ten holds per level (1 is groep 1-2 ... 6 is groep 7-8).
  const MIX={
    1:['compare','compare','compare','compare','compare','compare','length','length','length'],
    2:['length','length','weight','weight','volume','volume','compare','compare','estimate'],
    3:['length','weight','weight','volume','volume','compare','compare','estimate','estimate'],
    4:['length','weight','weight','volume','compare','estimate','convert','convert','convert'],
    5:['length','weight','volume','volume','compare','estimate','convert','convert','convert'],
    6:['weight','volume','compare','estimate','convert','convert','convert','story','story']
  };
  function makeRound(L){
    // The ruler first: Milo's tip goes with it.
    const kinds=['length',...shuffle(MIX[L])];
    const out=[];
    for(const k of kinds){let q,guard=0;do q=MAKERS[k](L);while(guard++<20&&out.some(x=>x.ask===q.ask&&x.explain===q.explain));out.push(q)}
    return out;
  }

  /* ---------------- the game ---------------- */
  K.startMeasure=()=>{
    K.audio.setTrack('play').catch(()=>{});
    K.startScoreRun?.();
    K.stopSpeech();
    const want=Number(K.state.niveau||1);
    const niveau=K.premium.can('math',want)?want:K.premium.FREE.mathMaxLevel;
    const level=Math.max(1,Math.min(6,niveau));
    const G=K.progress().games||={};const M=G.measure||={played:0,kinds:{}};M.played++;K.save();
    // The same shape as a round of sums, so games-math.js finish() shows the result.
    K.math={mode:'measure',world:'measure',niveau,level,sums:makeRound(level),index:0,score:0,done:false,answers:[]};
    render();
  };
  K.measureForTest={makeRound,MAKERS};
  K.measureRenderForTest=()=>render();

  function render(){
    const g=K.math,q=g.sums[g.index],total=g.sums.length;
    if(!q)return K.mathFinishForTest();
    const pct=Math.round(((g.index+1)/total)*100);
    const f=K.frame(`<section class="math measure quiz-v2 fade-in">
      <img class="quiz-v2-bg" src="${K.GAME_ART.math}" alt="">
      <div class="quiz-v2-dim"></div>
      <div class="quiz-v2-ui">
        <header class="quiz-v2-head">
          <button class="quiz-back" id="measureBack" aria-label="${esc(t('common.back'))}">${K.icon('back')}</button>
          <div class="quiz-brand"><span>${esc(t('math.title'))}</span><small>${esc(t('measure.title'))} · ${esc(t('memo.level',{n:g.niveau}))}</small></div>
          <div class="quiz-meta" aria-hidden="true"></div>
        </header>
        <div class="quiz-progress"><strong>${esc(t('talen.round',{n:g.index+1,total}))}</strong><div><i style="width:${pct}%"></i></div><span>${g.score} ✓</span></div>
        <main class="quiz-card measure-card" data-kind="${q.kind}">
          <h2 class="measure-q" id="measureQ">${esc(t(q.ask))}</h2>
          <div class="measure-stage">${q.visual}</div>
          <div class="answers math-answers measure-answers ${q.options.length===2?'two':''}">${q.options.map((o,i)=>`<button class="answer" data-i="${i}"><span class="answer-letter">${K.core.answerLetters(lang())[i]}</span><span class="answer-copy">${bdi(o.label)}</span></button>`).join('')}</div>
          <div class="math-feedback" id="measureFeedback" hidden></div>
        </main>
      </div>
    </section>`);
    const buttons=[...f.querySelectorAll('.answer')];
    const ask=()=>K.speak(t(q.ask));
    f.querySelector('#measureBack').onclick=()=>{K.stopSpeech();K.sfx('tap');K.showMathPick()};
    f.querySelector('#measureQ').onclick=()=>{K.sfx('tap');ask()};
    if(g.index===0)K.speakSequence([{kind:'speech',text:t('measure.tip')},{kind:'speech',text:t(q.ask)}]);else ask();

    let answered=false;
    buttons.forEach(b=>b.onclick=()=>{
      if(answered)return;answered=true;K.stopSpeech();
      const o=q.options[Number(b.dataset.i)],correct=!!o.ok;
      buttons.forEach(x=>x.disabled=true);
      const right=buttons[q.options.findIndex(x=>x.ok)];
      const G=K.progress().games||={},M=G.measure||={played:0,kinds:{}},rec=M.kinds[q.kind]||={right:0,wrong:0};
      if(correct){g.score++;rec.right++;K.sfx('good');b.classList.add('correct');K.awardPoints(10);K.celebrateAt?.(f,{x:f.clientWidth/2,y:f.clientHeight*.4,count:26})}
      else{rec.wrong++;K.sfx('bad');b.classList.add('wrong');right.classList.add('correct')}
      g.answers[g.index]={correct,kind:q.kind,level:g.level};
      K.save();
      // The measurement shows itself: start and end on the ruler, the weight, the water level.
      f.querySelector('.measure-stage').classList.add('reveal');
      const h=f.querySelector('#measureFeedback');h.hidden=false;h.className=`math-feedback ${correct?'is-good':'is-try'}`;
      h.innerHTML=`<b>${esc(t(correct?'feedback.goodKicker':'feedback.tryKicker'))}</b>${q.explain?`<span>${bdi(q.explain)}</span>`:''}`;
      const spoken=K.speak(correct?K.praiseLine():t('measure.try'));
      let moved=false;const next=()=>{if(moved||!f.isConnected)return;moved=true;g.index++;render()};
      // Long enough to see the answer (also without a voice), then on: about 1.2 s
      // after a right answer, longer after a wrong one so the measurement can be read.
      const shown=Date.now(),least=correct?1200:2400;
      const after=()=>setTimeout(next,Math.max(correct?400:900,least-(Date.now()-shown)));
      Promise.resolve(spoken).then(after,after);
      setTimeout(next,correct?2800:4600);
      h.onclick=next;
    });
  }
})();
