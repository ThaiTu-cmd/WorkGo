import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf-8");

// =============================================================================
// QA TEST SUITE: LANDING BUTTON ROUTING, STATIC PAGES, MOTION & EDGE CASES
// =============================================================================

test("QA-LBR-EC01: Happy Path - English (en) Footer 27 Links Full Mapping & Zero Fallbacks", async () => {
  const { footerHref } = await import("../src/lib/landing/info-content.ts");
  const { FIVERR_CONTENT } = await import("../src/lib/landing/fiverr-content.ts");

  const enFooter = FIVERR_CONTENT.en.footer;
  assert.equal(enFooter.columns.length, 5, "English footer must have 5 columns");

  const expectedMappings = {
    Categories: {
      "Programming & Tech": "/en/posts?q=Programming%20%26%20Tech",
      "Graphics & Design": "/en/posts?q=Graphics%20%26%20Design",
      "Digital Marketing": "/en/posts?q=Digital%20Marketing",
      "Writing & Translation": "/en/posts?q=Writing%20%26%20Translation",
      "Video & Animation": "/en/posts?q=Video%20%26%20Animation",
      "AI Services": "/en/posts?q=AI%20Services",
    },
    "For Clients": {
      "Find a freelancer": "/en/posts",
      "Post a brief": "/en/client/posts/new",
      "Track orders": "/en/client",
      Payments: "/en/help#payments",
      Refunds: "/en/help#refunds",
      "Help center": "/en/help#faq",
    },
    "For Sellers": {
      "Become a seller": "/en/register",
      "Build your profile": "/en/settings/provider",
      "Service pricing": "/en/pricing",
      "Seller policy": "/en/trust-safety#seller-policy",
      Community: "/en/help#community",
      Support: "/en/help",
    },
    "Business Solutions": {
      "WorkGo Pro": "/en/pro",
      "AI Solutions": "/en/pro#ai",
      "Team management": "/en/pro#teams",
      "Enterprise quotes": "/en/pro#enterprise-quote",
      "API integration": "/en/pro#api",
    },
    "About WorkGo": {
      "About us": "/en/about",
      Careers: "/en/about#careers",
      Press: "/en/about#press",
      "Media partners": "/en/about#partners",
      Investors: "/en/about#investors",
    },
  };

  let totalChecked = 0;
  for (const col of enFooter.columns) {
    const colExpected = expectedMappings[col.heading];
    assert.ok(colExpected, `Expected column mapping for heading: '${col.heading}'`);

    for (const link of col.links) {
      const actualHref = footerHref("en", col.heading, link);
      const expectedHref = colExpected[link];
      assert.ok(expectedHref, `Expected link mapping for '${link}' in '${col.heading}'`);
      assert.equal(
        actualHref,
        expectedHref,
        `Link '${link}' in column '${col.heading}' must map to '${expectedHref}' (got '${actualHref}')`
      );
      if (expectedHref !== "/en/help") {
        assert.notEqual(
          actualHref,
          "/en/help",
          `Link '${link}' should have specific destination, not generic fallback`
        );
      }
      totalChecked++;
    }
  }

  assert.equal(totalChecked, 28, "Must verify all 28 English footer links");
});

