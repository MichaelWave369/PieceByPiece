import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {VRButton} from 'three/addons/webxr/VRButton.js';
import citadelPack from '../game/campaign/citadel-common-ground.json';
import examplePack from '../community/packs/lantern-lane.json';
import {readCitadelStatus} from './core/campaign.mjs';
import {blankSession,tryPlace,completeMission,progress,buildingComplete,nextUnplaced} from './core/puzzle.mjs';
import {validatePack,MAX_PACK_BYTES} from './core/community-validator.mjs';
import {newCommonsPack,safeDraft,importCommonsPack,editCommonsPack,newTestRun,testReceipt,
 exportCommonsPack,COMMONS_DRAFT_KEY,ALLOWED_THEMES,ALLOWED_PREFABS,ALLOWED_DIFFICULTIES} from './core/commons-architect.mjs';
import {makePiece,tilePosition,gridCoordinate,CELL} from './render/prefabs.js';
import './commons.css';

const $=id=>document.getElementById(id);
let unlocked=false;
try{unlocked=readCitadelStatus(window.localStorage,citadelPack).complete;}catch{}
$('commons-locked').hidden=unlocked;
$('commons-app').hidden=!unlocked;

if(unlocked)startArchitect();

function startArchitect(){
 let pack=newCommonsPack();
 try{
  const raw=window.localStorage.getItem(COMMONS_DRAFT_KEY);
  if(raw&&new TextEncoder().encode(raw).byteLength<=MAX_PACK_BYTES)
   pack=safeDraft(JSON.parse(raw));
 }catch{}
 let mode='design',test=null,receipt=null,selected=null,showError=false,vr=false;
 const $view=$('commons-3d');
 const signal=(message,isError=false)=>{
  $('commons-feedback').textContent=message;
  $('commons-feedback').dataset.error=String(isError);
 };
 const persist=()=>{
  try{window.localStorage.setItem(COMMONS_DRAFT_KEY,JSON.stringify(pack));}
  catch{signal('Browser storage unavailable; export your city before closing the tab.',true);}
 };
 const scene=new THREE.Scene();scene.background=new THREE.Color(0xc5e0d9);
 const camera=new THREE.PerspectiveCamera(52,1,.04,130);
 camera.position.set(9.5,13,12);
 const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.6));
 renderer.setSize($view.clientWidth||700,$view.clientHeight||600);
 renderer.xr.enabled=true;renderer.xr.setReferenceSpaceType('local-floor');
 renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.shadowMap.enabled=true;
 $view.append(renderer.domElement);
 scene.add(new THREE.HemisphereLight(0xebffff,0x849f99,2.4));
 const sun=new THREE.DirectionalLight(0xffefd7,2.6);sun.position.set(-7,16,9);sun.castShadow=true;
 sun.shadow.mapSize.set(1024,1024);scene.add(sun);
 const controls=new OrbitControls(camera,renderer.domElement);
 controls.enableDamping=true;controls.minDistance=7;controls.maxDistance=33;controls.maxPolarAngle=1.48;
 const world=new THREE.Group();scene.add(world);
 const pieceRoot=new THREE.Group();world.add(pieceRoot);
 const overlayRoot=new THREE.Group();world.add(overlayRoot);
 const materials={
  base:new THREE.MeshStandardMaterial({color:0xd8e1d5,roughness:.89}),
  target:new THREE.MeshBasicMaterial({color:0x92e2bd,transparent:true,opacity:.72,depthWrite:false}),
  selected:new THREE.MeshBasicMaterial({color:0xffd18d,transparent:true,opacity:.38,depthWrite:false})
 };
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(32*CELL,32*CELL),materials.base);
 floor.rotation.x=-Math.PI/2;floor.position.y=.035;floor.receiveShadow=true;world.add(floor);
 let gridHelper=null,pickSurface=null;
 const pointer=new THREE.Vector2(),raycaster=new THREE.Raycaster();
 const tempTarget=new THREE.Vector3();
 function clearMeshes(root) {
  root.traverse(o=>{
   if(o.isMesh){
    o.geometry?.dispose();
    const m=o.material;
    if(Array.isArray(m))for(const v of m)v.dispose();
    else if(m&&!Object.values(materials).includes(m))m.dispose();
   }
  });
  root.clear();
 }
 function setTheme(){
  const colors={village:0xcfe1ce,harbor:0xbdded9,garden:0xcbe2ba,industrial:0xc4ced0,neon:0xbbb9d7};
  materials.base.color.setHex(colors[pack.city.theme]||0xcfe1ce);
  scene.background=new THREE.Color(colors[pack.city.theme]||0xcfe1ce).lerp(new THREE.Color(0xffffff),.24);
 }
 function paintScene(){
  clearMeshes(pieceRoot);clearMeshes(overlayRoot);
  setTheme();
  const width=pack.city.grid.width*CELL,height=pack.city.grid.height*CELL;
  floor.geometry.dispose();floor.geometry=new THREE.PlaneGeometry(width,height);
  if(gridHelper){world.remove(gridHelper);gridHelper.geometry.dispose();
   if(Array.isArray(gridHelper.material))gridHelper.material.forEach(m=>m.dispose());
   else gridHelper.material.dispose();}
  gridHelper=new THREE.GridHelper(width,pack.city.grid.width,0x608c88,0x9bbab2);
  gridHelper.position.y=.08;world.add(gridHelper);
  if(pickSurface){world.remove(pickSurface);pickSurface.geometry.dispose();pickSurface.material.dispose();}
  pickSurface=new THREE.Mesh(new THREE.PlaneGeometry(width,height),
   new THREE.MeshBasicMaterial({transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false}));
  pickSurface.rotation.x=-Math.PI/2;pickSurface.position.y=.12;world.add(pickSurface);
  const rendered=mode==='test'&&test?test.session.placed:new Set(pack.pieces.map(p=>p.id));
  for(const piece of pack.pieces) {
   if(!rendered.includes?.(piece.id)&&!(rendered instanceof Set&&rendered.has(piece.id)))continue;
   const g=makePiece(piece);
   g.position.copy(tilePosition(pack.city.grid,piece.target));
   g.rotation.y=THREE.MathUtils.degToRad(piece.target.rotation);
   pieceRoot.add(g);
  }
  if(mode==='test'&&test&&selected){
   const p=pack.pieces.find(p=>p.id===selected&&!test.session.placed.includes(p.id));
   if(p){
    const pad=new THREE.Mesh(new THREE.BoxGeometry(1.09,.055,1.09),materials.target);
    pad.position.copy(tilePosition(pack.city.grid,p.target));pad.position.y+=.065;overlayRoot.add(pad);
    const ghost=makePiece(p,true);
    ghost.position.copy(tilePosition(pack.city.grid,p.target));
    ghost.rotation.y=THREE.MathUtils.degToRad(Number($('test-rotation').value));
    overlayRoot.add(ghost);
   }
  }else if(mode==='design'&&selected){
   const p=pack.pieces.find(p=>p.id===selected);
   if(p){
    const pad=new THREE.Mesh(new THREE.BoxGeometry(1.13,.03,1.13),materials.selected);
    pad.position.copy(tilePosition(pack.city.grid,p.target));pad.position.y+=.06;overlayRoot.add(pad);
   }
  }
  $('view-city').textContent=pack.metadata.title;
  $('view-mode').textContent=mode==='design'?'CITY DESIGN · '+pack.pieces.length+' PIECES':'LIVE PLAYTEST · '+(test?.session.placed.length||0)+' / '+pack.pieces.length;
  $('stage-guide').textContent=mode==='design'
   ? 'Drag to orbit · Scroll to zoom · Click a grid tile to place the chosen piece'
   : 'Select a piece and match its tile + rotation. Click the glowing tile to fit it.';
 }
 function options(select,values,chosen){
  select.replaceChildren();
  for(const v of values) {
   const option=document.createElement('option');
   option.value=typeof v==='string'?v:v.id;
   option.textContent=typeof v==='string'?v:v.name;
   select.append(option);
  }
  if(chosen!==undefined&&chosen!==null&&values.some(v=>(typeof v==='string'?v:v.id)===chosen))
   select.value=chosen;
 }
 function actionButton(title,callback,secondary=false){
  const b=document.createElement('button');b.type='button';
  b.textContent=title;if(secondary)b.className='subtle';
  b.addEventListener('click',callback);return b;
 }
 function applyEdit(command){
  try{
   const next=editCommonsPack(pack,command);
   if(new TextEncoder().encode(JSON.stringify(next,null,2)+'\n').byteLength>MAX_PACK_BYTES)
    throw new Error('City is too large for a 64 KiB community pack');
   pack=next;test=null;receipt=null;selected=null;showError=false;
   persist();refresh();
   signal('Saved locally. Playtest the updated design before exporting.');
  }catch(error){signal(error.message,true);}
 }
 function refresh(){
  $('city-title').value=pack.metadata.title;
  $('city-creator').value=pack.metadata.creator;
  $('city-description').value=pack.metadata.description;
  options($('city-theme'),ALLOWED_THEMES,pack.city.theme);
  options($('city-difficulty'),ALLOWED_DIFFICULTIES,pack.metadata.difficulty);
  const buildingBefore=$('piece-building').value;
  options($('piece-building'),pack.buildings,buildingBefore||pack.buildings[0]?.id);
  options($('piece-prefab'),ALLOWED_PREFABS,$('piece-prefab').value||'foundation');
  $('commons-license').value=pack.rights.license;
  $('commons-rights').checked=pack.rights.confirmed===true;
  $('building-total').textContent=pack.buildings.length+' / 24';
  $('piece-total').textContent=pack.pieces.length+' / 128';
  $('mission-total').textContent=pack.missions.length+' / 24';
  $('building-list').replaceChildren();
  for(const b of pack.buildings){
   const row=document.createElement('div');row.className='commons-entry';
   const info=document.createElement('span');info.textContent=b.name;
   const count=document.createElement('small');count.textContent=pack.pieces.filter(p=>p.buildingId===b.id).length+' pieces';
   row.append(info,count);
   row.append(actionButton('×',()=>applyEdit({type:'removeBuilding',id:b.id}),true));
   $('building-list').append(row);
  }
  $('piece-list').replaceChildren();
  for(const p of pack.pieces){
   const row=document.createElement('div');row.className='commons-entry';
   const btn=actionButton(p.id===selected?'● '+p.prefab:p.prefab,()=>{
    selected=p.id;paintScene();refreshSelectionButtons();
   },true);
   btn.dataset.piece=p.id;
   const meta=document.createElement('small');meta.textContent=p.buildingId+' · '+p.target.x+','+p.target.y+' · z'+p.target.z+' · '+p.target.rotation+'°';
   row.append(btn,meta,actionButton('×',()=>applyEdit({type:'removePiece',id:p.id}),true));
   $('piece-list').append(row);
  }
  $('mission-list').replaceChildren();
  for(const m of pack.missions){
   const row=document.createElement('div');row.className='commons-entry';
   const p=document.createElement('span');p.textContent=m.title+' ('+m.buildingId+')';
   row.append(p,actionButton('×',()=>applyEdit({type:'removeMission',id:m.id}),true));
   $('mission-list').append(row);
  }
  const pErrors=validatePack(pack);
  $('draft-validity').textContent=pErrors.length
   ? (pack.rights.confirmed===false&&pErrors.length===1
      ? 'The city layout is valid. Confirm sharing rights when ready.'
      : 'Validation: '+pErrors.slice(0,2).join('; '))
   : 'Strict schema and placement validation passed.';
  receipt=receipt&&receipt.signature===JSON.stringify(pack)?receipt:null;
  $('receipt-status').textContent=receipt
    ? '✓ A full start-to-finish playtest passed for this exact city layout.'
    : 'Playtest all pieces and available missions to unlock export.';
  $('export-pack').disabled=!receipt||!pack.rights.confirmed||pErrors.length>0;
  $('design-tools').hidden=mode!=='design';
  $('test-tools').hidden=mode!=='test';
  $('mode-design').classList.toggle('active',mode==='design');
  $('mode-test').classList.toggle('active',mode==='test');
  $('mode-design').setAttribute('aria-pressed',String(mode==='design'));
  $('mode-test').setAttribute('aria-pressed',String(mode==='test'));
  if(mode==='test')refreshTestUI();
  paintScene();
 }
 function refreshSelectionButtons(){
  for(const b of $('piece-list').querySelectorAll('button[data-piece]')){
   const p=pack.pieces.find(x=>x.id===b.dataset.piece);
   b.textContent=(p?.id===selected?'● ':'')+(p?.prefab||'piece');
  }
 }
 function refreshTestUI(){
  if(!test)return;
  const p=progress(pack,test.session);
  $('test-progress').textContent=p.placed+' / '+p.total+' pieces · '+p.missions+' / '+p.totalMissions+' missions';
  $('test-pieces').replaceChildren();
  for(const piece of pack.pieces.filter(x=>!test.session.placed.includes(x.id))){
   const b=actionButton((selected===piece.id?'● ':'')+piece.prefab+' · '+piece.buildingId,
    ()=>{selected=piece.id;$('test-rotation').value='0';refreshTestUI();paintScene();},true);
   if(selected===piece.id)b.classList.add('active');
   $('test-pieces').append(b);
  }
  $('test-fit').disabled=!selected||p.complete;
  $('test-missions').replaceChildren();
  for(const mission of pack.missions){
   const done=test.session.missions.includes(mission.id);
   const b=actionButton((done?'✓ ':'○ ')+mission.title,()=>{
    const result=completeMission(pack,test.session,mission.id);
    if(!result.ok)return signal('Build the required structure before finishing this mission.',true);
    test.session=result.session;
    finishTestStep('Mission completed using the normal campaign puzzle rules.');
   },true);
   b.disabled=done||!buildingComplete(pack,test.session,mission.buildingId);
   $('test-missions').append(b);
  }
  $('test-completion').textContent=p.complete&&p.missions===p.totalMissions
   ? '✓ Complete! Your playable pack passed a fresh full-run test.'
   : p.complete?'All construction assembled. Finish remaining missions to complete the playtest.'
    :'Build each piece by its actual coordinates and rotation, or opt into assisted fitting.';
 }
 function finishTestStep(message){
  receipt=testReceipt(pack,test);
  selected=nextUnplaced(pack,test.session)?.id||null;
  refresh();
  signal(receipt?'Full playthrough completed. You can now export after affirming rights.':message);
 }
 function testPlace(candidate){
  if(!test||!selected)return;
  const result=tryPlace(pack,test.session,selected,candidate);
  if(!result.ok)return signal(result.reason,true);
  test.session=result.session;
  finishTestStep(result.cityCompleted?'All pieces fitted. Complete the city missions next.':'That piece fits!');
 }
 function handleGridRay(ray){
  if(!pickSurface)return;
  const hit=ray.intersectObject(pickSurface)[0];if(!hit)return;
  const local=world.worldToLocal(hit.point.clone());
  const tile=gridCoordinate(pack.city.grid,local,Number($('piece-level').value),
    Number($('piece-rotation').value));
  if(mode==='design'){
   applyEdit({type:'addPiece',buildingId:$('piece-building').value,
    prefab:$('piece-prefab').value,target:tile});
  }else if(test&&selected){
   const piece=pack.pieces.find(p=>p.id===selected);
   testPlace({...tile,z:piece.target.z,rotation:Number($('test-rotation').value)});
  }
 }
 function fromPointer(e){
  const box=renderer.domElement.getBoundingClientRect();
  pointer.set((e.clientX-box.left)/box.width*2-1,-(e.clientY-box.top)/box.height*2+1);
  raycaster.setFromCamera(pointer,camera);handleGridRay(raycaster);
 }
 let down=null;
 renderer.domElement.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY,button:e.button};});
 renderer.domElement.addEventListener('pointerup',e=>{
  if(!down||down.button!==0||e.button!==0)return;
  if(Math.hypot(e.clientX-down.x,e.clientY-down.y)<6&&!vr)fromPointer(e);
  down=null;
 });
 for(const hand of [0,1]){
  const ctrl=renderer.xr.getController(hand);
  const laser=new THREE.Line(new THREE.BufferGeometry().setFromPoints([
   new THREE.Vector3(),new THREE.Vector3(0,0,-2.0)]),
   new THREE.LineBasicMaterial({color:hand?0x86edd3:0xf8cf91}));
  ctrl.add(laser);scene.add(ctrl);
  ctrl.addEventListener('selectstart',()=>{
   tempTarget.setFromMatrixPosition(ctrl.matrixWorld);
   const dir=new THREE.Vector3(0,0,-1).applyQuaternion(
    new THREE.Quaternion().setFromRotationMatrix(ctrl.matrixWorld)).normalize();
   raycaster.set(tempTarget,dir);handleGridRay(raycaster);
  });
 }
 const vrButton=VRButton.createButton(renderer,{optionalFeatures:['local-floor','bounded-floor']});
 $('vr-preview').append(vrButton);
 renderer.xr.addEventListener('sessionstart',()=>{
  vr=true;controls.enabled=false;world.scale.setScalar(.135);world.position.set(0,1.05,-1.6);
  signal('In-headset tabletop preview. Select a piece in the browser panel before entering VR to place it.');
 });
 renderer.xr.addEventListener('sessionend',()=>{
  vr=false;controls.enabled=true;world.scale.setScalar(1);world.position.set(0,0,0);
  signal('Back to the full desktop editor. Your city draft is still local.');
 });
 function resize(){
  const w=$view.clientWidth||700,h=$view.clientHeight||520;
  camera.aspect=w/h;camera.updateProjectionMatrix();
  renderer.setSize(w,h);
 }
 window.addEventListener('resize',resize);
 const observer=typeof ResizeObserver!=='undefined'?new ResizeObserver(resize):null;
 observer?.observe($view);
 const clock=new THREE.Clock();
 renderer.setAnimationLoop(()=>{
  const dt=clock.getDelta();
  if(!vr)controls.update();
  renderer.render(scene,camera);
 });
 $('city-title').addEventListener('change',e=>applyEdit({type:'metadata',field:'title',value:e.target.value}));
 $('city-creator').addEventListener('change',e=>applyEdit({type:'metadata',field:'creator',value:e.target.value}));
 $('city-description').addEventListener('change',e=>applyEdit({type:'metadata',field:'description',value:e.target.value}));
 $('city-theme').addEventListener('change',e=>applyEdit({type:'theme',value:e.target.value}));
 $('city-difficulty').addEventListener('change',e=>applyEdit({type:'difficulty',value:e.target.value}));
 $('commons-license').addEventListener('change',e=>applyEdit({type:'license',value:e.target.value}));
 $('commons-rights').addEventListener('change',e=>applyEdit({type:'affirm',value:e.target.checked}));
 $('add-building').addEventListener('click',()=>{
  applyEdit({type:'addBuilding',name:$('new-building-name').value});
  $('new-building-name').value='';
 });
 $('add-mission').addEventListener('click',()=>{
  applyEdit({type:'addMission',title:$('mission-title').value,buildingId:$('piece-building').value});
  $('mission-title').value='';
 });
 $('mode-design').addEventListener('click',()=>{
  mode='design';refresh();signal('Design mode. Click a grid tile to add a new approved prefab.');
 });
 $('mode-test').addEventListener('click',()=>{
  try{
   if(!test||test.signature!==JSON.stringify(pack))test=newTestRun(pack);
   selected=nextUnplaced(pack,test.session)?.id||null;
   mode='test';refresh();signal('Real puzzle test started with an empty city. Build each piece, then complete missions.');
  }catch(e){signal(e.message,true);}
 });
 $('test-rotation').addEventListener('change',paintScene);
 $('test-fit').addEventListener('click',()=>{
  const piece=pack.pieces.find(p=>p.id===selected);
  if(!piece)return;testPlace(piece.target);
 });
 $('restart-test').addEventListener('click',()=>{
  test=newTestRun(pack);receipt=null;
  selected=nextUnplaced(pack,test.session)?.id||null;
  $('test-rotation').value='0';refresh();signal('New playtest started from zero.');
 });
 $('export-pack').addEventListener('click',()=>{
  try{
   const json=exportCommonsPack(pack,receipt);
   const blob=new Blob([json],{type:'application/json'});
   const url=URL.createObjectURL(blob);
   const link=document.createElement('a');link.href=url;link.download=pack.metadata.id+'.json';
   document.body.append(link);link.click();link.remove();
   setTimeout(()=>URL.revokeObjectURL(url),1000);
   signal('Validated city JSON exported to your device. Share it manually or propose a reviewed GitHub PR.');
  }catch(error){signal(error.message,true);}
 });
 $('import-pack').addEventListener('change',async e=>{
  const file=e.target.files?.[0];if(!file)return;
  e.target.value='';
  if(file.size>MAX_PACK_BYTES)return signal('This file exceeds the 64 KiB limit.',true);
  try{
   const imported=importCommonsPack(await file.text());
   pack=imported;test=null;receipt=null;selected=null;mode='design';
   persist();refresh();signal('Imported safely. Sharing rights must be confirmed again; replay the test before export.');
  }catch(error){signal('Import rejected: '+error.message,true);}
 });
 $('load-example').addEventListener('click',()=>{
  try{
   pack=safeDraft(examplePack);
   test=null;receipt=null;selected=null;mode='design';
   persist();refresh();signal('Lantern Lane is loaded as a local editable example. No campaign progress was changed.');
  }catch(e){signal(e.message,true);}
 });
 refresh();resize();
}
