import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {renderStaticDocument} from '../src/v36_2/static-render.mjs';
import {pageMetadata,publicPath,esc,isKnownRoute} from '../src/v36_2/seo.mjs';
import {brandedContent} from '../src/v36_2/branded-content.mjs';
import {catalog} from '../src/v36_2/commerce.mjs';
const spec=JSON.parse(fs.readFileSync(new URL('./fixtures/nfc-seo-content-03.json',import.meta.url)));
const configs=['preview','production-fixture'].map(mode=>({mode,revision:'v36.2',v1Endpoint:mode==='preview'?'/v1/public/leads/nfc-card':'',v2Endpoint:mode==='preview'?'/v2/public/requests/nfc-card':'',v2Enabled:mode==='preview',policy:null}));
const href=(locale,logical)=>{const u=new URL(logical,'https://fixture.invalid');return publicPath(locale,u.pathname)+u.search+u.hash;};
for(const page of spec.pages)for(const config of configs)test(`Branded ${config.mode} ${page.locale} ${page.route}: exact copy, placement, existing design boundary`,()=>{
 const {locale,route}=page,meta=pageMetadata(locale,route,config),html=renderStaticDocument(locale,route,{config});
 assert.deepEqual(brandedContent(locale,route),Object.fromEntries(Object.entries(page).filter(([k])=>!['locale','route'].includes(k))));
 assert.equal(meta.title,page.title);assert.equal(meta.description,page.description);
 assert.equal((html.match(/<h1\b/g)||[]).length,1);assert.ok(html.includes(`<h1>${esc(page.h1)}</h1>`));assert.ok(html.includes(`>${esc(page.intro)}</p>`));
 assert.ok(html.includes(`<title>${esc(page.title)}</title>`));assert.ok(html.includes(`<meta name="description" content="${esc(page.description)}">`));
 assert.deepEqual(meta.alternates.map(a=>a.language),['uk','en','pl','ru-UA']);
 assert.equal(meta.alternates.at(-1).href,new URL(publicPath('ru',route),meta.canonical).href);assert.ok(!meta.canonical.includes('?'));assert.ok(!meta.canonical.includes('#'));
 if(config.mode==='preview')assert.equal(meta.robots,'noindex,nofollow,noarchive');
 const section=page.after_promotion_section,links=page.related_links??section.paragraphs.flat().filter(x=>x.href);
 for(const link of links){assert.ok(isKnownRoute(new URL(link.href,'https://fixture.invalid').pathname));assert.ok(html.includes(`<a href="${href(locale,link.href)}" class="text-link" >${esc(link.text)}</a>`));}
 if(section){
  assert.equal((html.match(/data-seo-content="branded"/g)||[]).length,1);assert.equal((html.match(/data-catalog-service=/g)||[]).length,1);
  assert.ok(html.indexOf('data-seo-content="branded"')>html.indexOf('data-catalog-service='));
  assert.ok(html.includes(`<h2>${esc(section.heading)}</h2>`));
  for(const parts of section.paragraphs){const expected=parts.map(x=>x.href?`<a href="${href(locale,x.href)}" class="text-link" >${esc(x.text)}</a>`:esc(x.text)).join('');assert.ok(html.includes(`<p>${expected}</p>`));}
  assert.ok(!html.includes('class="product-card"'));assert.ok(html.includes('?entry=branded-review-card#design-request'));
 }else{
  assert.equal((html.match(/data-branded-related/g)||[]).length,1);
  assert.ok(html.indexOf('data-branded-related')>html.indexOf('class="editorial-design-next prose"'));assert.ok(html.indexOf('data-branded-related')<html.indexOf('id="design-request"'));
  const form=html.slice(html.indexOf('<section id="design-request"'));
  assert.ok(!form.includes('<h1>'));assert.ok(form.includes('<h2>'));assert.ok(form.includes('id="service-entry"'));
  assert.ok(!form.includes('name="quantity"'));assert.ok(form.includes('data-testid="submit-request"'));
  assert.equal((html.match(/data-design-base=/g)||[]).length,3);
  for(const entry of ['branded-review-card','branded-beauty-review-card','branded-restaurant-review-card'])assert.ok(html.includes(`data-design-base="${entry}"`));
 }
});
for(const locale of ['uk','en','pl'])test(`Branded ${locale}: exact route isolation; legacy retail excluded; PL preserved`,()=>{
 const targets=spec.pages.filter(x=>x.locale===locale).map(x=>x.route);
 for(const route of new Set(['/',...catalog.map(x=>x.route),'/collections/branded/','/services/design/','/collections/google-review/','/collections/instagram/','/instagram-card/'])){
  const content=brandedContent(locale,route);assert.equal(Boolean(content),targets.includes(route));
  const html=renderStaticDocument(locale,route);
  if(!content){assert.ok(!html.includes('data-seo-content="branded"'));assert.ok(!html.includes('data-branded-related'));}
 }
 for(const route of ['/collections/branded/','/services/design/'])assert.ok(!pageMetadata(locale,route).canonical.includes('?'));
});
test('Branded unsupported locale and query are not new content routes',()=>{
 assert.equal(brandedContent('ru','/services/design/'),null);assert.equal(brandedContent('uk','/services/design/?entry=branded-review-card'),null);
 assert.equal(pageMetadata('uk','/services/design/?entry=branded-review-card#design-request').canonical,pageMetadata('uk','/services/design/').canonical);
});
