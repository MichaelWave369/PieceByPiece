import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import pack from '../game/campaign/the-living-block.json';
import { blankSession, restoreSession, nextUnplaced, tryPlace, progress, buildingComplete, completeMission } from './core/puzzle.mjs';
import { CELL, makePiece, tilePosition, gridCoordinate, textPlane } from './render/prefabs.js';
import { makeCompletedBuilding } from './render/buildings.js';
import { NEIGHBORS, getNeighbor, nextErrand, carrying, talkToNeighbor } from './core/neighborhood.mjs';
import { anchorOf, moveWalkable, canTeleport } from './core/navigation.mjs';
import { createNeighbor, createDoorMarker, createInterior } from './render/life.js';
import { NeighborhoodAudio } from './audio/ambient.js';
import './style.css';

const $ = id => document.getElementById(id);
const SAVE_KEY = 'piece-by-piece:campaign:the-living-block:v1';
const CITY = pack.city.grid;
let state = loadSave();
let mode = 'workshop';
let selected = nextUnplaced(pack, state)?.id || null;
let rotation = 0;
let hovered = null;
let hintsOn = true;
let xrActive = false;
let shelfPage = 0;
let inside = null;
let activeDialogue = null;
const audio = new NeighborhoodAudio();
const heldKeys = new Set();
const timer = new THREE.Clock();

function loadSave() {
  try { return restoreSession(pack, JSON.parse(localStorage.getItem(SAVE_KEY))); }
  catch { return blankSession(pack); }
}
function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); }
  catch { notify('Local save unavailable. Your progress lasts only this session.'); }
}
function notify(message) {
  $('message').textContent = message;
  $('live-status').textContent = message;
}

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xcce4db);
scene.fog = new THREE.Fog(0xcce4db, 28, 65);
const camera = new THREE.PerspectiveCamera(60, 1, .04, 150);
camera.position.set(12, 17, 17);
camera.lookAt(0, 0, 0);
const renderer = new THREE.WebGLRenderer({ antialias:true, powerPreference:'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.xr.enabled = true;
renderer.xr.setReferenceSpaceType('local-floor');
$('stage').append(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = .075;
controls.maxPolarAngle = Math.PI*.49;
controls.minDistance = 9;
controls.maxDistance = 29;
controls.target.set(0, 0, 0);
controls.update();

scene.add(new THREE.HemisphereLight(0xeafff4, 0x9d9e88, 2.5));
const sun = new THREE.DirectionalLight(0xffedc1, 3.0);
sun.position.set(-8,18,10);sun.castShadow=true;
sun.shadow.mapSize.set(1024,1024);
sun.shadow.camera.left=-22;sun.shadow.camera.right=22;
sun.shadow.camera.top=22;sun.shadow.camera.bottom=-22;
scene.add(sun);

const cityRoot = new THREE.Group();
scene.add(cityRoot);
const placedRoot = new THREE.Group();
const completedRoot = new THREE.Group();
const hintRoot = new THREE.Group();
const peopleRoot = new THREE.Group();
const doorsRoot = new THREE.Group();
const speechRoot = new THREE.Group();
const interiorRoot = new THREE.Group();
const lifeLabels = [];
interiorRoot.visible=false;
scene.add(interiorRoot);
cityRoot.add(placedRoot,completedRoot,hintRoot,peopleRoot,doorsRoot,speechRoot);

const base = new THREE.Mesh(
  new THREE.BoxGeometry(CITY.width*CELL+.6,.25,CITY.height*CELL+.6),
  new THREE.MeshStandardMaterial({color:0x56766c,roughness:1})
);
base.position.y=-.07; base.receiveShadow=true;
cityRoot.add(base);
const grass = new THREE.Mesh(
  new THREE.PlaneGeometry(CITY.width*CELL,CITY.height*CELL),
  new THREE.MeshStandardMaterial({color:0xb5ceb0,roughness:.98})
);
grass.rotation.x=-Math.PI/2;grass.position.y=.065;grass.receiveShadow=true;
cityRoot.add(grass);
// The board has a dedicated picking surface, not a mesh-based gameplay rule.
const boardPick = new THREE.Mesh(
  new THREE.PlaneGeometry(CITY.width*CELL,CITY.height*CELL),
  new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide})
);
boardPick.rotation.x=-Math.PI/2;boardPick.position.y=.082;
cityRoot.add(boardPick);
const grid = new THREE.GridHelper(CITY.width*CELL,CITY.width,0xf9efdf,0xe4e7d3);
grid.position.y=.085;cityRoot.add(grid);
for (let i=0;i<3;i++) {
  const stripe=new THREE.Mesh(
    new THREE.BoxGeometry(CITY.width*CELL,.016,.45),
    new THREE.MeshStandardMaterial({color:0xe0d5bf,roughness:1})
  );
  stripe.position.set(0,.11,(i-1)*CELL*3.3);
  stripe.receiveShadow=true;cityRoot.add(stripe);
}

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(200,200),
  new THREE.MeshStandardMaterial({color:0xe4eee6,roughness:1})
);
ground.rotation.x=-Math.PI/2;ground.position.y=-.27;ground.receiveShadow=true;
scene.add(ground);
const workbench = new THREE.Group();
const tabletop = new THREE.Mesh(
  new THREE.CylinderGeometry(1.28,1.3,.11,64),
  new THREE.MeshStandardMaterial({color:0x967861,roughness:.85})
);
tabletop.position.set(0,.91,-1.85);tabletop.receiveShadow=true;workbench.add(tabletop);
const leg = new THREE.Mesh(
  new THREE.CylinderGeometry(.11,.16,.83,12),
  new THREE.MeshStandardMaterial({color:0x816b5c})
);
leg.position.set(0,.45,-1.85);workbench.add(leg);
scene.add(workbench);

