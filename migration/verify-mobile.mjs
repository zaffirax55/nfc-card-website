import { chromium } from 'playwright';
import {priceCart} from '../src/v36_2/commerce.mjs';
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
 const headerHitTest=await page.evaluate(()=>{
  const buttons=[...document.querySelectorAll('.site-lang-group button,.header .icon-btn')].filter(e=>getComputedStyle(e).display!=='none');
  return buttons.map(el=>{
   const r=el.getBoundingClientRect();const target=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
   return {label:el.dataset.siteLanguage||el.getAttribute('aria-label')||'menu',x:Math.round(r.x),
     width:Math.round(r.width),height:Math.round(r.height),hit:target===el||el.contains(target),
     inside:r.left>=0&&r.right<=innerWidth+1};
  });
 });
 console.log('HEADER_HITS',width,JSON.stringify(headerHitTest));
 if(headerHitTest.some(x=>!x.hit||!x.inside||x.width<23))
  errors.push(width+' header controls overlap or fall outside viewport');

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
    const demo=page.locator('.hero-tap-hero');
    const info=await demo.evaluate(el=>{
      const rect=el.getBoundingClientRect();
      const image=el.querySelector('.hero-tap-card img');
      const card=el.querySelector('.hero-tap-card');
      const phone=el.querySelector('.hero-tap-phone');
      return {width:rect.width,height:rect.height,image:image.currentSrc,
        steps:el.querySelectorAll('.hero-tap-steps [role=listitem]').length,
        cardAnimation:getComputedStyle(card).animationName,
        phoneAnimation:getComputedStyle(phone).animationName,
        sceneWidth:el.querySelector('.hero-tap-scene').getBoundingClientRect().width};
    });
    console.log('COMPACT_HERO',width,JSON.stringify(info));
    if(info.height>(width>=701?590:width>=380?510:475)||info.steps!==3||!info.image.includes('review-card-demo.svg')||
      info.cardAnimation==='none'||info.phoneAnimation==='none'||info.sceneWidth>width+2)
      errors.push(width+' compact hero illustration failed');
    if(await page.locator('.home-top-demo,[data-nfc-demo]').count()>0)
      errors.push(width+' old oversized demo still present');
    if(await page.locator('[data-site-theme]').count()>0)
      errors.push(width+' unused theme button still present');
    const img=await demo.locator('img').evaluate(async el=>{await el.decode();return el.naturalWidth});
    if(img<100)errors.push(width+' demo artwork failed to decode');
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
   if(await page.locator('[data-site-theme]').count())errors.push('unneeded theme control present');
   await page.locator('[data-site-language="ru"]').click();
   const translated=await page.locator('.hero h1').textContent();
   console.log('RUSSIAN_HERO',translated);
   if(!translated.includes('карточки'))errors.push('Russian language missing home translation');
   await page.reload({waitUntil:'domcontentloaded'});
   await page.locator('[data-site-preferences]').waitFor({timeout:10000});
   const persisted=await page.evaluate(()=>({lang:document.documentElement.dataset.uiLanguage}));
   console.log('PREFERENCES_PERSISTED',JSON.stringify(persisted));
   if(persisted.lang!=='ru')errors.push('language setting not persistent');
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

