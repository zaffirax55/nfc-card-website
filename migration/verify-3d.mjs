import { chromium } from 'playwright';
import fs from 'node:fs';
const url='http://127.0.0.1:8731/nfc-card-website/solutions/beauty-review-card/';
const browser=await chromium.launch({headless:true,args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--disable-web-security']});
const page=await browser.newPage({viewport:{width:1300,height:900},deviceScaleFactor:1});
page.on('pageerror',e=>console.log('PAGE ERROR',e.message));
page.on('console',m=>{if(m.type()==='error')console.log('CONSOLE ERROR',m.text())});
page.on('response',r=>{if(r.status()>=400)console.log('HTTP ERROR',r.status(),r.url())});
await page.goto(url,{waitUntil:'domcontentloaded'});
await page.locator('[data-glb-model]').first().click();
await page.locator('model-viewer').waitFor({timeout:20000});
const result=await page.locator('model-viewer').evaluate(async el=>{
 const loaded=el.loaded?'loaded':await Promise.race([new Promise(resolve=>{el.addEventListener('load',()=>resolve('loaded'),{once:true});el.addEventListener('error',()=>resolve('error'),{once:true})}),new Promise(resolve=>setTimeout(()=>resolve('timeout'),15000))]);
 return {loaded,src:el.src,orbit:el.getCameraOrbit?.(),width:el.clientWidth,height:el.clientHeight,model:!!el.model,materials:el.model?.materials?.length};
});
console.log('VIEWER RESULT',JSON.stringify(result));
await page.screenshot({path:'beauty-preview.png'});
if(result.loaded!=='loaded')process.exitCode=1;
await browser.close();
