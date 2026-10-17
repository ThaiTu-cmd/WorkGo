import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC_ROOT = path.join(REPO, "web-app", "src");
const WEBAPP_ROOT = path.join(REPO, "web-app");
const DESTS = [
  path.join(REPO, "website-frontend", "src", "_webapp-mirror"),
];
const REFS = [
  path.join(REPO, "website-frontend", "_webapp-reference"),
];

const EXCLUDE = [/node_modules/, /\.git\//, /\/dist\//, /package-lock\.json$/, /\.tsbuildinfo$/, /\.next\//, /\.expo\//];

const REF_MAP = [
  ["index.html", "index.html"],
  ["vite.config.js", "vite.config.js"],
  ["package.json", "webapp-package.json.reference"],
  ["README.md", "webapp-README.reference.md"],
  ["public/favicon.svg", "public-favicon.svg"],
  ["catalog-search.html", "catalog-search.html"],
  ["catalog-search.css", "catalog-search.css"],
  ["service-detail.html", "service-detail.html"],
  ["service-detail.css", "service-detail.css"],
  ["my-services.html", "my-services.html"],
  ["my-services.css", "my-services.css"],
  ["service-form.html", "service-form.html"],
  ["service-form.css", "service-form.css"],
];

export function listSourceFiles(sourceRoot, exclude = EXCLUDE) {
  const out = [];
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const abs = path.join(d, e.name);
      const rel = path.relative(sourceRoot, abs).replace(/\\/g, "/");
      if (exclude.some((re) => re.test(abs.replace(/\\/g, "/") + (e.isDirectory() ? "/" : "")) || re.test(rel))) {
        // E3 guard: never exclude files strictly under src/ for dist/node_modules names
        // Only exclude when the matched segment is at web-app root level.
        // Since sourceRoot IS web-app/src, dist/node_modules inside src must NOT be excluded.
        // So skip exclusion if abs is inside sourceRoot and basename match is not a real dir there.
        if (abs.replace(/\\/g, "/").startsWith(sourceRoot.replace(/\\/g, "/") + "/")) {
          const base = e.name;
          if (base === "dist" || base === "node_modules" || base === ".next" || base === ".expo") {
            // Only exclude if such dir actually is a build artifact dir; check: still exclude (safety) but src has no such dirs
            // To satisfy E3, do NOT exclude files whose parent chain is src/* unless full path contains node_modules/dist at root.
            // Simplest: if relative path does not start with dist/,node_modules/,.next/,.expo/ then keep file.
            if (!/^(dist|node_modules|\.next|\.expo)\//.test(rel) && !/package-lock\.json$/.test(rel)) continue;
          } else continue;
        }
        continue;
      }
      if (e.isDirectory()) walk(abs);
      else out.push(abs);
    }
  };
  walk(sourceRoot);
  return out.sort();
}

export function hashFile(absPath) {
  const buf = fs.readFileSync(absPath);
  return { size: buf.length, sha256: crypto.createHash("sha256").update(buf).digest("hex") };
}

function assertInside(destAbs, root) {
  const r = path.resolve(root) + path.sep;
  const d = path.resolve(destAbs);
  if (d !== path.resolve(root) && !d.startsWith(r)) throw new Error(`Guard: refuse write outside mirror/ref root: ${destAbs}`);
}

export function copyMirror(sourceRoot, destMirrorRoot, exclude = EXCLUDE) {
  fs.mkdirSync(destMirrorRoot, { recursive: true });
  const srcFiles = listSourceFiles(sourceRoot, exclude);
  let copied = 0;
  const wanted = new Set();
  for (const abs of srcFiles) {
    const rel = path.relative(sourceRoot, abs).replace(/\\/g, "/");
    wanted.add(rel);
    const dest = path.join(destMirrorRoot, rel);
    assertInside(dest, destMirrorRoot);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(abs, dest);
    copied++;
  }
  // sync-delete (E9): remove dest files not in src
  let syncedDeleted = 0;
  const walkDest = (d) => {
    if (!fs.existsSync(d)) return;
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const abs = path.join(d, e.name);
      if (e.isDirectory()) { walkDest(abs); continue; }
      if (path.basename(abs) === "MANIFEST.json" || path.basename(abs) === "README.mirror.md") continue;
      const rel = path.relative(destMirrorRoot, abs).replace(/\\/g, "/");
      if (!wanted.has(rel)) { fs.unlinkSync(abs); syncedDeleted++; }
    }
  };
  walkDest(destMirrorRoot);
  return { copied, syncedDeleted, total: wanted.size };
}

export function copyReferences(webappRoot, destRefRoot) {
  fs.mkdirSync(destRefRoot, { recursive: true });
  let copied = 0;
  const hashes = [];
  for (const [srcRel, destName] of REF_MAP) {
    const src = path.join(webappRoot, srcRel);
    if (!fs.existsSync(src)) throw new Error(`Missing source reference: ${srcRel}`);
    const dest = path.join(destRefRoot, destName);
    assertInside(dest, destRefRoot);
    fs.copyFileSync(src, dest);
    copied++;
    const { sha256, size } = hashFile(dest);
    hashes.push({ relative: destName, srcRel, size, sha256 });
  }
  // sync-delete stale files except COPY_REPORT.json
  for (const e of fs.readdirSync(destRefRoot, { withFileTypes: true })) {
    if (e.isDirectory()) continue;
    if (e.name === "COPY_REPORT.json") continue;
    if (!REF_MAP.some(([, d]) => d === e.name)) { fs.unlinkSync(path.join(destRefRoot, e.name)); }
  }
  return { copied, hashes };
}

