/**
 * Prevent a green-looking Pages workflow from publishing a broken /assets URL.
 * Run after npm run build:pages. No network connection or browser required.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const folder=resolve('dist');
const htmlFile=resolve(folder,'index.html');
const expected='/PieceByPiece/';
function fail(message) {
  process.stderr.write('PAGES VERIFY FAILED: '+message+'\n');
  process.exitCode=1;
}
if(!existsSync(htmlFile)) {
  fail('dist/index.html does not exist');
} else {
  const html=readFileSync(htmlFile,'utf8');
  if(html.includes('/src/main.js'))fail('Unbundled source script remains in the page');
  const filePaths=[...html.matchAll(/(?:src|href)="([^"]+)"/gu)]
    .map(match=>match[1])
    .filter(path=>!path.startsWith('#')&&!path.startsWith('data:'));
  const bundle=filePaths.filter(path=>path.includes('/assets/'));
  if(!bundle.some(path=>path.endsWith('.js')))fail('No JavaScript bundle in index.html');
  if(!bundle.some(path=>path.endsWith('.css')))fail('No stylesheet bundle in index.html');
  for(const path of bundle) {
    if(!path.startsWith(expected+'assets/')) {
      fail('Asset URL does not start with '+expected+'assets/: '+path);
      continue;
    }
    const relative=path.slice(expected.length);
    if(!/^[a-zA-Z0-9._/-]+$/u.test(relative) || relative.includes('..')) {
      fail('Unsafe artifact path: '+relative);
      continue;
    }
    const artifact=resolve(folder,relative);
    if(!artifact.startsWith(folder+'/')) {
      fail('Artifact path escapes dist: '+relative);
      continue;
    }
    if(!existsSync(artifact))fail('Missing built artifact: '+relative);
  }
  if(process.exitCode!==1)process.stdout.write(
    'PASS: '+bundle.length+' bundled JS/CSS files resolve under '+expected+'\n');
}
