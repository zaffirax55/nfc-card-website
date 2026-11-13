import {policyDigest,publicTextDigest} from './policy-digest.mjs';
// Only the separately recorded V37 and narrow V38 decisions are supported.
// Public digests identify approved artifacts; no private approval payload is bundled.
export const APPROVED_POLICY_PROFILES=Object.freeze({
 'NFC-CARD-FORM-V37':Object.freeze({privacyNoticeVersion:'NFC-CARD-PRIVACY-V37',approvalReference:'NFC-CARD-B05-DP03-OWNER-D1-D3-2026-10-28',policySha256:'d76bda8aff9b69e79731a2a536254e8c6e6b9d8b62faa986407f06e3e05806b4',publicTextSha256:'9a247e3320c0b1594374efd103b2e139d344b6b4eff26318c18f0dbe6ca2cb8f',sourceApprovalSha256:'a761169434cf3ff9fc4cc5b57be5ef4c03531e54ef16f29cd167b93f973286a7'}),
 'NFC-CARD-FORM-V38':Object.freeze({privacyNoticeVersion:'NFC-CARD-PRIVACY-V38',approvalReference:'NFC-CARD-SITE-ORDERS-OWNER-20261105',policySha256:'38e50676b7b5dc0149cb4f0bdbeb878d75add296da7274b4d509124f6c78c8e0',publicTextSha256:'93f3f4076208c624ee9c0933e7aa535b4e07b04c5065fb68f7ccb8a6f503c02e',sourceApprovalSha256:'44c639b4dbb9261447cbbfe21a059bd2168777340e24fe7ebd2ec1a400a0feb6'})
});
export const LEGACY_NOTICE_SHA256='1d3d572f307c709e6afc1011b08af8a51113b4c0f73d3e7fd2b0659adfe1fe3c';
import {leadEndpoint} from './legacy-v36/pages.mjs';
export const MODES=Object.freeze(['preview','production','production-fixture']);
export const isPreview=config=>config.mode==='preview';
export const isPublic=config=>config.mode==='production'||config.mode==='production-fixture';
export function validateBuildConfig(config){
 if(!config||!MODES.includes(config.mode))throw Error('explicit_build_mode_required');
 if(config.mode==='preview'){
  if(config.v2Endpoint!=='/v2/public/requests/nfc-card'||config.v1Endpoint!=='/v1/public/leads/nfc-card')throw Error('preview_must_remain_local');
  return config;
 }
 if(config.mode==='production-fixture'){
  if(config.v1Endpoint||config.v2Endpoint||config.v2Enabled||config.policy)throw Error('fixture_intake_must_be_disabled');
  return config;
 }
 const p=config.policy;
 if(!p||p.ownerApproved!==true||p.scope!=='NFC_CARD_V2_RICH_REQUEST'||typeof p.approvalReference!=='string'||p.approvalReference.trim().length<10||p.approvalReference.trim().length>1000||
  !/^[a-f0-9]{64}$/.test(p.policySha256||'')||!/^NFC-CARD-[A-Z0-9-]{3,100}$/.test(p.formVersion||'')||
  !/^NFC-CARD-[A-Z0-9-]{3,100}$/.test(p.privacyNoticeVersion||'')||/SYNTHETIC|PHASE3|PROPOSAL|NOT.APPROVED|DRAFT|FIXTURE/i.test(p.formVersion+p.privacyNoticeVersion)||
  p.legacyNoticeSha256!==LEGACY_NOTICE_SHA256||
  !p.checkbox||Object.keys(p.checkbox).sort().join(',')!=='en,pl,uk'||!p.sections||Object.keys(p.sections).sort().join(',')!=='en,pl,uk'||
  !['uk','en','pl'].every(l=>typeof p.checkbox?.[l]==='string'&&p.checkbox[l].trim()&&p.checkbox[l].length<=3000&&Array.isArray(p.sections?.[l])&&p.sections[l].length>=1&&p.sections[l].length<=100&&p.sections[l].every(s=>s&&Object.keys(s).sort().join(',')==='heading,text'&&typeof s.heading==='string'&&s.heading.trim()&&s.heading.length<=300&&typeof s.text==='string'&&s.text.trim()&&s.text.length<=20000)))throw Error('B05_owner_approved_policy_required');
 if(policyDigest(p)!==p.policySha256)throw Error('B05_policy_content_sha256_mismatch');
 const profile=APPROVED_POLICY_PROFILES[p.formVersion];
 if(Object.keys(p).sort().join(',')!=='approvalReference,checkbox,formVersion,legacyNoticeSha256,ownerApproved,policySha256,privacyNoticeVersion,publicTextSha256,scope,sections,sourceApprovalSha256'||!profile||Object.entries(profile).some(([k,v])=>p[k]!==v))throw Error('approved_policy_profile_binding_required');
 // V37 used its original public-text hash format. V38 explicitly binds canonical JSON.
 if(p.formVersion==='NFC-CARD-FORM-V38'&&publicTextDigest(p)!==p.publicTextSha256)throw Error('approved_public_text_binding_required');
 if(!leadEndpoint(config.v1Endpoint)||!leadEndpoint(config.v2Endpoint)||config.v2Enabled!==true)throw Error('production_public_endpoints_required');
 return config;
}
export function requestPolicy(config){
 if(isPreview(config))return {formVersion:'SYNTHETIC-NOT-APPROVED',privacyNoticeVersion:'SYNTHETIC-NOT-APPROVED'};
 validateBuildConfig(config);
 if(config.mode!=='production')throw Error('intake_disabled_pending_B05');
 return {formVersion:config.policy.formVersion,privacyNoticeVersion:config.policy.privacyNoticeVersion};
}
