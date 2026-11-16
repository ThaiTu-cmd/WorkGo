import fs from 'fs';
const files=process.argv.slice(2);
for(const f of files){
  const s=fs.readFileSync(f,'utf8');
  console.log('===',f);
  s.split(/\n/).forEach((l,i)=>{ if(l.includes('tr(')) console.log(i+1,l.trim()); });
}