let ghost = null;
let hint = null;
function discard(group) {
  while(group.children.length) {
    const child=group.children[0];
    group.remove(child);
    child.traverse(o=>{
      if(o.isMesh){
        o.geometry?.dispose();
        if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());
        else {o.material?.map?.dispose();o.material?.dispose();}
      }
    });
  }
}
function getSelected() { return pack.pieces.find(p=>p.id===selected) || null; }
function refreshPlaced() {
  discard(placedRoot);
  discard(completedRoot);
  for(const building of pack.buildings) {
    if(!buildingComplete(pack,state,building.id))continue;
    const anchor=pack.pieces.find(piece=>piece.buildingId===building.id && piece.target.z===0);
    const model=makeCompletedBuilding(building.id);
    model.position.copy(tilePosition(CITY,anchor.target));
    completedRoot.add(model);
  }
  for(const piece of pack.pieces) {
    if(!state.placed.includes(piece.id) || buildingComplete(pack,state,piece.buildingId))continue;
    const model=makePiece(piece);
    model.position.copy(tilePosition(CITY,piece.target));
    model.rotation.y=THREE.MathUtils.degToRad(piece.target.rotation);
    placedRoot.add(model);
  }
}
function refreshHint() {
  discard(hintRoot);
  const piece=getSelected();
  if(!piece || !hintsOn || mode!=='workshop')return;
  const target=tilePosition(CITY,piece.target);
  const frame=new THREE.Mesh(
    new THREE.BoxGeometry(CELL*.94,.035,CELL*.94),
    new THREE.MeshBasicMaterial({color:0xffdb82,transparent:true,opacity:.42,depthWrite:false})
  );
  frame.position.copy(target);
  frame.position.y = .12 + piece.target.z*.96 + .035;
  hintRoot.add(frame);
}
function refreshGhost() {
  if(ghost){cityRoot.remove(ghost);discard(ghost);ghost=null;}
  const piece=getSelected();
  if(!piece || mode!=='workshop')return;
  ghost=makePiece(piece,true);
  cityRoot.add(ghost);
  positionGhost();
}
function positionGhost() {
  const piece=getSelected();
  if(!piece || !ghost || mode!=='workshop')return;
  const point=hovered || piece.target;
  const candidate={...point,z:piece.target.z,rotation};
  if(candidate.x<0 || candidate.y<0 || candidate.x>=CITY.width || candidate.y>=CITY.height){ghost.visible=false;return;}
  ghost.visible=true;
  ghost.position.copy(tilePosition(CITY,candidate));
  ghost.rotation.y=THREE.MathUtils.degToRad(rotation);
  const right=Object.keys(piece.target).every(k=>piece.target[k]===candidate[k]);
  ghost.traverse(o=>{if(o.isMesh && o.material?.color)o.material.color.setHex(right?0x82c8a7:0xf1c8a2);});
}

