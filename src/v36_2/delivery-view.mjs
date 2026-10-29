/** Full owner delivery information, using the accepted v36.1 editorial components. */
import {deliveryContent} from './delivery-content.mjs';
export {deliveryContent} from './delivery-content.mjs';

const BASE='/nfc-card-website';
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const localeOf=locale=>['uk','en','pl'].includes(locale)?locale:'uk';

// Data is owner copy. Parse only emphasis and local links, escaping every text segment.
function inline(value,esc,url){
 const text=String(value),tokens=/\*\*([^*]+)\*\*|\[([^\]]+)\]\((\/[A-Za-z0-9\-/#?=&]+)\)/g;
 let html='',last=0,match;
 while((match=tokens.exec(text))){
  html+=esc(text.slice(last,match.index));
  html+=match[1]!==undefined?'<strong>'+esc(match[1])+'</strong>':'<a href="'+esc(url(match[3]))+'">'+esc(match[2])+'</a>';
  last=match.index+match[0].length;
 }
 return html+esc(text.slice(last));
}
function actions(c,esc,url,hero=false){
 const labels=c.labels;
 return '<nav class="button-row '+(hero?'editorial-hero-actions':'editorial-actions')+'" aria-label="'+esc(c.title)+'">'+
  '<a class="button" href="'+esc(url('/solutions/'))+'">'+esc(labels.catalog)+'</a>'+
  '<a class="button secondary" href="'+esc(url('/services/design/'))+'">'+esc(labels.design)+'</a>'+
  '<a class="text-link" href="'+esc(url('/contact/'))+'">'+esc(labels.contact)+'</a></nav>';
}
function block(item,esc,url){
 if(item.type==='paragraph')return '<p>'+inline(item.text,esc,url)+'</p>';
 const ordered=item.type==='ordered',tag=ordered?'ol':'ul';
 return '<'+tag+' class="'+(ordered?'editorial-process-list':'compact-list')+'">'+item.items.map(text=>'<li>'+inline(text,esc,url)+'</li>').join('')+'</'+tag+'>';
}
export function renderDeliveryPage(locale='uk',h={}){
 locale=localeOf(locale);
 const c=deliveryContent[locale],esc=h.esc||escape,url=h.url||(route=>BASE+(locale==='uk'?'':'/'+locale)+route);
 const header='<div class="page-head editorial-intro"><h1 id="delivery-page-title">'+esc(c.title)+'</h1>'+c.intro.map(text=>'<p class="prose">'+inline(text,esc,url)+'</p>').join('')+actions(c,esc,url,true)+'</div>';
 const sections='<div class="editorial-sections">'+c.sections.map(s=>'<section class="editorial-section prose" data-delivery-section="'+esc(s.id)+'" id="delivery-'+esc(s.id)+'" aria-labelledby="delivery-'+esc(s.id)+'-title"><div class="editorial-section-heading"><h2 id="delivery-'+esc(s.id)+'-title">'+esc(s.title)+'</h2></div><div class="editorial-section-content">'+s.blocks.map(b=>block(b,esc,url)).join('')+'</div></section>').join('')+'</div>';
 const faq='<section class="editorial-section prose" data-delivery-section="faq" aria-labelledby="delivery-faq-title"><div class="editorial-section-heading"><h2 id="delivery-faq-title">'+esc(c.labels.faq)+'</h2></div><div class="editorial-section-content faq-list">'+c.faq.map(q=>'<details id="delivery-faq-'+esc(q.id)+'" data-delivery-faq="'+esc(q.id)+'"><summary>'+esc(q.question)+'</summary><div class="prose detail-content"><p>'+inline(q.answer,esc,url)+'</p></div></details>').join('')+'</div></section>';
 return '<div class="wrap editorial-page editorial-delivery" data-editorial-page="delivery" data-commercial-market="'+c.market+'" data-commercial-currency="'+c.currency+'" aria-labelledby="delivery-page-title">'+header+sections+faq+actions(c,esc,url)+'</div>';
}
