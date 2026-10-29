import test from 'node:test';
import assert from 'node:assert/strict';
import {submitAttempt,createAttempt,setPreviewFault} from '../src/v36_2/api-client.mjs';
const wire={sourcePage:'/nfc-card-website/pl/services/design/?entry=branded-review-card',challenge:'INITIAL_NOT_SENT',kind:'free_design_concepts',language:'pl',lines:[]};
const reply=(status,data)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});
async function run(results){
 const real={fetch:globalThis.fetch,setTimeout:globalThis.setTimeout,clearTimeout:globalThis.clearTimeout,location:globalThis.location};let waits=0,token=0;const posts=[],challenges=[];
 globalThis.location={hostname:'127.0.0.1'};
 globalThis.setTimeout=(fn,ms)=>{if(ms===10000)return {deadline:true};waits++;queueMicrotask(fn);return {wait:true};};globalThis.clearTimeout=()=>{};
 globalThis.fetch=async(url,options={})=>{
  if(url.includes('/challenge?')){challenges.push(url);return reply(200,{challenge:'SIGNED_SYNTHETIC_CHALLENGE_'+(++token),minimumDelayMs:2000});}
  posts.push({headers:options.headers,body:JSON.parse(options.body)});const result=results.shift();if(result instanceof Error)throw result;return reply(result[0],result[1]);
 };
 try{const attempt=createAttempt(wire,'12345678-1234-4234-8234-123456789abc');const result=await submitAttempt(attempt);return {result,posts,challenges,waits,attempt};}
 finally{Object.assign(globalThis,real);}
}
test('known pre-persistence challenge rejection renews once with same key and frozen body',async()=>{
 const x=await run([[422,{ok:false,schemaVersion:2,code:'expired_or_early_challenge',retryable:true}],[202,{syntheticReceipt:true}]]);
 assert.equal(x.result.status,'success');assert.equal(x.posts.length,2);assert.equal(x.challenges.length,2);assert.equal(x.waits,2);
 assert.deepEqual(x.posts[0].headers,x.posts[1].headers);assert.notEqual(x.posts[0].body.challenge,x.posts[1].body.challenge);
 const strip=o=>{const c=structuredClone(o);delete c.challenge;return c;};assert.deepEqual(strip(x.posts[0].body),strip(x.posts[1].body));assert.deepEqual(x.attempt.body,wire);
});
test('repeated challenge rejection stops after one renewal',async()=>{
 const x=await run([[422,{ok:false,schemaVersion:2,code:'expired_or_early_challenge',retryable:true}],[422,{ok:false,schemaVersion:2,code:'expired_or_early_challenge',retryable:true}]]);
 assert.equal(x.result.status,'error');assert.equal(x.posts.length,2);assert.equal(x.result.retryable,true);assert.equal(x.result.challengeRejectedBeforeWrite,true);
});
for(const [label,status,body]of [
 ['unknown commit',503,{ok:false,schemaVersion:2,code:'outcome_unknown',retryable:true}],
 ['unavailable',503,{ok:false,schemaVersion:2,code:'unavailable',retryable:true}],
 ['other validation',422,{ok:false,schemaVersion:2,code:'invalid_contact',retryable:true}],
 ['server disallows retry',422,{ok:false,schemaVersion:2,code:'expired_or_early_challenge',retryable:false}],
 ['missing explicit permission',422,{ok:false,schemaVersion:2,code:'expired_or_early_challenge'}]
])test('never automatically resubmits '+label,async()=>{const x=await run([[status,body]]);assert.equal(x.posts.length,1);assert.equal(x.challenges.length,1);assert.notEqual(x.result.status,'success');});
test('transport failure is unknown and never automatically resubmitted',async()=>{const x=await run([new Error('controlled synthetic timeout')]);assert.equal(x.posts.length,1);assert.deepEqual(x.result,{status:'timeout',code:'outcome_unknown',retryable:true});});
test('unknown outcome after one known rejection stops without a third POST',async()=>{const x=await run([[422,{ok:false,schemaVersion:2,code:'expired_or_early_challenge',retryable:true}],[503,{ok:false,schemaVersion:2,code:'outcome_unknown',retryable:true}]]);assert.equal(x.posts.length,2);assert.equal(x.result.status,'timeout');});

for(const data of [{ok:true,schemaVersion:2,code:'expired_or_early_challenge',retryable:true},{ok:false,schemaVersion:3,code:'expired_or_early_challenge',retryable:true},{code:'expired_or_early_challenge',retryable:true}])test('malformed V2 error envelope never authorizes automatic renewal '+JSON.stringify(data),async()=>{const x=await run([[422,data]]);assert.equal(x.posts.length,1);});

test('a requested synthetic fault survives internal challenge renewal, then is consumed for explicit retry',async()=>{
 setPreviewFault('unavailable');
 const x=await run([[422,{ok:false,schemaVersion:2,code:'expired_or_early_challenge',retryable:true}],[503,{ok:false,schemaVersion:2,code:'unavailable',retryable:true}]]);
 assert.equal(x.posts.length,2);assert.equal(x.result.status,'timeout');assert.equal(x.posts[0].headers['X-NFC-Preview-Fault'],'unavailable');assert.equal(x.posts[1].headers['X-NFC-Preview-Fault'],'unavailable');
 const manual=await run([[202,{syntheticReceipt:true}]]);assert.equal(manual.posts.length,1);assert.equal(manual.posts[0].headers['X-NFC-Preview-Fault'],undefined);
});
