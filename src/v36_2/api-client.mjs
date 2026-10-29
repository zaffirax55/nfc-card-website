/* CF-01 browser adapter. Same-origin, loopback-only preview; no real intake policy. */
import { priceCart,pricingProfile } from './commerce.mjs';
import {BUILD_CONFIG} from './build-config.mjs';
import {requestPolicy,isPreview,validateBuildConfig} from './release-policy.mjs';
export const BASE='/nfc-card-website';
export const CONTRACT_ID='NFC-CARD-V35-P4-02-CF-01';
export const PROFILE='NFC-V35-CJSON-1';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const ids=['review-card','branded-review-card','nfc-instagram-card','nfc-menu-card','review-card-3d','beauty-review-card','branded-beauty-review-card','restaurant-review-card','branded-restaurant-review-card'];
export const identity=Object.freeze(Object.fromEntries(ids.map(entryId=>{const mini=entryId.includes('beauty')||entryId.includes('restaurant'),branded=entryId.startsWith('branded-');return [entryId,Object.freeze({entryId,productId:mini?'nfc-review-card-mini':entryId==='review-card'||entryId==='branded-review-card'?'nfc-review-card':entryId==='review-card-3d'?'nfc-review-card-3d':entryId,offerId:branded?'branded':entryId==='review-card'?'standard':entryId==='review-card-3d'?'fixed_shown_design':'ready',niche:mini?(entryId.includes('beauty')?'beauty':'restaurant'):null,designMode:branded?'branded':entryId==='review-card-3d'?'fixed_shown_design':'ready'})];})));
const freeze=o=>{if(o&&typeof o==='object'){Object.values(o).forEach(freeze);Object.freeze(o);}return o;};
const clean=v=>String(v??'').replace(/\r\n?/g,'\n').normalize('NFC').replace(/^ +| +$/g,'');
const meaningful=v=>clean(v)||undefined;
const same=(a,b)=>canonical(a)===canonical(b);
export function canonical(o){if(o===null||typeof o!=='object')return JSON.stringify(o);if(Array.isArray(o))return '['+o.map(canonical).join(',')+']';return '{'+Object.keys(o).sort().map(k=>JSON.stringify(k)+':'+canonical(o[k])).join(',')+'}';}
export async function digest(normalized){const bytes=new TextEncoder().encode('NFC_CARD\0v2\0NFC-V35-CJSON-1\0'+canonical(normalized));return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');}
function configuration(eid,raw={},service=false){const c={};if(eid==='nfc-menu-card'){if(!service)c.intent='card_order';c.menuStatus=raw.menuStatus||'existing';if(c.menuStatus==='existing'&&raw.destination)c.menuUrl=new URL(raw.destination).href;}else if(eid==='nfc-instagram-card'){const url=new URL(raw.destination);c.instagramUrl='https://www.instagram.com/'+url.pathname.split('/')[1].toLowerCase()+'/';}else if(raw.destination)c.googleLocationUrl=new URL(raw.destination).href;
if(meaningful(raw.notes))c.notes=clean(raw.notes);
if(identity[eid]?.designMode==='branded'){
 if(meaningful(raw.designSplitNote))c.designSplitNote=clean(raw.designSplitNote);
 const brandInputs=Object.fromEntries(['logoNote','websiteOrInstagram','styleNote'].flatMap(k=>meaningful(raw[k])?[[k,clean(raw[k])]]:[]));if(Object.keys(brandInputs).length)c.brandInputs=brandInputs;
}return c;}
export function toWire(ui,sourcePage,config=BUILD_CONFIG){const language=ui.locale,contact={preferredMethod:ui.contact.preferredMethod};for(const k of ['phone','email'])if(meaningful(ui.contact[k]))contact[k]=k==='email'?clean(ui.contact[k]).toLowerCase():clean(ui.contact[k]).replace(/[ ()-]/g,'');if(meaningful(ui.contact.messenger))contact.telegram='@'+clean(ui.contact.messenger).replace(/^@/,'');
const lines=ui.lines.map(l=>{const p=identity[l.productId];if(!p)throw Error('offer_unavailable');return {lineId:l.lineId,entryId:p.entryId,productId:p.productId,offerId:p.offerId,quantity:l.quantity,...(l.productId==='nfc-menu-card'?{variantId:l.variantId}:{}),configuration:configuration(l.productId,l)};});
const wire={schemaVersion:2,kind:ui.intent,language,sourcePage,customerName:clean(ui.contact.name),contact,lines,consent:{requestProcessing:ui.consent.requestProcessing===true,...requestPolicy(config)},website:'',challenge:'SYNTHETIC.'+'A'.repeat(43)};
if(ui.intent!=='physical_order'){
 if(meaningful(ui.serviceNotes))wire.serviceNotes=clean(ui.serviceNotes);
 if(ui.serviceContext){const eid=ui.serviceContext.entryId,p=identity[eid];if(!p)throw Error('offer_unavailable');let cfg=configuration(eid,{...ui.serviceConfiguration,...(ui.intent==='menu_consultation'?{menuStatus:'needs_development'}:{})},true);wire.serviceContext={entryId:eid,productId:p.productId,offerId:p.offerId,intent:ui.intent,configuration:cfg};}
}return wire;}
// Ingress is already normalized by toWire. This builds the expected server snapshot;
// the backend independently validates every raw/wire/semantic constraint.
export function expectedNormalized(wire){const n=structuredClone(wire);delete n.website;delete n.challenge;n.normalizationProfile='NFC-V35-NORM-1';n.source='NFC_CARD';n.market=n.language==='pl'?'PL':'UA';n.currency=n.market==='PL'?'PLN':'UAH';n.utm=n.utm||{};n.serviceContext=n.serviceContext||null;n.serviceNotes=n.serviceNotes||null;n.lines=n.lines.map(l=>({...l,niche:identity[l.entryId].niche,designMode:identity[l.entryId].designMode})).sort((a,b)=>a.lineId.localeCompare(b.lineId,'en'));if(n.serviceContext)n.serviceContext={...n.serviceContext,niche:identity[n.serviceContext.entryId].niche,designMode:identity[n.serviceContext.entryId].designMode};return n;}
export function createAttempt(wire,key=crypto.randomUUID()){if(!UUID.test(key))throw Error('invalid_id');return freeze({key,body:structuredClone(wire),normalized:expectedNormalized(wire)});}
export function makeRecoveryMarker(attempt){return {version:1,attemptId:attempt.key,state:'unknown'};}
export function parseRecoveryMarker(raw){try{const m=JSON.parse(raw);return m&&Object.keys(m).sort().join(',')==='attemptId,state,version'&&m.version===1&&m.state==='unknown'&&UUID.test(m.attemptId)?m:null;}catch{return null;}}
let previewFault='';
export function setPreviewFault(value){if(!isPreview(BUILD_CONFIG))return;previewFault=['unavailable','timeout_after_commit'].includes(value)?value:'';}
function loopback(){return ['localhost','127.0.0.1','[::1]'].includes(globalThis.location?.hostname);}
async function request(url,options={}){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);try{const response=await fetch(url,{...options,signal:controller.signal,credentials:'omit',mode:'cors',redirect:'error',referrerPolicy:'no-referrer',cache:'no-store'});const contentType=response.headers.get('content-type')||'';if(!contentType.includes('application/json'))throw Error('invalid_server_response');const reader=response.body?.getReader();if(!reader)throw Error('invalid_server_response');const chunks=[];let size=0;for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>131072){await reader.cancel();throw Error('invalid_server_response');}chunks.push(value);}const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}const text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);return {response,data:JSON.parse(text)};}finally{clearTimeout(timer);}}
export async function submitAttempt(attempt,{config=BUILD_CONFIG,wait=ms=>new Promise(resolve=>setTimeout(resolve,ms))}={}){
 if(!config.v2Enabled)return {status:'error',code:'intake_disabled_pending_B05',retryable:false};
 try{validateBuildConfig(config);}catch{return {status:'error',code:'invalid_release_policy',retryable:false};}
 if(isPreview(config)&&!loopback())return {status:'error',code:'preview_only',retryable:false};
 try{
  // Renew once only after the server explicitly rejects a challenge before persistence.
  // Unknown outcomes, other validation errors and network failures still require explicit retry.
  let appliedFault;
  for(let renewal=0;renewal<=1;renewal++){
   const query=new URLSearchParams({sourcePage:attempt.body.sourcePage});
   const {response:challengeResponse,data:challenge}=await request(config.v2Endpoint+'/challenge?'+query);
   if(!challengeResponse.ok||typeof challenge.challenge!=='string')return {status:'error',code:challenge.code||'unavailable',retryable:true};
   await wait(Math.max(2000,Math.min(5000,Number(challenge.minimumDelayMs)||2000))+30);
   const body={...structuredClone(attempt.body),challenge:challenge.challenge};
   if(appliedFault===undefined){appliedFault=isPreview(config)?previewFault:'';previewFault='';}
   const headers={'Content-Type':'application/json','Idempotency-Key':attempt.key,...(appliedFault?{'X-NFC-Preview-Fault':appliedFault}:{})};
   const {response,data}=await request(config.v2Endpoint,{method:'POST',headers,body:JSON.stringify(body)});
   if(response.status===202)return {status:'success',receipt:data};
   const rejectedChallenge=response.status===422&&data.ok===false&&data.schemaVersion===2&&data.code==='expired_or_early_challenge'&&data.retryable===true;
   if(renewal===0&&rejectedChallenge)continue;
   return {status:response.status>=500?'timeout':'error',httpStatus:response.status,code:data.code||'unavailable',retryable:data.retryable!==false,errors:data.errors||[],...(rejectedChallenge?{challengeRejectedBeforeWrite:true}:{})};
  }
 }catch{return {status:'timeout',code:'outcome_unknown',retryable:true};}
}

