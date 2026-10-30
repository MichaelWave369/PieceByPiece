/** Shared strict community-pack validator for browser imports and Node CI. */
export const MAX_PACK_BYTES = 64 * 1024;
import schema from '../../schemas/community-city.schema.json' with { type: 'json' };

function inspect(value, rule, path, errors) {
  if (rule.type) {
    const validType = rule.type === 'integer' ? Number.isSafeInteger(value)
      : rule.type === 'array' ? Array.isArray(value)
      : rule.type === 'object' ? value !== null && typeof value === 'object' && !Array.isArray(value)
      : typeof value === rule.type;
    if (!validType) { errors.push(path + ': expected ' + rule.type); return; }
  }
  if (Object.hasOwn(rule, 'const') && value !== rule.const) errors.push(path + ': incorrect fixed value');
  if (rule.enum && !rule.enum.includes(value)) errors.push(path + ': unsupported value');
  if (typeof value === 'number') {
    if (rule.minimum !== undefined && value < rule.minimum) errors.push(path + ': below minimum');
    if (rule.maximum !== undefined && value > rule.maximum) errors.push(path + ': above maximum');
  }
  if (typeof value === 'string') {
    if (rule.minLength !== undefined && [...value].length < rule.minLength) errors.push(path + ': too short');
    if (rule.maxLength !== undefined && [...value].length > rule.maxLength) errors.push(path + ': too long');
    if (rule.pattern && !(new RegExp(rule.pattern, 'u')).test(value)) errors.push(path + ': malformed identifier');
    if (/[\u0000-\u001f\u007f]/u.test(value)) errors.push(path + ': control characters forbidden');
  }
  if (Array.isArray(value)) {
    if (rule.minItems !== undefined && value.length < rule.minItems) errors.push(path + ': too few items');
    if (rule.maxItems !== undefined && value.length > rule.maxItems) errors.push(path + ': too many items');
    if (rule.uniqueItems && new Set(value.map(item => JSON.stringify(item))).size !== value.length) errors.push(path + ': repeated items');
    if (rule.items) value.forEach((item, index) => inspect(item, rule.items, path + '[' + index + ']', errors));
  } else if (value !== null && typeof value === 'object') {
    for (const key of rule.required || []) if (!Object.hasOwn(value, key)) errors.push(path + '.' + key + ': required');
    for (const [key, item] of Object.entries(value)) {
      if (!Object.hasOwn(rule.properties || {}, key)) {
        if (rule.additionalProperties === false) errors.push(path + '.' + key + ': unknown field');
      } else {
        inspect(item, rule.properties[key], path + '.' + key, errors);
      }
    }
  }
}

export function validatePack(pack) {
  const errors = [];
  inspect(pack, schema, '$', errors);
  // Do not inspect nested fields until the basic shape is valid.
  if (errors.length) return errors;
  const buildingIds = new Set();
  for (const building of pack.buildings) {
    if (buildingIds.has(building.id)) errors.push('duplicate building ID: ' + building.id);
    buildingIds.add(building.id);
  }
  const pieceIds = new Set();
  const occupiedTargets = new Set();
  const piecesPerBuilding = new Map();
  for (const piece of pack.pieces) {
    if (pieceIds.has(piece.id)) errors.push('duplicate piece ID: ' + piece.id);
    pieceIds.add(piece.id);
    if (!buildingIds.has(piece.buildingId)) errors.push(piece.id + ': unknown building reference');
    piecesPerBuilding.set(piece.buildingId, (piecesPerBuilding.get(piece.buildingId) || 0) + 1);
    const { x, y, z } = piece.target;
    if (x >= pack.city.grid.width || y >= pack.city.grid.height) errors.push(piece.id + ': target is off the city grid');
    const pos = [x, y, z].join(',');
    if (occupiedTargets.has(pos)) errors.push(piece.id + ': target overlaps another piece');
    occupiedTargets.add(pos);
  }
  for (const building of pack.buildings) if (!piecesPerBuilding.has(building.id)) errors.push(building.id + ': building has no pieces');
  const missionIds = new Set();
  for (const mission of pack.missions) {
    if (missionIds.has(mission.id)) errors.push('duplicate mission ID: ' + mission.id);
    missionIds.add(mission.id);
    if (!buildingIds.has(mission.buildingId)) errors.push(mission.id + ': unknown mission building');
  }
  return errors;
}


export function validatePackBytes(text){
 if(typeof text!=='string')return ['invalid text content'];
 if(new TextEncoder().encode(text).byteLength>MAX_PACK_BYTES)return ['pack larger than 64 KiB'];
 let pack;
 try{pack=JSON.parse(text);}catch{return ['invalid JSON'];}
 return validatePack(pack);
}
