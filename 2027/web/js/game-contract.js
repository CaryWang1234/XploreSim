// The game pack contract. The page and the static guard both call validateGame, so a pack
// cannot be live in one place and broken in the other. No dependencies, no DOM: this is
// importable from Node, from the browser, and from a test without a build step.

const STATUSES = new Set(['tba', 'draft', 'live']);
const LABEL_KEYS = ['piece', 'goal', 'home', 'neutral', 'endgame'];

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isText = (v) => typeof v === 'string' && v.trim().length > 0;
const isFiniteNumber = (v) => typeof v === 'number' && Number.isFinite(v);

// Paths of every scaffold value still in the pack, so the page can say how much is left
// rather than just "not ready".
export function placeholderPaths(value, path = 'GAME', out = []) {
  if (Array.isArray(value)) {
    value.forEach((item, i) => placeholderPaths(item, `${path}[${i}]`, out));
    return out;
  }
  if (!isObject(value)) return out;
  if (value.placeholder === true) out.push(path);
  for (const [key, child] of Object.entries(value)) {
    if (key === 'placeholder') continue;
    placeholderPaths(child, `${path}.${key}`, out);
  }
  return out;
}

export function validateGame(game) {
  const errors = [];
  const fail = (message) => errors.push(message);

  if (!isObject(game)) return { ok: false, errors: ['game pack is not an object'], placeholders: [] };

  if (!STATUSES.has(game.status)) fail(`status must be one of ${[...STATUSES].join(', ')}`);
  if (!Number.isInteger(game.season) || game.season < 2000 || game.season > 2100) {
    fail('season must be a four-digit year');
  }
  if (!isText(game.name)) fail('name is empty');
  if (!isText(game.edition)) fail('edition is empty');

  if (!isObject(game.manual)) fail('manual is missing');
  else {
    if (!isText(game.manual.title)) fail('manual.title is empty');
    if (!isText(game.manual.version)) fail('manual.version is empty');
    if (game.manual.source !== null && !isText(game.manual.source)) {
      fail('manual.source must be text or null');
    }
  }

  if (!isObject(game.theme) || !isText(game.theme.accent)) fail('theme.accent is empty');
  if (!isObject(game.labels)) fail('labels is missing');
  else {
    for (const key of LABEL_KEYS) {
      if (!isText(game.labels[key])) fail(`labels.${key} is empty`);
    }
  }

  const phases = Array.isArray(game.phases) ? game.phases : [];
  if (phases.length === 0) fail('phases is empty');
  const phaseKeys = new Set();
  const phaseKinds = new Set();
  let phaseSum = 0;
  phases.forEach((phase, i) => {
    const at = `phases[${i}]`;
    if (!isObject(phase)) {
      fail(`${at} is not an object`);
      return;
    }
    if (!isText(phase.key)) fail(`${at}.key is empty`);
    else if (phaseKeys.has(phase.key)) fail(`${at}.key is duplicated: ${phase.key}`);
    else phaseKeys.add(phase.key);
    if (!isText(phase.kind)) fail(`${at}.kind is empty`);
    else phaseKinds.add(phase.kind);
    if (!isText(phase.label)) fail(`${at}.label is empty`);
    if (!isFiniteNumber(phase.sec) || phase.sec <= 0) fail(`${at}.sec must be a positive number`);
    else phaseSum += phase.sec;
  });
  if (!isObject(game.clock) || !isFiniteNumber(game.clock.matchSec) || game.clock.matchSec <= 0) {
    fail('clock.matchSec must be a positive number');
  } else if (phases.length > 0 && Math.abs(phaseSum - game.clock.matchSec) > 1e-9) {
    fail(`phases sum to ${phaseSum}s, clock.matchSec is ${game.clock.matchSec}s`);
  }

  const actions = Array.isArray(game.actions) ? game.actions : [];
  if (actions.length === 0) fail('actions is empty');
  const actionKeys = new Set();
  actions.forEach((action, i) => {
    const at = `actions[${i}]`;
    if (!isObject(action)) {
      fail(`${at} is not an object`);
      return;
    }
    if (!isText(action.key)) fail(`${at}.key is empty`);
    else if (actionKeys.has(action.key)) fail(`${at}.key is duplicated: ${action.key}`);
    else actionKeys.add(action.key);
    if (!isText(action.label)) fail(`${at}.label is empty`);
    if (!isObject(action.points) || Object.keys(action.points).length === 0) {
      fail(`${at}.points is empty`);
      return;
    }
    for (const [kind, points] of Object.entries(action.points)) {
      if (!phaseKinds.has(kind)) fail(`${at}.points.${kind} is not a phase kind`);
      if (!isFiniteNumber(points) || points < 0) fail(`${at}.points.${kind} must be a non-negative number`);
    }
  });

  const rp = Array.isArray(game.rp) ? game.rp : [];
  if (rp.length === 0) fail('rp is empty');
  const rpKeys = new Set();
  rp.forEach((row, i) => {
    const at = `rp[${i}]`;
    if (!isObject(row)) {
      fail(`${at} is not an object`);
      return;
    }
    if (!isText(row.key)) fail(`${at}.key is empty`);
    else if (rpKeys.has(row.key)) fail(`${at}.key is duplicated: ${row.key}`);
    else rpKeys.add(row.key);
    if (!isText(row.label)) fail(`${at}.label is empty`);
    if (!isFiniteNumber(row.value) || row.value < 0) fail(`${at}.value must be a non-negative number`);
  });

  const rules = Array.isArray(game.rules) ? game.rules : [];
  const ruleIds = new Set();
  rules.forEach((rule, i) => {
    const at = `rules[${i}]`;
    if (!isObject(rule)) {
      fail(`${at} is not an object`);
      return;
    }
    if (!isText(rule.id)) fail(`${at}.id is empty`);
    else if (ruleIds.has(rule.id)) fail(`${at}.id is duplicated: ${rule.id}`);
    else ruleIds.add(rule.id);
    if (!isText(rule.text)) fail(`${at}.text is empty`);
    if (!isText(rule.engine)) fail(`${at}.engine is empty`);
  });

  const placeholders = placeholderPaths(game);

  if (game.status === 'live') {
    if (placeholders.length > 0) fail(`status is live but ${placeholders.length} placeholder value(s) remain`);
    if (rules.length === 0) fail('status is live but rules is empty');
    if (!isObject(game.manual) || !isText(game.manual.source)) fail('status is live but manual.source is empty');
    if (!isObject(game.field) || !isFiniteNumber(game.field.lengthIn) || game.field.lengthIn <= 0) {
      fail('status is live but field.lengthIn is not measured');
    }
    if (!isObject(game.field) || !isFiniteNumber(game.field.widthIn) || game.field.widthIn <= 0) {
      fail('status is live but field.widthIn is not measured');
    }
  }

  return { ok: errors.length === 0, errors, placeholders };
}
