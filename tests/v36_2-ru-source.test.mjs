import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {RU_COPY_PROVENANCE,RU_PAGE_COPY,RU_PRODUCT_CONTENT,RU_EDITORIAL_COPY,RU_UI_COPY,RU_APPROVED_MEDIA_COPY,RU_PENDING_COPY,russianPageCopy,russianProductContent,russianUIText,russianMediaText,russianCopyReadiness,requireRussianPageCopy,russianSupplementText,MissingRussianCopyError} from '../src/v36_2/ru-copy.mjs';
import {RU_ROUTES,RU_ROBOTS,RU_HREFLANG,RU_DESIGN_ENTRIES,hasRussianRoute,descriptionLocales,descriptionPath,descriptionCanonical,descriptionAlternates,russianContentLink,descriptionRouteFromPathname,validatedDesignEntry,ukrainianProductHandoff,ukrainianDesignHandoff} from '../src/v36_2/ru-routes.mjs';
import {BASE,PUBLIC_ORIGIN,LOCALES,isKnownRoute} from '../src/v36_2/seo.mjs';
import {productContent,productContentLocales} from '../src/v36_2/product-content.mjs';
import {editorialContent} from '../src/v36_2/editorial-content.mjs';
import {eligibleDesignProducts} from '../src/v36_2/commerce.mjs';
const supplied=JSON.parse(fs.readFileSync(new URL('./fixtures/nfc-ru-01-supplied-copy.json',import.meta.url)));
const bases=[BASE,BASE+'/optidigital-3d'];
const unsupported=['/','/cart/','/order/','/privacy/','/collections/mini/','/solutions/menu-card/','/about/','/404/'];
const numerals=text=>(String(text).match(/\d+(?:[.,]\d+)?/gu)||[]).map(x=>x.replace(',','.')).sort();
function parity(actual,source,key){
 if(Array.isArray(actual)){assert.ok(Array.isArray(source),key);assert.equal(actual.length,source.length,key);actual.forEach((v,i)=>parity(v,source[i],key+'.'+i));}
 else if(actual&&typeof actual==='object')for(const [k,v]of Object.entries(actual)){assert.ok(k in source,key+'.'+k);if(k!=='locale')parity(v,source[k],key+'.'+k);}
 else if(typeof actual==='string'){
  if(['id','entry','href','route','entryId'].includes(key.split('.').at(-1)))assert.equal(actual,source,key);
  assert.deepEqual(numerals(actual),numerals(source),key+' factual numerals');
 }
}
function allLinks(value){return Array.isArray(value)?value.flatMap(allLinks):value&&typeof value==='object'?[...(typeof value.href==='string'?[value.href]:[]),...Object.values(value).flatMap(allLinks)]:[];}

