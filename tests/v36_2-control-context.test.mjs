import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createAttempt,validReceipt} from '../src/v36_2/api-client.mjs';
import {parseControlGrant,loadControlContext,clearControlContext,annotateControlWire} from '../src/v36_2/control-context.mjs';
const fixture=JSON.parse(fs.readFileSync(new URL('./fixtures/nfc-v35-client.json',import.meta.url)));
test('an intact receipt from the enabled ORDERS route is accepted as queued',async()=>{
 const x=fixture.positive[0],r=structuredClone(x.receipt);r.notificationStatus='queued';
 assert.equal(await validReceipt(createAttempt(x.wire,x.idempotencyKey),r),true);
});
const run='NFC-E2E-20261106T113357Z-69d56f61',nonce='12345678-1234-4234-8234-123456789abc';
const grant=Buffer.from(JSON.stringify({version:1,runId:run,caseId:run+'-WEB-BRAND',nonce,expiresAt:1794074400000})).toString('base64url')+'.'+'A'.repeat(43);
test('opaque grant removed from URL, stored without PII, recovered with same idempotency nonce',()=>{
 const data=new Map(),storage={setItem:(k,v)=>data.set(k,v),getItem:k=>data.get(k),removeItem:k=>data.delete(k)};
 const location={hash:'#nfc-control='+grant,pathname:'/nfc-card-website/order/',search:''};let target;
 const context=loadControlContext(location,storage,{replaceState:(_state,_title,url)=>target=url});
 assert.equal(target,location.pathname);assert.equal(context.nonce,nonce);assert.equal(context.caseId,run+'-WEB-BRAND');
 assert.equal([...data.values()][0],grant);assert.equal(loadControlContext({...location,hash:''},storage,{}).nonce,nonce);
 const normal=createAttempt(fixture.positive[0].wire,nonce),control=createAttempt(fixture.positive[0].wire,nonce,context);
 assert.deepEqual(control.body,normal.body);assert.deepEqual(control.normalized,normal.normalized);
 assert.equal(control.control.token,grant);assert.throws(()=>createAttempt(normal.body,crypto.randomUUID(),context));
 const noted=annotateControlWire(normal.body,context);
 assert.ok(noted.lines.every(line=>line.configuration.notes.includes(context.caseId)&&line.configuration.notes.includes('ТЕСТ — НЕ ИЗГОТАВЛИВАТЬ')));
 assert.equal(noted.customerName,normal.body.customerName);assert.equal(noted.lines[0].quantity,normal.body.lines[0].quantity);
 assert.deepEqual(annotateControlWire(normal.body,null),normal.body);
 clearControlContext(storage);assert.equal(data.size,0);
});
test('unknown/malformed context blocks a requested control attempt and does not affect ordinary storage-disabled visitors',()=>{
 assert.equal(parseControlGrant('not-a-grant'),null);
 assert.deepEqual(loadControlContext({hash:'#nfc-control=bad',pathname:'/order/',search:''},{removeItem(){}},{replaceState(){}}),{invalid:true});
 const denied={getItem(){throw Error('storage denied');},setItem(){throw Error('storage denied');}};
 assert.equal(loadControlContext({hash:'',pathname:'/order/'},denied,{}),null);
 assert.deepEqual(loadControlContext({hash:'#nfc-control='+grant,pathname:'/order/',search:''},denied,{replaceState(){}}),{invalid:true});
 assert.throws(()=>createAttempt(fixture.positive[0].wire,nonce,{invalid:true}));
});
