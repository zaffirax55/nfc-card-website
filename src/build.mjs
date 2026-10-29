import {nfcDemoView} from './nfc-demo-view.mjs';
import {instagram,instagramGlobalFAQs,instagramProductFAQs,instagramMediaEntry} from './instagram.mjs';
import {instagramViews} from './instagram-view.mjs';
import {menuViews,menuRoutes,menuGallery,menuFAQs,menuSEO} from './menu-view.mjs';
import {review3d} from './review3d.mjs';
import {review3dViews} from './review3d-view.mjs';
import {nicheViews,nicheRoutes,nicheMedia,nicheContent,nicheKinds,miniId,miniMediaKind} from './niche-view.mjs';
import {miniQuote,MINI_QUANTITIES} from './mini-contract.mjs';
import {publicLegalPage} from './public-legal.mjs';
import {publicURL, publicHTML, publicCSS, publicData, leadEndpoint, pagesFormHTML, unavailable, previewCSS} from './pages.mjs';
import {resolvePublication, reviewedContentSha256, robotsMeta, robotsFile, assertFinalLegalContent} from './publication.mjs';
import publicationApproval from './publication-approval.json' with {type:'json'};
import {aboutPage,aboutContent} from './about-view.mjs';
import analyticsContract from './analytics.json' with {type:'json'};
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {reviewForm,adminShell} from './review-view.mjs';
import {commerceViews,productRoute,productNames,galleries} from './commerce-view.mjs';
import {createHash} from 'node:crypto';
import media from './media-manifest.json' with {type:'json'};
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {config,ui,fields,errors,variants,copy,faqs,mediaPlan,flags,commerce,pair,validateModel} from './model.mjs';
import {canonicalQuote,money,priceText,contactItems} from './display.mjs';
import poland from './poland-commerce.json' with {type:'json'};
import {validatePolandCommerce} from './pl-commerce.mjs';
import {LOCALES,LOCALE_LABELS,LOCALE_NAMES,OG_LOCALES,localizedRoute,localizedValue,translate,polishUI,polishPlural} from './locale.mjs';
export const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=path.join(root,'site'),task=path.join(root,'refinements/instagram-v18');
const demoRevision=createHash('sha256').update(fs.readFileSync(path.join(root,'src/nfc-demo.css'))).update(fs.readFileSync(path.join(root,'src/nfc-demo-client.mjs'))).update(fs.readFileSync(path.join(root,'src/catalog-card.css'))).update(fs.readFileSync(path.join(root,'src/catalog-models.mjs'))).update(fs.readFileSync(path.join(root,'src/visual-v13.css'))).update(fs.readFileSync(path.join(root,'src/our-visual-refresh.css'))).digest('hex').slice(0,12);
validateModel();
validatePolandCommerce(poland);
const publication=resolvePublication({config,flags,approval:publicationApproval,contentHash:reviewedContentSha256(root)});
const pages=publication.deploymentTarget==='github-pages';
const configuredEndpoint=pages?leadEndpoint(process.env.NFC_LEAD_ENDPOINT):'';
const pagesPreview=pages&&publication.mode==='PUBLIC_PREVIEW';
if(pages&&publication.mode==='PUBLIC'&&!configuredEndpoint)throw Error('PUBLIC requires the accepted durable lead endpoint');
const endpoint=pagesPreview?'':configuredEndpoint;
export const esc=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
let locale='uk';
const t=x=>x&&typeof x==='object'&&!Array.isArray(x)&&Object.hasOwn(x,'uk')?localizedValue(x,locale,'build content'):x;
const P=(uk,en)=>translate(locale,uk,en);
const L=(uk,en,pl)=>locale==='uk'?uk:locale==='pl'?pl:en;
const U=(key,uk,en)=>t(ui[key])||P(uk,en);
const url=p=>localizedRoute(p,locale);
const link=(href,label,cls='',attrs='')=>`<a href="${esc(href)}" class="${cls}" ${attrs}>${esc(t(label))}</a>`;
const orderURL=(variant='',quantity='1')=>url('/order')+(variant?`?variant=${variant}&quantity=${quantity}`:'');
const cta=(variant='',label=null,secondary=false,quantity='1')=>link(orderURL(variant,quantity),label|| (variant==='branded'?U('mockup','Отримати безкоштовний макет','Get a free mockup'):variant==='bulk'?P('Розрахувати замовлення','Request a quote'):U('order','Замовити картку','Order a card')),`button${secondary?' secondary':''}`,`data-event="order_start" data-variant="${variant}" data-quantity="${quantity}"`);
const productNav=()=>[['/solutions',P('Картки','Cards')],['/solutions/review-card','Google Review Card'],[nicheRoutes.beauty,locale==='uk'?'Для б’юті':locale==='pl'?'Dla branży beauty':'For beauty'],[nicheRoutes.restaurant,locale==='uk'?'Для HoReCa':locale==='pl'?'Dla HoReCa':'For HoReCa'],[review3d.route,'Review Card 3D'],['/solutions/instagram-card','NFC Instagram Card'],['/solutions/menu-card','NFC Menu Card']];
const utilityNav=()=>[['/#how-it-works',P('Як працює','How it works')],['/#for-whom',P('Для бізнесу','For business')],['/about',P('Про нас','About us')],['/delivery-and-payment',P('Доставка й оплата','Delivery & payment')],['/#faq','FAQ'],['/contact',P('Контакти','Contact')]];
const nav=(all=false)=>(all?[...productNav(),...utilityNav()]:[...productNav(),utilityNav()[2]]).map(([path,label])=>link(url(path),label)).join('');
const contacts=()=>`<div class="contact-links">${contactItems(config.contacts,locale).map(c=>link(c.href,c.label,'text-action',`data-event="${c.kind}_click" ${/^https:/.test(c.href)?'target="_blank" rel="noopener noreferrer"':''}`)).join('')}</div>`;
const contactNote=()=>`<p class="field-hint">${P('Щодня 07:00–23:00. Зазвичай відповідаємо до 45 хвилин. Якщо застосунок не відкрився, додайте номер +380 98 042 16 19 у контакти або скористайтеся Telegram.','Daily 07:00–23:00. We usually reply within 45 minutes. If the app does not open, add +380 98 042 16 19 to your contacts or use Telegram.')}</p>`;
const list=items=>`<ul class="clean-list">${(items||[]).map(s=>`<li>${esc(s)}</li>`).join('')}</ul>`;

const asset=name=>{const item=media.find(m=>m.url.endsWith('/'+name));if(!item)throw Error('Unapproved media: '+name);return item;};
function picture(name,cls='',eager=false){
 const m=asset(name),variants=m.responsive||[],sizes='(max-width:768px) calc(100vw - 40px), 46vw';
 const source=m.avif?`<source type="image/avif" srcset="${[...(m.avif.responsive||[]),m.avif].map(v=>v.url+' '+v.width+'w').join(', ')}" sizes="${sizes}">`:'';
 const alt=locale==='uk'?m.alt_ua:locale==='en'?m.alt_en:m.alt_pl;
 if(locale==='pl'&&typeof alt!=='string')throw Error('Missing Polish media alt: '+name);
 const img=`<img class="${cls}" src="${m.url}" ${variants.length?`srcset="${[...variants,{url:m.url,width:Number(m.width)}].map(v=>v.url+' '+v.width+'w').join(', ')}" sizes="${sizes}"`:''} alt="${esc(alt)}" width="${m.width}" height="${m.height}" loading="${eager?'eager':'lazy'}" ${eager?'fetchpriority="high"':''} decoding="async" data-media-provenance="${m.provenance}" data-media-claim-role="${m.claim_role}">`;
 return source?`<picture class="responsive-picture">${source}${img}</picture>`:img;
}

