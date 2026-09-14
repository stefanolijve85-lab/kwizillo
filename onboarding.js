(()=>{
  const K=window.KWIZILLO_M1;
  if(!K) return;

  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  function shell({step,total,title,sub,body,cls=''}){
    const dots=Array.from({length:total},(_,i)=>`<i class="${i<step?'done':''} ${i===step-1?'current':''}"></i>`).join('');
    return K.frame(`<section class="onboarding ${cls} fade-in">
      <div class="onboarding-sky"></div>
      <div class="onboarding-inner">
        <div class="onboarding-brand">Kwizillo</div>
        <div class="onboarding-steps" aria-hidden="true">${dots}</div>
        <h1>${title}</h1>
        <p class="onboarding-sub">${sub}</p>
        ${body}
      </div>
    </section>`);
  }

  function stepLanguage(){
    K.stopSpeech();
    const body=`<div class="onboarding-choices lang">${K.LANGUAGES.map(l=>
      `<button class="onboarding-choice ${K.state.language===l.id?'selected':''}" data-lang="${l.id}">
        <span class="choice-icon">${l.flag}</span><b>${esc(l.label)}</b>
      </button>`).join('')}</div>`;
    const f=shell({step:1,total:3,title:esc(K.t('onboarding.language.title')),sub:esc(K.t('onboarding.language.sub')),body});
    f.querySelectorAll('[data-lang]').forEach(b=>b.onclick=()=>{
      K.sfx('tap');
      K.setLanguage(b.dataset.lang);
      K.useBank();
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
    const f=shell({step:2,total:3,title:esc(K.t('onboarding.name.title')),sub:esc(K.t('onboarding.name.sub')),body,cls:'onboarding-name'});
    const input=f.querySelector('#obName');
    const next=f.querySelector('#obNext');
    const sync=()=>{next.disabled=!input.value.trim()};
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
      stepVoice();
    };
    f.querySelector('#obBack').onclick=()=>{K.sfx('tap');stepLanguage()};
    setTimeout(()=>input.focus(),120);
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
    const f=shell({step:3,total:3,title:esc(K.t('onboarding.voice.title')),sub:esc(K.t('onboarding.voice.sub')),body});
    // Both hellos and the welcome line are warmed for both guides, so the
    // first thing a child hears comes without a pause.
    K.prefetchSpeech([K.t('voice.milo.hello'),K.t('onboarding.speech.welcome')],{voice:'Milo'});
    K.prefetchSpeech([K.t('voice.luna.hello'),K.t('onboarding.speech.welcome')],{voice:'Luna'});
    f.querySelectorAll('[data-guide]').forEach(b=>b.onclick=()=>{
      K.sfx('tap');
      K.state.voice=b.dataset.guide; K.save();
      f.querySelectorAll('[data-guide]').forEach(x=>{x.classList.toggle('selected',x===b);x.setAttribute('aria-pressed',String(x===b))});
      K.stopSpeech();
      if(K.state.voice!=='Stil') K.speak(K.t(K.state.voice==='Milo'?'voice.milo.hello':'voice.luna.hello'));
    });
    f.querySelector('#obNext').onclick=()=>{K.sfx('tap');stepWelcome()};
    f.querySelector('#obBack').onclick=()=>{K.sfx('tap');stepName()};
  }

  function stepWelcome(){
    K.stopSpeech();
    const body=`<div class="onboarding-welcome"><div class="welcome-mascot"><img class="mascot-face hero" src="${K.guideArt(K.state.voice)}" alt=""></div></div>
      <button class="onboarding-next primary" id="obStart">${esc(K.t('onboarding.welcome.cta'))}</button>`;
    const f=shell({
      step:3,total:3,
      title:esc(K.t('onboarding.welcome.title',{name:K.state.name||''})),
      sub:esc(K.t('onboarding.welcome.sub')),
      body,cls:'onboarding-final'
    });
    // The child's name is shown on screen but never sent to the speech service.
    K.speak(K.t('onboarding.speech.welcome'));
    f.querySelector('#obStart').onclick=()=>{
      K.stopSpeech(); K.sfx('reward');
      K.state.onboardingComplete=true; K.save();
      K.showHome();
    };
  }

  K.startOnboarding=stepLanguage;
  K.needsOnboarding=()=>!K.state.onboardingComplete;
})();
