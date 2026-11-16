import fs from 'fs';
const rem=JSON.parse(fs.readFileSync('C:/Users/Tran Huu Trung/AppData/Local/Temp/opencode/remaining_vi.json','utf8'));
const strings=JSON.parse(fs.readFileSync('C:/Users/Tran Huu Trung/AppData/Local/Temp/opencode/vi_strings.json','utf8'));
const trmap=JSON.parse(fs.readFileSync('C:/Users/Tran Huu Trung/AppData/Local/Temp/opencode/vi_en_map.json','utf8'));
async function tr(s){const url='https://translate.googleapis.com/translate_a/single?client=gtx&sl=vi&tl=en&dt=t&q='+encodeURIComponent(s);const res=await fetch(url);const data=await res.json();return data[0].map(x=>x[0]).join('');}
// append new strings
const existing=new Set(strings);
const toAdd=rem.filter(s=>!existing.has(s));
for(const s of toAdd){ strings.push(s); }
// translate
let i=0;
async function worker(){
  while(i<toAdd.length){
    const s=toAdd[i++];
    if(trmap[s]) continue;
    try{ trmap[s]=await tr(s); }catch(e){ console.error(e.message); trmap[s]=s; }
  }
}
await Promise.all(Array.from({length:4},()=>worker()));
fs.writeFileSync('C:/Users/Tran Huu Trung/AppData/Local/Temp/opencode/vi_strings.json',JSON.stringify(strings,null,2));
fs.writeFileSync('C:/Users/Tran Huu Trung/AppData/Local/Temp/opencode/vi_en_map.json',JSON.stringify(trmap,null,2));
console.log('added',toAdd.length);