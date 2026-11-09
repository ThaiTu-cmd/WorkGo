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

let changed=0;
for(const f of files){
  const src=fs.readFileSync(f,'utf8');
  if(!/[àáảãạăắặẳẵẳặâấậẩẫậèéẻẽẹêếệểễệìíỉĩịòóỏõọôốộổỗộơớợởỡợùúủũụưứựửữựỳýỷỹỵđ]/i.test(src)) continue;

  let ast;
  try{
    ast=parser.parse(src,{sourceType:'module',plugins:['jsx','typescript'],errorRecovery:true});
  }catch(e){ console.error('parse fail',f,e.message); continue; }

  let hasReplacement=false;
  let functionDepth=0;
  const componentFunctions=[];

  traverse.default(ast,{
    FunctionDeclaration: {
      enter(path){ functionDepth++;
        const name=path.node.id&&path.node.id.name;
        const isComp = !name || /^[A-Z]/.test(name) || path.parent.type==='ExportDefaultDeclaration';
        if(isComp && path.node.body && path.node.body.type==='BlockStatement') componentFunctions.push(path);
      },
      exit(){ functionDepth--; }
    },
    ArrowFunctionExpression: {
      enter(path){ functionDepth++;
        const parent=path.parent;
        let isComp=false;
        if(parent.type==='VariableDeclarator' && parent.id && /^[A-Z]/.test(parent.id.name)) isComp=true;
        if(path.parentPath && path.parentPath.parent && path.parentPath.parent.type==='ExportDefaultDeclaration') isComp=true;
        if(isComp && path.node.body && path.node.body.type==='BlockStatement') componentFunctions.push(path);
      },
      exit(){ functionDepth--; }
    },
    FunctionExpression: {
      enter(path){ functionDepth++;
        if(path.node.body && path.node.body.type==='BlockStatement' && path.parent.type==='VariableDeclarator' && path.parent.id && /^[A-Z]/.test(path.parent.id.name)) componentFunctions.push(path);
      },
      exit(){ functionDepth--; }
    },
    JSXText(path){
      const raw=path.node.value;
      const trimmed=raw.trim();
      if(!trimmed || !keyOf.has(trimmed)) return;
      const key=keyOf.get(trimmed);
      path.replaceWith(t.jsxExpressionContainer(t.callExpression(t.identifier('t'),[t.stringLiteral(key)])));
      hasReplacement=true;
    },
    JSXAttribute(path){
      const v=path.get('value');
      if(!v.isStringLiteral()) return;
      const val=v.node.value.trim();
      if(!keyOf.has(val)) return;
      const key=keyOf.get(val);
      v.replaceWith(t.jsxExpressionContainer(t.callExpression(t.identifier('t'),[t.stringLiteral(key)])));
      hasReplacement=true;
    },
    StringLiteral(path){
      const val=path.node.value.trim();
      if(!keyOf.has(val)) return;
      if(path.parent && (path.parent.type==='ImportDeclaration' || path.parent.type==='ExportNamedDeclaration' || path.parent.type==='ExportAllDeclaration')) return;
      const key=keyOf.get(val);
      const orig=strings.find(s=>s.trim()===val);
      if(functionDepth<=0){
        const en=trmap[orig] || val;
        path.replaceWith(t.stringLiteral(en));
      } else {
        path.replaceWith(t.callExpression(t.identifier('t'),[t.stringLiteral(key)]));
      }
      hasReplacement=true;
    }
  });

  if(!hasReplacement){ continue; }

  for(const p of componentFunctions){
    const body=p.node.body;
    const already=body.body.some(s=> s.type==='VariableDeclaration' && s.declarations.some(d=> d.id && d.id.name==='t' && d.init && d.init.callee && d.init.callee.name==='useTranslations'));
    if(already) continue;
    const stmt=t.variableDeclaration('const',[t.variableDeclarator(t.identifier('t'),t.callExpression(t.identifier('useTranslations'),[t.stringLiteral('misc')]))]);
    body.body.unshift(stmt);
  }

  const hasImport=ast.program.body.some(n=> n.type==='ImportDeclaration' && n.source.value==='next-intl');
  if(!hasImport){
    const imp=t.importDeclaration([t.importSpecifier(t.identifier('useTranslations'),t.identifier('useTranslations'))],t.stringLiteral('next-intl'));
    ast.program.body.unshift(imp);
  } else {
    const imp=ast.program.body.find(n=> n.type==='ImportDeclaration' && n.source.value==='next-intl');
    if(imp && !imp.specifiers.some(s=> s.imported && s.imported.name==='useTranslations')){
      imp.specifiers.push(t.importSpecifier(t.identifier('useTranslations'),t.identifier('useTranslations')));
    }
  }

  const out=generator.default(ast,{retainLines:false}).code;
  fs.writeFileSync(f,out);
  changed++;
  console.log('updated',f);
}
console.log('changed files',changed);