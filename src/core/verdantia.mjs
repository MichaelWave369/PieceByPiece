/**
 * Verdantia's ordered regenerative story, using the canonical puzzle mission
 * ledger. No remote state, additional gameplay engine, or scripted city packs.
 */
import {buildingComplete,completeMission} from './puzzle.mjs';
export const SKY_GARDENERS=Object.freeze([
 {id:'pera',name:'Pera',role:'Seed archivist',buildingId:'seedhouse',missionId:'restore-seeds',
  greeting:'The seed vault is awake again! Sol can finally power the gardens without losing our heritage.',
  repeat:'Every seed belongs to the future, not a corporation.'},
 {id:'sol',name:'Sol',role:'Wind engineer',buildingId:'windspire',missionId:'awaken-wind',
  greeting:'The gardens have power now. Vale can release the old canopy locks to open our skywalk.',
  repeat:'Wind belongs to everyone. Nothing to meter, nothing to sell.'},
 {id:'vale',name:'Vale',role:'Canopy bridge steward',buildingId:'canopy',missionId:'open-skywalk',
  greeting:'The raised path is open! Come see the city from above the leaves. The sky belongs to all of us.',
  repeat:'You can always come up here when you need a little perspective.'}
]);
export function gardenerFor(id){return SKY_GARDENERS.find(n=>n.id===id)||null;}
export function nextGardenTask(session){
 if(!session.missions.includes('restore-seeds'))return 'Meet Pera and restore the seed vault';
 if(!session.missions.includes('awaken-wind'))return 'Ask Sol to power the wind spire';
 if(!session.missions.includes('open-skywalk'))return 'Help Vale release the public canopy bridges';
 return 'Skywalk open. Wander through the garden above the city!';
}
export function interactGardener(pack,session,id){
 const g=gardenerFor(id);
 if(!g)return {ok:false,changed:false,session,who:'Unknown',text:'No gardener by that name.'};
 if(!buildingComplete(pack,session,g.buildingId))
  return {ok:false,changed:false,session,who:g.name,text:'Finish assembling this building first.'};
 if(session.missions.includes(g.missionId))
  return {ok:true,changed:false,session,who:g.name,text:g.repeat};
 const previous=id==='sol'?'restore-seeds':id==='vale'?'awaken-wind':null;
 if(previous&&!session.missions.includes(previous))
  return {ok:true,changed:false,session,who:g.name,
    text:id==='sol'?'Pera needs to wake the seeds before I can power the gardens.':'The wind spire is still waiting for Sol.'};
 const next=completeMission(pack,session,g.missionId);
 if(!next.ok)return {ok:false,changed:false,session,who:g.name,text:'Not quite ready yet.'};
 return {ok:true,changed:true,session:next.session,who:g.name,text:g.greeting,
    complete:next.session.missions.length===pack.missions.length};
}
