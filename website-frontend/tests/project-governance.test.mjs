import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../");

test("Governance - Backend and docs directories are intact and unmodified", () => {
  const gitStatus = execSync("git status --porcelain", {
    cwd: projectRoot,
    encoding: "utf-8",
  });

  const modifiedLines = gitStatus
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const forbiddenPrefixes = [
    "api-gateway/",
    "catalog-service/",
    "identity-service/",
    "order-service/",
    "payment-service/",
    "docs/",
  ];

  for (const line of modifiedLines) {
    // line format: " M relative/path" or "?? relative/path"
    const filePath = line.replace(/^[A-Z?]{1,2}\s+/, "");
    for (const prefix of forbiddenPrefixes) {
      assert.ok(
        !filePath.startsWith(prefix),
        `Violation: forbidden modification in ${filePath}`
      );
    }
  }
});

test("Governance - Typography conforms to Brand A (Be Vietnam Pro loaded)", () => {
  const layoutPath = path.resolve(__dirname, "../src/app/layout.tsx");
  assert.ok(fs.existsSync(layoutPath), "layout.tsx must exist");

  const layoutContent = fs.readFileSync(layoutPath, "utf-8");
  assert.match(
    layoutContent,
    /Be_Vietnam_Pro/,
    "Root layout must import and configure Be_Vietnam_Pro"
  );
  assert.ok(
    !layoutContent.includes("Geist"),
    "Default Geist font must be removed"
  );
});

test("Governance - Package scripts include typecheck, build, lint", () => {
  const pkgPath = path.resolve(__dirname, "../package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));

  assert.ok(pkg.scripts.build, "build script must exist");
  assert.ok(pkg.scripts.lint, "lint script must exist");
  assert.ok(pkg.scripts.typecheck, "typecheck script must exist");
});

test("Governance - WorkGo Service Runner (run.ps1) and test suite are present and valid", () => {
  const runScriptPath = path.resolve(projectRoot, "run.ps1");
  assert.ok(fs.existsSync(runScriptPath), "run.ps1 must exist at project root");

  const runContent = fs.readFileSync(runScriptPath, "utf-8");
  assert.match(runContent, /\$Force/, "run.ps1 must support -Force");
  assert.match(runContent, /\$Restart/, "run.ps1 must support -Restart");
  assert.match(runContent, /\$Stop/, "run.ps1 must support -Stop");
  assert.match(runContent, /\$Status/, "run.ps1 must support -Status");
  assert.match(runContent, /\$Clean/, "run.ps1 must support -Clean");
  assert.match(runContent, /identity-service/, "run.ps1 must configure identity-service");
  assert.match(runContent, /api-gateway/, "run.ps1 must configure api-gateway");
  assert.match(runContent, /catalog-service/, "run.ps1 must configure catalog-service");
  assert.match(runContent, /order-service/, "run.ps1 must configure order-service");
  assert.match(runContent, /payment-service/, "run.ps1 must configure payment-service");

  const runnerTestPath = path.resolve(projectRoot, "scripts/test-runner.ps1");
  assert.ok(fs.existsSync(runnerTestPath), "scripts/test-runner.ps1 must exist");
});