/* Owner handoff stage R02–R05: logo / larger hero / shared card actions / exact black promos. */
for(const width of [320,390,768,1366]){
 const page=await browser.newPage({viewport:{width,height:900},deviceScaleFactor:1});
 page.on('pageerror',e=>errors.push('stage01 '+width+' JS '+e.message));
 await page.goto(base+'/',{waitUntil:'load'});
 await page.waitForSelector('.owner-home-products .product-card .nfc-glb-button',{timeout:12000});
 await page.waitForTimeout(250);
 const info=await page.evaluate(()=>{
  const box=el=>el?.getBoundingClientRect();
  const bg=el=>el?getComputedStyle(el).backgroundColor:null;
  const logo=box(document.querySelector('.header .logo'));
  const hero=box(document.querySelector('.hero-tap-scene'));
  const phone=box(document.querySelector('.hero-tap-phone'));
  const card=box(document.querySelector('.hero-tap-card'));
  const products=[...document.querySelectorAll('.owner-home-products .product-card')];
  const ctas=products.map(el=>box(el.querySelector('.nfc-glb-button'))?.top).filter(v=>Number.isFinite(v));
  const custom=products.map(el=>box(el.querySelector('.card-design-slot'))?.top).filter(v=>Number.isFinite(v));
  return {logo:logo?.width,phoneW:phone?.width,phoneH:phone?.height,cardW:card?.width,
    heroH:hero?.height,products:products.length,ctaTops:ctas.map(Math.round),
    designTops:custom.map(Math.round),footer:bg(document.querySelector('.footer')),
    promo:bg(document.querySelector('.home-personalisation')),
    overflow:document.documentElement.scrollWidth-innerWidth};
 });
 console.log('HANDOFF_R02_R05',width,JSON.stringify(info));
 const handset=await page.locator('.hero-tap-phone').evaluate(el=>{
   const stage=el.closest('.hero-tap-scene');
   const frame=el.getBoundingClientRect(),box=stage.getBoundingClientRect();
   const ratio=frame.height/frame.width;
   const radius=getComputedStyle(el).borderRadius;
   const island=el.querySelector('.hero-tap-notch').getBoundingClientRect();
   const movement=el.getAnimations().find(anim=>anim.animationName==='tap-phone-move');
   if(movement)movement.currentTime=2400;
   const moving=el.getBoundingClientRect();
   return {ratio,radius,notchWidth:island.width,frameWidth:frame.width,frameHeight:frame.height,
     stageWidth:box.width,stillInside:frame.top>=box.top-2&&frame.bottom<=box.bottom+2,
     movingInside:moving.top>=box.top-2&&moving.bottom<=box.bottom+2};
 });
 console.log('SMARTPHONE_SHAPE',width,JSON.stringify(handset));
 if(handset.ratio<1.95||handset.ratio>2.16||handset.notchWidth<30||!handset.stillInside||!handset.movingInside)
   errors.push(width+' phone must be slim, recognizable and uncut during NFC tap');

 if(info.overflow>2||info.logo<(width>=1101?140:width>=801?115:width>=371?100:80)||
    info.phoneH/info.phoneW<1.95||info.phoneH/info.phoneW>2.16||
    (width>=1101&&(info.heroH<338||info.cardW<145))||
    info.footer!=='rgb(18, 20, 22)'||info.promo!=='rgb(24, 26, 29)')
  errors.push('stage01 header/hero/brand check failed '+width);
 if(width===1366){
   if(info.products!==4||info.ctaTops.length<4||
       Math.max(...info.ctaTops)-Math.min(...info.ctaTops)>5||
       Math.max(...info.designTops)-Math.min(...info.designTops)>5)
     errors.push('stage01 desktop product CTA alignment failed');
 }
 await page.goto(base+'/solutions/',{waitUntil:'load'});
 await page.waitForSelector('.product-grid .product-card .nfc-glb-button',{timeout:12000});
 const cardState=await page.locator('.product-grid .product-card').evaluateAll(elements=>elements.slice(0,4).map(el=>{
  const a=el.querySelector('.card-design-slot');
  const b=el.querySelector('.nfc-glb-button');
  return {slot:!!a,button:!!b,buttonBg:b?getComputedStyle(b).backgroundColor:null,
    slotBeforeBtn:a&&b?a.getBoundingClientRect().bottom<=b.getBoundingClientRect().top+1:null};
 }));
 console.log('HANDOFF_CATALOG',width,JSON.stringify(cardState));
 if(cardState.length<4||cardState.some(x=>!x.slot||!x.button||x.buttonBg!=='rgb(21, 23, 25)'||!x.slotBeforeBtn))
  errors.push('stage01 shared catalog card styles missing '+width);
 await page.screenshot({path:'stage01-'+width+'.png',fullPage:false});
 await page.close();
}

