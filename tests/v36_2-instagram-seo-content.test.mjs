import {brandedContent} from '../src/v36_2/branded-content.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {renderStaticDocument} from '../src/v36_2/static-render.mjs';
import {pageMetadata,publicPath,esc,isKnownRoute,productStructuredData} from '../src/v36_2/seo.mjs';
import {instagramContent} from '../src/v36_2/instagram-content.mjs';
import {googleReviewContent} from '../src/v36_2/google-review-content.mjs';
import {catalog} from '../src/v36_2/commerce.mjs';
const spec=JSON.parse(fs.readFileSync(new URL('./fixtures/nfc-seo-content-02.json',import.meta.url)));
const googleSpec=JSON.parse(fs.readFileSync(new URL('./fixtures/nfc-seo-content-01.json',import.meta.url)));
const configs=['preview','production-fixture'].map(mode=>({mode,revision:'v36.2',v1Endpoint:mode==='preview'?'/v1/public/leads/nfc-card':'',v2Endpoint:mode==='preview'?'/v2/public/requests/nfc-card':'',v2Enabled:mode==='preview',policy:null}));
for(const page of spec.pages)for(const config of configs)test(`Instagram ${config.mode} ${page.locale} ${page.route}: exact copy, one H1, actual product/guide links`,()=>{
 const {locale,route}=page,meta=pageMetadata(locale,route,config),html=renderStaticDocument(locale,route,{config});
 assert.equal(meta.title,page.title);assert.equal(meta.description,page.description);
 assert.equal((html.match(/<h1\b/g)||[]).length,1);assert.ok(html.includes(`<h1>${esc(page.h1)}</h1>`));assert.ok(html.includes(`<p>${esc(page.intro)}</p>`));
 assert.ok(html.includes(`<title>${esc(page.title)}</title>`));assert.ok(html.includes(`<meta name="description" content="${esc(page.description)}">`));
 assert.equal(meta.alternates.length,3);if(config.mode==='preview')assert.equal(meta.robots,'noindex,nofollow,noarchive');
 const links=page.related_links??page.after_grid_section.paragraphs.flat().filter(x=>x.href);
 for(const link of links){
  assert.ok(isKnownRoute(link.href),link.href);
  const anchor=`<a href="${publicPath(locale,link.href)}" class="text-link" ${page.related_links?'data-seo-related':''}>${esc(link.text)}</a>`;
  assert.ok(html.includes(anchor),anchor);
 }
 if(page.after_grid_section){
  assert.ok(html.includes(`<div class="eyebrow">${esc(page.eyebrow)}</div>`));
  const section=page.after_grid_section;assert.ok(html.includes(`<h2>${esc(section.heading)}</h2>`));
  for(const parts of section.paragraphs){
   const expected=parts.map(x=>x.href?`<a href="${publicPath(locale,x.href)}" class="text-link" >${esc(x.text)}</a>`:esc(x.text)).join('');
   assert.ok(html.includes(`<p>${expected}</p>`));
  }
  assert.ok(html.indexOf('data-seo-content="instagram"')>html.indexOf('id="results"'));
  assert.ok(html.indexOf('data-seo-content="instagram"')<html.indexOf('data-catalog-service'));
  assert.deepEqual([...html.matchAll(/class="product-card" data-product-id="([^"]+)"/g)].map(x=>x[1]),['nfc-instagram-card']);
  assert.equal((html.match(/data-catalog-service=/g)||[]).length,1);
 }else{
  const schema=productStructuredData(locale,route);assert.equal(schema.sku,'nfc-instagram-card');assert.equal(schema.name,'NFC Instagram Card');assert.equal(schema.offers.price,1500);assert.equal(schema.offers.priceCurrency,'UAH');
  assert.ok(html.includes('data-product="nfc-instagram-card"'));assert.ok(html.includes('id="product-config"'));assert.ok(html.includes('data-product-tab-panel='));
  assert.equal((html.match(/data-seo-related/g)||[]).length,2);
 }
});
for(const locale of ['uk','en','pl'])test(`Instagram ${locale}: exact route/locale isolation, Google retained, guide unchanged`,()=>{
 const routes=['/','/solutions/','/catalog/','/collections/','/collections/mini/','/collections/online-menu/','/collections/branded/','/services/design/','/instagram-card/','/solutions/counter-stand/',...catalog.map(x=>x.route)];
 for(const route of new Set([...routes,'/collections/instagram/','/collections/google-review/'])){
  const instagram=spec.pages.find(x=>x.locale===locale&&x.route===route),google=googleSpec.pages.find(x=>x.locale===locale&&x.route===route);
  const content=instagramContent(locale,route),html=renderStaticDocument(locale,route);
  if(instagram){
   assert.ok(content);assert.equal(pageMetadata(locale,route).title,instagram.title);assert.equal(pageMetadata(locale,route).description,instagram.description);
   assert.ok(html.includes(`<h1>${esc(instagram.h1)}</h1>`));assert.ok(html.includes(`<p>${esc(instagram.intro)}</p>`));
  }else{
   assert.equal(content,null);assert.ok(!html.includes('data-seo-content="instagram"'));
   if(google){
    assert.ok(googleReviewContent(locale,route));assert.equal(pageMetadata(locale,route).title,google.title);assert.equal(pageMetadata(locale,route).description,google.description);
    assert.ok(html.includes(`<h1>${esc(google.h1)}</h1>`));assert.ok(html.includes(`<p>${esc(google.intro)}</p>`));
   }else{const branded=brandedContent(locale,route);if(branded){assert.equal(pageMetadata(locale,route).title,branded.title);assert.ok(html.includes(`<h1>${esc(branded.h1)}</h1>`));}else assert.ok(!pageMetadata(locale,route).title.includes(spec.brand));}
  }
 }
});
test('Instagram PL keeps its established category/product metadata and visible copy',()=>{
 const category=pageMetadata('pl','/collections/instagram/');assert.equal(category.title,'Karty NFC do profilu Instagram | NFC CARD');
 assert.ok(renderStaticDocument('pl','/collections/instagram/').includes('<h1>Profil Instagram</h1>'));
 const product=pageMetadata('pl','/solutions/instagram-card/');assert.equal(product.title,'NFC Instagram Card · przejście do profilu Instagram | NFC CARD');
 assert.ok(renderStaticDocument('pl','/solutions/instagram-card/').includes('<h1>NFC Instagram Card</h1>'));
});
