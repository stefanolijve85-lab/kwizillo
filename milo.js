(()=>{
  const K=window.KWIZILLO_M1;
  if(!K) return;

  // The guides as living hosts: full-body poses (cut-outs of Milo the robot and
  // Luna) that float, turn, point and talk. Onboarding puts the guide next to
  // every question and the first visit to Home is a short guided tour where the
  // guide flies from element to element. Milo opens the first run; the moment a
  // child picks Luna she takes over, with her own voice, poses and clips.
  // Everything here is presentational; the spoken lines come from i18n and
  // never contain the child's name.

  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  // Cut-outs from the 2026-09-15 character sheets (tools/mascot-prompts.md):
  // wave, talk, think, cheer and one pointing pose (to the right); pointing left
  // mirrors it, pointing down leans it over (CSS on data-pose).
  const poses=dir=>({
    wave:`${dir}/wave.png`,talk:`${dir}/talk.png`,think:`${dir}/think.png`,cheer:`${dir}/cheer.png`,
    pointRight:`${dir}/point-right.png`,pointLeft:{src:`${dir}/point-right.png`,flip:true},pointDown:`${dir}/point-right.png`
  });
  K.GUIDE_POSES={
    milo:poses('assets/mascots/milo'),
    luna:poses('assets/mascots/luna')
  };
  K.MILO_POSES=K.GUIDE_POSES.milo;
  // `mouth` is where the mouth sits on the portrait (fractions of its width and
  // height), for the audio-driven mouth used when a line has no clip.
  K.GUIDES={
    // Milo's mouth is a light on his screen (it glows open, no chin); Luna's is a real one (chin drops).
    milo:{voice:'Milo',name:'Milo',base:'assets/mascots/milo/talk-base.png',mouth:{x:.55,y:.585,w:.13,h:.06},mouthStyle:'glow'},
    luna:{voice:'Luna',name:'Luna',base:'assets/mascots/luna/talk-base.png',mouth:{x:.52,y:.49,w:.15,h:.05},mouthStyle:'jaw'}
  };
  const guideOf=g=>K.GUIDES[g]?g:'milo';
  // The guide who hosts: Luna when the child chose her voice, otherwise Milo
  // (a child who chose silence still sees Milo, just without sound).
  K.activeGuide=()=>K.state.voice==='Luna'?'luna':'milo';
  K.guideName=g=>K.GUIDES[guideOf(g??K.activeGuide())].name;
  function poseSrc(guide,p){const set=K.GUIDE_POSES[guide];const v=set[p]||set.talk;return typeof v==='string'?{src:v,flip:false}:v}
  // Warm every pose of a guide once so a pose change never flashes an empty frame.
  const warmed=new Set();
  K.warmGuide=(g='milo')=>{g=guideOf(g);if(warmed.has(g))return;warmed.add(g);Object.values(K.GUIDE_POSES[g]).forEach(v=>{const i=new Image();i.src=typeof v==='string'?v:v.src})};
  K.warmMilo=()=>K.warmGuide('milo');

  // A guide speaks with its own voice whatever voice is selected at the time; a
  // child who chose silence only sees the bubble. Resolves when the line is over.
  K.guideSay=(text,opts={},guide='milo')=>K.speak(text,{voice:K.GUIDES[guideOf(guide)].voice,...opts});
  K.guidePrefetch=(texts,guide='milo')=>K.prefetchSpeech(texts,{voice:K.GUIDES[guideOf(guide)].voice});
  K.miloSay=(text,opts)=>K.guideSay(text,opts,'milo');
  K.miloPrefetch=texts=>K.guidePrefetch(texts,'milo');

  // Real video for the fixed lines: a lip-synced clip per guide, language and
  // line (window.KWIZILLO_GUIDE_TALKS, built by tools/guide-talks.js). The clip
  // carries its own voice track, so it replaces the live speech request; when a
  // clip is missing, fails to load or may not autoplay, the still pose plus the
  // voice line take over unnoticed.
  const clipSrc=(key,guide='milo')=>{const lang=K.state.language||'nl';const set=window.KWIZILLO_GUIDE_TALKS?.[guideOf(guide)]?.[lang];return set&&set[key]||null};
  const clipPool=new Map();
  function clipVideo(src,guide){
    let v=clipPool.get(src);
    if(v) return v;
    v=document.createElement('video');
    v.className='milo-video';v.poster=K.GUIDES[guideOf(guide)].base;v.playsInline=true;v.setAttribute('playsinline','');v.setAttribute('webkit-playsinline','');v.preload='auto';v.disablePictureInPicture=true;v.src=src;v.load();
    clipPool.set(src,v);
    if(clipPool.size>6){const first=clipPool.keys().next().value;if(first!==src)clipPool.delete(first)}
    return v;
  }
  K.guideWarmClips=(keys,guide='milo')=>(keys||[]).forEach(k=>{const src=clipSrc(k,guide);if(src)clipVideo(src,guide)});
  K.miloWarmClips=keys=>K.guideWarmClips(keys,'milo');
  // Stopping speech stops the clips too: one rule for every screen change.
  const stopSpeech=K.stopSpeech;
  K.stopSpeech=(...a)=>{clipPool.forEach(v=>{if(!v.paused)v.pause()});return stopSpeech?.(...a)};
  K.guideHasClip=(key,guide='milo')=>!!clipSrc(key,guide);
  K.miloHasClip=key=>K.guideHasClip(key,'milo');

  // A line in a bubble never ends with one lonely word on the last line: the
  // last two words of every block are tied with a no-break space.
  const noWidows=root=>{
    const blocks=root.querySelectorAll('h1,h2,p,li');
    for(const el of (blocks.length?blocks:[root])){
      let node=el.lastChild;while(node&&node.nodeType!==3&&node.lastChild)node=node.lastChild;
      if(node&&node.nodeType===3){const t=node.nodeValue.replace(/\s+$/,'');const i=t.lastIndexOf(' ');if(i>0&&t.length-i<=14)node.nodeValue=t.slice(0,i)+'\u00a0'+t.slice(i+1)}
    }
  };
  K.noWidows=noWidows;

  // A host element: bubble + figure. `say` writes the bubble, speaks the line
  // and animates the figure while the voice is playing.
  K.guideHost=({guide='milo',pose='wave',size='md',bubble='top'}={})=>{
    guide=guideOf(guide);
    const el=document.createElement('div');
    el.className=`milo-host guide-${guide} milo-size-${size} bubble-${bubble}`;
    el.dataset.guide=guide;
    el.innerHTML=`<div class="milo-bubble" hidden></div><div class="milo-body"><img class="milo-figure" alt="" draggable="false"></div>`;
    const img=el.querySelector('.milo-figure'),bub=el.querySelector('.milo-bubble'),body=el.querySelector('.milo-body');
    let talkTimer=null,video=null;
    const showVideo=v=>{if(video&&video!==v){video.pause?.();video.remove()}video=v;if(!v.parentNode)body.appendChild(v);el.classList.add('video-mode')};
    const hideVideo=()=>{if(video){video.pause?.();video.remove();video=null}el.classList.remove('video-mode')};
    // A line without a clip is spoken from the guide's portrait in the same
    // rounded window (Luna's clips are still to be rendered), so the guide
    // never drops back to a cut-out figure mid-conversation.
    // The portrait carries a mouth that opens with the loudness of the voice:
    // a dark opening under the lips and the chin dropping over it, both driven
    // by K.voiceLevel() on every frame while the line plays.
    let still=null,mouthRaf=0;
    const showStill=()=>{
      const g=K.GUIDES[guide];if(!g.base)return false;
      if(!still){
        still=document.createElement('div');still.className=`milo-video milo-still mouth-${g.mouthStyle||'jaw'}`;
        const m=g.mouth||{x:.5,y:.5,w:.2,h:.07};
        for(const [k,v] of Object.entries(m)) still.style.setProperty(`--m${k}`,String(v));
        still.innerHTML=`<img class="milo-still-face" src="${g.base}" alt="" draggable="false"><span class="milo-mouth-hole"></span><span class="milo-still-chin"><img src="${g.base}" alt="" draggable="false"></span>`;
      }
      showVideo(still);return true;
    };
    const mouthLoop=()=>{
      let open=0;
      const tick=()=>{
        if(!still||!still.isConnected||!el.classList.contains('talking')){still?.style.setProperty('--open','0');mouthRaf=0;return}
        const level=(K.voiceLevel?.()||0)*.85;
        // Quick to open, a little slower to close, so consonants still flash.
        open=level>open?open*.35+level*.65:open*.7+level*.3;
        still.style.setProperty('--open',open.toFixed(3));
        mouthRaf=requestAnimationFrame(tick);
      };
      if(!mouthRaf)mouthRaf=requestAnimationFrame(tick);
    };
    // Plays a lip-synced clip; resolves true when it played to the end, false
    // when it could not start (then the caller falls back to pose + voice).
    async function playClip(src){
      const v=clipVideo(src,guide);
      v.muted=K.state.voice==='Stil';
      v.volume=Math.max(0,Math.min(1,Number(K.state.voiceVolume??1)));
      showVideo(v);
      try{v.currentTime=0}catch(e){}
      K.audio.duck(true);
      const ok=await new Promise(resolve=>{
        let settled=false;const done=r=>{if(settled)return;settled=true;v.onended=v.onerror=null;resolve(r)};
        v.onended=()=>done(true);v.onerror=()=>done(false);
        const p=v.play();if(p&&p.catch)p.catch(()=>done(false));
        // A clip never holds the screen hostage: whatever happens we move on after 20 s.
        setTimeout(()=>done(true),20000);
      });
      K.audio.duck(false);
      if(!ok)hideVideo();
      return ok;
    }
    const api={
      el,guide,
      pose(p){const {src,flip}=poseSrc(guide,p);if(img.getAttribute('src')!==src)img.src=src;el.classList.toggle('flip',!!flip);el.dataset.pose=p;return api},
      bubble(html){if(!html){bub.hidden=true;bub.innerHTML='';return api}bub.innerHTML=html;noWidows(bub);bub.hidden=false;bub.classList.remove('pop');void bub.offsetWidth;bub.classList.add('pop');return api},
      // Speaks `text`; the figure nods while the voice plays. Without a voice the
      // figure still nods for a moment so the bubble reads as "the guide said this".
      async say(text,{html,minMs=0,clip}={}){
        api.bubble(html??esc(text));
        const started=Date.now();
        const src=clip&&clipSrc(clip,guide);
        if(src){
          K.stopSpeech();
          el.classList.add('talking');
          const played=await playClip(src);
          el.classList.remove('talking');
          if(played){const left=minMs-(Date.now()-started);if(left>0)await new Promise(r=>setTimeout(r,left));return}
        }
        showStill();
        clearTimeout(talkTimer);el.classList.add('talking');
        talkTimer=setTimeout(()=>el.classList.remove('talking'),1800);
        await K.guideSay(text,{onStart:()=>{clearTimeout(talkTimer);el.classList.add('talking');mouthLoop()},onDone:()=>el.classList.remove('talking')},guide).catch(()=>{});
        el.classList.remove('talking');
        const left=minMs-(Date.now()-started);if(left>0)await new Promise(r=>setTimeout(r,left));
      },
      moveTo(x,y,{instant=false}={}){el.classList.toggle('no-motion',instant);el.style.transform=`translate(${Math.round(x)}px,${Math.round(y)}px)`;if(instant)void el.offsetWidth;el.classList.remove('no-motion');return api},
      stop(){if(video){video.pause?.()}K.stopSpeech();el.classList.remove('talking')},
      remove(){clearTimeout(talkTimer);cancelAnimationFrame(mouthRaf);mouthRaf=0;hideVideo();el.remove()}
    };
    api.pose(pose);
    return api;
  };
  K.miloHost=opts=>K.guideHost({...opts,guide:'milo'});

  /* ---------------- Home tour ---------------- */

  const TOUR_KEYS=['tour.worlds','tour.games','tour.facts','tour.hud','tour.nav','tour.done'];
  // Warms the tour's five lines for a guide (voice and clips) well before the
  // tour starts — a guide without clips would otherwise start every stop with a
  // round trip to the speech service.
  K.warmTour=(guide=K.activeGuide())=>{guide=guideOf(guide);K.guidePrefetch(TOUR_KEYS.map(k=>K.t(k)),guide);K.guideWarmClips(TOUR_KEYS.map(k=>k.replace('tour.','')),guide)};

  // The chosen guide flies across Home and explains each part in one sentence.
  // The tour is asked for explicitly (end of onboarding, "tour again" in the
  // parent zone) and never interrupts a returning player. A tap moves on,
  // "skip" ends it.
  K.startTour=async({onDone,guide}={})=>{
    const home=K.app.querySelector('.home');
    if(!home||home.querySelector('.milo-tour')) return;
    guide=guideOf(guide||K.activeGuide());
    K.warmGuide(guide);
    const t=K.t;
    // Memo + Rekenen share one stop (its clip predates the Weetjes tile); the
    // Weetjes get a stop of their own, spoken live.
    const stops=[
      {sel:'.home-worlds',key:'tour.worlds'},
      {sel:'#homeMemo,#homeMath',key:'tour.games'},
      {sel:'#homeFacts',key:'tour.facts'},
      {sel:'.home-hud',key:'tour.hud'},
      {sel:'.native-bottom-nav',key:'tour.nav'},
      {sel:null,key:'tour.done',pose:'cheer'}
    ];
    K.warmTour(guide);
    const layer=document.createElement('div');
    layer.className='milo-tour';
    layer.innerHTML=`<div class="milo-tour-dim"></div><div class="milo-tour-spot" hidden></div><div class="milo-tour-hint"><button class="milo-tour-skip" type="button">${esc(t('tour.skip'))}</button></div>`;
    const spot=layer.querySelector('.milo-tour-spot');
    const host=K.guideHost({guide,pose:'wave',size:'tour',bubble:'top'});
    layer.appendChild(host.el);
    home.appendChild(layer);
    home.classList.add('touring');
    const hb=()=>home.getBoundingClientRect();
    const W=()=>hb().width,H=()=>hb().height;
    const figure={w:Math.min(150,Math.round(W()*.34)),h:0};
    host.el.style.setProperty('--milo-w',figure.w+'px');
    // The guide talks from a 3:4 window (a clip, or the portrait when a clip is missing).
    figure.h=Math.round(figure.w*1.34);
    // The guide arrives from the right edge, mid-screen.
    host.moveTo(W()+figure.w,H()*.4,{instant:true});
    let done=false,advance=null;
    const next=()=>{advance?.()};
    layer.addEventListener('click',e=>{if(e.target.closest('.milo-tour-skip'))return;next()});
    layer.querySelector('.milo-tour-skip').onclick=()=>{done=true;next()};
    const waitTap=ms=>new Promise(r=>{let to=setTimeout(()=>{advance=null;r()},ms);advance=()=>{clearTimeout(to);advance=null;r()}});
    // A stop may spotlight several elements at once (their union).
    const rectOf=sel=>{const ns=sel?[...home.querySelectorAll(sel)]:[];if(!ns.length)return null;const b=hb();let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const n of ns){const r=n.getBoundingClientRect();x0=Math.min(x0,r.left);y0=Math.min(y0,r.top);x1=Math.max(x1,r.right);y1=Math.max(y1,r.bottom)}return {x:x0-b.left,y:y0-b.top,w:x1-x0,h:y1-y0}};
    // The host box is the figure; the bubble hangs above or below it and is
    // anchored to whichever side keeps it on screen.
    const put=(x,y,side,pose)=>{
      host.pose(pose);
      host.el.classList.toggle('bubble-top',side==='top');host.el.classList.toggle('bubble-bottom',side==='bottom');
      // The bubble is centred on the figure but always kept inside the screen;
      // the tail keeps pointing at the figure's middle.
      const bw=Math.min(Math.round(W()*.8),320),centre=x+figure.w/2;
      const bx=Math.max(8,Math.min(W()-bw-8,centre-bw/2));
      host.el.style.setProperty('--bw',bw+'px');
      host.el.style.setProperty('--bx',Math.round(bx-x)+'px');
      host.el.style.setProperty('--tx',Math.round(Math.max(14,Math.min(bw-30,centre-bx-8)))+'px');
      host.moveTo(x,y);
    };
    const place=r=>{
      // The guide sits above the element pointing down when there is room,
      // otherwise below it presenting upward, or beside it pointing at it.
      const pad=12;
      if(!r){spot.hidden=true;put((W()-figure.w)/2,H()*.5-figure.h/2,'top','cheer');return}
      spot.hidden=false;spot.style.left=(r.x-6)+'px';spot.style.top=(r.y-6)+'px';spot.style.width=(r.w+12)+'px';spot.style.height=(r.h+12)+'px';
      const above=r.y-pad-figure.h,below=r.y+r.h+pad;
      const x=Math.max(8,Math.min(W()-figure.w-8,r.x+r.w-figure.w-8));
      if(above>96)put(x,above,'top','pointDown');
      else if(below+figure.h<H()-8)put(x,below,'bottom','talk');
      else put(Math.max(8,W()-figure.w-8),Math.max(8,Math.min(H()-figure.h-8,r.y+r.h/2-figure.h/2)),'top','pointLeft');
    };
    try{
      K.sfx('swoosh');
      await new Promise(r=>setTimeout(r,60));
      for(const stop of stops){
        if(done)break;
        place(rectOf(stop.sel));
        if(stop.pose)host.pose(stop.pose);
        await new Promise(r=>setTimeout(r,720));
        if(done)break;
        const said=host.say(t(stop.key),{minMs:2600,clip:stop.key.replace('tour.','')});
        await Promise.race([said,waitTap(20000)]);
        host.stop();
      }
    }finally{
      host.stop();
      spot.hidden=true;host.bubble(null);
      host.moveTo(-figure.w*1.4,H()*.3);
      K.state.tourDone=true;K.save();
      setTimeout(()=>{layer.remove();home.classList.remove('touring');onDone?.()},760);
    }
  };
})();
