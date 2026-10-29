// Presentation only. Approved retail identities and commercial variants remain
// defined by commerce.mjs; this map never changes a quote or an order payload.
const productModels=Object.freeze({
 'review-card':'review-standard',
 'nfc-instagram-card':'instagram',
 'review-card-3d':'review-acrylic',
 'beauty-review-card':'beauty',
 'restaurant-review-card':'restaurant'
});
const menuModels=Object.freeze({
 square_100_black:'menu-square-black',square_60_black:'menu-square-black',
 square_100_white:'menu-square-white',square_60_white:'menu-square-white',
 round_70_black:'menu-round-black',round_70_white:'menu-round-white'
});
export const MODEL_IDS=Object.freeze([...new Set([...Object.values(productModels),...Object.values(menuModels)])]);
export function modelFor(productId,variantId='square_100_black'){
 return productId==='nfc-menu-card'?menuModels[variantId]||null:productModels[productId]||null;
}
