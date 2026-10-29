// One model at a time. No renderer, GLB, network write or WebGL context is
// created until a visitor asks to see the 3D visualization.
import {MODEL_IDS} from './card-models.mjs';
import {BASE} from './seo.mjs';
const allowed=new Set(MODEL_IDS);
const words={
 uk:{title:'3D-візуалізація',close:'Закрити',hint:'Поверніть картку пальцем або мишкою. Зображення товару залишаються в галереї.',error:'3D-перегляд недоступний у цьому браузері. Фото товару можна переглянути в галереї.'},
 en:{title:'3D visualization',close:'Close',hint:'Drag to rotate the card. Product images remain available in the gallery.',error:'3D is unavailable in this browser. You can still view the product images in the gallery.'},
 pl:{title:'Wizualizacja 3D',close:'Zamknij',hint:'Obróć kartę palcem lub myszą. Zdjęcia produktu pozostają dostępne w galerii.',error:'Podgląd 3D nie jest dostępny w tej przeglądarce. Zdjęcia produktu są nadal w galerii.'}
};
let renderer,dialog,request=0,returnFocus;
function ensureDialog(){
 if(dialog)return dialog;
 dialog=document.createElement('dialog');dialog.className='card-model-dialog';
 const heading=document.createElement('h2');heading.id='card-model-title';
 const close=document.createElement('button');close.type='button';close.className='card-model-close';close.textContent='×';
 const head=document.createElement('div');head.className='card-model-head';head.append(heading,close);
 const stage=document.createElement('div');stage.className='card-model-stage';
 const caption=document.createElement('p');caption.className='card-model-caption';
 dialog.append(head,stage,caption);dialog.setAttribute('aria-labelledby',heading.id);
 close.addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});
 dialog.addEventListener('close',()=>{request++;stage.replaceChildren();returnFocus?.focus({preventScroll:true});returnFocus=null});
 document.body.append(dialog);return dialog;
}
async function open(button){
 const id=button.dataset.modelOpen;
 if(!allowed.has(id))return;
 const w=words[document.documentElement.lang]||words.uk,d=ensureDialog();
 if(d.open)return;
 returnFocus=button;
 d.querySelector('#card-model-title').textContent=w.title+' · '+(button.dataset.modelTitle||'NFC CARD');
 d.querySelector('.card-model-close').setAttribute('aria-label',w.close);
 d.querySelector('.card-model-caption').textContent=w.hint;
 const stage=d.querySelector('.card-model-stage'),poster=document.createElement('img');
 poster.className='card-model-poster';poster.alt=button.dataset.modelTitle||'NFC CARD';
 poster.src=BASE+'/assets/'+(button.dataset.modelPoster||'review.webp');
 stage.replaceChildren(poster);d.showModal();d.querySelector('.card-model-close').focus();
 const current=++request;
 try{
  const canvas=document.createElement('canvas');
  const gl=canvas.getContext('webgl2')||canvas.getContext('webgl');
  if(!gl)throw Error('webgl_unavailable');
  gl.getExtension('WEBGL_lose_context')?.loseContext();
  renderer ||= import(BASE+'/model-viewer.min.js');
  await renderer;
  if(!d.open||current!==request)return;
  const viewer=document.createElement('model-viewer');viewer.className='card-model-viewer';
  viewer.setAttribute('src',BASE+'/assets/models/'+id+'.glb');
  viewer.setAttribute('alt',d.querySelector('#card-model-title').textContent);
  viewer.setAttribute('camera-controls','');viewer.setAttribute('camera-orbit','-28deg 70deg auto');
  viewer.setAttribute('environment-image','neutral');viewer.setAttribute('shadow-intensity','1.2');
  viewer.setAttribute('interaction-prompt','none');viewer.setAttribute('touch-action','pan-y');
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches){viewer.setAttribute('auto-rotate','');viewer.setAttribute('auto-rotate-delay','1200');viewer.setAttribute('rotation-per-second','6deg')}
  viewer.addEventListener('load',()=>{if(current===request)poster.remove()},{once:true});
  viewer.addEventListener('error',()=>{if(current===request){viewer.remove();d.querySelector('.card-model-caption').textContent=w.error}},{once:true});
  stage.append(viewer);
 }catch{renderer=undefined;if(d.open&&current===request)d.querySelector('.card-model-caption').textContent=w.error}
}
if(typeof document!=='undefined')document.addEventListener('click',event=>{const button=event.target instanceof Element?event.target.closest('[data-model-open]'):null;if(button){event.preventDefault();open(button)}});
