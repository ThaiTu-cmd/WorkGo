import fs from 'fs';import path from 'path';
function walk(d,exts,acc=[]){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p,exts,acc);else if(exts.some(x=>e.name.endsWith(x)))acc.push(p)}return acc}
const files=[...walk('src/_webapp-mirror',['.jsx']),...walk('src/components/trung-pages',['.tsx'])];
const viRe=/[àáảãạăắặẳẵẳặâấậẩẫậèéẻẽẹêếệểễệìíỉĩịòóỏõọôốộổỗộơớợởỡợùúủũụưứựửữựỳýỷỹỵđ]/;
for(const f of files){
  const s=fs.readFileSync(f,'utf8');
  // find template literals containing vi
  const re=/`([^`]*)`/g; let m; const hits=[];
  while((m=re.exec(s))){ if(viRe.test(m[1])) hits.push(m[1].slice(0,60)); }
  if(hits.length){ console.log(f, hits.length); }
}