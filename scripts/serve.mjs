import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";

const root = process.cwd();
const types = { ".css": "text/css", ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml", ".txt": "text/plain" };
const server = createServer((request, response) => {
  const requested = new URL(request.url, "http://localhost").pathname;
  const relative = normalize(requested === "/" ? "index.html" : requested.slice(1));
  const file = join(root, relative);
  if (!file.startsWith(root) || !existsSync(file) || !statSync(file).isFile()) {
    response.writeHead(404, { "Content-Type": "text/plain" }); response.end("Not found"); return;
  }
  response.writeHead(200, { "Content-Type": `${types[extname(file)] || "application/octet-stream"}; charset=utf-8`, "Cache-Control": "no-store" });
  createReadStream(file).pipe(response);
});
server.listen(4173, "127.0.0.1", () => console.log("Invitation preview: http://localhost:4173"));
