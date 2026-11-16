import fs from 'fs';import path from 'path';
import parser from '@babel/parser';
import traverse from '@babel/traverse';
function walk(d,exts,acc=[]){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p,exts,acc);else if(exts.some(x=>e.name.endsWith(x)))acc.push(p)}return acc}
const files=[...walk('src/_webapp-mirror',['.jsx']),...walk('src/components/trung-pages',['.tsx'])];
const viRe=/[àáảãạăắặẳẵẳặâấậẩẫậèéẻẽẹêếệểễệìíỉĩịòóỏõọôốộổỗộơớợởỡợùúủũụưứựửữựỳýỷỹỵđ]/i;
const set=new Set();
for(const f of files){
  const src=fs.readFileSync(f,'utf8');
  let ast; try{ ast=parser.parse(src,{sourceType:'module',plugins:['jsx','typescript'],errorRecovery:true}); }catch(e){continue;}
  traverse.default(ast,{
    JSXText(path){ const v=path.node.value.trim(); if(v && viRe.test(v)) set.add(v); },
    JSXAttribute(path){ const v=path.get('value'); if(v.isStringLiteral() && viRe.test(v.node.value)) set.add(v.node.value.trim()); },
    StringLiteral(path){
      if(path.parent && (path.parent.type==='ImportDeclaration')) return;
      const v=path.node.value.trim(); if(v && viRe.test(v)) set.add(v);
    },
    TemplateElement(path){ const v=path.node.value.raw.trim(); if(v && viRe.test(v)) set.add(v); }
  });
}
const arr=[...set];
fs.writeFileSync('C:/Users/Tran Huu Trung/AppData/Local/Temp/opencode/remaining_vi.json',JSON.stringify(arr,null,2));
console.log('remaining unique:',arr.length);