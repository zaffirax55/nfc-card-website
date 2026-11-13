import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createAttempt,submitAttempt,canonical} from '../src/v36_2/api-client.mjs';
const fixture=JSON.parse(fs.readFileSync(new URL('./fixtures/nfc-v35-client.json',import.meta.url))).positive[0];
const key='12345678-1234-4234-8234-123456789abc';
const control={token:['SYNTHETIC','CONTROL','VALUE'].join('_'),caseId:'SYNTHETIC_CASE',runId:'SYNTHETIC_RUN',nonce:key};
async function send(context,renew=false){
 const saved={fetch:globalThis.fetch,location:globalThis.location};const posts=[];let challenges=0;
 globalThis.location={hostname:'127.0.0.1'};
 globalThis.fetch=async(url,options={})=>{
  assert.ok(String(url).startsWith('/v2/public/requests/nfc-card'));
  if(String(url).includes('/challenge?'))return Response.json({challenge:'SYNTHETIC_CHALLENGE_'+(++challenges),minimumDelayMs:2000});
  assert.equal(options.method,'POST');posts.push({headers:options.headers,body:JSON.parse(options.body)});
  return posts.length===1&&renew?Response.json({ok:false,schemaVersion:2,code:'expired_or_early_challenge',retryable:true},{status:422}):Response.json({synthetic:true},{status:202});
 };
 try{const attempt=createAttempt(fixture.wire,key,context);const before=canonical(attempt);const result=await submitAttempt(attempt,{wait:async()=>{}});assert.equal(canonical(attempt),before);return {attempt,result,posts,challenges};}
 finally{Object.assign(globalThis,saved);}
}
test('ordinary intake has no control header and preserves the frozen receipt request',async()=>{
 const x=await send(null);assert.equal(x.result.status,'success');assert.equal(x.posts.length,1);assert.equal(x.posts[0].headers['X-NFC-Control-Context'],undefined);assert.equal(x.posts[0].headers['Idempotency-Key'],key);assert.deepEqual(x.attempt.body,fixture.wire);
});
test('control header survives a single explicit pre-write challenge renewal without changing idempotency or body',async()=>{
 const x=await send(control,true);assert.equal(x.result.status,'success');assert.equal(x.challenges,2);assert.equal(x.posts.length,2);
 for(const p of x.posts){assert.equal(p.headers['X-NFC-Control-Context'],control.token);assert.equal(p.headers['Idempotency-Key'],key);const b={...p.body,challenge:fixture.wire.challenge};assert.deepEqual(b,fixture.wire);}
 assert.deepEqual(x.posts[0].headers,x.posts[1].headers);
});
