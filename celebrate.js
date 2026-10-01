(()=>{
  const K=window.KWIZILLO_M1;
  if(!K) return;

  // Small, self-contained celebrations. One canvas per burst, removed when the
  // last piece has fallen; nothing here touches game state.
  const COLORS=['#ffd93d','#ff8c42','#ff4f81','#6be5ff','#7cff8a','#b98cff','#ffffff'];
  const reduced=()=>window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function burst(host,{count=60,origin,spread=Math.PI,power=9,gravity=.32,life=1500,z=40}={}){
    if(!host||reduced()) return;
    const r=host.getBoundingClientRect();
    const canvas=document.createElement('canvas');
    canvas.className='confetti-canvas';
    canvas.width=Math.max(1,Math.round(r.width*devicePixelRatio));
    canvas.height=Math.max(1,Math.round(r.height*devicePixelRatio));
    Object.assign(canvas.style,{position:'absolute',inset:'0',width:'100%',height:'100%',pointerEvents:'none',zIndex:String(z)});
    host.appendChild(canvas);
    const ctx=canvas.getContext('2d');
    ctx.scale(devicePixelRatio,devicePixelRatio);
    const ox=origin?origin.x:r.width/2, oy=origin?origin.y:r.height*.3;
    const parts=Array.from({length:count},()=>{
      const a=-Math.PI/2+(Math.random()-.5)*spread, v=power*(.55+Math.random()*.75);
      return {x:ox,y:oy,vx:Math.cos(a)*v,vy:Math.sin(a)*v,w:6+Math.random()*7,h:4+Math.random()*6,
        rot:Math.random()*Math.PI,vr:(Math.random()-.5)*.3,color:COLORS[Math.floor(Math.random()*COLORS.length)],
        shape:Math.random()<.25?'dot':'rect',t:0};
    });
    const start=performance.now();
    let last=start;
    (function frame(now){
      const dt=Math.min(32,now-last)/16.7; last=now;
      const age=now-start;
      ctx.clearRect(0,0,r.width,r.height);
      for(const p of parts){
        p.vy+=gravity*dt; p.vx*=.985; p.x+=p.vx*dt; p.y+=p.vy*dt; p.rot+=p.vr*dt;
        const alpha=Math.max(0,1-Math.max(0,age-life*.65)/(life*.35));
        ctx.save(); ctx.globalAlpha=alpha; ctx.translate(p.x,p.y); ctx.rotate(p.rot); ctx.fillStyle=p.color;
        if(p.shape==='dot'){ctx.beginPath();ctx.arc(0,0,p.w/2.4,0,Math.PI*2);ctx.fill()}
        else ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h*Math.abs(Math.cos(p.rot*2))+1);
        ctx.restore();
      }
      if(age<life) requestAnimationFrame(frame); else canvas.remove();
    })(start);
    return canvas;
  }

  // A small pop at a point inside a host (memo pairs, small rewards).
  K.celebrateAt=(host,{x,y,count=24})=>{try{burst(host,{count,origin:{x,y},spread:Math.PI*1.3,power:6,gravity:.3,life:1000,z:40})}catch(e){}};

  // 'answer': a short pop of confetti from the top of the feedback card.
  // 'quiz'  : the result screen; the gift on the card bursts open (see K.showResult).
  K.celebrate=(kind,host)=>{
    try{
      if(kind==='answer'){
        const card=host?.querySelector?.('.feedback-card')||host;
        const frame=K.app.querySelector('.game-frame');
        if(!frame||!card) return;
        const fr=frame.getBoundingClientRect(), cr=card.getBoundingClientRect();
        // The correct-answer chime already plays; the confetti stays silent so the two never clash.
        burst(frame,{count:55,origin:{x:cr.left-fr.left+cr.width/2,y:cr.top-fr.top+18},spread:Math.PI*1.1,power:8,life:1400,z:40});
      }else if(kind==='quiz'){
        const frame=K.app.querySelector('.game-frame');
        const from=host||frame;
        if(!frame||!from) return;
        const fr=frame.getBoundingClientRect(), cr=from.getBoundingClientRect();
        const o={x:cr.left-fr.left+cr.width/2,y:cr.top-fr.top+cr.height/2};
        burst(frame,{count:150,origin:o,spread:Math.PI*1.4,power:13,gravity:.28,life:2600,z:40});
        setTimeout(()=>{if(frame.isConnected)burst(frame,{count:60,origin:o,spread:Math.PI*1.2,power:10,gravity:.3,life:2000,z:40})},260);
      }else if(kind==='pop'){
        // De korte pop boven een popup: een handvol confetti vanaf de bovenrand
        // van de kaart. Kort, want dit gebeurt bij elk goed antwoord.
        const frame=K.app.querySelector('.game-frame');
        const card=host?.querySelector?.('.simple-modal-card')||host;
        if(!frame||!card) return;
        const fr=frame.getBoundingClientRect(), cr=card.getBoundingClientRect();
        burst(frame,{count:44,origin:{x:cr.left-fr.left+cr.width/2,y:cr.top-fr.top+14},spread:Math.PI*1.1,power:8,life:1200,z:40});
      }else if(kind==='gold'){
        // A whole world finished: three waves from the middle of the card,
        // wide and slow, so the golden card is showered rather than sprinkled.
        const host2=host||K.app.querySelector('.game-frame');
        if(!host2) return;
        const r=host2.getBoundingClientRect(), o={x:r.width/2,y:r.height*.42};
        burst(host2,{count:170,origin:o,spread:Math.PI*1.6,power:14,gravity:.26,life:3000,z:60});
        setTimeout(()=>{if(host2.isConnected)burst(host2,{count:90,origin:{x:r.width*.2,y:r.height*.5},spread:Math.PI,power:12,gravity:.28,life:2600,z:60})},280);
        setTimeout(()=>{if(host2.isConnected)burst(host2,{count:90,origin:{x:r.width*.8,y:r.height*.5},spread:Math.PI,power:12,gravity:.28,life:2600,z:60})},520);
      }
    }catch(e){}
  };

  // De gids komt bij een goed antwoord áchter de bovenrand van de kaart omhoog,
  // tot zijn middel: de kaart zelf verbergt de rest, dus hij staat er echt achter
  // en niet ernaast. Links, midden of rechts, zodat tien goede antwoorden niet
  // tien keer hetzelfde zijn. Hij wipt, juicht en zakt weer weg. Quiz, Wat ben
  // ik? en Fotozoom gebruiken dit allemaal.
  // WAIST: waar het middel zit in de juichpose (milo: de riem, luna: de broeksband),
  // als deel van de hoogte van assets/mascots/*/cheer.png.
  const WAIST={milo:.6,luna:.47};
  const RATIO={milo:720/500,luna:720/439};
  const SPOTS=['l','c','r'];
  K.riseGuide=(host,card)=>{
    try{
      if(!host||!card) return null;
      const guide=K.activeGuide?.()||'milo';
      const src=K.GUIDE_POSES?.[guide]?.cheer?.src;
      if(!src) return null;
      // Layoutmaten (offset*), geen getBoundingClientRect: de kaart schuift op
      // dit moment nog binnen, en die beweging mag de plek van de gids niet bepalen.
      let cx=0,cy=0;for(let el=card;el&&el!==host;el=el.offsetParent){cx+=el.offsetLeft;cy+=el.offsetTop}
      const cw=card.offsetWidth;
      const w=Math.round(Math.min(150,cw*.4)),h=w*RATIO[guide];
      const spot=SPOTS[Math.floor(Math.random()*SPOTS.length)];
      const left=cx+(spot==='l'?cw*.07:spot==='r'?cw*.93-w:(cw-w)/2);
      // +8: het middel valt net onder de ronde bovenrand, niet erop.
      const top=cy-h*WAIST[guide]+8;
      host.querySelector(':scope>.guide-rise')?.remove();
      const img=document.createElement('img');
      img.className=`guide-rise guide-rise-${guide}`;img.src=src;img.alt='';img.setAttribute('aria-hidden','true');img.draggable=false;
      img.style.cssText=`width:${w}px;left:${Math.round(left)}px;top:${Math.round(top)}px`;
      host.insertBefore(img,card);
      img.addEventListener('animationend',()=>img.remove());
      return img;
    }catch(e){ return null }
  };

  // Wat er gebeurt als een antwoord goed is: confetti én de gids achter de ballon.
  K.cheer=host=>{K.celebrate('pop',host);K.riseGuide(host,host?.querySelector?.(':scope>.simple-modal-card'))};
})();
