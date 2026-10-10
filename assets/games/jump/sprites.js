// Written by tools/jump-sprites.cjs — do not edit by hand.
// Per child: the atlas, the size of one cell, the foot anchor inside a cell
// (every pose stands on it), and the cells that play each animation state.
// Temporary frames:
//   mike.slide: Mike has no slide pose on his sheet: his "leaning back, legs forward" air pose (row 5, column 2) is turned 42° backwards as a stand-in. Replace with a real slide frame when it is drawn.
export const SPRITES = {
  mike: {"src":"mike.webp","cell":[170,222],"anchor":[84,219],"cols":6,"height":200,"states":{"idle":[0,1],"run":[2,3,4,5],"jump":[6,7],"doubleJump":[8,9],"fall":[10,11],"land":[12],"slide":[13],"hurt":[14],"celebrate":[15,16,17,18]},"boxes":[[-51,-200,54],[-53,-199,48],[-74,-185,70],[-65,-186,64],[-74,-183,68],[-66,-182,67],[-60,-177,82],[-65,-183,79],[-73,-165,67],[-52,-177,69],[-67,-177,71],[-64,-166,68],[-67,-174,70],[-81,-144,81],[-66,-190,61],[-61,-211,59],[-72,-210,69],[-58,-193,76],[-62,-215,60]],"temporary":["slide"]},
  mia: {"src":"mia.webp","cell":[203,207],"anchor":[102,204],"cols":6,"height":200,"states":{"idle":[0,1],"run":[2,3,4,5],"jump":[6,7],"doubleJump":[8,9],"fall":[10,11],"land":[12],"slide":[13],"hurt":[14],"celebrate":[15,16,17,18]},"boxes":[[-56,-200,52],[-57,-201,52],[-72,-200,69],[-75,-184,76],[-83,-199,74],[-70,-185,66],[-64,-184,83],[-64,-183,86],[-64,-200,93],[-67,-183,81],[-77,-177,88],[-68,-173,76],[-54,-184,71],[-98,-118,98],[-84,-188,78],[-77,-201,75],[-74,-194,77],[-71,-192,80],[-69,-198,73]],"temporary":[]}
};
