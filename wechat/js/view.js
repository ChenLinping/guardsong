'use strict';
const A=require('./art');
const {TROOPS,CHAPTERS}=require('./core');
const W=480,H=900;
const COLORS={ink:'#223d37',gold:'#d2b474',paper:'#efe3c4',cream:'#fff4d5',red:'#9d4938'};
class View {
  constructor(canvas){this.canvas=canvas;this.c=canvas.getContext('2d');this.buttons=[];this.s=1;this.ox=0;this.oy=0;}
  resize(width,height,dpr,safeTop=0,safeBottom=height){this.width=width;this.height=height;this.dpr=Math.min(dpr||1,2);this.canvas.width=Math.round(width*this.dpr);this.canvas.height=Math.round(height*this.dpr);this.s=Math.min(width/W,(safeBottom-safeTop)/H);this.ox=(width-W*this.s)/2;this.oy=safeTop+(safeBottom-safeTop-H*this.s)/2;}
  point(x,y){return {x:(x-this.ox)/this.s,y:(y-this.oy)/this.s};}
  rect(x,y,w,h,color){this.c.fillStyle=color;this.c.fillRect(x,y,w,h);}
  text(t,x,y,size=14,color=COLORS.ink,align='left'){this.c.fillStyle=color;this.c.font=`${size>=20?'bold ':''}${size}px sans-serif`;this.c.textAlign=align;this.c.fillText(t,x,y);}
  button(id,x,y,w,h,label,active=true,accent=false){this.rect(x,y,w,h,active?(accent?COLORS.red:COLORS.ink):'#777b69');this.c.strokeStyle=COLORS.gold;this.c.lineWidth=1;this.c.strokeRect(x+.5,y+.5,w-1,h-1);this.text(label,x+w/2,y+h/2+5,15,COLORS.cream,'center');this.buttons.push({id,x,y,w,h,active});}
  begin(){const c=this.c;c.setTransform(this.dpr,0,0,this.dpr,0,0);this.rect(0,0,this.width,this.height,'#152b26');c.translate(this.ox,this.oy);c.scale(this.s,this.s);this.buttons=[];this.rect(0,0,W,H,COLORS.paper);}
  terrain(b){const c=this.c;
    this.rect(0,95,480,540,'#bdb98c');
    A.poly(c,[[160,95],[300,95],[390,635],[90,635]],'#d2c39e');
    let seed=1273;for(let i=0;i<210;i++){seed=(seed*1664525+1013904223)>>>0;let x=seed%480;seed=(seed*1664525+1013904223)>>>0;let y=100+seed%525;this.rect(x,y,2,2,i%2?'#94a17b':'#b4ac82');}
    for(const x of [15,455])for(let y=125;y<480;y+=76){A.circle(c,x,y,23,'#798967');A.circle(c,x-9,y-9,17,'#899771');A.circle(c,x+11,y-9,15,'#6e8465');}
    for(const t of b.traps){if(t.used){A.poly(c,[[t.x-19,t.y],[t.x-9,t.y-9],[t.x+17,t.y-5],[t.x+22,t.y+8],[t.x-15,t.y+9]],'#817457');}else{A.poly(c,[[t.x-24,t.y-12],[t.x+24,t.y-12],[t.x+21,t.y+12],[t.x-22,t.y+12]],'#93824c','#695c3b');for(let k=-20;k<24;k+=5)A.line(c,t.x+k,t.y-9,t.x+k+4,t.y+10,'#d5bc76',2);this.text('陷',t.x,t.y+5,12,'#fff2be','center');}}
    this.text('预埋陷坑 '+b.traps.filter(t=>!t.used).length+'/'+b.traps.length,16,590,12,'#584e37');
    this.rect(0,625,480,115,'#a5a895');
    for(let y=632;y<735;y+=23)for(let x=(y%2?0:-20);x<480;x+=42){c.strokeStyle='#88927f';c.strokeRect(x,y,42,23);}
    for(let x=0;x<480;x+=32){this.rect(x,619,23,15,'#7c8d7c');this.rect(x,617,23,5,'#d1ccb0');}
    if(b.wall<=0){this.rect(205,617,70,124,'#aa9774');A.poly(c,[[205,623],[222,638],[210,658],[228,685],[205,702]],'#6b7564');this.text('缺口',240,650,14,'#8d3829','center');}
    this.rect(0,739,480,39,'#858e77');
    for(let y=740;y<777;y+=7){this.rect(209,y,62,6,'#c7c4a8');}
    A.banner(c,22,701,true,b.time);
    this.text('城内 · 预备队上墙',330,765,12,'#f6e9c6');
  }
  drawUnit(u,index,b){const c=this.c;const targetX=65+(index%6)*65;let x=targetX,y=682;
    if(u.state==='entering'){const q=1-u.travel/3;x=240+(targetX-240)*q;y=770-88*q;}
    if(u.state==='returning'){const q=1-u.travel/2;x=targetX+(240-targetX)*q;y=682+88*q;}
    if(u.type==='stone')A.engine(c,x,y+5,'siege',b.time,.65);
    else if(u.type==='log'){A.log(c,x,y,42);A.soldier(c,x-16,y,'light',b.time,.65,true);}
    else {A.soldier(c,x,y,u.type==='crossbow'?'armor':u.type==='archer'?'archer':'light',b.time,.95,true);if(u.type==='fire'){A.circle(c,x+13,y-3,7,'#995336');A.poly(c,[[x+9,y-6],[x+13,y-19],[x+18,y-7]],'#df9c40');}if(u.type==='infantry'){A.circle(c,x+13,y+3,7,'#909587');}}
    this.text(u.state==='active'?(u.hold?'停火':TROOPS[u.type].name):u.state==='entering'?'上墙中':'撤下中',x,y+28,11,'#30473d','center');
  }
  mobile(kind,m,b){if(!['active','flanking'].includes(m.state))return;const c=this.c;
    for(let i=0;i<3;i++){let x=m.x+(i-1)*17,y=m.y+(i%2)*15;if(kind==='cavalry'){A.poly(c,[[x-14,y],[x+12,y],[x+16,y+8],[x-13,y+8]],'#87664a');A.line(c,x-9,y+7,x-12,y+18,'#514938',3);A.line(c,x+9,y+7,x+12,y+18,'#514938',3);A.circle(c,x+14,y-4,5,'#87664a');}A.soldier(c,x,y-6,'light',b.time,.7,true);}
    this.rect(m.x-23,m.y-34,46,4,'#4d5140');this.rect(m.x-23,m.y-34,46*m.hp/m.maxHp,4,'#7cae94');
  }
  battlefield(b){this.terrain(b);const c=this.c;
    for(const f of b.fires){c.globalAlpha=.45;A.circle(c,f.x,f.y,f.r,'#dc8745');c.globalAlpha=1;for(let i=0;i<5;i++){const x=f.x+Math.sin(i*8)*25,y=f.y+Math.cos(i*8)*20;A.poly(c,[[x-4,y],[x,y-12-4*Math.sin(b.time*6)],[x+5,y]],'#e9b754');}}
    for(const e of b.enemies.slice().sort((a,b)=>a.y-b.y)){if(['siege','ram'].includes(e.type))A.engine(c,e.x,e.y,e.type,b.time,.75);else if(e.type==='cavalry')A.horse(c,e.x,e.y,b.time);else A.soldier(c,e.x,e.y,e.type==='shield'?'armor':e.type,b.time,e.type==='armor'?.85:.7);if(e.type==='shield'){this.rect(e.x-11,e.y-7,11,16,'#a28c56');}if(e.hp<e.maxHp){this.rect(e.x-14,e.y-32,28,3,'#6b5e47');this.rect(e.x-14,e.y-32,28*e.hp/e.maxHp,3,'#a74a36');}if(e.id===b.focus){c.strokeStyle='#f8e4a7';c.beginPath();c.arc(e.x,e.y,22,0,Math.PI*2);c.stroke();}}
    for(const l of b.logs)A.log(c,l.x,l.y,l.width,b.time);
    this.mobile('cavalry',b.mobile.cavalry,b);this.mobile('ambush',b.mobile.ambush,b);
    b.units.forEach((u,i)=>this.drawUnit(u,i,b));
    for(const p of b.shots){const q=p.t/p.duration,x=p.x+(p.tx-p.x)*q,y=p.y+(p.ty-p.y)*q-Math.sin(q*Math.PI)*(p.radius?65:0);if(p.type==='stone'||p.type==='infantry')A.circle(c,x,y,5,'#686d61');else if(p.type==='fire')A.circle(c,x,y,5,'#e19843');else A.line(c,x,y,x-2,y+13,'#faf0c8',p.type==='crossbow'?2:1);}
    for(const f of b.fx){c.globalAlpha=Math.max(0,f.life);this.text(f.text,f.x,f.y,13,f.color,'center');}c.globalAlpha=1;
    this.rect(0,0,480,95,COLORS.ink);this.text('誓守襄阳',16,32,25,COLORS.cream);this.text(CHAPTERS[b.chapter].name+' · 第'+b.wave+'/3波',16,54,12,COLORS.gold);
    this.button('speed',267,13,58,38,b.speed+'×');this.button('pause',332,13,66,38,b.paused?'继续':'暂停');this.button('retreat',404,13,61,38,'撤退');
    this.rect(16,68,260,9,'#647363');this.rect(16,68,260*b.wall/b.maxWall,9,b.wall>400?'#9fb98b':'#bc6849');this.text('城防 '+Math.ceil(b.wall)+'  ·  漏敌 '+b.leaks+'/10',290,79,12,COLORS.cream);
    const seconds=Math.floor(b.time);this.text(String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0'),438,111,12,COLORS.ink,'center');
    if(b.time<b.noticeUntil){this.rect(45,118,390,30,'#263e35e8');this.text(b.notice,240,138,13,COLORS.cream,'center');}
    const keys=Object.keys(TROOPS);keys.forEach((type,i)=>{const x=5+i*79,u=b.units.filter(u=>u.type===type&&u.state!=='returning');this.rect(x,784,75,68,COLORS.ink);this.buttons.push({id:'plus:'+type,x,y:784,w:75,h:41,active:b.ammo[type]>0});this.text(TROOPS[type].name+' '+u.length+'队',x+37,803,13,COLORS.cream,'center');this.text('余 '+b.ammo[type],x+37,821,12,COLORS.gold,'center');this.button('minus:'+type,x,825,24,28,'−',u.length>0);this.button('hold:'+type,x+25,825,24,28,u.some(u=>u.hold)?'开':'停',u.length>0);this.button('plus:'+type,x+50,825,25,28,'+',b.ammo[type]>0);});
    this.text('在场 '+b.enemies.length+' · 已击退 '+b.kills,16,111,12,COLORS.ink);
    const names={ready:'出击',flanking:'绕后中',active:'交战中',defeated:'已损耗',returned:'已撤离'};
    this.button('cavalry',8,861,154,32,'骑兵 · '+names[b.mobile.cavalry.state],b.mobile.cavalry.state==='ready');this.button('ambush',170,861,154,32,'伏兵 · '+names[b.mobile.ambush.state],b.mobile.ambush.state==='ready');this.text('陷坑 '+b.traps.filter(t=>!t.used).length+' / '+b.traps.length,405,882,14,COLORS.ink,'center');
    if(b.paused){this.rect(85,348,310,68,'#1d342eee');this.text('战斗已暂停',240,376,24,COLORS.cream,'center');this.text('可调整兵种，点击上方「继续」',240,400,13,COLORS.gold,'center');}
    if(!b.enemies.length&&b.queue<b.events.length){const wait=Math.max(0,Math.ceil(b.events[b.queue].at-b.time));if(wait>5)this.text('下一批敌军约 '+wait+' 秒后抵达',240,220,14,COLORS.ink,'center');}

  }
  menu(app){
    this.rect(0,0,480,900,COLORS.ink);this.text('襄樊战纪 / 微信小游戏原型',28,53,12,COLORS.gold);this.text('誓守襄阳',28,119,48,COLORS.cream);this.text('一城灯火，待你守护。',30,154,16,COLORS.gold);
    this.rect(28,187,424,77,'#365047');this.text('自动迎敌 · 战前准备 · 择机出兵',48,216,17,COLORS.cream);this.text('有限弹药 / 一次性援军 / 无随机升级',48,242,13,COLORS.gold);
    CHAPTERS.forEach((ch,i)=>{const y=296+i*145;this.rect(28,y,424,126,i===app.chapter?'#eee1bd':'#c8c5a5');this.text('0'+(i+1)+'  '+ch.name,46,y+31,23);this.text(ch.brief,46,y+57,13);this.text(ch.tip,46,y+80,13);this.button('chapter:'+i,312,y+88,120,29,i===app.chapter?'已选择':'选择战役',true,i===app.chapter);});
    this.button('prepare',28,750,424,51,'查看敌情 · 准备守城',true,true);
    if(app.resume)this.button('resume',28,814,204,42,'继续上次战斗');
    this.button('help',app.resume?248:28,814,app.resume?204:424,42,'守城要略');this.text('单机试玩 · 内政与好友求援尚未接入',240,883,12,COLORS.gold,'center');
  }
  prepare(app){this.rect(0,0,480,900,COLORS.ink);this.text('战前整备',28,65,34,COLORS.cream);this.text(CHAPTERS[app.chapter].name+' / 三波进攻 / 约6—8分钟',28,96,14,COLORS.gold);
    this.rect(28,126,424,119,COLORS.paper);this.text('斥候来报',47,157,20);this.text(CHAPTERS[app.chapter].brief,47,188,14);this.text(CHAPTERS[app.chapter].tip,47,216,14);
    this.text('本场物资 · 试玩固定配给',28,289,20,COLORS.cream);
    Object.keys(TROOPS).forEach((k,i)=>{this.text(TROOPS[k].name,45,326+i*38,17,COLORS.cream);this.text(String(TROOPS[k].ammo)+' 份',420,326+i*38,16,COLORS.gold,'right');});
    this.button('traps',28,528,424,47,app.traps?'✓ 预埋陷坑：5处，触发后消耗':'○ 本场不布陷坑');
    this.text('滚木：城下宽面杀伤，不会滚穿整片战场。',30,599,14,COLORS.gold);
    this.text('骑兵、伏兵各一次，由你决定发动时机。',30,625,15,COLORS.cream);this.text('城墙最多6队，点击底部 + 上阵，− 撤下。',30,643,15,COLORS.cream);this.text('没有战中补弹，撤下再上阵也不会补满。',30,674,15,COLORS.gold);
    this.button('start',28,739,424,55,'击鼓 · 开始守城',true,true);this.button('menu',28,813,424,42,'返回战役');
  }
  result(app){const b=app.battle;this.rect(0,0,480,900,COLORS.ink);this.text(b.status==='won'?'襄阳，守住了':'整军，再战',240,180,39,COLORS.cream,'center');this.text(b.status==='won'?'这一夜，城中灯火依旧。':b.reason||'调整出兵时机，重新准备。',240,225,16,COLORS.gold,'center');
    const rows=[['击退敌军',b.kills+' 人'],['城防剩余',Math.ceil(b.wall)],['漏敌人数',b.leaks+' / 10'],['骑兵造成伤害',Math.round(b.stats.cavalry)],['伏兵造成伤害',Math.round(b.stats.ambush)],['陷坑造成伤害',Math.round(b.stats.traps)]];
    rows.forEach((r,i)=>{this.text(r[0],50,304+i*47,17,COLORS.cream);this.text(String(r[1]),430,304+i*47,19,COLORS.gold,'right');});
    this.text('各战役独立配给；重试恢复本轮开战前物资。',240,628,13,COLORS.gold,'center');
    if(b.status==='won'&&b.chapter<2)this.button('next',28,678,424,50,'下一战 · 查看敌情',true,true);
    this.button('prepare',28,744,424,50,'重新整备本场',true,b.status!=='won');this.button('menu',28,811,424,42,'返回战役');
  }
  draw(app){this.begin();if(app.screen==='menu')this.menu(app);else if(app.screen==='prepare')this.prepare(app);else if(app.screen==='result')this.result(app);else if(app.battle)this.battlefield(app.battle);
    if(app.dialog){this.rect(0,0,480,900,'#10251de0');this.rect(22,210,436,455,COLORS.paper);this.text(app.dialog==='help'?'守城要略':'确认撤退？',240,256,29,COLORS.ink,'center');
      const lines=app.dialog==='help'?['点击 + 调入一队，自动站位与攻击。','点击 − 撤队，点击「停」节省弹药。','点击敌军可指定全军优先集火。','步兵助装填；滚木压制城下密集敌军。','骑兵绕后、伏兵截击，本场各一次。','陷坑战前布好，敌军踩中后消耗。','城墙破损不立即失败，漏敌10人失败。','随时暂停；切到后台会自动暂停。']:['本场将按失败结算。','可返回战前整备，恢复本场初始物资。'];
      lines.forEach((s,i)=>this.text(s,45,300+i*33,15));
      this.buttons=[];if(app.dialog==='retreat')this.button('confirmRetreat',48,552,384,42,'确认撤退',true,true);this.button('close',48,607,384,40,app.dialog==='help'?'明白，准备守城':'取消，继续守城');}
  }
  hit(x,y){return this.buttons.slice().reverse().find(b=>b.active&&x>=b.x&&y>=b.y&&x<=b.x+b.w&&y<=b.y+b.h);}
}
module.exports={View,W,H};