function choose(pieceId) {
  if(state.placed.includes(pieceId))return;
  selected=pieceId;rotation=0;hovered=null;
  refreshHint();refreshGhost();refreshUI();refreshShelf();
}
function turnPiece() {
  if(mode!=='workshop')return;
  rotation=(rotation+90)%360;
  positionGhost();
  refreshUI();
}
function placeAt(cell) {
  const piece=getSelected();
  if(!piece)return notify('All pieces assembled! Enter the neighborhood.');
  const result=tryPlace(pack,state,piece.id,{...cell,z:piece.target.z,rotation});
  if(!result.ok)return notify(result.reason);
  state=result.session;save();refreshPlaced();
  if(result.cityCompleted)notify('THE BLOCK IS ALIVE! Enter your newly built neighborhood.');
  else if(result.buildingCompleted)notify(pack.buildings.find(b=>b.id===piece.buildingId).name+' is complete!');
  else notify('Perfect fit! The city is coming together.');
  audio.tone(result.buildingCompleted?740:550,.045,.25);
  selected=nextUnplaced(pack,state)?.id || null;
  rotation=0;hovered=null;
  refreshHint();refreshGhost();refreshUI();refreshShelf();
}

const shelf = new THREE.Group();
shelf.position.set(-1.14,1.48,-1.32);
scene.add(shelf);
function shelfButton(text, x, y, action, data, active=false) {
  const b=textPlane(text,.62,.16,active?'#446c5b':'#28444c');
  b.position.set(x,y,0);
  b.userData={action,data};
  shelf.add(b);
}
function refreshShelf() {
  discard(shelf);
  shelf.visible=xrActive && mode==='workshop';
  if(!shelf.visible)return;
  shelfButton('PIECE BY PIECE',0,.34,'none',null,true);
  const remaining=pack.pieces.filter(p=>!state.placed.includes(p.id));
  const maxPage=Math.max(0,Math.ceil(remaining.length/5)-1);
  shelfPage=Math.min(shelfPage,maxPage);
  for(const [i,piece] of remaining.slice(shelfPage*5,shelfPage*5+5).entries()) {
    shelfButton(piece.prefab+' · '+piece.buildingId,0,.13-i*.19,'piece',piece.id,piece.id===selected);
  }
  shelfButton('NEXT PIECES',0,-.85,'page',null);
  shelfButton('ROTATE 90°',0,-1.04,'rotate',null);
  shelfButton(audio.enabled?'SOUND OFF':'SOUND ON',0,-1.42,'sound',null);
  if(progress(pack,state).complete)shelfButton('ENTER CITY',0,-1.23,'explore',null);
}
const returnSign=new THREE.Group();
const returnButton=textPlane('RETURN TO WORKSHOP',1.9,.38);
returnButton.userData={action:'workshop'};
returnSign.add(returnButton);
returnSign.position.set(0,2.4,-1.6);
cityRoot.add(returnSign);

