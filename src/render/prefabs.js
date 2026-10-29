import * as THREE from 'three';

export const CELL = 1.12;
const palette = {
  cafe: 0xf7bd79,
  home: 0x89c1d0,
  garden: 0x9fd1a6,
};
const material = (hex, ghost = false) => new THREE.MeshStandardMaterial({
  color: hex, roughness: 0.78, metalness: 0.02,
  transparent: ghost, opacity: ghost ? 0.46 : 1,
  depthWrite: !ghost,
});
function box(group, size, position, color, ghost) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material(color,ghost));
  mesh.position.set(...position);
  mesh.castShadow = !ghost;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}
function cylinder(group, radiusTop, radiusBottom, height, position, color, ghost, segments=10) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop,radiusBottom,height,segments), material(color,ghost));
  mesh.position.set(...position);
  mesh.castShadow = !ghost;
  group.add(mesh);
}
export function makePiece(piece, ghost=false) {
  const group = new THREE.Group();
  const accent = palette[piece.buildingId] || 0xd1baec;
  switch(piece.prefab) {
    case 'foundation':
      box(group,[1.02,.18,1.02],[0,.12,0],accent,ghost);
      box(group,[.85,.08,.85],[0,.24,0],0xfff3d8,ghost);
      break;
    case 'wall':
      box(group,[.98,.76,.14],[0,.55,0],accent,ghost);
      box(group,[.3,.25,.17],[0,.66,.01],0xffe5ad,ghost);
      break;
    case 'door':
      box(group,[.8,1,.18],[0,.54,0],accent,ghost);
      box(group,[.49,.78,.20],[0,.48,.01],0x785e4e,ghost);
      cylinder(group,.035,.035,.05,[.17,.47,.14],0xfde0a0,ghost);
      break;
    case 'window':
      box(group,[.88,.84,.18],[0,.54,0],accent,ghost);
      box(group,[.54,.48,.2],[0,.55,.02],0x94d5ef,ghost);
      box(group,[.07,.5,.23],[0,.55,.035],0xf8f4e8,ghost);
      break;
    case 'roof': {
      const roof = new THREE.Mesh(new THREE.ConeGeometry(.83,.7,4),material(0xcd7c67,ghost));
      roof.position.y=.45; roof.rotation.y=Math.PI/4; roof.castShadow=!ghost; group.add(roof);
      box(group,[1.15,.07,1.15],[0,.08,0],0xe8c7a8,ghost);
      break;
    }
    case 'road':
      box(group,[1.05,.06,1.05],[0,.12,0],0xd6bd9f,ghost);
      for(let i=-1;i<=1;i++)box(group,[.08,.015,.13],[0,.16,i*.27],0xffedc7,ghost);
      break;
    case 'garden':
      box(group,[.99,.12,.99],[0,.1,0],0x8a664d,ghost);
      for(let i=0;i<5;i++){
        const x=Math.sin(i*2.4)*.3, z=Math.cos(i*2.4)*.3;
        cylinder(group,.13,.16,.3,[x,.34,z],i%2?0x6fbf82:0xed97af,ghost,7);
      }
      break;
    case 'lamp':
      cylinder(group,.055,.09,.97,[0,.58,0],0x4a675b,ghost);
      cylinder(group,.22,.12,.26,[0,1.13,0],0xffdfa1,ghost,8);
      break;
    case 'bridge':
      box(group,[1.07,.14,1.01],[0,.34,0],0xb88b67,ghost);
      box(group,[1.1,.22,.11],[0,.53,.43],0xe4cc9d,ghost);
      box(group,[1.1,.22,.11],[0,.53,-.43],0xe4cc9d,ghost);
      break;
    case 'stairs':
      for(let i=0;i<3;i++)box(group,[.9,.16,.27],[0,.1+i*.15,.32-i*.3],accent,ghost);
      break;
    case 'tower':
      cylinder(group,.42,.46,1.9,[0,1,0],accent,ghost);
      cylinder(group,.6,.46,.38,[0,2,0],0xd27d73,ghost,6);
      break;
    case 'dock':
      box(group,[1,.16,.9],[0,.22,0],0x9f7554,ghost);
      for(const x of [-.38,.38])cylinder(group,.08,.08,.65,[x,-.01,.35],0x654b43,ghost);
      break;
    default:
      box(group,[.8,.8,.8],[0,.5,0],accent,ghost);
  }
  return group;
}
export function tilePosition(grid, target) {
  return new THREE.Vector3(
    (target.x - grid.width/2 + .5)*CELL,
    .12 + target.z*.96,
    (target.y - grid.height/2 + .5)*CELL
  );
}
export function gridCoordinate(grid, localPoint, z=0, rotation=0) {
  return {
    x: Math.floor(localPoint.x / CELL + grid.width/2),
    y: Math.floor(localPoint.z / CELL + grid.height/2),
    z,
    rotation,
  };
}
export function textPlane(text, width=.9, height=.19, background='#253d42', foreground='#fff6e8') {
  const canvas=document.createElement('canvas');
  canvas.width=768; canvas.height=160;
  const ctx=canvas.getContext('2d');
  ctx.fillStyle=background; ctx.beginPath();ctx.roundRect(2,2,764,156,22);ctx.fill();
  ctx.fillStyle=foreground;ctx.font='bold 46px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText(text,384,80,730);
  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(width,height),new THREE.MeshBasicMaterial({map:texture,transparent:true,side:THREE.DoubleSide,depthTest:false}));
  mesh.renderOrder=8;
  return mesh;
}
