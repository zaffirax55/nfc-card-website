import analyticsContract from './analytics.json' with {type:'json'};
const analyticsEvents=[...new Set(Object.values(analyticsContract).flat())];
import commerceData from './commerce.json' with { type: 'json' };
import {validateCommerce} from './commerce-contract.mjs';
import verificationData from './verification.json' with { type: 'json' };
import {instagram,instagramGlobalFAQs,instagramProductFAQs} from './instagram.mjs';
import {validateInstagramContent} from './instagram-claims.mjs';
import polishCopy from './pl-model.json' with { type: 'json' };

// Source-backed bilingual content. Verification is resolved before rendering.
export const pair = (uk, en) => ({ uk, en });
const freeze = value => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
};
export const commerce = freeze(validateCommerce(structuredClone(commerceData)));
export const flags = freeze(structuredClone(verificationData));
const source = {
  "config": {
    "schemaVersion": 6,
    "brand": "NFC CARD",
    "productName": "Google Review Card",
    "parentBrand": "Antonov Digital",
    "defaultLocale": "uk",
    "locales": [
      "uk",
      "en",
      "pl"
    ],
    "origin": "http://127.0.0.1:8765",
    "publicationReady": false,
    "integrationStatus": "IMPLEMENTED_NOT_CONFIGURED",
    "contacts": {
      "telegram": {
        "status": "confirmed",
        "value": "https://t.me/TijGabumG",
        "href": "https://t.me/TijGabumG",
        "label": {
          "uk": "Написати в Telegram",
          "en": "Message on Telegram"
        },
        "display": "Telegram",
        "evidence": "NFC_CARD_Content_and_Function_Master_v5.md; NFC_CARD_CODEX_EXISTING_SITE_REFINEMENT_PROMPT_v6.md"
      },
      "phone": {
        "status": "confirmed",
        "value": "+380980421619",
        "href": "tel:+380980421619",
        "label": {
          "uk": "Зателефонувати",
          "en": "Call"
        },
        "display": "+380 98 042 16 19",
        "evidence": "NFC_CARD_Content_and_Function_Master_v5.md; NFC_CARD_CODEX_EXISTING_SITE_REFINEMENT_PROMPT_v6.md"
      },
      "whatsapp": {
        "status": "confirmed",
        "value": "+380980421619",
        "href": "https://wa.me/380980421619",
        "label": {
          "uk": "Написати у WhatsApp",
          "en": "Message on WhatsApp"
        },
        "display": "WhatsApp",
        "evidence": "NFC_CARD_Content_and_Function_Master_v5.md; NFC_CARD_CODEX_EXISTING_SITE_REFINEMENT_PROMPT_v6.md"
      },
      "viber": {
        "status": "confirmed",
        "value": "+380980421619",
        "href": "viber://chat?number=%2B380980421619",
        "label": {
          "uk": "Написати у Viber",
          "en": "Message on Viber"
        },
        "display": "Viber",
        "evidence": "NFC_CARD_Content_and_Function_Master_v5.md; NFC_CARD_CODEX_EXISTING_SITE_REFINEMENT_PROMPT_v6.md"
      },
      "instagram": {
        "status": "confirmed",
        "value": "https://www.instagram.com/antonovdigital/",
        "href": "https://www.instagram.com/antonovdigital/",
        "label": {
          "uk": "Відкрити Instagram",
          "en": "Open Instagram"
        },
        "display": "Instagram",
        "evidence": "NFC_CARD_Content_and_Function_Master_v5.md; NFC_CARD_CODEX_EXISTING_SITE_REFINEMENT_PROMPT_v6.md"
      }
    },
    "hours": {
      "daily": true,
      "from": "07:00",
      "to": "23:00",
      "usualResponseMinutes": 45
    },
    "legal": {
      "identity": null,
      "address": null,
      "registration": null,
      "privacyApproved": false,
      "termsApproved": false
    },
    "specs": [
      {
        "name": {
          "uk": "Розмір",
          "en": "Size"
        },
        "value": {
          "uk": "10 × 10 см",
          "en": "10 × 10 cm"
        }
      },
      {
        "name": {
          "uk": "Товщина",
          "en": "Thickness"
        },
        "value": {
          "uk": "3 мм",
          "en": "3 mm"
        }
      },
      {
        "name": {
          "uk": "Матеріал",
          "en": "Material"
        },
        "value": {
          "uk": "Пластик",
          "en": "Plastic"
        }
      }
    ],
    "events": analyticsEvents,
    "disclaimer": {
      "uk": "NFC CARD є незалежним продуктом і не є афілійованим, схваленим або спонсорованим Google. Google, Google Maps та відповідні логотипи є торговельними марками їхніх власників.",
      "en": "NFC CARD is an independent product and is not affiliated with, endorsed or sponsored by Google. Google, Google Maps and their respective logos are trademarks of their respective owners."
    },
    "seo": {
      "homeTitle": {
        "uk": "NFC-картки для Google-відгуків | NFC CARD",
        "en": "NFC Google Review Cards for Business | NFC CARD"
      },
      "homeDescription": {
        "uk": "Google Review Card для бізнесу: прямий перехід до форми Google-відгуку, готовий або індивідуальний дизайн, формат 10 × 10 см і безкоштовна доставка по Україні.",
        "en": "NFC Review Cards for local businesses, configured for a direct path to the Google review form, available in ready-made or custom-branded versions."
      },
      "productTitle": {
        "uk": "Google Review Card — картка для Google-відгуків | NFC CARD",
        "en": "Google Review Card — Google review card for business | NFC CARD"
      },
      "productDescription": {
        "uk": "Google Review Card для локального бізнесу. 1 картка — 1500 грн, 2 — 2600 грн; брендований дизайн — від 2000 грн. Налаштування, підтримка й доставка по Україні включені.",
        "en": "Google Review Card for local businesses. One card is UAH 1,500 and two are UAH 2,600; custom branding starts at UAH 2,000. Setup, support and delivery within Ukraine are included."
      }
    },
    "production": {
      "deposit": {
        "status": "confirmed",
        "value": {
          "uk": "200 грн після погодження. Входить у загальну вартість замовлення.",
          "en": "UAH 200 after approval. Included in the total order price."
        },
        "label": {
          "uk": "Передоплата",
          "en": "Deposit"
        },
        "evidence": "NFC_CARD_Content_and_Function_Master_v5.md; NFC_CARD_CODEX_EXISTING_SITE_REFINEMENT_PROMPT_v6.md"
      },
      "balance": {
        "status": "confirmed",
        "value": {
          "uk": "Після відправлення та отримання вами номера ТТН.",
          "en": "After dispatch and after you receive the tracking number."
        },
        "label": {
          "uk": "Оплата залишку",
          "en": "Balance payment"
        },
        "evidence": "NFC_CARD_Content_and_Function_Master_v5.md; NFC_CARD_CODEX_EXISTING_SITE_REFINEMENT_PROMPT_v6.md"
      },
      "payment": {
        "status": "confirmed",
        "value": {
          "uk": "Банківський переказ. USDT — за попередньою домовленістю.",
          "en": "Bank transfer. USDT by prior agreement."
        },
        "label": {
          "uk": "Способи оплати",
          "en": "Payment methods"
        },
        "evidence": "NFC_CARD_Content_and_Function_Master_v5.md; NFC_CARD_CODEX_EXISTING_SITE_REFINEMENT_PROMPT_v6.md"
      },
      "duration": {
        "status": "confirmed",
        "value": {
          "uk": "Точний строк підтверджуємо до передоплати",
          "en": "We confirm the exact lead time before the deposit"
        },
        "label": {
          "uk": "Строк підготовки",
          "en": "Lead time"
        },
        "evidence": "NFC_CARD_Content_and_Function_Master_v5.md; NFC_CARD_CODEX_EXISTING_SITE_REFINEMENT_PROMPT_v6.md"
      },
      "delivery": {
        "status": "confirmed",
        "value": {
          "uk": "Стандартна доставка Новою поштою по Україні включена у вартість.",
          "en": "Standard Nova Poshta delivery within Ukraine is included in the price."
        },
        "label": {
          "uk": "Доставка по Україні",
          "en": "Delivery within Ukraine"
        },
        "evidence": "NFC_CARD_Content_and_Function_Master_v5.md; NFC_CARD_CODEX_EXISTING_SITE_REFINEMENT_PROMPT_v6.md"
      },
      "pickup": {
        "status": "confirmed",
        "value": {
          "uk": "Самовивіз за попередньою домовленістю.",
          "en": "Collection by prior arrangement."
        },
        "label": {
          "uk": "Самовивіз",
          "en": "Collection"
        },
        "evidence": "NFC_CARD_Content_and_Function_Master_v5.md; NFC_CARD_CODEX_EXISTING_SITE_REFINEMENT_PROMPT_v6.md"
      },
      "europe": {
        "status": "confirmed",
        "value": {
          "uk": "Замовлення й міжнародну доставку погоджуємо індивідуально. Доставку оплачує клієнт.",
          "en": "Orders and international delivery are agreed individually. Delivery is paid by the customer."
        },
        "label": {
          "uk": "Європа",
          "en": "Europe"
        },
        "evidence": "NFC_CARD_Content_and_Function_Master_v5.md; NFC_CARD_CODEX_EXISTING_SITE_REFINEMENT_PROMPT_v6.md"
      }
    }
  },
  "ui": {
    "nav": {
      "uk": [
        "Картки",
        "Як це працює",
        "Для бізнесу",
        "Про NFC CARD",
        "Доставка й оплата",
        "FAQ",
        "Контакти"
      ],
      "en": [
        "Cards",
        "How it works",
        "For business",
        "About NFC CARD",
        "Delivery & payment",
        "FAQ",
        "Contact"
      ]
    },
    "order": {
      "uk": "Замовити",
      "en": "Order"
    },
    "orderStandard": {
      "uk": "Замовити Google Review Card",
      "en": "Order Google Review Card"
    },
    "quote": {
      "uk": "Запросити прорахунок",
      "en": "Request a business quote"
    },
    "free": {
      "uk": "Отримати безкоштовний макет",
      "en": "Get a free branded mockup"
    },
    "mockup": {
      "uk": "Отримати безкоштовний макет",
      "en": "Get a free branded mockup"
    },
    "details": {
      "uk": "Детальніше",
      "en": "Details"
    },
    "help": {
      "uk": "Потрібна консультація",
      "en": "I need advice"
    },
    "catalog": {
      "uk": "Картки",
      "en": "Cards"
    },
    "backCatalog": {
      "uk": "Повернутися до карток",
      "en": "Back to cards"
    },
    "returnCatalog": {
      "uk": "Повернутися до карток",
      "en": "Back to cards"
    },
    "newRequest": {
      "uk": "Нова заявка",
      "en": "New request"
    },
    "back": {
      "uk": "Назад",
      "en": "Back"
    },
    "contact": {
      "uk": "Контакти",
      "en": "Contact"
    },
    "privacy": {
      "uk": "Політика конфіденційності",
      "en": "Privacy policy"
    },
    "terms": {
      "uk": "Умови замовлення",
      "en": "Order terms"
    },
    "warranty": {
      "uk": "Гарантія та повернення",
      "en": "Warranty and returns"
    },
    "delivery": {
      "uk": "Доставка й оплата",
      "en": "Delivery & payment"
    },
    "submit": {
      "uk": "Надіслати заявку",
      "en": "Send request"
    },
    "sending": {
      "uk": "Надсилаємо заявку…",
      "en": "Sending your request…"
    },
    "submitting": {
      "uk": "Надсилаємо заявку…",
      "en": "Sending your request…"
    },
    "successTitle": {
      "uk": "Дякуємо! Заявку отримано.",
      "en": "Thank you! We have received your request."
    },
    "success": {
      "uk": "Дякуємо! Заявку отримано.",
      "en": "Thank you — we received your request."
    },
    "successBody": {
      "uk": "Ми зв’яжемося з вами у вибраному месенджері, уточнимо Google-точку, кількість і деталі замовлення. Зазвичай відповідаємо протягом 45 хвилин у час 07:00–23:00.",
      "en": "We will contact you in your preferred messenger to confirm your Google location, quantity and order details. We usually respond within 45 minutes between 07:00 and 23:00."
    },
    "successText": {
      "uk": "Ми зв’яжемося з вами у вибраному месенджері. Зазвичай відповідаємо протягом 45 хвилин у час 07:00–23:00.",
      "en": "We will contact you in your selected messenger. We usually respond within 45 minutes between 07:00 and 23:00."
    },
    "brandedSuccess": {
      "uk": "Для підготовки макета ми використаємо надане посилання на Instagram або сайт. За потреби попросимо додаткові матеріали в месенджері.",
      "en": "We will use the Instagram or website link you provided to prepare the mockup. If needed, we will ask for additional materials in your messenger."
    },
    "errorTitle": {
      "uk": "Не вдалося надіслати заявку.",
      "en": "We could not send your request."
    },
    "error": {
      "uk": "Не вдалося надіслати заявку.",
      "en": "We could not send your request."
    },
    "errorBody": {
      "uk": "Дані не втрачено, якщо ви бачите номер заявки. Якщо номера немає, напишіть нам у Telegram або зателефонуйте за номером +380 98 042 16 19.",
      "en": "Your details have not been lost if you can see a request number. If there is no number, message us on Telegram or call +380 98 042 16 19."
    },
    "errorText": {
      "uk": "Дані не втрачено, якщо ви бачите номер заявки. Якщо номера немає, напишіть нам у Telegram або зателефонуйте за номером +380 98 042 16 19.",
      "en": "Your details have not been lost if you can see a request number. If there is no number, message us on Telegram or call +380 98 042 16 19."
    },
    "retry": {
      "uk": "Спробувати ще раз",
      "en": "Try again"
    },
    "formTitle": {
      "uk": "Замовте Google Review Card для вашого бізнесу",
      "en": "Order an Google Review Card for your business"
    },
    "formIntro": {
      "uk": "Залиште контакти — ми уточнимо Google-точку, кількість і потрібний варіант. Для Branded Review Card підготуємо перший макет безкоштовно.",
      "en": "Leave your contact details and we will confirm the Google location, quantity and selected version. For a Branded Review Card, the first mockup is free."
    },
    "responseTime": {
      "uk": "Щодня 07:00–23:00. Зазвичай відповідаємо протягом 45 хвилин.",
      "en": "Daily 07:00–23:00. We usually respond within 45 minutes."
    },
    "quantity": {
      "uk": "Кількість",
      "en": "Quantity"
    },
    "variant": {
      "uk": "Варіант картки",
      "en": "Card variant"
    },
    "more": {
      "uk": "більше 2",
      "en": "more than 2"
    },
    "individual": {
      "uk": "Індивідуальний прорахунок",
      "en": "Custom quote"
    },
    "customQuote": {
      "uk": "Індивідуальний прорахунок",
      "en": "Custom quote"
    },
    "total": {
      "uk": "Вартість замовлення",
      "en": "Order price"
    },
    "deposit": {
      "uk": "Передоплата входить у вартість",
      "en": "Deposit is included in the price"
    },
    "noSelection": {
      "uk": "Оберіть варіант",
      "en": "Choose a variant"
    },
    "required": {
      "uk": "Обов’язкове поле",
      "en": "Required field"
    },
    "optional": {
      "uk": "необов’язково",
      "en": "optional"
    },
    "media": {
      "uk": "Місце для реального фото",
      "en": "Space for a real photo"
    },
    "founderMedia": {
      "uk": "Місце для фото засновника",
      "en": "Space for the founder’s photo"
    },
    "menu": {
      "uk": "Відкрити меню",
      "en": "Open menu"
    },
    "close": {
      "uk": "Закрити",
      "en": "Close"
    },
    "skip": {
      "uk": "Перейти до вмісту",
      "en": "Skip to content"
    },
    "draft": {
      "uk": "Чернетка документа",
      "en": "Draft document"
    },
    "previewNotice": {
      "uk": "Локальний перегляд. Заявки та сповіщення перевіряються у тестовому режимі.",
      "en": "Local preview. Requests and notifications are checked in test mode."
    },
    "localSuccess": {
      "uk": "Тестову заявку збережено локально.",
      "en": "Test request saved locally."
    },
    "localSuccessText": {
      "uk": "Це локальна перевірка форми. Реальне сповіщення не надсилалося.",
      "en": "This is a local form check. No real notification was sent."
    },
    "orderId": {
      "uk": "Номер заявки",
      "en": "Request number"
    },
    "noReceipt": {
      "uk": "Заявку ще не підтверджено",
      "en": "No request has been confirmed yet"
    },
    "noReceiptTitle": {
      "uk": "Заявку ще не підтверджено",
      "en": "No request has been confirmed yet"
    },
    "noReceiptBody": {
      "uk": "Надішліть форму або зв’яжіться з нами у зручному месенджері.",
      "en": "Send the form or contact us in your preferred messenger."
    },
    "qrStandard": {
      "uk": "QR-код у стандартну версію не входить.",
      "en": "A QR code is not included in the standard card."
    },
    "qrBranded": {
      "uk": "QR-код — за бажанням для брендованої картки.",
      "en": "A QR code is optional for the branded card."
    },
    "europe": {
      "uk": "Замовлення для Європи прораховуємо індивідуально, разом із доставкою.",
      "en": "European orders are quoted individually, including delivery."
    },
    "telegram": {
      "uk": "Написати в Telegram",
      "en": "Message on Telegram"
    },
    "phone": {
      "uk": "Зателефонувати",
      "en": "Call"
    },
    "whatsapp": {
      "uk": "Написати у WhatsApp",
      "en": "Message on WhatsApp"
    },
    "viber": {
      "uk": "Написати у Viber",
      "en": "Message on Viber"
    },
    "instagram": {
      "uk": "Відкрити Instagram",
      "en": "Open Instagram"
    }
  },
  "fields": {
    "name": {
      "uk": "Ім’я",
      "en": "Name"
    },
    "phone": {
      "uk": "Номер телефону",
      "en": "Phone number"
    },
    "messenger": {
      "uk": "Зручний месенджер",
      "en": "Preferred messenger"
    },
    "preferredMessenger": {
      "uk": "Зручний месенджер",
      "en": "Preferred messenger"
    },
    "messengerContact": {
      "uk": "Username або номер для зв’язку",
      "en": "Username or contact number"
    },
    "alternateContact": {
      "uk": "Username або номер для зв’язку",
      "en": "Username or contact number"
    },
    "differentContact": {
      "uk": "Контакт у месенджері відрізняється від номера телефону",
      "en": "My messenger contact is different from my phone number"
    },
    "product": {
      "uk": "Що вас цікавить?",
      "en": "What are you interested in?"
    },
    "quantity": {
      "uk": "Кількість",
      "en": "Quantity"
    },
    "businessName": {
      "uk": "Назва бізнесу",
      "en": "Business name"
    },
    "googleMaps": {
      "uk": "Посилання на Google Maps",
      "en": "Google Maps link"
    },
    "googleMapsHint": {
      "uk": "Можна додати зараз або надіслати нам у месенджері",
      "en": "You can add it now or send it to us in your messenger"
    },
    "businessUrl": {
      "uk": "Instagram / сайт бізнесу",
      "en": "Business Instagram / website"
    },
    "comment": {
      "uk": "Коментар",
      "en": "Comment"
    },
    "consent": {
      "uk": "Погоджуюся на обробку даних, щоб NFC CARD міг відповісти на мою заявку.",
      "en": "I agree to the processing of my data so NFC CARD can respond to my request."
    },
    "standard": {
      "uk": "Google Review Card — готовий дизайн",
      "en": "Google Review Card — ready-made design"
    },
    "branded": {
      "uk": "Branded Review Card — індивідуальний дизайн",
      "en": "Branded Review Card — custom design"
    },
    "bulk": {
      "uk": "Картки для кількох філій / команди",
      "en": "Cards for multiple locations / a team"
    },
    "consultation": {
      "uk": "Потрібна консультація",
      "en": "I need advice"
    },
    "businessUrlHint": {
      "uk": "Для брендованої картки додайте сайт, Instagram або іншу публічну сторінку бізнесу.",
      "en": "For a branded card, add a website, Instagram or another public business page."
    }
  },
  "errors": {
    "name": {
      "uk": "Вкажіть ім’я.",
      "en": "Enter your name."
    },
    "phone": {
      "uk": "Вкажіть коректний номер телефону.",
      "en": "Enter a valid phone number."
    },
    "messenger": {
      "uk": "Оберіть зручний месенджер.",
      "en": "Choose your preferred messenger."
    },
    "businessUrl": {
      "uk": "Для брендованої картки додайте посилання на Instagram, сайт або іншу сторінку бізнесу.",
      "en": "For a branded card, add a link to Instagram, a website or another public business page."
    },
    "consent": {
      "uk": "Погодьтеся з обробкою даних, щоб ми могли відповісти на заявку.",
      "en": "Agree to the processing of your data so we can respond to your request."
    },
    "messengerContact": {
      "uk": "Вкажіть контакт у вибраному месенджері.",
      "en": "Enter your contact in the selected messenger."
    },
    "product": {
      "uk": "Оберіть потрібний варіант або консультацію.",
      "en": "Choose a variant or a consultation."
    },
    "quantity": {
      "uk": "Оберіть кількість: 1, 2 або більше 2.",
      "en": "Choose a quantity: 1, 2 or more than 2."
    },
    "googleMaps": {
      "uk": "Перевірте посилання на Google Maps або залиште поле порожнім.",
      "en": "Check the Google Maps link or leave the field empty."
    },
    "summary": {
      "uk": "Перевірте позначені поля.",
      "en": "Check the highlighted fields."
    },
    "network": {
      "uk": "Дані не втрачено, якщо ви бачите номер заявки. Якщо номера немає, напишіть нам у Telegram або зателефонуйте за номером +380 98 042 16 19.",
      "en": "Your details have not been lost if you can see a request number. If there is no number, message us on Telegram or call +380 98 042 16 19."
    },
    "server": {
      "uk": "Дані не втрачено, якщо ви бачите номер заявки. Якщо номера немає, напишіть нам у Telegram або зателефонуйте за номером +380 98 042 16 19.",
      "en": "Your details have not been lost if you can see a request number. If there is no number, message us on Telegram or call +380 98 042 16 19."
    }
  },
  "variants": [
    {
      "id": "standard",
      "name": "Google Review Card",
      "label": {
        "uk": "Готовий дизайн",
        "en": "Ready-made design"
      },
      "description": {
        "uk": "Готова NFC-картка, що після дотику смартфоном відкриває форму оцінки та відгуку вашого бізнесу в Google.",
        "en": "A ready NFC card that opens the rating and review interface for your Google business location after the customer taps it with a phone."
      },
      "cta": {
        "uk": "Замовити Google Review Card",
        "en": "Order Google Review Card"
      },
      "note": {
        "uk": "QR-код у стандартну версію не входить.",
        "en": "A QR code is not included in the standard card."
      },
      "slot": "P01",
      "qr": "not_included",
      "prices": {
        "1": 1500,
        "2": 2600
      },
      "provenance": "NFC_CARD_Site_Rebuild_Master_Brief_v9.md §3; NFC_CARD_Copy_UA_EN_v9.md §1",
      "benefits": {
        "uk": [
          "Налаштування на точну Google-точку",
          "Без окремого застосунку для клієнта",
          "Без обов’язкової щомісячної підписки",
          "Стандартна доставка по Україні включена"
        ],
        "en": [
          "Set up for your exact Google location",
          "No app required for the customer",
          "No required monthly subscription",
          "Standard delivery within Ukraine included"
        ]
      }
    },
    {
      "id": "branded",
      "name": "Branded Review Card",
      "label": {
        "uk": "Індивідуальний дизайн",
        "en": "Custom design"
      },
      "description": {
        "uk": "NFC-картка з вашим логотипом, кольорами, текстом і погодженим закликом до дії.",
        "en": "An NFC card with your logo, colours, copy and an agreed call to action."
      },
      "cta": {
        "uk": "Отримати безкоштовний макет",
        "en": "Get a free mockup"
      },
      "note": {
        "uk": "Надішліть посилання на Instagram, сайт або іншу сторінку вашого бізнесу — ми запропонуємо перший варіант дизайну без зобов’язань.",
        "en": "Send a link to your Instagram, website or another public business page — we will suggest a first design with no obligation."
      },
      "slot": "P03",
      "qr": "optional",
      "prices": {
        "1": 2000,
        "2": 3600
      },
      "provenance": "NFC_CARD_Site_Rebuild_Master_Brief_v9.md §3; NFC_CARD_Copy_UA_EN_v9.md §1",
      "benefits": {
        "uk": [
          "Перший персональний макет безкоштовно",
          "Без окремої оплати за дизайн",
          "Налаштування на вашу Google-точку",
          "QR-код за бажанням",
          "Стандартна доставка по Україні включена"
        ],
        "en": [
          "First custom mockup is free",
          "No separate design fee",
          "Set up for your Google location",
          "Optional QR code",
          "Standard delivery within Ukraine included"
        ]
      }
    }
  ],
  "copy": {
    "catalog": {
      "eyebrow": {
        "uk": "NFC REVIEW CARD ДЛЯ БІЗНЕСУ",
        "en": "NFC REVIEW CARD FOR BUSINESS"
      },
      "heading": {
        "uk": "Оберіть NFC-картку для вашого бізнесу",
        "en": "Choose an NFC card for your business"
      },
      "body": {
        "uk": "Готовий дизайн або персональне брендування. Обидва варіанти налаштовуємо на точну Google-точку вашого бізнесу й безкоштовно доставляємо по Україні.",
        "en": "Choose a ready-made design or custom branding. We configure both versions for your exact Google business location."
      }
    },
    "problem": {
      "heading": {
        "uk": "Задоволені клієнти не завжди доходять до відгуку",
        "en": "Happy customers do not always get around to leaving a review"
      },
      "paragraphs": {
        "uk": [
          "Після покупки або послуги люди часто дякують і йдуть. Якщо попросити знайти бізнес у Google пізніше, відгук легко відкладається й забувається.",
          "Google Review Card прибирає зайві кроки. Клієнт підносить телефон, відкриває повідомлення й переходить до форми, де може самостійно поставити оцінку та написати чесний відгук.",
          "Картка не пише відгук замість людини й не впливає на оцінку. Вона допомагає не втрачати момент, коли враження ще свіже."
        ],
        "en": [
          "After a purchase or service, people often say thank you and leave. If they are asked to find the business on Google later, writing a review is easy to postpone and forget.",
          "Google Review Card removes the unnecessary steps. The customer taps the card, opens the notification and goes to the interface where they can choose a rating and write an honest review.",
          "The card does not write a review or influence the rating. It simply makes the path shorter while the experience is still fresh."
        ]
      },
      "eyebrow": {
        "uk": "ЧОМУ ЦЕ ПОТРІБНО",
        "en": "WHY IT MATTERS"
      }
    },
    "how": {
      "heading": {
        "uk": "Як працює Google Review Card",
        "en": "From a tap to the review form"
      },
      "eyebrow": {
        "uk": "ВІД ДОТИКУ ДО ФОРМИ ВІДГУКУ",
        "en": "FROM TAP TO REVIEW FORM"
      },
      "items": {
        "uk": [
          [
            "Ми налаштовуємо потрібну Google-точку",
            "Записуємо на картку посилання для конкретної локації вашого бізнесу."
          ],
          [
            "Клієнт підносить смартфон",
            "Телефон зчитує NFC й показує системне повідомлення з посиланням."
          ],
          [
            "Відкривається форма відгуку",
            "Клієнт переходить до інтерфейсу, де може вибрати оцінку й написати відгук. Google може попросити увійти в акаунт."
          ]
        ],
        "en": [
          [
            "We configure the correct Google location",
            "We write the link for the exact business location to the card."
          ],
          [
            "The customer taps the card",
            "The phone reads the NFC tag and shows a system notification."
          ],
          [
            "The review interface opens",
            "The customer can select a rating and write a review. Google may ask them to sign in first."
          ]
        ]
      },
      "note": {
        "uk": "Клієнту не потрібен окремий застосунок для відкриття посилання.",
        "en": "No separate app is required to open the link."
      }
    },
    "destination": {
      "heading": {
        "uk": "Прямий перехід до написання відгуку",
        "en": "A direct path to writing a review"
      },
      "paragraphs": {
        "uk": [
          "Ми налаштовуємо посилання так, щоб клієнт потрапляв не в загальний пошук, а до дії для потрібної Google-точки: поставити оцінку й написати відгук."
        ],
        "en": [
          "We configure the link so the customer is taken to the review action for the correct Google location rather than a generic search page."
        ]
      },
      "eyebrow": {
        "uk": "НЕ ПРОСТО СТОРІНКА БІЗНЕСУ",
        "en": "THE REVIEW ACTION"
      },
      "note": {
        "uk": "Один дотик → форма відгуку.",
        "en": "One tap → review form."
      }
    },
    "facts": {
      "heading": {
        "uk": "Помітна картка для каси, ресепшену або робочої зони",
        "en": "A visible card for a counter, reception or work area"
      },
      "eyebrow": {
        "uk": "ФОРМАТ ПРОДУКТУ",
        "en": "PRODUCT FORMAT"
      },
      "facts": {
        "uk": [
          "розмір: 10 × 10 см",
          "товщина: 3 мм",
          "готовий або індивідуальний дизайн",
          "посилання можна змінити через сумісний смартфон",
          "стандартна Google Review Card — без QR-коду",
          "у Branded Review Card QR-код можна додати за домовленістю."
        ],
        "en": [
          "size: 10 × 10 cm",
          "thickness: 3 mm",
          "ready-made or custom visual design",
          "the link can be rewritten with a compatible smartphone",
          "no QR code in the standard Google Review Card",
          "an optional QR code can be added to the Branded Review Card by agreement."
        ]
      }
    },
    "audience": {
      "heading": {
        "uk": "Для бізнесів із живим контактом із клієнтом",
        "en": "Built for businesses with real customer contact"
      },
      "paragraphs": {
        "uk": [
          "Google Review Card найкраще працює там, де після покупки або послуги є природний момент попросити людину поділитися враженням."
        ],
        "en": [
          "Google Review Card works best when there is a natural moment after a purchase or service to invite a customer to share their experience."
        ]
      },
      "eyebrow": {
        "uk": "ДЕ ЦЕ ПРАЦЮЄ НАЙКРАЩЕ",
        "en": "IN THE MOMENT"
      },
      "script": {
        "uk": "Будемо вдячні, якщо поділитеся враженнями про візит у Google. Піднесіть телефон до картки, натисніть сповіщення й залиште відгук за бажанням.",
        "en": "We would appreciate your feedback about your visit on Google. Hold your phone near the card, tap the notification and leave a review if you choose."
      },
      "examples": {
        "uk": [
          "Кафе, ресторани та кав’ярні",
          "Салони краси, барбершопи й майстри",
          "Стоматології та приватні клініки",
          "Автосервіси, детейлінг і шиномонтаж",
          "Готелі та апартаменти",
          "Фітнес- і wellness-студії",
          "Магазини, шоуруми та сервісні точки",
          "Pet-сервіси й ветеринарні клініки"
        ],
        "en": [
          "Cafés, restaurants and coffee shops",
          "Beauty salons, barbershops and specialists",
          "Dentists and private clinics",
          "Car servicing, detailing and tyre shops",
          "Hotels and apartments",
          "Fitness and wellness studios",
          "Shops, showrooms and service points",
          "Pet services and veterinary clinics"
        ]
      }
    },
    "story": {
      "heading": {
        "uk": "Ідея NFC CARD з’явилася під час поїздки до Австрії",
        "en": "The idea for NFC CARD started during a trip to Austria"
      },
      "paragraphs": {
        "uk": [
          "Я побачив заклад, де прохання про відгук було природною частиною сервісу: гість підносив телефон до NFC-картки й одразу переходив до потрібної дії в Google.",
          "Поруч працював інший бізнес із хорошим потоком клієнтів, але людям доводилося самостійно шукати його в Google. Тоді я зрозумів: бізнес часто втрачає не задоволених клієнтів, а момент, коли вони готові поділитися враженням.",
          "Так з’явилася NFC CARD — ідея зробити цей інструмент якісним, зрозумілим і доступним для бізнесів в Україні та Європі."
        ],
        "en": [
          "I saw a venue where asking for a review felt like a natural part of the service: the guest held a phone near an NFC card and moved directly to the relevant action in Google.",
          "A nearby business had a strong flow of customers, but guests had to search for it themselves. That showed me how often a business loses not a satisfied customer, but the moment when the customer is ready to share an experience.",
          "That observation became NFC CARD: a clearer, better-presented review tool for businesses in Ukraine and Europe."
        ]
      },
      "eyebrow": {
        "uk": "ЯК З’ЯВИЛАСЯ ІДЕЯ",
        "en": "HOW THE IDEA STARTED"
      }
    },
    "about": {
      "heading": {
        "uk": "NFC CARD — продукт Antonov Digital",
        "en": "NFC CARD is a product by Antonov Digital"
      },
      "paragraphs": {
        "uk": [
          "Antonov Digital — AI-native consulting and digital company, що створює для бізнесу сайти, автоматизації, AI-рішення та практичні digital-продукти.",
          "NFC CARD — окремий продукт Antonov Digital для локальних бізнесів в Україні та Європі."
        ],
        "en": [
          "Antonov Digital is an AI-native consulting and digital company that creates websites, automations, AI solutions and practical digital products for businesses.",
          "NFC CARD is a dedicated Antonov Digital product for local businesses in Ukraine and Europe."
        ]
      }
    },
    "founder": {
      "heading": {
        "uk": "Особисто відповідаю за кожне замовлення",
        "en": "Personally accountable for every order"
      },
      "paragraphs": {
        "uk": [
          "Я — Артем Антонов, засновник Antonov Digital та NFC CARD.",
          "Я веду замовлення від першого контакту до відправлення: спілкуюся з клієнтом, перевіряю Google-посилання, погоджую дизайн, контролюю готову картку й залишаюся на зв’язку, якщо виникають питання.",
          "Для мене важливо, щоб клієнт отримав не безіменну NFC-заготовку, а зрозумілий продукт, який професійно виглядає й виконує свою задачу в реальному бізнесі."
        ],
        "en": [
          "I’m Artem Antonov, founder of Antonov Digital and NFC CARD.",
          "I oversee the journey from first contact to dispatch: customer communication, Google-link verification, design approval, review of the finished card and support when questions arise."
        ]
      },
      "cta": {
        "uk": "Написати Артему в Telegram",
        "en": "Message Artem on Telegram"
      }
    },
    "process": {
      "heading": {
        "uk": "Як проходить замовлення",
        "en": "From request to finished card"
      },
      "eyebrow": {
        "uk": "ВІД ЗАЯВКИ ДО ГОТОВОЇ КАРТКИ",
        "en": "FROM REQUEST TO CARD"
      },
      "items": {
        "uk": [
          [
            "Обираєте варіант і кількість",
            "Залишаєте ім’я, номер телефону та зручний месенджер."
          ],
          [
            "Ми зв’язуємося з вами",
            "Уточнюємо потрібне посилання — для Google-відгуків або Instagram-профілю — та дані для доставки. Для Branded Review Card готуємо перший макет безкоштовно."
          ],
          [
            "Погоджуємо деталі",
            "Після погодження ви вносите передоплату 200 грн. Вона входить у загальну вартість."
          ],
          [
            "Готуємо картку",
            "Орієнтовний строк — до 5 робочих днів після погодження."
          ],
          [
            "Відправляємо",
            "По Україні — Новою поштою за наш рахунок. Залишок сплачується після відправлення й отримання ТТН."
          ]
        ],
        "en": [
          [
            "Choose the version and quantity.",
            ""
          ],
          [
            "We confirm the link for Google reviews or your Instagram profile, along with delivery details. For Branded Review Card, we prepare the first mockup free of charge.",
            ""
          ],
          [
            "After approval, you pay a UAH 200 deposit, included in the total.",
            ""
          ],
          [
            "We prepare the card, normally within five business days after approval.",
            ""
          ],
          [
            "We dispatch it. Within Ukraine, standard Nova Poshta delivery is free, and the remaining balance is paid after dispatch and receipt of the tracking number.",
            ""
          ]
        ]
      }
    },
    "payment": {
      "heading": {
        "uk": "Оплата й доставка",
        "en": "Payment and delivery"
      },
      "items": {
        "uk": [
          [
            "передоплата — 200 грн;",
            ""
          ],
          [
            "передоплата входить у загальну вартість;",
            ""
          ],
          [
            "залишок — після відправлення та отримання ТТН;",
            ""
          ],
          [
            "оплата банківським переказом;",
            ""
          ],
          [
            "USDT — за попереднім погодженням;",
            ""
          ],
          [
            "доставка Новою поштою по Україні — безкоштовно;",
            ""
          ],
          [
            "доставка до Європи — за рахунок замовника, вартість погоджується заздалегідь;",
            ""
          ],
          [
            "самовивіз — за домовленістю.",
            ""
          ]
        ],
        "en": [
          [
            "deposit: UAH 200;",
            ""
          ],
          [
            "deposit included in total price;",
            ""
          ],
          [
            "remaining balance after dispatch and tracking number;",
            ""
          ],
          [
            "bank transfer;",
            ""
          ],
          [
            "USDT by prior agreement;",
            ""
          ],
          [
            "standard Nova Poshta delivery within Ukraine is free;",
            ""
          ],
          [
            "European delivery is paid by the customer and agreed in advance;",
            ""
          ],
          [
            "pickup by agreement.",
            ""
          ]
        ]
      },
      "cta": {
        "uk": "Детальніше про оплату й доставку",
        "en": "More about payment and delivery"
      }
    },
    "bulk": {
      "heading": {
        "uk": "Замовлення від трьох карток",
        "en": "Orders of three or more cards"
      },
      "body": {
        "uk": "Потрібно більше двох карток або різні посилання для кількох філій? Розрахуємо замовлення індивідуально.",
        "en": "Need more than two cards or separate links for several branches? We will prepare an individual quote."
      },
      "cta": {
        "uk": "Отримати розрахунок",
        "en": "Request a quote"
      }
    },
    "included": {
      "heading": {
        "uk": "Що входить у ваше замовлення",
        "en": "What is included in your order"
      },
      "body": {
        "uk": "Ви отримуєте картку, налаштовану під конкретну Google-точку, перевірку та зрозумілу інструкцію для команди. Обов’язкової щомісячної підписки немає.",
        "en": "You receive a card set up for a specific Google location, testing and clear instructions for your team. There is no required monthly subscription."
      },
      "standard": {
        "uk": [
          "Google Review Card у готовому дизайні",
          "Налаштування на точну Google-точку вашого бізнесу",
          "Перевірка NFC та правильності посилання",
          "Коротка інструкція й сценарій для персоналу",
          "Підтримка після отримання",
          "Стандартна доставка Новою поштою по Україні"
        ],
        "en": [
          "Google Review Card in a ready-made design",
          "Setup for the exact Google location of your business",
          "NFC and destination-link testing",
          "Brief instructions and a staff script",
          "Support after delivery",
          "Standard Nova Poshta delivery within Ukraine"
        ]
      },
      "branded": {
        "uk": [
          "Усе зі стандартного варіанта, з індивідуальним дизайном замість готового",
          "Перший персональний макет безкоштовно й без зобов’язань",
          "Логотип, кольори, текст і погоджений заклик до дії",
          "Погодження дизайну до виготовлення",
          "QR-код за бажанням",
          "Фото готової картки перед відправленням"
        ],
        "en": [
          "Everything in the standard option, with a custom design instead of a ready-made one",
          "A free first personal mockup with no obligation",
          "Your logo, colours, copy and an agreed call to action",
          "Design approval before production",
          "Optional QR code",
          "A photo of the finished card before dispatch"
        ]
      },
      "items": {
        "uk": [
          [
            "Точна Google-точка",
            "Налаштування й перевірка потрібного посилання."
          ],
          [
            "Зрозумілий початок",
            "Коротка інструкція, сценарій для персоналу й підтримка після отримання."
          ],
          [
            "Доставка включена",
            "Стандартна доставка Новою поштою по Україні входить у ціну."
          ],
          [
            "Для брендованої картки",
            "Безкоштовний перший макет, погодження дизайну та фото готової картки. QR-код — за бажанням."
          ]
        ],
        "en": [
          [
            "The exact Google location",
            "Setup and testing of the correct destination link."
          ],
          [
            "A clear start",
            "Brief instructions, a staff script and support after delivery."
          ],
          [
            "Delivery included",
            "Standard Nova Poshta delivery within Ukraine is included in the price."
          ],
          [
            "For the branded card",
            "A free first mockup, design approval and a photo of the finished card. A QR code is optional."
          ]
        ]
      }
    },
    "compatibility": {
      "heading": {
        "uk": "Працює з вашим смартфоном",
        "en": "Works with your smartphone"
      },
      "body": {
        "uk": "Працює на більшості сучасних смартфонів iPhone та Android із підтримкою NFC. На окремих Android-пристроях NFC потрібно ввімкнути в налаштуваннях, а зона зчитування залежить від моделі телефона.",
        "en": "It works on most modern NFC-enabled iPhone and Android devices. NFC may need to be enabled on some Android phones, and the reading area varies by model."
      }
    },
    "quality": {
      "heading": {
        "uk": "Перевіряємо картку до відправлення",
        "en": "We check the card before dispatch"
      },
      "body": {
        "uk": "Важлива не лише NFC-функція: посилання має відкривати потрібну форму Google-відгуку, Instagram-профіль або онлайн-меню — залежно від картки; сама картка має виглядати охайно, а персонал — розуміти, як нею користуватися.",
        "en": "The NFC function is only part of the product: the link should open the intended Google review form, Instagram profile or online menu, depending on the card; the card should look neat, and your team should understand how to use it."
      },
      "items": {
        "uk": [
          [
            "Правильне посилання",
            "Перевіряємо NFC та сторінку конкретного бізнесу."
          ],
          [
            "Погоджений вигляд",
            "Для брендованої картки звіряємо готовий результат із погодженим дизайном та надсилаємо фото."
          ],
          [
            "Огляд і пакування",
            "Оглядаємо картку на видимі дефекти перед пакуванням."
          ],
          [
            "Зрозуміле використання",
            "Додаємо коротку інструкцію та допомагаємо з першими запитаннями."
          ]
        ],
        "en": [
          [
            "The right link",
            "We check NFC and the page for the specific business."
          ],
          [
            "The agreed appearance",
            "For the branded card, we compare the finished result with the approved design and send a photo."
          ],
          [
            "Inspection and packaging",
            "We inspect the card for visible defects before packaging."
          ],
          [
            "Clear use",
            "We include brief instructions and help with initial questions."
          ]
        ]
      },
      "note": {
        "uk": "Не згинайте, не проколюйте й не занурюйте картку у воду.",
        "en": "Do not bend, puncture or submerge the card in water."
      }
    },
    "support": {
      "heading": {
        "uk": "Якщо NFC не зчитується",
        "en": "If NFC does not read"
      },
      "body": {
        "uk": "Спочатку перевіримо модель телефона, налаштування NFC, правильну зону дотику та записане посилання. Якщо підтвердиться технічний дефект, який неможливо вирішити дистанційно, погодимо безкоштовну заміну або повернення коштів.",
        "en": "We first check phone compatibility, NFC settings, tap position and the stored link. If a technical defect is confirmed and cannot be solved remotely, we agree a free replacement or refund."
      }
    },
    "rewrite": {
      "heading": {
        "uk": "Посилання можна змінити",
        "en": "The link can be changed"
      },
      "body": {
        "uk": "Посилання на сумісній NFC-картці можна переписати зі смартфона. За потреби ми підкажемо порядок дій.",
        "en": "The stored link can be rewritten from a compatible smartphone. We can explain the process when needed."
      }
    }
  },
  "faqs": [
    {
      "id": "compatibility",
      "question": {
        "uk": "Чи працює картка на iPhone та Android?",
        "en": "Does it work on iPhone and Android?"
      },
      "answer": {
        "uk": "Працює на більшості сучасних смартфонів iPhone та Android із підтримкою NFC. На окремих Android-пристроях NFC потрібно ввімкнути в налаштуваннях, а зона зчитування залежить від моделі телефона.",
        "en": "It works on most modern NFC-enabled iPhone and Android devices. NFC may need to be enabled on some Android phones, and the reading area varies by model."
      }
    },
    {
      "id": "app",
      "question": {
        "uk": "Чи потрібен клієнту застосунок?",
        "en": "Does the customer need an app?"
      },
      "answer": {
        "uk": "Ні. Для відкриття посилання окремий застосунок не потрібен.",
        "en": "No separate app is required to open the link."
      }
    },
    {
      "id": "destination",
      "question": {
        "uk": "Куди саме переходить клієнт?",
        "en": "Where does the customer go?"
      },
      "answer": {
        "uk": "Залежить від картки. Google Review Card і Branded Review Card відкривають форму Google-відгуку конкретної локації. NFC Instagram Card відкриває Instagram-профіль вашого бізнесу. Після переходу клієнт сам обирає наступну дію. Google може попросити увійти в акаунт.",
        "en": "It depends on the card. Google Review Card and Branded Review Card open the Google review form for a specific location. NFC Instagram Card opens your business’s Instagram profile. After the link opens, the customer chooses what to do next. Google may ask them to sign in."
      }
    },
    {
      "id": "change-link",
      "question": {
        "uk": "Чи можна змінити посилання після покупки?",
        "en": "Can the link be changed later?"
      },
      "answer": {
        "uk": "Так. Посилання на сумісній NFC-картці можна переписати зі смартфона. За потреби ми підкажемо порядок дій.",
        "en": "Yes. The stored link can be rewritten from a compatible smartphone. We can explain the process when needed."
      }
    },
    {
      "id": "subscription",
      "question": {
        "uk": "Чи є щомісячна плата?",
        "en": "Is there a monthly fee?"
      },
      "answer": {
        "uk": "Обов’язкової щомісячної плати за використання Google Review Card, Branded Review Card або NFC Instagram Card немає.",
        "en": "There is no mandatory monthly fee to use Google Review Card, Branded Review Card or NFC Instagram Card."
      }
    },
    {
      "id": "qr",
      "question": {
        "uk": "Чи є QR-код?",
        "en": "Is a QR code included?"
      },
      "answer": {
        "uk": "У стандартній Google Review Card QR-коду немає. Для Branded Review Card його можна додати за домовленістю.",
        "en": "Not in the standard Google Review Card. It can be added to a Branded Review Card by agreement."
      }
    },
    {
      "id": "dimensions",
      "question": {
        "uk": "Який розмір картки?",
        "en": "What are the dimensions?"
      },
      "answer": {
        "uk": "10 × 10 см, товщина 3 мм.",
        "en": "10 × 10 cm and 3 mm thick."
      }
    },
    {
      "id": "lead-time",
      "question": {
        "uk": "Скільки триває замовлення?",
        "en": "How long does an order take?"
      },
      "answer": {
        "uk": "Орієнтовно до п’яти робочих днів після погодження деталей або брендованого макета.",
        "en": "Normally up to five business days after the details or branded mockup are approved."
      }
    },
    {
      "id": "deposit",
      "question": {
        "uk": "Яка передоплата?",
        "en": "What is the deposit?"
      },
      "answer": {
        "uk": "200 грн. Вона входить у загальну вартість.",
        "en": "UAH 200. It is included in the total price."
      }
    },
    {
      "id": "delivery",
      "question": {
        "uk": "Скільки коштує доставка по Україні?",
        "en": "How much is delivery within Ukraine?"
      },
      "answer": {
        "uk": "Стандартну доставку Новою поштою по Україні оплачуємо ми.",
        "en": "We pay for standard Nova Poshta delivery within Ukraine."
      }
    },
    {
      "id": "europe",
      "question": {
        "uk": "Чи відправляєте до Європи?",
        "en": "Do you deliver to Europe?"
      },
      "answer": {
        "uk": "Так. Вартість і перевізника погоджуємо окремо; доставку оплачує замовник.",
        "en": "Yes. We agree the carrier and price separately; the customer pays for delivery."
      }
    },
    {
      "id": "support",
      "question": {
        "uk": "Що робити, якщо NFC не зчитується?",
        "en": "What if NFC does not read?"
      },
      "answer": {
        "uk": "Спочатку перевіримо модель телефона, налаштування NFC, правильну зону дотику та записане посилання. Якщо підтвердиться технічний дефект, який неможливо вирішити дистанційно, погодимо безкоштовну заміну або повернення коштів.",
        "en": "We first check phone compatibility, NFC settings, tap position and the stored link. If a technical defect is confirmed and cannot be solved remotely, we agree a free replacement or refund."
      }
    },
    {
      "id": "bulk",
      "question": {
        "uk": "Як замовити більше двох карток або картки для філій?",
        "en": "How do I order more than two cards or cards for branches?"
      },
      "answer": {
        "uk": "Залиште заявку на індивідуальний розрахунок. Для різних філій кожну картку можна налаштувати на окрему Google-точку.",
        "en": "Request an individual quote. Each card can be configured for a separate Google location."
      }
    }
  ],
  "mediaPlan": [],
  "caseTemplate": {
    "enabled": false,
    "public": false,
    "businessName": null,
    "city": null,
    "variant": null,
    "task": null,
    "image": null,
    "quote": null,
    "permission": null,
    "evidence": null,
    "required": [
      "businessName",
      "city",
      "variant",
      "task",
      "realPhoto",
      "customerQuote",
      "publicationPermission",
      "verifiableClaims"
    ]
  }
};

