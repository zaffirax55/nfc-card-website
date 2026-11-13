/* Opaque owner-issued grant for the one approved batch. No PII/body storage;
 * the gateway independently authenticates it using its existing browser HMAC. */
const RUN='NFC-E2E-20261106T113357Z-69d56f61';
const KEY='nfc-control-context-v1';
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
export function parseControlGrant(token){
 try{
  if(typeof token!=='string'||token.length>2048||!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{43}$/.test(token))return null;
  const raw=token.split('.')[0],text=atob(raw.replace(/-/g,'+').replace(/_/g,'/'));
  const g=JSON.parse(text);
  if(g.version!==1||g.runId!==RUN||![RUN+'-WEB-BRAND',RUN+'-WEB-ORIG'].includes(g.caseId)||!UUID.test(g.nonce)||!Number.isSafeInteger(g.expiresAt))return null;
  return {token,runId:g.runId,caseId:g.caseId,nonce:g.nonce};
 }catch{return null;}
}
export function loadControlContext(location,storage,history){
 let explicit=false;
 try{
  if(!location)return null;
  const fragment=new URLSearchParams(String(location.hash||'').replace(/^#/,''));
  const supplied=fragment.get('nfc-control');
  explicit=supplied!==null;
  if(supplied!==null){
   const context=parseControlGrant(supplied);
   // Remove the bearer grant from the address bar before rendering or screenshots.
   history?.replaceState(null,'',location.pathname+location.search);
   if(!context){storage?.removeItem(KEY);return {invalid:true};}
   storage?.setItem(KEY,context.token);return context;
  }
  return parseControlGrant(storage?.getItem(KEY));
 }catch{return explicit?{invalid:true}:null;}
}
export function clearControlContext(storage){try{storage?.removeItem(KEY);}catch{/* no automatic resubmit */}}
export function annotateControlWire(wire,context){
 if(!context)return wire;
 if(context.invalid)throw Error('invalid_control_context');
 const out=structuredClone(wire);
 const note='ТЕСТ — НЕ ИЗГОТАВЛИВАТЬ\nrun_id: '+context.runId+'\ncase_id: '+context.caseId;
 for(const line of out.lines){
  const notes=[line.configuration.notes,note].filter(Boolean).join('\n');
  if(notes.length>1000)throw Error('control_note_too_long');
  line.configuration.notes=notes;
 }
 return out;
}
