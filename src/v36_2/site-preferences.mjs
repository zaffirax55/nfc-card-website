// NFC CARD appearance & language controls. Preferences only: no personal data.
const BASE='/nfc-card-website';
const prefKey='nfc-card-ui-preferences-v1';
const pref=(()=>{try{return JSON.parse(localStorage.getItem(prefKey)||'{}')}catch{return {}}})();
const localeFromPath=()=>location.pathname.startsWith(BASE+'/en/')?'en':'uk';
const selected=()=>localeFromPath()==='en'?'en':(pref.language==='ru'||new URLSearchParams(location.search).get('lang')==='ru'?'ru':'uk');
const prefersDark=()=>matchMedia('(prefers-color-scheme: dark)').matches;
let theme=pref.theme==='dark'||pref.theme==='light'?pref.theme:(prefersDark()?'dark':'light');
let language=selected();
const save=()=>{try{localStorage.setItem(prefKey,JSON.stringify({theme,language}))}catch{}};
document.documentElement.dataset.theme=theme;
const ruTexts=new Map([
 ['Каталог','Каталог'],['Головна','Главная'],['Про нас','О нас'],['Допомога','Помощь'],['Пошук','Поиск'],['Кошик','Корзина'],['Залишити запит','Оставить заявку'],['Меню навігації','Меню навигации'],['Закрити','Закрыть'],['Детальніше','Подробнее'],['Зробити свій дизайн','Создать свой дизайн'],['Переглянути картки','Смотреть карточки'],['Переглянути каталог','Открыть каталог'],['Відгуки Google','Отзывы Google'],['Профіль Instagram','Профиль Instagram'],['Онлайн-меню','Онлайн-меню'],['Готовий дизайн','Готовый дизайн'],['Ваш дизайн','Ваш дизайн'],['Пауза','Пауза'],['Продовжити','Продолжить'],['Спробувати ще раз','Повторить'],['Мова','Язык'],
 ['NFC-картки для Google-відгуків та Instagram','NFC-карточки для отзывов Google и Instagram'],
 ['Готові картки для місця роботи, рецепції чи столика. Оберіть потрібну дію для відвідувача — або узгодьте оформлення у стилі вашого бізнесу.','Готовые карточки для стойки, ресепшена или столика. Выберите нужное действие для посетителя или закажите оформление в стиле вашего бизнеса.'],
 ['Чотири готові рішення','Четыре готовых решения'],
 ['Менше пошуку — простіший перехід','Меньше поиска — проще переход'],
 ['Після візиту людина може відкрити потрібну Google-точку чи Instagram-профіль з картки поруч. Оцінку, текст відгуку або підписку вона обирає сама.','После визита человек может открыть нужную страницу Google или профиль Instagram, просто приложив телефон к карточке. Оценку, текст отзыва или подписку он выбирает самостоятельно.'],
 ['Від дотику до потрібної сторінки','От касания до нужной страницы'],
 ['Як працює NFC CARD','Как работает NFC CARD'],
 ['Готове оформлення чи власний дизайн?','Готовый вариант или свой дизайн?'],
 ['Що відбувається після заявки','Что происходит после заявки'],
 ['Потрібна допомога з вибором?','Нужна помощь с выбором?'],
 ['Зв’язатися','Связаться'],
 ['Перед вибором картки','Перед выбором карточки'],
 ['Подивіться, як працює картка','Посмотрите, как работает карточка'],
 ['Від робочого екрана до готового відгуку — весь сценарій відтворюється автоматично.','От главного экрана телефона до готового отзыва — вся демонстрация запускается автоматически.'],
 ['Дотик до картки','Касание карточки'],['Форма відгуку','Форма отзыва'],['Оцінка й коментар','Оценка и комментарий'],['Назад на головний','Назад на главный экран'],
 ['Автоматична демонстрація. 5 зірок і коментар — приклад; реальні клієнти самі обирають оцінку. Відгук не публікується.','Автоматическая демонстрация. Пять звёзд и комментарий — только пример; настоящие клиенты выбирают оценку сами. Отзыв не публикуется.'],
 ['Кав’ярня','Кофейня'],['Салон','Салон'],['Стоматологія','Стоматология'],['Ваша кав’ярня','Ваша кофейня'],['Ваш салон','Ваш салон'],['Ваша стоматологія','Ваша стоматология'],
 ['Очима вашого клієнта','Глазами вашего клиента'],['Робочий стіл','Главный экран'],['Робочий екран. Зараз телефон торкнеться картки.','Главный экран. Сейчас телефон коснётся карточки.'],
 ['Підносимо телефон до NFC-картки…','Подносим телефон к NFC-карточке…'],['Телефон торкнувся картки. NFC зчитує посилання…','Телефон коснулся карточки. NFC считывает ссылку…'],
 ['Посилання зчитано. Відкривається вкладка…','Ссылка считана. Открывается страница…'],['Вкладка з формою відгуку відкрита.','Форма отзыва открыта.'],
 ['Оберіть оцінку','Выберите оценку'],['Ваш відгук','Ваш отзыв'],['Як пройшов ваш візит?','Как прошёл ваш визит?'],['Надіслати · демо','Отправить · демо'],
 ['Демо завершено. Нічого не опубліковано.','Демонстрация завершена. Ничего не опубликовано.'],
 ['Відкрити форму відгуку','Открыть форму отзыва'],['Приклад форми відгуку','Пример формы отзыва'],['Віртуальний телефон','Виртуальный телефон'],
 ['Телефон','Телефон'],['Повідомлення','Сообщения'],['Фото','Фото'],['Камера','Камера'],['Карти','Карты'],['Налаштування','Настройки'],
 ['Тестова заявка, не покупка','Тестовая заявка, не покупка'],['Ціна','Цена'],['Кількість','Количество'],['Оформити','Оформить'],['Доставка','Доставка'],
 ['Відкрити в 3D','Открыть в 3D'],['Переглянути в 3D','Смотреть в 3D'],['Лицьова сторона','Лицевая сторона'],['Зворотна сторона','Обратная сторона']
]);
const substitutions=[
 [/Відгуки/g,'Отзывы'],[/відгуків/g,'отзывов'],[/відгук/g,'отзыв'],[/картки/g,'карточки'],[/картку/g,'карточку'],[/карток/g,'карточек'],[/картка/g,'карточка'],[/картці/g,'карточке'],[/покупка/g,'покупка'],[/Залишити/g,'Оставить'],[/Оберіть/g,'Выберите'],[/Переглянути/g,'Посмотреть'],[/Показано/g,'Показан'],[/Відкрити/g,'Открыть'],[/Надіслати/g,'Отправить'],[/Потрібна/g,'Нужна'],[/запит/g,'заявку'],[/власний/g,'собственный'],[/готовий/g,'готовый'],[/готові/g,'готовые'],[/вашого/g,'вашего'],[/вашої/g,'вашей'],[/власного/g,'собственного'],[/відвідувач/g,'посетитель'],[/дизайн/g,'дизайн'],[/Мова/g,'Язык'],[/Застосувати/g,'Применить'],[/Пошук/g,'Поиск'],[/Кошик/g,'Корзина'],[/Завантаження/g,'Загрузка']
];
function ru(text){if(!text||!/[А-Яа-яІіЇїЄєҐґ]/.test(text))return text;const trimmed=text.trim();let result=ruTexts.get(trimmed);if(!result){result=trimmed;for(const [pattern,next] of substitutions)result=result.replace(pattern,next)}
 return text.slice(0,text.indexOf(trimmed))+result+text.slice(text.indexOf(trimmed)+trimmed.length);
}
const sourceText=new WeakMap();
let translating=false;
function translateElement(root){
 if(language!=='ru'||localeFromPath()==='en'||translating)return;
 translating=true;
 try{
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  const nodes=[];
  while(walker.nextNode()){const n=walker.currentNode; if(!n.parentElement?.closest('script,style,noscript,svg,[data-site-preferences],textarea,input'))nodes.push(n)}
  for(const node of nodes){
   const original=sourceText.get(node);
   if(node.nodeValue===original?.translated)continue;
   const initial=node.nodeValue;
   const translation=ru(initial);
   sourceText.set(node,{initial,translated:translation});
   if(translation!==initial)node.nodeValue=translation;
  }
  for(const el of root.querySelectorAll('[placeholder],[aria-label]')){
   if(el.closest('[data-site-preferences]'))continue;
   for(const name of ['placeholder','aria-label']){
    const original=el.getAttribute(name);if(!original)continue;
    const translated=ru(original);
    if(translated!==original)el.setAttribute(name,translated);
   }
  }
 }finally{translating=false}
}
function themeLabels(){return {uk:['Світла тема','Темна тема','Мова сайту'],ru:['Светлая тема','Тёмная тема','Язык сайта'],en:['Light theme','Dark theme','Site language']}[language]||[]}
function updateControls(){
 document.documentElement.dataset.theme=theme;
 document.documentElement.dataset.uiLanguage=language;
 const label=themeLabels();
 const toggle=document.querySelector('[data-site-theme]');
 if(toggle){toggle.textContent=theme==='dark'?'☀':'☾';toggle.title=theme==='dark'?label[0]:label[1];toggle.setAttribute('aria-label',toggle.title);toggle.setAttribute('aria-pressed',String(theme==='dark'))}
 document.querySelectorAll('[data-site-language]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.siteLanguage===language)));
 const group=document.querySelector('[data-site-languages]');
 if(group)group.setAttribute('aria-label',label[2]);
}
function mount(){
 const header=document.querySelector('.header-actions');
 if(!header)return;
 document.querySelectorAll('.header-actions .language').forEach(el=>el.remove());
 let settings=header.querySelector('[data-site-preferences]');
 if(!settings){
  settings=document.createElement('div');settings.className='site-preferences';settings.dataset.sitePreferences='';
  settings.innerHTML='<button type="button" class="site-theme-toggle" data-site-theme aria-pressed="false">☾</button><div class="site-lang-group" data-site-languages role="group"><button type="button" data-site-language="uk">UA</button><button type="button" data-site-language="ru">RU</button><button type="button" data-site-language="en">EN</button></div>';
  header.prepend(settings);
 }
 updateControls();
 if(language==='ru')translateElement(document.querySelector('#app')||document.body);
}
document.addEventListener('click',event=>{
 const button=event.target.closest('[data-site-theme],[data-site-language]');
 if(!button)return;
 if(button.hasAttribute('data-site-theme')){
  theme=theme==='dark'?'light':'dark';save();updateControls();return;
 }
 language=button.dataset.siteLanguage;save();
 if(language==='en'){location.assign(BASE+'/en/'+location.pathname.replace(new RegExp('^'+BASE+'/(?:en/)?'),'')+location.search);return}
 if(localeFromPath()==='en'){location.assign(BASE+'/'+location.pathname.replace(BASE+'/en/',''));return}
 if(language==='uk'){location.reload();return}
 updateControls();translateElement(document.querySelector('#app')||document.body);
});
let scheduled=false;
new MutationObserver(()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;mount()})}).observe(document.querySelector('#app')||document.body,{subtree:true,childList:true,characterData:true});
mount();