test('RU source: six exact supplied pages, 24 primary fields, immutable copy and no publication approval',()=>{
 assert.deepEqual(RU_PAGE_COPY,supplied.copy.pages);assert.deepEqual(RU_UI_COPY,supplied.ui);
 assert.deepEqual(RU_PENDING_COPY,supplied.pendingCopy);
 assert.equal(RU_PENDING_COPY.length,0);
 assert.equal(supplied.resolvedCopy.length,48);
 for(const row of supplied.resolvedCopy){
  const lines=execFileSync('git',['show',RU_COPY_PROVENANCE.baselineSHA+':'+row.source_file],{cwd:new URL('..',import.meta.url),encoding:'utf8'}).split('\n');
  assert.equal(russianSupplementText(row.source_file.split('/').at(-1),row.source_key),row.ru_text);
  assert.equal(createHash('sha256').update(row.ru_text).digest('hex'),row.ru_text_sha256);
  assert.ok(lines[row.source_line-1]?.includes(row.source_text),row.source_file+':'+row.source_line+' '+row.source_key);
 }
 assert.equal(RU_PAGE_COPY.length,6);assert.deepEqual(RU_ROUTES,[...RU_PAGE_COPY.map(p=>p.route)]);
 for(const page of RU_PAGE_COPY)for(const key of ['title','description','h1','intro'])assert.ok(page[key]?.length);
 assert.ok(Object.isFrozen(RU_PAGE_COPY[0]));assert.throws(()=>RU_PAGE_COPY[0].title='changed',TypeError);
 assert.equal(RU_COPY_PROVENANCE.baselineSHA,'cd8967e5f3043cdc9dfc64210d6a6d9de20489ef');
 assert.equal(RU_COPY_PROVENANCE.publicationApproval,false);assert.equal(RU_COPY_PROVENANCE.descriptionLocale,'ru');assert.equal(RU_COPY_PROVENANCE.transactionLocale,'uk');
 assert.equal(RU_COPY_PROVENANCE.pageIntegration,'INTEGRATED_LOCAL');
});
test('RU source: exact user additions preserve both video warnings',()=>{
 assert.deepEqual(RU_APPROVED_MEDIA_COPY,supplied.approvedMedia);
 assert.equal(russianMediaText('poster'),'Статичный кадр предоставленного материала. Видео не воспроизводится: полный просмотр и субтитры ещё не согласованы.');
 assert.equal(russianMediaText('instagramBody'),'Открывается конкретный профиль. Автоматической подписки нет. Реальное видео демонстрации ожидает полного просмотра и согласования.');
 assert.ok(!RU_PENDING_COPY.some(r=>r.source_key==='poster'||r.source_key==='instagramBody'));
});
test('RU source: removed translations fail explicitly and unsupported products/paths do not use Ukrainian fallback',()=>{
 assert.throws(()=>russianMediaText('nonexistent_media'),MissingRussianCopyError);assert.throws(()=>russianUIText('nonexistent_translation'),MissingRussianCopyError);
 assert.throws(()=>russianUIText('notes'),MissingRussianCopyError);assert.throws(()=>russianProductContent('nfc-menu-card'),RangeError);
 assert.equal(russianPageCopy('/services/design/?entry=branded-review-card'),null);assert.equal(russianPageCopy('/order/'),null);
 assert.equal(russianCopyReadiness('/order/').knownRoute,false);assert.throws(()=>requireRussianPageCopy('/order/'),RangeError);
 for(const route of RU_ROUTES){assert.equal(russianCopyReadiness(route).ready,true);assert.deepEqual(requireRussianPageCopy(route),supplied.copy.pages.find(p=>p.route===route));}
 assert.deepEqual(requireRussianPageCopy('/collections/branded/'),supplied.copy.pages.find(p=>p.route==='/collections/branded/'));
});
for(const [id,counts]of Object.entries({'review-card':[14,8],'nfc-instagram-card':[15,10]}))test('RU source: full supplied product content and UK structural/numeric parity '+id,()=>{
 const actual=russianProductContent(id);assert.deepEqual(actual,supplied.copy.product_content[id]);
 assert.equal(actual.sections.length,counts[0]);assert.equal(actual.faq.length,counts[1]);parity(actual,productContent(id,'uk'),id);
});
test('RU source: five design sections in source order with three base identities and five media titles',()=>{
 assert.deepEqual({...RU_EDITORIAL_COPY,design:{...RU_EDITORIAL_COPY.design,sections:RU_EDITORIAL_COPY.design.sections.slice(1)}},supplied.copy.editorial);assert.equal(RU_COPY_PROVENANCE.expectedDesignSections,5);
 const actual=RU_EDITORIAL_COPY.design,source=editorialContent.uk.design;
 assert.equal(source.sections.length,5);assert.equal(actual.sections.length,5);assert.equal(actual.bases.length,3);assert.equal(actual.media.length,5);
 assert.deepEqual(actual.sections.map(section=>section.id),['difference','concept','materials','process','pricing']);
 parity(actual,source,'design');
});
test('RU source: route-specific registry does not extend existing full-site/product or wire locale sets',()=>{
 assert.deepEqual(LOCALES,['uk','en','pl']);assert.deepEqual(productContentLocales,['uk','en','pl']);
 assert.deepEqual(RU_DESIGN_ENTRIES,eligibleDesignProducts.map(p=>p.id));
 for(const route of unsupported){assert.equal(hasRussianRoute(route),false);assert.deepEqual(descriptionLocales(route),['uk','en','pl']);assert.throws(()=>descriptionPath('ru',route),RangeError);}
 for(const route of RU_ROUTES)assert.deepEqual(descriptionLocales(route),['uk','en','pl','ru']);
});
for(const base of bases)for(const route of RU_ROUTES)test('RU source: self/return alternates and canonical '+base+'/ru'+route,()=>{
 const options={base,origin:PUBLIC_ORIGIN},cluster=descriptionAlternates(route,options);
 assert.deepEqual(cluster.map(x=>x.language),['uk','en','pl','ru-UA']);assert.equal(RU_HREFLANG,'ru-UA');
 for(const locale of ['uk','en','pl','ru']){
  const canonical=PUBLIC_ORIGIN+base+(locale==='uk'?'':'/'+locale)+route;
  assert.equal(descriptionCanonical(locale,route+'?lang=ru#product-config',options),canonical);
  assert.ok(cluster.some(x=>x.href===canonical));assert.deepEqual(descriptionAlternates(route,options),cluster);
  const parsed=descriptionRouteFromPathname(descriptionPath(locale,route,{base}),{base,storedLanguage:'ru',queryLanguage:'ru'});
  assert.equal(parsed.locale,locale);assert.equal(parsed.route,route);assert.equal(parsed.russianRouteSupported,locale==='ru');
 }
 assert.equal(RU_ROBOTS,'noindex,nofollow,noarchive');assert.ok(!descriptionPath('ru',route,{base}).includes(base+base));
});
for(const base of bases)test('RU source: all supplied links resolve to supported RU or existing UK, retaining query/fragment '+base,()=>{
 for(const logical of allLinks(supplied.copy)){
  const parsed=new URL(logical,'https://logical.invalid'),r=russianContentLink(logical,{base,isKnownRoute}),translated=RU_ROUTES.includes(parsed.pathname);
  assert.ok(isKnownRoute(parsed.pathname),logical);assert.equal(r.requiresUkrainianLabel,!translated);
  assert.equal(r.href,base+(translated?'/ru':'')+parsed.pathname+parsed.search+parsed.hash);
  assert.equal(r.descriptionLocale,translated?'ru':'uk');
 }
 assert.throws(()=>russianContentLink('/invented-page/',{base,isKnownRoute}),RangeError);
 assert.throws(()=>russianContentLink('/privacy/',{base}),RangeError);
});
for(const base of bases)test('RU source: unknown RU paths are identified as unsupported without Ukrainian relabelling '+base,()=>{
 for(const route of unsupported){const parsed=descriptionRouteFromPathname(base+'/ru'+route,{base});assert.equal(parsed.locale,'ru');assert.equal(parsed.route,route);assert.equal(parsed.russianRouteSupported,false);}
 assert.equal(descriptionRouteFromPathname('/unrelated/ru/order/',{base}),null);
 assert.equal(descriptionRouteFromPathname(base+'/ru',{base}).route,'/');
 assert.equal(descriptionRouteFromPathname(base+'/services/design/?lang=ru',{base}),null);
 assert.equal(descriptionRouteFromPathname(base+'/services/design/',{base,storedLanguage:'ru',queryLanguage:'ru'}).locale,'uk');
});
for(const base of bases)test('RU source: UK product/design handoffs contain only explicit approved destination and validated entry '+base,()=>{
 for(const route of ['/solutions/review-card/','/solutions/instagram-card/'])assert.equal(ukrainianProductHandoff(route,{base}),base+route+'#product-config');
 for(const entry of RU_DESIGN_ENTRIES){
  assert.equal(validatedDesignEntry('?entry='+entry+'&lang=ru'),entry);
  assert.equal(ukrainianDesignHandoff(entry,{base}),base+'/services/design/?entry='+entry+'#design-request');
 }
 assert.equal(validatedDesignEntry(''),'');assert.equal(ukrainianDesignHandoff('',{base}),base+'/services/design/#design-request');
 for(const entry of ['unknown','nfc-instagram-card','', 'branded-review-card&email=person@example.invalid'])assert.throws(()=>validatedDesignEntry('?entry='+encodeURIComponent(entry)),RangeError);
 assert.throws(()=>validatedDesignEntry('?entry=branded-review-card&entry=branded-beauty-review-card'),RangeError);
 assert.throws(()=>ukrainianDesignHandoff('unknown',{base}),RangeError);
 assert.throws(()=>ukrainianProductHandoff('/solutions/review-card/?lang=ru',{base}),RangeError);
 assert.throws(()=>ukrainianProductHandoff('/solutions/nfc-menu-card/',{base}),RangeError);
});
test('RU source: prefixed/external/encoded link injection and duplicate mount prefixes are rejected',()=>{
 for(const value of ['//outside.invalid/a/','https://outside.invalid/','/ru/order/','/ru/../order/','/en/services/design/','/nfc-card-website/ru/solutions/review-card/','/solutions%2freview-card/','/a\\b/'])assert.throws(()=>russianContentLink(value,{isKnownRoute}));
 assert.throws(()=>descriptionPath('ru','/solutions/review-card/',{base:'https://outside.invalid'}),TypeError);
 assert.throws(()=>descriptionPath('uk','/mounted/services/design/',{base:'/mounted'}),TypeError);
 assert.throws(()=>descriptionCanonical('ru','/solutions/review-card/',{origin:PUBLIC_ORIGIN+'/unexpected/'}),TypeError);
});
test('RU source: frozen fixture integrity agrees with independent supplied-copy provenance',()=>{
 assert.equal(RU_COPY_PROVENANCE.inputSHA256['02_RU_COPY.json'],createHash('sha256').update(JSON.stringify(supplied.copy,null,2)+'\n').digest('hex'));
 assert.equal(RU_COPY_PROVENANCE.inputSHA256['03_RU_UI_AND_HANDOFF.json'],createHash('sha256').update(JSON.stringify(supplied.ui,null,2)+'\n').digest('hex'));
});

