import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, "..");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
};

function createStaticServer(rootDirectory) {
  return http.createServer((req, res) => {
    let reqPath = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    if (reqPath === "/" || reqPath === "") reqPath = "/catalog-search.html"; // Default to catalog-search.html for prototypes
    const filePath = path.join(rootDirectory, reqPath);

    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end(`404 Not Found: ${reqPath}`);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": contentType });
    fs.createReadStream(filePath).pipe(res);
  });
}

const websiteRefDir = path.join(REPO, "website-frontend", "_webapp-reference");
const androidRefDir = path.join(REPO, "android-frontend", "_webapp-reference");

const server5191 = createStaticServer(websiteRefDir).listen(5191, "127.0.0.1", () => {
  console.log("Static server website-ref listening on http://localhost:5191");
});

const server5193 = createStaticServer(androidRefDir).listen(5193, "127.0.0.1", () => {
  console.log("Static server android-ref listening on http://localhost:5193");
});

process.on("SIGTERM", () => {
  server5191.close();
  server5193.close();
  process.exit(0);
});
