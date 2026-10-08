(()=>{
  // Kwizillo voor scholen, in the game (docs/SCHOLENPORTAAL.md). Only active on
  // school.kwizillo.nl (or with ?school=1 for testing; ?school=0 switches it off
  // again). Then a child logs in with the class code, taps their name and their
  // three pictures, and plays with progress that lives on the server: every
  // K.save() is sent two seconds after the last change. Without school mode this
  // file does nothing, so the app and the normal website are untouched.
  const K=window.KWIZILLO_M1;
  const PICS=window.KWIZILLO_SCHOOL_PICTURES||[];
  const MODE_KEY='kwizillo-school-mode',SESSION_KEY='kwizillo-school';
  try{const q=new URLSearchParams(location.search).get('school');if(q==='1')localStorage.setItem(MODE_KEY,'1');if(q==='0')localStorage.removeItem(MODE_KEY)}catch(e){}
  const on=/^school\./.test(location.hostname)||(()=>{try{return localStorage.getItem(MODE_KEY)==='1'}catch(e){return false}})();
  K.school={on:false};
  if(!on||!K) return;

  const t=K.t,esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const read=()=>{try{return JSON.parse(localStorage.getItem(SESSION_KEY)||'null')}catch(e){return null}};
  const write=s=>{try{s?localStorage.setItem(SESSION_KEY,JSON.stringify(s)):localStorage.removeItem(SESSION_KEY)}catch(e){}};
  let session=read();
  K.school={on:true,get session(){return session}};
  document.documentElement.dataset.school='1';
  // Everything is Premium while the school's licence runs (premium.js).
  K.schoolPremium=()=>!!session?.premium;

  const api=async(method,path,body,{keepalive=false}={})=>{
    const r=await fetch('/api/school'+path,{method,keepalive,headers:{'Content-Type':'application/json',...(session?.token?{Authorization:'Bearer '+session.token}:{})},body:body?JSON.stringify(body):undefined});
    let json=null;try{json=await r.json()}catch(e){}
    return {status:r.status,json};
  };

  /* ---------------- saving to the server ---------------- */

  const localSave=K.save;
  let timer=null,dirty=false,busy=false,loading=false;
  K.save=()=>{localSave();if(session&&!loading){dirty=true;clearTimeout(timer);timer=setTimeout(push,2000)}};
  async function push({keepalive=false}={}){
    clearTimeout(timer);timer=null;
    if(!session||!dirty||busy)return;
    busy=true;dirty=false;
    try{
      const r=await api('PUT','/pupil/state',{state:K.state,version:session.version||0},{keepalive});
      if(r.status===200){session.version=r.json.version;write(session)}
      // Newer progress on the server (the same child on another device): that one wins.
      else if(r.status===409&&r.json){session.version=r.json.version;write(session);if(r.json.state){K.state=K.migrateState(r.json.state);localSave()}}
      else if(r.status===401)expire();
      else{dirty=true;timer=setTimeout(push,15000)}
    }catch(e){dirty=true;timer=setTimeout(push,15000)}
    finally{busy=false}
  }
  K.schoolFlush=()=>push();
  addEventListener('pagehide',()=>{if(dirty)push({keepalive:true})});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&dirty)push({keepalive:true})});

  // The progress of the child that just logged in. A child that never played
  // starts fresh, already past the onboarding (the school knows who it is),
  // and gets the tour.
  async function load(){
    const r=await api('GET','/pupil/state');
    if(r.status===401){expire();return false}
    if(r.status!==200)throw new Error('offline');
    session.version=r.json.version;write(session);
    const fresh=!r.json.state;
    const next=K.migrateState(r.json.state||null);
    if(fresh){next.language=session.language||next.language;next.onboardingComplete=true;next.tourDone=false}
    next.name=session.name;
    // switch the interface language first (that saves the old state, which must not go to the server)
    loading=true;
    try{if(K.state.language!==next.language)K.setLanguage?.(next.language);K.state=next;localSave();K.useBank?.()}
    finally{loading=false}
    return {fresh};
  }
  function expire(){session=null;write(null);K.state=K.migrateState(null);localSave();showLogin()}

  async function enter(){
    try{
      const r=await load();if(!r)return;
      K.showHome();
      if(r.fresh)setTimeout(()=>K.startTour?.(),600);
    }catch(e){showLogin({error:t('school.offline')})}
  }

  // After the intro: the login, or straight on for a child who is logged in.
  // (intro.js falls back to the normal onboarding when this returns nothing)
  K.afterIntro=()=>{session?enter():showLogin();return true};

  K.schoolLogout=async()=>{
    K.stopSpeech?.();
    if(dirty)await push();
    try{await api('POST','/pupil/logout')}catch(e){}
    session=null;write(null);
    K.state=K.migrateState(null);localSave();
    showLogin();
  };

  /* ---------------- the login ---------------- */

  let draft={code:'',className:'',pupils:[],pupil:null,pictures:[]};
  function frame(inner,{step}){
    const f=K.frame(`<section class="school-login fade-in" data-step="${step}">
      <img class="school-login-bg" src="${K.MASTER?.ruimte||''}" alt="">
      <div class="school-login-card">
        <img class="school-login-logo" src="${K.BRAND_LOGO||''}" alt="Kwizillo">
        ${inner}
      </div>
    </section>`);
    f.querySelector('[data-back]')?.addEventListener('click',()=>{K.sfx?.('tap');step==='pictures'?showNames():showLogin()});
    return f;
  }
  function showLogin({error=''}={}){
    draft={code:draft.code,className:'',pupils:[],pupil:null,pictures:[]};
    const f=frame(`<h1>${esc(t('school.codeAsk'))}</h1><p>${esc(t('school.codeHint'))}</p>
      <form class="school-code" autocomplete="off"><input id="schoolCode" inputmode="text" autocapitalize="characters" spellcheck="false" maxlength="6" value="${esc(draft.code)}" aria-label="${esc(t('school.codeAsk'))}"><button type="submit" id="schoolNext">${esc(t('school.next'))}</button></form>
      <p class="school-error" role="alert">${esc(error)}</p>`,{step:'code'});
    const input=f.querySelector('#schoolCode');
    setTimeout(()=>input.focus(),50);
    input.addEventListener('input',()=>{input.value=input.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6)});
    f.querySelector('form').onsubmit=async e=>{
      e.preventDefault();const code=input.value.trim();if(code.length<6)return;
      K.sfx?.('tap');
      try{
        const r=await api('GET','/join/'+encodeURIComponent(code));
        if(r.status!==200)return showLogin({error:r.status===429?t('school.locked'):t('school.codeWrong')});
        draft={code,className:r.json.className,language:r.json.language,pupils:r.json.pupils,pupil:null,pictures:[]};
        showNames();
      }catch(err){showLogin({error:t('school.offline')})}
    };
  }
  function showNames(){
    draft.pictures=[];
    const f=frame(`<h1>${esc(t('school.whoAmI'))}</h1><p>${esc(draft.className)}</p>
      <div class="school-names">${draft.pupils.map(p=>`<button data-pupil="${p.id}"><span>${esc((p.name[0]||'?').toUpperCase())}</span><b>${esc(p.name)}</b></button>`).join('')}</div>
      <button class="school-back" data-back>${esc(t('school.back'))}</button>`,{step:'names'});
    f.querySelectorAll('[data-pupil]').forEach(b=>b.onclick=()=>{K.sfx?.('tap');draft.pupil=draft.pupils.find(p=>String(p.id)===b.dataset.pupil);showPictures()});
  }
  function showPictures({error=''}={}){
    draft.pictures=[];
    const f=frame(`<h1>${esc(draft.pupil.name)}</h1><p>${esc(t('school.pictures'))}<br><small>${esc(t('school.picturesHint'))}</small></p>
      <div class="school-dots" aria-hidden="true"><i></i><i></i><i></i></div>
      <div class="school-pictures">${PICS.map((p,i)=>`<button data-pic="${i}" aria-label="${i+1}"><img src="${p.img}" alt=""></button>`).join('')}</div>
      <p class="school-error" role="alert">${esc(error)}</p>
      <button class="school-back" data-back>${esc(t('school.back'))}</button>`,{step:'pictures'});
    const dots=[...f.querySelectorAll('.school-dots i')];
    f.querySelectorAll('[data-pic]').forEach(b=>b.onclick=async()=>{
      if(draft.pictures.length>=3)return;
      K.sfx?.('tap');draft.pictures.push(Number(b.dataset.pic));
      dots[draft.pictures.length-1].classList.add('on');b.classList.add('picked');setTimeout(()=>b.classList.remove('picked'),250);
      if(draft.pictures.length<3)return;
      try{
        const r=await api('POST','/pupil/login',{code:draft.code,pupilId:draft.pupil.id,pictures:draft.pictures});
        if(r.status===200){
          session={token:r.json.token,name:r.json.name,className:r.json.className,language:r.json.language,premium:!!r.json.premium,version:0};
          write(session);K.sfx?.('good');
          return enter();
        }
        K.sfx?.('bad');
        showPictures({error:r.status===423||r.status===429?t('school.locked'):r.status===401?t('school.picturesWrong'):t('school.offline')});
        if(r.status===401)K.app.querySelector('.school-pictures')?.classList.add('shake');
      }catch(e){showPictures({error:t('school.offline')})}
    });
  }
  K.showSchoolLogin=showLogin;

  /* ---------------- logging out (profile) ---------------- */

  // The profile shows who is logged in and the button to log out: on a shared
  // Chromebook the next child logs in after that.
  const showProfile=K.showProfile;
  if(showProfile)K.showProfile=(...a)=>{
    const r=showProfile(...a);
    const scroll=K.app.querySelector('.profile-screen .panel-scroll');
    if(scroll&&session){
      const card=document.createElement('section');
      card.className='setting-card profile-row school-out';
      card.innerHTML=`<div><b>${esc(t('school.signedIn',{name:session.name,class:session.className}))}</b><small>${esc(t('school.logoutSub'))}</small></div><button class="profile-link" id="schoolLogout">${esc(t('school.logout'))}</button>`;
      scroll.prepend(card);
      card.querySelector('#schoolLogout').onclick=()=>{K.sfx?.('tap');K.schoolLogout()};
    }
    return r;
  };
})();
