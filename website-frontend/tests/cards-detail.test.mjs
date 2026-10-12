import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

test("Task 3 - PostCard implements gig-pattern (cover 16:10, badge exec, provider row, price Từ)", () => {
  const cardPath = path.join(ROOT, "src/components/composed/post-card.tsx");
  const content = fs.readFileSync(cardPath, "utf-8");

  assert.match(content, /aspect-\[16\/10\]|aspect-video/, "PostCard must have 16:10 cover container");
  assert.match(content, /#00732E/, "PostCard provider row must feature verified shield #00732E");
  assert.match(content, /APPOINTMENT/, "PostCard must support APPOINTMENT execution type");
  assert.match(content, /Từ\s*|formatVND/, "PostCard must format budget starting with Từ");
});

test("Task 3 - PostDetailPage implements 2-col sticky layout, hasApplied, and marketplace trust FAQ", () => {
  const detailPath = path.join(ROOT, "src/app/[locale]/(public)/posts/[id]/page.tsx");
  const content = fs.readFileSync(detailPath, "utf-8");

  assert.match(content, /sticky top-/, "Detail page must feature sticky action sidebar");
  assert.match(content, /hasApplied/, "Detail page must query hasApplied status");
  assert.match(content, /ProposalDrawer/, "Detail page must wire ProposalDrawer");
  assert.match(content, /#00732E/, "Client profile must feature verified shield #00732E");
  assert.match(content, /Escrow|bảo vệ|Bảo đảm/i, "Detail page must display escrow / marketplace protection FAQ");
});

test("Task 3 - ServiceCard contract component exists for Service API readiness", () => {
  const serviceCardPath = path.join(ROOT, "src/components/composed/service-card.tsx");
  assert.ok(fs.existsSync(serviceCardPath), "service-card.tsx must exist");
  const content = fs.readFileSync(serviceCardPath, "utf-8");
  assert.match(content, /ServiceCardProps/, "service-card.tsx must define ServiceCardProps");
  assert.match(content, /DIGITAL.*APPOINTMENT/, "ServiceCardProps must support execution_type union");
});
