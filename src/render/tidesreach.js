import * as THREE from 'three';
import {textPlane,tilePosition} from './prefabs.js';

function mat(hex,props={}){return new THREE.MeshStandardMaterial({color:hex,roughness:.84,...props});}
const M={
 sand:mat(0xeacda2), stone:mat(0xe7e8d6), stoneDark:mat(0x829ba0),
 sea:mat(0x2d8b9c,{metalness:.08,roughness:.33}),
 wood:mat(0xa87659),woodDark:mat(0x735744),
 cream:mat(0xffefd9), blue:mat(0x74b0c3), blueDark:mat(0x375d79),
 roof:mat(0xdd826b), green:mat(0x83a989), gold:mat(0xfde2a0,{emissive:0xffc767,emissiveIntensity:.55})
};
const cube=(root,x,y,z,w,h,d,m)=>{
 const obj=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);
 obj.position.set(x,y,z);obj.castShadow=true;obj.receiveShadow=true;root.add(obj);return obj;
};
const cylinder=(root,x,y,z,r1,r2,h,m,segments=12)=>{
 const obj=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,segments),m);
 obj.position.set(x,y,z);obj.castShadow=true;root.add(obj);return obj;
};
const cone=(root,x,y,z,r,h,m,segments=6)=>{
 const obj=new THREE.Mesh(new THREE.ConeGeometry(r,h,segments),m);
 obj.position.set(x,y,z);obj.castShadow=true;root.add(obj);return obj;
};
function label(root,title,x,y,z,w=2.4){
 const sign=textPlane(title,w,.37,'#214955','#fff4ce');
 sign.position.set(x,y,z);root.add(sign);return sign;
}
function lighthouse(root){
 cylinder(root,0,.2,0,.90,1.05,.38,M.stone);
 cylinder(root,0,1.68,0,.51,.76,2.74,M.cream);
 cylinder(root,0,3.16,0,.78,.63,.28,M.blueDark);
 cylinder(root,0,3.65,0,.57,.52,.73,M.gold);
 cylinder(root,0,4.1,0,.82,.82,.24,M.blueDark);
 cone(root,0,4.38,0,.94,.53,M.roof,8);
 // Stripes help the tower read at miniature scale.
 for(const y of [1.18,2.08])cylinder(root,0,y,0,.68,.72,.16,M.roof);
 cube(root,0,.64,.8,.40,.9,.12,M.woodDark);
 for(const z of [-.45,.45]) {
  cube(root,.58,2.42,z,.06,.42,.22,M.blue);
  cube(root,-.58,2.42,z,.06,.42,.22,M.blue);
 }
 label(root,'STARFALL LIGHTHOUSE',0,4.9,.07,2.55);
}
function teahouse(root){
 cube(root,0,.20,0,2.48,.25,2.35,M.stone);
 cube(root,0,1.04,0,2.34,1.52,2.20,M.cream);
 const roof=cone(root,0,2.2,0,1.75,.88,M.roof,4);
 roof.rotation.y=Math.PI/4;
 cube(root,0,.62,1.13,.65,1.0,.13,M.woodDark);
 for(const x of [-.77,.77]){
  cube(root,x,1.27,1.125,.48,.52,.1,M.blue);
  cube(root,x,1.27,1.2,.05,.54,.11,M.cream);
 }
 for(const x of [-.93,.93]){
  cube(root,x,.26,1.39,.42,.14,.5,M.wood);
  cone(root,x,.66,1.39,.36,.65,M.green,7);
 }
 cube(root,0,1.89,1.16,1.56,.28,.13,M.wood);
 label(root,'HARBOR TEA ROOM',0,1.89,1.24,1.9);
 // Outdoor tea table.
 cylinder(root,1.66,.45,0,.39,.4,.12,M.wood);
 cylinder(root,1.66,.25,0,.09,.11,.4,M.woodDark);
}
function boatyard(root){
 cube(root,0,.22,0,3.15,.22,2.75,M.wood);
 for(const x of [-1.26,0,1.26])for(const z of [-1.1,1.10])
  cube(root,x,-.11,z,.16,.8,.18,M.woodDark);
 cube(root,-.8,1.22,-.76,.13,2.12,.14,M.woodDark);
 cube(root,.8,1.22,-.76,.13,2.12,.14,M.woodDark);
 cube(root,0,2.27,-.76,1.9,.14,.16,M.woodDark);
 const awning=cube(root,0,2.22,-.23,2.06,.10,1.49,M.blueDark);
 awning.rotation.x=.13;
 // The public ferry, made from a half-sphere hull and little cabin.
 const hull=new THREE.Mesh(new THREE.SphereGeometry(.92,18,10,0,Math.PI*2,0,Math.PI/2),M.roof);
 hull.rotation.z=Math.PI;
 hull.scale.set(1.45,.42,.76);
 hull.position.set(.1,.37,.32);root.add(hull);
 cube(root,.1,.59,.32,1.9,.13,.83,M.cream);
 cube(root,-.25,.91,.22,.63,.6,.57,M.stone);
 cube(root,-.25,1.3,.22,.79,.13,.72,M.woodDark);
 cylinder(root,.75,1.04,.20,.045,.045,.76,M.woodDark);
 label(root,'COMMUNITY BOATYARD',0,2.72,-.77,2.8);
}
export function createHarborBuilding(id){
 const g=new THREE.Group();
 if(id==='beacon')lighthouse(g);
 else if(id==='teahouse')teahouse(g);
 else if(id==='boatyard')boatyard(g);
 return g;
}
export function createHarborScenery(pack){
 const group=new THREE.Group();
 const width=pack.city.grid.width*1.12,depth=pack.city.grid.height*1.12;
 const water=new THREE.Mesh(new THREE.PlaneGeometry(width+15,depth+15),M.sea);
 water.rotation.x=-Math.PI/2;water.position.y=-.27;water.receiveShadow=true;group.add(water);
 const deck=cube(group,0,-.08,0,width,.30,depth,M.sand);
 deck.receiveShadow=true;
 for(let x=-width/2+.5;x<width/2;x+=2.2){
  const bump=cube(group,x,.14,depth/2-.4,1.6,.03,.20,M.stone);
  bump.castShadow=false;
 }
 // Waterfront after restoring the public ferry.
 const ferryRoot=new THREE.Group();
 ferryRoot.position.set(0,-.04,depth/2+1.12);
 const boat=cube(ferryRoot,0,.32,0,2.95,.40,1.04,M.roof);
 boat.rotation.y=-.05;
 cube(ferryRoot,-.5,.81,0,.95,.66,.84,M.cream);
 cube(ferryRoot,-.5,1.23,0,1.16,.15,.99,M.blueDark);
 const banner=label(ferryRoot,'THE PUBLIC FERRY',0,1.78,0,2.4);
 banner.rotation.y=Math.PI;
 group.add(ferryRoot);
 // Restore the ferry only when the full kindness quest is complete.
 const reflect= new THREE.Mesh(new THREE.PlaneGeometry(width*.85,1.2),
   new THREE.MeshBasicMaterial({color:0x9adbc7,transparent:true,opacity:.25,side:THREE.DoubleSide}));
 reflect.rotation.x=-Math.PI/2;reflect.position.set(0,.09,depth/2-1.0);group.add(reflect);
 return {group,ferryRoot};
}
export function placeHarborBuilding(group,pack,id){
 const anchor=pack.pieces.find(p=>p.buildingId===id && p.target.z===0);
 if(!anchor)return;
 group.position.copy(tilePosition(pack.city.grid,anchor.target));
}
