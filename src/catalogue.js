import {checkCatalogue,findCatalogueEntries,CATALOGUE_CACHE_KEY} from './core/community-catalogue.mjs';
import './community-library.css';
const $=id=>document.getElementById(id);
let manifest=null;
function status(text,isError=false){$('library-status').textContent=text;$('library-status').dataset.error=String(isError);}
function card(entry){
 const article=document.createElement('article');
 article.className='library-card';
 const hue={village:'🌿',harbor:'⚓',garden:'🌱',industrial:'⚙️',neon:'✦'}[entry.theme]||'✦';
 const top=document.createElement('span');top.className='library-theme';top.textContent=hue+' '+entry.theme.toUpperCase();
 const title=document.createElement('h2');title.textContent=entry.title;
 const author=document.createElement('p');author.className='library-creator';author.textContent='By '+entry.creator;
 const summary=document.createElement('p');summary.textContent=entry.description;
 const details=document.createElement('p');details.className='library-details';
 details.textContent=entry.pieces+' pieces · '+entry.buildings+' buildings · '+entry.missions+' missions · '+entry.estimatedMinutes+' min · '+entry.difficulty;
 const license=document.createElement('p');license.className='library-license';
 license.textContent='License: '+entry.license+' · Reviewed repository pack · SHA-256 protected';
 const link=document.createElement('a');link.href='./play-community.html?id='+encodeURIComponent(entry.id);
 link.textContent='Play this city';
 article.append(top,title,author,summary,details,license,link);
 return article;
}
function render(){
 if(!manifest)return;
 const entries=findCatalogueEntries(manifest,{search:$('search-cities').value,theme:$('filter-theme').value});
 $('library-grid').replaceChildren(...entries.map(card));
 status(entries.length+' of '+manifest.entries.length+' reviewed '+(manifest.entries.length===1?'city':'cities')+' shown.');
 if(!entries.length){
  const p=document.createElement('p');p.className='library-empty';
  p.textContent='No reviewed cities match those filters. Try another theme or search.';
  $('library-grid').append(p);
 }
}
async function load(){
 try{
  const response=await fetch(import.meta.env.BASE_URL+'community/catalogue.json',{cache:'no-cache'});
  if(!response.ok)throw new Error('The public catalogue is unavailable');
  const text=await response.text();
  if(new TextEncoder().encode(text).byteLength>256*1024)throw new Error('Catalogue is larger than allowed');
  const parsed=checkCatalogue(JSON.parse(text));
  manifest=parsed;
  try{localStorage.setItem(CATALOGUE_CACHE_KEY,JSON.stringify(parsed));}catch{}
 }catch(error){
  try{
   const cached=localStorage.getItem(CATALOGUE_CACHE_KEY);
   if(cached)manifest=checkCatalogue(JSON.parse(cached));
  }catch{}
  if(!manifest)return status('Could not load the reviewed catalogue: '+error.message,true);
  status('Using the last catalogue saved on this device. Pack checks still apply.');
 }
 render();
}
$('search-cities').addEventListener('input',render);
$('filter-theme').addEventListener('change',render);
load();
