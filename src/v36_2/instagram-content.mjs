/* NFC-SEO-CONTENT-02: supplied ChatGPT copy, local candidate; no publication approval. */
const content={
  "uk": {
    "/collections/instagram/": {
      "title": "NFC-картки для переходу в Instagram | Antonov Digital NFC Card",
      "description": "Перегляньте готову NFC-картку для переходу до Instagram-профілю та інструкцію з використання. Для бізнесу в Україні, без автоматичної підписки.",
      "h1": "NFC-картки для переходу в Instagram",
      "eyebrow": "Antonov Digital NFC Card",
      "intro": "Фізична NFC-картка допомагає клієнту відкрити ваш Instagram-профіль без ручного пошуку. Перегляньте готовий варіант і дізнайтеся, як відбувається перехід.",
      "after_grid_section": {
        "heading": "Перехід до профілю — не автоматична підписка",
        "paragraphs": [
          [
            {
              "text": "Перегляньте "
            },
            {
              "text": "NFC-картку для Instagram",
              "href": "/solutions/instagram-card/"
            },
            {
              "text": ", щоб ознайомитися з форматом, налаштуванням і умовами замовлення."
            }
          ],
          [
            {
              "text": "Клієнт підносить NFC-сумісний смартфон до картки та відкриває запропоноване посилання. Рішення підписатися на профіль він приймає сам. Докладніше — "
            },
            {
              "text": "як працює Instagram-картка",
              "href": "/instagram-card/"
            },
            {
              "text": "."
            }
          ]
        ]
      }
    },
    "/solutions/instagram-card/": {
      "title": "NFC-картка для Instagram | Antonov Digital NFC Card",
      "description": "Готова NFC-картка відкриває ваш профіль Instagram на смартфоні клієнта. Перегляньте формат, налаштування та умови замовлення в Україні.",
      "h1": "NFC-картка для Instagram",
      "intro": "Готова фізична NFC-картка для переходу до вашого профілю Instagram. Клієнт підносить NFC-сумісний смартфон, відкриває посилання та сам вирішує, чи підписуватися.",
      "related_links": [
        {
          "text": "Як працює Instagram-картка",
          "href": "/instagram-card/"
        },
        {
          "text": "Переглянути напрям NFC-карток для Instagram",
          "href": "/collections/instagram/"
        }
      ]
    }
  },
  "en": {
    "/collections/instagram/": {
      "title": "NFC cards for Instagram profiles | Antonov Digital NFC Card",
      "description": "Explore a ready-made NFC card that links to an Instagram profile and learn how to use it. For businesses in Ukraine, with no automatic following.",
      "h1": "NFC cards for Instagram profiles",
      "eyebrow": "Antonov Digital NFC Card",
      "intro": "A physical NFC card helps customers open your Instagram profile without searching manually. Explore the ready-made option and see how the link works.",
      "after_grid_section": {
        "heading": "Open a profile without automatic following",
        "paragraphs": [
          [
            {
              "text": "See the "
            },
            {
              "text": "Instagram NFC card",
              "href": "/solutions/instagram-card/"
            },
            {
              "text": " for its format, setup and ordering information."
            }
          ],
          [
            {
              "text": "The customer brings an NFC-compatible smartphone close to the card and opens the link offered by the phone. They decide whether to follow the profile. Read "
            },
            {
              "text": "how the Instagram card works",
              "href": "/instagram-card/"
            },
            {
              "text": " for more details."
            }
          ]
        ]
      }
    },
    "/solutions/instagram-card/": {
      "title": "Instagram NFC card | Antonov Digital NFC Card",
      "description": "A ready-made NFC card opens your Instagram profile on the customer’s smartphone. See the format, setup and ordering information for businesses in Ukraine.",
      "h1": "NFC card for Instagram",
      "intro": "A ready-made physical NFC card that links to your Instagram profile. The customer brings an NFC-compatible smartphone close to the card, opens the link and decides whether to follow.",
      "related_links": [
        {
          "text": "How the Instagram card works",
          "href": "/instagram-card/"
        },
        {
          "text": "Explore NFC cards for Instagram profiles",
          "href": "/collections/instagram/"
        }
      ]
    }
  }
};
// Logical routes only; callers resolve links with the existing locale/base helper.
export const instagramContent=(locale,route)=>content[locale]?.[route]??null;
