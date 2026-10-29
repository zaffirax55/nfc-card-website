// Mini pricing is separate from the original Review Card range and from each niche.
export const MINI_PRODUCTS = Object.freeze({
  'beauty-review-card': {niche:'beauty',designMode:'ready'},
  'branded-beauty-review-card': {niche:'beauty',designMode:'branded'},
  'restaurant-review-card': {niche:'restaurant',designMode:'ready'},
  'branded-restaurant-review-card': {niche:'restaurant',designMode:'branded'}
});
export const MINI_QUANTITIES = Object.freeze([1,2]);
const FIXED_TOTALS = Object.freeze({
  'beauty-review-card':Object.freeze({1:800,2:1400}),
  'branded-beauty-review-card':Object.freeze({1:800,2:1600})
});
export function miniQuote(solutionId, quantity, locale='uk', mode='physical_order') {
  const product=MINI_PRODUCTS[solutionId];
  if(!product || !['uk','en','pl'].includes(locale))throw Error('invalid_mini_selection');
  const active=['physical_order','free_design_concepts','quantity_advice'].includes(mode);
  if(!active || (mode==='free_design_concepts'&&product.designMode!=='branded'))throw Error('invalid_mini_request');
  const number=Number(quantity);
  if(mode==='physical_order'&&(!Number.isSafeInteger(number)||number<1||number>10000))throw Error('invalid_mini_quantity');
  const total=mode==='physical_order'&&locale!=='pl'?FIXED_TOTALS[solutionId]?.[number]:undefined;
  const fixed=Number.isFinite(total);
  const unitPrice=fixed?total/number:null;
  return {productFamily:'nfc-review-card-mini',solutionId,niche:product.niche,designMode:product.designMode,
    quantity:mode==='physical_order'?number:null,quantityMode:mode==='physical_order'?(fixed?'fixed_bundle':'custom_quote'):mode,
    unitPrice,amount:fixed?total:null,currency:locale==='pl'?'PLN':'UAH',
    deposit:fixed?200:null,depositDueNow:false,pricingRevision:'NFC-CARD-CONTENT-TRUTH-PRICE-v33'};
}
