import {brandedContent} from '../src/v36_2/branded-content.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {renderStaticDocument} from '../src/v36_2/static-render.mjs';
import {pageMetadata,publicPath,esc,isKnownRoute,productStructuredData} from '../src/v36_2/seo.mjs';
import {instagramContent} from '../src/v36_2/instagram-content.mjs';
import {googleReviewContent} from '../src/v36_2/google-review-content.mjs';
const spec=JSON.parse(fs.readFileSync(new URL('./fixtures/nfc-seo-content-01.json',import.meta.url)));
const configs=['preview','production-fixture'].map(mode=>({mode,revision:'v36.2',v1Endpoint:mode==='preview'?'/v1/public/leads/nfc-card':'',v2Endpoint:mode==='preview'?'/v2/public/requests/nfc-card':'',v2Enabled:mode==='preview',policy:null}));
for(const page of spec.pages)for(const config of configs)test(`${config.mode} ${page.locale} ${page.route}: exact metadata, one H1, copy and resolved anchors`,()=>{
 const {locale,route}=page,meta=pageMetadata(locale,route,config),html=renderStaticDocument(locale,route,{config});
 assert.equal(meta.title,page.title);assert.equal(meta.description,page.description);
 assert.equal((html.match(/<h1\b/g)||[]).length,1);assert.ok(html.includes(`<h1>${esc(page.h1)}</h1>`));assert.ok(html.includes(`<p>${esc(page.intro)}</p>`));
 assert.ok(html.includes(`<title>${esc(page.title)}</title>`));assert.ok(html.includes(`<meta name="description" content="${esc(page.description)}">`));
 assert.ok(!meta.title.includes(' | NFC CARD'));assert.equal(meta.alternates.length,3);
 if(config.mode==='preview')assert.equal(meta.robots,'noindex,nofollow,noarchive');
 if(page.eyebrow)assert.ok(html.includes(`<div class="eyebrow">${page.eyebrow}</div>`));
 const links=page.related_link?[page.related_link]:page.after_grid_section.paragraphs.flat().filter(x=>x.href);
 for(const link of links){
  const [logical,query]=link.href.split('?');assert.ok(isKnownRoute(logical));
  const href=publicPath(locale,logical)+(query?'?'+query:'');assert.ok(html.includes(`href="${href}"`),href);
  assert.ok(html.includes(`>${esc(link.text)}</a>`));
 }
 if(page.after_grid_section){
  const section=page.after_grid_section;
  assert.ok(html.includes(`<h2>${esc(section.heading)}</h2>`));
  for(const parts of section.paragraphs){const expected=parts.map(x=>x.href?`<a href="${publicPath(locale,x.href.split('?')[0])+(x.href.includes('?')?'?'+x.href.split('?')[1]:'')}" class="text-link" >${esc(x.text)}</a>`:esc(x.text)).join('');assert.ok(html.includes(`<p>${expected}</p>`));}
  assert.ok(html.indexOf('data-seo-content')>html.indexOf('id="results"'));
  assert.deepEqual([...html.matchAll(/class="product-card" data-product-id="([^"]+)"/g)].map(x=>x[1]),['review-card','review-card-3d','beauty-review-card','restaurant-review-card']);
 }else{
  const schema=productStructuredData(locale,route);assert.equal(schema.sku,'review-card');assert.equal(schema.offers.price,1500);assert.equal(schema.offers.priceCurrency,'UAH');
  assert.ok(html.includes('data-product="review-card"'));assert.ok(html.includes('id="product-config"'));assert.ok(html.includes('data-product-tab-panel='));
 }
});
for(const locale of ['uk','en','pl'])test(`${locale}: overrides stay within the exact logical route and locale`,()=>{
 for(const route of ['/','/solutions/','/catalog/','/collections/','/collections/instagram/','/collections/mini/','/services/design/','/solutions/instagram-card/','/solutions/counter-stand/']){
  assert.equal(googleReviewContent(locale,route),null);
  const instagram=instagramContent(locale,route),branded=brandedContent(locale,route),html=renderStaticDocument(locale,route);
  if(instagram){
   assert.equal(pageMetadata(locale,route).title,instagram.title);
   assert.ok(html.includes(`<h1>${esc(instagram.h1)}</h1>`));
   assert.ok(html.includes(`<p>${esc(instagram.intro)}</p>`));
  }else if(branded){
   assert.equal(pageMetadata(locale,route).title,branded.title);assert.ok(html.includes(`<h1>${esc(branded.h1)}</h1>`));assert.ok(html.includes(`>${esc(branded.intro)}</p>`));
  }else{
   assert.ok(!pageMetadata(locale,route).title.includes('Antonov Digital NFC Card'));
   assert.ok(!html.includes('data-seo-content='));
  }
 }
 if(locale==='pl')for(const route of ['/collections/google-review/','/solutions/review-card/']){
  assert.equal(googleReviewContent(locale,route),null);const html=renderStaticDocument(locale,route);
  assert.ok(!html.includes('data-seo-related'));assert.ok(!html.includes('data-seo-content='));
 }
});
test('PL category and product keep their established title, H1 and description',()=>{
 const category=pageMetadata('pl','/collections/google-review/');assert.equal(category.title,'Karty NFC do opinii Google | NFC CARD');
 assert.ok(renderStaticDocument('pl','/collections/google-review/').includes('<h1>Opinie Google</h1>'));
 const product=pageMetadata('pl','/solutions/review-card/');assert.equal(product.title,'Google Review Card · dostęp do opinii Google | NFC CARD');
 assert.ok(renderStaticDocument('pl','/solutions/review-card/').includes('<h1>Google Review Card</h1>'));
});
