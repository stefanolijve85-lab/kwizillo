// Every buddy shows up at the same size. The renders came in two shapes, so the
// collection used to crop one buddy to its nose and show the next one whole;
// tools/mascot-tiles.cjs redraws them all onto one canvas. This checks that a
// buddy can never reach the collection without its tile.
const assert = require('assert'); const fs = require('fs'); const path = require('path');
const ROOT = path.join(__dirname, '..');

const src = fs.readFileSync(path.join(ROOT, 'world-assets.js'), 'utf8');
const ids = new Set();
for (const m of src.matchAll(/(\w+):K?\.?(?:assetUrl\()?'assets\/mascots\/(\w+)\.jpg'/g)) ids.add(m[2]);
for (const m of src.matchAll(/for\(const id of \[([^\]]+)\] ?K?\.?MASCOT_ART/g)) for (const q of m[1].split(',')) ids.add(q.trim().replace(/'/g, ''));
// The second wave is listed in a loop; pick those ids up too.
const loop = src.match(/for\(const id of \[([^\]]+)\]\) ?K\.MASCOT_ART\[id\]/);
if (loop) for (const q of loop[1].split(',')) ids.add(q.trim().replace(/'/g, ''));
assert.ok(ids.size >= 12, `found ${ids.size} buddies in world-assets.js`);

// Reads a PNG's header, so no image library is needed: size, and whether it
// carries an alpha channel at all (colour type 6 is RGBA).
function pngInfo(file) {
  const b = fs.readFileSync(file);
  if (b.readUInt32BE(0) !== 0x89504e47) throw new Error(`${file} is not a PNG`);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20), colourType: b[25] };
}

for (const id of [...ids].sort()) {
  const tile = path.join(ROOT, 'assets', 'mascots', 'tile', `${id}.png`);
  assert.ok(fs.existsSync(tile), `${id} has a tile (run: node tools/mascot-tiles.cjs)`);
  const { w, h, colourType } = pngInfo(tile);
  assert.strictEqual(`${w}x${h}`, '640x512', `${id} tile is 640x512, not ${w}x${h}`);
  // A cut-out, not a boxed picture: the tile must be able to be see-through.
  assert.strictEqual(colourType, 6, `${id} tile has no alpha channel`);
}
assert.ok(!fs.readdirSync(path.join(ROOT, 'assets', 'mascots', 'tile')).some(f => /\.jpg$/.test(f)), 'no boxed JPEG tiles are left behind');
console.log(`mascots: ${ids.size} buddies, every tile a 640x512 cut-out ✔`);
