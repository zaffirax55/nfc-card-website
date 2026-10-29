import {leadEndpoint,submitLead,publicBasePath,unavailable} from './pages.mjs';
import {review3dQuote,validateCommerce} from './commerce-contract.mjs';
import {requestNotice} from './inbound-notice.mjs';

const methods=new Set(['telegram','whatsapp','viber']);
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const forbidden=/[\x00-\x1f\x7f\u202a-\u202e\u2066-\u2069]/u;
function analytics(name,quantity){
  if(document.documentElement.dataset.publicationMode==='PUBLIC_PREVIEW')return;
  const allowed=new Set(['quantity_select','order_start','order_submit_success','order_submit_error']);
  if(!allowed.has(name))return;
  const value={event:name,locale:document.documentElement.lang,route:document.body.dataset.route,product_id:'nfc-review-card-3d'};
  if(/^[1-9]\d*$/.test(String(quantity))&&Number(quantity)<=10000)value.quantity=String(quantity);
  window.nfcAnalyticsEvents??=[];
  window.nfcAnalyticsEvents.push(value);
  if(window.nfcAnalyticsEvents.length>100)window.nfcAnalyticsEvents.shift();
  window.dispatchEvent(new CustomEvent('nfc:analytics',{detail:value}));
}
export function googleLocationURL(value){
  if(typeof value!=='string'||!value.trim())return null;
  if(value.length>1000||forbidden.test(value)||value!==value.trim())return null;
  let url;try{url=new URL(value);}catch{return null;}
  const host=url.hostname.toLowerCase();
  const authority=value.slice(8).split(/[/?#]/,1)[0];
  if(url.protocol!=='https:'||url.username||url.password||url.port||
    authority.includes('@')||/:\d+$/.test(authority)||/[\\\s]/.test(value)||
    !(host==='google.com'||host.endsWith('.google.com')||['maps.app.goo.gl','g.page','goo.gl'].includes(host))||
    url.pathname==='/'&&(!url.search||host!=='google.com')||url.href.length>1000)return null;
  return url.href;
}
const clean=(value,max,multiline=false)=>{
  if(typeof value!=='string'||value.length>max||(!multiline&&forbidden.test(value))||
    (multiline&&/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f\u202a-\u202e\u2066-\u2069]/u.test(value)))throw Error('invalid_fields');
  const out=value.replace(/\r\n?/g,'\n').trim().normalize('NFC');
  if(out.length>max)throw Error('invalid_fields');return out;
};
export function review3dLeadPayload(input,{basePath='',pathname}={}){
  basePath=publicBasePath(basePath);
  const route=String(pathname||'').split(/[?#]/,1)[0].replace(/\/$/,'')||'/';
  if(!route.startsWith(basePath+'/')||!['/solutions/review-card-3d','/en/solutions/review-card-3d','/pl/solutions/review-card-3d'].includes(route.slice(basePath.length)))throw Error('invalid_source_page');
  const name=clean(input.name,100),comment=clean(input.comment||'',1000,true),phone=String(input.phone||'').trim();
  const quantity=Number(input.quantity);
  if(!/^[1-9]\d*$/.test(String(input.quantity))||!Number.isSafeInteger(quantity)||quantity>10000||
    !name||!['uk','en','pl'].includes(input.locale)||!/^\+?[\d ()-]+$/.test(phone)||
    phone.replace(/\D/g,'').length<7||phone.replace(/\D/g,'').length>15||
    !methods.has(input.messenger)||input.consent!==true||input.website)throw Error('invalid_fields');
  const google=input.google_location_url?googleLocationURL(input.google_location_url):null;
  if(input.google_location_url&&!google)throw Error('invalid_google_location_url');
  const payload={language:input.locale,product:'review-card-3d',productSchemaVersion:1,
    product_id:'nfc-review-card-3d',design:'fixed_shown_design',quantity,
    customerName:name,contact:{phone:phone.replace(/[ ()-]/g,''),preferredMethod:input.messenger},
    sourcePage:route,...requestNotice};
  if(google)payload.google_location_url=google;
  if(comment)payload.comment=comment;
  return payload;
}
const safe={get(key){try{return sessionStorage.getItem(key)}catch{return null}},set(key,value){try{sessionStorage.setItem(key,value)}catch{}},remove(key){try{sessionStorage.removeItem(key)}catch{}}};
export async function mountReview3dForm(form,{endpoint='',basePath='',locale='uk',pathname=location.pathname,commerce,send=submitLead}={}){
  if(form.dataset.review3dMounted==='true')return;
  form.dataset.review3dMounted='true';
  const P=(ua,en)=>locale==='pl'?window.nfcTranslate(locale,ua,en):locale==='uk'?ua:en,q=name=>form.elements.namedItem(name),submit=form.querySelector('[type=submit]'),result=form.querySelector('.form-result'),summary=form.querySelector('.error-summary'),note=form.querySelector('.pending-notice'),notice=form.querySelector('.review3d-notice'),newRequest=form.querySelector('[data-review3d-new-request]');
  const keyName='nfc-review3d-v26-attempt:'+pathname;
  let stored;try{stored=JSON.parse(safe.get(keyName)||'null')}catch{}
  let key=uuid.test(stored?.key||'')?stored.key:crypto.randomUUID(),pending=null,busy=false,complete=false;
  const money=n=>locale==='pl'?new Intl.NumberFormat('pl-PL',{useGrouping:'always'}).format(n)+' PLN':(locale==='uk'?'':'UAH ')+new Intl.NumberFormat(locale==='uk'?'uk-UA':'en-GB').format(n)+(locale==='uk'?' грн':'');
  const save=(state,leadId)=>safe.set(keyName,JSON.stringify({key,state,...(leadId?{leadId}:{})}));
  const show=(message,state)=>{summary.textContent=message;summary.hidden=false;result.textContent=message;result.dataset.status=state;result.hidden=false;result.focus();};
  const update=()=>{const raw=q('quantity').value,valid=/^[1-9]\d*$/.test(raw),quote=review3dQuote(commerce,valid?Number(raw):NaN,locale);for(const [label,value]of [['total',quote.amount],['deposit',quote.deposit],['balance',quote.balance]])form.querySelector(`[data-review3d-${label}]`).textContent=quote.valid?money(value):'—';return quote;};
  const snapshot=()=>({locale,name:q('name').value,phone:q('phone').value,messenger:form.querySelector('[name=messenger]:checked')?.value||'',quantity:q('quantity').value,google_location_url:q('google_location_url').value.trim(),comment:q('comment').value,consent:q('consent').checked,website:q('website').value});
  const lock=value=>{for(const field of form.querySelectorAll('input,textarea,select'))if(field.name!=='website')field.disabled=value;note.hidden=!value;if(value)note.textContent=P('Результат попередньої спроби ще не підтверджено. Повторимо ту саму заявку, щоб не створити дублікат.','The previous attempt is not confirmed. We will retry the same enquiry to avoid a duplicate.');};
  const completed=(leadId,previous=false,serverQuote=null)=>{complete=true;submit.hidden=true;submit.disabled=true;note.hidden=true;show((previous?P('Попередню заявку вже збережено. Нові дані не надсилалися. Номер: ','Your previous enquiry is already saved. No new details were sent. Reference: '):P('Дякуємо! Заявку на NFC Review Card 3D отримано. Зв’яжемося у вибраний спосіб, щоб погодити деталі та строк виготовлення. Це ще не підтвердження дати готовності. Номер: ','Thank you! We have received your NFC Review Card 3D request. We will contact you using your selected method to agree the details and production timeline. A completion date has not yet been confirmed. Reference: '))+leadId+(locale==='pl'&&Number.isSafeInteger(serverQuote?.amount)?` · Cena kart: ${money(serverQuote.amount)}. Zaliczka: ${money(serverQuote.deposit)}. Pozostała kwota: ${money(serverQuote.balance)}.`:''),previous?'existing':'success');save('complete',leadId);newRequest.hidden=false;if(!previous)analytics('order_submit_success',q('quantity').value);};
  form.addEventListener('input',e=>{if(e.target.name==='quantity')update();});
  q('quantity').addEventListener('change',()=>analytics('quantity_select',q('quantity').value));
  const query=new URLSearchParams(location.search).get('quantity');if(query&&/^[1-9]\d*$/.test(query)&&Number(query)<=10000)q('quantity').value=query;
  update();
  document.querySelectorAll('.locale-switch').forEach(link=>link.addEventListener('click',()=>{
    link.href=window.nfcSwitchLocaleURL(link.href,{quantity:q('quantity').value});
  }));
  newRequest.onclick=()=>{if(busy)return;pending=null;stored=null;complete=false;key=crypto.randomUUID();safe.remove(keyName);lock(false);submit.hidden=false;submit.disabled=!endpoint;result.hidden=true;summary.hidden=true;newRequest.hidden=true;q('name').focus();};
  try{endpoint=leadEndpoint(endpoint)}catch{endpoint=''}
  if(!endpoint){notice.textContent=unavailable(locale);submit.disabled=true;form.onsubmit=e=>e.preventDefault();return;}
  notice.textContent=P('Надсилаємо ваше ім’я, контакт, кількість, посилання на Google-точку, якщо додано, коментар і згоду для опрацювання заявки.','We send your name, contact, quantity, Google location link if provided, comment and consent to process the enquiry.');
  submit.disabled=false;
  form.onsubmit=async e=>{e.preventDefault();if(busy||complete)return;if(!pending&&!form.reportValidity())return;busy=true;submit.disabled=true;result.hidden=true;summary.hidden=true;analytics('order_start',q('quantity').value);
    try{if(!pending){const payload=review3dLeadPayload(snapshot(),{basePath,pathname});pending={key,payload,uncertain:stored?.state==='uncertain'};save('uncertain');}
      lock(true);const receipt=await send(endpoint,pending);if(locale==='pl'&&(receipt.quote?.currency!=='PLN'||receipt.quote.amount!==update().amount||receipt.quote.deposit!==commerce.poland.deposit.amount))throw Error('request_unconfirmed');completed(receipt.leadId,false,receipt.quote);}
    catch(error){if(error.message==='existing_request'&&uuid.test(error.leadId||'')){completed(error.leadId,true);return;}
      if(error.message.startsWith('invalid_')&&pending?.uncertain===false){pending=null;key=crypto.randomUUID();safe.remove(keyName);lock(false);}
      show(error.message==='invalid_google_location_url'?P('Вкажіть коректне HTTPS-посилання на Google-точку або залиште поле порожнім.','Enter a valid HTTPS Google location link or leave it blank.'):error.message.startsWith('invalid_')?P('Перевірте ім’я, контакт, цілу кількість карток, посилання й згоду.','Check your name, contact, whole-number quantity, link and consent.'):P('Не вдалося підтвердити отримання заявки. Дані залишаються у формі. Повторіть спробу або напишіть нам у месенджері.','We could not confirm receipt. Your details remain in the form. Retry or contact us in a messenger.'),'error');analytics('order_submit_error',q('quantity').value);}
    finally{busy=false;submit.disabled=complete;}};
  if(stored?.state==='complete'&&uuid.test(stored.leadId||''))completed(stored.leadId,true);
  else if(stored?.state==='uncertain'){submit.disabled=true;show(P('Попередня заявка могла бути збережена. Дані не зберігаються у браузері; уточніть статус у нас або свідомо створіть нову заявку.','A previous enquiry may have been saved. Details are not stored in this browser; ask us to check its status or explicitly start a new enquiry.'),'uncertain');newRequest.hidden=false;}
}
if(typeof document!=='undefined'){
  // The product page loads its viewer eagerly; keep it still for visitors who
  // request reduced motion, including when the preference changes mid-session.
  const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
  const syncViewerMotion=()=>{const viewer=document.querySelector('.review-card-model');if(viewer){
    if(motion.matches)viewer.removeAttribute('auto-rotate');
    else viewer.setAttribute('auto-rotate','');
  }};
  motion.addEventListener('change',syncViewerMotion);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',syncViewerMotion,{once:true});else syncViewerMotion();
  const start=async()=>{const form=document.querySelector('[data-review3d-form]');if(!form)return;
    const basePath=document.documentElement.dataset.publicBasePath||'',endpoint=document.documentElement.dataset.leadEndpoint||'';
    let commerce;try{const response=await fetch(basePath+'/assets/content.json');if(!response.ok)throw Error('content_unavailable');commerce=validateCommerce((await response.json()).commerce);}catch{return;}
    mountReview3dForm(form,{endpoint,basePath,locale:document.documentElement.lang,pathname:location.pathname,commerce});};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
}
