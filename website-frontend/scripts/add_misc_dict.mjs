import fs from 'fs';
const strings=JSON.parse(fs.readFileSync('C:/Users/Tran Huu Trung/AppData/Local/Temp/opencode/vi_strings.json','utf8'));
const trmap=JSON.parse(fs.readFileSync('C:/Users/Tran Huu Trung/AppData/Local/Temp/opencode/vi_en_map.json','utf8'));
const vi=JSON.parse(fs.readFileSync('src/dictionaries/vi.json','utf8'));
const en=JSON.parse(fs.readFileSync('src/dictionaries/en.json','utf8'));
const miscVi={};const miscEn={};
strings.forEach((s,i)=>{
  const key='m'+i;
  miscVi[key]=s.trim();
  miscEn[key]=trmap[s.trim()]||s.trim();
});
vi.misc=miscVi; en.misc=miscEn;
fs.writeFileSync('src/dictionaries/vi.json',JSON.stringify(vi,null,2)+'\n');
fs.writeFileSync('src/dictionaries/en.json',JSON.stringify(en,null,2)+'\n');
console.log('added misc',Object.keys(miscVi).length);