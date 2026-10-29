/**
 * Campaign-specific, deterministic social interactions.
 * No renderer, timers, audio, fetch, or localStorage dependencies.
 * All quest progress still flows through the canonical puzzle mission rules.
 */
import { buildingComplete, completeMission } from './puzzle.mjs';

export const NEIGHBORS = Object.freeze([
  Object.freeze({
    id: 'celia', name: 'Celia', role: 'Café keeper', buildingId: 'cafe',
    missionId: 'visit-cafe', color: 0xc47e5e,
    intro: "You've built us a café! I have a warm parcel for Jules at Bluebell House.",
    repeat: "I still can't believe you rebuilt Sunbeam. Take a moment and smell the coffee.",
  }),
  Object.freeze({
    id: 'jules', name: 'Jules', role: 'Neighbor and gardener', buildingId: 'home',
    missionId: 'inspect-home', color: 0x7298bd,
    intro: "Celia sent this? Thank you! Here are my lantern seeds. Could you bring them to Moss in the garden?",
    locked: "Welcome to Bluebell House! Celia at the café has something she wanted to send over.",
    repeat: "My house has windows again. Imagine what a little kindness can rebuild.",
  }),
  Object.freeze({
    id: 'moss', name: 'Moss', role: 'Lantern keeper', buildingId: 'garden',
    missionId: 'visit-garden', color: 0x85a16e,
    intro: "Lantern seeds from Jules! I'll plant them tonight. Now all three places are connected.",
    locked: "The garden is peaceful. Jules at Bluebell House is looking after a special packet of seeds.",
    repeat: "Come back whenever you like. This garden belongs to everyone.",
  }),
]);

export function getNeighbor(id) {
  return NEIGHBORS.find(n => n.id === id) || null;
}

export function nextErrand(session) {
  const done = new Set(session.missions || []);
  if (!done.has('visit-cafe')) return 'Meet Celia at Sunbeam Café';
  if (!done.has('inspect-home')) return 'Deliver Celia’s parcel to Jules at Bluebell House';
  if (!done.has('visit-garden')) return 'Take Jules’s lantern seeds to Moss in the garden';
  return 'The block is restored. Explore and enjoy the neighborhood';
}

export function carrying(session) {
  const done = new Set(session.missions || []);
  if (done.has('inspect-home') && !done.has('visit-garden')) return 'Lantern seeds';
  if (done.has('visit-cafe') && !done.has('inspect-home')) return 'Wrapped café parcel';
  return 'Nothing to carry';
}

export function talkToNeighbor(pack, session, id) {
  const neighbor = getNeighbor(id);
  if (!neighbor) return { ok: false, session, text: 'Nobody is here by that name.', who: null, changed: false };
  if (!buildingComplete(pack, session, neighbor.buildingId)) {
    return { ok: false, session, text: 'Finish assembling this building to meet its neighbor.', who: neighbor.name, changed: false };
  }
  if ((session.missions || []).includes(neighbor.missionId)) {
    return { ok: true, session, text: neighbor.repeat, who: neighbor.name, changed: false };
  }
  const done = new Set(session.missions || []);
  if (id === 'jules' && !done.has('visit-cafe') ||
      id === 'moss' && !done.has('inspect-home')) {
    return { ok: true, session, text: neighbor.locked, who: neighbor.name, changed: false };
  }
  const result = completeMission(pack, session, neighbor.missionId);
  if (!result.ok) return { ok: false, session, text: 'The visit is not ready yet.', who: neighbor.name, changed: false };
  return {
    ok: true, session: result.session, who: neighbor.name, changed: true, text: neighbor.intro,
    completedAll: pack.missions.every(mission => result.session.missions.includes(mission.id)),
  };
}
