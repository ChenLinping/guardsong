'use strict';
// Original articulated 3D mesh study. Software projection keeps this scene usable
// in the existing native Canvas runtime without DOM, downloads or engine plugins.
const TAU=Math.PI*2, clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]);
const mul=(a,s)=>a.map(v=>v*s),dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const norm=a=>mul(a,1/(Math.hypot(...a)||1));
const lerp=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
const palette={steel:'#6c8991',edge:'#b4c6bd',cloth:'#345e69',leather:'#694634',gold:'#c0a36a',skin:'#c99e75',dark:'#26363b',red:'#975348'};
const light=norm([-1,2,1]);const colors={};
function shade(hex,k){k=Math.round(clamp(k,.3,1.3)*16)/16;const key=hex+k;if(colors[key])return colors[key];const v=parseInt(hex.slice(1),16);return colors[key]='rgb('+[v>>16,(v>>8)&255,v&255].map(x=>clamp(Math.round(x*k),0,255)).join(',')+')';}
class Mesh {
  constructor(){this.faces=[];}
  face(p,c){this.faces.push({p,c});}
  box(p,s,c){const [x,y,z]=p,[w,h,d]=s;const v=[[-w,0,-d],[w,0,-d],[w,h,-d],[-w,h,-d],[-w,0,d],[w,0,d],[w,h,d],[-w,h,d]].map(q=>[x+q[0]/2,y+q[1],z+q[2]/2]);
    for(const f of [[0,3,2,1],[4,5,6,7],[0,4,7,3],[1,2,6,5],[3,7,6,2]])this.face(f.map(i=>v[i]),c);
  }
  // Rings describe radius X/Z and height; facets carry real surface normals.
  rings(p,rings,c,n=10){const rows=rings.map(r=>Array.from({length:n},(_,i)=>[p[0]+Math.cos(i*TAU/n)*r[1],p[1]+r[0],p[2]+Math.sin(i*TAU/n)*r[2]]));
    for(let j=1;j<rows.length;j++)for(let i=0;i<n;i++)this.face([rows[j-1][i],rows[j][i],rows[j][(i+1)%n],rows[j-1][(i+1)%n]],c);
    this.face(rows[rows.length-1].slice().reverse(),c);
  }
  ellipsoid(p,s,c,n=8){this.rings(p,[[-s[1],.02,.02],[-s[1]*.55,s[0]*.83,s[2]*.83],[0,s[0],s[2]],[s[1]*.65,s[0]*.76,s[2]*.76],[s[1],.02,.02]],c,n);}
  rod(a,b,r,c,n=7,r2=r){const v=norm(sub(b,a)),u=norm(cross(v,Math.abs(v[1])>.9?[1,0,0]:[0,1,0])),w=cross(v,u);let aa=[],bb=[];
    for(let i=0;i<n;i++){const q=add(mul(u,Math.cos(i*TAU/n)),mul(w,Math.sin(i*TAU/n)));aa.push(add(a,mul(q,r)));bb.push(add(b,mul(q,r2)));}
    for(let i=0;i<n;i++)this.face([aa[i],bb[i],bb[(i+1)%n],aa[(i+1)%n]],c);this.face(bb.slice().reverse(),c);
  }
  join(other,transform){for(const f of other.faces)this.face(f.p.map(transform),f.c);}
}
function transform(p,position,yaw=0,fall=0){const co=Math.cos(fall),si=Math.sin(fall),y=p[1]*co-p[2]*si,z=p[1]*si+p[2]*co;return [position[0]+p[0]*Math.cos(yaw)+z*Math.sin(yaw),position[1]+y,position[2]-p[0]*Math.sin(yaw)+z*Math.cos(yaw)];}
function bowPoints(draw){return {grip:[-.60,1.67,-.65],upper:[-.60,2.35,-.40],lower:[-.60,1.03,-.40],string:[-.60,1.68,-.40+draw*.86]};}
function soldier(archer,phase,walk,hit=0){const m=new Mesh(),P=palette,armor=archer?P.steel:'#8d7961',cloth=archer?P.cloth:P.red;
  const stride=walk===null?0:Math.sin(walk)*.28;
  // Boots, bent knees, trousers and hanging lamellar skirt.
  for(const side of [-1,1]){const x=side*.20,foot=[x,.17,side*stride],knee=[x,.59,-.06-side*stride*.4];m.rod([x,1.11,0],knee,.155,cloth);m.rod(knee,foot,.13,P.dark);m.ellipsoid([x,.12,side*stride-.1],[.18,.13,.27],P.dark);}
  m.rings([0,0,0],[[.79,.43,.27],[.99,.41,.27],[1.21,.32,.22]],cloth);
  for(let row=0;row<3;row++)m.rings([0,0,0],[[.83+row*.11,.43-row*.03,.285],[.90+row*.11,.43-row*.03,.285]],armor,10);
  m.rings([0,0,0],[[1.12,.32,.22],[1.45,.40,.26],[1.83,.46,.25],[1.94,.32,.19]],armor);
  for(let row=0;row<4;row++){const y=1.24+row*.14;m.rings([0,0,0],[[y,.35+row*.025,.263],[y+.045,.35+row*.025,.263]],archer?'#506b73':'#685b4c');}
  m.rings([0,0,0],[[1.13,.36,.25],[1.22,.36,.25]],P.leather);m.box([-.02,1.14,-.27],[.13,.10,.03],P.gold);
  m.rod([.31,1.9,.22],[-.25,1.22,.24],.045,P.leather,5);
  m.rod([0,1.9,0],[0,2.10,0],.13,P.skin);
  m.ellipsoid([0,2.17,-.025],[.26,.30,.24],P.skin);
  // Eyebrows and nose lie on the face toward -Z; ear guards and crown are separate volumes.
  m.rod([-.17,2.23,-.225],[-.065,2.22,-.256],.022,P.dark,4);m.rod([.065,2.22,-.256],[.17,2.23,-.225],.022,P.dark,4);
  m.ellipsoid([0,2.14,-.265],[.05,.075,.07],P.skin,6);m.rod([-.07,2.035,-.22],[.07,2.035,-.22],.018,P.leather,4);
  m.rings([0,0,0],[[2.29,.30,.285],[2.45,.27,.25],[2.60,.12,.12],[2.63,.03,.03]],armor);
  m.rings([0,0,0],[[2.29,.315,.295],[2.34,.315,.295]],P.edge);
  for(const side of [-1,1])m.box([side*.265,2.02,.03],[.055,.29,.24],armor);
  m.rod([0,2.61,0],[0,2.76,.04],.035,P.gold,6);m.ellipsoid([0,2.77,.10],[.07,.12,.15],archer?'#9f4c3b':'#473b33',6);
  const draw=phase<.7?smooth(phase/.7):Math.max(0,1-(phase-.7)/.08),bp=bowPoints(draw);
  const left=archer?bp.grip:[-.50,1.35,-.26],right=archer?bp.string:[.52,1.31,-.09];
  const leftElbow=archer?[-.60,1.64,-.24]:[-.60,1.58,-.06];const rightElbow=archer?[.47,1.70,.10+draw*.38]:[.62,1.58,.06];
  for(const [side,elbow,hand] of [[-1,leftElbow,left],[1,rightElbow,right]]){m.rod([side*.39,1.8,0],elbow,.14,cloth);m.rod(elbow,hand,.105,P.leather);m.ellipsoid([side*.43,1.82,0],[.22,.14,.28],armor);m.ellipsoid(hand,[.095,.095,.09],P.skin,6);}
  if(archer){const curve=[bp.upper,[-.6,2.20,-.65],[-.6,1.92,-.75],bp.grip,[-.6,1.39,-.73],[-.6,1.15,-.61],bp.lower];for(let i=1;i<curve.length;i++)m.rod(curve[i-1],curve[i],.034,'#b48a4f',5);m.rod(bp.upper,bp.string,.008,'#ead9ad',3);m.rod(bp.lower,bp.string,.008,'#ead9ad',3);
    if(phase<.705){m.rod(bp.string,[-.60,1.68,-1.07],.012,'#d8c89e',4);m.ellipsoid([-.60,1.68,-1.08],[.032,.032,.08],P.edge,4);}
    m.rod([.25,1.20,.30],[.4,1.91,.36],.15,P.leather);for(let i=0;i<3;i++){const a=[.30+i*.07,1.7,.33];m.rod(a,[a[0]+.08,2.15,a[2]],.013,'#c6b891',4);m.ellipsoid([a[0]+.08,2.1,a[2]],[.04,.1,.025],P.edge,4);}
  }else{m.rod(right,[.58,2.65,-.13],.032,'#a28859',5);m.ellipsoid([.58,2.75,-.13],[.045,.18,.04],P.edge,5);m.rings([-.57,0,-.34],[[1.03,.28,.07],[1.54,.33,.08],[1.70,.2,.07]],'#75603d',8);m.rod([-.57,1.06,-.43],[-.57,1.63,-.43],.025,P.gold,4);}
  if(hit>0)m.ellipsoid([0,1.52,-.35],[.08,.08,.08],'#fbe7af',6);
  return m;
}
class Renderer {
  constructor(){this.scale=19.2;this.cx=240;this.cy=646;this.yaw=0;this.faces=[];}
  point(p){const x=p[0]*Math.cos(this.yaw)+p[2]*Math.sin(this.yaw),z=-p[0]*Math.sin(this.yaw)+p[2]*Math.cos(this.yaw);return [this.cx+x*this.scale,this.cy+(z*.60-p[1]*.80)*this.scale,z*.80+p[1]*.60];}
  project(mesh){const f=[];for(const face of mesh.faces){const pts=face.p.map(p=>this.point(p));const n=norm(cross(sub(face.p[1],face.p[0]),sub(face.p[2],face.p[0])));const area=(pts[1][0]-pts[0][0])*(pts[2][1]-pts[0][1])-(pts[1][1]-pts[0][1])*(pts[2][0]-pts[0][0]);
      // Both windings are allowed for cloth and thin lamellae; lighting remains geometric.
      if(Math.abs(area)<.015)continue;const k=.70+dot(n,light)*.27;f.push({p:pts,c:shade(face.c,k),d:face.p.every(p=>p[1]<=.015)&&Math.abs(area)>500? -10000+face.p[0][1]:pts.reduce((v,p)=>v+p[2],0)/pts.length});}return f;}
  paint(c,faces){faces.sort((a,b)=>a.d-b.d);for(const f of faces){c.beginPath();f.p.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.closePath();c.fillStyle=f.c;c.fill();}}
  shadow(c,p,r=1,alpha=.16){const q=this.point(p);c.save();c.translate(q[0]+this.scale*.35,q[1]+this.scale*.15);c.scale(this.scale,this.scale*.6);c.fillStyle='rgba(33,43,35,'+alpha+')';c.beginPath();c.ellipse(0,0,r,r*.42,0,0,TAU);c.fill();c.restore();}
}
function scenery(){const m=new Mesh();
  // Ground plane, earth ramp and a dressed stone wall with a walkable top.
  m.face([[-32,0,8],[32,0,8],[32,0,-52],[-32,0,-52]],'#a59f78');
  for(let i=0;i<100;i++){const x=Math.sin(i*81.5)*19,z=-3-(i*11.79%42),r=.08+(i%4)*.04;m.ellipsoid([x,.045,z],[r,.065,r*.7],i%3?'#8b8c6d':'#b7b191',5);}
  m.face([[-7,.01,1],[7,.01,1],[4,.01,-45],[-5,.01,-45]],'#b6a780');
  for(let i=0;i<24;i++){const x=(i%2?1:-1)*(12+i%4),z=-8-i*1.5;m.ellipsoid([x,.2,z],[.8,.4,.65],'#82886b',6);}
  for(let layer=0;layer<4;layer++)for(let j=0;j<19;j++){const x=-15+j*1.65+(layer%2)*.8;m.box([x,layer*.70,0],[1.61,.68,3.6],['#878e86','#969d90','#7f8981'][(j+layer)%3]);}
  for(let j=0;j<29;j++)m.box([-15+j*1.1,2.8,0],[1.08,.16,3.6],j%3?'#b0b4a0':'#a2ab98');
  for(let j=0;j<22;j++){const x=-15+j*1.5;m.box([x,2.96,-1.58],[.9,.82,.62],'#939e90');m.box([x,3.78,-1.58],[1.01,.12,.72],'#c0c2aa');}
  m.box([0,0,2.7],[5,.45,2],'#889287');m.box([0,.45,2.4],[4.6,.45,1.9],'#9ba391');m.box([0,.90,2.1],[4.2,.45,1.8],'#aab29c');
  for(const x of [-10.3,10.3]){m.box([x,2.96,.5],[1.1,.45,1.1],'#77877f');m.rod([x,3.4,.5],[x,7.0,.5],.055,'#67543a',7);m.ellipsoid([x,7.06,.5],[.10,.17,.10],'#c8b276',6);}
  return m;
}
class ArcheryStudy {
  constructor(createSurface){this.createSurface=createSurface;this.atlases={};this.backgrounds={};this.paused=false;this.slow=false;this.close=false;this.dense=false;this.renderer=new Renderer();this.scene=scenery();this.staticFaces=null;this.reset();}
  reset(){this.time=0;this.kills=0;this.shots=0;this.hits=0;this.ammo=144;this.arrows=[];this.particles=[];this.embedded=[];this.enemies=[];this.volley=0;this.nextVolley=1.5;this.cycleStart=-10;this.fired=new Set();this.finished=false;this.spawn();}
  spawn(){const count=this.dense?36:18;for(let i=0;i<count;i++)this.enemies.push({id:i,x:(i%6-2.5)*2.65+Math.sin(i*9)*.18,z:-13-Math.floor(i/6)*4.3,y:0,hp:2,hit:0,death:null,phase:i*1.7,reserved:0});}
  position(i){return [(i-2.5)*2.65,2.96,.25];}
  phase(i){return clamp((this.time-this.cycleStart-i*.09)/1.30,0,1);}
  fire(i){if(this.ammo<=0)return;const enemies=this.enemies.filter(e=>e.hp>e.reserved&&e.death===null);let target=enemies.sort((a,b)=>(b.z-a.z)||Math.abs(a.x-this.position(i)[0])-Math.abs(b.x-this.position(i)[0]))[0];if(!target)return;
    const from=add(this.position(i),[-.60,1.68,-.40]);const duration=.68+Math.abs(target.z)/65;const to=[target.x,1.42,target.z+duration*.43];target.reserved++;this.arrows.push({from,to,t:0,duration,target:target.id,arc:2.7,previous:from});this.ammo--;this.shots++;}
  update(dt){if(this.paused)return;dt=Math.min(.1,dt)*(this.slow?.3:1);this.time+=dt;
    if(this.time>=this.nextVolley&&!this.finished){this.cycleStart=this.time;this.nextVolley=this.time+3.3;this.fired.clear();this.volley++;}
    for(let i=0;i<6;i++)if(this.phase(i)>=.70&&!this.fired.has(i)&&this.cycleStart>0){this.fired.add(i);this.fire(i);}
    for(const e of this.enemies){e.hit=Math.max(0,e.hit-dt);if(e.death===null)e.z=Math.min(-3,e.z+dt*.43);}
    for(const a of this.arrows){a.t+=dt;if(a.t>=a.duration){const e=this.enemies[a.target];e.reserved=Math.max(0,e.reserved-1);if(e.death===null){e.hp--;e.hit=.22;this.hits++;this.embedded.push({target:e.id,local:[-.1,1.4,-.30]});if(e.hp<=0){e.death=this.time;this.kills++;}for(let k=0;k<8;k++)this.particles.push({p:a.to.slice(),v:[Math.cos(k*2.4)*1.8,1+Math.sin(k)*1.6,Math.sin(k*2.4)*1.8],t:0,life:.24+k*.055,color:k<3?'#ffdf9a':'#bca680'});}}
    }
    this.arrows=this.arrows.filter(a=>a.t<a.duration);
    for(const p of this.particles){p.t+=dt;p.p=add(p.p,mul(p.v,dt));p.v[1]-=dt*5;}
    this.particles=this.particles.filter(p=>p.t<p.life);
    this.finished=this.enemies.every(e=>e.death!==null)||(this.ammo===0&&this.arrows.length===0);
  }
  drawSoldier(c,mesh,archer,phase,walk,pos,fall,hit,age){
    if(!this.createSurface){mesh.join(soldier(archer,phase,walk,hit),p=>transform(p,pos,archer?0:Math.PI,fall));return;}
    // Bounded atlas: 24 draw/release poses, 12 walking poses, 10 falling poses.
    // Meshes remain the source of truth; repeated troops reuse rasterized poses.
    const key=this.close?'close':'wide';let atlas=this.atlases[key];
    if(!atlas){const canvas=this.createSurface(1024,960);atlas=this.atlases[key]={canvas,ctx:canvas.getContext('2d'),ready:new Set()};}
    const index=archer?Math.min(23,Math.floor(phase*24)):fall>0?36+Math.min(9,Math.floor(age/.55*10)):24+Math.floor(((walk%TAU)+TAU)%TAU/TAU*12);
    const sx=(index%8)*128,sy=Math.floor(index/8)*160;
    if(!atlas.ready.has(index)){const m=new Mesh(),rr=new Renderer();rr.scale=42;rr.cx=64;rr.cy=120;rr.yaw=this.renderer.yaw;
      const pp=archer?index/23:0,ww=archer?null:(index-24)/12*TAU,ff=index>=36?smooth((index-36)/9)*1.43:0;
      m.join(soldier(archer,pp,ww),p=>transform(p,[0,0,0],archer?0:Math.PI,ff));atlas.ctx.save();atlas.ctx.beginPath();atlas.ctx.rect(sx,sy,128,160);atlas.ctx.clip();atlas.ctx.translate(sx,sy);rr.paint(atlas.ctx,rr.project(m));atlas.ctx.restore();atlas.ready.add(index);
    }
    const q=this.renderer.point(pos),scale=this.renderer.scale/42;c.save();if(age>3.2)c.globalAlpha=clamp((4.5-age)/1.3,0,1);c.drawImage(atlas.canvas,sx,sy,128,160,q[0]-64*scale,q[1]-120*scale,128*scale,160*scale);c.restore();
  }
  arrowPosition(a){const t=clamp(a.t/a.duration,0,1),p=lerp(a.from,a.to,t);p[1]+=4*a.arc*t*(1-t);return p;}
  action(id){if(id==='study:pause')this.paused=!this.paused;if(id==='study:slow')this.slow=!this.slow;if(id==='study:camera'){this.close=!this.close;this.staticFaces=null;}if(id==='study:dense'){this.dense=!this.dense;this.reset();}if(id==='study:reset')this.reset();}
  draw(v){const c=v.c,r=this.renderer;r.scale=this.close?32:22;r.cy=this.close?737:667;r.yaw=this.close?-.28:0;
    v.rect(0,0,480,900,'#152b30');
    c.save();c.beginPath();c.rect(0,137,480,590);c.clip();const bg=c.createLinearGradient(0,137,0,727);bg.addColorStop(0,'#b9bba3');bg.addColorStop(.7,'#c5ba92');bg.addColorStop(1,'#929c89');c.fillStyle=bg;c.fillRect(0,137,480,590);
    if(!this.staticFaces)this.staticFaces=r.project(this.scene);const viewKey=this.close?'close':'wide';if(this.createSurface){if(!this.backgrounds[viewKey]){const bgCanvas=this.createSurface(960,1180),bc=bgCanvas.getContext('2d');bc.scale(2,2);bc.translate(0,-137);r.paint(bc,this.staticFaces);this.backgrounds[viewKey]=bgCanvas;}c.drawImage(this.backgrounds[viewKey],0,137,480,590);}else r.paint(c,this.staticFaces);
    const mesh=new Mesh();
    for(const e of this.enemies){const age=e.death===null?0:this.time-e.death;if(age>4.5)continue;const fall=e.death===null?0:smooth(age/.55)*1.43;const recoil=e.hit>0?Math.sin(e.hit/.22*Math.PI)*.16:0;const pos=[e.x,.02,e.z+recoil];r.shadow(c,pos,age?.9:.52,age?.08:.16);this.drawSoldier(c,mesh,false,0,this.time*6+e.phase,pos,fall,e.hit,age);
      if(e.hit>0){const q=r.point([e.x,2.8,e.z]);c.fillStyle='#fff1b3';c.font='bold 12px sans-serif';c.textAlign='center';c.fillText('命中',q[0],q[1]-8);}
      for(const a of this.embedded.filter(a=>a.target===e.id)){const start=transform(a.local,pos,Math.PI,fall),end=transform(add(a.local,[0,0,-.65]),pos,Math.PI,fall);mesh.rod(start,end,.018,'#d9cc9e',4);}
    }
    for(let i=0;i<6;i++){const pos=this.position(i);r.shadow(c,pos,.58,.19);this.drawSoldier(c,mesh,true,this.phase(i),null,pos,0,0,0);}
    // A cloth flag makes the lighting and scale readable, without importing any reference assets.
    for(const x of [-10.3,10.3])for(let i=0;i<5;i++){const xx=x+i*.28,z=.50+Math.sin(this.time*3-i*.65)*i*.035;mesh.face([[xx,6.85,z],[xx+.29,6.81,z+.05],[xx+.29,5.67,z+.05],[xx,5.72,z]],i%2?'#934735':'#a3513c');}
    for(const a of this.arrows){const p=this.arrowPosition(a),t=clamp(a.t/a.duration,0,1),direction=norm(add(sub(a.to,a.from),[0,4*a.arc*(1-2*t),0])),tail=add(p,mul(direction,-.72));mesh.rod(tail,p,.023,'#dfcf9e',5);mesh.rod(p,add(p,mul(direction,.14)),.055,'#c5d7d0',5,0);mesh.ellipsoid(add(tail,mul(direction,.12)),[.07,.045,.07],'#dad7bb',5);}
    r.paint(c,r.project(mesh));
    for(const a of this.arrows){const p=this.arrowPosition(a),q=r.point(p);c.strokeStyle='#fff1bc88';c.lineWidth=1;c.beginPath();c.moveTo(q[0],q[1]);const t=Math.max(0,a.t-.035),prev=this.arrowPosition(Object.assign({},a,{t})),pp=r.point(prev);c.lineTo(pp[0],pp[1]);c.stroke();}
    for(const p of this.particles){const q=r.point(p.p);c.globalAlpha=1-p.t/p.life;c.fillStyle=p.color;c.beginPath();c.arc(q[0],q[1],p.color==='#ffdf9a'?2.1:3.4,0,TAU);c.fill();}c.globalAlpha=1;
    const fog=c.createLinearGradient(0,137,0,260);fog.addColorStop(0,'#b9bba3');fog.addColorStop(1,'#b9bba300');c.fillStyle=fog;c.fillRect(0,137,480,123);
    c.restore();
    v.text('襄阳 · 弓阵',23,46,30,'#eee7cd');v.text('三维造型 / 射击动作样板',24,72,12,'#aabdba');v.button('menu',382,23,76,36,'返回');
    v.rect(22,89,436,1,'#516360');v.text('齐射 '+this.volley+' 轮',24,117,13,'#d6bb83');v.text('箭矢 '+this.ammo+' / 144',175,117,13,'#d6bb83');v.text('击退 '+this.kills+' / '+this.enemies.length,341,117,13,'#d6bb83');
    v.rect(0,727,480,173,'#152b30');v.text(this.finished?'此轮演示结束':this.paused?'已暂停':this.time-this.cycleStart<.9?'张弓 · 蓄势':this.arrows.length?'放箭 · 齐射':'列阵 · 待敌',24,758,21,'#eee7cd');
    v.text('六名弓手  /  拉弦 → 放箭 → 命中 → 倒地',24,782,12,'#acbcb3');
    v.button('study:pause',22,801,101,40,this.paused?'继续':'暂停');v.button('study:slow',134,801,101,40,this.slow?'正常速度':'慢动作',true,this.slow);v.button('study:camera',246,801,101,40,this.close?'远景':'近看动作',true,this.close);v.button('study:reset',358,801,100,40,'重新演示');
    v.button('study:dense',22,854,160,30,this.dense?'密集：36人':'标准：18人',true,this.dense);v.text('造型试验 · 非正式关卡数值',458,875,11,'#93a69e','right');
  }
}
module.exports={ArcheryStudy,Mesh,Renderer,soldier,transform,bowPoints};
