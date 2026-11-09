import fs from 'fs';import path from 'path';
function walk(d,exts,acc=[]){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p,exts,acc);else if(exts.some(x=>e.name.endsWith(x)))acc.push(p)}return acc}
const files=[...walk('src/_webapp-mirror',['.jsx']),...walk('src/components/trung-pages',['.tsx'])];
// call fix_module_tr logic inline
const strings=JSON.parse(fs.readFileSync('C:/Users/Tran Huu Trung/AppData/Local/Temp/opencode/vi_strings.json','utf8'));
const trmap=JSON.parse(fs.readFileSync('C:/Users/Tran Huu Trung/AppData/Local/Temp/opencode/vi_en_map.json','utf8'));
const keyToEn={}; strings.forEach((s,i)=>{keyToEn['m'+i]=trmap[s.trim()]||s.trim();});
let fixedFiles=0;
for(const f of files){
  const s=fs.readFileSync(f,'utf8');
  const lines=s.split(/\r?\n/);
  const hookIdx=lines.findIndex(l=>/const tr = useTranslations\(['"]misc['"]\)/.test(l));
  if(hookIdx<0) continue;
  let changed=false;
  for(let i=0;i<hookIdx;i++){
    lines[i]=lines[i].replace(/tr\(("m\d+")\)/g,(m,key)=>{changed=true;const k=key.replace(/"/g,'');return JSON.stringify(keyToEn[k]||k);});
    lines[i]=lines[i].replace(/tr\(('m\d+')\)/g,(m,key)=>{changed=true;const k=key.replace(/'/g,'');return JSON.stringify(keyToEn[k]||k);});
  }
  if(changed){fs.writeFileSync(f,lines.join('\n'));fixedFiles++;}
}
console.log('fixed files',fixedFiles);