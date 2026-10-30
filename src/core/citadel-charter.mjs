/**
 * Three local, nonviolent "public charter" decisions conclude the campaign.
 * Tested independently of rendering; no remote services, authority or scripts.
 */
import {buildingComplete} from './puzzle.mjs';
export const CHARTER_VERSION=1;
export const CHARTER_KEYS=Object.freeze([
 Object.freeze({id:'knowledge',label:'Open Knowledge',buildingId:'archive',
   missionId:'recover-blueprints',pieceId:'archive-door',x:1.3,z:-4.4}),
 Object.freeze({id:'connection',label:'Shared Connection',buildingId:'relay',
   missionId:'release-signal',pieceId:'relay-lamp',x:1.3,z:-.9}),
 Object.freeze({id:'consent',label:'Community Consent',buildingId:'forum',
   missionId:'convene-assembly',pieceId:'forum-road',x:1.3,z:1.6})
]);
export const CHARTER_PUBLIC='public', CHARTER_PRIVATE='closed';
export function blankCharter(pack){
 return {version:CHARTER_VERSION,packId:pack.metadata.id,
   controls:Object.fromEntries(CHARTER_KEYS.map(x=>[x.id,CHARTER_PRIVATE])),ratified:false};
}
export function restoreCharter(pack,raw){
 const fresh=blankCharter(pack);
 if(!raw||raw.version!==CHARTER_VERSION||raw.packId!==fresh.packId||!raw.controls||typeof raw.controls!=='object')return fresh;
 for(const key of CHARTER_KEYS)if(raw.controls[key.id]===CHARTER_PUBLIC)fresh.controls[key.id]=CHARTER_PUBLIC;
 fresh.ratified=raw.ratified===true;
 return fresh;
}
export function charterReady(pack,session,key) {
 return Boolean(key&&buildingComplete(pack,session,key.buildingId)&&
   session.missions.includes(key.missionId)&&session.placed.includes(key.pieceId));
}
export function charterStatus(pack,session,charter){
 const seals=CHARTER_KEYS.map(key=>({
  id:key.id,label:key.label,
  ready:charterReady(pack,session,key),
  public:charter.controls[key.id]===CHARTER_PUBLIC
 }));
 const allReady=seals.every(s=>s.ready);
 const allPublic=seals.every(s=>s.ready&&s.public);
 return {seals,publicCount:seals.filter(s=>s.public).length,total:seals.length,
  ratified:allReady&&(allPublic||charter.ratified===true),
  allPublic,gateOpen:allReady&&(allPublic||charter.ratified===true)};
}
export function setCharterControl(pack,session,charter,id,value) {
 const control=CHARTER_KEYS.find(s=>s.id===id);
 if(!control)return {ok:false,reason:'Unknown charter control',state:charter};
 if(value!==CHARTER_PUBLIC&&value!==CHARTER_PRIVATE)
  return {ok:false,reason:'Choose PUBLIC or CLOSED',state:charter};
 if(!charterReady(pack,session,control))
  return {ok:false,reason:'Restore this building and speak to its ally first',state:charter};
 const next={...charter,controls:{...charter.controls,[id]:value}};
 const status=charterStatus(pack,session,next);
 next.ratified=charter.ratified===true||status.allPublic;
 return {ok:true,state:next,status:charterStatus(pack,session,next),
  reason:!charter.ratified&&next.ratified
   ? 'THE COMMON GROUND CHARTER IS RATIFIED. The public forum is open. You restored the five cities!'
   :value===CHARTER_PUBLIC?'This safeguard now belongs to the people.'
    :'The safeguard is closed again. A ratified charter still protects the public forum.'};
}
