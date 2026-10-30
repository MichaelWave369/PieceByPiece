/** Ground-level Ironhaven collision and public freight-yard access. */
import {buildingComplete} from './puzzle.mjs';
export const CELL=1.12, COLLISION_RADIUS=.28;
export const PUBLIC_YARD_Z=2.65, PUBLIC_CORRIDOR_HALF_WIDTH=2.20;
export function ironAnchor(pack,id){
 const p=pack.pieces.find(q=>q.buildingId===id&&q.target.z===0);
 return p?{x:(p.target.x-pack.city.grid.width/2+.5)*CELL,
           z:(p.target.y-pack.city.grid.height/2+.5)*CELL}:null;
}
export function ironWalkable(pack,session,x,z,railOpen=false){
 if(!Number.isFinite(x)||!Number.isFinite(z))return false;
 if(Math.abs(x)>pack.city.grid.width*CELL/2-COLLISION_RADIUS ||
    Math.abs(z)>pack.city.grid.height*CELL/2-COLLISION_RADIUS)return false;
 if(!railOpen && z>PUBLIC_YARD_Z && Math.abs(x)<PUBLIC_CORRIDOR_HALF_WIDTH)return false;
 for(const [id,hx,hz] of [['salvage',1.17,1.12],['foundry',1.20,1.18],['terminal',1.28,1.10]]){
  if(!buildingComplete(pack,session,id))continue;
  const a=ironAnchor(pack,id);
  if(a&&Math.abs(x-a.x)<hx+COLLISION_RADIUS&&Math.abs(z-a.z)<hz+COLLISION_RADIUS)return false;
 }
 return true;
}
export function ironMove(pack,session,origin,delta,railOpen=false){
 if(![origin.x,origin.z,delta.x,delta.z].every(Number.isFinite))return {...origin};
 const steps=Math.max(1,Math.min(250,Math.ceil(Math.max(Math.abs(delta.x),Math.abs(delta.z))/.11)));
 let x=origin.x,z=origin.z;
 for(let n=0;n<steps;n++){
  const dx=delta.x/steps,dz=delta.z/steps;
  if(ironWalkable(pack,session,x+dx,z,railOpen))x+=dx;
  if(ironWalkable(pack,session,x,z+dz,railOpen))z+=dz;
 }
 return {x,z};
}
export function ironTeleport(pack,session,point,railOpen=false){
 return Boolean(point&&ironWalkable(pack,session,point.x,point.z,railOpen));
}
