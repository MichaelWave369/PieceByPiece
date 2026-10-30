import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { MAX_PACK_BYTES, validatePack } from '../src/core/community-validator.mjs';
export { MAX_PACK_BYTES, validatePack } from '../src/core/community-validator.mjs';

export function validateFile(filename) {
  const bytes = readFileSync(filename);
  if (bytes.length > MAX_PACK_BYTES) return ['pack larger than 64 KiB'];
  let pack;
  try { pack = JSON.parse(bytes.toString('utf8')); }
  catch { return ['invalid JSON']; }
  return validatePack(pack);
}

function filesIn(target) {
  if (!statSync(target).isDirectory()) return [target];
  return readdirSync(target, { withFileTypes: true }).flatMap(entry => {
    const path = join(target, entry.name);
    if (entry.isDirectory()) return filesIn(path);
    return entry.isFile() && entry.name.endsWith('.json') ? [path] : [];
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const targets = process.argv.slice(2);
  let failures = 0;
  try {
    for (const target of targets.length ? targets : ['community/packs']) {
      for (const file of filesIn(resolve(target))) {
        const errors = validateFile(file);
        if (errors.length) {
          failures++;
          process.stderr.write('FAIL ' + file + '\n' + errors.map(e => '  - ' + e).join('\n') + '\n');
        } else process.stdout.write('PASS ' + file + '\n');
      }
    }
  } catch (error) {
    failures++;
    process.stderr.write('FAIL ' + error.message + '\n');
  }
  if (failures) process.exitCode = 1;
}
