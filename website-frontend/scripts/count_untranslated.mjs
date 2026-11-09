import fs from 'fs';
const vi=JSON.parse(fs.readFileSync('src/dictionaries/vi.json','utf8'));
const en=JSON.parse(fs.readFileSync('src/dictionaries/en.json','utf8'));
let c=0;for(const k in vi.misc){if(en.misc[k]===vi.misc[k]) c++}
console.log('untranslated misc keys',c);