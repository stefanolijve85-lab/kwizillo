(()=>{
  const K=window.KWIZILLO_M1;
  if(!K) return;

  // Milo as a living host: full-body poses (cut-outs of the brand robot) that
  // float, turn, point and talk. Onboarding puts him next to every question and
  // the first visit to Home is a short guided tour where he flies from element
  // to element. Everything here is presentational; the spoken lines come from
  // i18n and never contain the child's name.

  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  K.MILO_POSES={
    wave:'assets/mascots/milo/wave.png',
    talk:'assets/mascots/milo/talk.png',
    think:'assets/mascots/milo/think.png',
    cheer:'assets/mascots/milo/cheer.png',
    pointDown:'assets/mascots/milo/point-down.png',
    pointLeft:'assets/mascots/milo/point-left.png',
    pointRight:{src:'assets/mascots/milo/point-left.png',flip:true}
  };
  function poseSrc(p){const v=K.MILO_POSES[p]||K.MILO_POSES.talk;return typeof v==='string'?{src:v,flip:false}:v}
  // Warm every pose once so a pose change never flashes an empty frame.
  let warmed=false;
  K.warmMilo=()=>{if(warmed)return;warmed=true;Object.values(K.MILO_POSES).forEach(v=>{const i=new Image();i.src=typeof v==='string'?v:v.src})};

  // Milo speaks with his own voice whatever guide the child picked later on; a
  // child who chose silence only sees the bubble. Resolves when the line is over.
  K.miloSay=(text,opts={})=>K.speak(text,{voice:'Milo',...opts});
  K.miloPrefetch=texts=>K.prefetchSpeech(texts,{voice:'Milo'});

  // Real video for the fixed lines: a lip-synced clip of Milo per line and
  // language (window.KWIZILLO_MILO_TALKS, built by tools/milo-talks.js). The
  // clip carries its own voice track, so it replaces the live speech request;
  // when a clip is missing, fails to load or may not autoplay, the still pose
  // plus the voice line take over unnoticed.
  const clipSrc=key=>{const lang=K.state.language||'nl';const set=window.KWIZILLO_MILO_TALKS?.[lang];return set&&set[key]||null};
  const clipPool=new Map();
  function clipVideo(src){
    let v=clipPool.get(src);
    if(v) return v;
    v=document.createElement('video');
    v.className='milo-video';v.poster='assets/mascots/milo/talk-base.png';v.playsInline=true;v.setAttribute('playsinline','');v.setAttribute('webkit-playsinline','');v.preload='auto';v.disablePictureInPicture=true;v.src=src;v.load();
    clipPool.set(src,v);
    if(clipPool.size>6){const first=clipPool.keys().next().value;if(first!==src)clipPool.delete(first)}
    return v;
  }
  K.miloWarmClips=keys=>(keys||[]).forEach(k=>{const src=clipSrc(k);if(src)clipVideo(src)});
  // Stopping speech stops Milo's clips too: one rule for every screen change.
  const stopSpeech=K.stopSpeech;
  K.stopSpeech=(...a)=>{clipPool.forEach(v=>{if(!v.paused)v.pause()});return stopSpeech?.(...a)};
  K.miloHasClip=key=>!!clipSrc(key);

  // A host element: bubble + figure. `say` writes the bubble, speaks the line
  // and animates the figure while the voice is playing.
  K.miloHost=({pose='wave',size='md',bubble='top'}={})=>{
    const el=document.createElement('div');
    el.className=`milo-host milo-size-${size} bubble-${bubble}`;
    el.innerHTML=`<div class="milo-bubble" hidden></div><div class="milo-body"><img class="milo-figure" alt="" draggable="false"></div>`;
    const img=el.querySelector('.milo-figure'),bub=el.querySelector('.milo-bubble'),body=el.querySelector('.milo-body');
    let talkTimer=null,video=null;
    const showVideo=v=>{if(video&&video!==v){video.pause();video.remove()}video=v;if(!v.parentNode)body.appendChild(v);el.classList.add('video-mode')};
    const hideVideo=()=>{if(video){video.pause();video.remove();video=null}el.classList.remove('video-mode')};
    // Plays a lip-synced clip; resolves true when it played to the end, false
    // when it could not start (then the caller falls back to pose + voice).
    async function playClip(src){
      const v=clipVideo(src);
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
      el,
      pose(p){const {src,flip}=poseSrc(p);if(img.getAttribute('src')!==src)img.src=src;el.classList.toggle('flip',!!flip);el.dataset.pose=p;return api},
      bubble(html){if(!html){bub.hidden=true;bub.innerHTML='';return api}bub.innerHTML=html;bub.hidden=false;bub.classList.remove('pop');void bub.offsetWidth;bub.classList.add('pop');return api},
      // Speaks `text`; the figure nods while the voice plays. Without a voice the
      // figure still nods for a moment so the bubble reads as "Milo said this".
      async say(text,{html,minMs=0,clip}={}){
        api.bubble(html??esc(text));
        const started=Date.now();
        const src=clip&&clipSrc(clip);
        if(src){
          K.stopSpeech();
          el.classList.add('talking');
          const played=await playClip(src);
          el.classList.remove('talking');
          if(played){const left=minMs-(Date.now()-started);if(left>0)await new Promise(r=>setTimeout(r,left));return}
        }
        clearTimeout(talkTimer);el.classList.add('talking');
        talkTimer=setTimeout(()=>el.classList.remove('talking'),1800);
        await K.miloSay(text,{onStart:()=>{clearTimeout(talkTimer);el.classList.add('talking')},onDone:()=>el.classList.remove('talking')}).catch(()=>{});
        el.classList.remove('talking');
        const left=minMs-(Date.now()-started);if(left>0)await new Promise(r=>setTimeout(r,left));
      },
      moveTo(x,y,{instant=false}={}){el.classList.toggle('no-motion',instant);el.style.transform=`translate(${Math.round(x)}px,${Math.round(y)}px)`;if(instant)void el.offsetWidth;el.classList.remove('no-motion');return api},
      stop(){if(video){video.pause()}K.stopSpeech();el.classList.remove('talking')},
      remove(){clearTimeout(talkTimer);hideVideo();el.remove()}
    };
    api.pose(pose);
    return api;
  };

  /* ---------------- Home tour ---------------- */

  // Milo flies across Home and explains each part in one sentence. The tour is
  // asked for explicitly (end of onboarding, "tour again" in the parent zone) and
  // never interrupts a returning player. A tap moves on, "skip" ends it.
  K.startTour=async({onDone}={})=>{
    const home=K.app.querySelector('.home');
    if(!home||home.querySelector('.milo-tour')) return;
    K.warmMilo();
    const t=K.t;
    const stops=[
      {sel:'.home-worlds',key:'tour.worlds'},
      {sel:'.home-games',key:'tour.games'},
      {sel:'.home-hud',key:'tour.hud'},
      {sel:'.native-bottom-nav',key:'tour.nav'},
      {sel:null,key:'tour.done',pose:'cheer'}
    ];
    K.miloPrefetch(stops.map(s=>t(s.key)));
    K.miloWarmClips(stops.map(s=>s.key.replace('tour.','')));
    const layer=document.createElement('div');
    layer.className='milo-tour';
    layer.innerHTML=`<div class="milo-tour-dim"></div><div class="milo-tour-spot" hidden></div><div class="milo-tour-hint"><span>${esc(t('tour.tapHint'))}</span><button class="milo-tour-skip" type="button">${esc(t('tour.skip'))}</button></div>`;
    const spot=layer.querySelector('.milo-tour-spot');
    const host=K.miloHost({pose:'wave',size:'tour',bubble:'top'});
    layer.appendChild(host.el);
    home.appendChild(layer);
    home.classList.add('touring');
    const hb=()=>home.getBoundingClientRect();
    const W=()=>hb().width,H=()=>hb().height;
    const figure={w:Math.min(150,Math.round(W()*.34)),h:0};
    host.el.style.setProperty('--milo-w',figure.w+'px');
    // A talking clip is a 5:6 window; the still poses are taller.
    figure.h=Math.round(figure.w*(K.miloHasClip('worlds')?1.34:1.55));
    // He arrives from the right edge, mid-screen.
    host.moveTo(W()+figure.w,H()*.4,{instant:true});
    let done=false,advance=null;
    const next=()=>{advance?.()};
    layer.addEventListener('click',e=>{if(e.target.closest('.milo-tour-skip'))return;next()});
    layer.querySelector('.milo-tour-skip').onclick=()=>{done=true;next()};
    const waitTap=ms=>new Promise(r=>{let to=setTimeout(()=>{advance=null;r()},ms);advance=()=>{clearTimeout(to);advance=null;r()}});
    const rectOf=sel=>{const n=sel&&home.querySelector(sel);if(!n)return null;const r=n.getBoundingClientRect(),b=hb();return {x:r.left-b.left,y:r.top-b.top,w:r.width,h:r.height}};
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
      // Milo sits above the element pointing down when there is room, otherwise
      // below it presenting upward, or beside it pointing at it.
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
