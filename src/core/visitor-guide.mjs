/**
 * Pure first-visitor presentation helpers.
 * A preview is a separately allocated, UNSAVED view state. It must never call
 * canonical tryPlace, completeMission, or edit the player's save.
 */
import { progress } from './puzzle.mjs';

export function makeShowcaseSession(pack) {
  return {
    version: 1,
    packId: pack.metadata.id,
    placed: pack.pieces.map(piece=>piece.id),
    missions: [],
  };
}

export function guideFor(pack,session,mode,inside=null,preview=false) {
  if(preview)return {
    title:'Exploration preview · no progress recorded',
    detail:inside
      ? 'Look around this miniature room, then return to the street or workshop.'
      : 'Explore the finished buildings freely. To solve puzzles and help neighbors, return to your workshop.',
    action:'end-preview',
  };
  const p=progress(pack,session);
  if(mode==='workshop') {
    if(p.complete)return {
      title:'Your neighborhood is assembled!',
      detail:'Enter your city to meet three neighbors and reconnect the Lantern Grid.',
      action:'enter-city'
    };
    if(p.placed===0)return {
      title:'Start with one small piece',
      detail:'Choose a piece on the right, turn it to match the golden target, then click the target tile. Nothing is timed.',
      action:'choose-piece'
    };
    return {
      title:p.placed+' of '+p.total+' pieces fit',
      detail:'Keep building at your pace. You can rotate with R, see ghost outlines, or enable placement assistance.',
      action:'keep-building'
    };
  }
  if(inside)return {
    title:'Inside your building',
    detail:'Enjoy looking around. Select the exit sign or Return to street when you are ready.',
    action:'exit-interior'
  };
  if(p.missions<p.totalMissions)return {
    title:'The neighborhood needs you',
    detail:'Meet Celia, Jules, and Moss. The next kindness is shown in your story panel.',
    action:'talk'
  };
  return {
    title:'Restore the Lantern Grid',
    detail:'Connect the three outdoor relays to light the public path and open the Commons Overlook.',
    action:'power'
  };
}