const logo=(reversed=false)=>`<a href="${url('/')}" class="brand" aria-label="NFC CARD by Antonov Digital — ${P('головна','home')}"><img src="/assets/media/v9/nfc-card-logo-${reversed?'reversed':'primary'}.svg" alt="NFC CARD by Antonov Digital" width="1600" height="420"></a>`;
const views=()=>commerceViews({locale,esc,picture,asset});
const menu=()=>menuViews({locale,esc,url,picture,asset});
const niche=()=>nicheViews({locale,esc,url,picture,asset});
const review3dView=()=>review3dViews({locale,esc,url,picture,asset});
const commonFAQs=()=>[...faqs,...instagramGlobalFAQs,menuFAQs[0],menuFAQs[3],...niche().shared.global_faq.map((_,i)=>({id:'niche-faq-'+i,question:Object.fromEntries(LOCALES.map(lang=>[lang,nicheContent[lang].shared.global_faq[i].question])),answer:Object.fromEntries(LOCALES.map(lang=>[lang,nicheContent[lang].shared.global_faq[i].answer]))})),{id:'review3d-faq',question:{uk:'Чи є картка з об’ємним дизайном?',en:'Is a dimensional design available?',pl:P('Чи є картка з об’ємним дизайном?','Is a dimensional design available?')},answer:{uk:'Так. NFC Review Card 3D — версія з оргскла у готовому 3D-дизайні. Прототип доступний до замовлення; ціна однієї картки — 4 000 грн. Виготовляємо під замовлення, строк погоджуємо окремо.',en:'Yes: NFC Review Card 3D is an acrylic version with fixed 3D styling. The prototype is available to order at UAH 4,000 per card. Production time is agreed separately.',pl:P('Так. NFC Review Card 3D — версія з оргскла у готовому 3D-дизайні. Прототип доступний до замовлення; ціна однієї картки — 4 000 грн. Виготовляємо під замовлення, строк погоджуємо окремо.','Yes: NFC Review Card 3D is an acrylic version with fixed 3D styling. The prototype is available to order at UAH 4,000 per card. Production time is agreed separately.')}}];
function priceRows(v){return `<dl class="price-rows">${['1','2'].map(q=>`<div><dt>${q} ${P(q==='1'?'картка':'картки',q==='1'?'card':'cards')}</dt><dd data-quantity-price="${q}">${esc(priceText(canonicalQuote(v.id,q,locale),locale))}</dd></div>`).join('')}</dl>`;}
function brandedConcept(){return `<div class="branded-concept" data-design-role="custom_layout_example"><img src="/assets/media/v9/nfc-card-mark.svg" alt="" width="128" height="128"><span>${P('Ваш логотип.<br>Ваші кольори.<br>Ваш заклик.','Your logo.<br>Your colours.<br>Your message.')}</span><small>${P('Приклад розміщення вашого дизайну','Custom design layout example')}</small></div>`;}
const galleryNames=galleries.standard;
function galleryCaption(){return P('Промоілюстрація переходу до форми. Клієнт сам обирає оцінку, текст і публікацію.','An illustration of the path to the form. The customer chooses the rating, text and publication.');}
function destination(){return `<section id="direct-review" tabindex="-1" class="section destination-section"><div><p class="eyebrow">${esc(t(copy.destination.eyebrow))}</p><h2>${esc(t(copy.destination.heading))}</h2>${blockContent(copy.destination)}<p>${P('Google може попросити увійти в акаунт. Оцінку, зміст і публікацію завжди обирає клієнт.','Google may ask the customer to sign in. The customer always chooses the rating, content and publication.')}</p></div><figure>${picture('05-promo-direct-review-form.webp','destination-image')}<figcaption>${galleryCaption(4)}</figcaption></figure></section>`;}
function howSection(withDestination=true){return section('how','how-it-works','how-section',true)+(withDestination?destination():'');}
function facts(){return `<section id="product-facts" tabindex="-1" class="section facts-section"><div><p class="eyebrow">${esc(t(copy.facts.eyebrow))}</p><h2>${esc(t(copy.facts.heading))}</h2><p>${P('Google Review Card та NFC Instagram Card: 10 × 10 см, товщина 3 мм.','Google Review Card and NFC Instagram Card: 10 × 10 cm, 3 mm thick.')}</p><p>${P('NFC Menu Card: квадрати 10 × 10 або 6 × 6 см; круг Ø 7 см. Товщина приблизно 3–4 мм.','NFC Menu Card: 10 × 10 or 6 × 6 cm squares; Ø 7 cm round. Approximately 3–4 mm thick.')}</p>${link(url('/solutions'),P('Порівняти картки','Compare cards'),'text-action')}</div><div class="fact-dimensions"><p><strong>10 × 10</strong><span>${P('сантиметрів · Review / Instagram','centimetres · Review / Instagram')}</span></p><p><strong>3</strong><span>${P('міліметри · Review / Instagram','millimetres · Review / Instagram')}</span></p></div><div><p>${P('Характеристики нижче стосуються Google Review Card.','The details below describe Google Review Card.')}</p>${list(t(copy.facts.facts).slice(2))}</div></section>`;}
function audience(){return `<section id="for-whom" tabindex="-1" class="section audience-section"><p class="eyebrow">${esc(t(copy.audience.eyebrow))}</p><h2>${esc(t(copy.audience.heading))}</h2>${t(copy.audience.paragraphs).map(p=>`<p>${esc(p)}</p>`).join('')}<ul class="audience-list">${t(copy.audience.examples).map(s=>`<li>${esc(s)}</li>`).join('')}</ul><blockquote class="staff-script">${esc(t(copy.audience.script))}</blockquote></section>`;}
function footer(route){const links=[['/solutions',P('Картки','Cards')],['/solutions/review-card','Google Review Card'],...nicheKinds.map(kind=>[nicheRoutes[kind],niche().data.products[kind].name]),[review3d.route,'Review Card 3D'],['/solutions/instagram-card','Instagram Card'],['/solutions/menu-card','Menu Card'],['/about',P('Про нас','About')],['/contact',P('Контакти','Contact')],['/delivery-and-payment',P('Доставка й оплата','Delivery & payment')],['/reviews/new',P('Залишити відгук','Leave a review')],['/#faq','FAQ']];return `<footer class="footer"><div class="footer-main"><div class="footer-brand">${logo()}<p>${esc(niche().shared.footer_description)}</p></div><nav aria-label="${P('Навігація внизу сторінки','Footer navigation')}">${links.filter(([r])=>!pages||r!=='/reviews/new').map(([r,l])=>link(url(r),l)).join('')}</nav><div class="footer-contacts">${contactItems(config.contacts,locale).filter(c=>['phone','telegram','instagram'].includes(c.kind)).map(c=>link(c.href,c.kind==='phone'?config.contacts.phone.display:c.kind==='telegram'?'Telegram':'Instagram','text-action',`data-event="${c.kind}_click" ${/^https:/.test(c.href)?'target="_blank" rel="noopener noreferrer"':''}`)).join('')}</div></div><nav class="footer-legal" aria-label="${P('Умови та політики','Terms and policies')}">${link(url('/warranty-and-returns'),P('Гарантія й повернення','Warranty & returns'))}${link(url('/privacy'),P('Приватність','Privacy'))}${link(url('/terms'),P('Умови','Terms'))}</nav><div class="footer-bottom"><p>${esc(t(config.disclaimer))}</p><span>NFC CARD · 2026</span></div></footer>`;}
function finalCTA(options={}){const o={heading:P('Готові спростити шлях до відгуку?','Ready to make reviewing simpler?'),body:P('Оберіть готову Google Review Card або персональний дизайн. Налаштуємо картку на вашу Google-точку.','Choose a ready-made Google Review Card or your own design. We will set it up for your Google location.'),primaryLabel:P('Обрати та замовити','Choose and order'),primaryHref:url('/order'),primaryEvent:'order_start',secondaryEvent:'telegram_click',secondaryLabel:P('Написати в Telegram','Message us on Telegram'),secondaryHref:config.contacts.telegram.href,...options};return `<section id="request" tabindex="-1" class="final-conversion" aria-labelledby="final-cta-title"><div><h2 id="final-cta-title">${esc(o.heading)}</h2><p>${esc(o.body)}</p></div><div class="final-actions">${link(o.primaryHref,o.primaryLabel,'button',o.primaryEvent?`data-event="${esc(o.primaryEvent)}"`:'')}${link(o.secondaryHref,o.secondaryLabel,'text-action',`${o.secondaryEvent?`data-event="${esc(o.secondaryEvent)}" `:''}${/^https:/.test(o.secondaryHref)?'target="_blank" rel="noopener noreferrer"':''}`)}</div></section>`;}

