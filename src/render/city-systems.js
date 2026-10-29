import * as THREE from 'three';
import { CELL, textPlane } from './prefabs.js';

const stone = new THREE.MeshStandardMaterial({color:0xa8b5a5,roughness:.91});
const wood = new THREE.MeshStandardMaterial({color:0x8f7356,roughness:.89});
const warm = new THREE.MeshStandardMaterial({color:0xf8d18a,roughness:.45,emissive:0xffac46,emissiveIntensity:.35});
const muted = new THREE.MeshStandardMaterial({color:0x6b8880,roughness:.8});
const leaf = new THREE.MeshStandardMaterial({color:0x719d80,roughness:.91});

function box(group,w,h,d,x,y,z,material) {
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
  mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);
  return mesh;
}
function position(grid,point) {
  return new THREE.Vector3((point.x-grid.width/2+.5)*CELL,0,
    (point.y-grid.height/2+.5)*CELL);
}
function wire(group,a,b) {
  const begin=a.clone(); begin.y=.35;
  const end=b.clone(); end.y=.35;
  const diff=end.clone().sub(begin);
  const mesh=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,diff.length(),7),
    new THREE.MeshStandardMaterial({color:0x68847b,roughness:.72,emissive:0xb9c3a9,emissiveIntensity:0}));
  mesh.position.copy(begin).add(end).multiplyScalar(.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),diff.normalize());
  group.add(mesh);
  return mesh;
}

export function createCitySystemsScene(def,grid) {
  const root=new THREE.Group();
  const nodes=new Map(), wires=[],labels=[];
  for(const node of def.nodes) {
    const base=position(grid,node.position);
    if(node.kind==='consumer') {
      const lamp=new THREE.Group();
      lamp.position.copy(base);
      box(lamp,.12,1.48,.12,0,.76,0,wood);
      const shade=box(lamp,.50,.38,.5,0,1.58,0,warm.clone());
      shade.material.emissiveIntensity=.03;
      root.add(lamp);
      nodes.set(node.id,{node,root:lamp,glow:shade.material});
    } else if(node.kind==='gate') {
      const group=new THREE.Group();
      group.position.copy(base);
      box(group,.16,2.1,.18,0,1.05,-.92,stone);
      box(group,.16,2.1,.18,0,1.05,.92,stone);
      box(group,.18,.13,2.10,0,2.12,0,wood);
      const bar=box(group,.12,.11,1.88,0,1.02,0,warm.clone());
      const label=textPlane('COMMONS OVERLOOK',2.05,.29);
      label.position.set(-.1,2.54,0);
      label.rotation.y=-Math.PI/2;
      group.add(label);
      root.add(group);
      nodes.set(node.id,{node,root:group,bar,glow:bar.material});
      // Fence around the restricted northeast overlook, with one gated gap.
      for(const [z,length] of [[1.58,.60],[5.05,2.55]]) {
        const fence=new THREE.Group();
        fence.position.set(3.48,0,z);
        box(fence,.12,.74,length,0,.43,0,wood);
        root.add(fence);
      }
      box(root,3.12,.65,.10,5.04,.38,1.24,wood);
      // A little public gathering spot unlocks when the gate opens.
      box(root,1.55,.17,.55,5.05,.35,4.16,wood);
      box(root,1.55,.42,.12,5.05,.62,4.42,wood);
      for(const x of [4.41,5.68])box(root,.10,.33,.36,x,.21,4.16,wood);
      for(const [x,z] of [[4.25,5.2],[5.75,5.12]]) {
        const crown=new THREE.Mesh(new THREE.SphereGeometry(.39,12,9),leaf);
        crown.position.set(x,.8,z);root.add(crown);
        box(root,.10,.53,.10,x,.3,z,wood);
      }
      const sign=textPlane('OUR CITY · OUR FUTURE',2.3,.3);
      sign.position.set(5.05,1.42,4.74);
      root.add(sign);
      labels.push(sign);
    } else {
      const group=new THREE.Group();
      group.position.copy(base);
      const selectable={action:'system',data:node.id};
      const foundation=box(group,.72,.19,.72,0,.17,0,stone);
      foundation.userData=selectable;
      const post=box(group,.34,.72,.34,0,.6,0,wood);
      post.userData=selectable;
      const crystal=new THREE.Mesh(new THREE.OctahedronGeometry(.25,0),warm.clone());
      crystal.position.y=1.18;
      crystal.userData=selectable;
      group.add(crystal);
      const text=textPlane(node.label,1.9,.32,'#224849','#ffeed0');
      text.position.set(0,1.73,0);
      text.userData=selectable;
      group.add(text);
      labels.push(text);
      root.add(group);
      nodes.set(node.id,{node,root:group,crystal,glow:crystal.material,text});
    }
  }
  const coordinates=new Map(def.nodes.map(n=>[n.id,position(grid,n.position)]));
  for(const edge of def.edges) {
    const from=coordinates.get(edge.from),to=coordinates.get(edge.to);
    if(from && to)wires.push({from:edge.from,to:edge.to,mesh:wire(root,from,to)});
  }
  function apply(status) {
    const powered=new Set(status.powered);
    for(const [id,part] of nodes){
      if(part.glow)part.glow.emissiveIntensity=powered.has(id)?.72:.025;
      if(part.crystal)part.crystal.rotation.y=powered.has(id)?.26:0;
      if(part.bar){
        part.bar.position.y=status.gateOpen?2.30:1.02;
        part.bar.material.emissiveIntensity=status.gateOpen?.55:.08;
      }
    }
    const liveEdges=new Set(status.wires.filter(w=>w.active).map(w=>w.from+':'+w.to));
    for(const w of wires) {
      w.mesh.material.color.setHex(liveEdges.has(w.from+':'+w.to)?0xfbd89b:0x66817b);
      w.mesh.material.emissiveIntensity=liveEdges.has(w.from+':'+w.to)?.52:0;
    }
  }
  function tick(delta){
    for(const part of nodes.values()) if(part.crystal)part.crystal.rotation.y+=delta*.6;
  }
  return {root,apply,tick,labels};
}