function refreshNeighborhood() {
  discard(peopleRoot);
  discard(doorsRoot);
  discard(speechRoot);
  lifeLabels.length=0;
  if(mode!=='explore' || inside)return;
  for(const neighbor of NEIGHBORS){
    if(!buildingComplete(pack,state,neighbor.buildingId))continue;
    const anchor=anchorOf(pack,neighbor.buildingId);
    if(!anchor)continue;
    const avatar=createNeighbor(neighbor);
    avatar.group.position.set(anchor.x-.96,.18,anchor.z+1.96);
    peopleRoot.add(avatar.group);
    lifeLabels.push(avatar.label);
    if(neighbor.buildingId==='garden')continue;
    const marker=createDoorMarker(neighbor.buildingId,neighbor.buildingId==='cafe'?'CAFÉ':'HOME');
    marker.root.position.set(anchor.x+.45,.14,anchor.z+1.55);
    doorsRoot.add(marker.root);
    lifeLabels.push(marker.sign);
  }
}
function presentDialogue(who, text, id=null) {
  activeDialogue={who,text,id};
  $('dialogue-panel').hidden=false;
  $('speaker').textContent=who;
  $('dialogue-text').textContent=text;
  discard(speechRoot);
  if(mode==='explore' && !inside && id){
    const neighbor=getNeighbor(id);
    const anchor=neighbor && anchorOf(pack,neighbor.buildingId);
    if(anchor) {
      const line=textPlane(text.length>74?text.slice(0,71)+'…':text,3.9,.36,'#243f40','#ffedce');
      line.position.set(anchor.x,3.25,anchor.z+2.1);
      speechRoot.add(line);
    }
  }
}
function closeDialogue(){
  activeDialogue=null;
  $('dialogue-panel').hidden=true;
  discard(speechRoot);
}
function speak(id){
  if(mode!=='explore')return;
  if(inside)leaveInterior();
  const outcome=talkToNeighbor(pack,state,id);
  if(outcome.changed){
    state=outcome.session;
    save();
    audio.tone(783.99,.055,.35);
    if(outcome.completedAll)notify('The Living Block is restored! All three neighbors have been helped.');
    else notify(nextErrand(state));
    refreshNeighborhood();
  }
  presentDialogue(outcome.who||'The neighborhood',outcome.text,id);
  refreshUI();
}
function enterInterior(id){
  if(mode!=='explore' || !['cafe','home'].includes(id) || !buildingComplete(pack,state,id))return;
  closeDialogue();
  inside=id;
  discard(interiorRoot);
  const room=createInterior(id);
  interiorRoot.add(room.group);
  cityRoot.visible=false;
  interiorRoot.visible=true;
  if(xrActive)interiorRoot.position.set(0,0,-2.3);
  else {
    interiorRoot.position.set(0,0,0);
    camera.position.set(0,1.65,1.9);
    camera.rotation.set(0,0,0);
  }
  refreshUI();
  notify(id==='cafe'?'Inside Sunbeam Café. A cozy place to rest.':'Inside Bluebell House. Someone has made a beautiful home.');
}
function leaveInterior(){
  if(!inside)return;
  closeDialogue();
  inside=null;
  interiorRoot.visible=false;
  discard(interiorRoot);
  cityRoot.visible=true;
  positionStage();
  refreshNeighborhood();
  refreshUI();
  notify('Back on the street. There is no rush.');
}
function setMode(value) {
  if(value==='explore' && !progress(pack,state).complete) {
    return notify('Complete all 12 pieces before entering the city.');
  }
  mode=value;
  inside=null;
  closeDialogue();
  interiorRoot.visible=false;
  discard(interiorRoot);
  cityRoot.visible=true;
  hovered=null;
  positionStage();
  refreshHint();refreshGhost();refreshNeighborhood();refreshUI();refreshShelf();
  notify(value==='explore'
    ? 'Welcome to The Living Block. Meet Celia, Jules, and Moss.'
    : 'Back to the workshop. No timers, no pressure.');
}
function positionStage() {
  if(xrActive) {
    cityRoot.scale.setScalar(mode==='workshop'?.135:1);
    cityRoot.position.set(0,mode==='workshop'?1.04:0,mode==='workshop'?-1.85:-2);
  } else {
    cityRoot.position.set(0,0,0);
    cityRoot.scale.setScalar(1);
    cityRoot.rotation.y=0;
    if(mode==='workshop') {
      camera.position.set(12,17,17);
      camera.lookAt(0,0,0);
      controls.enabled=true;
      controls.minDistance=9;controls.maxDistance=29;
      controls.target.set(0,0,0);controls.update();
    } else {
      controls.enabled=false;
      camera.position.set(0,1.75,6);
      camera.rotation.order='YXZ';
      camera.rotation.set(0,0,0);
    }
  }
  workbench.visible=xrActive && mode==='workshop';
  ground.visible=!xrActive && mode==='workshop';
  returnSign.visible=mode==='explore' && !inside;
}
function refreshUI() {
  const p=progress(pack,state);
  $('piece-count').textContent=p.placed+' / '+p.total;
  $('fill').style.width=(100*p.placed/p.total)+'%';
  document.querySelector('.progress').setAttribute('aria-valuenow',String(p.placed));
  $('mode-label').textContent=mode==='workshop'?'Workshop · Assemble':'Neighborhood · Explore';
  $('building-list').replaceChildren();
  for(const building of pack.buildings) {
    const count=pack.pieces.filter(piece=>piece.buildingId===building.id && state.placed.includes(piece.id)).length;
    const total=pack.pieces.filter(piece=>piece.buildingId===building.id).length;
    const entry=document.createElement('div');
    entry.className='building';
    const name=document.createElement('span');
    name.textContent=building.name;
    const counter=document.createElement('span');
    counter.textContent=count+'/'+total+(count===total?' ✓':'');
    entry.append(name,counter);$('building-list').append(entry);
  }
  $('piece-tray').replaceChildren();
  for(const piece of pack.pieces) {
    if(state.placed.includes(piece.id))continue;
    const button=document.createElement('button');
    button.className='part'+(piece.id===selected?' selected':'');
    button.type='button';
    button.textContent=piece.prefab+' · '+piece.buildingId;
    button.setAttribute('aria-pressed',String(piece.id===selected));
    button.addEventListener('click',()=>choose(piece.id));
    $('piece-tray').append(button);
  }
  $('selection').textContent=getSelected()?.id.replaceAll('-',' ') || 'All pieces assembled';
  $('rotation').textContent=rotation+'°';
  $('rotate').disabled=mode!=='workshop' || !selected;
  $('enter-city').disabled=!p.complete || mode==='explore';
  $('return-workshop').hidden=mode==='workshop';
  $('exit-interior').hidden=mode!=='explore' || !inside;
  $('enter-city').hidden=mode==='explore';
  $('workshop-panel').hidden=mode!=='workshop';
  $('quest-panel').hidden=mode!=='explore';
  $('quests').replaceChildren();
  $('neighbors').replaceChildren();
  $('next-errand').textContent=nextErrand(state);
  $('carrying').textContent=carrying(state);
  for(const neighbor of NEIGHBORS){
    const item=document.createElement('li');
    const done=state.missions.includes(neighbor.missionId);
    item.textContent=(done?'✓ ':'◇ ')+neighbor.name+' · '+neighbor.role;
    $('quests').append(item);
    const button=document.createElement('button');
    button.type='button';
    button.textContent='Talk to '+neighbor.name+(done?' ✓':'');
    button.disabled=mode!=='explore' || !buildingComplete(pack,state,neighbor.buildingId);
    button.addEventListener('click',()=>speak(neighbor.id));
    $('neighbors').append(button);
  }
  $('mode-label').textContent=inside ? (inside==='cafe'?'Sunbeam Café · Inside':'Bluebell House · Inside')
    : mode==='workshop' ? 'Workshop · Assemble' : 'Neighborhood · Explore';
  $('mode-help').textContent=mode==='workshop'
    ? 'Choose a part. Aim at a highlighted tile, turn with R, and click to snap it into place.'
    : inside
      ? 'Look around this building. Select the exit sign or use Return to street.'
      : 'Meet neighbors, click the entrance signs, or explore with WASD. In VR, point and trigger to teleport.';
}

