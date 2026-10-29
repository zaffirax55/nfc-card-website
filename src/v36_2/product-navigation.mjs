import {productContentEntryIds} from './product-content.mjs';

const activeEntries=new Set(productContentEntryIds);
const activeByEntry=new Map();
export const PRODUCT_TAB_KEYS=Object.freeze(['overview','specs','payment','faq']);
export const productTabWords=Object.freeze({
 uk:{label:'Розділи про картку',overview:'Огляд',specs:'Характеристики',payment:'Оплата й доставка',faq:'Питання',configure:'До вибору картки',noScript:'Усі розділи про картку наведено нижче.'},
 en:{label:'Card information',overview:'Overview',specs:'Specifications',payment:'Payment & delivery',faq:'FAQ',configure:'Back to configuration',noScript:'All card information sections are shown below.'},
 pl:{label:'Informacje o karcie',overview:'Opis',specs:'Specyfikacja',payment:'Płatność i dostawa',faq:'Pytania',configure:'Wróć do konfiguracji',noScript:'Wszystkie informacje o karcie znajdują się poniżej.'}
});
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function productNavigationItems(entryId,locale='uk'){
 if(!activeEntries.has(entryId))return [];
 const text=productTabWords[locale]||productTabWords.uk;
 return PRODUCT_TAB_KEYS.map(key=>({key,label:text[key],id:'product-panel-'+key,tabId:'product-tab-'+key}));
}
/** No hidden panel in source HTML: JS enhancement is the only visibility boundary. */
export function renderProductNavigation(entryId,locale='uk'){
 const items=productNavigationItems(entryId,locale);if(!items.length)return '';
 const text=productTabWords[locale]||productTabWords.uk;
 return `<div class="product-navigation-shell product-tabs-shell" data-reading-navigation="tabs" data-reading-entry="${esc(entryId)}"><div class="wrap product-tabs-controls"><div class="product-tab-list" role="tablist" aria-label="${esc(text.label)}" data-product-tablist>${items.map((item,index)=>`<button type="button" id="${item.tabId}" role="tab" aria-controls="${item.id}" aria-selected="${index===0}" tabindex="${index===0?'0':'-1'}" data-product-tab="${item.key}" data-product-nav="${item.key}" disabled>${esc(item.label)}</button>`).join('')}</div><a class="text-link product-config-link" href="#product-config" data-product-config-cta>${esc(text.configure)} ↑</a><noscript><p class="small">${esc(text.noScript)}</p></noscript></div></div>`;
}
/** Useful for deliberate locale navigation; ordinary tab clicks never mutate URLs. */
export function selectedProductTabHash(){
 if(typeof document==='undefined')return '';
 const key=document.querySelector('[data-product-tab][aria-selected="true"]')?.dataset.productTab;
 return PRODUCT_TAB_KEYS.includes(key)?'#product-panel-'+key:'';
}
let cleanup=null;
export function bindProductNavigation(){
 if(typeof document==='undefined')return;
 cleanup?.();cleanup=null;
 const shell=document.querySelector('[data-reading-navigation="tabs"]');if(!shell)return;
 const list=shell.querySelector('[data-product-tablist]'),region=document.querySelector('[data-product-tab-panels]');
 const buttons=PRODUCT_TAB_KEYS.map(key=>list?.querySelector(`[data-product-tab="${key}"]`));
 const panels=PRODUCT_TAB_KEYS.map(key=>region?.querySelector(`[data-product-tab-panel="${key}"]`));
 if(!list||!region||buttons.some(x=>!x)||panels.some(x=>!x))return;
 const entry=shell.dataset.readingEntry,header=document.querySelector('header');let live=true;
 const previousOffset=document.documentElement.style.getPropertyValue('--reading-target-offset');
 function measure(){
  const height=header?Math.ceil(header.getBoundingClientRect().height):0;
  document.documentElement.style.setProperty('--reading-target-offset',height+24+'px');
 }
 function revealHorizontal(button){
  const b=button.getBoundingClientRect(),l=list.getBoundingClientRect();
  if(b.left<l.left)list.scrollLeft-=l.left-b.left+4;
  else if(b.right>l.right)list.scrollLeft+=b.right-l.right+4;
 }
 function activate(key,{focus=false}={}){
  if(!PRODUCT_TAB_KEYS.includes(key))key='overview';
  PRODUCT_TAB_KEYS.forEach((name,i)=>{
   const selected=name===key;buttons[i].setAttribute('aria-selected',String(selected));
   buttons[i].tabIndex=selected?0:-1;buttons[i].disabled=false;panels[i].hidden=!selected;
  });
  activeByEntry.set(entry,key);shell.dataset.activeTab=key;
  if(focus){const b=buttons[PRODUCT_TAB_KEYS.indexOf(key)];b.focus({preventScroll:true});revealHorizontal(b);}
 }
 function hashTarget(){
  let id;try{id=decodeURIComponent(location.hash.slice(1));}catch{return null;}
  if(!id)return null;const target=document.getElementById(id),panel=panelFor(target);
  return panel&&region.contains(panel)?{target,panel,key:panel.dataset.productTabPanel}:null;
 }
 function panelFor(target){return target&&['product-overview','product-overview-title'].includes(target.id)?panels[0]:target?.closest('[data-product-tab-panel]');}
 function revealHash({scroll=false}={}){
  if(!live)return;const item=hashTarget();if(!item)return;
  activate(item.key);if(item.target.tagName==='DETAILS')item.target.open=true;
  if(scroll){measure();item.target.scrollIntoView({block:'start',behavior:'auto'});}
 }
 const click=event=>{
  const b=event.target.closest('[data-product-tab]');if(!b||!list.contains(b))return;
  event.preventDefault();activate(b.dataset.productTab,{focus:true});
 };
 const keydown=event=>{
  const b=event.target.closest('[data-product-tab]');if(!b||!list.contains(b))return;
  let next=PRODUCT_TAB_KEYS.indexOf(b.dataset.productTab);
  if(event.key==='ArrowRight')next=(next+1)%buttons.length;
  else if(event.key==='ArrowLeft')next=(next+buttons.length-1)%buttons.length;
  else if(event.key==='Home')next=0;else if(event.key==='End')next=buttons.length-1;
  else return; // Native Enter/Space activation and Tab order stay intact.
  event.preventDefault();activate(PRODUCT_TAB_KEYS[next],{focus:true});
 };
 const fragmentClick=event=>{
  const a=event.target.closest('a[href^="#"]');if(!a)return;
  let id;try{id=decodeURIComponent(a.getAttribute('href').slice(1));}catch{return;}
  const target=document.getElementById(id),panel=panelFor(target);
  if(!panel||!region.contains(panel))return;
  activate(panel.dataset.productTabPanel);if(target.tagName==='DETAILS')target.open=true;
 };
 const onHash=()=>revealHash({scroll:true});
 const observer=typeof ResizeObserver==='undefined'?null:new ResizeObserver(measure);
 if(header)observer?.observe(header);
 list.addEventListener('click',click);list.addEventListener('keydown',keydown);document.addEventListener('click',fragmentClick);
 addEventListener('hashchange',onHash);addEventListener('resize',measure);
 shell.classList.add('product-tabs-enhanced');region.classList.add('product-tabs-enhanced');
 activate(hashTarget()?.key||activeByEntry.get(entry)||'overview');measure();shell.dataset.bound='true';
 // Only an explicit deep link may scroll. Changing tabs never calls this path.
 if(hashTarget())requestAnimationFrame(()=>requestAnimationFrame(()=>revealHash({scroll:true})));
 cleanup=()=>{
  live=false;observer?.disconnect();list.removeEventListener('click',click);list.removeEventListener('keydown',keydown);
  document.removeEventListener('click',fragmentClick);removeEventListener('hashchange',onHash);removeEventListener('resize',measure);
  if(previousOffset)document.documentElement.style.setProperty('--reading-target-offset',previousOffset);else document.documentElement.style.removeProperty('--reading-target-offset');
 };
}
