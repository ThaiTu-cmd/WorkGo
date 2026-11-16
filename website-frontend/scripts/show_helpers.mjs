import fs from 'fs';
const s=fs.readFileSync('src/components/trung-pages/jobs/JobPostPage.tsx','utf8');
console.log(s.slice(s.indexOf('export function validateJobTitle'), s.indexOf('export default function')));