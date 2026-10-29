import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validatePack, validateFile } from '../scripts/validate-community.mjs';

const examplePath = new URL('../community/packs/lantern-lane.json', import.meta.url);
const example = JSON.parse(readFileSync(examplePath, 'utf8'));
const clone = () => structuredClone(example);
const assertInvalid = (modify, message) => {
  const pack = clone();
  modify(pack);
  assert.ok(validatePack(pack).some(error => error.includes(message)), 'expected ' + message);
};

test('seed pack passes structural and reference validation', () => {
  assert.deepEqual(validatePack(example), []);
  assert.deepEqual(validateFile(examplePath), []);
});
test('unknown executable/script fields are forbidden', () => {
  assertInvalid(pack => { pack.script = "alert('nope')"; }, 'unknown field');
  assertInvalid(pack => { pack.pieces[0].externalAssetUrl = 'https://example.org'; }, 'unknown field');
});
test('piece coordinates must be in bounds', () => {
  assertInvalid(pack => { pack.pieces[0].target.x = 100; }, 'above maximum');
  assertInvalid(pack => { pack.pieces[0].target.x = 12; }, 'off the city grid');
});
test('target space is unambiguous', () => {
  assertInvalid(pack => { pack.pieces[1].target = { ...pack.pieces[0].target }; }, 'overlaps');
});
test('all piece and mission references must resolve', () => {
  assertInvalid(pack => { pack.pieces[0].buildingId = 'not-found'; }, 'unknown building');
  assertInvalid(pack => { pack.missions[0].buildingId = 'not-found'; }, 'unknown mission building');
});
test('IDs must be unique and each building must contain parts', () => {
  assertInvalid(pack => { pack.pieces[1].id = pack.pieces[0].id; }, 'duplicate piece ID');
  assertInvalid(pack => { pack.buildings.push({ id: 'unused', name: 'Unused' }); }, 'has no pieces');
});
test('rights confirmation and unknown prefab codes are rejected', () => {
  assertInvalid(pack => { pack.rights.confirmed = false; }, 'incorrect fixed value');
  assertInvalid(pack => { pack.pieces[0].prefab = 'remote-code'; }, 'unsupported value');
});
test('control characters in user text are forbidden', () => {
  assertInvalid(pack => { pack.metadata.title = 'Hello\ninjection'; }, 'control characters');
});
