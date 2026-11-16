import fs from 'fs';import path from 'path';
function walk(d,exts,acc=[]){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p,exts,acc);else if(exts.some(x=>e.name.endsWith(x)))acc.push(p)}return acc}
const files=[...walk('src/_webapp-mirror',['.jsx']),...walk('src/components/trung-pages',['.tsx'])];
const viRe=/[àáảãạăắặẳẵẳặâấậẩẫậèéẻẽẹêếệểễệìíỉĩịòóỏõọôốộổỗộơớợởỡợùúủũụưứựửữựỳýỷỹỵđÀÁẢÃẠĂẮẶẲẴẳẶÂẤẬẨẪẬÈÉẺẼẸÊẾỆỂỄỆÌÍỈĨỊÒÓỎÕỌÔỐỘỔỖỘƠỚỢỞỠỢÙÚỦŨỤƯỨỰỬỮỰỲÝỶỸỴĐ]/;
const set=new Set();
for(const f of files){
  const s=fs.readFileSync(f,'utf8');
  const re=/"([^"]*)"|'([^']*)'|`([^`]*)`/g;
  let m;while((m=re.exec(s))){const str=m[1]||m[2]||m[3]; if(str && viRe.test(str)) set.add(str.trim());}
  const re2=/>([^<>]+)</g;while((m=re2.exec(s))){const str=m[1].trim(); if(str && viRe.test(str)) set.add(str);}
}
console.log('unique Vietnamese-containing strings:',set.size);
fs.writeFileSync('C:/Users/Tran Huu Trung/AppData/Local/Temp/opencode/vi_strings.json',JSON.stringify([...set],null,2));