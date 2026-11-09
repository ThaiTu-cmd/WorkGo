import fs from 'fs';
const s=fs.readFileSync('src/components/trung-pages/jobs/SubmitProposalPage.tsx','utf8');
const lines=s.split(/\n/);
// find validate functions
const start=lines.findIndex(l=>/export function validate/.test(l));
console.log(lines.slice(start,start+30).join('\n'));