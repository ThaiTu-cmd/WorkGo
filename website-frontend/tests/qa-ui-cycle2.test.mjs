import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, "../../");
const WEBSITE = path.join(REPO, "website-frontend");
const TRUNG = path.join(WEBSITE, "src/components/trung-pages");
const read = (p) => fs.readFileSync(p, "utf-8");

function extractBlock(css, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`${escaped}\\s*\\{([^}]*)\\}`);
  const match = css.match(re);
  assert.ok(match, `CSS selector '${selector}' was not found in stylesheet`);
  return match[1];
}

// ---------------------------------------------------------------------------
// CY2-01: TrungSubNav roving keyboard navigation (Arrow/Home/End + centering)
// ---------------------------------------------------------------------------
test("CY2-01: TrungSubNav supports Arrow/Home/End keyboard navigation with centered scrollIntoView", () => {
  const tsx = read(path.join(TRUNG, "_ui/TrungSubNav.tsx"));

  assert.match(tsx, /onKeyDown/, "keyboard handler must be wired into the SubNav");
  for (const key of ['"ArrowLeft"', '"ArrowRight"', '"Home"', '"End"']) {
    assert.ok(tsx.includes(key), `keyboard handler must handle ${key}`);
  }
  assert.match(tsx, /e\.preventDefault\(\)/, "Arrow keys must prevent default horizontal scroll");
  assert.match(
    tsx,
    /scrollIntoView\(\{\s*block:\s*"nearest",\s*inline:\s*"center"\s*\}\)/,
    "focused button must be centered horizontally without jumping the page"
  );
  assert.match(tsx, /document\.activeElement/, "roving focus must start from the active element");
  assert.match(tsx, /instanceof HTMLButtonElement/, "only button elements participate in roving focus");
  assert.match(tsx, /buttons\[next\]\.focus\(\)/, "next button must receive focus");

  const linkCount = (tsx.match(/\{ key: "/g) || []).length;
  assert.equal(linkCount, 15, "LINKS must keep exactly 15 entries");

  assert.ok(
    tsx.includes('aria-label="Điều hướng bổ sung WorkGo"'),
    "nav aria-label must be preserved"
  );
  assert.match(tsx, /aria-current/, "aria-current contract must be preserved");
});

// ---------------------------------------------------------------------------
// CY2-02: fade data-attributes, SSR-safe listeners, no React state
// ---------------------------------------------------------------------------
test("CY2-02: TrungSubNav publishes scroll fade via data-attributes with no useState", () => {
  const tsx = read(path.join(TRUNG, "_ui/TrungSubNav.tsx"));

  assert.match(tsx, /dataset\.fadeLeft/, "left fade edge must be published via data attribute");
  assert.match(tsx, /dataset\.fadeRight/, "right fade edge must be published via data attribute");
  assert.match(tsx, /inner\.scrollLeft > 2/, "left fade threshold must use scrollLeft epsilon");
  assert.match(tsx, /inner\.scrollWidth - 2/, "right fade threshold must use scrollWidth epsilon");
  assert.match(
    tsx,
    /addEventListener\("scroll", update, \{ passive: true \}\)/,
    "scroll listener must be passive"
  );
  assert.match(
    tsx,
    /typeof ResizeObserver !== "undefined"/,
    "ResizeObserver must be feature-guarded for SSR safety"
  );
  assert.match(tsx, /document\.fonts/, "webfont re-measure must be scheduled via document.fonts");
  assert.ok(
    !tsx.includes("useState"),
    "component must stay state-free (DOM attributes only, no setState-in-effect)"
  );
});

// ---------------------------------------------------------------------------
// CY2-03: CSS fade masks pair with TSX attributes and keep container contract
// ---------------------------------------------------------------------------
test("CY2-03: CSS fade masks pair with data attributes, keep scroll contract and reduced-motion", () => {
  const css = read(path.join(TRUNG, "_ui/TrungSubNav.module.css"));
  const tsx = read(path.join(TRUNG, "_ui/TrungSubNav.tsx"));

  // Existing cycle-1 contracts must remain intact
  assert.match(extractBlock(css, ".bar"), /overflow:\s*hidden;/);
  const inner = extractBlock(css, ".inner");
  assert.match(inner, /max-width:\s*1320px;/);
  assert.match(inner, /scrollbar-width:\s*none;/);
  // Cycle-2 addition
  assert.match(inner, /scroll-padding-inline:\s*36px;/);

  // Combined pseudo-element block
  const combined = css.match(/\.bar::before,\s*\.bar::after\s*\{([^}]*)\}/);
  assert.ok(combined, ".bar::before/.bar::after rule must exist");
  assert.match(combined[1], /content:\s*"";/, "mask pseudo-elements need declared content");
  assert.match(combined[1], /pointer-events:\s*none;/, "masks must not intercept clicks");
  assert.match(combined[1], /opacity:\s*0;/, "masks must start hidden");

  // Left/right edges hug the .inner (max-width 1320px, centered)
  assert.match(
    css,
    /\.bar::before\s*\{[^}]*left:\s*max\(\s*0px,\s*calc\(\(\s*100%\s*-\s*1320px\s*\)\s*\/\s*2\)\s*\);/,
    "left mask must hug the inner container"
  );
  assert.match(
    css,
    /\.bar::after\s*\{\s*right:\s*max\(\s*0px,\s*calc\(\(\s*100%\s*-\s*1320px\s*\)\s*\/\s*2\)\s*\);/,
    "right mask must hug the inner container"
  );

  // Gradients
  assert.match(css, /\.bar::before\s*\{[^}]*linear-gradient\(to right/, "left mask needs gradient");
  assert.match(css, /\.bar::after\s*\{\s*right:[^}]*linear-gradient\(to left/, "right mask needs gradient");

  // Attribute-driven visibility
  assert.match(
    css,
    /\.bar\[data-fade-left="true"\]::before,\s*\.bar\[data-fade-right="true"\]::after\s*\{[^}]*opacity:\s*1;/,
    "mask opacity must be driven by data-fade-* attributes"
  );

  // Reduced motion
  assert.match(
    css,
    /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[\s\S]*?\.bar::before,\s*\.bar::after\s*\{[\s\S]*?transition:\s*none;/,
    "mask transition must be disabled under prefers-reduced-motion"
  );

  // Pairing: TSX publisher <-> CSS consumer
  assert.match(tsx, /fadeLeft/);
  assert.match(tsx, /fadeRight/);
  assert.match(css, /data-fade-left/);
  assert.match(css, /data-fade-right/);
});

// ---------------------------------------------------------------------------
// CY2-04: rAF-coalesced offline height sync (locked ResizeObserver contract)
// ---------------------------------------------------------------------------
test("CY2-04: offline sync is rAF-coalesced while ResizeObserver and inline style contract stay intact", () => {
  const tsx = read(path.join(WEBSITE, "src/components/webapp-bridge/webapp-shell.tsx"));

  assert.match(tsx, /requestAnimationFrame/, "sync must be coalesced into one rAF frame");
  assert.match(tsx, /cancelAnimationFrame/, "pending rAF must be cancelled on cleanup");
  assert.match(tsx, /let rafId = 0;/, "rafId guard variable must exist");
  assert.match(tsx, /if \(rafId\) return;/, "re-entrant sync calls within a frame must be dropped");

  // Cycle-1 locked tokens (QA-UI-FIX-09) must survive verbatim
  assert.match(tsx, /const observer = new ResizeObserver\(sync\);/);
  assert.match(tsx, /root\.style\.setProperty\("--offline-h", `\$\{banner\.offsetHeight\}px`\);/);
});

// ---------------------------------------------------------------------------
// CY2-05: JobPostPage inline validation on blur (shared validators + ARIA)
// ---------------------------------------------------------------------------
test("CY2-05: JobPostPage validates on blur with shared validators and wired aria-describedby", () => {
  const tsx = read(path.join(TRUNG, "jobs/JobPostPage.tsx"));

  assert.match(tsx, /export function validateJobTitle/);
  assert.match(tsx, /export function validateJobDescription/);
  assert.match(tsx, /export function validateJobBudget/);

  const onBlurCount = (tsx.match(/onBlur=/g) || []).length;
  assert.ok(onBlurCount >= 3, `expected at least 3 onBlur handlers, found ${onBlurCount}`);

  // Messages must stay character-identical with the submit-time messages
  assert.match(tsx, /Vui lòng nhập tiêu đề từ \$\{TITLE_MIN\}/);
  assert.match(tsx, /Tiêu đề quá dài/);
  assert.match(tsx, /Giá gói phải là số lớn hơn 0!/);
  assert.match(tsx, /Giá tối thiểu là \$\{PRICE_MIN/);

  assert.match(tsx, /id="jobpost-title-error"/);
  assert.match(tsx, /aria-describedby=\{errors\.title \? "jobpost-title-error"/);

  const ariaInvalidCount = (tsx.match(/aria-invalid/g) || []).length;
  assert.ok(ariaInvalidCount >= 3, `expected aria-invalid on >= 3 fields, found ${ariaInvalidCount}`);

  // Submit still uses the shared validators behind the same guard
  assert.match(tsx, /if \(next\.title \?\? next\.description \?\? next\.budget\) return;/);
});

// ---------------------------------------------------------------------------
// CY2-06: SubmitProposalPage inline validation on blur (4 fields)
// ---------------------------------------------------------------------------
test("CY2-06: SubmitProposalPage validates all four fields on blur with shared validators", () => {
  const tsx = read(path.join(TRUNG, "jobs/SubmitProposalPage.tsx"));

  assert.match(tsx, /export function validateProposalJob/);
  assert.match(tsx, /export function validateProposalBid/);
  assert.match(tsx, /export function validateProposalDuration/);
  assert.match(tsx, /export function validateProposalMessage/);

  const onBlurCount = (tsx.match(/onBlur=/g) || []).length;
  assert.ok(onBlurCount >= 4, `expected at least 4 onBlur handlers, found ${onBlurCount}`);

  // Messages stay character-identical with submit-time copy
  assert.match(tsx, /Vui lòng chọn việc cần gửi đề xuất!/);
  assert.match(tsx, /Giá gói phải là số lớn hơn 0!/);
  assert.match(tsx, /Thời gian thực hiện tối thiểu 1 ngày!/);
  assert.match(tsx, /Vui lòng nhập lời nhắn chi tiết từ 20 ký tự trở lên!/);

  // Error element ids
  assert.match(tsx, /id="proposal-job-error"/);
  assert.match(tsx, /id="proposal-bid-error"/);
  assert.match(tsx, /id="proposal-duration-error"/);
  assert.match(tsx, /id="proposal-message-error"/);

  // Duplicate guard + submit guard preserved
  assert.match(tsx, /Bạn đã gửi đề xuất cho việc này!/);
  assert.match(tsx, /if \(next\.job \?\? next\.bid \?\? next\.duration \?\? next\.message\) return;/);
});

// ---------------------------------------------------------------------------
// CY2-07: PayoutSettingsPage inline validation on blur (3 fields)
// ---------------------------------------------------------------------------
test("CY2-07: PayoutSettingsPage validates three fields on blur and keeps mask contract", () => {
  const tsx = read(path.join(TRUNG, "payment/PayoutSettingsPage.tsx"));

  assert.match(tsx, /export function validatePayoutBank/);
  assert.match(tsx, /export function validatePayoutHolder/);
  assert.match(tsx, /export function validatePayoutAccount/);

  const onBlurCount = (tsx.match(/onBlur=/g) || []).length;
  assert.ok(onBlurCount >= 3, `expected at least 3 onBlur handlers, found ${onBlurCount}`);

  // Messages stay character-identical with submit-time copy
  assert.match(tsx, /Vui lòng nhập tên ngân hàng từ 2 ký tự!/);
  assert.match(tsx, /Vui lòng nhập tên chủ tài khoản từ 2 ký tự!/);
  assert.match(tsx, /Số tài khoản phải gồm 8-19 chữ số!/);

  // Error element ids
  assert.match(tsx, /id="payout-bank-error"/);
  assert.match(tsx, /id="payout-holder-error"/);
  assert.match(tsx, /id="payout-account-error"/);

  // maskAccount contract survives (cycle-1 pin)
  assert.match(tsx, /export function maskAccount/);
});

// ---------------------------------------------------------------------------
// CY2-08: submit semantics intact across the three upgraded forms
// ---------------------------------------------------------------------------
test("CY2-08: submit semantics intact across the three upgraded forms", () => {
  const cases = [
    {
      file: "jobs/JobPostPage.tsx",
      guard: /if \(next\.title \?\? next\.description \?\? next\.budget\) return;/,
    },
    {
      file: "jobs/SubmitProposalPage.tsx",
      guard: /if \(next\.job \?\? next\.bid \?\? next\.duration \?\? next\.message\) return;/,
    },
    {
      file: "payment/PayoutSettingsPage.tsx",
      guard: /if \(next\.bankName \?\? next\.accountName \?\? next\.accountNumber\) return;/,
    },
  ];

  for (const c of cases) {
    const tsx = read(path.join(TRUNG, c.file));
    assert.match(tsx, /setErrors\(next\)/, `${c.file} submit must publish shared-validator errors`);
    assert.match(tsx, c.guard, `${c.file} submit guard must be preserved`);
    assert.match(tsx, /setErrors\(\(prev\) =>/, `${c.file} must re-validate live on blur/change`);
  }
});

// ---------------------------------------------------------------------------
// CY2-09: a11y toast flow pins (role=status == implicit aria-live polite)
// ---------------------------------------------------------------------------
test("CY2-09: a11y toast flow pins for submit / accept / top-up actions", () => {
  // role="status" implies aria-live="polite" + aria-atomic="true" per ARIA spec,
  // so toasts are announced without a duplicated aria-live attribute.
  const shell = read(path.join(WEBSITE, "src/components/webapp-bridge/webapp-shell.tsx"));
  assert.match(shell, /role="status"/);

  assert.match(
    read(path.join(TRUNG, "jobs/SubmitProposalPage.tsx")),
    /onShowToast\("Đã gửi đề xuất cho client!"\)/
  );
  assert.match(
    read(path.join(TRUNG, "jobs/ProposalReviewPage.tsx")),
    /onShowToast\("Đã chấp nhận đề xuất, các đề xuất còn lại tự động từ chối!"\)/
  );
  assert.match(
    read(path.join(TRUNG, "payment/PaymentGatewayPage.tsx")),
    /Đã xác nhận thanh toán/
  );
});

// ---------------------------------------------------------------------------
// CY2-10: cycle-2 sweep evidence (T1-T6 all pass, zero console errors)
// ---------------------------------------------------------------------------
test("CY2-10: cycle-2 sweep evidence shows T1-T6 all passing with zero console errors", () => {
  const evidencePath = path.join(REPO, ".team/evidence/ui-cycle2/sweep-results.json");
  assert.ok(fs.existsSync(evidencePath), "sweep evidence JSON must exist");
  const ev = JSON.parse(fs.readFileSync(evidencePath, "utf-8"));
  assert.equal(ev.pass, true, "sweep overall pass must be true");
  assert.equal(ev.failCount, 0, "sweep failCount must be 0");
  assert.deepEqual(ev.consoleErrors, [], "no console errors allowed");
  for (const id of ["T1", "T2", "T3", "T4", "T5", "T6"]) {
    assert.ok(ev.checks && ev.checks[id], `checks.${id} must exist`);
    assert.equal(ev.checks[id].pass, true, `checks.${id}.pass must be true`);
  }
});
