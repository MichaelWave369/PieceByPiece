/**
 * Simple honest walkable footprint for the first dock.
 * Shared input controllers call these pure rules, independent from Three.js.
 */
export const HARBOR_CELL=1.12;
const R=.28;
export function harborAnchor(pack,id) {
 const part=pack.pieces.find(p=>p.buildingId===id&&p.target.z===0);
 if(!part)return null;
 return {
  x:(part.target.x-pack.city.grid.width/2+.5)*HARBOR_CELL,
  z:(part.target.y-pack.city.grid.height/2+.5)*HARBOR_CELL
 };
}
export function harborWalkable(pack,session,x,z){
 if(!Number.isFinite(x)||!Number.isFinite(z))return false;
 if(Math.abs(x)>pack.city.grid.width*HARBOR_CELL/2-R||
    Math.abs(z)>pack.city.grid.height*HARBOR_CELL/2-R)return false;
 // The waterfront's northern edge is water until the public ferry is launched.
 if(z>4.7&&!session.missions.includes('launch-ferry'))return false;
 for(const [id,rx,rz] of [['beacon',.88,.88],['teahouse',1.25,1.20],['boatyard',1.05,.84]]){
  const parts=pack.pieces.filter(p=>p.buildingId===id);
  if(!parts.every(p=>session.placed.includes(p.id)))continue;
  const a=harborAnchor(pack,id);
  if(a&&Math.abs(x-a.x)<rx+R&&Math.abs(z-a.z)<rz+R)return false;
 }
 return true;
}
export function harborMove(pack,session,start,delta){
 const steps=Math.max(1,Math.min(200,Math.ceil(Math.max(Math.abs(delta.x),Math.abs(delta.z))/.12)));
 let x=start.x,z=start.z;
 if(![x,z,delta.x,delta.z].every(Number.isFinite))return {...start};
 for(let i=0;i<steps;i++){
  if(harborWalkable(pack,session,x+delta.x/steps,z))x+=delta.x/steps;
  if(harborWalkable(pack,session,x,z+delta.z/steps))z+=delta.z/steps;
 }
 return {x,z};
}
