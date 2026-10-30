/**
 * Campaign chapter progression, using the unchanged Living Block save format.
 * No online account, DRM, hardcoded unlock flag or new data migration.
 */
import { restoreSession, progress } from './puzzle.mjs';
import { restoreCitySystems, circuitStatus } from './city-systems.mjs';

export const FIRST_SAVE_KEY='piece-by-piece:campaign:the-living-block:v1';
export const FIRST_SYSTEMS_SAVE_KEY='piece-by-piece:systems:the-living-block:v1';
export const HARBOR_SAVE_KEY='piece-by-piece:campaign:tidesreach-first-dock:v1';

export function restoredFirstDistrict(pack,systemDefinition,session,systems) {
  const p=progress(pack,session);
  const powered=circuitStatus(pack,systemDefinition,session,systems);
  return p.complete && p.missions===p.totalMissions && powered.gateOpen;
}

export function readFirstDistrictStatus(storage,pack,systemDefinition){
  let raw=null,rawSystems=null;
  try {raw=JSON.parse(storage.getItem(FIRST_SAVE_KEY));}catch{}
  try {rawSystems=JSON.parse(storage.getItem(FIRST_SYSTEMS_SAVE_KEY));}catch{}
  const session=restoreSession(pack,raw);
  const systems=restoreCitySystems(pack,systemDefinition,rawSystems);
  const p=progress(pack,session);
  return {
    session,systems,
    built:p.placed,total:p.total,
    quests:p.missions,totalQuests:p.totalMissions,
    restored:restoredFirstDistrict(pack,systemDefinition,session,systems)
  };
}

export function readHarborStatus(storage,harborPack){
  let raw=null;
  try {raw=JSON.parse(storage.getItem(HARBOR_SAVE_KEY));}catch{}
  const session=restoreSession(harborPack,raw);
  const p=progress(harborPack,session);
  return {session,built:p.placed,total:p.total,quests:p.missions,totalQuests:p.totalMissions,complete:p.complete && p.missions===p.totalMissions};
}

export const GARDEN_SAVE_KEY='piece-by-piece:campaign:verdantia-skygarden:v1';

/**
 * Chapter 3 unlocks by restoring the complete public-ferry storyline.
 * This consumes the existing chapter-2 save, not a separate unlock boolean.
 */
export function readGardenAccess(storage,harborPack) {
  const coast=readHarborStatus(storage,harborPack);
  return {
    unlocked:coast.complete,
    harborPieces:coast.built,
    harborTotal:coast.total,
    harborMissions:coast.quests,
    harborTotalMissions:coast.totalQuests,
  };
}
export function readGardenStatus(storage,gardenPack) {
  let raw=null;
  try{raw=JSON.parse(storage.getItem(GARDEN_SAVE_KEY));}catch{}
  const session=restoreSession(gardenPack,raw);
  const p=progress(gardenPack,session);
  return {session,built:p.placed,total:p.total,quests:p.missions,totalQuests:p.totalMissions,
    complete:p.complete&&p.missions===p.totalMissions};
}
