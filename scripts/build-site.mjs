// Assembles dist/ for Cloudflare Pages: the hub at the root, one directory per season.
// Each season is only its web/ folder — every asset inside it is referenced relatively, so the same
// files that were served at a site root work unchanged under /rebuilt/ and /reefscape/.
import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIST = join(ROOT, 'dist');

const PAGE_FILES = ['index.html', '404.html', 'icon.svg', 'rebuilt-piece.svg', 'reefscape-piece.svg', '2027-piece.svg', '_headers'];
const SEASONS = [
  { dir: 'rebuilt', from: 'rebuilt/web' },
  { dir: 'reefscape', from: 'reefscape/web' },
  { dir: '2027', from: '2027/web' },
];

// Cloudflare Web Analytics for the zone's RUM site. The token is public by design — it ships in the
// HTML of every site that uses it. It is injected here rather than typed into three HTML files so a
// page added later cannot forget it, and so the two season consoles stay untouched subtrees.
const BEACON = '<!-- Cloudflare Web Analytics --><script type="module" src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon=\'{"token": "83564fde8f344edeb95398a3195913d3"}\'></script><!-- End Cloudflare Web Analytics -->';

async function addBeacon(file) {
  const html = await readFile(file, 'utf8');
  if (html.includes('static.cloudflareinsights.com')) return;
  if (!html.includes('</body>')) throw new Error(`${file}: no </body> for the analytics beacon`);
  await writeFile(file, html.replace('</body>', `${BEACON}\n</body>`));
}

async function countFiles(dir) {
  let n = 0;
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    n += entry.isDirectory() ? await countFiles(join(dir, entry.name)) : 1;
  }
  return n;
}

await rm(DIST, { recursive: true, force: true });
await mkdir(DIST, { recursive: true });

for (const file of PAGE_FILES) await cp(join(ROOT, file), join(DIST, file));
for (const file of ['index.html', '404.html']) await addBeacon(join(DIST, file));

for (const { dir, from } of SEASONS) {
  await cp(join(ROOT, from), join(DIST, dir), { recursive: true });
  const html = await readFile(join(DIST, dir, 'index.html'), 'utf8');
  if (!/<script type="module" src="(\.\/)?js\/ui\.js">/.test(html)) throw new Error(`${dir}: index.html lost its module entry`);
  await addBeacon(join(DIST, dir, 'index.html'));
}

console.log(`build-site: ${await countFiles(DIST)} files → dist/ (${SEASONS.map((s) => `/${s.dir}/`).join(' ')})`);
