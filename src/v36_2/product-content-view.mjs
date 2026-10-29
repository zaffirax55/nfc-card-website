import {translate} from './i18n.mjs';
import {productContent} from './product-content.mjs';
import {PRODUCT_TAB_KEYS,productTabWords} from './product-navigation.mjs';
const BASE='/nfc-card-website';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const href=(route,locale)=>BASE+(locale==='uk'?'':'/'+locale)+route;
const technical=new Set(['specs','specifications','formats','format','format-nfc','compatibility','service-compatibility','service-quality','quality','physical-design']);
const commercial=new Set(['payment','payment-delivery','payment-and-delivery','payment-methods','price','quantity_logic','quantity-group']);
export function productSectionTab(sectionId){return technical.has(sectionId)?'specs':commercial.has(sectionId)?'payment':'overview';}
function renderSection(section,key,locale){
 return `<section class="product-content-section" id="content-${esc(section.id)}" data-content-key="${key}:${esc(section.id)}" aria-labelledby="content-heading-${esc(section.id)}"><h3 id="content-heading-${esc(section.id)}">${esc(section.heading)}</h3><div>${section.paragraphs.map((p,i)=>`<p data-content-key="${key}:${esc(section.id)}:paragraphs:${i}">${esc(p)}</p>`).join('')}${section.items?.length?`<ul>${section.items.map((p,i)=>`<li data-content-key="${key}:${esc(section.id)}:items:${i}">${esc(p)}</li>`).join('')}</ul>`:''}${section.links?.length?`<div class="product-content-links">${section.links.map(link=>`<a class="text-link" href="${esc(href(link.href,locale))}">${esc(link.label)} →</a>`).join('')}</div>`:''}</div></section>`;
}
function renderFAQ(faq,key,{open=false}={}){
 return `<details id="content-faq-${esc(faq.id)}" data-content-key="${key}:faq:${esc(faq.id)}"${open?' open':''}><summary>${esc(faq.question)}</summary><p>${esc(faq.answer)}</p></details>`;
}
/** Source content is unchanged and appears once; only presentation groups change. */
export function renderProductOverview(entryId,locale='uk'){
 const content=productContent(entryId,locale),key=`${entryId}:${locale}`,text=productTabWords[locale]||productTabWords.uk;
 const paymentFAQ=entryId==='review-card-3d'?content.faq.find(f=>f.id==='3d-8'):null;
 const panels=PRODUCT_TAB_KEYS.map(tab=>{
  let body=content.sections.filter(s=>productSectionTab(s.id)===tab).map(s=>renderSection(s,key,locale)).join('');
  if(tab==='overview')body=`<p class="product-overview-summary" data-content-key="${key}:summary">${esc(content.summary)}</p>`+body;
  if(tab==='payment'&&paymentFAQ)body+=`<div class="product-content-faq product-payment-faq"><div class="faq-list">${renderFAQ(paymentFAQ,key,{open:true})}</div></div>`;
  if(tab==='payment')body+=`<p><a class="text-link" data-testid="product-payment-full-terms" href="${esc(href('/delivery-and-payment/',locale))}">${esc(translate('fullDeliveryTerms',locale))} →</a></p>`;
  if(tab==='faq')body=`<section class="product-content-faq" aria-labelledby="product-content-faq-title"><h2 id="product-content-faq-title">${esc(content.faqHeading)} · ${esc(content.name)}</h2><div class="faq-list">${content.faq.filter(f=>f!==paymentFAQ).map(f=>renderFAQ(f,key)).join('')}</div></section>`;
  return `<section id="product-panel-${tab}" class="product-tab-panel" role="tabpanel" tabindex="0" aria-labelledby="product-tab-${tab}" data-product-tab-panel="${tab}"><h2 class="product-panel-title">${esc(text[tab])}</h2>${body}</section>`;
 }).join('');
 return `<section id="product-overview" class="section product-overview" aria-labelledby="product-overview-title"><div class="wrap"><div class="section-heading"><h2 id="product-overview-title">${esc(content.sectionTitle)} · ${esc(content.name)}</h2></div><div class="product-overview-sections" data-product-tab-panels>${panels}</div><div class="product-content-policies">${content.policyLinks.map(link=>`<a class="text-link" href="${esc(href(link.href,locale))}">${esc(link.label)} →</a>`).join('')}<a class="text-link" href="#product-config">${esc(content.nextLabel)} ↑</a></div></div></section>`;
}
