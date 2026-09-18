// Kwizillo Runner — one runner, three levels (jungle, city, sky) and a boy or a
// girl to run with. A self-contained custom element: shadow root, canvas
// renderer, engine and sound. The host mounts it with `mountJungle(container,
// options)` and gets the reward back through `onComplete`. Every visible word
// comes from `options.text` (the host's language table); the Dutch strings
// below are only the fallback for the standalone build.
import {createRun,move,jump,step,result} from './engine.js';
import {Renderer,loadAssets,assetNames,resolveName,LEVELS,HEROES,airborne} from './renderer.js';
import {GameAudio} from './audio.js';

const escapeText=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const css=new URL('./style.css',import.meta.url);
const img=name=>new URL('./img/'+name+'.png',import.meta.url).href;
const LEVEL_IDS=Object.keys(LEVELS);

export const TEXT={
  brand:'KWIZILLO RUNNER',eyebrow:'KWIZILLO • ARCADE',title:'Runner',titleA:'Kwizillo',titleB:'Runner',levelLabel:'KIES JE LEVEL',heroLabel:'WIE RENT ER MEE?',heroBoy:'Jongen',heroGirl:'Meisje',glideOn:'Vlieg!',glideOff:'Rennen!',swingOn:'Slingeren!',swingOff:'Rennen!',
  canvasLabel:'Spelveld. Pijltjes links en rechts om te sturen. Spatie om te springen.',
  pause:'Pauzeren',sound:'Geluid aan of uit',controls:'Spelbesturing',left:'Naar links',right:'Naar rechts',jump:'Salto ↑',
  loading:'Je avontuur wordt klaargezet…',loadErrorTitle:'Even opnieuw',loadError:'De junglebeelden konden niet laden. Controleer je verbinding en probeer het opnieuw.',
  intro:'Volg het gouden spoor.<br>Spring, ontdek en verzamel!',
  legendMagnet:'🧲 Magneet',legendShield:'🛡 Schild',legendGold:'★ Goud +5',legendDouble:'×2 Bonusster',
  levelJungle:'Jungle',levelStad:'Stad',levelLucht:'Lucht',
  easy:'Rustige rit · automatisch over boomstammen',music:'Muziek',on:'aan',off:'uit',start:'Op avontuur →',
  help:'{n} seconden • Veeg of gebruik de knoppen<br>10 munten op rij = +5 bonus<br>Pak power-ups en ontdek een kaart',
  countFollow:'Volg de munten!',countReady:'Klaar voor avontuur?',
  pauseEyebrow:'EVEN OP ADEM KOMEN',pauseTitle:'Jouw jungle<br>wacht op je.',pauseBody:'De tijd staat stil.',resume:'Verder spelen →',exit:'Rit verlaten zonder beloning',
  hit:'Oeps! Gewoon weer verder — je munten blijven.',cardFound:'Een junglekaart ontdekt!',
  powerDouble:'×2 {n}s',powerMagnet:'🧲 {n}s',powerSpeed:'⚡ {n}s',powerShield:'🛡 Beschermd',powerStreak:'★ {n} op rij',
  popDouble:'BONUSSTER!',popDoubleSub:'6 seconden dubbele munten',popSpeed:'TURBO!',popSpeedSub:'5 seconden supersnel · dubbele munten',popGold:'GOUD GEVONDEN!',popGoldSub:'+{n} munten',
  popCombo:'{n} OP RIJ!',popComboSub:'+5 combo-bonus',popMagnet:'MUNTMAGNEET!',popMagnetSub:'7 seconden munten aantrekken',
  popShield:'BESCHERMSCHILD!',popShieldSub:'Vangt één botsing op',popBlock:'SCHILD REDT JE!',popBlockSub:'Lekker doorrennen',
  popCard:'KAART GEVONDEN!',popCardSub:'Onthulling bij de finish',popClear:'MOOIE SPRONG!',popClearSub:'Over de boomstam',
  labelGold:'+{n} GOUD!',labelCombo:'COMBO +5',labelSpeed:'TURBO!',labelCard:'Kaart ontdekt!',labelClear:'Mooie sprong!',labelMagnet:'MAGNEET!',labelShield:'SCHILD!',labelBlock:'Gered!',labelDouble:'DUBBELE MUNTEN!',
  saving:'Je beloning wordt doorgegeven…',saved:'Je beloning is opgeslagen.',savedNoHost:'Je rit is klaar. Koppel onComplete om beloningen op te slaan.',saveError:'Opslaan lukte nog niet. Probeer het opnieuw.',
  finishEyebrow:'AVONTUUR VOLTOOID',finish:'FINISH!',finishSub:'Jouw buit uit de jungle',coinsEarned:'munten verdiend',bestStreak:'Beste reeks',bonusCoins:'Bonusmunten',
  cardAlt:'Verzamelde kaart',cardEyebrow:'KAART ONTDEKT',cardSub:'Voor je Kwizillo-verzameling',cardTitle:'Jungleblad',
  back:'Terug naar Kwizillo',retry:'Opnieuw opslaan',take:'Neem mijn buit mee',again:'Nog een avontuur'
};

