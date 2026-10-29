// Local preview of the built site, on loopback only. Serves dist/ with the same two rules Cloudflare
// Pages applies: a directory resolves to its index.html, and a miss returns the site's 404.html.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..', 'dist');
const port = Number(process.env.PORT || 4190);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};

async function sendFile(res, file, status = 200) {
  const body = await readFile(file);
  res.writeHead(status, { 'content-type': TYPES[extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
  res.end(body);
}

createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${port}`);
  let rel = decodeURIComponent(url.pathname);
  if (rel === '/' || rel === '') rel = '/index.html';
  const target = join(root, normalize(rel).replace(/^([/\\])+/, ''));
  if (!target.startsWith(root)) {
    res.writeHead(403).end('forbidden');
    return;
  }
  try {
    const info = await stat(target);
    await sendFile(res, info.isDirectory() ? join(target, 'index.html') : target);
  } catch {
    await sendFile(res, join(root, '404.html'), 404).catch(() => {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('not found');
    });
  }
}).listen(port, '127.0.0.1', () => {
  console.log(`XploreSim preview: http://127.0.0.1:${port}/  (root: ${root})`);
});
