import { execSync } from 'child_process';
import fs from 'fs';
const files=[
 'src/components/trung-pages/payment/WalletPage.tsx',
 'src/components/trung-pages/jobs/JobListPage.tsx',
 'src/components/trung-pages/jobs/JobPostPage.tsx',
 'src/components/trung-pages/jobs/SubmitProposalPage.tsx',
 'src/components/trung-pages/jobs/ProposalReviewPage.tsx',
 'src/components/trung-pages/trust/DisputeCenterPage.tsx',
 'src/components/trung-pages/messages/MessagesPage.tsx',
 'src/components/trung-pages/public/PublicInfoPage.tsx',
];
for(const f of files){
  const out=execSync(`git show HEAD:website-frontend/${f}`, {encoding:'utf8'});
  const lines=out.split(/\n/).filter(l=>/⚠|Mock Demo|Prototype Mode|Demo/i.test(l));
  console.log('===',f);
  lines.forEach(l=>console.log(l.trim()));
}