function rows(items,numbered=false){return `<${numbered?'ol':'div'} class="${numbered?'steps':'meaning-rows'}">${(items||[]).map((item,i)=>{const [h,p]=Array.isArray(item)?item:[item,''];return `<${numbered?'li':'div'}>${numbered?`<span class="step-number" aria-hidden="true">${i+1}</span>`:''}<h3>${esc(h)}</h3>${p?`<p>${esc(p)}</p>`:''}</${numbered?'li':'div'}>`}).join('')}</${numbered?'ol':'div'}>`;}
function blockContent(c,numbered=false){return `${c.body?`<p>${esc(t(c.body))}</p>`:''}${c.paragraphs?(t(c.paragraphs)||[]).map(p=>`<p>${esc(p)}</p>`).join(''):''}${c.items?rows(t(c.items),numbered):''}${c.note?`<p class="section-note">${esc(t(c.note))}</p>`:''}${c.script?`<blockquote class="staff-script">${esc(t(c.script))}</blockquote>`:''}`;}
function section(key,id=key,cls='',numbered=false,extra=''){
 const c=copy[key];if(!c)return '';
 return `<section id="${id}" tabindex="-1" class="section ${cls}">${c.eyebrow?`<p class="eyebrow">${esc(t(c.eyebrow))}</p>`:''}<h2>${esc(t(c.heading))}</h2>${blockContent(c,numbered)}${extra}</section>`;
}
function card(v){return views().card(v.id);}
function catalog(){return `<section id="catalog" class="catalog section"><div class="catalog-intro"><p class="eyebrow">${P('NFC-КАРТКИ ДЛЯ БІЗНЕСУ','NFC CARDS FOR BUSINESS')}</p><h1>${esc(t(copy.catalog.heading))}</h1><p class="lede">${esc(niche().shared.home_catalog_intro)}</p></div><div class="product-rows">${variants.map(card).join('')}${nicheKinds.map(kind=>niche().card(kind)).join('')}${review3dView().card()}${views().card('instagram')}${menu().card()}</div><div class="catalog-assist"><h2>${esc(niche().shared.bulk_heading)}</h2>${cta('bulk',niche().shared.bulk_cta,true,'more')}</div><p class="niche-catalog-explanation">${esc(niche().shared.bulk_body)}</p><p class="niche-catalog-explanation">${esc(niche().shared.catalog_extension)}</p></section>`;}

function nicheFaqLinks(f){if(!f.id?.startsWith('niche-faq-'))return '';const i=Number(f.id.slice(10));const s=niche().shared;const kinds=i===1||i===2?['brandedBeauty','brandedRestaurant']:i===0?['beauty','restaurant']:nicheKinds;return kinds.map(kind=>link(url(nicheRoutes[kind]),niche().data.products[kind].name,'text-action')).join('');}
function faqBlock(id='faq'){return `<section id="${id}" tabindex="-1" class="section faq-section"><div><p class="eyebrow">FAQ</p><h2>${P('Відповіді на поширені запитання','Answers to common questions')}</h2>${link(url('/contact'),P('Поставити запитання','Ask a question'),'text-action')}</div><div class="faq-list">${commonFAQs().map((f,i)=>`<details id="${id}-${f.id||i+1}"><summary>${esc(t(f.question))}</summary><p>${esc(t(f.answer))}</p>${f.id==='menu-faq-1'?link(url(menuRoutes.product),P('Переглянути NFC Menu Card','View NFC Menu Card'),'text-action'):f.id==='menu-faq-4'?link(url(menuRoutes.product)+'?menu_status=needs_development#request',P('Позначити потребу в меню','Tell us you need a menu'),'text-action'):f.id==='review3d-faq'?link(url(review3d.route),P('Переглянути NFC Review Card 3D','View NFC Review Card 3D'),'text-action'):nicheFaqLinks(f)}</details>`).join('')}</div></section>`;}
function field(name,type='text',required=false,opts=null,extra=''){const label=t(fields[name])||name;let control=opts?`<select id="f-${name}" name="${name}" ${required?'required':''}>${opts.map(([value,text])=>`<option value="${value}">${esc(text)}</option>`).join('')}</select>`:type==='textarea'?`<textarea id="f-${name}" name="${name}" rows="3" maxlength="2000"></textarea>`:`<input id="f-${name}" name="${name}" type="${type}" ${required?'required':''} maxlength="${['maps','businessUrl'].includes(name)?2048:250}" ${extra}>`;return `<div class="field field-${name}"><label for="f-${name}">${esc(label)}${required?'<span aria-hidden="true"> *</span>':''}</label>${control}<p id="e-${name}" class="field-error" hidden></p></div>`;}
const qtyOptions=()=>[['1',P('1 картка','1 card')],['2',P('2 картки','2 cards')],['more',P('Більше 2 — індивідуальний розрахунок','More than 2 — individual quote')]];
const interestOptions=()=>[['',P('Оберіть варіант','Choose a variant')]].concat(variants.map(v=>[v.id,v.name])).concat([['bulk',P('Для команди / кількох точок','Team / multiple locations')],['consultation',P('Потрібна консультація','I need advice')]]);
function form(preset=''){return views().form(preset);}
function formSection(preset=''){return views().formSection(preset);}
function included(){const c=copy.included;return `<section id="included" class="section included-section"><div><h2>${esc(t(c.heading))}</h2>${c.body?`<p>${esc(t(c.body))}</p>`:''}<h3>Google Review Card</h3>${list(t(c.standard))}</div><div><h3>Branded Review Card</h3>${list(t(c.branded))}${cta('branded')}</div></section>`;}
function founder(){return `<section id="about" tabindex="-1" class="section company-founder"><div class="company-intro"><p class="eyebrow">${P('ХТО СТОЇТЬ ЗА ПРОДУКТОМ','BEHIND THE PRODUCT')}</p><h2>${esc(t(copy.about.heading))}</h2></div><div class="founder-section" id="founder" tabindex="-1"><figure>${picture('artem-antonov-founder-photo.webp','founder-photo')}<figcaption>${P('Артем Антонов · Засновник','Artem Antonov · Founder')}</figcaption></figure><div><h3>${esc(t(copy.founder.heading))}</h3><p>${esc((t(copy.founder.paragraphs)||[])[0]||t(copy.founder.body)||P('NFC CARD — продукт Antonov Digital.','NFC CARD is an Antonov Digital product.'))}</p>${link(url('/about'),P('Про Antonov Digital і засновника','About Antonov Digital and its founder'),'button secondary')}</div></div></section>`;}

