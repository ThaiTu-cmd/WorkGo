import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const JOBS_DIR = path.resolve(__dirname, "../src/components/trung-pages/jobs");

const read = (filename) => fs.readFileSync(path.join(JOBS_DIR, filename), "utf-8");

test("FE-04 / Việc 34: Completely eliminate mockJobs.ts and mockProposals.ts from business flow", () => {
  const pages = ["JobListPage.tsx", "JobPostPage.tsx", "SubmitProposalPage.tsx", "ProposalReviewPage.tsx"];
  for (const page of pages) {
    const content = read(page);
    assert.ok(
      !content.includes("mockJobs"),
      `${page} must not import or reference mockJobs`
    );
    assert.ok(
      !content.includes("mockProposals"),
      `${page} must not import or reference mockProposals`
    );
  }
});

test("FE-04: types.ts defines Job and Proposal domain contracts", () => {
  const typesContent = read("types.ts");
  assert.ok(typesContent.includes("export type JobType"), "types.ts must export JobType");
  assert.ok(typesContent.includes("export const JOB_TYPES"), "types.ts must export JOB_TYPES");
  assert.ok(typesContent.includes("export interface JobSummary"), "types.ts must export JobSummary");
  assert.ok(typesContent.includes("export interface JobDetail"), "types.ts must export JobDetail");
  assert.ok(typesContent.includes("export interface ProposalItem"), "types.ts must export ProposalItem");
  assert.ok(typesContent.includes("export type OrderSyncStatus"), "types.ts must export OrderSyncStatus");
});

test("FE-04: JobListPage performs server-side search, filter, and pagination", () => {
  const content = read("JobListPage.tsx");
  assert.ok(content.includes("jobApi.searchJobs"), "JobListPage must call jobApi.searchJobs");
  assert.ok(content.includes("PAGE_SIZE"), "JobListPage must define PAGE_SIZE");
  assert.ok(content.includes("executionType:"), "JobListPage must pass executionType filter to backend");
  assert.ok(content.includes("categoryId:"), "JobListPage must pass categoryId filter to backend");
  assert.ok(content.includes("totalPages"), "JobListPage must track totalPages from server response");
  assert.ok(content.includes("totalElements"), "JobListPage must track totalElements from server response");
  assert.ok(content.includes("onNavigate(\"submit-proposal\""), "JobListPage must navigate to submit-proposal with jobId");
});

test("FE-04: JobPostPage creates job with DTO and displays input checklist", () => {
  const content = read("JobPostPage.tsx");
  assert.ok(content.includes("jobApi.createJob"), "JobPostPage must call jobApi.createJob");
  assert.ok(content.includes("catalogApi.getRootCategories"), "JobPostPage must load categories");
  assert.ok(content.includes("checklist"), "JobPostPage must calculate input checklist");
  assert.ok(content.includes("TITLE_MIN"), "JobPostPage must enforce TITLE_MIN");
  assert.ok(content.includes("DESC_MIN"), "JobPostPage must enforce DESC_MIN");
  assert.ok(content.includes("locationSnapshot"), "JobPostPage must support locationSnapshot for onsite/delivery");
  assert.ok(content.includes("deadlineAt"), "JobPostPage must support deadlineAt");
});

test("FE-04: SubmitProposalPage guards against negative wallet balance and sanctions", () => {
  const content = read("SubmitProposalPage.tsx");
  assert.ok(content.includes("paymentApi.getWallet"), "SubmitProposalPage must check wallet balance");
  assert.ok(content.includes("isWalletBlocked"), "SubmitProposalPage must maintain isWalletBlocked state");
  assert.ok(content.includes("debtBalance"), "SubmitProposalPage must inspect debtBalance");
  assert.ok(content.includes("providerApi.getMyProfile"), "SubmitProposalPage must check provider profile & sanctions");
  assert.ok(content.includes("isSanctionBlocked"), "SubmitProposalPage must maintain isSanctionBlocked state");
  assert.ok(content.includes("SUSPENDED"), "SubmitProposalPage must block SUSPENDED providers");
  assert.ok(content.includes("jobApi.applyJob"), "SubmitProposalPage must apply to job");
  assert.ok(content.includes("jobApi.submitProposal"), "SubmitProposalPage must submit proposal");
});

test("FE-04: ProposalReviewPage supports concurrency lock, accept/reject, and order sync outbox", () => {
  const content = read("ProposalReviewPage.tsx");
  assert.ok(content.includes("jobApi.getJobProposals"), "ProposalReviewPage must fetch proposals");
  assert.ok(content.includes("jobApi.acceptProposal"), "ProposalReviewPage must accept proposals");
  assert.ok(content.includes("jobApi.rejectProposal"), "ProposalReviewPage must reject proposals");
  assert.ok(content.includes("jobApi.orderSync"), "ProposalReviewPage must check orderSync status");
  assert.ok(content.includes("jobApi.retryOrder"), "ProposalReviewPage must support retryOrder");
  assert.ok(content.includes("processingId"), "ProposalReviewPage must enforce concurrency lock");
});