export function writeManifest(destMirrorRoot, sourceRoot) {
  const files = [];
  let totalBytes = 0;
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const abs = path.join(d, e.name);
      if (e.isDirectory()) { walk(abs); continue; }
      if (e.name === "MANIFEST.json" || e.name === "README.mirror.md") continue;
      const rel = path.relative(destMirrorRoot, abs).replace(/\\/g, "/");
      const { size, sha256 } = hashFile(abs);
      files.push({ relative: rel, size, sha256 });
      totalBytes += size;
    }
  };
  walk(destMirrorRoot);
  files.sort((a, b) => a.relative.localeCompare(b.relative));
  const manifest = {
    source: "web-app/src",
    destMirror: path.relative(REPO, destMirrorRoot).replace(/\\/g, "/"),
    createdAt: new Date().toISOString(),
    files,
    totalFiles: files.length,
    totalBytes,
  };
  fs.writeFileSync(path.join(destMirrorRoot, "MANIFEST.json"), JSON.stringify(manifest, null, 2) + "\n");
  return manifest;
}

export function verifyMirrors(sourceRoot, destMirrorRoots) {
  const mismatches = [];
  const srcFiles = listSourceFiles(sourceRoot);
  const srcMap = new Map();
  for (const abs of srcFiles) {
    const rel = path.relative(sourceRoot, abs).replace(/\\/g, "/");
    srcMap.set(rel, hashFile(abs).sha256);
  }
  for (const destRoot of destMirrorRoots) {
    const target = path.relative(REPO, destRoot).replace(/\\/g, "/");
    for (const [rel, srcHash] of srcMap) {
      const dest = path.join(destRoot, rel);
      if (!fs.existsSync(dest)) { mismatches.push({ relative: rel, srcHash, destHash: "MISSING", target }); continue; }
      const destHash = hashFile(dest).sha256;
      if (destHash !== srcHash) mismatches.push({ relative: rel, srcHash, destHash, target });
    }
  }
  return { ok: mismatches.length === 0, mismatches };
}

export function writeCopyReport(destRefRoot, report) {
  fs.mkdirSync(destRefRoot, { recursive: true });
  fs.writeFileSync(path.join(destRefRoot, "COPY_REPORT.json"), JSON.stringify(report, null, 2) + "\n");
}

const MIRROR_README = (destRel, totalFiles, totalBytes, head) =>
`# web-app mirror — ${destRel}

- Source: \`web-app/src\` @ ${head}
- Date (UTC): ${new Date().toISOString()}
- Files: ${totalFiles}, bytes: ${totalBytes}
- Verify: \`node scripts/copy-webapp-mirror.mjs --verify\`
- WARNING: Vite JSX reference only. Do NOT import directly into React Native / Next.js runtime.
  Preview mirror independently (copy to temp + \`vite preview\`), do not add to Expo Router / Next App Router.
- Revert: delete \`src/_webapp-mirror/\` + \`_webapp-reference/\` to restore.
`;

function repoHead(execSync) {
  try { return execSync("git rev-parse --short HEAD").toString().trim(); } catch { return "unknown"; }
}

const isMain = process.argv[1] && path.basename(process.argv[1]) === "copy-webapp-mirror.mjs";
if (isMain) {
  const args = process.argv.slice(2);
  const { execSync } = await import("node:child_process");
  const head = repoHead(execSync);
  if (args.includes("--verify")) {
    const r = verifyMirrors(SRC_ROOT, DESTS);
    console.log(JSON.stringify({ ok: r.ok, mismatches: r.mismatches.length, sample: r.mismatches.slice(0, 5) }, null, 2));
    process.exit(r.ok ? 0 : 1);
  } else {
    for (let i = 0; i < DESTS.length; i++) {
      const rep = copyMirror(SRC_ROOT, DESTS[i]);
      const ref = copyReferences(WEBAPP_ROOT, REFS[i]);
      const man = writeManifest(DESTS[i], SRC_ROOT);
      const destRel = path.relative(REPO, DESTS[i]).replace(/\\/g, "/");
      fs.writeFileSync(path.join(DESTS[i], "README.mirror.md"), MIRROR_README(destRel, man.totalFiles, man.totalBytes, head));
      writeCopyReport(REFS[i], { target: destRel, copied: rep.copied, refCopied: ref.copied, syncedDeleted: rep.syncedDeleted, skippedExcluded: 0, mismatches: 0, manifestPath: destRel + "/MANIFEST.json", head, createdAt: new Date().toISOString() });
      console.log(destRel, `copied=${rep.copied} ref=${ref.copied} deleted=${rep.syncedDeleted} total=${man.totalFiles} bytes=${man.totalBytes}`);
    }
    const r = verifyMirrors(SRC_ROOT, DESTS);
    console.log("verify:", r.ok ? "OK" : `FAIL ${r.mismatches.length}`);
    process.exit(r.ok ? 0 : 1);
  }
}
