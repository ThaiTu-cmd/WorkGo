import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Linter } from "eslint";

// The i18n codemod turned literals into tr("mXXX") calls. A call placed in a
// module-level helper has no `tr` in scope and throws ReferenceError at render
// time (e.g. the provider order list crashed in milestone()). ESLint ignores
// src/_webapp-mirror, so this test runs no-undef over every source file and
// reports only the translator identifiers.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(__dirname, "../src");
const TRANSLATORS = new Set(["tr", "t"]);

const sourceFiles = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return sourceFiles(full);
    return /\.(jsx?|mjs)$/.test(e.name) ? [full] : [];
  });

test("i18n: every tr()/t() call has a translator in scope", () => {
  const linter = new Linter();
  const config = {
    files: ["**/*.{js,jsx,mjs}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: { "no-undef": "error" },
  };
  const problems = [];
  const files = sourceFiles(SRC);
  assert.ok(files.length > 50, "expected to scan the web sources");
  for (const file of files) {
    const messages = linter.verify(fs.readFileSync(file, "utf8"), config, { filename: file });
    for (const m of messages) {
      // Never pass silently because the config did not apply to a file.
      if (m.fatal || m.ruleId === null) problems.push(`${path.relative(SRC, file)}: ${m.message}`);
      const name = m.ruleId === "no-undef" && /^'([^']+)'/.exec(m.message)?.[1];
      if (name && TRANSLATORS.has(name)) problems.push(`${path.relative(SRC, file)}:${m.line} ${name}() is not defined`);
    }
  }
  assert.deepEqual(problems, []);
});
