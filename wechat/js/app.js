'use strict';
const {Battle}=require('./core');const {View}=require('./view');
const {ArcheryStudy}=require('./archery');
class App {
  constructor(platform){this.p=platform;this.view=new View(platform.canvas);this.chapter=0;this.traps=true;this.screen='menu';this.dialog=null;this.battle=null;this.last=0;this.savedAt=0;this.hidden=false;this.stopped=false;
    try{this.resume=Battle.restore(platform.load());}catch(e){this.resume=null;}
    this.resize();platform.onTouch((x,y)=>this.touch(x,y));platform.onHide(()=>{this.hidden=true;if(this.study)this.study.paused=true;if(this.battle&&this.battle.status==='playing'){this.battle.paused=true;this.persist();}});platform.onShow(()=>{this.hidden=false;this.last=0;this.resize();});platform.onResize(()=>this.resize());this.frame=this.frame.bind(this);
  }
  resize(){const w=this.p.window();this.view.resize(w.width,w.height,w.dpr,w.top,w.bottom);}
  persist(){if(this.battle&&this.battle.status==='playing')this.p.save(this.battle.snapshot());else this.p.save(null);}
  start(){this.p.raf(this.frame);}
  frame(now){if(this.stopped)return;const dt=this.last?Math.max(0,Math.min(.1,(now-this.last)/1000)):0;this.last=now;
    if(!this.hidden&&this.screen==='study'&&this.study)this.study.update(dt);
    if(!this.hidden&&this.screen==='battle'&&this.battle&&!this.dialog){for(let i=0;i<this.battle.speed;i++)this.battle.update(dt);if(this.battle.status!=='playing'){this.screen='result';this.persist();this.resume=null;}}
    if(now-this.savedAt>5000&&this.screen==='battle'){this.persist();this.savedAt=now;}
    if(!this.hidden)this.view.draw(this);this.p.raf(this.frame);
  }
  touch(x,y){const q=this.view.point(x,y),btn=this.view.hit(q.x,q.y);if(btn){this.action(btn.id);this.view.draw(this);return;}
    if(this.screen==='battle'&&!this.dialog){const e=this.battle.enemies.filter(e=>Math.hypot(e.x-q.x,e.y-q.y)<32).sort((a,b)=>Math.hypot(a.x-q.x,a.y-q.y)-Math.hypot(b.x-q.x,b.y-q.y))[0];if(e){this.battle.focus=e.id;this.battle.say('已指定集火目标');}}
  }
  action(id){const b=this.battle;
    if(id==='study'){this.study=new ArcheryStudy(this.p.createSurface);this.screen='study';this.dialog=null;}
    else if(id.startsWith('study:')&&this.study)this.study.action(id);
    else if(id.startsWith('chapter:'))this.chapter=Number(id.split(':')[1]);
    else if(id==='prepare'){this.screen='prepare';this.dialog=null;}
    else if(id==='traps')this.traps=!this.traps;
    else if(id==='start'){this.battle=new Battle(this.chapter,{traps:this.traps});this.screen='battle';this.resume=null;this.persist();}
    else if(id==='menu'){this.screen='menu';if(b&&b.status==='playing')this.resume=Battle.restore(b.snapshot());}
    else if(id==='help')this.dialog='help';
    else if(id==='close')this.dialog=null;
    else if(id==='resume'&&this.resume){this.battle=this.resume;this.chapter=this.battle.chapter;this.screen='battle';this.battle.paused=true;}
    else if(id==='next'){this.chapter=Math.min(2,this.chapter+1);this.screen='prepare';}
    else if(b&&this.screen==='battle'){
      if(id==='pause')b.paused=!b.paused;
      else if(id==='speed')b.speed=b.speed===1?2:b.speed===2?4:1;
      else if(id==='retreat')this.dialog='retreat';
      else if(id==='confirmRetreat'){b.retreat();this.dialog=null;this.screen='result';this.resume=null;this.persist();}
      else if(id==='cavalry'||id==='ambush')b.launch(id);
      else if(id.startsWith('plus:'))b.deploy(id.split(':')[1]);
      else if(id.startsWith('minus:'))b.withdraw(id.split(':')[1]);
      else if(id.startsWith('hold:'))b.hold(id.split(':')[1]);
    }
  }
}
module.exports={App};
