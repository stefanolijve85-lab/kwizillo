// Written by tools/jump-sprites.cjs — do not edit by hand.
// Per child: the atlas, the size of one cell, the foot anchor inside a cell
// (every pose stands on it), and the cells that play each animation state.
// Temporary frames:
//   mike.slide: Mike has no slide pose on his sheet: his "leaning back, legs forward" air pose (row 5, column 2) is turned 42° backwards as a stand-in. Replace with a real slide frame when it is drawn.
//   mike.eyes: Mike's run cycle (mike-run8-v2.png) is drawn with his blue-green eyes; the stand pose is recoloured to blue-green in this tool; the jump, double jump, fall, land, slide, hurt and celebrate poses from mike-anim.png still have the brown eyes as drawn (too small to recolour cleanly) until those poses are redrawn.
export const SPRITES = {
  mike: {"src":"mike.webp","cell":[169,222],"anchor":[84,219],"cols":6,"height":200,"states":{"idle":[0],"run":[1,2,3,4,5,6,7,8],"jump":[9,10],"doubleJump":[11,12],"fall":[13,14],"land":[15],"slide":[16],"hurt":[17],"celebrate":[18,19,20,21]},"boxes":[[-42,-200,53],[-67,-188,70],[-56,-190,56],[-63,-190,57],[-62,-177,71],[-67,-186,71],[-58,-184,60],[-61,-184,55],[-63,-174,70],[-60,-176,82],[-65,-183,79],[-73,-165,68],[-52,-177,69],[-67,-177,70],[-63,-166,68],[-68,-175,70],[-81,-145,81],[-66,-190,61],[-62,-211,60],[-72,-211,69],[-57,-193,75],[-63,-215,60]],"temporary":["slide","eyes"]},
  mia: {"src":"mia.webp","cell":[203,208],"anchor":[102,205],"cols":6,"height":200,"states":{"idle":[0],"run":[1,2,3,4,5,6,7,8],"jump":[9,10],"doubleJump":[11,12],"fall":[13,14],"land":[15],"slide":[16],"hurt":[17],"celebrate":[18,19,20,21]},"boxes":[[-46,-200,51],[-74,-199,75],[-58,-190,63],[-75,-194,62],[-74,-184,72],[-74,-197,76],[-59,-190,64],[-76,-193,60],[-66,-180,81],[-64,-182,83],[-64,-183,87],[-64,-198,93],[-67,-184,81],[-78,-176,88],[-68,-174,76],[-54,-185,71],[-98,-116,99],[-84,-189,78],[-77,-202,74],[-75,-194,77],[-72,-192,80],[-69,-198,73]],"temporary":[]}
};
