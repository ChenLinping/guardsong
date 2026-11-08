'use strict';
const assert=require('node:assert/strict');
const {ArcheryStudy,soldier}=require('../js/archery');
const tick=(s,t)=>{for(let i=0;i<Math.round(t*60);i++)s.update(1/60);};
const s=new ArcheryStudy();
tick(s,2.5);assert(s.shots>0);assert.equal(s.hits,0,'arrows do not deal damage before arriving');assert.equal(s.ammo+s.shots,144);
const frozen=JSON.stringify({time:s.time,ammo:s.ammo,arrows:s.arrows});s.action('study:pause');tick(s,4);assert.equal(JSON.stringify({time:s.time,ammo:s.ammo,arrows:s.arrows}),frozen);s.action('study:pause');
tick(s,60);assert.equal(s.kills,18);assert.equal(s.hits,36);assert.equal(s.shots,36);assert(s.finished);assert(s.enemies.every(e=>e.reserved===0&&e.death!==null));
s.action('study:dense');assert.equal(s.enemies.length,36);assert.equal(s.ammo,144);tick(s,100);assert.equal(s.kills,36);assert.equal(s.shots,72);assert.equal(s.ammo,72);
s.action('study:reset');s.action('study:slow');tick(s,10);assert(Math.abs(s.time-3)<1e-8);
for(const archer of [false,true])for(const phase of [0,.4,.7,.8,1]){const mesh=soldier(archer,phase,1);assert(mesh.faces.length>200);assert(mesh.faces.every(f=>f.p.every(p=>p.every(Number.isFinite))));}
console.log('PASS archery: delayed impacts, finite ammunition, pause, 18/36 enemy completion, reset, slow motion, mesh coordinates');

// The preview must not overwrite an in-progress campaign save.
const {App}=require('../js/app');const {createCanvas}=require('@napi-rs/canvas');let hide,show;let writes=0;
const app=new App({canvas:createCanvas(480,900),createSurface:createCanvas,window:()=>({width:480,height:900,dpr:1}),load:()=>null,save:()=>writes++,onTouch:()=>{},onHide:f=>hide=f,onShow:f=>show=f,onResize:()=>{},raf:()=>{}});
app.action('study');app.frame(1000);app.frame(1050);assert(app.study.time>0);hide();app.frame(1100);const time=app.study.time;show();app.frame(1150);assert.equal(app.study.time,time);assert(app.study.paused);assert.equal(writes,0);
for(const close of [false,true]){app.study.close=close;app.study.staticFaces=null;for(let i=0;i<65;i++){app.study.paused=false;app.study.update(.05);app.view.draw(app);}const atlas=app.study.atlases[close?'close':'wide'];assert(atlas.ready.size<=46);}
assert.equal(app.view.hit(290,820).id,'study:camera');app.action('menu');assert.equal(app.screen,'menu');assert.equal(writes,0);
console.log('PASS native-style study: lifecycle, cached render at both camera scales, touch target, no campaign save writes');
