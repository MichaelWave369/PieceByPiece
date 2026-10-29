import * as THREE from 'three';
import { textPlane } from './prefabs.js';

const material = (color, extra={}) => new THREE.MeshStandardMaterial({color,roughness:.82,...extra});
const COLOR = {
  pine:material(0x50796b), white:material(0xffebd3),
  oak:material(0x94755b), cocoa:material(0x6a5145),
  gold:material(0xf2cb83,{emissive:0x765116,emissiveIntensity:.25}),
  teal:material(0x71b1ac), pink:material(0xd79891),
  floor:material(0xd3bfa2), wall:material(0xf2e5d3),
  shadow:material(0x2d4c4a), ceramic:material(0xf9f3e8),
};
function cube(g,x,y,z,w,h,d,mat,action=null) {
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
  mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;
  if(action)mesh.userData=action;
  g.add(mesh);return mesh;
}
function sphere(g,x,y,z,r,mat,action=null){
  const mesh=new THREE.Mesh(new THREE.SphereGeometry(r,12,10),mat);
  mesh.position.set(x,y,z);mesh.castShadow=true;
  if(action)mesh.userData=action;
  g.add(mesh);return mesh;
}
function cylinder(g,x,y,z,rTop,rBottom,h,mat){
  const mesh=new THREE.Mesh(new THREE.CylinderGeometry(rTop,rBottom,h,10),mat);
  mesh.position.set(x,y,z);mesh.castShadow=true;
  g.add(mesh);return mesh;
}
export function createNeighbor(neighbor) {
  const group=new THREE.Group();
  group.userData={action:'talk',data:neighbor.id};
  const clothes=material(neighbor.color);
  cylinder(group,0,.75,0,.24,.36,.82,clothes);
  sphere(group,0,1.46,0,.28,material(0xe4b58f));
  sphere(group,-.09,1.49,.26,.025,COLOR.shadow);
  sphere(group,.09,1.49,.26,.025,COLOR.shadow);
  sphere(group,0,1.73,0,.27,COLOR.cocoa);
  for(const side of [-1,1]) {
    cylinder(group,side*.13,.25,0,.07,.09,.46,COLOR.shadow);
    cylinder(group,side*.33,.88,0,.075,.065,.48,clothes);
  }
  const label=textPlane(neighbor.name+' · Talk',1.6,.33,'#2b5952','#ffebc8');
  label.position.y=2.09;label.userData={action:'talk',data:neighbor.id};
  group.add(label);
  const aura=sphere(group,0,.09,0,.31,COLOR.gold);
  aura.scale.set(1,.07,1);
  aura.castShadow=false;
  return { group, label };
}
export function createDoorMarker(id,title) {
  const root=new THREE.Group();
  root.userData={action:'interior',data:id};
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.36,.05,8,32),COLOR.gold);
  ring.position.set(0,1.55,0);root.add(ring);
  const sign=textPlane('ENTER '+title,1.45,.29);
  sign.position.y=2.16;sign.userData={action:'interior',data:id};root.add(sign);
  return { root,sign,ring };
}
function couch(g){
  cube(g,-1.55,.49,-.6,1.18,.45,.48,COLOR.teal);
  cube(g,-1.55,.81,-.82,1.18,.53,.15,COLOR.teal);
  cube(g,-2.07,.61,-.63,.12,.54,.52,COLOR.oak);
  cube(g,-1.03,.61,-.63,.12,.54,.52,COLOR.oak);
}
function plant(g,x,z){
  cylinder(g,x,.33,z,.3,.23,.39,COLOR.cocoa);
  cylinder(g,x,.72,z,.08,.08,.5,COLOR.pine);
  for(const [dx,dz] of [[-.2,0],[.2,.13],[0,-.24]]){
    sphere(g,x+dx,1,z+dz,.29,COLOR.pine);
  }
}
export function createInterior(id){
  const group=new THREE.Group();
  const cafe=id==='cafe';
  // Open-front dollhouse-style interior: safe to inspect on desktop and in headset.
  cube(group,0,-.055,0,5.5,.18,5.8,COLOR.floor);
  cube(group,0,1.45,-2.8,5.5,2.9,.16,COLOR.wall);
  cube(group,-2.7,1.45,0,.16,2.9,5.8,COLOR.wall);
  cube(group,2.7,1.45,0,.16,2.9,5.8,COLOR.wall);
  for(const x of [-1.28,1.28]){
    cube(group,x,1.9,-2.67,1.1,.78,.06,COLOR.teal);
    cube(group,x,1.9,-2.6,.09,.79,COLOR.white);
  }
  if(cafe){
    cube(group,0,.85,-1.55,2.95,1.27,.7,COLOR.oak);
    cube(group,0,1.53,-1.55,3.1,.12,.81,COLOR.cocoa);
    for(const x of [-1.0,0,1.0]){
      cylinder(group,x,1.65,-1.36,.12,.16,.18,COLOR.ceramic);
      sphere(group,x,1.82,-1.36,.07,COLOR.gold);
    }
    for(const x of [-1.4,1.4]){
      cylinder(group,x,.55,.5,.45,.43,.13,COLOR.oak);
      cylinder(group,x,.31,.5,.1,.1,.41,COLOR.cocoa);
      for(const dx of [-.3,.3])cylinder(group,x+dx,.27,1,.18,.18,.5,COLOR.teal);
    }
    plant(group,2,1.55);
  } else {
    couch(group);
    cube(group,1.3,.48,-1,1.4,.8,.9,COLOR.oak);
    cube(group,1.3,.92,-1,1.5,.1,.99,COLOR.white);
    cube(group,1.5,1.04,-1,.35,.13,.36,COLOR.ceramic);
    cylinder(group,0,.5,1.1,.58,.58,.12,COLOR.oak);
    cylinder(group,0,.29,1.1,.09,.11,.38,COLOR.cocoa);
    plant(group,2,1.9);
  }
  const header=textPlane(cafe?'SUNBEAM CAFÉ · INSIDE':'BLUEBELL HOUSE · INSIDE',3.0,.42);
  header.position.set(0,2.5,-2.61);group.add(header);
  const exitSign=textPlane('← RETURN TO THE STREET',2.35,.4,'#415b4c','#ffedbe');
  exitSign.position.set(0,2.2,1.1);
  exitSign.userData={action:'exit-interior'};
  group.add(exitSign);
  // Physical-looking doorway and interactive zone.
  cube(group,-.95,.95,2.65,.25,1.9,.2,COLOR.oak);
  cube(group,.95,.95,2.65,.25,1.9,.2,COLOR.oak);
  cube(group,0,2.0,2.65,2.15,.2,.2,COLOR.oak);
  return {group,exitSign};
}