import {renderStaticDocument} from '../src/v36_2/static-render.mjs';
import {esc,pageMetadata,productStructuredData} from '../src/v36_2/seo.mjs';
import {validateRequest} from '../src/v36_2/commerce.mjs';
import {toWire} from '../src/v36_2/api-client.mjs';

const configurations=[
 {mode:'preview',revision:'v36.2',v1Endpoint:'/v1/public/leads/nfc-card',v2Endpoint:'/v2/public/requests/nfc-card',v2Enabled:true,policy:null},
 {mode:'production-fixture',revision:'v36.2',v1Endpoint:'',v2Endpoint:'',v2Enabled:false,policy:null}
];
const htmlFor=(locale,route,config=configurations[0])=>renderStaticDocument(locale,route,{config});
function assertRussianCluster(route,pages){
 assert.equal(pages.size,4);
 for(const [locale,html] of pages){
  assert.ok(html.includes('<html lang="'+locale+'">'));
  assert.deepEqual([...html.matchAll(/<link rel="canonical" href="([^"]+)">/g)].map(m=>m[1]),[
   PUBLIC_ORIGIN+BASE+(locale==='uk'?'':'/'+locale)+route
  ]);
  for(const [language,code] of [['uk','uk'],['en','en'],['pl','pl'],['ru','ru-UA']]){
   assert.ok(html.includes('<link rel="alternate" hreflang="'+code+'" href="'+PUBLIC_ORIGIN+BASE+(language==='uk'?'':'/'+language)+route+'">'));
  }
  assert.equal([...html.matchAll(/<link rel="alternate" hreflang=/g)].length,4);
  if(locale==='ru')assert.ok(html.includes('<meta name="robots" content="noindex,nofollow,noarchive">'));
 }
}
for(const config of configurations)for(const page of RU_PAGE_COPY)test('RU HTML: '+config.mode+' '+page.route+' exact content and reciprocal return links',()=>{
 const pages=new Map(['uk','en','pl','ru'].map(locale=>[locale,htmlFor(locale,page.route,config)]));
 assertRussianCluster(page.route,pages);
 const html=pages.get('ru');
 assert.equal([...html.matchAll(/<h1(?: | >|>)/g)].length,1);
 for(const [key,tag] of [['title','title'],['h1','h1']])assert.ok(html.includes('<'+tag+'>'+esc(page[key])+'</'+tag+'>'));
 assert.ok(html.includes('name="description" content="'+esc(page.description)+'"'));
 assert.ok(html.includes(esc(page.intro)));
 assert.doesNotMatch(html,/<(?:input|textarea)\b[^>]*(?:consent|contact|destination|quantity)|id="request-form"|data-testid="submit-request"|<form[^>]*id="product-config"/);
 assert.doesNotMatch(html,/[іїєґІЇЄҐ]/u);
 for(const row of supplied.resolvedCopy.filter(r=>r.routes.includes('/ru'+page.route))){
  if(row.source_key==='zeroBody'||row.source_file.endsWith('/nfc-3d-integration.mjs'))continue;
  assert.ok(html.includes(esc(row.ru_text)),row.source_file+':'+row.source_key);
 }
 for(const match of html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>/g)){
  const href=match[1];
  if(!href.startsWith(BASE+'/ru/'))continue;
  const target=new URL(href,PUBLIC_ORIGIN);
  assert.ok(RU_ROUTES.includes(target.pathname.slice((BASE+'/ru').length)),href);
 }
 if(page.route.startsWith('/solutions/')){
  assert.ok(html.includes('data-uk-handoff href="'+BASE+page.route+'#product-config"'));
  const schema=productStructuredData('ru',page.route),uk=productStructuredData('uk',page.route);
  assert.equal(schema.sku,uk.sku);
  assert.equal(schema.offers.price,uk.offers.price);
  assert.equal(schema.offers.priceCurrency,'UAH');
 }
 if(page.route==='/services/design/'){
  assert.deepEqual([...html.matchAll(/data-editorial-section="design:([^"]+)"/g)].map(m=>m[1]),['difference','concept','materials','process','pricing']);
  for(const entry of RU_DESIGN_ENTRIES)assert.ok(html.includes('href="'+BASE+'/services/design/?entry='+entry+'#design-request"'));
 }
});
test('RU HTML acceptance rejects wrong canonical, missing return alternate and indexable Russian robots',()=>{
 const route='/solutions/review-card/';
 const good=new Map(['uk','en','pl','ru'].map(locale=>[locale,htmlFor(locale,route)]));
 assertRussianCluster(route,good);
 for(const [locale,change] of [
  ['ru',html=>html.replace(/(<link rel="canonical" href="[^"]+)\/ru\//,'$1/')],
  ['en',html=>html.replace(/<link rel="alternate" hreflang="ru-UA"[^>]+>/,'')],
  ['ru',html=>html.replace('noindex,nofollow,noarchive','index,follow')]
 ]){
  const bad=new Map(good);bad.set(locale,change(good.get(locale)));
  assert.notEqual(bad.get(locale),good.get(locale));
  assert.throws(()=>assertRussianCluster(route,bad),assert.AssertionError);
 }
});
test('RU HTML rejects unsupported cart/order/privacy/root and leaves unrelated Ukrainian metadata alone',()=>{
 for(const route of ['/','/cart/','/order/','/privacy/','/ru/order/','/services/menu-consultation/']){
  const html=htmlFor('ru',route);
  assert.ok(html.includes('<h1>Страница не найдена</h1>'));
  assert.doesNotMatch(html,/rel="(?:canonical|alternate)"|id="request-form"|id="product-config"/);
  assert.equal(pageMetadata('ru',route).robots,RU_ROBOTS);
 }
 for(const route of ['/','/order/','/privacy/','/solutions/counter-stand/']){
  const html=htmlFor('uk',route);
  assert.doesNotMatch(html,/hreflang="ru-UA"|data-locale="ru"/);
 }
});
test('RU copy removal from a supplied key fails explicitly',async()=>{
 const original=fs.readFileSync(new URL('../src/v36_2/ru-copy.mjs',import.meta.url),'utf8');
 const altered=original.replace(/"media\.words\.poster": "[^"]+"/,'"media.words.poster": ""').replace(/"hold": "[^"]+"/,'"hold": ""');
 assert.notEqual(altered,original);
 const removed=await import('data:text/javascript;base64,'+Buffer.from(altered).toString('base64'));
 assert.throws(()=>removed.russianMediaText('poster'),{name:'MissingRussianCopyError'});
 assert.throws(()=>removed.requireRussianPageCopy('/solutions/review-card/'),{name:'MissingRussianCopyError'});
});
test('RU request validation rejects Russian and the wire mapper cannot silently relabel it Ukrainian',()=>{
 const body={intent:'physical_order',locale:'uk',market:'UA',contact:{name:'Synthetic Fixture',email:'synthetic@example.invalid',preferredMethod:'email'},lines:[{lineId:'synthetic',productId:'review-card',quantity:1}],consent:{requestProcessing:true,revision:'PHASE3-PROPOSAL'}};
 assert.deepEqual(validateRequest(body),[]);
 const russian={...body,locale:'ru'};
 assert.ok(validateRequest(russian).some(error=>error.code==='market_locale_mismatch'));
 const path=BASE+'/ru/solutions/review-card/';
 const wire=toWire(russian,path,configurations[0]);
 assert.equal(wire.language,'ru');
 assert.equal(wire.sourcePage,path);
});
