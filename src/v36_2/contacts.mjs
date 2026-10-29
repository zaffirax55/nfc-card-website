// Exact confirmed public contact destinations/labels from current-main model.mjs
// and display.mjs contactItems(), snapshotted for all three languages. No sends.
import contacts from './legacy-v36/contacts.json' with {type:'json'};
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const contactDestinations=locale=>contacts[locale].map(row=>({...row}));
export function renderContacts(locale){return `<nav class="contact-links" aria-label="${({uk:'Зв’язок із продавцем',en:'Contact the seller',pl:'Kontakt ze sprzedawcą'})[locale]}">${contactDestinations(locale).map(c=>`<a class="text-link" href="${esc(c.href)}" ${c.href.startsWith('https:')?'target="_blank" rel="noopener noreferrer"':''}>${esc(c.label)}</a>`).join('')}</nav>`;}
