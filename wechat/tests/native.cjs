const assert=require('node:assert/strict');
const {createCanvas,GlobalFonts}=require('@napi-rs/canvas');
const fs=require('node:fs');
const font='/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc';if(fs.existsSync(font))GlobalFonts.registerFromPath(font,'sans-serif');
let now=0,raf,touch,hide,show,resize;let saved=null,canvas;
global.requestAnimationFrame=fn=>{raf=fn;};
let dims={windowWidth:390,windowHeight:844,pixelRatio:2,safeArea:{top:47,bottom:810}};
global.wx={createCanvas:()=>canvas=createCanvas(390,844),getWindowInfo:()=>dims,getMenuButtonBoundingClientRect:()=>({bottom:86}),onTouchStart:fn=>touch=fn,onHide:fn=>hide=fn,onShow:fn=>show=fn,onWindowResize:fn=>resize=fn,getStorageSync:()=>saved,setStorageSync:(_,data)=>{saved=JSON.parse(JSON.stringify(data));},removeStorageSync:()=>saved=null};
require('../game');
const step=(n=1)=>{for(let i=0;i<n;i++){now+=50;raf(now);}};
function tap(x,y){const top=91,s=Math.min(dims.windowWidth/480,(dims.safeArea.bottom-top)/900),ox=(dims.windowWidth-480*s)/2,oy=top+(dims.safeArea.bottom-top-900*s)/2;touch({touches:[{clientX:ox+x*s,clientY:oy+y*s}]});}
step();tap(240,775);step();tap(240,765);step();assert(saved); // menu -> prepare -> battle
for(const x of [68,147,226,305,384,463])tap(x,839);
step(300);assert(saved.data.time>0);assert(saved.data.units.length>=4);
hide();const before=saved.data.time;step(100);assert.equal(saved.data.time,before);show();step();assert(saved.data.paused);tap(365,32);step(130);assert(saved.data.time>before);
// Native entry renders at small, tall, and tablet sizes without throwing.
for(const size of [[320,568],[430,932],[768,1024]]){dims={windowWidth:size[0],windowHeight:size[1],pixelRatio:2,safeArea:{top:0,bottom:size[1]-20}};resize();step();assert.equal(canvas.width,size[0]*2);}
console.log('PASS native entry: Canvas, touch, lifecycle pause, storage, resize 320/390/430/768px');
// Generate visual QA from the actual renderer, no mocked draw calls.
const {App}=require('../js/app');const c=createCanvas(960,1800);
const p={canvas:c,window:()=>({width:480,height:900,dpr:2,top:0,bottom:900}),load:()=>null,save:()=>{},onTouch:()=>{},onHide:()=>{},onShow:()=>{},onResize:()=>{},raf:()=>{}};
const app=new App(p);const out=process.env.QA_DIR||'/tmp/xiangyang-qa';fs.mkdirSync(out,{recursive:true});
app.view.draw(app);fs.writeFileSync(out+'/menu.png',c.toBuffer('image/png'));
app.action('prepare');app.view.draw(app);fs.writeFileSync(out+'/prepare.png',c.toBuffer('image/png'));
app.chapter=2;app.action('start');['archer','crossbow','stone','fire','log','infantry'].forEach(t=>app.battle.deploy(t));
for(let i=0;i<5900;i++)app.battle.update(.05);
app.battle.launch('cavalry');app.battle.launch('ambush');for(let i=0;i<60;i++)app.battle.update(.05);
app.view.draw(app);fs.writeFileSync(out+'/battle.png',c.toBuffer('image/png'));
app.battle.retreat();app.screen='result';app.view.draw(app);fs.writeFileSync(out+'/result.png',c.toBuffer('image/png'));
console.log('PASS actual Canvas render: menu, preparation, battle, results');