export class KwizilloJungle extends HTMLElement{
 t(key,vars){let s=this.options.text?.[key]??TEXT[key]??key;if(vars)for(const k in vars)s=s.split('{'+k+'}').join(vars[k]);return s;}
 connectedCallback(){
  if(this.alive)return;this.alive=true;
  if(!this.shadowRoot)this.attachShadow({mode:'open'});
  this.options={duration:40,level:'jungle',hero:'boy',...this.options};
  this.options.duration=Math.max(30,Math.min(45,Number(this.options.duration)||40));
  this.level=LEVELS[this.options.level]?this.options.level:'jungle';this.heroKind=HEROES.includes(this.options.hero)?this.options.hero:'boy';this.cache={};
  this.phase='loading';
  this.audio=new GameAudio();
  this.audio.enabled=!this.options.muted;
  // With `onMusic` the host owns the music (one audio manager); the runner's own loop stays off.
  this.audio.musicEnabled=this.options.music!==false&&!this.options.onMusic;
  this.audio.musicVolume=Math.max(0,Math.min(1,this.options.musicVolume??.24));
  this.audio.volume=Math.max(0,Math.min(1,this.options.volume??.4));
  this.abort=new AbortController();
  this.root=this.shadowRoot;
  const T=k=>escapeText(this.t(k));
  this.root.innerHTML=`<link rel="stylesheet" href="${css}"><section class="game" aria-label="Kwizillo ${T('title')}"><canvas tabindex="0" aria-label="${T('canvasLabel')}"></canvas><header><button data-act="pause" aria-label="${T('pause')}">Ⅱ</button><div class="progress"><span>${T('brand')}</span><div><i></i></div></div><div class="score">● <b>0</b><small>0:40</small></div><button data-act="sound" aria-label="${T('sound')}" aria-pressed="${this.audio.enabled}">♫</button></header><div class="powers" aria-live="off"></div><div class="arcade-pop" role="status"></div><div class="toast" role="status"></div><nav aria-label="${T('controls')}"><button data-act="left" aria-label="${T('left')}">←</button><button class="jump" data-act="jump">${T('jump')}</button><button data-act="right" aria-label="${T('right')}">→</button></nav><div class="overlay"><div class="panel"><h1>${T('title')}</h1><p>${T('loading')}</p></div></div></section>`;
  this.canvas=this.root.querySelector('canvas');this.overlay=this.root.querySelector('.overlay');
  const listen=(target,type,fn)=>target.addEventListener(type,fn,{signal:this.abort.signal});
  listen(this.root,'click',e=>{const a=e.target.closest('[data-act]')?.dataset.act;if(a)this.action(a);});
  listen(this.canvas,'pointerdown',e=>{this.canvas.focus();this.pointer={x:e.clientX,y:e.clientY,id:e.pointerId};this.canvas.setPointerCapture(e.pointerId);});
  listen(this.canvas,'pointerup',e=>{if(!this.pointer)return;const dx=e.clientX-this.pointer.x,dy=e.clientY-this.pointer.y;this.pointer=null;if(Math.max(Math.abs(dx),Math.abs(dy))>24){if(Math.abs(dx)>Math.abs(dy))this.action(dx>0?'right':'left');else if(dy<0)this.action('jump');}});
  listen(this.canvas,'pointercancel',()=>this.pointer=null);
  listen(this.root,'keydown',e=>{if(e.repeat)return;let a={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'jump',Escape:'pause',p:'pause'}[e.key];if(e.code==='Space'&&e.target===this.canvas)a='jump';if(a){e.preventDefault();this.action(a);}});
  listen(document,'visibilitychange',()=>{if(document.hidden)this.pause();});
  listen(window,'blur',()=>this.pause());
  this.resize=new ResizeObserver(()=>this.renderer?.resize());this.resize.observe(this.canvas);
  this.loadFor().then(images=>{
   if(!this.alive)return;
   this.renderer=new Renderer(this.canvas,images,{level:this.level,hero:this.heroKind});
   this.renderer.reduced=this.options.reducedMotion??matchMedia('(prefers-reduced-motion: reduce)').matches;
   this.renderer.labelFor=e=>({coin:`+${e.value??1}`,gold:this.t('labelGold',{n:e.value??5}),combo:this.t('labelCombo'),speed:this.t('labelSpeed'),card:this.t('labelCard'),clear:this.t('labelClear'),magnet:this.t('labelMagnet'),shield:this.t('labelShield'),block:this.t('labelBlock'),double:this.t('labelDouble')})[e.type];
   this.root.querySelector('.game').classList.toggle('reduced',this.renderer.reduced);
   this.run=createRun(this.options);
   this.home();
   this.last=performance.now();
   this.frame=requestAnimationFrame(t=>this.tick(t));
  }).catch(()=>this.panel(`<h1>${T('loadErrorTitle')}</h1><p>${T('loadError')}</p>`));
 }
 // Every painting this level + hero needs (missing ones fall back, see renderer.js); loaded once per combination.
 loadFor(){return loadAssets(new URL('./img/',import.meta.url),assetNames(this.level,this.heroKind),this.cache);}
 picture(name){return img(resolveName(name,this.cache));}
 panel(html){this.overlay.hidden=false;this.overlay.classList.toggle('ready',this.phase==='ready');this.overlay.classList.toggle('countdown',this.phase==='countdown');this.overlay.innerHTML=`<div class="panel">${html}</div>`;}
 musicOn(){return this.options.onMusic?this.options.musicState?.()!==false:this.audio.musicEnabled;}
 musicLabel(){return `${escapeText(this.t('music'))}: ${escapeText(this.t(this.musicOn()?'on':'off'))} ♫`;}
 home(){
  this.phase='ready';
  const T=k=>escapeText(this.t(k));
  const chips=this.t('help',{n:this.options.duration}).split(/<br\s*\/?>/i).map(c=>c.trim()).filter(Boolean);
  this.panel(`<div class="start">
   <h1 class="arcade-title"><em>${T('titleA')}</em><em>${T('titleB')}</em></h1>
   <div class="pick-label">${T('levelLabel')}</div>
   <div class="themes levels">${LEVEL_IDS.map(id=>`<button data-act="level-${id}" aria-pressed="${this.level===id}" style="background-image:url('${new URL('./img/picker-'+id+'.jpg',import.meta.url).href}')"><span>${T('level'+id[0].toUpperCase()+id.slice(1))}</span></button>`).join('')}</div>
   <div class="pick-label">${T('heroLabel')}</div>
   <div class="heroes level-${this.level}">${HEROES.map(id=>`<button data-act="hero-${id}" class="hero-${id}" aria-pressed="${this.heroKind===id}" style="background-image:url('${new URL('./img/picker-'+this.level+'.jpg',import.meta.url).href}')"><i><img src="${this.picture(this.cache[`hero-${id}-portrait`]?`hero-${id}-portrait`:`hero-${id}-run-02`)}" alt=""></i><span>${T(id==='boy'?'heroBoy':'heroGirl')}</span>${this.heroKind===id?'<b>✓</b>':''}</button>`).join('')}</div>
   <div class="options"><label class="easy"><input type="checkbox" ${this.options.easy?'checked':''}> <span>${T('easy')}</span></label><button class="music-toggle" data-act="music">${this.musicLabel()}</button></div>
   <button class="primary go" data-act="start">${T('start')}</button>
   <div class="chips">${chips.map(c=>`<span>${escapeText(c)}</span>`).join('')}</div>
   ${this.options.onExit?`<button class="back" data-act="exit">${T('back')}</button>`:''}
  </div>`);
 }
 async action(a){
  if(a==='music'){
   if(this.options.onMusic){try{await this.options.onMusic();}catch{}}
   else{this.audio.musicEnabled=!this.audio.musicEnabled;this.audio.stopMusic();}
   const button=this.root.querySelector('[data-act=music]');if(button)button.innerHTML=this.musicLabel();return;
  }
  if(a==='sound'){this.audio.enabled=!this.audio.enabled;this.root.querySelector('[data-act=sound]').setAttribute('aria-pressed',this.audio.enabled);if(this.audio.enabled){this.audio.unlock();this.audio.play('tap');}else this.audio.stop();return;}
  if((a.startsWith('level-')||a.startsWith('hero-'))&&this.phase==='ready'){
   if(a.startsWith('level-'))this.level=a.slice(6);else this.heroKind=a.slice(5);
   this.options[a.startsWith('level-')?'onLevel':'onHero']?.(a.startsWith('level-')?this.level:this.heroKind);
   this.home();
   const token=this.loadToken=Symbol();
   this.loadFor().then(images=>{if(!this.alive||token!==this.loadToken)return;this.renderer.images=images;this.renderer.nightImages=null;this.renderer.hero=this.heroKind;this.renderer.setLevel(this.level);if(this.phase==='ready')this.home();}).catch(()=>{});
   return;}
  if(a==='start'){
   this.options.easy=this.root.querySelector('input')?.checked??this.options.easy;
   this.run=createRun(this.options);
   const L=LEVELS[this.level];const scenes=L.scenes;this.renderer.setLevel(this.level,scenes[Math.floor(Math.random()*scenes.length)]);this.renderer.hero=this.heroKind;this.wasGliding=false;
   this.card=Object.freeze({id:L.cardId,title:this.t('cardTitle'),imageUrl:this.picture(L.card),...this.options.cardReward});
   this.lastFootstep=-1;this.lastWarning=-1;this.popupUntil=0;this.finishCount=-1;
   this.renderer.particles=[];this.renderer.labels=[];
   this.root.querySelector('.arcade-pop').classList.remove('show');
   this.runId=globalThis.crypto?.randomUUID?.()??`${Date.now()}-${Math.random()}`;
   this.reward=null;this.saved=false;this.saving=false;this.audio.musicStep=0;this.audio.unlock();
   this.options.onStart?.();
   this.phase='countdown';this.count=3;
   this.panel(`<div class="count">3</div><p>${escapeText(this.t('countFollow'))}</p>`);return;
  }
  if(a==='pause'){this.pause();return;}
  if(a==='resume'){this.audio.unlock();this.phase=this.beforePause||'playing';this.overlay.hidden=true;if(this.phase==='countdown')this.panel(`<div class="count">${Math.ceil(this.count)}</div><p>${escapeText(this.t('countReady'))}</p>`);this.canvas.focus();return;}
  if(a==='exit'){this.phase='ready';this.options.onExit?.();if(this.alive)this.home();return;}
  if(a==='home'){this.home();return;}
  if(a==='retry'){this.save();return;}
  if(this.phase!=='playing')return;
  if(a==='left')move(this.run,-1);
  if(a==='right')move(this.run,1);
  if(a==='jump'&&jump(this.run))this.audio.play('jump');
 }
 pause(){
  if(!['playing','countdown'].includes(this.phase))return;
  this.beforePause=this.phase;this.phase='paused';this.audio.stop();
  const T=k=>escapeText(this.t(k));
  this.panel(`<div class="eyebrow">${T('pauseEyebrow')}</div><h1>${this.t('pauseTitle')}</h1><p>${T('pauseBody')}</p><button class="primary" data-act="resume">${T('resume')}</button><button class="music-toggle secondary" data-act="music">${this.musicLabel()}</button><button class="secondary" data-act="exit">${T('exit')}</button>`);
 }
 tick(t){
  if(!this.alive)return;
  const dt=Math.min(.05,(t-this.last)/1000);this.last=t;
  if(this.phase==='countdown'){const old=Math.ceil(this.count);this.count-=dt;if(this.count<=0){this.phase='playing';this.overlay.hidden=true;this.canvas.focus();}else if(old!==Math.ceil(this.count)){this.audio.play('tick');this.panel(`<div class="count">${Math.ceil(this.count)}</div><p>${escapeText(this.t('countReady'))}</p>`);}}
  if(this.phase==='playing'){
   for(const e of step(this.run,dt)){
    this.renderer.event(e);this.audio.play(e.type,e.streak);this.arcadeEvent(e);
    if(e.type==='hit')this.toast(this.t('hit'));
    if(e.type==='card')this.toast(this.t('cardFound'));
    if(e.type==='finish'){this.phase='finished';this.finishStarted=performance.now();this.root.querySelector('.arcade-pop').classList.remove('show');const base=result(this.run,this.runId,this.level);this.reward=Object.freeze({...base,cardId:base.cardId?this.card.id:null});this.save();}
   }
  }
  if(this.phase==='playing'){
   const footstep=Math.floor(this.run.distance*27);if(footstep!==this.lastFootstep&&!this.run.jump){this.lastFootstep=footstep;this.audio.play('step');}
   const remaining=Math.ceil(this.run.duration-this.run.time);if(remaining<=5&&remaining>0&&remaining!==this.lastWarning){this.lastWarning=remaining;this.audio.play('tick');}
   if(this.popupUntil&&this.run.time>=this.popupUntil)this.root.querySelector('.arcade-pop').classList.remove('show');
  }
  const powers=this.root.querySelector('.powers');powers.hidden=this.phase!=='playing';
  const powerText=[this.run.boost>0&&this.t('powerSpeed',{n:Math.ceil(this.run.boost)}),this.run.double>0&&this.t('powerDouble',{n:Math.ceil(this.run.double)}),this.run.magnet>0&&this.t('powerMagnet',{n:Math.ceil(this.run.magnet)}),this.run.shield&&this.t('powerShield'),this.run.streak&&this.t('powerStreak',{n:this.run.streak})].filter(Boolean).join(' · ');
  if(powers.textContent!==powerText)powers.textContent=powerText;
  this.root.querySelector('.arcade-pop').hidden=this.phase!=='playing';
  if(this.phase==='finished'){const count=this.root.querySelector('[data-count]');if(count){const p=this.renderer.reduced?1:Math.min(1,(t-this.finishStarted)/1400),n=Math.floor(this.run.coins*(1-Math.pow(1-p,3)));count.textContent='+'+n;if(n!==this.finishCount){this.finishCount=n;if(p<1&&Math.floor(t/80)!==this.lastCountTone){this.lastCountTone=Math.floor(t/80);this.audio.play('count');}}}}
  this.audio.updateMusic(this.phase==='playing');
  if(this.phase==='playing'&&LEVELS[this.level].air){const kind=airborne(this.level,this.run),g=!!kind;if(g!==this.wasGliding){this.wasGliding=g;const k=LEVELS[this.level].air.kind;if(this.run.time>1)this.toast(this.t(g?(k==='swing'?'swingOn':'glideOn'):(k==='swing'?'swingOff':'glideOff')));}}
  this.renderer.draw(this.run,dt,this.phase==='playing');
  this.root.querySelector('.score b').textContent=this.run.coins;
  this.root.querySelector('.score small').textContent=`0:${String(Math.ceil(this.run.duration-this.run.time)).padStart(2,'0')}`;
  this.root.querySelector('.progress i').style.width=`${100*this.run.time/this.run.duration}%`;
  this.root.querySelector('nav').hidden=this.phase!=='playing';
  this.root.querySelector('header').hidden=['ready','loading'].includes(this.phase);
  this.frame=requestAnimationFrame(t=>this.tick(t));
 }
 toast(message){this.root.querySelector('.toast').textContent=message;clearTimeout(this.toastTimer);this.toastTimer=setTimeout(()=>{if(this.alive)this.root.querySelector('.toast').textContent='';},2200);}
 async save(){
  if(this.saving||this.saved)return;
  this.saving=true;this.finishPanel(this.t('saving'));
  try{if(this.options.onComplete)await this.options.onComplete(this.reward);this.saved=true;if(this.alive)this.finishPanel(this.t(this.options.onComplete?'saved':'savedNoHost'));}
  catch{if(this.alive)this.finishPanel(this.t('saveError'),true);}
  finally{this.saving=false;}
 }
 arcadeEvent(e){
  if(['coin','gold','combo'].includes(e.type)&&!this.renderer.reduced)this.root.querySelector('.score').animate([{transform:'scale(1.16)'},{transform:'scale(1)'}],{duration:180});
  const key={double:'Double',gold:'Gold',combo:'Combo',magnet:'Magnet',shield:'Shield',block:'Block',card:'Card',clear:'Clear',speed:'Speed'}[e.type];
  if(!key)return;
  const vars={n:e.type==='gold'?(e.value??5):e.streak};
  const pop=this.root.querySelector('.arcade-pop');
  pop.innerHTML=`<strong>${escapeText(this.t('pop'+key,vars))}</strong><span>${escapeText(this.t('pop'+key+'Sub',vars))}</span>`;
  pop.dataset.kind=e.type;pop.classList.add('show');this.popupUntil=this.run.time+1.7;
  if(!this.renderer.reduced)pop.animate([{transform:'translateX(-50%) scale(.7)',opacity:0},{transform:'translateX(-50%) scale(1.06)',opacity:1},{transform:'translateX(-50%) scale(1)',opacity:1}],{duration:280});
 }
 finishPanel(message,error=false){
  const T=k=>escapeText(this.t(k));
  this.panel(`<div class="finish-panel"><div class="confetti" aria-hidden="true">${Array.from({length:18},(_,i)=>`<i style="--i:${i};--x:${(i*37)%100}%;--c:${['#ffd345','#70e8ff','#fb94d8','#b0ee85'][i%4]}"></i>`).join('')}</div><div class="eyebrow">${T('finishEyebrow')}</div><div class="finish-stars" aria-hidden="true">★ ★ ★</div><h1>${T('finish')}</h1><p class="finish-sub">${T('finishSub')}</p><div class="coin-win"><img src="${img('collectible-coin')}" alt=""><div class="reward"><b data-count>+${this.renderer.reduced?this.run.coins:0}</b><small>${T('coinsEarned')}</small></div></div><div class="run-stats"><span>★ ${T('bestStreak')} <b>${this.run.bestStreak}</b></span><span>✦ ${T('bonusCoins')} <b>+${this.run.bonusCoins+this.run.doubleCoins}</b></span></div>${this.run.collectedCard?`<div class="card-reveal"><img data-card-image alt="${T('cardAlt')}"><div><small>${T('cardEyebrow')}</small><strong>${escapeText(this.card.title)}</strong><span>${T('cardSub')}</span></div></div>`:''}<p class="save-status" role="status">${escapeText(message)}</p>${error?`<button class="primary" data-act="retry">${T('retry')}</button>`:this.saved?`<button class="primary" data-act="exit">${T('take')}</button><button class="secondary" data-act="home">${T('again')}</button>`:''}</div>`);
  const cardImage=this.root.querySelector('[data-card-image]');
  if(cardImage){
   const fallback=img('collectible-jungle-card');
   cardImage.onerror=()=>{cardImage.onerror=null;cardImage.src=fallback;};
   try{const url=new URL(this.card.imageUrl,import.meta.url);cardImage.src=['http:','https:','file:','capacitor:'].includes(url.protocol)?url.href:fallback;}
   catch{cardImage.src=fallback;}
  }
 }
 disconnectedCallback(){this.alive=false;cancelAnimationFrame(this.frame);clearTimeout(this.toastTimer);this.abort?.abort();this.resize?.disconnect();this.audio?.destroy();this.renderer?.destroy();}
}
if(!customElements.get('kwizillo-jungle'))customElements.define('kwizillo-jungle',KwizilloJungle);
export function mountJungle(container,options={}){const el=document.createElement('kwizillo-jungle');el.options=options;container.append(el);return {element:el,destroy:()=>el.remove(),pause:()=>el.pause()};}
