// Prints the ElevenLabs subscription balance (credits used / limit, next reset).
// Loads the key from the gitignored .env at runtime like server.js and never prints it.
const fs = require('fs'), path = require('path');
try { for (const line of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split(/\r?\n/)) { const t = line.trim(); if (!t || t.startsWith('#')) continue; const i = t.indexOf('='); if (i < 1) continue; const k = t.slice(0, i).trim(); let v = t.slice(i + 1).trim(); if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1); if (!(k in process.env)) process.env[k] = v; } } catch {}
const key = process.env.ELEVENLABS_API_KEY; if (!key) { console.error('no ELEVENLABS_API_KEY in .env'); process.exit(1); }
fetch('https://api.elevenlabs.io/v1/user/subscription', { headers: { 'xi-api-key': key } }).then(async r => {
  const j = await r.json(); if (!r.ok) { console.error('HTTP', r.status, JSON.stringify(j).slice(0, 200)); process.exit(1); }
  const used = j.character_count, limit = j.character_limit, left = limit - used;
  console.log(`tier: ${j.tier}  credits: ${used.toLocaleString()} used of ${limit.toLocaleString()}  →  ${left.toLocaleString()} left`);
  if (j.next_character_count_reset_unix) console.log('resets:', new Date(j.next_character_count_reset_unix * 1000).toISOString().slice(0, 10));
}).catch(e => { console.error(e.message); process.exit(1); });
