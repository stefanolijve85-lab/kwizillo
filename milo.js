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
  // Cut-outs from the 2026-09-15 character sheets (tools/mascot-prompts.md).
  // Each pose carries where the mouth sits on it (fractions of the image), so
  // the mouth can talk on the figure itself; the walk and jump frames are only
  // shown while the guide moves. Pointing left mirrors the pointing pose,
  // pointing down is the same pose, upright (CSS on data-pose).
  const u=p=>K.assetUrl?K.assetUrl(p):p;
  // A mouth box may carry its own `style`. Milo's renders have no mouth at
  // all: a `robot` mouth is drawn on his screen (a smile that fills into an
  // "O" with the voice, the same as in his clips); Luna's opens (`jaw`).
  // ---- Where a mouth sits on a character -------------------------------
  // One table, both guides, every pose. The numbers are fractions of the
  // rendered image (0..1 of its width and height), never pixels, so an anchor
  // holds at every size and on every screen. `style` says how the mouth is
  // drawn: Milo's renders have no mouth at all, so a `robot` mouth is drawn on
  // his screen (a smile that fills into an "O" with the voice, the same shape
  // his clips use); Luna's real mouth opens (`jaw`).
  //
  // Every pose is its own entry because the cut-outs are framed differently —
  // they do not even share an aspect ratio — so the head sits somewhere else in
  // each one. `portrait` is the talking head used when a line has no clip.
  // tools/mouth-anchors.cjs draws these on the artwork so a number can be
  // checked instead of guessed.
  K.FACE_ANCHORS={
    milo:{
      style:'robot',
      portrait:{x:.55,y:.548,w:.13,h:.055},
      poses:{
        wave:{x:.555,y:.36,w:.094,h:.025},talk:{x:.558,y:.365,w:.095,h:.025},
        think:{x:.57,y:.355,w:.09,h:.025},cheer:{x:.513,y:.353,w:.084,h:.024},
        point:{x:.46,y:.365,w:.088,h:.025},
        walkA:{x:.507,y:.374,w:.091,h:.027},walkB:{x:.547,y:.386,w:.097,h:.028},
        jumpA:{x:.585,y:.376,w:.085,h:.027},jumpB:{x:.535,y:.373,w:.085,h:.03}
      }
    },
    luna:{
      style:'jaw',
      portrait:{x:.511,y:.485,w:.15,h:.05},
      poses:{
        wave:{x:.563,y:.219,w:.082,h:.03},talk:{x:.435,y:.22,w:.082,h:.03},
        think:{x:.58,y:.21,w:.073,h:.027},cheer:{x:.507,y:.232,w:.066,h:.03},
        point:{x:.44,y:.217,w:.062,h:.028},
        walkA:{x:.654,y:.282,w:.066,h:.03},walkB:{x:.589,y:.261,w:.075,h:.03},
        jumpA:{x:.796,y:.355,w:.06,h:.028},jumpB:{x:.551,y:.226,w:.088,h:.034}
      }
    }
  };
  const anchors=g=>K.FACE_ANCHORS[g]?.poses||{};
  const poses=(dir,m)=>({
    wave:{src:u(`${dir}/wave.png`),mouth:m.wave},talk:{src:u(`${dir}/talk.png`),mouth:m.talk},
    think:{src:u(`${dir}/think.png`),mouth:m.think},cheer:{src:u(`${dir}/cheer.png`),mouth:m.cheer},
    pointRight:{src:u(`${dir}/point-right.png`),mouth:m.point},pointLeft:{src:u(`${dir}/point-right.png`),mouth:m.point,flip:true},pointDown:{src:u(`${dir}/point-right.png`),mouth:m.point},
    walkA:{src:u(`${dir}/walk-a.png`),mouth:m.walkA},walkB:{src:u(`${dir}/walk-b.png`),mouth:m.walkB},jumpA:{src:u(`${dir}/jump-a.png`),mouth:m.jumpA},jumpB:{src:u(`${dir}/jump-b.png`),mouth:m.jumpB}
  });
  K.GUIDE_POSES={
    milo:poses('assets/mascots/milo',anchors('milo')),
    luna:poses('assets/mascots/luna',anchors('luna'))
  };
  K.MILO_POSES=K.GUIDE_POSES.milo;
  K.GUIDES={
    milo:{voice:'Milo',name:'Milo',base:u('assets/mascots/milo/talk-base.png'),mouth:K.FACE_ANCHORS.milo.portrait,mouthStyle:K.FACE_ANCHORS.milo.style},
    luna:{voice:'Luna',name:'Luna',base:u('assets/mascots/luna/talk-base.png'),mouth:K.FACE_ANCHORS.luna.portrait,mouthStyle:K.FACE_ANCHORS.luna.style}
  };
  const guideOf=g=>K.GUIDES[g]?g:'milo';
  // The guide who hosts: Luna when the child chose her voice, otherwise Milo
  // (a child who chose silence still sees Milo, just without sound).
  K.activeGuide=()=>K.state.voice==='Luna'?'luna':'milo';
  K.guideName=g=>K.GUIDES[guideOf(g??K.activeGuide())].name;
  function poseSrc(guide,p){const set=K.GUIDE_POSES[guide];const v=set[p]||set.talk;return typeof v==='string'?{src:v,flip:false}:v}
  // Warm every pose of a guide once so a pose change never flashes an empty
  // frame; the natural sizes are kept for laying the figure out by height.
  const warmed=new Set(),sizes=new Map();
  const sizeOf=src=>sizes.get(src)||{w:480,h:720};
  K.warmGuide=(g='milo')=>{g=guideOf(g);if(warmed.has(g))return Promise.resolve();warmed.add(g);
    const loads=Object.values(K.GUIDE_POSES[g]).map(v=>new Promise(res=>{const src=typeof v==='string'?v:v.src;const i=new Image();i.onload=()=>{sizes.set(src,{w:i.naturalWidth,h:i.naturalHeight});res()};i.onerror=()=>res();i.src=src}));
    return Promise.all(loads);
  };
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
  // A manifest entry: {webm, mp4, pose} — the same clip as VP9+alpha (Chrome,
  // Android, Firefox) and HEVC+alpha (Safari, iOS), already keyed and cropped
  // to the character by tools/keyclip.cjs; `pose` is the cut-out the clip
  // starts from. The browser plays a genuinely transparent video: no keying,
  // no canvas, nothing that can differ between browsers.
  // Een opgenomen clip zegt wat er stond toen hij werd gemaakt. Verandert die
  // tekst daarna, dan klopt het beeld nog wel maar de stem niet meer. Zo'n clip
  // staat hieronder tot hij opnieuw is opgenomen (`node tools/guide-talks.js
  // lines`): hij speelt dan zonder geluid, zodat de gids gewoon beweegt en
  // praat, en de regel wordt er los bij uitgesproken — die is wél bij.
  // Leeg: tour.worlds is op 29 september opnieuw opgenomen voor acht werelden.
  const STALE_CLIPS=new Set([]);
  // Length of the silent settle tail tools/keyclip.cjs puts on every clip (SETTLE there).
  const SETTLE_S=.7;
  const clipInfo=(key,guide='milo')=>{const lang=K.state.language||'nl';const v=window.KWIZILLO_GUIDE_TALKS?.[guideOf(guide)]?.[lang]?.[key];if(!v)return null;return typeof v==='string'?{mp4:v,pose:null}:v};
  const probe=document.createElement('video');
  const safari=/AppleWebKit/.test(navigator.userAgent)&&!/Chrome|CriOS|Chromium|Android|Edg/.test(navigator.userAgent);
  const canWebm=!!probe.canPlayType('video/webm; codecs="vp9"'),canHevc=!!probe.canPlayType('video/mp4; codecs="hvc1"');
  // Safari decodes HEVC alpha natively; everyone else gets the VP9 WebM.
  const clipSrc=(key,guide='milo')=>{const i=clipInfo(key,guide);if(!i)return null;const p=(safari&&canHevc&&i.mp4)?i.mp4:(canWebm&&i.webm)?i.webm:(i.mp4||i.webm);return p?K.assetUrl(p):null};
  const clipPool=new Map();
  function clipVideo(src){
    let v=clipPool.get(src);
    if(v) return v;
    v=document.createElement('video');
    v.className='milo-clip';v.playsInline=true;v.setAttribute('playsinline','');v.setAttribute('webkit-playsinline','');v.preload='auto';v.disablePictureInPicture=true;v.src=src;v.load();
    clipPool.set(src,v);
    if(clipPool.size>6){const first=clipPool.keys().next().value;if(first!==src)clipPool.delete(first)}
    return v;
  }
  K.guideWarmClips=(keys,guide='milo')=>(keys||[]).forEach(k=>{const src=clipSrc(k,guide);if(src)clipVideo(src)});
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
  // `figure:true` keeps the full-body cut-out on screen while talking (the
  // mouth animates on the character); otherwise a line without a clip switches
  // to the portrait window.
  K.guideHost=({guide='milo',pose='wave',size='md',bubble='top',figure=false}={})=>{
    guide=guideOf(guide);
    const g=K.GUIDES[guide];
    const el=document.createElement('div');
    el.className=`milo-host guide-${guide} milo-size-${size} bubble-${bubble} ${figure?'figure-mode':''}`;
    el.dataset.guide=guide;
    // The character and its mouth are one object: both are children of
    // .milo-char, and every movement of the character — the talking bob, the
    // float, the pose turn, the walk — is applied to .milo-char or to an
    // ancestor of it, never to the image alone. That is what keeps the mouth on
    // the face; before this the talking animation ran on .milo-figure and the
    // mouth, its sibling, stayed behind.
    el.innerHTML=`<div class="milo-bubble" hidden></div><div class="milo-body"><span class="milo-fig-wrap"><span class="milo-char"><img class="milo-figure" alt="" draggable="false"><span class="milo-mouth mouth-${g.mouthStyle||'jaw'}" hidden></span></span></span></div>`;
    const img=el.querySelector('.milo-figure'),bub=el.querySelector('.milo-bubble'),body=el.querySelector('.milo-body'),wrap=el.querySelector('.milo-fig-wrap'),char=el.querySelector('.milo-char'),figMouth=el.querySelector('.milo-mouth');
    let curPose=pose;
    // Puts the mouth on the current pose: the anchor from K.FACE_ANCHORS is in
    // fractions of the image, so it is measured against the image's own box —
    // never against the wrapper around it. The two are not always the same:
    // in the tour the figure is laid out by height and its width follows the
    // pose, so the wrapper can be a fifth wider or narrower than the picture,
    // and a mouth placed in percent of the wrapper ends up beside the head.
    // The image's offset inside the wrapper is added, and the whole thing is
    // measured again by the ResizeObserver below whenever the layout changes.
    const placeMouth=()=>{
      const p=poseSrc(guide,curPose);const m=p.mouth;
      if(!figure||!m){figMouth.hidden=true;return}
      // layout size, not the bounding rect: a leaning (pointDown) or mirrored figure keeps its own box
      const w=img.offsetWidth||img.getBoundingClientRect().width,h=img.offsetHeight||img.getBoundingClientRect().height;
      if(!w||!h){figMouth.hidden=true;return}
      figMouth.hidden=false;
      figMouth.className=`milo-mouth mouth-${m.style||g.mouthStyle||'jaw'}`;
      figMouth.style.left=(img.offsetLeft+m.x*w).toFixed(2)+'px';figMouth.style.top=(img.offsetTop+m.y*h).toFixed(2)+'px';
      figMouth.style.setProperty('--mw',Math.max(6,Math.round(m.w*w))+'px');figMouth.style.setProperty('--mh',Math.max(3,Math.round(m.h*h))+'px');
    };
    img.addEventListener('load',placeMouth);
    // A resize, a rotation, a pose with another aspect ratio, the tour sizing
    // the figure by height: whenever the image is laid out differently the
    // mouth is measured again. Nothing else in the app moves this mouth.
    if(window.ResizeObserver){ new ResizeObserver(()=>placeMouth()).observe(img) }
    else window.addEventListener('resize',placeMouth);
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
      const target=()=>figure?figMouth:still;
      // A 30 ms timer rather than requestAnimationFrame: it keeps running when
      // the page is briefly not painting, and the envelope has the same step.
      const tick=()=>{
        const m=target();
        if(!m||!m.isConnected||!el.classList.contains('talking')){m?.style.setProperty('--open','0');clearInterval(mouthRaf);mouthRaf=0;return}
        const level=(K.voiceLevel?.()||0)*.85;
        // Quick to open, a little slower to close, so consonants still flash.
        open=level>open?open*.35+level*.65:open*.7+level*.3;
        m.style.setProperty('--open',open.toFixed(3));
      };
      if(!mouthRaf)mouthRaf=setInterval(tick,30);
    };
    // Plays a lip-synced clip in the figure's place; resolves true when it
    // played to the end, false when it could not start (then the caller falls
    // back to pose + voice). The transparent video is sized to the cut-out's
    // height so the character keeps its scale; the still and the drawn mouth
    // leave the DOM while it plays and the last frame stays until the next pose.
    let clipEl=null;
    // Swiped away while a clip plays: iOS pauses the video; play it on again
    // when the app comes back so the line finishes instead of freezing.
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&clipEl&&clipEl.isConnected&&clipEl.paused&&!clipEl.ended&&!clipEl.dataset.held){const p=clipEl.play();if(p&&p.catch)p.catch(()=>{})}});
    async function playClip(src,{silent=false}={}){
      const v=clipVideo(src);
      v.muted=silent||K.state.voice==='Stil';
      v.volume=Math.max(0,Math.min(1,Number(K.state.voiceVolume??1)));
      if(clipEl&&clipEl!==v){clipEl.pause?.();clipEl.remove()}
      clipEl=v;delete v.dataset.held;
      const h=img.getBoundingClientRect().height;
      if(h)v.style.height=Math.round(h)+'px';
      if(v.parentNode!==wrap)wrap.insertBefore(v,char);
      figMouth.remove();img.classList.add('behind-clip');el.classList.add('clip-playing');
      // Rewind only once the metadata is in: a seek before that stalls Chromium's pipeline.
      if(v.readyState>=1){try{v.currentTime=0}catch(e){}}
      K.audio.duck(true);
      const ok=await new Promise(resolve=>{
        let settled=false;const done=r=>{if(settled)return;settled=true;v.onended=v.onerror=null;resolve(r)};
        v.onended=()=>done(true);v.onerror=()=>done(false);
        // The last SETTLE_S of every clip is keyclip's silent settle tail, a
        // dissolve of two poses over each other (a ghost second arm). The voice
        // is over by then, so the clip hands over to the cut-out as it begins.
        const watch=()=>{if(settled)return;if(v.duration&&isFinite(v.duration)&&v.currentTime>=v.duration-SETTLE_S){v.pause();v.dataset.held='1';return done('held')}requestAnimationFrame(watch)};requestAnimationFrame(watch);
        const p=v.play();if(p&&p.catch)p.catch(()=>done(false));
        // A decoder that never starts (no frames within 2.5 s) counts as a failed
        // start: the still and the live voice take over instead of a frozen figure.
        setTimeout(()=>{if(!settled&&!(v.currentTime>0))done(false)},2500);
        // A clip never holds the screen hostage: whatever happens we move on after 20 s.
        setTimeout(()=>done(true),20000);
      });
      K.audio.duck(false);
      el.classList.remove('clip-playing');
      // Where the voice ends the figure stays: the clip is paused on that frame
      // (voice over, drawn mouth at rest — a smile) until the next pose or
      // screen. Swapping to the cut-out there was a jump, because the model ends
      // in another pose than the one it started in (arms down after "…wat wat
      // is"). The frame held is the one before keyclip's settle tail, so the
      // dissolve back to the first pose (a ghost second arm) is never shown.
      // A clip that ended any other way goes back to the cut-out as before.
      if(ok==='held'&&clipEl===v)return true;
      endClip();placeMouth();
      return ok;
    }
    // Back to the cut-out (after a failed clip, or on the next pose change).
    const endClip=()=>{if(clipEl){clipEl.pause?.();delete clipEl.dataset.held;clipEl.remove();clipEl=null}img.classList.remove('behind-clip');if(!figMouth.parentNode)char.appendChild(figMouth)};
    const api={
      el,guide,
      pose(p){curPose=p;const {src,flip}=poseSrc(guide,p);if(img.getAttribute('src')!==src)img.src=src;el.classList.toggle('flip',!!flip);el.dataset.pose=p;if(!el.classList.contains('clip-playing'))endClip();placeMouth();return api},
      // Rendered width of the current pose at a given box height (the cut-outs differ in width).
      widthAt(h){const {src}=poseSrc(guide,curPose);const n=sizeOf(src);return Math.round(h*n.w/n.h)},
      placeMouth,
      bubble(html){if(!html){bub.hidden=true;bub.innerHTML='';return api}bub.innerHTML=html;noWidows(bub);bub.hidden=false;bub.classList.remove('pop');void bub.offsetWidth;bub.classList.add('pop');return api},
      // Speaks `text`; the figure nods while the voice plays. Without a voice the
      // figure still nods for a moment so the bubble reads as "the guide said this".
      async say(text,{html,minMs=0,clip}={}){
        api.bubble(html??esc(text));
        const started=Date.now();
        const info=clip&&clipInfo(clip,guide);const src=clip&&clipSrc(clip,guide);
        const stale=clip&&STALE_CLIPS.has(clip);
        if(src){
          K.stopSpeech();
          if(info.pose&&figure)api.pose(info.pose);
          el.classList.add('talking');
          // Een verouderde opname speelt zonder geluid; de regel die erbij hoort
          // wordt tegelijk uitgesproken, zodat beeld en tekst kloppen.
          const played=stale
            ? (await Promise.all([playClip(src,{silent:true}),K.guideSay(text,{},guide).catch(()=>{})]))[0]
            : await playClip(src);
          el.classList.remove('talking');
          if(played){const left=minMs-(Date.now()-started);if(left>0)await new Promise(r=>setTimeout(r,left));return}
        }
        if(!figure)showStill();
        clearTimeout(talkTimer);el.classList.add('talking');
        talkTimer=setTimeout(()=>el.classList.remove('talking'),1800);
        await K.guideSay(text,{onStart:()=>{clearTimeout(talkTimer);el.classList.add('talking');mouthLoop()},onDone:()=>el.classList.remove('talking')},guide).catch(()=>{});
        el.classList.remove('talking');
        const left=minMs-(Date.now()-started);if(left>0)await new Promise(r=>setTimeout(r,left));
      },
      moveTo(x,y,{instant=false}={}){el.classList.toggle('no-motion',instant);el.style.transform=`translate(${Math.round(x)}px,${Math.round(y)}px)`;if(instant)void el.offsetWidth;el.classList.remove('no-motion');return api},
      stop(){if(video){video.pause?.()}K.stopSpeech();el.classList.remove('talking')},
      remove(){clearTimeout(talkTimer);clearInterval(mouthRaf);mouthRaf=0;endClip();hideVideo();el.remove()}
    };
    api.pose(pose);
    return api;
  };
  K.miloHost=opts=>K.guideHost({...opts,guide:'milo'});

  /* ---------------- Home tour ---------------- */

  const TOUR_KEYS=['tour.worlds','tour.games','tour.hud','tour.nav','tour.done'];
  // Warms the tour's five lines for a guide (voice and clips) well before the
  // tour starts — a guide without clips would otherwise start every stop with a
  // round trip to the speech service.
  // Only the lines: the tour plays no clips (see the stop loop below), so
  // fetching them was megabytes nobody saw. The app build leaves them out.
  K.warmTour=(guide=K.activeGuide())=>{guide=guideOf(guide);K.guidePrefetch(TOUR_KEYS.map(k=>K.t(k)),guide)};

  // The chosen guide walks onto Home, hops from element to element and explains
  // each part in one sentence, mouth moving with the voice on the figure itself.
  // The tour is asked for explicitly (end of onboarding, "tour again" in the
  // parent zone) and never interrupts a returning player. A tap moves on,
  // "skip" ends it.
  K.startTour=async({onDone,guide}={})=>{
    const home=K.app.querySelector('.home');
    if(!home||home.querySelector('.milo-tour')) return;
    guide=guideOf(guide||K.activeGuide());
    const t=K.t;
    // Memo + Rekenen share one stop; the Weetjes get a stop of their own.
    const stops=[
      {sel:'.home-worlds',key:'tour.worlds'},
      {sel:'.home-games',key:'tour.games'},
      {sel:'.home-hud',key:'tour.hud'},
      {sel:'.native-bottom-nav',key:'tour.nav'},
      {sel:null,key:'tour.done',pose:'cheer'}
    ];
    K.warmTour(guide);
    const layer=document.createElement('div');
    layer.className='milo-tour';
    layer.innerHTML=`<div class="milo-tour-dim"></div><div class="milo-tour-spot" hidden></div><div class="milo-tour-hint"><button class="milo-tour-skip" type="button">${esc(t('tour.skip'))}</button></div>`;
    const spot=layer.querySelector('.milo-tour-spot');
    const host=K.guideHost({guide,pose:'walkA',size:'tour',bubble:'top',figure:true});
    layer.appendChild(host.el);
    home.appendChild(layer);
    home.classList.add('touring');
    // Op alles groter dan een telefoon staat het frame op transform:scale(--fit),
    // dus een rect van de browser is in schermpixels terwijl alles wat we zetten
    // (left, top, --bw) in de pixels van het frame zelf is. Zonder deze omrekening
    // loopt de gids het scherm uit zodra --fit niet 1 is — op elke iPad dus.
    const hb=()=>home.getBoundingClientRect();
    const scale=()=>{const w=home.offsetWidth;const b=hb();return w?(b.width/w)||1:1};
    const W=()=>home.offsetWidth||hb().width,H=()=>home.offsetHeight||hb().height;
    // The figure is laid out by height; its width follows the pose.
    const figH=Math.min(220,Math.round(H()*.27));
    host.el.style.setProperty('--milo-h',figH+'px');
    const figW=()=>host.widthAt(figH);
    let done=false,advance=null,frames=0;
    const next=()=>{advance?.()};
    // Only Skip ends the tour. A tap anywhere else does nothing — not even to
    // what lies under it: the tour opens by pointing at the worlds, and a tap
    // that moved it on felt like tapping a world that did not open.
    layer.addEventListener('click',e=>{if(e.target.closest('.milo-tour-skip'))return;e.preventDefault();e.stopPropagation()});
    layer.querySelector('.milo-tour-skip').onclick=()=>{done=true;next()};
    const sleep=ms=>new Promise(r=>setTimeout(r,ms));
    const waitTap=ms=>new Promise(r=>{let to=setTimeout(()=>{advance=null;r()},ms);advance=()=>{clearTimeout(to);advance=null;r()}});
    // A stop may spotlight several elements at once (their union).
    const rectOf=sel=>{const ns=sel?[...home.querySelectorAll(sel)]:[];if(!ns.length)return null;const b=hb(),s=scale();let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const n of ns){const r=n.getBoundingClientRect();x0=Math.min(x0,r.left);y0=Math.min(y0,r.top);x1=Math.max(x1,r.right);y1=Math.max(y1,r.bottom)}return {x:(x0-b.left)/s,y:(y0-b.top)/s,w:(x1-x0)/s,h:(y1-y0)/s}};
    // Cycles walk or jump frames while the figure travels, then lands in `pose`.
    const stride=(kind,ms)=>{clearInterval(frames);let k=0;const seq=kind==='walk'?['walkA','walkB']:['jumpA','jumpB','jumpB'];host.pose(seq[0]);frames=setInterval(()=>{k++;host.pose(seq[k%seq.length])},kind==='walk'?150:190);return sleep(ms).then(()=>{clearInterval(frames);frames=0})};
    // The bubble hangs above or below the figure, centred on it but kept
    // inside the screen; the tail keeps pointing at the figure's middle.
    const bubbleAt=(x,side)=>{
      const w=figW();host.el.style.width=w+'px';
      host.el.classList.toggle('bubble-top',side==='top');host.el.classList.toggle('bubble-bottom',side==='bottom');
      const bw=Math.min(Math.round(W()*.8),320),centre=x+w/2;
      const bx=Math.max(8,Math.min(W()-bw-8,centre-bw/2));
      host.el.style.setProperty('--bw',bw+'px');
      host.el.style.setProperty('--bx',Math.round(bx-x)+'px');
      host.el.style.setProperty('--tx',Math.round(Math.max(14,Math.min(bw-30,centre-bx-8)))+'px');
    };
    // Where the guide stands for a stop: above the element pointing down when
    // there is room, else below it, else beside it pointing at it.
    const spotFor=r=>{
      const pad=10;
      if(!r)return {x:(W()-figW())/2,y:H()*.5-figH/2,side:'top',pose:'cheer'};
      const above=r.y-pad-figH,below=r.y+r.h+pad;
      const x=Math.max(8,Math.min(W()-figW()-8,r.x+r.w-figW()-8));
      if(above>150)return {x,y:above,side:'top',pose:'pointDown'};
      if(below+figH<H()-8)return {x,y:below,side:'bottom',pose:'talk'};
      return {x:Math.max(8,W()-figW()-8),y:Math.max(8,Math.min(H()-figH-8,r.y+r.h/2-figH/2)),side:'top',pose:'pointLeft'};
    };
    const showSpot=r=>{if(!r){spot.hidden=true;return}spot.hidden=false;spot.style.left=(r.x-6)+'px';spot.style.top=(r.y-6)+'px';spot.style.width=(r.w+12)+'px';spot.style.height=(r.h+12)+'px'};
    // Travel: walk in from the right edge the first time, hop between stops after that.
    const travel=async(to,first)=>{
      host.bubble(null);
      if(first){
        host.moveTo(W()+figW(),to.y,{instant:true});
        await sleep(30);
        host.el.classList.add('walking');host.moveTo(to.x,to.y);
        await stride('walk',560);host.el.classList.remove('walking');
      }else{
        host.el.classList.add('hopping');host.moveTo(to.x,to.y);
        await stride('jump',480);host.el.classList.remove('hopping');
      }
      host.pose(to.pose);bubbleAt(to.x,to.side);
    };
    // Standing still while talking makes a guide look like a sticker. During a
    // line it keeps pointing at the thing it is explaining, drops back to
    // talking, and now and then gives a little hop on the spot — the hop runs
    // on .milo-body, which the mouth hangs under, so it moves along with it.
    // Returns the way to stop it; the pose it started from is put back.
    const gesture=to=>{
      // Pointing at what is spotlighted: above it points down, below it throws
      // its arms up towards it, beside it points at it sideways.
      const point=to.side==='top'?'pointDown':to.side==='bottom'?'cheer':(to.pose==='pointLeft'?'pointLeft':'pointRight');
      const seq=[point,'talk',point,'talk','think','talk'];
      let i=0,hops=0,timer=null;
      const beat=()=>{
        host.pose(seq[i%seq.length]);
        // a hop every third beat, and never while the figure is mid-clip
        if(i%3===1&&!host.el.classList.contains('clip-playing')&&hops<4){
          hops++;host.el.classList.add('nudge');
          setTimeout(()=>host.el.classList.remove('nudge'),700);
        }
        i++;
      };
      beat();
      // De zin staat korter stil dan vroeger (de rondleiding moest vlotter),
      // dus moeten de standen elkaar ook sneller afwisselen — anders staat de
      // gids de hele stop te wijzen en komt hij nooit aan praten toe.
      timer=setInterval(beat,900);
      return ()=>{clearInterval(timer);host.el.classList.remove('nudge');host.pose(to.pose)};
    };

    try{
      await Promise.race([K.warmGuide(guide),sleep(1500)]);
      K.sfx('swoosh');
      let first=true;
      for(const stop of stops){
        if(done)break;
        const r=rectOf(stop.sel);showSpot(r);
        const to=spotFor(r);if(stop.pose)to.pose=stop.pose;
        await travel(to,first);first=false;
        await sleep(70);
        if(done)break;
        const stopGesture=gesture(to);
        // No lip-synced clip here on purpose: a clip replaces the figure with a
        // video of the guide standing still, and in the tour the guide is a
        // small full-body figure that should be pointing at what it explains.
        // The clips stay where they read best — onboarding, up close.
        // Kort vasthouden na de zin: de rondleiding moet vlot voelen, een kind
        // dat het al snapt tikt door en hoeft niet te wachten.
        const said=host.say(t(stop.key),{minMs:1400});
        // the bubble is written synchronously: if it pokes out of the frame, slide the figure so bubble and figure both fit
        {const b=host.el.querySelector('.milo-bubble').getBoundingClientRect(),f=hb();const over=to.side==='top'?Math.max(0,f.top+6-b.top):Math.max(0,b.bottom-(f.bottom-6));if(over>0){to.y+=to.side==='top'?over:-over;host.moveTo(to.x,to.y,{instant:true});}}
        await Promise.race([said,waitTap(12000)]);   // a line that never finishes (no network) moves on by itself
        stopGesture();
        host.stop();
      }
    }finally{
      clearInterval(frames);
      host.stop();
      spot.hidden=true;host.bubble(null);
      // Off he goes, walking out to the left.
      host.el.classList.add('walking','flip');stride('walk',760);host.moveTo(-figW()*1.4,H()*.3);
      K.state.tourDone=true;K.save();
      setTimeout(()=>{clearInterval(frames);layer.remove();home.classList.remove('touring');onDone?.()},780);
    }
  };
})();
