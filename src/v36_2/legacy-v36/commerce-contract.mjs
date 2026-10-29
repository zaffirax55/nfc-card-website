// Product schema v1 is additive to the accepted v6 lead/Review Card contract.
import {MENU_VARIANTS, menuQuote} from './menu-contract.mjs';
import {plFixedQuote,plReview3dQuote} from './pl-commerce.mjs';
export const IG = 'instagram';
export function validateCommerce(c) {
  const fail = () => { throw Error('invalid_commerce_configuration'); };
  if(typeof c.revision!=='string'||!c.revision.length||c.revision.length>120||c.physicalProduct?.id!=='nfc-review-card')fail();
  if(c.schemaVersion!==6||c.productSchemaVersion!==1||c.currency!=='UAH'||c.market!=='UA'||c.deposit!==200||c.depositIncluded!==true)fail();
  if(JSON.stringify(Object.keys(c.variants))!==JSON.stringify(['standard','branded'])||JSON.stringify(c.interests)!==JSON.stringify(['standard','branded','bulk','consultation',IG]))fail();
  if(JSON.stringify(c.quantities)!==JSON.stringify(['1','2','more'])||JSON.stringify(c.customQuoteInterests)!==JSON.stringify(['bulk','consultation'])||c.bulkQuantity!=='more')fail();
  const p=c.products, ig=p?.['nfc-instagram-card'],menu=p?.['nfc-menu-card'],review3d=p?.['nfc-review-card-3d'];
  if(ig?.pricingRevision!=='NFC-INSTAGRAM-UA-2026-09-v18'||typeof ig?.evidence!=='string'||!ig.evidence)fail();
  if(Object.keys(p||{}).sort().join()!=='nfc-instagram-card,nfc-menu-card,nfc-review-card,nfc-review-card-3d'||ig.sku!=='NFC-IG-READY'||ig.category!=='INSTAGRAM'||Object.keys(ig.offers).join()!=='ready')fail();
  const fixed3d=review3d?.offers?.fixed;
  if(review3d?.category!=='GOOGLE_REVIEW'||review3d?.pricingRevision!=='NFC-REVIEW-3D-UA-2026-09-v26'||
    typeof review3d?.evidence!=='string'||!review3d.evidence||Object.keys(review3d.offers).join()!=='fixed'||
    fixed3d?.unitUah!==4000||fixed3d?.depositUahPerOrder!==200||fixed3d?.depositIncluded!==true||
    fixed3d?.customDesign!==false||fixed3d?.prototype!==true||fixed3d?.madeToOrder!==true||
    fixed3d?.quantityMin!==1||fixed3d?.quantityMax!==10000)fail();
  const ready=ig.offers.ready;
  if(ready.customDesign!==false||ready.qr!=='not_included'||JSON.stringify(ready.quantities)!=='["1","2"]')fail();
  const expected={standard:['nfc-review-card','standard'],branded:['nfc-review-card','branded'],bulk:['nfc-review-card','custom'],consultation:['nfc-review-card','consultation'],instagram:['nfc-instagram-card','ready']};
  if(Object.keys(c.selections||{}).sort().join()!==Object.keys(expected).sort().join())fail();
  for(const [key,[product,offer]] of Object.entries(expected))if(c.selections[key]?.product_id!==product||c.selections[key]?.offer!==offer)fail();
  if(Object.keys(p['nfc-review-card'].offers).sort().join()!=='branded,standard')fail();
  for(const key of ['standard','branded'])if(p['nfc-review-card'].offers[key]?.legacyPriceKey!==key)fail();
  for(const prices of [c.variants.standard.prices,c.variants.branded.prices,ready.prices])if(Object.keys(prices).join()!=='1,2'||!Object.values(prices).every(n=>Number.isInteger(n)&&n>=c.deposit&&n<100000000))fail();
  if(ready.prices['1']!==1500||ready.prices['2']!==2600)fail();
  const menuReady=menu?.offers?.ready;
  if(menu?.pricingRevision!=='NFC-MENU-UA-2026-09-v23'||menu?.category!=='ONLINE_MENU'||
    menuReady?.customDesign!==false||menuReady?.qr!=='not_included'||menuReady?.readyMadeOnly!==true||
    menuReady?.mounting!=='adhesive_tape'||JSON.stringify(menuReady?.thicknessMmApprox)!=='[3,4]'||
    JSON.stringify(Object.keys(menuReady?.variants||{}))!==JSON.stringify(MENU_VARIANTS)||
    JSON.stringify(menuReady?.tiers)!==JSON.stringify([{min:1,max:4,unitUah:1000},{min:5,max:9,unitUah:750},{min:10,max:24,unitUah:600},{min:25,max:null,unitUah:500}])||
    menuReady?.depositUahPerOrder!==200||menuReady?.depositIncluded!==true||menuReady?.mixVariants!==true)fail();
  for(const n of [1,4,5,6,9,10,15,24,25,26])if(menuQuote([{variant_id:MENU_VARIANTS[0],quantity:n}]).amount!==n*(n>=25?500:n>=10?600:n>=5?750:1000))fail();
  return c;
}
export function review3dQuote(c, quantity, locale='uk') {
  if(locale==='pl')return plReview3dQuote(c.poland,quantity);
  const offer=c.products['nfc-review-card-3d'].offers.fixed;
  const valid=typeof quantity==='number'&&Number.isSafeInteger(quantity)&&quantity>=offer.quantityMin&&quantity<=offer.quantityMax;
  const amount=valid?quantity*offer.unitUah:null;
  return {valid,quantity,unitPrice:offer.unitUah,amount,deposit:valid?offer.depositUahPerOrder:null,
    balance:valid?amount-offer.depositUahPerOrder:null,currency:c.currency,
    pricingRevision:c.products['nfc-review-card-3d'].pricingRevision};
}
export function selectionQuote(c, selection, quantity='1', locale='uk') {
  const q=String(quantity), spec=c.selections[selection];
  const valid=!!spec&&c.quantities.includes(q)&&(selection!==IG||['1','2'].includes(q));
  const offer=spec&&c.products[spec.product_id].offers[spec.offer];
  const prices=offer?.legacyPriceKey?c.variants[offer.legacyPriceKey].prices:offer?.prices;
  const polish=locale==='pl'&&valid?plFixedQuote(c.poland,selection,q):null;
  return {valid,pricingRevision:polish?.pricingRevision||(spec?(c.products[spec.product_id].pricingRevision||c.revision):c.revision),evidence:spec?(c.products[spec.product_id].evidence||c.evidence):c.evidence,amount:polish?polish.amount:(valid&&q!=='more'?(prices?.[q]??null):null),currency:polish?.currency||c.currency,deposit:polish?polish.deposit:c.deposit,...(spec||{})};
}

// Accept exact HTTPS profile URLs only, never redirects, credentials or content URLs.
export function instagramProfileURL(value) {
  if(typeof value!=='string'||value.length>250||!/^https:\/\/(?:www\.)?instagram\.com\/[A-Za-z0-9._]{1,30}\/?$/i.test(value))return null;
  const name=value.split('/')[3].toLowerCase();
  if(name.startsWith('.')||name.endsWith('.')||name.includes('..')||new Set(['p','reel','reels','stories','explore','accounts','direct','about','legal','developer','developers','web','api','challenge','oauth','tv']).has(name))return null;
  return 'https://www.instagram.com/'+name+'/';
}
