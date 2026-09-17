export const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function random(seed){let s=seed>>>0;return()=>{s+=0x6D2B79F5;let t=s;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
export function createRun({duration=40,easy=false,seed=Date.now()}={}){return {duration:clamp(Number(duration)||40,30,45),easy,seed,random:random(seed),time:0,distance:0,lane:1,x:1,jump:0,buffer:0,cooldown:0,coins:0,collectedCard:false,items:[],nextRow:.5,row:0,done:false,hits:0,streak:0,bestStreak:0,magnet:0,double:0,doubleCoins:0,shield:0,bonusCoins:0,pickups:0,jumpsCleared:0};}
export function move(s,d){if(!s.done)s.lane=clamp(s.lane+d,0,2);}
export function jump(s){if(s.done)return false;if(s.jump<=0){s.jump=.92;return true;}s.buffer=.13;return false;}
export const height=s=>s.jump>0?Math.sin((1-s.jump/.92)*Math.PI):0;
export function step(s,dt){const events=[];if(s.done)return events;dt=clamp(dt,0,.05);s.time=Math.min(s.duration,s.time+dt);s.cooldown=Math.max(0,s.cooldown-dt);s.magnet=Math.max(0,s.magnet-dt);s.double=Math.max(0,s.double-dt);s.buffer=Math.max(0,s.buffer-dt);const wasJumping=s.jump>0;s.jump=Math.max(0,s.jump-dt);if(wasJumping&&!s.jump)events.push({type:'land'});if(!s.jump&&s.buffer>0){jump(s);s.buffer=0;}s.x+=(s.lane-s.x)*(1-Math.exp(-19*dt));
const speed=(s.easy?.26:.31)*(s.cooldown>.5?.75:1);s.distance+=speed*dt;
if(s.time>=s.nextRow&&s.time<s.duration-4.5){s.nextRow+=s.easy?1.65:1.3;s.row++;const lane=Math.floor(s.random()*3);const add=(kind,lane,z=0)=>s.items.push({kind,lane,z,resolved:false});add('coin',lane);add('coin',lane,-.065);add(s.row%5===0?'gold':'coin',lane,-.13);if(s.row===2||s.row===13)add('magnet',lane,-.22);if(s.row===8||s.row===19)add('double',lane,-.22);if(s.row===5||s.row===17)add('shield',lane,-.22);if(s.row>2){const block=(lane+1+Math.floor(s.random()*2))%3;add(s.row%3===0?'rock':'log',block);}if(s.row===9)add('card',(lane+2)%3,-.23);}
for(const item of s.items){const before=item.z;item.z+=dt*speed;if(s.easy&&item.kind==='log'&&!item.resolved&&item.z>.86&&item.z<.94&&Math.abs(s.x-item.lane)<.38&&!s.jump){jump(s);events.push({type:'jump'});}const collectible=['coin','gold'].includes(item.kind);
const attracted=s.magnet>0&&collectible&&item.z>.79;
if(((before<1&&item.z>=1)||attracted)&&!item.resolved){item.resolved=true;
if(Math.abs(s.x-item.lane)<.39||attracted){
if(collectible){const baseValue=item.kind==='gold'?5:1,value=baseValue*(s.double>0?2:1);s.doubleCoins+=value-baseValue;s.coins+=value;s.streak++;s.bestStreak=Math.max(s.bestStreak,s.streak);events.push({type:item.kind,lane:attracted?s.x:item.lane,streak:s.streak,value});if(s.streak%10===0){s.coins+=5;s.bonusCoins+=5;events.push({type:'combo',lane:s.x,value:5,streak:s.streak});}}
else if(item.kind==='magnet'){s.magnet=7;s.pickups++;events.push({type:'magnet',lane:item.lane});}
else if(item.kind==='double'){s.double=6;s.pickups++;events.push({type:'double',lane:item.lane});}
else if(item.kind==='shield'){s.shield=1;s.pickups++;events.push({type:'shield',lane:item.lane});}
else if(item.kind==='card'){s.collectedCard=true;events.push({type:'card',lane:item.lane});}
else if(item.kind==='log'&&height(s)>.27){s.jumpsCleared++;events.push({type:'clear',lane:item.lane});}
else if(!s.cooldown){if(s.shield){s.shield=0;s.cooldown=.25;events.push({type:'block',lane:item.lane});}else{s.cooldown=1.1;s.hits++;s.streak=0;events.push({type:'hit',lane:item.lane});}}
}else if(collectible)s.streak=0;
}}

s.items=s.items.filter(i=>i.z<1.28);if(s.time>=s.duration){s.done=true;events.push({type:'finish'});}return events;}
export function result(s,runId,theme){return Object.freeze({version:1,game:'jungle-runner',runId,theme,seed:s.seed,coins:s.coins,cardId:s.collectedCard?'jungle-leaf':null,durationMs:Math.round(s.duration*1000),completed:true,stats:Object.freeze({bestStreak:s.bestStreak,bonusCoins:s.bonusCoins,doubleCoins:s.doubleCoins,pickups:s.pickups,jumpsCleared:s.jumpsCleared}),finishedAt:Date.now()});}
