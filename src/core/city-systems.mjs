/**
 * Declarative and deterministic city infrastructure, separate from VR rendering.
 * Campaign systems are curated; community packs cannot run scripts or add system
 * definitions until a reviewed, bounded declarative schema exists.
 */
import { buildingComplete } from './puzzle.mjs';

export const CITY_SYSTEM_VERSION = 1;
export const OVERLOOK_GATE_X = 3.5;
export const OVERLOOK_GATE_Z = 1.2;
const KINDS = new Set(['source','switch','consumer','gate']);
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;

export function validateSystemDefinition(pack, def) {
  const errors = [];
  if (!def || def.format !== 'piecebypiece.systems.v1' ||
      def.packId !== pack.metadata.id ||
      !Array.isArray(def.nodes) || !Array.isArray(def.edges)) {
    return ['Unrecognized city systems configuration'];
  }
  if (def.nodes.length < 3 || def.nodes.length > 20)errors.push('Node budget exceeded');
  if (def.edges.length > 32)errors.push('Edge budget exceeded');
  const pieces = new Set(pack.pieces.map(p=>p.id));
  const buildings = new Set(pack.buildings.map(b=>b.id));
  const missions = new Set(pack.missions.map(m=>m.id));
  const ids = new Set();
  for(const node of def.nodes){
    if(!node || typeof node!=='object'){errors.push('Invalid node');continue;}
    if(typeof node.id!=='string' || !SLUG.test(node.id) || node.id.length>64)
      errors.push('Invalid node ID');
    if(ids.has(node.id))errors.push('Duplicate node ID: '+node.id);
    ids.add(node.id);
    if(!KINDS.has(node.kind))errors.push('Unsupported node kind');
    if(!buildings.has(node.buildingId))errors.push('Unknown building: '+node.buildingId);
    if(node.requiresMission && !missions.has(node.requiresMission))errors.push('Unknown mission requirement');
    if(typeof node.label!=='string' || node.label.length>75)errors.push('Invalid node label');
    if(!node.position ||
       !Number.isInteger(node.position.x) || !Number.isInteger(node.position.y) ||
       node.position.x<0 || node.position.y<0 ||
       node.position.x>=pack.city.grid.width || node.position.y>=pack.city.grid.height)
      errors.push('Invalid grid position');
  }
  for(const edge of def.edges){
    if(!edge || typeof edge!=='object'){errors.push('Invalid edge');continue;}
    if(!ids.has(edge.from) || !ids.has(edge.to))errors.push('Unknown edge endpoint');
    if(edge.from===edge.to)errors.push('Self-loop forbidden');
    if(edge.requiresPiece && !pieces.has(edge.requiresPiece))errors.push('Unknown edge piece');
  }
  if(def.nodes.filter(n=>n?.kind==='source').length!==1)errors.push('Exactly one source required');
  if(def.nodes.filter(n=>n?.kind==='gate').length!==1)errors.push('Exactly one gate required');
  return errors;
}

export function blankCitySystems(pack) {
  return {version:CITY_SYSTEM_VERSION,packId:pack.metadata.id,enabled:[],overlookUnlocked:false};
}

export function restoreCitySystems(pack,def,raw) {
  const fresh=blankCitySystems(pack);
  if(!raw || raw.version!==CITY_SYSTEM_VERSION || raw.packId!==fresh.packId)return fresh;
  const allowed=new Set(def.nodes.filter(n=>n.kind==='source'||n.kind==='switch').map(n=>n.id));
  const enabled=Array.isArray(raw.enabled)?raw.enabled:[];
  fresh.enabled=[...new Set(enabled.filter(id=>typeof id==='string'&&allowed.has(id)))];
  fresh.overlookUnlocked=raw.overlookUnlocked===true;
  return fresh;
}

export function available(pack,session,node) {
  return Boolean(node && buildingComplete(pack,session,node.buildingId) &&
    (!node.requiresMission || session.missions.includes(node.requiresMission)));
}

export function circuitStatus(pack,def,session,systems) {
  const enabled=new Set(systems.enabled);
  const byId=new Map(def.nodes.map(node=>[node.id,node]));
  const active=new Set(def.nodes.filter(n=>n.kind==='source' &&
    enabled.has(n.id) && available(pack,session,n)).map(n=>n.id));
  const wires=[];
  let changed=true;
  // Bounded reachability, works with cycles and has no indefinite looping.
  while(changed && active.size<def.nodes.length){
    changed=false;
    for(const edge of def.edges) {
      const dest=byId.get(edge.to);
      if(!dest || !active.has(edge.from) || active.has(edge.to) ||
         !available(pack,session,dest) ||
         (edge.requiresPiece && !session.placed.includes(edge.requiresPiece)) ||
         ((dest.kind==='source'||dest.kind==='switch') && !enabled.has(dest.id)))continue;
      active.add(dest.id);changed=true;
    }
  }
  for(const edge of def.edges){
    const pieceConnected=!edge.requiresPiece || session.placed.includes(edge.requiresPiece);
    wires.push({from:edge.from,to:edge.to,
      active:active.has(edge.from)&&active.has(edge.to)&&pieceConnected});
  }
  const opened=systems.overlookUnlocked===true || active.has(def.nodes.find(n=>n.kind==='gate')?.id);
  const switches=def.nodes.filter(n=>n.kind==='source'||n.kind==='switch');
  return {
    powered:[...active],
    wires,
    gateOpen:opened,
    activeSwitches:switches.filter(n=>enabled.has(n.id)).length,
    totalSwitches:switches.length,
    lampsOn:active.has('lanterns'),
    complete:opened
  };
}

export function toggleSystemNode(pack,def,session,systems,id) {
  const node=def.nodes.find(n=>n.id===id);
  if(!node || (node.kind!=='source'&&node.kind!=='switch'))
    return {ok:false,reason:'Not a controllable city system',state:systems};
  if(!available(pack,session,node))
    return {ok:false,reason:'This relay is waiting for a finished building and its neighbor',state:systems};
  const wasEnabled=systems.enabled.includes(id);
  const enabled=wasEnabled?systems.enabled.filter(x=>x!==id):[...systems.enabled,id];
  const candidate={...systems,enabled};
  const status=circuitStatus(pack,def,session,candidate);
  candidate.overlookUnlocked=status.gateOpen;
  return {
    ok:true,state:candidate,status,
    reason:candidate.overlookUnlocked&&!systems.overlookUnlocked
      ? 'Lantern Grid restored! The Commons Overlook is open to everyone.'
      : wasEnabled?'Relay switched off. The overlook stays unlocked if already restored.'
                  : 'Relay connected. Follow the warm glowing line to the next relay.'
  };
}
