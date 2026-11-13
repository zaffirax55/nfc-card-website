import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {verifyDesignerProvenance} from '../tools/designer-provenance.mjs';
import {validateBuildConfig} from '../src/v36_2/release-policy.mjs';
const root=new URL('../',import.meta.url);
const recordPath='tools/nfc-primary-release-01-local-reconciliation.json';
const oldBinding='tools/nfc-ru-01-local-source.json';
const current=p=>readFileSync(new URL(p,root));
const previous=(tree,p)=>execFileSync('git',['show',tree+':'+p],{cwd:root,stdio:['ignore','pipe','pipe']});
const sha=b=>createHash('sha256').update(b).digest('hex');
const record=()=>JSON.parse(current(recordPath));
function verify(files={},options={}){return verifyDesignerProvenance({mode:'local-primary-release',readFile:p=>Object.hasOwn(files,p)?files[p]:current(p),readBaseline:previous,...options});}
function changed(change){const r=record();change(r);return {[recordPath]:Buffer.from(JSON.stringify(r))};}
test('primary provenance: positive exact candidate extends historical and local RU modes',()=>{
 const got=verify();assert.equal(got.mode,'local-primary-release');assert.equal(got.boundRenderers,7);assert.equal(got.boundReconciliation,5);assert.equal(got.publicationAuthority,false);assert.equal(got.reviewedInputTree,'5d4f7f8b3dbd5e565a18135f1f00eba1a6f5525f');
 for(const mode of ['baseline','local-ru'])assert.throws(()=>verify({},{mode}),/SHA256 mismatch/);
});
test('primary provenance: reviewed input anchor describes pre-binding input, never final candidate',()=>{
 assert.equal(record().reviewedInputTree,'5d4f7f8b3dbd5e565a18135f1f00eba1a6f5525f');
 assert.equal(record().priorRUTree,'98977a119e508663074939cd2320a94c91f8dea8');
 assert.equal(record().destination.controlOriginCommit,'ed9f207562c653a7732ceb2001a518e8073d9d6f');
});
test('primary provenance: missing, changed or reissued record cannot be authorized by the source manifest',()=>{
 assert.throws(()=>verify({},{readFile:p=>{if(p===recordPath)throw Error('record missing');return current(p);}}),/record missing/);
 assert.throws(()=>verify({[recordPath]:Buffer.concat([current(recordPath),Buffer.from('\n')])}),/record SHA256 mismatch/);
 assert.throws(()=>verify(changed(r=>r.files[0].reviewedSha256='0'.repeat(64))),/record SHA256 mismatch/);
});
test('primary provenance: wrong baseline, prior binding, destination and input anchor fail',()=>{
 for(const change of [r=>r.baselineCommit='0'.repeat(40),r=>r.priorRUTree='0'.repeat(40),r=>r.reviewedInputTree='0'.repeat(40),r=>r.priorRUBinding.sha256='0'.repeat(64),r=>r.destination.controlOriginCommit='0'.repeat(40)])assert.throws(()=>verify(changed(change)));
 assert.throws(()=>verify({},{readBaseline:(tree,p)=>tree===record().priorRUTree&&p==='src/v36_2/api-client.mjs'?Buffer.from('wrong preimage'):previous(tree,p)}),/Prior RU reconciliation bytes mismatch/);
 assert.throws(()=>verify({},{readBaseline:(tree,p)=>tree===record().baselineCommit&&p==='src/v36_2/app.mjs'?Buffer.from('wrong preimage'):previous(tree,p)}),/Pinned baseline renderer mismatch/);
});
test('primary provenance: extra, duplicate and missing paths fail closed',()=>{
 assert.throws(()=>verify(changed(r=>r.files.push({...r.files[0],path:'src/v36_2/anything.mjs'}))),/Unknown reconciliation path/);
 assert.throws(()=>verify(changed(r=>r.files.push({...r.files[0]}))),/Duplicate reconciliation path/);
 assert.throws(()=>verify(changed(r=>r.files.pop())),/Missing reconciliation path/);
 assert.throws(()=>verify(changed(r=>r.files[0].extra='unreviewed')));
});
for(const row of record().files)test('primary provenance: refreshed manifest cannot approve changed '+row.path,()=>{
 const altered=Buffer.concat([current(row.path),Buffer.from('\n// synthetic unreviewed byte\n')]);
 const manifest=JSON.parse(current('SOURCE_MANIFEST.json'));const entry=manifest.files.find(x=>x.path===row.path);
 if(entry){entry.bytes=altered.length;entry.sha256=sha(altered);}else manifest.files.push({path:row.path,bytes:altered.length,sha256:sha(altered)});
 assert.throws(()=>verify({[row.path]:altered,'SOURCE_MANIFEST.json':Buffer.from(JSON.stringify(manifest))}),/Reviewed reconciliation bytes mismatch/);
});
test('primary provenance: control module is traced as an addition, never a directory exemption',()=>{
 assert.equal(record().files.find(x=>x.path==='src/v36_2/control-context.mjs').priorRUSha256,null);
 assert.throws(()=>verify({},{readBaseline:(tree,p)=>tree===record().priorRUTree&&p==='src/v36_2/control-context.mjs'?current(p):previous(tree,p)}),/New reconciliation path must be absent/);
 const file='src/v36_2/editorial-view.mjs';assert.throws(()=>verify({[file]:Buffer.concat([current(file),Buffer.from('\n// altered\n')])}),/Reviewed RU renderer SHA256 mismatch/);
});
for(const p of ['designer/SOURCE_ORIGIN.json','release/PRODUCTION_ADAPTATIONS.json',oldBinding])test('primary provenance: immutable prior record remains independently bound '+p,()=>{
 assert.throws(()=>verify({[p]:Buffer.concat([current(p),Buffer.from('\n')])}),/SHA256 mismatch/);
});
test('primary provenance: unknown/PUBLIC modes and grants of publication authority fail',()=>{
 for(const mode of ['PUBLIC','production','local','local-primary'])assert.throws(()=>verify({},{mode}),/Unsupported designer provenance mode/);
 assert.throws(()=>verify(changed(r=>r.mode='PUBLIC')),/Unsupported reconciliation record mode/);
 assert.throws(()=>verify(changed(r=>r.publicationAuthority=true)),/no publication authority/);
 assert.throws(()=>validateBuildConfig({mode:'production',policy:record()}),/B05_owner_approved_policy_required/);
});
