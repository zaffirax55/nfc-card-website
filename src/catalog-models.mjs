// One viewer for the entire catalog. The model and its renderer are loaded on demand.
const models=new Set(['review-standard','review-branded','beauty','beauty-branded','restaurant','restaurant-branded','review-acrylic','instagram','menu-square-black','menu-square-white','menu-round-black','menu-round-white']);
const updatedPosters=new Set(['beauty','restaurant','review-acrylic','instagram']);
const base=document.documentElement.dataset.publicBasePath||'';
const locale=document.documentElement.lang;
const words=locale==='pl'?{close:'Zamknij',hint:'Przeciągnij, aby obrócić kartę',example:'Przykładowy projekt — Twoja karta otrzyma indywidualną grafikę.',error:'Podgląd 3D nie jest dostępny w tej przeglądarce.'}:locale==='en'?{close:'Close',hint:'Drag to rotate the card',example:'Example design — your card will use your own artwork.',error:'3D preview is unavailable in this browser.'}:{close:'Закрити',hint:'Потягніть, щоб обертати картку',example:'Приклад дизайну — ваша картка матиме власне оформлення.',error:'3D-перегляд недоступний у цьому браузері.'};
let dialog;
let rendererPromise;
let requestId=0;
document.addEventListener('click',event=>{
 const choice=event.target.closest('[data-catalog-photo]');
 if(!choice)return;
 const media=choice.closest('.catalog-card-media');
 const image=media?.querySelector(':scope > picture img, :scope > img.catalog-product-image');
 if(!image)return;
 event.preventDefault();
 const photo=choice.dataset.photoSrc;
 if(!photo?.startsWith('/assets/')&&!photo?.startsWith(`${base}/assets/`))return;
 const picture=image.closest('picture');
 picture?.querySelectorAll('source').forEach(source=>source.remove());
 image.removeAttribute('srcset');
 image.removeAttribute('sizes');
 image.src=photo.startsWith('/assets/')?base+photo:photo;
 image.alt=choice.dataset.photoAlt||'';
 media.querySelectorAll('[data-catalog-photo]').forEach(item=>item.removeAttribute('aria-current'));
 choice.setAttribute('aria-current','true');
});
function ensureDialog(){
 if(dialog)return dialog;
 dialog=document.createElement('dialog');
 dialog.className='catalog-model-dialog';
 dialog.innerHTML=`<div class="catalog-model-dialog-inner"><div class="catalog-model-dialog-head"><div><p class="eyebrow">3D MODEL</p><h2 id="catalog-model-title"></h2></div><button type="button" class="catalog-model-close" aria-label="${words.close}">×</button></div><div class="catalog-model-stage" aria-live="polite"></div><p class="catalog-model-caption"></p></div>`;
 dialog.setAttribute('aria-labelledby','catalog-model-title');
 dialog.querySelector('.catalog-model-close').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});
 dialog.addEventListener('close',()=>{requestId++;dialog.querySelector('.catalog-model-stage').replaceChildren()});
 document.body.append(dialog);
 return dialog;
}
document.addEventListener('click',async event=>{
 const button=event.target.closest('[data-card-model]');
 if(!button)return;
 const id=button.dataset.cardModel;
 if(!models.has(id))return;
 const modal=ensureDialog();
 const title=button.closest('.catalog-card')?.querySelector('h2')?.textContent?.trim()||'NFC CARD';
 modal.querySelector('#catalog-model-title').textContent=title;
 modal.querySelector('.catalog-model-caption').textContent=id.includes('branded')?words.example:words.hint;
 const stage=modal.querySelector('.catalog-model-stage');
 const poster=updatedPosters.has(id)?document.createElement('img'):button.closest('.catalog-card-media')?.querySelector('picture, img, .branded-concept')?.cloneNode(true);
  if(updatedPosters.has(id)){poster.src=`${base}/assets/model-posters/${id}.webp?v=20261022-ribbons`;poster.alt=title}
 stage.replaceChildren();
 if(poster){poster.classList.add('catalog-model-poster');stage.append(poster)}
 modal.showModal();
 const current=++requestId;
 try{
  const canvas=document.createElement('canvas');
  if(!canvas.getContext('webgl2')&&!canvas.getContext('webgl'))throw Error('WebGL unavailable');
  rendererPromise ||= import(`${base}/assets/model-viewer.min.js`);
  await rendererPromise;
  if(!modal.open||current!==requestId)return;
  const viewer=document.createElement('model-viewer');
  viewer.className='catalog-model-viewer';
  viewer.setAttribute('src',`${base}/assets/models/${id}.glb?v=20261022-polished`);
  viewer.setAttribute('alt',`3D: ${title}`);
  viewer.setAttribute('camera-controls','');
  viewer.setAttribute('auto-rotate','');
  viewer.setAttribute('auto-rotate-delay','1000');
  viewer.setAttribute('rotation-per-second','7deg');
  viewer.setAttribute('environment-image','neutral');
  viewer.setAttribute('exposure','1.18');
  viewer.setAttribute('shadow-intensity','1.2');
  viewer.setAttribute('shadow-softness','0.8');
  viewer.setAttribute('interaction-prompt','none');
  viewer.setAttribute('touch-action','pan-y');
  viewer.addEventListener('load',()=>{if(current===requestId)poster?.remove()},{once:true});
  viewer.addEventListener('error',()=>{if(current===requestId)modal.querySelector('.catalog-model-caption').textContent=words.error},{once:true});
  stage.append(viewer);
 }catch{
  rendererPromise=undefined;
  if(modal.open&&current===requestId)modal.querySelector('.catalog-model-caption').textContent=words.error;
 }
});
