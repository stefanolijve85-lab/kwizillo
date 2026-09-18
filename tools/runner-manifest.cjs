#!/usr/bin/env node
// Rebuilds assets/games/jungle/img/manifest.json: the list of paintings the runner may
// request, plus a stamp that versions every image URL (a phone caches paintings for a
// day; a new stamp makes it fetch the new ones). Run after adding or replacing art.
const fs = require('fs'), path = require('path');
const dir = path.join(__dirname, '..', 'assets', 'games', 'jungle', 'img');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.png')).map(f => f.replace(/\.png$/, '')).sort();
const v = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '');
fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify({ v, files }) + '\n');
console.log(`manifest: ${files.length} paintings, stamp ${v}`);
