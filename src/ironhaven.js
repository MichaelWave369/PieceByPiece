import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {VRButton} from 'three/addons/webxr/VRButton.js';
import pack from '../game/campaign/ironhaven-commons-rail.json';
import gardenPack from '../game/campaign/verdantia-skygarden.json';
import {blankSession,restoreSession,nextUnplaced,tryPlace,progress,buildingComplete} from './core/puzzle.mjs';
import {IRON_SAVE_KEY,IRON_RAIL_SAVE_KEY,readIronAccess} from './core/campaign.mjs';
import {IRONHAVEN_CREW as HARBOR_KEEPERS,speakIronCrew as interactKeeper,nextIronTask as nextHarborTask} from './core/ironhaven.mjs';
import {ironMove as harborMove,ironAnchor as harborAnchor,ironTeleport} from './core/iron-nav.mjs';
import {RAIL_JUNCTIONS,blankRail,restoreRail,junctionReady,railStatus,setRailRoute} from './core/rail-routing.mjs';
import {makePiece,tilePosition,gridCoordinate,textPlane} from './render/prefabs.js';
import {createNeighbor,createSpeechPanel} from './render/life.js';
import {createIronScenery as createHarborScenery,createIronBuilding as createHarborBuilding,placeIronBuilding as placeHarborBuilding} from './render/ironhaven.js';
import './harbor.css';

const $=id=>document.getElementById(id);
const city=pack.city.grid;
const canPlay=readIronAccess(localStorage,gardenPack).unlocked;
$('harbor-locked').hidden=canPlay;
const stored=()=>{
 try{return restoreSession(pack,JSON.parse(localStorage.getItem(IRON_SAVE_KEY)));}
 catch{return blankSession(pack);}
};
let state=stored(),mode='workshop',selected=nextUnplaced(pack,state)?.id||null;
let rotation=0,hover=null,showGuide=true,xrActive=false,shelfPage=0;
const held=new Set();
const clock=new THREE.Clock();
let conversation=null;
const feedback=message=>{
 $('harbor-message').textContent=message;
 $('harbor-live').textContent=message;
};
function save(){
 if(!canPlay)return;
 try{localStorage.setItem(IRON_SAVE_KEY,JSON.stringify(state));}
 catch{feedback('This browser could not save progress. It will last only this session.');}
}
function loadRail(){
 try{return restoreRail(pack,JSON.parse(localStorage.getItem(IRON_RAIL_SAVE_KEY)));}
 catch{return blankRail(pack);}
}
let rail=loadRail();
let railView=railStatus(pack,state,rail);
function saveRail(){
 if(!canPlay)return;
 try{localStorage.setItem(IRON_RAIL_SAVE_KEY,JSON.stringify(rail));}
 catch{feedback('Rail junctions could not be saved locally.');}
}
const scene=new THREE.Scene();
scene.background=new THREE.Color(0xaabdc1);
scene.fog=new THREE.Fog(0xaabdc1,30,75);
const camera=new THREE.PerspectiveCamera(62,innerWidth/innerHeight,.045,165);
camera.position.set(14,18,18);
camera.lookAt(0,0,0);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.55));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.xr.enabled=true;
renderer.xr.setReferenceSpaceType('local-floor');
$('harbor-stage').append(renderer.domElement);
const controls=new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true;controls.maxPolarAngle=Math.PI*.495;
controls.minDistance=9;controls.maxDistance=34;
scene.add(new THREE.HemisphereLight(0xeafaff,0x91afa5,2.75));
const sun=new THREE.DirectionalLight(0xffead2,2.85);
sun.position.set(-8,18,12);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);
sun.shadow.camera.left=-26;sun.shadow.camera.right=26;
sun.shadow.camera.top=26;sun.shadow.camera.bottom=-26;
scene.add(sun);

const world=new THREE.Group();scene.add(world);
const scenery=createHarborScenery(pack);
world.add(scenery.group);
const placedRoot=new THREE.Group(),fullRoot=new THREE.Group(),ghostRoot=new THREE.Group();
const markerRoot=new THREE.Group(),speechRoot=new THREE.Group(),hintRoot=new THREE.Group();
world.add(placedRoot,fullRoot,ghostRoot,markerRoot,speechRoot,hintRoot);
const picking=new THREE.Mesh(
 new THREE.PlaneGeometry(city.width*1.12,city.height*1.12),
 new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide}));