const leadTime = verified => verified
  ? pair('Орієнтовно до п’яти робочих днів після погодження', 'Normally up to five business days after approval')
  : pair('Точний строк підтверджуємо до передоплати', 'We confirm the exact lead time before the deposit');

function substitute(value, timing, locale = 'uk') {
  if (typeof value === 'string') return value.replaceAll('{lead_time}', timing[locale]);
  if (Array.isArray(value)) return value.map(item => substitute(item, timing, locale));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, substitute(item, timing, key === 'uk' || key === 'en' || key === 'pl' ? key : locale)]));
  }
  return value;
}

export function resolveContent(overrides = {}) {
  const activeFlags = { ...flags, ...overrides };
  for (const [key, value] of Object.entries(activeFlags)) {
    if (key !== 'source' && typeof value !== 'boolean') throw new TypeError('Verification flag must be boolean: ' + key);
  }
  const timing = leadTime(activeFlags.lead_time_5_days_confirmed);
  const result = substitute(structuredClone(source), timing);
  // v23 adds Menu as a separate fourth offer while preserving the source-backed
  // Review and Instagram product copy. Only shared copy is widened here.
  result.config.seo.homeTitle = pair('NFC-картки: Google-відгуки, Instagram та меню | NFC CARD','NFC Cards for Google Reviews, Instagram & Menus | NFC CARD');
  result.config.seo.homeDescription = pair('Готові NFC-картки для Google-відгуків, Instagram та онлайн-меню. Налаштування потрібного посилання, оптові ціни Menu Card та доставка по Україні.','Ready-to-use NFC cards for Google reviews, Instagram and online menus. Link setup, Menu Card volume pricing and delivery within Ukraine.');
  result.copy.process.items.uk[1][1] = 'Уточнюємо посилання для обраної картки — Google-відгук, Instagram-профіль або онлайн-меню — та дані доставки. Якщо меню ще немає, обговоримо його розробку окремо. Для Branded Review Card готуємо перший макет безкоштовно.';
  result.copy.process.items.en[1][0] = 'We confirm the link for the chosen card — a Google review form, an Instagram profile or an online menu — and delivery details. If there is no menu yet, we discuss its development separately. For Branded Review Card, we prepare the first mockup free of charge.';
  result.copy.process.items.uk[3][1] = 'Для стандартної Google Review Card та Instagram Card орієнтовний строк — до 5 робочих днів після погодження. Строк виготовлення NFC Review Card 3D погоджуємо окремо до передоплати. Строк підготовки Menu Card підтвердимо під час узгодження.';
  result.copy.process.items.en[3][0] = 'For standard Review and Instagram cards, preparation is normally within five business days after approval. We agree the NFC Review Card 3D production timeline separately before the deposit. We confirm Menu Card preparation time when agreeing the order.';
  result.copy.bulk.heading = pair('Більше Google Review Card для бізнесу','More Review Cards for your business');
  result.copy.bulk.body = pair('Для стандартної Google Review Card і Branded Review Card від трьох штук підготуємо індивідуальний розрахунок. NFC Review Card 3D коштує 4 000 грн за кожну картку без знижки. Для Menu Card діє окрема оптова сітка.','Standard Google Review Card and Branded Review Card orders of three or more receive an individual quote. NFC Review Card 3D costs UAH 4,000 per card without a quantity discount. Menu Card has its own volume pricing.');
  const faqAnswers={
    destination:pair('Залежить від картки. Google Review Card, Branded Review Card і NFC Review Card 3D відкривають форму Google-відгуку конкретної локації. NFC Instagram Card відкриває Instagram-профіль, а NFC Menu Card — онлайн-меню закладу. Це окремі продукти; подальшу дію клієнт обирає сам.','It depends on the card. Google Review Card, Branded Review Card and NFC Review Card 3D open the Google review form for a specific location. NFC Instagram Card opens the Instagram profile, and NFC Menu Card opens the venue’s online menu. These are separate products; the customer chooses the next action.'),
    dimensions:pair('Google Review Card та NFC Instagram Card — 10 × 10 см, товщина 3 мм. Menu Card — квадрат 10 × 10 або 6 × 6 см чи круг діаметром 7 см; товщина приблизно 3–4 мм. Точне виконання обирайте на сторінці товару.','Google Review Card and NFC Instagram Card are 10 × 10 cm and 3 mm thick. Menu Card comes as a 10 × 10 or 6 × 6 cm square or a 7 cm diameter circle, approximately 3–4 mm thick. Choose the format on the product page.'),
    qr:pair('Стандартна Google Review Card, NFC Instagram Card і NFC Menu Card у цих пропозиціях не мають QR-коду. Персональний дизайн доступний для Branded Review Card, Branded Beauty Review Card Mini та Branded Restaurant Review Card Mini. QR-код для Branded Review Card можна погодити окремо. Instagram і Menu доступні у готових дизайнах.','The standard Google Review Card, NFC Instagram Card and NFC Menu Card in these offers do not have QR codes. Custom design is available for Branded Review Card, Branded Beauty Review Card Mini and Branded Restaurant Review Card Mini. A QR code for Branded Review Card can be agreed separately. Instagram and Menu cards use ready-made designs.'),
    subscription:pair('Обов’язкової щомісячної плати за використання самих NFC-карток немає. Якщо потрібна розробка онлайн-меню, деталі обговорюємо на консультації.','There is no mandatory monthly fee for using the physical NFC cards themselves. If online-menu development is needed, we discuss the details in a consultation.'),
    bulk:pair('Для Google Review Card і Branded Review Card від трьох штук — індивідуальний розрахунок. NFC Review Card 3D коштує 4 000 грн за кожну картку без знижки; передоплата 200 грн — один раз за замовлення та входить у суму. NFC Instagram Card у поточній пропозиції замовляється по одній або дві. Для Menu Card діє оптова сітка від 5, 10 і 25 штук; різні її виконання можна поєднувати. Оберіть потрібний товар у каталозі.','Google Review Card and Branded Review Card orders of three or more are quoted individually. NFC Review Card 3D costs UAH 4,000 per card without a quantity discount; the UAH 200 deposit is paid once per order and included in the total. The current NFC Instagram Card offer supports one or two cards. Menu Card has volume tiers at 5, 10 and 25 cards; its formats can be mixed. Choose the product in the catalog.'),
    'change-link':pair('Для Google Review Card та Instagram Card посилання можна переписати зі сумісного смартфона. Якщо адреса онлайн-меню зміниться, зверніться до нас, щоб уточнити налаштування Menu Card.','For Review and Instagram cards, the link can be rewritten from a compatible smartphone. If your online-menu address changes, contact us to clarify Menu Card setup.'),
    'lead-time':pair('Для стандартної Google Review Card та Instagram Card орієнтовно до п’яти робочих днів після погодження деталей. Строк виготовлення NFC Review Card 3D погоджуємо окремо до передоплати; строк підготовки Menu Card підтвердимо під час узгодження замовлення.','The standard Google Review Card and Instagram Card are normally prepared within five business days after approval. We agree the NFC Review Card 3D production timeline separately before the deposit and confirm Menu Card preparation time when agreeing the order.')
  };
  for(const faq of result.faqs)if(faqAnswers[faq.id])faq.answer=faqAnswers[faq.id];
  const bulkFaq=result.faqs.find(f=>f.id==='bulk');
  if(bulkFaq)bulkFaq.question=pair('Як замовити більше карток?','How can I order more cards?');
  result.flags = activeFlags;
  result.leadTime = timing;
  result.config.production.duration.value = timing;
  // Renderer/API field names map to the same source-backed labels and errors.
  result.fields.variant = result.fields.product;
  result.fields.business = result.fields.businessName;
  result.fields.maps = result.fields.googleMaps;
  result.fields.mapsHint = result.fields.googleMapsHint;
  result.errors.variant = result.errors.product;
  result.errors.maps = result.errors.googleMaps;
  for (const variant of result.variants) variant.prices = structuredClone(commerce.variants[variant.id].prices);
  if (!activeFlags.link_rewrite_verified) {
    result.copy.rewrite = null;
    result.faqs = result.faqs.filter(f => f.id !== 'change-link');
    result.copy.facts.facts.uk = result.copy.facts.facts.uk.filter(s => !s.includes('посилання можна'));
    result.copy.facts.facts.en = result.copy.facts.facts.en.filter(s => !s.includes('rewritten'));
  }
  if (!activeFlags.lead_time_5_days_confirmed) {
    result.copy.process.items.uk[3][1] = timing.uk;
    result.copy.process.items.en[3][0] = timing.en;
    result.faqs.find(f => f.id === 'lead-time').answer = timing;
  }
  // Polish copy is a reviewed, explicit third locale. Missing entries fail closed
  // instead of silently rendering Ukrainian or English on public Polish pages.
  const faqIndex = new Map(source.faqs.map((faq, index) => [faq.id, index]));
  const localize = (value, path = '') => {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) {
      value.forEach((item, index) => localize(item, path + '/' + (path === '/faqs' ? faqIndex.get(item.id) : index)));
      return;
    }
    if (Object.hasOwn(value, 'uk') && Object.hasOwn(value, 'en')) {
      if (!Object.hasOwn(polishCopy, path)) throw new Error('Missing Polish source copy: ' + path);
      value.pl = structuredClone(polishCopy[path]);
      if (path === '/copy/facts/facts' && !activeFlags.link_rewrite_verified) value.pl.splice(3, 1);
      if (!activeFlags.lead_time_5_days_confirmed) {
        if (path === '/leadTime' || path === '/config/production/duration/value' || path === '/faqs/7/answer') value.pl = 'Dokładny czas przygotowania potwierdzimy przed wpłatą zaliczki';
        if (path === '/copy/process/items') value.pl[3][1] = 'Dokładny czas przygotowania potwierdzimy przed wpłatą zaliczki';
      }
      return;
    }
    for (const [key, item] of Object.entries(value)) localize(item, path + '/' + key);
  };
  localize(result);
  // Flags alone cannot manufacture a permissioned real case or missing media.
  result.caseTemplate.enabled = false;
  result.caseTemplate.public = false;
  return freeze(result);
}

