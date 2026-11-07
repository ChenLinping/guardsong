'use strict';
// Pure deterministic battle logic, independent of DOM and WeChat APIs.
const TROOPS = {
  infantry: {name:'步兵', ammo:110, cd:2.3, damage:48, range:82, radius:24},
  archer: {name:'弓兵', ammo:380, cd:1.5, damage:24, range:310},
  crossbow: {name:'弩兵', ammo:190, cd:2.7, damage:72, range:390},
  stone: {name:'投石', ammo:80, cd:6, damage:65, range:530, radius:58},
  fire: {name:'火器', ammo:55, cd:6.5, damage:30, range:290, radius:45}
};
const ENEMIES = {
  light: {name:'步兵', hp:90, speed:23, damage:9, cd:3},
  armor: {name:'披甲兵', hp:230, speed:18, damage:18, cd:3},
  archer: {name:'敌弓手', hp:110, speed:21, damage:12, cd:4, stop:330},
  siege: {name:'投石车', hp:620, speed:10, damage:95, cd:10, stop:180}
};
const CHAPTERS = [
  {name:'初守襄阳',brief:'轻步兵为主，第二波有敌弓手。',tip:'弓兵清理轻兵，留意弹药。',wall:1500,n:18},
  {name:'铁甲临城',brief:'披甲兵增多，第二、三波出现投石车。',tip:'弩兵破甲，骑兵可绕后突袭器械。',wall:1500,n:24},
  {name:'城下决战',brief:'步兵、披甲兵、弓手与投石车混合进攻。',tip:'陷坑迎击前排，火器清群，伏兵救急。',wall:1600,n:29}
];
const clone = v => JSON.parse(JSON.stringify(v));
class Battle {
  constructor(chapter=0, plan={}) {
    this.chapter=Math.max(0,Math.min(2,chapter)); this.plan=clone(plan);
    this.time=0; this.status='playing'; this.paused=false; this.speed=1; this.seed=1273+chapter;
    this.wall=CHAPTERS[this.chapter].wall; this.maxWall=this.wall;
    this.leaks=0; this.leakLimit=10; this.kills=0; this.serial=0; this.wave=1;
    this.units=[]; this.enemies=[]; this.shots=[]; this.fires=[]; this.fx=[];
    this.ammo={}; Object.keys(TROOPS).forEach(k=>this.ammo[k]=TROOPS[k].ammo);
    this.mobile={cavalry:{state:'ready',hp:700,maxHp:700,x:36,y:720,cd:0,kills:0,damage:0},ambush:{state:'ready',hp:600,maxHp:600,x:450,y:440,cd:0,kills:0,damage:0}};
    this.traps=Array.from({length:plan.traps===false?0:5},(_,i)=>({x:80+i*80,y:545,used:false}));
    this.events=[]; this.notice='守住三波进攻 · 点击底部兵种上阵';
    this.noticeUntil=8; this.focus=null; this.stats={cavalry:0,ambush:0,traps:0};
    for(let w=0;w<3;w++) {
      const n=CHAPTERS[this.chapter].n+w*3;
      for(let i=0;i<n;i++) {
        let type='light';
        if(this.chapter>0&&i%4===2) type='armor';
        if((w>0||this.chapter>0)&&i%7===5) type='archer';
        if(this.chapter>0&&w>0&&i===Math.floor(n*.55)) type='siege';
        if(this.chapter===2&&i===n-3) type='siege';
        this.events.push({at:w*135+8+Math.floor(i/5)*(100/Math.ceil(n/5))+(i%5)*1.1,type,wave:w+1});
      }
    }
    this.queue=0; this.warned={};
  }
  random(){this.seed=(this.seed*1664525+1013904223)>>>0;return this.seed/4294967296;}
  say(s){this.notice=s;this.noticeUntil=this.time+6;}
  deploy(type){
    if(this.status!=='playing'||!TROOPS[type])return false;
    if(this.units.filter(u=>u.state!=='returning').length>=6){this.say('城墙已满：先撤下一队，再调入援军');return false;}
    if(this.ammo[type]<=0){this.say('该兵种物资已耗尽，本场不再补充');return false;}
    this.units.push({id:++this.serial,type,state:'entering',travel:3,cd:0,hp:100,hold:false});
    this.say(TROOPS[type].name+'正在上墙');return true;
  }
  withdraw(type){const u=this.units.slice().reverse().find(u=>u.type===type&&u.state!=='returning');if(!u||this.status!=='playing')return false;u.state='returning';u.travel=2;return true;}
  hold(type){this.units.filter(u=>u.type===type).forEach(u=>u.hold=!u.hold);}
  launch(type){const m=this.mobile[type];if(this.status!=='playing'||!m||m.state!=='ready')return false;m.state=type==='cavalry'?'flanking':'active';m.launched=this.time;m.engaged=false;this.say(type==='cavalry'?'骑兵沿侧路绕后！本场仅此一次':'伏兵现身！本场仅此一次');return true;}
  spawn(type){const d=ENEMIES[type];const x=80+Math.floor(this.random()*5)*80+(this.random()-.5)*28;const e={id:++this.serial,type,x,y:100,hp:d.hp,maxHp:d.hp,cd:2,slow:0};this.enemies.push(e);return e;}
  hit(e,damage,kind){if(e.hp<=0)return;let dealt=damage;if(e.type==='armor'&&kind==='archer')dealt*=.45;if(e.type==='armor'&&kind==='crossbow')dealt*=1.25;if(e.type==='siege'&&kind==='cavalry')dealt*=1.65;const actual=Math.min(e.hp,dealt);e.hp-=dealt;
    if(this.stats[kind]!==undefined)this.stats[kind]+=actual;
    if(this.mobile[kind])this.mobile[kind].damage+=actual;
    this.fx.push({x:e.x,y:e.y-14,text:String(Math.round(dealt)),life:.65,color:kind==='traps'?'#803e28':'#fff0b9'});
    if(e.hp<=0){this.kills++;if(this.mobile[kind])this.mobile[kind].kills++;}
  }
  fire(type,e,unitIndex){const d=TROOPS[type];this.ammo[type]--;this.shots.push({type,x:65+unitIndex*65,y:665,tx:e.x,ty:e.y,id:e.id,t:0,duration:type==='stone'?1:.5,damage:d.damage,radius:d.radius||0});}
  retreat(){if(this.status==='playing'){this.status='lost';this.reason='主动撤退，返回备战调整';}}
  update(dt){
    if(this.status!=='playing'||this.paused)return;
    dt=Math.min(.1,Math.max(0,dt));this.time+=dt;this.wave=Math.min(3,1+Math.floor(this.time/135));
    while(this.queue<this.events.length&&this.events[this.queue].at<=this.time)this.spawn(this.events[this.queue++].type);
    const nextSiege=this.events.slice(this.queue).find(e=>e.type==='siege');
    if(nextSiege&&nextSiege.at-this.time<9&&!this.warned[nextSiege.at]){this.say('斥候急报：投石车即将抵达！');this.warned[nextSiege.at]=true;}
    for(const u of this.units){if(u.state!=='active'){u.travel-=dt;if(u.travel<=0)u.state=u.state==='entering'?'active':'gone';}}
    this.units=this.units.filter(u=>u.state!=='gone');
    // Mobile forces use the same HP and targeting model as enemy units, with finite sorties.
    for(const kind of ['cavalry','ambush']){
      const m=this.mobile[kind];if(m.hp<=0&&['active','flanking'].includes(m.state)){m.state='defeated';continue;}
      if(m.state==='flanking'){m.y-=65*dt;if(m.y<=145){m.y=145;m.state='active';}continue;}
      if(m.state!=='active')continue;
      let live=this.enemies.filter(e=>e.hp>0);
      live.sort((a,b)=>kind==='cavalry'?((b.type==='siege'?1000: b.type==='archer'?500:0)-b.y)-((a.type==='siege'?1000:a.type==='archer'?500:0)-a.y):Math.hypot(a.x-m.x,a.y-m.y)-Math.hypot(b.x-m.x,b.y-m.y));
      const e=live[0];if(!e){if(m.engaged||this.time-m.launched>12){m.state='returned';this.say(kind==='cavalry'?'骑兵完成本次出击，已撤离':'伏兵完成截击，已撤离');}continue;}
      const distance=Math.hypot(e.x-m.x,e.y-m.y);if(distance>30){const step=Math.min(distance-30,dt*(kind==='cavalry'?75:38));m.x+=(e.x-m.x)/distance*step;m.y+=(e.y-m.y)/distance*step;}
      m.cd-=dt;if(distance<45&&m.cd<=0){m.engaged=true;const damage=kind==='cavalry'?105:66;this.enemies.filter(t=>t.hp>0&&Math.hypot(t.x-e.x,t.y-e.y)<42).forEach(t=>this.hit(t,damage,kind));m.cd=1.8;}
    }
    for(const e of this.enemies){
      if(e.hp<=0)continue;const d=ENEMIES[e.type];e.slow=Math.max(0,e.slow-dt);e.cd-=dt;
      const victim=Object.values(this.mobile).find(m=>m.state==='active'&&m.hp>0&&Math.hypot(m.x-e.x,m.y-e.y)<(e.type==='archer'?170:55));
      if(victim){if(e.cd<=0){victim.hp=Math.max(0,victim.hp-d.damage*2);e.cd=d.cd;}continue;}
      const stop=d.stop||(this.wall>0?620:760);
      if(e.y<stop)e.y+=d.speed*dt*(e.slow>0?.35:1);
      else if(!d.stop&&this.wall<=0){e.hp=0;this.leaks++;continue;}
      else if(e.cd<=0){this.wall=Math.max(0,this.wall-d.damage);e.cd=d.cd;this.fx.push({x:240,y:635,text:'城防 −'+d.damage,life:.8,color:'#a53825'});}
      if(!d.stop){const trap=this.traps.find(t=>!t.used&&Math.abs(e.x-t.x)<37&&Math.abs(e.y-t.y)<17);if(trap){trap.used=true;e.slow=2;this.hit(e,165,'traps');this.say('陷坑触发！剩余 '+this.traps.filter(t=>!t.used).length+' 处');}}
    }
    for(let i=0;i<this.units.length;i++){
      const u=this.units[i];u.cd-=dt;if(u.state!=='active'||u.hold||u.cd>0||this.ammo[u.type]<=0)continue;
      const d=TROOPS[u.type];let live=this.enemies.filter(e=>e.hp>0&&665-e.y<d.range&&e.y<745);
      live.sort((a,b)=>b.y-a.y);const focus=live.find(e=>e.id===this.focus);
      const target=focus||(u.type==='crossbow'?live.find(e=>e.type==='armor'):null)||live[0];
      if(target){this.fire(u.type,target,i%6);const support=this.units.some(v=>v.type==='infantry'&&v.state==='active'&&!v.hold);u.cd=d.cd*(support&&u.type!=='infantry'?.85:1);}
    }
    for(const p of this.shots){p.t+=dt;if(p.t<p.duration)continue;
      if(p.type==='fire'){this.fires.push({x:p.tx,y:p.ty,r:p.radius,life:4,tick:0});}
      else if(p.radius){this.enemies.filter(e=>e.hp>0&&Math.hypot(e.x-p.tx,e.y-p.ty)<p.radius).forEach(e=>this.hit(e,p.damage,p.type));}
      else{const e=this.enemies.find(e=>e.id===p.id);if(e)this.hit(e,p.damage,p.type);}
    }
    this.shots=this.shots.filter(p=>p.t<p.duration);
    for(const f of this.fires){f.life-=dt;f.tick-=dt;if(f.tick<=0){this.enemies.filter(e=>e.hp>0&&Math.hypot(e.x-f.x,e.y-f.y)<f.r).forEach(e=>this.hit(e,18,'fire'));f.tick=.5;}}
    this.fires=this.fires.filter(f=>f.life>0);this.enemies=this.enemies.filter(e=>e.hp>0);
    this.fx.forEach(f=>{f.life-=dt;f.y-=12*dt;});this.fx=this.fx.filter(f=>f.life>0).slice(-100);
    if(this.leaks>=this.leakLimit){this.status='lost';this.reason='突入城内的敌军达到上限';}
    else if(this.queue===this.events.length&&!this.enemies.length)this.status='won';
  }
  snapshot(){return {version:1,data:clone(this)};}
  static restore(snapshot){if(!snapshot||snapshot.version!==1||!snapshot.data||!Number.isFinite(snapshot.data.time))return null;const b=new Battle(snapshot.data.chapter);Object.assign(b,clone(snapshot.data));b.paused=true;return b;}
}
module.exports={Battle,TROOPS,ENEMIES,CHAPTERS};
