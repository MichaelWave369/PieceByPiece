/** Final city: first-person footprint and public square entry, pure and bounded. */
import {buildingComplete} from './puzzle.mjs';
export const CELL=1.12;
export function citadelAnchor(pack,id){
 const p=pack.pieces.find(x=>x.buildingId===id&&x.target.z===0);
 return p?{x:(p.target.x-pack.city.grid.width/2+.5)*CELL,z:(p.target.y-pack.city.grid.height/2+.5)*CELL}:null;
}
export function citadelWalkable(pack,session,x,z,gateOpen=false){
 if(!Number.isFinite(x)||!Number.isFinite(z))return false;
 const w=pack.city.grid.width*CELL/2-.28,d=pack.city.grid.height*CELL/2-.28;
 if(Math.abs(x)>w||Math.abs(z)>d)return false;
 if(!gateOpen && z>2.6 && Math.abs(x)<2.2)return false;
 for(const [id,rX,rZ] of [['archive',1.2,1.15],['relay',1.0,1.0],['forum',1.2,1.1]]){
  if(!buildingComplete(pack,session,id))continue;
  const a=citadelAnchor(pack,id);
  if(a&&Math.abs(x-a.x)<rX+.28&&Math.abs(z-a.z)<rZ+.28)return false;
 }
 return true;
}
export function citadelMove(pack,session,from,delta,gateOpen=false){
 if(![from.x,from.z,delta.x,delta.z].every(Number.isFinite))return {...from};
 const steps=Math.max(1,Math.min(220,Math.ceil(Math.max(Math.abs(delta.x),Math.abs(delta.z))/.12)));
 let {x,z}=from;
 for(let i=0;i<steps;i++){
  const dx=delta.x/steps,dz=delta.z/steps;
  if(citadelWalkable(pack,session,x+dx,z,gateOpen))x+=dx;
  if(citadelWalkable(pack,session,x,z+dz,gateOpen))z+=dz;
 }
 return {x,z};
}
export function citadelTeleport(pack,session,p,gateOpen=false){
 return Boolean(p&&citadelWalkable(pack,session,p.x,p.z,gateOpen));
}