const resolved = resolveContent();
export const config = resolved.config;
export const ui = resolved.ui;
export const fields = resolved.fields;
export const errors = resolved.errors;
export const variants = resolved.variants;
export const copy = resolved.copy;
export const faqs = resolved.faqs;
export const mediaPlan = resolved.mediaPlan;
export const caseTemplate = resolved.caseTemplate;

export function validateModel(model = resolved) {
  validateInstagramContent({instagram,instagramGlobalFAQs,instagramProductFAQs});
  if (model.variants.length !== 2 || model.variants.map(v => v.id).join(',') !== 'standard,branded') throw new Error('Expected two variants of one card');
  const expected = { standard: { '1': 1500, '2': 2600 }, branded: { '1': 2000, '2': 3600 } };
  for (const variant of model.variants) {
    if (JSON.stringify(variant.prices) !== JSON.stringify(expected[variant.id])) throw new Error('Canonical price mismatch');
    if (!variant.provenance || !variant.name || !variant.slot) throw new Error('Missing variant evidence');
  }
  if (commerce.deposit !== 200 || commerce.depositIncluded !== true || commerce.currency !== 'UAH') throw new Error('Commercial contract mismatch');
  if (model.variants[0].qr !== 'not_included' || model.variants[1].qr !== 'optional') throw new Error('QR variant mismatch');
  const walk = (value, path = 'content') => {
    if (value === undefined) throw new Error('Undefined content: ' + path);
    if (value && typeof value === 'object') {
      if ('uk' in value || 'en' in value || 'pl' in value) {
        if (!('uk' in value) || !('en' in value) || !('pl' in value) || value.uk === '' || value.en === '' || value.pl === '') throw new Error('Missing translation: ' + path);
        if (/[\u0400-\u04ff]/u.test(JSON.stringify(value.en))) throw new Error('Cyrillic in English: ' + path);
        if (/[\u0400-\u04ff]/u.test(JSON.stringify(value.pl))) throw new Error('Cyrillic in Polish: ' + path);
      }
      for (const [key, child] of Object.entries(value)) walk(child, path + '.' + key);
    }
  };
  walk(model);
  const values = value => typeof value === 'string' ? [value] : value && typeof value === 'object' ? Object.values(value).flatMap(values) : [];
  const prose = values({ variants: model.variants, copy: model.copy, faqs: model.faqs }).join('\n');
  if (prose.includes('{lead_time}')) throw new Error('Unresolved content token');
  if (!model.flags.link_rewrite_verified && (model.copy.rewrite !== null || /перезапис|rewrit/iu.test(prose))) throw new Error('Unverified link-change claim');
  if (!model.flags.lead_time_5_days_confirmed && /п[’']яти робоч|five business days|5 business days/iu.test(prose)) throw new Error('Unverified lead-time claim');
  if (!model.flags.card_material_dimensions_confirmed && /пластик|plastic/iu.test(prose)) throw new Error('Unverified material claim');
  if (model.caseTemplate.public || model.caseTemplate.enabled) throw new Error('Unverified case');
  if (new Set(model.config.events).size !== analyticsEvents.length) throw new Error('Analytics contract mismatch');
  for (const [kind, contact] of Object.entries(model.config.contacts)) {
    if (contact.status !== 'confirmed' || !contact.evidence || !contact.href) throw new Error('Unconfirmed contact');
    if (['phone', 'whatsapp', 'viber'].includes(kind) && !/^\+[0-9]{7,15}$/.test(contact.value)) throw new Error('Invalid contact phone');
    if (kind === 'telegram' && contact.href !== 'https://t.me/TijGabumG') throw new Error('Unexpected Telegram');
    if (kind === 'instagram' && contact.href !== 'https://www.instagram.com/antonovdigital/') throw new Error('Unexpected Instagram');
  }
  return true;
}
