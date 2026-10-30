import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validatePack} from '../scripts/validate-community.mjs';
import {blankSession,tryPlace,completeMission,progress,restoreSession} from '../src/core/puzzle.mjs';
import {readGardenAccess,readGardenStatus,HARBOR_SAVE_KEY,GARDEN_SAVE_KEY} from '../src/core/campaign.mjs';
import {interactGardener,nextGardenTask} from '../src/core/verdantia.mjs';
import {gardenWalkable,gardenMove,gardenTeleport,elevationAt,skywalkOpen,SKY_HEIGHT,gardenAnchor} from '../src/core/garden-nav.mjs';

const load=file=>JSON.parse(readFileSync(new URL(file,import.meta.url),'utf8'));
const harbor=load('../game/campaign/tidesreach-first-dock.json');
const garden=load('../game/campaign/verdantia-skygarden.json');
const storage=values=>({getItem:key=>(values?.[key]??null)});
function build(pack) {
 return pack.pieces.reduce((s,p)=>{
  const result=tryPlace(pack,s,p.id,p.target);
  assert.equal(result.ok,true,p.id);
  return result.session;
 },blankSession(pack));
}
function complete(pack) {
 let s=build(pack);
 for(const m of pack.missions){
  const result=completeMission(pack,s,m.id);
  assert.equal(result.ok,true,m.id);
  s=result.session;
 }
 return s;
}
test('Verdantia is validated as the same strict, shared city-pack format',()=>{
 assert.deepEqual(validatePack(garden),[]);
 assert.equal(garden.metadata.id,'verdantia-skygarden');
 assert.equal(garden.city.theme,'garden');
 assert.equal(garden.buildings.length,3);
 assert.equal(garden.pieces.length,12);
});
test('Garden only unlocks from authentic completed Tidesreach missions',()=>{
 assert.equal(readGardenAccess(storage(),harbor).unlocked,false);
 let partial=build(harbor);
 assert.equal(readGardenAccess(storage({[HARBOR_SAVE_KEY]:JSON.stringify(partial)}),harbor).unlocked,false);
 partial=complete(harbor);
 assert.equal(readGardenAccess(storage({[HARBOR_SAVE_KEY]:JSON.stringify(partial)}),harbor).unlocked,true);
});
test('Verdantia has its own independently restored v1 local campaign save',()=>{
 const finished=complete(garden);
 const values={[GARDEN_SAVE_KEY]:JSON.stringify(finished)};
 assert.equal(readGardenStatus(storage(values),garden).complete,true);
 assert.equal(readGardenAccess(storage(values),harbor).unlocked,false);
 assert.deepEqual(restoreSession(garden,finished).missions,finished.missions);
});
test('Gardeners deliver a canonical three-step, no-skip story',()=>{
 let state=build(garden);
 assert.match(nextGardenTask(state),/Pera/);
 assert.equal(interactGardener(garden,state,'vale').changed,false);
 assert.equal(interactGardener(garden,state,'sol').changed,false);
 for(const id of ['pera','sol','vale']){
  const response=interactGardener(garden,state,id);
  assert.equal(response.changed,true,id);
  state=response.session;
 }
 assert.equal(state.missions.length,3);
 assert.equal(skywalkOpen(state),true);
 assert.match(nextGardenTask(state),/Skywalk open/);
 assert.equal(interactGardener(garden,state,'vale').changed,false);
});
test('The north elevated route cannot be visited or teleported into early',()=>{
 const unpowered=build(garden);
 const route={x:0,z:3.5};
 assert.equal(gardenWalkable(garden,unpowered,route.x,route.z),false);
 assert.equal(gardenTeleport(garden,unpowered,route),null);
 assert.equal(elevationAt(unpowered,route.x,route.z),0);
 assert.equal(gardenWalkable(garden,unpowered,0,0),true);
});
test('The raised garden is a genuine traversable height after the final errand',()=>{
 const state=complete(garden);
 assert.equal(gardenWalkable(garden,state,0,3.5),true);
 assert.equal(elevationAt(state,0,3.5),SKY_HEIGHT);
 assert.equal(gardenTeleport(garden,state,{x:0,z:3.5}).height,SKY_HEIGHT);
 assert.equal(gardenTeleport(garden,state,{x:0,z:1.4}).height>0,true);
 const from={x:0,z:.5};
 const moved=gardenMove(garden,state,from,{x:0,z:3.2});
 assert.ok(moved.z>3.5);
 assert.equal(moved.height,SKY_HEIGHT);
});
test('Verdantia still respects walls, spatial boundaries, and malformed inputs',()=>{
 const state=complete(garden);
 const anchor=gardenAnchor(garden,'seedhouse');
 assert.equal(gardenWalkable(garden,state,anchor.x,anchor.z),false);
 assert.equal(gardenWalkable(garden,state,999,0),false);
 assert.equal(gardenWalkable(garden,state,NaN,1),false);
 const moving=gardenMove(garden,state,{x:0,z:0},{x:Infinity,z:0});
 assert.deepEqual(moving,{x:0,z:0});
 assert.equal(gardenTeleport(garden,state,{x:999,z:0}),null);
});
