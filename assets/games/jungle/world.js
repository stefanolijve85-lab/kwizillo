// All objects share a forward-moving camera measured in world units.
export const CAMERA={focal:720,height:2.6,horizon:310,far:28,player:4};
export const travel=s=>s.distance*(CAMERA.far-CAMERA.player);
export function project(x,depth){const scale=CAMERA.focal/Math.max(.5,depth);return {x:300+x*scale,y:CAMERA.horizon+CAMERA.height*scale,scale};}
export const itemDepth=z=>CAMERA.far-z*(CAMERA.far-CAMERA.player);
export function sceneryDepth(index,spacing,distance,offset=0){const length=spacing*24;return ((index*spacing+offset-distance)%length+length)%length+1;}
