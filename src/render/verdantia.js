import * as THREE from 'three';
import {textPlane,tilePosition} from './prefabs.js';
import {SKY_HEIGHT} from '../core/garden-nav.mjs';

const m=(hex,rest={})=>new THREE.MeshStandardMaterial({color:hex,roughness:.82,...rest});
const P={
 grass:m(0x99c8a2),earth:m(0x577767),canopy:m(0x8db5a5),
 wood:m(0xa17b5e),woodDark:m(0x6c5147),stone:m(0xe6dbba),
 leaves:m(0x48866f),leavesLight:m(0x80b88a),
 petals:m(0xf2b7bd),gold:m(0xf7d790,{emissive:0xffbd5c,emissiveIntensity:.32}),
 crystal:m(0x8be1d9,{metalness:.08,roughness:.22}),roof:m(0x7ea59b)
};
function block(root,x,y,z,w,h,d,material) {
 const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
 mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);return mesh;
}
function cylinder(root,x,y,z,top,bottom,height,mat,segments=12){
 const obj=new THREE.Mesh(new THREE.CylinderGeometry(top,bottom,height,segments),mat);
 obj.position.set(x,y,z);obj.castShadow=true;obj.receiveShadow=true;root.add(obj);return obj;
}
function sphere(root,x,y,z,r,mat){
 const obj=new THREE.Mesh(new THREE.SphereGeometry(r,10,8),mat);
 obj.position.set(x,y,z);obj.castShadow=true;root.add(obj);return obj;
}
function roof(root,x,y,z,r,h,mat,segments=6) {
 const obj=new THREE.Mesh(new THREE.ConeGeometry(r,h,segments),mat);
 obj.position.set(x,y,z);obj.castShadow=true;root.add(obj);return obj;
}
function label(root,name,x,y,z,width=2.7){
 const sign=textPlane(name,width,.37,'#30584b','#fff0c3');
 sign.position.set(x,y,z);root.add(sign);return sign;
}
function tree(root,x,z,height=2.5){
 cylinder(root,x,height*.37,z,.12,.16,height*.74,P.woodDark);
 for(const [dx,dz,dy,r] of [[0,0,.80,.58],[-.42,.08,.69,.38],[.36,-.08,.7,.40]]) {
  sphere(root,x+dx,height*dy,z+dz,r,dx<0?P.leavesLight:P.leaves);
 }
}
function planter(root,x,y,z) {
 block(root,x,y,z,.85,.31,.66,P.wood);
 for(const dx of [-.25,0,.25]){
  cylinder(root,x+dx,y+.27,z,.04,.05,.32,P.leaves);
  sphere(root,x+dx,y+.49,z,.17,dx===0?P.petals:P.leavesLight);
 }
}
function seedhouse(root){
 block(root,0,.23,0,2.8,.25,2.6,P.stone);
 for(const x of [-1.14,1.14])for(const z of [-1.05,1.05])
  cylinder(root,x,1.32,z,.07,.07,2.28,P.wood);
 block(root,0,2.5,0,2.9,.12,2.7,P.roof);
 const dome=new THREE.Mesh(new THREE.SphereGeometry(1.4,18,10,0,Math.PI*2,0,Math.PI/2),P.crystal);
 dome.position.set(0,2.57,0);dome.scale.set(1,.75,.9);root.add(dome);
 for(const x of [-.8,0,.8])for(const z of [-.6,.6])planter(root,x,.40,z);
 label(root,'THE SEED CONSERVATORY',0,3.82,1.0,3.0);
}
function windspire(root) {
 cylinder(root,0,1.4,0,.56,.74,2.65,P.stone);
 cylinder(root,0,2.9,0,.77,.64,.34,P.roof);
 block(root,0,3.75,0,.18,1.9,.2,P.woodDark);
 // Decorative four-blade windmill, static and deliberately low-motion in VR.
 const rotor=new THREE.Group();rotor.position.set(0,3.62,.23);
 for(let i=0;i<4;i++){
  const blade=block(rotor,0,.69,0,.22,1.12,.12,P.crystal);
  blade.rotation.z=i*Math.PI/2;
  blade.position.set(-Math.sin(i*Math.PI/2)*.69,Math.cos(i*Math.PI/2)*.69,0);
 }
 cylinder(rotor,0,0,.12,.16,.16,.21,P.gold);root.add(rotor);
 for(const [x,z] of [[1.05,.9],[-.9,.8]])tree(root,x,z,1.5);
 label(root,'COMMUNITY WIND SPIRE',0,5.0,.25,2.85);
}
function canopyBridge(root){
 block(root,0,.20,0,3.6,.24,2.2,P.stone);
 for(const x of [-1.55,1.55]){
  cylinder(root,x,1.35,-.8,.11,.14,2.55,P.wood);
  cylinder(root,x,1.35,.8,.11,.14,2.55,P.wood);
 }
 for(const z of [-.8,.8]){
  block(root,0,2.61,z,3.45,.12,.16,P.wood);
 }
 for(const x of [-1.0,0,1.0])planter(root,x,.43,.65);
 // Small lifted observation platform as architectural teaser.
 block(root,0,1.55,-.92,2.15,.20,.72,P.wood);
 label(root,'THE COMMONS CANOPY',0,3.2,.35,2.8);
}
export function createGardenBuilding(id) {
 const root=new THREE.Group();
 if(id==='seedhouse')seedhouse(root);
 if(id==='windspire')windspire(root);
 if(id==='canopy')canopyBridge(root);
 return root;
}
export function placeGardenBuilding(group,pack,id){
 const first=pack.pieces.find(p=>p.buildingId===id&&p.target.z===0);
 if(first)group.position.copy(tilePosition(pack.city.grid,first.target));
}
export function createGardenScenery(pack){
 const group=new THREE.Group();
 const width=pack.city.grid.width*1.12,depth=pack.city.grid.height*1.12;
 block(group,0,-.08,0,width,.3,depth,P.grass);
 for(const [x,z,h] of [[-6,-5,2.3],[-5,1.3,3],[5.9,-4,2.4],[5.3,4.2,3.1],[-5.6,5,2.7]]){
  tree(group,x,z,h);
 }
 // Path with open central entry and lush garden beds.
 block(group,0,.12,0,1.8,.03,4.0,P.stone);
 for(const [x,z] of [[-2.2,2.2],[-3.1,4.4],[2.6,2.4],[3.25,4.5]]){
  planter(group,x,.21,z);
 }
 const skyRoot=new THREE.Group();
 // Raised skywalk north of the conservatory, level 1.65m.
 block(skyRoot,0,SKY_HEIGHT-.09,3.85,3.25,.22,3.55,P.wood);
 for(const x of [-1.6,1.6]){
  block(skyRoot,x,SKY_HEIGHT+.40,3.85,.10,.85,3.58,P.woodDark);
  for(const z of [2.45,3.8,5.15])sphere(skyRoot,x,SKY_HEIGHT+.86,z,.19,P.leavesLight);
 }
 // A low-slope visual ramp to connect walking height and sky platform.
 const ramp=block(skyRoot,0,SKY_HEIGHT/2,1.40,3.05,.15,2.0,P.stone);
 ramp.rotation.x=-Math.atan2(SKY_HEIGHT,2.0);
 // Airborne green space rewards the finished errands with flowers and vistas.
 for(const [x,z] of [[-1.1,3.0],[1.1,4.5],[-.8,5.0]]){
  planter(skyRoot,x,SKY_HEIGHT+.17,z);
 }
 const sign=label(skyRoot,'THE FREE SKYWALK',0,SKY_HEIGHT+2.0,4.5,2.55);
 group.add(skyRoot);
 const preview=new THREE.Group();
 preview.add(label(preview,'RECONNECT THE THREE GARDENS',0,3.0,4.9,3.15));
 group.add(preview);
 // A separate walkable raycast target for the raised observation deck.
 const upperPick=new THREE.Mesh(new THREE.PlaneGeometry(3.25,3.55),
  new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide}));
 upperPick.rotation.x=-Math.PI/2;
 upperPick.position.set(0,SKY_HEIGHT+.035,3.85);
 skyRoot.add(upperPick);
 return {group,skyRoot,upperPick,preview};
}
