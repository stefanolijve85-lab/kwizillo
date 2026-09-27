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

// Reads a JPEG's size from its frame header, so no image library is needed.
function jpegSize(file) {
  const b = fs.readFileSync(file);
  let i = 2;
  while (i < b.length) {
    if (b[i] !== 0xff) { i++; continue }
    const marker = b[i + 1];
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
    i += 2 + b.readUInt16BE(i + 2);
  }
  throw new Error(`no frame header in ${file}`);
}

for (const id of [...ids].sort()) {
  const tile = path.join(ROOT, 'assets', 'mascots', 'tile', `${id}.jpg`);
  assert.ok(fs.existsSync(tile), `${id} has a tile (run: node tools/mascot-tiles.cjs)`);
  const { w, h } = jpegSize(tile);
  assert.strictEqual(`${w}x${h}`, '512x640', `${id} tile is 512x640, not ${w}x${h}`);
}
console.log(`mascots: ${ids.size} buddies, every tile 512x640 ✔`);
