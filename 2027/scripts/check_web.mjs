// Static guard for the 2027 console. It checks the shell the same way the older seasons do
// (encoding, tag balance, module parse), then checks the part that is new: the game pack must
// satisfy its contract, and a TBA pack must still say so on the page.
//
// Run: npm run check

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { GAME } from '../web/js/game.js';
import { validateGame, placeholderPaths } from '../web/js/game-contract.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const HTML = 'web/index.html';
const CSS = 'web/styles.css';
const JS_DIR = 'web/js';

const MOJIBAKE = ['â€', 'Ã©', 'Ã¨', 'Ã¼', 'å­', 'æµ', 'ä¸­', 'çš„', 'è¡¨', '\ufeff'];
const REPLACEMENT = Buffer.from([0xef, 0xbf, 0xbd]);
// Void elements (img, input, link, meta) have no close tag and are checked separately by the
// browser, not by a count that would always read 1 open and 0 close.
const TAGS = ['html', 'head', 'body', 'header', 'main', 'section', 'div', 'p', 'h1', 'h2', 'h3',
  'a', 'span', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'ol', 'ul', 'li', 'footer', 'strong', 'b'];

let failed = 0;
const fail = (message) => { console.log(`FAIL ${message}`); failed++; };
const ok = (message) => console.log(`  ok   ${message}`);

function read(rel) {
  const buf = fs.readFileSync(path.join(ROOT, rel));
  const text = buf.toString('utf8');
  return { buf, text };
}

function checkText(rel) {
  const { buf, text } = read(rel);
  if (buf.includes(REPLACEMENT)) fail(`${rel}: contains U+FFFD, the decoder replacement character`);
  if (buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) fail(`${rel}: starts with a UTF-8 BOM`);
  for (const pattern of MOJIBAKE) if (text.includes(pattern)) fail(`${rel}: contains ${JSON.stringify(pattern)}: mojibake`);
  if (Buffer.from(text, 'utf8').toString('utf8') !== text) fail(`${rel}: is not valid UTF-8`);
  const cjk = text.match(/[\u3000-\u303f\u4e00-\u9fff\uff01-\uff5e]/g);
  if (cjk) fail(`${rel}: CJK text found: ${[...new Set(cjk)].join(' ')}`);
}

const html = read(HTML).text;
const css = read(CSS).text;

// Scripts are parse-checked below. They are not scanned for mojibake because this file
// defines the mojibake patterns it searches for.
for (const rel of [HTML, CSS, 'package.json',
  ...fs.readdirSync(path.join(ROOT, JS_DIR)).filter((f) => f.endsWith('.js')).map((f) => `${JS_DIR}/${f}`),
]) checkText(rel);
ok('encoding and English-only copy');

for (const tag of TAGS) {
  const open = (html.match(new RegExp(`<${tag}(?=[\\s>])`, 'g')) || []).length;
  const close = (html.match(new RegExp(`</${tag}>`, 'g')) || []).length;
  if (open !== close) fail(`${HTML}: <${tag}> opens ${open} times and closes ${close} times`);
}
ok('HTML tag balance');

if (!/<script type="module" src="\.\/js\/ui\.js"><\/script>/.test(html)) {
  fail(`${HTML}: lost its module entry`);
}
if (!html.includes('id="status-banner"') || !html.includes('id="contract-errors"')) {
  fail(`${HTML}: the status banner or the contract error panel is missing`);
}
if (/https?:\/\//.test(html) || /fonts\.(googleapis|gstatic)\.com/.test(html)) {
  fail(`${HTML}: references an external resource`);
}
if (/https?:\/\//.test(css)) fail(`${CSS}: references an external resource`);
ok('page structure and self-containment');

const ui = read(`${JS_DIR}/ui.js`).text;
for (const needle of ["from './game.js'", "from './game-contract.js'", 'validateGame(GAME)', 'placeholderPaths(GAME)']) {
  if (!ui.includes(needle)) fail(`${JS_DIR}/ui.js: missing ${needle}`);
}
ok('the page reads the game pack');

for (const name of fs.readdirSync(path.join(ROOT, JS_DIR))) {
  if (!name.endsWith('.js')) continue;
  const out = spawnSync(process.execPath, ['--check', path.join(ROOT, JS_DIR, name)], { encoding: 'utf8' });
  if (out.status !== 0) fail(`${JS_DIR}/${name} does not parse: ${(out.stderr || '').split('\n').slice(0, 3).join(' / ')}`);
}
for (const name of fs.readdirSync(path.join(ROOT, 'scripts'))) {
  if (!name.endsWith('.mjs')) continue;
  const out = spawnSync(process.execPath, ['--check', path.join(ROOT, 'scripts', name)], { encoding: 'utf8' });
  if (out.status !== 0) fail(`scripts/${name} does not parse: ${(out.stderr || '').split('\n').slice(0, 3).join(' / ')}`);
}
ok('every module parses');

if ((css.match(/\{/g) || []).length !== (css.match(/\}/g) || []).length) fail(`${CSS}: unbalanced braces`);
const jsClasses = [...fs.readdirSync(path.join(ROOT, JS_DIR))]
  .filter((f) => f.endsWith('.js'))
  .flatMap((f) => [...read(`${JS_DIR}/${f}`).text.matchAll(/class="([^"]*)"/g)])
  .flatMap((m) => m[1].split(/\s+/));
const used = new Set([
  ...[...html.matchAll(/class="([^"]*)"/g)].flatMap((m) => m[1].split(/\s+/)),
  ...jsClasses,
].filter(Boolean));
const styled = new Set([...css.matchAll(/\.([a-zA-Z][\w-]*)/g)].map((m) => m[1]));
const dead = [...styled].filter((name) => !used.has(name));
const bare = [...used].filter((name) => !styled.has(name));
if (dead.length) fail(`${CSS}: rules target nothing: ${dead.join(', ')}`);
if (bare.length) fail(`${CSS}: classes have no rule: ${bare.join(', ')}`);
const declared = new Set([...css.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]));
const missingVars = [...css.matchAll(/var\((--[\w-]+)(\s*,[^)]*)?\)/g)]
  .filter((m) => !declared.has(m[1]) && !m[2])
  .map((m) => m[1]);
if (missingVars.length) fail(`${CSS}: undeclared variables: ${[...new Set(missingVars)].join(', ')}`);
ok('stylesheet and class cross-check');

const result = validateGame(GAME);
if (!result.ok) fail(`game pack contract: ${result.errors.join('; ')}`);
else ok('game pack contract');

const placeholders = placeholderPaths(GAME);
if (GAME.status === 'tba') {
  if (placeholders.length === 0) fail('status is tba but no placeholder values are marked');
  if (!html.includes('not published yet')) fail('status is tba but the page does not say the game is unpublished');
} else if (GAME.status === 'live' && placeholders.length > 0) {
  fail(`status is live but ${placeholders.length} placeholder value(s) remain`);
}
if (GAME.status !== 'tba' && !html.includes('PLACEHOLDER')) {
  // The tag is printed by ui.js for any row still marked; a live pack has none, so this only
  // guards against removing the marker from the renderer.
  if (!ui.includes('PLACEHOLDER')) fail('the renderer no longer marks placeholder rows');
}
ok(`pack state (${GAME.status}, ${placeholders.length} placeholders)`);

console.log(failed ? `\n${failed} check(s) failed` : '\nall checks passed');
process.exit(failed ? 1 : 0);
