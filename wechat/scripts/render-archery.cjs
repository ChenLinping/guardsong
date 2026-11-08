// Optional developer QA: NODE_PATH must expose @napi-rs/canvas; ffmpeg makes MP4.
// Frames come from the exact interactive renderer, not a separate cinematic.
'use strict';
const fs=require('node:fs'),path=require('node:path');const {createCanvas,GlobalFonts}=require('@napi-rs/canvas');
const font='/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc';if(fs.existsSync(font))GlobalFonts.registerFromPath(font,'sans-serif');
const {App}=require('../js/app');const out=process.argv[2]||'/tmp/guardsong-archery';fs.mkdirSync(out,{recursive:true});
const canvas=createCanvas(720,1350),app=new App({canvas,createSurface:createCanvas,window:()=>({width:480,height:900,dpr:1.5}),load:()=>null,save:()=>{},onTouch:()=>{},onHide:()=>{},onShow:()=>{},onResize:()=>{},raf:()=>{}});
app.action('study');let times=[];const frames=process.env.FRAMES==='1';
for(let i=0;i<720;i++){if(i===180)app.action('study:camera');if(i===300)app.action('study:slow');if(i===450)app.action('study:slow');if(i===540)app.action('study:camera');app.study.update(1/30);const start=performance.now();app.view.draw(app);times.push(performance.now()-start);
  if(frames)fs.writeFileSync(path.join(out,String(i).padStart(4,'0')+'.png'),canvas.toBuffer('image/png'));
  if([88,245,485,660].includes(i))fs.writeFileSync(path.join(out,'still-'+i+'.png'),canvas.toBuffer('image/png'));
}
times=times.slice(60).sort((a,b)=>a-b);console.log(JSON.stringify({frames:720,seconds:24,meanRenderMs:times.reduce((a,b)=>a+b)/times.length,p95RenderMs:times[Math.floor(times.length*.95)],shots:app.study.shots,kills:app.study.kills,atlasPoses:Object.values(app.study.atlases).map(a=>a.ready.size)}));