test("QA-LBR-EC02: Edge Cases & Boundary Conditions - footerHref Resilience & Fuzzing", async () => {
  const { footerHref } = await import("../src/lib/landing/info-content.ts");

  // 1. Empty, whitespace or missing headings
  assert.equal(footerHref("vi", "", "Tìm đối tác"), "/vi/help");
  assert.equal(footerHref("vi", "   ", "Tìm đối tác"), "/vi/help");
  assert.equal(footerHref("vi", null, "Tìm đối tác"), "/vi/help");
  assert.equal(footerHref("vi", undefined, "Tìm đối tác"), "/vi/help");

  // 2. Unknown heading
  assert.equal(footerHref("vi", "Cột lạ không xác định", "Bất kỳ"), "/vi/help");
  assert.equal(footerHref("en", "Unknown Column Heading", "Any link"), "/en/help");

  // 3. Unknown links inside known columns fallback safely without throwing
  assert.equal(footerHref("vi", "Dành cho Khách hàng", "Liên kết không tồn tại"), "/vi/posts");
  assert.equal(footerHref("vi", "Dành cho Đối tác", "Liên kết lạ"), "/vi/register");
  assert.equal(footerHref("vi", "Giải pháp Doanh nghiệp", "Dịch vụ bí ẩn"), "/vi/pro");
  assert.equal(footerHref("vi", "Về WorkGo", "Mục lạ"), "/vi/about");

  // 4. Whitespace trimming and mixed-case resilience
  assert.equal(
    footerHref("vi", "  Dành cho Khách hàng  ", "  Thanh toán  "),
    "/vi/help#payments"
  );
  assert.equal(
    footerHref("en", "FOR CLIENTS", "PAYMENTS"),
    "/en/help#payments"
  );

  // 5. Locale edge cases
  assert.equal(footerHref("fr", "Dành cho Khách hàng", "Thanh toán"), "/vi/help#payments");
  assert.equal(footerHref("", "Dành cho Khách hàng", "Thanh toán"), "/vi/help#payments");
  assert.equal(footerHref(null, "Dành cho Khách hàng", "Thanh toán"), "/vi/help#payments");

  // 6. Absolute immunity against href="#"
  const testInputs = [
    ["vi", "Danh mục", ""],
    ["vi", "Dành cho Khách hàng", ""],
    ["en", "Business Solutions", ""],
    ["vi", "#", "#"],
    ["en", "javascript:void(0)", "click me"],
  ];
  for (const [loc, heading, label] of testInputs) {
    const res = footerHref(loc, heading, label);
    assert.doesNotMatch(res, /^#/, "Result must never be an unrouted anchor '#'");
    assert.doesNotMatch(res, /javascript:/, "Result must never contain javascript pseudo-protocol");
    assert.ok(res.startsWith("/"), "Result must always be an absolute localized path");
  }
});

test("QA-LBR-EC03: Edge Cases - getInfoContent Locale Fallbacks and Structure Completeness", async () => {
  const { getInfoContent, INFO_CONTENT } = await import("../src/lib/landing/info-content.ts");

  const pageKeys = [
    "about",
    "pricing",
    "pro",
    "guides",
    "help",
    "terms",
    "privacy",
    "trustSafety",
  ];

  const edgeLocales = ["", null, undefined, "fr", "de", "es", "zh", "ja", "VI", "EN", 123];

  for (const loc of edgeLocales) {
    for (const key of pageKeys) {
      const content = getInfoContent(loc, key);
      assert.ok(content, `Content must exist for key '${key}' under locale '${String(loc)}'`);

      // Fallback verification
      const expectedFallback = INFO_CONTENT.vi[key];
      assert.equal(
        content.title,
        expectedFallback.title,
        `Locale '${String(loc)}' for key '${key}' must fallback to Vietnamese title`
      );
      assert.equal(content.slug, expectedFallback.slug);

      // Structure verification
      assert.ok(content.desc && content.desc.length > 10, "Description must be substantive");
      assert.ok(Array.isArray(content.anchors), "Anchors must be an array");
      assert.ok(Array.isArray(content.sections), "Sections must be an array");
      assert.ok(content.sections.length >= 1, "Must have at least 1 section");

      for (const sec of content.sections) {
        assert.ok(sec.heading, "Section must have heading");
        assert.ok(Array.isArray(sec.body) && sec.body.length >= 1, "Section must have body paragraphs");
      }

      // CTA verification
      assert.ok(content.cta, "CTA object must be present");
      assert.ok(content.cta.title, "CTA must have title");
      assert.ok(content.cta.primaryLabel, "CTA must have primaryLabel");
      assert.ok(content.cta.primaryHref.startsWith("/"), "primaryHref must start with /");
      assert.ok(content.cta.secondaryLabel, "CTA must have secondaryLabel");
      assert.ok(content.cta.secondaryHref.startsWith("/"), "secondaryHref must start with /");
    }
  }

  // English structure verification
  for (const key of pageKeys) {
    const enContent = getInfoContent("en", key);
    const viContent = getInfoContent("vi", key);
    assert.notEqual(enContent.title, viContent.title, `Title for '${key}' must be translated in English`);
    assert.equal(enContent.slug, viContent.slug, `Slug for '${key}' must match across locales`);
    assert.equal(
      enContent.anchors.length,
      viContent.anchors.length,
      `Anchor count for '${key}' must match between vi and en`
    );
  }
});

test("QA-LBR-EC04: Boundary Testing - getGuideDetail Fuzzing & Static Params Consistency", async () => {
  const { getGuideDetail } = await import("../src/lib/landing/info-content.ts");
  const validIds = ["guide-brief", "guide-portfolio", "guide-budget"];

  // 1. Valid IDs in both locales
  for (const loc of ["vi", "en"]) {
    for (const id of validIds) {
      const detail = getGuideDetail(loc, id);
      assert.ok(detail, `Guide detail must exist for '${id}' in '${loc}'`);
      assert.equal(detail.guide.id, id);
      assert.ok(detail.guide.title.length > 5, "Title must be informative");
      assert.equal(detail.guide.from.length, 2, "From gradient must have 2 hex colors");
      assert.ok(["Briefcase", "Users", "Wallet"].includes(detail.guide.icon));
      assert.ok(detail.body.length >= 3, "Body must have at least 3 paragraphs");
      assert.ok(detail.steps.length >= 4, "Must have at least 4 action steps");
      assert.ok(detail.relatedQ.length > 2, "Must specify related search query");
    }
  }

  // 2. Invalid, malformed and injection IDs
  const maliciousAndInvalidIds = [
    "guide-unknown",
    "",
    "   ",
    null,
    undefined,
    "../",
    "../../etc/passwd",
    "<script>",
    "__proto__",
    "constructor",
    "toString",
    12345,
    {},
    [],
  ];

  for (const badId of maliciousAndInvalidIds) {
    const res = getGuideDetail("vi", badId);
    assert.equal(
      res,
      null,
      `Malformed or unknown guide ID '${String(badId)}' must return null without crashing`
    );
  }
});

test("QA-LBR-EC05: URL Query Builder Helpers - Special Characters & Encoding", async () => {
  const { categoryHref, serviceHref, guideHref } = await import("../src/lib/landing/info-content.ts");

  // Vietnamese diacritics & symbols
  assert.equal(
    categoryHref("vi", "Lập trình & Công nghệ"),
    "/vi/posts?q=L%E1%BA%ADp%20tr%C3%ACnh%20%26%20C%C3%B4ng%20ngh%E1%BB%87"
  );
  assert.equal(
    serviceHref("vi", "Thiết lập TikTok Shop"),
    "/vi/posts?q=Thi%E1%BA%BFt%20l%E1%BA%ADp%20TikTok%20Shop"
  );
  assert.equal(
    guideHref("vi", "guide-brief"),
    "/vi/guides/guide-brief"
  );

  // English queries
  assert.equal(
    categoryHref("en", "Programming & Tech"),
    "/en/posts?q=Programming%20%26%20Tech"
  );
  assert.equal(
    serviceHref("en", "AI Programming"),
    "/en/posts?q=AI%20Programming"
  );
  assert.equal(
    guideHref("en", "guide-budget"),
    "/en/guides/guide-budget"
  );

  // Edge cases: query with quotes, slashes, ampersands, question marks
  const edgeQuery = 'Dev & Design: "100% / 24h?"';
  const encodedCat = categoryHref("vi", edgeQuery);
  assert.ok(!encodedCat.includes('"'), "Double quotes must be encoded");
  assert.ok(!encodedCat.includes(" "), "Spaces must be encoded");
  assert.ok(encodedCat.startsWith("/vi/posts?q="), "Must prefix correctly");
});

test("QA-LBR-EC06: Anchor Bidirectional Integrity - All Footer & TOC Hash Links Exist in Pages", async () => {
  const { getInfoContent } = await import("../src/lib/landing/info-content.ts");

  // Check help anchors
  const helpAnchors = getInfoContent("vi", "help").anchors.map((a) => a.id);
  assert.ok(helpAnchors.includes("payments"), "help must have #payments anchor");
  assert.ok(helpAnchors.includes("refunds"), "help must have #refunds anchor");
  assert.ok(helpAnchors.includes("faq"), "help must have #faq anchor");
  assert.ok(helpAnchors.includes("community"), "help must have #community anchor");

  // Check pro anchors
  const proAnchors = getInfoContent("vi", "pro").anchors.map((a) => a.id);
  assert.ok(proAnchors.includes("ai"), "pro must have #ai anchor");
  assert.ok(proAnchors.includes("teams"), "pro must have #teams anchor");
  assert.ok(proAnchors.includes("enterprise-quote"), "pro must have #enterprise-quote anchor");
  assert.ok(proAnchors.includes("api"), "pro must have #api anchor");

  // Check trustSafety anchors
  const trustAnchors = getInfoContent("vi", "trustSafety").anchors.map((a) => a.id);
  assert.ok(trustAnchors.includes("escrow"), "trustSafety must have #escrow anchor");
  assert.ok(trustAnchors.includes("milestones"), "trustSafety must have #milestones anchor");
  assert.ok(trustAnchors.includes("seller-policy"), "trustSafety must have #seller-policy anchor");

  // Check about anchors
  const aboutAnchors = getInfoContent("vi", "about").anchors.map((a) => a.id);
  assert.ok(aboutAnchors.includes("careers"), "about must have #careers anchor");
  assert.ok(aboutAnchors.includes("press"), "about must have #press anchor");
  assert.ok(aboutAnchors.includes("partners"), "about must have #partners anchor");
  assert.ok(aboutAnchors.includes("investors"), "about must have #investors anchor");
  assert.ok(aboutAnchors.includes("open-source"), "about must have #open-source anchor");

  // Check pricing anchors
  const pricingAnchors = getInfoContent("vi", "pricing").anchors.map((a) => a.id);
  assert.ok(pricingAnchors.includes("tiers"), "pricing must have #tiers anchor");
  assert.ok(pricingAnchors.includes("escrow-fee"), "pricing must have #escrow-fee anchor");
  assert.ok(pricingAnchors.includes("faq"), "pricing must have #faq anchor");
});

test("QA-LBR-EC07: Static Info Pages - Clean Server Components & Zero API Fetch", () => {
  const pageFiles = [
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

  for (const pf of pageFiles) {
    const code = read(pf);

    // 1. Clean Server Components (must NOT have "use client")
    assert.doesNotMatch(
      code,
      /^["']use client["']/m,
      `${pf} must be a Server Component (no 'use client')`
    );

    // 2. Zero backend API fetch or adapters (100% offline-first)
    assert.doesNotMatch(
      code,
      /\b(apiFetch|fetch\(|postsApi|walletApi|paymentsApi|proposalsApi)\b/,
      `${pf} must not call backend API or fetch (must be offline-first)`
    );

    // 3. Metadata generation exported
    assert.match(
      code,
      /export\s+(async\s+)?function\s+generateMetadata/,
      `${pf} must export generateMetadata`
    );

    // 4. Default export present
    assert.match(
      code,
      /export\s+default\s+(async\s+)?function/,
      `${pf} must have default export component`
    );
  }

  // Guide detail page must have generateStaticParams & notFound
  const guideCode = read("src/app/[locale]/(public)/guides/[id]/page.tsx");
  assert.match(guideCode, /export\s+function\s+generateStaticParams/);
  assert.match(guideCode, /notFound\(\)/);
});

test("QA-LBR-EC08: Motion System & WCAG Reduced-Motion Compliance", () => {
  const css = read("src/app/globals.css");

  // 1. Critical animation keyframes defined
  assert.match(css, /@keyframes\s+fiverrFloatY/);
  assert.match(css, /@keyframes\s+fiverrCardShine/);
  assert.match(css, /@keyframes\s+fiverrHeroGlow/);

  // 2. Utility classes defined
  assert.match(css, /\.animate-fiverr-float\b/);
  assert.match(css, /\.card-shine\b/);
  assert.match(css, /\.trusted-marquee\b/);
  assert.match(css, /\.faq-accordion\b/);

  // 3. prefers-reduced-motion block completely neutralizes new motions
  assert.match(
    css,
    /@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)\s*\{[^}]*\.animate-fiverr-float/s,
    "animate-fiverr-float must be suppressed under prefers-reduced-motion"
  );
  assert.match(
    css,
    /@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)\s*\{[^}]*\.card-shine/s,
    "card-shine must be suppressed under prefers-reduced-motion"
  );
  assert.match(
    css,
    /@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)\s*\{[^}]*\.trusted-marquee/s,
    "trusted-marquee must be suppressed under prefers-reduced-motion"
  );
  assert.match(
    css,
    /@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)\s*\{[^}]*\.faq-accordion/s,
    "faq-accordion must be suppressed under prefers-reduced-motion"
  );
});

