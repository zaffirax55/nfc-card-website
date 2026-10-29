/* Accepted Gate B catalog and non-authoritative browser estimate. API submission is in api-client.mjs.
 * Frozen source: NFC-CARD-CONTENT-TRUTH-PRICE-v33 / NFC-CARD-PL-2026-09-v28,
 * frontend 51258011d66d54a43632cc1bc6c71419b7a3d6fb. Values are whole UAH/PLN.
 * This browser estimate is not server authority and cannot accept a real order.
 */
const freeze = value => {
  if (value && typeof value === 'object') {
    for (const item of Object.values(value)) freeze(item);
    Object.freeze(value);
  }
  return value;
};
export const OWNER_UA_PRICING_REVISION='NFC-V35-V2-OWNER-20261027-UA';
export const OWNER_UA_SOURCE_REVISION='NFC-CARD-BRANDED-PAIR-OWNER-20261026';
const legacyUASources=['NFC-CARD-CONTENT-TRUTH-PRICE-v33','NFC-INSTAGRAM-UA-2026-09-v18','NFC-MENU-UA-2026-09-v23','NFC-REVIEW-3D-UA-2026-09-v26'];
const pricingProfiles=freeze({
 'NFC-V35-V2-CANDIDATE-01-UA':{revision:'NFC-V35-V2-CANDIDATE-01-UA',market:'UA',sourcePriceRevisions:legacyUASources,brandedUaPair:2600},
 [OWNER_UA_PRICING_REVISION]:{revision:OWNER_UA_PRICING_REVISION,market:'UA',sourcePriceRevisions:[...legacyUASources,OWNER_UA_SOURCE_REVISION],brandedUaPair:3600},
 'NFC-V35-V2-CANDIDATE-01-PL':{revision:'NFC-V35-V2-CANDIDATE-01-PL',market:'PL',sourcePriceRevisions:['NFC-CARD-PL-2026-09-v28'],brandedUaPair:null},
});
export function pricingRevision(market){if(market==='UA')return OWNER_UA_PRICING_REVISION;if(market==='PL')return 'NFC-V35-V2-CANDIDATE-01-PL';throw new RangeError('Invalid pricing market');}
export function pricingProfile(market,revision=pricingRevision(market)){if(typeof revision!=='string'||!Object.hasOwn(pricingProfiles,revision)||pricingProfiles[revision].market!==market)throw new RangeError('Unknown pricing profile for market');return pricingProfiles[revision];}
const product = (id, slug, name, design, purpose, format, fields = {}) => ({
  id, slug, name, design, purpose, format, niche: null, status: 'active',
  route: `/solutions/${slug}/`, revision: 'NFC-CARD-CONTENT-TRUTH-PRICE-v33', ...fields
});
export const catalog = freeze([
  product('review-card', 'review-card', 'Google Review Card', 'ready', 'google_review', 'standard_100', {fixedUA:{1:1500,2:2600},fixedPL:{1:129,2:219}}),
  product('branded-review-card', 'branded-review-card', 'Branded Review Card', 'branded', 'google_review', 'standard_100', {fixedUA:{1:2000,2:3600},fixedPL:{1:169,2:299},revision:OWNER_UA_SOURCE_REVISION}),
  product('nfc-instagram-card', 'instagram-card', 'NFC Instagram Card', 'ready', 'instagram_profile', 'standard_100', {fixedUA:{1:1500,2:2600},fixedPL:{1:129,2:219},revision:'NFC-INSTAGRAM-UA-2026-09-v18'}),
  product('nfc-menu-card', 'menu-card', 'NFC Menu Card', 'ready', 'online_menu', 'menu_variants', {revision:'NFC-MENU-UA-2026-09-v23'}),
  product('review-card-3d', 'review-card-3d', 'NFC Review Card 3D', 'fixed_shown_design', 'google_review', 'three_d', {unitUA:4000,unitPL:349,prototype:true,madeToOrder:true,revision:'NFC-REVIEW-3D-UA-2026-09-v26'}),
  product('beauty-review-card', 'beauty-review-card', 'Beauty Review Card Mini', 'ready', 'google_review', 'mini', {niche:'beauty',fixedUA:{1:800,2:1400},legacy:true}),
  product('branded-beauty-review-card', 'branded-beauty-review-card', 'Branded Beauty Review Card Mini', 'branded', 'google_review', 'mini', {niche:'beauty',fixedUA:{1:800,2:1600},legacy:true}),
  product('restaurant-review-card', 'restaurant-review-card', 'Restaurant Review Card Mini', 'ready', 'google_review', 'mini', {niche:'restaurant',legacy:true}),
  product('branded-restaurant-review-card', 'branded-restaurant-review-card', 'Branded Restaurant Review Card Mini', 'branded', 'google_review', 'mini', {niche:'restaurant',legacy:true}),
  product('universal-ready-mini', 'universal-mini-card', 'Universal Ready Mini', 'ready', 'google_review', 'mini', {status:'draft',revision:null}),
  product('universal-branded-mini', 'branded-mini-card', 'Universal Branded Mini', 'branded', 'google_review', 'mini', {status:'draft',revision:null})
]);
export const menuVariants = freeze(['square_100_black','square_100_white','square_60_black','square_60_white','round_70_black','round_70_white']);
export const eligibleDesignProducts = freeze(catalog.filter(p => p.status === 'active' && p.design === 'branded'));
export const pricingSource = freeze({frontend:'51258011d66d54a43632cc1bc6c71419b7a3d6fb',uaRevision:'NFC-CARD-CONTENT-TRUTH-PRICE-v33',plRevision:'NFC-CARD-PL-2026-09-v28',uaOwnerOverride:OWNER_UA_SOURCE_REVISION,estimate:true});
const byId = new Map(catalog.map(p => [p.id,p]));
// These are existing registry design modes, not new purchasable offers or v1 wire tags.
export function serviceContextFor(entryId, intent) {
  const p = byId.get(entryId);
  if (!p || p.status !== 'active') return null;
  if (intent === 'free_design_concepts' && !eligibleDesignProducts.some(item => item.id === entryId)) return null;
  if (intent === 'menu_consultation' && entryId !== 'nfc-menu-card') return null;
  if (!['free_design_concepts', 'quantity_advice', 'menu_consultation'].includes(intent)) return null;
  return freeze({entryId, intent, offerId:p.design,...(intent==='menu_consultation'?{menuStatus:'needs_development'}:{})});
}
export function configurationSnapshot(lines) {
  return lines.map(line => ({
    lineId:line.lineId, productId:line.productId, quantity:line.quantity,
    variantId:line.variantId ?? null, destination:line.destination ?? '', notes:line.notes ?? '',
    intent:line.productId === 'nfc-menu-card' ? line.intent ?? 'card_order' : null,
    menuStatus:line.productId === 'nfc-menu-card' ? line.menuStatus ?? 'existing' : null
  }));
}
const safeId = value => typeof value === 'string' && /^[A-Za-z0-9_-]{1,80}$/.test(value);
const validQuantity = q => Number.isSafeInteger(q) && q >= 1 && q <= 10000;
const marketOK = market => ['UA','PL'].includes(market);
const error = (line, code, field = 'quantity') => ({lineId: typeof line?.lineId === 'string' ? line.lineId : '', code, field});

