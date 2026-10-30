import first from '../game/campaign/the-living-block.json';
import def from '../game/campaign/living-block-systems.json';
import harbor from '../game/campaign/tidesreach-first-dock.json';
import garden from '../game/campaign/verdantia-skygarden.json';
import iron from '../game/campaign/ironhaven-commons-rail.json';
import citadel from '../game/campaign/citadel-common-ground.json';
import {readFirstDistrictStatus,readHarborStatus,readGardenAccess,readGardenStatus,readIronAccess,readIronStatus,readCitadelAccess,readCitadelStatus} from './core/campaign.mjs';
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

const ironAccess=readIronAccess(window.localStorage,garden);
const ironProgress=readIronStatus(window.localStorage,iron);
$('iron-status').textContent=!ironAccess.unlocked
  ? 'LOCKED · Reopen the public skywalk in Verdantia'
  : ironProgress.complete?'RESTORED ✓ · The public supply train is moving'
    : ironProgress.built+' / '+ironProgress.total+' pieces · '+ironProgress.quests+' / '+ironProgress.totalQuests+' worker errands · '+ironProgress.route.publicSegments+' / 3 rail junctions';
$('iron-link').textContent=ironAccess.unlocked
  ? 'Enter Ironhaven':'View Ironhaven unlock requirements';
if(ironAccess.unlocked)$('atlas-summary').textContent='The Skygarden is restored. Ironhaven is ready to reclaim its railways.';

const finalAccess=readCitadelAccess(window.localStorage,iron);
const finalProgress=readCitadelStatus(window.localStorage,citadel);
$('citadel-status').textContent=!finalAccess.unlocked
 ? 'LOCKED · Restore the public freight railway in Ironhaven'
 : finalProgress.complete?'VICTORY ✓ · The Commons Charter is ratified'
   : finalProgress.built+' / '+finalProgress.total+' pieces · '+finalProgress.quests+' / '+finalProgress.totalQuests+' allies · '+finalProgress.manifest.publicCount+' / 3 public safeguards';
$('citadel-link').textContent=finalAccess.unlocked
 ? (finalProgress.complete?'Revisit Common Ground':'Enter the Corporate Citadel')
 : 'View Citadel unlock requirements';
if(finalProgress.complete)$('atlas-summary').textContent='The five-city campaign is restored! The Commons Charter now belongs to the people.';
else if(finalAccess.unlocked)$('atlas-summary').textContent='Ironhaven’s public supplies reached the Citadel. It is time for the final restoration.';

$('commons-access').textContent=finalProgress.complete
 ? 'UNLOCKED ✓ · Your creations belong to you'
 : 'LOCKED · Ratify Knowledge, Connection and Consent in the Citadel';
$('commons-link').textContent=finalProgress.complete
 ? 'Enter The Commons Workshop':'View The Commons requirements';
