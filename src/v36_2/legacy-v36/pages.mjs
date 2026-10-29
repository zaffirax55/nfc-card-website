// Shared Pages build/client boundary. Only explicit public configuration belongs here.
import {instagramProfileURL} from './commerce-contract.mjs';
import {MINI_PRODUCTS,MINI_QUANTITIES,miniQuote} from './mini-contract.mjs';
import {requestNotice} from './inbound-notice.mjs';
export function publicBasePath(value = '') {
  if (value === '' || value === '/') return '';
  if (typeof value !== 'string' || !/^\/(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_-]+\/?$/.test(value)) {
    throw Error('Invalid NFC_PUBLIC_BASE_PATH');
  }
  return value.replace(/\/$/, '');
}

export function publicURL(value, {basePath = '', origin = ''} = {}) {
  if (!basePath || typeof value !== 'string') return value;
  if (origin && value === origin) return origin + basePath + '/';
  if (origin && value.startsWith(origin + '/')) return origin + publicURL(value.slice(origin.length), {basePath});
  if (!value.startsWith('/') || value.startsWith('//')) return value;
  if (value === basePath || value.startsWith(basePath + '/') || value.startsWith(basePath + '?') || value.startsWith(basePath + '#')) return value;
  return basePath + value;
}

export function publicData(value, publication) {
  if (typeof value === 'string') return publicURL(value, publication);
  if (Array.isArray(value)) return value.map(item => publicData(item, publication));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, publicData(item, publication)]));
  return value;
}

export function publicHTML(html, publication) {
  return html.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g, (_, json) =>
    '<script type="application/ld+json">' + JSON.stringify(publicData(JSON.parse(json), publication)).replaceAll('<', '\\u003c') + '</script>')
    .replace(/\b(href|src|poster|action|data-source)="([^"]*)"/g, (_, attr, value) => `${attr}="${publicURL(value, publication)}"`)
    .replace(/\bsrcset="([^"]*)"/g, (_, value) => 'srcset="' + value.split(',').map(item => item.trim().split(/\s+/).map((part, i) => i ? part : publicURL(part, publication)).join(' ')).join(', ') + '"')
    .replace(/(<meta property="og:url" content=")([^"]*)/g, (_, start, value) => start + publicURL(value, publication))
    .replace(/(name="source" value=")([^"]*)/g, (_, start, value) => start + publicURL(value, publication));
}

