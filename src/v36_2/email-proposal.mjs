// V36 is an independent, request-scoped v1 flow. The current-main payload,
// challenge, exact email, session recovery and durable receipt logic are reused.
import {pagesFormHTML,mountPagesForm,leadPayload,submitLead,leadEndpoint,unavailable} from './legacy-v36/pages.mjs';
export {leadPayload as emailProposalPayload,submitLead as submitEmailProposal};
export function currentEmailProposalPayload(input,context,config){
 const body=leadPayload(input,context);
 if(config.mode!=='production')return body;
 validateBuildConfig(config);return {...body,privacyNoticeVersion:config.policy.privacyNoticeVersion,currentPolicySha256:config.policy.policySha256};
}
import {isPreview,validateBuildConfig} from './release-policy.mjs';
const localV1='/v1/public/leads/nfc-card',virtualV1='https://nfc-v36-local-only.example.com'+localV1;
const loopback=()=>['localhost','127.0.0.1','[::1]'].includes(globalThis.location?.hostname);
export function localV36Endpoint(value){if(value!==localV1||!loopback())throw Error('local_only');return value;}
export async function submitLocalEmailProposal(endpoint,pending,{fetcher=globalThis.fetch,wait}={}){localV36Endpoint(endpoint);return submitLead(virtualV1,pending,(url,options)=>{if(!url.startsWith(virtualV1)||!loopback())throw Error('local_only');return fetcher(localV1+url.slice(virtualV1.length),{...options,mode:'same-origin'});},wait);}
const words={
 title:['Комерційна пропозиція Branded на email','Branded commercial proposal by email','Oferta Branded na email'],
 privacy:['Політика конфіденційності','Privacy Policy','Polityka prywatności'],name:['Ім’я','Name','Imię'],phone:['Телефон — необов’язково','Phone — optional','Telefon — opcjonalnie'],
 quantity:['Кількість','Quantity','Liczba kart'],send:['Надіслати заявку','Send enquiry','Wyślij zapytanie'],request:['Запросити пропозицію на email','Request proposal by email','Poproś o ofertę na email'],
 consent:['Я погоджуюся з Політикою конфіденційності та обробкою даних для відповіді на заявку.','I agree to the Privacy Policy and processing of my details to respond to this enquiry.','Zgadzam się z Polityką prywatności i przetwarzaniem danych w celu odpowiedzi na zapytanie.'],
 body:['Це запит про Branded Review Card 10×10. Кошик магазину не змінюється.','This enquiry concerns Branded Review Card 10×10. Your shop cart stays unchanged.','Zapytanie dotyczy Branded Review Card 10×10. Koszyk sklepu pozostaje bez zmian.']};
const text=(key,locale)=>words[key][{uk:0,en:1,pl:2}[locale]],base='/nfc-card-website';
export const emailProposalSource=locale=>base+(locale==='uk'?'':'/'+locale)+'/solutions/branded-review-card';
export function emailProposalHTML(locale,config,esc,{embedded=false}={}){
 const L=key=>text(key,locale),path=base+(locale==='uk'?'':'/'+locale);
 if(config.mode==='production')validateBuildConfig(config);
 const consentCopy=config.mode==='production'?esc(config.policy.checkbox[locale]):L('consent');
 const raw=`<form id="email-proposal-form" class="form-card lead-form commerce-form" data-commerce-form data-variant="branded" action="/api/leads" method="post"><div class="preview-notice" role="status"></div><div class="error-summary" role="alert" hidden></div><input type="hidden" name="variant" value="branded"><input type="hidden" name="locale" value="${locale}"><div class="honeypot" aria-hidden="true"><label>Website<input name="website" tabindex="-1" autocomplete="off"></label></div><div class="form-grid"><div class="field"><label for="f-name">${L('name')} *</label><input id="f-name" name="name" maxlength="100" autocomplete="name" required></div><div class="field"><label for="f-phone">${L('phone')}</label><input id="f-phone" name="phone" type="tel" maxlength="80" autocomplete="tel"></div></div><fieldset class="messenger-field"><legend>Email</legend><div class="messenger-options">${['telegram','whatsapp','viber'].map(m=>`<label class="messenger-option"><input type="radio" name="messenger" value="${m}" required><span>${m==='telegram'?'Telegram':m==='whatsapp'?'WhatsApp':'Viber'}</span></label>`).join('')}</div></fieldset><div class="field"><label for="f-quantity">${L('quantity')}</label><select id="f-quantity" name="quantity"><option value="1">1</option><option value="2">2</option><option value="more">3+</option></select></div><label class="check-field"><input name="consent" type="checkbox" required><span>${consentCopy} <a href="${path}/privacy/">${L('privacy')}</a></span></label><p class="pending-notice" role="status" hidden></p><button class="button submit-button" type="submit">${L('send')}</button><div class="form-result" tabindex="-1" aria-live="polite" hidden></div></form>`;
 let form=pagesFormHTML(raw,{endpoint:config.v1Endpoint,locale,esc}).replace('name="messenger" value="email" required','name="messenger" value="email" checked required').replace('data-email-proposal hidden disabled','data-email-proposal');
 if(!isPreview(config)&&!config.v1Endpoint)form=form.replace(unavailable(locale),({uk:'Форму ще не активовано.',en:'The form is not yet enabled.',pl:'Formularz nie został jeszcze włączony.'})[locale]);
 return `<section id="email-proposal" class="wrap bottom-space"><div class="page-head"><${embedded?'h2':'h1'}>${L('title')}</${embedded?'h2':'h1'}><p>${L('body')}</p></div>${form}</section>`;
}
export function mountEmailProposal(config,locale,doc=globalThis.document){
 const form=doc?.querySelector('#email-proposal-form');if(!form||form.dataset.enhanced==='true')return;
 mountPagesForm(form,{payloadFactory:(input,context)=>currentEmailProposalPayload(input,context,config),...(isPreview(config)?{send:submitLocalEmailProposal,validateEndpoint:localV36Endpoint}:{send:submitLead,validateEndpoint:leadEndpoint}),endpoint:config.v1Endpoint,basePath:base,locale,pathname:emailProposalSource(locale),attribution:{},selection:()=>({variant:'branded',quantity:form.elements.quantity.value}),select:selection=>{form.elements.quantity.value=selection.quantity;},lockSelection:()=>{},event:()=>{},quoteForSelection:(_,q)=>({currency:locale==='pl'?'PLN':'UAH',amount:q==='more'?null:locale==='pl'?(q==='2'?299:169):(q==='2'?3600:2000),deposit:locale==='pl'?20:200})});
}
