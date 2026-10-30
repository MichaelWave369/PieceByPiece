import * as THREE from 'three';
import {textPlane,tilePosition} from './prefabs.js';
import {RAIL_JUNCTIONS} from '../core/rail-routing.mjs';

const mat=(color,rest={})=>new THREE.MeshStandardMaterial({color,roughness:.82,...rest});
const M={
 ground:mat(0x697e7a),rail:mat(0x516268,{metalness:.28,roughness:.52}),
 slate:mat(0x82969a),steel:mat(0x9aaba9,{metalness:.3,roughness:.53}),
 copper:mat(0xb87e56,{metalness:.32}),warm:mat(0xf3ca83,{emissive:0xc08431,emissiveIntensity:.22}),
 glass:mat(0x9fd2c8),brick:mat(0x9f6b64),cream:mat(0xe5d0b0),
 green:mat(0x73977b),inactive:mat(0x7b7d82),emissive:mat(0x83e9bb,{emissive:0x3d9e7d,emissiveIntensity:.6})
};
function cube(root,x,y,z,w,h,d,material) {
 const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
 o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;root.add(o);return o;
}
function cylinder(root,x,y,z,rt,rb,h,material,segments=12){
 const o=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,segments),material);
 o.position.set(x,y,z);o.castShadow=true;root.add(o);return o;
}
function sphere(root,x,y,z,r,material){
 const o=new THREE.Mesh(new THREE.SphereGeometry(r,12,8),material);
 o.position.set(x,y,z);o.castShadow=true;root.add(o);return o;
}
function sign(root,title,x,y,z,w=2.5){
 const mesh=textPlane(title,w,.39,'#354a50','#fff3d7');
 mesh.position.set(x,y,z);root.add(mesh);return mesh;
}
function gear(root,x,y,z,r=0.55,material=M.copper) {
 const group=new THREE.Group();group.position.set(x,y,z);
 const outer=new THREE.Mesh(new THREE.TorusGeometry(r,.11,7,14),material);
 group.add(outer);
 for(let n=0;n<8;n++){
  const a=n*Math.PI/4;
  const tooth=cube(group,Math.cos(a)*r,Math.sin(a)*r,0,.16,.19,.15,material);
  tooth.rotation.z=a;
 }
 const hub=cylinder(group,0,0,.05,.13,.13,.15,M.steel);
 hub.rotation.x=Math.PI/2;
 root.add(group);
 return group;
}
function salvage(root){
 cube(root,0,.22,0,2.75,.26,2.65,M.steel);
 cube(root,0,1.25,-1.07,2.7,1.88,.23,M.brick);
 for(const x of [-1.2,1.2])cube(root,x,1.18,0,.19,1.85,2.2,M.slate);
 cube(root,0,2.21,0,2.99,.20,2.85,M.copper);
 cube(root,0,.9,1.23,1.45,1.36,.10,M.slate);
 for(const x of [-.83,.83])cube(root,x,1.31,1.24,.48,.54,.11,M.glass);
 for(const x of [-.95,0,.95])cube(root,x,.40,2.0,.65,.65,.7,M.copper);
 gear(root,.72,1.65,1.22,.43);
 sign(root,'SALVAGE WORKSHOP',0,2.6,1.14,2.55);
}
function foundry(root){
 cube(root,0,.22,0,3.2,.28,2.9,M.steel);
 cube(root,0,1.17,0,3.05,1.78,2.65,M.brick);
 cube(root,0,2.09,0,3.35,.23,2.98,M.slate);
 for(const x of [-1.15,1.15]){
  cylinder(root,x,2.82,-.78,.29,.39,1.48,M.copper);
  cylinder(root,x,3.56,-.78,.37,.37,.18,M.slate);
 }
 for(const x of [-1.08,0,1.08])cube(root,x,1.37,1.37,.55,.76,.14,M.glass);
 const furnace=cylinder(root,0,.88,1.65,.45,.58,1.0,M.copper);
 sphere(root,0,1.55,1.65,.28,M.warm);
 gear(root,-1.55,1.10,0,.46);
 sign(root,'COOPERATIVE FOUNDRY',0,2.45,1.4,2.9);
}
function terminal(root){
 cube(root,0,.17,0,3.1,.25,2.55,M.cream);
 for(const x of [-1.35,1.35])for(const z of [-.98,.98])
  cube(root,x,1.28,z,.19,2.27,.19,M.steel);
 cube(root,0,2.48,0,3.4,.23,2.9,M.copper);
 cube(root,0,1.09,-1.20,2.78,1.68,.14,M.glass);
 for(const x of [-.90,0,.90])cube(root,x,1.35,-1.12,.06,1.04,.18,M.steel);
 cube(root,.10,.45,1.53,2.9,.15,.85,M.stone||M.steel);
 for(const x of [-1.1,1.1])cube(root,x,.55,2.35,.16,.95,.17,M.copper);
 const clockFace=cylinder(root,0,2.67,1.1,.25,.25,.09,M.cream,20);
 clockFace.rotation.x=Math.PI/2;
 sign(root,'PUBLIC RAIL TERMINAL',0,3.0,1.17,2.9);
}
export function createIronBuilding(id){
 const root=new THREE.Group();
 if(id==='salvage')salvage(root);
 else if(id==='foundry')foundry(root);
 else if(id==='terminal')terminal(root);
 return root;
}
export function placeIronBuilding(group,pack,id){
 const p=pack.pieces.find(piece=>piece.buildingId===id&&piece.target.z===0);
 if(p)group.position.copy(tilePosition(pack.city.grid,p.target));
}
function drawTracks(root){
 for(const x of [-.65,.65])cube(root,x,.13,0,.10,.14,13.7,M.rail);
 for(let z=-6.6;z<7;z+=.72)cube(root,0,.11,z,1.63,.10,.16,M.copper);
 // Connecting the private and public branches: visible options, no paid gate.
 for(const x of [-1.05,1.05])cube(root,x,.10,5.9,.10,.09,2.1,M.rail);
}
function createTrain(){
 const train=new THREE.Group();
 cube(train,0,.63,0,1.36,.62,2.35,M.green);
 cube(train,0,1.13,-.56,1.12,.47,.78,M.cream);
 cube(train,0,1.48,-.56,1.27,.14,1.0,M.copper);
 cube(train,0,.98,.38,1.2,.05,1.18,M.warm);
 for(const x of [-.63,.63])for(const z of [-.65,.75]){
  const wheel=cylinder(train,x,.26,z,.22,.22,.18,M.rail,12);wheel.rotation.z=Math.PI/2;
 }
 const label=sign(train,'COMMON SUPPLIES',0,1.42,.8,1.65);
 label.rotation.y=Math.PI;
 return train;
}
export function createIronScenery(pack){
 const group=new THREE.Group();
 const width=pack.city.grid.width*1.12,depth=pack.city.grid.height*1.12;
 cube(group,0,-.07,0,width,.25,depth,M.ground);
 drawTracks(group);
 for(const [x,z] of [[-6.8,-.7],[6.8,-.8],[-6.7,5.4],[6.7,5.4]]){
  cylinder(group,x,1.2,z,.12,.16,2.4,M.copper);
  sphere(group,x,2.52,z,.24,M.warm);
 }
 // A public receiving yard with reclaimed planters and communal supplies.
 const freightYard=new THREE.Group();
 freightYard.position.set(0,0,6.5);
 cube(freightYard,0,.18,.4,4.7,.3,2.4,M.steel);
 for(const x of [-1.65,1.65]) {
  cube(freightYard,x,.55,.92,.76,.48,.78,M.wood||M.copper);
  cube(freightYard,x,.38,-.33,.86,.28,.76,M.green);
 }
 const yardSign=sign(freightYard,'COMMONS FREIGHT YARD',0,1.63,1.1,3.3);
 group.add(freightYard);
 const railGroup=new THREE.Group();
 group.add(railGroup);
 const stations=new Map();
 const labels=[yardSign];
 for(const j of RAIL_JUNCTIONS){
  const g=new THREE.Group();g.position.set(j.x,0,j.z);
  const action={action:'rail',data:j.id};
  const base=cube(g,0,.24,0,.83,.33,.73,M.steel);base.userData=action;
  const shaft=cylinder(g,0,.67,0,.11,.13,.59,M.copper);shaft.userData=action;
  const light=sphere(g,0,1.10,0,.23,M.warm.clone());light.userData=action;
  const board=sign(g,j.label,0,1.66,.15,2.25);board.userData=action;
  labels.push(board);railGroup.add(g);
  stations.set(j.id,{group:g,light,board});
 }
 const train=createTrain();
 train.position.set(0,0,-5.8);
 group.add(train);
 // A physical-looking gate; collision itself is controlled by pure navigation.
 const gate=new THREE.Group();
 gate.position.set(0,0,2.65);
 for(const x of [-2.25,2.25])cube(gate,x,.97,0,.19,1.88,.2,M.copper);
 const barrier=cube(gate,0,1.12,0,4.42,.18,.20,M.warm.clone());
 gate.add(sign(gate,'PUBLIC YARD GATE',0,2.19,.1,2.55));
 group.add(gate);
 let runningTime=0;
 function apply(status){
  for(const segment of status.segments){
   const station=stations.get(segment.id);
   if(!station)continue;
   station.light.material.color.setHex(segment.aligned?0x91f0c8:0xffc884);
   station.light.material.emissive.setHex(segment.active?0x3caa7e:0x8d5e2b);
   station.light.material.emissiveIntensity=segment.active?.68:.18;
  }
  barrier.visible=!status.gateOpen;
  train.visible=status.delivered;
 }
 function tick(delta,active,reducedMotion=false){
  if(!active||!train.visible||reducedMotion)return;
  runningTime+=Math.min(delta,.05)*.45;
  // Original, predictable light freight loop. No time-limited challenges.
  train.position.z=-5.6+((runningTime%1)*11.0);
 }
 return {group,stations,railGroup,freightYard,gate,train,labels,apply,tick};
}
