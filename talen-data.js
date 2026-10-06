(()=>{
  const K=window.KWIZILLO_M1=window.KWIZILLO_M1||{};
  // Talen, phase 1: a Dutch child learns English words and an English child
  // Dutch ones (talen-handover/HANDOVER-talen.md, not in the repo). Ids are
  // language-free, so phase 2 only adds languages: text.<lang> is the word
  // without its article.
  //
  // Sound ships with the app (assets/talen/audio/<lang>/), not through the
  // speech server: a word is one recording, made with the app's own voices,
  // model and settings (tools/talen-audio.cjs). <lang>/<id>.mp3 is a word,
  // <lang>/_<line>.mp3 a line Milo says, <lang>/<guide>/_klaar_<theme>.mp3 the
  // closing line in the chosen guide's voice.
  //
  // Pictures: 360x360, cut square from the question pictures with the animal in
  // the middle (tools/talen-img: see the handover's table of centres).
  const img=id=>`assets/talen/img/${id}.jpg`;
  K.TALEN={
    // The languages a child can learn, and which one is the default for an app language.
    langs:['en','nl'],
    defaultLearn:{nl:'en',en:'nl'},
    // Lines Milo says in the child's own language (the app language).
    lines:['intro','goedzo','super','bijna','betekent'],
    rounds:8,
    themes:[
      {id:'dieren',icon:'🐬',free:true,words:[
        {id:'dolphin',img:img('dolphin'),text:{nl:'dolfijn',en:'dolphin'}},
        {id:'octopus',img:img('octopus'),text:{nl:'octopus',en:'octopus'}},
        {id:'whale',img:img('whale'),text:{nl:'walvis',en:'whale'}},
        {id:'seal',img:img('seal'),text:{nl:'zeehond',en:'seal'}},
        {id:'parrot',img:img('parrot'),text:{nl:'papegaai',en:'parrot'}},
        {id:'frog',img:img('frog'),text:{nl:'kikker',en:'frog'}},
        {id:'snake',img:img('snake'),text:{nl:'slang',en:'snake'}},
        {id:'gorilla',img:img('gorilla'),text:{nl:'gorilla',en:'gorilla'}},
        {id:'shark',img:img('shark'),text:{nl:'haai',en:'shark'}},
        {id:'chicken',img:img('chicken'),text:{nl:'kip',en:'chicken'}}
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
