import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf-8");
const exists = (p) => fs.existsSync(path.join(ROOT, p));

test("LBR-01: All 9 static info route pages exist in (public)", () => {
  const routes = [
    "src/app/[locale]/(public)/about/page.tsx",
    "src/app/[locale]/(public)/pricing/page.tsx",
    "src/app/[locale]/(public)/pro/page.tsx",
    "src/app/[locale]/(public)/guides/page.tsx",
    "src/app/[locale]/(public)/guides/[id]/page.tsx",
    "src/app/[locale]/(public)/help/page.tsx",
    "src/app/[locale]/(public)/terms/page.tsx",
    "src/app/[locale]/(public)/privacy/page.tsx",
    "src/app/[locale]/(public)/trust-safety/page.tsx",
  ];
  for (const r of routes) {
    assert.ok(exists(r), `Route page must exist: ${r}`);
  }
});

test("LBR-02: Header WorkGo Pro link points to /pro instead of generic /posts", () => {
  const src = read("src/components/landing/fiverr/fiverr-header.tsx");
  assert.match(src, /content\.nav\.pro,\s*href:\s*`\/\$\{locale\}\/pro`/);
});

test("LBR-03: Category tiles and popular cards build ?q= queries dynamically", () => {
  const cats = read("src/components/landing/fiverr/fiverr-category-grid.tsx");
  assert.match(cats, /\/posts\?q=\$\{encodeURIComponent\(item\.label\)\}/);

  const pop = read("src/components/landing/fiverr/fiverr-popular-services.tsx");
  assert.match(pop, /\/posts\?q=\$\{encodeURIComponent\(service\.title\)\}/);
});

test("LBR-04: Guides section links point to /guides and specific /guides/${guide.id}", () => {
  const src = read("src/components/landing/fiverr/fiverr-guides.tsx");
  assert.match(src, /href=\{`\/\$\{locale\}\/guides`\}/);
  assert.match(src, /href=\{`\/\$\{locale\}\/guides\/\$\{guide\.id\}`\}/);
});

