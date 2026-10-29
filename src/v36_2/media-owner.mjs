import {mediaCoverage,mediaGalleryFiles} from './media.mjs';
const version='v35.9',BASE='/nfc-card-website';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const url=(route,locale)=>BASE+(locale==='uk'?'':'/'+locale)+route;
const significant=new Set(['PRODUCT_DETAIL_EXTENSION_SLOT','PROMOTION.BANNER']);
const optionalGroup=id=>id.startsWith('GLOBAL.')?'brand':id.startsWith('ABOUT.')?'story':id.startsWith('EDUCATION.')?'education':id.startsWith('REVIEW.READY.VIDEO')?'video':id.startsWith('INSTAGRAM.')?'instagram':id.startsWith('MENU.')?'menu':'review';
const groupOrder=['brand','review','story','education','video','instagram','menu'];
const OWNER_DECISION=Object.freeze({id:'NFC_CARD_VISUAL_COMPOSITION_DECISION_v35.8',date:'2026-10-27',scope:'LOCAL_COMPOSITION_ONLY',source:'Direct owner instruction'});
const copy={
  "uk": {
    "title": "Медіарішення власника",
    "intro": "30 погоджених винятків, Restaurant Mini на головній B та два окремі HOLD-слоти. Усі 27 позначених заглушок і вихідні файли збережено.",
    "note": "Рішення власника v35.8 від 27.10.2026 стосується локальної композиції. Воно не дозволяє публікацію, нові матеріали або акції. Змінити тут можна лише чернетку запиту для двох HOLD-слотів.",
    "hold": "HOLD · окреме погодження",
    "draft": "Запит для HOLD-слота",
    "keep": "Залишити HOLD",
    "brief": "Запросити опис або матеріал для погодження",
    "export": "Завантажити рішення та HOLD-чернетку",
    "reset": "Скинути лише HOLD-чернетки",
    "optional": "30 погоджених винятків",
    "optionalBody": "Власник дозволив не показувати ці необов’язкові та дублюючі матеріали в поточній композиції. Вихідні файли не видалено. Групи нижче зберігають точні ролі й походження.",
    "restaurant": "Restaurant Mini залишається на головній",
    "restaurantBody": "Власник обрав композицію B з окремими Beauty Mini та Restaurant Mini. Restaurant Mini залишається на головній; діючі товар, ціна, галерея та умови замовлення збережені.",
    "significant": "2 окремі місця · HOLD",
    "promotionTitle": "Місце для майбутньої акції",
    "promotion": "Місце зарезервоване. Потрібні окремо погоджені умови, строк, текст і матеріал. Зараз акції немає.",
    "extensionTitle": "Додаткова секція товарної сторінки",
    "extension": "Місце зарезервоване. Потрібні окремо погоджені призначення та зміст. Нової секції або функції не активовано.",
    "provenance": "Вихідний реєстр і походження (EN)",
    "source": "Вихідний файл",
    "reason": "Підстава попередньої пропозиції",
    "status": "HOLD-чернеток змінено",
    "initial": "31 рішення зафіксовано. Два слоти залишаються HOLD; чернеток немає.",
    "noJs": "Рішення, джерела та зарезервовані місця доступні без JavaScript. Експорт і тимчасова HOLD-чернетка потребують JavaScript.",
    "groups": {
      "brand": [
        "Брендові альтернативи",
        "Резервний логотип та компактний знак; поточна айдентика збережена."
      ],
      "review": [
        "Додаткові види Review Card",
        "Альтернативні й попередні фотографії; поточна товарна галерея збережена."
      ],
      "story": [
        "Необов’язкові сюжети про засновника",
        "Портрети, відеопостери й особисті сюжети можна повернути за окремим вибором."
      ],
      "education": [
        "Дублюючі пояснювальні зображення",
        "Схеми й перекладений текст уже пояснюють дію картки; зображення з вбудованим текстом не обов’язкові."
      ],
      "video": [
        "Додаткові відеопостери та субтитри",
        "Батьківські відео не погоджені до відтворення; додаткові постери й субтитри залишаються у джерелах."
      ],
      "instagram": [
        "Запасний рендер Instagram",
        "Наявні фотографії товару залишаються основними."
      ],
      "menu": [
        "Додаткові ілюстрації Menu в руці",
        "Шість варіантів та номінальні розміри вже показані; ці альтернативи не додають доказу реального виготовлення."
      ]
    },
    "decision": "Рішення власника · 27.10.2026",
    "optionalShort": "Погоджені винятки",
    "omission": "Погоджено · не показувати в поточній композиції",
    "placement": "Погоджено · залишити на головній B",
    "photo": "Наявне фото товару; розміщення Restaurant Mini на головній B погоджене для локальної композиції.",
    "viewHome": "Переглянути головну B",
    "pending": "Рішення для двох слотів залишається HOLD."
  },
  "en": {
    "title": "Owner media decisions",
    "intro": "30 approved omissions, Restaurant Mini on homepage B and two separate HOLD slots. All 27 labelled placeholders and original files are preserved.",
    "note": "The owner’s v35.8 decision of 27 October 2026 applies to the local composition. It does not authorize publication, new materials or promotions. Only a draft request for the two HOLD slots can be changed here.",
    "hold": "HOLD · separate approval",
    "draft": "Request for the HOLD slot",
    "keep": "Keep on HOLD",
    "brief": "Request a brief or material for approval",
    "export": "Download decisions and HOLD draft",
    "reset": "Reset only HOLD drafts",
    "optional": "30 approved omissions",
    "optionalBody": "The owner approved omitting these optional and duplicate materials from the current composition. Original files have not been deleted. The groups below preserve exact roles and provenance.",
    "restaurant": "Restaurant Mini stays on the homepage",
    "restaurantBody": "The owner selected composition B with separate Beauty Mini and Restaurant Mini features. Restaurant Mini stays on the homepage; its existing product, price, gallery and order terms are preserved.",
    "significant": "2 reserved places · HOLD",
    "promotionTitle": "A place for a future promotion",
    "promotion": "This place is reserved. Separately approved terms, dates, copy and material are required. No promotion is active.",
    "extensionTitle": "Additional product-page section",
    "extension": "This place is reserved. A separately approved purpose and content brief are required. No new section or feature is active.",
    "provenance": "Original register and provenance (EN)",
    "source": "Source file",
    "reason": "Reason for the earlier proposal",
    "status": "Changed HOLD drafts",
    "initial": "31 decisions are recorded. Two slots remain on HOLD; there are no drafts.",
    "noJs": "Decisions, sources and reserved places can be reviewed without JavaScript. Export and temporary HOLD drafts require JavaScript.",
    "groups": {
      "brand": [
        "Brand alternatives",
        "The spare logo and compact mark; current brand identity is preserved."
      ],
      "review": [
        "Additional Review Card views",
        "Alternate and previous photographs; the current product gallery is preserved."
      ],
      "story": [
        "Optional founder stories",
        "Portraits, video posters and personal story chapters can be restored by separate choice."
      ],
      "education": [
        "Duplicate explanatory imagery",
        "Translated text and diagrams already explain the card action; baked-in text images are optional."
      ],
      "video": [
        "Additional video posters and captions",
        "The parent videos await playback approval. Additional posters and captions remain in the original sources."
      ],
      "instagram": [
        "Spare Instagram render",
        "Existing product photographs remain primary."
      ],
      "menu": [
        "Additional Menu-in-hand illustrations",
        "Six variants and nominal dimensions are already shown. These alternatives do not establish real manufacturing proof."
      ]
    },
    "decision": "Owner decision · 27 October 2026",
    "optionalShort": "Approved omissions",
    "omission": "Approved · omit from the current composition",
    "placement": "Approved · retain on homepage B",
    "photo": "Existing product photograph; Restaurant Mini placement on homepage B is approved for the local composition.",
    "viewHome": "View homepage B",
    "pending": "Both slot decisions remain on HOLD."
  },
  "pl": {
    "title": "Decyzje właściciela o mediach",
    "intro": "30 zatwierdzonych pominięć, Restaurant Mini na stronie głównej B i dwa osobne miejsca HOLD. Zachowano 27 opisanych elementów zastępczych oraz wszystkie pliki źródłowe.",
    "note": "Decyzja właściciela v35.8 z 27 października 2026 dotyczy kompozycji lokalnej. Nie zezwala na publikację, nowe materiały ani promocje. Tutaj można zmienić tylko projekt prośby dotyczącej dwóch miejsc HOLD.",
    "hold": "HOLD · osobna akceptacja",
    "draft": "Prośba dotycząca miejsca HOLD",
    "keep": "Pozostaw HOLD",
    "brief": "Poproś o opis lub materiał do akceptacji",
    "export": "Pobierz decyzje i projekt HOLD",
    "reset": "Zresetuj tylko projekty HOLD",
    "optional": "30 zatwierdzonych pominięć",
    "optionalBody": "Właściciel zatwierdził pominięcie tych opcjonalnych i powtarzających się materiałów w obecnej kompozycji. Pliki źródłowe nie zostały usunięte. Grupy poniżej zachowują dokładne role i pochodzenie.",
    "restaurant": "Restaurant Mini pozostaje na stronie głównej",
    "restaurantBody": "Właściciel wybrał kompozycję B z osobnymi sekcjami Beauty Mini i Restaurant Mini. Restaurant Mini pozostaje na stronie głównej; zachowano obecny produkt, cenę, galerię i warunki zamówienia.",
    "significant": "2 zarezerwowane miejsca · HOLD",
    "promotionTitle": "Miejsce na przyszłą promocję",
    "promotion": "Miejsce jest zarezerwowane. Potrzebne są osobno zatwierdzone warunki, termin, treść i materiał. Promocja nie jest aktywna.",
    "extensionTitle": "Dodatkowa sekcja strony produktu",
    "extension": "Miejsce jest zarezerwowane. Wymagane są osobno zatwierdzone cel i opis treści. Nie aktywowano nowej sekcji ani funkcji.",
    "provenance": "Rejestr źródłowy i pochodzenie (EN)",
    "source": "Plik źródłowy",
    "reason": "Uzasadnienie wcześniejszej propozycji",
    "status": "Zmienione projekty HOLD",
    "initial": "Zapisano 31 decyzji. Dwa miejsca pozostają HOLD; nie ma projektów.",
    "noJs": "Decyzje, źródła i zarezerwowane miejsca można przeglądać bez JavaScript. Eksport i tymczasowe projekty HOLD wymagają JavaScript.",
    "groups": {
      "brand": [
        "Alternatywy marki",
        "Zapasowe logo i kompaktowy znak; obecna identyfikacja jest zachowana."
      ],
      "review": [
        "Dodatkowe ujęcia Review Card",
        "Alternatywne i wcześniejsze zdjęcia; obecna galeria produktu jest zachowana."
      ],
      "story": [
        "Opcjonalne historie założyciela",
        "Portrety, plakaty wideo i osobiste historie można przywrócić osobną decyzją."
      ],
      "education": [
        "Powtarzające się ilustracje objaśniające",
        "Przetłumaczone teksty i schematy już wyjaśniają działanie karty; grafiki z wbudowanym tekstem są opcjonalne."
      ],
      "video": [
        "Dodatkowe plakaty wideo i napisy",
        "Filmy źródłowe czekają na zgodę na odtwarzanie. Dodatkowe plakaty i napisy pozostają w źródłach."
      ],
      "instagram": [
        "Zapasowy render Instagram",
        "Obecne zdjęcia produktu pozostają podstawowe."
      ],
      "menu": [
        "Dodatkowe ilustracje Menu w dłoni",
        "Sześć wariantów i wymiary nominalne są już pokazane. Te alternatywy nie są dowodem rzeczywistej produkcji."
      ]
    },
    "decision": "Decyzja właściciela · 27 października 2026",
    "optionalShort": "Zatwierdzone pominięcia",
    "omission": "Zatwierdzono · pomiń w obecnej kompozycji",
    "placement": "Zatwierdzono · pozostaw na stronie głównej B",
    "photo": "Obecne zdjęcie produktu; umieszczenie Restaurant Mini na stronie głównej B zatwierdzono dla kompozycji lokalnej.",
    "viewHome": "Zobacz stronę główną B",
    "pending": "Decyzje dotyczące obu miejsc pozostają HOLD."
  }
};
/** Decision overlay only. The original, checksum-bound media ledger is not edited. */
export function ownerMediaRegister(){
 return mediaCoverage().filter(row=>row.disposition==='omitted').map(row=>{
  const decisionGroup=significant.has(row.slot_id)?'significant_hold':row.slot_id==='HOME.MINI.RESTAURANT'?'restaurant':'optional';
  const approval=decisionGroup==='significant_hold'?'HOLD':decisionGroup==='restaurant'?'OWNER_APPROVED_LOCAL_PLACEMENT':'OWNER_APPROVED_LOCAL_OMISSION';
  const decision=decisionGroup==='significant_hold'?'hold':decisionGroup==='restaurant'?'retain_home_b':'omit_current_composition';
  return {...row,approval,decision,ownerDecision:OWNER_DECISION,productionApproval:false,significant:significant.has(row.slot_id),decisionGroup,optionalGroup:optionalGroup(row.slot_id)};
 });
}