test("QA-LBR-EC09: Visual SVG Art Components - Zero Binary Assets & React 19 Compliance", () => {
  const artCode = read("src/components/landing/art/landing-art.tsx");

  // Exported components
  assert.match(artCode, /export\s+function\s+ServiceArt/);
  assert.match(artCode, /export\s+function\s+GuideArt/);
  assert.match(artCode, /export\s+function\s+CategoryArt/);
  assert.match(artCode, /export\s+function\s+InfoOrb/);

  // React 19 Compiler compliance: uses React.createElement to prevent static-components warning
  assert.match(artCode, /React\.createElement/);

  // Zero external binary image dependencies
  assert.doesNotMatch(artCode, /\.(png|jpg|jpeg|gif|webp|ico)/i);
});

test("QA-LBR-EC10: Dictionary Parity - Namespace info.* Perfectly Mirrored", () => {
  const vi = JSON.parse(read("src/dictionaries/vi.json"));
  const en = JSON.parse(read("src/dictionaries/en.json"));

  assert.ok(vi.info, "vi.json must contain info namespace");
  assert.ok(en.info, "en.json must contain info namespace");

  const checkParity = (objA, objB, prefix = "info") => {
    const keysA = Object.keys(objA).sort();
    const keysB = Object.keys(objB).sort();
    assert.deepEqual(
      keysA,
      keysB,
      `Key parity mismatch under ${prefix}: [${keysA.join(",")}] vs [${keysB.join(",")}]`
    );

    for (const k of keysA) {
      if (typeof objA[k] === "object" && objA[k] !== null && !Array.isArray(objA[k])) {
        checkParity(objA[k], objB[k], `${prefix}.${k}`);
      }
    }
  };

  checkParity(vi.info, en.info);
});
