import test from 'node:test';
import assert from 'node:assert/strict';
import {releaseIdentity} from '../scripts/release-identity.mjs';
const source='a'.repeat(40),publisher='b'.repeat(40);
test('checked-out storefront wins over distinct publisher GITHUB_SHA',()=>{
 assert.deepEqual(releaseIdentity({head:source,env:{GITHUB_SHA:publisher,NFC_RELEASE_COMMIT:source,NFC_PUBLISHER_WORKFLOW_COMMIT:publisher}}),{commit:source,publisherWorkflowCommit:publisher});
});
test('wrong release commit fails instead of relabelling the checkout',()=>{
 assert.throws(()=>releaseIdentity({head:source,env:{NFC_RELEASE_COMMIT:publisher}}),/checkout_mismatch/);
});
test('wrong publisher identity and non-commit input fail closed',()=>{
 assert.throws(()=>releaseIdentity({head:source,env:{GITHUB_SHA:source,NFC_PUBLISHER_WORKFLOW_COMMIT:publisher}}),/workflow_identity_mismatch/);
 for(const head of [null,'main','98977a1',''])assert.throws(()=>releaseIdentity({head,env:{}}),/exact_storefront/);
});
test('local production identity still uses the checkout without a publisher label',()=>{
 assert.deepEqual(releaseIdentity({head:source,env:{GITHUB_SHA:publisher}}),{commit:source,publisherWorkflowCommit:null});
});
