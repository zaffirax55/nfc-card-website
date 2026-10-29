import {validateBuildConfig} from './release-policy.mjs';
import {publicLegalPage} from './legacy-v36/public-legal.mjs';
export const HISTORIC_PRIVACY_ROUTE='/privacy/archive/nfc-card-privacy-v35/';
const words={uk:{title:'Політика конфіденційності',archive:'Архівна редакція V35',current:'Чинна політика конфіденційності',version:'Редакція'},en:{title:'Privacy policy',archive:'Archived V35 notice',current:'Current privacy policy',version:'Version'},pl:{title:'Polityka prywatności',archive:'Archiwalna wersja V35',current:'Aktualna polityka prywatności',version:'Wersja'}};
export function renderCurrentPrivacy(locale,config,{esc,link}){
 validateBuildConfig(config);if(config.mode!=='production'||!config.policy)throw Error('approved_current_privacy_required');
 const p=config.policy,t=words[locale];
 return `<div class="wrap"><div class="page-head"><h1>${t.title}</h1><p class="small muted" data-notice-version="${esc(p.privacyNoticeVersion)}">${t.version}: ${esc(p.privacyNoticeVersion)}</p></div><div id="v2-privacy" class="prose bottom-space" data-policy-sha256="${esc(p.policySha256)}">${p.sections[locale].map(s=>`<section><h2>${esc(s.heading)}</h2><p>${esc(s.text)}</p></section>`).join('')}<p>${link(HISTORIC_PRIVACY_ROUTE,t.archive,'text-link')}</p></div></div>`;
}
export function renderHistoricPrivacy(locale,{esc,link,url,contacts}){
 const t=words[locale];
 return `<div class="wrap" data-historical-notice="NFC-CARD-PRIVACY-V35"><aside class="inline-note"><strong>${t.archive}.</strong> ${link('/privacy/',t.current,'text-link')}</aside>${publicLegalPage('/privacy',{locale,esc,link:(href,label,cls='')=>`<a href="${href}" class="${cls}">${label}</a>`,url:p=>url(p+'/'),contacts})}</div>`;
}
