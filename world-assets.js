(()=>{
  const K=window.KWIZILLO_M1=window.KWIZILLO_M1||{};
  if(!K.MASTER) K.MASTER={};

  // Premium clean world art generated against the approved Kwizillo moodboard.
  // These assets contain NO baked-in UI, logo, labels or buttons.
  Object.assign(K.MASTER,{
    ruimte:'https://d8j0ntlcm91z4.cloudfront.net/user_2yYu0y6DQa27eWwkUPG52d9yApj/hf_20260912_143746_b59617fc-4c86-4eb9-a0fe-0e54b2100494.png',
    dieren:'https://d8j0ntlcm91z4.cloudfront.net/user_2yYu0y6DQa27eWwkUPG52d9yApj/hf_20260912_143746_ddbc8c7f-9749-4d5a-81b8-5704e5fd2591.png',
    aarde:'https://d8j0ntlcm91z4.cloudfront.net/user_2yYu0y6DQa27eWwkUPG52d9yApj/hf_20260912_143746_f40a81b0-e433-42f2-81bc-d351c726e487.png',
    geschiedenis:'https://d8j0ntlcm91z4.cloudfront.net/user_2yYu0y6DQa27eWwkUPG52d9yApj/hf_20260912_143746_d9a31c5d-be9c-4fb4-b0d7-16ffa145658e.png',
    wetenschap:'https://d8j0ntlcm91z4.cloudfront.net/user_2yYu0y6DQa27eWwkUPG52d9yApj/hf_20260912_143746_89578ba1-01cc-45ce-9dd8-e83513e33228.png',
    mysterie:'https://d8j0ntlcm91z4.cloudfront.net/user_2yYu0y6DQa27eWwkUPG52d9yApj/hf_20260912_143746_f83ec603-99e4-4d56-825d-ff422a9de04b.png'
  });

  K.MOTION ||= {};
  // Opening cinematic only. World selection itself is immediate.
  K.MOTION.home='https://d8j0ntlcm91z4.cloudfront.net/user_2yYu0y6DQa27eWwkUPG52d9yApj/hf_20260912_141211_3ebd5cfa-3bb7-41cd-9532-68bf4d7bda63.mp4';
  K.MOTION.ruimte=null;
  K.MOTION.mysterie=null;

  // Real transparent Kwizillo logo used by the intro overlay.
  K.BRAND_LOGO='https://d2ol7oe51mr4n9.cloudfront.net/user_2yYu0y6DQa27eWwkUPG52d9yApj/e20ee5ff-7b29-4957-83f8-d5ec8964eb14.png';

  K.LEGACY_WORLD_MOCKUPS=[
    'assets/world_space.png','assets/world_animals.png','assets/world_earth.png',
    'assets/world_history.png','assets/world_science.png','assets/world_mystery.png',
    'assets/world_space_clean.svg','assets/world_animals_clean.svg','assets/world_earth_clean.svg',
    'assets/world_history_clean.svg','assets/world_science_clean.svg','assets/world_mystery_clean.svg'
  ];
})();