/**
 * Deterministic local review pipeline: only JSON committed under community/packs
 * reaches the public static catalogue. No online submissions or remote resources.
 * Reads UTF-8 bytes exactly, hashes those same bytes, and copies them to dist inputs.
 */
import {readdirSync,readFileSync,mkdirSync,writeFileSync,copyFileSync,rmSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {validateFile,MAX_PACK_BYTES} from './validate-community.mjs';
const source=resolve('community/packs');
const destination=resolve('public/community');
const files=readdirSync(source).filter(x=>/^[a-z0-9]+(?:-[a-z0-9]+)*\.json$/u.test(x)).sort();
const entries=[],ids=new Set();
for(const filename of files){
 const path=join(source,filename);
 const errors=validateFile(path);
 if(errors.length)throw new Error(filename+': '+errors.join('; '));
 const raw=readFileSync(path);
 if(raw.byteLength>MAX_PACK_BYTES)throw new Error('Oversized community pack '+filename);
 const pack=JSON.parse(raw.toString('utf8')),id=pack.metadata.id;
 if(filename!==id+'.json')throw new Error('Pack ID and filename disagree: '+filename);
 if(ids.has(id))throw new Error('Duplicate catalogue ID: '+id);
 ids.add(id);
 entries.push({
  id,title:pack.metadata.title,creator:pack.metadata.creator,
  description:pack.metadata.description,theme:pack.city.theme,
  difficulty:pack.metadata.difficulty,estimatedMinutes:pack.metadata.estimatedMinutes,
  license:pack.rights.license,buildings:pack.buildings.length,
  pieces:pack.pieces.length,missions:pack.missions.length,
  tags:pack.metadata.tags,
  file:'community/packs/'+filename,
  bytes:raw.byteLength,
  sha256:createHash('sha256').update(raw).digest('hex')
 });
}
const manifest={format:'piecebypiece.catalogue.v1',generatedFrom:'reviewed-repository-packs',entries};
if(!process.argv.includes('--verify')){
 // Fail closed: delete only generated community output. No user files live there.
 rmSync(destination,{recursive:true,force:true});
 mkdirSync(join(destination,'packs'),{recursive:true});
 for(const entry of entries)copyFileSync(join(source,entry.id+'.json'),join(destination,'packs',entry.id+'.json'));
 writeFileSync(join(destination,'catalogue.json'),JSON.stringify(manifest,null,2)+'\n');
}
process.stdout.write('Verified '+entries.length+' reviewed community pack(s)'+
 (process.argv.includes('--verify')?' (read-only)':' (copied with SHA-256)')+'\n');
