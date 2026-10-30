/**
 * Verdantia's layered city: ground-level movement and an elevated skywalk
 * above the northern gardens. Coordinates are world-local. Pure and testable.
 */
import {buildingComplete} from './puzzle.mjs';
export const VERDANTIA_CELL=1.12;
const R=.28;
export const SKY_HEIGHT=1.65;
export function gardenAnchor(pack,id){
 const p=pack.pieces.find(q=>q.buildingId===id&&q.target.z===0);
 return p?{x:(p.target.x-pack.city.grid.width/2+.5)*VERDANTIA_CELL,
           z:(p.target.y-pack.city.grid.height/2+.5)*VERDANTIA_CELL}:null;
}
export function skywalkOpen(session){return session.missions.includes('open-skywalk');}
/**
 * North bridge spans z=2.1 to 5.5, x=-1.55 to 1.55.
 * Elevated terrace is reached via a broad, gentle ramp from z=0.9..2.1.
 * This is a gameplay path, not full physics-based stair climbing.
 */
export function elevationAt(session,x,z){
 if(!skywalkOpen(session))return 0;
 if(Math.abs(x)>1.7)return 0;
 if(z>=2.1&&z<=5.6)return SKY_HEIGHT;
 if(z>=.7&&z<2.1)return SKY_HEIGHT*(z-.7)/1.4;
 return 0;
}
export function gardenWalkable(pack,session,x,z){
 if(!Number.isFinite(x)||!Number.isFinite(z))return false;
 const size=pack.city.grid;
 if(Math.abs(x)>size.width*VERDANTIA_CELL/2-R||
    Math.abs(z)>size.height*VERDANTIA_CELL/2-R)return false;
 // Until the final quest, the shared north canopy promenade is gated.
 if(!skywalkOpen(session)&&z>2.1&&Math.abs(x)<1.7)return false;
 for(const [id,hx,hz] of [['seedhouse',1.25,1.25],['windspire',.95,.95],['canopy',.95,.95]]){
  if(!buildingComplete(pack,session,id))continue;
  const a=gardenAnchor(pack,id);
  if(a&&Math.abs(x-a.x)<hx+R&&Math.abs(z-a.z)<hz+R)return false;
 }
 return true;
}
export function gardenMove(pack,session,start,delta){
 if(![start.x,start.z,delta.x,delta.z].every(Number.isFinite))return {...start};
 const steps=Math.max(1,Math.min(200,Math.ceil(Math.max(Math.abs(delta.x),Math.abs(delta.z))/.12)));
 let x=start.x,z=start.z;
 for(let i=0;i<steps;i++){
  const dx=delta.x/steps,dz=delta.z/steps;
  if(gardenWalkable(pack,session,x+dx,z))x+=dx;
  if(gardenWalkable(pack,session,x,z+dz))z+=dz;
 }
 return {x,z,height:elevationAt(session,x,z)};
}
export function gardenTeleport(pack,session,point) {
 if(!point || !gardenWalkable(pack,session,point.x,point.z))return null;
 return {x:point.x,z:point.z,height:elevationAt(session,point.x,point.z)};
}
