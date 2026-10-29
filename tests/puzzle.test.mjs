import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { blankSession, restoreSession, pieceById, nextUnplaced, tryPlace, progress, buildingComplete, completeMission } from '../src/core/puzzle.mjs';
import { validatePack } from '../scripts/validate-community.mjs';

const pack = JSON.parse(readFileSync(new URL('../game/campaign/the-living-block.json', import.meta.url), 'utf8'));

test('campaign pack uses the same strict schema as The Commons', () => {
  assert.deepEqual(validatePack(pack), []);
  assert.equal(pack.buildings.length, 3);
  assert.equal(pack.pieces.length, 12);
});
test('no ability to assemble unknown or wrong piece', () => {
  const start = blankSession(pack);
  assert.equal(tryPlace(pack,start,'missing',{x:0,y:0,z:0,rotation:0}).ok,false);
  assert.equal(tryPlace(pack,start,'cafe-foundation',{x:0,y:0,z:0,rotation:0}).ok,false);
  assert.equal(progress(pack,start).placed,0);
});
test('rotation matters and completing a building is deterministic', () => {
  let state = blankSession(pack);
  const wall = pieceById(pack,'cafe-wall');
  assert.equal(tryPlace(pack,state,wall.id,{...wall.target,rotation:0}).ok,false);
  for (const piece of pack.pieces.filter(p=>p.buildingId === 'cafe')) {
    const result = tryPlace(pack,state,piece.id,piece.target);
    assert.equal(result.ok,true);
    state = result.session;
  }
  assert.equal(buildingComplete(pack,state,'cafe'),true);
  assert.equal(tryPlace(pack,state,'cafe-wall',wall.target).ok,false);
  assert.equal(progress(pack,state).complete,false);
});
test('campaign can be completed and missions triggered only for assembled buildings', () => {
  let state = blankSession(pack);
  assert.equal(completeMission(pack,state,'visit-cafe').ok,false);
  for (const piece of pack.pieces) {
    const result = tryPlace(pack,state,piece.id,piece.target);
    assert.equal(result.ok,true);
    state = result.session;
  }
  assert.equal(progress(pack,state).complete,true);
  for (const mission of pack.missions) {
    const result = completeMission(pack,state,mission.id);
    assert.equal(result.ok,true);
    state = result.session;
  }
  assert.equal(progress(pack,state).missions,3);
  assert.equal(completeMission(pack,state,'visit-cafe').ok,false);
  assert.equal(nextUnplaced(pack,state),null);
});
test('restore rejects foreign packs, bogus IDs, and missions for unfinished buildings', () => {
  const foreign = restoreSession(pack,{version:1,packId:'other',placed:['cafe-foundation']});
  assert.deepEqual(foreign,blankSession(pack));
  const restored = restoreSession(pack,{version:1,packId:pack.metadata.id,
    placed:['cafe-foundation','cafe-foundation','invalid'],
    missions:['visit-cafe','visit-garden','unknown']});
  assert.deepEqual(restored.placed,['cafe-foundation']);
  assert.deepEqual(restored.missions,[]);
});
