// Contract tests for the 2027 game pack. These run without a browser: the pack is plain data,
// and the same validator the page imports is the one under test.

import test from 'node:test';
import assert from 'node:assert/strict';
import { GAME } from '../web/js/game.js';
import { validateGame, placeholderPaths } from '../web/js/game-contract.js';

const clone = () => structuredClone(GAME);

function stripPlaceholders(value) {
  if (Array.isArray(value)) return value.map(stripPlaceholders);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [key, child] of Object.entries(value)) {
      if (key !== 'placeholder') out[key] = stripPlaceholders(child);
    }
    return out;
  }
  return value;
}

function livePack() {
  const pack = stripPlaceholders(clone());
  pack.status = 'live';
  pack.manual.source = '2027GameManual.pdf';
  pack.field.lengthIn = 600;
  pack.field.widthIn = 300;
  pack.rules = [{ id: 'T1', text: 'A test clause.', engine: 'test()' }];
  return pack;
}

test('the shipped placeholder pack satisfies its own contract', () => {
  const result = validateGame(GAME);
  assert.deepEqual(result.errors, []);
  assert.equal(result.ok, true);
});

test('the placeholder list names the scaffold rows', () => {
  const paths = placeholderPaths(GAME);
  assert.ok(paths.includes('GAME.phases[0]'));
  assert.ok(paths.includes('GAME.actions[0]'));
  assert.ok(paths.includes('GAME.field'));
});

test('a phase sum that does not match the clock is rejected', () => {
  const pack = clone();
  pack.phases[1].sec += 5;
  const result = validateGame(pack);
  assert.equal(result.ok, false);
  assert.match(result.errors.join(' '), /phases sum to/);
});

test('duplicate phase keys are rejected', () => {
  const pack = clone();
  pack.phases[1].key = pack.phases[0].key;
  const result = validateGame(pack);
  assert.equal(result.ok, false);
  assert.match(result.errors.join(' '), /duplicated/);
});

test('a scoring row keyed to an unknown phase kind is rejected', () => {
  const pack = clone();
  pack.actions[0].points.overtime = 2;
  const result = validateGame(pack);
  assert.equal(result.ok, false);
  assert.match(result.errors.join(' '), /not a phase kind/);
});

test('negative points are rejected', () => {
  const pack = clone();
  pack.actions[0].points.auto = -1;
  const result = validateGame(pack);
  assert.equal(result.ok, false);
  assert.match(result.errors.join(' '), /non-negative/);
});

test('a live pack with a placeholder value is rejected', () => {
  const pack = livePack();
  pack.actions[0].placeholder = true;
  const result = validateGame(pack);
  assert.equal(result.ok, false);
  assert.match(result.errors.join(' '), /placeholder/);
});

test('a live pack without rules, source or measured field is rejected', () => {
  const pack = livePack();
  pack.rules = [];
  pack.manual.source = null;
  pack.field.lengthIn = null;
  pack.field.widthIn = null;
  const result = validateGame(pack);
  assert.equal(result.ok, false);
  const text = result.errors.join(' ');
  assert.match(text, /rules is empty/);
  assert.match(text, /manual\.source is empty/);
  assert.match(text, /field\.lengthIn/);
  assert.match(text, /field\.widthIn/);
});

test('a fully filled live pack is accepted', () => {
  const result = validateGame(livePack());
  assert.deepEqual(result.errors, []);
  assert.equal(result.ok, true);
});
