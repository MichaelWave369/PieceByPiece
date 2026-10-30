import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validatePack} from '../scripts/validate-community.mjs';
import {blankSession,tryPlace,completeMission,progress} from '../src/core/puzzle.mjs';
import {blankCitySystems,toggleSystemNode} from '../src/core/city-systems.mjs';
import {readFirstDistrictStatus,restoredFirstDistrict,readHarborStatus,FIRST_SAVE_KEY,FIRST_SYSTEMS_SAVE_KEY,HARBOR_SAVE_KEY} from '../src/core/campaign.mjs';

const read=(f)=>JSON.parse(readFileSync(new URL(f,import.meta.url),'utf8'));
const first=read('../game/campaign/the-living-block.json');
const systemsDef=read('../game/campaign/living-block-systems.json');
const harbor=read('../game/campaign/tidesreach-first-dock.json');
const storage=(records={})=>({getItem:k=>records[k]??null});
function finish(pack) {
 let s=blankSession(pack);
 for(const p of pack.pieces)s=tryPlace(pack,s,p.id,p.target).session;
 for(const m of pack.missions)s=completeMission(pack,s,m.id).session;
 return s;
}
test('Tidesreach is a fully valid, self-contained city pack',()=>{
 assert.deepEqual(validatePack(harbor),[]);
 assert.equal(harbor.buildings.length,3);
 assert.equal(harbor.pieces.length,12);
 assert.equal(harbor.missions.length,3);
});
test('Tidesreach can be assembled and all its missions solved through canonical rules',()=>{
 const s=finish(harbor);
 assert.equal(progress(harbor,s).complete,true);
 assert.equal(s.missions.length,3);
});
test('the first district does not grant harbor access for pieces alone',()=>{
 const s=blankSession(first);
 let built=s;
 for(const p of first.pieces)built=tryPlace(first,built,p.id,p.target).session;
 assert.equal(restoredFirstDistrict(first,systemsDef,built,blankCitySystems(first)),false);
});
test('only story plus restored Lantern Grid opens campaign chapter two',()=>{
 const s=finish(first);
 let electrical=blankCitySystems(first);
 for(const id of ['cafe-power','house-relay','garden-relay']){
  const next=toggleSystemNode(first,systemsDef,s,electrical,id);
  assert.equal(next.ok,true); electrical=next.state;
 }
 assert.equal(restoredFirstDistrict(first,systemsDef,s,electrical),true);
 const store=storage({[FIRST_SAVE_KEY]:JSON.stringify(s),[FIRST_SYSTEMS_SAVE_KEY]:JSON.stringify(electrical)});
 assert.equal(readFirstDistrictStatus(store,first,systemsDef).restored,true);
});
test('old/malformed local saves cannot masquerade as a completed district',()=>{
 assert.equal(readFirstDistrictStatus(storage(),first,systemsDef).restored,false);
 assert.equal(readFirstDistrictStatus(storage({[FIRST_SAVE_KEY]:'broken'}),first,systemsDef).restored,false);
});
test('harbor saves have independent namespaced progress and no effect on old district',()=>{
 const session=finish(harbor),store=storage({[HARBOR_SAVE_KEY]:JSON.stringify(session)});
 assert.equal(readHarborStatus(store,harbor).complete,true);
 assert.equal(readFirstDistrictStatus(store,first,systemsDef).restored,false);
});
