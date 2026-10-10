#!/usr/bin/env node
// Mike & Mia: Jump & Slide — the scenery, items and buttons, cut from the art
// pack (art-source/jump/pack/Runner/, not shipped) and written as compact webp
// files into assets/games/jump/art/, with a manifest (art.js) that the renderer
// reads: each picture's size, and where to slice it.
//
//   node tools/jump-art.cjs            → writes the files and the manifest
//   node tools/jump-art.cjs --check    → fails if a file in the manifest is missing
//
// Every cut is: crop (a rectangle of the source), trim to the visible pixels,
// clear the faint haze (alpha below 12), scale to the size it needs at about
// 2× the largest display size, encode. Platforms also get their slice points
// (left cap, a middle part that repeats, right cap), so the renderer can
// stretch them to the width of the level's collision boxes without distorting
// the caps. Gates get the height of their opening, so the bar's underside sits
// exactly on the collision box's underside.
//
// The far backgrounds are not made seamless here: the renderer mirror-tiles
// them (every second copy flipped), which joins edge to identical edge.
//
// Not used from the pack: Gouden_munt (stars already turn into coins), Snelheidsboost and the
// space Boostpad (a speed change would move every jump the levels are proven with),
// Mike_run_bronblad_v1 (the older brown-eyed run), Eerdere_concepten (old concepts).
const fs = require('fs'); const path = require('path');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..');
const PACK = path.join(ROOT, 'art-source', 'jump', 'pack', 'Runner');
// sources outside Runner/ are given relative to the pack folder with a leading '../'
const OUT = path.join(ROOT, 'assets', 'games', 'jump', 'art');

// name → source, crop [x0, y0, x1, y1] (source px; omitted = whole picture), target height in px,
// optional: slice (platform: caps and repeating middle as fractions of the trimmed width),
// gate (measure the opening), opaque (a background: jpeg-like webp, no alpha), quality.
const CUTS = {
  // ---- Onderwater
  'uw-bg': { src: '02_Onderwater/Achtergrond.png', h: 720, opaque: true, q: .78 },
  'uw-bg-tall': { src: '../extra/onderwater-portret.png', h: 1100, opaque: true, q: .78 },   // portrait screens
  'uw-urchin': { src: '../extra/zee-egel.png', h: 150, fringe: true },
  'uw-windows': { src: '02_Onderwater/Tunnelramen.png', h: 640, q: .8 },
  'uw-plat': { src: '02_Onderwater/Platforms_obstakels_bronblad_v2.png', crop: [30, 120, 970, 265], h: 110, slice: { capL: .045, capR: .045, midX: .118, midW: .28 } },
  'uw-crate': { src: '02_Onderwater/Platforms_obstakels_bronblad_v2.png', crop: [276, 324, 566, 580], h: 170 },
  'uw-crate2': { src: '02_Onderwater/Platforms_obstakels_bronblad_v2.png', crop: [891, 324, 1359, 580], h: 170 },
  'uw-gate': { src: '02_Onderwater/Platforms_obstakels_bronblad_v2.png', crop: [46, 668, 756, 951], h: 250, gate: true },
  // ---- Snoep & Speelgoed
  'cd-bg': { src: '03_Snoep_en_Speelgoed/Achtergrond.png', h: 720, opaque: true, q: .78 },
  'cd-plat': { src: '03_Snoep_en_Speelgoed/Wafelplatform.png', h: 130, slice: { capL: .03, capR: .03, midX: .2, midW: .3 } },
  'cd-pad': { src: '03_Snoep_en_Speelgoed/Jelly_bouncepad.png', h: 150 },
  'cd-gate': { src: '03_Snoep_en_Speelgoed/Slidepoort.png', h: 250, gate: true },
  'cd-block-y': { src: '03_Snoep_en_Speelgoed/Speelgoedblokken.png', crop: [535, 160, 1000, 536], h: 170 },
  'cd-block-c': { src: '03_Snoep_en_Speelgoed/Speelgoedblokken.png', crop: [350, 541, 763, 885], h: 170 },
  'cd-block-r': { src: '03_Snoep_en_Speelgoed/Speelgoedblokken.png', crop: [766, 541, 1185, 885], h: 170 },
  // ---- Ruimte
  'sp-bg': { src: '04_Ruimte/Achtergrond.png', h: 720, opaque: true, q: .78 },
  'sp-plat': { src: '04_Ruimte/Zwevend_platform.png', h: 110, slice: { capL: .06, capR: .06, midX: .3, midW: .26 } },
  'sp-rock': { src: '04_Ruimte/Maansteen.png', h: 180 },
  'sp-crystals': { src: '../extra/kristallen.png', h: 150, fringe: true },
  'sp-gate': { src: '04_Ruimte/Slidepoort.png', h: 250, gate: true },
  // ---- shared
  star: { src: '05_Verzamelitems/Bonusster.png', h: 150 },
  // the same gem star in light aqua blue for the Onderwaterwereld (the pink and violet turned to blue,
  // highlights and the sparkle kept), with a darker blue outline so it stands out against the water
  'star-uw': { src: '05_Verzamelitems/Bonusster.png', h: 150, hue: { from: [255, 360], to: 196, sat: .62, light: 1.12 }, outline: ['#1d5fa6', 4] },
  shield: { src: '05_Verzamelitems/Schild.png', h: 150 },
  finish: { src: '06_Finish_en_Bediening/Finishpoort.png', h: 640 },
  medal: { src: '06_Finish_en_Bediening/Medaille.png', h: 300 },
  'btn-jump': { src: '06_Finish_en_Bediening/Springknop.png', h: 256 },
  'btn-slide': { src: '06_Finish_en_Bediening/Slideknop.png', h: 256 }
};