export function publicCSS(css, publication) {
  return css.replace(/url\((['"]?)(\/[^)'"\s]+)\1\)/g, (_, quote, value) => `url(${quote}${publicURL(value, publication)}${quote})`);
}

// This is a public browser-facing bridge URL, never a private gateway URL or a
// credential-bearing URL. Supplying it is an operator's explicit configuration;
// URL validation alone does not establish that a service stores leads durably.
export function leadEndpoint(value = '') {
  if (value === '') return '';
  const invalid = () => { throw Error('Invalid NFC_LEAD_ENDPOINT: public HTTPS URL without credentials, query or fragment required'); };
  if (typeof value !== 'string' || value.length > 2048 || /[\s<>"'\\%?#]/.test(value) || !value.startsWith('https://')) return invalid();
  let url;
  try { url = new URL(value); } catch { return invalid(); }
  const host = url.hostname;
  if (url.protocol !== 'https:' || url.username || url.password || url.port || url.search || url.hash ||
      host.length > 253 || host.split('.').some(label => label.length > 63) ||
      !/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,63}$/.test(host) ||
      /(^|\.)(localhost|local|internal|invalid|test|example)$/.test(host) ||
      ['api.telegram.org', 't.me', 'telegram.me'].includes(host) ||
      url.pathname === '/' || !/^\/(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_-]+\/?$/.test(url.pathname) ||
      value !== url.href) return invalid();
  return url.href;
}

const localized = (locale, uk, en, pl) => locale === 'uk' ? uk : locale === 'en' ? en : locale === 'pl' ? pl : (() => { throw Error('Unsupported locale'); })();
export const unavailable = locale => localized(locale,
  'Онлайн-заявки тимчасово недоступні у preview-версії. Функцію буде активовано після підключення захищеного збереження заявок.',
  'Online enquiries are temporarily unavailable in the preview version. The feature will be enabled after secure lead storage is connected.',
  'W wersji podglądowej nie można obecnie wysyłać zgłoszeń. Funkcja zostanie uruchomiona po podłączeniu bezpiecznego zapisu zgłoszeń.');

export const previewCSS = '.header .preview-brand{display:flex;flex-direction:column;justify-content:center;gap:2px;flex-shrink:0}.preview-badge{display:block;width:max-content;font-size:9px;line-height:1.1;letter-spacing:.08em;font-weight:600;color:var(--nfc-steel-700)}';

export function submissionNotice(locale,selection){
 if(selection==='mini-ready')return localized(locale,
  'Надсилаємо контакт, готовий дизайн Mini та кількість або запит поради. Заявка без оплати.',
  'We send your contact, ready-made Mini selection and quantity or advice request. No payment is due for the enquiry.',
  'Przesyłamy kontakt, gotowy wzór Mini oraz liczbę kart lub prośbę o poradę. Zapytanie jest bezpłatne.');
 if(selection==='mini-branded')return localized(locale,
  'Надсилаємо контакт, Branded Mini, матеріали бренду та кількість або запит безкоштовних концепцій. Заявка без оплати.',
  'We send your contact, Branded Mini, brand details and quantity or free concepts request. No payment is due for the enquiry.',
  'Przesyłamy kontakt, wybór Branded Mini, materiały marki oraz liczbę kart lub prośbę o bezpłatne projekty. Zapytanie jest bezpłatne.');
 if(selection==='niche')return localized(locale,
  'Надсилаємо ім’я, контакт, обране рішення, тип запиту та кількість або запит поради. Перший макет безкоштовний.',
  'We send your name, contact, selected solution, request type and quantity or advice request. The first mockup is free.',
  'Przesyłamy imię, dane kontaktowe, wybrane rozwiązanie, rodzaj zapytania i liczbę kart lub prośbę o poradę. Pierwsza wizualizacja jest bezpłatna.');
 return selection==='instagram'
  ? localized(locale,'Надсилаємо ім’я, контакт, кількість, Instagram-посилання, коментар і згоду для опрацювання заявки.','We send your name, contact, quantity, Instagram profile URL, comment and consent to process the enquiry.','Przesyłamy imię, dane kontaktowe, liczbę kart, link do profilu na Instagramie, komentarz i zgodę, aby obsłużyć zgłoszenie.')
  : localized(locale,'Надсилаємо лише ім’я, контакт, картку та кількість. Коментар і додаткові деталі погодимо в месенджері.','We send only your name, contact, card and quantity. Please share comments and additional details in a messenger.','Przesyłamy tylko imię, dane kontaktowe, wybraną kartę i liczbę sztuk. Komentarz oraz pozostałe szczegóły ustalimy w komunikatorze.');
}
export function pagesFormHTML(html, {endpoint = '', locale, esc}) {
  if (html.includes('data-commerce-form data-variant="branded"')) {
    const L = (uk,en,pl) => localized(locale,uk,en,pl);
    html = html.replace('<div class="messenger-options">', '<div class="messenger-options"><label class="messenger-option"><input type="radio" name="messenger" value="email" required><span>Email</span><span>' + L('Комерційна пропозиція','Commercial proposal','Oferta handlowa') + '</span></label>');
    const fields = `<fieldset data-email-proposal hidden disabled><legend>${L('Пропозиція на email','Proposal by email','Oferta na email')}</legend>
      <div class="field"><label for="proposal-email">Email *</label><input id="proposal-email" type="email" name="proposalEmail" maxlength="254" autocomplete="email" required></div>
      <div class="field"><label for="proposal-business">${L('Назва бізнесу *','Business name *','Nazwa firmy *')}</label><input id="proposal-business" name="proposalBusiness" maxlength="150" required></div>
      <div class="field"><label for="proposal-niche">${L('Сфера бізнесу *','Business type *','Branża *')}</label><select id="proposal-niche" name="proposalNiche" required><option value="">${L('Оберіть','Choose','Wybierz')}</option><option value="dental_orthodontics">${L('Стоматологія','Dental clinic','Stomatologia')}</option><option value="beauty_salons_barbershops">${L('Салон краси / барбершоп','Beauty salon / barbershop','Salon urody / barbershop')}</option><option value="other">${L('Інше','Other','Inna')}</option></select></div>
      <div class="field"><label for="proposal-url">${L('Сайт бізнесу — необов’язково','Business website — optional','Strona firmy — opcjonalnie')}</label><input id="proposal-url" type="url" name="proposalUrl" maxlength="300" placeholder="https://"></div>
      <label><input type="checkbox" name="proposalRequested" required> ${L('Прошу надіслати комерційну пропозицію NFC CARD на вказаний email щодо цієї заявки. Це не підписка на розсилку.','Please email me an NFC CARD commercial proposal about this enquiry. This is not a mailing list subscription.','Proszę o przesłanie oferty NFC CARD na podany email w sprawie tego zgłoszenia. To nie jest zapis do newslettera.')}</label></fieldset>`;
    html = html.replace('</fieldset>', '</fieldset>' + fields);
    html = html.replace('Leave your contact details. We will message you in your selected messenger and confirm the details.','Choose messenger or request a proposal by email.');
    html = html.replace(L('Зручний месенджер *','Preferred messenger *','Preferowany komunikator *'), L('Спосіб відповіді *','Reply channel *','Sposób odpowiedzi *'));
  }
  const nicheType=html.includes('data-niche-form')?(html.includes('data-design-mode="branded"')?'mini-branded':'mini-ready'):null;
  const notice = endpoint ? submissionNotice(locale,nicheType|| (html.includes('data-commerce-form data-variant="instagram"')?'instagram':'')) : unavailable(locale);
  // Native submission is inert even if either client script fails to load. Only
  // the mounted JSON client may enable the submit control after initialization.
  return html.replace(/action="\/api\/leads" method="post"/g, 'data-pages-form action="" method="dialog"')
    .replace(/<div class="preview-notice">[\s\S]*?<\/div>/g, `<div class="preview-notice" role="status">${esc(notice)}</div>`)
    .replace(/(<button class="button submit-button" type="submit")/g, '$1 disabled')
    .replace(/(<div class="form-result"[^>]*><\/div>)/g, '$1<button class="button secondary" type="button" data-new-request hidden>' + localized(locale,'Створити іншу заявку','Start another enquiry','Wyślij kolejne zgłoszenie') + '</button>');
}

const products = ['standard', 'branded', 'bulk', 'consultation', 'instagram'];
const quantities = ['1', '2', 'more'];
const solutions = Object.freeze({
  'beauty-review-card': {niche:'beauty_salon',route:'/solutions/beauty-review-card'},
  'restaurant-review-card': {niche:'restaurant',route:'/solutions/restaurant-review-card'}
});
const miniRoutes=Object.freeze(Object.fromEntries(Object.keys(MINI_PRODUCTS).map(id=>[id,'/solutions/'+id])));
const channels = ['telegram', 'whatsapp', 'viber'];
const idempotencyKey = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
export function leadPayload(input, {basePath = '', pathname, utm = {}}) {
  basePath = publicBasePath(basePath);
  const solutionId=typeof input.solution==='string'?input.solution:'';
  const mini=MINI_PRODUCTS[solutionId]&&(input.productFamily==='nfc-review-card-mini'||solutionId.startsWith('branded-'))?MINI_PRODUCTS[solutionId]:null;
  const solution=mini?null:solutionId?solutions[solutionId]:null;
  if(solutionId&&!solution&&!mini)throw Error('invalid_fields');
  const advice=solution&&input.quantity==='advice';
  const miniAdvice=mini&&input.quantity==='advice',miniConcepts=mini&&input.quantity==='concepts';
  const miniPhysical=mini&&!miniAdvice&&!miniConcepts;
  const miniQuantity=miniPhysical?(input.quantity==='other'?Number(input.customQuantity):Number(input.quantity)):null;
  if(mini&&(miniConcepts&&mini.designMode!=='branded'||miniPhysical&&(!Number.isSafeInteger(miniQuantity)||miniQuantity<1||miniQuantity>10000)||
    input.quantity==='other'&&MINI_QUANTITIES.includes(miniQuantity)||
    !['1','2','other','advice','concepts'].includes(input.quantity)||
    ['logoNote','brandLink','brandStyle','designSplitNote'].some(key=>typeof (input[key]??'')!=='string'||(input[key]??'').length>300)||
    (mini.designMode==='ready'&&['logoNote','brandLink','brandStyle','designSplitNote'].some(key=>input[key]))))throw Error('invalid_fields');
  if(input.variant==='instagram'&&!instagramProfileURL(input.instagramUrl))throw Error('invalid_instagram_url');
  const emailRoute=input.messenger==='email' && input.variant==='branded' && !solution && !mini;
  const email=String(input.proposalEmail||'').trim();
  if(emailRoute&&(!/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$/.test(email)||email.length>254||
    !String(input.proposalBusiness||'').trim()||input.proposalBusiness.length>150||
    !['dental_orthodontics','beauty_salons_barbershops','other'].includes(input.proposalNiche)||input.proposalRequested!==true))throw Error('invalid_fields');
  const name = String(input.name || '').trim().normalize('NFC'), phone = String(input.phone || '').trim();
  if (!['uk', 'en', 'pl'].includes(input.locale) || !products.includes(input.variant) || !(quantities.includes(input.quantity)||advice||mini) ||
      (solution&&input.variant!=='branded') ||(mini&&input.variant!==(mini.designMode==='branded'?'branded':'standard')) ||
      (input.variant === 'instagram' && (!['1','2'].includes(input.quantity)||!instagramProfileURL(input.instagramUrl)||typeof input.comment!=='string'||input.comment.length>2000)) ||
      (input.variant === 'bulk' && input.quantity !== 'more') || !name || name.length > 100 || /[\x00-\x1f\x7f\u202a-\u202e\u2066-\u2069]/u.test(name) ||
      ((!emailRoute||phone)&&(!/^\+?[\d ()-]+$/.test(phone) || phone.replace(/\D/g, '').length < 7 || phone.replace(/\D/g, '').length > 15)) ||
      (!emailRoute&&!channels.includes(input.messenger)) || input.consent !== true || input.website) throw Error('invalid_fields');
  const route = String(pathname || '').split(/[?#]/)[0].replace(/\/$/, '') || '/';
  const sourcePage = route === basePath ? basePath + '/' : route;
  const relative = sourcePage.slice(basePath.length);
  if (!sourcePage.startsWith(basePath + '/') || !['/', '/en', '/pl', ...['order','contact','about','solutions/review-card','solutions/branded-review-card','solutions/instagram-card','instagram-card',...Object.keys(miniRoutes).map(id=>'solutions/'+id)].flatMap(r=>['/'+r,'/en/'+r,'/pl/'+r])].includes(relative) ||
      (solution&&!['', '/en', '/pl'].some(prefix=>relative===prefix+solution.route)) ||
      (mini&&!['', '/en', '/pl'].some(prefix=>relative===prefix+miniRoutes[solutionId]))) throw Error('invalid_source_page');
  const payload = {language: input.locale, product: mini?'nfc-review-card-mini':input.variant === 'instagram' ? 'nfc-instagram-card' : input.variant === 'branded' ? 'branded-review-card' : 'review-card',
    ...(miniPhysical?{quantity:miniQuantity}:!advice&&!mini?{quantity:input.quantity === 'more' ? 3 : Number(input.quantity)}:{}), customerName: name,
    contact: {...(phone?{phone:phone.replace(/[ ()-]/g, '')}:{}), ...(emailRoute?{email}:{}), preferredMethod: input.messenger}, sourcePage, ...requestNotice, ...(emailRoute?{formVersion:'NFC-CARD-FORM-V36',privacyNoticeVersion:'NFC-CARD-PRIVACY-V35'}:{}),
    selection: {variant: input.variant, quantity: input.quantity}};
  if(emailRoute)payload.emailProposal={intent:'commercial_offer_by_email',businessName:input.proposalBusiness.trim(),niche:input.proposalNiche,...(String(input.proposalUrl||'').trim()?{businessUrl:input.proposalUrl.trim()}:{}),requested:true};
  if(input.variant==='instagram')Object.assign(payload,{productSchemaVersion:1,product_id:'nfc-instagram-card',sku:'NFC-IG-READY',offer:'ready',instagramUrl:instagramProfileURL(input.instagramUrl),comment:input.comment.trim(),consent:true});
  if(solution)payload.solution={schemaVersion:1,solution_id:solutionId,niche:solution.niche,request_type:'free_first_mockup'};
  if(mini){
    const quantityMode=miniAdvice?'advice':miniConcepts?'free_design_concepts':miniQuote(solutionId,miniQuantity,input.locale).quantityMode;
    payload.solution={schemaVersion:2,product_family:'nfc-review-card-mini',solution_id:solutionId,niche:mini.niche,design_mode:mini.designMode,quantity_mode:quantityMode};
    if(mini.designMode==='branded'){
      const inputs={logo_note:(input.logoNote??'').trim(),website_or_instagram:(input.brandLink??'').trim(),style_note:(input.brandStyle??'').trim()};
      const used=Object.fromEntries(Object.entries(inputs).filter(([,value])=>value));
      if(Object.keys(used).length)payload.solution.brand_inputs=used;
      if((input.designSplitNote??'').trim())payload.solution.design_split_note=input.designSplitNote.trim();
    }
  }
  const attribution = {};
  for (const key of ['source', 'medium', 'campaign', 'term', 'content']) {
    const value = utm['utm_' + key];
    if (typeof value === 'string' && value.trim() && !/[\x00-\x1f\x7f\u202a-\u202e\u2066-\u2069]/u.test(value)) attribution[key] = value.trim().normalize('NFC').slice(0, 100);
  }
  if (Object.keys(attribution).length) payload.utm = attribution;
  return payload;
}

const requestOptions = {mode: 'cors', credentials: 'omit', redirect: 'error', cache: 'no-store', referrerPolicy: 'no-referrer'};
export async function submitLead(endpoint, pending, fetcher = globalThis.fetch, wait = ms => new Promise(resolve => setTimeout(resolve, ms))) {
  endpoint = leadEndpoint(endpoint);
  if (!endpoint) throw Error('unavailable');
  if (!idempotencyKey.test(pending.key)) throw Error('invalid_idempotency_key');
  // A fresh signed challenge is independent of the stable lead body/key. Renewing
  // it on retry cannot create another lead and never needs a browser secret.
  const url = endpoint + '/challenge?sourcePage=' + encodeURIComponent(pending.payload.sourcePage);
  const check = await fetcher(url, {...requestOptions, signal: AbortSignal.timeout(20000)});
  if (!check.ok) throw Error('challenge_unavailable');
  const challenge = await check.json();
  if (typeof challenge.challenge !== 'string' || challenge.challenge.length > 800 ||
      !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{43}$/.test(challenge.challenge) || challenge.minimumDelayMs !== 2000) throw Error('invalid_challenge');
  await wait(challenge.minimumDelayMs + 100);
  const wasUncertain = pending.uncertain === true;
  pending.uncertain = true;
  const response = await fetcher(endpoint, {method: 'POST', mode: 'cors', credentials: 'omit', redirect: 'error',
    cache: 'no-store', referrerPolicy: 'no-referrer',
    headers: {'Content-Type': 'application/json', 'Idempotency-Key': pending.key},
    body: JSON.stringify({...pending.payload, website: '', challenge: challenge.challenge}), signal: AbortSignal.timeout(20000)});
  if (response.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') throw Error('request_unconfirmed');
  const value = await response.json();
  if (!response.ok) {
    if (response.status === 409 && value?.code === 'idempotency_conflict' && idempotencyKey.test(value.existingLeadId || ''))
      throw Object.assign(Error('existing_request'), {leadId: value.existingLeadId});
    if (!wasUncertain && response.status === 422 && ['invalid_payload', 'invalid_selection'].includes(value?.code)) {
      pending.uncertain = false;
      throw Error('invalid_fields');
    }
    throw Error('request_unconfirmed');
  }
  // Only the PostgreSQL COMMIT receipt establishes success; delivery is separate.
  if (response.status !== 202 || value?.ok !== true || value.source !== 'NFC_CARD' || value.durableSaved !== true ||
      typeof value.leadId !== 'string' || !idempotencyKey.test(value.leadId)) throw Error('request_unconfirmed');
  return {leadId: value.leadId, durableSaved: true, ...(value.quote === undefined ? {} : {quote: value.quote})};
}

export function mountPagesForm(form, {endpoint, basePath, locale, pathname, attribution, selection, select, lockSelection, event, quoteForSelection, send=submitLead, validateEndpoint=leadEndpoint, payloadFactory=leadPayload}) {
  const P = (uk, en, pl) => localized(locale, uk, en, pl), q = name => form.elements.namedItem(name);
  const submit = form.querySelector('[type=submit]'), result = form.querySelector('.form-result'), note = form.querySelector('.pending-notice');
  const label = submit.textContent;
  try { endpoint = validateEndpoint(endpoint); } catch { endpoint = ''; }
  if (!endpoint) {
    submit.disabled = true;
    form.querySelector('.preview-notice').textContent = unavailable(locale);
    form.onsubmit = e => { e.preventDefault(); };
    form.addEventListener('change', e => {
      if (['variant', 'quantity'].includes(e.target.name)) select({variant: q('variant').value, quantity: q('quantity').value});
    });
    form.dataset.enhanced = 'true';
    return;
  }
  const syncEmail=()=>{const fields=form.querySelector('[data-email-proposal]');if(!fields)return;const email=q('messenger').value==='email';fields.hidden=!email;fields.disabled=!email;q('phone').required=!email;const phoneLabel=form.querySelector('label[for="f-phone"]');if(phoneLabel){phoneLabel.dataset.original??=phoneLabel.textContent;phoneLabel.textContent=email?P('Телефон — необов’язково','Phone — optional','Telefon — opcjonalnie'):phoneLabel.dataset.original;}submit.textContent=email?P('Запросити пропозицію на email','Request proposal by email','Poproś o ofertę na email'):label;};
  form.addEventListener('change',e=>{if(e.target.name==='messenger'){syncEmail();updateNotice();}});syncEmail();
  const updateNotice=()=>{if(q('messenger').value==='email'){form.querySelector('.preview-notice').textContent=P('Збережемо ім’я, email, назву й сферу бізнесу, сайт (якщо вказано), картку, кількість і джерело заявки для однієї відповіді на ваш запит. Без підписки на розсилку.','We save your name, email, business name and type, optional website, card, quantity and request source to respond to this enquiry. No mailing list subscription.','Zapisujemy imię, email, nazwę i branżę firmy, opcjonalną stronę, kartę, liczbę i źródło zgłoszenia, aby odpowiedzieć na ten wniosek. Bez zapisu do newslettera.');return;}form.querySelector('.preview-notice').textContent=submissionNotice(locale,form.dataset.solution?(form.dataset.designMode==='branded'?'mini-branded':'mini-ready'):selection().variant);};
  updateNotice();
  let busy = false, pending = null;
  const storageKey = `nfc-public-attempt:${basePath}:${endpoint}:${pathname.replace(/\/$/, '')}`;
  // Only opaque IDs and lifecycle state survive reload. No personal fields,
  // request body or personal-data hash ever enters browser storage.
  let stored;
  try { stored = JSON.parse(sessionStorage.getItem(storageKey) || 'null'); } catch {}
  const recovered = idempotencyKey.test(stored?.key || '') && ['uncertain', 'complete'].includes(stored?.state);
  let key = recovered ? stored.key : crypto.randomUUID(), inheritedUncertainty = recovered && stored.state === 'uncertain';
  form.dataset.attemptState = recovered ? stored.state : 'draft';
  form.applyNicheIntent = quantity => {
    if (form.dataset.productFamily !== 'nfc-review-card-mini' || busy || pending || inheritedUncertainty || form.dataset.complete) return false;
    if (!['1','2','other','advice','concepts'].includes(quantity) || quantity === 'concepts' && form.dataset.designMode !== 'branded') return false;
    select({variant: q('variant').value, quantity});
    updateNotice();
    return true;
  };
  const newRequest = form.querySelector('[data-new-request]');
  function remember(state, leadId) {
    try { sessionStorage.setItem(storageKey, JSON.stringify({key, state, ...(leadId ? {leadId} : {})})); } catch {}
  }
  function clearProfileError(){const input=q('instagramUrl'),error=form.querySelector('#e-instagramUrl');if(input){input.removeAttribute('aria-invalid');input.setAttribute('aria-describedby','instagram-help');}if(error){error.hidden=true;error.textContent='';}}
  q('instagramUrl')?.addEventListener('input',clearProfileError);
  const snapshot = () => ({name: q('name').value, phone: q('phone').value, messenger: q('messenger').value,
    proposalEmail:q('proposalEmail')?.value||'',proposalBusiness:q('proposalBusiness')?.value||'',proposalNiche:q('proposalNiche')?.value||'',proposalUrl:q('proposalUrl')?.value||'',proposalRequested:q('proposalRequested')?.checked===true,
    consent: q('consent').checked, instagramUrl:q('instagramUrl')?.value.trim(),comment:q('comment')?.value||'',
    customQuantity:q('customQuantity')?.value||'',brandLink:q('brandLink')?.value||'',logoNote:q('logoNote')?.value||'',
    brandStyle:q('brandStyle')?.value||'',designSplitNote:q('designSplitNote')?.value||'',
    ...selection(),...(form.dataset.solution?{solution:form.dataset.solution}:{}),
    ...(form.dataset.productFamily?{productFamily:form.dataset.productFamily}:{})});
  function lock(locked) {
    for (const el of form.elements) if (!['hidden', 'submit', 'button'].includes(el.type)) el.disabled = locked;
    lockSelection(locked);
    if(!locked){select(selection());syncEmail();}
    note.hidden = !locked;
    if (locked) note.textContent = P('Результат спроби ще не підтверджено. Повторимо ту саму заявку з тими самими даними, щоб не створити дублікат.',
      'The attempt is not confirmed yet. We will retry the same request with the same details to avoid a duplicate.',
      'Wynik tej próby nie został jeszcze potwierdzony. Ponowimy to samo zgłoszenie z tymi samymi danymi, aby uniknąć duplikatu.');
  }
  function status(message, state) {
    result.textContent = message; result.dataset.status = state; result.hidden = false; result.focus();
  }
  function completed(leadId, previous = false, serverQuote = null) {
    form.dataset.complete = 'true'; submit.hidden = true; submit.disabled = true; note.hidden = true;
    form.dataset.attemptState = 'complete';
    const successBody = pending?.payload?.solution?.quantity_mode === 'free_design_concepts'
      ? P('Запит на безкоштовні варіанти дизайну збережено. Фізичне замовлення не оформлено.',
          'Your request for free design options is saved. No physical order was placed.',
          'Zapisaliśmy prośbę o bezpłatne warianty projektu. Nie złożono zamówienia na karty.')
      : form.dataset.successBody;
    status((previous ? P('Попередню заявку вже збережено. Нові дані не надсилалися. Номер: ', 'Your previous enquiry is already saved. The new details were not submitted. Reference: ', 'Poprzednie zgłoszenie zostało już zapisane. Nie wysłano nowych danych. Numer: ') :form.dataset.solution?form.dataset.successHeading+' — '+successBody+' ' :
      pending?.payload?.contact?.preferredMethod==='email'?P('Запит збережено. Пропозицію підготуємо на вказаний email після перевірки заявки. Це ще не підтвердження відправлення листа. Номер: ','Request saved. We will prepare a proposal for your email after reviewing the enquiry. This does not confirm that an email has been sent. Reference: ','Zgłoszenie zapisane. Po sprawdzeniu przygotujemy ofertę na podany email. To nie jest potwierdzenie wysłania wiadomości. Numer: '):selection().variant==='instagram'?P('Дякуємо! Заявку отримано. Я зв’яжуся з вами, перевірю Instagram-посилання та уточню деталі замовлення. Номер: ','Thank you! Your enquiry has been received. I will contact you, check the Instagram link and confirm your order details. Reference: ','Dziękuję! Otrzymałem zgłoszenie. Skontaktuję się z Tobą, sprawdzę link do profilu na Instagramie i ustalę szczegóły zamówienia. Numer: '):P('Дякуємо! Заявку збережено. Відповімо обраним вами способом. Номер: ', 'Thank you! Your request is saved. We will reply through your selected channel. Reference: ', 'Dziękujemy! Zgłoszenie zostało zapisane. Odpowiemy wybraną drogą. Numer: ')) + leadId + (locale==='pl'&&Number.isSafeInteger(serverQuote?.amount)?` · Cena produktów: ${serverQuote.amount} PLN. Zaliczka: ${serverQuote.deposit} PLN.`:''), previous ? 'existing' : 'success');
    remember('complete', leadId);
    if (newRequest) newRequest.hidden = false;
  }
  if (newRequest) newRequest.onclick = () => {
    if (busy || !form.dataset.complete && form.dataset.attemptState !== 'uncertain') return;
    delete form.dataset.complete; pending = null; inheritedUncertainty = false; key = crypto.randomUUID();
    form.dataset.attemptState = 'draft';
    try { sessionStorage.removeItem(storageKey); } catch {}
    lock(false); submit.hidden = false; submit.disabled = false; newRequest.hidden = true; result.hidden = true;
    q('name').focus?.();
  };
  form.addEventListener('change', e => {
    if (pending) return;
    if (['variant', 'quantity'].includes(e.target.name)) {
      select({variant: q('variant').value, quantity: q('quantity').value});
      updateNotice();
      event(e.target.name === 'variant' ? 'product_variant_select' : 'quantity_select', selection());
    }
  });
  form.onsubmit = async e => {
    e.preventDefault();
    if (busy || form.dataset.complete) return;
    if (!pending && !form.reportValidity()) return;
    busy = true; submit.disabled = true; submit.textContent = P('Надсилаємо…', 'Sending…', 'Wysyłanie…');
    form.setAttribute('aria-busy', 'true'); result.hidden = true;
    try {
      if (!pending) {
        clearProfileError();
        const payload = payloadFactory({...snapshot(), locale, website: q('website').value}, {basePath, pathname, utm: attribution});
        pending = {key, payload, uncertain: inheritedUncertainty};
        form.dataset.attemptState = 'uncertain';
        // Conservative before transport: a page close at any point may hide a COMMIT.
        remember('uncertain');
      }
      lock(true);
      const receipt = await send(endpoint, pending);
      if(form.dataset.productFamily==='nfc-review-card-mini'&&MINI_PRODUCTS[form.dataset.solution]){
        const sent=pending.payload,mode=sent.solution.quantity_mode;
        const expected=miniQuote(sent.solution.solution_id,sent.quantity,locale,mode==='advice'?'quantity_advice':mode==='free_design_concepts'?'free_design_concepts':'physical_order');
        if(receipt.quote?.currency!==expected.currency||receipt.quote?.amount!==expected.amount||
           receipt.quote?.deposit!==expected.deposit)throw Error('request_unconfirmed');
      }
      if(locale==='pl'){
        if(form.dataset.productFamily!=='nfc-review-card-mini'||!MINI_PRODUCTS[form.dataset.solution]){
          const expected=quoteForSelection?.(pending.payload.selection?.variant,pending.payload.selection?.quantity);
          if(!expected||receipt.quote?.currency!=='PLN'||receipt.quote.amount!==expected.amount||
            (expected.amount!==null&&receipt.quote.deposit!==expected.deposit))throw Error('request_unconfirmed');
        }
      }
      completed(receipt.leadId,false,receipt.quote);
      event('order_submit_success', selection());
    } catch (error) {
      if (error.message === 'existing_request') { completed(error.leadId, true); return; }
      if (!pending?.uncertain && !inheritedUncertainty) {
        pending = null; lock(false); key = crypto.randomUUID();
        try { sessionStorage.removeItem(storageKey); } catch {}
      }
      if(error.message==='invalid_instagram_url'){
        const message=P('Вкажіть повне HTTPS-посилання саме на Instagram-профіль, без дописів, Reels або параметрів посилання.','Enter the full HTTPS Instagram profile URL, without posts, Reels or link parameters.','Podaj pełny link HTTPS do profilu na Instagramie. Linki do postów, Reels i linki z dodatkowymi parametrami nie są przyjmowane.');
        status(message,'error');const input=q('instagramUrl'),fieldError=form.querySelector('#e-instagramUrl');
        if(fieldError){fieldError.textContent=message;fieldError.hidden=false;}
        if(input){input.setAttribute('aria-invalid','true');input.setAttribute('aria-describedby','instagram-help e-instagramUrl');input.focus();}
        event('order_submit_error');return;
      }
      status(error.message === 'invalid_fields' ? P('Перевірте ім’я (до 100 символів), телефон, месенджер, картку, кількість, Instagram-посилання (для Instagram Card) і згоду.', 'Check your name (up to 100 characters), phone, messenger, card, quantity, Instagram profile URL (for Instagram Card) and consent.', 'Sprawdź imię (do 100 znaków), numer telefonu, komunikator, kartę, liczbę sztuk, link do profilu na Instagramie (dla Instagram Card) oraz zgodę.') :
        P('Прийняття заявки не підтверджено. Дані та вибір залишаються у формі. Спробуйте ще раз або зв’яжіться з нами в месенджері.',
          'Request acceptance is not confirmed. Your details and selection remain in the form. Retry or contact us in a messenger.',
          'Nie udało się potwierdzić przyjęcia zgłoszenia. Dane i wybrane opcje pozostały w formularzu. Spróbuj ponownie lub skontaktuj się z nami w komunikatorze.'), 'error');
      event('order_submit_error');
    } finally {
      busy = false; submit.disabled = !!form.dataset.complete;
      submit.textContent = form.dataset.productFamily === 'nfc-review-card-mini' ?
        (selection().quantity === 'concepts' ? form.dataset.conceptsSubmit : form.dataset.physicalSubmit) : label;
      if(!pending&&!form.dataset.complete)syncEmail();
      if (!pending && !form.dataset.complete) form.dataset.attemptState = 'draft';
      form.removeAttribute('aria-busy');
    }
  };
  submit.disabled = false; form.dataset.enhanced = 'true';
  if (recovered && stored.state === 'complete' && idempotencyKey.test(stored.leadId || '')) completed(stored.leadId, true);
  if (recovered && stored.state === 'uncertain') {
    lock(true); submit.hidden = true; submit.disabled = true;
    if (newRequest) newRequest.hidden = false;
    status(P('Результат попередньої спроби після перезавантаження невідомий. Перш ніж створювати нову заявку, уточніть його у менеджера. Дані попередньої спроби не зберігалися в браузері.',
      'The previous attempt is unconfirmed after reload. Check with us before starting another enquiry. Its details were not stored in the browser.',
      'Po odświeżeniu wynik poprzedniej próby jest nieznany. Sprawdź go u nas przed nowym zapytaniem. Dane poprzedniej próby nie były przechowywane w przeglądarce.'), 'uncertain');
  }
}
