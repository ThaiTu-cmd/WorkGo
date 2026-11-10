import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const viPath = path.resolve(__dirname, "../src/dictionaries/vi.json");
const enPath = path.resolve(__dirname, "../src/dictionaries/en.json");

const vi = JSON.parse(fs.readFileSync(viPath, "utf-8"));
const en = JSON.parse(fs.readFileSync(enPath, "utf-8"));

function flattenKeys(obj, prefix = "") {
  let keys = [];
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      keys = keys.concat(flattenKeys(v, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

const viKeys = new Set(flattenKeys(vi));
const enKeys = new Set(flattenKeys(en));

const missingInEn = [...viKeys].filter(k => !enKeys.has(k));
const missingInVi = [...enKeys].filter(k => !viKeys.has(k));

let hasError = false;

if (missingInEn.length > 0) {
  console.error("❌ Keys missing in en.json:", missingInEn);
  hasError = true;
}

if (missingInVi.length > 0) {
  console.error("❌ Keys missing in vi.json:", missingInVi);
  hasError = true;
}

if (!hasError) {
  console.log(`✅ Dictionary parity verified! (${viKeys.size} keys mirrored 1:1)`);
  process.exit(0);
} else {
  process.exit(1);
}
