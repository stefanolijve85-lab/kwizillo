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
  // pointing down leans it over (CSS on data-pose).
  const u=p=>K.assetUrl?K.assetUrl(p):p;
  // A mouth box may carry its own `style`: Milo's talk render has an open
  // mouth, so there a dark cover with a drawn smile closes it (`cover`);
  // elsewhere his screen-mouth glows open (`glow`); Luna's opens (`jaw`).
  const poses=(dir,m)=>({
    wave:{src:u(`${dir}/wave.png`),mouth:m.wave},talk:{src:u(`${dir}/talk.png`),mouth:m.talk},
    think:{src:u(`${dir}/think.png`),mouth:m.think},cheer:{src:u(`${dir}/cheer.png`),mouth:m.cheer},
    pointRight:{src:u(`${dir}/point-right.png`),mouth:m.point},pointLeft:{src:u(`${dir}/point-right.png`),mouth:m.point,flip:true},pointDown:{src:u(`${dir}/point-right.png`),mouth:m.point},
    walkA:{src:u(`${dir}/walk-a.png`)},walkB:{src:u(`${dir}/walk-b.png`)},jumpA:{src:u(`${dir}/jump-a.png`)},jumpB:{src:u(`${dir}/jump-b.png`)}
  });
  K.GUIDE_POSES={
    milo:poses('assets/mascots/milo',{wave:{x:.6,y:.36,w:.1,h:.05},talk:{x:.527,y:.404,w:.125,h:.08,style:'cover'},think:{x:.53,y:.36,w:.1,h:.05},cheer:{x:.56,y:.36,w:.12,h:.06},point:{x:.57,y:.37,w:.1,h:.05}}),
    luna:poses('assets/mascots/luna',{wave:{x:.6,y:.215,w:.07,h:.03},talk:{x:.5,y:.215,w:.07,h:.03},think:{x:.62,y:.215,w:.06,h:.03},cheer:{x:.5,y:.215,w:.08,h:.035},point:{x:.48,y:.215,w:.07,h:.03}})
  };
  K.MILO_POSES=K.GUIDE_POSES.milo;
  // `mouth` is where the mouth sits on the portrait (fractions of its width and
  // height), for the audio-driven mouth used when a line has no clip.
  K.GUIDES={
    // Milo's mouth is a light on his screen (it glows open, no chin); Luna's is a real one (chin drops).
    milo:{voice:'Milo',name:'Milo',base:u('assets/mascots/milo/talk-base.png'),mouth:{x:.55,y:.585,w:.13,h:.06},mouthStyle:'glow'},
    luna:{voice:'Luna',name:'Luna',base:u('assets/mascots/luna/talk-base.png'),mouth:{x:.52,y:.49,w:.15,h:.05},mouthStyle:'jaw'}
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
  // A manifest entry is a path, or {src,pose} where `pose` is the cut-out the
  // clip starts from (so the figure stands in that pose before and after).
  const clipInfo=(key,guide='milo')=>{const lang=K.state.language||'nl';const v=window.KWIZILLO_GUIDE_TALKS?.[guideOf(guide)]?.[lang]?.[key];if(!v)return null;return typeof v==='string'?{src:v,pose:null}:v};
  const clipSrc=(key,guide='milo')=>clipInfo(key,guide)?.src||null;

  // Full-body clips come with the flat backdrop of the render; it is keyed out
  // live, frame by frame, onto a canvas the size of the figure. The key colour
  // is read from the corners of the first frame, the character's box from its
  // alpha (so the video lines up with the cut-out it replaces), the soft ground
  // shadow goes with the backdrop, and edge pixels are despilled so no blue
  // fringe is left. Frames are keyed on the GPU (WebGL); the first frame is
  // analysed once on the CPU.
  const KEY_VS='attribute vec2 p;attribute vec2 t;varying vec2 v;void main(){v=t;gl_Position=vec4(p,0.,1.);}';
  // Interior/exterior comes from a coarse connectivity mask (CPU, quarter size:
  // only backdrop connected to the frame border is backdrop, so the bounce
  // light on a white body never turns transparent); the colour test only
  // decides the soft edge in between, and edge pixels are despilled.
  const KEY_FS='precision mediump float;varying vec2 v;uniform sampler2D u;uniform sampler2D m;uniform vec3 key;\n'+
    'void main(){vec3 c=texture2D(u,v).rgb;float mk=texture2D(m,v).r;float d=abs(c.r-key.r)+abs(c.g-key.g)+abs(c.b-key.b);\n'+
    'float a=mk>.85?1.:(mk<.06?0.:smoothstep(.05,.16,d)*smoothstep(.06,.5,mk));\n'+
    'vec3 o=a>0.&&a<1.?clamp((c-key*(1.-a))/a,0.,1.):c;gl_FragColor=vec4(o*a,a);}';
  const keyer={
    // Coarse mask of one frame: 255 = character, 0 = backdrop / its ground shadow.
    mask(st){
      const {mw,mh,mg,key,keyLum,mdata}=st;mg.drawImage(st.video,0,0,mw,mh);const d=mg.getImageData(0,0,mw,mh).data;
      const TOL=26,seen=st.seen;seen.fill(0);const stack=[];
      const dist=i=>Math.abs(d[i*4]-key[0])+Math.abs(d[i*4+1]-key[1])+Math.abs(d[i*4+2]-key[2]);
      // A ground shadow is the backdrop colour, darker: same channel ratios as the key, lower luminance.
      const kn=Math.max(1,Math.max(key[0],key[1],key[2]));const kr=[key[0]/kn,key[1]/kn,key[2]/kn];
      const isShadow=i=>{const r=d[i*4],g=d[i*4+1],b=d[i*4+2];const mx=Math.max(1,r,g,b);const lum=r*.3+g*.59+b*.11;return lum<keyLum-3&&lum>keyLum*.35&&Math.abs(r/mx-kr[0])<.14&&Math.abs(g/mx-kr[1])<.14&&Math.abs(b/mx-kr[2])<.14};
      for(let x=0;x<mw;x++){stack.push(x,(mh-1)*mw+x)}for(let y=0;y<mh;y++){stack.push(y*mw,y*mw+mw-1)}
      while(stack.length){const i=stack.pop();if(seen[i]||dist(i)>TOL)continue;seen[i]=1;const x=i%mw,y=(i/mw)|0;if(x>0)stack.push(i-1);if(x<mw-1)stack.push(i+1);if(y>0)stack.push(i-mw);if(y<mh-1)stack.push(i+mw)}
      for(let i=0;i<mw*mh;i++)if(seen[i]){for(const k of [i-1,i+1,i-mw,i+mw])if(k>=0&&k<mw*mh&&!seen[k]&&isShadow(k))stack.push(k)}
      while(stack.length){const i=stack.pop();if(seen[i]||!isShadow(i))continue;seen[i]=1;const x=i%mw,y=(i/mw)|0;if(x>0)stack.push(i-1);if(x<mw-1)stack.push(i+1);if(y>0)stack.push(i-mw);if(y<mh-1)stack.push(i+mw)}
      for(let i=0;i<mw*mh;i++)mdata[i]=seen[i]?0:255;
      return mdata;
    },
    setup(v,canvas){
      const w=v.videoWidth,h=v.videoHeight;if(!w||!h)return null;
      const probe=document.createElement('canvas');probe.width=w;probe.height=h;const pg=probe.getContext('2d',{willReadFrequently:true});
      pg.drawImage(v,0,0);const d=pg.getImageData(0,0,w,h).data;
      const px=(x,y)=>{const k=4*(y*w+x);return [d[k],d[k+1],d[k+2]]};
      const corners=[px(3,3),px(w-4,3),px(3,h-4),px(w-4,h-4)];
      const key=[0,1,2].map(i=>corners.reduce((a,c)=>a+c[i],0)/4);
      const keyLum=key[0]*.3+key[1]*.59+key[2]*.11;
      const mw=Math.round(w/4),mh=Math.round(h/4);
      const mc=document.createElement('canvas');mc.width=mw;mc.height=mh;
      const st={video:v,key,keyLum,mw,mh,mg:mc.getContext('2d',{willReadFrequently:true}),seen:new Uint8Array(mw*mh),mdata:new Uint8Array(mw*mh),box:null,gl:null};
      // The character's box from the first frame's mask (+ margin for the gestures to come).
      const m=keyer.mask(st);let x0=mw,y0=mh,x1=0,y1=0;
      for(let i=0;i<mw*mh;i++)if(m[i]){const x=i%mw,y=(i/mw)|0;if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}
      if(x1<=x0||y1<=y0)return null;
      const mx=Math.round((x1-x0)*.08)+1,my=Math.round((y1-y0)*.03)+1;
      st.box={x:Math.max(0,x0-mx)*4,y:Math.max(0,y0-my)*4,w:(Math.min(mw-1,x1+mx)-Math.max(0,x0-mx)+1)*4,h:(Math.min(mh-1,y1+my)-Math.max(0,y0-my)+1)*4};
      const gl=canvas.getContext('webgl',{premultipliedAlpha:true,alpha:true,antialias:false});
      if(gl){
        const sh=(t,c)=>{const o=gl.createShader(t);gl.shaderSource(o,c);gl.compileShader(o);return o};
        const prog=gl.createProgram();gl.attachShader(prog,sh(gl.VERTEX_SHADER,KEY_VS));gl.attachShader(prog,sh(gl.FRAGMENT_SHADER,KEY_FS));gl.linkProgram(prog);
        if(gl.getProgramParameter(prog,gl.LINK_STATUS)){
          gl.useProgram(prog);
          const bx=st.box.x/w,by=st.box.y/h,bw=st.box.w/w,bh=st.box.h/h;
          const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);
          gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,bx,by+bh, 1,-1,bx+bw,by+bh, -1,1,bx,by, 1,1,bx+bw,by]),gl.STATIC_DRAW);
          const ap=gl.getAttribLocation(prog,'p'),at=gl.getAttribLocation(prog,'t');
          gl.enableVertexAttribArray(ap);gl.vertexAttribPointer(ap,2,gl.FLOAT,false,16,0);gl.enableVertexAttribArray(at);gl.vertexAttribPointer(at,2,gl.FLOAT,false,16,8);
          const mkTex=unit=>{const tex=gl.createTexture();gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,tex);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);return tex};
          st.texV=mkTex(0);st.texM=mkTex(1);
          gl.uniform1i(gl.getUniformLocation(prog,'u'),0);gl.uniform1i(gl.getUniformLocation(prog,'m'),1);
          gl.uniform3f(gl.getUniformLocation(prog,'key'),key[0]/255,key[1]/255,key[2]/255);
          gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.pixelStorei(gl.UNPACK_ALIGNMENT,1);
          st.gl=gl;
        }
      }
      if(!st.gl){st.src=probe;st.sg=pg}
      return st;
    },
    draw(v,st,c){
      const m=keyer.mask(st);
      if(st.gl){const gl=st.gl;gl.viewport(0,0,c.width,c.height);
        try{gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,st.texV);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,v);
          gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,st.texM);gl.texImage2D(gl.TEXTURE_2D,0,gl.LUMINANCE,st.mw,st.mh,0,gl.LUMINANCE,gl.UNSIGNED_BYTE,m)}catch(e){return}
        gl.clear(gl.COLOR_BUFFER_BIT);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);return}
      // CPU fallback (no WebGL): the coarse mask decides, scaled up.
      const {box,sg,src,mw,mh}=st;sg.drawImage(v,0,0);const id=sg.getImageData(box.x,box.y,box.w,box.h),d=id.data;
      for(let y=0;y<box.h;y++)for(let x=0;x<box.w;x++){const mi=Math.min(mh-1,(box.y+y)>>2)*mw+Math.min(mw-1,(box.x+x)>>2);d[(y*box.w+x)*4+3]=m[mi]}
      sg.putImageData(id,box.x,box.y);const g=c.getContext('2d');g.clearRect(0,0,c.width,c.height);g.drawImage(src,box.x,box.y,box.w,box.h,0,0,c.width,c.height);
    }
  };
  const clipPool=new Map();
  function clipVideo(src,guide){
    let v=clipPool.get(src);
    if(v) return v;
    v=document.createElement('video');
    v.className='milo-video';v.poster=K.GUIDES[guideOf(guide)].base;v.playsInline=true;v.setAttribute('playsinline','');v.setAttribute('webkit-playsinline','');v.preload='auto';v.disablePictureInPicture=true;v.crossOrigin='anonymous';v.src=src;v.load();
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
  // `figure:true` keeps the full-body cut-out on screen while talking (the
  // mouth animates on the character); otherwise a line without a clip switches
  // to the portrait window.
  K.guideHost=({guide='milo',pose='wave',size='md',bubble='top',figure=false}={})=>{
    guide=guideOf(guide);
    const g=K.GUIDES[guide];
    const el=document.createElement('div');
    el.className=`milo-host guide-${guide} milo-size-${size} bubble-${bubble} ${figure?'figure-mode':''}`;
    el.dataset.guide=guide;
    el.innerHTML=`<div class="milo-bubble" hidden></div><div class="milo-body"><span class="milo-fig-wrap"><img class="milo-figure" alt="" draggable="false"><span class="milo-mouth mouth-${g.mouthStyle||'jaw'}" hidden></span></span></div>`;
    const img=el.querySelector('.milo-figure'),bub=el.querySelector('.milo-bubble'),body=el.querySelector('.milo-body'),wrap=el.querySelector('.milo-fig-wrap'),figMouth=el.querySelector('.milo-mouth');
    let curPose=pose;
    // Puts the mouth overlay on the current pose (fractions of the cut-out → px of the rendered image).
    const placeMouth=()=>{
      const p=poseSrc(guide,curPose);const m=p.mouth;
      if(!figure||!m){figMouth.hidden=true;return}
      const r=img.getBoundingClientRect();const w=r.width||img.offsetWidth,h=r.height||img.offsetHeight;
      if(!w||!h){figMouth.hidden=true;return}
      figMouth.hidden=false;
      figMouth.className=`milo-mouth mouth-${m.style||g.mouthStyle||'jaw'}`;
      figMouth.style.left=Math.round(m.x*w)+'px';figMouth.style.top=Math.round(m.y*h)+'px';
      figMouth.style.setProperty('--mw',Math.max(6,Math.round(m.w*w))+'px');figMouth.style.setProperty('--mh',Math.max(3,Math.round(m.h*h))+'px');
    };
    img.addEventListener('load',placeMouth);
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
    // Plays a lip-synced clip; resolves true when it played to the end, false
    // when it could not start (then the caller falls back to pose + voice).
    // In figure mode the frames are keyed onto a canvas that takes the figure's
    // place, so the character stays cut out and the same size.
    let keyCanvas=null,keyRaf=0;
    async function playClip(src){
      const v=clipVideo(src,guide);
      v.muted=K.state.voice==='Stil';
      v.volume=Math.max(0,Math.min(1,Number(K.state.voiceVolume??1)));
      if(figure){
        if(!keyCanvas){keyCanvas=document.createElement('canvas');keyCanvas.className='milo-figure milo-keyed';wrap.insertBefore(keyCanvas,img)}
        keyCanvas.hidden=true;
        // The source video sits in the DOM (invisible) so every browser decodes it; only the keyed canvas shows.
        v.classList.add('milo-clip-src');if(v.parentNode!==wrap)wrap.appendChild(v);
      }else{v.classList.remove('milo-clip-src');showVideo(v)}
      try{v.currentTime=0}catch(e){}
      K.audio.duck(true);
      const ok=await new Promise(resolve=>{
        // On the way out the last keyed frame stays on the canvas (the figure keeps the
        // pose it ended in) until the next pose change swaps the cut-out back in.
        let settled=false,st=null;const done=r=>{if(settled)return;settled=true;v.onended=v.onerror=null;cancelAnimationFrame(keyRaf);keyRaf=0;el.classList.remove('clip-playing');if(keyCanvas&&!r){keyCanvas.hidden=true;img.classList.remove('behind-clip')}resolve(r)};
        v.onended=()=>done(true);v.onerror=()=>done(false);
        const frame=()=>{
          if(settled)return;
          if(!st){
            const r=img.getBoundingClientRect();
            if(r.width&&r.height){keyCanvas.width=Math.round(r.width*devicePixelRatio);keyCanvas.height=Math.round(r.height*devicePixelRatio)}
            st=keyer.setup(v,keyCanvas);
            if(st){keyCanvas.hidden=false;figMouth.hidden=true;img.classList.add('behind-clip');el.classList.add('clip-playing')}
          }
          if(st)keyer.draw(v,st,keyCanvas);
          keyRaf=requestAnimationFrame(frame);
        };
        if(figure){const start=()=>{if(!settled&&!keyRaf)keyRaf=requestAnimationFrame(frame)};v.addEventListener('playing',start,{once:true});v.addEventListener('timeupdate',start,{once:true})}
        const p=v.play();if(p&&p.catch)p.catch(()=>done(false));
        // A clip never holds the screen hostage: whatever happens we move on after 20 s.
        setTimeout(()=>done(true),20000);
      });
      K.audio.duck(false);
      if(!ok&&!figure)hideVideo();
      return ok;
    }
    const api={
      el,guide,
      pose(p){curPose=p;const {src,flip}=poseSrc(guide,p);if(img.getAttribute('src')!==src)img.src=src;el.classList.toggle('flip',!!flip);el.dataset.pose=p;if(keyCanvas&&!el.classList.contains('clip-playing')){keyCanvas.hidden=true;img.classList.remove('behind-clip')}placeMouth();return api},
      // Rendered width of the current pose at a given box height (the cut-outs differ in width).
      widthAt(h){const {src}=poseSrc(guide,curPose);const n=sizeOf(src);return Math.round(h*n.w/n.h)},
      placeMouth,
      bubble(html){if(!html){bub.hidden=true;bub.innerHTML='';return api}bub.innerHTML=html;noWidows(bub);bub.hidden=false;bub.classList.remove('pop');void bub.offsetWidth;bub.classList.add('pop');return api},
      // Speaks `text`; the figure nods while the voice plays. Without a voice the
      // figure still nods for a moment so the bubble reads as "the guide said this".
      async say(text,{html,minMs=0,clip}={}){
        api.bubble(html??esc(text));
        const started=Date.now();
        const info=clip&&clipInfo(clip,guide);const src=info?.src;
        if(src){
          K.stopSpeech();
          if(info.pose&&figure)api.pose(info.pose);
          el.classList.add('talking');
          const played=await playClip(src);
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
      remove(){clearTimeout(talkTimer);clearInterval(mouthRaf);mouthRaf=0;cancelAnimationFrame(keyRaf);hideVideo();el.remove()}
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
    const host=K.guideHost({guide,pose:'walkA',size:'tour',bubble:'top',figure:true});
    layer.appendChild(host.el);
    home.appendChild(layer);
    home.classList.add('touring');
    const hb=()=>home.getBoundingClientRect();
    const W=()=>hb().width,H=()=>hb().height;
    // The figure is laid out by height; its width follows the pose.
    const figH=Math.min(220,Math.round(H()*.27));
    host.el.style.setProperty('--milo-h',figH+'px');
    const figW=()=>host.widthAt(figH);
    let done=false,advance=null,frames=0;
    const next=()=>{advance?.()};
    layer.addEventListener('click',e=>{if(e.target.closest('.milo-tour-skip'))return;next()});
    layer.querySelector('.milo-tour-skip').onclick=()=>{done=true;next()};
    const sleep=ms=>new Promise(r=>setTimeout(r,ms));
    const waitTap=ms=>new Promise(r=>{let to=setTimeout(()=>{advance=null;r()},ms);advance=()=>{clearTimeout(to);advance=null;r()}});
    // A stop may spotlight several elements at once (their union).
    const rectOf=sel=>{const ns=sel?[...home.querySelectorAll(sel)]:[];if(!ns.length)return null;const b=hb();let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const n of ns){const r=n.getBoundingClientRect();x0=Math.min(x0,r.left);y0=Math.min(y0,r.top);x1=Math.max(x1,r.right);y1=Math.max(y1,r.bottom)}return {x:x0-b.left,y:y0-b.top,w:x1-x0,h:y1-y0}};
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
      if(above>96)return {x,y:above,side:'top',pose:'pointDown'};
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
        await stride('walk',760);host.el.classList.remove('walking');
      }else{
        host.el.classList.add('hopping');host.moveTo(to.x,to.y);
        await stride('jump',720);host.el.classList.remove('hopping');
      }
      host.pose(to.pose);bubbleAt(to.x,to.side);
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
        await sleep(160);
        if(done)break;
        const said=host.say(t(stop.key),{minMs:2600,clip:stop.key.replace('tour.','')});
        await Promise.race([said,waitTap(20000)]);
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
