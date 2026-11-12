import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const baseline = 'cd8967e5f3043cdc9dfc64210d6a6d9de20489ef';
const reviewedTree = 'd61ca0712436791ddbc9d83f6cbd2ca61002e16b';
const reviewedEvidence = '443a5ccc42ba6fb9769e91c26c4b237d27ca8b1657526f3b73d31b177dcf1e75';
const bindingPath = 'tools/nfc-ru-01-local-source.json';
const bindingHash = '82d9d2f536e92ac9c8923e6611490ada3cbee4a499b8481089174a43f2df98ce';
const reconciliationPath = 'tools/nfc-primary-release-01-local-reconciliation.json';
const reconciliationHash = '4a5d63e19ea8f1117a5bac53a3b1b5464f4d5859f6cdc910b4e6844c07735e0c';
const priorRUTree = '98977a119e508663074939cd2320a94c91f8dea8';
const reviewedInputTree = '5d4f7f8b3dbd5e565a18135f1f00eba1a6f5525f';
const reconciliationPaths = new Set([
 'scripts/build-public.mjs','scripts/release-identity.mjs',
 'src/v36_2/api-client.mjs','src/v36_2/app.mjs','src/v36_2/control-context.mjs'
]);
const rendererPaths = new Set([
 'src/v36_2/app.mjs',
 'src/v36_2/editorial-view.mjs',
 'src/v36_2/media.mjs',
 'src/v36_2/product-content-view.mjs',
 'src/v36_2/product-navigation.mjs',
 'src/v36_2/seo.mjs',
 'src/v36_2/static-render.mjs'
]);
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

function readHistoricalRecord(readFile, path, hash) {
 const bytes = readFile(path);
 assert.equal(sha256(bytes), hash, 'Historical provenance SHA256 mismatch: '+path);
 return JSON.parse(bytes);
}

function readLocalBinding(readFile) {
 const bytes = readFile(bindingPath);
 const record = JSON.parse(bytes);
 assert.deepEqual(Object.keys(record).sort(), [
  'baselineCommit','files','mode','publicationAuthority','reviewedCandidateTree',
  'reviewedEvidenceSha256','schemaVersion','task'
 ], 'Unexpected RU source binding fields');
 assert.equal(record.schemaVersion, 1);
 assert.equal(record.task, 'NFC-RU-01/FINALIZE-01');
 assert.equal(record.mode, 'LOCAL_UNCOMMITTED_CANDIDATE', 'Unsupported RU source binding mode');
 assert.equal(record.publicationAuthority, false, 'RU source binding must be local only');
 assert.equal(record.baselineCommit, baseline, 'RU source binding baseline mismatch');
 assert.equal(record.reviewedCandidateTree, reviewedTree, 'RU source binding tree mismatch');
 assert.equal(record.reviewedEvidenceSha256, reviewedEvidence, 'RU source binding evidence mismatch');
 assert.ok(Array.isArray(record.files), 'RU source binding files must be an array');
 const bindings = new Map();
 for (const row of record.files) {
  assert.deepEqual(Object.keys(row).sort(), ['baselineSha256','path','reviewedSha256']);
  assert.ok(rendererPaths.has(row.path), 'Unknown RU renderer path: '+row.path);
  assert.ok(!bindings.has(row.path), 'Duplicate RU renderer path: '+row.path);
  assert.match(row.baselineSha256, /^[a-f0-9]{64}$/);
  assert.match(row.reviewedSha256, /^[a-f0-9]{64}$/);
  bindings.set(row.path, row);
 }
 assert.equal(bindings.size, rendererPaths.size, 'Missing RU renderer binding');
 assert.equal(sha256(bytes), bindingHash, 'Reviewed RU source binding SHA256 mismatch');
 return bindings;
}