test("LBR-05: Footer column links and socials point to valid info routes and links", () => {
  const footerSrc = read("src/components/landing/fiverr/fiverr-footer.tsx");
  assert.match(footerSrc, /footerHref\(locale,\s*column\.heading,\s*link\)/);
  assert.match(footerSrc, /<Link[^>]+href=\{`\/\$\{locale\}\$\{SOCIAL_HREFS\[key\]/);
});

test("LBR-06: Zero dead href='#' and zero fake cursor-pointer spans in landing components", () => {
  const walk = (dir) => {
    let results = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results = results.concat(walk(full));
      } else if (/\.(tsx|ts)$/.test(entry.name)) {
        results.push(full);
      }
    }
    return results;
  };

  const files = walk(path.join(ROOT, "src/components/landing"));
  for (const f of files) {
    const code = fs.readFileSync(f, "utf-8");
    assert.doesNotMatch(
      code,
      /href\s*=\s*["']#["']/,
      `File ${path.relative(ROOT, f)} must not contain dead href="#"`
    );
    assert.doesNotMatch(
      code,
      /<span[^>]*pressable[^>]*cursor-pointer/,
      `File ${path.relative(ROOT, f)} must not contain fake button spans`
    );
  }
});

test("LBR-07: info-content.ts provides locale fallback and guide detail lookup", async () => {
  const mod = await import("../src/lib/landing/info-content.ts");
  const vi = mod.getInfoContent("vi", "about");
  const fr = mod.getInfoContent("fr", "about");
  const empty = mod.getInfoContent("", "about");
  const nullish = mod.getInfoContent(null, "about");

  assert.deepEqual(fr, vi, "Locale 'fr' must fallback to Vietnamese");
  assert.deepEqual(empty, vi, "Empty locale must fallback to Vietnamese");
  assert.deepEqual(nullish, vi, "Null locale must fallback to Vietnamese");

  const guide = mod.getGuideDetail("vi", "guide-brief");
  assert.ok(guide, "guide-brief must return details");
  assert.equal(guide.guide.id, "guide-brief");
  assert.ok(guide.steps.length >= 4, "steps length >= 4");

  const invalid = mod.getGuideDetail("vi", "guide-unknown-id");
  assert.equal(invalid, null, "Unknown guide id must return null");
});

test("LBR-08: FiverrButton enforces mandatory href string and eliminates default '#'", () => {
  const src = read("src/components/landing/fiverr/fiverr-button.tsx");
  assert.doesNotMatch(src, /href\s*=\s*["']#["']/);
  assert.match(src, /href:\s*string/);
});

test("LBR-09: Target anchors in static pages exist and are defined correctly", async () => {
  const mod = await import("../src/lib/landing/info-content.ts");
  const pages = ["about", "pricing", "pro", "help", "terms", "privacy", "trustSafety"];

  for (const p of pages) {
    const c = mod.getInfoContent("vi", p);
    assert.ok(c.anchors.length > 0, `${p} must have at least 1 anchor defined`);
  }

  // Help page must have payments, refunds, faq, community
  const help = mod.getInfoContent("vi", "help");
  const helpAnchorIds = help.anchors.map((a) => a.id);
  for (const id of ["faq", "payments", "refunds", "community"]) {
    assert.ok(helpAnchorIds.includes(id), `help must contain anchor #${id}`);
  }

  // TrustSafety page must have escrow, milestones, seller-policy
  const trust = mod.getInfoContent("vi", "trustSafety");
  const trustAnchorIds = trust.anchors.map((a) => a.id);
  for (const id of ["escrow", "milestones", "seller-policy"]) {
    assert.ok(trustAnchorIds.includes(id), `trustSafety must contain anchor #${id}`);
  }

  // Pro page must have ai, teams, enterprise-quote, api
  const pro = mod.getInfoContent("vi", "pro");
  const proAnchorIds = pro.anchors.map((a) => a.id);
  for (const id of ["ai", "teams", "enterprise-quote", "api"]) {
    assert.ok(proAnchorIds.includes(id), `pro must contain anchor #${id}`);
  }

  // About page must have careers, press, partners, investors, open-source
  const about = mod.getInfoContent("vi", "about");
  const aboutAnchorIds = about.anchors.map((a) => a.id);
  for (const id of ["careers", "press", "partners", "investors", "open-source"]) {
    assert.ok(aboutAnchorIds.includes(id), `about must contain anchor #${id}`);
  }
});

test("LBR-10: footerHref maps properly across all 5 column headings", async () => {
  const mod = await import("../src/lib/landing/info-content.ts");

  // Category column
  assert.equal(
    mod.footerHref("vi", "Danh mục", "Dịch vụ AI"),
    "/vi/posts?q=D%E1%BB%8Bch%20v%E1%BB%A5%20AI"
  );

  // Client column
  assert.equal(mod.footerHref("vi", "Dành cho Khách hàng", "Tìm đối tác"), "/vi/posts");
  assert.equal(mod.footerHref("vi", "Dành cho Khách hàng", "Đăng yêu cầu"), "/vi/client/posts/new");
  assert.equal(mod.footerHref("vi", "Dành cho Khách hàng", "Tra cứu đơn hàng"), "/vi/client");
  assert.equal(mod.footerHref("vi", "Dành cho Khách hàng", "Thanh toán"), "/vi/help#payments");
  assert.equal(mod.footerHref("vi", "Dành cho Khách hàng", "Hoàn tiền"), "/vi/help#refunds");
  assert.equal(mod.footerHref("vi", "Dành cho Khách hàng", "Câu hỏi thường gặp"), "/vi/help#faq");

  // Seller column
  assert.equal(mod.footerHref("vi", "Dành cho Đối tác", "Đăng ký đối tác"), "/vi/register");
  assert.equal(mod.footerHref("vi", "Dành cho Đối tác", "Xây hồ sơ"), "/vi/settings/provider");
  assert.equal(mod.footerHref("vi", "Dành cho Đối tác", "Giá dịch vụ"), "/vi/pricing");
  assert.equal(mod.footerHref("vi", "Dành cho Đối tác", "Chính sách đối tác"), "/vi/trust-safety#seller-policy");
  assert.equal(mod.footerHref("vi", "Dành cho Đối tác", "Cộng đồng"), "/vi/help#community");
  assert.equal(mod.footerHref("vi", "Dành cho Đối tác", "Trung tâm hỗ trợ"), "/vi/help");

  // Business column
  assert.equal(mod.footerHref("vi", "Giải pháp Doanh nghiệp", "WorkGo Pro"), "/vi/pro");
  assert.equal(mod.footerHref("vi", "Giải pháp Doanh nghiệp", "Giải pháp AI"), "/vi/pro#ai");
  assert.equal(mod.footerHref("vi", "Giải pháp Doanh nghiệp", "Quản lý đội ngũ"), "/vi/pro#teams");
  assert.equal(mod.footerHref("vi", "Giải pháp Doanh nghiệp", "Báo giá doanh nghiệp"), "/vi/pro#enterprise-quote");
  assert.equal(mod.footerHref("vi", "Giải pháp Doanh nghiệp", "Tích hợp API"), "/vi/pro#api");

  // About column
  assert.equal(mod.footerHref("vi", "Về WorkGo", "Về chúng tôi"), "/vi/about");
  assert.equal(mod.footerHref("vi", "Về WorkGo", "Sự nghiệp"), "/vi/about#careers");
  assert.equal(mod.footerHref("vi", "Về WorkGo", "Báo chí"), "/vi/about#press");
  assert.equal(mod.footerHref("vi", "Về WorkGo", "Đối tác truyền thông"), "/vi/about#partners");
  assert.equal(mod.footerHref("vi", "Về WorkGo", "Nhà đầu tư"), "/vi/about#investors");
});
