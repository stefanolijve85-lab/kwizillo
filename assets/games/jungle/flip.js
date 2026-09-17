// Forward rotation around the body's horizontal axis, not a screen-plane cartwheel.
export function flipPose(jumpRemaining){const p=1-Math.max(0,Math.min(.92,jumpRemaining))/.92;const t=Math.max(0,Math.min(1,(p-.08)/.84));return {angle:t*t*(3-2*t)*Math.PI*2,progress:p};}
// Sprite timing: anticipation, takeoff, tuck, rotation, inverted, open, descend, land.
export function flipFrame(jumpRemaining){const p=flipPose(jumpRemaining).progress;const boundaries=[.07,.18,.32,.46,.61,.76,.91];return boundaries.findIndex(t=>p<t)===-1?7:boundaries.findIndex(t=>p<t);}
