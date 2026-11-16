import fs from 'fs';
const vi=JSON.parse(fs.readFileSync('src/dictionaries/vi.json','utf8'));
const en=JSON.parse(fs.readFileSync('src/dictionaries/en.json','utf8'));
const k=process.argv[2];
console.log('VI:',vi.misc[k]);
console.log('EN:',en.misc[k]);