function readReconciliation(readFile,readBaseline,bindings) {
 const bytes = readFile(reconciliationPath);
 const r = JSON.parse(bytes);
 assert.deepEqual(Object.keys(r).sort(), [
  'baselineCommit','destination','files','mode','priorRUBinding','priorRUTree',
  'publicationAuthority','reviewId','reviewedInputEvidenceSha256','reviewedInputTree',
  'schemaVersion','task'
 ]);
 assert.equal(r.schemaVersion,1);
 assert.equal(r.task,'NFC-PRIMARY-RELEASE-01/FINALIZE-01');
 assert.equal(r.mode,'LOCAL_RECONCILIATION','Unsupported reconciliation record mode');
 assert.equal(r.publicationAuthority,false,'Reconciliation grants no publication authority');
 assert.equal(r.reviewId,'NFC-PRIMARY-RELEASE-01-INDEPENDENT-REVIEW-20261112');
 assert.equal(r.baselineCommit,baseline,'Reconciliation baseline mismatch');
 // This is the reviewed INPUT, never the final tree containing this new record.
 assert.equal(r.reviewedInputTree,reviewedInputTree,'Reconciliation reviewed input mismatch');
 assert.equal(r.reviewedInputEvidenceSha256,'a61cdabc14010e5327401be349fce7547d2c39fb6fee56dbda34cd285c5acdeb');
 assert.equal(r.priorRUTree,priorRUTree,'Reconciliation RU tree mismatch');
 assert.deepEqual(r.priorRUBinding,{path:bindingPath,sha256:bindingHash});
 assert.deepEqual(r.destination,{
  repository:'optidigitalagent/nfc-card-website',
  commit:'812f9c9515ce9afb001d0bdc0be9a180304d68df',
  controlOriginCommit:'ed9f207562c653a7732ceb2001a518e8073d9d6f'
 });
 assert.ok(Array.isArray(r.files),'Reconciliation files required');
 const entries = new Map();
 for(const row of r.files){
  assert.deepEqual(Object.keys(row).sort(),['path','priorRUSha256','reviewedSha256']);
  assert.ok(reconciliationPaths.has(row.path),'Unknown reconciliation path');
  assert.ok(!entries.has(row.path),'Duplicate reconciliation path');
  assert.ok(row.priorRUSha256===null||/^[a-f0-9]{64}$/.test(row.priorRUSha256));
  assert.match(row.reviewedSha256,/^[a-f0-9]{64}$/);
  entries.set(row.path,row);
 }
 assert.equal(entries.size,reconciliationPaths.size,'Missing reconciliation path');
 // Independent of SOURCE_MANIFEST: changing the record or refreshing that
 // manifest cannot authorize any different postimage/preimage or new path.
 assert.equal(sha256(bytes),reconciliationHash,'Reviewed reconciliation record SHA256 mismatch');
 for(const row of entries.values()){
  if(row.priorRUSha256===null){
   assert.throws(()=>readBaseline(priorRUTree,row.path),'New reconciliation path must be absent from prior RU tree');
  }else{
   assert.equal(sha256(readBaseline(priorRUTree,row.path)),row.priorRUSha256,'Prior RU reconciliation bytes mismatch: '+row.path);
  }
  const oldBinding = bindings.get(row.path);
  if(oldBinding)assert.equal(row.priorRUSha256,oldBinding.reviewedSha256,'Reconciliation must extend the exact RU binding');
  assert.equal(sha256(readFile(row.path)),row.reviewedSha256,'Reviewed reconciliation bytes mismatch: '+row.path);
 }
 return entries;
}

/** Explicit offline profiles retain history and bind only exact reviewed deltas. */
export function verifyDesignerProvenance({mode, readFile, readBaseline}) {
 assert.ok(['baseline','local-ru','local-primary-release'].includes(mode), 'Unsupported designer provenance mode');
 const origin = readHistoricalRecord(readFile, 'designer/SOURCE_ORIGIN.json',
  '8539e7ecc0568506b2b3c03d90b9a073e12ab057e8a6f05c0e4cef763812fdd9');
 const adaptations = readHistoricalRecord(readFile, 'release/PRODUCTION_ADAPTATIONS.json',
  '38918d4ce12254a4afb009694e7e47cfece93abcb149c352e10bc05666c48d9f');
 assert.equal(origin.archiveSHA256, 'b6621cd2620bf57270ed2b616bb0ab4cdb609dbbce999319dfc242883c168b35');
 const bindings = mode!=='baseline' ? readLocalBinding(readFile) : new Map();
 const reconciliation = mode==='local-primary-release' ? readReconciliation(readFile,readBaseline,bindings) : new Map();
 const verified = new Set();
 for (const row of origin.exactFiles) {
  const historical = adaptations.files.find(file=>file.path===row.path);
  if (historical) assert.equal(historical.archiveSHA256, row.sha256, row.path);
  const oldHash = historical?.releaseSHA256 ?? row.sha256;
  const binding = bindings.get(row.path);
  const actual = sha256(readFile(row.path));
  if (binding) {
   assert.equal(binding.baselineSha256, oldHash, 'Historical renderer binding mismatch: '+row.path);
   assert.equal(sha256(readBaseline(baseline,row.path)), oldHash, 'Pinned baseline renderer mismatch: '+row.path);
   assert.equal(actual, reconciliation.get(row.path)?.reviewedSha256??binding.reviewedSha256, 'Reviewed RU renderer SHA256 mismatch: '+row.path);
   verified.add(row.path);
  } else {
   if(reconciliation.has(row.path))assert.equal(reconciliation.get(row.path).priorRUSha256, oldHash, 'Historical designer preimage SHA256 mismatch: '+row.path);
   assert.equal(actual, reconciliation.get(row.path)?.reviewedSha256??oldHash, 'Historical designer source SHA256 mismatch: '+row.path);
  }
 }
 assert.equal(verified.size, bindings.size, 'RU renderer binding missing historical provenance');
 return {mode, checkedFiles:origin.exactFiles.length, boundRenderers:verified.size,boundReconciliation:reconciliation.size,...(reconciliation.size?{reviewedInputTree,publicationAuthority:false}:{})};
}
