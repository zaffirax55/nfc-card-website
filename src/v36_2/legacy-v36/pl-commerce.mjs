// The owner-approved PL contract is shared by the static build and the gateway.
// These calculators are display helpers; the gateway always recalculates a lead.
export function validatePolandCommerce(contract) {
  const p = contract?.products;
  if (contract?.contractId !== 'NFC-CARD-PL-2026-09-v28' || contract?.locale !== 'pl' ||
      contract?.market !== 'PL' || contract?.currency !== 'PLN' ||
      contract?.deposit?.amount !== 20 || contract?.deposit?.includedInProductTotal !== true ||
      JSON.stringify(p?.['review-card']?.fixedPrices) !== '{"1":129,"2":219}' ||
      JSON.stringify(p?.['branded-review-card']?.fixedPrices) !== '{"1":169,"2":299}' ||
      JSON.stringify(p?.['nfc-instagram-card']?.fixedPrices) !== '{"1":129,"2":219}' ||
      p?.['review-card-3d']?.unitPrice !== 349 ||
      JSON.stringify(p?.['nfc-menu-card']?.tiers) !== JSON.stringify([
        {min:1,max:4,unitPrice:89},{min:5,max:9,unitPrice:69},
        {min:10,max:24,unitPrice:55},{min:25,max:null,unitPrice:45}
      ])) throw Error('invalid_poland_commerce_configuration');
  return contract;
}

const fixedKeys = Object.freeze({standard:'review-card',branded:'branded-review-card',instagram:'nfc-instagram-card'});
export function plFixedQuote(contract, selection, quantity) {
  const market = validatePolandCommerce(contract), key = fixedKeys[selection], q = String(quantity);
  const valid = (key && ['1','2','more'].includes(q)) ||
    (['bulk','consultation'].includes(selection) && ['1','2','more'].includes(q));
  const amount = valid && key && q !== 'more' ? market.products[key].fixedPrices[q] : null;
  return {valid, amount, deposit:valid ? market.deposit.amount : null,
    balance:amount === null ? null : amount-market.deposit.amount,
    currency:market.currency, pricingRevision:market.contractId};
}

export function plReview3dQuote(contract, quantity) {
  const market = validatePolandCommerce(contract);
  const valid = Number.isSafeInteger(quantity) && quantity >= 1 && quantity <= 10000;
  const unitPrice = market.products['review-card-3d'].unitPrice;
  const amount = valid ? quantity*unitPrice : null;
  return {valid, quantity, unitPrice, amount,
    deposit:valid?market.deposit.amount:null,
    balance:valid?amount-market.deposit.amount:null,
    currency:market.currency, pricingRevision:market.contractId};
}

export function plMenuQuote(contract, quantity) {
  const market = validatePolandCommerce(contract);
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 10000) throw Error('invalid_menu_rows');
  const tier = market.products['nfc-menu-card'].tiers.find(row=>quantity>=row.min && (row.max===null || quantity<=row.max));
  const amount = quantity*tier.unitPrice;
  return {quantity,unitPrice:tier.unitPrice,amount,deposit:market.deposit.amount,
    balance:amount-market.deposit.amount,currency:market.currency,pricingRevision:market.contractId};
}
