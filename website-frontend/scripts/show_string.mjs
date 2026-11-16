import fs from 'fs';
const s=JSON.parse(fs.readFileSync('C:/Users/Tran Huu Trung/AppData/Local/Temp/opencode/vi_strings.json','utf8'));
console.log(JSON.stringify(s[1460]));