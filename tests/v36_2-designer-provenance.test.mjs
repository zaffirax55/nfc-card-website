import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {verifyDesignerProvenance} from '../tools/designer-provenance.mjs';
import {validateBuildConfig} from '../src/v36_2/release-policy.mjs';

const root=new URL('../',import.meta.url);
const baseline='cd8967e5f3043cdc9dfc64210d6a6d9de20489ef';
const binding='tools/nfc-ru-01-local-source.json';
const renderer='src/v36_2/app.mjs';
// The retained local-RU profile is positively tested on its exact accepted tree.
// The reconciled filesystem has its own explicit profile and separate tests.
const current=file=>execFileSync('git',['show','98977a119e508663074939cd2320a94c91f8dea8:'+file],{cwd:root});
const historical=(commit,file)=>execFileSync('git',['show',commit+':'+file],{cwd:root});
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const record=()=>JSON.parse(current(binding));
const changedBinding=change=>{
 const copy=record();
 change(copy);
 return {[binding]:Buffer.from(JSON.stringify(copy))};
};
function verify(files={},options={}){
 return verifyDesignerProvenance({
  mode:'local-ru',
  readFile:file=>Object.hasOwn(files,file)?files[file]:current(file),
  readBaseline:historical,
  ...options
 });
}

test('designer provenance: historical baseline and reviewed local RU bytes are explicit modes',()=>{
 const before=verify({}, {mode:'baseline',readFile:file=>historical(baseline,file)});
 const local=verify();
 assert.equal(before.mode,'baseline');
 assert.equal(before.boundRenderers,0);
 assert.equal(local.mode,'local-ru');
 assert.equal(local.boundRenderers,7);
 assert.equal(local.checkedFiles,before.checkedFiles);
 assert.throws(()=>verify({},{mode:'baseline'}),/Historical designer source SHA256 mismatch/);
});

test('designer provenance: refreshed source manifest cannot authorize changed renderer bytes',()=>{
 const altered=Buffer.concat([current(renderer),Buffer.from('\n// synthetic provenance mutation\n')]);
 const manifest=JSON.parse(current('SOURCE_MANIFEST.json'));
 const entry=manifest.files.find(x=>x.path===renderer);
 entry.sha256=sha(altered);
 entry.bytes=altered.length;
 assert.equal(entry.sha256,sha(altered));
 assert.notEqual(entry.sha256,record().files.find(x=>x.path===renderer).reviewedSha256);
 assert.throws(()=>verify({[renderer]:altered,'SOURCE_MANIFEST.json':Buffer.from(JSON.stringify(manifest))}),
  /Reviewed RU renderer SHA256 mismatch: src\/v36_2\/app.mjs/);
});

test('designer provenance: wrong baseline commit and wrong baseline bytes fail',()=>{
 assert.throws(()=>verify(changedBinding(r=>r.baselineCommit='0'.repeat(40))),/baseline mismatch/);
 assert.throws(()=>verify({}, {readBaseline:(commit,file)=>file===renderer?Buffer.from('wrong baseline'):historical(commit,file)}),
  /Pinned baseline renderer mismatch/);
});

for (const key of ['baselineSha256','reviewedSha256']) {
 test('designer provenance: reissuing the record with a wrong '+key+' fails',()=>{
  assert.throws(()=>verify(changedBinding(r=>r.files[0][key]='0'.repeat(64))),/Reviewed RU source binding SHA256 mismatch/);
 });
}
test('designer provenance: missing record, missing entry, duplicate entry and extra path fail closed',()=>{
 assert.throws(()=>verify({}, {readFile:file=>{
  if(file===binding)throw new Error('Missing binding file');
  return current(file);
 }}),/Missing binding file/);
 assert.throws(()=>verify(changedBinding(r=>r.files.pop())),/Missing RU renderer binding/);
 assert.throws(()=>verify(changedBinding(r=>r.files.push({...r.files[0]}))),/Duplicate RU renderer path/);
 assert.throws(()=>verify(changedBinding(r=>r.files.push({...r.files[0],path:'src/v36_2/api-client.mjs'}))),/Unknown RU renderer path/);
});
for (const file of ['designer/SOURCE_ORIGIN.json','release/PRODUCTION_ADAPTATIONS.json']) {
 test('designer provenance: historical record is byte bound '+file,()=>{
  const altered=Buffer.concat([current(file),Buffer.from('\n')]);
  assert.throws(()=>verify({[file]:altered}),/Historical provenance SHA256 mismatch/);
 });
}
test('designer provenance: the local source binding grants no publication authority',()=>{
 assert.equal(record().publicationAuthority,false);
 assert.throws(()=>verify(changedBinding(r=>r.mode='PUBLIC')),/Unsupported RU source binding mode/);
 assert.throws(()=>verify(changedBinding(r=>r.publicationAuthority=true)),/must be local only/);
 assert.throws(()=>verify({}, {mode:'production'}),/Unsupported designer provenance mode/);
 assert.throws(()=>validateBuildConfig({mode:'production',policy:record()}),/B05_owner_approved_policy_required/);
});
