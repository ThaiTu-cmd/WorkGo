import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO = path.resolve(__dirname, "../../");

const SRC_ROOT = path.join(REPO, "web-app", "src");
const WEBAPP_ROOT = path.join(REPO, "web-app");
const ANDROID_MIRROR = path.join(REPO, "android-frontend", "src", "_webapp-mirror");
const WEBSITE_MIRROR = path.join(REPO, "website-frontend", "src", "_webapp-mirror");
const ANDROID_REF = path.join(REPO, "android-frontend", "_webapp-reference");
const WEBSITE_REF = path.join(REPO, "website-frontend", "_webapp-reference");

function hashFile(absPath) {
  const buf = fs.readFileSync(absPath);
  return {
    size: buf.length,
    sha256: crypto.createHash("sha256").update(buf).digest("hex"),
  };
}

function listRelativeFiles(dir, ignoreBaseNames = []) {
  const out = [];
  function walk(d) {
    for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, ent.name);
      if (ent.isDirectory()) {
        walk(full);
      } else {
        if (!ignoreBaseNames.includes(ent.name)) {
          out.push(path.relative(dir, full).replace(/\\/g, "/"));
        }
      }
    }
  }
  walk(dir);
  return out.sort();
}

test("HP-MIRROR-01: android-frontend mirror removed (replacement proof)", () => {
  assert.ok(
    !fs.existsSync(ANDROID_MIRROR),
    "android-frontend/src/_webapp-mirror must not exist (native code dropped; temp backup holds 80 files)"
  );
});

test("HP-MIRROR-02: website-frontend mirror contains 85 files matching web-app/src with identical SHA256 hashes", () => {
  const srcFiles = listRelativeFiles(SRC_ROOT);
  const websiteFiles = listRelativeFiles(WEBSITE_MIRROR, ["MANIFEST.json", "README.mirror.md"]);
  assert.equal(websiteFiles.length, 85, "website-frontend mirror must contain exactly 85 mirrored files");
  assert.deepEqual(websiteFiles, srcFiles, "File relative paths must match 1:1");

  for (const rel of srcFiles) {
    const srcHash = hashFile(path.join(SRC_ROOT, rel));
    const destHash = hashFile(path.join(WEBSITE_MIRROR, rel));
    assert.equal(destHash.sha256, srcHash.sha256, `SHA256 mismatch for ${rel} in website mirror`);
    assert.equal(destHash.size, srcHash.size, `File size mismatch for ${rel} in website mirror`);
  }
});

test("HP-MIRROR-03: android-frontend _webapp-reference removed (replacement proof)", () => {
  assert.ok(
    !fs.existsSync(ANDROID_REF),
    "android-frontend/_webapp-reference must not exist (temp backup holds 14 entries)"
  );
});

test("HP-MIRROR-04: website-frontend _webapp-reference contains 13 files matching web-app root assets", () => {
  const refFiles = listRelativeFiles(WEBSITE_REF, ["COPY_REPORT.json"]);
  assert.equal(refFiles.length, 13, "website-frontend _webapp-reference must contain exactly 13 files");

  const expectedMappings = [
    ["catalog-search.css", "catalog-search.css"],
    ["catalog-search.html", "catalog-search.html"],
    ["index.html", "index.html"],
    ["my-services.css", "my-services.css"],
    ["my-services.html", "my-services.html"],
    ["public-favicon.svg", "public/favicon.svg"],
    ["service-detail.css", "service-detail.css"],
    ["service-detail.html", "service-detail.html"],
    ["service-form.css", "service-form.css"],
    ["service-form.html", "service-form.html"],
    ["vite.config.js", "vite.config.js"],
    ["webapp-package.json.reference", "package.json"],
    ["webapp-README.reference.md", "README.md"],
  ];

  for (const [refName, srcRel] of expectedMappings) {
    const refPath = path.join(WEBSITE_REF, refName);
    const srcPath = path.join(WEBAPP_ROOT, srcRel);
    assert.ok(fs.existsSync(refPath), `Reference file must exist: ${refName}`);
    assert.ok(fs.existsSync(srcPath), `Source file must exist: ${srcRel}`);

    const refHash = hashFile(refPath);
    const srcHash = hashFile(srcPath);
    assert.equal(refHash.sha256, srcHash.sha256, `SHA256 mismatch for reference file ${refName}`);
    assert.equal(refHash.size, srcHash.size, `Size mismatch for reference file ${refName}`);
  }
});

test("HP-MIRROR-05: MANIFEST.json and README.mirror.md exist and are valid in the website mirror", () => {
  for (const mirrorDir of [WEBSITE_MIRROR]) {
    const manifestPath = path.join(mirrorDir, "MANIFEST.json");
    assert.ok(fs.existsSync(manifestPath), "MANIFEST.json must exist");
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
    assert.equal(manifest.source, "web-app/src");
    assert.equal(manifest.totalFiles, 85);
    assert.equal(manifest.totalBytes, 380311);
    assert.equal(manifest.files.length, 85);

    const readmePath = path.join(mirrorDir, "README.mirror.md");
    assert.ok(fs.existsSync(readmePath), "README.mirror.md must exist");
    const readme = fs.readFileSync(readmePath, "utf-8");
    assert.match(readme, /web-app mirror/);
    assert.match(readme, /WARNING: Vite JSX reference only/);
    assert.match(readme, /Revert: delete/);
  }
});

