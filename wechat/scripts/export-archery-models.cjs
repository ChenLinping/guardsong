// Export the same original runtime geometry for inspection in Blender/DCC apps.
'use strict';
const fs=require('node:fs'),path=require('node:path');const {soldier}=require('../js/archery');
const out=process.argv[2]||path.join(__dirname,'../models/archery-study');fs.mkdirSync(out,{recursive:true});
for(const [name,archer,phase] of [['song-archer-draw',true,.69],['song-archer-release',true,.82],['attacker',false,0]]){const mesh=soldier(archer,phase,null),materials=[...new Set(mesh.faces.map(f=>f.c))];let obj=['# Original guardsong procedural model; Y up, metres','mtllib '+name+'.mtl'],n=1;
  for(const f of mesh.faces){obj.push('usemtl m'+materials.indexOf(f.c));for(const p of f.p)obj.push('v '+p.map(x=>x.toFixed(5)).join(' '));obj.push('f '+f.p.map((_,i)=>n+i).join(' '));n+=f.p.length;}
  fs.writeFileSync(path.join(out,name+'.obj'),obj.join('\n')+'\n');fs.writeFileSync(path.join(out,name+'.mtl'),materials.map((c,i)=>'newmtl m'+i+'\nKd '+[1,3,5].map(p=>(parseInt(c.slice(p,p+2),16)/255).toFixed(5)).join(' ')+'\nKa 0.3 0.3 0.3\n').join('\n'));
}console.log('Exported 3 original mesh poses to '+out);
