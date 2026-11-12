import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const baseline = 'cd8967e5f3043cdc9dfc64210d6a6d9de20489ef';
const reviewedTree = 'd61ca0712436791ddbc9d83f6cbd2ca61002e16b';
const reviewedEvidence = '443a5ccc42ba6fb9769e91c26c4b237d27ca8b1657526f3b73d31b177dcf1e75';
const bindingPath = 'tools/nfc-ru-01-local-source.json';
const bindingHash = '82d9d2f536e92ac9c8923e6611490ada3cbee4a499b8481089174a43f2df98ce';
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

/** Verify historical designer bytes or the exact local RU overlay for offline QA. */
export function verifyDesignerProvenance({mode, readFile, readBaseline}) {
 assert.ok(mode==='baseline'||mode==='local-ru', 'Unsupported designer provenance mode');
 const origin = readHistoricalRecord(readFile, 'designer/SOURCE_ORIGIN.json',
  '8539e7ecc0568506b2b3c03d90b9a073e12ab057e8a6f05c0e4cef763812fdd9');
 const adaptations = readHistoricalRecord(readFile, 'release/PRODUCTION_ADAPTATIONS.json',
  '38918d4ce12254a4afb009694e7e47cfece93abcb149c352e10bc05666c48d9f');
 assert.equal(origin.archiveSHA256, 'b6621cd2620bf57270ed2b616bb0ab4cdb609dbbce999319dfc242883c168b35');
 const bindings = mode==='local-ru' ? readLocalBinding(readFile) : new Map();
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
   assert.equal(actual, binding.reviewedSha256, 'Reviewed RU renderer SHA256 mismatch: '+row.path);
   verified.add(row.path);
  } else {
   assert.equal(actual, oldHash, 'Historical designer source SHA256 mismatch: '+row.path);
  }
 }
 assert.equal(verified.size, bindings.size, 'RU renderer binding missing historical provenance');
 return {mode, checkedFiles:origin.exactFiles.length, boundRenderers:verified.size};
}