// Expanded NFC hero must own the right column, maintain the handset aspect
// ratio and keep phone/card in view throughout the tap animation.
for(const width of [320,390,768,900,1000,1100,1250,1366,1600]){
 const page=await browser.newPage({viewport:{width,height:900},deviceScaleFactor:1});
 page.on('pageerror',e=>errors.push('expanded hero '+width+' JS '+e.message));
 await page.goto(base+'/',{waitUntil:'load'});
 const measure=await page.evaluate(()=>{
  const box=(el)=>el?.getBoundingClientRect();
  const hero=document.querySelector('.owner-home .hero-grid');
  const stage=document.querySelector('.hero-tap-scene');
  const phone=document.querySelector('.hero-tap-phone');
  const card=document.querySelector('.hero-tap-card');
  const region=document.querySelector('.hero-tap-hero');
  const h=box(hero),r=box(region),s=box(stage),p=box(phone),c=box(card);
  const animation=phone.getAnimations().find(a=>a.animationName==='tap-phone-move');
  if(animation)animation.currentTime=2400;
  const pm=box(phone);
  return {
   heroWidth:h.width,regionWidth:r.width,regionHeight:r.height,
   stageWidth:s.width,stageHeight:s.height,phoneWidth:p.width,phoneHeight:p.height,
   phoneRatio:p.height/p.width,cardWidth:c.width,
   sceneFraction:s.width/r.width,
   phoneInside:p.top>=s.top-2&&p.bottom<=s.bottom+2&&p.left>=s.left-2&&p.right<=s.right+2,
   phoneMovingInside:pm.top>=s.top-2&&pm.bottom<=s.bottom+2&&pm.left>=s.left-2&&pm.right<=s.right+2,
   cardInside:c.left>=s.left-2&&c.right<=s.right+2&&c.top>=s.top-2&&c.bottom<=s.bottom+2,
   scrollOverflow:document.documentElement.scrollWidth-innerWidth
  };
 });
 console.log('EXPANDED_HERO',width,JSON.stringify(measure));
 const bigger=width>=1251?measure.stageHeight>=420&&measure.phoneHeight>=375&&measure.cardWidth>=175
   :width>=1001?measure.stageHeight>=390&&measure.phoneHeight>=345
   :width>=901?measure.stageHeight>=370&&measure.phoneHeight>=325
   :width>=701?measure.stageHeight>=375&&measure.phoneHeight>=340
   :measure.stageHeight>=260;
 if(!bigger||measure.sceneFraction<.89||measure.phoneRatio<1.95||measure.phoneRatio>2.17||
    !measure.phoneInside||!measure.phoneMovingInside||!measure.cardInside||measure.scrollOverflow>2)
  errors.push('expanded hero composition failed at '+width);
 await page.close();
}
// Finishing pass: shared Mini prices are read from the actual priceCart function,
// not copied from static mock text.
for(const quantity of [1,2]){
 const quote=id=>priceCart([{lineId:'test-'+id,productId:id,quantity}], 'UA');
 const a=quote('beauty-review-card'),b=quote('restaurant-review-card');
 console.log('MINI_PRICE_PARITY',quantity,JSON.stringify({beauty:a.total,restaurant:b.total}));
 if(a.kind!=='fixed'||b.kind!=='fixed'||a.total!==b.total)
   errors.push('R06 Restaurant Mini price differs from Beauty Mini at quantity '+quantity);
}
for(const width of [390,1366]){
 const page=await browser.newPage({viewport:{width,height:900},deviceScaleFactor:1});
 page.on('pageerror',e=>errors.push('finishing '+width+' JS '+e.message));
 await page.goto(base+'/solutions/',{waitUntil:'load'});
 const nav=page.locator('[data-catalog-categories]');
 const chipCount=await nav.locator('a').count();
 const advancedClosed=await page.locator('.catalog-advanced').evaluate(el=>!el.open);
 const allCount=await page.locator('#results .product-card').count();
 console.log('COMPACT_CATALOG',width,JSON.stringify({chipCount,advancedClosed,allCount}));
 if(chipCount!==3||!advancedClosed||allCount<6)errors.push('R16 compact catalog not available at '+width);
 await nav.locator('a[href*="google-review"]').click();
 await page.waitForURL('**/collections/google-review/');
 const google=await page.locator('#results .product-card').evaluateAll(els=>els.map(el=>el.dataset.productId));
 if(!google.includes('review-card')||google.includes('nfc-instagram-card'))errors.push('R16 Google category broken '+width);
 await page.locator('[data-catalog-categories] a[href*="/collections/instagram/"]').click();
 await page.waitForURL('**/collections/instagram/');
 const insta=await page.locator('#results .product-card').evaluateAll(els=>els.map(el=>el.dataset.productId));
 if(insta.length!==1||insta[0]!=='nfc-instagram-card')errors.push('R16 Instagram category broken '+width);
 await page.locator('[data-catalog-categories] a[href$="/solutions/"]').click();
 await page.waitForURL('**/solutions/');
 if(!await page.locator('#results .product-card[data-product-id="nfc-menu-card"]').count())errors.push('R16 Menu Card disappeared '+width);
 await page.locator('.catalog-advanced summary').click();
 if(!await page.locator('#filters-form #q').isVisible())errors.push('R16 advanced search not available '+width);
 await page.goto(base+'/services/design/',{waitUntil:'load'});
 const sample=page.locator('.editorial-design-showcase img');
 const samples=await sample.evaluateAll(async imgs=>Promise.all(imgs.map(async img=>{await img.decode();return img.naturalWidth})));
 const circle=await page.locator('.editorial-design-hero .editorial-intro').evaluate(el=>getComputedStyle(el,'::before').content);
 await page.locator('.editorial-design-hero .editorial-hero-actions a[href="#design-request"]').click();
 await page.waitForFunction(()=>scrollY>200&&document.querySelector('#design-request')?.getBoundingClientRect().top<170,null,{timeout:6000});
 const requestPos=await page.locator('#design-request').evaluate(el=>({top:Math.round(el.getBoundingClientRect().top),form:!!el.querySelector('#request-form'),scrollY}));
 console.log('DESIGN_REQUEST',width,JSON.stringify({samples,circle,requestPos}));
 if(samples.length!==3||samples.some(n=>n<100)||!['none','normal'].includes(circle)||!requestPos.form||requestPos.scrollY<200||requestPos.top>140)
  errors.push('R17/R18 photo hero or existing request form jump failed '+width);
 await page.goto(base+'/solutions/review-card/',{waitUntil:'load'});
 const noNote=await page.locator('[data-google-link-later]').count()===0;
 const threeSteps=await page.locator('.review-tap-sequence li').count();
 const headings=await page.locator('.review-tap-sequence h3').allTextContents();
 const orderForm=await page.locator('#product-config input[name="quantity"]').count();
 console.log('REVIEW_DETAIL',width,JSON.stringify({noNote,threeSteps,headings,orderForm}));
 if(!noNote||threeSteps!==3||orderForm!==1||!headings[0]?.includes('Піднесіть')||!headings[1]?.includes('Відкрийте')||!headings[2]?.includes('Залиште'))
  errors.push('R09/R14 Google Review Card steps or configuration failed '+width);
 await page.close();
}

