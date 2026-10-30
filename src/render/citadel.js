import * as THREE from 'three';
import {textPlane,tilePosition} from './prefabs.js';
import {CHARTER_KEYS} from '../core/citadel-charter.mjs';

const material=(color,opts={})=>new THREE.MeshStandardMaterial({color,roughness:.73,...opts});
const M={
 ground:material(0x596579),dark:material(0x2c354b,{metalness:.22}),
 slate:material(0x66738f),steel:material(0x9eabc5,{metalness:.3}),
 glass:material(0x80b6d2,{metalness:.22,roughness:.26}),
 copper:material(0xc6987b,{metalness:.3}),cream:material(0xe9dcc6),
 green:material(0x82c1a3),violet:material(0x8c8bb8),
 gold:material(0xf4d392,{emissive:0xe3a857,emissiveIntensity:.24}),
 light:material(0x85dfcc,{emissive:0x39b39a,emissiveIntensity:.68})
};
function cube(group,x,y,z,w,h,d,m){
 const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);
 o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;group.add(o);return o;
}
function cylinder(group,x,y,z,top,bottom,h,m,n=12){
 const o=new THREE.Mesh(new THREE.CylinderGeometry(top,bottom,h,n),m);
 o.position.set(x,y,z);o.castShadow=true;group.add(o);return o;
}
function sign(group,name,x,y,z,w=2.6) {
 const o=textPlane(name,w,.38,'#253a50','#f6e9d0');
 o.position.set(x,y,z);group.add(o);return o;
}
function archive(group){
 cube(group,0,.2,0,3,.25,2.75,M.cream);
 for(const x of [-1.3,1.3])for(const z of [-1.13,1.13])
  cylinder(group,x,1.38,z,.10,.10,2.23,M.steel);
 cube(group,0,2.52,0,3.3,.23,3.05,M.dark);
 for(const x of [-.85,0,.85]){
  cube(group,x,1.3,1.35,.65,1.65,.12,M.glass);
  cube(group,x,1.3,-1.36,.65,1.65,.12,M.glass);
 }
 for(const z of [-.9,0,.9]){
  cube(group,-1.37,1.25,z,.11,1.7,.67,M.glass);
  cube(group,1.37,1.25,z,.11,1.7,.67,M.glass);
 }
 for(const x of [-.65,.65])cube(group,x,.5,.1,.56,.28,1.45,M.copper);
 sign(group,'THE OPEN ARCHIVE',0,3.02,1.0,2.8);
}
function relay(group){
 cylinder(group,0,1.9,0,.61,.82,3.72,M.slate);
 for(const y of [.9,2.0,3.05])cylinder(group,0,y,0,.82,.84,.16,M.copper);
 cylinder(group,0,4.07,0,.72,.72,.37,M.dark);
 const core=new THREE.Mesh(new THREE.OctahedronGeometry(.62,0),M.light.clone());
 core.position.set(0,4.75,0);group.add(core);
 for(let a=0;a<3;a++){
  const angle=a*Math.PI*2/3;
  const ring=new THREE.Mesh(new THREE.TorusGeometry(1.08,.045,7,30),M.gold);
  ring.position.set(0,4.75,0);ring.rotation.y=angle;group.add(ring);
 }
 sign(group,'CENTRAL SIGNAL TOWER',0,5.7,.2,3.05);
}
function forum(group){
 cylinder(group,0,.18,0,2.03,2.03,.36,M.cream,16);
 for(let i=0;i<8;i++){
  const a=i*Math.PI/4;
  cylinder(group,Math.cos(a)*1.58,1.24,Math.sin(a)*1.58,.115,.115,2.12,M.steel);
 }
 cylinder(group,0,2.34,0,2.05,2.05,.25,M.dark,16);
 const skylight=new THREE.Mesh(new THREE.ConeGeometry(1.95,.75,12),M.glass);
 skylight.position.set(0,2.87,0);group.add(skylight);
 cylinder(group,0,.57,0,.78,.92,.61,M.copper);
 sign(group,"CITIZENS' FORUM",0,3.45,1.15,2.8);
}
export function createCitadelBuilding(id){
 const root=new THREE.Group();
 if(id==='archive')archive(root);
 else if(id==='relay')relay(root);
 else if(id==='forum')forum(root);
 return root;
}
export function placeCitadelBuilding(group,pack,id){
 const piece=pack.pieces.find(p=>p.buildingId===id&&p.target.z===0);
 if(piece)group.position.copy(tilePosition(pack.city.grid,piece.target));
}
function towerBackdrop(root,x,z){
 cube(root,x,3.15,z,2.3,6.3,2.5,M.dark);
 for(let y=.8;y<6;y+=.75)for(let u=-.7;u<1;u+=.6)
  cube(root,x+u,y,z+1.27,.32,.3,.08,M.glass);
 const tip=new THREE.Mesh(new THREE.ConeGeometry(1.35,1.3,4),M.slate);
 tip.position.set(x,6.95,z);tip.rotation.y=Math.PI/4;root.add(tip);
}
export function createCitadelScenery(pack) {
 const group=new THREE.Group();
 const side=pack.city.grid.width*1.12;
 cube(group,0,-.08,0,side,.27,side,M.ground);
 for(const [x,z] of [[-7,5.7],[6.9,-6.2]])towerBackdrop(group,x,z);
 // Broad central path leading to the public assembly.
 cube(group,0,.10,-1.2,3.35,.07,12.2,M.slate);
 for(let z=-6.5;z<6.5;z+=1.05){
  cube(group,-1.58,.15,z,.09,.08,.52,M.gold);
  cube(group,1.58,.15,z,.09,.08,.52,M.gold);
 }
 const sealsRoot=new THREE.Group();
 const seals=new Map(),labels=[];
 for(const seal of CHARTER_KEYS){
  const g=new THREE.Group();g.position.set(seal.x,0,seal.z);
  const action={action:'charter',data:seal.id};
  const base=cylinder(g,0,.24,0,.43,.49,.40,M.steel);base.userData=action;
  const crystal=new THREE.Mesh(new THREE.OctahedronGeometry(.26,0),M.gold.clone());
  crystal.position.set(0,.95,0);crystal.userData=action;g.add(crystal);
  const plaque=sign(g,seal.label,0,1.52,.0,2.25);plaque.userData=action;
  sealsRoot.add(g);seals.set(seal.id,{g,crystal});labels.push(plaque);
 }
 group.add(sealsRoot);
 const forumSquare=new THREE.Group();
 forumSquare.position.set(0,0,6.45);
 cylinder(forumSquare,0,.1,0,2.23,2.23,.18,M.cream,16);
 const dais=cylinder(forumSquare,0,.47,.1,.83,.9,.42,M.copper,12);
 sign(forumSquare,'COMMON GROUND · ALL ARE WELCOME',0,2.15,.1,4.0);
 for(const [x,z] of [[-1.62,-1.4],[1.62,-1.4],[-1.65,1.3],[1.65,1.3]]) {
  cylinder(forumSquare,x,.43,z,.22,.26,.70,M.copper);
  const pot=new THREE.Mesh(new THREE.SphereGeometry(.35,10,7),M.green);
  pot.position.set(x,1.05,z);forumSquare.add(pot);
 }
 group.add(forumSquare);
 const gate=new THREE.Group();
 gate.position.set(0,0,2.6);
 for(const x of [-2.2,2.2])cube(gate,x,.94,0,.20,1.86,.18,M.steel);
 const barrier=cube(gate,0,1.1,0,4.25,.17,.16,M.gold.clone());
 sign(gate,'PUBLIC FORUM',0,2.06,.1,2.6);
 group.add(gate);
 const celebration=new THREE.Group();
 for(let i=0;i<8;i++){
  const angle=i*Math.PI/4;
  const orb=new THREE.Mesh(new THREE.OctahedronGeometry(.16,0),M.light.clone());
  orb.position.set(Math.cos(angle)*1.46,2.17+Math.sin(angle*2)*.2,6.45+Math.sin(angle)*1.46);
  celebration.add(orb);
 }
 group.add(celebration);
 function apply(status){
  for(const seal of status.seals){
   const item=seals.get(seal.id);
   if(!item)continue;
   item.crystal.material.color.setHex(seal.public?0xa5efcc:0xf0bb7e);
   item.crystal.material.emissive.setHex(seal.public?0x5dbb99:0x986642);
   item.crystal.material.emissiveIntensity=seal.public?.7:.12;
  }
  barrier.visible=!status.gateOpen;
  celebration.visible=status.ratified;
 }
 let elapsed=0;
 function tick(delta,active,reducedMotion=false){
  if(!active||reducedMotion||!celebration.visible)return;
  elapsed+=Math.min(delta,.05)*.45;
  for(const [i,orb] of celebration.children.entries())
   orb.position.y=2.18+.18*Math.sin(elapsed*2+i);
 }
 return {group,sealsRoot,forumSquare,gate,celebration,labels,apply,tick};
}
