import fs from 'fs';
const vi=JSON.parse(fs.readFileSync('src/dictionaries/vi.json','utf8'));
const en=JSON.parse(fs.readFileSync('src/dictionaries/en.json','utf8'));
function convert(str){
  let i=0;
  return String(str).replace(/\$\{[^}]*\}/g,()=>`{p${i++}}`);
}
let c=0;
for(const k in vi.misc){
  if(String(vi.misc[k]).includes('${')){
    vi.misc[k]=convert(vi.misc[k]);
    en.misc[k]=convert(en.misc[k]);
    c++;
  }
}
fs.writeFileSync('src/dictionaries/vi.json',JSON.stringify(vi,null,2)+'\n');
fs.writeFileSync('src/dictionaries/en.json',JSON.stringify(en,null,2)+'\n');
console.log('converted',c);