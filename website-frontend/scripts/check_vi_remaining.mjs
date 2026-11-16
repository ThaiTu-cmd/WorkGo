import fs from 'fs';import path from 'path';
function walk(d,exts,acc=[]){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p,exts,acc);else if(exts.some(x=>e.name.endsWith(x)))acc.push(p)}return acc}
const files=[...walk('src/_webapp-mirror',['.jsx']),...walk('src/components/trung-pages',['.tsx'])];
const viRe=/[àáảãạăắặẳẵẳặâấậẩẫậèéẻẽẹêếệểễệìíỉĩịòóỏõọôốộổỗộơớợởỡợùúủũụưứựửữựỳýỷỹỵđÀÁẢÃẠĂẮẶẲẴẳẶÂẤẬẨẪẬÈÉẺẼẸÊẾỆỂỄỆÌÍỈĨỊÒÓỎÕỌÔỐỘỔỖỘƠỚỢỞỠỢÙÚỦŨỤƯỨỰỬỮỰỲÝỶỸỴĐ]/;
let count=0;
for(const f of files){
  const s=fs.readFileSync(f,'utf8');
  // strip comments
  const noComments=s.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/.*$/gm,'');
  if(viRe.test(noComments)){ count++; console.log('REMAINING:',f); }
}
console.log('files with Vietnamese in non-comment code:',count);