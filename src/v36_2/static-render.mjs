/* One complete renderer for raw HTML and client enhancement; explicit release policy. */
import {renderSiteBody} from './app.mjs';
import {BASE,esc,metadataHTML} from './seo.mjs';
import {translate} from './i18n.mjs';
import {BUILD_CONFIG} from './build-config.mjs';
import {isPreview,validateBuildConfig} from './release-policy.mjs';
export const PREVIEW_CSP="default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; form-action 'none'; base-uri 'none'; object-src 'none'";
export function renderStaticDocument(locale,route,options={}){
 const config=validateBuildConfig(options.config||BUILD_CONFIG),body=renderSiteBody(locale,route,{...options,config});
 // Native JSON modules (locale dictionaries and confirmed contacts) are also
 // governed by connect-src in Chromium. Keep self in every mode; configured
 // API origins are added only after production policy validation.
 const connect=["'self'",...new Set([config.v1Endpoint,config.v2Endpoint].filter(value=>value?.startsWith('https:')).map(value=>new URL(value).origin))].join(' ');
 const csp=PREVIEW_CSP.replace("connect-src 'self'",'connect-src '+connect);
 return `<!doctype html>\n<html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="referrer" content="no-referrer">${metadataHTML(locale,route,config)}<meta http-equiv="Content-Security-Policy" content="${csp}"><link rel="icon" href="${BASE}/assets/favicon.svg"><link rel="stylesheet" href="${BASE}/styles.css"><link rel="stylesheet" href="${BASE}/media.css"><link rel="stylesheet" href="${BASE}/product-content.css"><link rel="stylesheet" href="${BASE}/media-owner.css"><link rel="stylesheet" href="${BASE}/home-composition.css"><link rel="stylesheet" href="${BASE}/nfc-demo.css"><link rel="stylesheet" href="${BASE}/card-models.css"><link rel="stylesheet" href="${BASE}/product-navigation.css"><link rel="stylesheet" href="${BASE}/email-proposal.css"><link rel="stylesheet" href="${BASE}/product-tabs.css"><link rel="stylesheet" href="${BASE}/editorial.css"><link rel="stylesheet" href="${BASE}/owner-structure.css"><link rel="stylesheet" href="${BASE}/visual-system.css"><link rel="stylesheet" href="${BASE}/shop-design.css"><link rel="stylesheet" href="${BASE}/editorial-design.css"><script type="module" src="${BASE}/app.mjs"></script></head><body><div id="app" data-ssr-route="${esc(route)}" data-ssr-locale="${locale}">${body}</div><div id="announcer" class="sr-only" role="status" aria-live="polite"></div><noscript><p class="wrap">${esc(isPreview(config)?({uk:'Інтерактивні дії потребують JavaScript; усі описи доступні нижче.',en:'Interactive actions need JavaScript; all descriptions remain available.',pl:'Działania interaktywne wymagają JavaScript; wszystkie opisy pozostają dostępne.'})[locale]:({uk:'Інтерактивні дії потребують JavaScript. Весь опис товарів доступний на цій сторінці.',en:'Interactive actions need JavaScript. Complete product information is available on this page.',pl:'Działania interaktywne wymagają JavaScript. Pełny opis produktu jest dostępny na tej stronie.'})[locale])}</p></noscript></body></html>\n`;
}
