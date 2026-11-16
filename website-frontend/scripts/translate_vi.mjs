import fs from 'fs';
const strings=JSON.parse(fs.readFileSync('C:/Users/Tran Huu Trung/AppData/Local/Temp/opencode/vi_strings.json','utf8'));
const outPath='C:/Users/Tran Huu Trung/AppData/Local/Temp/opencode/vi_en_map.json';
let map={};
if(fs.existsSync(outPath)){map=JSON.parse(fs.readFileSync(outPath,'utf8'));}
async function tr(s){
  if(map[s]) return map[s];
  const url='https://translate.googleapis.com/translate_a/single?client=gtx&sl=vi&tl=en&dt=t&q='+encodeURIComponent(s);
  const res=await fetch(url);
  const data=await res.json();
  const en=data[0].map(x=>x[0]).join('');
  map[s]=en;
  return en;
}
const concurrency=5;
let i=0;
async function worker(){
  while(i<strings.length){
    const idx=i++;
    const s=strings[idx];
    if(map[s]) continue;
    try{ await tr(s); }catch(e){ console.error('err',s,e.message); map[s]=s; }
    if(idx%50===0){ fs.writeFileSync(outPath,JSON.stringify(map,null,2)); console.log('progress',idx,'/',strings.length); }
  }
}
await Promise.all(Array.from({length:concurrency},()=>worker()));
fs.writeFileSync(outPath,JSON.stringify(map,null,2));
console.log('done',Object.keys(map).length);