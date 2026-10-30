import first from '../game/campaign/the-living-block.json';
import def from '../game/campaign/living-block-systems.json';
import harbor from '../game/campaign/tidesreach-first-dock.json';
import garden from '../game/campaign/verdantia-skygarden.json';
import {readFirstDistrictStatus,readHarborStatus,readGardenAccess,readGardenStatus} from './core/campaign.mjs';
import './harbor.css';

const $=id=>document.getElementById(id);
const f=readFirstDistrictStatus(window.localStorage,first,def);
const h=readHarborStatus(window.localStorage,harbor);
const gAccess=readGardenAccess(window.localStorage,harbor);
const g=readGardenStatus(window.localStorage,garden);
$('first-status').textContent=f.restored?'RESTORED ✓ · Tidesreach unlocked'
  : f.built+' / '+f.total+' pieces · '+f.quests+' / '+f.totalQuests+' neighbor errands';
$('harbor-status').textContent=f.restored
  ? h.complete?'RESTORED ✓ · The public ferry is running'
    : h.built+' / '+h.total+' pieces · '+h.quests+' / '+h.totalQuests+' dock errands'
  :'LOCKED · Restore the Living Block to unlock';
$('atlas-summary').textContent=f.restored
 ? 'The commons is open. The sea is calling. Tidesreach is ready.'
 : 'Chapter two unlocks after you restore the first city and its Lantern Grid.';
$('harbor-link').textContent=f.restored?'Enter Tidesreach':'View Tidesreach unlock requirements';

$('garden-status').textContent=!gAccess.unlocked
  ? 'LOCKED · Reopen the public ferry in Tidesreach'
  : g.complete?'RESTORED ✓ · The skywalk is open to all'
    : g.built+' / '+g.total+' pieces · '+g.quests+' / '+g.totalQuests+' garden errands';
$('garden-link').textContent=gAccess.unlocked
  ? 'Enter Verdantia':'View Verdantia unlock requirements';
$('atlas-summary').textContent=gAccess.unlocked
  ? 'The ferry is running and Verdantia’s sky gardens are ready to restore.'
  : f.restored?'The commons is open. Tidesreach awaits its public ferry.'
    :'Chapter two unlocks after restoring the Living Block and Lantern Grid.';
