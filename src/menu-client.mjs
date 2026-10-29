import {MENU_VARIANTS, normalizeMenuRows, menuQuote, menuPublicURL} from './menu-contract.mjs';
import {validatePolandCommerce} from './pl-commerce.mjs';
import {leadEndpoint, submitLead, publicBasePath} from './pages.mjs';
import {requestNotice} from './inbound-notice.mjs';

const methods = new Set(['telegram','whatsapp','viber']);
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const cleanText = (value,max,multiline=false) => {
  const controls=multiline?/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f\u202a-\u202e\u2066-\u2069]/u:/[\x00-\x1f\x7f\u202a-\u202e\u2066-\u2069]/u;
  if(typeof value!=='string'||value.length>max||controls.test(value))throw Error('invalid_fields');
  const result=value.replace(/\r\n?/g,'\n').trim().normalize('NFC');
  if(result.length>max)throw Error('invalid_fields');
  return result;
};
export function menuLeadPayload(input,{basePath='',pathname}={}) {
  basePath=publicBasePath(basePath);
  const route=String(pathname||'').split(/[?#]/,1)[0].replace(/\/$/,'')||'/';
  const relative=route.slice(basePath.length);
  if(!route.startsWith(basePath+'/')||!['/solutions/menu-card','/menu-card','/order','/contact','/en/solutions/menu-card','/en/menu-card','/en/order','/en/contact','/pl/solutions/menu-card','/pl/menu-card','/pl/order','/pl/contact'].includes(relative))throw Error('invalid_source_page');
  const name=cleanText(input.name,100),comment=cleanText(input.comment||'',1000,true),phone=String(input.phone||'').trim();
  if(!name||!['uk','en','pl'].includes(input.locale)||!/^\+?[\d ()-]+$/.test(phone)||phone.replace(/\D/g,'').length<7||phone.replace(/\D/g,'').length>15||!methods.has(input.messenger)||input.consent!==true||input.website)throw Error('invalid_fields');
  if(!['existing','needs_development'].includes(input.menu_status)||!['card_order','menu_consultation'].includes(input.intent))throw Error('invalid_menu_status');
  const consult=input.intent==='menu_consultation';
  if(consult&&input.menu_status!=='needs_development')throw Error('invalid_menu_status');
  const items=consult?[]:normalizeMenuRows(input.items);
  const quantity=items.reduce((sum,row)=>sum+row.quantity,0);
  const url=input.menu_status==='existing'?menuPublicURL(input.menu_url):null;
  if(input.menu_status==='existing'&&!url)throw Error('invalid_menu_url');
  const payload={language:input.locale,product:'nfc-menu-card',productSchemaVersion:1,product_id:'nfc-menu-card',
    customerName:name,contact:{phone:phone.replace(/[ ()-]/g,''),preferredMethod:input.messenger},sourcePage:route,
    intent:input.intent,menu_status:input.menu_status,...requestNotice};
  if(!consult){payload.items=items;payload.quantity=quantity;}
  if(url)payload.menu_url=url;
  if(comment)payload.comment=comment;
  return payload;
}

const safeStorage={get(key){try{return sessionStorage.getItem(key)}catch{return null}},set(key,value){try{sessionStorage.setItem(key,value)}catch{}},remove(key){try{sessionStorage.removeItem(key)}catch{}}};
export function mountMenuForm(form,{endpoint='',basePath='',locale='uk',pathname=location.pathname,poland=null}={}) {
  if(form.dataset.menuMounted==='true')return;
  form.dataset.menuMounted='true';
  const uk=locale==='uk',P=(ua,en)=>locale==='pl'?window.nfcTranslate(locale,ua,en):uk?ua:en;
  const q=name=>form.elements.namedItem(name),rowsBox=form.querySelector('[data-menu-rows]'),config=form.querySelector('[data-menu-configuration]');
  const submit=form.querySelector('[type=submit]'),result=form.querySelector('.form-result'),summary=form.querySelector('.error-summary');
  const note=form.querySelector('.pending-notice'),notice=form.querySelector('.preview-notice'),newRequest=form.querySelector('[data-menu-new-request]');
  const configKey='nfc-menu-v23-config',attemptKey='nfc-menu-v23-attempt:'+pathname;
  if(locale==='pl')validatePolandCommerce(poland);
  const fmt=n=>locale==='pl'?new Intl.NumberFormat('pl-PL',{useGrouping:'always'}).format(n)+' PLN':(uk?'': 'UAH ')+new Intl.NumberFormat(uk?'uk-UA':'en-GB').format(n)+(uk?' грн':'');
  let busy=false,pending=null,key=crypto.randomUUID(),complete=false;
  const storedAttempt=(()=>{try{return JSON.parse(safeStorage.get(attemptKey)||'null')}catch{return null}})();
  if(storedAttempt&&uuid.test(storedAttempt.key)&&['uncertain','complete'].includes(storedAttempt.state))key=storedAttempt.key;
  const selected=name=>form.querySelector(`[name="${name}"]:checked`)?.value||'';
  const rowValues=()=>[...rowsBox.querySelectorAll('[data-menu-row]')].map(row=>({variant_id:row.querySelector('[name=menu-variant]').value,quantity:Number(row.querySelector('[name=menu-quantity]').value)}));
  function saveConfig(){const intent=selected('menu-intent'),menu_status=selected('menu-status');const items=rowValues().filter(r=>MENU_VARIANTS.includes(r.variant_id)&&Number.isSafeInteger(r.quantity)&&r.quantity>0);safeStorage.set(configKey,JSON.stringify({intent,menu_status,items}));}
  function addRow(item){const row=form.querySelector('[data-menu-row-template]').content.firstElementChild.cloneNode(true);rowsBox.append(row);if(item?.variant_id&&Number.isSafeInteger(item.quantity)){row.querySelector('[name=menu-variant]').value=item.variant_id;row.querySelector('[name=menu-quantity]').value=String(item.quantity);}return row;}
  function setRows(items){rowsBox.replaceChildren();if(items.length)for(const item of items)addRow(item);else addRow();}
  function update(){const intent=selected('menu-intent'),consult=intent==='menu_consultation';config.hidden=consult;
    for(const control of config.querySelectorAll('input,select,button'))control.disabled=consult;
    const existing=form.querySelector('[name=menu-status][value=existing]');existing.disabled=consult;
    if(consult){form.querySelector('[name=menu-status][value=needs_development]').checked=true;}
    const status=selected('menu-status'),urlField=form.querySelector('[data-menu-url-field]'),url=q('menu-url');
    urlField.hidden=status!=='existing'||consult;url.disabled=urlField.hidden;url.required=!urlField.hidden;
    if(urlField.hidden)url.value='';
    form.querySelector('[data-menu-development-note]').hidden=status!=='needs_development';
    const show=(selector,value)=>form.querySelector(selector).textContent=value;
    if(consult){show('[data-menu-total]','0');for(const field of ['unit','subtotal','deposit','balance'])show(`[data-menu-${field}]`,'—');}
    else{try{const quote=menuQuote(rowValues(),'card_order',locale==='pl'?poland:null);show('[data-menu-total]',String(quote.quantity));show('[data-menu-unit]',fmt(quote.unitPrice));show('[data-menu-subtotal]',fmt(quote.amount));show('[data-menu-deposit]',fmt(quote.deposit));show('[data-menu-balance]',fmt(quote.balance));}
      catch{show('[data-menu-total]','0');for(const field of ['unit','subtotal','deposit','balance'])show(`[data-menu-${field}]`,'—');}}
    saveConfig();
  }
  let configState;try{configState=JSON.parse(safeStorage.get(configKey)||'null')}catch{}
  if(Array.isArray(configState?.items)&&configState.items.every(r=>MENU_VARIANTS.includes(r.variant_id)&&Number.isSafeInteger(r.quantity)&&r.quantity>0))setRows(configState.items);
  if(['card_order','menu_consultation'].includes(configState?.intent))form.querySelector(`[name=menu-intent][value=${configState.intent}]`).checked=true;
  if(['existing','needs_development'].includes(configState?.menu_status))form.querySelector(`[name=menu-status][value=${configState.menu_status}]`).checked=true;
  const query=new URLSearchParams(location.search);
  const requestedIntent=query.get('intent'),requestedStatus=query.get('menu_status');
  const validChoice=(requestedIntent===null||['card_order','menu_consultation'].includes(requestedIntent))&&
    (requestedStatus===null||['existing','needs_development'].includes(requestedStatus))&&
    !(requestedIntent==='menu_consultation'&&requestedStatus==='existing');
  const lockedAttempt=storedAttempt?.state==='uncertain'||(storedAttempt?.state==='complete'&&uuid.test(storedAttempt.leadId||''));
  function applyExplicitChoice(){
    if(!validChoice||(!requestedIntent&&!requestedStatus))return;
    const intent=requestedIntent||(requestedStatus?'card_order':null);
    if(intent)form.querySelector(`[name=menu-intent][value=${intent}]`).checked=true;
    const status=requestedIntent==='menu_consultation'?'needs_development':requestedStatus;
    if(status)form.querySelector(`[name=menu-status][value=${status}]`).checked=true;
  }
  if(!lockedAttempt)applyExplicitChoice();
  form.querySelector('[data-menu-add]').addEventListener('click',()=>{addRow();update();rowsBox.lastElementChild.querySelector('select').focus();});
  rowsBox.addEventListener('click',e=>{if(!e.target.closest('[data-menu-remove]'))return;const row=e.target.closest('[data-menu-row]');if(rowsBox.children.length>1)row.remove();else{row.querySelector('select').value='';row.querySelector('input').value='1';}update();});
  form.addEventListener('input',e=>{if(e.target.matches('[name=menu-variant],[name=menu-quantity]'))update();});
  form.addEventListener('change',e=>{if(e.target.name==='menu-intent'||e.target.name==='menu-status'||e.target.name==='menu-variant'||e.target.name==='menu-quantity')update();});
  document.querySelectorAll('[data-menu-development-link]').forEach(link=>link.addEventListener('click',()=>{form.querySelector('[name=menu-status][value=needs_development]').checked=true;update();}));
  function snapshot(){return {locale,name:q('name').value,phone:q('phone').value,messenger:selected('messenger'),intent:selected('menu-intent'),menu_status:selected('menu-status'),
    menu_url:q('menu-url').disabled?'':q('menu-url').value.trim(),items:selected('menu-intent')==='menu_consultation'?[]:rowValues(),comment:q('comment').value,consent:q('consent').checked,website:q('website').value};}
  function show(message,status){summary.textContent=message;summary.hidden=false;result.textContent=message;result.hidden=false;result.dataset.status=status;result.focus();}
  function lock(value){for(const input of form.querySelectorAll('input,select,textarea,button'))if(!['hidden','submit'].includes(input.type)&&!input.hasAttribute('data-menu-new-request'))input.disabled=value;if(!value)update();note.hidden=!value;if(value)note.textContent=P('Попередню спробу ще не підтверджено. Повторимо ту саму заявку, щоб не створити дублікат.','The previous attempt is not confirmed. We will retry the same enquiry to avoid a duplicate.');}
  function completeForm(leadId,previous=false,serverQuote=null){complete=true;submit.hidden=true;submit.disabled=true;note.hidden=true;show((previous?P('Попередню заявку вже збережено. Номер: ','Your previous enquiry was already saved. Reference: '):selected('menu-intent')==='menu_consultation'?P('Дякуємо! Запит на консультацію отримано. Номер: ','Thank you! Your consultation request has been received. Reference: '):P('Дякуємо! Заявку отримано. Номер: ','Thank you! Your request has been received. Reference: '))+leadId+(locale==='pl'&&Number.isSafeInteger(serverQuote?.amount)?` · Cena kart: ${fmt(serverQuote.amount)}. Zaliczka: ${fmt(serverQuote.deposit)}. Pozostała kwota: ${fmt(serverQuote.balance)}.`:''),previous?'existing':'success');safeStorage.set(attemptKey,JSON.stringify({key,state:'complete',leadId}));newRequest.hidden=false;}
  newRequest.addEventListener('click',()=>{pending=null;complete=false;key=crypto.randomUUID();safeStorage.remove(attemptKey);lock(false);applyExplicitChoice();update();submit.hidden=false;submit.disabled=!endpoint;result.hidden=true;summary.hidden=true;newRequest.hidden=true;q('name').focus();});
  update();
  document.querySelectorAll('.locale-switch').forEach(link=>link.addEventListener('click',()=>{
    if(form.closest('[hidden]'))return;
    const intent=selected('menu-intent'),quantity=intent==='card_order'?rowValues().reduce((sum,item)=>sum+item.quantity,0):0;
    link.href=window.nfcSwitchLocaleURL(link.href,{intent,menu_status:selected('menu-status'),quantity:quantity>0?String(quantity):''});
  }));
  try{endpoint=leadEndpoint(endpoint);}catch{endpoint='';}
  if(!endpoint){submit.disabled=true;form.onsubmit=e=>e.preventDefault();notice.textContent=P('Локальний перегляд: форму можна заповнити, але заявки не надсилаються.','Local preview: you can configure the form, but enquiries are not sent.');}
  else{
    notice.textContent=P('Надсилаємо контакт, обрані виконання, статус меню та, якщо воно вже є, посилання на меню, яке можуть відкрити гості, для опрацювання заявки.','We send your contact, selected formats, menu status and, if you already have a menu, the link guests can open to process the enquiry.');
    submit.disabled=false;
    form.onsubmit=async e=>{e.preventDefault();if(busy||complete)return;busy=true;submit.disabled=true;summary.hidden=true;result.hidden=true;
    try{if(!pending){const payload=menuLeadPayload(snapshot(),{basePath,pathname});pending={key,payload,uncertain:false};safeStorage.set(attemptKey,JSON.stringify({key,state:'uncertain'}));}
      lock(true);const receipt=await submitLead(endpoint,pending);if(locale==='pl'){const expected=menuQuote(pending.payload.items,pending.payload.intent,poland);if(receipt.quote?.currency!=='PLN'||receipt.quote.amount!==expected.amount||receipt.quote.deposit!==expected.deposit)throw Error('request_unconfirmed');}completeForm(receipt.leadId,false,receipt.quote);}
    catch(error){if(error.message==='existing_request'&&uuid.test(error.leadId||'')){completeForm(error.leadId,true);return;}
      if(pending&&!pending.uncertain){pending=null;key=crypto.randomUUID();safeStorage.remove(attemptKey);lock(false);}
      show(error.message==='invalid_menu_url'?P('Вкажіть повне публічне посилання на онлайн-меню.','Enter the full public online menu URL.'):error.message.startsWith('invalid_')?P('Перевірте контакт, виконання, цілу кількість від 1, статус меню, посилання та згоду.','Check the contact, format, whole quantity of at least 1, menu status, URL and consent.'):P('Не вдалося підтвердити отримання заявки. Дані залишаються у формі. Спробуйте ще раз або зв’яжіться з нами у месенджері.','We could not confirm receipt of your request. Your details remain in the form. Retry or contact us in a messenger.'),'error');}
    finally{busy=false;submit.disabled=complete;}};
  }
  if(storedAttempt?.state==='complete'&&uuid.test(storedAttempt.leadId||''))completeForm(storedAttempt.leadId,true);
  else if(storedAttempt?.state==='uncertain'){submit.disabled=true;show(P('Попередня заявка може бути збережена. Дані з минулої спроби не зберігаються у браузері; зв’яжіться з нами, щоб перевірити статус, або свідомо створіть нову заявку.','A previous enquiry may have been saved. Its details were not stored in the browser; contact us to check its status or explicitly start a new enquiry.'),'uncertain');newRequest.hidden=false;}
}

if(typeof document!=='undefined'){
  const start=async()=>{
    const endpoint=document.documentElement.dataset.leadEndpoint||'',basePath=document.documentElement.dataset.publicBasePath||'',locale=document.documentElement.lang;
    let poland=null;if(locale==='pl'){try{const response=await fetch(basePath+'/assets/content.json');if(!response.ok)throw Error('content_unavailable');poland=validatePolandCommerce((await response.json()).commerce.poland);}catch{return;}}
    document.querySelectorAll('[data-menu-form]').forEach(form=>mountMenuForm(form,{endpoint,basePath,locale,pathname:location.pathname,poland}));
    for(const trigger of document.querySelectorAll('[data-menu-activate]'))trigger.addEventListener('click',e=>{e.preventDefault();const general=document.querySelector('[data-commerce-form]'),menu=document.querySelector('[data-menu-inline]'),form=menu?.querySelector('[data-menu-form]');if(!general||!menu||!form)return;
      for(const name of ['name','phone','comment']){const source=general.elements.namedItem(name);const dest=form.elements.namedItem(name);if(source&&dest&&!dest.value)dest.value=source.value;}
      const messenger=general.querySelector('[name=messenger]:checked');if(messenger)form.querySelector(`[name=messenger][value=${messenger.value}]`).checked=true;
      if(general.elements.namedItem('consent')?.checked)form.elements.namedItem('consent').checked=true;
      general.hidden=true;menu.hidden=false;menu.scrollIntoView({block:'start'});form.querySelector('[name=name]').focus();});
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
}
