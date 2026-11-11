import fs from 'node:fs';
import path from 'node:path';

function scanDir(dir, filter) {
  let files = [];
  try {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!['target', 'node_modules', '.git', '.next'].includes(entry.name)) {
          files.push(...scanDir(full, filter));
        }
      } else if (filter(entry.name)) {
        files.push(full);
      }
    }
  } catch {}
  return files;
}

// 1. Scan Java controllers
const controllerFiles = scanDir('.', (name) => name.endsWith('Controller.java'));
const backendEndpoints = [];

for (const c of controllerFiles) {
  const content = fs.readFileSync(c, 'utf8');
  const service = c.split(path.sep)[0];
  const baseMatch = content.match(/@RequestMapping\((?:value\s*=\s*)?["']([^"']+)["']/);
  const basePath = baseMatch ? baseMatch[1] : '';

  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const methodMatch = line.match(/@(Get|Post|Put|Delete|Patch)Mapping(?:\((?:(?:value|path)\s*=\s*)?["']?([^"'\)]*)["']?\))?/);
    if (methodMatch) {
      let httpMethod = methodMatch[1].toUpperCase();
      let subPath = methodMatch[2] || '';
      if (subPath && !subPath.startsWith('/')) subPath = '/' + subPath;
      let fullPath = basePath + subPath;
      
      let j = i + 1;
      let methodSig = '';
      while (j < lines.length && !lines[j].includes(';') && !lines[j].includes('{')) {
        methodSig += ' ' + lines[j].trim();
        j++;
      }
      if (j < lines.length) methodSig += ' ' + lines[j].trim();

      const isInternal = fullPath.includes('/internal/');
      const servicePrefix = '/' + service.replace('-service', '');
      const fullGatewayPath = servicePrefix + fullPath;

      backendEndpoints.push({
        service,
        controller: path.basename(c),
        isInternal,
        httpMethod,
        backendPath: fullPath,
        fullGatewayPath,
        signature: methodSig.trim().replace(/\s+/g, ' ')
      });
    }
  }
}

// 2. Scan frontend API definitions in website-frontend/src/_webapp-mirror/api/
const apiDir = path.join('website-frontend', 'src', '_webapp-mirror', 'api');
const apiFiles = fs.readdirSync(apiDir).filter(f => f.endsWith('.js') && f !== 'axiosClient.js');

const frontendCalls = [];

for (const file of apiFiles) {
  const content = fs.readFileSync(path.join(apiDir, file), 'utf8');
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/axiosClient\.(get|post|put|delete|patch)\s*\(\s*([`'"][^`'"]+[`'"])/);
    if (match) {
      const httpMethod = match[1].toUpperCase();
      let urlRaw = match[2].slice(1, -1);
      frontendCalls.push({
        file,
        httpMethod,
        url: urlRaw
      });
    }
  }
}

function pathsMatch(bePath, fePath) {
  const beParts = bePath.split('/').filter(Boolean);
  const feParts = fePath.split('/').filter(Boolean);
  if (beParts.length !== feParts.length) return false;
  for (let i = 0; i < beParts.length; i++) {
    const b = beParts[i];
    const f = feParts[i];
    const bIsParam = b.startsWith('{') && b.endsWith('}');
    const fIsParam = f.startsWith('${') && f.endsWith('}');
    
    if (bIsParam) {
      if (!fIsParam) return false;
    } else {
      if (fIsParam) return false;
      if (b !== f) return false;
    }
  }
  return true;
}

// 3. Match
let externalTotal = 0;
let connectedCount = 0;
const missing = [];

for (const ep of backendEndpoints) {
  if (ep.isInternal) continue;
  externalTotal++;
  const matched = frontendCalls.filter(call => {
    return call.httpMethod === ep.httpMethod && pathsMatch(ep.fullGatewayPath, call.url);
  });
  if (matched.length > 0) {
    connectedCount++;
  } else {
    missing.push(ep);
  }
}

console.log('========================================================================');
console.log('                  WORKGO API PARITY VERIFICATION                       ');
console.log('========================================================================');
console.log(`Controllers Scanned   : ${controllerFiles.length}`);
console.log(`Total Java Endpoints  : ${backendEndpoints.length}`);
console.log(`Internal Endpoints    : ${backendEndpoints.length - externalTotal} (Inter-service only)`);
console.log(`External API Gateway  : ${externalTotal}`);
console.log(`Connected in Frontend : ${connectedCount} / ${externalTotal} (${Math.round((connectedCount / externalTotal) * 100)}%)`);
console.log(`Missing Endpoints     : ${missing.length}`);
console.log('------------------------------------------------------------------------');

if (missing.length === 0) {
  console.log('STATUS: [PASS] 100% of External Backend APIs are connected to Frontend!');
  console.log('========================================================================');
  process.exit(0);
} else {
  console.log('STATUS: [FAIL] Some Backend APIs are missing from Frontend:');
  for (const m of missing) {
    console.log(` - [${m.service}] ${m.httpMethod} ${m.fullGatewayPath} (${m.controller})`);
  }
  console.log('========================================================================');
  process.exit(1);
}
