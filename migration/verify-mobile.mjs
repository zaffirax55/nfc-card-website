import { chromium } from 'playwright';
const browser=await chromium.launch({headless:true,args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader']});
const base='http://127.0.0.1:8731/nfc-card-website';
const widths=[320,360,375,390,430,768];
let errors=[];
for(const width of widths){
 const page=await browser.newPage({viewport:{width,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 page.on('pageerror',e=>errors.push(width+' JS '+e.message));
 await page.goto(base+'/solutions/',{waitUntil:'domcontentloaded'});
 await page.waitForSelector('.product-card',{timeout:15000});
 await page.waitForTimeout(300);
 const metrics=await page.evaluate(()=>{
 const main=document.querySelector('main'),header=document.querySelector('.header'),card=document.querySelector('.product-card'),buttons=[...document.querySelectorAll('.nfc-glb-button')];
 return {viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,headerWidth:header?.getBoundingClientRect().width,cardWidth:card?.getBoundingClientRect().width,buttons:buttons.length,smallTaps:[...document.querySelectorAll('.nfc-glb-button')].filter(el=>el.getBoundingClientRect().height<44).length};
 });
 console.log('MOBILE',width,JSON.stringify(metrics));
 if(width===390){
  const anim=await page.evaluate(()=>{
   const button=document.querySelector('.nfc-glb-button');
   const card=document.querySelector('.product-card');
   const buttonTransition=getComputedStyle(button).transitionDuration;
   const cardTransition=getComputedStyle(card).transitionDuration;
   return {buttonTransition,cardTransition};
  });
  console.log('MOBILE_MOTION',JSON.stringify(anim));
  if(anim.buttonTransition==='0s'||anim.cardTransition==='0s')errors.push('touch animation disabled');
 }
 if(metrics.scrollWidth>metrics.viewport+2)errors.push(width+' horizontal overflow '+metrics.scrollWidth);
 if(metrics.buttons<3||metrics.smallTaps)errors.push(width+' unusable 3D buttons');
 if([320,390,768].includes(width)){
  await page.locator('[data-glb-model]').first().click();
  await page.locator('model-viewer').waitFor({timeout:15000});
  const modal=await page.locator('.nfc-glb-dialog').evaluate(el=>({open:el.open,scroll:el.scrollHeight,client:el.clientHeight,width:el.getBoundingClientRect().width,viewport:innerWidth}));
  console.log('DIALOG',width,JSON.stringify(modal));
  if(!modal.open||modal.scroll>modal.client+3||modal.width>width)errors.push(width+' dialog overflow');
  await page.screenshot({path:'mobile-'+width+'.png'});
  await page.locator('.nfc-glb-close').click();
 }
 for(const route of ['/','/solutions/beauty-review-card/','/cart/','/order/']){
  await page.goto(base+route,{waitUntil:'domcontentloaded'});
  const m=await page.evaluate(()=>({inner:innerWidth,scroll:document.documentElement.scrollWidth}));
  console.log('ROUTE',width,route,JSON.stringify(m));
  if(route==='/' && [320,390,768].includes(width)){
   await page.locator('[data-nfc-demo]').waitFor({timeout:10000});
   const phone=await page.locator('[data-nfc-demo]').evaluate(el=>{
     const stage=el.querySelector('.nfc-demo-stage').getBoundingClientRect();
     const phone=el.querySelector('.nfc-demo-phone').getBoundingClientRect();
     return {state:el.dataset.state,phoneWidth:phone.width,stageWidth:stage.width,buttons:el.querySelectorAll('[data-demo-reset],[data-demo-pause]').length};
   });
   console.log('PHONE_DEMO',width,JSON.stringify(phone));
   if(phone.phoneWidth<=0||phone.stageWidth<=0||phone.buttons!==2)errors.push(width+' phone demo failed to mount');
   await page.locator('[data-demo-pause]').click();
   if(await page.locator('[data-nfc-demo]').getAttribute('data-paused')!=='true')errors.push(width+' phone pause failed');
   await page.locator('[data-demo-pause]').click();
   await page.locator('[data-demo-reset]').click();
  }
  if(m.scroll>m.inner+2)errors.push(width+' '+route+' horizontal overflow '+m.scroll);
 }
 if(width===390){
   const raw=await (await page.request.get(base+'/')).text();
   console.log('SERVER_LANGUAGE_CONTROLS',raw.includes('data-site-language="pl"'),raw.includes('data-site-language="ru"'));
   if(!raw.includes('data-site-language="pl"')||!raw.includes('data-site-language="ru"'))errors.push('language controls missing from source HTML');
 }
 if(width===390){
   await page.goto(base+'/',{waitUntil:'domcontentloaded'});
   await page.locator('[data-site-preferences]').waitFor({timeout:10000});
   await page.locator('[data-site-theme]').click();
   let theme=await page.evaluate(()=>document.documentElement.dataset.theme);
   console.log('THEME',theme);
   if(theme!=='dark'&&theme!=='light')errors.push('theme toggle unavailable');
   await page.locator('[data-site-language="ru"]').click();
   const translated=await page.locator('.hero h1').textContent();
   console.log('RUSSIAN_HERO',translated);
   if(!translated.includes('карточки'))errors.push('Russian language missing home translation');
   await page.reload({waitUntil:'domcontentloaded'});
   await page.locator('[data-site-preferences]').waitFor({timeout:10000});
   const persisted=await page.evaluate(()=>({theme:document.documentElement.dataset.theme,lang:document.documentElement.dataset.uiLanguage}));
   console.log('PREFERENCES_PERSISTED',JSON.stringify(persisted));
   if(persisted.theme!==theme||persisted.lang!=='ru')errors.push('settings not persistent');
   await page.locator('[data-site-language="en"]').click();
   await page.waitForURL('**/en/**');
   if((await page.locator('html').getAttribute('lang'))!=='en')errors.push('English locale switch failed');
   await page.locator('[data-site-language="pl"]').click();
   await page.waitForURL('**/pl/',{timeout:10000});
   const polish=await page.locator('.hero h1').textContent();
   console.log('POLISH_HERO',polish);
   if(!polish.includes('Karty NFC'))errors.push('Polish homepage not translated');
   const polishSelection=await page.locator('[data-site-language="pl"]').getAttribute('aria-pressed');
   if(polishSelection!=='true')errors.push('Polish selection not active');
   await page.reload({waitUntil:'domcontentloaded'});
   await page.locator('[data-site-language="pl"]').waitFor({timeout:10000});
   if(await page.locator('[data-site-language="pl"]').getAttribute('aria-pressed')!=='true')errors.push('Polish locale not persisted');
   await page.locator('[data-site-language="uk"]').click();
   await page.waitForURL(base+'/',{timeout:10000});
   if((await page.locator('html').getAttribute('lang'))!=='uk')errors.push('Ukrainian locale switch failed');
 }
 if(width===390){
   await page.goto(base+'/',{waitUntil:'domcontentloaded'});
   const transitionSupport=await page.evaluate(()=>typeof document.startViewTransition==='function');
   await page.locator('a[href$="/solutions/"]:visible').first().click();
   await page.waitForURL('**/solutions/');
   await page.locator('.product-card a[href*="/solutions/"]').first().click();
   await page.waitForURL('**/solutions/*/');
   await page.goBack({timeout:10000});
   await page.waitForURL('**/solutions/');
   console.log('NAVIGATION_TRANSITIONS',JSON.stringify({supported:transitionSupport,back:page.url()}));
 }
 await page.close();
}
await browser.close();
if(errors.length){console.error('FAILED',JSON.stringify(errors));process.exit(1)}
console.log('MOBILE_RESPONSIVE_TEST_SUCCESS');
