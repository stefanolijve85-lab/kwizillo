#!/usr/bin/env node
// Generates the game sound effects with the ElevenLabs sound-effects API and
// writes them as peak-normalised 16-bit WAV into assets/audio/ (the audio
// manager plays WAV everywhere). The key comes from .env like server.js.
//
//   node tools/sfx.js [name ...]      default: every effect below
const fs = require('fs'); const path = require('path'); const { execSync } = require('child_process');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
(function loadEnvFile() {
  let raw; try { raw = fs.readFileSync(path.join(ROOT, '.env'), 'utf8'); } catch { return; }
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim(); if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('='); if (eq < 1) continue;
    const key = t.slice(0, eq).trim(); let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!(key in process.env)) process.env[key] = v;
  }
})();
const KEY = process.env.ELEVENLABS_API_KEY;
if (!KEY) { console.error('ELEVENLABS_API_KEY missing (put it in .env)'); process.exit(1); }

// file name -> prompt, duration, peak level. Friendly and soft: this is a
// children's game, so the "wrong" sound is a gentle bloop, never a buzzer.
const SFX = {
  tap:      { text: 'Soft bubbly cartoon UI pop, a single short playful blip, clean, no reverb', seconds: 0.5, peak: 0.6 },
  correct:  { text: 'Cheerful magical success chime for a children\'s quiz correct answer: bright glockenspiel ding with a quick rising sparkle, warm and happy, short', seconds: 1.3, peak: 0.85 },
  wrong:    { text: 'Gentle friendly descending cartoon bloop for a wrong answer in a kids game, soft rubbery two-note "uh-oh", cute, not harsh, short', seconds: 1.0, peak: 0.7 },
  reward:   { text: 'Short joyful celebration fanfare for a kids game level complete: party popper pop, confetti shimmer, bright brass and bells, triumphant, two seconds', seconds: 2.2, peak: 0.9 },
  world:    { text: 'Magical whoosh transition with twinkling sparkles, entering a fantasy world, children\'s game, short', seconds: 1.3, peak: 0.75 },
  confetti: { text: 'Party popper burst: a quick pop followed by a light shower of confetti and a small sparkle, playful, short', seconds: 1.0, peak: 0.8 },
  gift:     { text: 'A cartoon gift box opening with a springy boing and a magical sparkle reveal, playful, short', seconds: 1.4, peak: 0.85 },
  hint:     { text: 'A single soft warm lightbulb ding with a tiny sparkle tail, thoughtful, short', seconds: 0.8, peak: 0.6 },
  swoosh:   { text: 'Quick soft card swipe swoosh, light and airy, UI transition, very short', seconds: 0.5, peak: 0.55 }
};

async function generate(name) {
  const s = SFX[name];
  const r = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
    method: 'POST', headers: { 'xi-api-key': KEY, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
    body: JSON.stringify({ text: s.text, duration_seconds: s.seconds, prompt_influence: 0.5 })
  });
  if (!r.ok) throw new Error(`${name}: ${r.status} ${(await r.text()).slice(0, 200)}`);
  return Buffer.from(await r.arrayBuffer());
}

// Decode + trim leading/trailing silence + peak-normalise + short fade-out, in Chromium.
const PAGE = `<script>
window.process=async(b64,peak)=>{
  const bin=atob(b64);const a=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)a[i]=bin.charCodeAt(i);
  const ctx=new OfflineAudioContext(1,44100,44100);const buf=await ctx.decodeAudioData(a.buffer);
  const d=buf.getChannelData(0);let s=0,e=d.length-1;while(s<e&&Math.abs(d[s])<.004)s++;while(e>s&&Math.abs(d[e])<.004)e--;
  s=Math.max(0,s-200);e=Math.min(d.length-1,e+2000);
  const out=new Float32Array(e-s+1);let max=0;for(let i=0;i<out.length;i++){out[i]=d[s+i];max=Math.max(max,Math.abs(out[i]))}
  const g=max?peak/max:1;const fade=Math.min(out.length,Math.floor(44100*.06));
  for(let i=0;i<out.length;i++){out[i]*=g;if(i>out.length-fade)out[i]*=(out.length-i)/fade;if(i<64)out[i]*=i/64}
  const bytes=44+out.length*2;const ab=new ArrayBuffer(bytes);const v=new DataView(ab);const w=(o,t)=>{for(let i=0;i<t.length;i++)v.setUint8(o+i,t.charCodeAt(i))};
  w(0,'RIFF');v.setUint32(4,bytes-8,true);w(8,'WAVE');w(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,44100,true);v.setUint32(28,88200,true);v.setUint16(32,2,true);v.setUint16(34,16,true);w(36,'data');v.setUint32(40,out.length*2,true);
  let o=44;for(let i=0;i<out.length;i++){const x=Math.max(-1,Math.min(1,out[i]));v.setInt16(o,x<0?x*32768:x*32767,true);o+=2}
  let str='';const u=new Uint8Array(ab);for(let k=0;k<u.length;k+=0x8000)str+=String.fromCharCode.apply(null,u.subarray(k,k+0x8000));
  return {seconds:+(out.length/44100).toFixed(2),wav:btoa(str)}
}
</script>`;

(async () => {
  const names = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(SFX);
  const b = await chromium.launch(); const p = await b.newPage(); await p.setContent(PAGE);
  const keep = path.join(ROOT, 'build', 'sfx'); fs.mkdirSync(keep, { recursive: true });
  for (const name of names) {
    const mp3 = await generate(name);
    fs.writeFileSync(path.join(keep, name + '.mp3'), mp3);
    const r = await p.evaluate(({ b64, peak }) => window.process(b64, peak), { b64: mp3.toString('base64'), peak: SFX[name].peak });
    const dst = path.join(ROOT, 'assets', 'audio', name + '.wav');
    fs.writeFileSync(dst, Buffer.from(r.wav, 'base64'));
    console.log(`${name}: ${r.seconds}s -> ${path.relative(ROOT, dst)} (${fs.statSync(dst).size} bytes)`);
  }
  await b.close();
})().catch(e => { console.error(String(e.message || e).replace(KEY, '***')); process.exit(1); });
