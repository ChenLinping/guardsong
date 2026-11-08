// Rebuild the standalone preview from the exact native game modules.
const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..'),file=path.join(root,'preview/index.html');
const old=fs.readFileSync(file,'utf8');
const head=old.slice(0,old.indexOf('modules["./art"]'));
const tail=old.slice(old.indexOf("const {App}=require('./app');const canvas=document"));
const bundle=['art','archery','core','view','app'].map(n=>'modules["./'+n+'"]=function(require,module,exports){\n'+fs.readFileSync(path.join(root,'js',n+'.js'),'utf8')+'\n};\n').join('');
fs.writeFileSync(file,head+bundle+tail);
console.log('Preview rebuilt from native modules');