// Integration-compatible export; only the two HOLD proposals are drafts.
export function ownerMediaDraft(choices={},createdAt=new Date().toISOString()){
 const selected=id=>choices instanceof Map?choices.get(id):choices[id];
 return {
  version,kind:'OWNER_MEDIA_DECISION_RECORD_AND_HOLD_DRAFT',approval:'LOCAL_COMPOSITION_APPROVED',productionApproval:false,ownerDecision:OWNER_DECISION,createdAt,
  counts:{optional:30,approvedOmissions:30,restaurant:1,approvedPlacement:1,significantHold:2,existingPlaceholdersPreserved:27},
  slots:ownerMediaRegister().map(row=>({
   slotId:row.slot_id,group:row.decisionGroup,source:row.planned_source||null,sourceSha256:row.planned_source_sha256||null,
   baselineDisposition:row.disposition,decision:row.decision,approval:row.approval,productionApproval:false,
   proposedDecision:row.decisionGroup==='significant_hold'&&selected(row.slot_id)==='brief_requested'?'brief_requested':row.decision
  }))
 };
}

export function renderOwnerMediaReview(locale='uk'){
 if(!Object.hasOwn(copy,locale))throw new RangeError('Unsupported owner-review locale');
 const t=copy[locale],rows=ownerMediaRegister(),optional=rows.filter(row=>row.decisionGroup==='optional'),restaurant=rows.find(row=>row.decisionGroup==='restaurant');
 if(rows.length!==33||optional.length!==30||!restaurant||rows.filter(row=>row.decisionGroup==='significant_hold').length!==2)throw new Error('Owner decisions must preserve30+1+2 roles');
 const provenance=row=>`<details class="owner-media-source"><summary>${t.provenance}</summary><dl><dt>${t.source}</dt><dd><code>${esc(row.planned_source||'—')}</code></dd>${row.planned_source_sha256?`<dt>SHA-256</dt><dd><code>${esc(row.planned_source_sha256)}</code></dd>`:''}<dt>${t.reason}</dt><dd lang="en">${esc(row.reason)}</dd></dl></details>`;
 const approved=(row,label)=>`<p class="owner-media-approved" data-owner-media-approval="${row.approval}">${label}</p>`;
 const optionalRow=row=>`<article class="owner-media-optional-item" data-owner-media-slot="${esc(row.slot_id)}"><h3><code>${esc(row.slot_id)}</code></h3>${approved(row,t.omission)}${provenance(row)}</article>`;
 const groups=groupOrder.map(key=>{
  const matches=optional.filter(row=>row.optionalGroup===key),[name,brief]=t.groups[key];
  return `<details class="owner-media-optional-group" data-owner-media-optional-group="${key}"><summary><span>${name}</span><span class="owner-media-group-count">${matches.length}</span></summary><p>${brief}</p>${matches.map(optionalRow).join('')}</details>`;
 }).join('');
 const holds=rows.filter(row=>row.decisionGroup==='significant_hold').map(row=>`<article class="owner-media-hold-card" data-owner-media-slot="${esc(row.slot_id)}" data-owner-media-approval="HOLD"><div class="owner-media-heading"><h3>${row.slot_id==='PROMOTION.BANNER'?t.promotionTitle:t.extensionTitle}</h3><span class="owner-media-hold">${t.hold}</span></div><code class="owner-media-slot-id">${esc(row.slot_id)}</code><div class="owner-media-role" role="note" data-owner-media-reserved="${esc(row.slot_id)}"><p>${row.slot_id==='PROMOTION.BANNER'?t.promotion:t.extension}</p></div><label class="owner-media-choice"><span>${t.draft}<span class="owner-media-sr"> · ${esc(row.slot_id)}</span></span><select data-owner-media-choice="${esc(row.slot_id)}" data-owner-media-group="significant_hold"><option value="hold">${t.keep}</option><option value="brief_requested">${t.brief}</option></select></label>${provenance(row)}</article>`).join('');
 const photo=mediaGalleryFiles('restaurant-review-card')[0];
 return `<section class="wrap owner-media-review" aria-labelledby="owner-media-title" data-owner-media-version="${version}" data-owner-media-decision="${OWNER_DECISION.id}" lang="${locale}"><div class="owner-media-intro"><p class="owner-media-decision-reference">${t.decision}</p><h1 id="owner-media-title">${t.title}</h1><p>${t.intro}</p><p class="owner-media-draft-note">${t.note}</p></div><nav class="owner-media-jump" aria-label="${esc(t.title)}"><a href="#owner-media-optional">30 · ${t.optionalShort}</a><a href="#owner-media-restaurant">1 · Restaurant Mini</a><a href="#owner-media-significant">2 · HOLD</a></nav><div class="owner-media-toolbar"><button class="button" type="button" data-owner-media-export>${t.export}</button><button class="button secondary" type="button" data-owner-media-reset>${t.reset}</button><p role="status" aria-live="polite" data-owner-media-status>${t.initial}</p></div><noscript><p class="owner-media-noscript">${t.noJs}</p></noscript><section class="owner-media-optional" id="owner-media-optional" aria-labelledby="owner-media-optional-title"><h2 id="owner-media-optional-title">${t.optional}</h2><p>${t.optionalBody}</p><div class="owner-media-groups">${groups}</div></section><section class="owner-media-restaurant" id="owner-media-restaurant" aria-labelledby="owner-media-restaurant-title" data-owner-media-slot="HOME.MINI.RESTAURANT"><div><h2 id="owner-media-restaurant-title">${t.restaurant}</h2>${approved(restaurant,t.placement)}<p>${t.restaurantBody}</p><div class="owner-media-options-links"><a class="text-link" href="${url('/',locale)}">${t.viewHome} →</a></div>${provenance(restaurant)}</div><figure><img src="${BASE}/assets/${esc(photo)}" width="600" height="600" loading="lazy" alt="Restaurant Review Card Mini" data-owner-media-placement="HOME.MINI.RESTAURANT" data-media-provenance="user_provided_business_asset" data-media-claim-role="actual_product"><figcaption>${t.photo}</figcaption></figure></section><section id="owner-media-significant" aria-labelledby="owner-media-significant-title"><h2 id="owner-media-significant-title">${t.significant}</h2><div class="owner-media-hold-grid">${holds}</div></section></section>`;
}

