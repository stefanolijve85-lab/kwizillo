#!/usr/bin/env node
// Synthesises the game sound effects with the Web Audio API (OfflineAudioContext
// in headless Chromium) and writes peak-normalised 16-bit WAV into assets/audio/.
// No external service, fully reproducible. tools/sfx.js can replace these with
// ElevenLabs sound effects once the API key has the sound_generation permission.
//
//   node tools/sfx-synth.cjs [name ...]
const { chromium } = require('playwright');
const fs = require('fs'); const path = require('path');
const ROOT = path.join(__dirname, '..');

const PAGE = `<script>
const SR=44100;
function ctxFor(seconds){return new OfflineAudioContext(1,Math.ceil(seconds*SR),SR)}
function env(g,t,a,h,r,peak=1){g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(peak,t+a);g.gain.setValueAtTime(peak,t+a+h);g.gain.exponentialRampToValueAtTime(0.0001,t+a+h+r)}
function tone(ctx,dest,{type='sine',f0,f1,t,a=.005,h=.02,r=.3,peak=.5,detune=0}){const o=ctx.createOscillator();o.type=type;o.detune.value=detune;o.frequency.setValueAtTime(f0,t);if(f1)o.frequency.exponentialRampToValueAtTime(f1,t+a+h+r);const g=ctx.createGain();env(g,t,a,h,r,peak);o.connect(g);g.connect(dest);o.start(t);o.stop(t+a+h+r+.05)}
function bell(ctx,dest,f,t,r=.5,peak=.4){tone(ctx,dest,{f0:f,t,r,peak});tone(ctx,dest,{f0:f*2.01,t,r:r*.6,peak:peak*.35});tone(ctx,dest,{f0:f*3.98,t,r:r*.35,peak:peak*.12,type:'triangle'})}
function noise(ctx,dest,{t,dur,a=.002,r,peak=.5,type='bandpass',f0,f1,q=1}){const b=ctx.createBuffer(1,Math.ceil((dur+.1)*SR),SR);const d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;const s=ctx.createBufferSource();s.buffer=b;const fl=ctx.createBiquadFilter();fl.type=type;fl.Q.value=q;fl.frequency.setValueAtTime(f0,t);if(f1)fl.frequency.exponentialRampToValueAtTime(f1,t+dur);const g=ctx.createGain();env(g,t,a,Math.max(0,dur-a-r),r,peak);s.connect(fl);fl.connect(g);g.connect(dest);s.start(t);s.stop(t+dur+.1)}
function sparkle(ctx,dest,t,n=6,base=1800,span=.35,peak=.12){for(let i=0;i<n;i++){const f=base*Math.pow(2,(Math.random()*14|0)/12);bell(ctx,dest,f,t+i*(span/n)+Math.random()*.02,.25,peak)}}
const SFX={
  tap(ctx,d){noise(ctx,d,{t:0,dur:.06,r:.04,peak:.5,f0:1800,f1:600,q:1.5});tone(ctx,d,{f0:700,f1:380,t:0,a:.003,h:.01,r:.07,peak:.45,type:'sine'})},
  correct(ctx,d){const notes=[523.25,659.25,783.99,1046.5];notes.forEach((f,i)=>bell(ctx,d,f,i*.075,.55,.42));sparkle(ctx,d,.25,7,2600,.4,.1);tone(ctx,d,{f0:1046.5,t:.3,a:.02,h:.15,r:.45,peak:.12,type:'triangle'})},
  wrong(ctx,d){tone(ctx,d,{type:'triangle',f0:392,f1:370,t:0,a:.01,h:.12,r:.12,peak:.42});tone(ctx,d,{type:'triangle',f0:311,f1:262,t:.24,a:.01,h:.16,r:.2,peak:.42});tone(ctx,d,{type:'sine',f0:196,f1:131,t:.24,a:.01,h:.16,r:.2,peak:.2})},
  reward(ctx,d){const chords=[[523.25,659.25,783.99],[587.33,739.99,880],[659.25,830.61,987.77,1318.5]];chords.forEach((c,i)=>c.forEach(f=>{tone(ctx,d,{type:'sawtooth',f0:f,t:i*.19,a:.01,h:.1,r:.2,peak:.09,detune:-6});tone(ctx,d,{type:'sawtooth',f0:f,t:i*.19,a:.01,h:.1,r:.2,peak:.09,detune:6});tone(ctx,d,{type:'square',f0:f/2,t:i*.19,a:.01,h:.1,r:.15,peak:.04})}));[1046.5,1318.5,1568,2093].forEach((f,i)=>bell(ctx,d,f,.6+i*.08,.7,.3));noise(ctx,d,{t:.58,dur:.05,r:.03,peak:.6,f0:1200,f1:300,q:.8});sparkle(ctx,d,.7,12,2200,.9,.1);noise(ctx,d,{t:.62,dur:.9,a:.01,r:.6,peak:.05,f0:6000,type:'highpass'})},
  world(ctx,d){noise(ctx,d,{t:0,dur:.9,a:.25,r:.45,peak:.35,f0:250,f1:3800,q:1.2});tone(ctx,d,{type:'sine',f0:300,f1:1200,t:.05,a:.3,h:.2,r:.4,peak:.12});sparkle(ctx,d,.45,8,2000,.5,.11)},
  confetti(ctx,d){noise(ctx,d,{t:0,dur:.04,r:.03,peak:.9,f0:900,f1:200,q:.7});tone(ctx,d,{type:'sine',f0:160,f1:60,t:0,a:.002,h:.02,r:.1,peak:.5});noise(ctx,d,{t:.03,dur:.7,a:.02,r:.5,peak:.12,f0:5000,type:'highpass'});sparkle(ctx,d,.06,9,2400,.55,.09)},
  gift(ctx,d){const o=ctx.createOscillator();o.type='sine';const g=ctx.createGain();env(g,0,.01,.35,.25,.4);o.frequency.setValueAtTime(180,0);o.frequency.exponentialRampToValueAtTime(520,.18);o.frequency.exponentialRampToValueAtTime(300,.32);o.frequency.exponentialRampToValueAtTime(420,.46);o.frequency.exponentialRampToValueAtTime(360,.6);o.connect(g);g.connect(d);o.start(0);o.stop(.7);[783.99,987.77,1174.7,1568,2093].forEach((f,i)=>bell(ctx,d,f,.45+i*.07,.5,.25));sparkle(ctx,d,.6,8,2600,.5,.09)},
  hint(ctx,d){bell(ctx,d,987.77,0,.7,.4);bell(ctx,d,1318.5,.09,.6,.22);sparkle(ctx,d,.15,4,3000,.3,.07)},
  swoosh(ctx,d){noise(ctx,d,{t:0,dur:.28,a:.06,r:.15,peak:.45,f0:400,f1:2600,q:1})},
  tick(ctx,d){tone(ctx,d,{type:'sine',f0:1500,f1:900,t:0,a:.002,h:.01,r:.05,peak:.5});noise(ctx,d,{t:0,dur:.03,r:.02,peak:.25,f0:3000,f1:1500,q:1.2})},
  tock(ctx,d){tone(ctx,d,{type:'square',f0:700,f1:500,t:0,a:.002,h:.015,r:.07,peak:.35});tone(ctx,d,{type:'sine',f0:1400,f1:1000,t:0,a:.002,h:.01,r:.05,peak:.4});noise(ctx,d,{t:0,dur:.035,r:.025,peak:.3,f0:2500,f1:1200,q:1.2})}
};
const LEN={tap:.25,correct:1.2,wrong:.8,reward:2.2,world:1.3,confetti:1,gift:1.4,hint:.9,swoosh:.45,tick:.12,tock:.14};
window.render=async(name,peakTarget)=>{const ctx=ctxFor(LEN[name]);const comp=ctx.createDynamicsCompressor();comp.threshold.value=-10;comp.ratio.value=4;comp.connect(ctx.destination);SFX[name](ctx,comp);const buf=await ctx.startRendering();const d=buf.getChannelData(0);let max=0;for(let i=0;i<d.length;i++)max=Math.max(max,Math.abs(d[i]));const g=max?peakTarget/max:1;const n=d.length;const bytes=44+n*2;const ab=new ArrayBuffer(bytes);const v=new DataView(ab);const w=(o,t)=>{for(let i=0;i<t.length;i++)v.setUint8(o+i,t.charCodeAt(i))};w(0,'RIFF');v.setUint32(4,bytes-8,true);w(8,'WAVE');w(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,SR,true);v.setUint32(28,SR*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);w(36,'data');v.setUint32(40,n*2,true);let o=44;for(let i=0;i<n;i++){const x=Math.max(-1,Math.min(1,d[i]*g));v.setInt16(o,x<0?x*32768:x*32767,true);o+=2}let s='';const u=new Uint8Array(ab);for(let k=0;k<u.length;k+=0x8000)s+=String.fromCharCode.apply(null,u.subarray(k,k+0x8000));return btoa(s)}
window.names=()=>Object.keys(SFX);
</script>`;

const PEAK = { tap: .55, correct: .85, wrong: .7, reward: .9, world: .75, confetti: .8, gift: .85, hint: .6, swoosh: .5, tick: .5, tock: .7 };

(async () => {
  const b = await chromium.launch(); const p = await b.newPage(); await p.setContent(PAGE);
  const all = await p.evaluate(() => window.names());
  const names = process.argv.slice(2).length ? process.argv.slice(2) : all;
  for (const name of names) {
    const wav = await p.evaluate(({ name, peak }) => window.render(name, peak), { name, peak: PEAK[name] });
    const dst = path.join(ROOT, 'assets', 'audio', name + '.wav');
    fs.writeFileSync(dst, Buffer.from(wav, 'base64'));
    console.log(`${name}: ${fs.statSync(dst).size} bytes`);
  }
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
