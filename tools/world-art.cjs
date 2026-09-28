#!/usr/bin/env node
// Een aangeleverde wereldplaat klaarmaken voor het spel.
//
//   node tools/world-art.cjs art-source/worlds/kunst.png kunst
//   node tools/world-art.cjs <bron> <wereld> [--y 46]      (hoogte van het midden, in procenten)
//
// Het spel gebruikt één staande plaat per wereld (assets/worlds/<wereld>.jpg,
// 752 × 1344): als tegel op Home (daar wordt een band uit het midden gebruikt),
// als achtergrond van het wereldscherm, en onscherp achter het frame op een
// groot scherm. Een aangeleverde render is meestal niet staand — vaak 4:3.
//
// Hard bijsnijden zou het eiland aan de zijkanten afkappen, en een onscherpe
// vlek erboven ziet er dood uit. Daarom wordt de plaat hier over de volle
// breedte in het midden gezet en wordt de lucht erboven en eronder
// doorgetrokken met een gespiegelde kopie van de plaat zelf: dezelfde wolken,
// dezelfde kleuren, en bij de naad loopt het beeld gewoon door.
//
// Draait op de Chromium die Playwright meebrengt: geen beeldbibliotheek nodig.
const fs = require('fs'); const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const W = 752, H = 1344, QUALITY = 88;
const argv = process.argv.slice(2);
const [src, world] = argv.filter(a => !a.startsWith('--') && !/^\d+$/.test(a));
const yArg = (() => { const i = argv.indexOf('--y'); return i >= 0 ? Number(argv[i + 1]) : 46 })();

if (!src || !world) {
  console.error('Gebruik: node tools/world-art.cjs <bronbestand> <wereld> [--y 46]');
  process.exit(1);
}
const srcAbs = path.isAbsolute(src) ? src : path.join(ROOT, src);
if (!fs.existsSync(srcAbs)) { console.error('Bron bestaat niet: ' + src); process.exit(1) }
const out = path.join(ROOT, 'assets', 'worlds', world + '.jpg');

// De maat van de bron, zonder beeldbibliotheek: PNG heeft hem in de IHDR,
// JPEG in de SOF-marker.
function size(file) {
  const b = fs.readFileSync(file);
  if (b[0] === 0x89 && b.toString('ascii', 1, 4) === 'PNG') return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
  if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i < b.length) {
      if (b[i] !== 0xff) { i++; continue }
      const m = b[i + 1];
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
      i += 2 + b.readUInt16BE(i + 2);
    }
  }
  return null;
}

const s = size(srcAbs);
if (!s) { console.error('Kan de maat van de bron niet lezen (PNG of JPEG verwacht).'); process.exit(1) }

// Twee manieren, en de bron bepaalt welke. Scheelt de verhouding weinig — een
// staande render van 3:4 tegen de 9:16 van het spel — dan wordt de plaat
// formaatvullend geschaald en valt er links en rechts een randje af: geen naad,
// alles scherp. Is de bron veel breder (een liggende render), dan zou dat het
// eiland doormidden snijden; dan komt de plaat heel in beeld en wordt de lucht
// erboven en eronder doorgetrokken met een gespiegelde, onscherpe kopie.
const coverScale = Math.max(W / s.w, H / s.h);
const sideCrop = (s.w * coverScale - W) / (s.w * coverScale);   // deel dat links+rechts wegvalt
// --mirror dwingt de gespiegelde variant af, ook als bijsnijden zou kunnen.
const MODE = argv.includes('--mirror') ? 'mirror' : (sideCrop <= 0.3 ? 'cover' : 'mirror');
const artH = Math.round(W * s.h / s.w);                       // de plaat op volle breedte
const top = Math.max(0, Math.round((H - artH) * (yArg / 100)));// ruimte erboven
const bottom = Math.max(0, H - artH - top);

const page = file => MODE === 'cover' ? `<!doctype html><meta charset="utf-8"><style>
  html,body{margin:0;background:#0a2049}
  .canvas{position:relative;width:${W}px;height:${H}px;overflow:hidden}
  .art{position:absolute;inset:0;background:url("${file}") center ${yArg}%/cover no-repeat}
  /* Net als bij de andere wereldplaten: boven en onder iets donkerder, zodat de
     titel en de knoppen erover leesbaar blijven. */
  .veil{position:absolute;inset:0;background:linear-gradient(180deg,rgba(9,30,72,.30),rgba(9,30,72,0) 26%,rgba(9,30,72,0) 74%,rgba(9,30,72,.34))}
</style><div class="canvas"><div class="art"></div><div class="veil"></div></div>`
: `<!doctype html><meta charset="utf-8"><style>
  html,body{margin:0;background:#0a2049}
  .canvas{position:relative;width:${W}px;height:${H}px;overflow:hidden}
  .band{position:absolute;left:0;width:${W}px;overflow:hidden}
  .band img{position:absolute;left:0;width:${W}px;height:${artH}px;transform:scaleY(-1);filter:blur(9px) saturate(1.04)}
  .up{top:0;height:${top}px}      .up img{bottom:0}
  .down{bottom:0;height:${bottom}px} .down img{top:0}
  .art{position:absolute;left:0;top:${top}px;width:${W}px;height:${artH}px;display:block}
  .veil{position:absolute;inset:0;background:
    linear-gradient(180deg,rgba(9,30,72,.34),rgba(9,30,72,0) ${Math.round(top / H * 100) + 5}%,
                    rgba(9,30,72,0) ${Math.round((top + artH) / H * 100) - 5}%,rgba(9,30,72,.38))}
</style><div class="canvas">
  <div class="band up"><img src="${file}"></div>
  <div class="band down"><img src="${file}"></div>
  <img class="art" src="${file}">
  <div class="veil"></div>
</div>`;

(async () => {
  const browser = await chromium.launch();
  const p = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  // De pagina wordt naast de bron weggeschreven en van schijf geladen: een
  // setContent-pagina mag geen file:// plaatje inladen.
  const tmp = path.join(path.dirname(srcAbs), '_world-art.html');
  fs.writeFileSync(tmp, page(encodeURIComponent(path.basename(srcAbs))));
  await p.goto('file://' + tmp, { waitUntil: 'load' });
  await p.waitForTimeout(400);
  await p.locator('.canvas').screenshot({ path: out, type: 'jpeg', quality: QUALITY });
  await browser.close();
  fs.unlinkSync(tmp);
  const kb = Math.round(fs.statSync(out).size / 1024);
  console.log(`${out.replace(ROOT + '/', '')}: ${W}×${H}, ${kb} kB — bron ${s.w}×${s.h}, ${MODE === 'cover' ? `formaatvullend (${Math.round(sideCrop * 100)}% van de breedte valt weg)` : `heel in beeld op ${top}..${top + artH}, lucht gespiegeld`}`);
  console.log('Daarna: node tools/art-adopt.cjs assets/worlds/' + world + '.jpg');
})();
