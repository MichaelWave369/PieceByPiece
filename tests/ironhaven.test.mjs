import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validatePack} from '../scripts/validate-community.mjs';
import {blankSession,tryPlace,completeMission,progress} from '../src/core/puzzle.mjs';
import {IRONHAVEN_CREW,speakIronCrew,nextIronTask} from '../src/core/ironhaven.mjs';
import {RAIL_JUNCTIONS,blankRail,restoreRail,junctionReady,railStatus,setRailRoute} from '../src/core/rail-routing.mjs';
import {ironAnchor,ironMove,ironTeleport,ironWalkable} from '../src/core/iron-nav.mjs';
import {IRON_SAVE_KEY,IRON_RAIL_SAVE_KEY,readIronAccess,readIronStatus} from '../src/core/campaign.mjs';
const read=path=>JSON.parse(readFileSync(new URL(path,import.meta.url),'utf8'));
const garden=read('../game/campaign/verdantia-skygarden.json');
const pack=read('../game/campaign/ironhaven-commons-rail.json');
const store=(data={})=>({getItem:key=>data[key]??null});
function built(p){
 return p.pieces.reduce((s,piece)=>{
  const result=tryPlace(p,s,piece.id,piece.target);
  assert.equal(result.ok,true,piece.id);
  return result.session;
 },blankSession(p));
}
function complete(p){
 let s=built(p);
 for(const m of p.missions){const result=completeMission(p,s,m.id);assert.equal(result.ok,true);s=result.session;}
 return s;
}
test('Ironhaven obeys unchanged strict city pack format',()=>{
 assert.deepEqual(validatePack(pack),[]);
 assert.equal(pack.pieces.length,12);
 assert.equal(pack.buildings.length,3);
});
test('Ironhaven requires the complete Verdantia storyline and not just construction',()=>{
 assert.equal(readIronAccess(store(),garden).unlocked,false);
 assert.equal(readIronAccess(store({['piece-by-piece:campaign:verdantia-skygarden:v1']:JSON.stringify(built(garden))}),garden).unlocked,false);
 assert.equal(readIronAccess(store({['piece-by-piece:campaign:verdantia-skygarden:v1']:JSON.stringify(complete(garden))}),garden).unlocked,true);
});
test('Three crew missions cannot be bypassed out of order',()=>{
 let s=built(pack);
 assert.match(nextIronTask(s),/Rook/);
 assert.equal(speakIronCrew(pack,s,'jun').changed,false);
 for(const person of IRONHAVEN_CREW){
  const r=speakIronCrew(pack,s,person.id);assert.equal(r.changed,true);
  s=r.session;
 }
 assert.equal(progress(pack,s).missions,3);
 assert.match(nextIronTask(s),/junctions/);
});
test('Freight junctions depend on exact built piece and mission requirements',()=>{
 const s=built(pack),rail=blankRail(pack);
 assert.equal(setRailRoute(pack,s,rail,'yard','commons').ok,false);
 const done=complete(pack);
 assert.equal(RAIL_JUNCTIONS.every(j=>junctionReady(pack,done,j)),true);
 assert.equal(setRailRoute(pack,done,rail,'unknown','commons').ok,false);
 assert.equal(setRailRoute(pack,done,rail,'yard','wrong').ok,false);
});
test('Commons route requires all three correctly aligned stations',()=>{
 const s=complete(pack);let rail=blankRail(pack);
 assert.equal(railStatus(pack,s,rail).gateOpen,false);
 for(const id of ['yard','forge']){
  const result=setRailRoute(pack,s,rail,id,'commons');assert.equal(result.ok,true);
  rail=result.state;
 }
 assert.equal(railStatus(pack,s,rail).gateOpen,false);
 const finish=setRailRoute(pack,s,rail,'commons','commons');
 assert.equal(finish.ok,true);
 assert.equal(finish.status.gateOpen,true);
 assert.equal(finish.status.connected.length,3);
 rail=finish.state;
 const off=setRailRoute(pack,s,rail,'yard','corporate');
 assert.equal(off.status.gateOpen,true,'delivered commons stays open to avoid trapping player');
 assert.equal(off.status.routeComplete,false,'live path is visibly off');
});
test('Rail save restores only three known route values',()=>{
 const s=complete(pack);
 const raw={version:1,packId:pack.metadata.id,routes:{yard:'commons',forge:'hacked',commons:'commons',extra:'commons'},delivered:true};
 const next=restoreRail(pack,raw);
 assert.deepEqual(Object.keys(next.routes),['yard','forge','commons']);
 assert.equal(next.routes.forge,'corporate');
 assert.equal(railStatus(pack,s,next).gateOpen,true);
 assert.deepEqual(restoreRail(pack,{...raw,version:9}),blankRail(pack));
});
test('Freight yard cannot be visited before publicly aligned rail',()=>{
 const s=complete(pack);
 assert.equal(ironTeleport(pack,s,{x:0,z:4.5},false),false);
 assert.equal(ironTeleport(pack,s,{x:0,z:4.5},true),true);
 const before=ironMove(pack,s,{x:0,z:1.9},{x:0,z:3},false);
 assert.ok(before.z<=2.65);
 const after=ironMove(pack,s,{x:0,z:1.9},{x:0,z:3},true);
 assert.ok(after.z>4);
 const building=ironAnchor(pack,'salvage');
 assert.equal(ironWalkable(pack,s,building.x,building.z,true),false);
});
test('Ironhaven has a separate save namespace and cannot complete from forged construction alone',()=>{
 assert.notEqual(IRON_SAVE_KEY,IRON_RAIL_SAVE_KEY);
 const s=complete(pack);
 const rail=blankRail(pack);
 const p=readIronStatus(store({[IRON_SAVE_KEY]:JSON.stringify(s),[IRON_RAIL_SAVE_KEY]:JSON.stringify(rail)}),pack);
 assert.equal(p.quests,3);
 assert.equal(p.rail.delivered,false);
 assert.equal(p.complete,false);
});
