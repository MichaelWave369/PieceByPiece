import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { blankSession, tryPlace, restoreSession } from '../src/core/puzzle.mjs';
import { NEIGHBORS, talkToNeighbor, nextErrand, carrying } from '../src/core/neighborhood.mjs';
import { anchorOf, walkable, moveWalkable, canTeleport } from '../src/core/navigation.mjs';

const pack=JSON.parse(readFileSync(new URL('../game/campaign/the-living-block.json',import.meta.url),'utf8'));
const assembled=()=>pack.pieces.reduce((s,p)=>{
  const result=tryPlace(pack,s,p.id,p.target);
  assert.equal(result.ok,true); return result.session;
},blankSession(pack));

test('neighbors have stable and unique story identities',()=>{
  assert.deepEqual(NEIGHBORS.map(n=>n.id),['celia','jules','moss']);
  assert.equal(new Set(NEIGHBORS.map(n=>n.missionId)).size,3);
});
test('talking before a building is complete cannot skip puzzles',()=>{
  const s=blankSession(pack), result=talkToNeighbor(pack,s,'celia');
  assert.equal(result.changed,false);
  assert.equal(result.session,s);
});
test('the errand chain is deterministic, ordered, replayable, and save-safe',()=>{
  let s=assembled();
  assert.match(nextErrand(s),/Celia/);
  assert.match(carrying(s),/Nothing/);
  const early=talkToNeighbor(pack,s,'moss');
  assert.equal(early.changed,false);
  assert.equal(early.session,s);
  const first=talkToNeighbor(pack,s,'celia');
  assert.equal(first.changed,true);s=first.session;
  assert.match(carrying(s),/parcel/);
  assert.equal(talkToNeighbor(pack,s,'celia').changed,false);
  const second=talkToNeighbor(pack,s,'jules');
  assert.equal(second.changed,true);s=second.session;
  assert.match(carrying(s),/seeds/);
  const third=talkToNeighbor(pack,s,'moss');
  assert.equal(third.changed,true);
  assert.equal(third.completedAll,true);
  s=restoreSession(pack,JSON.parse(JSON.stringify(third.session)));
  assert.equal(s.missions.length,3);
  assert.match(nextErrand(s),/restored/);
  assert.equal(talkToNeighbor(pack,s,'moss').changed,false);
});
test('walkable city respects completed buildings and boundaries',()=>{
  const s=assembled();
  const center=anchorOf(pack,'cafe');
  assert.equal(walkable(pack,s,center.x,center.z),false);
  assert.equal(canTeleport(pack,s,center),false);
  assert.equal(walkable(pack,s,0,5.3),true);
  assert.equal(walkable(pack,s,99,0),false);
  assert.equal(walkable(pack,s,NaN,0),false);
});
test('movement slides safely and does not tunnel through the house',()=>{
  const s=assembled();
  const center=anchorOf(pack,'home');
  const start={x:center.x-2.3,z:center.z};
  const end=moveWalkable(pack,s,start,{x:4.6,z:0});
  assert.ok(end.x<center.x, 'solid building stops forward movement');
  const room=moveWalkable(pack,s,{x:0,z:0},{x:99,z:99},'cafe');
  assert.ok(room.x<=2.21 && room.z<=2.36);
});
