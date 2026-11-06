// Renders the 2027 game pack. The page has no game logic of its own: every row is a view of
// web/js/game.js, and the contract is checked before anything is printed.

import { GAME } from './game.js';
import { validateGame, placeholderPaths } from './game-contract.js';

const $ = (id) => document.getElementById(id);
const esc = (value) => String(value).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const isNumber = (value) => typeof value === 'number' && Number.isFinite(value);

const STATUS_COPY = {
  tba: {
    chip: 'Awaiting kickoff',
    title: 'The 2027 game is not published yet.',
    copy: 'This console is already built and deployed. At kickoff, fill web/js/game.js first: the identity, phases, scoring and ranking points on this page update without touching the shell.',
  },
  draft: {
    chip: 'Draft pack',
    title: 'Draft pack',
    copy: 'The page is rendering the pack as it is filled. Flip status to live only when the rules and the field are measured; the contract refuses a live pack while any placeholder remains.',
  },
  live: {
    chip: 'Live',
    title: 'Live pack.',
    copy: 'Every value on this page comes from the 2027 game pack. The rule sources below are the audit trail for the engine.',
  },
};

function clock(sec) {
  const total = Math.max(0, Math.round(sec));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function setText(id, text) {
  const node = $(id);
  if (node) node.textContent = text;
}

function applyIdentity() {
  document.title = `XploreSim ${GAME.season} - ${GAME.name}`;
  document.documentElement.style.setProperty('--accent', GAME.theme.accent);
  document.documentElement.style.setProperty('--accent-dim', GAME.theme.accentDim);
  setText('season-name', GAME.name);
  setText('season-edition', GAME.edition);
  setText('manual-line', `${GAME.manual.title} - ${GAME.manual.version}`);
}

function applyStatus(placeholders) {
  const copy = STATUS_COPY[GAME.status] || STATUS_COPY.tba;
  const chip = $('chip-status');
  if (chip) {
    chip.dataset.state = GAME.status;
    chip.textContent = copy.chip;
  }
  const banner = $('status-banner');
  if (banner) banner.dataset.state = GAME.status;
  const title = GAME.status === 'draft'
    ? `${copy.title}: ${placeholders.length} placeholder value(s) remain.`
    : copy.title;
  setText('banner-title', title);
  setText('banner-copy', copy.copy);
}

function renderPhases() {
  const body = $('phase-table');
  if (!body) return;
  let at = 0;
  body.innerHTML = GAME.phases.map((phase) => {
    const start = at;
    at += phase.sec;
    const tag = phase.placeholder ? ' <span class="tag">PLACEHOLDER</span>' : '';
    return `<tr>
      <td>${esc(phase.label)}${tag}</td>
      <td>${esc(phase.kind)}</td>
      <td>${esc(phase.sec)}s</td>
      <td>${esc(clock(start))} - ${esc(clock(at))}</td>
      <td></td>
    </tr>`;
  }).join('');
  if (body.querySelectorAll('tr').length === 0) {
    body.innerHTML = '<tr><td colspan="5">No phases declared.</td></tr>';
  }
}

function renderActions() {
  const body = $('action-table');
  if (!body) return;
  const labelOf = new Map();
  for (const phase of GAME.phases) if (!labelOf.has(phase.kind)) labelOf.set(phase.kind, phase.label);
  body.innerHTML = GAME.actions.map((action) => {
    const points = Object.entries(action.points)
      .map(([kind, value]) => `${labelOf.get(kind) || kind} ${value}`)
      .join(' / ');
    const tag = action.placeholder ? ' <span class="tag">PLACEHOLDER</span>' : '';
    return `<tr>
      <td>${esc(action.label)}${tag}</td>
      <td>${esc(points)}</td>
      <td></td>
    </tr>`;
  }).join('');
}

function renderRp() {
  const body = $('rp-table');
  if (!body) return;
  body.innerHTML = GAME.rp.map((row) => {
    const tag = row.placeholder ? ' <span class="tag">PLACEHOLDER</span>' : '';
    return `<tr>
      <td>${esc(row.label)}${tag}</td>
      <td>${esc(row.value)}</td>
      <td></td>
    </tr>`;
  }).join('');
}

function renderRules() {
  const body = $('rules-table');
  const empty = $('rules-empty');
  if (!body) return;
  const rules = GAME.rules;
  const wrap = body.closest('.table-wrap');
  if (wrap) wrap.hidden = rules.length === 0;
  if (empty) empty.hidden = rules.length > 0;
  body.innerHTML = rules.map((rule) => `<tr>
    <td>${esc(rule.id)}</td>
    <td>${esc(rule.text)}</td>
    <td>${esc(rule.engine)}</td>
  </tr>`).join('');
}

function renderState(placeholders) {
  const paths = placeholders;
  const shown = paths.slice(0, 4).join(', ');
  const more = paths.length > 4 ? ` and ${paths.length - 4} more` : '';
  setText('placeholder-count', paths.length === 0
    ? 'No placeholder values remain.'
    : `${paths.length} placeholder value(s): ${shown}${more}`);

  const field = GAME.field || {};
  const measured = isNumber(field.lengthIn) && isNumber(field.widthIn) && field.lengthIn > 0 && field.widthIn > 0;
  setText('field-line', measured
    ? `Field: ${field.lengthIn} x ${field.widthIn} in.`
    : 'Field: not measured yet.');
}

function renderErrors(result) {
  const panel = $('contract-errors');
  const list = $('contract-error-list');
  if (!panel || !list) return;
  panel.hidden = result.ok;
  list.innerHTML = result.errors.map((error) => `<li>${esc(error)}</li>`).join('');
}

function main() {
  applyIdentity();
  const result = validateGame(GAME);
  const placeholders = placeholderPaths(GAME);
  applyStatus(placeholders);
  renderState(placeholders);
  renderPhases();
  renderActions();
  renderRp();
  renderRules();
  renderErrors(result);
}

main();
