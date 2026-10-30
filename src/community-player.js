import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {VRButton} from 'three/addons/webxr/VRButton.js';
import {checkCatalogue,catalogueEntry,verifyReviewedPack,validateLocalPackBytes,communitySaveKey,CATALOGUE_CACHE_KEY} from './core/community-catalogue.mjs';
import {blankSession,restoreSession,tryPlace,completeMission,nextUnplaced,progress,buildingComplete} from './core/puzzle.mjs';
import {MAX_PACK_BYTES} from './core/community-validator.mjs';
import {makePiece,tilePosition,gridCoordinate,CELL} from './render/prefabs.js';
import './community-library.css';

const $=id=>document.getElementById(id);
const base=import.meta.env.BASE_URL;
let pack=null,session=null,selected=null,revision=null,sourceLabel='',ready=false;
let renderer,scene,camera,controls,world,piecesRoot,guideRoot,floor,grid,picker,ray,clock;
let isXR=false;
const cursor=new THREE.Vector2();
function report(message,error=false){
 $('player-status').textContent=message;
 $('player-status').dataset.error=String(error);
 $('player-message').textContent=message;
}
function recoverManifest(){
 try{
  const raw=localStorage.getItem(CATALOGUE_CACHE_KEY);
  return raw?checkCatalogue(JSON.parse(raw)):null;
 }catch{return null;}
}
async function reviewedManifest(){
 try{
  const response=await fetch(base+'community/catalogue.json',{cache:'no-cache'});
  if(!response.ok)throw new Error('No catalogue response');
  const bytes=await response.arrayBuffer();
  if(bytes.byteLength>256*1024)throw new Error('Catalogue too large');
  const manifest=checkCatalogue(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes)));
  try{localStorage.setItem(CATALOGUE_CACHE_KEY,JSON.stringify(manifest));}catch{}
  return manifest;
 }catch{
  return recoverManifest();
 }
}
async function getReviewedPack(id){
 const manifest=await reviewedManifest();
 if(!manifest)throw new Error('Reviewed catalogue unavailable. You can still play a local JSON file.');
 const entry=catalogueEntry(manifest,id);
 if(!entry)throw new Error('City is not in the reviewed catalogue');
 // "file" is restricted by checkCatalogue to a local known-format path.
 let data=null;
 try{
  const response=await fetch(base+entry.file,{cache:'no-cache'});
  if(!response.ok)throw new Error('Reviewed pack file is unavailable');
  if(Number(response.headers.get('content-length'))>MAX_PACK_BYTES)throw new Error('Pack exceeds size budget');
  data=new Uint8Array(await response.arrayBuffer());
 }catch(error){
  try{
   const raw=localStorage.getItem('piece-by-piece:commons:cached:'+entry.id+':'+entry.sha256);
   if(raw)data=new TextEncoder().encode(raw);
  }catch{}
  if(!data)throw error;
 }
 const validated=await verifyReviewedPack(entry,data);
 try{
  localStorage.setItem('piece-by-piece:commons:cached:'+entry.id+':'+entry.sha256,
   new TextDecoder('utf-8',{fatal:true}).decode(data));
 }catch{}
 return {pack:validated,revision:entry.sha256,source:'REVIEWED · '+entry.license};
}
async function shaBytes(bytes){
 const digest=await crypto.subtle.digest('SHA-256',bytes);
 return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
function persist(){
 if(!pack||!revision)return;
 try{localStorage.setItem(communitySaveKey(pack,revision),JSON.stringify(session));}
 catch{report('Browser storage is full. Progress will remain in this session only.',true);}
}
function load(packData,sha,source){
 pack=packData;revision=sha;sourceLabel=source;
 let saved=null;
 try{saved=JSON.parse(localStorage.getItem(communitySaveKey(pack,revision)));}catch{}
 session=restoreSession(pack,saved);
 selected=nextUnplaced(pack,session)?.id||null;
 $('player-main').hidden=false;
 $('play-title').textContent=pack.metadata.title;
 $('play-byline').textContent='By '+pack.metadata.creator+' · '+sourceLabel;
 $('player-city-story').textContent=pack.metadata.description;
 if(!ready)initScene();
 draw();refreshUI();
 report('City ready. Choose a piece and click its correct tile and rotation.');
}
function initScene(){
 ready=true;
 const mount=$('player-scene');
 scene=new THREE.Scene();scene.background=new THREE.Color(0xc3e0d7);
 camera=new THREE.PerspectiveCamera(58,1,.04,120);camera.position.set(9,12,11);
 renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));
 renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.xr.enabled=true;renderer.xr.setReferenceSpaceType('local-floor');
 renderer.shadowMap.enabled=true;mount.append(renderer.domElement);
 scene.add(new THREE.HemisphereLight(0xffffff,0x849991,2.7));
 const sunlight=new THREE.DirectionalLight(0xffeed6,2.9);sunlight.position.set(-7,15,12);
 sunlight.castShadow=true;sunlight.shadow.mapSize.set(1024,1024);scene.add(sunlight);
 world=new THREE.Group();scene.add(world);
 piecesRoot=new THREE.Group();guideRoot=new THREE.Group();world.add(piecesRoot,guideRoot);
 controls=new OrbitControls(camera,renderer.domElement);
 controls.enableDamping=true;controls.minDistance=7;controls.maxDistance=38;controls.maxPolarAngle=1.48;
 ray=new THREE.Raycaster();
 const cast=()=>{
  if(!pack||!selected||!picker)return;
  const hit=ray.intersectObject(picker)[0];if(!hit)return;
  const local=world.worldToLocal(hit.point.clone());
  const part=pack.pieces.find(p=>p.id===selected);
  if(!part)return;
  const candidate=gridCoordinate(pack.city.grid,local,part.target.z,Number($('player-rotation').value));
  place(candidate);
 };
 let down=null;
 renderer.domElement.addEventListener('pointerdown',event=>{
  down={x:event.clientX,y:event.clientY,button:event.button};
 });
 renderer.domElement.addEventListener('pointerup',event=>{
  if(!down||down.button!==0||event.button!==0)return;
  const distance=Math.hypot(event.clientX-down.x,event.clientY-down.y);down=null;
  if(distance>6||isXR)return;
  const rect=renderer.domElement.getBoundingClientRect();
  cursor.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);
  ray.setFromCamera(cursor,camera);cast();
 });
 for(const index of [0,1]){
  const controller=renderer.xr.getController(index);
  const laser=new THREE.Line(
   new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3(0,0,-2)]),
   new THREE.LineBasicMaterial({color:index?0x7fe8d5:0xffdda1}));
  controller.add(laser);scene.add(controller);
  controller.addEventListener('selectstart',()=>{
   const origin=new THREE.Vector3().setFromMatrixPosition(controller.matrixWorld);
   const direction=new THREE.Vector3(0,0,-1).applyQuaternion(
    new THREE.Quaternion().setFromRotationMatrix(controller.matrixWorld)).normalize();
   ray.set(origin,direction);cast();
  });
 }
 $('community-vr').append(VRButton.createButton(renderer,{optionalFeatures:['local-floor','bounded-floor']}));
 renderer.xr.addEventListener('sessionstart',()=>{
  isXR=true;controls.enabled=false;world.scale.setScalar(.15);world.position.set(0,1.1,-1.75);
  report('Quest tabletop ready. Select a piece and rotation in the 2D panel before entering XR.');
 });
 renderer.xr.addEventListener('sessionend',()=>{
  isXR=false;controls.enabled=true;world.scale.setScalar(1);world.position.set(0,0,0);
  report('Back in the desktop tabletop. Local progress remains saved.');
 });
 const resize=()=>{
  const w=mount.clientWidth||720,h=mount.clientHeight||580;
  camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);
 };
 window.addEventListener('resize',resize);
 if(typeof ResizeObserver!=='undefined')new ResizeObserver(resize).observe(mount);
 resize();clock=new THREE.Clock();
 renderer.setAnimationLoop(()=>{clock.getDelta();if(!isXR)controls.update();renderer.render(scene,camera);});
}
function release(root){
 root.traverse(obj=>{
  if(obj.isMesh){obj.geometry?.dispose();if(Array.isArray(obj.material))obj.material.forEach(m=>m.dispose());
    else obj.material?.dispose();}
 });
 root.clear();
}
function draw(){
 if(!ready||!pack)return;
 release(piecesRoot);release(guideRoot);
 if(grid){world.remove(grid);grid.geometry.dispose();
  if(Array.isArray(grid.material))grid.material.forEach(m=>m.dispose());else grid.material.dispose();}
 if(floor){world.remove(floor);floor.geometry.dispose();floor.material.dispose();}
 if(picker){world.remove(picker);picker.geometry.dispose();picker.material.dispose();}
 const colors={village:0xc4dfc1,harbor:0xaed9db,garden:0xc1dcaf,industrial:0xb4c6c8,neon:0xbab5d2};
 const bg=colors[pack.city.theme]||0xc4dfc1;
 scene.background=new THREE.Color(bg).lerp(new THREE.Color(0xffffff),.28);
 const w=pack.city.grid.width*CELL,h=pack.city.grid.height*CELL;
 floor=new THREE.Mesh(new THREE.PlaneGeometry(w,h),
  new THREE.MeshStandardMaterial({color:bg,roughness:.88}));
 floor.rotation.x=-Math.PI/2;floor.position.y=.045;world.add(floor);
 grid=new THREE.GridHelper(w,pack.city.grid.width,0x5a8582,0x8bb5aa);
 grid.position.y=.085;world.add(grid);
 picker=new THREE.Mesh(new THREE.PlaneGeometry(w,h),
  new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide}));
 picker.rotation.x=-Math.PI/2;picker.position.y=.12;world.add(picker);
 for(const part of pack.pieces){
  if(!session.placed.includes(part.id))continue;
  const shape=makePiece(part);shape.position.copy(tilePosition(pack.city.grid,part.target));
  shape.rotation.y=THREE.MathUtils.degToRad(part.target.rotation);piecesRoot.add(shape);
 }
 const selectedPiece=pack.pieces.find(p=>p.id===selected&&!session.placed.includes(p.id));
 if(selectedPiece){
  const square=new THREE.Mesh(new THREE.BoxGeometry(1.11,.04,1.11),
   new THREE.MeshBasicMaterial({color:0xffd092,transparent:true,opacity:.78,depthWrite:false}));
  square.position.copy(tilePosition(pack.city.grid,selectedPiece.target));
  square.position.y+=.06;guideRoot.add(square);
  const ghost=makePiece(selectedPiece,true);
  ghost.position.copy(tilePosition(pack.city.grid,selectedPiece.target));
  ghost.rotation.y=THREE.MathUtils.degToRad(Number($('player-rotation').value));
  guideRoot.add(ghost);
 }
}
function refreshUI(){
 if(!pack)return;
 const p=progress(pack,session);
 $('player-mode').textContent=pack.metadata.title;
 $('player-progress').textContent=p.placed+' / '+p.total+' pieces';
 $('player-bar').style.width=(p.placed/p.total*100)+'%';
 $('player-pieces').replaceChildren();
 for(const piece of pack.pieces.filter(part=>!session.placed.includes(part.id))){
  const b=document.createElement('button');b.type='button';
  b.textContent=(selected===piece.id?'● ':'')+piece.prefab+' · '+piece.buildingId;
  b.setAttribute('aria-pressed',String(selected===piece.id));
  if(selected===piece.id)b.classList.add('selected');
  b.addEventListener('click',()=>{
   selected=piece.id;$('player-rotation').value='0';refreshUI();draw();
  });$('player-pieces').append(b);
 }
 $('player-fit').disabled=!selected;
 $('player-mission-list').replaceChildren();
 for(const mission of pack.missions){
  const button=document.createElement('button');button.type='button';
  const done=session.missions.includes(mission.id);
  button.textContent=(done?'✓ ':'○ ')+mission.title;
  button.disabled=done||!buildingComplete(pack,session,mission.buildingId);
  button.addEventListener('click',()=>{
   const result=completeMission(pack,session,mission.id);
   if(!result.ok)return report('Restore this building first.',true);
   session=result.session;persist();refreshUI();
   report('Community mission complete. Thank you for helping this neighborhood.');
  });
  $('player-mission-list').append(button);
 }
 $('player-victory').hidden=!(p.complete&&p.missions===p.totalMissions);
}
function place(candidate){
 if(!pack||!selected)return;
 const outcome=tryPlace(pack,session,selected,candidate);
 if(!outcome.ok)return report(outcome.reason,true);
 session=outcome.session;persist();selected=nextUnplaced(pack,session)?.id||null;
 $('player-rotation').value='0';
 draw();refreshUI();
 report(outcome.cityCompleted?'Architecture complete! Finish the city’s remaining missions.'
   :outcome.buildingCompleted?'Building completed. A mission may now be available.':'That piece fits!');
}
$('player-rotation').addEventListener('change',draw);
$('player-fit').addEventListener('click',()=>{
 const part=pack?.pieces.find(p=>p.id===selected);if(part)place(part.target);
});
$('player-restart').addEventListener('click',()=>{
 if(!pack||!confirm('Restart this community city? Your earlier campaign saves will not be affected.'))return;
 session=blankSession(pack);selected=nextUnplaced(pack,session)?.id||null;
 persist();draw();refreshUI();report('Fresh community puzzle started.');
});
$('player-import').addEventListener('change',async e=>{
 const file=e.target.files?.[0];e.target.value='';if(!file)return;
 if(file.size>MAX_PACK_BYTES)return report('File exceeds the 64 KiB limit.',true);
 try{
  const bytes=new Uint8Array(await file.arrayBuffer());
  const imported=validateLocalPackBytes(bytes);
  if(pack&&!confirm('Load '+imported.metadata.title+'? The current city will close, but its saved progress will remain.'))return;
  const revision=await shaBytes(bytes);
  load(imported,revision,'LOCAL FILE · NOT CURATED');
 }catch(error){report('Import rejected: '+error.message,true);}
});
(async()=>{
 const id=new URLSearchParams(location.search).get('id');
 if(!id)return report('Choose a city from the Commons Library or open a local city JSON file.');
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(id)||id.length>64)
  return report('Invalid community city selection.',true);
 try{
  const result=await getReviewedPack(id);
  load(result.pack,result.revision,result.source);
 }catch(error){report(error.message,true);}
})();
