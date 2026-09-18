import {BEAT,MELODY,BASS,frequency} from './music.js';
export class GameAudio {
 constructor(){this.enabled=true;this.volume=.4;this.context=null;this.nodes=new Set();this.musicNodes=new Set();this.musicEnabled=true;this.musicVolume=.24;this.musicPlaying=false;this.musicStep=0;this.nextBeat=0;}
 async unlock(){try{this.context??=new(window.AudioContext||window.webkitAudioContext)();await this.context.resume();}catch{}}
 tone(freq,time=.12,type='sine',gain=.15,slide=1,delay=0,music=false){if(!this.enabled||this.volume<=0||!this.context||this.context.state!=='running')return;const c=this.context,t=c.currentTime+delay,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);o.frequency.exponentialRampToValueAtTime(Math.max(30,freq*slide),t+time);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(gain*this.volume*(music?this.musicVolume:1),t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+time);o.connect(g).connect(c.destination);this.nodes.add(o);if(music)this.musicNodes.add(o);o.onended=()=>{this.nodes.delete(o);this.musicNodes.delete(o);o.disconnect();g.disconnect();};o.start(t);o.stop(t+time+.03);}
 noise(time=.08,gain=.05,delay=0,music=false){if(!this.enabled||this.volume<=0||!this.context||this.context.state!=='running')return;const c=this.context,t=c.currentTime+delay,b=c.createBuffer(1,Math.ceil(c.sampleRate*time),c.sampleRate),data=b.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*(1-i/data.length);const src=c.createBufferSource(),filter=c.createBiquadFilter(),amp=c.createGain();filter.type='highpass';filter.frequency.value=music?4200:800;src.buffer=b;amp.gain.setValueAtTime(gain*this.volume*(music?this.musicVolume:1),t);amp.gain.exponentialRampToValueAtTime(.0001,t+time);src.connect(filter).connect(amp).connect(c.destination);this.nodes.add(src);if(music)this.musicNodes.add(src);src.onended=()=>{this.nodes.delete(src);this.musicNodes.delete(src);src.disconnect();filter.disconnect();amp.disconnect();};src.start(t);src.stop(t+time+.01);}
 updateMusic(active){const should=active&&this.enabled&&this.musicEnabled&&this.context?.state==='running';if(!should){this.stopMusic();return;}const c=this.context;if(!this.musicPlaying){this.musicPlaying=true;this.nextBeat=c.currentTime+.02;}if(this.nextBeat<c.currentTime-.1)this.nextBeat=c.currentTime+.02;while(this.nextBeat<c.currentTime+.12){const n=this.musicStep%64,delay=Math.max(0,this.nextBeat-c.currentTime);this.tone(frequency(MELODY[n]),.15,'triangle',.18,1,delay,true);if(n%2===0)this.tone(frequency(BASS[Math.floor(n/8)]),.21,'triangle',.27,1,delay,true);if(n%4===0)this.tone(120,.13,'sine',.32,.27,delay,true);if(n%4===2)this.noise(.095,.16,delay,true);this.noise(.026,.055,delay,true);this.musicStep++;this.nextBeat+=BEAT;}}
 stopMusic(){for(const node of this.musicNodes){try{node.stop();}catch{}this.nodes.delete(node);}this.musicNodes.clear();this.musicPlaying=false;}
 play(kind,streak=0){
 if(kind==='coin'){const f=880*Math.pow(2,Math.min(streak%10,7)/12);this.tone(f,.09,'sine',.13);this.tone(f*1.5,.13,'sine',.09,1,.05);}
 else if(kind==='gold'||kind==='combo')[1046,1318,1568,2093].forEach((f,i)=>this.tone(f,.18,'sine',.12,1,i*.07));
 else if(kind==='magnet'){this.tone(220,.45,'triangle',.12,4);this.tone(880,.25,'sine',.1,1,.25);}
 else if(kind==='shield'||kind==='block'){this.tone(392,.3,'sine',.13,1.5);this.tone(784,.3,'sine',.09,1,.07);}
 else if(kind==='jump'){this.tone(190,.24,'triangle',.13,4);this.noise(.20,.06);this.tone(850,.13,'sine',.07,.6,.15);}
 else if(kind==='clear'){this.tone(784,.12,'triangle',.09);this.tone(1046,.17,'sine',.1,1,.08);}
 else if(kind==='hit'){this.tone(140,.2,'sine',.22,.25);this.noise(.12,.11);}
 else if(kind==='double'){[523,784,1046,1568,2093].forEach((f,i)=>this.tone(f,.23,'triangle',.12,1,i*.075));this.noise(.18,.05);}
 else if(kind==='land'){this.tone(100,.07,'sine',.12,.5);this.noise(.045,.045);}
 else if(kind==='finish'){[523,659,784,1046,784,1046,1318].forEach((f,i)=>this.tone(f,.3,'triangle',.09,1,i*.13));}
 else if(kind==='card'){[659,988,1318,1976].forEach((f,i)=>this.tone(f,.35,'sine',.1,1,i*.12));}
 else if(kind==='tick')this.tone(700,.075,'sine',.1);
 else if(kind==='step')this.tone(95,.035,'triangle',.035,.65);
 else if(kind==='count')this.tone(1100,.045,'sine',.05);
 else this.tone(490,.065,'sine',.06);
 }

 stop(){this.stopMusic();for(const n of this.nodes){try{n.stop();}catch{}}this.nodes.clear();}
 destroy(){this.stop();void this.context?.close();this.context=null;}
}
