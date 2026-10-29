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
  if(m.scroll>m.inner+2)errors.push(width+' '+route+' horizontal overflow '+m.scroll);
 }
 await page.close();
}
await browser.close();
if(errors.length){console.error('FAILED',JSON.stringify(errors));process.exit(1)}
console.log('MOBILE_RESPONSIVE_TEST_SUCCESS');
