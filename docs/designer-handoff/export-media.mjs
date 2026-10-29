/** Deterministic public media register. No network, credentials or private input. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {mediaCoverage} from '../../src/v36_2/media.mjs';
import {ownerMediaRegister} from '../../src/v36_2/media-owner.mjs';
import {editorialMediaSlots} from '../../src/v36_2/editorial-view.mjs';
const here=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(here,'../..'),source=path.join(root,'src/v36_2');
const digest=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const original=mediaCoverage(),decisions=ownerMediaRegister(),lookup=new Map(decisions.map(x=>[x.slot_id,x]));
const sourceManifest=JSON.parse(fs.readFileSync(path.join(root,'src/media-manifest.json'),'utf8'));
const assets=fs.readdirSync(path.join(source,'assets')).sort().filter(x=>!x.endsWith('-OFL.txt')).map(name=>{
 const local=path.join(source,'assets',name),sha256=digest(local),matches=sourceManifest.filter(x=>x.sha256===sha256),roles=original.filter(x=>x.actual_asset==='assets/'+name),font=/\.ttf$/.test(name);
 return {path:'src/v36_2/assets/'+name,bytes:fs.statSync(local).size,sha256,kind:font?'font':name.endsWith('.svg')?'brand_vector':'image',
  canonicalProvenance:font?null:matches[0]?.provenance??(roles.length?'user_provided_business_asset':null),
  provenanceBasis:font?'Bundled OFL notice and unchanged main font bytes':matches.length?'Existing main src/media-manifest.json exact SHA match':roles.length?'Existing approved source role ledger; publication remains a separate owner gate':'Preserved existing main asset; see source inventory',
  sourceManifestMatches:matches.map(x=>({source:x.source,role:x.role,status:x.status,provenance:x.provenance,claimRole:x.claim_role,dimensions:{width:x.width||null,height:x.height||null},alt:{uk:x.alt_ua||'',en:x.alt_en||'',pl:x.alt_pl||''}})),
  slotIds:roles.map(x=>x.slot_id),licenseNotice:font?'src/v36_2/assets/'+(name.startsWith('Onest')?'Onest-OFL.txt':'IBMPlexMono-OFL.txt'):null,
  altImplementation:'Localized use-site alt in app.mjs/editorial-view.mjs/media.mjs; preserve meaning when replacing assets',cropStrategy:font?'not_applicable':'Product galleries contain the complete physical object; retain ratio and inspect desktop/mobile. Portrait crops must preserve the face.',productionApproval:false};
});
const captureSpecs={
 'HOW.NFC.DEMO_VIDEO':{kind:'real_video',proposedAspect:'16:9 with a mobile-safe subject area'},
 'HOW.NFC.PHONE_SCREEN':{kind:'permitted_screen_recording',proposedAspect:'9:16 phone screen'},
 'DESIGN.REVIEW.EXAMPLE':{kind:'approved_photo_or_labelled_mockup',proposedAspect:'1:1'},
 'DESIGN.BEAUTY.EXAMPLE':{kind:'approved_photo_or_labelled_mockup',proposedAspect:'1:1'},
 'DESIGN.RESTAURANT.EXAMPLE':{kind:'approved_photo_or_labelled_mockup',proposedAspect:'1:1; no implied physical dimensions'},
 'DESIGN.PROCESS':{kind:'approved_photo_sequence',proposedAspect:'Three equally sized frames, responsive stack'},
 'DESIGN.NFC_DEMO':{kind:'real_video',proposedAspect:'16:9 with a mobile-safe subject area'}
};
const extra=['how','design'].flatMap(key=>editorialMediaSlots(key,'en').map(r=>({slotId:r.id,page:key==='how'?'/what-is-nfc-card/':'/services/design/',status:'placeholder',actualAsset:null,actualSHA256:null,canonicalProvenance:null,notCustomerProof:true,localized:Object.fromEntries(['uk','en','pl'].map(locale=>{const v=editorialMediaSlots(key,locale).find(x=>x.id===r.id);return[locale,{title:v.title,brief:v.brief}];})),captureProposal:{...captureSpecs[r.id],status:'designer_capture_target_only_not_product_specification'},altCaptionRequirement:'Write truthful localized UA/EN/PL alt/caption after real material and its permission are approved; no fabricated customer attribution.'})));
const slots=original.map(row=>{const d=lookup.get(row.slot_id);const status=d?.decisionGroup==='significant_hold'?'hold':d?.decisionGroup==='restaurant'?'approved_local_placement':d?.decisionGroup==='optional'?'unused':row.disposition==='review_placeholder'?'placeholder':'approved_local_asset';return {...row,currentStatus:status,ownerOverlay:d?{approval:d.approval,decision:d.decision,group:d.decisionGroup,productionApproval:false}:null,actualRepositoryPath:row.actual_asset?'src/v36_2/'+row.actual_asset:null,originalSourceStillPreservedInMain:!!row.planned_source&&fs.existsSync(path.join(root,row.planned_source)),replacementRequires:'Source/permission check, truthful UA/EN/PL alt, accurate product role, responsive crop review; no automatic activation of HOLD',productionApproval:false};});
if(original.length!==104||extra.length!==7||original.filter(x=>x.disposition==='review_placeholder').length!==27||decisions.filter(x=>x.decisionGroup==='optional').length!==30)throw Error('accepted_media_register_drift');
const out={revision:'v36.2',sourceZIP_SHA256:'b6621cd2620bf57270ed2b616bb0ab4cdb609dbbce999319dfc242883c168b35',publicationAuthorized:false,counts:{originalSlots:104,originalRendered:44,originalPlaceholders:27,originalOmitted:33,approvedOmissions:30,restaurantKept:1,significantHold:2,additionalCaptureSlots:7,assetFiles:assets.length},sourceFiles:{'src/v36_2/media.mjs':digest(path.join(source,'media.mjs')),'src/v36_2/media-owner.mjs':digest(path.join(source,'media-owner.mjs')),'src/v36_2/editorial-content.mjs':digest(path.join(source,'editorial-content.mjs'))},slots,additionalCaptureSlots:extra,assets};
fs.writeFileSync(path.join(here,'MEDIA_REGISTER.json'),JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify(out.counts));