export function bindOwnerMediaReview(){
 if(typeof document==='undefined')return;
 const root=document.querySelector('[data-owner-media-version]');if(!root||root.dataset.bound)return;root.dataset.bound='true';
 const t=copy[root.lang]||copy.uk,selects=[...root.querySelectorAll('[data-owner-media-choice][data-owner-media-group="significant_hold"]')];
 const status=()=>{
  const changed=selects.filter(select=>select.value==='brief_requested').length;
  root.querySelector('[data-owner-media-status]').textContent=changed?`${t.status}: ${changed} / 2. ${t.pending}`:t.initial;
 };
 root.addEventListener('change',event=>{if(event.target.matches('[data-owner-media-choice]'))status();});
 root.querySelector('[data-owner-media-reset]').addEventListener('click',()=>{for(const select of selects)select.value='hold';status();});
 root.querySelector('[data-owner-media-export]').addEventListener('click',()=>{
  const payload=ownerMediaDraft(new Map(selects.map(select=>[select.dataset.ownerMediaChoice,select.value])));
  const objectURL=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)+'\n'],{type:'application/json'})),a=document.createElement('a');
  a.href=objectURL;a.download='NFC_CARD_MEDIA_OWNER_DECISIONS_AND_HOLD_DRAFT_v35_9.json';a.addEventListener('click',event=>event.stopPropagation());a.click();setTimeout(()=>URL.revokeObjectURL(objectURL),1000);
 });
}
