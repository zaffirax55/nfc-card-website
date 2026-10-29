import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {catalog,priceCart,pricingProfile,pricingRevision,OWNER_UA_PRICING_REVISION,OWNER_UA_SOURCE_REVISION} from '../src/v36_2/commerce.mjs';
import {createAttempt,validReceipt} from '../src/v36_2/api-client.mjs';

const fixtures=JSON.parse(fs.readFileSync(new URL('./fixtures/nfc-v35-client.json',import.meta.url)));
const oldUA='NFC-V35-V2-CANDIDATE-01-UA';
const ownerReceipt=original=>{
 const r=structuredClone(original),q=r.quote;if(q.market!=='UA')return r;
 q.pricingRevision=OWNER_UA_PRICING_REVISION;q.sourcePriceRevisions.push(OWNER_UA_SOURCE_REVISION);
 let delta=0;
 for(const group of q.groups){group.pricingRevision=q.pricingRevision;if(group.entryId==='branded-review-card'&&group.quantity===2){group.amountMinor=360000;delta=100000;}}
 for(const key of ['knownSubtotalMinor','totalMinor','grandTotalMinor'])if(q[key]!==null)q[key]+=delta;
 return r;
};

test('owner pair clarification changes only ordinary UA Branded two-card price',()=>{
 const expected={
  'review-card':{UA:[1500,2600],PL:[129,219]},
  'branded-review-card':{UA:[2000,3600],PL:[169,299]},
  'nfc-instagram-card':{UA:[1500,2600],PL:[129,219]},
  'beauty-review-card':{UA:[800,1400],PL:[null,null]},
  'branded-beauty-review-card':{UA:[800,1600],PL:[null,null]},
  'restaurant-review-card':{UA:[null,null],PL:[null,null]},
  'branded-restaurant-review-card':{UA:[null,null],PL:[null,null]},
 };
 for(const [productId,markets]of Object.entries(expected))for(const [market,prices]of Object.entries(markets))for(const [i,amount]of prices.entries())assert.equal(priceCart([{lineId:'line',productId,quantity:i+1}],market).total,amount,productId+market+(i+1));
 assert.equal(catalog.filter(p=>p.status==='active').length,9);assert.equal(catalog.filter(p=>p.status==='draft').length,2);
 assert.equal(priceCart([{lineId:'one',productId:'branded-review-card',quantity:1},{lineId:'two',productId:'branded-review-card',quantity:1}],'UA').total,3600);
 assert.equal(priceCart([{lineId:'one',productId:'branded-review-card',quantity:1},{lineId:'two',productId:'branded-review-card',quantity:1}],'UA',oldUA).total,2600);
 assert.equal(priceCart([{lineId:'one',productId:'branded-review-card',quantity:2}],'UA',oldUA).groups[0].pricingRevision,'NFC-CARD-CONTENT-TRUTH-PRICE-v33');
});

test('known profile selection is immutable, market-bound and fails closed',()=>{
 assert.equal(pricingRevision('UA'),OWNER_UA_PRICING_REVISION);assert.equal(pricingRevision('PL'),'NFC-V35-V2-CANDIDATE-01-PL');
 assert(Object.isFrozen(pricingProfile('UA')));assert(Object.isFrozen(pricingProfile('UA').sourcePriceRevisions));
 for(const revision of ['unknown','__proto__','NFC-V35-V2-CANDIDATE-01-PL',null,{}])assert.throws(()=>pricingProfile('UA',revision),RangeError);
 assert.throws(()=>pricingProfile('PL',OWNER_UA_PRICING_REVISION),RangeError);
 assert.equal(priceCart([], 'XX').kind,'invalid');
});

test('all82 retained receipts and all amended UA receipts validate without changing request identity',async()=>{
 assert.equal(fixtures.positive.length,82);
 for(const example of fixtures.positive){
  const attempt=createAttempt(example.wire,example.idempotencyKey);
  assert.equal(await validReceipt(attempt,example.receipt),true,'retained '+example.id);
  const amended=ownerReceipt(example.receipt);
  assert.equal(await validReceipt(attempt,amended),true,'owner '+example.id);
  assert.deepEqual(amended.acceptedRequest,example.receipt.acceptedRequest);assert.deepEqual(amended.requestDigest,example.receipt.requestDigest);
 }
});

test('relabel-only, price, source, unknown and wrong-market receipt mutations are rejected',async()=>{
 const example=fixtures.positive.find(e=>e.id==='uk_branded-review-card'),attempt=createAttempt(example.wire,example.idempotencyKey),fresh=ownerReceipt(example.receipt);
 const mutations=[
  r=>{r.quote.pricingRevision=oldUA;},
  r=>{r.quote.totalMinor=260000;},
  r=>{r.quote.groups[0].amountMinor=260000;},
  r=>{r.quote.sourcePriceRevisions.pop();},
  r=>{r.quote.groups[0].pricingRevision=oldUA;},
  r=>{r.quote.pricingRevision='future-owner-UA';},
  r=>{r.quote.pricingRevision='NFC-V35-V2-CANDIDATE-01-PL';},
 ];
 for(const mutate of mutations){const r=structuredClone(fresh);mutate(r);assert.equal(await validReceipt(attempt,r),false);}
 const relabel=structuredClone(example.receipt);relabel.quote.pricingRevision=OWNER_UA_PRICING_REVISION;for(const g of relabel.quote.groups)g.pricingRevision=OWNER_UA_PRICING_REVISION;relabel.quote.sourcePriceRevisions.push(OWNER_UA_SOURCE_REVISION);assert.equal(await validReceipt(attempt,relabel),false);
});
