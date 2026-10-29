/** Portable Node24 designer workbench. Pure frozen contracts + SQLite synthetic adapter.
 * NO production credentials, PG, npm, external fetch, sender, CRM or notifier imports.
 * Run: node tools/designer-preview.mjs --port 4194
 */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash,createHmac,randomBytes,randomUUID,timingSafeEqual} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
if(Number(process.versions.node.split('.')[0])!==24)throw Error('Node24_required');
const sourceRoot=ROOT;
const FRONT=path.join(sourceRoot,'work/designer-preview-v36_2');
const GATEWAY=path.join(sourceRoot,'designer/fixtures/gateway-contract/nfc-card');
if(!fs.existsSync(path.join(FRONT,'nfc-card-website/index.html'))||!fs.existsSync(path.join(GATEWAY,'v2/contract.ts')))throw Error('build_preview_and_include_pure_gateway_sources_first');
const v2=await import(pathToFileURL(path.join(GATEWAY,'v2/contract.ts')));
const v1=await import(pathToFileURL(path.join(GATEWAY,'contract.ts')));
const legacyCommerce=await import(pathToFileURL(path.join(GATEWAY,'commerce.ts')));
const V2='/v2/public/requests/nfc-card',V1='/v1/public/leads/nfc-card';
const OWNER='NFC_CARD_V36_DESIGNER_SYNTHETIC_V1';
const hash=s=>createHash('sha256').update(s).digest('hex');
const mime={'.html':'text/html; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.ttf':'font/ttf','.woff2':'font/woff2','.mp4':'video/mp4','.txt':'text/plain; charset=utf-8','.xml':'application/xml; charset=utf-8'};
function synthetic(n){const c=n.contact||{};return n.customerName?.startsWith('Synthetic')&&(!c.email||/^[^@]+@[^@]+\.invalid$/i.test(c.email))&&(!c.phone||c.phone==='+12025550123')&&(!c.telegram||c.telegram.startsWith('@synthetic'));}
function stateOpen(dir){
 if(fs.existsSync(dir)){const s=fs.lstatSync(dir);if(!s.isDirectory()||s.isSymbolicLink())throw Error('owned_state_directory_required');}
 else fs.mkdirSync(dir,{mode:0o700});
 const mark=path.join(dir,'owner.json'),file=path.join(dir,'synthetic.sqlite3');let config;
 if(fs.existsSync(mark)){
  if(fs.lstatSync(mark).isSymbolicLink())throw Error('owned_state_marker_required');
  config=JSON.parse(fs.readFileSync(mark,'utf8'));
  if(config.owner!==OWNER||config.version!==1||!/^[a-f0-9]{64}$/.test(config.hmacSecret||''))throw Error('foreign_state_refused');
 }else{
  if(fs.readdirSync(dir).length)throw Error('foreign_state_directory_not_empty');
  config={owner:OWNER,version:1,hmacSecret:randomBytes(32).toString('hex')};
  fs.writeFileSync(mark,JSON.stringify(config)+'\n',{flag:'wx',mode:0o600});
 }
 const exists=fs.existsSync(file);if(exists&&fs.lstatSync(file).isSymbolicLink())throw Error('foreign_database_refused');
 const db=new DatabaseSync(file);fs.chmodSync(file,0o600);
 if(!exists){db.exec('PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; CREATE TABLE metadata(owner TEXT NOT NULL); CREATE TABLE requests(idempotency_key TEXT PRIMARY KEY,entity TEXT NOT NULL,digest TEXT NOT NULL,normalized_json TEXT NOT NULL,receipt_json TEXT NOT NULL,accepted_at TEXT NOT NULL); PRAGMA user_version=1;');db.prepare('INSERT INTO metadata(owner) VALUES(?)').run(OWNER);}
 else if(db.prepare('PRAGMA user_version').get().user_version!==1||db.prepare('SELECT owner FROM metadata').get()?.owner!==OWNER){db.close();throw Error('foreign_database_refused');}
 db.exec('PRAGMA synchronous=FULL; PRAGMA busy_timeout=2500;');
 return {db,secret:config.hmacSecret};
}
function issueV2(secret,page,now){const raw=Buffer.from(JSON.stringify({path:page,at:now,nonce:randomBytes(16).toString('hex')})).toString('base64url');return raw+'.'+createHmac('sha256',secret).update('nfc-browser-v2.'+raw).digest('base64url');}
function verifyV2(secret,token,page,now){
 if(typeof token!=='string'||token.length>800||!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{43}$/.test(token))throw new v2.NfcV2Error(422,'invalid_challenge',true);
 const[raw,sig]=token.split('.'),expected=createHmac('sha256',secret).update('nfc-browser-v2.'+raw).digest('base64url');
 if(sig.length!==expected.length||!timingSafeEqual(Buffer.from(sig),Buffer.from(expected)))throw new v2.NfcV2Error(422,'invalid_challenge',true);
 let d;try{d=JSON.parse(Buffer.from(raw,'base64url').toString());}catch{throw new v2.NfcV2Error(422,'invalid_challenge',true);}
 if(d.path!==page||!Number.isSafeInteger(d.at)||now-d.at<2000||now-d.at>1800000)throw new v2.NfcV2Error(422,'expired_or_early_challenge',true);
}
function body(req){return new Promise((resolve,reject)=>{
 if(!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(req.headers['content-type']||'')||req.headers['content-encoding']){req.resume();reject(new v2.NfcV2Error(400,'invalid_encoding'));return;}
 let n=0,done=false;const parts=[];
 if(Number(req.headers['content-length'])>16384){req.resume();reject(new v2.NfcV2Error(413,'request_too_large'));return;}
 req.on('data',b=>{if(done)return;n+=b.length;if(n>16384){done=true;parts.length=0;reject(new v2.NfcV2Error(413,'request_too_large'));}else parts.push(b);});
 req.on('end',()=>{if(!done){done=true;resolve(Buffer.concat(parts,n));}});
 req.on('error',()=>{if(!done){done=true;reject(new v2.NfcV2Error(400,'malformed_json'));}});
 });}
