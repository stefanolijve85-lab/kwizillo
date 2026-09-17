// Original 8-bar arcade motif, 124 BPM. Eighth-note scheduler uses audio time.
export const BEAT=60/124/2;
export const MELODY=[76,79,83,79,81,79,76,74,72,76,79,76,74,76,79,81,74,77,81,77,79,77,74,72,71,74,79,74,76,79,83,86,76,79,83,86,84,83,79,76,72,76,79,83,81,79,76,74,74,77,81,84,83,81,77,74,71,74,79,83,86,83,79,74];
export const BASS=[40,36,38,35,40,36,38,35];
export const frequency=midi=>440*2**((midi-69)/12);
