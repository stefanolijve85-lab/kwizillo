(()=>{
  const K=window.KWIZILLO_M1;
  if(!K) return;
  // Geld tellen (2026-10-10), the second part of Rekenen: the coins of the child's
  // own country lie on a mat in ever different combinations, the child types how
  // much it is. Ten rounds, passed or failed by the same level rules as the sums
  // (games-math.js finish). The coins were cut from Stefan's sheets with
  // tools/coin-cut.cjs: assets/geld/<set>/<value>.webp, the value in cents (øre,
  // kopeks, fils), so every amount is a whole number here.
  //
  // Everything the voice says comes from recorded pieces (closed-set rule,
  // tools/math-speech.cjs): "Hoeveel geld is dit?", a number, "euro", "en", "cent".
  const t=(k,v)=>K.t(k,v);
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const rnd=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
  const pick=a=>a[Math.floor(Math.random()*a.length)];

  // The app language decides the money: the euro in the design of its own country,
  // the dollar for English (the app's English is American), the real for Brazilian
  // Portuguese, and so on.
  const MONEY={
    nl:{set:'eur-nl',code:'EUR',locale:'nl-NL'},de:{set:'eur-de',code:'EUR',locale:'de-DE'},fr:{set:'eur-fr',code:'EUR',locale:'fr-FR'},
    es:{set:'eur-es',code:'EUR',locale:'es-ES'},it:{set:'eur-it',code:'EUR',locale:'it-IT'},en:{set:'usd',code:'USD',locale:'en-US'},
    pt:{set:'brl',code:'BRL',locale:'pt-BR'},ptpt:{set:'eur-es',code:'EUR',locale:'pt-PT'},   // every euro coin circulates in Portugal; no Portuguese set drawn yetda:{set:'dkk',code:'DKK',locale:'da-DK'},ru:{set:'rub',code:'RUB',locale:'ru-RU'},
    ar:{set:'aed',code:'AED',locale:'ar-AE-u-nu-latn'}
  };
  // Real diameters in millimetres, so a 2-euro coin is bigger than a 1-cent coin
  // (the sheets were not drawn to scale).
  const EUR={1:16.25,2:18.75,5:21.25,10:19.75,20:22.25,50:24.25,100:23.25,200:25.75};
  const DIAM={EUR,USD:{1:19.05,5:21.21,10:17.91,25:24.26,50:30.61,100:26.49},BRL:{5:22,10:20,25:25,50:23,100:27},
    DKK:{50:21.5,100:20.25,200:24.5,500:28.5,1000:23.35,2000:27},RUB:{10:17.5,50:19.5,100:20.5,200:23,500:25,1000:22},
    AED:{5:20,10:19.5,25:20,50:21,100:24}};
  const money=()=>MONEY[K.state.language]||MONEY.nl;
  const coinsOf=m=>Object.keys(DIAM[m.code]).map(Number).sort((a,b)=>a-b);
  const coinSrc=(m,v)=>`assets/geld/${m.set}/${v}.webp`;
  // en and ar write 3.45, the others 3,45
  const sepOf=m=>(new Intl.NumberFormat(m.locale).formatToParts(1.5).find(p=>p.type==='decimal')||{value:','}).value;
  const fmt=(m,minor)=>new Intl.NumberFormat(m.locale,{style:'currency',currency:m.code}).format(minor/100);
  // The currency sign around the typed number, where the language puts it (€ 3,45 / 3,45 kr.).
  const signs=m=>{const p=new Intl.NumberFormat(m.locale,{style:'currency',currency:m.code}).formatToParts(1);const i=p.findIndex(x=>x.type==='integer'),cur=p.find(x=>x.type==='currency')?.value||'';return p.findIndex(x=>x.type==='currency')<i?{pre:cur,post:''}:{pre:'',post:cur}};

  // Levels follow the parent's Rekenen level (niveau), capped for a free player
  // like the sums.
  //   1  whole coins only (euros, kroner, roubles), up to 10
  //   2  small coins only, under one euro (dollar, real ...)
  //   3  every coin, up to 5      4  every coin, up to 10      5  bigger piles, up to 20
  function makePile(m,level){
    const all=coinsOf(m),big=all.filter(v=>v>=100),small=all.filter(v=>v<100);
    const pool=level===1?(big.length>=2?big:all.slice(-3)):level===2?small:all;
    const [lo,hi,max]=[[2,4,1000],[2,5,99],[3,5,500],[4,7,1000],[6,10,2000]][Math.min(5,level)-1];
    for(let tries=0;tries<200;tries++){
      const n=rnd(lo,hi),coins=Array.from({length:n},()=>pick(pool)),total=coins.reduce((a,b)=>a+b,0);
      if(total<=max&&(level!==2||total<100))return {coins,total};
    }
    return {coins:[pool[0],pool[pool.length-1]],total:pool[0]+pool[pool.length-1]};
  }
  function makeRound(m,level){
    const out=[];let guard=0;
    while(out.length<10&&guard++<400){const p=makePile(m,level);if(out.some(x=>x.total===p.total)&&guard<300)continue;out.push(p)}
    return out;
  }

  // The amount in recorded pieces, the way the language says it (quiz-core-v2.js moneyParts).
  const amountParts=(m,minor)=>K.core.moneyParts(minor,K.state.language,k=>K.t(k));
  const say=parts=>K.speakSequence(parts.map(text=>({kind:'part',text})));

  /* ---------------- Rekenen: sums, money or measuring ---------------- */
  K.showMathPick=world=>{
    K.audio.setTrack('play').catch(()=>{});
    K.stopSpeech();
    const m=money();
    const coins=coinsOf(m).slice(-3);
    const f=K.frame(`<section class="native-panel-screen memo-picker game-picker math-pick fade-in">
      <div class="native-panel-glow"></div>
      <header class="panel-head"><button class="panel-back" aria-label="${esc(t('common.back'))}">${K.icon('back')}</button><div><h1 class="game-name">${esc(t('math.title'))}</h1><p>${esc(t('math.pick.sub'))}</p></div><span class="panel-settings panel-spacer" aria-hidden="true"></span></header>
      <div class="panel-scroll">
        <button class="memo-pick math-pick-tile" data-pick="sums"><img class="home-game-art" src="${K.GAME_ART.math}" alt="" decoding="async"><span class="home-game-veil"></span><b>${esc(t('math.pick.sums'))}<small>${esc(t('math.sub'))}</small></b></button>
        <button class="memo-pick math-pick-tile money" data-pick="money"><span class="money-pick-coins" aria-hidden="true">${coins.map((v,i)=>`<img src="${coinSrc(m,v)}" alt="" style="--i:${i}">`).join('')}</span><span class="home-game-veil"></span><b>${esc(t('math.money.title'))}<small>${esc(t('math.money.sub'))}</small></b></button>
        <button class="memo-pick math-pick-tile measure" data-pick="measure"><img class="home-game-art" src="${K.GAME_ART.measure}" alt="" decoding="async"><span class="home-game-veil"></span><b>${esc(t('measure.title'))}<small>${esc(t('measure.sub'))}</small></b></button>
      </div>
      ${K.bottomNav('home')}
    </section>`);
    f.querySelector('.panel-back').onclick=()=>{K.sfx('tap');K.showHome()};
    f.querySelector('[data-pick="sums"]').onclick=()=>{K.sfx('world');K.startMath(world)};
    f.querySelector('[data-pick="money"]').onclick=()=>{K.sfx('world');K.startMoney()};
    f.querySelector('[data-pick="measure"]').onclick=()=>{K.sfx('world');K.startMeasure()};   // games-measure.js
    K.bindNav(f);
  };

  /* ---------------- Geld tellen ---------------- */
  K.startMoney=()=>{
    K.audio.setTrack('play').catch(()=>{});
    K.startScoreRun?.();
    K.stopSpeech();
    const m=money();
    const want=Number(K.state.niveau||1);
    const niveau=K.premium.can('math',want)?want:K.premium.FREE.mathMaxLevel;
    const level=Math.max(1,Math.min(5,niveau));
    const piles=makeRound(m,level);
    // The same shape as a round of sums, so games-math.js finish() shows the result.
    K.math={mode:'money',world:'money',niveau,level,money:m,sums:piles,index:0,score:0,done:false,answers:[],asked:false};
    render();
  };
  K.moneyForTest={makePile,amountParts:(minor)=>amountParts(money(),minor),money};

  function render(){
    const g=K.math,m=g.money,p=g.sums[g.index],total=g.sums.length;
    if(!p)return K.mathFinishForTest();
    const sep=sepOf(m),{pre,post}=signs(m);
    const pct=Math.round(((g.index+1)/total)*100);
    const f=K.frame(`<section class="math money quiz-v2 fade-in">
      <img class="quiz-v2-bg" src="${K.GAME_ART.math}" alt="">
      <div class="quiz-v2-dim"></div>
      <div class="quiz-v2-ui">
        <header class="quiz-v2-head">
          <button class="quiz-back" id="moneyBack" aria-label="${esc(t('common.back'))}">${K.icon('back')}</button>
          <div class="quiz-brand"><span>${esc(t('math.title'))}</span><small>${esc(t('math.money.title'))} · ${esc(t('memo.level',{n:g.niveau}))}</small></div>
          <div class="quiz-meta" aria-hidden="true"></div>
        </header>
        <div class="quiz-progress"><strong>${esc(t('talen.round',{n:g.index+1,total}))}</strong><div><i style="width:${pct}%"></i></div></div>
        <main class="quiz-card money-card">
          <div class="money-tray" id="moneyTray" aria-label="${esc(t('math.money.ask'))}"></div>
          <div class="money-display" id="moneyDisplay" aria-live="polite"><span class="money-sign">${esc(pre)}</span><b id="moneyTyped">?</b><span class="money-sign">${esc(post)}</span></div>
          <div class="money-feedback" id="moneyFeedback" hidden></div>
          <div class="money-keypad" id="moneyKeys">${['1','2','3','4','5','6','7','8','9',sep,'0','⌫'].map(k=>`<button class="money-key ${k==='⌫'?'del':k===sep?'sep':''}" data-key="${esc(k)}" aria-label="${esc(k==='⌫'?t('math.money.delete'):k)}">${esc(k)}</button>`).join('')}</div>
          <div class="money-actions"><button class="action hint" id="moneyHint">${K.icon('bulb')} ${esc(t('quiz.hint'))}</button><button class="money-ok" id="moneyOk" disabled>${esc(t('math.money.ok'))}</button></div>
        </main>
      </div>
    </section>`);
    const tray=f.querySelector('#moneyTray');
    // The coins: real sizes, a little turned, spread over the mat; two may overlap a
    // little (a real pile does), never so much that one hides another.
    const lay=()=>{
      const W=tray.clientWidth,H=tray.clientHeight;if(!W||!H)return;
      const d=DIAM[m.code],biggest=Math.max(...Object.values(d));
      const n=p.coins.length,scale=Math.min(W,H)*(n>7?.27:n>4?.33:n>3?.38:.44)/biggest;   // few coins: bigger, so they read well
      const placed=[];
      tray.innerHTML=p.coins.map((v,i)=>`<span class="money-coin" data-v="${v}" style="--d:${(d[v]*scale).toFixed(1)}px;--r:${rnd(-35,35)}deg"><img src="${coinSrc(m,v)}" alt=""></span>`).join('');
      [...tray.children].forEach(el=>{
        const r=Number(el.style.getPropertyValue('--d').replace('px',''))/2;
        let best=null;
        for(let k=0;k<160;k++){
          const x=r+4+Math.random()*(W-2*r-8),y=r+4+Math.random()*(H-2*r-8);
          const gap=Math.min(...placed.map(q=>Math.hypot(q.x-x,q.y-y)/(q.r+r)),9);
          if(!best||gap>best.gap)best={x,y,gap};
          if(gap>=(k<120?1.02:.82))break;
        }
        placed.push({x:best.x,y:best.y,r});
        el.style.left=(best.x-r).toFixed(1)+'px';el.style.top=(best.y-r).toFixed(1)+'px';
      });
    };
    requestAnimationFrame(lay);

    let typed='',answered=false;
    const typedEl=f.querySelector('#moneyTyped'),ok=f.querySelector('#moneyOk');
    const show=()=>{typedEl.textContent=typed||'?';typedEl.classList.toggle('empty',!typed);ok.disabled=!/\d/.test(typed)};
    f.querySelectorAll('[data-key]').forEach(b=>b.onclick=()=>{
      if(answered)return;K.sfx('tap');
      const k=b.dataset.key;
      if(k==='⌫')typed=typed.slice(0,-1);
      else if(k===sep){if(!typed.includes(sep))typed=(typed||'0')+sep}
      else{const [, frac]=typed.split(sep);if(frac!==undefined&&frac.length>=2)return;if(typed.replace(sep,'').length>=6)return;typed=typed==='0'?k:typed+k}
      show();
    });
    // "3,5" is 3,50; nothing after the comma is whole units
    const valueOf=s=>{const [u,c='']=s.split(sep);return Number(u||0)*100+Number((c+'00').slice(0,2))};

    f.querySelector('#moneyBack').onclick=()=>{K.stopSpeech();K.sfx('tap');K.showMathPick()};
    // Hint: the coins slide into rows from the most to the least, so they can be counted in order.
    const hintBtn=f.querySelector('#moneyHint');
    hintBtn.onclick=()=>{
      if(answered)return;K.sfx('hint');hintBtn.disabled=true;
      const els=[...tray.children].sort((a,b)=>Number(b.dataset.v)-Number(a.dataset.v));
      const W=tray.clientWidth,H=tray.clientHeight,ds=els.map(e=>Number(e.style.getPropertyValue('--d').replace('px','')));
      const cell=Math.max(...ds)*.92,cols=Math.max(1,Math.floor((W-8)/cell)),rows=Math.ceil(els.length/cols);
      const top=Math.max(4,(H-rows*cell)/2),left=Math.max(4,(W-Math.min(els.length,cols)*cell)/2);
      els.forEach((e,i)=>{const d=ds[i],c=i%cols,r=Math.floor(i/cols);e.classList.add('sorted');e.style.left=(left+c*cell+(cell-d)/2).toFixed(1)+'px';e.style.top=(top+r*cell+(cell-d)/2).toFixed(1)+'px';e.style.setProperty('--r','0deg')});
    };

    ok.onclick=()=>{
      if(answered||ok.disabled)return;answered=true;K.stopSpeech();
      const value=valueOf(typed),correct=value===p.total;
      f.querySelectorAll('.money-key,#moneyHint').forEach(b=>b.disabled=true);ok.disabled=true;
      g.answers[g.index]={correct,value};
      if(correct){g.score++;K.sfx('good');K.awardPoints(10);K.celebrateAt?.(f,{x:f.clientWidth/2,y:f.clientHeight*.35,count:30})}else K.sfx('bad');
      K.save();
      f.querySelector('#moneyDisplay').classList.add(correct?'is-good':'is-try');
      const h=f.querySelector('#moneyFeedback');h.hidden=false;h.className=`money-feedback ${correct?'is-good':'is-try'}`;
      h.innerHTML=`<b>${esc(t(correct?'feedback.goodKicker':'feedback.tryKicker'))}</b><span>${esc(fmt(m,p.total))}</span>`;
      const line=correct?[K.praiseLine(),...amountParts(m,p.total)]:[...K.core.speechParts(t('math.speech.wrong'),{},K.state.language),...amountParts(m,p.total)];
      const spoken=say(line);
      let moved=false;const next=()=>{if(moved||!f.isConnected)return;moved=true;g.index++;render()};
      Promise.resolve(spoken).then(()=>setTimeout(next,700),()=>setTimeout(next,700));
      setTimeout(next,correct?3600:5200);
      h.onclick=next;
    };
    // The question once, at the first pile: after that the child knows what to do.
    if(!g.asked){g.asked=true;say([t('math.money.ask')])}
    show();
  }
})();
