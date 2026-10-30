/**
 * The Commons Architect core. Works without Three.js, browser globals, network,
 * accounts, or campaign state. All edits produce independent, bounded packs.
 */
import { validatePack, MAX_PACK_BYTES } from './community-validator.mjs';
import { blankSession, progress } from './puzzle.mjs';

export const COMMONS_DRAFT_KEY='piece-by-piece:commons:architect-draft:v1';
export const ALLOWED_THEMES=Object.freeze(['village','harbor','garden','industrial','neon']);
export const ALLOWED_PREFABS=Object.freeze(['foundation','wall','door','window','roof','stairs','bridge','road','lamp','tower','garden','dock']);
export const ALLOWED_DIFFICULTIES=Object.freeze(['calm','gentle','thoughtful','intricate']);
export const LICENSE_OPTIONS=Object.freeze(['CC0-1.0','CC-BY-4.0']);

const clone=p=>JSON.parse(JSON.stringify(p));
const validId=s=>typeof s==='string'&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(s)&&s.length<=64;
export function slug(text){
 const out=String(text??'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/gu,'')
   .replace(/[^a-z0-9]+/gu,'-').replace(/^-|-$/gu,'').slice(0,60).replace(/-$/u,'');
 return out.length>=2?out:'city';
}
function uniqueId(stem,existing){
 const seen=new Set(existing);
 if(!seen.has(stem))return stem;
 for(let n=2;n<10000;n++){
  const candidate=(stem.slice(0,64-String(n).length-1)+'-'+n);
  if(!seen.has(candidate))return candidate;
 }
 throw new Error('No safe identifier remains');
}
function firstEmpty(pack,z=0){
 const occupied=new Set(pack.pieces.map(p=>[p.target.x,p.target.y,p.target.z].join(':')));
 for(let y=1;y<pack.city.grid.height;y++)for(let x=1;x<pack.city.grid.width;x++){
  if(!occupied.has([x,y,z].join(':')))return {x,y,z};
 }
 throw new Error('No unoccupied tiles remain on this layer');
}
export function newCommonsPack(){
 return {
  format:'piecebypiece.city.v1',
  metadata:{id:'my-first-commons',title:'My First Commons',creator:'Local Architect',
    description:'A little community built one piece at a time.',difficulty:'gentle',
    estimatedMinutes:10,tags:['community','starter']},
  city:{theme:'village',grid:{width:12,height:12},seed:369},
  buildings:[{id:'gathering-place',name:'Gathering Place'}],
  pieces:[
   {id:'gathering-base',buildingId:'gathering-place',prefab:'foundation',target:{x:4,y:4,z:0,rotation:0}},
   {id:'gathering-door',buildingId:'gathering-place',prefab:'door',target:{x:4,y:5,z:0,rotation:0}},
   {id:'gathering-roof',buildingId:'gathering-place',prefab:'roof',target:{x:4,y:4,z:1,rotation:0}}
  ],
  missions:[{id:'visit-gathering',title:'Explore the Gathering Place',kind:'visit-building',buildingId:'gathering-place'}],
  rights:{license:'CC0-1.0',confirmed:false}
 };
}
/** Drafts can remain unlicensed until the creator explicitly affirms rights. */
export function draftErrors(pack){
 if(!pack||typeof pack!=='object')return ['draft must be a city pack'];
 const ready={...pack,rights:{...pack.rights,confirmed:true}};
 return validatePack(ready);
}
export function safeDraft(raw){
 const candidate=clone(raw);
 if(!candidate.rights||typeof candidate.rights!=='object')throw new Error('Invalid draft rights');
 candidate.rights.confirmed=false;
 const errors=draftErrors(candidate);
 if(errors.length)throw new Error(errors.slice(0,4).join('; '));
 return candidate;
}
/** Imported packs must be strict and creator rights must be re-affirmed. */
export function importCommonsPack(text){
 if(typeof text!=='string'||new TextEncoder().encode(text).byteLength>MAX_PACK_BYTES)
  throw new Error('This file exceeds the 64 KiB pack limit');
 let pack;
 try{pack=JSON.parse(text);}catch{throw new Error('The file is not valid JSON');}
 const errors=validatePack(pack);
 if(errors.length)throw new Error(errors.slice(0,6).join('; '));
 return safeDraft(pack);
}
export function exportCommonsPack(pack,receipt){
 const errors=validatePack(pack);
 if(errors.length)throw new Error('Fix pack validation: '+errors.slice(0,4).join('; '));
 if(!pack.rights.confirmed)throw new Error('You must confirm ownership or permission first');
 if(!receipt||receipt.signature!==JSON.stringify(pack)||receipt.complete!==true)
  throw new Error('Complete an end-to-end playtest after the latest edit before exporting');
 const serialized=JSON.stringify(pack,null,2)+'\n';
 if(new TextEncoder().encode(serialized).byteLength>MAX_PACK_BYTES)
  throw new Error('This pack exceeds 64 KiB when exported');
 return serialized;
}
function checkResult(pack){
 const errors=draftErrors(pack);
 if(errors.length)throw new Error(errors.slice(0,4).join('; '));
 return pack;
}
export function editCommonsPack(raw,command){
 const pack=clone(raw);
 if(!command||typeof command!=='object')throw new Error('Missing edit');
 switch(command.type){
  case 'metadata': {
   const field=command.field,value=String(command.value??'');
   if(!['title','creator','description'].includes(field))throw new Error('Unknown metadata field');
   pack.metadata[field]=value;
   if(field==='title' && pack.metadata.id==='my-first-commons')pack.metadata.id=slug(value);
   break;
  }
  case 'theme':
   if(!ALLOWED_THEMES.includes(command.value))throw new Error('Unknown city theme');
   pack.city.theme=command.value;break;
  case 'difficulty':
   if(!ALLOWED_DIFFICULTIES.includes(command.value))throw new Error('Unknown difficulty');
   pack.metadata.difficulty=command.value;break;
  case 'license':
   if(!LICENSE_OPTIONS.includes(command.value))throw new Error('Unknown sharing license');
   pack.rights.license=command.value;pack.rights.confirmed=false;break;
  case 'affirm':
   pack.rights.confirmed=command.value===true;break;
  case 'addBuilding': {
   if(pack.buildings.length>=24)throw new Error('Maximum of 24 buildings');
   const name=String(command.name??'').trim();
   if(!name||name.length>60)throw new Error('Building name must be 1–60 characters');
   const id=uniqueId(slug(name),pack.buildings.map(b=>b.id));
   if(!validId(id))throw new Error('Invalid building ID');
   const target=firstEmpty(pack);
   pack.buildings.push({id,name});
   pack.pieces.push({id:uniqueId(id+'-base',pack.pieces.map(p=>p.id)),buildingId:id,
    prefab:'foundation',target:{...target,rotation:0}});
   break;
  }
  case 'renameBuilding': {
   const b=pack.buildings.find(b=>b.id===command.id);
   if(!b)throw new Error('Unknown building');
   b.name=String(command.name??'').trim();break;
  }
  case 'removeBuilding': {
   if(pack.buildings.length<=1)throw new Error('Keep at least one building');
   if(!pack.buildings.some(b=>b.id===command.id))throw new Error('Unknown building');
   pack.buildings=pack.buildings.filter(b=>b.id!==command.id);
   pack.pieces=pack.pieces.filter(p=>p.buildingId!==command.id);
   pack.missions=pack.missions.filter(m=>m.buildingId!==command.id);
   break;
  }
  case 'addPiece': {
   if(pack.pieces.length>=128)throw new Error('Maximum of 128 pieces');
   if(!pack.buildings.some(b=>b.id===command.buildingId))throw new Error('Choose a building first');
   if(!ALLOWED_PREFABS.includes(command.prefab))throw new Error('Unknown prefab');
   const {x,y,z,rotation}=command.target||{};
   if(![x,y,z,rotation].every(Number.isSafeInteger))throw new Error('Use integer tile coordinates');
   const stem=command.buildingId+'-'+command.prefab;
   const id=uniqueId(stem,pack.pieces.map(p=>p.id));
   pack.pieces.push({id,buildingId:command.buildingId,prefab:command.prefab,target:{x,y,z,rotation}});
   break;
  }
  case 'changePiece': {
   const piece=pack.pieces.find(p=>p.id===command.id);
   if(!piece)throw new Error('Unknown piece');
   if(command.prefab!==undefined){
    if(!ALLOWED_PREFABS.includes(command.prefab))throw new Error('Unknown prefab');
    piece.prefab=command.prefab;
   }
   if(command.target!==undefined)piece.target={...command.target};
   break;
  }
  case 'removePiece': {
   const piece=pack.pieces.find(p=>p.id===command.id);
   if(!piece)throw new Error('Unknown piece');
   if(pack.pieces.length<=3)throw new Error('Keep at least three pieces');
   if(pack.pieces.filter(p=>p.buildingId===piece.buildingId).length<=1)
    throw new Error('Each building needs at least one piece');
   pack.pieces=pack.pieces.filter(p=>p.id!==command.id);
   break;
  }
  case 'addMission': {
   if(pack.missions.length>=24)throw new Error('Maximum of 24 missions');
   if(!pack.buildings.some(b=>b.id===command.buildingId))throw new Error('Choose a real building');
   const title=String(command.title??'').trim();
   const id=uniqueId(slug(title),pack.missions.map(m=>m.id));
   pack.missions.push({id,title,kind:'visit-building',buildingId:command.buildingId});
   break;
  }
  case 'removeMission': {
   if(!pack.missions.some(m=>m.id===command.id))throw new Error('Unknown mission');
   pack.missions=pack.missions.filter(m=>m.id!==command.id);
   break;
  }
  default:throw new Error('Unknown edit action');
 }
 return checkResult(pack);
}
export function newTestRun(pack){
 const errors=validatePack({...pack,rights:{...pack.rights,confirmed:true}});
 if(errors.length)throw new Error('Cannot test invalid pack: '+errors.slice(0,3).join('; '));
 return {session:blankSession(pack),signature:JSON.stringify(pack),complete:false};
}
export function testReceipt(pack,test){
 if(!test||test.signature!==JSON.stringify(pack))return null;
 const p=progress(pack,test.session);
 if(!p.complete||p.missions!==p.totalMissions)return null;
 return {signature:test.signature,complete:true,
  placed:p.placed,missions:p.missions,format:'piecebypiece.playtest.v1'};
}
