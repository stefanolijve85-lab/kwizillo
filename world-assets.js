(()=>{
  const K=window.KWIZILLO_M1=window.KWIZILLO_M1||{};
  if(!K.MASTER) K.MASTER={};
  Object.assign(K.MASTER,{
    ruimte:'https://d8j0ntlcm91z4.cloudfront.net/user_2yYu0y6DQa27eWwkUPG52d9yApj/hf_20260912_134948_1ad6f07a-e7d6-40f4-a7a6-4bed94129dee.png',
    dieren:'https://d8j0ntlcm91z4.cloudfront.net/user_2yYu0y6DQa27eWwkUPG52d9yApj/hf_20260912_134947_3968b9aa-de85-49a9-a3ab-bdf45a4483cd.png',
    aarde:'https://d8j0ntlcm91z4.cloudfront.net/user_2yYu0y6DQa27eWwkUPG52d9yApj/hf_20260912_134948_fd27a8a5-94a9-4c39-b88e-c76f70365444.png',
    geschiedenis:'https://d8j0ntlcm91z4.cloudfront.net/user_2yYu0y6DQa27eWwkUPG52d9yApj/hf_20260912_134948_47891594-73ca-43cc-aa0e-57ba597a099d.png',
    wetenschap:'https://d8j0ntlcm91z4.cloudfront.net/user_2yYu0y6DQa27eWwkUPG52d9yApj/hf_20260912_134948_a609ced9-8d43-4578-aace-fb9529f429c7.png',
    mysterie:'https://d8j0ntlcm91z4.cloudfront.net/user_2yYu0y6DQa27eWwkUPG52d9yApj/hf_20260912_134947_11131658-7742-4100-8519-56d5d57f54e7.png'
  });

  K.MOTION ||= {};
  // Definitive 12-second whole-game cinematic. It is shown only as the app intro.
  K.MOTION.home='https://d8j0ntlcm91z4.cloudfront.net/user_2yYu0y6DQa27eWwkUPG52d9yApj/hf_20260912_141211_3ebd5cfa-3bb7-41cd-9532-68bf4d7bda63.mp4';
  // World selection must be immediate: no unrelated transition movie between home and a world.
  K.MOTION.ruimte=null;
  K.MOTION.mysterie=null;

  K.LEGACY_WORLD_MOCKUPS=[
    'assets/world_space.png','assets/world_animals.png','assets/world_earth.png',
    'assets/world_history.png','assets/world_science.png','assets/world_mystery.png',
    'assets/world_space_clean.svg','assets/world_animals_clean.svg','assets/world_earth_clean.svg',
    'assets/world_history_clean.svg','assets/world_science_clean.svg','assets/world_mystery_clean.svg'
  ];
})();