// Catalog desktop photos must cover wide cards without any side gutters.
// Mobile must retain the complete uncropped photo and its natural aspect ratio.
for(const width of [390,768,1024,1366]){
 const page=await browser.newPage({viewport:{width,height:900},deviceScaleFactor:1});
 page.on('pageerror',e=>errors.push('catalog photo '+width+' JS '+e.message));
 await page.goto(base+'/solutions/',{waitUntil:'load'});
 const photos=await page.locator('.product-grid .product-card').evaluateAll(async cards=>{
  const els=cards.filter(el=>el.querySelector(':scope > a.card-image--photo'));
  return Promise.all(els.map(async el=>{
   const frame=el.querySelector('a.card-image--photo');
   const image=frame?.querySelector('img');
   if(!image)return {id:el.dataset.productId,missing:true};
   image.loading='eager';
   try{await image.decode()}catch{}
   const b=frame.getBoundingClientRect(),r=image.getBoundingClientRect();
   return {id:el.dataset.productId,
     naturalWidth:image.naturalWidth,naturalHeight:image.naturalHeight,
     frameWidth:b.width,frameHeight:b.height,imgWidth:r.width,imgHeight:r.height,
     fit:getComputedStyle(image).objectFit,
     leftGap:r.left-b.left,rightGap:b.right-r.right,
     topGap:r.top-b.top,bottomGap:b.bottom-r.bottom,
     frameRatio:b.width/b.height,sourceRatio:image.naturalWidth/image.naturalHeight};
  }));
 });
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
 console.log('CATALOG_PHOTO_FILL',width,JSON.stringify({photos,overflow}));
 if(photos.length!==6||overflow>2||photos.some(p=>p.missing||p.naturalWidth<150||p.naturalHeight<150||
   Math.abs(p.leftGap)>1.5||Math.abs(p.rightGap)>1.5||Math.abs(p.topGap)>1.5||Math.abs(p.bottomGap)>1.5||
   (width>=801&&(p.fit!=='cover'||p.frameRatio<1.15||p.frameRatio>1.21))||
   (width<=800&&(p.fit!=='contain'||Math.abs(p.frameRatio-p.sourceRatio)>.02))))
  errors.push('Catalog image fill/crop regression '+width);
 await page.close();
}
// Featured images on the homepage follow the very same fill rule; ready-made
// and branded schematics keep truthful provenance, including at small widths.
for(const width of [390,1366]){
 const page=await browser.newPage({viewport:{width,height:900},deviceScaleFactor:1});
 await page.goto(base+'/',{waitUntil:'load'});
 const photoState=await page.locator('.owner-home-products .product-card').evaluateAll(async cards=>Promise.all(cards.map(async card=>{
   const frame=card.querySelector(':scope > a.card-image--photo');
   const image=frame?.querySelector('img');
   if(!image)return {id:card.dataset.productId,missing:true};
   await image.decode();
   const f=frame.getBoundingClientRect(),i=image.getBoundingClientRect();
   return {id:card.dataset.productId,fit:getComputedStyle(image).objectFit,
      natural:image.naturalWidth,width:f.width,height:f.height,
      frameRatio:f.width/f.height,sourceRatio:image.naturalWidth/image.naturalHeight,
      leftGap:i.left-f.left,rightGap:f.right-i.right,topGap:i.top-f.top,bottomGap:f.bottom-i.bottom};
 })));
 console.log('HOMEPAGE_PHOTO_FILL',width,JSON.stringify(photoState));
 if(photoState.length!==4||photoState.some(p=>p.missing||p.natural<150||
   (width>=801&&(p.fit!=='cover'||Math.abs(p.frameRatio-1.18)>.03))||
   (width<=800&&(p.fit!=='contain'||Math.abs(p.frameRatio-p.sourceRatio)>.03))||
   Math.max(...[p.leftGap,p.rightGap,p.topGap,p.bottomGap].map(Math.abs))>1.5))
    errors.push('Home feature photo fill regression '+width);
 await page.close();
}
for(const width of [390,1366]){
 const page=await browser.newPage({viewport:{width,height:900}});
 await page.goto(base+'/solutions/',{waitUntil:'load'});
 const schematic=await page.locator('.product-grid .product-card .card-image .schematic').evaluateAll(els=>els.map(el=>{
  const a=el.closest('a.card-image'),box=el.querySelector('.schematic-box');
  const f=a.getBoundingClientRect(),b=box.getBoundingClientRect();
  return {frameRatio:f.width/f.height,tileWidth:b.width,contained:b.left>=f.left&&b.right<=f.right,
    text:el.textContent?.trim().slice(0,110)};
 }));
 console.log('BRANDED_SCHEMATIC',width,JSON.stringify(schematic));
 if(schematic.length<3||schematic.some(p=>Math.abs(p.frameRatio-1.18)>.04||!p.contained||p.tileWidth<95))
  errors.push('Branded schematic card layout regression '+width);
 await page.close();
}
await browser.close();
if(errors.length){console.error('FAILED',JSON.stringify(errors));process.exit(1)}
console.log('MOBILE_RESPONSIVE_TEST_SUCCESS');
