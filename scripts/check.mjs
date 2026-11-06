// Static guard for the hub page. No dependencies. The page is a signpost with one entry per
// season, so the guard checks three things: the file is intact, the links point at season
// folders that exist, and nothing has crept back onto it that would need calibrating against
// the source repos.
// Run: npm run check        (SKIP_NET=1 npm run check to skip the production reachability probe)
import { readFile } from 'node:fs/promises';
import { strict as assert } from 'node:assert';

const FILES = ['index.html', '404.html'];
// The season consoles, built into this same site by scripts/build-site.mjs. A typo here is a
// dead entry, and so is a season whose web/ folder the build would copy nowhere.
const LIVE = ['/rebuilt/', '/reefscape/', '/2027/'];
const SEASON_WEB = ['rebuilt/web/index.html', 'reefscape/web/index.html', '2027/web/index.html'];

let failed = 0;
async function check(name, fn) {
  try { await fn(); console.log(`  ok   ${name}`); }
  catch (e) { failed++; console.log(`  FAIL ${name}\n       ${e.message}`); }
}

const src = {};
for (const f of FILES) src[f] = await readFile(new URL(`../${f}`, import.meta.url), 'utf8');

for (const [f, html] of Object.entries(src)) {
  await check(`${f}: UTF-8 clean (no BOM, no replacement chars)`, () => {
    assert.ok(!html.startsWith('\uFEFF'), 'has BOM');
    assert.ok(!html.includes('\uFFFD'), 'contains U+FFFD — the file is not valid UTF-8');
    assert.equal(Buffer.from(html, 'utf8').toString('utf8'), html, 'round-trip mismatch');
  });

  await check(`${f}: English only`, () => {
    // The page is written for readers outside the Chinese-font fallback chain, so a stray CJK character is
    // a bug in the copy, not a font problem: match ideographs and CJK punctuation, not § or the em dash.
    const cjk = html.match(/[\u3000-\u303f\u4e00-\u9fff\uff01-\uff5e]/g);
    assert.equal(cjk, null, `CJK text found: ${[...new Set(cjk || [])].join(' ')}`);
  });

  await check(`${f}: every external link is https and opens safely`, () => {
    for (const m of html.matchAll(/<a [^>]*href="(http[^"]+)"/g)) {
      assert.match(m[1], /^https:\/\//, `not https: ${m[1]}`);
      const tag = html.slice(m.index, m.index + 300);
      assert.match(tag.split('>')[0], /rel="[^"]*noopener/, `missing rel=noopener: ${m[1]}`);
    }
  });

  await check(`${f}: balanced block tags`, () => {
    for (const tag of ['html', 'body', 'div', 'section', 'article', 'main', 'header', 'footer',
      'ul', 'li', 'details', 'summary', 'svg', 'style', 'head']) {
      const open = (html.match(new RegExp(`<${tag}[\\s>]`, 'g')) || []).length;
      const close = (html.match(new RegExp(`</${tag}>`, 'g')) || []).length;
      assert.equal(open, close, `<${tag}>: ${open} open vs ${close} close`);
    }
  });

  await check(`${f}: no webfont / CDN / JS dependency`, () => {
    assert.ok(!/fonts\.(googleapis|gstatic)\.com/.test(html), 'pulls Google Fonts');
    // No <script> tag, and no JS event-handler attributes either — the page must be
    // readable by a browser that runs nothing.
    assert.ok(!/<script/.test(html), 'ships a <script>');
    assert.ok(!/\son(click|load|error|mouse\w+|key\w+)\s*=/.test(html), 'ships an inline event handler');
    assert.ok(!/rel="stylesheet"/.test(html), 'links an external stylesheet');
    // var() is not resolved inside SVG presentation attributes, only inside style="".
    assert.ok(!/="var\(--/.test(html), 'CSS variable used inside a presentation attribute');
  });
}

await check('index.html: every season entry point is present', () => {
  for (const url of LIVE) assert.ok(src['index.html'].includes(url), `missing ${url}`);
  assert.equal((src['index.html'].match(/class="go\b/g) || []).length, LIVE.length, `expected ${LIVE.length} entry buttons`);
});

await check('index.html: the page stays a signpost', () => {
  // The figures live in the source repos, not here, so the only thing this page can get wrong
  // is growing content that then drifts. A rebuilt card is a review item, not a passing check.
  for (const banned of ['<article', '<details', '<svg', 'class="num"', 'class="card"']) {
    assert.ok(!src['index.html'].includes(banned), `content is back on the hub page: ${banned}`);
  }
});

await check('each season console still has a source page to build from', async () => {
  for (const f of SEASON_WEB) {
    const html = await readFile(new URL(`../${f}`, import.meta.url), 'utf8');
    assert.match(html, /<script type="module" src="(\.\/)?js\/ui\.js">/, `${f} lost its module entry`);
  }
});

await check('the page names the domain it is served from', () => {
  assert.ok(src['index.html'].includes('xploresim.salmoncat0304.xyz'), 'the page does not name its own domain');
});

if (!process.env.SKIP_NET) {
  for (const path of LIVE) {
    const url = `https://xploresim.salmoncat0304.xyz${path}`;
    await check(`live: ${url}`, async () => {
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      assert.equal(res.status, 200, `HTTP ${res.status}`);
      const body = await res.text();
      assert.match(body, /XploreSim/, 'served page is not the simulator');
    });
  }
}

console.log(failed ? `\n${failed} check(s) failed` : '\nall checks passed');
process.exit(failed ? 1 : 0);
