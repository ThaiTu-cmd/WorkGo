import fs from 'fs';import path from 'path';
function walk(d,exts,acc=[]){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p,exts,acc);else if(exts.some(x=>e.name.endsWith(x)))acc.push(p)}return acc}
const files=[...walk('src/_webapp-mirror',['.jsx']),...walk('src/components/trung-pages',['.tsx'])];
let missing=0;
for(const f of files){
  const s=fs.readFileSync(f,'utf8');
  if(/\btr\(/.test(s) && !/const tr = useTranslations/.test(s)){
    missing++; console.log('MISSING HOOK:',f);
  }
}
console.log('files with tr() but no hook:',missing);