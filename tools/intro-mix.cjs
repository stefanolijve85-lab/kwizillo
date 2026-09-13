#!/usr/bin/env node
// Renders the intro sting from the ingredients made by tools/intro-audio.js.
// No ffmpeg on the machine, so the mix is done with the Web Audio API inside
// headless Chromium (OfflineAudioContext) and written as WAV. The shipped asset
// is mono 16-bit WAV like the other loops: AAC is not decodable in every
// WebView (Playwright's Chromium included), WAV is.
//
//   node tools/intro-mix.cjs analyse <dir>            envelopes + durations
//   node tools/intro-mix.cjs render  <dir> <out.wav> --music music-2.mp3 --musicAt 0.5 --kids kid-1.mp3,kid-3.mp3 --kidsAt 9.85 [--total 12.4 --musicGain .9 --kidGain .7]
const { chromium } = require('playwright');
const fs = require('fs'); const path = require('path'); const { execSync } = require('child_process');

const [mode, dir, out] = process.argv.slice(2);
const opt = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };

const PAGE = `<script>
async function decode(ctx, b64){const bin=atob(b64);const a=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)a[i]=bin.charCodeAt(i);return ctx.decodeAudioData(a.buffer)}
function envelope(buf, step=.25){const d=buf.getChannelData(0);const n=Math.floor(step*buf.sampleRate);const out=[];for(let i=0;i<d.length;i+=n){let s=0;for(let j=i;j<Math.min(d.length,i+n);j++)s+=d[j]*d[j];out.push(Math.sqrt(s/Math.min(n,d.length-i)))}return out}
function wav(buf){const ch=buf.numberOfChannels,len=buf.length,sr=buf.sampleRate;const bytes=44+len*ch*2;const ab=new ArrayBuffer(bytes);const v=new DataView(ab);const w=(o,s)=>{for(let i=0;i<s.length;i++)v.setUint8(o+i,s.charCodeAt(i))};w(0,'RIFF');v.setUint32(4,bytes-8,true);w(8,'WAVE');w(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,ch,true);v.setUint32(24,sr,true);v.setUint32(28,sr*ch*2,true);v.setUint16(32,ch*2,true);v.setUint16(34,16,true);w(36,'data');v.setUint32(40,len*ch*2,true);let o=44;for(let i=0;i<len;i++)for(let c=0;c<ch;c++){const s=Math.max(-1,Math.min(1,buf.getChannelData(c)[i]));v.setInt16(o,s<0?s*32768:s*32767,true);o+=2}return ab}
window.analyse=async files=>{const ctx=new OfflineAudioContext(1,44100,44100);const r={};for(const [name,b64] of Object.entries(files)){const b=await decode(ctx,b64);r[name]={duration:+b.duration.toFixed(2),env:envelope(b).map(x=>+x.toFixed(3))}}return r}
window.render=async({music,kids,musicAt,kidsAt,total,musicGain,kidGain,earlyBoost,earlyUntil,duck})=>{
  const sr=44100;const ctx=new OfflineAudioContext(2,Math.ceil(total*sr),sr);
  const master=ctx.createGain();master.gain.value=1;
  const comp=ctx.createDynamicsCompressor();comp.threshold.value=-8;comp.knee.value=6;comp.ratio.value=6;comp.attack.value=.003;comp.release.value=.15;
  const lim=ctx.createDynamicsCompressor();lim.threshold.value=-2;lim.knee.value=1;lim.ratio.value=20;lim.attack.value=.001;lim.release.value=.08;
  const trim=ctx.createGain();trim.gain.value=.86;
  master.connect(comp);comp.connect(lim);lim.connect(trim);trim.connect(ctx.destination);
  const mb=await decode(ctx,music);const ms=ctx.createBufferSource();ms.buffer=mb;const mg=ctx.createGain();mg.gain.value=musicGain;ms.connect(mg);mg.connect(master);ms.start(musicAt);
  // the generated build-up is very quiet; lift it until the hit approaches
  mg.gain.setValueAtTime(musicGain*earlyBoost,0);mg.gain.linearRampToValueAtTime(musicGain,musicAt+earlyUntil);
  // make room for the children: the music dips while they call the name
  if(kids.length&&duck<1){mg.gain.setValueAtTime(musicGain,kidsAt-.08);mg.gain.linearRampToValueAtTime(musicGain*duck,kidsAt+.05);mg.gain.setValueAtTime(musicGain*duck,kidsAt+1.05);mg.gain.linearRampToValueAtTime(musicGain,kidsAt+1.4)}
  // fade the music out over the last 0.6 s so the loop can take over cleanly
  mg.gain.setValueAtTime(musicGain,Math.max(0,total-.6));mg.gain.linearRampToValueAtTime(0.0001,total);
  let i=0;for(const b64 of kids){const b=await decode(ctx,b64);const s=ctx.createBufferSource();s.buffer=b;const g=ctx.createGain();g.gain.value=kidGain;const p=ctx.createStereoPanner();p.pan.value=[-.5,.5,-.2,.2,0][i%5];s.connect(g);g.connect(p);p.connect(master);s.start(kidsAt+i*.045);i++}
  const rendered=await ctx.startRendering();
  let peak=0;for(let c=0;c<2;c++){const d=rendered.getChannelData(c);for(let k=0;k<d.length;k++)peak=Math.max(peak,Math.abs(d[k]))}
  const ab=wav(rendered);let s='';const u=new Uint8Array(ab);for(let k=0;k<u.length;k+=0x8000)s+=String.fromCharCode.apply(null,u.subarray(k,k+0x8000));
  return {peak:+peak.toFixed(3),env:envelope(rendered).map(x=>+x.toFixed(3)),wav:btoa(s)}
}
</script>`;

(async () => {
  const b = await chromium.launch(); const p = await b.newPage(); await p.setContent(PAGE);
  const b64 = f => fs.readFileSync(path.join(dir, f)).toString('base64');
  if (mode === 'analyse') {
    const files = {}; for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.mp3'))) files[f] = b64(f);
    const r = await p.evaluate(files => window.analyse(files), files);
    for (const [name, v] of Object.entries(r)) console.log(`${name}  ${v.duration}s  env: ${v.env.join(' ')}`);
  } else if (mode === 'render') {
    const kids = opt('kids', '').split(',').filter(Boolean).map(b64);
    const r = await p.evaluate(a => window.render(a), {
      music: b64(opt('music')), kids, musicAt: +opt('musicAt', 0), kidsAt: +opt('kidsAt', 10), total: +opt('total', 12.4),
      musicGain: +opt('musicGain', .9), kidGain: +opt('kidGain', .75), earlyBoost: +opt('earlyBoost', 1), earlyUntil: +opt('earlyUntil', 4.5), duck: +opt('duck', 1)
    });
    const stereo = out.replace(/\.wav$/, '.stereo.wav');
    fs.writeFileSync(stereo, Buffer.from(r.wav, 'base64'));
    execSync(`afconvert -f WAVE -d LEI16@44100 -c 1 "${stereo}" "${out}"`);
    console.log(`rendered ${out} peak=${r.peak} env: ${r.env.join(' ')}`);
  }
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
