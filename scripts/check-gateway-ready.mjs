import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export async function checkGatewayReady({fetcher=globalThis.fetch,expected,policy,endpoint}={}){
 if(!expected||!/^[a-f0-9]{40}$/.test(expected.gatewayCommit||''))throw Error('pinned_released_gateway_commit_required');
 if(endpoint!=='https://lead-gateway-production-6c25.up.railway.app/v2/public/requests/nfc-card')throw Error('existing_gateway_required');
 const response=await fetcher(endpoint+'/status',{method:'GET',redirect:'error',signal:AbortSignal.timeout(10000),headers:{Accept:'application/json',Origin:'https://optidigitalagent.github.io'}});
 if(!response.ok)throw Error('gateway_not_ready_http_'+response.status);
 const s=await response.json();
 if(s.ok!==true||s.apiVersion!==2||s.mode!=='approved-intake'||s.service!=='antonov-lead-gateway'||s.gatewayCommit!==expected.gatewayCommit||
 s.contractId!=='NFC-CARD-V35-P4-02-CF-01'||s.policySha256!==policy.policySha256||s.formVersion!==policy.formVersion||s.privacyNoticeVersion!==policy.privacyNoticeVersion||
 s.pricingRevision?.UA!=='NFC-V35-V2-OWNER-20261027-UA'||s.pricingRevision?.PL!=='NFC-V35-V2-CANDIDATE-01-PL')throw Error('gateway_release_contract_policy_mismatch');
 return {gatewayCommit:s.gatewayCommit,policySha256:s.policySha256,contractId:s.contractId,status:'PASS'};
}
export async function checkConfiguredGateway(){
 const p=JSON.parse(fs.readFileSync(path.join(root,'release/nfc-card-v36-2-policy.json'),'utf8'));
 const expected=JSON.parse(fs.readFileSync(path.join(root,'release/gateway-release.json'),'utf8'));
 return checkGatewayReady({expected,policy:p.policy,endpoint:p.v2Endpoint});
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log(JSON.stringify(await checkConfiguredGateway()));
