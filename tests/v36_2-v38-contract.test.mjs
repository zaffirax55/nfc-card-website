import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadReleasePolicy,EFFECTIVE_POLICY_FILE} from '../scripts/release-policy-input.mjs';
import {checkGatewayReady} from '../scripts/check-gateway-ready.mjs';
import {validateBuildConfig,requestPolicy} from '../src/v36_2/release-policy.mjs';
import {policyDigest,publicTextDigest} from '../src/v36_2/policy-digest.mjs';
import {createAttempt,validReceipt,digest,toWire} from '../src/v36_2/api-client.mjs';
import {renderStaticDocument} from '../src/v36_2/static-render.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p)));
const envelope=loadReleasePolicy(root),config={mode:'production',...envelope,v2Enabled:true};
const old=read('release/nfc-card-v36-2-policy.json'),pin=read('release/gateway-release.json');
// One immutable recorded observation, not a new request or current-live claim.
const snapshot=read('tests/fixtures/nfc-v38-gateway-status.json');
const frozen=read('tests/fixtures/nfc-v35-client.json');
const policyFiles=['release/B05_OWNER_APPROVAL.json','release/nfc-card-v36-2-policy.json',EFFECTIVE_POLICY_FILE,'release/NFC_V38_PUBLIC_APPROVAL.json'];
function sandbox(change){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'nfc-v38-policy-'));try{for(const p of policyFiles){fs.mkdirSync(path.dirname(path.join(dir,p)),{recursive:true});fs.copyFileSync(path.join(root,p),path.join(dir,p));}change(dir);assert.throws(()=>loadReleasePolicy(dir));}finally{fs.rmSync(dir,{recursive:true,force:true});}}
function edit(dir,file,change){const p=path.join(dir,file),value=JSON.parse(fs.readFileSync(p));change(value);fs.writeFileSync(p,JSON.stringify(value));}

test('V38 effective policy binds exact body, public wording, narrow approval and previous V37',()=>{
 assert.equal(policyDigest(config.policy),'38e50676b7b5dc0149cb4f0bdbeb878d75add296da7274b4d509124f6c78c8e0');
 assert.equal(publicTextDigest(config.policy),'93f3f4076208c624ee9c0933e7aa535b4e07b04c5065fb68f7ccb8a6f503c02e');
 assert.equal(config.policy.sourceApprovalSha256,'44c639b4dbb9261447cbbfe21a059bd2168777340e24fe7ebd2ec1a400a0feb6');
 assert.deepEqual(config.policy.checkbox,old.policy.checkbox);
 for(const locale of ['uk','en','pl'])for(let i=0;i<10;i++)if(i!==4)assert.deepEqual(config.policy.sections[locale][i],old.policy.sections[locale][i]);
 assert.equal(validateBuildConfig(config),config);
 assert.deepEqual(requestPolicy(config),{formVersion:'NFC-CARD-FORM-V38',privacyNoticeVersion:'NFC-CARD-PRIVACY-V38'});
 assert.equal(pin.policyFile,EFFECTIVE_POLICY_FILE);assert.equal(pin.policySha256,config.policy.policySha256);
});
for(const file of policyFiles)test('missing bound artifact fails closed: '+file,()=>sandbox(dir=>fs.unlinkSync(path.join(dir,file))));
for(const [name,mutate]of Object.entries({
 'missing policy':v=>delete v.policy,
 'unapproved flag':v=>v.policy.ownerApproved=false,
 'changed body':v=>v.policy.sections.en[4].text+=' altered',
 'changed checkbox':v=>v.policy.checkbox.pl+=' altered',
 'wrong public hash':v=>v.policy.publicTextSha256='0'.repeat(64),
 'wrong raw approval source':v=>v.policy.sourceApprovalSha256='0'.repeat(64),
 'missing raw approval source':v=>delete v.policy.sourceApprovalSha256,
 'wrong approval decision':v=>v.policy.approvalReference='NOT-AN-OWNER-DECISION',
 'unsupported profile with recomputed body':v=>{v.policy.formVersion='NFC-CARD-FORM-V39';v.policy.privacyNoticeVersion='NFC-CARD-PRIVACY-V39';v.policy.policySha256=policyDigest(v.policy);},
 'wrong privacy version':v=>v.policy.privacyNoticeVersion='NFC-CARD-PRIVACY-V37',
 'unrecognized policy field':v=>v.policy.unapproved=true,
 'envelope mode override':v=>v.mode='preview'
}))test('policy rejects '+name,()=>sandbox(dir=>edit(dir,EFFECTIVE_POLICY_FILE,mutate)));
for(const file of ['release/B05_OWNER_APPROVAL.json','release/NFC_V38_PUBLIC_APPROVAL.json'])test('raw artifact tampering rejected: '+file,()=>sandbox(dir=>fs.appendFileSync(path.join(dir,file),' ')));
test('unsupported arbitrary production ownerApproved policy fails',()=>{const c=structuredClone(config);c.policy.formVersion='NFC-CARD-FORM-V99';c.policy.privacyNoticeVersion='NFC-CARD-PRIVACY-V99';c.policy.policySha256=policyDigest(c.policy);assert.throws(()=>validateBuildConfig(c),/profile/);});
for(const locale of ['uk','en','pl'])test(locale+' current displayed V38 notice and request consent agree; V37 rendering preserved',()=>{
 const html=renderStaticDocument(locale,'/privacy/',{config});assert.ok(html.includes('data-notice-version="NFC-CARD-PRIVACY-V38"'));
 for(const s of config.policy.sections[locale])assert.ok(html.includes(s.text.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))));
 assert.ok(renderStaticDocument(locale,'/privacy/',{config:{mode:'production',...old,v2Enabled:true}}).includes('data-notice-version="NFC-CARD-PRIVACY-V37"'));
 const ui={intent:'quantity_advice',locale,contact:{name:'Synthetic V38',email:'synthetic@example.invalid',preferredMethod:'email'},consent:{requestProcessing:true},lines:[]};
 assert.deepEqual(toWire(ui,'/nfc-card-website/'+(locale==='uk'?'':locale+'/')+'contact/',config).consent,{requestProcessing:true,formVersion:'NFC-CARD-FORM-V38',privacyNoticeVersion:'NFC-CARD-PRIVACY-V38'});
});
const ready=value=>checkGatewayReady({policy:config.policy,expected:pin,endpoint:envelope.v2Endpoint,fetcher:async(url,options)=>{
 assert.equal(url,envelope.v2Endpoint+'/status');assert.equal(options.method,'GET');assert.equal(options.redirect,'error');assert.deepEqual(options.headers,{Accept:'application/json',Origin:'https://optidigitalagent.github.io'});return {ok:true,json:async()=>value};
}});
test('all 11 comparisons match the recorded V38 observation offline',async()=>assert.equal((await ready(snapshot)).status,'PASS'));
test('old tuple and repin-only remain blocked',async()=>{
 for(const expected of [{gatewayCommit:'73072817fa337b0f1530a63cd2ef73e70853c0ab'},pin])await assert.rejects(checkGatewayReady({policy:old.policy,expected,endpoint:envelope.v2Endpoint,fetcher:async()=>({ok:true,json:async()=>snapshot})}),/mismatch/);
});
const fields=['ok','apiVersion','mode','service','gatewayCommit','contractId','policySha256','formVersion','privacyNoticeVersion','pricingRevision.UA','pricingRevision.PL'];
for(const field of fields)for(const kind of ['wrong','missing','type'])test('gateway '+field+' '+kind+' fails closed',async()=>{
 const v=structuredClone(snapshot),parts=field.split('.'),obj=parts.length===2?v[parts[0]]:v,key=parts.at(-1);
 if(kind==='missing')delete obj[key];else if(kind==='type')obj[key]=typeof obj[key]==='string'?17:String(obj[key]);else obj[key]=typeof obj[key]==='boolean'?false:typeof obj[key]==='number'?3:'WRONG';
 await assert.rejects(ready(v),/mismatch/);
});

