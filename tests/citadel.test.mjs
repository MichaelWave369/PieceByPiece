import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validatePack} from '../scripts/validate-community.mjs';
import {blankSession,tryPlace,completeMission,progress} from '../src/core/puzzle.mjs';
import {CITADEL_ALLIES,speakCitadelAlly,nextCitadelTask} from '../src/core/citadel-story.mjs';
import {CHARTER_KEYS,blankCharter,restoreCharter,charterReady,charterStatus,setCharterControl} from '../src/core/citadel-charter.mjs';
import {citadelAnchor,citadelMove,citadelTeleport,citadelWalkable} from '../src/core/citadel-nav.mjs';
import {readCitadelAccess,readCitadelStatus,IRON_SAVE_KEY,IRON_RAIL_SAVE_KEY,CITADEL_SAVE_KEY,CITADEL_CHARTER_KEY} from '../src/core/campaign.mjs';
import {blankRail,setRailRoute} from '../src/core/rail-routing.mjs';
const load=path=>JSON.parse(readFileSync(new URL(path,import.meta.url),'utf8'));
const iron=load('../game/campaign/ironhaven-commons-rail.json');
const citadel=load('../game/campaign/citadel-common-ground.json');
const store=(raw={})=>({getItem:k=>raw[k]??null});
function built(pack){
 return pack.pieces.reduce((state,p)=>{
  const r=tryPlace(pack,state,p.id,p.target);
  assert.equal(r.ok,true,p.id);
  return r.session;
 },blankSession(pack));
}
function finished(pack) {
 let s=built(pack);
 for(const m of pack.missions){
  const r=completeMission(pack,s,m.id);assert.equal(r.ok,true,m.id);s=r.session;
 }
 return s;
}
test('Citadel is a strict twelve-piece, three-building fifth-city pack',()=>{
 assert.deepEqual(validatePack(citadel),[]);
 assert.equal(citadel.pieces.length,12);
 assert.equal(citadel.buildings.length,3);
 assert.equal(citadel.missions.length,3);
 assert.equal(progress(citadel,built(citadel)).complete,true);
});
test('finale access requires authentic restored Ironhaven railway, not just building',()=>{
 const s=finished(iron);
 assert.equal(readCitadelAccess(store({[IRON_SAVE_KEY]:JSON.stringify(s)}),iron).unlocked,false);
 let rail=blankRail(iron);
 for(const id of ['yard','forge','commons']){
  const r=setRailRoute(iron,s,rail,id,'commons');
  assert.equal(r.ok,true);rail=r.state;
 }
 assert.equal(readCitadelAccess(store({[IRON_SAVE_KEY]:JSON.stringify(s),[IRON_RAIL_SAVE_KEY]:JSON.stringify(rail)}),iron).unlocked,true);
});
test('nonviolent final three allies must be helped in order',()=>{
 let session=built(citadel);
 assert.equal(speakCitadelAlly(citadel,session,'imi').changed,false);
 assert.match(nextCitadelTask(session),/Ren/);
 for(const ally of CITADEL_ALLIES){
  const r=speakCitadelAlly(citadel,session,ally.id);
  assert.equal(r.changed,true);
  session=r.session;
 }
 assert.equal(progress(citadel,session).missions,3);
 assert.match(nextCitadelTask(session),/PUBLIC/);
});
test('charter safeguards require real mission and building pieces',()=>{
 const s=built(citadel),charter=blankCharter(citadel);
 assert.equal(setCharterControl(citadel,s,charter,'knowledge','public').ok,false);
 const done=finished(citadel);
 assert.equal(CHARTER_KEYS.every(k=>charterReady(citadel,done,k)),true);
 assert.equal(setCharterControl(citadel,done,charter,'unknown','public').ok,false);
 assert.equal(setCharterControl(citadel,done,charter,'knowledge','evil').ok,false);
});
test('final charter requires all three public decisions; latch prevents trapping',()=>{
 const s=finished(citadel);let charter=blankCharter(citadel);
 for(const id of ['knowledge','connection']){
  const r=setCharterControl(citadel,s,charter,id,'public');
  assert.equal(r.ok,true);charter=r.state;
 }
 assert.equal(charterStatus(citadel,s,charter).ratified,false);
 const last=setCharterControl(citadel,s,charter,'consent','public');
 assert.equal(last.ok,true);assert.equal(last.status.ratified,true);
 charter=last.state;
 const back=setCharterControl(citadel,s,charter,'knowledge','closed');
 assert.equal(back.status.ratified,true);
 assert.equal(back.status.allPublic,false);
});
test('final save does not alias any prior district and validates the charter',()=>{
 assert.notEqual(CITADEL_SAVE_KEY,IRON_SAVE_KEY);
 assert.notEqual(CITADEL_CHARTER_KEY,IRON_RAIL_SAVE_KEY);
 const s=finished(citadel), raw={version:1,packId:citadel.metadata.id,controls:{knowledge:'public',connection:'bogus',consent:'public',hacker:'public'},ratified:true};
 const sanitized=restoreCharter(citadel,raw);
 assert.deepEqual(Object.keys(sanitized.controls),['knowledge','connection','consent']);
 assert.equal(sanitized.controls.connection,'closed');
 assert.deepEqual(restoreCharter(citadel,{...raw,version:999}),blankCharter(citadel));
 const final=readCitadelStatus(store({[CITADEL_SAVE_KEY]:JSON.stringify(s),[CITADEL_CHARTER_KEY]:JSON.stringify(sanitized)}),citadel);
 assert.equal(final.complete,true);
 assert.equal(readCitadelStatus(store({[CITADEL_SAVE_KEY]:JSON.stringify(s)}),citadel).complete,false);
});
test('the public forum is bounded before and walkable after finale, including VR',()=>{
 const s=finished(citadel);
 assert.equal(citadelTeleport(citadel,s,{x:0,z:5.3},false),false);
 assert.equal(citadelTeleport(citadel,s,{x:0,z:5.3},true),true);
 const before=citadelMove(citadel,s,{x:0,z:1.8},{x:0,z:3},false);
 assert.ok(before.z<=2.6);
 const after=citadelMove(citadel,s,{x:0,z:1.8},{x:0,z:3},true);
 assert.ok(after.z>4.2);
 const anchor=citadelAnchor(citadel,'archive');
 assert.equal(citadelWalkable(citadel,s,anchor.x,anchor.z,true),false);
 assert.equal(citadelWalkable(citadel,s,NaN,0,true),false);
});
