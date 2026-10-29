/** CF-01 identity and retained pricing profiles, plus explicit owner UA pair amendment. No I/O. */
export const CONTRACT_ID = 'NFC-CARD-V35-P4-02-CF-01' as const;
export const CORE_SHA256 = '1d347dbb26ee1f09b303eea0bb33a1b27a93131d6361acef720690ac23119f24' as const;
export const NORMALIZATION_PROFILE = 'NFC-V35-NORM-1' as const;
export const DIGEST_PROFILE = 'NFC-V35-CJSON-1' as const;
export type Market = 'UA' | 'PL';
export type Currency = 'UAH' | 'PLN';
export type DesignMode = 'ready' | 'branded' | 'fixed_shown_design';
export type Niche = 'beauty' | 'restaurant' | null;
export type CatalogEntry = Readonly<{ entryId: string; productId: string; offerId: string; niche: Niche; designMode: DesignMode }>;
function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object') { for (const item of Object.values(value)) deepFreeze(item); Object.freeze(value); }
  return value;
}
export const ACTIVE_ENTRIES = deepFreeze<CatalogEntry[]>([
  {entryId:'review-card',productId:'nfc-review-card',offerId:'standard',niche:null,designMode:'ready'},
  {entryId:'branded-review-card',productId:'nfc-review-card',offerId:'branded',niche:null,designMode:'branded'},
  {entryId:'nfc-instagram-card',productId:'nfc-instagram-card',offerId:'ready',niche:null,designMode:'ready'},
  {entryId:'nfc-menu-card',productId:'nfc-menu-card',offerId:'ready',niche:null,designMode:'ready'},
  {entryId:'review-card-3d',productId:'nfc-review-card-3d',offerId:'fixed_shown_design',niche:null,designMode:'fixed_shown_design'},
  {entryId:'beauty-review-card',productId:'nfc-review-card-mini',offerId:'ready',niche:'beauty',designMode:'ready'},
  {entryId:'branded-beauty-review-card',productId:'nfc-review-card-mini',offerId:'branded',niche:'beauty',designMode:'branded'},
  {entryId:'restaurant-review-card',productId:'nfc-review-card-mini',offerId:'ready',niche:'restaurant',designMode:'ready'},
  {entryId:'branded-restaurant-review-card',productId:'nfc-review-card-mini',offerId:'branded',niche:'restaurant',designMode:'branded'},
]);
export const DRAFT_ENTRIES = Object.freeze(['universal-ready-mini','universal-branded-mini']);
export const MENU_VARIANTS = Object.freeze(['square_100_black','square_100_white','square_60_black','square_60_white','round_70_black','round_70_white']);
export const LIMITS = Object.freeze({ requestBytes:16384, lines:20, aggregateQuantity:10000, depth:12, receiptBytes:131072 });
export const SOURCE_PRICE_REVISIONS = deepFreeze({ UA:['NFC-CARD-CONTENT-TRUTH-PRICE-v33','NFC-INSTAGRAM-UA-2026-09-v18','NFC-MENU-UA-2026-09-v23','NFC-REVIEW-3D-UA-2026-09-v26'], PL:['NFC-CARD-PL-2026-09-v28'] });
const BUNDLES: Readonly<Record<string, Partial<Record<Market, readonly number[]>>>> = deepFreeze({
  'review-card':{UA:[150000,260000],PL:[12900,21900]},
  'branded-review-card':{UA:[200000,260000],PL:[16900,29900]},
  'nfc-instagram-card':{UA:[150000,260000],PL:[12900,21900]},
  'beauty-review-card':{UA:[80000,140000]},
  'branded-beauty-review-card':{UA:[80000,160000]},
});
export function getEntry(entryId: string): CatalogEntry | undefined { return ACTIVE_ENTRIES.find(entry=>entry.entryId===entryId); }
export const OWNER_UA_PRICING_REVISION = 'NFC-V35-V2-OWNER-20261027-UA' as const;
export const OWNER_UA_SOURCE_REVISION = 'NFC-CARD-BRANDED-PAIR-OWNER-20261026' as const;
type PricingProfile = Readonly<{revision:string;market:Market;sourcePriceRevisions:readonly string[];brandedUaPairMinor:number|null}>;
const PRICING_PROFILES:Readonly<Record<string,PricingProfile>> = deepFreeze({
  'NFC-V35-V2-CANDIDATE-01-UA':{revision:'NFC-V35-V2-CANDIDATE-01-UA',market:'UA',sourcePriceRevisions:SOURCE_PRICE_REVISIONS.UA,brandedUaPairMinor:260000},
  [OWNER_UA_PRICING_REVISION]:{revision:OWNER_UA_PRICING_REVISION,market:'UA',sourcePriceRevisions:[...SOURCE_PRICE_REVISIONS.UA,OWNER_UA_SOURCE_REVISION],brandedUaPairMinor:360000},
  'NFC-V35-V2-CANDIDATE-01-PL':{revision:'NFC-V35-V2-CANDIDATE-01-PL',market:'PL',sourcePriceRevisions:SOURCE_PRICE_REVISIONS.PL,brandedUaPairMinor:null},
});
export function pricingRevision(market: Market): string {
  if(market==='UA')return OWNER_UA_PRICING_REVISION;
  if(market==='PL')return 'NFC-V35-V2-CANDIDATE-01-PL';
  throw new RangeError('Invalid pricing market');
}
export function pricingProfile(market:Market,revision:string=pricingRevision(market)):PricingProfile {
  if(typeof revision!=='string'||!Object.hasOwn(PRICING_PROFILES,revision)||PRICING_PROFILES[revision].market!==market)throw new RangeError('Unknown pricing profile for market');
  return PRICING_PROFILES[revision];
}
export function groupPrice(entryId: string, quantity: number, market: Market, revision:string=pricingRevision(market)): {amountMinor:number|null;unitAmountMinor:number|null} {
  if (!getEntry(entryId) || !Number.isSafeInteger(quantity) || quantity<1 || quantity>LIMITS.aggregateQuantity || !['UA','PL'].includes(market)) throw new RangeError('Invalid pricing group');
  if (entryId==='nfc-instagram-card' && quantity>2) throw new RangeError('Instagram quantity exceeds approved offer');
  const profile=pricingProfile(market,revision);
  let unitAmountMinor:number|null=null,amountMinor:number|null=null;
  if (entryId==='nfc-menu-card') { const tier=quantity>=25?3:quantity>=10?2:quantity>=5?1:0; unitAmountMinor=(market==='PL'?[8900,6900,5500,4500]:[100000,75000,60000,50000])[tier]; amountMinor=unitAmountMinor*quantity; }
  else if (entryId==='review-card-3d') { unitAmountMinor=market==='PL'?34900:400000; amountMinor=unitAmountMinor*quantity; }
  else if (quantity<=2) amountMinor=BUNDLES[entryId]?.[market]?.[quantity-1]??null;
  if(entryId==='branded-review-card'&&market==='UA'&&quantity===2)amountMinor=profile.brandedUaPairMinor;
  return {amountMinor,unitAmountMinor};
}
