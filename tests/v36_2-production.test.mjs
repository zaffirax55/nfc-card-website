import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {validateBuildConfig} from '../src/v36_2/release-policy.mjs';
import {policyDigest} from '../src/v36_2/policy-digest.mjs';
import {renderStaticDocument} from '../src/v36_2/static-render.mjs';
import {currentEmailProposalPayload,emailProposalPayload} from '../src/v36_2/email-proposal.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const envelope=JSON.parse(fs.readFileSync(path.join(root,'release/nfc-card-v36-2-policy.json'),'utf8'));
const config={mode:'production',revision:'v36.2',...envelope,v2Enabled:true};
config.mode='production';
test('real owner DP03 hash and approval record are bound, not a guessed approval flag',()=>{
 assert.equal(policyDigest(config.policy),'d76bda8aff9b69e79731a2a536254e8c6e6b9d8b62faa986407f06e3e05806b4');
 assert.equal(config.policy.publicTextSha256,'9a247e3320c0b1594374efd103b2e139d344b6b4eff26318c18f0dbe6ca2cb8f');
 assert.equal(createHash('sha256').update(fs.readFileSync(path.join(root,'release/B05_OWNER_APPROVAL.json'))).digest('hex'),config.policy.sourceApprovalSha256);
 assert.equal(validateBuildConfig(config),config);
});
test('missing/stale/tampered consent cannot create a production config',()=>{
 for(const change of [p=>p.ownerApproved=false,p=>p.policySha256='0'.repeat(64),p=>p.checkbox.pl+=' altered',p=>p.sections.en[0].text+=' altered',p=>p.privacyNoticeVersion='SYNTHETIC-NOT-APPROVED']){
  const c=structuredClone(config);change(c.policy);assert.throws(()=>validateBuildConfig(c));
 }
 const c=structuredClone(config);c.v2Endpoint='http://127.0.0.1:4196/v2/public/requests/nfc-card';assert.throws(()=>validateBuildConfig(c));
});
for(const locale of ['uk','en','pl'])test(locale+' unified current policy contains exact approved sections, without old appended guarantee',()=>{
 const html=renderStaticDocument(locale,'/privacy/',{config});
 assert.equal((html.match(/<h1[ >]/g)||[]).length,1);assert.ok(html.includes('data-notice-version="NFC-CARD-PRIVACY-V37"'));
 assert.ok(!html.includes('id="legacy-privacy"'));assert.ok(!html.includes('Additional data in the new v2 cart is described in the section that follows'));
 const esc=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 for(const section of config.policy.sections[locale]){assert.equal(html.split('<h2>'+esc(section.heading)+'</h2>').length-1,1);assert.ok(html.includes(esc(section.text)));}
 assert.ok(html.includes('/privacy/archive/nfc-card-privacy-v35/'));assert.ok(!html.includes('noindex'));
});
for(const locale of ['uk','en','pl'])test(locale+' archived V35 is marked historical, noindex and reachable with equivalent locale',()=>{
 const html=renderStaticDocument(locale,'/privacy/archive/nfc-card-privacy-v35/',{config});assert.equal((html.match(/<h1[ >]/g)||[]).length,1);assert.ok(html.includes('data-historical-notice="NFC-CARD-PRIVACY-V35"'));assert.ok(html.includes('noindex'));
});
test('V36 email and legacy messenger retain identity while binding the actually displayed current notice',()=>{
 const common={locale:'uk',name:'Synthetic fixture',phone:'',variant:'branded',quantity:'2',messenger:'email',consent:true,website:'',proposalEmail:'Exact.Case+offer@example.invalid',proposalBusiness:'Synthetic dental',proposalNiche:'dental_orthodontics',proposalRequested:true};
 const context={basePath:'/nfc-card-website',pathname:'/nfc-card-website/solutions/branded-review-card'};
 const old=emailProposalPayload(common,context);assert.equal(old.formVersion,'NFC-CARD-FORM-V36');assert.equal(old.privacyNoticeVersion,'NFC-CARD-PRIVACY-V35');assert.equal(old.currentPolicySha256,undefined);
 const now=currentEmailProposalPayload(common,context,config);assert.equal(now.formVersion,old.formVersion);assert.equal(now.privacyNoticeVersion,'NFC-CARD-PRIVACY-V37');assert.equal(now.currentPolicySha256,config.policy.policySha256);assert.deepEqual(now.emailProposal,old.emailProposal);assert.equal(now.contact.email,common.proposalEmail);
 const generic=currentEmailProposalPayload({...common,messenger:'viber',phone:'+12025550123'},context,config);assert.equal(generic.formVersion,'NFC-CARD-FORM-V34');assert.equal(generic.emailProposal,undefined);assert.equal(generic.privacyNoticeVersion,'NFC-CARD-PRIVACY-V37');
});
test('root npm build produces new shop in exactly the existing Pages artifact layout',()=>{
 const p=spawnSync(process.execPath,['scripts/build-public.mjs'],{cwd:root,env:{...process.env,NFC_PUBLIC_ORIGIN:'https://optidigitalagent.github.io',NFC_PUBLICATION_MODE:'PUBLIC',GITHUB_SHA:'1'.repeat(40),NFC_RELEASE_COMMIT:'1'.repeat(40),NFC_REQUIRE_GATEWAY_READY:'false'},encoding:'utf8'});assert.equal(p.status,0,p.stderr);
 const html=fs.readFileSync(path.join(root,'site/index.html'),'utf8');assert.ok(html.includes('data-home-featured-product="beauty-review-card"'));assert.ok(!fs.existsSync(path.join(root,'site/nfc-card-website/index.html')));
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'site/BUILD_MANIFEST.json'),'utf8'));assert.equal(manifest.mode,'production');assert.equal(manifest.revision,'v36.2');assert.equal(manifest.routeCount,123);assert.equal(manifest.sitemapRoutes.length,93);
 const cfg=fs.readFileSync(path.join(root,'site/build-config.mjs'),'utf8');assert.ok(cfg.includes('"mode":"production"'));assert.ok(cfg.includes('lead-gateway-production-6c25.up.railway.app'));assert.ok(!cfg.includes('127.0.0.1'));
 const version=JSON.parse(fs.readFileSync(path.join(root,'site/DEPLOYED_VERSION.json'),'utf8'));assert.equal(version.commit,'1'.repeat(40));assert.equal(version.mode,'production');
});
