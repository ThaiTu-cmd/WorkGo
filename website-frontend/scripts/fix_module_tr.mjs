import fs from 'fs';
const strings=JSON.parse(fs.readFileSync('C:/Users/Tran Huu Trung/AppData/Local/Temp/opencode/vi_strings.json','utf8'));
const trmap=JSON.parse(fs.readFileSync('C:/Users/Tran Huu Trung/AppData/Local/Temp/opencode/vi_en_map.json','utf8'));
// key -> english
const keyToEn={};
strings.forEach((s,i)=>{ keyToEn['m'+i]=trmap[s.trim()]||s.trim(); });

function processFile(f){
  const s=fs.readFileSync(f,'utf8');
  const lines=s.split(/\r?\n/);
  // find hook line
  let hookIdx=lines.findIndex(l=>/const tr = useTranslations\(['"]misc['"]\)/.test(l));
  if(hookIdx<0) return false;
  let changed=false;
  for(let i=0;i<hookIdx;i++){
    lines[i]=lines[i].replace(/tr\(("m\d+")\)/g,(m,key)=>{
      changed=true; const k=key.replace(/"/g,''); return JSON.stringify(keyToEn[k]||k);
    });
    lines[i]=lines[i].replace(/tr\(('m\d+')\)/g,(m,key)=>{
      changed=true; const k=key.replace(/'/g,''); return JSON.stringify(keyToEn[k]||k);
    });
  }
  if(changed) fs.writeFileSync(f,lines.join('\n'));
  return changed;
}
const files=process.argv.slice(2);
for(const f of files){ if(processFile(f)) console.log('fixed',f); }