import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webRoot = path.resolve(__dirname, "..");

const footerJsxPath = path.join(webRoot, "src", "_webapp-mirror", "components", "common", "Footer", "Footer.jsx");
const footerCssPath = path.join(webRoot, "src", "_webapp-mirror", "components", "common", "Footer", "Footer.module.css");
const footerLinksPath = path.join(webRoot, "src", "_webapp-mirror", "components", "common", "Footer", "footerLinks.js");
const publicContentPath = path.join(webRoot, "src", "components", "trung-pages", "public", "publicInfoContent.js");
const publicPagePath = path.join(webRoot, "src", "components", "trung-pages", "public", "PublicInfoPage.tsx");
const publicCssPath = path.join(webRoot, "src", "components", "trung-pages", "public", "PublicInfoPage.module.css");
const notFoundPath = path.join(webRoot, "src", "components", "trung-pages", "NotFoundPage.tsx");
const shellPath = path.join(webRoot, "src", "components", "webapp-bridge", "webapp-shell.tsx");

test("FN-01: Không còn dead link trong Footer.jsx", () => {
  assert.ok(fs.existsSync(footerJsxPath), "Footer.jsx must exist");
  const content = fs.readFileSync(footerJsxPath, "utf8");
  assert.doesNotMatch(content, /href\s*=\s*["']#["']/, "Footer.jsx must not contain href='#'");
  assert.doesNotMatch(content, /href\s*=\s*\{\s*["']#["']\s*\}/, "Footer.jsx must not contain href={'#'}");
  assert.doesNotMatch(content, /#categories/, "Footer.jsx must not contain #categories");
  assert.doesNotMatch(content, /#how-it-works/, "Footer.jsx must not contain #how-it-works");
  assert.doesNotMatch(content, /#why-workgo/, "Footer.jsx must not contain #why-workgo");
  assert.doesNotMatch(content, /#cta/, "Footer.jsx must not contain #cta");
  assert.doesNotMatch(content, /href:\s*["']#/, "Footer.jsx must not have href property with #");
});

test("FN-02: Registry footerLinks.js có đúng 19 link phẳng và label duy nhất", async () => {
  assert.ok(fs.existsSync(footerLinksPath), "footerLinks.js must exist");
  const mod = await import(pathToFileURL(footerLinksPath).href);
  assert.ok(Array.isArray(mod.FOOTER_COLUMNS), "FOOTER_COLUMNS must be exported as an array");
  const allLinks = mod.FOOTER_COLUMNS.flatMap((col) => col.links || []);
  assert.equal(allLinks.length, 19, "Total links in FOOTER_COLUMNS must be exactly 19");

  const labels = new Set();
  for (const item of allLinks) {
    assert.equal(typeof item.label, "string", "Each link must have string label");
    assert.equal(typeof item.page, "string", "Each link must have string page");
    assert.ok(item.label.trim().length > 0, "Label cannot be empty");
    assert.ok(!labels.has(item.label), `Label '${item.label}' must be unique in footerLinks`);
    labels.add(item.label);
  }
});

test("FN-03: Page đích trong footerLinks hợp lệ với hệ thống", async () => {
  assert.ok(fs.existsSync(footerLinksPath), "footerLinks.js must exist");
  assert.ok(fs.existsSync(publicContentPath), "publicInfoContent.js must exist");

  const { FOOTER_COLUMNS } = await import(pathToFileURL(footerLinksPath).href);
  const { PUBLIC_INFO_PAGE_KEYS } = await import(pathToFileURL(publicContentPath).href);

  const allowedPages = new Set([
    "catalog",
    "job-post",
    "provider-onboarding",
    "payout-settings",
    ...PUBLIC_INFO_PAGE_KEYS,
  ]);
  const allowedCategories = new Set(["lap-trinh-it", "thiet-ke-do-hoa", "viet-lach-dich-thuat"]);

  const allLinks = FOOTER_COLUMNS.flatMap((c) => c.links || []);
  for (const link of allLinks) {
    assert.ok(allowedPages.has(link.page), `Target page '${link.page}' must be in allowed list`);
    if (link.page === "catalog" && link.params?.category) {
      assert.ok(
        allowedCategories.has(link.params.category),
        `Catalog category '${link.params.category}' must match backend seed`
      );
    }
  }
});

test("FN-04: Content registry có đủ 12 trang nội dung và hợp lệ", async () => {
  assert.ok(fs.existsSync(publicContentPath), "publicInfoContent.js must exist");
  const { PUBLIC_INFO_PAGE_KEYS, PUBLIC_INFO } = await import(pathToFileURL(publicContentPath).href);

  assert.equal(PUBLIC_INFO_PAGE_KEYS.length, 12, "PUBLIC_INFO_PAGE_KEYS must have 12 items");
  assert.equal(Object.keys(PUBLIC_INFO).length, 12, "PUBLIC_INFO must define 12 pages");

  const titles = new Set();
  for (const key of PUBLIC_INFO_PAGE_KEYS) {
    const page = PUBLIC_INFO[key];
    assert.ok(page, `PUBLIC_INFO must contain entry for '${key}'`);
    assert.equal(typeof page.title, "string", `'${key}' must have string title`);
    assert.equal(typeof page.subtitle, "string", `'${key}' must have string subtitle`);
    assert.ok(
      ["article", "faq", "contact", "careers", "community"].includes(page.kind),
      `'${key}' kind '${page.kind}' must be valid`
    );
    assert.ok(!titles.has(page.title), `Title '${page.title}' must be unique`);
    titles.add(page.title);

    const json = JSON.stringify(page).toLowerCase();
    assert.ok(!json.includes("todo"), `'${key}' content must not contain TODO`);
    assert.ok(!json.includes("lorem"), `'${key}' content must not contain lorem ipsum`);
    assert.ok(!json.includes("coming soon"), `'${key}' content must not contain 'coming soon'`);
  }
});

test("FN-05: Shell wiring trong webapp-shell.tsx", () => {
  assert.ok(fs.existsSync(shellPath), "webapp-shell.tsx must exist");
  const content = fs.readFileSync(shellPath, "utf8");

  assert.match(content, /import\s+PublicInfoPage/, "Must import PublicInfoPage");
  assert.match(content, /isPublicInfoPageKey/, "Must import/use isPublicInfoPageKey");
  assert.match(content, /<PublicInfoPage[\s\S]*?pageKey=\{currentPage\}[\s\S]*?onNavigate=\{handleNavigate\}/, "Must render PublicInfoPage with pageKey and onNavigate");
  assert.match(content, /<Footer[\s\S]*?onNavigate=\{handleNavigate\}/, "Must pass onNavigate to Footer");

  const requiredKeys = [
    "how-it-works", "escrow-protection", "refund-policy", "faq",
    "verification-standards", "package-rules", "community",
    "about", "careers", "terms", "privacy", "contact"
  ];
  for (const k of requiredKeys) {
    assert.ok(content.includes(k), `webapp-shell.tsx must include page key '${k}'`);
  }
});

test("FN-06: Footer contract prop onNavigate và loại bỏ dead scroll", () => {
  assert.ok(fs.existsSync(footerJsxPath), "Footer.jsx must exist");
  const content = fs.readFileSync(footerJsxPath, "utf8");

  assert.match(content, /onNavigate/, "Footer.jsx must accept onNavigate prop");
  assert.doesNotMatch(content, /window\.scrollTo/, "Footer.jsx must not directly call window.scrollTo");
  assert.doesNotMatch(content, /scrollIntoView/, "Footer.jsx must not directly call scrollIntoView");
  assert.doesNotMatch(content, /<a\s+[^>]*href=/i, "Footer links must not use <a href>");
});

test("FN-07: Shell scroll auto và PublicInfoPage focus h1 với preventScroll", () => {
  assert.ok(fs.existsSync(shellPath), "webapp-shell.tsx must exist");
  const shellContent = fs.readFileSync(shellPath, "utf8");

  assert.match(shellContent, /scrollTo\(\s*\{\s*top:\s*0,\s*left:\s*0,\s*behavior:\s*["']auto["']\s*\}\s*\)/, "Shell must use behavior: 'auto' for reset scroll");
  assert.doesNotMatch(shellContent, /behavior:\s*["']smooth["']/, "Shell navigation must not use smooth scroll");
  assert.doesNotMatch(shellContent, /behavior:\s*["']instant["']/, "Shell navigation must not use invalid instant behavior");

  assert.ok(fs.existsSync(publicPagePath), "PublicInfoPage.tsx must exist");
  const pageContent = fs.readFileSync(publicPagePath, "utf8");
  assert.match(pageContent, /preventScroll:\s*true/, "PublicInfoPage must focus h1 with preventScroll: true");
});

test("FN-08: A11y cho footer link và heading h1", () => {
  assert.ok(fs.existsSync(publicCssPath), "PublicInfoPage.module.css must exist");
  assert.ok(fs.existsSync(footerJsxPath), "Footer.jsx must exist");
  const footerContent = fs.readFileSync(footerJsxPath, "utf8");
  assert.match(footerContent, /<button[^>]*type=["']button["'][^>]*className=\{styles\.footerLink\}/, "Footer links must be button type='button'");
  assert.match(footerContent, /<button[^>]*className=\{styles\.footerLogo\}/, "Footer logo must be a button");

  assert.ok(fs.existsSync(footerCssPath), "Footer.module.css must exist");
  const footerCss = fs.readFileSync(footerCssPath, "utf8");
  assert.match(footerCss, /:focus-visible/, "Footer.module.css must contain :focus-visible rules");
  assert.match(footerCss, /min-height:\s*44px/, "Footer.module.css must enforce min-height: 44px on mobile");

  assert.ok(fs.existsSync(publicPagePath), "PublicInfoPage.tsx must exist");
  const pageContent = fs.readFileSync(publicPagePath, "utf8");
  assert.match(pageContent, /<h1[^>]*tabIndex=\{-1\}/, "PublicInfoPage h1 must have tabIndex={-1}");
});

test("FN-09: Bottom bar locale và currency là text tĩnh", () => {
  assert.ok(fs.existsSync(footerJsxPath), "Footer.jsx must exist");
  const footerContent = fs.readFileSync(footerJsxPath, "utf8");
  assert.doesNotMatch(footerContent, /<(?:a|button)[^>]*>[\s\S]*?(?:Tiếng Việt|₫\s*VND)[\s\S]*?<\/(?:a|button)>/, "Locale and currency must not be a or button");

  assert.ok(fs.existsSync(footerCssPath), "Footer.module.css must exist");
  const footerCss = fs.readFileSync(footerCssPath, "utf8");
  assert.match(footerCss, /\.localeItemStatic/, "Footer.module.css must have .localeItemStatic class");
  assert.doesNotMatch(footerCss, /\.localeItemStatic:hover/, ".localeItemStatic must not have hover styles");
  assert.doesNotMatch(footerCss, /\.localeItemStatic\s*\{[^}]*cursor:\s*pointer/, ".localeItemStatic must not have cursor: pointer");
});

test("FN-10: Keyboard shortcut hint S3 giữ nguyên văn trong span", () => {
  assert.ok(fs.existsSync(footerJsxPath), "Footer.jsx must exist");
  const footerContent = fs.readFileSync(footerJsxPath, "utf8");
  assert.match(
    footerContent,
    /<span[^>]*>[\s\S]*?Mẹo bàn phím: Tab di chuyển • Esc đóng nhanh[\s\S]*?<\/span>/,
    "Keyboard hint must be preserved verbatim in a span"
  );
  assert.doesNotMatch(
    footerContent,
    /<(?:button|a)[^>]*>[^<]*Mẹo bàn phím: Tab di chuyển • Esc đóng nhanh[^<]*<\/(?:button|a)>/,
    "Keyboard hint must not be directly wrapped in button or a"
  );
});

test("FN-11: 5 file mới hoàn toàn không chứa API call trực tiếp", () => {
  const files = [footerJsxPath, footerLinksPath, publicContentPath, publicPagePath, notFoundPath];
  for (const f of files) {
    assert.ok(fs.existsSync(f), `${path.basename(f)} must exist`);
    const c = fs.readFileSync(f, "utf8");
    assert.doesNotMatch(c, /\bfetch\s*\(/, `${path.basename(f)} must not contain fetch(`);
    assert.doesNotMatch(c, /\baxios\b/, `${path.basename(f)} must not contain axios`);
    assert.doesNotMatch(c, /api\//, `${path.basename(f)} must not reference api/`);
    assert.doesNotMatch(c, /\/api\/v1/, `${path.basename(f)} must not reference /api/v1`);
    assert.doesNotMatch(c, /:8888/, `${path.basename(f)} must not reference port :8888`);
    assert.doesNotMatch(c, /:808[1-4]/, `${path.basename(f)} must not reference ports :8081-:8084`);
  }
});

test("FN-12: Mock storage an toàn với typeof window và try/catch", () => {
  assert.ok(fs.existsSync(publicPagePath), "PublicInfoPage.tsx must exist");
  const content = fs.readFileSync(publicPagePath, "utf8");

  assert.match(content, /workgo_contact_requests/, "Must use workgo_contact_requests storage key");
  assert.match(content, /workgo_job_applications/, "Must use workgo_job_applications storage key");
  assert.match(content, /typeof window !== ["']undefined["']/, "Must guard window with typeof check");
  assert.match(content, /try\s*\{[\s\S]*?localStorage[\s\S]*?\}\s*catch/, "localStorage access must be wrapped in try/catch");
});

test("FN-13: Validation contact form và dedupe careers", () => {
  assert.ok(fs.existsSync(publicPagePath), "PublicInfoPage.tsx must exist");
  const content = fs.readFileSync(publicPagePath, "utf8");

  assert.match(content, /WG-/, "Contact submission success code must prefix with WG-");
  assert.match(content, /@/, "Contact must validate email");
  assert.match(content, /applied|roleId/, "Careers application must track applied status by roleId");
});

test("FN-14: Nội dung pháp lý có disclaimer và cập nhật, FAQ và Careers đủ số lượng", async () => {
  assert.ok(fs.existsSync(publicContentPath), "publicInfoContent.js must exist");
  const { PUBLIC_INFO } = await import(pathToFileURL(publicContentPath).href);

  for (const key of ["terms", "privacy", "refund-policy"]) {
    const page = PUBLIC_INFO[key];
    assert.ok(page, `Page ${key} must exist`);
    assert.match(page.updatedAt || "", /20\/10\/2026/, `${key} must have updatedAt 20/10/2026`);
    assert.ok(page.disclaimer && page.disclaimer.length > 20, `${key} must have valid disclaimer`);
  }

  const faq = PUBLIC_INFO["faq"];
  assert.ok(faq && Array.isArray(faq.groups), "FAQ must have groups");
  assert.ok(faq.groups.length >= 4, "FAQ must have at least 4 groups");
  for (const grp of faq.groups) {
    assert.ok(grp.items && grp.items.length >= 3, `FAQ group '${grp.heading}' must have at least 3 items`);
  }

  const careers = PUBLIC_INFO["careers"];
  assert.ok(careers && Array.isArray(careers.roles), "Careers must have roles");
  assert.ok(careers.roles.length >= 4, "Careers must have at least 4 roles");

  const about = PUBLIC_INFO["about"];
  assert.equal(about.title, "Giới thiệu nền tảng", "About page title must exactly match 'Giới thiệu nền tảng'");
});

test("FN-15: NotFoundPage tồn tại và shell render fallback", () => {
  assert.ok(fs.existsSync(notFoundPath), "NotFoundPage.tsx must exist");
  const nfContent = fs.readFileSync(notFoundPath, "utf8");
  assert.match(nfContent, /onNavigate/, "NotFoundPage must accept onNavigate");
  assert.match(nfContent, /home/, "NotFoundPage must have CTA to home");
  assert.match(nfContent, /catalog/, "NotFoundPage must have CTA to catalog");

  assert.ok(fs.existsSync(shellPath), "webapp-shell.tsx must exist");
  const shellContent = fs.readFileSync(shellPath, "utf8");
  assert.match(shellContent, /NotFoundPage/, "webapp-shell.tsx must import and render NotFoundPage");
  assert.match(shellContent, /KNOWN_PAGE_KEYS/, "webapp-shell.tsx must track KNOWN_PAGE_KEYS");
});

test("FN-16: Toàn bộ CTA và Card trong 12 trang trỏ tới page key tồn tại trong hệ thống", async () => {
  assert.ok(fs.existsSync(publicContentPath), "publicInfoContent.js must exist");
  const { PUBLIC_INFO, PUBLIC_INFO_PAGE_KEYS } = await import(pathToFileURL(publicContentPath).href);

  const KNOWN_PAGES = new Set([
    "home", "catalog", "detail", "my-services", "service-form", "availability", "checkout", "orders",
    "register", "login", "profile-settings", "provider-onboarding", "address-book", "provider-profile",
    "job-list", "job-post", "submit-proposal", "proposal-review", "payment-gateway", "wallet",
    "payout-settings", "review-form", "dispute-center", ...PUBLIC_INFO_PAGE_KEYS,
  ]);

  const deadTargets = [];
  for (const key of PUBLIC_INFO_PAGE_KEYS) {
    const pageContent = PUBLIC_INFO[key];
    const targets = [
      ...(pageContent.ctas || []).map((c) => ({ type: "cta", label: c.label, page: c.page })),
      ...(pageContent.cards || []).map((c) => ({ type: "card", label: c.title || c.label, page: c.page })),
    ];
    for (const item of targets) {
      if (item.page && !KNOWN_PAGES.has(item.page)) {
        deadTargets.push({ from: key, item });
      }
    }
  }

  assert.equal(
    deadTargets.length,
    0,
    `Found ${deadTargets.length} dead targets in publicInfoContent.js: ${JSON.stringify(deadTargets)}`
  );
});
