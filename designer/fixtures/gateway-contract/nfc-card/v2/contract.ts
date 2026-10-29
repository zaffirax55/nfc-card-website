/** Pure CF-01 parser/normalizer, pricing and immutable receipt data contract.
 * Historical synthetic consent stays the default fixture shape. Runtime approval is external; this pure module enables no intake.
 */
import { createHash } from 'node:crypto';
import { isIP } from 'node:net';
import { isDeepStrictEqual } from 'node:util';
import { SYNTHETIC_PROFILE,validConsentProfile,type ConsentProfile } from './policy.ts';
import { ACTIVE_ENTRIES, DRAFT_ENTRIES, MENU_VARIANTS, LIMITS, NORMALIZATION_PROFILE, DIGEST_PROFILE,
  getEntry, groupPrice, pricingRevision, pricingProfile, type CatalogEntry, type Currency, type Market, type Niche, type DesignMode } from './registry.ts';
export { CONTRACT_ID, CORE_SHA256, NORMALIZATION_PROFILE, DIGEST_PROFILE } from './registry.ts';
export const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
export type RequestKind='physical_order'|'free_design_concepts'|'quantity_advice'|'menu_consultation';
export type Configuration={googleLocationUrl?:string;notes?:string;designSplitNote?:string;brandInputs?:{logoNote?:string;websiteOrInstagram?:string;styleNote?:string};instagramUrl?:string;intent?:'card_order';menuStatus?:'existing'|'needs_development';menuUrl?:string};
export type Contact={preferredMethod:'phone'|'email'|'telegram'|'whatsapp'|'viber';phone?:string;email?:string;telegram?:string};
export type NormalizedLine={lineId:string;entryId:string;productId:string;offerId:string;quantity:number;configuration:Configuration;variantId?:string;niche:Niche;designMode:DesignMode};
export type ServiceContext={entryId:string;productId:string;offerId:string;intent:Exclude<RequestKind,'physical_order'>;configuration:Configuration;niche:Niche;designMode:DesignMode};
export type NormalizedRequest={schemaVersion:2;kind:RequestKind;language:'uk'|'en'|'pl';sourcePage:string;customerName:string;contact:Contact;lines:NormalizedLine[];consent:ConsentProfile&{requestProcessing:true};normalizationProfile:typeof NORMALIZATION_PROFILE;source:'NFC_CARD';market:Market;currency:Currency;utm:Record<string,string>;serviceNotes:string|null;serviceContext:ServiceContext|null};
export type PriceGroup={groupId:string;entryId:string;lineIds:string[];quantity:number;pricingState:'fixed'|'individual_quote';amountMinor:number|null;unitAmountMinor:number|null;pricingRevision:string};
export type Quote={quoteId:string;pricingRevision:string;sourcePriceRevisions:string[];market:Market;currency:Currency;completeness:'complete'|'partial'|'quote_required'|'consultation';physicalQuantity:number|null;groups:PriceGroup[];knownSubtotalMinor:number|null;totalMinor:number|null;grandTotalMinor:number|null;paymentRequired:false;dueNowMinor:null;depositPolicy:{state:'after_agreement'|'owner_policy_pending'|'not_applicable';amountMinor:number|null;frequency:'once_per_physical_order'|'not_applicable';includedInProductTotal:boolean|null};delivery:{state:'included_ua_standard'|'to_be_agreed'|'not_applicable';originCountry:'UA';destinationMarket:Market|null;method:'nova_poshta_standard'|null;customerPays:boolean|null;amountMinor:number|null;agreedBeforeDeposit:boolean};extras:{menuDevelopment:'not_applicable'|'separately_agreed_not_included'}};
export type Receipt={schemaVersion:2;source:'NFC_CARD';requestId:string;acceptedAt:string;durableSaved:true;acceptedRequest:NormalizedRequest;requestDigest:{profile:typeof DIGEST_PROFILE;sha256:string};quote:Quote;notificationStatus:'disabled'|'queued'};
export class NfcV2Error extends Error {
  readonly status:number;readonly code:string;readonly retryable:boolean;
  constructor(status:number,code:string,retryable=['invalid_challenge','expired_or_early_challenge','rate_limited','request_in_progress','unavailable','outcome_unknown'].includes(code)){super(code);this.name='NfcV2Error';this.status=status;this.code=code;this.retryable=retryable;}
}
function fail(code='invalid_payload',status=422):never { throw new NfcV2Error(status,code); }
type Obj=Record<string,unknown>;
const own=(o:object,k:string)=>Object.prototype.hasOwnProperty.call(o,k);
function object(value:unknown,allowed:readonly string[],required:readonly string[]=[],code='invalid_payload'):Obj {
  if(!value||typeof value!=='object'||Array.isArray(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value)))fail(code);
  const v=value as Obj;
  if(Object.keys(v).some(k=>!allowed.includes(k))||required.some(k=>!own(v,k)))fail(code);
  for(const [key,d]of Object.entries(Object.getOwnPropertyDescriptors(v)))if(!('value'in d)||!d.enumerable||d.value===undefined||d.value===null||['__proto__','constructor','prototype'].includes(key))fail(code);
  return v;
}
function scalarLength(s:string):number{return [...s].length;}
function unicodeOK(s:string):boolean {
  for(let i=0;i<s.length;i++){const c=s.charCodeAt(i);if(c>=0xd800&&c<=0xdbff){const n=s.charCodeAt(++i);if(!(n>=0xdc00&&n<=0xdfff))return false;}else if(c>=0xdc00&&c<=0xdfff)return false;}return true;
}
function text(value:unknown,max:number,optional=false,multiline=false,min=1):string|undefined {
  if(value===undefined&&optional)return;
  if(typeof value!=='string'||!unicodeOK(value)||scalarLength(value)>max)fail();
  const forbidden=multiline?/[\u0000-\u0009\u000b\u000c\u000e-\u001f\u007f\u202a-\u202e\u2066-\u2069]/u:/[\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069]/u;
  const v=(multiline?value.replace(/\r\n?/g,'\n'):value).normalize('NFC').replace(/^ +| +$/g,'');
  if(forbidden.test(multiline?value.replace(/\r\n?/g,'\n'):value)||scalarLength(v)>max)fail();
  if(!v&&optional)return;
  if(scalarLength(v)<min)fail();return v;
}
function exactString(v:unknown,max:number,code='invalid_payload'):string {if(typeof v!=='string'||!unicodeOK(v)||!v||scalarLength(v)>max||/[\u0000-\u0020\u007f\u202a-\u202e\u2066-\u2069]/u.test(v))fail(code);return v;}
function quantity(v:unknown):number {if(typeof v!=='number'||!Number.isSafeInteger(v)||Object.is(v,-0))fail('invalid_number_token',400);if(v<1||v>LIMITS.aggregateQuantity)fail('quantity_limit');return v;}
function identity(v:Obj):CatalogEntry {
  if(typeof v.entryId!=='string')fail('invalid_id');
  if(DRAFT_ENTRIES.includes(v.entryId))fail('offer_unavailable');
  const entry=getEntry(v.entryId);if(!entry||v.productId!==entry.productId||v.offerId!==entry.offerId)fail('invalid_id');return entry;
}
export function normalizeSourcePage(value:unknown,language:'uk'|'en'|'pl'):string {
  if(typeof value!=='string'||value.length>300||/[^\x21-\x7e]/.test(value)||/[?#%\\]/.test(value))fail('invalid_source_locale');
  const prefix='/nfc-card-website'+(language==='uk'?'':'/'+language);
  const path=value.replace(/\/$/,'');
  const slugs=['review-card','branded-review-card','review-card-3d','instagram-card','menu-card','beauty-review-card','branded-beauty-review-card','restaurant-review-card','branded-restaurant-review-card'];
  const allowed=['','/catalog','/cart','/search','/order','/contact','/about','/instagram-card','/menu-card',...slugs.map(s=>'/solutions/'+s)];
  if(!allowed.some(s=>path===prefix+s))fail('invalid_source_locale');return path+'/';
}
function urlBase(value:unknown,max:number):{url:URL;raw:string} {
  const raw=exactString(value,max,'invalid_configuration');if(/[\\]/.test(raw))fail('invalid_configuration');
  const authority=raw.match(/^https?:\/\/([^/?#]+)/i)?.[1];
  // Inspect raw authority before WHATWG URL serialization can erase :443/:80.
  if(!authority||authority.includes(':')||authority.includes('@'))fail('invalid_configuration');
  let url:URL;try{url=new URL(raw);}catch{fail('invalid_configuration');}
  if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.port||url.hostname.endsWith('.')||url.hostname.includes('%')||scalarLength(url.href)>max)fail('invalid_configuration');
  return {url,raw};
}
export function normalizeGoogleURL(value:unknown):string {
  const {url}=urlBase(value,1000),host=url.hostname.toLowerCase();
  if(url.protocol!=='https:'||!(/^([a-z0-9-]+\.)*google\.com$/.test(host)||['maps.app.goo.gl','g.page','goo.gl'].includes(host)))fail('invalid_configuration');return url.href;
}
export function normalizeMenuURL(value:unknown):string {
  const {url}=urlBase(value,1000),host=url.hostname.toLowerCase();
  if(host==='localhost'||/\.(?:localhost|local|internal)$/.test(host))fail('invalid_configuration');
  const version=isIP(host);
  if(version===4){const [a,b,c]=host.split('.').map(Number);if(a===0||a===10||a===127||a>=224||(a===169&&b===254)||(a===172&&b>=16&&b<=31)||(a===192&&(b===168||(b===0&&[0,2].includes(c))))||(a===100&&b>=64&&b<=127)||(a===198&&(b===18||b===19||(b===51&&c===100)))||(a===203&&b===0&&c===113))fail('invalid_configuration');}
  else if(version===6||!/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z](?:[a-z0-9-]{0,61}[a-z0-9])$/i.test(host))fail('invalid_configuration');return url.href;
}
export function normalizeInstagramURL(value:unknown):string {
  const raw=exactString(value,250,'invalid_configuration');if(!/^https:\/\/(?:www\.)?instagram\.com\/[A-Za-z0-9._]{1,30}\/?$/i.test(raw))fail('invalid_configuration');
  const handle=raw.split('/')[3].toLowerCase();if(handle.startsWith('.')||handle.endsWith('.')||handle.includes('..')||['p','reel','reels','stories','explore','accounts','direct','about','legal','developer','developers','web','api','challenge','oauth','tv'].includes(handle))fail('invalid_configuration');return 'https://www.instagram.com/'+handle+'/';
}
function config(value:unknown,entry:CatalogEntry,kind:RequestKind):Configuration {
  if(entry.entryId==='nfc-menu-card'){
    const consultation=kind==='menu_consultation',physical=kind==='physical_order';
    const c=object(value,consultation?['menuStatus','notes']:physical?['intent','menuStatus','menuUrl','notes']:['menuStatus','menuUrl','notes'],physical?['intent','menuStatus']:['menuStatus']);
    if(typeof c.menuStatus!=='string'||!['existing','needs_development'].includes(c.menuStatus)||(physical&&c.intent!=='card_order')||(consultation&&c.menuStatus!=='needs_development'))fail('invalid_configuration');
    if(c.menuStatus==='needs_development'&&own(c,'menuUrl'))fail('invalid_configuration');
    if(c.menuStatus==='existing'&&!own(c,'menuUrl'))fail('invalid_configuration');
    const notes=text(c.notes,1000,true,true);return {...(physical?{intent:'card_order' as const}:{}),menuStatus:c.menuStatus as 'existing'|'needs_development',...(c.menuStatus==='existing'?{menuUrl:normalizeMenuURL(c.menuUrl)}:{}),...(notes?{notes}:{})};
  }
  const instagram=entry.entryId==='nfc-instagram-card',branded=entry.designMode==='branded';
  const allowed=['notes',instagram?'instagramUrl':'googleLocationUrl',...(branded?['designSplitNote','brandInputs']:[])];
  const c=object(value,allowed,instagram?['instagramUrl']:[]);const out:Configuration={};
  if(own(c,'googleLocationUrl'))out.googleLocationUrl=normalizeGoogleURL(c.googleLocationUrl);
  if(instagram)out.instagramUrl=normalizeInstagramURL(c.instagramUrl);
  const notes=text(c.notes,entry.entryId==='review-card-3d'?1000:2000,true,true);if(notes)out.notes=notes;
  if(branded){const split=text(c.designSplitNote,300,true,true);if(split)out.designSplitNote=split;
    if(own(c,'brandInputs')){const b=object(c.brandInputs,['logoNote','websiteOrInstagram','styleNote']),bi:NonNullable<Configuration['brandInputs']>={};for(const k of ['logoNote','websiteOrInstagram','styleNote']as const){const s=text(b[k],300,true,true);if(s)bi[k]=s;}if(Object.keys(bi).length)out.brandInputs=bi;}}
  return out;
}
function normalizeContact(value:unknown,hasInstagram:boolean):Contact {
  const c=object(value,['preferredMethod','phone','email','telegram'],['preferredMethod']);if(typeof c.preferredMethod!=='string'||!['phone','email','telegram','whatsapp','viber'].includes(c.preferredMethod))fail('contact_required');
  const out:Contact={preferredMethod:c.preferredMethod as Contact['preferredMethod']};
  if(own(c,'phone')){const p=exactString(c.phone,16);if(!/^\+[1-9][0-9]{6,14}$/.test(p))fail('contact_required');out.phone=p;}
  if(own(c,'email')){const e=exactString(c.email,254);if(!/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$/.test(e))fail('contact_required');out.email=e.toLowerCase();}
  if(own(c,'telegram')){const t=exactString(c.telegram,33);if(!/^@?[A-Za-z][A-Za-z0-9_]{4,31}$/.test(t))fail('contact_required');out.telegram='@'+t.replace(/^@/,'');}
  if(!out.phone&&!out.email&&!out.telegram)fail('contact_required');
  if((out.preferredMethod==='email'&&!out.email)||(['phone','whatsapp','viber'].includes(out.preferredMethod)&&!out.phone)||(out.preferredMethod==='telegram'&&!out.phone&&!out.telegram)||(hasInstagram&&(!out.phone||!['telegram','whatsapp','viber'].includes(out.preferredMethod))))fail('contact_required');return out;
}
/** Guard object callers too: getters/cycles/undefined/prototype keys and oversized data fail. */
function assertJSON(value:unknown,depth=1,seen=new Set<object>()):void {
  if(depth>LIMITS.depth)fail('nesting_limit',413);
  if(value===null||typeof value==='boolean')return;
  if(typeof value==='string'){if(!unicodeOK(value))fail('invalid_encoding',400);return;}
  if(typeof value==='number'){if(!Number.isSafeInteger(value)||value<0||Object.is(value,-0))fail('invalid_number_token',400);return;}
  if(!value||typeof value!=='object'||seen.has(value))fail();seen.add(value);
  if(Object.getOwnPropertySymbols(value).length)fail();
  if(Array.isArray(value)){if(Object.getPrototypeOf(value)!==Array.prototype)fail();const descriptors=Object.getOwnPropertyDescriptors(value);if(Object.keys(descriptors).some(k=>k!=='length'&&(!/^(?:0|[1-9][0-9]*)$/.test(k)||Number(k)>=value.length)))fail();for(let i=0;i<value.length;i++){const d=descriptors[String(i)];if(!d||!('value'in d)||!d.enumerable)fail();assertJSON(d.value,depth+1,seen);}}
  else {if(![Object.prototype,null].includes(Object.getPrototypeOf(value)))fail();for(const [k,d]of Object.entries(Object.getOwnPropertyDescriptors(value))){if(!d.enumerable||!('value'in d)||['__proto__','constructor','prototype'].includes(k))fail();assertJSON(d.value,depth+1,seen);}}
  seen.delete(value);
}
export function normalizeRequest(value:unknown,options:{consentProfile?:ConsentProfile}={}):NormalizedRequest {
  const consentProfile=options.consentProfile??SYNTHETIC_PROFILE;if(!validConsentProfile(consentProfile))fail();
  assertJSON(value);if(Buffer.byteLength(JSON.stringify(value),'utf8')>LIMITS.requestBytes)fail('request_too_large',413);
  const r=object(value,['schemaVersion','kind','language','sourcePage','customerName','contact','lines','consent','utm','serviceContext','serviceNotes','website','challenge'],['schemaVersion','kind','language','sourcePage','customerName','contact','lines','consent','website','challenge']);
  if(r.schemaVersion!==2||typeof r.kind!=='string'||!['physical_order','free_design_concepts','quantity_advice','menu_consultation'].includes(r.kind)||typeof r.language!=='string'||!['uk','en','pl'].includes(r.language)||r.website!=='')fail();
  const challenge=exactString(r.challenge,800);if(!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{43}$/.test(challenge))fail('invalid_challenge');
  const kind=r.kind as RequestKind,language=r.language as NormalizedRequest['language'],market:Market=language==='pl'?'PL':'UA';
  const consent=object(r.consent,['requestProcessing','formVersion','privacyNoticeVersion'],['requestProcessing','formVersion','privacyNoticeVersion']);
  if(consent.requestProcessing!==true||consent.formVersion!==consentProfile.formVersion||consent.privacyNoticeVersion!==consentProfile.privacyNoticeVersion)fail();
  if(!Array.isArray(r.lines)||r.lines.length>LIMITS.lines)fail('quantity_limit');
  if((kind==='physical_order'&&!r.lines.length)||(kind!=='physical_order'&&r.lines.length)||(kind==='physical_order'&&own(r,'serviceContext')))fail('invalid_configuration');
  const ids=new Set<string>(),lines:NormalizedLine[]=[];
  for(const raw of r.lines){const l=object(raw,['lineId','entryId','productId','offerId','quantity','configuration','variantId'],['lineId','entryId','productId','offerId','quantity','configuration']);const entry=identity(l);
    if(typeof l.lineId!=='string'||!UUID_V4.test(l.lineId)||ids.has(l.lineId))fail('invalid_id');ids.add(l.lineId);
    if(entry.entryId==='nfc-menu-card'){if(typeof l.variantId!=='string'||!MENU_VARIANTS.includes(l.variantId))fail('invalid_configuration');}else if(own(l,'variantId'))fail('invalid_configuration');
    lines.push({lineId:l.lineId,entryId:entry.entryId,productId:entry.productId,offerId:entry.offerId,quantity:quantity(l.quantity),configuration:config(l.configuration,entry,'physical_order'),...(entry.entryId==='nfc-menu-card'?{variantId:l.variantId as string}:{}),niche:entry.niche,designMode:entry.designMode});}
  if(lines.reduce((s,l)=>s+l.quantity,0)>LIMITS.aggregateQuantity||lines.filter(l=>l.entryId==='nfc-instagram-card').reduce((s,l)=>s+l.quantity,0)>2)fail('quantity_limit');
  lines.sort((a,b)=>a.lineId<b.lineId?-1:a.lineId>b.lineId?1:0);
  let serviceContext:ServiceContext|null=null;
  if(own(r,'serviceContext')){const c=object(r.serviceContext,['entryId','productId','offerId','intent','configuration'],['entryId','productId','offerId','intent','configuration']);const entry=identity(c);
    if(c.intent!==kind||kind==='physical_order'||(kind==='free_design_concepts'&&entry.designMode!=='branded')||(kind==='menu_consultation'&&entry.entryId!=='nfc-menu-card'))fail('invalid_configuration');
    serviceContext={entryId:entry.entryId,productId:entry.productId,offerId:entry.offerId,intent:kind,configuration:config(c.configuration,entry,kind),niche:entry.niche,designMode:entry.designMode};}
  if(['free_design_concepts','menu_consultation'].includes(kind)&&!serviceContext)fail('invalid_configuration');
  const utm:Record<string,string>={};if(own(r,'utm')){const u=object(r.utm,['source','medium','campaign','term','content']);for(const k of ['source','medium','campaign','term','content']){const s=text(u[k],100,true);if(s)utm[k]=s;}}
  return {schemaVersion:2,kind,language,sourcePage:normalizeSourcePage(r.sourcePage,language),customerName:text(r.customerName,100,false,false,2)!,contact:normalizeContact(r.contact,lines.some(l=>l.entryId==='nfc-instagram-card')),lines,consent:{requestProcessing:true,formVersion:consentProfile.formVersion,privacyNoticeVersion:consentProfile.privacyNoticeVersion},normalizationProfile:NORMALIZATION_PROFILE,source:'NFC_CARD',market,currency:market==='PL'?'PLN':'UAH',utm,serviceNotes:text(r.serviceNotes,2000,true,true)??null,serviceContext};
}
/** Minimal recursive JSON reader: detects duplicate decoded keys and numeric token forms before JSON.parse can erase them. */
export function parseWire(input:string|Uint8Array,options:{consentProfile?:ConsentProfile}={}):NormalizedRequest {
  if(typeof input!=='string'&&!(input instanceof Uint8Array))fail('invalid_encoding',400);
  const bytes=typeof input==='string'?Buffer.from(input,'utf8'):input;if(bytes.length>LIMITS.requestBytes)fail('request_too_large',413);
  if(typeof input==='string'&&!unicodeOK(input))fail('invalid_encoding',400);
  if(bytes[0]===0xef&&bytes[1]===0xbb&&bytes[2]===0xbf)fail('invalid_encoding',400);
  let s:string;try{s=new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(bytes);}catch{fail('invalid_encoding',400);}
  let i=0;const ws=()=>{while(/[\x20\t\r\n]/.test(s[i]??'')&&i<s.length)i++;};
  function str():string {const start=i++;let escaped=false;while(i<s.length){const c=s[i++];if(c==='"'&&!escaped){try{const value=JSON.parse(s.slice(start,i));if(!unicodeOK(value))fail('invalid_encoding',400);return value;}catch(e){if(e instanceof NfcV2Error)throw e;fail('malformed_json',400);}}if(c==='\\'&&!escaped)escaped=true;else escaped=false;}fail('malformed_json',400);}
  function read(depth:number):unknown {if(depth>LIMITS.depth)fail('nesting_limit',413);ws();const c=s[i];
    if(c==='"')return str();
    if(c==='{'){i++;ws();const o:Obj=Object.create(null),keys=new Set<string>();if(s[i]==='}'){i++;return o;}while(i<s.length){ws();if(s[i]!=='"')fail('malformed_json',400);const key=str();if(keys.has(key))fail('duplicate_json_key',400);if(['__proto__','constructor','prototype'].includes(key))fail();keys.add(key);ws();if(s[i++]!==':')fail('malformed_json',400);o[key]=read(depth+1);ws();const next=s[i++];if(next==='}')return o;if(next!==',')fail('malformed_json',400);}fail('malformed_json',400);}
    if(c==='['){i++;ws();const a:unknown[]=[];if(s[i]===']'){i++;return a;}while(i<s.length){a.push(read(depth+1));ws();const next=s[i++];if(next===']')return a;if(next!==',')fail('malformed_json',400);}fail('malformed_json',400);}
    for(const [token,val]of [['true',true],['false',false],['null',null]]as const)if(s.startsWith(token,i)){i+=token.length;return val;}
    const start=i;while(i<s.length&&!/[\x20\t\r\n,}\]]/.test(s[i]))i++;const token=s.slice(start,i);
    if(!/^(?:0|[1-9][0-9]*)$/.test(token)){if(/^[-+0-9.]|^(?:NaN|Infinity)/.test(token))fail('invalid_number_token',400);fail('malformed_json',400);}const n=Number(token);if(!Number.isSafeInteger(n))fail('invalid_number_token',400);return n;}
  const result=read(1);ws();if(i!==s.length)fail('malformed_json',400);return normalizeRequest(result,options);
}
function canonicalString(value:string):string {
  return '"'+value.replace(/[\u0000-\u001f"\\]/g,c=>c==='"'?'\\"':c==='\\'?'\\\\':c==='\n'?'\\n':'\\u'+c.charCodeAt(0).toString(16).padStart(4,'0'))+'"';
}
export function canonicalJSON(value:unknown):string {
  assertJSON(value);
  function serialize(v:unknown):string {
    if(v===null)return 'null';if(typeof v==='string')return canonicalString(v);if(typeof v==='boolean'||typeof v==='number')return String(v);
    if(Array.isArray(v))return '['+v.map(serialize).join(',')+']';
    if(v&&typeof v==='object')return '{'+Object.keys(v).sort().map(k=>canonicalString(k)+':'+serialize((v as Obj)[k])).join(',')+'}';fail();
  }
  return serialize(value);
}
function normalizedWire(n:NormalizedRequest):unknown {
  const {normalizationProfile,source,market,currency,utm,serviceNotes,serviceContext,...r}=n;
  return {...r,lines:n.lines.map(({niche,designMode,...line})=>line),utm,...(serviceNotes===null?{}:{serviceNotes}),...(serviceContext===null?{}:{serviceContext:(({niche,designMode,...c})=>c)(serviceContext)}),website:'',challenge:'SYNTHETIC.'+'A'.repeat(43)};
}
function assertNormalized(n:NormalizedRequest):void {
  assertJSON(n);let rebuilt:NormalizedRequest;try{rebuilt=normalizeRequest(normalizedWire(n),{consentProfile:n.consent});}catch{fail();}
  if(!isDeepStrictEqual(n,rebuilt))fail();
}
export function requestDigest(normalized:NormalizedRequest):string {assertNormalized(normalized);return createHash('sha256').update('NFC_CARD\0v2\0'+DIGEST_PROFILE+'\0','utf8').update(canonicalJSON(normalized),'utf8').digest('hex');}
const DEFAULT_QUOTE_ID='00000000-0000-4000-8000-000000000000';
export function quoteRequest(n:NormalizedRequest,options:{quoteId?:string;pricingRevision?:string}={}):Quote {
  assertNormalized(n);const quoteId=options.quoteId??DEFAULT_QUOTE_ID;if(!UUID_V4.test(quoteId))fail();
  const revision=options.pricingRevision===undefined?pricingRevision(n.market):options.pricingRevision;let sources:readonly string[];try{sources=pricingProfile(n.market,revision).sourcePriceRevisions;}catch{fail();}
  const service=n.kind!=='physical_order',groups:PriceGroup[]=[];
  for(const entryId of [...new Set(n.lines.map(l=>l.entryId))].sort()){const ls=n.lines.filter(l=>l.entryId===entryId),quantity=ls.reduce((s,l)=>s+l.quantity,0),price=groupPrice(entryId,quantity,n.market,revision);groups.push({groupId:n.market+':'+entryId,entryId,lineIds:ls.map(l=>l.lineId).sort(),quantity,pricingState:price.amountMinor===null?'individual_quote':'fixed',...price,pricingRevision:revision});}
  const fixed=groups.filter(g=>g.amountMinor!==null),unknown=groups.some(g=>g.amountMinor===null),knownSubtotalMinor=fixed.length?fixed.reduce((s,g)=>s+g.amountMinor!,0):null;
  const completeness=service?'consultation':unknown?(fixed.length?'partial':'quote_required'):'complete';const totalMinor=completeness==='complete'?knownSubtotalMinor:null;
  const development=n.kind==='menu_consultation'||n.lines.some(l=>l.entryId==='nfc-menu-card'&&l.configuration.menuStatus==='needs_development');
  return {quoteId,pricingRevision:revision,sourcePriceRevisions:[...sources],market:n.market,currency:n.currency,completeness,physicalQuantity:service?null:n.lines.reduce((s,l)=>s+l.quantity,0),groups,knownSubtotalMinor,totalMinor,grandTotalMinor:!service&&n.market==='UA'&&!development?totalMinor:null,paymentRequired:false,dueNowMinor:null,
    depositPolicy:{state:service?'not_applicable':completeness==='complete'?'after_agreement':'owner_policy_pending',amountMinor:!service&&completeness==='complete'?(n.market==='PL'?2000:20000):null,frequency:service?'not_applicable':'once_per_physical_order',includedInProductTotal:service?false:completeness==='complete'?true:null},
    delivery:{state:service?'not_applicable':n.market==='PL'?'to_be_agreed':'included_ua_standard',originCountry:'UA',destinationMarket:service?null:n.market,method:!service&&n.market==='UA'?'nova_poshta_standard':null,customerPays:service?null:n.market==='PL',amountMinor:!service&&n.market==='UA'?0:null,agreedBeforeDeposit:!service},extras:{menuDevelopment:development?'separately_agreed_not_included':'not_applicable'}};
}
export function buildReceipt(n:NormalizedRequest,options:{requestId:string;acceptedAt:string;quoteId:string;notificationStatus?:'disabled'|'queued';pricingRevision?:string}):Receipt {
  assertNormalized(n);if(!UUID_V4.test(options.requestId)||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(options.acceptedAt)||!Number.isFinite(Date.parse(options.acceptedAt))||new Date(options.acceptedAt).toISOString()!==options.acceptedAt||!['disabled','queued'].includes(options.notificationStatus??'disabled'))fail();
  const receipt:Receipt={schemaVersion:2,source:'NFC_CARD',requestId:options.requestId,acceptedAt:options.acceptedAt,durableSaved:true,acceptedRequest:structuredClone(n),requestDigest:{profile:DIGEST_PROFILE,sha256:requestDigest(n)},quote:quoteRequest(n,{quoteId:options.quoteId,pricingRevision:options.pricingRevision}),notificationStatus:options.notificationStatus??'disabled'};
  if(Buffer.byteLength(JSON.stringify(receipt),'utf8')>LIMITS.receiptBytes)fail('request_too_large',413);return receipt;
}
export function validateReceipt(n:NormalizedRequest,value:unknown):boolean {
  try{assertJSON(value);if(!value||typeof value!=='object'||Buffer.byteLength(JSON.stringify(value),'utf8')>LIMITS.receiptBytes)return false;const r=value as Receipt;
    const expected=buildReceipt(n,{requestId:r.requestId,acceptedAt:r.acceptedAt,quoteId:r.quote?.quoteId,notificationStatus:r.notificationStatus,pricingRevision:r.quote?.pricingRevision});return isDeepStrictEqual(r,expected);
  }catch{return false;}
}
export const ERROR_STATUSES:Readonly<Record<string,number>>=Object.freeze({
  malformed_json:400,invalid_encoding:400,duplicate_json_key:400,invalid_number_token:400,request_too_large:413,nesting_limit:413,
  invalid_payload:422,invalid_id:422,invalid_configuration:422,invalid_source_locale:422,contact_required:422,quantity_limit:422,offer_unavailable:422,invalid_challenge:422,expired_or_early_challenge:422,
  idempotency_conflict:409,request_in_progress:409,idempotency_tombstoned:410,rate_limited:429,unavailable:503,outcome_unknown:503,idempotency_profile_unavailable:503,notice_policy_not_approved:503,crm_contract_not_approved:503,
});
const retryableCode=(code:string)=>['invalid_challenge','expired_or_early_challenge','rate_limited','request_in_progress','unavailable','outcome_unknown'].includes(code);
export function errorEnvelope(error:unknown):{ok:false;schemaVersion:2;code:string;retryable:boolean} {
  const code=error instanceof NfcV2Error&&own(ERROR_STATUSES,error.code)&&ERROR_STATUSES[error.code]===error.status?error.code:'unavailable';
  return {ok:false,schemaVersion:2,code,retryable:retryableCode(code)};
}
export function validateErrorEnvelope(value:unknown):boolean {
  try{assertJSON(value);const v=object(value,['ok','schemaVersion','code','retryable','errors'],['ok','schemaVersion','code','retryable']);if(v.ok!==false||v.schemaVersion!==2||typeof v.code!=='string'||!own(ERROR_STATUSES,v.code)||v.retryable!==retryableCode(v.code))return false;
    if(own(v,'errors')){if(!Array.isArray(v.errors)||v.errors.length<1||v.errors.length>20)return false;for(const raw of v.errors){const e=object(raw,['path','code'],['path','code']);for(const [key,max]of [['path',200],['code',80]]as const){if(typeof e[key]!=='string'||!e[key]||scalarLength(e[key] as string)>max||/[\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069]/u.test(e[key] as string))return false;}}}return true;
  }catch{return false;}
}
