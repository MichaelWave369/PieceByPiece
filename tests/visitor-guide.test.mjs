import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { blankSession,tryPlace,progress,completeMission } from '../src/core/puzzle.mjs';
import { makeShowcaseSession,guideFor } from '../src/core/visitor-guide.mjs';

const pack=JSON.parse(readFileSync(new URL('../game/campaign/the-living-block.json',import.meta.url),'utf8'));
const finished=()=>pack.pieces.reduce((session,piece)=>tryPlace(pack,session,piece.id,piece.target).session,blankSession(pack));

test('visitor guide explains how to start without a timer',()=>{
 const g=guideFor(pack,blankSession(pack),'workshop');
 assert.equal(g.action,'choose-piece');
 assert.match(g.detail,/Nothing is timed/);
});
test('showcase is never the same object as the real save and awards no missions',()=>{
 const original=blankSession(pack);
 const snapshot=JSON.stringify(original);
 const preview=makeShowcaseSession(pack);
 assert.equal(progress(pack,preview).complete,true);
 assert.equal(preview.missions.length,0);
 assert.equal(original.placed.length,0);
 assert.notEqual(preview,original);
 preview.placed.pop();
 assert.equal(JSON.stringify(original),snapshot);
});
test('guide tracks building progression, exploration, and room exits',()=>{
 let session=blankSession(pack);
 assert.equal(guideFor(pack,session,'workshop').action,'choose-piece');
 session=tryPlace(pack,session,pack.pieces[0].id,pack.pieces[0].target).session;
 assert.equal(guideFor(pack,session,'workshop').action,'keep-building');
 session=finished();
 assert.equal(guideFor(pack,session,'workshop').action,'enter-city');
 assert.equal(guideFor(pack,session,'explore').action,'talk');
 assert.equal(guideFor(pack,session,'explore','cafe').action,'exit-interior');
 for(const mission of pack.missions) session=completeMission(pack,session,mission.id).session;
 assert.equal(guideFor(pack,session,'explore').action,'power');
});
test('showcase instructions cannot be mistaken for a campaign unlock',()=>{
 const guide=guideFor(pack,blankSession(pack),'explore',null,true);
 assert.equal(guide.action,'end-preview');
 assert.match(guide.title,/no progress recorded/);
});
