// Assembles dist/ for Cloudflare Pages: the hub at the root, one directory per season.
// Each season is only its web/ folder — every asset inside it is referenced relatively, so the same
// files that were served at a site root work unchanged under /rebuilt/ and /reefscape/.
import { cp, mkdir, readFile, readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIST = join(ROOT, 'dist');

const PAGE_FILES = ['index.html', '404.html'];
const SEASONS = [
  { dir: 'rebuilt', from: 'rebuilt/web' },
  { dir: 'reefscape', from: 'reefscape/web' },
];

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

for (const { dir, from } of SEASONS) {
  await cp(join(ROOT, from), join(DIST, dir), { recursive: true });
  const html = await readFile(join(DIST, dir, 'index.html'), 'utf8');
  if (!/<script type="module" src="(\.\/)?js\/ui\.js">/.test(html)) throw new Error(`${dir}: index.html lost its module entry`);
}

console.log(`build-site: ${await countFiles(DIST)} files → dist/ (${SEASONS.map((s) => `/${s.dir}/`).join(' ')})`);
