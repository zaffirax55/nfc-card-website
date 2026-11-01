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
// The actual review-card portrait photo must occupy the card edge to edge,
// not sit inside blue/grey side gutters. Keep its original uncropped ratio.
 const reviewImg=page.locator('.product-card[data-product-id="review-card"] .card-image--photo img');
 await reviewImg.waitFor({timeout:10000});
 await reviewImg.evaluate(img=>img.decode());
 const reviewFit=await reviewImg.evaluate(img=>{
   const a=img.getBoundingClientRect();
   const b=img.closest('.card-image').getBoundingClientRect();
   return {imgWidth:a.width,containerWidth:b.width,imgHeight:a.height,containerHeight:b.height,
     leftGap:a.left-b.left,rightGap:b.right-a.right,topGap:a.top-b.top,bottomGap:b.bottom-a.bottom,
     imageRatio:img.naturalWidth/img.naturalHeight,displayRatio:a.width/a.height};
 });
 console.log('PHOTO_FIT',width,JSON.stringify(reviewFit));
 if(Math.max(Math.abs(reviewFit.leftGap),Math.abs(reviewFit.rightGap),Math.abs(reviewFit.topGap),Math.abs(reviewFit.bottomGap))>1.5)
   errors.push(width+' review photo side gutters remain');
 if(Math.abs(reviewFit.imageRatio-reviewFit.displayRatio)>0.015)
   errors.push(width+' review photo is cropped or distorted');

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
    const gallery=page.locator('.nfc-proof-photo');
    const count=await gallery.count();
    const textSize=await page.locator('.footer nav a').first().evaluate(el=>parseFloat(getComputedStyle(el).fontSize));
    const help=await page.locator('.home-contact>.wrap').evaluate(el=>{
      const s=getComputedStyle(el),r=el.getBoundingClientRect();
      return {padding:s.paddingTop,width:r.width,height:r.height};
    });
    const imageResults=await gallery.locator('img').evaluateAll(async images=>Promise.all(images.map(async img=>{
      img.loading='eager';
      try{await img.decode();return {ok:true,width:img.naturalWidth}}catch{return {ok:false,width:0}}
    })));
    console.log('CONTENT_POLISH',width,JSON.stringify({count,textSize,help,imageResults}));
    if(count!==3||imageResults.some(x=>!x.ok||x.width<100))errors.push(width+' product-photo reviews module broken');
    if(textSize<14.5)errors.push(width+' footer text still too small '+textSize);
    if(help.height>320)errors.push(width+' excessive help banner height '+help.height);
    const evidenceText=await page.locator('.nfc-proof-feedback').textContent();
    if(!evidenceText.includes('Вже користуєтесь NFC CARD?'))errors.push(width+' honest reviews request missing');
  }

  if(route==='/' && [320,390,768].includes(width)){
   await page.locator('[data-nfc-demo]').waitFor({timeout:10000});
   const phone=await page.locator('[data-nfc-demo]').evaluate(el=>{
     const stage=el.querySelector('.nfc-demo-stage').getBoundingClientRect();
     const phone=el.querySelector('.nfc-demo-phone').getBoundingClientRect();
     return {state:el.dataset.state,phoneWidth:phone.width,stageWidth:stage.width,buttons:el.querySelectorAll('[data-demo-reset],[data-demo-pause]').length};
   });
   console.log('PHONE_DEMO',width,JSON.stringify(phone));
   const artwork=await page.locator('.nfc-demo-card img').evaluate(async img=>{
     img.loading='eager';
     await img.decode();
     return {src:img.currentSrc,naturalWidth:img.naturalWidth,naturalHeight:img.naturalHeight};
   });
   console.log('REVIEW_CARD_ARTWORK',width,JSON.stringify(artwork));
   if(!artwork.src.endsWith('/assets/review-card-demo.svg')||artwork.naturalWidth!==640||artwork.naturalHeight!==640)
     errors.push(width+' plain review card artwork missing or broken');
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
   for(const route of ['/','/solutions/','/solutions/beauty-review-card/','/cart/','/order/']){
     await page.goto(base+route,{waitUntil:'load'});
     await page.waitForFunction(()=>getComputedStyle(document.body).backgroundColor==='rgb(10, 17, 26)',{timeout:8000});
     const appearance=await page.evaluate(()=>{
       const css=el=>getComputedStyle(document.querySelector(el));
       const body=css('body'),header=css('.header');
       const panel=document.querySelector('.product-card,.product-summary,.summary-box,.form-card,.nfc-demo');
       const color=(val)=>{const v=val.match(/[0-9.]+/g)?.slice(0,3).map(Number)||[];return v};
       const lightness=v=>{const rgb=color(v);return rgb.length===3?rgb.reduce((a,b)=>a+b,0)/3:255};
       return {bodyBg:body.backgroundColor,headerBg:header.backgroundColor,bodyFg:body.color,panelBg:panel?getComputedStyle(panel).backgroundColor:null,dark:document.documentElement.dataset.theme,bodyLight:lightness(body.backgroundColor)};
     });
     console.log('DARK_ROUTE',width,route,JSON.stringify(appearance));
     if(appearance.dark!=='dark'||appearance.bodyLight>90||!appearance.bodyFg.includes('232, 241, 250'))errors.push('dark theme not applied '+route);
   }
   await page.goto(base+'/',{waitUntil:'domcontentloaded'});
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

// Homepage lower-section whitespace regression: FAQ must use the available
// horizontal space and the contact CTA must sit close to the questions.
for(const width of [390,1366]){
 const page=await browser.newPage({viewport:{width,height:900},deviceScaleFactor:1});
 await page.goto(base+'/',{waitUntil:'load'});
 const compact=await page.evaluate(()=>{
   const faq=document.querySelector('.home-questions');
   const grid=faq?.querySelector('.faq-list');
   const help=document.querySelector('.home-contact>.wrap');
   if(!faq||!grid||!help)return null;
   const f=faq.getBoundingClientRect(),g=grid.getBoundingClientRect(),h=help.getBoundingClientRect();
   return {cols:getComputedStyle(grid).gridTemplateColumns.split(' ').length,
     faqHeight:f.height,gridWidth:g.width,faqWidth:f.width,
     gapToHelp:Math.round(h.top-f.bottom),helpHeight:Math.round(h.height),
     overflow:document.documentElement.scrollWidth-innerWidth};
 });
 console.log('FAQ_LAYOUT',width,JSON.stringify(compact));
 if(!compact||compact.cols!==(width>=680?2:1)||compact.overflow>2||
    compact.gapToHelp>42||compact.helpHeight>(width>=680?240:350))
   errors.push(width+' FAQ and contact whitespace regression');
 await page.screenshot({path:'faq-layout-'+width+'.png',fullPage:false});
 await page.close();
}
// Design service: all five previously empty boxes must contain working visuals.
for(const width of [390,1366]){
 const page=await browser.newPage({viewport:{width,height:900},deviceScaleFactor:1});
 page.on('pageerror',e=>errors.push('design '+width+' JS '+e.message));
 await page.goto(base+'/services/design/',{waitUntil:'load'});
 const cards=page.locator('[data-editorial-media="design"] .editorial-media-example');
 const count=await cards.count();
 const remaining=await page.locator('[data-editorial-media="design"] .editorial-media-placeholder').count();
 const pictureState=await cards.locator('img').evaluateAll(async images=>Promise.all(images.map(async img=>{
  img.loading='eager';try{await img.decode();return {ok:true,w:img.naturalWidth,src:img.getAttribute('src')}}catch{return {ok:false,src:img.getAttribute('src')}}})));
 const layout=await page.evaluate(()=>{
  const grid=document.querySelector('[data-editorial-media="design"]');
  const fig=grid?.querySelector('figure'),bg=fig?getComputedStyle(fig).backgroundColor:null;
  return {width:innerWidth,overflow:document.documentElement.scrollWidth-innerWidth,
  columns:getComputedStyle(grid).gridTemplateColumns.split(' ').length,background:bg};
 });
 const demoLink=await page.locator('[data-media-slot="DESIGN.NFC_DEMO"] a').getAttribute('href');
 console.log('DESIGN_EXAMPLES',width,JSON.stringify({count,remaining,pictureState,layout,demoLink}));
 if(count!==5||remaining!==0||pictureState.length!==6||pictureState.some(p=>!p.ok||p.w<100)||layout.overflow>2||
    layout.columns!==(width>=700?6:1)||!demoLink?.endsWith('/#nfc-phone-demo'))
   errors.push('design page imagery missing or broken '+width);
 await page.locator('[data-site-theme]').click();
 await page.waitForFunction(()=>document.documentElement.dataset.theme==='dark'&&getComputedStyle(document.querySelector('.editorial-media-example')).backgroundColor==='rgb(23, 40, 56)',null,{timeout:4000});
 const dark=await page.locator('.editorial-media-example').first().evaluate(el=>getComputedStyle(el).backgroundColor);
 console.log('DESIGN_DARK_THEME',width,dark);
 if(dark!=='rgb(23, 40, 56)')errors.push('design photo cards dark mode broken '+width);
 await page.close();
}
for(const l of ['en','pl']){
 const page=await browser.newPage({viewport:{width:390,height:844}});
 await page.goto(base+'/'+l+'/services/design/',{waitUntil:'domcontentloaded'});
 const count=await page.locator('[data-editorial-media="design"] .editorial-media-example').count();
 const text=await page.locator('[data-editorial-media="design"] figcaption p').first().textContent();
 console.log('DESIGN_LOCALE',l,JSON.stringify({count,text}));
 if(count!==5||(!text.includes('Ready-made')&&!text.includes('Zdjęcie')))errors.push('design locale missing '+l);
 await page.close();
}
await browser.close();
if(errors.length){console.error('FAILED',JSON.stringify(errors));process.exit(1)}
console.log('MOBILE_RESPONSIVE_TEST_SUCCESS');
