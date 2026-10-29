import * as THREE from 'three';
import { textPlane } from './prefabs.js';

/**
 * Reward models for the first neighborhood.
 * More detailed authored GLBs can replace these later without changing pack data.
 */
const mat = (color, extra={}) => new THREE.MeshStandardMaterial({color,roughness:.85,...extra});
const C = {
  cream:mat(0xfff2d8), mint:mat(0x8bc6b4), aqua:mat(0x9acbd2),
  terracotta:mat(0xc97465), oak:mat(0x775f48),
  glass:mat(0x9cdbeb,{metalness:.12,roughness:.26}),
  gold:mat(0xf7d59b,{emissive:0x7d4c10,emissiveIntensity:.16}),
  green:mat(0x70a77d), darkGreen:mat(0x456f55),
  pale:mat(0xe2c9a4), cobble:mat(0xcfc4ae),
};

function cube(group,width,height,depth,x,y,z,material) {
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(width,height,depth),material);
  mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);
  return mesh;
}
function cone(group,radius,height,segments,x,y,z,material) {
  const mesh=new THREE.Mesh(new THREE.ConeGeometry(radius,height,segments),material);
  mesh.position.set(x,y,z);mesh.castShadow=true;group.add(mesh);
  return mesh;
}
function cylinder(group,rTop,rBottom,height,segments,x,y,z,material) {
  const mesh=new THREE.Mesh(new THREE.CylinderGeometry(rTop,rBottom,height,segments),material);
  mesh.position.set(x,y,z);mesh.castShadow=true;group.add(mesh);
  return mesh;
}
function label(group,text,x,y,z,width) {
  const mesh=textPlane(text,width,.29,'#27464a','#f8ecd2');
  mesh.position.set(x,y,z);
  group.add(mesh);
}
function cottage(group,house) {
  const body=house?C.aqua:C.cream;
  const roof=house?C.darkGreen:C.terracotta;
  cube(group,2.35,.18,2.20,0,.14,0,C.pale);
  cube(group,2.23,1.55,2.08,0,1.0,0,body);
  // Roof tiles form a visible silhouette instead of an intersecting single cube.
  const cap=cone(group,1.74,1,4,0,2.19,0,roof);
  cap.rotation.y=Math.PI/4;
  cube(group,.66,1.14,.10,0,.64,1.085,C.oak);
  cube(group,.12,.12,.11,.23,.69,1.15,C.gold);
  for(const x of [-.78,.78]) {
    cube(group,.52,.55,.095,x,1.24,1.09,C.glass);
    cube(group,.06,.57,.105,x,1.24,1.15,C.cream);
    cube(group,.53,.06,.105,x,1.24,1.16,C.cream);
  }
  for(const x of [-.8,.8]) {
    cube(group,.33,.32,.34,x,.24,1.08,C.pale);
    cone(group,.25,.5,7,x,.65,1.08,C.green);
  }
  if(!house){
    cube(group,1.26,.29,.17,0,1.76,1.12,C.gold);
    label(group,'SUNBEAM CAFÉ',0,1.76,1.23,1.6);
    cylinder(group,.06,.08,.35,9,-.5,2.7,-.6,C.darkGreen);
    cone(group,.14,.28,6,-.5,3.05,-.6,C.pale);
  } else {
    cube(group,.5,.22,.28,.62,2.46,.05,C.pale);
    label(group,'BLUEBELL HOUSE',0,1.78,1.20,1.74);
  }
}
function lanternGarden(group) {
  cube(group,3.2,.15,2.65,0,.13,0,C.cobble);
  cube(group,.56,.04,2.65,-.05,.23,0,C.pale);
  for(const pos of [[-1,.65,-.68],[1,.65,.65],[-1,.65,1],[.95,.65,-.93]]) {
    const [x,,z]=pos;
    cylinder(group,.07,.10,.85,9,x,.58,z,C.oak);
    cone(group,.57,1.28,8,x,1.45,z,C.green);
    cone(group,.42,.94,8,x,1.98,z,C.darkGreen);
  }
  for(const x of [-.47,.47]){
    cube(group,.61,.23,.4,x,.3,.85,C.oak);
    cube(group,.61,.48,.10,x,.61,.98,C.oak);
  }
  for(const z of [-1,1]){
    cylinder(group,.045,.07,1.4,10,0,.8,z,C.oak);
    cube(group,.34,.33,.34,0,1.58,z,C.gold);
    cone(group,.27,.36,4,0,1.92,z,C.terracotta).rotation.y=Math.PI/4;
  }
  label(group,'LANTERN GARDEN',0,1.75,1.45,2);
}
export function makeCompletedBuilding(buildingId) {
  const group=new THREE.Group();
  if(buildingId==='cafe')cottage(group,false);
  else if(buildingId==='home')cottage(group,true);
  else if(buildingId==='garden')lanternGarden(group);
  return group;
}
