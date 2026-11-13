/* Content-locale helpers only. These do not extend the request/API language contract. */
export const RU_ROUTES=Object.freeze([
 '/collections/google-review/','/solutions/review-card/',
 '/collections/instagram/','/solutions/instagram-card/',
 '/collections/branded/','/services/design/'
]);
export const RU_ROBOTS='noindex,nofollow,noarchive';
export const RU_HREFLANG='ru-UA';
const existingLocales=Object.freeze(['uk','en','pl']);
const ruLocales=Object.freeze([...existingLocales,'ru']);
const defaultBase='/nfc-card-website';
const productRoutes=new Set(['/solutions/review-card/','/solutions/instagram-card/']);
// Preserve the three existing public design identities. No default replacement for invalid entry.
export const RU_DESIGN_ENTRIES=Object.freeze(['branded-review-card','branded-beauty-review-card','branded-restaurant-review-card']);

function checkedBase(base){
 if(typeof base!=='string'||!/^\/(?:[a-z0-9_-]+\/)*[a-z0-9_-]+$/i.test(base))throw new TypeError('Invalid storefront base');
 return base;
}
function logicalURL(logical){
 if(typeof logical!=='string'||!logical.startsWith('/')||logical.startsWith('//')||/[\\\u0000-\u0020\u007f]/.test(logical))throw new TypeError('Expected a logical route');
 if(/^\/(?:ru|en|pl)(?:\/|$)/.test(logical))throw new TypeError('Expected an unprefixed logical route');
 const parsed=new URL(logical,'https://logical.invalid');
 if(parsed.origin!=='https://logical.invalid'||/^\/(?:ru|en|pl)(?:\/|$)/.test(parsed.pathname)||parsed.pathname.startsWith(defaultBase+'/')||parsed.pathname===defaultBase||/%(?:2f|5c)/i.test(parsed.pathname))throw new TypeError('Expected an unprefixed logical route');
 parsed.pathname=parsed.pathname.replace(/\/+$/,'')+'/';
 return parsed;
}
export function hasRussianRoute(logical){
 try{return RU_ROUTES.includes(logicalURL(logical).pathname)}catch{return false}
}
export function descriptionLocales(logical){return hasRussianRoute(logical)?ruLocales:existingLocales;}

/** Locale URLs preserve caller-supplied query/fragment; canonical helpers omit both. */
export function descriptionPath(locale,logical,{base=defaultBase}={}){
 base=checkedBase(base);const parsed=logicalURL(logical);
 if(parsed.pathname===base+'/'||parsed.pathname.startsWith(base+'/'))throw new TypeError('Duplicate storefront base');
 if(!existingLocales.includes(locale)&&!(locale==='ru'&&RU_ROUTES.includes(parsed.pathname)))throw new RangeError('Unsupported description locale for route');
 return base+(locale==='uk'?'':'/'+locale)+parsed.pathname+parsed.search+parsed.hash;
}
export function descriptionCanonical(locale,logical,{origin,base=defaultBase}={}){
 const parsed=new URL(origin);
 if(!/^https?:$/.test(parsed.protocol)||parsed.origin!==origin)throw new TypeError('Expected an explicit origin without path');
 return origin+descriptionPath(locale,logicalURL(logical).pathname,{base});
}
export function descriptionAlternates(logical,options){
 return descriptionLocales(logical).map(locale=>Object.freeze({language:locale==='ru'?RU_HREFLANG:locale,href:descriptionCanonical(locale,logical,options)}));
}
/** The renderer must append the supplied ukSuffix when requiresUkrainianLabel is true. */
export function russianContentLink(logical,{isKnownRoute,...options}={}){
 const translated=hasRussianRoute(logical);
 if(!translated&&(typeof isKnownRoute!=='function'||!isKnownRoute(logicalURL(logical).pathname)))throw new RangeError('Unknown Ukrainian destination');
 return Object.freeze({href:descriptionPath(translated?'ru':'uk',logical,options),requiresUkrainianLabel:!translated,descriptionLocale:translated?'ru':'uk'});
}

/** URL alone determines description language; no preferences, query override or redirect. */
export function descriptionRouteFromPathname(pathname,{base=defaultBase}={}){
 base=checkedBase(base);
 if(typeof pathname!=='string'||/[?#\\\u0000-\u0020\u007f]/.test(pathname))return null;
 if(pathname!==base&&!pathname.startsWith(base+'/'))return null;
 const relative=pathname.slice(base.length)||'/',match=relative.match(/^\/(ru|en|pl)(?:\/|$)/);
 const locale=match?.[1]??'uk',route=(match?relative.slice(locale.length+1)||'/':relative).replace(/\/+$/,'')+'/';
 return Object.freeze({locale,route,russianRouteSupported:locale==='ru'&&RU_ROUTES.includes(route)});
}
export function validatedDesignEntry(search=''){
 const values=new URLSearchParams(search).getAll('entry');
 if(!values.length)return '';
 if(values.length!==1||!RU_DESIGN_ENTRIES.includes(values[0]))throw new RangeError('Invalid design entry');
 return values[0];
}
/** Explicit Ukrainian navigation only: no contact/consent data or payload relabelling. */
export function ukrainianProductHandoff(route,options){
 const logical=logicalURL(route);
 if(!productRoutes.has(logical.pathname)||logical.search||logical.hash)throw new RangeError('Invalid product handoff route');
 return descriptionPath('uk',logical.pathname+'#product-config',options);
}
export function ukrainianDesignHandoff(entry='',options){
 if(entry!==''&&!RU_DESIGN_ENTRIES.includes(entry))throw new RangeError('Invalid design entry');
 return descriptionPath('uk','/services/design/'+(entry?'?entry='+encodeURIComponent(entry):'')+'#design-request',options);
}