export async function startDesignerPreview({port=4194,stateRoot=path.join(ROOT,'work/designer-state'),testOnly=false}={}){
 if(!Number.isInteger(port)||(!testOnly&&port<1024)||port<0||port>65535)throw Error('safe_loopback_port_required');
 if(!path.isAbsolute(stateRoot)||path.resolve(stateRoot)===FRONT||path.resolve(stateRoot).startsWith(FRONT+path.sep))throw Error('state_must_be_absolute_and_outside_static_root');
 fs.mkdirSync(path.join(ROOT,'work'),{recursive:true});
 const {db,secret}=stateOpen(stateRoot);let boundPort=port,rate={until:0,n:0};
 const reply=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','X-Robots-Tag':'noindex, nofollow','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));};
 function save(entity,n,key){
  const digest=entity==='v2'?v2.requestDigest(n):hash(JSON.stringify(n));
  db.exec('BEGIN IMMEDIATE');
  try{
   const old=db.prepare('SELECT entity,digest,receipt_json FROM requests WHERE idempotency_key=?').get(key);
   if(old){if(old.entity!==entity||old.digest!==digest)throw new v2.NfcV2Error(409,'idempotency_conflict');const receipt=JSON.parse(old.receipt_json);if(entity==='v2'&&!v2.validateReceipt(n,receipt))throw new v2.NfcV2Error(503,'unavailable',true);db.exec('COMMIT');return receipt;}
   const at=new Date().toISOString();
   const receipt=entity==='v2'?v2.buildReceipt(n,{requestId:randomUUID(),acceptedAt:at,quoteId:randomUUID(),notificationStatus:'disabled'}):{ok:true,source:'NFC_CARD',leadId:randomUUID(),durableSaved:true,notificationStatus:'disabled',quote:legacyCommerce.quote(n)};
   if(entity==='v2'&&!v2.validateReceipt(n,receipt))throw new v2.NfcV2Error(503,'unavailable',true);
   db.prepare('INSERT INTO requests(idempotency_key,entity,digest,normalized_json,receipt_json,accepted_at) VALUES(?,?,?,?,?,?)').run(key,entity,digest,JSON.stringify(n),JSON.stringify(receipt),at);
   db.exec('COMMIT');return receipt;
  }catch(error){try{db.exec('ROLLBACK');}catch{}throw error;}
 }
 const server=http.createServer(async(req,res)=>{
  const route=(req.url||'/').split('?')[0],isV1=route.startsWith(V1);try{
   const host=req.headers.host||'',allowed=['127.0.0.1:'+boundPort,'localhost:'+boundPort];
   if(!allowed.includes(host)||req.rawHeaders.filter((_,i)=>i%2===0).filter(k=>k.toLowerCase()==='host').length!==1)return reply(res,403,{ok:false,code:'host_forbidden'});
   const origin='http://'+host,u=new URL(req.url,origin);
   if(req.headers.origin&&req.headers.origin!==origin)return reply(res,403,isV1?{ok:false,code:'origin_not_allowed'}:{ok:false,schemaVersion:2,code:'origin_forbidden',retryable:false});
   if(u.pathname==='/healthz')return reply(res,200,{ok:true,mode:'designer-synthetic-sqlite',publication:false,notifications:'disabled',productionGateway:false});
   if(u.pathname==='/__qa/counts')return reply(res,200,{syntheticRecords:Number(db.prepare('SELECT count(*) AS n FROM requests').get().n),v1:Number(db.prepare("SELECT count(*) AS n FROM requests WHERE entity='v1'").get().n),v2:Number(db.prepare("SELECT count(*) AS n FROM requests WHERE entity='v2'").get().n),notificationCalls:0});
   if([V1,V2,V1+'/challenge',V2+'/challenge','/__preview/quote'].includes(u.pathname)){
    const now=Date.now();if(now>rate.until)rate={until:now+60000,n:0};if(++rate.n>240)throw new v2.NfcV2Error(429,'rate_limited',true);
    if(u.pathname.endsWith('/challenge')){
     if(req.method!=='GET'||u.searchParams.getAll('sourcePage').length!==1||[...u.searchParams.keys()].some(k=>k!=='sourcePage'))throw new v2.NfcV2Error(422,'invalid_payload');
     const supplied=u.searchParams.get('sourcePage'),lang=supplied.startsWith('/nfc-card-website/pl/')?'pl':supplied.startsWith('/nfc-card-website/en/')?'en':'uk';
     const source=isV1?v1.sourcePath(supplied):v2.normalizeSourcePage(supplied,lang);
     return reply(res,200,{challenge:isV1?v1.challenge(secret,source,now):issueV2(secret,source,now),minimumDelayMs:2000,expiresInSeconds:1800});
    }
    if(req.method!=='POST')return reply(res,405,{ok:false,code:'method_not_allowed'});
    if(req.headers.origin!==origin)return reply(res,403,isV1?{ok:false,code:'origin_not_allowed'}:{ok:false,schemaVersion:2,code:'origin_forbidden',retryable:false});
    const bytes=await body(req);let raw;try{raw=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch{throw new v2.NfcV2Error(400,'malformed_json');}
    const n=isV1?v1.parseNfcLead(raw,true):v2.parseWire(bytes);
    if(!synthetic(n))throw new v2.NfcV2Error(422,'invalid_payload');
    if(u.pathname==='/__preview/quote')return reply(res,200,{normalized:n,digestSha256:v2.requestDigest(n),quote:v2.quoteRequest(n,{quoteId:'00000000-0000-4000-8000-000000000001'})});
    const key=req.headers['idempotency-key']||'';if(!v2.UUID_V4.test(key))throw new v2.NfcV2Error(422,'invalid_id');
    if(isV1){if(raw.website!=='')throw new v1.NfcError(422,'invalid_payload');v1.verifyChallenge(secret,raw.challenge,n.sourcePage,now);}else verifyV2(secret,raw.challenge,n.sourcePage,now);
    const fault=req.headers['x-nfc-preview-fault'];if(fault&&!['unavailable','timeout_after_commit'].includes(fault))throw new v2.NfcV2Error(422,'invalid_payload');
    if(fault==='unavailable')throw new v2.NfcV2Error(503,'unavailable',true);
    const receipt=save(isV1?'v1':'v2',n,key);
    if(fault==='timeout_after_commit')throw new v2.NfcV2Error(503,'outcome_unknown',true);
    return reply(res,202,receipt);
   }
   if(!['GET','HEAD'].includes(req.method))return reply(res,405,{ok:false,code:'method_not_allowed'});
   let decoded;try{decoded=decodeURIComponent(u.pathname);}catch{return reply(res,400,{code:'bad_path'});}
   let file=path.resolve(FRONT,'.'+decoded);if(!file.startsWith(FRONT+path.sep))return reply(res,404,{code:'not_found'});
   try{if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');const real=fs.realpathSync(file);if(!real.startsWith(fs.realpathSync(FRONT)+path.sep))return reply(res,404,{code:'not_found'});
    res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','X-Robots-Tag':'noindex, nofollow','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});if(req.method==='HEAD')res.end();else fs.createReadStream(file).pipe(res);
   }catch{return reply(res,404,{code:'not_found'});}
  }catch(error){
   if(isV1){const status=error instanceof v1.NfcError||error instanceof v2.NfcV2Error?error.status:503;return reply(res,status,{ok:false,code:error instanceof v1.NfcError?error.message:error instanceof v2.NfcV2Error?error.code:'storage_unavailable'});}
   const e=error instanceof v2.NfcV2Error?error:new v2.NfcV2Error(503,'unavailable',true);return reply(res,e.status,v2.errorEnvelope(e));
  }
 });
 server.requestTimeout=5000;server.headersTimeout=5000;
 try{await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});boundPort=server.address().port;}catch(error){db.close();throw error;}
 return {server,db,port:boundPort,origin:'http://127.0.0.1:'+boundPort,close:()=>new Promise((resolve,reject)=>server.close(error=>{db.close();error?reject(error):resolve();}))};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const a=process.argv.slice(2);if(a.length&&!(a.length===2&&a[0]==='--port'&&/^\d+$/.test(a[1])))throw Error('Usage: node tools/designer-preview.mjs [--port 4194]');
 const app=await startDesignerPreview({port:a.length?Number(a[1]):4194});
 console.log(JSON.stringify({url:app.origin+'/nfc-card-website/',mode:'designer-synthetic-sqlite',notifications:'disabled',production:false,testContact:'Synthetic name / demo@example.invalid / +12025550123'}));
 const stop=()=>app.close().then(()=>process.exit(0));process.once('SIGINT',stop);process.once('SIGTERM',stop);
}
