import fs from 'fs';
const v=JSON.parse(fs.readFileSync('src/dictionaries/vi.json','utf8'));
let c=0;for(const k in v.misc){if(String(v.misc[k]).includes('${')) c++}
console.log('template keys',c);