function structuralErrors(line, allLines) {
  const errors = [];
  if (!line || typeof line !== 'object' || Array.isArray(line)) return [error(null,'invalid_line','line')];
  const p = byId.get(line.productId);
  if (!safeId(line.lineId)) errors.push(error(line,'invalid_line_id','lineId'));
  if (!p) errors.push(error(line,'unknown_product','productId'));
  else if (p.status !== 'active' || line.expired === true) errors.push(error(line,'offer_unavailable','productId'));
  if (!validQuantity(line.quantity)) errors.push(error(line,'invalid_quantity'));
  if (p?.id === 'nfc-menu-card' && !menuVariants.includes(line.variantId)) errors.push(error(line,'invalid_variant','variantId'));
  if (p?.id === 'nfc-menu-card' && (line.intent === undefined ? 'card_order' : line.intent) !== 'card_order') errors.push(error(line,'invalid_menu_intent','intent'));
  if (p?.id === 'nfc-menu-card' && !['existing','needs_development'].includes(line.menuStatus === undefined ? 'existing' : line.menuStatus)) errors.push(error(line,'invalid_menu_status','menuStatus'));
  if (p?.id !== 'nfc-menu-card' && (line.menuStatus !== undefined || line.intent !== undefined)) errors.push(error(line,'unexpected_menu_configuration','menuStatus'));
  if (p?.id !== 'nfc-menu-card' && line.variantId) errors.push(error(line,'invalid_variant','variantId'));
  if (typeof line.notes !== 'undefined' && (typeof line.notes !== 'string' || line.notes.length > 2000 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(line.notes))) errors.push(error(line,'invalid_notes','notes'));
  const peers = allLines.filter(other => other && typeof other === 'object' && !Array.isArray(other) && other.productId === line.productId);
  const aggregate = peers.reduce((sum,other) => sum + (validQuantity(other.quantity) ? other.quantity : 0),0);
  if (aggregate > 10000) errors.push(error(line,'quantity_limit'));
  if (p?.id === 'nfc-instagram-card' && aggregate > 2) errors.push(error(line,'instagram_quantity_limit'));
  return errors;
}

