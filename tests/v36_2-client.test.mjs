import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {canonical,digest,expectedNormalized,toWire,createAttempt,validReceipt,makeRecoveryMarker,parseRecoveryMarker} from '../src/v36_2/api-client.mjs';
import {catalog,priceCart} from '../src/v36_2/commerce.mjs';
// Frozen examples are copied into the frontend test fixture for an independent checkout.
const fixture=JSON.parse(fs.readFileSync(new URL('./fixtures/nfc-v35-client.json',import.meta.url),'utf8'));
function uiFromWire(w){const unpack=c=>({destination:c.menuUrl||c.googleLocationUrl||c.instagramUrl||'',notes:c.notes||'',...c.brandInputs,...(c.designSplitNote?{designSplitNote:c.designSplitNote}:{}),...(c.menuStatus?{menuStatus:c.menuStatus}:{})});return {intent:w.kind,locale:w.language,contact:{name:w.customerName,...w.contact,messenger:w.contact.telegram||''},consent:{requestProcessing:true},lines:w.lines.map(l=>({lineId:l.lineId,productId:l.entryId,quantity:l.quantity,...(l.variantId?{variantId:l.variantId}:{}),...unpack(l.configuration)})),serviceNotes:w.serviceNotes||'',serviceContext:w.serviceContext?{entryId:w.serviceContext.entryId}:null,serviceConfiguration:w.serviceContext?unpack(w.serviceContext.configuration):{}};}
for(const example of fixture.positive){
 test(example.id+' browser wire/normalized/digest/full receipt',async()=>{
  assert.deepEqual(expectedNormalized(example.wire),example.normalized);
  assert.equal(canonical(example.normalized),example.canonicalUtf8);
  assert.equal(await digest(example.normalized),example.digestSha256);
  const wire=toWire(uiFromWire(example.wire),example.wire.sourcePage);
  assert.deepEqual(wire,example.wire);
  const attempt=createAttempt(wire,example.idempotencyKey);
  assert.equal(await validReceipt(attempt,example.receipt),true);
  const tampered=structuredClone(example.receipt);tampered.acceptedRequest.customerName='Different';
  assert.equal(await validReceipt(attempt,tampered),false);
  const quoteTampered=structuredClone(example.receipt);quoteTampered.quote.totalMinor=1;
  assert.equal(await validReceipt(attempt,quoteTampered),false);
 });
}
test('opaque recovery marker contains no PII/body and rejects extra keys',()=>{const a=createAttempt(fixture.positive[0].wire);const marker=makeRecoveryMarker(a);assert.deepEqual(Object.keys(marker).sort(),['attemptId','state','version']);assert.deepEqual(parseRecoveryMarker(JSON.stringify(marker)),marker);assert.equal(parseRecoveryMarker(JSON.stringify({...marker,body:a.body})),null);assert.equal(parseRecoveryMarker('invalid'),null);assert.equal(parseRecoveryMarker(JSON.stringify({...marker,attemptId:'bad'})),null);});
test('attempt immutable snapshot does not change when UI wire mutates',()=>{const wire=structuredClone(fixture.positive[0].wire),a=createAttempt(wire);wire.customerName='Changed';assert.equal(a.body.customerName,'Synthetic Fixture');assert.ok(Object.isFrozen(a.body.lines));});
test('same offer for separate destinations retains bundle and all Menu variants tier together',()=>{const q=priceCart([{lineId:'a',productId:'review-card',quantity:1},{lineId:'b',productId:'review-card',quantity:1}],'UA');assert.equal(q.total,2600);assert.deepEqual(q.groups[0].lineIds,['a','b']);assert.equal(catalog.filter(p=>p.status==='active').length,9);assert.equal(catalog.filter(p=>p.status==='draft').length,2);});
test('source contract maps exact Branded niche, not generic identity',()=>{for(const eid of ['branded-beauty-review-card','branded-restaurant-review-card']){const ui=uiFromWire(fixture.positive.find(e=>e.id==='uk_design_'+eid).wire);const w=toWire(ui,'/nfc-card-website/contact/');assert.equal(w.serviceContext.entryId,eid);assert.equal(w.serviceContext.productId,'nfc-review-card-mini');assert.equal(w.serviceContext.offerId,'branded');assert.equal(w.lines.length,0);}});
