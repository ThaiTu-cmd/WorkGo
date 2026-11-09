import fs from 'fs';import path from 'path';
function walk(d,exts,acc=[]){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p,exts,acc);else if(exts.some(x=>e.name.endsWith(x)))acc.push(p)}return acc}
const files=[...walk('src/_webapp-mirror',['.jsx']),...walk('src/components/trung-pages',['.tsx'])];
let n=0;
for(const f of files){
  let s=fs.readFileSync(f,'utf8');
  if(!s.includes("useTranslations('misc')") && !s.includes('useTranslations("misc")')) continue;
  const orig=s;
  s=s.replace(/const t = useTranslations\('misc'\)/g,"const tr = useTranslations('misc')");
  s=s.replace(/const t = useTranslations\("misc"\)/g,'const tr = useTranslations("misc")');
  // replace t("m123") / t('m123') calls
  s=s.replace(/\bt\(("m\d+")\)/g,'tr($1)');
  s=s.replace(/\bt\(('m\d+')\)/g,'tr($1)');
  if(s!==orig){fs.writeFileSync(f,s);n++;}
}
console.log('renamed files',n);