(()=>{
  const K=window.KWIZILLO_M1;
  if(!K) return;

  // First run, hosted by Milo: he floats next to every question, asks it out
  // loud and reacts. Language → name → age → school group → guide → welcome,
  // then the Home tour. When the child picks Luna at the guide step she takes
  // over on the spot and hosts the welcome and the tour. The child's name and age are shown on screen and kept
  // on the device; the spoken lines are generic and never carry them.

  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const TOTAL=5;
  const AGES=[4,5,6,7,8,9,10,11,12];
  const GROUPS=[1,2,3,4,5,6,7,8];
  // Dutch primary school: groep 3 at six, one group a year.
  const groupForAge=age=>Math.max(1,Math.min(8,Number(age)-3));

  // Milo hosts until the guide step; from there the chosen guide takes over.
  const bubbleHtml=(title,sub)=>`<h1>${title}</h1>${sub?`<p class="onboarding-sub">${sub}</p>`:''}`;
  function shell({step,title,sub,body,cls='',pose='talk',speech,clip,guide=K.activeGuide()}){
    const dots=Array.from({length:TOTAL},(_,i)=>`<i class="${i<step?'done':''} ${i===step-1?'current':''}"></i>`).join('');
    const f=K.frame(`<section class="onboarding ${cls} fade-in">
      <div class="onboarding-sky"></div>
      <div class="onboarding-inner">
        <div class="onboarding-brand">Kwizillo</div>
        <div class="onboarding-steps" aria-hidden="true">${dots}</div>
        <div class="onboarding-stage"></div>
        ${body}
      </div>
    </section>`);
    K.warmGuide(guide);
    const host=K.guideHost({guide,pose,size:'ob',bubble:'side'});
    f.querySelector('.onboarding-stage').appendChild(host.el);
    host.say(speech,{html:bubbleHtml(title,sub),clip});
    return {f,host};
  }

  function stepLanguage(){
    K.stopSpeech();
    K.miloWarmClips(['language']);
    const body=`<div class="onboarding-choices lang">${K.LANGUAGES.map(l=>
      `<button class="onboarding-choice ${K.state.language===l.id?'selected':''}" data-lang="${l.id}">
        <span class="choice-icon">${l.flag}</span><b>${esc(l.label)}</b>
      </button>`).join('')}</div>`;
    const {f}=shell({step:1,title:esc(K.t('onboarding.language.title')),sub:esc(K.t('onboarding.language.sub')),body,pose:'wave',speech:K.t('onboarding.speech.language'),clip:'language',guide:'milo'});
    f.querySelectorAll('[data-lang]').forEach(b=>b.onclick=()=>{
      K.sfx('tap');
      K.setLanguage(b.dataset.lang);
      K.useBank();
      K.guidePrefetch([K.t('onboarding.speech.name'),K.t('onboarding.speech.age'),K.t('onboarding.speech.group'),K.t('onboarding.speech.voice')],'milo');
      K.guideWarmClips(['name','age','group','voice','welcome'],'milo');
      stepName();
    });
  }

  function stepName(){
    K.stopSpeech();
    const body=`<form class="onboarding-form" autocomplete="off">
      <input id="obName" type="text" inputmode="text" maxlength="18" placeholder="${esc(K.t('onboarding.name.placeholder'))}" value="${esc(K.state.name||'')}" aria-label="${esc(K.t('onboarding.name.placeholder'))}">
      <small class="onboarding-note">${esc(K.t('onboarding.name.hint'))}</small>
      <button type="submit" class="onboarding-next" id="obNext">${esc(K.t('onboarding.next'))}</button>
    </form>
    <button class="onboarding-back" id="obBack" aria-label="${esc(K.t('common.back'))}">‹ ${esc(K.t('common.back'))}</button>`;
    const {f}=shell({step:2,title:esc(K.t('onboarding.name.title')),sub:esc(K.t('onboarding.name.sub')),body,cls:'onboarding-name',pose:'think',speech:K.t('onboarding.speech.name'),clip:'name',guide:'milo'});
    const input=f.querySelector('#obName');
    const next=f.querySelector('#obNext');
    const sync=()=>{const has=!!input.value.trim();next.disabled=!has;input.classList.toggle('filled',has)};
    input.addEventListener('input',sync); sync();
    // iOS scrolls the page to keep the field above the keyboard and does not
    // always scroll back; put the viewport where it was once typing is over.
    const settle=()=>setTimeout(()=>{window.scrollTo(0,0);document.documentElement.scrollTop=0;document.body.scrollTop=0},60);
    input.addEventListener('blur',settle);
    f.querySelector('.onboarding-form').onsubmit=e=>{
      e.preventDefault();
      const name=input.value.trim();
      if(!name) return;
      K.sfx('tap');
      K.state.name=name; K.save();
      input.blur(); settle();
      stepAge();
    };
    f.querySelector('#obBack').onclick=()=>{K.sfx('tap');stepLanguage()};
    setTimeout(()=>input.focus(),120);
  }

  function stepAge(){
    K.stopSpeech();
    const body=`<div class="onboarding-chips" role="group" aria-label="${esc(K.t('onboarding.age.title'))}">${AGES.map(a=>
      `<button class="onboarding-chip ${Number(K.state.age)===a?'selected':''}" data-age="${a}" aria-pressed="${Number(K.state.age)===a}">${esc(K.t('onboarding.age.years',{n:a}))}</button>`).join('')}</div>
    <button class="onboarding-next" id="obNext" ${K.state.age?'':'disabled'}>${esc(K.t('onboarding.next'))}</button>
    <button class="onboarding-back" id="obBack" aria-label="${esc(K.t('common.back'))}">‹ ${esc(K.t('common.back'))}</button>`;
    const {f}=shell({step:3,title:esc(K.t('onboarding.age.title')),sub:esc(K.t('onboarding.age.sub')),body,pose:'think',speech:K.t('onboarding.speech.age'),clip:'age',guide:'milo'});
    const next=f.querySelector('#obNext');
    f.querySelectorAll('[data-age]').forEach(b=>b.onclick=()=>{
      K.sfx('tap');
      K.state.age=Number(b.dataset.age);
      // The group is suggested from the age; the next step lets the child correct it.
      if(!K.state.groupChosen) K.state.group=groupForAge(K.state.age);
      K.save();
      f.querySelectorAll('[data-age]').forEach(x=>{x.classList.toggle('selected',x===b);x.setAttribute('aria-pressed',String(x===b))});
      next.disabled=false;
    });
    next.onclick=()=>{K.sfx('tap');stepGroup()};
    f.querySelector('#obBack').onclick=()=>{K.sfx('tap');stepName()};
  }

  function stepGroup(){
    K.stopSpeech();
    const body=`<div class="onboarding-chips" role="group" aria-label="${esc(K.t('onboarding.group.title'))}">${GROUPS.map(g=>
      `<button class="onboarding-chip ${Number(K.state.group)===g?'selected':''}" data-group="${g}" aria-pressed="${Number(K.state.group)===g}">${esc(K.t('settings.groupValue',{n:g}))}</button>`).join('')}</div>
    <button class="onboarding-next" id="obNext">${esc(K.t('onboarding.next'))}</button>
    <button class="onboarding-back" id="obBack" aria-label="${esc(K.t('common.back'))}">‹ ${esc(K.t('common.back'))}</button>`;
    const {f}=shell({step:4,title:esc(K.t('onboarding.group.title')),sub:esc(K.t('onboarding.group.sub')),body,pose:'pointDown',speech:K.t('onboarding.speech.group'),clip:'group',guide:'milo'});
    f.querySelectorAll('[data-group]').forEach(b=>b.onclick=()=>{
      K.sfx('tap');
      K.state.group=Number(b.dataset.group); K.state.groupChosen=true; K.save();
      f.querySelectorAll('[data-group]').forEach(x=>{x.classList.toggle('selected',x===b);x.setAttribute('aria-pressed',String(x===b))});
    });
    f.querySelector('#obNext').onclick=()=>{K.sfx('tap');stepVoice()};
    f.querySelector('#obBack').onclick=()=>{K.sfx('tap');stepAge()};
  }

  function stepVoice(){
    K.stopSpeech();
    const guides=[
      {id:'Milo',icon:`<img class="mascot-face large" src="${K.MASCOT_ART.milo}" alt="">`,name:K.t('voice.milo'),desc:K.t('voice.milo.desc')},
      {id:'Luna',icon:`<img class="mascot-face large" src="${K.MASCOT_ART.luna}" alt="">`,name:K.t('voice.luna'),desc:K.t('voice.luna.desc')},
      {id:'Stil',icon:'🔇',name:K.t('voice.silent'),desc:K.t('voice.silent.desc')}
    ];
    const body=`<div class="onboarding-choices guides">${guides.map(g=>
      `<button class="onboarding-choice ${K.state.voice===g.id?'selected':''}" data-guide="${g.id}" aria-pressed="${K.state.voice===g.id}">
        <span class="choice-icon">${g.icon}</span><b>${esc(g.name)}</b><small>${esc(g.desc)}</small><span class="choice-check">${K.icon('check')}</span>
      </button>`).join('')}</div>
    <button class="onboarding-next" id="obNext">${esc(K.t('onboarding.next'))}</button>
    <button class="onboarding-back" id="obBack" aria-label="${esc(K.t('common.back'))}">‹ ${esc(K.t('common.back'))}</button>`;
    const title=esc(K.t('onboarding.voice.title'));
    let {f,host}=shell({step:5,title,sub:esc(K.t('onboarding.voice.sub')),body,pose:'talk',speech:K.t('onboarding.speech.voice'),clip:'voice'});
    // Both hellos and the welcome line are warmed for both guides, so the
    // first thing a child hears comes without a pause.
    K.guidePrefetch([K.t('voice.milo.hello'),K.t('onboarding.speech.welcome')],'milo');
    K.guidePrefetch([K.t('voice.luna.hello'),K.t('onboarding.speech.welcome')],'luna');
    K.guideWarmClips(['hello','welcome'],'luna');
    // Tapping a name brings that guide on stage: the other one slips away and
    // the new one arrives, says hello and hosts everything from here on.
    const takeOver=guide=>{
      const hello=K.t(`voice.${guide}.hello`);
      if(host.guide===guide){host.pose('wave');host.say(hello,{html:bubbleHtml(title,esc(hello)),clip:'hello'});return}
      const stage=f.querySelector('.onboarding-stage');
      const old=host;
      old.stop();old.el.classList.add('leave');setTimeout(()=>old.remove(),360);
      K.warmGuide(guide);
      host=K.guideHost({guide,pose:'wave',size:'ob',bubble:'side'});
      host.el.classList.add('enter');
      stage.appendChild(host.el);
      host.say(hello,{html:bubbleHtml(title,esc(hello)),clip:'hello'});
    };
    f.querySelectorAll('[data-guide]').forEach(b=>b.onclick=()=>{
      K.sfx('tap');
      K.state.voice=b.dataset.guide; K.save();
      f.querySelectorAll('[data-guide]').forEach(x=>{x.classList.toggle('selected',x===b);x.setAttribute('aria-pressed',String(x===b))});
      K.stopSpeech();
      if(K.state.voice==='Stil'){host.pose('talk');host.bubble(bubbleHtml(title,esc(K.t('voice.silent.desc'))));return}
      takeOver(K.activeGuide());
    });
    f.querySelector('#obNext').onclick=()=>{K.sfx('tap');stepWelcome()};
    f.querySelector('#obBack').onclick=()=>{K.sfx('tap');stepGroup()};
  }

  function stepWelcome(){
    K.stopSpeech();
    const body=`<button class="onboarding-next primary" id="obStart">${esc(K.t('onboarding.welcome.cta'))}</button>`;
    const {f}=shell({
      step:TOTAL,
      title:esc(K.t('onboarding.welcome.title',{name:K.state.name||''})),
      sub:esc(K.t('onboarding.welcome.sub')),
      body,cls:'onboarding-final',pose:'cheer',speech:K.t('onboarding.speech.welcome'),clip:'welcome'
    });
    f.querySelector('#obStart').onclick=()=>{
      K.stopSpeech(); K.sfx('reward');
      K.state.onboardingComplete=true; K.save();
      K.showHome();
      // The guide now flies across Home and points out what is what.
      setTimeout(()=>K.startTour(),380);
    };
  }

  K.startOnboarding=stepLanguage;
  K.needsOnboarding=()=>!K.state.onboardingComplete;
})();