const raycaster=new THREE.Raycaster();
const pointer=new THREE.Vector2();
function rayFromPointer(event) {
  const rect=renderer.domElement.getBoundingClientRect();
  pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);
  raycaster.setFromCamera(pointer,camera);
  return raycaster;
}
function rayFromController(controller) {
  const p=new THREE.Vector3().setFromMatrixPosition(controller.matrixWorld);
  const q=new THREE.Quaternion().setFromRotationMatrix(controller.matrixWorld);
  const d=new THREE.Vector3(0,0,-1).applyQuaternion(q).normalize();
  raycaster.set(p,d);
  return raycaster;
}
function hitAction(hit) {
  let obj=hit.object;
  while(obj && !obj.userData.action)obj=obj.parent;
  return obj?.userData || null;
}
function teleportTo(root,worldPoint) {
  const viewer=new THREE.Vector3();
  renderer.xr.getCamera().getWorldPosition(viewer);
  const local=root.worldToLocal(worldPoint.clone());
  if(!canTeleport(pack,state,local,inside)){
    notify('Choose a clear patch of ground to teleport.');
    return;
  }
  root.position.x+=viewer.x-worldPoint.x;
  root.position.z+=viewer.z-worldPoint.z;
  audio.tone(440,.025,.14);
}
function snapTurnInPlace(amount) {
  const root=inside?interiorRoot:cityRoot;
  const pivot=new THREE.Vector3();
  renderer.xr.getCamera().getWorldPosition(pivot);
  const horizontal=new THREE.Vector3(root.position.x-pivot.x,0,root.position.z-pivot.z);
  horizontal.applyAxisAngle(new THREE.Vector3(0,1,0),amount);
  root.position.x=pivot.x+horizontal.x;
  root.position.z=pivot.z+horizontal.z;
  root.rotation.y+=amount;
}
function handleRay(ray, controllerUse=false) {
  const targets=inside ? [interiorRoot]
    : [boardPick,...(mode==='explore'?[returnSign,peopleRoot,doorsRoot]:[]),
       ...(xrActive?[shelf]:[])];
  const hits=ray.intersectObjects(targets,true);
  for(const hit of hits) {
    const action=hitAction(hit);
    if(action?.action==='piece')return choose(action.data);
    if(action?.action==='rotate')return turnPiece();
    if(action?.action==='page') {
      shelfPage++;
      if(shelfPage*5>=pack.pieces.filter(p=>!state.placed.includes(p.id)).length)shelfPage=0;
      return refreshShelf();
    }
    if(action?.action==='explore')return setMode('explore');
    if(action?.action==='workshop')return setMode('workshop');
    if(action?.action==='talk')return speak(action.data);
    if(action?.action==='interior')return enterInterior(action.data);
    if(action?.action==='exit-interior')return leaveInterior();
    if(action?.action==='sound')return toggleAudio();
    if(inside) {
      if(xrActive && controllerUse && Math.abs(hit.point.y)<.22)
        return teleportTo(interiorRoot,hit.point);
      return;
    }
    if(hit.object===boardPick) {
      if(mode==='workshop') {
        const local=cityRoot.worldToLocal(hit.point.clone());
        return placeAt(gridCoordinate(CITY,local,getSelected()?.target.z||0,rotation));
      }
      if(xrActive && controllerUse)return teleportTo(cityRoot,hit.point);
      return;
    }
  }
}
function updateGhostFromRay(ray) {
  if(mode!=='workshop'||!selected)return;
  const hit=ray.intersectObject(boardPick,false)[0];
  if(!hit)return;
  hovered=gridCoordinate(CITY,cityRoot.worldToLocal(hit.point.clone()));
  positionGhost();
}
renderer.domElement.addEventListener('pointermove',event=>{
  if(xrActive)return;
  if(mode==='workshop')updateGhostFromRay(rayFromPointer(event));
  else if(event.buttons===2) {
    camera.rotation.y-=event.movementX*.003;
    camera.rotation.x=THREE.MathUtils.clamp(camera.rotation.x-event.movementY*.003,-1.25,1.25);
  }
});
renderer.domElement.addEventListener('contextmenu',event=>event.preventDefault());
renderer.domElement.addEventListener('pointerdown',event=>{
  if(xrActive||event.button!==0)return;
  handleRay(rayFromPointer(event));
});
window.addEventListener('keydown',event=>{
  if(['INPUT','TEXTAREA'].includes(document.activeElement?.tagName))return;
  heldKeys.add(event.code);
  if(event.code==='KeyR' && !event.repeat)turnPiece();
  if(event.code==='Escape' && inside)leaveInterior();
  else if(event.code==='Escape' && mode==='explore')setMode('workshop');
});
window.addEventListener('keyup',event=>heldKeys.delete(event.code));
window.addEventListener('blur',()=>heldKeys.clear());