function expectedQuote(n,quoteId,revision){const profile=pricingProfile(n.market,revision),physical=n.kind==='physical_order',lines=n.lines.map(l=>({lineId:l.lineId,productId:l.entryId,quantity:l.quantity,...(l.variantId?{variantId:l.variantId}:{}),...(l.entryId==='nfc-menu-card'?{intent:'card_order',menuStatus:l.configuration.menuStatus}:{})})),q=priceCart(lines,n.market,profile.revision),fixed=physical&&q.kind==='fixed',mixed=physical&&q.kind==='mixed',hasFixed=physical&&q.groups.some(g=>g.amount!==null),rev=profile.revision,dev=n.kind==='menu_consultation'||n.lines.some(l=>l.entryId==='nfc-menu-card'&&l.configuration.menuStatus==='needs_development');
 const subtotal=hasFixed?q.knownSubtotal*100:null,total=fixed?subtotal:null;
 return {quoteId,pricingRevision:rev,sourcePriceRevisions:[...profile.sourcePriceRevisions],market:n.market,currency:n.currency,completeness:!physical?'consultation':fixed?'complete':mixed?'partial':'quote_required',physicalQuantity:physical?n.lines.reduce((a,l)=>a+l.quantity,0):null,groups:q.groups.map(g=>({groupId:g.groupId,entryId:g.productId,lineIds:[...g.lineIds].sort(),quantity:g.quantity,pricingState:g.amount===null?'individual_quote':'fixed',amountMinor:g.amount===null?null:g.amount*100,unitAmountMinor:g.unitPrice===null?null:g.unitPrice*100,pricingRevision:rev})).sort((a,b)=>a.groupId.localeCompare(b.groupId,'en')),knownSubtotalMinor:subtotal,totalMinor:total,grandTotalMinor:fixed&&n.market==='UA'&&!dev?total:null,paymentRequired:false,dueNowMinor:null,depositPolicy:{state:!physical?'not_applicable':fixed?'after_agreement':'owner_policy_pending',amountMinor:fixed?(n.market==='PL'?2000:20000):null,frequency:physical?'once_per_physical_order':'not_applicable',includedInProductTotal:!physical?false:fixed?true:null},delivery:{state:!physical?'not_applicable':n.market==='PL'?'to_be_agreed':'included_ua_standard',originCountry:'UA',destinationMarket:physical?n.market:null,method:physical&&n.market==='UA'?'nova_poshta_standard':null,customerPays:physical?n.market==='PL':null,amountMinor:physical&&n.market==='UA'?0:null,agreedBeforeDeposit:physical},extras:{menuDevelopment:dev?'separately_agreed_not_included':'not_applicable'}};}
export async function validReceipt(attempt,r){try{const keys=['schemaVersion','source','requestId','acceptedAt','durableSaved','acceptedRequest','requestDigest','quote','notificationStatus'];if(!r||Object.keys(r).sort().join(',')!==keys.sort().join(',')||r.schemaVersion!==2||r.source!=='NFC_CARD'||!UUID.test(r.requestId)||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(r.acceptedAt)||r.durableSaved!==true||r.notificationStatus!=='disabled'||!same(r.acceptedRequest,attempt.normalized)||!UUID.test(r.quote?.quoteId))return false;const hash=await digest(attempt.normalized);return same(r.requestDigest,{profile:PROFILE,sha256:hash})&&same(r.quote,expectedQuote(attempt.normalized,r.quote.quoteId,r.quote.pricingRevision));}catch{return false;}}
