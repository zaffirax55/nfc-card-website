/** Dependency-free verification of the designer source/build. No HTTP or sends. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {PUBLIC_RETAIL_IDS} from '../src/v36_2/public-catalog.mjs';
import {catalog,priceCart} from '../src/v36_2/commerce.mjs';
import {allProductContent} from '../src/v36_2/product-content.mjs';
import {editorialContent} from '../src/v36_2/editorial-content.mjs';
import {deliveryContent} from '../src/v36_2/delivery-content.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const digest=b=>createHash('sha256').update(b).digest('hex');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const results=[];
const check=(name,fn)=>{try{results.push({name,status:'PASS',observed:fn()??null});}catch(e){results.push({name,status:'FAIL',error:e.message});}};
const ids=s=>[...s.matchAll(/<[^>]+class="[^"]*\bproduct-card\b[^"]*"[^>]*>/g)].map(x=>x[0].match(/data-product-id="([^"]+)"/)?.[1]).filter(Boolean);
const schemas=s=>[...s.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(x=>JSON.parse(x[1]));
const flatten=x=>Array.isArray(x)?x.flatMap(flatten):x&&typeof x==='object'?[x,...Object.values(x).flatMap(flatten)]:[];
const prefix=l=>'/nfc-card-website'+(l==='uk'?'':'/'+l);
check('Approved archive provenance and explicitly recorded production adaptations',()=>{
 const origin=JSON.parse(read('designer/SOURCE_ORIGIN.json'));
 assert.equal(origin.archiveSHA256,'b6621cd2620bf57270ed2b616bb0ab4cdb609dbbce999319dfc242883c168b35');
 const adaptations=JSON.parse(read('release/PRODUCTION_ADAPTATIONS.json'));
 const design=JSON.parse(read('designer/VISUAL_CHANGE_REGISTER.json'));
 assert.equal(design.productionBase,'d0e79aab9717b3bb569325f249164a72bc5acd64');
 assert.deepEqual(design.files.map(x=>x.path).sort(),['src/v36_2/app.mjs','src/v36_2/home-composition.mjs','src/v36_2/static-render.mjs']);
 for(const row of origin.exactFiles){
  const changed=adaptations.files.find(x=>x.path===row.path);
  if(changed)assert.equal(changed.archiveSHA256,row.sha256,row.path);
  const approved=changed?.releaseSHA256??row.sha256;
  const visual=design.files.find(x=>x.path===row.path);
  if(visual)assert.equal(visual.productionSHA256,approved,row.path+' production baseline');
  assert.equal(digest(fs.readFileSync(path.join(ROOT,row.path))),visual?.designerSHA256??approved,row.path);
 }
 return origin.exactFiles.length;
});
check('Six retail identities, nine active legacy offers and two unavailable drafts',()=>{
 assert.deepEqual(PUBLIC_RETAIL_IDS,['review-card','nfc-instagram-card','nfc-menu-card','review-card-3d','beauty-review-card','restaurant-review-card']);
 assert.equal(catalog.filter(p=>p.status==='active').length,9);assert.equal(catalog.filter(p=>p.status==='draft').length,2);
});
check('Owner current ordinary Branded pair remains3600UAH/299PLN',()=>{
 const q=priceCart([{lineId:'a',productId:'branded-review-card',quantity:2}],'UA');assert.equal(q.total,3600);
 assert.equal(priceCart([{lineId:'b',productId:'branded-review-card',quantity:2}],'PL').total,299);
});
check('Full accepted long-form content418sections/237FAQ and three About labels',()=>{
 const rows=allProductContent();assert.equal(rows.length,27);
 assert.equal(rows.reduce((n,x)=>n+x.sections.length,0),418);assert.equal(rows.reduce((n,x)=>n+x.faq.length,0),237);
 for(const[l,label]of Object.entries({uk:'Про нас',en:'About us',pl:'O nas'}))assert.equal(editorialContent[l].about.title,label);
});
let links=0;
for(const mode of ['designer-preview-v36_2','designer-seo-fixture-v36_2']){
 const folder='work/'+mode;
 const m=JSON.parse(read(folder+'/BUILD_MANIFEST.json'));
 const pages=new Map(m.htmlProof.map(row=>[row.url,read(folder+row.url+'/index.html')]));
 check(mode+' all compiled source and HTML SHA, 3locales and legacy aliases',()=>{
  assert.equal(m.publicationAuthorized,false);assert.equal(m.legacyRoutesPreserved,true);
  assert.equal(m.routeCount,mode.includes('preview')?132:123);
  for(const x of m.sourceFiles)assert.equal(digest(fs.readFileSync(path.join(ROOT,x.path))),x.sha256,x.path);
  for(const x of m.htmlProof){const s=pages.get(x.url);assert.equal(digest(s),x.sha256,x.url);assert.ok(s.includes('rel="canonical"'));assert.ok(s.includes('hreflang="uk"')&&s.includes('hreflang="en"')&&s.includes('hreflang="pl"'));schemas(s);if(mode.includes('preview'))assert.match(s,/<meta name="robots" content="noindex/);}
  return{sourceFiles:m.sourceFiles.length,routes:m.routeCount};
 });
 for(const l of ['uk','en','pl']){
  const p=prefix(l),page=r=>pages.get(p+r);
  for(const route of ['/solutions/','/catalog/','/collections/','/search/'])check(mode+' '+l+' six physical offers '+route,()=>{assert.deepEqual(ids(page(route)),PUBLIC_RETAIL_IDS);assert.equal((page(route).match(/data-catalog-service="?design/g)||[]).length,1);return ids(page(route));});
  check(mode+' '+l+' full Delivery/About/service and home4',()=>{
   const d=page('/delivery-and-payment/');assert.ok(d.length>10000);assert.equal((d.match(/data-delivery-section=/g)||[]).length,8);assert.equal((d.match(/<details/g)||[]).length,deliveryContent[l].faq.length);
   assert.ok(page('/about/').includes('<h1>'+editorialContent[l].about.title+'</h1>'));
   assert.deepEqual([...page('/').matchAll(/data-home-featured-product="([^"]+)"/g)].map(x=>x[1]),['beauty-review-card','restaurant-review-card','review-card','nfc-instagram-card']);
   assert.equal((page('/').match(/data-nfc-demo/g)||[]).length,1);
   assert.ok(page('/').includes('data-demo-pause'));
   const hub=page('/collections/branded/');assert.equal(ids(hub).length,0);assert.ok(hub.includes(p+'/services/design/'));
   for(const route of ['/collections/branded/','/services/design/'])assert.ok(!flatten(schemas(page(route))).some(x=>['Product','Offer','ItemList'].includes(x['@type'])));
  });
  check(mode+' '+l+' all9legacy deep links, four static tab panels and full terms',()=>{
   for(const product of catalog.filter(x=>x.status==='active')){
    const s=page(product.route);assert.ok(s,product.route);assert.equal((s.match(/role="tab"/g)||[]).length,4,product.id);assert.equal((s.match(/role="tabpanel"/g)||[]).length,4);assert.ok(s.includes('data-testid="product-payment-full-terms"'));assert.ok(s.includes(p+'/delivery-and-payment/'));
   }
  });
 }
 check(mode+' all local route and fragment links resolve',()=>{
  const base='https://fixture.invalid',idmap=new Map([...pages].map(([u,s])=>[u,new Set([...s.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]))]));let count=0;
  for(const[url,s]of pages)for(const m of s.matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)){
   const target=new URL(m[1].replaceAll('&amp;','&'),base+url);if(target.origin!==base||!target.pathname.startsWith('/nfc-card-website/'))continue;
   assert.ok(pages.has(target.pathname),url+' -> '+target.pathname);if(target.hash)assert.ok(idmap.get(target.pathname).has(decodeURIComponent(target.hash.slice(1))),url+' -> '+target.hash);count++;
  }links+=count;return count;
 });
}
const report={scope:'Local source/static checks only; no production, HTTP, real data or sends',results,pass:results.filter(x=>x.status==='PASS').length,fail:results.filter(x=>x.status==='FAIL').length,localLinks:links};
fs.mkdirSync(path.join(ROOT,'work/designer-qa'),{recursive:true});fs.writeFileSync(path.join(ROOT,'work/designer-qa/SOURCE_STATIC_QA.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({...report,results:results.filter(x=>x.status==='FAIL')},null,2));if(report.fail)process.exitCode=1;
