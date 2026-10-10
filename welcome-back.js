(()=>{
  const K=window.KWIZILLO_M1;
  if(!K) return;

  // Terugkeren na het afsluiten van de app.
  //
  // De eerste keer leidt de onboarding een kind langs taal, naam, leeftijd,
  // groep en gids, en daarna loopt de gids de rondleiding over Home. Dat hoort
  // bij de eerste keer — en alleen daarbij. Wie de app opnieuw opent is geen
  // nieuwe speler: die wil weten waar hij gebleven was en verder.
  //
  // Daarom komt hier tussen de openingsfilm en Home één scherm: "Hoi Jan!", wat
  // je al hebt gehaald, en twee knoppen — verder spelen, of iemand anders. Op
  // één tablet spelen vaak meer kinderen; de ander kiest zijn eigen naam uit de
  // kast (K.players, state.js) of begint als nieuwe speler met de onboarding en
  // de rondleiding. Niemands voortgang gaat daarbij verloren.

  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const t=(k,p)=>K.t(k,p);

  // Waar het kind gebleven was: de laatste wereld of het laatste spel dat het
  // opende (K.noteStop, m1-ui.js); een wereld met het niveau dat die inmiddels heeft.
  const GAME_TITLE={talen:'talen.title',math:'math.title',whoami:'whoami.title',fotozoom:'fotozoom.title',facts:'facts.title',memo:'memo.title',jungle:'jungle.title',mega:'mega.title',chest:'chest.title'};
  function lastStop(){
    const s=K.state.lastStop;
    if(s?.kind==='game'&&GAME_TITLE[s.id]){
      const art=K.GAME_ART?.[s.id==='mega'?'memoAll':s.id==='chest'?'memo':s.id]||K.MASTER.ruimte;
      return {game:s.id,title:t(GAME_TITLE[s.id]),art};
    }
    const w=K.state.lastWorld&&K.MASTER?.[K.state.lastWorld]?K.state.lastWorld:null;
    if(!w) return null;
    return {world:w,title:t(`world.${w}.title`),level:K.worldLevel?.(w)||1,art:K.MASTER[w]};
  }

  function tile(icon,value,label){
    return `<div class="wb-tile"><span class="wb-tile-icon">${icon}</span><b>${esc(value)}</b><small>${esc(label)}</small></div>`;
  }

  // Het overzicht: hoi, dit heb je, hier was je gebleven.
  K.showWelcomeBack=()=>{
    K.stopSpeech();
    K.audio?.setTrack?.('home').catch(()=>{});
    const name=String(K.state.name||'').trim();
    const stop=lastStop();
    const others=K.players.others();

    const f=K.frame(`<section class="welcome-back fade-in">
      <img class="wb-bg" src="${stop?stop.art:K.MASTER.ruimte}" alt="" decoding="async">
      <div class="wb-dim"></div>
      <div class="wb-inner">
        <img class="wb-logo" src="${K.BRAND_LOGO_SHADOW||K.BRAND_LOGO||''}" alt="Kwizillo" decoding="async">
        <h1>${esc(t('welcome.back.title',{name}))}</h1>
        <p class="wb-sub">${esc(t('welcome.back.sub'))}</p>
        <div class="wb-tiles">
          ${tile('⭐',String(K.level?.()||1),t('settings.level'))}
          ${tile('🪙',String(K.state.coins||0),t('stats.coins'))}
          ${tile('🔥',String(K.state.streak||0),t('stats.streak'))}
        </div>
        ${stop?`<div class="wb-where"><img src="${stop.art}" alt="" style="object-position:${stop.world?K.WORLD_FOCUS?.[stop.world]||'center 40%':'center'}" decoding="async"><span><small>${esc(t('welcome.back.where'))}</small><b>${esc(stop.title)}</b>${stop.game?'':`<i>${esc(t('settings.level'))} ${stop.level}</i>`}</span></div>`:''}
        <button class="wb-go primary" id="wbGo">${esc(t('welcome.back.continue'))}</button>
        <button class="wb-other" id="wbOther">${esc(t('welcome.back.other'))}${others.length?` · ${others.length}`:''}</button>
      </div>
    </section>`);

    f.querySelector('#wbGo').onclick=()=>{K.sfx('tap');K.showHome()};
    f.querySelector('#wbOther').onclick=()=>{K.sfx('tap');K.showPlayerPicker()};
    return f;
  };

  // Wie speelt er? De namen die dit toestel kent, plus "nieuwe speler".
  K.showPlayerPicker=()=>{
    K.stopSpeech();
    const others=K.players.others();
    const me=String(K.state.name||'').trim();

    const row=p=>`<button class="wb-player" data-player="${esc(p.name)}">
      <span class="wb-player-face">${esc((p.name[0]||'?').toUpperCase())}</span>
      <span><b>${esc(p.name)}</b><small>${esc(t('settings.level'))} ${Math.max(1,1+Math.floor(Number(p.state?.xp||0)/100))}</small></span>
    </button>`;

    const f=K.frame(`<section class="welcome-back fade-in">
      <img class="wb-bg" src="${K.MASTER.ruimte}" alt="" decoding="async">
      <div class="wb-dim"></div>
      <div class="wb-inner">
        <h1>${esc(t('welcome.pick.title'))}</h1>
        <div class="wb-players">
          ${me?row({name:me,state:K.state}):''}
          ${others.map(row).join('')}
        </div>
        <button class="wb-go primary" id="wbNew">${esc(t('welcome.pick.new'))}</button>
        <button class="wb-other" id="wbBack">${esc(t('welcome.pick.back'))}</button>
      </div>
    </section>`);

    f.querySelectorAll('[data-player]').forEach(b=>b.onclick=()=>{
      K.sfx('tap');
      const pick=b.dataset.player;
      // Dezelfde speler: gewoon door. Een ander: die wordt opgehaald.
      if(pick!==me) K.players.load(pick);
      K.showHome();
    });
    f.querySelector('#wbNew').onclick=()=>{
      K.sfx('tap');
      // De huidige speler gaat de kast in, de nieuwe begint bij zijn naam.
      K.players.startFresh();
      K.startOnboarding({from:'name'});
    };
    f.querySelector('#wbBack').onclick=()=>{K.sfx('tap');K.showWelcomeBack()};
    return f;
  };

  // Wie al gespeeld heeft ziet het terugkeerscherm, een nieuwe speler de
  // onboarding. intro.js roept dit aan zodra de film klaar is.
  K.afterIntro=()=>{
    if(K.needsOnboarding()) return K.startOnboarding();
    if(String(K.state.name||'').trim()) return K.showWelcomeBack();
    return K.showHome();
  };
})();
