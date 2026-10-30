/**
 * Detect missing pages, unbundled module source and subpath-broken JS/CSS.
 * Unlike a single-page smoke test, this validates every playable campaign page.
 */
import {existsSync,readFileSync} from 'node:fs';
import {resolve,sep} from 'node:path';

const folder=resolve('dist'),expected='/PieceByPiece/';
const pages=['index.html','districts.html','harbor.html'];
let failed=false;
function fail(message){failed=true;process.stderr.write('PAGES VERIFY FAILED: '+message+'\n');}
for(const page of pages){
 const absolute=resolve(folder,page);
 if(!existsSync(absolute)){fail('Missing '+page);continue;}
 const html=readFileSync(absolute,'utf8');
 if(/<script[^>]+src="\/src\//u.test(html))fail(page+' contains an unbundled source script');
 const paths=[...html.matchAll(/(?:src|href)="([^"]+)"/gu)]
  .map(m=>m[1]).filter(p=>p.includes('/assets/'));
 if(!paths.some(p=>p.endsWith('.js')))fail(page+' has no JS bundle');
 if(!paths.some(p=>p.endsWith('.css')))fail(page+' has no CSS bundle');
 for(const url of paths){
  if(!url.startsWith(expected+'assets/')){fail(page+' has wrong base path: '+url);continue;}
  const relative=url.slice(expected.length);
  if(!/^[a-zA-Z0-9._/-]+$/u.test(relative)||relative.includes('..')){
   fail(page+' has unsafe asset path: '+relative);continue;
  }
  const artifact=resolve(folder,relative);
  if(!artifact.startsWith(folder+sep)){fail('Asset escaped dist: '+relative);continue;}
  if(!existsSync(artifact))fail(page+' links missing asset: '+relative);
 }
 process.stdout.write('Checked '+page+' ('+paths.length+' asset links)\n');
}
if(failed)process.exitCode=1;
else process.stdout.write('PASS: three complete linked campaign pages under '+expected+'\n');
