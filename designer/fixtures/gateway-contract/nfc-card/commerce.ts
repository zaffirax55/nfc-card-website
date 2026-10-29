import { NfcError, object, type NfcLead } from './contract.ts';
import polandContract from './poland-commerce.json' with { type: 'json' };
import miniContract from './mini-price-contract.json' with { type: 'json' };

export type Selection = { variant: 'standard' | 'branded' | 'bulk' | 'consultation' | 'instagram'; quantity: '1' | '2' | '4' | '10' | 'more' | 'other' | 'advice' | 'concepts' };
export type Quote = { currency: 'UAH'; status: 'fixed' | 'custom'; amount: number | null; deposit: 200; depositIncluded: true } |
  { currency: 'UAH' | 'PLN'; status: 'fixed' | 'custom' | 'consultation'; quantity: number | null;
    unitPrice: number | null; amount: number | null; deposit: number | null; balance: number | null;
    depositIncluded: boolean; depositDueNow: false; contractId: 'NFC-CARD-CONTENT-TRUTH-PRICE-v33' } |
  { currency: 'UAH' | 'PLN'; status: 'consultation'; amount: null; deposit: null; depositIncluded: false; balance?: null; amountMinor?: null; depositMinor?: null; balanceMinor?: null } |
  { currency: 'UAH'; status: 'fixed' | 'consultation'; quantity: number; unitPrice: number | null; amount: number | null;
    deposit: 200 | null; balance: number | null; unitPriceKopecks: number | null; amountKopecks: number | null;
    depositKopecks: number | null; balanceKopecks: number | null; depositIncluded: boolean } |
  { currency: 'PLN'; status: 'fixed' | 'custom'; amount: number | null; deposit: number; balance: number | null;
    amountMinor: number | null; depositMinor: number; balanceMinor: number | null; depositIncluded: true } |
  { currency: 'PLN'; status: 'fixed' | 'consultation'; quantity: number; unitPrice: number | null; amount: number | null;
    deposit: number | null; balance: number | null; unitPriceMinor: number | null; amountMinor: number | null;
    depositMinor: number | null; balanceMinor: number | null; depositIncluded: boolean };
