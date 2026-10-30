/** The community's ordered Ironhaven encounters, through canonical v1 mission rules. */
import {buildingComplete,completeMission} from './puzzle.mjs';
export const IRONHAVEN_CREW=Object.freeze([
{id:'rook',name:'Rook',role:'Salvage mechanic',buildingId:'salvage',missionId:'restore-salvage',color:0xcc8764,
 greeting:'Every salvaged bolt goes back to the people. Ada can get the cooperative forge running again.',
 repeat:'We repair things instead of throwing them away. Imagine that.'},
{id:'ada',name:'Ada',role:'Foundry engineer',buildingId:'foundry',missionId:'restart-foundry',color:0x8c9eb5,
 greeting:'Foundry online, with the workers in charge! Jun can take the depot keys and free the freight routes.',
 repeat:'A working foundry should make useful things, not just profit.'},
{id:'jun',name:'Jun',role:'Rail dispatcher',buildingId:'terminal',missionId:'release-rail',color:0xc1ac72,
 greeting:'The dispatch keys are public. Now set all three junctions to COMMONS to get the supply train moving.',
 repeat:'The rail lines are ours. Go align the junctions and deliver supplies to everyone.'}
]);
export function nextIronTask(session){
 const done=new Set(session.missions);
 if(!done.has('restore-salvage'))return 'Meet Rook at the Salvage Workshop';
 if(!done.has('restart-foundry'))return 'Help Ada restart the cooperative foundry';
 if(!done.has('release-rail'))return 'Visit Jun at the Commons Rail Terminal';
 return 'Set three rail junctions to COMMONS to open the public supply route';
}
export function speakIronCrew(pack,session,id){
 const crew=IRONHAVEN_CREW.find(c=>c.id===id);
 if(!crew)return {ok:false,changed:false,session,who:'Unknown',text:'Nobody is here.'};
 if(!buildingComplete(pack,session,crew.buildingId))
  return {ok:false,changed:false,session,who:crew.name,text:'Complete this building to meet its crew.'};
 if(session.missions.includes(crew.missionId))
  return {ok:true,changed:false,session,who:crew.name,text:crew.repeat};
 const required=id==='ada'?'restore-salvage':id==='jun'?'restart-foundry':null;
 if(required&&!session.missions.includes(required))
  return {ok:true,changed:false,session,who:crew.name,text:'Another part of the community restoration needs your help first.'};
 const result=completeMission(pack,session,crew.missionId);
 if(!result.ok)return {ok:false,changed:false,session,who:crew.name,text:'The restoration is not ready.'};
 return {ok:true,changed:true,session:result.session,who:crew.name,text:crew.greeting};
}
