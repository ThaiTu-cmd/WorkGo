import fs from 'fs';
const vi=JSON.parse(fs.readFileSync('src/dictionaries/vi.json','utf8'));
const en=JSON.parse(fs.readFileSync('src/dictionaries/en.json','utf8'));
const trmap=JSON.parse(fs.readFileSync('C:/Users/Tran Huu Trung/AppData/Local/Temp/opencode/vi_en_map.json','utf8'));
const strings=JSON.parse(fs.readFileSync('C:/Users/Tran Huu Trung/AppData/Local/Temp/opencode/vi_strings.json','utf8'));
async function tr(s){
  const url='https://api.mymemory.translated.net/get?q='+encodeURIComponent(s)+'&langpair=vi|en';
  const res=await fetch(url);
  const data=await res.json();
  return data.responseData.translatedText || s;
}
const keys=Object.keys(vi.misc).filter(k=>en.misc[k]===vi.misc[k]);
console.log('to translate',keys.length);
let i=0;
async function worker(){
  while(i<keys.length){
    const k=keys[i++];
    const v=vi.misc[k];
    // find original string? use vi value (may have {p0}) not translatable; better translate from strings array by index
    const idx=parseInt(k.slice(1));
    const original=strings[idx];
    if(!original){ en.misc[k]=v; continue; }
    // translate original (with ${}) 
    try{
      const translated=await tr(original);
      // convert ${...} to {p0} if any placeholders in original
      let j=0;
      const converted=translated.replace(/\$\{[^}]*\}/g,()=>`{p${j++}}`);
      // if no placeholders in original but vi has {p0}, keep vi placeholders? 
      en.misc[k]=converted;
      trmap[original]=translated;
    }catch(e){ console.error(k,e.message); en.misc[k]=v; }
    // small delay
    await new Promise(r=>setTimeout(r,200));
  }
}
await Promise.all(Array.from({length:2},()=>worker()));
fs.writeFileSync('src/dictionaries/en.json',JSON.stringify(en,null,2)+'\n');
fs.writeFileSync('C:/Users/Tran Huu Trung/AppData/Local/Temp/opencode/vi_en_map.json',JSON.stringify(trmap,null,2));
console.log('done');