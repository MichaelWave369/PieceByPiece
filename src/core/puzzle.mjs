/**
 * Pure, deterministic Piece by Piece puzzle rules.
 * World rendering, network access, and XR input are intentionally NOT here.
 */
export const SESSION_VERSION = 1;

export function blankSession(pack) {
  return {
    version: SESSION_VERSION,
    packId: pack.metadata.id,
    placed: [],
    missions: [],
  };
}

const validIds = items => new Set(items.map(item => item.id));

export function restoreSession(pack, raw) {
  const session = blankSession(pack);
  if (!raw || typeof raw !== 'object' || raw.version !== SESSION_VERSION || raw.packId !== session.packId) {
    return session;
  }
  const pieces = validIds(pack.pieces);
  const missions = validIds(pack.missions);
  const placed = Array.isArray(raw.placed) ? raw.placed : [];
  session.placed = [...new Set(placed.filter(id => typeof id === 'string' && pieces.has(id)))];
  const completed = Array.isArray(raw.missions) ? raw.missions : [];
  // A mission cannot be restored unless the associated building is assembled.
  session.missions = [...new Set(completed.filter(id => typeof id === 'string' && missions.has(id) &&
    canCompleteMission(pack, session, id)))];
  return session;
}

export function pieceById(pack, id) {
  return pack.pieces.find(piece => piece.id === id) || null;
}

export function nextUnplaced(pack, session) {
  return pack.pieces.find(piece => !session.placed.includes(piece.id)) || null;
}

export function progress(pack, session) {
  return {
    placed: session.placed.length,
    total: pack.pieces.length,
    complete: pack.pieces.every(piece => session.placed.includes(piece.id)),
    missions: session.missions.length,
    totalMissions: pack.missions.length,
  };
}

export function buildingComplete(pack, session, buildingId) {
  const parts = pack.pieces.filter(piece => piece.buildingId === buildingId);
  return parts.length > 0 && parts.every(piece => session.placed.includes(piece.id));
}

/** Coordinates and rotation are intentional. No fuzzy acceptance in the rules. */
export function tryPlace(pack, session, pieceId, candidate) {
  const piece = pieceById(pack, pieceId);
  if (!piece) return { ok: false, reason: 'Unknown piece', session };
  if (session.placed.includes(pieceId)) return { ok: false, reason: 'Already assembled', session };
  if (!candidate || !Number.isInteger(candidate.x) || !Number.isInteger(candidate.y) ||
      !Number.isInteger(candidate.z) || !Number.isInteger(candidate.rotation)) {
    return { ok: false, reason: 'Point at a city grid tile', session };
  }
  const target = piece.target;
  if (candidate.x !== target.x || candidate.y !== target.y || candidate.z !== target.z ||
      candidate.rotation !== target.rotation) {
    return { ok: false, reason: 'Try a different tile or rotation', session };
  }
  const updated = { ...session, placed: [...session.placed, pieceId] };
  return {
    ok: true,
    session: updated,
    buildingCompleted: buildingComplete(pack, updated, piece.buildingId),
    cityCompleted: progress(pack, updated).complete,
  };
}

export function canCompleteMission(pack, session, id) {
  const mission = pack.missions.find(mission => mission.id === id);
  return Boolean(mission && buildingComplete(pack, session, mission.buildingId));
}

export function completeMission(pack, session, id) {
  if (!canCompleteMission(pack, session, id)) return { ok: false, session };
  if (session.missions.includes(id)) return { ok: false, session };
  return { ok: true, session: { ...session, missions: [...session.missions, id] } };
}
