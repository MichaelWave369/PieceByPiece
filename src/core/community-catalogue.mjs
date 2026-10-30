/**
 * Pure browser/Node catalogue and imported-pack trust boundary.
 * The manifest is navigation metadata, never permission to execute content.
 */
import {validatePack,MAX_PACK_BYTES} from './community-validator.mjs';
export const CATALOGUE_FORMAT='piecebypiece.catalogue.v1';
export const CATALOGUE_CACHE_KEY='piece-by-piece:commons:catalogue:v1';
export const COMMUNITY_SAVE_PREFIX='piece-by-piece:commons:play:v1:';
const identifier=s=>typeof s==='string'&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(s)&&s.length<=64;
const sha=s=>typeof s==='string'&&/^[a-f0-9]{64}$/u.test(s);
export function checkCatalogue(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||
    raw.format!==CATALOGUE_FORMAT||raw.generatedFrom!=='reviewed-repository-packs'||
    !Array.isArray(raw.entries)||raw.entries.length>200)
  throw new Error('Invalid reviewed catalogue');
 const seen=new Set();
 for(const entry of raw.entries){
  if(!entry||typeof entry!=='object'||Array.isArray(entry)||
    Object.keys(entry).sort().join(',')!=='buildings,bytes,creator,description,difficulty,estimatedMinutes,file,id,license,missions,pieces,sha256,tags,theme,title'||
    !identifier(entry.id)||entry.file!=='community/packs/'+entry.id+'.json'||
    !sha(entry.sha256)||!Number.isSafeInteger(entry.bytes)||entry.bytes<2||entry.bytes>MAX_PACK_BYTES||
    !Number.isSafeInteger(entry.pieces)||entry.pieces<3||entry.pieces>128||
    !Number.isSafeInteger(entry.buildings)||entry.buildings<1||entry.buildings>24||
    !Number.isSafeInteger(entry.missions)||entry.missions<0||entry.missions>24||
    !Array.isArray(entry.tags)||entry.tags.length>5||!entry.tags.every(tag=>typeof tag==='string'&&tag.length<=20)||
    !['village','harbor','garden','industrial','neon'].includes(entry.theme)||
    !['calm','gentle','thoughtful','intricate'].includes(entry.difficulty)||
    !['CC0-1.0','CC-BY-4.0'].includes(entry.license)||
    !Number.isInteger(entry.estimatedMinutes)||entry.estimatedMinutes<5||entry.estimatedMinutes>240||
    ![entry.title,entry.creator,entry.description].every(x=>typeof x==='string')||
    entry.title.length>80||entry.creator.length>40||entry.description.length>400||
    seen.has(entry.id))throw new Error('Invalid or duplicate catalogue item');
  seen.add(entry.id);
 }
 return raw;
}
export function catalogueEntry(manifest,id){
 const catalog=checkCatalogue(manifest);
 if(!identifier(id))return null;
 return catalog.entries.find(entry=>entry.id===id)||null;
}
function bytesFrom(input){
 if(input instanceof Uint8Array)return input;
 if(typeof input==='string')return new TextEncoder().encode(input);
 throw new Error('Pack must be a UTF-8 file');
}
function encodeHex(bytes){return [...bytes].map(x=>x.toString(16).padStart(2,'0')).join('');}
export async function verifyReviewedPack(entry,source,digest){
 if(!entry||!identifier(entry.id)||!sha(entry.sha256)||entry.file!=='community/packs/'+entry.id+'.json')
  throw new Error('Invalid catalogue entry path');
 const bytes=bytesFrom(source);
 if(bytes.byteLength!==entry.bytes||bytes.byteLength>MAX_PACK_BYTES)
  throw new Error('Reviewed pack size mismatch');
 const hash=digest?await digest(bytes):
  await crypto.subtle.digest('SHA-256',bytes);
 const observed=typeof hash==='string'?hash:encodeHex(new Uint8Array(hash));
 if(observed!==entry.sha256)throw new Error('Reviewed pack checksum mismatch');
 let pack;
 try{pack=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}
 catch{throw new Error('Invalid UTF-8 reviewed pack JSON');}
 const errors=validatePack(pack);
 if(errors.length)throw new Error('Reviewed pack failed strict validation: '+errors.slice(0,3).join('; '));
 const meta=pack.metadata;
 if(meta.id!==entry.id||meta.title!==entry.title||meta.creator!==entry.creator||
    meta.description!==entry.description||meta.difficulty!==entry.difficulty||
    meta.estimatedMinutes!==entry.estimatedMinutes||
    pack.city.theme!==entry.theme||pack.rights.license!==entry.license||
    pack.buildings.length!==entry.buildings||pack.pieces.length!==entry.pieces||
    pack.missions.length!==entry.missions||JSON.stringify(meta.tags)!==JSON.stringify(entry.tags))
  throw new Error('Pack contents do not match reviewed catalogue');
 return pack;
}
export function validateLocalPackBytes(bytes){
 const raw=bytesFrom(bytes);
 if(raw.byteLength>MAX_PACK_BYTES)throw new Error('This city exceeds the 64 KiB limit');
 let pack;
 try{pack=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(raw));}
 catch{throw new Error('City file must contain valid UTF-8 JSON');}
 const errors=validatePack(pack);
 if(errors.length)throw new Error('Community city rejected: '+errors.slice(0,4).join('; '));
 return pack;
}
export function communitySaveKey(pack,variant){
 if(!identifier(pack?.metadata?.id))throw new Error('Invalid community city ID');
 if(!sha(variant))throw new Error('Invalid community city revision');
 return COMMUNITY_SAVE_PREFIX+pack.metadata.id+':'+variant;
}
export function findCatalogueEntries(manifest,{theme='all',search=''}={}){
 const c=checkCatalogue(manifest);const q=String(search).trim().toLocaleLowerCase();
 return c.entries.filter(e=>(theme==='all'||e.theme===theme)&&
  [e.title,e.creator,e.description,...e.tags].some(s=>s.toLocaleLowerCase().includes(q)));
}
