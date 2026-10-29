import test from 'node:test';import assert from 'node:assert/strict';
import {checkGatewayReady}from'../scripts/check-gateway-ready.mjs';
const policy={policySha256:'d76bda8aff9b69e79731a2a536254e8c6e6b9d8b62faa986407f06e3e05806b4',formVersion:'NFC-CARD-FORM-V37',privacyNoticeVersion:'NFC-CARD-PRIVACY-V37'};
const expected={gatewayCommit:'1'.repeat(40)},endpoint='https://lead-gateway-production-6c25.up.railway.app/v2/public/requests/nfc-card';
const ready={ok:true,apiVersion:2,service:'antonov-lead-gateway',mode:'approved-intake',gatewayCommit:expected.gatewayCommit,contractId:'NFC-CARD-V35-P4-02-CF-01',...policy,pricingRevision:{UA:'NFC-V35-V2-OWNER-20261027-UA',PL:'NFC-V35-V2-CANDIDATE-01-PL'}};
test('Pages gate performs only safe GET and verifies exact deployed gateway/consent/pricing',async()=>{
 const r=await checkGatewayReady({policy,expected,endpoint,fetcher:async(url,options)=>{assert.equal(url,endpoint+'/status');assert.equal(options.method,'GET');assert.equal(options.redirect,'error');return{ok:true,json:async()=>ready};}});assert.equal(r.status,'PASS');
});
test('missing commit, wrong host, disabled/schema failure, stale policy or different deployed SHA block publication',async()=>{
 await assert.rejects(checkGatewayReady({policy,expected:{},endpoint}),/pinned/);
 await assert.rejects(checkGatewayReady({policy,expected,endpoint:'https://example.com/v2'}),/existing_gateway/);
 await assert.rejects(checkGatewayReady({policy,expected,endpoint,fetcher:async()=>({ok:false,status:503})}),/503/);
 for(const patch of[{gatewayCommit:'2'.repeat(40)},{policySha256:'0'.repeat(64)},{mode:'synthetic-preview'},{privacyNoticeVersion:'NFC-CARD-PRIVACY-V35'},{pricingRevision:{UA:'old',PL:'old'}}])await assert.rejects(checkGatewayReady({policy,expected,endpoint,fetcher:async()=>({ok:true,json:async()=>({...ready,...patch})})}),/mismatch/);
});
