/** The Citadel's nonviolent, ordered finale. Canonical puzzle ledger owns missions. */
import {buildingComplete,completeMission} from './puzzle.mjs';
export const CITADEL_ALLIES=Object.freeze([
 {id:'ren',name:'Ren',role:'Open archivist',buildingId:'archive',missionId:'recover-blueprints',color:0x8faad5,
 greeting:'The public blueprints are free again. Nobody needs permission to rebuild their home.',
 repeat:'Designs belong to the people who bring them to life.'},
 {id:'noor',name:'Noor',role:'Signal engineer',buildingId:'relay',missionId:'release-signal',color:0x9ba8ad,
 greeting:'The central signal now follows the public charter. Bring everyone to the final assembly.',
 repeat:'The network is a tool, not a master.'},
 {id:'imi',name:'Imi',role:'Assembly steward',buildingId:'forum',missionId:'convene-assembly',color:0xedc48e,
 greeting:'The city is ready. Now release the three safeguards: Knowledge, Connection, and Consent.',
 repeat:'The charter is yours. Release all three safeguards and the Commons opens.'}
]);
export function nextCitadelTask(session){
 if(!session.missions.includes('recover-blueprints'))return 'Meet Ren and recover the public blueprints';
 if(!session.missions.includes('release-signal'))return 'Ask Noor to release the city signal';
 if(!session.missions.includes('convene-assembly'))return 'Gather the final assembly with Imi';
 return 'Set KNOWLEDGE, CONNECTION, and CONSENT to PUBLIC to finish the campaign';
}
export function speakCitadelAlly(pack,session,id){
 const ally=CITADEL_ALLIES.find(a=>a.id===id);
 if(!ally)return {ok:false,changed:false,session,who:'Unknown',text:'No one is here.'};
 if(!buildingComplete(pack,session,ally.buildingId))
  return {ok:false,changed:false,session,who:ally.name,text:'Rebuild this part of the city first.'};
 if(session.missions.includes(ally.missionId))
  return {ok:true,changed:false,session,who:ally.name,text:ally.repeat};
 const prior=id==='noor'?'recover-blueprints':id==='imi'?'release-signal':null;
 if(prior&&!session.missions.includes(prior))
  return {ok:true,changed:false,session,who:ally.name,text:'The people at the earlier district need your help first.'};
 const result=completeMission(pack,session,ally.missionId);
 if(!result.ok)return {ok:false,changed:false,session,who:ally.name,text:'The assembly is not ready.'};
 return {ok:true,changed:true,session:result.session,who:ally.name,text:ally.greeting};
}
