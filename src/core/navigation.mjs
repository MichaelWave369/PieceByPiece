/**
 * Collision and walkable bounds for the Living Block. Coordinates are in
 * cityRoot-local meters. No Three.js dependency; shared by desktop and XR.
 */
import { buildingComplete } from './puzzle.mjs';
import { OVERLOOK_GATE_X,OVERLOOK_GATE_Z } from './city-systems.mjs';

export const CELL = 1.12;
const RADIUS = .29;
const cottageHalf = 1.23;

export function anchorOf(pack, id) {
  const first = pack.pieces.find(p => p.buildingId === id && p.target.z === 0);
  if (!first) return null;
  return {
    x: (first.target.x - pack.city.grid.width / 2 + .5) * CELL,
    z: (first.target.y - pack.city.grid.height / 2 + .5) * CELL,
  };
}

function insideRectangle(x, z, center, halfX, halfZ) {
  return Math.abs(x - center.x) < halfX + RADIUS &&
    Math.abs(z - center.z) < halfZ + RADIUS;
}

export function walkable(pack, session, x, z, room = null, gateOpen = true) {
  if (!Number.isFinite(x) || !Number.isFinite(z)) return false;
  if (room) return Math.abs(x) <= 2.5 - RADIUS && Math.abs(z) <= 2.65 - RADIUS;
  const extentX = pack.city.grid.width * CELL / 2 - RADIUS;
  const extentZ = pack.city.grid.height * CELL / 2 - RADIUS;
  if (Math.abs(x) > extentX || Math.abs(z) > extentZ) return false;
  if (!gateOpen && x > OVERLOOK_GATE_X && z > OVERLOOK_GATE_Z) return false;
  for (const id of ['cafe','home']) {
    if (!buildingComplete(pack,session,id)) continue;
    const center = anchorOf(pack,id);
    if (center && insideRectangle(x,z,center,cottageHalf,cottageHalf)) return false;
  }
  return true;
}

/** Axis-separated sliding with a sub-step limit prevents tunnelling through walls. */
export function moveWalkable(pack, session, from, delta, room = null, gateOpen = true) {
  if (![from.x,from.z,delta.x,delta.z].every(Number.isFinite)) return { ...from };
  const maxDelta = Math.max(Math.abs(delta.x),Math.abs(delta.z));
  const count = Math.max(1,Math.min(200,Math.ceil(maxDelta / .12)));
  let x=from.x, z=from.z;
  for(let i=0;i<count;i++) {
    const dx=delta.x/count, dz=delta.z/count;
    if(walkable(pack,session,x+dx,z,room,gateOpen)) x+=dx;
    if(walkable(pack,session,x,z+dz,room,gateOpen)) z+=dz;
  }
  return { x,z };
}

/** Local-space end point for headset teleports. Invalid surfaces are rejected. */
export function canTeleport(pack, session, localPoint, room = null, gateOpen = true) {
  return Boolean(localPoint && walkable(pack,session,localPoint.x,localPoint.z,room,gateOpen));
}
