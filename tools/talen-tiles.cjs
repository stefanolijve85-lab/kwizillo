#!/usr/bin/env node
// The picture tiles for the Talen themes "kleuren" and "getallen", drawn here
// instead of painted by an image model: a colour has to be exactly that colour
// and a number exactly that many things, which a painting does not promise.
//
//   node tools/talen-tiles.cjs     → assets/talen/img/<id>.jpg (360x360, like the other word tiles)
//   node tools/talen-tiles.cjs --cover → only assets/talen/img/cover-getallen.jpg: "1 2 3" without
//                                         stars, the tile of the getallen theme in the Talen picker
//
// A colour is a glossy paint blob on the sky-blue tile background; a number is
// the digit in the app's display face (Luckiest Guy) above that many stars, so
// a child who cannot read the digit yet can count. Both stay inside the middle
// 60% of the width: the game shows the tiles tall and narrow (object-fit: cover).
const fs = require('fs'); const path = require('path');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'assets', 'talen', 'img');
const COLOURS = { red: '#e8322f', blue: '#2f6fe8', yellow: '#ffd21f', green: '#34b84a', orange: '#ff8a1f', purple: '#8e44d6', pink: '#ff7eb6', black: '#26262b', white: '#ffffff', brown: '#8a5a2b' };
const NUMBERS = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const font = fs.readFileSync(path.join(ROOT, 'assets', 'fonts', 'LuckiestGuy.ttf')).toString('base64');
const BG = 'radial-gradient(circle at 50% 35%,#e9f7ff 0%,#bfe6ff 55%,#8fcdf7 100%)';
const blob = c => `<svg viewBox="0 0 200 200" width="230" height="230">
  <defs><radialGradient id="g" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".35" stop-color="${c}" stop-opacity="1"/><stop offset="1" stop-color="${c}"/></radialGradient>
  <filter id="s" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#0b3a7a" flood-opacity=".28"/></filter></defs>
  <path filter="url(#s)" fill="url(#g)" stroke="${c === '#ffffff' ? '#c9d6e3' : 'none'}" stroke-width="2.5"
    d="M100 22c22 0 30 14 46 18s34 6 34 30-14 26-12 44 18 28 6 46-34 14-50 18-24 14-44 8-22-22-38-30-30-14-28-38 18-24 20-40-6-34 14-44 30 0 52-12z"/>
  <ellipse cx="74" cy="64" rx="22" ry="12" fill="#fff" opacity="${c === '#ffffff' ? '.9' : '.45'}" transform="rotate(-28 74 64)"/></svg>`;
const star = '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#ffc21f" stroke="#e08a00" stroke-width="1.2" d="M12 2.5l2.8 6 6.5.7-4.9 4.4 1.4 6.4L12 16.8 6.2 20l1.4-6.4L2.7 9.2l6.5-.7z"/></svg>';
const number = n => `<div class="num"><b>${n}</b><div class="stars" style="--cols:${n <= 5 ? n : 5}">${star.repeat(n)}</div></div>`;
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 360, height: 360 } });
  const shot = async (id, inner) => {
    await p.setContent(`<style>@font-face{font-family:K;src:url(data:font/ttf;base64,${font})}
      html,body{margin:0;width:360px;height:360px;overflow:hidden}
      .t{width:360px;height:360px;display:grid;place-items:center;background:${BG}}
      .num{display:grid;justify-items:center;gap:6px}
      .num b{font-family:K;font-weight:400;font-size:150px;line-height:.9;padding-top:18px;color:#ffd21f;-webkit-text-stroke:6px #2842ae;paint-order:stroke fill;filter:drop-shadow(0 7px 0 #512fa8)}
      .stars{display:grid;grid-template-columns:repeat(var(--cols),34px);gap:3px;justify-content:center}
      .stars svg{width:34px;height:34px;filter:drop-shadow(0 2px 2px rgba(0,40,100,.3))}</style><div class="t">${inner}</div>`);
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: path.join(OUT, `${id}.jpg`), type: 'jpeg', quality: 88 });
  };
  // De omslag van het thema: drie cijfers in drie kleuren, zonder sterren (die horen bij één getal).
  const cover = ['#ffd21f', '#ff8a3d', '#5fd16b'].map((c, i) => `<b style="color:${c};font-size:118px;transform:rotate(${[-8, 4, -3][i]}deg) translateY(${[6, -8, 4][i]}px)">${i + 1}</b>`).join('');
  await shot('cover-getallen', `<div class="num" style="display:flex;gap:10px;align-items:center">${cover}</div>`);
  if (process.argv.includes('--cover')) { await b.close(); return console.log('cover-getallen.jpg written'); }
  for (const [id, c] of Object.entries(COLOURS)) await shot(id, blob(c));
  for (let i = 0; i < 10; i++) await shot(NUMBERS[i], number(i + 1));
  await b.close();
  console.log(`${Object.keys(COLOURS).length + NUMBERS.length} tiles written to assets/talen/img/`);
})();