function story(){return `<section id="founder-story" tabindex="-1" class="story-section"><div class="story-background" aria-hidden="true">${[1,2].map(n=>`<div class="story-panel"><img src="/assets/media/v9/austria-story-0${n}-poster.jpg" alt="" width="464" height="848" loading="lazy"><video muted loop playsinline preload="none" poster="/assets/media/v9/austria-story-0${n}-poster.jpg" width="464" height="848" data-source="/assets/media/v9/austria-story-0${n}-muted.mp4" data-media-provenance="user_provided_business_asset" data-media-claim-role="atmospheric_founder_story_context" tabindex="-1"></video></div>`).join('')}</div><div class="story-copy"><p class="eyebrow">${esc(t(copy.story.eyebrow))}</p><h2>${esc(t(copy.story.heading))}</h2>${blockContent(copy.story)}<button class="story-toggle button secondary" type="button" aria-pressed="false" hidden>${P('Призупинити фон','Pause background')}</button></div></section>`;}
function business(){return `<section id="business-orders" tabindex="-1" class="section business-section"><span id="branches" tabindex="-1" class="anchor-target"></span><p class="eyebrow">3+</p><h2>${esc(t(copy.bulk.heading))}</h2><p>${esc(t(copy.bulk.body))}</p>${cta('bulk',copy.bulk.cta,true,'more')}</section>`;}
function paymentSummary(){return `<section id="payment" tabindex="-1" class="section payment-section"><div class="delivery-section-head"><p class="eyebrow">${L('УМОВИ ЗАМОВЛЕННЯ','ORDER DETAILS','WARUNKI ZAMÓWIENIA')}</p><h2>${esc(t(copy.payment.heading))}</h2></div>${deliveryTerms()}${link(url('/delivery-and-payment'),copy.payment.cta,'button secondary')}</section>`;}
function homeGuide(){
 const items=[['#catalog',L('Картки','Cards','Karty')],['#how-it-works',L('Як працює','How it works','Jak to działa')],['#client-reviews',L('Відгуки','Reviews','Opinie')],['#about',L('Про нас','About us','O nas')],['#payment',L('Доставка','Delivery','Dostawa')]];
 return `<nav class="section home-guide" aria-label="${L('Швидка навігація головною','Explore the home page','Szybka nawigacja po stronie głównej')}"><span class="eyebrow">NFC CARD / ${L('НАВІГАЦІЯ','EXPLORE','NAWIGACJA')}</span><div class="home-guide-links">${items.map(([href,label],i)=>`<a href="${href}"><span>${String(i+1).padStart(2,'0')}</span>${esc(label)}<span aria-hidden="true">↗</span></a>`).join('')}</div></nav>`;
}
function clientReviews(){
 return `<section id="client-reviews" tabindex="-1" class="section client-proof" aria-labelledby="client-reviews-title"><div class="client-proof-intro"><p class="eyebrow">${L('ВІДГУКИ КЛІЄНТІВ','CUSTOMER REVIEWS','OPINIE KLIENTÓW')}</p><h2 id="client-reviews-title">${L('Довіра починається зі справжніх відгуків','Trust begins with genuine feedback','Zaufanie zaczyna się od prawdziwych opinii')}</h2><p>${L('Ми публікуємо враження клієнтів лише після підтвердження та з їхньої згоди. Підтверджених відгуків для цієї сторінки поки немає.','We publish customer feedback only after verification and with permission. There are no verified reviews for this page yet.','Opinie klientów publikujemy dopiero po potwierdzeniu i za ich zgodą. Na tej stronie nie ma jeszcze zweryfikowanych opinii.')}</p></div><div class="client-proof-panel"><span class="client-proof-symbol" aria-hidden="true">“</span><h3>${L('Уже користуєтеся NFC CARD?','Already using NFC CARD?','Korzystasz już z NFC CARD?')}</h3><p>${L('Розкажіть про досвід використання — ми уточнимо, чи можна опублікувати вашу історію.','Tell us about your experience. We will ask whether we may publish your story.','Opowiedz nam o swoim doświadczeniu. Zapytamy, czy możemy opublikować Twoją historię.')}</p>${link(url('/contact'),L('Поділитися враженням','Share your experience','Podziel się opinią'),'button secondary')}</div></section>`;
}
function deliveryTerms(){
 const items=t(copy.payment.items);
 const groups=[[L('Передоплата','Deposit','Zaliczka'),items.slice(0,3)],[L('Способи оплати','Payment methods','Sposoby płatności'),items.slice(3,5)],[L('Доставка','Delivery','Dostawa'),items.slice(5)]];
 return `<div class="delivery-terms-grid">${groups.map(([title,rows],i)=>`<article class="delivery-term"><span class="delivery-term-index" aria-hidden="true">0${i+1}</span><h3>${esc(title)}</h3><ul>${rows.map(([line])=>`<li>${esc(line.replace(/[;.]$/,''))}</li>`).join('')}</ul></article>`).join('')}</div>`;
}
function deliveryPage(){
 return `<div class="delivery-page"><section class="section delivery-hero" aria-labelledby="delivery-title"><p class="eyebrow">NFC CARD / ${L('УМОВИ ЗАМОВЛЕННЯ','ORDER DETAILS','WARUNKI ZAMÓWIENIA')}</p><h1 id="delivery-title">${P('Доставка й оплата','Delivery & payment')}</h1><p>${L('Вартість, оформлення та строк підготовки погоджуємо до передоплати. Умови відправлення — нижче.','We confirm the price, design and preparation time before the deposit. Shipping terms are below.','Cenę, projekt i termin przygotowania uzgadniamy przed wpłatą zaliczki. Warunki dostawy znajdziesz poniżej.')}</p><div class="delivery-hero-mark" aria-hidden="true">NFC<span>↗</span></div></section><section class="section delivery-terms" aria-label="${esc(t(copy.payment.heading))}">${deliveryTerms()}</section><section class="section delivery-process"><div class="delivery-section-head"><p class="eyebrow">01 / ${L('ПРОЦЕС','PROCESS','PROCES')}</p><h2>${esc(t(copy.process.heading))}</h2></div>${blockContent(copy.process,true)}</section><section class="section delivery-quality"><div class="delivery-section-head"><p class="eyebrow">02 / ${L('ПЕРЕВІРКА','QUALITY CHECK','KONTROLA')}</p><h2>${esc(t(copy.quality.heading))}</h2></div>${blockContent(copy.quality)}<p>${L('Для NFC Review Card 3D строк виготовлення погоджується окремо до передоплати. Загальні умови оплати й безкоштовної доставки Новою поштою по Україні зберігаються.','The NFC Review Card 3D production timeline is agreed separately before the deposit. The existing payment terms and free Nova Poshta delivery within Ukraine still apply.','Termin wykonania NFC Review Card 3D ustalamy osobno przed wpłatą zaliczki. Pozostałe warunki płatności i bezpłatnej dostawy Nową Posztą na terenie Ukrainy pozostają bez zmian.')}</p></section><section class="section delivery-contact"><h2>${L('Залишилися запитання?','Have a question?','Masz pytanie?')}</h2>${contacts()}</section></div>`;
}
function nicheAudience(){const s=niche().shared;return `<section class="section niche-audience"><h2>${esc(s.niche_heading)}</h2><p>${esc(s.niche_intro)}</p><div class="niche-audience-grid"><article><h3>${esc(s.home_beauty_heading)}</h3><p>${esc(s.home_beauty_body)}</p>${link(url(nicheRoutes.beauty),s.home_beauty_cta,'text-action')}</article><article><h3>${esc(s.home_restaurant_heading)}</h3><p>${esc(s.home_restaurant_body)}</p>${link(url(nicheRoutes.restaurant),s.home_restaurant_cta,'text-action')}</article></div></section>`;}
function sharedAddition(key){return `<p class="niche-shared-addition">${esc(niche().shared[key])}</p>`;}
function home(){const s=niche().shared;return `<div class="section home-top-demo">${nfcDemoView({locale,esc,asset,url})}</div>`+homeGuide()+catalog()+menu().chooser()+section('problem','problem','problem-section',false,sharedAddition('problem_addition'))+howSection()+sharedAddition('how_addition')+clientReviews()+facts()+sharedAddition('facts_addition')+audience()+nicheAudience()+founder()+story()+section('process','process','process-section',true,sharedAddition('process_addition'))+paymentSummary()+'<span id="faq-instagram-subscription" class="anchor-target" aria-hidden="true"></span>'+faqBlock()+finalCTA({heading:s.final_heading,body:s.final_body,primaryLabel:s.final_cta,primaryHref:url('/solutions'),primaryEvent:'catalog_view'});}
function productPage(variant){return views().product(variant);}
function nicheOrderLinks(){const s=niche().shared;return `<div class="section niche-order-choice"><p>${esc(s.contact_prompt)}</p><div class="niche-links">${nicheKinds.map(kind=>link(url(nicheRoutes[kind]),niche().data.products[kind].name,'button secondary')).join('')}</div></div>`;}
function contactPage(){const s=niche().shared;return `<section class="section contact-page"><div><p class="eyebrow">NFC CARD by Antonov Digital</p><h1>${P('Зв’яжіться з NFC CARD','Contact NFC CARD')}</h1><p class="lede">${esc(s.contact_intro)}</p><p>${esc(s.contact_prompt)}</p><div class="niche-links">${nicheKinds.map(kind=>link(url(nicheRoutes[kind]),niche().data.products[kind].name,'button secondary')).join('')}</div><div class="contact-status">${contacts()}${contactNote()}</div></div>${menuInterest()}${form('consultation')}${menuInline()}</section>`;}
function menuInterest(){return `<div class="menu-interest"><p>${P('Потрібна NFC Menu Card або консультація щодо онлайн-меню?','Need NFC Menu Card or advice on an online menu?')}</p><button class="button secondary" type="button" data-menu-activate>${P('Обрати NFC Menu Card','Choose NFC Menu Card')}</button> ${link(url(menuRoutes.product),P('Ціни й виконання','Pricing and formats'),'text-action')}</div>`;}
function menuInline(){return `<section class="section request-section menu-inline" data-menu-inline hidden><h2>${P('Замовити NFC Menu Card або обговорити меню','Order NFC Menu Card or discuss a menu')}</h2>${menu().form()}</section>`;}
function supportPage(){if(publication.mode==='PUBLIC')return publicLegalPage('/warranty-and-returns',{locale,esc,link,url,contacts});return `<section class="section prose-page"><p class="eyebrow">${P('Підтримка NFC CARD','NFC CARD support')}</p><h1>${P('Гарантія, повернення та допомога','Warranty, returns and help')}</h1><h2>${esc(t(copy.support.heading))}</h2>${blockContent(copy.support)}<p>${P('Перед оплатою погоджуємо застосовні умови гарантії, повернення, персоналізованих виробів і витрати на пересилання. Конкретного строку гарантії або автоматичної заміни тут не обіцяємо.','Before payment, we agree the applicable warranty, returns, personalised-product and return-shipping terms.')}</p>${contacts()}${contactNote()}</section>`;}
function legalPage(route){if(publication.mode==='PUBLIC')return publicLegalPage(route,{locale,esc,link,url,contacts});const privacy=route==='/privacy';const data=privacy?[[P('Дані форми','Form details'),P('Ім’я, телефон, обраний месенджер і контакт, варіант та кількість, необов’язкові дані бізнесу, Google Maps URL, посилання на бізнес для брендованого варіанта, коментар, джерело переходу, мова та згода.','Name, phone, preferred messenger and contact, variant and quantity, optional business details, Google Maps URL, business link for the branded variant, comment, referral source, language and consent.')],[P('Для чого','Purpose'),P('Щоб відповісти на заявку та узгодити замовлення. Ця згода не дозволяє маркетингові розсилки.','To respond to the request and agree the order. This consent does not authorise marketing messages.')],[P('Зберігання даних','Data storage'),pagesPreview?P('У preview-версії введені дані не надсилаються та не зберігаються застосунком у сховищі браузера. Вони залишаються лише у відкритій формі.','In the preview version, entered details are not submitted or saved by the application in browser storage. They remain only in the open form.'):P('Надіслані заявки зберігаються приватно на сервері застосунку. Чернетка — у сесії браузера, невідправлена заявка — у локальному сховищі браузера до успішного повторення або очищення даних сайту. Старі чернетки ізольовані та не надсилаються автоматично.','Submitted requests are stored privately on the application server. Drafts are kept for the browser session; pending requests stay in browser storage until a successful retry or clearing site data. Legacy drafts are isolated and are not automatically submitted.')]]:[[P('Заявка та замовлення','Request and order'),P('Заявка не є оплатою або автоматичним підтвердженням замовлення. До передоплати погоджуємо вартість, дизайн, строки та доставку. Перший макет Branded Review Card безкоштовний.','A request is not payment or automatic order confirmation. Price, design, timing and delivery are agreed before the deposit. The first Branded Review Card mockup is free.')],[P('Ціна й оплата','Price and payment'),P('Ціни для України наведені в гривнях. Передоплата 200 грн входить у повну суму, залишок — після відправлення та номера ТТН. Європа та інші країни — за погодженим розрахунком.','Ukraine prices are shown in UAH. The 200 UAH deposit is included in the total; the balance is paid after dispatch and the tracking number. Europe and other countries use an agreed quote.')]];return `<section class="section prose-page legal-page"><p class="eyebrow">${P('Чернетка · Не готова до публікації','Draft · Not ready for publication')}</p><h1>${privacy?P('Політика конфіденційності','Privacy policy'):P('Умови замовлення','Order terms')}</h1><div class="draft-notice">${P('До запуску потрібні юридичні дані продавця та погодження власника.','Seller details and owner approval are required before launch.')}</div>${data.map(([h,p])=>`<section><h2>${h}</h2><p>${p}</p></section>`).join('')}<section><h2>${P('До погодження','To be agreed')}</h2><p>${privacy?P('Відповідальний за дані, правова підстава, строк зберігання, обробники й одержувачі, міжнародна передача, порядок доступу, виправлення й видалення та контакт для реалізації прав.','Data controller, legal basis, retention, processors and recipients, international transfers, access, correction and deletion procedures, and the contact for exercising rights.'):P('Юридична особа, реквізити, юрисдикція, порядок укладення замовлення та застосовні умови гарантії й повернення.','Legal identity, registration details, jurisdiction, order formation and applicable warranty and return terms.')}</p></section>${link(url('/contact'),P('Контакти','Contact'),'button secondary')}</section>`;}
function thankYou(){return `<section class="section prose-page thank-you-page"><p class="eyebrow">NFC CARD</p><h1>${P('Статус заявки','Request status')}</h1><div id="receipt" tabindex="-1" aria-live="polite"><p>${pagesPreview?unavailable(locale):U('noReceipt','У цій сесії ще немає збереженої заявки. Заповніть форму, щоб отримати номер.','There is no saved request in this session yet. Complete the form to receive a request number.')}</p></div>${link(url('/solutions'),P('Повернутися до карток','Back to the cards'),'button secondary')}${contacts()}</section>`;}
function schema(route){
 const origin=publication.origin, nodes=[{'@context':'https://schema.org','@type':'Organization','@id':origin+'/#organization',name:'NFC CARD',url:origin,logo:origin+'/assets/media/v9/nfc-card-logo-primary.svg',parentOrganization:{'@type':'Organization',name:'Antonov Digital'},telephone:config.contacts.phone.value,sameAs:[config.contacts.telegram.href,config.contacts.instagram.href]}];
 for(const kind of nicheKinds)if(route===nicheRoutes[kind]){
  const product=niche().data.products[kind];
  const offers=locale==='pl'||miniMediaKind(kind)==='restaurant'?undefined:MINI_QUANTITIES.map(q=>({'@type':'Offer',name:product.name+' · '+q,url:origin+url(route)+'/?intent=order&quantity='+q+'#request',price:miniQuote(miniId(kind),q,locale).amount,priceCurrency:'UAH',eligibleRegion:'UA',eligibleQuantity:{'@type':'QuantitativeValue',minValue:q,maxValue:q,unitCode:'C62'}}));
  nodes.push({'@context':'https://schema.org','@type':'Product','@id':origin+url(route)+'#product',name:product.name,description:product.seo_description,image:nicheMedia[miniMediaKind(kind)].map(name=>origin+asset(name).url),brand:{'@type':'Brand',name:'NFC CARD'},...(offers?{offers}:{})});
  nodes.push({'@context':'https://schema.org','@type':'FAQPage',mainEntity:product.faq.map(item=>({'@type':'Question',name:item.question,acceptedAnswer:{'@type':'Answer',text:item.answer}}))});
  nodes.push({'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[['NFC CARD','/'],[niche().shared.menu_group,'/solutions'],[product.name,route]].map(([name,r],i)=>({'@type':'ListItem',position:i+1,name,item:origin+url(r)}))});
 }
 if(['/solutions/review-card','/solutions/branded-review-card'].includes(route)){
 const variant=route.includes('branded-')?'branded':'standard';
  nodes.push({'@context':'https://schema.org','@type':'Product','@id':origin+url(route)+'#product',name:productNames[variant],sku:variant,description:views().promise(variant),image:galleries[variant].filter(n=>asset(n).media_type!=='video').map(n=>origin+asset(n).url),brand:{'@type':'Brand',name:'NFC CARD'},offers:['1','2'].map(q=>({'@type':'Offer',name:productNames[variant]+' · '+q+' '+(locale==='pl'?polishPlural(Number(q),'karta','karty','kart'):P('картк.','card(s)')),url:origin+url(route)+'?quantity='+q,price:canonicalQuote(variant,q,locale).amount,priceCurrency:locale==='pl'?'PLN':commerce.currency,eligibleRegion:locale==='pl'?'PL':'UA',eligibleQuantity:{'@type':'QuantitativeValue',minValue:Number(q),maxValue:Number(q),unitCode:'C62'}}))});
  nodes.push({'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[['NFC CARD','/'],[P('Картки','Cards'),'/solutions'],[productNames[variant],route]].map(([name,r],i)=>({'@type':'ListItem',position:i+1,name,item:origin+url(r)}))});
 }
 if(route===instagram.route){nodes.push({'@context':'https://schema.org','@type':'Product','@id':origin+url(route)+'#product',name:instagram.name,sku:instagram.sku,description:t(instagram.lead),brand:{'@type':'Brand',name:'NFC CARD'},offers:['1','2'].map(q=>({'@type':'Offer',name:instagram.name+' · '+q+' '+(locale==='pl'?polishPlural(Number(q),'karta','karty','kart'):P('картк.','card(s)')),url:origin+url(route)+'?quantity='+q,price:canonicalQuote('instagram',q,locale).amount,priceCurrency:locale==='pl'?'PLN':'UAH',eligibleRegion:locale==='pl'?'PL':'UA',eligibleQuantity:{'@type':'QuantitativeValue',minValue:Number(q),maxValue:Number(q),unitCode:'C62'}}))});nodes.push({'@context':'https://schema.org','@type':'FAQPage',mainEntity:instagramProductFAQs.map(f=>({'@type':'Question',name:t(f.question),acceptedAnswer:{'@type':'Answer',text:t(f.answer)}}))});}
 if(route===instagram.route)nodes.find(node=>node['@type']==='Product').image=galleries.instagram.map(name=>origin+publicURL(instagramMediaEntry(name,asset).url,publication));
 if(route===review3d.route){nodes.push({'@context':'https://schema.org','@type':'Product','@id':origin+url(route)+'#product',name:review3d.name,description:review3d.heroBody[locale],image:review3d.gallery.map(name=>origin+asset(name).url),brand:{'@type':'Brand',name:'NFC CARD'},offers:{'@type':'Offer',name:review3d.name,url:origin+url(route),price:locale==='pl'?poland.products['review-card-3d'].unitPrice:4000,priceCurrency:locale==='pl'?'PLN':'UAH',eligibleRegion:locale==='pl'?'PL':'UA',eligibleQuantity:{'@type':'QuantitativeValue',minValue:1,unitCode:'C62'}}});nodes.push({'@context':'https://schema.org','@type':'FAQPage',mainEntity:review3d.faq.map(([question,answer])=>({'@type':'Question',name:question[locale],acceptedAnswer:{'@type':'Answer',text:answer[locale]}}))});nodes.push({'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[['NFC CARD','/'],[P('Картки','Cards'),'/solutions'],[review3d.name,route]].map(([name,r],i)=>({'@type':'ListItem',position:i+1,name,item:origin+url(r)}))});}
 if(route===menuRoutes.product){nodes.push({'@context':'https://schema.org','@type':'Product','@id':origin+url(route)+'#product',name:'NFC Menu Card',description:P('Готова NFC-картка, що відкриває онлайн-меню закладу.','A ready-made NFC card that opens a venue’s online menu.'),image:menuGallery.map(name=>origin+asset(name).url),brand:{'@type':'Brand',name:'NFC CARD'},offers:{'@type':'Offer',name:P('1 NFC Menu Card','1 NFC Menu Card'),url:origin+url(route),price:locale==='pl'?poland.products['nfc-menu-card'].tiers[0].unitPrice:1000,priceCurrency:locale==='pl'?'PLN':'UAH',eligibleRegion:locale==='pl'?'PL':'UA',eligibleQuantity:{'@type':'QuantitativeValue',minValue:1,maxValue:1,unitCode:'C62'}}});nodes.push({'@context':'https://schema.org','@type':'FAQPage',mainEntity:menuFAQs.map(f=>({'@type':'Question',name:t(f.question),acceptedAnswer:{'@type':'Answer',text:t(f.answer)}}))});}
 if([menuRoutes.product,menuRoutes.infoRoute,menuRoutes.info].includes(route))nodes.push({'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[['NFC CARD','/'],[P('Картки','Cards'),'/solutions'],['NFC Menu Card',route]].map(([name,r],i)=>({'@type':'ListItem',position:i+1,name,item:origin+url(r)}))});
 if([instagram.route,instagram.infoRoute].includes(route))nodes.push({'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[['NFC CARD','/'],[P('Картки','Cards'),'/solutions'],[instagram.name,route]].map(([name,r],i)=>({'@type':'ListItem',position:i+1,name,item:origin+url(r)}))});
 if(route==='/')nodes.push({'@context':'https://schema.org','@type':'FAQPage',mainEntity:commonFAQs().map(f=>({'@type':'Question',name:t(f.question),acceptedAnswer:{'@type':'Answer',text:t(f.answer)}}))});
 for(const node of nodes)if(node['@type']!=='Organization')node.inLanguage=locale;
 return nodes.map(n=>`<script type="application/ld+json">${JSON.stringify(n).replaceAll('<','\u003c')}</script>`).join('');
}
function shell(body,route,title,description){
 const origin=publication.origin;
 const headerOrderAction=()=>{
  const nicheKind=nicheKinds.find(kind=>route===nicheRoutes[kind]);
  const productPage=nicheKind||[review3d.route,'/solutions/review-card','/solutions/branded-review-card','/solutions/instagram-card','/solutions/menu-card'].includes(route);
  const href=productPage?'#request':route==='/order'||route==='/contact'?'#f-name':orderURL();
  return link(href,locale==='pl'?'Zamów':P('Замовити','Order'),'button header-order-cta',`data-event="order_start"${nicheKind?' data-niche-intent="order"':''}`);
 };
 const productOrderAction=headerOrderAction();
 const canonical=origin+url(route);
 const switchRoute=route==='/404.html'?'/':route;
 const languageSwitch=()=>LOCALES.map(lang=>lang===locale
  ? `<span lang="${lang}" aria-current="true" aria-label="${LOCALE_NAMES[lang]}">${LOCALE_LABELS[lang]}</span>`
  : link(localizedRoute(switchRoute,lang),LOCALE_LABELS[lang],'locale-switch',`lang="${lang}" hreflang="${lang}" aria-label="${LOCALE_NAMES[lang]}" data-event="language_switch"`)).join('');
 const alternates=LOCALES.map(lang=>`<link rel="alternate" hreflang="${lang}" href="${origin}${localizedRoute(route,lang)}">`).join('');
 const ogAlternates=LOCALES.filter(lang=>lang!==locale).map(lang=>`<meta property="og:locale:alternate" content="${OG_LOCALES[lang]}">`).join('');
 return `<!doctype html><html lang="${locale}" data-locale="${locale}"${pages||publication.basePath?` data-public-base-path="${esc(publication.basePath||'')}"`: ''}${pages?` data-publication-mode="${publication.mode}" data-deployment-target="github-pages" data-lead-endpoint="${esc(endpoint)}"`:''}><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(description)}"><meta name="robots" content="${robotsMeta(publication,url(route))}"><meta name="siteagent-business-id" content="nfc-card-manual-v1"><link rel="canonical" href="${canonical}">${alternates}<link rel="alternate" hreflang="x-default" href="${origin}${localizedRoute(route,'uk')}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:type" content="website"><meta property="og:locale" content="${OG_LOCALES[locale]}">${ogAlternates}<meta property="og:url" content="${canonical}"><meta name="theme-color" content="#181B1F"><link rel="icon" href="/assets/media/v9/nfc-card-favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/assets/style.css?v=${demoRevision}"><script src="/assets/localization-client.js" defer></script><script src="/assets/app.js" defer></script>${route==='/solutions/review-card'?'<script type="module" src="/assets/model-viewer.min.js"></script>':''}${route==='/'||route==='/solutions'?'<script type="module" src="/assets/catalog-models.mjs?v='+demoRevision+'"></script>':''}<script src="/assets/gallery.js" defer></script><script src="/assets/commerce.js" defer></script><script src="/assets/menu-client.mjs" type="module"></script><script src="/assets/review3d-client.mjs" type="module"></script><script src="/assets/niche-client.mjs" type="module"></script>${route==='/'?'<script src="/assets/nfc-demo-client.mjs?v='+demoRevision+'" type="module"></script>':''}${pages?'':'<link rel="stylesheet" href="/assets/reviews.css"><script src="/assets/reviews-renderer.js" defer></script><script src="/assets/reviews.js" defer></script>'}${schema(route)}</head><body data-route="${route}" data-contract="6">${link('#main',P('Перейти до вмісту','Skip to content'),'skip')}<header class="header"><div class="header-inner">${pagesPreview?'<div class="preview-brand">':''}${logo()}${pagesPreview?'<span class="preview-badge">PUBLIC PREVIEW</span></div>':''}<nav class="desktop-nav" aria-label="${P('Головна навігація','Main navigation')}">${nav()}</nav><div class="header-actions"><div class="locale" aria-label="${P('Мова сайту','Site language')}">${languageSwitch()}</div>${productOrderAction}<button class="menu-toggle icon-button" aria-expanded="false" aria-controls="mobile-menu" aria-label="${P('Відкрити меню','Open menu')}"><span></span></button></div></div></header><dialog id="mobile-menu" class="mobile-menu" aria-label="${P('Меню навігації','Navigation menu')}"><div class="menu-top"><img src="/assets/media/v9/nfc-card-mark.svg" alt="NFC CARD" width="44" height="44"><button class="menu-close icon-button" aria-label="${P('Закрити меню','Close menu')}">×</button></div><nav>${nav(true)}${productOrderAction}</nav><div class="locale mobile-locale" aria-label="${P('Мова сайту','Site language')}">${languageSwitch()}</div></dialog><main id="main" tabindex="-1">${body.replaceAll('name="source" value="'+url('/order')+'"','name="source" value="'+url(route)+'"')}</main>${footer(route)}<div class="sticky-order" hidden>${route==='/order'||route==='/contact'?link('#f-name',P('До заявки','Back to the form'),'button'):route==='/thank-you'?link(url('/solutions'),P('До карток','Back to cards'),'button'):productOrderAction}${link(url('/solutions'),P('Каталог','Catalog'),'sticky-catalog')}</div></body></html>`;
}
const routes=[];
// A Pages artifact must not inherit server-only routes/assets from a prior build.
if(pages)fs.rmSync(output,{recursive:true,force:true});
else {
 for(const name of ['404.html','.nojekyll','assets/pages.mjs'])fs.rmSync(path.join(output,name),{force:true});
}
fs.mkdirSync(path.join(output,'assets'),{recursive:true});
function contextualAddition(route){const s=niche().shared;let heading='',body='',links=[];
 if(route==='/solutions/review-card'){heading=s.review_cross_heading;body=s.review_cross_body;links=[['beauty',s.nav_beauty],['restaurant',s.nav_restaurant]];}
 else if(route==='/solutions/branded-review-card'){body=s.branded_cross_body;links=[['brandedBeauty',niche().data.products.brandedBeauty.name],['brandedRestaurant',niche().data.products.brandedRestaurant.name]];}
 else if(route===menuRoutes.product||route===menuRoutes.info){heading=s.menu_cross_heading;body=s.menu_cross_body;links=[['restaurant',s.menu_cross_cta]];}
 else if(route===instagram.route||route===instagram.infoRoute){heading=s.instagram_cross_heading;body=s.instagram_cross_body;links=[['beauty',s.instagram_cross_cta]];}
 else if(route===review3d.route){body=s.review3d_cross_body;links=[['beauty',s.nav_beauty],['restaurant',s.nav_restaurant]];}
 else if(route==='/about')body=s.about_addition;
 else if(route==='/delivery-and-payment')body=s.delivery_addition;
 else if(route==='/terms')body=s.terms_addition;
 else if(route==='/warranty-and-returns')body=s.warranty_addition;
 else if(route==='/privacy')body=s.privacy_addition;
 if(!body)return '';
 return `<section class="section niche-contextual">${heading?`<h2>${esc(heading)}</h2>`:''}${route==='/delivery-and-payment'?`<p>${esc(s.delivery_addition)}</p><p>${esc(s.payment_body)}</p><p>${esc(s.other_markets)}</p>`:`<p>${esc(body)}</p>`}<div class="niche-links">${links.map(([kind,label])=>link(url(nicheRoutes[kind]),label,'text-action')).join('')}</div></section>`;
}
function emit(route,body,title,description){const complete=body+contextualAddition(route);const html=publicHTML(shell(pages?pagesFormHTML(complete,{endpoint,locale,esc}):complete,route,title,description),publication);assertFinalLegalContent(publication,route,html);const dest=path.join(output,locale==='uk'?'':locale,route.replace(/^\//,''),'index.html');fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,html);routes.push(url(route));}
for(locale of LOCALES){
 emit('/',home(),niche().shared.home_seo_title,niche().shared.home_seo_description);
 emit('/about',aboutPage({locale,esc,url,finalCTA}),aboutContent[locale].metadata.title,aboutContent[locale].metadata.description);
 emit('/solutions',catalog()+menu().chooser(),niche().shared.catalog_seo_title,niche().shared.catalog_seo_description);
 for(const variant of ['standard','branded'])emit(productRoute(variant),productPage(variant),productNames[variant]+' | NFC CARD',views().promise(variant));
 for(const kind of nicheKinds){const product=niche().data.products[kind];emit(nicheRoutes[kind],niche().page(kind),product.seo_title,product.seo_description);}
 emit(review3d.route,review3dView().product(),...review3d.seo[locale]);
 emit(instagram.route,productPage('instagram'),t(instagram.productSEO.title),t(instagram.productSEO.description));
 emit(instagram.infoRoute,instagramViews({locale,esc,url,finalCTA,asset,picture}).info(),t(instagram.infoSEO.title),t(instagram.infoSEO.description));
 emit(menuRoutes.product,menu().product(),...menuSEO.product[locale]);
 emit(menuRoutes.info,menu().info(),...menuSEO.info[locale]);
 emit('/order',`<section class="section order-page"><div><p class="eyebrow">NFC CARD</p><h1>${P('Замовити NFC-картку','Order an NFC card')}</h1><p class="lede">${P('Оберіть картку для Google-відгуків, Instagram або онлайн-меню й залиште контактні дані. Уточнимо деталі у вибраному месенджері.','Choose a card for Google reviews, Instagram or an online menu, then leave your contact details. We will confirm the details in your selected messenger.')}</p></div>${nicheOrderLinks()}${menuInterest()}${form()}${menuInline()}</section>`,P('Замовити NFC-картку | NFC CARD','Order an NFC card | NFC CARD'),P('Оберіть варіант, кількість і зручний месенджер.','Choose a variant, quantity and preferred messenger.'));
 emit('/delivery-and-payment',deliveryPage(),P('Доставка й оплата | NFC CARD','Delivery & payment | NFC CARD'),P('Передоплата 200 грн входить у ціну. Стандартна доставка Новою поштою Україною включена.','The 200 UAH deposit is included. Standard Nova Poshta delivery within Ukraine is included.'));
 if(!pages)emit('/reviews/new',reviewForm(locale),P('Залишити відгук | NFC CARD','Leave a review | NFC CARD'),P('Поділіться справжнім досвідом використання NFC CARD.','Share your real experience of using NFC CARD.'));
 emit('/contact',contactPage(),P('Контакти | NFC CARD','Contact | NFC CARD'),P('Telegram, WhatsApp, Viber, телефон та Instagram NFC CARD.','NFC CARD Telegram, WhatsApp, Viber, phone and Instagram.'));
 emit('/warranty-and-returns',supportPage(),P('Підтримка, гарантія й повернення | NFC CARD','Support, warranty & returns | NFC CARD'),P('Допомога з NFC-карткою та погодження умов замовлення.','Help with your NFC card and agreeing order terms.'));
 emit('/thank-you',thankYou(),P('Статус заявки | NFC CARD','Request status | NFC CARD'),P('Підсумок збереженої заявки в поточній сесії.','Saved request summary in this session.'));
 for(const route of ['/privacy','/terms'])emit(route,legalPage(route),P(route==='/privacy'?'Конфіденційність | NFC CARD':'Умови замовлення | NFC CARD',route==='/privacy'?'Privacy | NFC CARD':'Order terms | NFC CARD'),publication.mode==='PUBLIC'?P('Продавець, обробка заявок та умови замовлення NFC CARD.','NFC CARD seller, enquiry processing and order terms.'):P('Чернетка документа до погодження власником.','Draft document awaiting owner approval.'));
}
if(!pages){
 fs.mkdirSync(path.join(root,'server/templates'),{recursive:true});
 for(const lang of ['uk','en'])fs.writeFileSync(path.join(root,'server/templates',`admin-${lang}.html`),adminShell(lang));
}
const redirects=JSON.parse(fs.readFileSync(path.join(root,'src/redirects.json'),'utf8').replace(/^\uFEFF/,''));
const existingRedirects=Object.entries(redirects.redirects||redirects);
const redirectEntries=[...existingRedirects,...existingRedirects.filter(([from])=>!from.startsWith('/en/')).map(([from,to])=>['/pl'+from,'/pl'+to])];
// Remove only enumerated retired generated pages, after resolving containment.
for(const [from]of redirectEntries){const file=path.resolve(output,from.replace(/^\//,''),'index.html');if(!file.startsWith(path.resolve(output)+path.sep))throw Error('Unsafe retired path');if(fs.existsSync(file))fs.unlinkSync(file);}
if(!pages)fs.writeFileSync(path.join(output,'_redirects'),redirectEntries.map(([from,to])=>`${publicURL(from,publication)} ${publicURL(to,publication)} 301\n${publicURL(from,publication)}/ ${publicURL(to,publication)} 301`).join('\n')+'\n');
fs.writeFileSync(path.join(output,'assets/style.css'),publicCSS(fs.readFileSync(path.join(root,'src/style.css'),'utf8')+'\n'+fs.readFileSync(path.join(root,'src/commerce.css'),'utf8')+'\n'+fs.readFileSync(path.join(root,'src/about.css'),'utf8')+'\n'+fs.readFileSync(path.join(root,'src/visual-v13.css'),'utf8')+'\n'+fs.readFileSync(path.join(root,'src/instagram.css'),'utf8')+'\n'+fs.readFileSync(path.join(root,'src/menu.css'),'utf8')+'\n'+fs.readFileSync(path.join(root,'src/gallery-polish.css'),'utf8')+'\n'+fs.readFileSync(path.join(root,'src/review3d.css'),'utf8')+'\n'+fs.readFileSync(path.join(root,'src/niche.css'),'utf8')+'\n'+fs.readFileSync(path.join(root,'src/catalog-card.css'),'utf8')+'\n'+fs.readFileSync(path.join(root,'src/nfc-demo.css'),'utf8')+'\n'+fs.readFileSync(path.join(root,'src/our-visual-refresh.css'),'utf8')+(pagesPreview?'\n'+previewCSS:''),publication));
function webSafeReviewCardGlb(source){
 const input=Buffer.from(source);
 if(input.length<28||input.toString('ascii',0,4)!=='glTF'||input.readUInt32LE(4)!==2)throw Error('Invalid review card GLB');
 const jsonLength=input.readUInt32LE(12);
 const jsonType=input.toString('ascii',16,20);
 if(jsonType!=='JSON')throw Error('Review card GLB missing JSON chunk');
 const jsonStart=20,jsonEnd=jsonStart+jsonLength;
 const doc=JSON.parse(input.subarray(jsonStart,jsonEnd).toString('utf8').replace(/\u0000+$/,'').trimEnd());
 for(const material of doc.materials||[]){
  material.doubleSided=true;
  if(material.extensions?.KHR_materials_unlit){
   delete material.extensions.KHR_materials_unlit;
   if(Object.keys(material.extensions).length===0)delete material.extensions;
  }
 }
 if(Array.isArray(doc.extensionsUsed)){
  doc.extensionsUsed=doc.extensionsUsed.filter(name=>name!=='KHR_materials_unlit');
  if(doc.extensionsUsed.length===0)delete doc.extensionsUsed;
 }
 const encoded=Buffer.from(JSON.stringify(doc),'utf8');
 const paddedLength=Math.ceil(encoded.length/4)*4;
 const jsonChunk=Buffer.alloc(paddedLength,0x20);
 encoded.copy(jsonChunk);
 const tail=input.subarray(jsonEnd);
 const output=Buffer.alloc(20+paddedLength+tail.length);
 output.write('glTF',0,'ascii');
 output.writeUInt32LE(2,4);
 output.writeUInt32LE(output.length,8);
 output.writeUInt32LE(paddedLength,12);
 output.write('JSON',16,'ascii');
 jsonChunk.copy(output,20);
 tail.copy(output,20+paddedLength);
 return output;
}
for(const file of ['commerce-contract.mjs','pl-commerce.mjs','mini-contract.mjs','menu-contract.mjs','inbound-notice.mjs','menu-client.mjs','review3d-client.mjs','niche-client.mjs','nfc-demo-client.mjs','catalog-models.mjs','pages.mjs','app.js','model-viewer.min.js','nfc-review-card-3d.glb','commerce.js','gallery.js','reviews.js','reviews-renderer.js','admin-reviews.js','reviews.css','Onest.ttf','Onest-OFL.txt','IBMPlexMono.ttf','IBMPlexMono-OFL.txt','KyivTypeSans-Black.woff2','KyivTypeSans-LICENSE.txt']){
 if(pages&&['reviews.js','reviews-renderer.js','admin-reviews.js','reviews.css'].includes(file))continue;
 if(pages&&['app.js','commerce.js'].includes(file)){
  const source=fs.readFileSync(path.join(root,'src',file),'utf8');
  if(source.split('/* NFC_FULLSTACK_START */').length!==2||source.split('/* NFC_FULLSTACK_END */').length!==2)throw Error('Missing fullstack client boundary');
  fs.writeFileSync(path.join(output,'assets',file),source.replace(/\/\* NFC_FULLSTACK_START \*\/[\s\S]*?\/\* NFC_FULLSTACK_END \*\//g,''));
 }else if(file==='model-viewer.min.js'){
  fs.copyFileSync(createRequire(import.meta.url).resolve('@google/model-viewer/dist/model-viewer.min.js'),path.join(output,'assets',file));
 }else if(file==='nfc-review-card-3d.glb'){
  fs.writeFileSync(path.join(output,'assets',file),webSafeReviewCardGlb(fs.readFileSync(path.join(root,'src',file))));
 }else fs.copyFileSync(path.join(root,'src',file),path.join(output,'assets',file));
}
fs.mkdirSync(path.join(output,'assets/models'),{recursive:true});
for(const file of fs.readdirSync(path.join(root,'src/models'))){
 if(!/^[a-z-]+\.glb$/.test(file))throw Error('Unexpected 3D model name: '+file);
 fs.writeFileSync(path.join(output,'assets/models',file),webSafeReviewCardGlb(fs.readFileSync(path.join(root,'src/models',file))));
}
fs.mkdirSync(path.join(output,'assets/model-posters'),{recursive:true});
for(const file of fs.readdirSync(path.join(root,'src/model-posters'))){
 if(!/^[a-z-]+\.webp$/.test(file))throw Error('Unexpected 3D poster name: '+file);
 fs.copyFileSync(path.join(root,'src/model-posters',file),path.join(output,'assets/model-posters',file));
}
const localeClient=fs.readFileSync(path.join(root,'src/localization-client.js'),'utf8');
if(localeClient.split('/*POLISH_UI_DICTIONARY*/').length!==2)throw Error('Missing Polish dictionary marker');
fs.writeFileSync(path.join(output,'assets/localization-client.js'),localeClient.replace('/*POLISH_UI_DICTIONARY*/ {}',JSON.stringify(polishUI).replaceAll('<','\\u003c')));
fs.writeFileSync(path.join(output,'assets/content.json'),JSON.stringify(publicData({ui,fields,errors,variants:variants.map(({id,name,label,description,cta})=>({id,name,label,description,cta})),events:config.events,commerceEvents:analyticsContract.commerce,reviewEvents:pages?[]:analyticsContract.reviews,commerce:{...commerce,poland}},publication)));
for(const item of media){
 const from=path.resolve(root,item.source),to=path.resolve(output,item.url.replace(/^\//,''));
 if(!from.startsWith(path.join(root,'src')+path.sep)||!to.startsWith(output+path.sep))throw Error('Media path escaped');
 if(createHash('sha256').update(fs.readFileSync(from)).digest('hex')!==item.sha256)throw Error('Media source drift: '+item.source);
 fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(from,to);
}
// Exact historical public assets replaced by the current approved assets.
for(const name of ['assets/media/austria-1.mp4','assets/media/austria-2.mp4','assets/media/austria-1-poster.jpg','assets/media/austria-2-poster.jpg','assets/Manrope.ttf','assets/Manrope-OFL.txt','assets/favicon.svg','assets/media/v9/06-promo-qr-vs-nfc.webp']){
 const target=path.resolve(output,name);if(!target.startsWith(output+path.sep))throw Error('Unsafe asset path');if(fs.existsSync(target))fs.unlinkSync(target);
}
fs.writeFileSync(path.join(output,'robots.txt'),robotsFile(publication));
fs.writeFileSync(path.join(output,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.filter(r=>publication.sitemapRoutes.includes(r)).map(r=>`<url><loc>${publication.origin}${publicURL(r,publication)}</loc></url>`).join('')}</urlset>`);
const historicalRoutes=JSON.parse(fs.readFileSync(path.join(task,'routes.json'),'utf8')).filter(route=>!pages||!['/reviews/new','/en/reviews/new'].includes(route));
const review3dRoutes=[review3d.route,'/en'+review3d.route,...Object.values(nicheRoutes).flatMap(route=>[route,'/en'+route])];
const bilingualRoutes=routes.filter(route=>!route.startsWith('/pl'));
const ukRoutes=routes.filter(route=>!route.startsWith('/en')&&!route.startsWith('/pl'));
const plRoutes=routes.filter(route=>route.startsWith('/pl')).map(route=>route.slice(3)||'/');
if(JSON.stringify(historicalRoutes)!==JSON.stringify(bilingualRoutes.filter(route=>!review3dRoutes.includes(route)))||review3dRoutes.some(route=>bilingualRoutes.filter(r=>r===route).length!==1)||JSON.stringify(ukRoutes)!==JSON.stringify(plRoutes))throw Error('Accepted route inventory changed');
if(!pages)fs.writeFileSync(path.join(root,'server/templates/publication.json'),JSON.stringify(publication,null,2)+'\n');
if(pages){
 fs.writeFileSync(path.join(output,'.nojekyll'),'');
 for(const [from,to]of redirectEntries){
  const dest=path.join(output,from.slice(1),'index.html'),target=publicURL(to,publication);
  fs.mkdirSync(path.dirname(dest),{recursive:true});
  fs.writeFileSync(dest,`<!doctype html><html lang="${from.startsWith('/en/')?'en':from.startsWith('/pl/')?'pl':'uk'}"><head><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><meta http-equiv="refresh" content="0;url=${esc(target)}"><link rel="canonical" href="${esc(publication.origin+target.split('#')[0])}"><title>NFC CARD</title></head><body><a href="${esc(target)}">NFC CARD</a></body></html>`);
 }
 locale='uk';
 fs.writeFileSync(path.join(output,'404.html'),publicHTML(shell(`<section class="section prose-page"><h1>Сторінку не знайдено / Page not found / Nie znaleziono strony</h1>${link('/','На головну','button')}${link('/en','Home in English','button secondary')}${link('/pl','Strona główna po polsku','button secondary')}</section>`,'/404.html','Сторінку не знайдено | NFC CARD','Page not found'),publication).replace(/<link rel="alternate"[^>]*>/g,''));
}
// The numerical guarantee remains on hold until separately approved complete terms exist.
for(const route of routes){
 const file=path.join(output,route.replace(/^\//,'').replace(/^$/,'index.html'));
 const htmlFile=file.endsWith('index.html')?file:path.join(file,'index.html');
 if(fs.existsSync(htmlFile)&&/(?:\+\s*40\s*%|50\s*%\s*(?:refund|повернен|zwrot))/iu.test(fs.readFileSync(htmlFile,'utf8')))throw Error('Held numerical guarantee appeared in public output');
}
console.log(`Refined existing site: ${routes.length} localized routes; ${publication.mode}; origin ${publication.origin}.`);
