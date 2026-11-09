import fs from 'fs';import path from 'path';
import parser from '@babel/parser';
import traverse from '@babel/traverse';
import generator from '@babel/generator';
import t from '@babel/types';

const strings=JSON.parse(fs.readFileSync('C:/Users/Tran Huu Trung/AppData/Local/Temp/opencode/vi_strings.json','utf8'));
const trmap=JSON.parse(fs.readFileSync('C:/Users/Tran Huu Trung/AppData/Local/Temp/opencode/vi_en_map.json','utf8'));
const keyOf=new Map();
strings.forEach((s,i)=>keyOf.set(s.trim(),'m'+i));

function walk(d,exts,acc=[]){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p,exts,acc);else if(exts.some(x=>e.name.endsWith(x)))acc.push(p)}return acc}
const files=[...walk('src/_webapp-mirror',['.jsx']),...walk('src/components/trung-pages',['.tsx'])];

let newKeys=0;
for(const f of files){
  const src=fs.readFileSync(f,'utf8');
  if(!/[àáảãạăắặẳẵẳặâấậẩẫậèéẻẽẹêếệểễệìíỉĩịòóỏõọôốộổỗộơớợởỡợùúủũụưứựửữựỳýỷỹỵđ]/i.test(src)) continue;

  let ast;
  try{ ast=parser.parse(src,{sourceType:'module',plugins:['jsx','typescript'],errorRecovery:true}); }
  catch(e){ console.error('parse fail',f,e.message); continue; }

  let functionDepth=0;
  let changedFile=false;

  traverse.default(ast,{
    FunctionDeclaration:{enter(){functionDepth++;},exit(){functionDepth--;}},
    ArrowFunctionExpression:{enter(){functionDepth++;},exit(){functionDepth--;}},
    FunctionExpression:{enter(){functionDepth++;},exit(){functionDepth--;}},
    TemplateLiteral(path){
      const node=path.node;
      const quasis=node.quasis;
      const exprs=node.expressions;
      // check vietnamese in any quasi
      const viRe=/[àáảãạăắặẳẵẳặâấậẩẫậèéẻẽẹêếệểễệìíỉĩịòóỏõọôốộổỗộơớợởỡợùúủũụưứựửữựỳýỷỹỵđ]/i;
      if(!quasis.some(q=>viRe.test(q.value.raw))) return;

      // reconstruct raw template
      let rawTpl='';
      for(let i=0;i<quasis.length;i++){
        rawTpl += quasis[i].value.raw;
        if(i<exprs.length){
          rawTpl += '${' + generator.default(exprs[i],{}).code + '}';
        }
      }
      const trimmed=rawTpl.trim();
      let key=keyOf.get(trimmed);
      if(!key){
        key='m'+strings.length;
        strings.push(trimmed);
        trmap[trimmed]=trimmed; // placeholder; need translation? try map already? no
        keyOf.set(trimmed,key);
        newKeys++;
      }
      const enTranslation = trmap[trimmed] || trimmed;

      if(functionDepth>0){
        // component-level: tr(key, {p0: expr,...})
        const props=exprs.map((expr,i)=> t.objectProperty(t.identifier('p'+i), expr));
        const call = exprs.length
          ? t.callExpression(t.identifier('tr'), [t.stringLiteral(key), t.objectExpression(props)])
          : t.callExpression(t.identifier('tr'), [t.stringLiteral(key)]);
        path.replaceWith(call);
      } else {
        // module-level: english template literal preserving exprs
        const parts = enTranslation.split(/\$\{[^}]*\}/);
        // ensure parts length = exprs.length+1
        const qs=[];
        for(let i=0;i<=exprs.length;i++){
          const part = parts[i] || '';
          qs.push(t.templateElement({raw:part, cooked:part}, i===exprs.length));
        }
        path.replaceWith(t.templateLiteral(qs, [...exprs]));
      }
      changedFile=true;
    }
  });

  if(changedFile){
    fs.writeFileSync(f,generator.default(ast,{}).code);
    console.log('updated',f);
  }
}
// save strings/map
fs.writeFileSync('C:/Users/Tran Huu Trung/AppData/Local/Temp/opencode/vi_strings.json',JSON.stringify(strings,null,2));
fs.writeFileSync('C:/Users/Tran Huu Trung/AppData/Local/Temp/opencode/vi_en_map.json',JSON.stringify(trmap,null,2));
console.log('new keys',newKeys);