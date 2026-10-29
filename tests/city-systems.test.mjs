import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { blankSession,tryPlace,completeMission } from '../src/core/puzzle.mjs';
import { blankCitySystems,restoreCitySystems,validateSystemDefinition,circuitStatus,toggleSystemNode } from '../src/core/city-systems.mjs';

const pack=JSON.parse(readFileSync(new URL('../game/campaign/the-living-block.json',import.meta.url),'utf8'));
const def=JSON.parse(readFileSync(new URL('../game/campaign/living-block-systems.json',import.meta.url),'utf8'));
function assembled(){
  let s=blankSession(pack);
  for(const piece of pack.pieces)s=tryPlace(pack,s,piece.id,piece.target).session;
  return s;
}
function completedStory(){
  let s=assembled();
  for(const mission of pack.missions)s=completeMission(pack,s,mission.id).session;
  return s;
}
test('curated circuit references canonical piece, building and quest IDs',()=>{
  assert.deepEqual(validateSystemDefinition(pack,def),[]);
  assert.equal(def.nodes.length,5);
  assert.equal(def.edges.length,4);
});
test('no energy before constructing buildings or completing errands',()=>{
  const raw=blankSession(pack), system=blankCitySystems(pack);
  assert.equal(toggleSystemNode(pack,def,raw,system,'cafe-power').ok,false);
  assert.equal(circuitStatus(pack,def,raw,system).gateOpen,false);
  const built=assembled();
  assert.equal(toggleSystemNode(pack,def,built,system,'cafe-power').ok,false);
});
test('relay switches depend on canonical neighbor story progress',()=>{
  let s=assembled();
  const old=blankCitySystems(pack);
  s=completeMission(pack,s,'visit-cafe').session;
  const power=toggleSystemNode(pack,def,s,old,'cafe-power');
  assert.equal(power.ok,true);
  assert.equal(toggleSystemNode(pack,def,s,power.state,'house-relay').ok,false);
  assert.deepEqual(power.status.powered,['cafe-power']);
});
test('switches conduct energy, activate lights, and permanently unlock the gate',()=>{
  const s=completedStory();
  let sys=blankCitySystems(pack);
  for(const id of ['cafe-power','house-relay','garden-relay']){
    const r=toggleSystemNode(pack,def,s,sys,id);
    assert.equal(r.ok,true);
    sys=r.state;
  }
  const powered=circuitStatus(pack,def,s,sys);
  assert.equal(powered.activeSwitches,3);
  assert.equal(powered.gateOpen,true);
  assert.equal(powered.lampsOn,true);
  assert.equal(powered.powered.length,5);
  const off=toggleSystemNode(pack,def,s,sys,'cafe-power');
  assert.equal(off.ok,true);
  assert.equal(off.status.lampsOn,false);
  assert.equal(off.status.gateOpen,true, 'the reward cannot trap an explorer');
  assert.equal(off.state.overlookUnlocked,true);
});
test('local save restores only allowed toggles and versioned gate reward',()=>{
  const old={version:1,packId:pack.metadata.id,enabled:['house-relay','house-relay','bad-id',9],overlookUnlocked:true};
  const restored=restoreCitySystems(pack,def,old);
  assert.deepEqual(restored.enabled,['house-relay']);
  assert.equal(restored.overlookUnlocked,true);
  assert.deepEqual(restoreCitySystems(pack,def,{version:999,...old,version:999}),blankCitySystems(pack));
});
test('unknown controls and malformed authored edges are rejected',()=>{
  const s=completedStory(), sys=blankCitySystems(pack);
  assert.equal(toggleSystemNode(pack,def,s,sys,'lanterns').ok,false);
  assert.equal(toggleSystemNode(pack,def,s,sys,'__proto__').ok,false);
  const broken=structuredClone(def);broken.edges[0].requiresPiece='fake-piece';
  assert.match(validateSystemDefinition(pack,broken).join(' '),/Unknown edge piece/);
});
test('unplaced road breaks the route even if switches are enabled in a forged save',()=>{
  const s=completedStory();
  s.placed=s.placed.filter(x=>x!=='garden-lamp');
  const sys=restoreCitySystems(pack,def,{version:1,packId:pack.metadata.id,enabled:['cafe-power','house-relay','garden-relay']});
  const status=circuitStatus(pack,def,s,sys);
  assert.equal(status.gateOpen,false);
  assert.equal(status.lampsOn,false);
  assert.equal(status.powered.includes('garden-relay'),false);
});
