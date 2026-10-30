/**
 * Tidesreach's tiny three-stop coastal story; the campaign puzzle engine owns
 * the actual mission ledger. No separate, render-dependent quest save.
 */
import {buildingComplete, completeMission} from './puzzle.mjs';

export const HARBOR_KEEPERS=Object.freeze([
 {id:'ida',name:'Ida',role:'Lighthouse keeper',buildingId:'beacon',missionId:'ignite-beacon',
  greeting:'The light is back! The tea room can finally see our ships coming home.',
  repeat:'Keep the lantern shining. The bay belongs to its people.'},
 {id:'rowan',name:'Rowan',role:'Tea room owner',buildingId:'teahouse',missionId:'deliver-tea',
  greeting:'With Ida’s signal, we can send warm tea to the boatyard. Bring the crew this basket.',
  repeat:'There is always room for one more cup.'},
 {id:'finch',name:'Finch',role:'Boatyard caretaker',buildingId:'boatyard',missionId:'launch-ferry',
  greeting:'Tea for the crew! We can launch the ferry again. The coast is connected!',
  repeat:'Hear that? The dock is alive with little journeys again.'}
]);

export function keeperFor(id){return HARBOR_KEEPERS.find(k=>k.id===id)||null;}
export function nextHarborTask(session){
 const completed=new Set(session.missions);
 if(!completed.has('ignite-beacon'))return 'Relight Starfall Lighthouse with Ida';
 if(!completed.has('deliver-tea'))return 'Bring Ida’s signal to Rowan at the tea room';
 if(!completed.has('launch-ferry'))return 'Deliver Rowan’s tea to Finch at the boatyard';
 return 'The ferry is running. Enjoy the harbor you restored!';
}
export function interactKeeper(pack,session,keeperId){
 const keeper=keeperFor(keeperId);
 if(!keeper)return {ok:false,changed:false,session,who:'Unknown',text:'Nobody is here.'};
 if(!buildingComplete(pack,session,keeper.buildingId))return {
  ok:false,changed:false,session,who:keeper.name,text:'This building is not rebuilt yet.'
 };
 if(session.missions.includes(keeper.missionId))return {
  ok:true,changed:false,session,who:keeper.name,text:keeper.repeat
 };
 const prior=keeperId==='rowan'?'ignite-beacon':keeperId==='finch'?'deliver-tea':null;
 if(prior&&!session.missions.includes(prior))return {
  ok:true,changed:false,session,who:keeper.name,
  text:keeperId==='rowan'?'I am waiting for Ida to restore the beacon.'
    :'The crew cannot depart until Rowan sends a basket of warm tea.'
 };
 const result=completeMission(pack,session,keeper.missionId);
 if(!result.ok)return {ok:false,changed:false,session,who:keeper.name,text:'The delivery is not ready.'};
 return {ok:true,changed:true,session:result.session,who:keeper.name,
  text:keeper.greeting,complete:result.session.missions.length===pack.missions.length};
}