async function receiptFor(version='SYNTHETIC-NOT-APPROVED'){
 const f=frozen.positive[0],wire=structuredClone(f.wire);
 if(version!=='SYNTHETIC-NOT-APPROVED')wire.consent={requestProcessing:true,formVersion:'NFC-CARD-FORM-'+version,privacyNoticeVersion:'NFC-CARD-PRIVACY-'+version};
 const attempt=createAttempt(wire,f.idempotencyKey),receipt={...structuredClone(f.receipt),acceptedRequest:structuredClone(attempt.normalized),requestDigest:{profile:'NFC-V35-CJSON-1',sha256:await digest(attempt.normalized)}};
 return {attempt,receipt};
}
for(const version of ['SYNTHETIC-NOT-APPROVED','V37','V38'])for(const status of ['disabled','queued'])test(version+' exact receipt accepts '+status+' without a V38-only previousPolicy restriction',async()=>{const {attempt,receipt}=await receiptFor(version);receipt.notificationStatus=status;assert.equal(await validReceipt(attempt,receipt),true);});
for(const status of [undefined,null,true,0,{},[],'sent','delivered','QUEUED',''])test('reject missing/unknown/wrong-type notificationStatus '+JSON.stringify(status),async()=>{const {attempt,receipt}=await receiptFor('V38');if(status===undefined)delete receipt.notificationStatus;else receipt.notificationStatus=status;assert.equal(await validReceipt(attempt,receipt),false);});
for(const [name,change]of Object.entries({
 amount:r=>r.quote.totalMinor=1,market:r=>r.quote.market='PL',currency:r=>r.quote.currency='PLN',revision:r=>r.quote.pricingRevision='UNKNOWN',source:r=>r.source='OTHER',schema:r=>r.schemaVersion=1,
 identity:r=>r.acceptedRequest.customerName='Changed',sourcePage:r=>r.acceptedRequest.sourcePage='/other/',consent:r=>r.acceptedRequest.consent.formVersion='NFC-CARD-FORM-V37',digest:r=>r.requestDigest.sha256='0'.repeat(64),digestProfile:r=>r.requestDigest.profile='OTHER',durable:r=>r.durableSaved=false,timestamp:r=>r.acceptedAt='bad',requestId:r=>r.requestId='bad',quoteId:r=>r.quote.quoteId='bad',extra:r=>r.unapproved=true,extraQuote:r=>r.quote.unapproved=true
}))test('queued still rejects tampered '+name,async()=>{const {attempt,receipt}=await receiptFor('V38');receipt.notificationStatus='queued';change(receipt);assert.equal(await validReceipt(attempt,receipt),false);});
