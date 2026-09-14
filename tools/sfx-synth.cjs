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
function bell(ctx,dest,f,t,r=.5,peak=.4){tone(ctx,dest,{f0:f,t,r,peak});tone(ctx,dest,{f0:f*2.01,t,r:r*.5,peak:peak*.22});tone(ctx,dest,{f0:f*.5,t,r:r*.8,peak:peak*.3})}
function noise(ctx,dest,{t,dur,a=.002,r,peak=.5,type='bandpass',f0,f1,q=1}){const b=ctx.createBuffer(1,Math.ceil((dur+.1)*SR),SR);const d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;const s=ctx.createBufferSource();s.buffer=b;const fl=ctx.createBiquadFilter();fl.type=type;fl.Q.value=q;fl.frequency.setValueAtTime(f0,t);if(f1)fl.frequency.exponentialRampToValueAtTime(f1,t+dur);const g=ctx.createGain();env(g,t,a,Math.max(0,dur-a-r),r,peak);s.connect(fl);fl.connect(g);g.connect(dest);s.start(t);s.stop(t+dur+.1)}
function sparkle(ctx,dest,t,n=6,base=1800,span=.35,peak=.12){for(let i=0;i<n;i++){const f=base*Math.pow(2,(Math.random()*14|0)/12);bell(ctx,dest,f,t+i*(span/n)+Math.random()*.02,.25,peak)}}
const SFX={
  // A tap is a tiny soft "tup": 35 ms, low, never a click that tires the ear.
  tap(ctx,d){noise(ctx,d,{t:0,dur:.03,r:.02,peak:.3,f0:900,f1:400,q:1.2});tone(ctx,d,{f0:520,f1:300,t:0,a:.002,h:.006,r:.035,peak:.4,type:'sine'})},
  // Entering a world: a short brass-like fanfare (three rising chords and a
  // held top), warm sawtooth stacks with no high sparkles.
  fanfare(ctx,d){const chords=[[261.63,329.63,392],[293.66,369.99,440],[329.63,415.3,493.88],[392,493.88,587.33,783.99]];chords.forEach((c,i)=>{const t=i*.16,hold=i===3?.55:.11;c.forEach(f=>{tone(ctx,d,{type:'sawtooth',f0:f,t,a:.015,h:hold,r:.25,peak:.1,detune:-7});tone(ctx,d,{type:'sawtooth',f0:f,t,a:.015,h:hold,r:.25,peak:.1,detune:7});tone(ctx,d,{type:'triangle',f0:f/2,t,a:.01,h:hold,r:.2,peak:.06})})});noise(ctx,d,{t:.48,dur:.06,r:.05,peak:.5,f0:1500,f1:300,q:.8});tone(ctx,d,{type:'sine',f0:98,f1:65,t:.48,a:.005,h:.08,r:.35,peak:.4})},
  correct(ctx,d){const notes=[392,523.25,659.25];notes.forEach((f,i)=>bell(ctx,d,f,i*.09,.6,.42));tone(ctx,d,{f0:783.99,t:.28,a:.03,h:.2,r:.5,peak:.14,type:'sine'})},
  wrong(ctx,d){tone(ctx,d,{type:'triangle',f0:392,f1:370,t:0,a:.01,h:.12,r:.12,peak:.42});tone(ctx,d,{type:'triangle',f0:311,f1:262,t:.24,a:.01,h:.16,r:.2,peak:.42});tone(ctx,d,{type:'sine',f0:196,f1:131,t:.24,a:.01,h:.16,r:.2,peak:.2})},
  reward(ctx,d){const chords=[[523.25,659.25,783.99],[587.33,739.99,880],[659.25,830.61,987.77,1318.5]];chords.forEach((c,i)=>c.forEach(f=>{tone(ctx,d,{type:'sawtooth',f0:f,t:i*.19,a:.01,h:.1,r:.2,peak:.09,detune:-6});tone(ctx,d,{type:'sawtooth',f0:f,t:i*.19,a:.01,h:.1,r:.2,peak:.09,detune:6});tone(ctx,d,{type:'square',f0:f/2,t:i*.19,a:.01,h:.1,r:.15,peak:.04})}));[523.25,659.25,783.99,1046.5].forEach((f,i)=>bell(ctx,d,f,.6+i*.09,.8,.3));noise(ctx,d,{t:.58,dur:.05,r:.03,peak:.6,f0:1200,f1:300,q:.8});noise(ctx,d,{t:.62,dur:.9,a:.01,r:.6,peak:.03,f0:4000,type:'highpass'})},
  world(ctx,d){noise(ctx,d,{t:0,dur:.9,a:.25,r:.45,peak:.35,f0:250,f1:2600,q:1.2});tone(ctx,d,{type:'sine',f0:260,f1:780,t:.05,a:.3,h:.2,r:.45,peak:.14});bell(ctx,d,523.25,.55,.7,.18)},
  confetti(ctx,d){noise(ctx,d,{t:0,dur:.04,r:.03,peak:.9,f0:900,f1:200,q:.7});tone(ctx,d,{type:'sine',f0:160,f1:60,t:0,a:.002,h:.02,r:.1,peak:.5});noise(ctx,d,{t:.03,dur:.7,a:.02,r:.5,peak:.1,f0:3500,type:'highpass'})},
  gift(ctx,d){const o=ctx.createOscillator();o.type='sine';const g=ctx.createGain();env(g,0,.01,.35,.25,.4);o.frequency.setValueAtTime(180,0);o.frequency.exponentialRampToValueAtTime(520,.18);o.frequency.exponentialRampToValueAtTime(300,.32);o.frequency.exponentialRampToValueAtTime(420,.46);o.frequency.exponentialRampToValueAtTime(360,.6);o.connect(g);g.connect(d);o.start(0);o.stop(.7);[523.25,659.25,783.99,1046.5].forEach((f,i)=>bell(ctx,d,f,.45+i*.09,.6,.24))},
  hint(ctx,d){bell(ctx,d,659.25,0,.8,.4);bell(ctx,d,783.99,.12,.7,.2)},
  swoosh(ctx,d){noise(ctx,d,{t:0,dur:.28,a:.06,r:.15,peak:.45,f0:400,f1:2600,q:1})},
  // Clock ticks: a soft wooden "tk" (filtered click + low thump), never a whistle.
  tick(ctx,d){noise(ctx,d,{t:0,dur:.028,r:.02,peak:.55,f0:900,f1:500,q:2.5});tone(ctx,d,{type:'sine',f0:240,f1:150,t:0,a:.002,h:.008,r:.06,peak:.35})},
  tock(ctx,d){noise(ctx,d,{t:0,dur:.034,r:.024,peak:.7,f0:1200,f1:600,q:2.2});tone(ctx,d,{type:'triangle',f0:320,f1:180,t:0,a:.002,h:.01,r:.08,peak:.45})}
};
const LEN={tap:.1,fanfare:1.5,correct:1.2,wrong:.8,reward:2.2,world:1.3,confetti:1,gift:1.4,hint:.9,swoosh:.45,tick:.12,tock:.14};
window.render=async(name,peakTarget)=>{const ctx=ctxFor(LEN[name]);const comp=ctx.createDynamicsCompressor();comp.threshold.value=-10;comp.ratio.value=4;comp.connect(ctx.destination);SFX[name](ctx,comp);const buf=await ctx.startRendering();const d=buf.getChannelData(0);let max=0;for(let i=0;i<d.length;i++)max=Math.max(max,Math.abs(d[i]));const g=max?peakTarget/max:1;const n=d.length;const bytes=44+n*2;const ab=new ArrayBuffer(bytes);const v=new DataView(ab);const w=(o,t)=>{for(let i=0;i<t.length;i++)v.setUint8(o+i,t.charCodeAt(i))};w(0,'RIFF');v.setUint32(4,bytes-8,true);w(8,'WAVE');w(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,SR,true);v.setUint32(28,SR*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);w(36,'data');v.setUint32(40,n*2,true);let o=44;for(let i=0;i<n;i++){const x=Math.max(-1,Math.min(1,d[i]*g));v.setInt16(o,x<0?x*32768:x*32767,true);o+=2}let s='';const u=new Uint8Array(ab);for(let k=0;k<u.length;k+=0x8000)s+=String.fromCharCode.apply(null,u.subarray(k,k+0x8000));return btoa(s)}
window.names=()=>Object.keys(SFX);
</script>`;

const PEAK = { tap: .3, fanfare: .9, correct: .85, wrong: .7, reward: .9, world: .75, confetti: .8, gift: .85, hint: .6, swoosh: .5, tick: .4, tock: .55 };

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
