/** Technical policy/copy binding only. Legal content and approval come from the owner. */
import { createHash } from 'node:crypto';
export const LEGACY_NOTICE_SHA256='1d3d572f307c709e6afc1011b08af8a51113b4c0f73d3e7fd2b0659adfe1fe3c';
export type ConsentProfile=Readonly<{formVersion:string;privacyNoticeVersion:string}>;
export type PolicyBody=ConsentProfile&Readonly<{scope:'NFC_CARD_V2_RICH_REQUEST';legacyNoticeSha256:string;checkbox:Record<'uk'|'en'|'pl',string>;sections:Record<'uk'|'en'|'pl',{heading:string;text:string}[]>}>;
export type ApprovedPolicy=PolicyBody&Readonly<{ownerApproved:true;approvalReference:string;policySha256:string}>;
export const SYNTHETIC_PROFILE:ConsentProfile=Object.freeze({formVersion:'SYNTHETIC-NOT-APPROVED',privacyNoticeVersion:'SYNTHETIC-NOT-APPROVED'});
export function validConsentProfile(value:unknown):value is ConsentProfile {
 if(!value||typeof value!=='object')return false;const p=value as ConsentProfile;
 return [p.formVersion,p.privacyNoticeVersion].every(v=>typeof v==='string'&&/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,99}$/.test(v));
}
function canonical(value:unknown):string {
 if(value===null||typeof value==='boolean'||typeof value==='number'||typeof value==='string')return JSON.stringify(value);
 if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
 if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical((value as Record<string,unknown>)[k])).join(',')+'}';
 throw new Error('invalid_policy_body');
}
export function policyBody(value:PolicyBody):PolicyBody {
 const {scope,formVersion,privacyNoticeVersion,legacyNoticeSha256,checkbox,sections}=value;
 return {scope,formVersion,privacyNoticeVersion,legacyNoticeSha256,checkbox,sections};
}
export function policyDigest(value:PolicyBody):string{return createHash('sha256').update(canonical(policyBody(value)),'utf8').digest('hex');}
export function approvedPolicy(value:unknown):value is ApprovedPolicy {
 try {
  if(!validConsentProfile(value))return false;const p=value as ApprovedPolicy;
  if(p.ownerApproved!==true||p.scope!=='NFC_CARD_V2_RICH_REQUEST'||!/^[a-f0-9]{64}$/.test(p.policySha256)||p.legacyNoticeSha256!==LEGACY_NOTICE_SHA256
   ||typeof p.approvalReference!=='string'||p.approvalReference.trim().length<10||p.approvalReference.length>1000
   ||[p.formVersion,p.privacyNoticeVersion].some(v=>/(?:SYNTHETIC|PHASE3|PROPOSAL|NOT.APPROVED|DRAFT|FIXTURE)/i.test(v)))return false;
  if(!p.checkbox||!p.sections||Object.keys(p.checkbox).sort().join(',')!=='en,pl,uk'||Object.keys(p.sections).sort().join(',')!=='en,pl,uk')return false;
  for(const locale of ['uk','en','pl'] as const){
   if(typeof p.checkbox[locale]!=='string'||!p.checkbox[locale].trim()||p.checkbox[locale].length>3000||!Array.isArray(p.sections[locale])||!p.sections[locale].length||p.sections[locale].length>100)return false;
   for(const item of p.sections[locale])if(!item||typeof item!=='object'||Object.keys(item).sort().join(',')!=='heading,text'||typeof item.heading!=='string'||!item.heading.trim()||item.heading.length>300||typeof item.text!=='string'||!item.text.trim()||item.text.length>20000)return false;
  }
  return policyDigest(p)===p.policySha256;
 }catch{return false;}
}
