// Exercise the published form payload against a loopback staging gateway only.
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {leadPayload} from '../src/pages.mjs';

const origin=process.env.NFC_STAGE_GATEWAY_ORIGIN;
const parsed=new URL(origin);
if(parsed.protocol!=='http:'||parsed.hostname!=='127.0.0.1'||parsed.pathname!=='/'||parsed.search||parsed.hash)throw Error('loopback_staging_only');
const endpoint=origin.replace(/\/$/,'')+'/v1/public/leads/nfc-card';
const payload=leadPayload({locale:'uk',variant:'standard',quantity:'2',name:'Synthetic Staging Buyer',
  phone:'+380 67 123 45 67',messenger:'viber',consent:true,website:''},
  {basePath:'/nfc-card-website',pathname:'/nfc-card-website/order'});
assert.equal(payload.contact.email,undefined);
const challenge=await fetch(endpoint+'/challenge?sourcePage='+encodeURIComponent(payload.sourcePage),
  {headers:{Origin:'https://optidigitalagent.github.io'}});
assert.equal(challenge.status,200);
const token=(await challenge.json()).challenge;
await new Promise(resolve=>setTimeout(resolve,2100));
const key=randomUUID(),headers={Origin:'https://optidigitalagent.github.io',
  'Content-Type':'application/json','Idempotency-Key':key};
const body=JSON.stringify({...payload,challenge:token,website:''});
const first=await fetch(endpoint,{method:'POST',headers,body});
const receipt=await first.json();
const replay=await fetch(endpoint,{method:'POST',headers,body});
const duplicate=await replay.json();
assert.equal(first.status,202);assert.equal(replay.status,202);
assert.equal(receipt.leadId,duplicate.leadId);
assert.equal(receipt.notificationStatus,'disabled');
console.log(JSON.stringify({status:first.status,leadId:receipt.leadId,
  duplicateSameId:true,notificationStatus:receipt.notificationStatus,
  emailPresent:false,channel:payload.contact.preferredMethod,
  formVersion:payload.formVersion,privacyNoticeVersion:payload.privacyNoticeVersion}));