// Accepted Review prices v11 and Instagram ready offer v18: totals include the deposit.
const prices = { 'review-card': { 1: 1500, 2: 2600 }, 'branded-review-card': { 1: 2000, 2: 3600 }, 'nfc-instagram-card': { 1: 1500, 2: 2600 } };
export const POLAND_CONTRACT_ID = polandContract.contractId;
const polishCurrency = polandContract.currency as 'PLN';
const polishMinorFactor = 10 ** polandContract.minorUnitDigits;
const polishDeposit = polandContract.deposit.amount;
const polishPairPrices = {
  'review-card': polandContract.products['review-card'].fixedPrices,
  'branded-review-card': polandContract.products['branded-review-card'].fixedPrices,
  'nfc-instagram-card': polandContract.products['nfc-instagram-card'].fixedPrices,
};
export const MINI_CONTRACT_ID = miniContract.contractId as 'NFC-CARD-CONTENT-TRUTH-PRICE-v33';
function quoteMini(lead: NfcLead): Quote {
  if (lead.product !== 'nfc-review-card-mini' || lead.solution?.schemaVersion !== 2) throw new NfcError(422, 'invalid_mini');
  const context = lead.solution, currency = lead.language === 'pl' ? 'PLN' : 'UAH';
  const base = { currency, quantity: lead.quantity || null, unitPrice: null, amount: null, deposit: null, balance: null,
    depositIncluded: false, depositDueNow: false, contractId: MINI_CONTRACT_ID } as const;
  if (context.quantity_mode === 'advice' || context.quantity_mode === 'free_design_concepts') return { ...base, status: 'consultation' };
  if (context.quantity_mode === 'custom_quote' || lead.language === 'pl' || context.niche === 'restaurant' || ![1, 2].includes(lead.quantity))
    return { ...base, status: 'custom' };
  const bundles = context.design_mode === 'ready' ? miniContract.UA.beautyReadyMini.bundles : miniContract.UA.brandedBeautyMini.bundles;
  const bundle = bundles[String(lead.quantity) as keyof typeof bundles];
  if (!bundle) throw new NfcError(422, 'invalid_mini_quantity');
  const deposit = miniContract.UA.deposit.amount;
  return { ...base, status: 'fixed', quantity: lead.quantity, unitPrice: bundle.unitPrice, amount: bundle.total,
    deposit, balance: bundle.total - deposit, depositIncluded: true };
}
function polishDetailed(quantity: number, unitPrice: number | null): Quote {
  if (unitPrice === null) return { currency: polishCurrency, status: 'consultation', quantity: 0, unitPrice: null,
    amount: null, deposit: null, balance: null, unitPriceMinor: null, amountMinor: null,
    depositMinor: null, balanceMinor: null, depositIncluded: false };
  const amount = quantity * unitPrice, balance = amount - polishDeposit;
  return { currency: polishCurrency, status: 'fixed', quantity, unitPrice, amount, deposit: polishDeposit, balance,
    unitPriceMinor: unitPrice * polishMinorFactor, amountMinor: amount * polishMinorFactor,
    depositMinor: polishDeposit * polishMinorFactor, balanceMinor: balance * polishMinorFactor, depositIncluded: true };
}
function quotePolish(lead: NfcLead): Quote {
  if (lead.product === 'nfc-review-card-mini') return quoteMini(lead);
  if (lead.solution?.schemaVersion === 1 && lead.solution.request_type === 'free_first_mockup' && lead.selection?.quantity === 'advice') return {
    currency: polishCurrency, status: 'consultation', amount: null, deposit: null, balance: null,
    amountMinor: null, depositMinor: null, balanceMinor: null, depositIncluded: false };
  if (lead.product === 'review-card-3d') {
    if (!lead.review3d || !Number.isSafeInteger(lead.quantity) || lead.quantity < 1 || lead.quantity > 10000) throw new NfcError(422, 'invalid_review_3d');
    return polishDetailed(lead.quantity, polandContract.products['review-card-3d'].unitPrice);
  }
  if (lead.product === 'nfc-menu-card') {
    if (!lead.menu) throw new NfcError(422, 'invalid_menu');
    if (lead.menu.intent === 'menu_consultation') return polishDetailed(0, null);
    const tier = polandContract.products['nfc-menu-card'].tiers.find(item => lead.quantity >= item.min && (item.max === null || lead.quantity <= item.max));
    if (!tier) throw new NfcError(422, 'invalid_menu');
    return polishDetailed(lead.quantity, tier.unitPrice);
  }
  if (lead.product === 'nfc-instagram-card' && (![1, 2].includes(lead.quantity) || lead.selection?.variant !== 'instagram')) throw new NfcError(422, 'invalid_selection');
  const custom = lead.quantity > 2 || ['bulk', 'consultation'].includes(lead.selection?.variant || '');
  const amount = custom ? null : polishPairPrices[lead.product][String(lead.quantity) as '1' | '2'];
  const balance = amount === null ? null : amount - polishDeposit;
  return { currency: polishCurrency, status: custom ? 'custom' : 'fixed', amount, deposit: polishDeposit, balance,
    amountMinor: amount === null ? null : amount * polishMinorFactor, depositMinor: polishDeposit * polishMinorFactor,
    balanceMinor: balance === null ? null : balance * polishMinorFactor, depositIncluded: true };
}
export function parseSelection(value: unknown, product: string, quantity: number, solution = false): Selection | undefined {
  if (value === undefined) {
    if (product === 'nfc-instagram-card') throw new NfcError(422, 'invalid_selection');
    return;
  }
  const selection = object(value, ['variant', 'quantity']);
  const { variant, quantity: count } = selection;
  if (!['standard', 'branded', 'bulk', 'consultation', 'instagram'].includes(String(variant)) || !['1', '2', 'more', ...(solution ? ['advice'] : [])].includes(String(count)) ||
      (variant === 'instagram' && count === 'more') ||
      (variant === 'bulk' && count !== 'more') || (solution && variant !== 'branded') ||
      product !== (variant === 'instagram' ? 'nfc-instagram-card' : variant === 'branded' ? 'branded-review-card' : 'review-card') ||
      quantity !== (count === 'more' ? 3 : count === 'advice' ? 0 : Number(count))) throw new NfcError(422, 'invalid_selection');
  return { variant, quantity: count } as Selection;
}
export function quote(lead: NfcLead): Quote {
  if (lead.product === 'nfc-review-card-mini') return quoteMini(lead);
  if (lead.language === 'pl') return quotePolish(lead);
  if (lead.solution?.schemaVersion === 1 && lead.solution.request_type === 'free_first_mockup' && lead.selection?.quantity === 'advice') return {
    currency: 'UAH', status: 'consultation', amount: null, deposit: null, depositIncluded: false };
  if (lead.product === 'review-card-3d') {
    if (!lead.review3d || !Number.isSafeInteger(lead.quantity) || lead.quantity < 1 || lead.quantity > 10000) throw new NfcError(422, 'invalid_review_3d');
    const quantity = lead.quantity, unitPrice = 4000, amount = quantity * unitPrice;
    return { currency: 'UAH', status: 'fixed', quantity, unitPrice, amount, deposit: 200, balance: amount - 200,
      unitPriceKopecks: unitPrice * 100, amountKopecks: amount * 100, depositKopecks: 20000,
      balanceKopecks: (amount - 200) * 100, depositIncluded: true };
  }
  if (lead.product === 'nfc-menu-card') {
    if (!lead.menu) throw new NfcError(422, 'invalid_menu');
    if (lead.menu.intent === 'menu_consultation') return { currency: 'UAH', status: 'consultation', quantity: 0, unitPrice: null,
      amount: null, deposit: null, balance: null, unitPriceKopecks: null, amountKopecks: null,
      depositKopecks: null, balanceKopecks: null, depositIncluded: false };
    const quantity = lead.quantity;
    const unitPrice = quantity >= 25 ? 500 : quantity >= 10 ? 600 : quantity >= 5 ? 750 : 1000;
    const amount = quantity * unitPrice;
    return { currency: 'UAH', status: 'fixed', quantity, unitPrice, amount, deposit: 200, balance: amount - 200,
      unitPriceKopecks: unitPrice * 100, amountKopecks: amount * 100, depositKopecks: 20000,
      balanceKopecks: (amount - 200) * 100, depositIncluded: true };
  }
  if (lead.product === 'nfc-instagram-card' && (![1, 2].includes(lead.quantity) || lead.selection?.variant !== 'instagram')) throw new NfcError(422, 'invalid_selection');
  const custom = lead.quantity > 2 || ['bulk', 'consultation'].includes(lead.selection?.variant || '');
  return { currency: 'UAH', status: custom ? 'custom' : 'fixed',
    amount: custom ? null : prices[lead.product][lead.quantity as 1 | 2], deposit: 200, depositIncluded: true };
}
