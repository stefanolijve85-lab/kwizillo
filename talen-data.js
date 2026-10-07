(()=>{
  const K=window.KWIZILLO_M1=window.KWIZILLO_M1||{};
  // Talen: a child learns words in another language (talen-handover/HANDOVER-talen.md,
  // not in the repo). Phase 1 was Dutch and English; since 2026-10-07 every app
  // language can learn every other one. Ids are language-free: text.<lang> is the
  // word without its article. Words outside Dutch and English still want a
  // native speaker's look.
  //
  // Sound ships with the app (assets/talen/audio/<lang>/), not through the
  // speech server: a word is one recording, made with the app's own voices,
  // model and settings (tools/talen-audio.cjs). <lang>/<id>.mp3 is a word,
  // <lang>/_<line>.mp3 a line Milo says (_goed<n>: praise, _bijna<n>: almost), <lang>/<guide>/_klaar_<theme>.mp3 the
  // closing line in the chosen guide's voice.
  //
  // Pictures: 360x360, cut square from the question pictures with the animal in
  // the middle (tools/talen-img: see the handover's table of centres).
  const img=id=>`assets/talen/img/${id}.jpg`;
  K.TALEN={
    // The languages a child can learn (each is also an app language), and the
    // default for an app language: English, and for an English child Dutch.
    langs:['en','nl','de','fr','es','it','pt','da','ru','ar'],
    defaultLearn:{nl:'en',en:'nl',de:'en',fr:'en',es:'en',it:'en',pt:'en',da:'en',ru:'en',ar:'en'},
    // Lines Milo says in the child's own language (the app language); praise and
    // "almost" in several wordings (_goed1.._goed10, _bijna1.._bijna4).
    lines:['intro','betekent'],praise:10,almost:4,
    rounds:8,
    themes:[
      {id:'dieren',icon:'🐬',free:true,words:[
        {id:'dolphin',img:img('dolphin'),text:{nl:'dolfijn',en:'dolphin',de:'Delfin',fr:'dauphin',es:'delfín',it:'delfino',pt:'golfinho',da:'delfin',ru:'дельфин',ar:'دلفين'}},
        {id:'octopus',img:img('octopus'),text:{nl:'octopus',en:'octopus',de:'Krake',fr:'pieuvre',es:'pulpo',it:'polpo',pt:'polvo',da:'blæksprutte',ru:'осьминог',ar:'أخطبوط'}},
        {id:'whale',img:img('whale'),text:{nl:'walvis',en:'whale',de:'Wal',fr:'baleine',es:'ballena',it:'balena',pt:'baleia',da:'hval',ru:'кит',ar:'حوت'}},
        {id:'seal',img:img('seal'),text:{nl:'zeehond',en:'seal',de:'Robbe',fr:'phoque',es:'foca',it:'foca',pt:'foca',da:'sæl',ru:'тюлень',ar:'فقمة'}},
        {id:'parrot',img:img('parrot'),text:{nl:'papegaai',en:'parrot',de:'Papagei',fr:'perroquet',es:'loro',it:'pappagallo',pt:'papagaio',da:'papegøje',ru:'попугай',ar:'ببغاء'}},
        {id:'frog',img:img('frog'),text:{nl:'kikker',en:'frog',de:'Frosch',fr:'grenouille',es:'rana',it:'rana',pt:'rã',da:'frø',ru:'лягушка',ar:'ضفدع'}},
        {id:'snake',img:img('snake'),text:{nl:'slang',en:'snake',de:'Schlange',fr:'serpent',es:'serpiente',it:'serpente',pt:'cobra',da:'slange',ru:'змея',ar:'ثعبان'}},
        {id:'gorilla',img:img('gorilla'),text:{nl:'gorilla',en:'gorilla',de:'Gorilla',fr:'gorille',es:'gorila',it:'gorilla',pt:'gorila',da:'gorilla',ru:'горилла',ar:'غوريلا'}},
        {id:'shark',img:img('shark'),text:{nl:'haai',en:'shark',de:'Hai',fr:'requin',es:'tiburón',it:'squalo',pt:'tubarão',da:'haj',ru:'акула',ar:'قرش'}},
        {id:'chicken',img:img('chicken'),text:{nl:'kip',en:'chicken',de:'Huhn',fr:'poule',es:'gallina',it:'gallina',pt:'galinha',da:'høne',ru:'курица',ar:'دجاجة'}}
      ]},
      // Not finished yet: shown as "binnenkort" in the passport (Premium once they are).
      {id:'kleuren',icon:'🎨',words:[]},
      {id:'eten',icon:'🍎',words:[]},
      {id:'getallen',icon:'🔢',words:[]},
      {id:'lichaam',icon:'🖐️',words:[]}
    ]
  };
  K.talenAudio=(lang,name,guide)=>`assets/talen/audio/${lang}/${guide?guide.toLowerCase()+'/':''}${name}.mp3`;
})();
