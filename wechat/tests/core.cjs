const assert=require('node:assert/strict');
const {Battle,TROOPS}=require('../js/core');
let passed=0;function test(name,fn){fn();passed++;console.log('PASS',name);}
function run(b,s){for(let t=0;t<s;t+=.05)b.update(.05);}
test('Deployment cap and no paused travel',()=>{const b=new Battle();for(let i=0;i<6;i++)assert(b.deploy('archer'));assert(!b.deploy('archer'));b.paused=true;run(b,5);assert.equal(b.time,0);assert.equal(b.units[0].state,'entering');b.paused=false;run(b,3.2);assert.equal(b.units[0].state,'active');});
test('Strict ammo: redeployment does not refill; hold stops shooting',()=>{const b=new Battle();b.events=[{at:999,type:"light"}];b.deploy('archer');const e=b.spawn('siege');e.y=400;e.hp=99999;run(b,12);const a=b.ammo.archer;assert(a<TROOPS.archer.ammo);b.hold('archer');run(b,5);assert.equal(b.ammo.archer,a);b.withdraw('archer');run(b,3);b.deploy('archer');assert.equal(b.ammo.archer,a);b.ammo.archer=1;run(b,10);assert.equal(b.ammo.archer,0);const n=b.shots.length;run(b,4);assert.equal(b.shots.length,0);assert(!b.deploy('archer'));});
test('Both mobile forces are finite, take losses and never respawn',()=>{for(const k of ['cavalry','ambush']){const b=new Battle();assert(b.launch(k));assert(!b.launch(k));b.mobile[k].state='active';b.mobile[k].hp=1;b.mobile[k].x=200;b.mobile[k].y=300;const e=b.spawn('armor');e.x=200;e.y=300;e.cd=0;run(b,.2);assert.equal(b.mobile[k].state,'defeated');assert(!b.launch(k));}});
test('Mobile forces actually damage enemies',()=>{for(const k of ['cavalry','ambush']){const b=new Battle();b.events=[{at:999,type:"light"}];b.launch(k);Object.assign(b.mobile[k],{state:'active',x:200,y:300});const e=b.spawn('siege');e.x=200;e.y=300;run(b,2);assert(b.stats[k]>0);}});
test('Trap triggers damage once; spent pit cannot hurt another enemy',()=>{const b=new Battle();b.events=[{at:999,type:"light"}];const e=b.spawn('light');e.x=80;e.y=540;run(b,.1);assert(b.traps[0].used);assert.equal(b.kills,1);const f=b.spawn('light');f.x=80;f.y=540;run(b,.1);assert.equal(f.hp,90);assert.equal(b.traps.filter(t=>t.used).length,1);});
test('Breach is not defeat; every enemy counts exactly one leak',()=>{const b=new Battle();b.events=[{at:999,type:"light"}];b.wall=0;run(b,1);assert.equal(b.status,'playing');for(let i=0;i<10;i++){let e=b.spawn(i%2?'armor':'light');e.y=761;run(b,.1);}assert.equal(b.leaks,10);assert.equal(b.status,'lost');});
test('Snapshot retains resources and consumed tactics, resumes paused',()=>{const b=new Battle(2);b.deploy('fire');b.launch('cavalry');b.traps[0].used=true;b.ammo.fire=12;run(b,4);const c=Battle.restore(JSON.parse(JSON.stringify(b.snapshot())));assert.equal(c.mobile.cavalry.state,b.mobile.cavalry.state);assert.equal(c.ammo.fire,12);assert(c.traps[0].used);assert(c.paused);assert.equal(c.time,b.time);assert.equal(Battle.restore({version:8}),null);});
test('Retreat and retry restore initial state without mutation',()=>{const b=new Battle(1);b.launch('ambush');b.ammo.stone=0;b.retreat();assert.equal(b.status,'lost');const retry=new Battle(b.chapter,b.plan);assert.equal(retry.ammo.stone,TROOPS.stone.ammo);assert.equal(retry.mobile.ambush.state,'ready');});
test('No enemies in range means no wasted ammo',()=>{const b=new Battle();b.events=[{at:999,type:"light"}];b.deploy('fire');run(b,15);assert.equal(b.ammo.fire,TROOPS.fire.ammo);});
const results=[];
for(let ch=0;ch<3;ch++){
 const b=new Battle(ch);['archer','archer','crossbow','stone','fire','infantry'].forEach(k=>b.deploy(k));
 for(let t=0;t<650&&b.status==='playing';t+=.05){if(b.enemies.some(e=>e.type==='siege'))b.launch('cavalry');if(b.enemies.filter(e=>e.y>430).length>=4)b.launch('ambush');b.update(.05);}
 results.push({chapter:ch+1,status:b.status,time:Math.round(b.time),wall:Math.round(b.wall),kills:b.kills,leaks:b.leaks,ammo:b.ammo});
 assert.equal(b.status,'won','Chapter '+ch+' not winnable');
 assert(b.time>=360&&b.time<=480,'Should finish in 6–8 minutes');
}
console.log(JSON.stringify({passed,simulations:results},null,2));