(async () => {
  if (process.argv.includes('--check')) {
    const missing = Object.keys(CUTS).filter(n => !fs.existsSync(path.join(OUT, `${n}.webp`)));
    if (missing.length) { console.error('jump art missing:', missing.join(', ')); process.exit(1) }
    console.log(`jump art: ${Object.keys(CUTS).length} files ✔`); return;
  }
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch(); const page = await browser.newPage(); await page.goto('about:blank');
  const manifest = {}; let total = 0;
  for (const [name, cut] of Object.entries(CUTS)) {
    const data = 'data:image/png;base64,' + fs.readFileSync(path.join(PACK, cut.src)).toString('base64');
    const r = await page.evaluate(async ({ data, cut }) => {
      const img = new Image(); await new Promise((ok, no) => { img.onload = ok; img.onerror = no; img.src = data });
      const [x0, y0, x1, y1] = cut.crop || [0, 0, img.width, img.height];
      const w = x1 - x0, h = y1 - y0, c = document.createElement('canvas'); c.width = w; c.height = h;
      const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(img, x0, y0, w, h, 0, 0, w, h);
      let tx0 = 0, ty0 = 0, tx1 = w - 1, ty1 = h - 1;
      if (!cut.opaque) {
        const id = g.getImageData(0, 0, w, h), d = id.data;
        for (let i = 3; i < d.length; i += 4) if (d[i] < 12) d[i] = 0;
        // fringe: a see-through edge pixel takes the colour of the solid pixels just inside it,
        // so no pink or red rim of the old background shows on a dark or light level
        if (cut.fringe) {
          const src = new Uint8ClampedArray(d);
          for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
            const i = (y * w + x) * 4; if (src[i + 3] === 0 || src[i + 3] >= 235) continue;
            let r = 0, gg = 0, b = 0, n = 0;
            for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue; const j = (yy * w + xx) * 4; if (src[j + 3] >= 245) { r += src[j]; gg += src[j + 1]; b += src[j + 2]; n++ } }
            if (n) { d[i] = r / n; d[i + 1] = gg / n; d[i + 2] = b / n } else d[i + 3] = src[i + 3] * .5;
          }
        }
        g.putImageData(id, 0, 0);
        tx0 = w; ty0 = h; tx1 = 0; ty1 = 0;
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 24) { if (x < tx0) tx0 = x; if (x > tx1) tx1 = x; if (y < ty0) ty0 = y; if (y > ty1) ty1 = y }
      }
      const tw = tx1 - tx0 + 1, th = ty1 - ty0 + 1, k = cut.h / th, ow = Math.round(tw * k), oh = cut.h;
      const o = document.createElement('canvas'); o.width = ow; o.height = oh;
      const og = o.getContext('2d', { willReadFrequently: true }); og.imageSmoothingQuality = 'high'; og.drawImage(c, tx0, ty0, tw, th, 0, 0, ow, oh);
      if (cut.hue) {
        const id = og.getImageData(0, 0, ow, oh), d = id.data, H = cut.hue;
        for (let i = 0; i < d.length; i += 4) {
          if (!d[i + 3]) continue;
          const r = d[i] / 255, g2 = d[i + 1] / 255, b = d[i + 2] / 255, mx = Math.max(r, g2, b), mn = Math.min(r, g2, b), dd = mx - mn;
          if (dd < .08) continue;   // white highlights and greys stay
          let hu = mx === r ? ((g2 - b) / dd) % 6 : mx === g2 ? (b - r) / dd + 2 : (r - g2) / dd + 4; hu = (hu * 60 + 360) % 360;
          if (hu < H.from[0] && hu > 20) continue;   // only the pinks, magentas and violets (the cyan gem stays)
          const sa = dd / mx * H.sat, v = Math.min(1, mx * H.light), c = v * sa, h6 = H.to / 60, X = c * (1 - Math.abs(h6 % 2 - 1)), m = v - c;
          const [r1, g1, b1] = h6 < 1 ? [c, X, 0] : h6 < 2 ? [X, c, 0] : h6 < 3 ? [0, c, X] : h6 < 4 ? [0, X, c] : h6 < 5 ? [X, 0, c] : [c, 0, X];
          d[i] = (r1 + m) * 255; d[i + 1] = (g1 + m) * 255; d[i + 2] = (b1 + m) * 255;
        }
        og.putImageData(id, 0, 0);
      }
      if (cut.outline) {
        // a solid outline: the silhouette in the outline colour, stamped round the picture, the picture on top
        const [col, rad] = cut.outline, p = rad + 1, o2 = document.createElement('canvas'); o2.width = ow + p * 2; o2.height = oh + p * 2;
        const sil = document.createElement('canvas'); sil.width = ow; sil.height = oh; const sg = sil.getContext('2d');
        sg.drawImage(o, 0, 0); sg.globalCompositeOperation = 'source-in'; sg.fillStyle = col; sg.fillRect(0, 0, ow, oh);
        const g3 = o2.getContext('2d'); for (let a = 0; a < 24; a++) g3.drawImage(sil, p + Math.cos(a / 24 * 6.283) * rad, p + Math.sin(a / 24 * 6.283) * rad);
        g3.drawImage(o, p, p); o.width = o2.width; o.height = o2.height; og.clearRect(0, 0, o.width, o.height); og.drawImage(o2, 0, 0);
      }
      const info = { w: o.width, h: o.height };
      if (cut.gate) {
        // the underside of the bar: in the middle column, the lowest visible pixel above the opening
        const d = og.getImageData(Math.round(ow / 2), 0, 1, oh).data; let y = 0;
        while (y < oh && d[y * 4 + 3] <= 128) y++;  // down to the top of the bar
        while (y < oh && d[y * 4 + 3] > 128) y++;   // down through the bar
        info.open = y;                              // first see-through row = top of the opening
      }
      if (cut.slice) { const s = cut.slice; info.slice = { capL: Math.round(ow * s.capL), capR: Math.round(ow * s.capR), midX: Math.round(ow * s.midX), midW: Math.round(ow * s.midW) } }
      return { url: o.toDataURL('image/webp', cut.q || .84), info };
    }, { data, cut });
    const file = path.join(OUT, `${name}.webp`);
    fs.writeFileSync(file, Buffer.from(r.url.split(',')[1], 'base64'));
    const kb = fs.statSync(file).size / 1024; total += kb;
    manifest[name] = { src: `art/${name}.webp`, ...r.info };
    console.log(`${name.padEnd(11)} ${String(r.info.w).padStart(5)}×${r.info.h}  ${kb.toFixed(0).padStart(4)} kB${r.info.open != null ? `  opening from ${r.info.open}px` : ''}`);
  }
  fs.writeFileSync(path.join(OUT, 'art.js'), `// Written by tools/jump-art.cjs — do not edit by hand.\n// Per picture: file, size in px; platforms: slice points (px); gates: the row where the opening starts.\nexport const ART = {\n${Object.entries(manifest).map(([k, v]) => `  '${k}': ${JSON.stringify(v)}`).join(',\n')}\n};\n`);
  console.log(`total ${total.toFixed(0)} kB in ${Object.keys(CUTS).length} files`);
  await browser.close();
})();
