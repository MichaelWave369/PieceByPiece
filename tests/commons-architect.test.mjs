import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validatePack,MAX_PACK_BYTES,validatePackBytes} from '../src/core/community-validator.mjs';
import {blankSession,tryPlace,completeMission,progress} from '../src/core/puzzle.mjs';
import {newCommonsPack,safeDraft,slug,draftErrors,editCommonsPack,importCommonsPack,exportCommonsPack,
 newTestRun,testReceipt,COMMONS_DRAFT_KEY} from '../src/core/commons-architect.mjs';
const lantern=JSON.parse(readFileSync(new URL('../community/packs/lantern-lane.json',import.meta.url),'utf8'));

test('The same browser-safe validator accepts the curated community example',()=>{
 assert.deepEqual(validatePack(lantern),[]);
 assert.deepEqual(validatePackBytes(JSON.stringify(lantern)),[]);
});
test('New offline draft is structurally safe but license consent is not assumed',()=>{
 const pack=newCommonsPack();
 assert.deepEqual(draftErrors(pack),[]);
 assert.equal(pack.rights.confirmed,false);
 assert.ok(validatePack(pack).some(x=>x.includes('fixed value')));
 assert.match(COMMONS_DRAFT_KEY,/commons/);
});
test('Names are bounded, sanitized into stable legal slugs and never treated as code',()=>{
 assert.equal(slug(' Community Library! '),'community-library');
 assert.equal(slug('///'),'city');
 const draft=newCommonsPack();
 const named=editCommonsPack(draft,{type:'metadata',field:'title',value:'A garden made together'});
 assert.equal(named.metadata.id,'a-garden-made-together');
 assert.equal(draft.metadata.title,'My First Commons');
 const hostile=editCommonsPack(named,{type:'metadata',field:'description',value:'<img src=x onerror=alert(1)>'});
 assert.ok(validatePack({...hostile,rights:{...hostile.rights,confirmed:true}}).length===0);
 assert.equal(hostile.metadata.description,'<img src=x onerror=alert(1)>');
});
test('Adding buildings always creates a proper unique foundation and safe tile',()=>{
 const a=newCommonsPack();
 const b=editCommonsPack(a,{type:'addBuilding',name:'Gathering Place'});
 assert.equal(b.buildings.length,2);
 assert.equal(b.buildings[1].id,'gathering-place-2');
 assert.equal(b.pieces.length,4);
 assert.equal(draftErrors(b).length,0);
 assert.equal(a.pieces.length,3);
 const c=editCommonsPack(b,{type:'removeBuilding',id:'gathering-place-2'});
 assert.equal(c.buildings.length,1);
 assert.equal(c.pieces.length,3);
});
test('3D targets are finite integer slots and cannot overlap or leave bounds',()=>{
 const a=newCommonsPack();
 assert.throws(()=>editCommonsPack(a,{type:'addPiece',buildingId:'gathering-place',prefab:'tower',target:{x:4,y:4,z:0,rotation:0}}),/overlaps/);
 assert.throws(()=>editCommonsPack(a,{type:'addPiece',buildingId:'gathering-place',prefab:'tower',target:{x:70,y:4,z:0,rotation:0}}),/off the city grid|above maximum/);
 assert.throws(()=>editCommonsPack(a,{type:'addPiece',buildingId:'gathering-place',prefab:'script',target:{x:2,y:4,z:0,rotation:0}}),/Unknown prefab/);
 assert.throws(()=>editCommonsPack(a,{type:'addPiece',buildingId:'gathering-place',prefab:'wall',target:{x:2.5,y:4,z:0,rotation:0}}),/integer tile/);
 const b=editCommonsPack(a,{type:'addPiece',buildingId:'gathering-place',prefab:'tower',target:{x:2,y:4,z:0,rotation:90}});
 assert.equal(b.pieces.at(-1).target.rotation,90);
 assert.deepEqual(draftErrors(b),[]);
 assert.throws(()=>editCommonsPack(b,{type:'changePiece',id:b.pieces.at(-1).id,target:{x:4,y:4,z:0,rotation:90}}),/overlaps/);
});
test('Mission definition remains declarative and references a real building',()=>{
 const a=newCommonsPack();
 const b=editCommonsPack(a,{type:'addMission',title:'Say hello to the gardeners',buildingId:'gathering-place'});
 assert.equal(b.missions.at(-1).kind,'visit-building');
 assert.equal(draftErrors(b).length,0);
 assert.throws(()=>editCommonsPack(b,{type:'addMission',title:'Unknown neighbor',buildingId:'outside'}),/real building/);
});
test('Import rejects unknown fields, executable content and oversized packs',()=>{
 const raw=JSON.stringify(lantern);
 assert.equal(importCommonsPack(raw).rights.confirmed,false);
 assert.throws(()=>importCommonsPack(JSON.stringify({...lantern,script:'alert(1)'})),/unknown field/);
 assert.throws(()=>importCommonsPack(JSON.stringify({...lantern,pieces:[...lantern.pieces,{...lantern.pieces[0],id:'bad-duplicate'}]})),/overlaps/);
 assert.throws(()=>importCommonsPack('x'.repeat(MAX_PACK_BYTES+1)),/64 KiB/);
 assert.throws(()=>importCommonsPack('{'),/not valid JSON/);
 const poisoned=JSON.parse(raw);poisoned.metadata.title='<svg onload=alert(1)>';
 assert.equal(importCommonsPack(JSON.stringify(poisoned)).metadata.title,'<svg onload=alert(1)>');
});
test('Export cannot bypass creator affirmation or canonical complete replay',()=>{
 let pack=newCommonsPack();
 assert.throws(()=>exportCommonsPack(pack,null),/validation/);
 pack=editCommonsPack(pack,{type:'affirm',value:true});
 assert.throws(()=>exportCommonsPack(pack,null),/playtest/);
 const run=newTestRun(pack);
 const partial=tryPlace(pack,run.session,pack.pieces[0].id,pack.pieces[0].target).session;
 assert.equal(testReceipt(pack,{...run,session:partial}),null);
 let full=blankSession(pack);
 for(const piece of pack.pieces)full=tryPlace(pack,full,piece.id,piece.target).session;
 assert.equal(progress(pack,full).complete,true);
 assert.equal(testReceipt(pack,{...run,session:full}),null,'all missions also required');
 for(const m of pack.missions)full=completeMission(pack,full,m.id).session;
 const receipt=testReceipt(pack,{...run,session:full});
 assert.equal(receipt.complete,true);
 const json=exportCommonsPack(pack,receipt);
 assert.deepEqual(JSON.parse(json),pack);
 assert.ok(new TextEncoder().encode(json).byteLength<=MAX_PACK_BYTES);
 const edited=editCommonsPack(pack,{type:'addPiece',buildingId:'gathering-place',prefab:'lamp',target:{x:2,y:2,z:0,rotation:0}});
 assert.throws(()=>exportCommonsPack(edited,receipt),/playtest/);
});
test('File import and export roundtrip preserves exact community content',()=>{
 let a=newCommonsPack();
 a=editCommonsPack(a,{type:'affirm',value:true});
 let s=blankSession(a);
 for(const p of a.pieces)s=tryPlace(a,s,p.id,p.target).session;
 for(const m of a.missions)s=completeMission(a,s,m.id).session;
 const receipt=testReceipt(a,{...newTestRun(a),session:s});
 const exported=exportCommonsPack(a,receipt);
 const imported=importCommonsPack(exported);
 assert.deepEqual({...imported,rights:{...imported.rights,confirmed:true}},a);
 assert.deepEqual(draftErrors(imported),[]);
 assert.equal(imported.rights.confirmed,false,'importer must reaffirm rights');
});
test('Malformed restored drafts fail closed',()=>{
 assert.throws(()=>safeDraft({script:'run'}),/rights/);
 assert.throws(()=>safeDraft({...newCommonsPack(),pieces:[]}),/few items/);
});