picking.rotation.x=-Math.PI/2;picking.position.y=.105;world.add(picking);
const boardGrid=new THREE.GridHelper(city.width*1.12,city.width,0xfce9c6,0xbad8d0);
boardGrid.position.y=.11;world.add(boardGrid);

const table=new THREE.Group();
const tabletop=new THREE.Mesh(new THREE.CylinderGeometry(1.38,1.42,.12,64),
  new THREE.MeshStandardMaterial({color:0x967b62,roughness:.83}));
tabletop.position.set(0,.91,-1.8);table.add(tabletop);
const leg=new THREE.Mesh(new THREE.CylinderGeometry(.12,.18,.82,12),
  new THREE.MeshStandardMaterial({color:0x715947}));
leg.position.set(0,.45,-1.8);table.add(leg);
scene.add(table);
const ray=new THREE.Raycaster(),cursor=new THREE.Vector2();
const controlRays=[];
const markerLabels=[];
const shelf=new THREE.Group();shelf.position.set(-1.07,1.64,-1.25);scene.add(shelf);
const returnText=textPlane('RETURN TO WORKSHOP',2.2,.41);
returnText.userData={action:'return'};
returnText.position.set(-1.2,2.7,4.8);world.add(returnText);
const atlasText=textPlane('DISTRICT ATLAS',2.0,.41);
atlasText.userData={action:'atlas'};
atlasText.position.set(1.2,2.7,4.8);world.add(atlasText);
const citadelSign=textPlane('NEXT: CITADEL',2.25,.40);
citadelSign.userData={action:'citadel'};
citadelSign.position.set(0,2.40,3.65);world.add(citadelSign);
let ghost=null;
function clear(root){root.clear();}
function chosen(){return pack.pieces.find(p=>p.id===selected)||null;}
function redrawBuildings(){
 clear(placedRoot);clear(fullRoot);
 for(const building of pack.buildings){
  if(buildingComplete(pack,state,building.id)){
   const model=createHarborBuilding(building.id);
   placeHarborBuilding(model,pack,building.id);
   fullRoot.add(model);
  }
 }
 for(const piece of pack.pieces){
  if(!state.placed.includes(piece.id)||buildingComplete(pack,state,piece.buildingId))continue;
  const model=makePiece(piece);
  model.position.copy(tilePosition(city,piece.target));
  model.rotation.y=THREE.MathUtils.degToRad(piece.target.rotation);
  placedRoot.add(model);
 }
}
function redrawGhost(){
 clear(ghostRoot);clear(hintRoot);ghost=null;
 if(mode!=='workshop'||!canPlay)return;
 const piece=chosen();if(!piece)return;
 ghost=makePiece(piece,true);ghostRoot.add(ghost);
 if(showGuide){
  const target=tilePosition(city,piece.target);
  const footprint=new THREE.Mesh(new THREE.BoxGeometry(1.04,.025,1.04),
   new THREE.MeshBasicMaterial({color:0xffe7b2,transparent:true,opacity:.72}));
  footprint.position.set(target.x,.17+piece.target.z*.96,target.z);
  hintRoot.add(footprint);
 }
 moveGhost();
}
function moveGhost(){
 if(!ghost)return;
 const piece=chosen(),where=hover||piece.target;
 if(where.x<0||where.y<0||where.x>=city.width||where.y>=city.height){ghost.visible=false;return;}
 ghost.visible=true;
 ghost.position.copy(tilePosition(city,{...where,z:piece.target.z}));
 ghost.rotation.y=THREE.MathUtils.degToRad(rotation);
 const match=piece.target.x===where.x&&piece.target.y===where.y&&piece.target.rotation===rotation;
 ghost.traverse(o=>{
  if(o.isMesh&&o.material?.color)o.material.color.setHex(match?0x86d4b6:0xf2bb95);
 });
}
function select(id){
 if(mode!=='workshop'||state.placed.includes(id))return;
 selected=id;rotation=0;hover=null;redrawGhost();refreshUI();refreshShelf();
}
function rotate(){
 if(mode!=='workshop')return;
 rotation=(rotation+90)%360;moveGhost();refreshUI();
}
function place(cell){
 if(!canPlay||mode!=='workshop')return;
 const piece=chosen();if(!piece)return;
 const result=tryPlace(pack,state,piece.id,{...cell,z:piece.target.z,rotation});
 if(!result.ok)return feedback(result.reason);
 state=result.session;save();
 selected=nextUnplaced(pack,state)?.id||null;
 rotation=0;hover=null;
 redrawBuildings();redrawGhost();refreshUI();refreshShelf();
 feedback(result.cityCompleted?'IRONHAVEN IS REBUILT! Enter the city and reconnect the Commons Rail.'
   :result.buildingCompleted?'Another community workshop is restored!':'Perfect fit. The factory city is coming together.');
}
function assisted(){
 if(!$('harbor-assist').checked||mode!=='workshop')return;
 const piece=chosen();if(!piece)return;
 rotation=piece.target.rotation;
 place(piece.target);
}
function closeSpeech(){conversation=null;clear(speechRoot);$('harbor-dialogue').hidden=true;}
function speak(id){
 if(!canPlay||mode!=='explore')return;
 const outcome=interactKeeper(pack,state,id);
 if(outcome.changed){
  state=outcome.session;save();
  refreshRail();
  refreshUI();
 }
 conversation=outcome;
 $('harbor-speaker').textContent=outcome.who;
 $('harbor-dialogue-text').textContent=outcome.text;
 $('harbor-dialogue').hidden=false;
 clear(speechRoot);
 const keeper=HARBOR_KEEPERS.find(n=>n.id===id);
 const origin=keeper?harborAnchor(pack,keeper.buildingId):null;
 if(origin){
  const panel=createSpeechPanel(outcome.who,outcome.text);
  panel.position.set(origin.x,3.50,origin.z+2.0);
  speechRoot.add(panel);markerLabels.push(panel);
 }
 feedback(outcome.changed?nextHarborTask(state):outcome.text);
}
function redrawKeepers(){
 clear(markerRoot);markerLabels.length=0;
 if(mode!=='explore')return;
 for(const [i,keeper] of HARBOR_KEEPERS.entries()){
  const anchor=harborAnchor(pack,keeper.buildingId);
  if(!anchor)continue;
  const actor=createNeighbor({...keeper,color:[0xe0a181,0x73aeb5,0x91a66d][i]});
  actor.group.position.set(anchor.x-1.25,.21,anchor.z+1.65);
  markerRoot.add(actor.group);markerLabels.push(actor.label);
 }
}
function updateMode(next){
 if(next==='explore'&&!progress(pack,state).complete)return feedback('Finish Ironhaven’s 12 pieces before entering the city.');
 mode=next;closeSpeech();
 const desktop=!xrActive;
 world.scale.setScalar(xrActive&&mode==='workshop'?.145:1);
 world.position.set(0,xrActive&&mode==='workshop'?1.13:0,xrActive?(mode==='workshop'?-1.82:-2.0):0);
 table.visible=xrActive&&mode==='workshop';
 boardGrid.visible=mode==='workshop';
 returnText.visible=mode==='explore';atlasText.visible=mode==='explore';
 refreshRail();
 if(desktop){
  controls.enabled=mode==='workshop';
  if(mode==='workshop'){
   camera.position.set(14,18,18);controls.target.set(0,0,0);controls.update();
  }else{
   camera.position.set(0,1.68,-1.8);camera.rotation.order='YXZ';camera.rotation.set(0,0,0);
  }
 }
 redrawGhost();redrawKeepers();refreshShelf();refreshUI();
 feedback(mode==='explore'?'Welcome to Ironhaven. Find Rook at the Salvage Workshop first.':'Welcome back to the calm architect’s table.');
}
function refreshShelf(){
 clear(shelf);
 shelf.visible=xrActive&&mode==='workshop';
 if(!shelf.visible)return;
 const add=(title,y,action,data)=>{
  const m=textPlane(title,.78,.17);
  m.position.set(0,y,0);m.userData={action,data};shelf.add(m);
 };
 add('IRONHAVEN',.25,'none',null);
 const unplaced=pack.pieces.filter(p=>!state.placed.includes(p.id));
 const pageCount=Math.max(1,Math.ceil(unplaced.length/5));
 shelfPage=Math.min(shelfPage,pageCount-1);
 for(const [i,piece] of unplaced.slice(shelfPage*5,shelfPage*5+5).entries())
  add(piece.prefab+' · '+piece.buildingId,.05-i*.19,'piece',piece.id);
 add('NEXT PIECES',-.96,'page',null);
 add('ROTATE 90°',-1.16,'rotate',null);
 if(progress(pack,state).complete)add('ENTER HARBOR',-1.36,'explore',null);
}
function refreshRail(){
 railView=railStatus(pack,state,rail);
 scenery.apply(railView);
 scenery.railGroup.visible=mode==='explore';
 scenery.freightYard.visible=mode==='explore';
 scenery.gate.visible=mode==='explore';
 scenery.train.visible=mode==='explore'&&railView.delivered;
 citadelSign.visible=mode==='explore'&&railView.delivered;
 $('citadel-next').hidden=mode!=='explore'||!railView.delivered;
 $('iron-rail-count').textContent=railView.publicSegments+' / '+railView.totalSegments;
 $('iron-rail-result').textContent=railView.delivered
  ? 'Public supplies delivered. The Commons Freight Yard stays open.'
  : 'Route each junction toward COMMONS after helping its crew.';
 $('iron-rail-controls').replaceChildren();
 for(const junction of RAIL_JUNCTIONS){
  const aligned=rail.routes[junction.id]==='commons';
  const button=document.createElement('button');button.type='button';
  button.textContent=(aligned?'● ':'○ ')+junction.label+' → '+(aligned?'COMMONS':'CORPORATE');
  button.disabled=mode!=='explore'||!junctionReady(pack,state,junction);
  button.setAttribute('aria-pressed',String(aligned));
  button.addEventListener('click',()=>toggleRail(junction.id));
  $('iron-rail-controls').append(button);
 }
}
function toggleRail(id){
 if(!canPlay||mode!=='explore')return;
 const route=rail.routes[id]==='commons'?'corporate':'commons';
 const result=setRailRoute(pack,state,rail,id,route);
 if(!result.ok)return feedback(result.reason);
 rail=result.state;saveRail();
 refreshRail();feedback(result.reason);
}
function refreshUI(){
 const p=progress(pack,state);
 $('harbor-count').textContent=p.placed+' / '+p.total;
 $('harbor-fill').style.width=100*p.placed/p.total+'%';
 document.querySelector('.harbor-progress').setAttribute('aria-valuenow',p.placed);
 $('harbor-mode').textContent=mode==='workshop'?'Architect’s Table':'Ironhaven · Commons Rail';
 $('harbor-workshop').hidden=mode!=='workshop';
 $('harbor-explore').hidden=mode!=='explore';
 $('harbor-enter').hidden=mode!=='workshop';
 $('harbor-enter').disabled=!canPlay||!p.complete;
 $('harbor-return').hidden=mode!=='explore';
 $('harbor-rotation').textContent=rotation+'°';
 $('harbor-rotate').disabled=!selected;
 $('harbor-fit').disabled=!canPlay||!selected||!$('harbor-assist').checked;
 $('harbor-buildings').replaceChildren();
 for(const building of pack.buildings){
  const count=pack.pieces.filter(p=>p.buildingId===building.id&&state.placed.includes(p.id)).length;
  const total=pack.pieces.filter(p=>p.buildingId===building.id).length;
  const item=document.createElement('div');item.className='harbor-building';
  const name=document.createElement('span');name.textContent=building.name;
  const number=document.createElement('span');number.textContent=count+'/'+total+(count===total?' ✓':'');
  item.append(name,number);$('harbor-buildings').append(item);
 }
 $('harbor-tray').replaceChildren();
 for(const piece of pack.pieces.filter(p=>!state.placed.includes(p.id))){
  const b=document.createElement('button');b.type='button';
  b.className=piece.id===selected?'selected':'';
  b.textContent=piece.prefab+' · '+piece.buildingId;
  b.setAttribute('aria-pressed',String(piece.id===selected));
  b.addEventListener('click',()=>select(piece.id));
  $('harbor-tray').append(b);
 }
 $('harbor-next-task').textContent=nextHarborTask(state);
 $('harbor-keepers').replaceChildren();
 $('harbor-quests').replaceChildren();
 for(const keeper of HARBOR_KEEPERS){
  const done=state.missions.includes(keeper.missionId);
  const li=document.createElement('li');li.textContent=(done?'✓ ':'○ ')+keeper.name+' · '+keeper.role;
  $('harbor-quests').append(li);
  const button=document.createElement('button');button.type='button';
  button.textContent='Talk to '+keeper.name+(done?' ✓':'');
  button.addEventListener('click',()=>speak(keeper.id));$('harbor-keepers').append(button);
 }
}
function pointerRay(e){
 const rect=renderer.domElement.getBoundingClientRect();
 cursor.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);
 ray.setFromCamera(cursor,camera);return ray;
}
function controllerRay(controller){
 const position=new THREE.Vector3().setFromMatrixPosition(controller.matrixWorld);
 const direction=new THREE.Vector3(0,0,-1);
 const orientation=new THREE.Quaternion().setFromRotationMatrix(controller.matrixWorld);
 ray.set(position,direction.applyQuaternion(orientation).normalize());return ray;
}
function actionFrom(object){
 let node=object;
 while(node&&!node.userData.action)node=node.parent;
 return node?.userData||null;
}
function teleport(worldPoint){
 const local=world.worldToLocal(worldPoint.clone());
 if(!ironTeleport(pack,state,local,railView.gateOpen)){
  feedback('Pick a clear spot. The Commons Freight Yard unlocks after routing all three public junctions.');
  return;
 }
 const viewer=new THREE.Vector3();renderer.xr.getCamera().getWorldPosition(viewer);
 world.position.x+=viewer.x-worldPoint.x;
 world.position.z+=viewer.z-worldPoint.z;
 world.position.y=0;
}
function rayAction(r,fromXR=false){
 const targets=[picking,...(mode==='explore'?[scenery.railGroup,markerRoot,returnText,atlasText,citadelSign,speechRoot]:[]),...(xrActive?[shelf]:[])];
 const hits=r.intersectObjects(targets,true);
 for(const hit of hits){
  const action=actionFrom(hit.object);
  if(action?.action==='piece')return select(action.data);
  if(action?.action==='rotate')return rotate();
  if(action?.action==='page'){
    const remaining=pack.pieces.filter(p=>!state.placed.includes(p.id)).length;
    shelfPage=(shelfPage+1)%Math.max(1,Math.ceil(remaining/5));
    refreshShelf();return;
   }
  if(action?.action==='explore')return updateMode('explore');
  if(action?.action==='return')return updateMode('workshop');
  if(action?.action==='atlas')return window.location.assign('./districts.html');
  if(action?.action==='citadel'&&railView.delivered)return window.location.assign('./citadel.html');
  if(action?.action==='talk')return speak(action.data);
  if(action?.action==='rail')return toggleRail(action.data);
  if(action?.action==='close-dialogue')return closeSpeech();

  if(hit.object===picking){
   const local=world.worldToLocal(hit.point.clone());
   if(mode==='workshop')return place(gridCoordinate(city,local,chosen()?.target.z||0,rotation));
   if(fromXR)return teleport(hit.point);
  }
 }
}
function updatePointerGhost(r){
 if(mode!=='workshop'||!ghost)return;
 const hit=r.intersectObject(picking)[0];
 if(!hit)return;
 hover=gridCoordinate(city,world.worldToLocal(hit.point.clone()));
 moveGhost();
}
renderer.domElement.addEventListener('pointermove',e=>{
 if(xrActive)return;
 if(mode==='workshop')updatePointerGhost(pointerRay(e));
 else if(e.buttons===2){
  camera.rotation.y-=e.movementX*.003;
  camera.rotation.x=THREE.MathUtils.clamp(camera.rotation.x-e.movementY*.003,-1.2,1.2);
 }
});
renderer.domElement.addEventListener('pointerdown',e=>{
 if(!canPlay||xrActive||e.button!==0)return;rayAction(pointerRay(e));
});
renderer.domElement.addEventListener('contextmenu',e=>e.preventDefault());
window.addEventListener('keydown',e=>{
 if(['INPUT','TEXTAREA'].includes(document.activeElement?.tagName))return;
 held.add(e.code);
 if(e.code==='KeyR'&&!e.repeat)rotate();
 if(e.code==='Escape'&&mode==='explore')updateMode('workshop');
});
window.addEventListener('keyup',e=>held.delete(e.code));
window.addEventListener('blur',()=>held.clear());
const controllers=[];
if(canPlay){
 for(let i=0;i<2;i++){
  const controller=renderer.xr.getController(i);
  const laser=new THREE.Line(
   new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3(0,0,-2.3)]),
   new THREE.LineBasicMaterial({color:i?0x8be4d0:0xffd6a1}));
  controller.add(laser);
  controller.addEventListener('selectstart',()=>rayAction(controllerRay(controller),true));
  controller.addEventListener('squeezestart',()=>{
   if(mode==='workshop')rotate();
   else{
    const pivot=new THREE.Vector3();renderer.xr.getCamera().getWorldPosition(pivot);
    const diff=world.position.clone().sub(pivot);diff.y=0;
    diff.applyAxisAngle(new THREE.Vector3(0,1,0),Math.PI/4);
    world.position.x=pivot.x+diff.x;world.position.z=pivot.z+diff.z;
    world.rotation.y+=Math.PI/4;
   }
  });
  const grip=renderer.xr.getControllerGrip(i);
  const model=new THREE.Mesh(new THREE.CylinderGeometry(.035,.04,.14,12),
   new THREE.MeshStandardMaterial({color:i?0x78c4be:0xe3b17e}));
  model.rotation.x=Math.PI/2;grip.add(model);scene.add(controller,grip);
  controllers.push(controller);
 }
 $('harbor-vr').append(VRButton.createButton(renderer,{optionalFeatures:['local-floor','bounded-floor']}));
}
renderer.xr.addEventListener('sessionstart',()=>{
 xrActive=true;controls.enabled=false;updateMode(mode);
 feedback('Quest VR is ready. Both triggers select; grip rotates parts or snap-turns.');
});
renderer.xr.addEventListener('sessionend',()=>{
 xrActive=false;world.rotation.y=0;updateMode(mode);
 feedback('Back to the desktop view. Your Ironhaven progress remains saved.');
});
$('harbor-rotate').addEventListener('click',rotate);
$('harbor-guide').addEventListener('change',e=>{showGuide=e.target.checked;redrawGhost();});
$('harbor-assist').addEventListener('change',refreshUI);
$('harbor-fit').addEventListener('click',assisted);
$('harbor-enter').addEventListener('click',()=>updateMode('explore'));
$('harbor-return').addEventListener('click',()=>updateMode('workshop'));
$('harbor-close-dialogue').addEventListener('click',closeSpeech);
$('harbor-reset').addEventListener('click',()=>{
 if(!canPlay||!confirm('Reset Ironhaven only? Previous cities will stay intact.'))return;
 state=blankSession(pack);save();rail=blankRail(pack);saveRail();selected=nextUnplaced(pack,state)?.id||null;
 rotation=0;hover=null;redrawBuildings();updateMode('workshop');
 feedback('The Ironhaven workshop is ready for a fresh start.');
});
window.addEventListener('resize',()=>{
 camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
 renderer.setSize(innerWidth,innerHeight);
});
function desktopMove(dt){
 if(xrActive||mode!=='explore')return;
 const forward=new THREE.Vector3();
 camera.getWorldDirection(forward);forward.y=0;forward.normalize();
 const right=new THREE.Vector3().crossVectors(forward,new THREE.Vector3(0,1,0)).normalize();
 const step=new THREE.Vector3();
 if(held.has('KeyW')||held.has('ArrowUp'))step.add(forward);
 if(held.has('KeyS')||held.has('ArrowDown'))step.sub(forward);
 if(held.has('KeyD'))step.add(right);
 if(held.has('KeyA'))step.sub(right);
 if(step.lengthSq()){
  step.normalize().multiplyScalar(Math.min(dt,.05)*4);
  const safe=harborMove(pack,state,{x:camera.position.x,z:camera.position.z},{x:step.x,z:step.z},railView.gateOpen);
  camera.position.x=safe.x;camera.position.z=safe.z;
  camera.position.y=1.68;
 }
}
function render(){
 const dt=clock.getDelta();
 if(mode==='workshop'&&!xrActive)controls.update();
 desktopMove(dt);
 if(xrActive&&mode==='workshop'&&controllers[0])updatePointerGhost(controllerRay(controllers[0]));
 const facing=renderer.xr.isPresenting?renderer.xr.getCamera().quaternion:camera.quaternion;
 for(const label of markerLabels)label.quaternion.copy(facing);
 for(const label of speechRoot.children)label.quaternion.copy(facing);
 returnText.quaternion.copy(facing);atlasText.quaternion.copy(facing);
  citadelSign.quaternion.copy(facing);
  for(const label of scenery.labels)label.quaternion.copy(facing);
  scenery.tick(dt,mode==='explore',window.matchMedia('(prefers-reduced-motion: reduce)').matches||xrActive);
 renderer.render(scene,camera);
}
redrawBuildings();
updateMode('workshop');
$('harbor-locked').hidden=canPlay;
renderer.setAnimationLoop(render);
