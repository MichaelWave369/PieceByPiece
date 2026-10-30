import first from '../game/campaign/the-living-block.json';
import def from '../game/campaign/living-block-systems.json';
import harbor from '../game/campaign/tidesreach-first-dock.json';
import {readFirstDistrictStatus,readHarborStatus} from './core/campaign.mjs';
import './harbor.css';

const $=id=>document.getElementById(id);
const f=readFirstDistrictStatus(window.localStorage,first,def);
const h=readHarborStatus(window.localStorage,harbor);
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
