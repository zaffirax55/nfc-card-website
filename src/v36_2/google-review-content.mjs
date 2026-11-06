/* NFC-SEO-CONTENT-01: supplied ChatGPT copy, local candidate; no publication approval. */
const content={
  "uk": {
    "/collections/google-review/": {
      "title": "NFC-картки для відгуків Google | Antonov Digital NFC Card",
      "description": "Оберіть NFC-картку для переходу до форми відгуку вашої Google-локації. Готові формати, власний дизайн і налаштування посилання для бізнесу в Україні.",
      "h1": "NFC-картки для відгуків Google",
      "eyebrow": "Antonov Digital NFC Card",
      "intro": "NFC-картка допомагає клієнту відкрити форму відгуку потрібної Google-локації без ручного пошуку. Порівняйте готові формати або перейдіть до запиту власного дизайну.",
      "after_grid_section": {
        "heading": "Як обрати картку для Google-відгуків",
        "paragraphs": [
          [
            {
              "text": "Для готового рішення перегляньте "
            },
            {
              "text": "Google Review Card",
              "href": "/solutions/review-card/"
            },
            {
              "text": ". Потрібні логотип і кольори вашого бізнесу? Залиште "
            },
            {
              "text": "запит власного дизайну Google-картки",
              "href": "/services/design/?entry=branded-review-card"
            },
            {
              "text": "; виготовлення погоджується окремо."
            }
          ],
          [
            {
              "text": "Клієнт підносить NFC-сумісний смартфон до картки й відкриває запропоноване посилання. Для роботи потрібен інтернет; Google може попросити увійти в обліковий запис. Оцінку, текст і публікацію відгуку обирає сам клієнт."
            }
          ],
          [
            {
              "text": "Докладніше про налаштування та використання — на сторінці "
            },
            {
              "text": "«Як працює NFC-картка»",
              "href": "/what-is-nfc-card/"
            },
            {
              "text": "."
            }
          ]
        ]
      }
    },
    "/solutions/review-card/": {
      "title": "Google Review Card — NFC-картка для відгуків | Antonov Digital NFC Card",
      "description": "Google Review Card відкриває форму відгуку потрібної Google-локації. Перегляньте формат, комплектацію, налаштування та умови замовлення в Україні.",
      "h1": "Google Review Card — NFC-картка для відгуків Google",
      "intro": "Фізична NFC-картка з готовим дизайном для переходу до форми відгуку вашої Google-локації. Клієнт відкриває посилання зі смартфона та сам обирає оцінку й текст відгуку.",
      "related_link": {
        "text": "Порівняти NFC-картки для Google-відгуків",
        "href": "/collections/google-review/"
      }
    }
  },
  "en": {
    "/collections/google-review/": {
      "title": "Google review NFC cards | Antonov Digital NFC Card",
      "description": "Choose a physical NFC card that opens your Google location’s review form. Compare ready-made formats or request a custom design for your business in Ukraine.",
      "h1": "NFC cards for Google reviews",
      "eyebrow": "Antonov Digital NFC Card",
      "intro": "An NFC card helps customers open the review form for the correct Google location without searching for your business manually. Compare ready-made formats or request your own design.",
      "after_grid_section": {
        "heading": "Choose a card for Google reviews",
        "paragraphs": [
          [
            {
              "text": "For a ready-made option, see "
            },
            {
              "text": "Google Review Card",
              "href": "/solutions/review-card/"
            },
            {
              "text": ". Need your business logo and colours? Submit a "
            },
            {
              "text": "custom Google card design enquiry",
              "href": "/services/design/?entry=branded-review-card"
            },
            {
              "text": "; physical production is agreed separately."
            }
          ],
          [
            {
              "text": "The customer brings an NFC-compatible smartphone close to the card and opens the link offered by the phone. An internet connection is required, and Google may ask the customer to sign in. The customer chooses the rating, writes the review and decides whether to publish it."
            }
          ],
          [
            {
              "text": "Read "
            },
            {
              "text": "how an NFC card works",
              "href": "/what-is-nfc-card/"
            },
            {
              "text": " for more about setup and use."
            }
          ]
        ]
      }
    },
    "/solutions/review-card/": {
      "title": "Google Review Card — NFC review card | Antonov Digital NFC Card",
      "description": "Google Review Card opens the review form for the correct Google location. See the format, included setup and ordering information for businesses in Ukraine.",
      "h1": "Google Review Card: NFC card for Google reviews",
      "intro": "A physical NFC card with a ready-made design that links to your Google location’s review form. The customer opens the link on their phone and chooses the rating and review text.",
      "related_link": {
        "text": "Compare NFC cards for Google reviews",
        "href": "/collections/google-review/"
      }
    }
  }
};
// Logical routes only; callers resolve links with the existing locale/base helper.
export const googleReviewContent=(locale,route)=>content[locale]?.[route]??null;
