import {PUBLIC_RETAIL_CATALOG} from './public-catalog.mjs';
/* Shared raw-HTML and client metadata; release mode is explicit and gated. */
import {catalog,menuVariants,priceCart} from './commerce.mjs';
import {productCopy,translate} from './i18n.mjs';
import {BUILD_CONFIG} from './build-config.mjs';
import {isPublic} from './release-policy.mjs';
export const BASE='/nfc-card-website';
export const PUBLIC_ORIGIN='https://optidigitalagent.github.io';
export const LOCALES=Object.freeze(['uk','en','pl']);
export const ROBOTS='noindex,nofollow,noarchive';
export const FAQ_SCHEMA_POLICY='Visible product-specific FAQs; FAQPage JSON-LD intentionally omitted. Google FAQ rich results ended 2026-05-07; Schema.org vocabulary validity is separate.';
export const QUOTE_SCHEMA_POLICY='Omit Product and Offer when the approved quantity-one price is unknown. Do not synthesize zero prices, ratings, stock or commitments.';
export const LEGACY_ALIASES=Object.freeze({'/solutions/counter-stand/':'/solutions/review-card/','/solutions/team-kit/':'/solutions/review-card/','/solutions/multi-location/':'/solutions/review-card/'});
export const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const localized=(values,locale)=>values[LOCALES.indexOf(locale)];
export function normalizeRoute(route='/'){const clean=String(route).split(/[?#]/,1)[0];return (clean.startsWith('/')?clean:'/'+clean).replace(/\/+$/,'')+'/';}
export function publicPath(locale,route='/'){if(!LOCALES.includes(locale))throw new TypeError('Unsupported locale');return BASE+(locale==='uk'?'':'/'+locale)+normalizeRoute(route);}
export function canonicalURL(locale,route='/'){route=normalizeRoute(route);return PUBLIC_ORIGIN+publicPath(locale,LEGACY_ALIASES[route]||route);}
export function productForRoute(route){route=normalizeRoute(route);return catalog.find(p=>p.status==='active'&&route===p.route)||null;}
const titleText={
 '/privacy/archive/nfc-card-privacy-v35/':['Архівна політика конфіденційності V35','Archived privacy notice V35','Archiwalna polityka prywatności V35'],
 '/review/visual/':['Фінальна локальна композиція B + Guided','Final local composition B + Guided','Końcowa kompozycja lokalna B + Guided'],
 '/':['Готові NFC-картки для Google-відгуків та Instagram','Ready NFC cards for Google reviews and Instagram','Gotowe karty NFC do opinii Google i Instagram'],
 '/solutions/':['Каталог NFC-карток для бізнесу','Business NFC card catalog','Katalog kart NFC dla firm'],
 '/catalog/':['Каталог NFC-карток','NFC card catalog','Katalog kart NFC'],
 '/collections/':['Колекції NFC-карток за призначенням','NFC card collections by purpose','Kolekcje kart NFC według zastosowania'],
 '/collections/google-review/':['NFC-картки для відгуків Google','NFC cards for Google reviews','Karty NFC do opinii Google'],
 '/collections/instagram/':['NFC-картки для профілю Instagram','NFC cards for your Instagram profile','Karty NFC do profilu Instagram'],
 '/collections/online-menu/':['NFC-картки для онлайн-меню','NFC cards for an online menu','Karty NFC do menu online'],
 '/collections/mini/':['Mini NFC-картки для Beauty та Restaurant','Mini NFC cards for Beauty and Restaurant','Karty Mini NFC dla Beauty i Restaurant'],
 '/collections/branded/':['Зробити свій дизайн','Create your own design','Stwórz własny projekt'],
 '/search/':['Пошук NFC-карток за призначенням і форматом','Find NFC cards by purpose and format','Wyszukaj karty NFC według zastosowania i formatu'],
 '/cart/':['Кошик і конфігурації NFC-карток','Your NFC card cart and configurations','Koszyk i konfiguracje kart NFC'],
 '/order/':['Тестовий запит на NFC-картки','Test enquiry for NFC cards','Testowe zapytanie o karty NFC'],
 '/services/design/':['Зробити свій дизайн','Create your own design','Stwórz własny projekt'],
 '/services/quantity-advice/':['Консультація щодо кількості NFC-карток','Advice on NFC card quantities','Konsultacja dotycząca liczby kart NFC'],
 '/services/menu-consultation/':['Консультація з розробки онлайн-меню','Online menu development consultation','Konsultacja dotycząca tworzenia menu online'],
 '/thank-you/':['Результат локального тестового запиту','Local test enquiry result','Wynik lokalnego zapytania testowego'],
 '/faq/':['Питання про NFC-картки та замовлення','Questions about NFC cards and enquiries','Pytania o karty NFC i zamówienia'],
 '/about/':['Про нас','About us','O nas'],
 '/contact/':['Контакт і консультації NFC CARD','NFC CARD contact and consultations','Kontakt i konsultacje NFC CARD'],
 '/what-is-nfc-card/':['Як працює NFC CARD','How NFC CARD works','Jak działa NFC CARD'],
 '/delivery-and-payment/':['Доставка й оплата NFC-карток','NFC card delivery and payment','Dostawa i płatność za karty NFC'],
 '/privacy/':['Конфіденційність локального перегляду','Local preview privacy','Prywatność lokalnego podglądu'],
 '/terms/':['Умови локального тестового перегляду','Local test preview terms','Warunki lokalnego podglądu testowego'],
 '/warranty-and-returns/':['Гарантія та повернення NFC-карток','NFC card warranty and returns','Gwarancja i zwroty kart NFC'],
 '/instagram-card/':['Instagram Card: як перейти до профілю','Instagram Card: how profile access works','Instagram Card: jak przejść do profilu'],
 '/menu-card/':['Menu Card: як відкрити онлайн-меню','Menu Card: how to open an online menu','Menu Card: jak otworzyć menu online'],
 '/review/drafts/':['Варіанти Universal Mini на погодженні','Universal Mini variants awaiting approval','Warianty Universal Mini oczekujące na akceptację'],
 '/review/media/':['Матеріали та рішення власника — локальний перегляд','Owner media and decisions — local review','Materiały i decyzje właściciela — podgląd lokalny'],
 '/review/states/':['Локальні тестові стани кошика й запиту','Local cart and enquiry test states','Lokalne stany testowe koszyka i zapytania'],
 '/solutions/counter-stand/':['Google Review Card біля місця обслуговування','Google Review Card at the service point','Google Review Card przy punkcie obsługi'],
 '/solutions/team-kit/':['Google Review Card для команди','Google Review Card for your team','Google Review Card dla zespołu'],
 '/solutions/multi-location/':['Google Review Card для кількох локацій','Google Review Card for multiple locations','Google Review Card dla kilku lokalizacji']
};
export function isKnownRoute(route){route=normalizeRoute(route);return Object.hasOwn(titleText,route)||catalog.some(p=>p.route===route);}
export function pageMetadata(locale,route='/',config=BUILD_CONFIG){
 route=normalizeRoute(route);
 const draft=catalog.some(p=>route===p.route&&p.status==='draft');
 const p=catalog.find(p=>route===p.route&&p.status==='active'),t=key=>translate(key,locale);
 const productTitle=p?`${productCopy(p.id,locale).name} · ${localized(p.status==='draft'?['варіант на погодженні','variant awaiting approval','wariant do akceptacji']:p.purpose==='instagram_profile'?['перехід до Instagram','access your Instagram profile','przejście do profilu Instagram']:p.purpose==='online_menu'?['доступ до онлайн-меню','access your online menu','dostęp do menu online']:['доступ до відгуків Google','access Google reviews','dostęp do opinii Google'],locale)}`:null;
 const publicLabels={'/order/':['Заявка на NFC-картки','NFC card enquiry','Zapytanie o karty NFC'],'/thank-you/':['Підтвердження заявки','Enquiry confirmation','Potwierdzenie zapytania'],'/privacy/':['Політика конфіденційності','Privacy policy','Polityka prywatności'],'/terms/':['Умови замовлення','Order terms','Warunki zamówienia']};
 const label=isPublic(config)&&publicLabels[route]?localized(publicLabels[route],locale):titleText[route]?localized(titleText[route],locale):productTitle||t('notFound');
 const info={'/delivery-and-payment/':'deliveryBody','/privacy/':'privacyBody','/terms/':'termsBody','/warranty-and-returns/':'warrantyBody','/about/':'aboutBody','/contact/':'contactBody','/services/design/':'serviceBody','/services/quantity-advice/':'serviceBody','/services/menu-consultation/':'menuConsultationBody'};
 const scopedDescriptions={
  '/about/':localized(['Про нас: NFC CARD, Antonov Digital, засновник і робота над фізичними NFC-картками для бізнесу.','About us: NFC CARD, Antonov Digital, the founder and the work behind physical NFC cards for businesses.','O nas: NFC CARD, Antonov Digital, założyciel i praca nad fizycznymi kartami NFC dla firm.'],locale),
  '/delivery-and-payment/':localized(['Заявка без онлайн-оплати. Передоплата 200 грн один раз входить у суму замовлення. Стандартна Нова пошта в Україні — безкоштовно; деталі погоджуємо до передоплати.','Enquiry without online payment. One UAH 200 deposit is included in the agreed order total. Standard Nova Poshta delivery in Ukraine is free; details are agreed first.','Wysyłka z Ukrainy do Polski na koszt odbiorcy. Zaliczka 20 PLN raz na zamówienie jest wliczona w cenę. Warunki ustalamy przed zaliczką; bez płatności online.'],locale),
  '/collections/branded/':localized(['Власний дизайн для Google Review 10 × 10, Beauty Mini або Restaurant Mini. Окремий безкоштовний початковий запит, без фізичної покупки чи передоплати.','Your own design for Google Review 10 × 10, Beauty Mini or Restaurant Mini. A separate free initial enquiry, without a physical purchase or deposit.','Własny projekt dla Google Review 10 × 10, Beauty Mini lub Restaurant Mini. Osobne bezpłatne pierwsze zapytanie, bez zakupu fizycznych kart ani zaliczki.'],locale)
 };
 const catalogDescription=localized(['Шість фізичних NFC-карток: Google Review, Instagram, Menu, 3D, Beauty Mini та Restaurant Mini. Власний дизайн — окремий запит.','Six physical NFC cards: Google Review, Instagram, Menu, 3D, Beauty Mini and Restaurant Mini. Custom design is a separate service enquiry.','Sześć fizycznych kart NFC: Google Review, Instagram, Menu, 3D, Beauty Mini i Restaurant Mini. Własny projekt to osobna usługa.'],locale);
 const description=scopedDescriptions[route]??(['/solutions/','/catalog/','/collections/'].includes(route)?catalogDescription:isPublic(config)&&['/privacy/','/terms/'].includes(route)?label:p?productCopy(p.id,locale).description:info[route]?t(info[route]):route==='/instagram-card/'?productCopy('nfc-instagram-card',locale).description:route==='/menu-card/'?productCopy('nfc-menu-card',locale).description:t('heroBody'));
 const known=isKnownRoute(route)&&!(isPublic(config)&&route.startsWith('/review/'));
 return {locale,route,title:label+(route==='/about/'?' | NFC CARD · Antonov Digital':' | NFC CARD'),description,canonical:known?canonicalURL(locale,route):null,alternates:known?LOCALES.map(language=>({language,href:canonicalURL(language,route)})):[],robots:!isPublic(config)||!isKnownRoute(route)||route.startsWith('/review/')||route.startsWith('/privacy/archive/')||draft||['/cart/','/order/','/thank-you/','/search/','/services/email-proposal/'].includes(route)?ROBOTS:'index,follow,max-image-preview:large'};
}
export function productStructuredData(locale,route='/'){
 const p=productForRoute(route);if(!p)return null;
 const market=locale==='pl'?'PL':'UA';
 const quote=priceCart([{lineId:'schema',productId:p.id,quantity:1,...(p.id==='nfc-menu-card'?{variantId:menuVariants[0]}:{})}],market);
 if(quote.kind!=='fixed'||!Number.isFinite(quote.total)||quote.total<=0)return null;
 const copy=productCopy(p.id,locale),url=canonicalURL(locale,route);
 return {'@context':'https://schema.org','@type':'Product','@id':url+'#product',name:copy.name,description:copy.description,sku:p.id,url,offers:{'@type':'Offer',url,price:quote.total,priceCurrency:market==='PL'?'PLN':'UAH'}};
}
/** Only public physical retail entries; service promotions and legacy-only offers are excluded. */
export function catalogStructuredData(locale,route='/',entryIds=null){
 route=normalizeRoute(route);if(!['/solutions/','/catalog/','/collections/'].includes(route))return null;
 const entries=entryIds===null?PUBLIC_RETAIL_CATALOG:entryIds.map(id=>PUBLIC_RETAIL_CATALOG.find(p=>p.id===id)).filter(Boolean);
 const url=canonicalURL(locale,route);
 return {'@context':'https://schema.org','@type':'ItemList','@id':url+'#catalog',name:translate('catalog',locale),numberOfItems:entries.length,itemListElement:entries.map((p,i)=>({'@type':'ListItem',position:i+1,name:productCopy(p.id,locale).name,url:canonicalURL(locale,p.route)}))};
}
export function jsonForHTML(value){return JSON.stringify(value).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');}
export function metadataHTML(locale,route='/',config=BUILD_CONFIG){
 const m=pageMetadata(locale,route,config),schema=productStructuredData(locale,route),list=catalogStructuredData(locale,route);
 return `<meta name="robots" content="${m.robots}"><meta name="description" content="${esc(m.description)}">${m.canonical?`<link rel="canonical" href="${esc(m.canonical)}">`:''}${m.alternates.map(a=>`<link rel="alternate" hreflang="${a.language}" href="${esc(a.href)}">`).join('')}<title>${esc(m.title)}</title>${schema?`<script id="product-structured-data" type="application/ld+json">${jsonForHTML(schema)}</script>`:''}${list?`<script id="catalog-structured-data" type="application/ld+json">${jsonForHTML(list)}</script>`:''}`;
}
export function updateDocumentMetadata(locale,route='/',doc=globalThis.document,config=BUILD_CONFIG){
 if(!doc)return;
 const m=pageMetadata(locale,route,config);doc.title=m.title;
 const set=(selector,tag,attrs)=>{let el=doc.head.querySelector(selector);if(!el){el=doc.createElement(tag);doc.head.append(el);}for(const [name,value]of Object.entries(attrs))el.setAttribute(name,value);};
 set('meta[name="robots"]','meta',{name:'robots',content:m.robots});
 set('meta[name="description"]','meta',{name:'description',content:m.description});
 if(m.canonical)set('link[rel="canonical"]','link',{rel:'canonical',href:m.canonical});else doc.head.querySelector('link[rel="canonical"]')?.remove();
 if(!m.alternates.length)doc.head.querySelectorAll('link[rel="alternate"][hreflang]').forEach(el=>el.remove());
 for(const a of m.alternates)set(`link[rel="alternate"][hreflang="${a.language}"]`,'link',{rel:'alternate',hreflang:a.language,href:a.href});
 const grid=doc.querySelector('#results'),entries=grid?[...grid.querySelectorAll('[data-product-id]')].map(el=>el.dataset.productId):null;
 const list=catalogStructuredData(locale,route,entries);let listEl=doc.getElementById('catalog-structured-data');
 if(!list)listEl?.remove();else{if(!listEl){listEl=doc.createElement('script');listEl.id='catalog-structured-data';listEl.type='application/ld+json';doc.head.append(listEl);}listEl.textContent=jsonForHTML(list);}
 const schema=productStructuredData(locale,route);let el=doc.getElementById('product-structured-data');
 if(!schema){el?.remove();return;}
 if(!el){el=doc.createElement('script');el.id='product-structured-data';el.type='application/ld+json';doc.head.append(el);}el.textContent=jsonForHTML(schema);
}
