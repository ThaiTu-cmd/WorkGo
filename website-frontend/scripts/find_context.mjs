import fs from 'fs';import path from 'path';
function walk(d,exts,acc=[]){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p,exts,acc);else if(exts.some(x=>e.name.endsWith(x)))acc.push(p)}return acc}
const files=[...walk('src/_webapp-mirror',['.jsx']),...walk('src/components/trung-pages',['.tsx'])];
const viRe=/[àáảãạăắặẳẵẳặâấậẩẫậèéẻẽẹêếệểễệìíỉĩịòóỏõọôốộổỗộơớợởỡợùúủũụưứựửữựỳýỷỹỵđÀÁẢÃẠĂẮẶẲẴẳẶÂẤẬẨẪẬÈÉẺẼẸÊẾỆỂỄỆÌÍỈĨỊÒÓỎÕỌÔỐỘỔỖỘƠỚỢỞỠỢÙÚỦŨỤƯỨỰỬỮỰỲÝỶỸỴĐ]/;
for(const f of files){
  const lines=fs.readFileSync(f,'utf8').split(/\r?\n/);
  lines.forEach((ln,i)=>{
    if(viRe.test(ln)){
      // module-level? heuristic: line not inside component? We'll just print count
    }
  });
}
console.log('done');