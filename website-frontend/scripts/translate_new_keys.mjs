import fs from 'fs';
const strings=JSON.parse(fs.readFileSync('C:/Users/Tran Huu Trung/AppData/Local/Temp/opencode/vi_strings.json','utf8'));
const trmap=JSON.parse(fs.readFileSync('C:/Users/Tran Huu Trung/AppData/Local/Temp/opencode/vi_en_map.json','utf8'));
async function tr(s){
  const url='https://translate.googleapis.com/translate_a/single?client=gtx&sl=vi&tl=en&dt=t&q='+encodeURIComponent(s);
  const res=await fetch(url);
  const data=await res.json();
  return data[0].map(x=>x[0]).join('');
}
// translate indices >=1447 that are still untranslated (en==vi)
const vi=JSON.parse(fs.readFileSync('src/dictionaries/vi.json','utf8'));
const en=JSON.parse(fs.readFileSync('src/dictionaries/en.json','utf8'));
let i=0;
async function worker(){
  while(i<strings.length){
    const idx=i++;
    const s=strings[idx];
    const key='m'+idx;
    if(!vi.misc || !vi.misc[key]) continue;
    // if en equals vi, translate
    if(en.misc[key]===vi.misc[key]){
      try{
        // translate the raw template? vi.misc now has {p0}; translate original s instead
        const original=s.trim();
        // use original vietnamese from strings (with ${}) not dictionary
        const enText=await tr(original);
        // convert placeholders
        let j=0;
        const converted=enText.replace(/\$\{[^}]*\}/g,()=>`{p${j++}}`);
        en.misc[key]=converted;
        trmap[original]=enText;
      }catch(e){ console.error(e.message); }
    }
  }
}
const concurrency=3;
await Promise.all(Array.from({length:concurrency},()=>worker()));
fs.writeFileSync('src/dictionaries/en.json',JSON.stringify(en,null,2)+'\n');
fs.writeFileSync('C:/Users/Tran Huu Trung/AppData/Local/Temp/opencode/vi_en_map.json',JSON.stringify(trmap,null,2));
console.log('done');