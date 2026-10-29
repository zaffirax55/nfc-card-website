// Automatic illustration only: no NFC permission, requests, storage or real reviews.
export function mountNfcDemo() {
for (const demo of document.querySelectorAll('[data-nfc-demo]:not([data-demo-mounted])')) {
 demo.dataset.demoMounted='true';
 const pause=demo.querySelector('[data-demo-pause]');
 const reset=demo.querySelector('[data-demo-reset]');
 const card=demo.querySelector('[data-demo-card-tap]');
 const notification=demo.querySelector('[data-demo-open]');
 const home=demo.querySelector('[data-demo-home]');
 const phone=demo.querySelector('.nfc-demo-phone');
 const stage=demo.querySelector('.nfc-demo-stage');
 const review=demo.querySelector('[data-demo-review]');
 const complete=demo.querySelector('[data-demo-complete]');
 const status=demo.querySelector('[data-demo-status]');
 const finish=demo.querySelector('[data-demo-finish]');
 const ratingNote=demo.querySelector('[data-demo-rating-note]');
 const connection=demo.querySelector('[data-demo-connection]');
 const stars=[...demo.querySelectorAll('[data-demo-star]')];
 const starGroup=demo.querySelector('.nfc-demo-stars');
 const comment=demo.querySelector('#nfc-demo-comment');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let timer, pending, remaining=0, deadline=0, visible=false, paused=false;
 const active=()=>visible&&!document.hidden&&!paused;

 function setState(state) {
  demo.dataset.state=state;
  status.textContent=status.dataset[state];
  home.hidden=!['desktop','approaching','contact','notified','returning'].includes(state);
  notification.hidden=state!=='notified';
  review.hidden=!['review','rating','typing','sending'].includes(state);
  complete.hidden=state!=='done';
  finish.textContent=state==='sending'?finish.dataset.sending:finish.dataset.label;
  const current=['desktop','approaching','contact'].includes(state)?0:state==='notified'||state==='review'?1:state==='returning'?3:2;
  for(const step of demo.querySelectorAll('[data-demo-step]')) {
   const index=Number(step.dataset.demoStep);
   step.classList.toggle('is-complete',index<current);
   if(index===current)step.setAttribute('aria-current','step');else step.removeAttribute('aria-current');
  }
  connection.querySelector('span').textContent=['desktop','returning','approaching'].includes(state)?connection.dataset.desktop:state==='contact'?connection.dataset.contact:connection.dataset.connected;
 }
 function syncTimer() {
  if(!active()) {
   if(timer!==undefined){clearTimeout(timer);timer=undefined;remaining=Math.max(0,deadline-performance.now());}
  } else if(pending&&timer===undefined) {
   deadline=performance.now()+remaining;
   timer=setTimeout(()=>{timer=undefined;const callback=pending;pending=undefined;callback();},remaining);
  }
  demo.dataset.paused=String(!active());
 }
 function schedule(callback,delay) {
  clearTimeout(timer);timer=undefined;pending=callback;remaining=delay;syncTimer();
 }
 function placeOnCard() {
  const bounds=stage.getBoundingClientRect();
  const target=card.getBoundingClientRect();
  const scale=.72;
  const x=target.left+target.width*.58-bounds.left;
  const y=target.top+target.height*.36-bounds.top;
  stage.style.setProperty('--demo-contact-x',`${x-phone.offsetLeft-phone.offsetWidth/2}px`);
  stage.style.setProperty('--demo-contact-y',`${y-phone.offsetTop-phone.offsetHeight*.13*scale}px`);
  stage.style.setProperty('--demo-signal-x',`${x-32}px`);
  stage.style.setProperty('--demo-signal-y',`${y-32}px`);
 }
 function clearReview() {
  for(const star of stars)star.classList.remove('is-filled','is-selected');
  starGroup.setAttribute('aria-label',ratingNote.dataset.empty);
  ratingNote.textContent=ratingNote.dataset.empty;comment.value='';review.scrollTop=0;complete.scrollTop=0;
 }
 function returnHome() {
  setState('returning');
  schedule(()=>{clearReview();setState('desktop');schedule(approach,2600);},1200);
 }
 function send() {
  setState('sending');
  schedule(()=>{setState('done');schedule(returnHome,2000);},1200);
 }
 function typeComment() {
  setState('typing');
  const text=Array.from(comment.dataset.example);let index=0;
  if(reduced.matches){comment.value=text.join('');schedule(send,2300);return;}
  const type=()=>{
   comment.value=text.slice(0,++index).join('');
   if(index<text.length)schedule(type,65);else schedule(send,1100);
  };
  schedule(type,400);
 }
 function rate() {
  setState('rating');
  for(const star of stars)star.classList.add('is-filled');
  stars[4].classList.add('is-selected');
  starGroup.setAttribute('aria-label',starGroup.dataset.label);
  ratingNote.textContent=ratingNote.dataset.selected.replace('{n}','5');
  schedule(typeComment,1100);
 }
 function approach() {
  placeOnCard();setState('approaching');
  schedule(()=>{
   setState('contact');
   schedule(()=>{
    setState('notified');
    schedule(()=>{setState('review');schedule(rate,1200);},1500);
   },1000);
  },1300);
 }
 function restart() {
  clearReview();setState('desktop');schedule(approach,1800);
 }
 pause.addEventListener('click',()=>{
  paused=!paused;pause.setAttribute('aria-pressed',String(paused));
  pause.replaceChildren(document.createTextNode(paused?pause.dataset.resume:pause.dataset.pause));
  const icon=document.createElement('span');icon.setAttribute('aria-hidden','true');icon.textContent=paused?'▷':'Ⅱ';pause.append(icon);syncTimer();
 });
 reset.addEventListener('click',restart);
 for(const option of demo.querySelectorAll('[data-demo-situation]'))option.addEventListener('click',()=>{
  demo.dataset.situation=option.dataset.demoSituation;
  for(const item of demo.querySelectorAll('[data-demo-situation]'))item.setAttribute('aria-pressed',String(item===option));
  demo.querySelector('[data-demo-business]').textContent=option.dataset.business;
  demo.querySelector('[data-demo-symbol]').textContent=option.dataset.symbol;
 });
 const resizeObserver=new ResizeObserver(()=>{if(['approaching','contact'].includes(demo.dataset.state))placeOnCard();});
 resizeObserver.observe(stage);
 // A tall mobile scene may extend past the viewport. Pause while hidden.
 const intersectionObserver=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;syncTimer();},{threshold:0});
 intersectionObserver.observe(stage);
 document.addEventListener('visibilitychange',syncTimer);
 const onMotionChange=()=>{if(reduced.matches&&!paused)pause.click();};
 reduced.addEventListener('change',onMotionChange);
 const cleanupObserver=new MutationObserver(()=>{if(!demo.isConnected){clearTimeout(timer);resizeObserver.disconnect();intersectionObserver.disconnect();document.removeEventListener('visibilitychange',syncTimer);reduced.removeEventListener('change',onMotionChange);cleanupObserver.disconnect();}});
 cleanupObserver.observe(document.getElementById('app'),{childList:true,subtree:true});
 restart();
 onMotionChange();
}
}
