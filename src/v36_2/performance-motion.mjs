// Progressive enhancement: no animations or image changes needed for basic navigation.
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const lowData=navigator.connection?.saveData===true;
const motionTargets='.product-card,.section-heading,.feature,.step,.home-b-product-stage,.hero-copy,.home-b-hero-copy,.product-summary';
const observed=new WeakSet();
const intersection=!reduced.matches&&!lowData&&'IntersectionObserver'in window?
 new IntersectionObserver(entries=>{
   for(const entry of entries){
     if(entry.isIntersecting){
       entry.target.classList.add('nfc-motion-in');
       intersection.unobserve(entry.target);
     }
   }
 },{threshold:.08,rootMargin:'0px 0px -24px 0px'}):null;
function optimize(){
 const images=document.querySelectorAll('main img,.hero-visual img');
 let index=0;
 for(const image of images){
   if(!image.hasAttribute('decoding'))image.decoding='async';
   const priority=image.closest('.hero-visual,.home-b-hero,.home-b-product-stage');
   if(priority&&index<2){
     image.loading='eager';
     image.setAttribute('fetchpriority','high');
     index++;
   }else{
     image.loading='lazy';
     image.setAttribute('fetchpriority','low');
   }
 }
 if(!intersection)return;
 for(const element of document.querySelectorAll(motionTargets)){
   if(observed.has(element))continue;
   observed.add(element);
   intersection.observe(element);
 }
}
let pending=false;
function schedule(){
 if(pending)return;
 pending=true;
 requestAnimationFrame(()=>{pending=false;optimize()});
}
new MutationObserver(schedule).observe(document.querySelector('#app')||document.body,{childList:true,subtree:true});
schedule();
