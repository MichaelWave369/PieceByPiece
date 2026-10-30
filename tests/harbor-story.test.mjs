import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {blankSession,tryPlace} from '../src/core/puzzle.mjs';
import {interactKeeper,nextHarborTask} from '../src/core/tidesreach.mjs';
import {harborAnchor,harborWalkable,harborMove} from '../src/core/harbor-nav.mjs';
const pack=JSON.parse(readFileSync(new URL('../game/campaign/tidesreach-first-dock.json',import.meta.url),'utf8'));
function assembled(){
 let s=blankSession(pack);
 for(const p of pack.pieces)s=tryPlace(pack,s,p.id,p.target).session;
 return s;
}
test('coastal errands follow the actual lighthouse > tea > ferry chain',()=>{
 let s=assembled();
 const tooSoon=interactKeeper(pack,s,'finch');
 assert.equal(tooSoon.changed,false);
 assert.equal(tooSoon.session,s);
 assert.match(nextHarborTask(s),/Ida/);
 for(const id of ['ida','rowan','finch']){
  const result=interactKeeper(pack,s,id);
  assert.equal(result.changed,true);
  s=result.session;
 }
 assert.equal(s.missions.length,3);
 assert.match(nextHarborTask(s),/ferry is running/);
 assert.equal(interactKeeper(pack,s,'ida').changed,false);
});
test('unbuilt lighthouse does not allow mission completion',()=>{
 const s=blankSession(pack);
 assert.equal(interactKeeper(pack,s,'ida').changed,false);
});
test('shoreline is blocked before ferry launch, restored after story',()=>{
 let s=assembled();
 assert.equal(harborWalkable(pack,s,0,5.5),false);
 assert.equal(harborWalkable(pack,s,0,0),true);
 const before=harborMove(pack,s,{x:0,z:4.2},{x:0,z:2.0});
 assert.ok(before.z<=4.7);
 for(const id of ['ida','rowan','finch'])s=interactKeeper(pack,s,id).session;
 assert.equal(harborWalkable(pack,s,0,5.5),true);
 assert.equal(harborWalkable(pack,s,999,0),false);
 const anchor=harborAnchor(pack,'teahouse');
 assert.equal(harborWalkable(pack,s,anchor.x,anchor.z),false);
});
