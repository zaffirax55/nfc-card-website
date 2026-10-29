/** Existing Pages publisher entry point: only the approved v36.2 production shop. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync,execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const origin='https://optidigitalagent.github.io',base='/nfc-card-website';
if(process.env.NFC_PUBLIC_ORIGIN&&process.env.NFC_PUBLIC_ORIGIN!==origin)throw Error('existing_production_origin_required');
if(process.env.NFC_PUBLIC_BASE_PATH&&process.env.NFC_PUBLIC_BASE_PATH!==base)throw Error('existing_production_base_required');
if(process.env.NFC_PUBLICATION_MODE&&process.env.NFC_PUBLICATION_MODE!=='PUBLIC')throw Error('root_build_is_production_use_explicit_designer_commands_for_preview');
const approved=path.join(root,'release/nfc-card-v36-2-policy.json');
const owner=JSON.parse(fs.readFileSync(path.join(root,'release/B05_OWNER_APPROVAL.json'),'utf8'));
const input=JSON.parse(fs.readFileSync(approved,'utf8'));
if(owner.policyBodySHA256!==input.policy?.policySha256||owner.publicTextSHA256!==input.policy?.publicTextSha256||
 input.policy?.sourceApprovalSha256!==createHash('sha256').update(fs.readFileSync(path.join(root,'release/B05_OWNER_APPROVAL.json'))).digest('hex'))throw Error('owner_approval_artifact_binding_required');
if(process.env.NFC_REQUIRE_GATEWAY_READY==='true'){const {checkConfiguredGateway}=await import('./check-gateway-ready.mjs');console.log(JSON.stringify(await checkConfiguredGateway()));}
const r=spawnSync(process.execPath,['scripts/build-v36_2.mjs','production',approved],{cwd:root,env:process.env,stdio:'inherit'});
if(r.status!==0)process.exit(r.status||1);
const built=path.join(root,'work/designer-release-v36_2'),m=JSON.parse(fs.readFileSync(path.join(built,'BUILD_MANIFEST.json'),'utf8'));
if(m.mode!=='production'||m.revision!=='v36.2'||!m.intakeEnabled.v1||!m.intakeEnabled.v2||m.fixtureOnly)throw Error('real_v362_production_build_required');
// Pages adds the repository base path itself. Strip exactly one generated base
// folder, so /nfc-card-website/ never becomes /nfc-card-website/nfc-card-website/.
const stage=path.join(root,'work/pages-stage-v36_2');if(fs.existsSync(stage))fs.rmSync(stage,{recursive:true});
fs.cpSync(path.join(built,base),stage,{recursive:true});
fs.copyFileSync(path.join(built,'BUILD_MANIFEST.json'),path.join(stage,'BUILD_MANIFEST.json'));
fs.writeFileSync(path.join(stage,'.nojekyll'),'');
const commit=process.env.GITHUB_SHA||process.env.NFC_RELEASE_COMMIT||execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
if(!/^[a-f0-9]{40}$/.test(commit))throw Error('exact_release_commit_required');
fs.writeFileSync(path.join(stage,'DEPLOYED_VERSION.json'),JSON.stringify({revision:'v36.2',commit,base,origin,mode:'production',policySha256:input.policy.policySha256,contractId:m.contractId,ownerApprovalReference:input.policy.approvalReference},null,2)+'\n');
const site=path.join(root,'site');if(fs.existsSync(site))fs.rmSync(site,{recursive:true});fs.renameSync(stage,site);
console.log(JSON.stringify({site:'site/',revision:'v36.2',mode:'production',routeCount:m.routeCount,commit,v1:true,v2:true,policySha256:input.policy.policySha256,publication:'Build only; deployment requires the separate verified gateway/receiver/recovery gates'}));