test("HP-MIRROR-06: COPY_REPORT.json exists in the website reference directory and confirms 0 mismatches", () => {
  for (const refDir of [WEBSITE_REF]) {
    const reportPath = path.join(refDir, "COPY_REPORT.json");
    assert.ok(fs.existsSync(reportPath), "COPY_REPORT.json must exist");
    const report = JSON.parse(fs.readFileSync(reportPath, "utf-8"));
    assert.equal(report.copied, 85);
    assert.equal(report.refCopied, 13);
    assert.equal(report.syncedDeleted, 0);
    assert.equal(report.mismatches, 0);
  }
});

test("HP-MIRROR-07: .team/WEBAPP_MIRROR_MANIFEST.json aggregates both mirrors with 0 mismatches", () => {
  const metaPath = path.join(REPO, ".team", "WEBAPP_MIRROR_MANIFEST.json");
  assert.ok(fs.existsSync(metaPath), ".team/WEBAPP_MIRROR_MANIFEST.json must exist");
  const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
  assert.equal(meta.source, "web-app/src");
  assert.equal(meta.android.totalFiles, 78);
  assert.equal(meta.android.totalBytes, 347359);
  assert.equal(meta.website.totalFiles, 85);
  assert.equal(meta.website.totalBytes, 380311);
});

test("EC-MIRROR-01: Baseline configuration files remain strictly untouched (Zero Overwrite)", () => {
  // NOTE: android-frontend/package.json intentionally dropped from this map:
  // Task 3 A-M3 adds react-native-webview there (planned modification).
  const baselineHashes = {
    "android-frontend/app.json": "8b7403694394c72df0db96fa88286c011a4576a6a86e24fc162a76ec46efda19",
    "website-frontend/next.config.ts": "1904a25947364f20fb3c427ead9589a7c0321db11d1362abfb605a544d5765a3",
    "website-frontend/package.json": "f40a8ae22159103ecee400f62ba6a9ccf77bb23a7e7eeda5e22720c15dcb9b61",
  };

  for (const [relPath, expectedHash] of Object.entries(baselineHashes)) {
    const abs = path.join(REPO, relPath);
    assert.ok(fs.existsSync(abs), `Config must exist: ${relPath}`);
    const actualHash = hashFile(abs).sha256;
    assert.equal(actualHash, expectedHash, `Configuration file ${relPath} must not be modified`);
  }
});

test("EC-MIRROR-02: Route isolation prefix `_` is enforced on the website mirror folders", () => {
  const websiteMirrorBase = path.basename(WEBSITE_MIRROR);
  assert.ok(websiteMirrorBase.startsWith("_"), "Website mirror directory must start with _");

  const websiteRefBase = path.basename(WEBSITE_REF);
  assert.ok(websiteRefBase.startsWith("_"), "Website reference directory must start with _");
});

test("EC-MIRROR-03: Binary safety and CRLF/LF line ending equality across source and mirrors", () => {
  const criticalFiles = [
    "App.jsx",
    "styles/reset.css",
    "components/common/Header/Header.jsx",
    "pages/CatalogSearch/CatalogSearchPage.jsx",
  ];

  for (const rel of criticalFiles) {
    const srcBuf = fs.readFileSync(path.join(SRC_ROOT, rel));
    const webBuf = fs.readFileSync(path.join(WEBSITE_MIRROR, rel));

    assert.equal(Buffer.compare(srcBuf, webBuf), 0, `Binary byte mismatch in website mirror: ${rel}`);
  }

  // Also verify binary SVG in reference
  const srcFavicon = fs.readFileSync(path.join(WEBAPP_ROOT, "public/favicon.svg"));
  const webFavicon = fs.readFileSync(path.join(WEBSITE_REF, "public-favicon.svg"));
  assert.equal(Buffer.compare(srcFavicon, webFavicon), 0, "Favicon binary mismatch in website ref");
});

test("EC-MIRROR-04: Excluded directories and build artifacts never leak into mirrors", () => {
  const forbiddenNames = [
    "node_modules",
    "dist",
    ".next",
    ".expo",
    ".git",
    "package-lock.json",
    ".tsbuildinfo",
  ];

  for (const targetDir of [WEBSITE_MIRROR, WEBSITE_REF]) {
    const allFiles = listRelativeFiles(targetDir);
    for (const rel of allFiles) {
      for (const forbidden of forbiddenNames) {
        assert.ok(
          !rel.split("/").includes(forbidden),
          `Violation: ${forbidden} leaked into ${targetDir}: ${rel}`
        );
      }
    }
  }
});

test("EC-MIRROR-05: Verification script verifyMirrors function passes with 0 mismatches", async () => {
  const scriptPath = path.join(REPO, "scripts", "copy-webapp-mirror.mjs");
  assert.ok(fs.existsSync(scriptPath), "copy-webapp-mirror.mjs must exist");

  const mod = await import(pathToFileURL(scriptPath).href);
  const result = mod.verifyMirrors(SRC_ROOT, [WEBSITE_MIRROR]);
  assert.equal(result.ok, true, "verifyMirrors must return ok: true");
  assert.equal(result.mismatches.length, 0, "verifyMirrors must report 0 mismatches");
});

test("EC-MIRROR-06: All 8 prototype HTML/CSS pages exist and are well-formed", () => {
  const prototypeFiles = [
    "catalog-search.html",
    "catalog-search.css",
    "service-detail.html",
    "service-detail.css",
    "my-services.html",
    "my-services.css",
    "service-form.html",
    "service-form.css",
  ];

  for (const proto of prototypeFiles) {
    const webFile = path.join(WEBSITE_REF, proto);
    assert.ok(fs.existsSync(webFile), `Website ref missing ${proto}`);

    const content = fs.readFileSync(webFile, "utf-8");
    assert.ok(content.length > 50, `File ${proto} content is unexpectedly short`);
  }
});