// Syntax checks only; destinations are never loaded, probed or DNS-resolved.
export function normalizeDestination(productId, value) {
  const p = byId.get(productId);
  if (!p || typeof value !== 'string' || value.length > 1000 || /[\u0000-\u0020\u007f<>"'\\]/u.test(value)) return null;
  if (p.purpose === 'instagram_profile') {
    const raw = value.startsWith('@') ? `https://www.instagram.com/${value.slice(1)}/` : value;
    const match = raw.match(/^https:\/\/(?:www\.)?instagram\.com\/([A-Za-z0-9._]{1,30})\/?$/i);
    if (!match) return null;
    const handle=match[1].toLowerCase();
    if (handle.startsWith('.') || handle.endsWith('.') || handle.includes('..') || ['p','reel','reels','stories','explore','accounts','direct','about','legal','developer','developers','web','api','challenge','oauth','tv'].includes(handle)) return null;
    return `https://www.instagram.com/${handle}/`;
  }
  let url;
  try { url = new URL(value); } catch { return null; }
  const host=url.hostname.toLowerCase();
  if (!['https:','http:'].includes(url.protocol) || url.username || url.password || url.port || host.endsWith('.')) return null;
  if (p.purpose === 'google_review') {
    if (url.protocol!=='https:') return null;
    if (!(/^([a-z0-9-]+\.)*google\.com$/.test(host) || ['maps.app.goo.gl','g.page','goo.gl'].includes(host))) return null;
    return url.href;
  }
  if (host.startsWith('[')) return null;
  if (/^\d+(?:\.\d+){3}$/.test(host)) {
    const octets=host.split('.').map(Number),[a,b,c]=octets;
    if (octets.some(n=>n>255) || a===0 || a===10 || a===127 || a>=224 ||
        (a===100&&b>=64&&b<=127) || (a===169&&b===254) || (a===172&&b>=16&&b<=31) ||
        (a===192&&[0,168].includes(b)) || (a===198&&[18,19].includes(b)) ||
        (a===198&&b===51&&c===100) || (a===203&&b===0&&c===113)) return null;
  } else if (!/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9-]{2,63}$/.test(host) || /\.(?:localhost|local|internal|invalid|test|example)$/.test(host)) return null;
  return url.href;
}

export function validateLine(line, allLines = [line], market = 'UA') {
  if (!Array.isArray(allLines)) allLines = [line];
  const errors=structuralErrors(line,allLines);
  if (!marketOK(market)) errors.push(error(line,'invalid_market','market'));
  const p=byId.get(line?.productId);
  const pendingGoogle=p?.purpose==='google_review' && (line.destination===undefined || line.destination==='');
  const menuDevelopment=p?.id==='nfc-menu-card' && line.menuStatus==='needs_development';
  if (menuDevelopment && line.destination !== undefined && line.destination !== '') errors.push(error(line,'menu_development_has_url','destination'));
  if (p?.status === 'active' && !pendingGoogle && !menuDevelopment && !normalizeDestination(p.id,line.destination)) errors.push(error(line,'invalid_destination','destination'));
  return errors;
}

export function priceCart(lines = [], market = 'UA', revision) {
  const currency = market === 'PL' ? 'PLN' : 'UAH';
  const base = {currency,knownSubtotal:0,total:null,kind:'invalid',groups:[],errors:[],depositDueNow:null,estimate:true};
  if (!marketOK(market)) return {...base,errors:[{lineId:'',code:'invalid_market',field:'market'}]};
  const profile=pricingProfile(market,revision);
  if (!Array.isArray(lines) || lines.length > 100) return {...base,errors:[{lineId:'',code:'invalid_lines',field:'lines'}]};
  if (!lines.length) return {...base,total:0,kind:'empty'};
  const errors=lines.flatMap(line => structuralErrors(line,lines));
  const seen=new Set();
  for (const line of lines) {
    if (seen.has(line?.lineId)) errors.push(error(line,'duplicate_line_id','lineId'));
    seen.add(line?.lineId);
  }
  if (errors.length) return {...base,errors};
  const grouped=new Map();
  for (const line of lines) {
    const g=grouped.get(line.productId) ?? {productId:line.productId,quantity:0,lineIds:[],amount:null};
    g.quantity+=line.quantity; g.lineIds.push(line.lineId); grouped.set(line.productId,g);
  }
  const groups=[...grouped.values()].map(g => {
    const p=byId.get(g.productId), q=g.quantity;
    let amount=null,unitPrice=null;
    if (p.id==='nfc-menu-card') {
      unitPrice=market==='PL' ? (q>=25?45:q>=10?55:q>=5?69:89) : (q>=25?500:q>=10?600:q>=5?750:1000);
      amount=q*unitPrice;
    } else if (p.id==='review-card-3d') {unitPrice=market==='PL'?p.unitPL:p.unitUA; amount=q*unitPrice;}
    else amount=(market==='PL'?p.fixedPL:p.fixedUA)?.[q] ?? null;
    if(p.id==='branded-review-card'&&market==='UA'&&q===2)amount=profile.brandedUaPair;
    return {...g,groupId:`${market}:${p.id}`,amount,unitPrice,pricingRevision:market==='PL'?'NFC-CARD-PL-2026-09-v28':p.id==='branded-review-card'&&profile.revision==='NFC-V35-V2-CANDIDATE-01-UA'?'NFC-CARD-CONTENT-TRUTH-PRICE-v33':p.revision};
  });
  const knownSubtotal=groups.reduce((sum,g)=>sum+(g.amount??0),0);
  const quote=groups.some(g=>g.amount===null),fixed=groups.some(g=>g.amount!==null);
  return {...base,groups,knownSubtotal,total:quote?null:knownSubtotal,kind:quote?(fixed?'mixed':'quote'):'fixed'};
}

export function validateRequest(body) {
  const errors=[];
  if (!body || typeof body!=='object' || Array.isArray(body)) return [{field:'request',code:'invalid_request'}];
  const add=(field,code)=>errors.push({field,code});
  if (!['uk','en','pl'].includes(body.locale) || body.market!==(body.locale==='pl'?'PL':'UA')) add('market','market_locale_mismatch');
  const physical=body.intent==='physical_order', service=['free_design_concepts','quantity_advice','menu_consultation'].includes(body.intent);
  if (!physical&&!service) add('intent','invalid_intent');
  if (!Array.isArray(body.lines)) add('lines','invalid_lines');
  else if (physical) {
    if (!body.lines.length) add('lines','empty_cart');
    errors.push(...priceCart(body.lines,body.market).errors);
    errors.push(...body.lines.flatMap(line=>validateLine(line,body.lines,body.market)));
  } else if (body.lines.length) add('lines','service_has_physical_lines');
  if (service && ['quantity','amount','deposit'].some(k=>body[k]!=null)) add('intent','service_has_amount_or_quantity');
  if (physical && body.serviceContext != null) add('serviceContext','physical_has_service_context');
  if (service) {
    const context=body.serviceContext;
    const required=body.intent==='free_design_concepts'||body.intent==='menu_consultation';
    if (required && !context) add('serviceContext','service_context_required');
    if (context != null) {
      if (typeof context!=='object'||Array.isArray(context)) add('serviceContext','invalid_service_context');
      else {
        const canonical=serviceContextFor(context.entryId,body.intent);
        if (!canonical || context.intent!==body.intent || (context.offerId!==undefined && context.offerId!==canonical.offerId)
          || (context.menuStatus!==undefined && context.menuStatus!==canonical?.menuStatus)) add('serviceContext','invalid_service_context');
        if (Object.keys(context).some(k=>!['entryId','intent','offerId','brief','menuStatus'].includes(k))) add('serviceContext','invalid_service_context');
        if (context.brief!==undefined && (typeof context.brief!=='string'||context.brief.length>2000||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(context.brief))) add('serviceContext','invalid_service_context');
      }
    }
    if (body.serviceNotes!==undefined && (typeof body.serviceNotes!=='string'||body.serviceNotes.length>2000||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(body.serviceNotes))) add('serviceNotes','invalid_service_notes');
  }
  const c=body.contact ?? {};
  if (typeof c.name!=='string' || c.name.trim().length<2 || c.name.length>100 || /[\u0000-\u001f\u007f]/u.test(c.name)) add('name','invalid_name');
  const email=typeof c.email==='string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email) && c.email.length<=254;
  const phone=typeof c.phone==='string' && /^\+?[0-9 ()-]{7,30}$/.test(c.phone) && c.phone.replace(/\D/g,'').length>=7;
  const messenger=typeof c.messenger==='string' && c.messenger.trim().length>=3 && c.messenger.length<=200 && !/[\u0000-\u001f\u007f<>]/u.test(c.messenger);
  if (c.email && !email) add('email','invalid_email');
  if (c.phone && !phone) add('phone','invalid_phone');
  if (c.messenger && !messenger) add('messenger','invalid_messenger');
  if (!email&&!phone&&!messenger) add('contact','contact_required');
  if (!['phone','sms','email','telegram','whatsapp','viber'].includes(c.preferredMethod)) add('preferredMethod','invalid_contact_method');
  if (c.preferredMethod==='email'&&!email) add('email','preferred_email_required');
  if (['phone','sms','whatsapp','viber'].includes(c.preferredMethod)&&!phone) add('phone','preferred_phone_required');
  if (c.preferredMethod==='telegram'&&!phone&&!messenger) add('messenger','preferred_telegram_required');
  if (physical && Array.isArray(body.lines) && body.lines.some(l=>l?.productId==='nfc-instagram-card') && (!phone || !['telegram','whatsapp','viber'].includes(c.preferredMethod))) add('contact','instagram_phone_and_messenger_required');
  if (body.consent?.requestProcessing!==true || body.consent?.revision!=='PHASE3-PROPOSAL') add('consent','request_consent_required');
  return errors.filter((e,i,a)=>a.findIndex(x=>x.field===e.field&&x.code===e.code&&x.lineId===e.lineId)===i);
}

