/** Deterministic editorial rendering shared by static HTML and enhanced navigation. */
import {editorialContent,generalFAQGroups} from './editorial-content.mjs';
export {editorialContent,generalFAQGroups,designEntryLabels} from './editorial-content.mjs';
import {catalog,priceCart} from './commerce.mjs';
const BASE='/nfc-card-website';
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const localeOf=locale=>['uk','en','pl'].includes(locale)?locale:'uk';
const physicalById=new Map(catalog.map(p=>[p.id,p]));
export function designPriceSummary(entry,locale='uk'){
 locale=localeOf(locale);const c=editorialContent[locale],p=physicalById.get(entry);
 if(!p||p.status!=='active'||p.design!=='branded')throw new Error('Invalid design base');
 const market=locale==='pl'?'PL':'UA',currency=market==='PL'?'PLN':locale==='uk'?'грн':'UAH';
 const fmt=value=>new Intl.NumberFormat(locale==='uk'?'uk-UA':locale==='pl'?'pl-PL':'en-GB',{maximumFractionDigits:0}).format(value)+' '+currency;
 const rows=[1,2].map(quantity=>({quantity,amount:priceCart([{lineId:'price-summary',productId:entry,quantity,destination:'',notes:''}],market).total}));
 return rows.every(r=>r.amount!==null)?rows.map(r=>(r.quantity===1?c.labels.one:c.labels.two)+' — '+fmt(r.amount)).join(' · '):c.labels.quote;
}
export function editorialMediaSlots(key,locale='uk'){
 return (editorialContent[localeOf(locale)][key]?.media??[]).map(m=>({...m,locale:localeOf(locale),status:'awaiting_approved_material',provenance:'unfilled_placeholder',notCustomerProof:true}));
}
function helpers(locale,h){
 return {esc:h.esc||escape,url:h.url||(route=>BASE+(locale==='uk'?'':'/'+locale)+route)};
}
function heading(title,intro,esc,cta=''){return '<div class="page-head editorial-intro"><h1>'+esc(title)+'</h1><p class="prose">'+esc(intro)+'</p>'+cta+'</div>';}
function sections(items,key,esc){return '<div class="editorial-sections">'+items.map(s=>'<section class="editorial-section prose" data-editorial-section="'+esc(key+':'+s.id)+'" id="'+esc(key+'-'+s.id)+'"><div class="editorial-section-heading"><h2>'+esc(s.title)+'</h2></div><div class="editorial-section-content">'+(s.paragraphs||[]).map(p=>'<p>'+esc(p)+'</p>').join('')+(s.items?'<ol class="editorial-process-list">'+s.items.map(item=>'<li>'+esc(item)+'</li>').join('')+'</ol>':'')+'</div></section>').join('')+'</div>';}
function actions(c,esc,url){return '<div class="button-row editorial-actions"><a class="button" href="'+esc(url('/solutions/'))+'">'+esc(c.labels.catalog)+'</a><a class="button secondary" href="'+esc(url('/services/design/'))+'">'+esc(c.labels.design)+'</a><a class="text-link" href="'+esc(url('/contact/'))+'">'+esc(c.labels.contact)+'</a></div>';}
function media(key,locale,c,esc){
 const slots=editorialMediaSlots(key,locale);if(!slots.length)return '';
 const icon=m=>m.id.includes('VIDEO')||m.id.includes('DEMO')||m.id.includes('SCREEN')?'<svg viewBox="0 0 48 48" fill="none"><rect x="7" y="8" width="34" height="32" rx="5"/><path d="m20 17 11 7-11 7Z"/></svg>':'<svg viewBox="0 0 48 48" fill="none"><rect x="7" y="8" width="34" height="32" rx="5"/><circle cx="18" cy="18" r="3"/><path d="m8 34 11-10 7 6 6-5 9 9"/></svg>';
 return '<div class="editorial-media-grid" data-editorial-media="'+key+'">'+slots.map(m=>'<figure class="editorial-media-placeholder" data-media-slot="'+esc(m.id)+'" data-media-state="awaiting-approved-material" role="group" aria-label="'+esc(m.title)+'"><div class="editorial-media-placeholder-face" aria-hidden="true">'+icon(m)+'</div><figcaption><strong>'+esc(m.title)+'</strong><p>'+esc(c.labels.example)+'</p></figcaption></figure>').join('')+'</div>';
}
export function renderGeneralFAQ(locale='uk',h={},options={}){
 locale=localeOf(locale);const c=editorialContent[locale],{esc,url}=helpers(locale,h),groups=generalFAQGroups[locale];
 return '<div class="editorial-faq-layout"><nav class="editorial-faq-navigation" aria-label="'+esc(c.labels.faq)+'">'+groups.map(g=>'<a href="#general-faq-'+esc(g.id)+'">'+esc(g.title)+'<span aria-hidden="true">↗</span></a>').join('')+'</nav><div class="editorial-faq-groups">'+groups.map(g=>'<section class="editorial-faq-group" aria-labelledby="general-faq-'+esc(g.id)+'"><h2 id="general-faq-'+esc(g.id)+'">'+esc(g.title)+'</h2><div class="faq-list">'+g.items.map(q=>'<details id="general-faq-'+esc(q.id)+'" data-general-faq="'+esc(q.id)+'"><summary>'+esc(q.q)+'</summary><div class="prose"><p>'+esc(q.a)+'</p>'+(q.href?'<p><a class="text-link" href="'+esc(url(q.href))+'">'+esc(c.labels.details)+' →</a></p>':'')+'</div></details>').join('')+'</div></section>').join('')+'</div></div>'+(options.withActions===false?'':actions(c,esc,url));
}
export function renderEditorialPage(key,locale='uk',h={}){
 locale=localeOf(locale);const c=editorialContent[locale],{esc,url}=helpers(locale,h);
 if(key==='faq')return '<div class="wrap editorial-page editorial-faq" data-editorial-page="faq">'+heading(c.labels.faq,({uk:'Відповіді про NFC, вибір картки, власний дизайн, заявку та отримання.',en:'Answers about NFC, choosing a card, custom artwork, enquiries and delivery.',pl:'Odpowiedzi o NFC, wyborze karty, własnym projekcie, zgłoszeniu i dostawie.'})[locale],esc)+renderGeneralFAQ(locale,h)+'</div>';
 const page=c[key];if(!page)throw new Error('Unknown editorial page');
 const howPhoto='<figure class="editorial-product-photo"><img src="/nfc-card-website/assets/review-hand.webp" width="900" height="900" loading="lazy" data-media-provenance="user_provided_business_asset" data-media-claim-role="actual_product" alt="'+esc(({uk:'Готова фізична Google Review Card',en:'Ready-made physical Google Review Card',pl:'Gotowa fizyczna Google Review Card'})[locale])+'"><figcaption>'+esc(({uk:'Google Review Card · фото фізичної готової картки.',en:'Google Review Card · photograph of the physical ready-made card.',pl:'Google Review Card · zdjęcie fizycznej gotowej karty.'})[locale])+'</figcaption></figure>';
 const heroActions='<div class="button-row editorial-hero-actions">'+(key==='design'?'<a class="button" href="#design-request">'+esc(c.labels.enquire)+'</a><a class="text-link" href="#design-bases-title">'+esc(page.basesTitle)+' ↓</a>':key==='about'?'<a class="button" href="'+esc(url('/contact/'))+'">'+esc(c.labels.contact)+'</a>':'<a class="button" href="'+esc(url('/solutions/'))+'">'+esc(c.labels.catalog)+'</a><a class="text-link" href="'+esc(url('/services/design/'))+'">'+esc(c.labels.design)+' →</a>')+'</div>';
 let body=heading(page.title,page.intro,esc,heroActions);
 if(key==='about')body='<div class="editorial-hero editorial-founder-hero">'+body+'<figure class="editorial-founder"><img src="/nfc-card-website/assets/founder-primary.webp" alt="'+esc(page.founderAlt)+'" width="800" height="1000" loading="lazy" data-media-provenance="user_provided_business_asset" data-media-claim-role="founder_portrait"><figcaption>'+esc(page.founderCaption)+'</figcaption></figure></div>';
 if(key==='how')body='<div class="editorial-hero editorial-how-hero">'+body+howPhoto+'</div>';
 body+=sections(page.sections,key,esc);
 if(key==='how'){
  const links=[['review-card','Google Review Card'],['beauty-review-card','Beauty Mini'],['restaurant-review-card','Restaurant Mini'],['nfc-instagram-card','NFC Instagram Card'],['nfc-menu-card','NFC Menu Card']];
  body+='<nav class="button-row editorial-product-links" aria-label="'+esc(c.labels.catalog)+'">'+links.map(([id,label])=>'<a class="text-link" href="'+esc(url(physicalById.get(id).route))+'">'+esc(label)+' →</a>').join('')+'</nav>'+media('how',locale,c,esc);
 }
 if(key==='design'){
  const selected=h.selectedEntry||h.selectedProduct?.id||h.entry||'';
  body+='<section class="editorial-design-bases" aria-labelledby="design-bases-title"><h2 id="design-bases-title">'+esc(page.basesTitle)+'</h2><div class="editorial-base-grid">'+page.bases.map(b=>'<article class="editorial-design-base" data-design-base="'+esc(b.entry)+'"><h3>'+esc(b.title)+'</h3><p>'+esc(b.body)+'</p><p class="design-base-price" data-design-price="'+esc(b.entry)+'">'+esc(designPriceSummary(b.entry,locale))+'</p><a class="button secondary" href="'+esc(url('/services/design/')+'?entry='+encodeURIComponent(b.entry)+'#design-request')+'"'+(selected===b.entry?' aria-current="true"':'')+'>'+esc(c.labels.enquire)+'<span class="sr-only"> · '+esc(b.title)+'</span></a></article>').join('')+'</div></section>'+media('design',locale,c,esc)+'<section class="editorial-design-next prose"><h2>'+esc(c.labels.freeMockup)+'</h2><p>'+esc(c.labels.googleLater)+'</p><a class="button" href="#design-request">'+esc(c.labels.enquire)+'</a></section>';
 }else body+=actions(c,esc,url);
 return '<div class="wrap editorial-page editorial-'+esc(key)+'" data-editorial-page="'+esc(key)+'">'+body+'</div>';
}
