#!/usr/bin/env node
// Elke buddy vierkant, zonder er iets af te snijden.
//
//   node tools/mascot-square.cjs           → assets/mascots/<id>.jpg (512×512)
//   node tools/mascot-square.cjs --check   → meldt welke er nog staand zijn
//
// De renders kwamen in twee vormen: zeven vierkant (512 × 512) en zes staand
// (288 × 512). Overal waar het spel een buddy als ronde pasfoto laat zien —
// de HUD op Home, het profiel, de collectie, de stemkiezer — staat er
// `object-fit: cover` op een vierkant vlak. Bij een staande plaat snijdt dat de
// zijkanten eraf, en dan is pip zijn vleugels kwijt.
//
// Bijsnijden is hier het probleem, dus wordt er niet bijgesneden maar bijgevuld:
// de plaat komt op volle hoogte in het midden van een vierkant en links en
// rechts staat dezelfde plaat onscherp en formaatvullend. Dat zijn precies de
// kleuren van de achtergrond waar de buddy al op staat, dus de naad valt weg —
// de veer aan de randen maakt hem helemaal onzichtbaar.
//
// De originelen gaan naar art-source/mascots/ en blijven daar staan; dit
// gereedschap rekent altijd vanaf die bron, zodat het opnieuw draaien niet
// steeds een vullingetje op een vullingetje zet.
const fs = require('fs'); const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'assets', 'mascots');
const KEEP = path.join(ROOT, 'art-source', 'mascots');
const S = 512, QUALITY = 88;
const check = process.argv.includes('--check');

// De maat uit de JPEG-kop, zonder beeldbibliotheek.
function size(file) {
  const b = fs.readFileSync(file);
  if (b[0] !== 0xff || b[1] !== 0xd8) return null;
  let i = 2;
  while (i < b.length) {
    if (b[i] !== 0xff) { i++; continue }
    const m = b[i + 1];
    if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
    i += 2 + b.readUInt16BE(i + 2);
  }
  return null;
}

const page = file => `<!doctype html><meta charset="utf-8"><style>
  html,body{margin:0}
  .canvas{position:relative;width:${S}px;height:${S}px;overflow:hidden;background:#0b2f5c}
  .halo{position:absolute;inset:-10%;background:url("${file}") center/cover no-repeat;filter:blur(22px) saturate(1.04)}
  .art{position:absolute;left:50%;top:0;transform:translateX(-50%);height:${S}px;display:block;
       -webkit-mask-image:linear-gradient(to right,transparent 0,#000 8%,#000 92%,transparent 100%);
       mask-image:linear-gradient(to right,transparent 0,#000 8%,#000 92%,transparent 100%)}
</style><div class="canvas"><div class="halo"></div><img class="art" src="${file}"></div>`;

(async () => {
  fs.mkdirSync(KEEP, { recursive: true });
  const files = fs.readdirSync(SRC).filter(f => /\.jpg$/.test(f)).sort();
  // De bron: het origineel als dat al bewaard is, anders het bestand zelf.
  const todo = [];
  for (const f of files) {
    const kept = path.join(KEEP, f);
    const from = fs.existsSync(kept) ? kept : path.join(SRC, f);
    const s = size(from);
    if (!s) { console.error(`${f}: kan de maat niet lezen`); continue }
    if (s.w === s.h) continue;
    todo.push({ f, from, kept, s });
  }
  if (!todo.length) { console.log('mascottes: alles is al vierkant ✔'); return }
  if (check) {
    console.error(`nog staand: ${todo.map(t => `${t.f} (${t.s.w}×${t.s.h})`).join(', ')}\nDraai: node tools/mascot-square.cjs`);
    process.exit(1);
  }

  const browser = await chromium.launch();
  const p = await browser.newPage({ viewport: { width: S, height: S }, deviceScaleFactor: 1 });
  for (const t of todo) {
    if (!fs.existsSync(t.kept)) fs.copyFileSync(path.join(SRC, t.f), t.kept);   // het origineel bewaren
    const tmp = path.join(KEEP, '_square.html');
    fs.writeFileSync(tmp, page(encodeURIComponent(t.f)));
    await p.goto('file://' + tmp, { waitUntil: 'load' });
    await p.waitForTimeout(160);
    await p.locator('.canvas').screenshot({ path: path.join(SRC, t.f), type: 'jpeg', quality: QUALITY });
    fs.unlinkSync(tmp);
    console.log(`${t.f}: ${t.s.w}×${t.s.h} → ${S}×${S} (heel in beeld, zijkanten bijgevuld)`);
  }
  await browser.close();
  console.log('Daarna: node tools/mascot-tiles.cjs (de uitsnedes komen uit deze platen)');
})();
