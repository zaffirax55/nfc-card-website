// NFC Menu Card's browser calculator mirrors the server contract. The gateway
// always recalculates every order and never accepts a client price.
import {plMenuQuote} from './pl-commerce.mjs';
export const MENU_VARIANTS = Object.freeze([
  'square_100_black', 'square_100_white', 'square_60_black',
  'square_60_white', 'round_70_black', 'round_70_white'
]);
const variantSet = new Set(MENU_VARIANTS);

export function normalizeMenuRows(rows, {allowEmpty = false} = {}) {
  if (!Array.isArray(rows) || rows.length > 30) throw Error('invalid_menu_rows');
  const merged = new Map();
  for (const row of rows) {
    if (!row || typeof row !== 'object' || Array.isArray(row) ||
        Object.keys(row).sort().join() !== 'quantity,variant_id' ||
        !variantSet.has(row.variant_id) || typeof row.quantity !== 'number' ||
        !Number.isSafeInteger(row.quantity) || row.quantity < 1 || row.quantity > 10000) {
      throw Error('invalid_menu_rows');
    }
    const next = (merged.get(row.variant_id) || 0) + row.quantity;
    if (next > 10000) throw Error('invalid_menu_rows');
    merged.set(row.variant_id, next);
  }
  const normalized = MENU_VARIANTS.filter(id => merged.has(id)).map(id => ({variant_id: id, quantity: merged.get(id)}));
  const quantity = normalized.reduce((sum, row) => sum + row.quantity, 0);
  if ((!allowEmpty && !quantity) || quantity > 10000) throw Error('invalid_menu_rows');
  return normalized;
}

export function menuQuote(rows, intent = 'card_order', polishContract = null) {
  if (intent === 'menu_consultation') {
    if (rows?.length) throw Error('invalid_menu_rows');
    return {quantity: 0, unitPrice: null, amount: null, deposit: null, balance: null,
      ...(polishContract?{currency:'PLN'}:{})};
  }
  if (intent !== 'card_order') throw Error('invalid_menu_intent');
  const items = normalizeMenuRows(rows);
  const quantity = items.reduce((sum, row) => sum + row.quantity, 0);
  if(polishContract)return {...plMenuQuote(polishContract,quantity),items};
  const unitPrice = quantity >= 25 ? 500 : quantity >= 10 ? 600 : quantity >= 5 ? 750 : 1000;
  const amount = quantity * unitPrice;
  return {quantity, unitPrice, amount, deposit: 200, balance: amount - 200, items};
}

// Syntax-only guest URL check. Do not load the URL or resolve its DNS.
export function menuPublicURL(value) {
  if (typeof value !== 'string' || value.length > 1000 || /[\x00-\x20\x7f<>"'\\]/u.test(value)) return null;
  let url;
  try { url = new URL(value); } catch { return null; }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || !url.hostname ||
      url.href.length > 1000 || url.hostname.endsWith('.')) return null;
  const host = url.hostname.toLowerCase();
  if (host.startsWith('[')) return null; // Exclude IP literals; no DNS resolution.
  if (/^\d+(?:\.\d+){3}$/.test(host)) {
    const octets = host.split('.').map(Number), [a,b] = octets;
    if (octets.some(n => n > 255) || a === 0 || a === 10 || a === 127 || a >= 224 ||
        (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
        (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) ||
        (a === 192 && b === 0) || (a === 198 && [18,19].includes(b)) ||
        (a === 198 && b === 51 && octets[2] === 100) ||
        (a === 203 && b === 0 && octets[2] === 113)) return null;
  } else if (!/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9-]{2,63}$/.test(host) ||
             /\.(?:localhost|local|internal|invalid|test|example)$/.test(host)) return null;
  return url.href;
}
