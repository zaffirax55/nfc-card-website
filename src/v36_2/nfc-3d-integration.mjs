// Genuine Zaffirax GLB models, progressively enhanced in the OptiDigital storefront.
const ROOT='/nfc-card-website';
const models={'review-card':'review-standard','branded-review-card':'review-branded','review-card-3d':'review-acrylic','nfc-instagram-card':'instagram','beauty-review-card':'beauty','branded-beauty-review-card':'beauty-branded','restaurant-review-card':'restaurant','branded-restaurant-review-card':'restaurant-branded','nfc-menu-card':'menu-square-black'};
const menu=['menu-square-black','menu-square-white','menu-round-black','menu-round-white'];
const labels={uk:{open:'Переглянути в 3D',close:'Закрити',rotate:'Обертайте мишею або пальцем',loading:'Завантаження 3D…',failed:'Не вдалося завантажити 3D'},en:{open:'View in 3D',close:'Close',rotate:'Drag to rotate the card',loading:'Loading 3D…',failed:'3D preview unavailable'},pl:{open:'Zobacz w 3D',close:'Zamknij',rotate:'Przeciągnij, aby obrócić kartę',loading:'Wczytywanie 3D…',failed:'Podgląd 3D niedostępny'}};
const t=()=>labels[document.documentElement.lang]||labels.uk;
let dialog,loader,request=0;
const posterFor={'review-standard':'review.webp','review-branded':'review.webp','review-acrylic':'three-d.webp','instagram':'instagram.webp','beauty':'beauty.webp','beauty-branded':'beauty.webp','restaurant':'restaurant.webp','restaurant-branded':'restaurant.webp','menu-square-black':'menu-square_100_black.webp','menu-square-white':'menu-square_100_white.webp','menu-round-black':'menu-round_70_black.webp','menu-round-white':'menu-round_70_white.webp'};
function ensureDialog(){
 if(dialog)return dialog;
 dialog=document.createElement('dialog');dialog.className='nfc-glb-dialog';
 dialog.innerHTML='<div class="nfc-glb-container"><div class="nfc-glb-bar"><strong class="nfc-glb-title">NFC CARD · 3D</strong><button class="nfc-glb-close" type="button"></button></div><div class="nfc-glb-stage"></div><p class="nfc-glb-hint"></p></div>';
 dialog.querySelector('.nfc-glb-close').textContent=t().close;
 dialog.querySelector('.nfc-glb-hint').textContent=t().rotate;
 dialog.querySelector('.nfc-glb-close').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
 dialog.addEventListener('close',()=>{request++;dialog.querySelector('.nfc-glb-stage').replaceChildren()});
 document.body.append(dialog);return dialog;
}
function add(host,id){
 if(host.querySelector('[data-glb-model]'))return;
 const button=document.createElement('button');button.type='button';button.className='nfc-glb-button';button.dataset.glbModel=id;button.textContent=t().open;
 (host.matches('.product-card')?(host.querySelector('.card-body')||host):(host.querySelector('.gallery-main')||host)).append(button);
}
function enhance(){
 document.querySelectorAll('.product-card[data-product-id]').forEach(el=>{const id=models[el.dataset.productId];if(id)add(el,id)});
 const input=document.querySelector('#product-config[data-product]');
 if(input){const id=models[input.dataset.product];const gallery=input.closest('.product-layout')?.querySelector('.gallery');if(id&&gallery)add(gallery,id)}
}
let scheduled=false;
new MutationObserver(()=>{if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;enhance()})}).observe(document.documentElement,{childList:true,subtree:true});
enhance();
document.addEventListener('click',async e=>{
 const control=e.target.closest('[data-glb-model]');if(!control)return;
 e.preventDefault();e.stopPropagation();
 const d=ensureDialog(),stage=d.querySelector('.nfc-glb-stage'),current=++request;
 stage.replaceChildren();
 const preview=document.createElement('div');preview.className='nfc-glb-poster';
 const poster=document.createElement('img');poster.src=ROOT+'/assets/'+(posterFor[control.dataset.glbModel]||'review.webp');poster.alt='';
 preview.append(poster);stage.append(preview);d.querySelector('.nfc-glb-hint').textContent=t().rotate;d.showModal();
 try{
  loader ||= import(ROOT+'/assets/model-viewer.min.js');
  await loader;
  if(!d.open||current!==request)return;
  const viewer=document.createElement('model-viewer');
  viewer.setAttribute('src',ROOT+'/assets/models/'+control.dataset.glbModel+'.glb');
  viewer.setAttribute('camera-controls','');viewer.setAttribute('auto-rotate','');
  viewer.setAttribute('camera-orbit','180deg 75deg auto');
  viewer.setAttribute('field-of-view','32deg');viewer.setAttribute('min-field-of-view','20deg');
  viewer.setAttribute('max-field-of-view','60deg');
  viewer.setAttribute('loading','eager');
  viewer.setAttribute('reveal','auto');
  viewer.setAttribute('auto-rotate-delay','1000');viewer.setAttribute('rotation-per-second','7deg');
  viewer.setAttribute('environment-image','neutral');viewer.setAttribute('exposure','1.18');
  viewer.setAttribute('shadow-intensity','1.2');viewer.setAttribute('shadow-softness','0.8');
  viewer.setAttribute('touch-action','pan-y');viewer.setAttribute('interaction-prompt','none');
  viewer.setAttribute('alt','NFC CARD 3D');
  stage.replaceChildren(viewer);
  viewer.addEventListener('load',()=>{if(current!==request)return;d.querySelector('.nfc-glb-hint').textContent=t().rotate},{once:true});
  viewer.addEventListener('error',()=>{if(current!==request)return;stage.replaceChildren(preview);d.querySelector('.nfc-glb-hint').textContent=t().failed},{once:true});
  if(menu.includes(control.dataset.glbModel)){
   const variants=document.createElement('div');variants.className='nfc-glb-variants';
   const titles=['□ Black','□ White','○ Black','○ White'];
   menu.forEach((id,index)=>{const option=document.createElement('button');option.type='button';option.textContent=titles[index];option.addEventListener('click',()=>viewer.setAttribute('src',ROOT+'/assets/models/'+id+'.glb'));variants.append(option)});
   stage.append(variants);
  }
 }catch(err){if(d.open&&current===request){stage.replaceChildren(preview);d.querySelector('.nfc-glb-hint').textContent=t().failed;loader=null;}}
});
