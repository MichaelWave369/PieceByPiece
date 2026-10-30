import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {checkCatalogue,catalogueEntry,findCatalogueEntries,verifyReviewedPack,validateLocalPackBytes,communitySaveKey,CATALOGUE_FORMAT} from '../src/core/community-catalogue.mjs';
import {blankSession,tryPlace,completeMission,progress,restoreSession} from '../src/core/puzzle.mjs';
import {validatePack} from '../src/core/community-validator.mjs';

const raw=readFileSync(new URL('../community/packs/lantern-lane.json',import.meta.url));
const pack=JSON.parse(raw.toString('utf8'));
const checksum=createHash('sha256').update(raw).digest('hex');
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const item={
 id:pack.metadata.id,title:pack.metadata.title,creator:pack.metadata.creator,
 description:pack.metadata.description,theme:pack.city.theme,
 difficulty:pack.metadata.difficulty,estimatedMinutes:pack.metadata.estimatedMinutes,
 license:pack.rights.license,buildings:pack.buildings.length,pieces:pack.pieces.length,
 missions:pack.missions.length,tags:pack.metadata.tags,
 file:'community/packs/'+pack.metadata.id+'.json',
 bytes:raw.byteLength,sha256:checksum
};
const manifest={format:CATALOGUE_FORMAT,generatedFrom:'reviewed-repository-packs',entries:[item]};
test('Reviewed example has safe, known, stable SHA-256 and strict schema',()=>{
 assert.deepEqual(validatePack(pack),[]);
 assert.equal(checkCatalogue(manifest).entries.length,1);
 assert.equal(catalogueEntry(manifest,'lantern-lane').sha256,checksum);
 assert.equal(catalogueEntry(manifest,'../../secrets'),null);
});
test('Catalogue rejects duplicate IDs, foreign paths and unknown fields',()=>{
 assert.throws(()=>checkCatalogue({...manifest,entries:[item,item]}),/duplicate/);
 assert.throws(()=>checkCatalogue({...manifest,entries:[{...item,file:'https://evil.test/file'}]}),/Invalid/);
 assert.throws(()=>checkCatalogue({...manifest,entries:[{...item,script:'surprise'}]}),/Invalid/);
 assert.throws(()=>checkCatalogue({...manifest,format:'anything-else'}),/Invalid/);
});
test('Faceted search is deterministic over reviewed manifest, never arbitrary URLs',()=>{
 assert.deepEqual(findCatalogueEntries(manifest,{theme:'village',search:'lantern'}).map(e=>e.id),['lantern-lane']);
 assert.equal(findCatalogueEntries(manifest,{theme:'garden'}).length,0);
 assert.equal(findCatalogueEntries(manifest,{search:'example architect'}).length,1);
});
test('Player checks exact bytes, hash, metadata and schema before rendering',async()=>{
 const imported=await verifyReviewedPack(item,new Uint8Array(raw),digest);
 assert.deepEqual(imported,pack);
 const changed=Buffer.from(raw);
 changed[changed.length-2]=0x20;
 await assert.rejects(verifyReviewedPack(item,changed,digest),/checksum mismatch/);
 await assert.rejects(verifyReviewedPack({...item,sha256:'0'.repeat(64)},raw,digest),/checksum mismatch/);
 await assert.rejects(verifyReviewedPack({...item,title:'Another city'},raw,digest),/metadata|contents/);
 await assert.rejects(verifyReviewedPack({...item,bytes:item.bytes+1},raw,digest),/size mismatch/);
});
test('Local file player accepts valid city but refuses code fields, bad JSON and 64-KiB excess',()=>{
 assert.equal(validateLocalPackBytes(raw).metadata.id,pack.metadata.id);
 assert.throws(()=>validateLocalPackBytes(Buffer.from('{')),/valid UTF-8 JSON/);
 const poisoned={...pack,script:'alert(1)'};
 assert.throws(()=>validateLocalPackBytes(Buffer.from(JSON.stringify(poisoned))),/unknown field/);
 assert.throws(()=>validateLocalPackBytes(Buffer.alloc(65537,65)),/64 KiB/);
});
test('Saved community sessions are revision-scoped and never campaign keys',()=>{
 const first=communitySaveKey(pack,checksum);
 const other=communitySaveKey(pack,'a'.repeat(64));
 assert.notEqual(first,other);
 assert.match(first,/commons:play/);
 assert.doesNotMatch(first,/campaign:/);
 assert.throws(()=>communitySaveKey(pack,'../../bad'),/revision/);
 let s=blankSession(pack);
 for(const p of pack.pieces){
  const r=tryPlace(pack,s,p.id,p.target);assert.equal(r.ok,true);s=r.session;
 }
 for(const mission of pack.missions){
  const r=completeMission(pack,s,mission.id);assert.equal(r.ok,true);s=r.session;
 }
 assert.equal(progress(pack,s).complete,true);
 assert.equal(progress(pack,s).missions,pack.missions.length);
 assert.deepEqual(restoreSession(pack,s),s);
});
test('Source-only catalogue generator verifies every reviewed repository pack',()=>{
 const result=spawnSync(process.execPath,['scripts/build-community-catalogue.mjs','--verify'],{
  cwd:process.cwd(),encoding:'utf8'});
 assert.equal(result.status,0,result.stdout+'\n'+result.stderr);
 assert.match(result.stdout,/reviewed community pack/);
});
