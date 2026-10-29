/* Owner v36.2 retail shortlist. Legacy/CRM identities stay in commerce.mjs. */
import {catalog} from './commerce.mjs';
export const PUBLIC_RETAIL_IDS=Object.freeze([
 'review-card','nfc-instagram-card','nfc-menu-card','review-card-3d',
 'beauty-review-card','restaurant-review-card'
]);
export const PUBLIC_RETAIL_CATALOG=Object.freeze(PUBLIC_RETAIL_IDS.map(id=>{
 const p=catalog.find(item=>item.id===id);
 if(!p||p.status!=='active'||p.design==='branded')throw new Error('Approved retail identity unavailable: '+id);
 return p;
}));
export const isPublicRetailProduct=value=>PUBLIC_RETAIL_IDS.includes(typeof value==='string'?value:value?.id);
