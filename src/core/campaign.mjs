/**
 * Campaign chapter progression, using the unchanged Living Block save format.
 * No online account, DRM, hardcoded unlock flag or new data migration.
 */
import { restoreSession, progress } from './puzzle.mjs';
import { restoreCitySystems, circuitStatus } from './city-systems.mjs';
import {restoreRail,railStatus} from './rail-routing.mjs';
import {restoreCharter,charterStatus} from './citadel-charter.mjs';

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

export const IRON_SAVE_KEY='piece-by-piece:campaign:ironhaven-commons-rail:v1';
export const IRON_RAIL_SAVE_KEY='piece-by-piece:rail:ironhaven-commons-rail:v1';

/** The Skygarden's restored public skywalk is the prerequisite for Ironhaven. */
export function readIronAccess(storage,gardenPack){
 const garden=readGardenStatus(storage,gardenPack);
 return {unlocked:garden.complete,built:garden.built,total:garden.total,
  missions:garden.quests,totalMissions:garden.totalQuests};
}
/**
 * Rail read is derived from canonical construction/quest progress plus a
 * separately versioned rail-switch save. No legacy chapter save is mutated.
 */
export function readIronStatus(storage,ironPack){
 let raw=null,rawRail=null;
 try{raw=JSON.parse(storage.getItem(IRON_SAVE_KEY));}catch{}
 try{rawRail=JSON.parse(storage.getItem(IRON_RAIL_SAVE_KEY));}catch{}
 const session=restoreSession(ironPack,raw);
 const p=progress(ironPack,session);
 const rail=restoreRail(ironPack,rawRail);
 const status=railStatus(ironPack,session,rail);
 return {session,rail,route:status,built:p.placed,total:p.total,
  quests:p.missions,totalQuests:p.totalMissions,
  complete:p.complete&&p.missions===p.totalMissions&&status.delivered};
}

export const CITADEL_SAVE_KEY='piece-by-piece:campaign:citadel-common-ground:v1';
export const CITADEL_CHARTER_KEY='piece-by-piece:charter:citadel-common-ground:v1';

/** Chapter five begins only after Ironhaven's complete public freight delivery. */
export function readCitadelAccess(storage,ironPack){
 const iron=readIronStatus(storage,ironPack);
 return {unlocked:iron.complete,built:iron.built,total:iron.total,
   quests:iron.quests,totalQuests:iron.totalQuests,railDelivered:iron.route.delivered};
}
export function readCitadelStatus(storage,citadelPack){
 let raw=null,rawCharter=null;
 try{raw=JSON.parse(storage.getItem(CITADEL_SAVE_KEY));}catch{}
 try{rawCharter=JSON.parse(storage.getItem(CITADEL_CHARTER_KEY));}catch{}
 const session=restoreSession(citadelPack,raw);
 const charter=restoreCharter(citadelPack,rawCharter);
 const status=charterStatus(citadelPack,session,charter);
 const p=progress(citadelPack,session);
 return {session,charter,manifest:status,built:p.placed,total:p.total,
   quests:p.missions,totalQuests:p.totalMissions,
   complete:p.complete&&p.missions===p.totalMissions&&status.ratified};
}
