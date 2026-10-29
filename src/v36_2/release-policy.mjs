import {policyDigest} from './policy-digest.mjs';
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
 if(!leadEndpoint(config.v1Endpoint)||!leadEndpoint(config.v2Endpoint)||config.v2Enabled!==true)throw Error('production_public_endpoints_required');
 return config;
}
export function requestPolicy(config){
 if(isPreview(config))return {formVersion:'SYNTHETIC-NOT-APPROVED',privacyNoticeVersion:'SYNTHETIC-NOT-APPROVED'};
 validateBuildConfig(config);
 if(config.mode!=='production')throw Error('intake_disabled_pending_B05');
 return {formVersion:config.policy.formVersion,privacyNoticeVersion:config.policy.privacyNoticeVersion};
}
