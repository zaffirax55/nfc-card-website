/* Explicit RC compiler. No server, network request, publication or original output mutation. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {catalog,OWNER_UA_PRICING_REVISION,OWNER_UA_SOURCE_REVISION} from '../src/v36_2/commerce.mjs';
import {BASE,PUBLIC_ORIGIN,LOCALES,LEGACY_ALIASES,FAQ_SCHEMA_POLICY,QUOTE_SCHEMA_POLICY,publicPath,pageMetadata} from '../src/v36_2/seo.mjs';
import {renderStaticDocument} from '../src/v36_2/static-render.mjs';
import {validateBuildConfig,isPreview,LEGACY_NOTICE_SHA256} from '../src/v36_2/release-policy.mjs';
import {policyDigest} from '../src/v36_2/policy-digest.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),source=path.join(root,'src/v36_2');
const mode=process.argv[2];
if(!['preview','production','production-fixture'].includes(mode))throw Error('Usage: node scripts/build-v36_2.mjs <preview|production|production-fixture> [owner-policy.json]');
let config=mode==='preview'?{mode,revision:'v36.2',v1Endpoint:'/v1/public/leads/nfc-card',v2Endpoint:'/v2/public/requests/nfc-card',v2Enabled:true,policy:null}:{mode,revision:'v36.2',v1Endpoint:'',v2Endpoint:'',v2Enabled:false,policy:null};
if(mode==='production'){
 const policyFile=process.argv[3];if(!policyFile)throw Error('B05_owner_approved_policy_required: production build blocked; do not infer expanded consent from V36');
 const supplied=JSON.parse(fs.readFileSync(policyFile,'utf8'));
 config={...config,v1Endpoint:supplied.v1Endpoint,v2Endpoint:supplied.v2Endpoint,v2Enabled:true,policy:supplied.policy};
 validateBuildConfig(config);
 const p=config.policy,expected=policyDigest(p);
 if(p.policySha256!==expected)throw Error('B05_policy_content_sha256_mismatch');
}
validateBuildConfig(config);
if(createHash('sha256').update(fs.readFileSync(path.join(source,'legacy-v36/public-legal.mjs'))).digest('hex')!==LEGACY_NOTICE_SHA256)throw Error('legacy_privacy_source_drift');
const output=path.join(root,'work',mode==='preview'?'designer-preview-v36_2':mode==='production'?'designer-release-v36_2':'designer-seo-fixture-v36_2');
// Generated roots are fixed and isolated; a missing approval fails before touching them.
if(fs.existsSync(output))fs.rmSync(output,{recursive:true});
const baseRoutes=['/','/solutions/','/catalog/','/collections/','/collections/google-review/','/collections/instagram/','/collections/online-menu/','/collections/mini/','/collections/branded/','/search/','/cart/','/order/','/services/design/','/services/quantity-advice/','/services/menu-consultation/','/thank-you/','/faq/','/about/','/contact/','/what-is-nfc-card/','/delivery-and-payment/','/privacy/',...(mode==='preview'?[]:['/privacy/archive/nfc-card-privacy-v35/']),'/terms/','/warranty-and-returns/','/instagram-card/','/menu-card/',...(isPreview(config)?['/review/visual/','/review/drafts/','/review/media/','/review/states/']:[]),...catalog.map(p=>p.route),...Object.keys(LEGACY_ALIASES)];
const historical=JSON.parse(fs.readFileSync(path.join(root,'refinements/instagram-v18/routes.json'),'utf8')).filter(p=>!p.includes('/reviews/new')).map(p=>p==='/'?'/':p.replace(/\/$/,'')+'/');
const routes=new Map();
for(const locale of LOCALES)for(const route of baseRoutes)routes.set(publicPath(locale,route),{locale,route});
for(const route of historical){const locale=route.startsWith('/en/')?'en':route.startsWith('/pl/')?'pl':'uk',localRoute=locale==='uk'?route:route.slice(3)||'/';routes.set(BASE+route,{locale,route:localRoute});}
fs.mkdirSync(output,{recursive:true});const site=path.join(output,BASE);fs.mkdirSync(site,{recursive:true});
for(const file of fs.readdirSync(source))if(/\.(mjs|css)$/.test(file)&&file!=='build-config.mjs')fs.copyFileSync(path.join(source,file),path.join(site,file));
fs.writeFileSync(path.join(site,'build-config.mjs'),'// Public build configuration. No secrets.\nexport const BUILD_CONFIG=Object.freeze('+JSON.stringify(config).replaceAll('<','\\u003c')+');\n');
fs.cpSync(path.join(source,'legacy-v36'),path.join(site,'legacy-v36'),{recursive:true});
fs.cpSync(path.join(source,'assets'),path.join(site,'assets'),{recursive:true});
fs.copyFileSync(createRequire(import.meta.url).resolve('@google/model-viewer/dist/model-viewer.min.js'),path.join(site,'model-viewer.min.js'));
const indexable=[],htmlProof=[];
for(const [url,{locale,route}]of routes){
 const dest=path.join(output,url,'index.html'),html=renderStaticDocument(locale,route,{config});
 if(!isPreview(config)&&(/data-action="(?:fill-test-data|load-scenario)"|id="preview-fault"|href="[^"]*\/review\/|class="preview"/.test(html)))throw Error('Review UI leaked into public HTML '+url);
 fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,html);
 const meta=pageMetadata(locale,route,config);if(meta.robots.startsWith('index,')&&meta.canonical===PUBLIC_ORIGIN+url)indexable.push({url,locale,route,meta});
 htmlProof.push({url,bytes:Buffer.byteLength(html),sha256:createHash('sha256').update(html).digest('hex')});
}
const fallback=renderStaticDocument('uk','/404/',{config});fs.writeFileSync(path.join(site,'404.html'),fallback);fs.writeFileSync(path.join(output,'404.html'),fallback);
const robots=isPreview(config)?'User-agent: *\nDisallow: /\n':`User-agent: *\nAllow: /\nDisallow: ${BASE}/review/\nDisallow: ${BASE}/en/review/\nDisallow: ${BASE}/pl/review/\nSitemap: ${PUBLIC_ORIGIN}${BASE}/sitemap.xml\n`;
for(const dest of [output,site])fs.writeFileSync(path.join(dest,'robots.txt'),robots);
const xml='<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">'+indexable.map(({meta})=>`<url><loc>${meta.canonical}</loc>${meta.alternates.map(a=>`<xhtml:link rel="alternate" hreflang="${a.language}" href="${a.href}"/>`).join('')}</url>`).join('')+'</urlset>\n';
fs.writeFileSync(path.join(site,'sitemap.xml'),xml);fs.writeFileSync(path.join(output,'.nojekyll'),'');
const sourceFiles=[];function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else sourceFiles.push({path:path.relative(root,p),sha256:createHash('sha256').update(fs.readFileSync(p)).digest('hex'),bytes:fs.statSync(p).size});}}walk(source);
const record={mode,revision:'v36.2',publicationAuthorized:false,legalApproval:mode==='production'?'OWNER_ARTIFACT_HASH_BOUND':'B05_HOLD',fixtureOnly:mode==='production-fixture',intakeEnabled:{v1:!!config.v1Endpoint,v2:config.v2Enabled},localHTTPMustSendNoindexHeader:true,base:BASE,origin:PUBLIC_ORIGIN,routeCount:routes.size,routes:[...routes.keys()].sort(),sitemapRoutes:indexable.map(p=>p.url),legacyRoutesPreserved:historical.every(r=>routes.has(BASE+r)),fullSharedStaticBody:true,canonicalAliases:LEGACY_ALIASES,faqSchemaPolicy:FAQ_SCHEMA_POLICY,quoteSchemaPolicy:QUOTE_SCHEMA_POLICY,ownerPriceAmendment:{pricingRevision:OWNER_UA_PRICING_REVISION,sourcePriceRevision:OWNER_UA_SOURCE_REVISION,ordinaryBrandedUAPairMinor:360000,legacyReceiptProfileRetained:true},contractId:'NFC-CARD-V35-P4-02-CF-01',contractCoreSHA256:'1d347dbb26ee1f09b303eea0bb33a1b27a93131d6361acef720690ac23119f24',sourceFiles,htmlProof};
fs.writeFileSync(path.join(output,'BUILD_MANIFEST.json'),JSON.stringify(record,null,2)+'\n');console.log(JSON.stringify({output,routeCount:routes.size,sitemapCount:indexable.length,legacyRoutesPreserved:record.legacyRoutesPreserved,mode,publicationAuthorized:false}));
