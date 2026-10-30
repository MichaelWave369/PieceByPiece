/**
 * Bounded three-junction rail-route puzzle. Public/private switches are not
 * currency or ownership claims. They are a fictional directed path to the commons.
 * No scripts, networking, random reward or independent mission ledger.
 */
import {buildingComplete} from './puzzle.mjs';

export const RAIL_VERSION=1;
export const RAIL_JUNCTIONS=Object.freeze([
 Object.freeze({id:'yard',label:'Salvage Yard Junction',requiresBuilding:'salvage',
  requiresMission:'restore-salvage',requiresPiece:'salvage-door',x:1.25,z:-4.0}),
 Object.freeze({id:'forge',label:'Foundry Transfer',requiresBuilding:'foundry',
  requiresMission:'restart-foundry',requiresPiece:'foundry-gear',x:1.25,z:-.7}),
 Object.freeze({id:'commons',label:'Commons Dispatch',requiresBuilding:'terminal',
  requiresMission:'release-rail',requiresPiece:'terminal-track',x:1.25,z:1.65}),
]);
export const DEFAULT_ROUTE='corporate';
export const PUBLIC_ROUTE='commons';
export function blankRail(pack){
 return {version:RAIL_VERSION,packId:pack.metadata.id,
   routes:Object.fromEntries(RAIL_JUNCTIONS.map(j=>[j.id,DEFAULT_ROUTE])),
   delivered:false};
}
export function restoreRail(pack,raw){
 const fresh=blankRail(pack);
 if(!raw||raw.version!==RAIL_VERSION||raw.packId!==fresh.packId||typeof raw.routes!=='object'||!raw.routes)return fresh;
 for(const j of RAIL_JUNCTIONS){
  if(raw.routes[j.id]===PUBLIC_ROUTE)fresh.routes[j.id]=PUBLIC_ROUTE;
 }
 fresh.delivered=raw.delivered===true;
 return fresh;
}
export function junctionReady(pack,session,junction){
 return Boolean(junction&&buildingComplete(pack,session,junction.requiresBuilding) &&
   session.missions.includes(junction.requiresMission) &&
   session.placed.includes(junction.requiresPiece));
}
export function railStatus(pack,session,rail){
 const connected=[],segments=[];
 let pathLive=true;
 for(const junction of RAIL_JUNCTIONS){
  const aligned=rail.routes[junction.id]===PUBLIC_ROUTE;
  const ready=junctionReady(pack,session,junction);
  pathLive=pathLive&&aligned&&ready;
  segments.push({id:junction.id,ready,aligned,active:pathLive,label:junction.label});
  if(pathLive)connected.push(junction.id);
 }
 const fullyBuilt=RAIL_JUNCTIONS.every(j=>junctionReady(pack,session,j));
 const routeComplete=segments.every(s=>s.active);
 const delivered=fullyBuilt&&(routeComplete||rail.delivered===true);
 return {segments,connected,routeComplete,delivered,
  gateOpen:delivered,publicSegments:segments.filter(s=>s.aligned).length,
  totalSegments:segments.length};
}
export function setRailRoute(pack,session,rail,id,route){
 const junction=RAIL_JUNCTIONS.find(j=>j.id===id);
 if(!junction)return {ok:false,reason:'Unknown rail junction',state:rail};
 if(route!==PUBLIC_ROUTE&&route!==DEFAULT_ROUTE)
  return {ok:false,reason:'Choose COMMONS or CORPORATE',state:rail};
 if(!junctionReady(pack,session,junction))
  return {ok:false,reason:'Finish this building and help its crew before switching routes',state:rail};
 const next={...rail,routes:{...rail.routes,[id]:route}};
 const status=railStatus(pack,session,next);
 next.delivered=rail.delivered===true||status.routeComplete;
 return {
  ok:true,state:next,status:railStatus(pack,session,next),
  reason:!rail.delivered&&next.delivered?'The public supply train is moving! Commons Freight Yard is open.'
   :route===PUBLIC_ROUTE?'Rail junction aligned toward the COMMONS.'
   :'Freight diverted toward private routing. The unlocked public yard stays accessible.'
 };
}
