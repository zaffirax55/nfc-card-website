/* The current URL owns description language, including Ukrainian form pages. */
import {descriptionPath,descriptionRouteFromPathname} from './ru-routes.mjs';

const BASE='/nfc-card-website';
const currentRoute=()=>descriptionRouteFromPathname(location.pathname,{base:BASE});
const labels={uk:'Мова сайту',ru:'Язык сайта',en:'Site language',pl:'Język strony'};

document.documentElement.removeAttribute('data-theme');

function updateControls(){
 const locale=currentRoute()?.locale??'uk';
 document.documentElement.dataset.uiLanguage=locale;
 const group=document.querySelector('[data-site-languages]');
 if(!group)return;
 group.setAttribute('aria-label',labels[locale]);
 for(const button of group.querySelectorAll('button[data-site-language]')){
  button.setAttribute('aria-pressed',String(button.dataset.siteLanguage===locale));
  // Only corresponding pages have an actual Russian destination.
  if(button.dataset.siteLanguage==='ru')button.disabled=true;
 }
}

document.addEventListener('click',event=>{
 const button=event.target.closest('button[data-site-language]');
 if(!button||button.disabled)return;
 const language=button.dataset.siteLanguage;
 const current=currentRoute();
 if(!current||!['uk','en','pl'].includes(language))return;
 const destination=descriptionPath(language,current.route,{base:BASE})+location.search+location.hash;
 if(destination!==location.pathname+location.search+location.hash)location.assign(destination);
});

new MutationObserver(updateControls).observe(document.querySelector('#app'),{childList:true});
updateControls();