const xrControllers=[];
for(let i=0;i<2;i++) {
  const controller=renderer.xr.getController(i);
  const lineGeometry=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3(0,0,-2)]);
  const line=new THREE.Line(lineGeometry,new THREE.LineBasicMaterial({color:i?0x8fead4:0xffdba4}));
  controller.add(line);
  controller.addEventListener('selectstart',()=>handleRay(rayFromController(controller),true));
  controller.addEventListener('squeezestart',()=>{
    if(mode==='workshop')turnPiece();
    else {
      snapTurnInPlace(Math.PI/4);
      notify('Turned 45°. Select clear ground to teleport.');
    }
  });
  const grip=renderer.xr.getControllerGrip(i);
  const handle=new THREE.Mesh(new THREE.CylinderGeometry(.035,.04,.15,12),new THREE.MeshStandardMaterial({color:i?0x72baa8:0xd9a86c}));
  handle.rotation.x=Math.PI/2;
  grip.add(handle);
  scene.add(controller,grip);
  xrControllers.push(controller);
}
$('vr-entry').append(VRButton.createButton(renderer,{optionalFeatures:['local-floor','bounded-floor']}));
renderer.xr.addEventListener('sessionstart',()=>{
  xrActive=true;
  controls.enabled=false;
  positionStage();refreshShelf();
  notify('VR ready. Trigger to select/assemble, grip to rotate. Both hands are supported.');
});
renderer.xr.addEventListener('sessionend',()=>{
  xrActive=false;
  positionStage();refreshShelf();
  notify('Desktop view restored. Your progress is saved locally.');
});
$('rotate').addEventListener('click',turnPiece);
$('enter-city').addEventListener('click',()=>setMode('explore'));
$('return-workshop').addEventListener('click',()=>setMode('workshop'));
$('exit-interior').addEventListener('click',leaveInterior);
$('close-dialogue').addEventListener('click',closeDialogue);
async function toggleAudio(){
  const target=!audio.enabled;
  try { await audio.setEnabled(target); }
  catch(error) {notify('Audio unavailable: '+error.message);}
  $('sound-enabled').checked=audio.enabled;
  refreshShelf();
}
$('sound-enabled').addEventListener('change',async event=>{
  try { await audio.setEnabled(event.target.checked); }
  catch(error){notify('Audio unavailable: '+error.message);}
  $('sound-enabled').checked=audio.enabled;
  refreshShelf();
});
$('toggle-hints').addEventListener('change',event=>{hintsOn=event.target.checked;refreshHint();});
$('reset').addEventListener('click',()=>{
  if(!window.confirm('Reset this neighborhood? Your assembled pieces and local quests will be cleared.'))return;
  state=blankSession(pack);save();
  selected=nextUnplaced(pack,state)?.id||null;
  rotation=0;hovered=null;
  refreshPlaced();setMode('workshop');
  notify('Fresh city, fresh start.');
});
window.addEventListener('resize',()=>{
  camera.aspect=window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth,window.innerHeight);
});
function desktopExploreStep(delta) {
  if(xrActive||mode!=='explore')return;
  const forward=new THREE.Vector3();
  camera.getWorldDirection(forward);
  forward.y=0;forward.normalize();
  const side=new THREE.Vector3().crossVectors(forward,new THREE.Vector3(0,1,0)).normalize();
  const motion=new THREE.Vector3();
  if(heldKeys.has('KeyW')||heldKeys.has('ArrowUp'))motion.add(forward);
  if(heldKeys.has('KeyS')||heldKeys.has('ArrowDown'))motion.sub(forward);
  if(heldKeys.has('KeyD'))motion.add(side);
  if(heldKeys.has('KeyA'))motion.sub(side);
  if(motion.lengthSq()) {
    motion.normalize().multiplyScalar(Math.min(delta,.05)*4);
    const next=moveWalkable(pack,state,{x:camera.position.x,z:camera.position.z},{x:motion.x,z:motion.z},inside);
    camera.position.x=next.x;
    camera.position.z=next.z;
  }
}
function animate() {
  const delta=timer.getDelta();
  if(!xrActive && mode==='workshop')controls.update();
  desktopExploreStep(delta);
  if(xrActive && mode==='workshop')updateGhostFromRay(rayFromController(xrControllers[0]));
  audio.tick(delta,mode==='explore');
  const facing=renderer.xr.isPresenting?renderer.xr.getCamera().quaternion:camera.quaternion;
  for(const label of lifeLabels)label.quaternion.copy(facing);
  for(const label of speechRoot.children)label.quaternion.copy(facing);
  renderer.render(scene,camera);
}
refreshPlaced();positionStage();refreshHint();refreshGhost();refreshNeighborhood();refreshUI();refreshShelf();
notify('Welcome to the workshop. Assemble the first block, one piece at a time.');
renderer.setAnimationLoop(animate);
