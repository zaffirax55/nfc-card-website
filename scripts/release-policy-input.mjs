// Effective frontend policy selector. Historical V37/B05 bytes remain immutable.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {validateBuildConfig} from '../src/v36_2/release-policy.mjs';
export const EFFECTIVE_POLICY_FILE='release/nfc-card-v38-orders-policy.json';
const digest=b=>createHash('sha256').update(b).digest('hex');
const OLD_APPROVAL='a761169434cf3ff9fc4cc5b57be5ef4c03531e54ef16f29cd167b93f973286a7';
export const PUBLIC_APPROVAL_SHA256='bb4f8393c6eaafa657c35087583778d194252f0f13e1d560aea1ba68248142f2';
export function loadReleasePolicy(root){
 const read=p=>fs.readFileSync(path.join(root,p));
 const oldOwnerRaw=read('release/B05_OWNER_APPROVAL.json'),oldOwner=JSON.parse(oldOwnerRaw),previous=JSON.parse(read('release/nfc-card-v36-2-policy.json'));
 const input=JSON.parse(read(EFFECTIVE_POLICY_FILE)),raw=read('release/NFC_V38_PUBLIC_APPROVAL.json'),record=JSON.parse(raw),p=input.policy;
 if(Object.keys(input).sort().join(',')!=='policy,revision,v1Endpoint,v2Endpoint'||input.revision!=='v36.2')throw Error('owner_approval_artifact_binding_required');
 validateBuildConfig({mode:'production',...previous,v2Enabled:true});
 validateBuildConfig({mode:'production',...input,v2Enabled:true});
 if(digest(oldOwnerRaw)!==OLD_APPROVAL||oldOwner.policyBodySHA256!==previous.policy.policySha256||oldOwner.publicTextSHA256!==previous.policy.publicTextSha256||previous.policy.sourceApprovalSha256!==OLD_APPROVAL||oldOwner.decisionId!==previous.policy.approvalReference||
  digest(raw)!==PUBLIC_APPROVAL_SHA256||record.decisionId!==p.approvalReference||record.previousPolicySHA256!==previous.policy.policySha256||record.policyBodySHA256!==p.policySha256||record.publicTextSHA256!==p.publicTextSha256||record.source.rawSHA256!==p.sourceApprovalSha256||
  p.formVersion!=='NFC-CARD-FORM-V38'||record.source.commit!=='21d42592fab7b117edc471f6494a9a8f8f1b0ddb'||record.source.gitBlob!=='f972cc53c61e2981e8f8934a929dc5c04772e3be'||record.policySource.gitBlob!=='a53f29a2567385662cb57b1c3a0714df6bae4deb'||
  input.v1Endpoint!==previous.v1Endpoint||input.v2Endpoint!==previous.v2Endpoint)throw Error('owner_approval_artifact_binding_required');
 return input;
}
