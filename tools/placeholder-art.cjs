#!/usr/bin/env node
// Tijdelijke platen voor een wereld die nog geen geschilderde kunst heeft.
//
//   node tools/placeholder-art.cjs          → schrijft de ontbrekende platen
//   node tools/placeholder-art.cjs --check  → faalt als er één ontbreekt
//
// Dit is nadrukkelijk géén eindbeeld: het is een rustige kleurverloop met het
// teken van de wereld erin, zodat een nieuwe wereld nooit een kapotte <img> of
// een plaat van een ander onderwerp laat zien zolang de echte render er niet
// is. Welke bestanden zo gemaakt zijn staat in assets/placeholder-art.json, en
// npm test noemt dat aantal bij elke run.
//
// Het draait op de Chromium die Playwright al meebrengt, dus er is geen
// beeldbibliotheek en geen tegoed bij een beeldgenerator voor nodig.
const fs = require('fs'); const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const LIST = path.join(ROOT, 'assets', 'placeholder-art.json');
const check = process.argv.includes('--check');

// Elke wereld heeft twee kleuren en een teken; de onderwerpen erven de kleuren
// van hun wereld, zodat een wereldscherm één geheel blijft.
const PALETTE = {
  kunst: { from: '#2b1055', to: '#7b2d7e', glow: '#ffb457', glyph: '🎨' },
  sport: { from: '#06304a', to: '#0f7a5a', glow: '#ffd166', glyph: '🏅' },
};
const WORLDS = [
  { file: 'assets/worlds/kunst.jpg', world: 'kunst', w: 752, h: 1344, glyph: '🎨' },
  { file: 'assets/worlds/sport.jpg', world: 'sport', w: 752, h: 1344, glyph: '🏅' },
];
const TOPICS = [
  ['schilderkunst', 'kunst', '🖼️'], ['muziek', 'kunst', '🎵'],
  ['bouwkunst', 'kunst', '🏛️'], ['dans_theater', 'kunst', '🎭'],
  ['balsporten', 'sport', '⚽'], ['olympische_spelen', 'sport', '🥇'],
  ['water_wintersport', 'sport', '🏊'], ['records_helden', 'sport', '🏆'],
].map(([key, world, glyph]) => ({ file: `assets/topics/${key}.jpg`, world, glyph, w: 1024, h: 576 }));
const ALL = [...WORLDS, ...TOPICS];

const page = (p, glyph, w, h) => `<!doctype html><meta charset="utf-8"><style>
  html,body{margin:0;padding:0;width:${w}px;height:${h}px;overflow:hidden}
  .bg{position:absolute;inset:0;background:
    radial-gradient(120% 80% at 22% 14%, ${p.glow}55 0%, transparent 58%),
    radial-gradient(90% 70% at 82% 88%, ${p.to}ee 0%, transparent 62%),
    linear-gradient(160deg, ${p.from} 0%, ${p.to} 100%);}
  .stars{position:absolute;inset:0;background-image:
    radial-gradient(2px 2px at 18% 32%, #ffffff44, transparent),
    radial-gradient(2px 2px at 63% 18%, #ffffff33, transparent),
    radial-gradient(3px 3px at 41% 77%, #ffffff22, transparent),
    radial-gradient(2px 2px at 86% 54%, #ffffff33, transparent);}
  .halo{position:absolute;inset:0;background:radial-gradient(circle at 50% 46%,
    ${p.glow}66 0%, ${p.glow}22 26%, transparent 52%);}
  .vignette{position:absolute;inset:0;background:radial-gradient(75% 60% at 50% 45%, transparent 40%, #00000088 100%);}
  .glyph{position:absolute;inset:0;display:grid;place-items:center;
    font-size:${Math.round(Math.min(w, h) * 0.34)}px;
    filter:drop-shadow(0 0 ${Math.round(h * 0.02)}px #ffffffaa)
           drop-shadow(0 ${Math.round(h * 0.012)}px ${Math.round(h * 0.03)}px #00000088)}
</style><div class="bg"></div><div class="stars"></div><div class="halo"></div><div class="glyph">${glyph}</div><div class="vignette"></div>`;

(async () => {
  const missing = ALL.filter(a => !fs.existsSync(path.join(ROOT, a.file)));
  if (check) {
    if (missing.length) { console.error(`placeholder-art: ${missing.length} ontbreken: ${missing.map(m => m.file).join(', ')}`); process.exit(1); }
    console.log(`placeholder-art: ${ALL.length} tijdelijke platen aanwezig`);
    return;
  }
  const browser = await chromium.launch();
  for (const a of ALL) {
    const ctx = await browser.newContext({ viewport: { width: a.w, height: a.h }, deviceScaleFactor: 1 });
    const pg = await ctx.newPage();
    await pg.setContent(page(PALETTE[a.world], a.glyph, a.w, a.h));
    await pg.screenshot({ path: path.join(ROOT, a.file), type: 'jpeg', quality: 82 });
    await ctx.close();
    console.log(`${a.file}  ${a.w}x${a.h}  ${(fs.statSync(path.join(ROOT, a.file)).size / 1024).toFixed(0)} kB`);
  }
  await browser.close();
  fs.writeFileSync(LIST, JSON.stringify({
    note: 'Tijdelijke platen, gemaakt door tools/placeholder-art.cjs. Vervangen zodra er echte renders zijn.',
    files: ALL.map(a => a.file),
  }, null, 2) + '\n');
  console.log(`\n${ALL.length} tijdelijke platen; de lijst staat in ${path.relative(ROOT, LIST)}`);
})();
