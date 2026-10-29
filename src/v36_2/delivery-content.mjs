/** Owner-provided v36.2 delivery copy, matched to unchanged current commerce contracts. */
const freeze=value=>{if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;};
export const deliveryContent=freeze({
  "uk": {
    "title": "Доставка й оплата",
    "intro": [
      "У NFC CARD ви спочатку обираєте картки або залишаєте запит на персональний дизайн. Ми уточнюємо деталі, погоджуємо вартість, строки й доставку, і лише після цього підтверджуємо фізичне замовлення. **На сайті немає онлайн-оплати: кошик надсилає заявку, а не списує кошти.**"
    ],
    "sections": [
      {
        "id": "ordering",
        "title": "Як відбувається замовлення",
        "blocks": [
          {
            "type": "ordered",
            "items": [
              "**Оберіть рішення.** Додайте потрібні картки до кошика або перейдіть на сторінку «Зробити свій дизайн».",
              "**Залиште контакт.** Один кошик із кількома позиціями надсилається як одна заявка. Якщо потрібна лише порада чи початковий макет, це не покупка.",
              "**Узгодьте деталі.** Ми уточнимо кількість, тип карток, посилання призначення, особливості дизайну й адресу доставки. Посилання Google-точки можна надати після першої заявки.",
              "**Підтвердьте замовлення.** До передоплати узгодимо остаточну ціну, виготовлення та доставку. Для персонального оформлення спочатку погодимо макет.",
              "**Отримайте картки.** Перед відправленням перевіримо налаштування NFC і передамо інформацію про відправлення та номер ТТН."
            ]
          }
        ]
      },
      {
        "id": "payment",
        "title": "Скільки й коли сплачувати",
        "blocks": [
          {
            "type": "bullet",
            "items": [
              "**Запит, консультація та початковий персональний макет** не є оплатою чи підтвердженим замовленням фізичних карток. Для брендованого рішення початковий макет готуємо безкоштовно згідно з умовами конкретної пропозиції.",
              "**Передоплата для фізичного замовлення — 200 грн один раз за все замовлення**, після узгодження деталей. Вона **входить у загальну ціну** й не додається зверху; це не 200 грн за кожну картку чи позицію.",
              "**Залишок вартості** сплачуєте після відправлення та отримання номера ТТН, відповідно до погодженого замовлення.",
              "Спосіб оплати й реквізити повідомимо під час особистого узгодження. Без підтвердження не перераховуйте кошти."
            ]
          }
        ]
      },
      {
        "id": "domestic-delivery",
        "title": "Доставка по Україні",
        "blocks": [
          {
            "type": "paragraph",
            "text": "**Стандартна доставка Новою поштою в межах України — безкоштовна.** Після відправлення повідомимо номер ТТН. Інший перевізник, нестандартний спосіб чи окремі логістичні умови — за індивідуальним узгодженням до передоплати."
          }
        ]
      },
      {
        "id": "international-delivery",
        "title": "Доставка за кордон",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Для Польщі діють окремі умови польського ринку: відправляємо з України, а вартість доставки оплачує одержувач; спосіб і суму погоджуємо до передоплати. Для інших країн логістику й вартість уточнюємо індивідуально. Польська версія сайту містить окремі ціни у PLN, без автоматичного перерахунку з гривень."
          }
        ]
      },
      {
        "id": "preparation",
        "title": "Строки та підготовка",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Строк виготовлення залежить від виробу й погодженого оформлення. Для готових Google Review та Instagram Card поточний опис містить орієнтир **до п’яти робочих днів після погодження**, але точний строк підтверджуємо до передоплати. Строки для 3D, Menu, Mini та персонального дизайну погоджуємо окремо до передоплати. Час перевезення — окрема частина очікування."
          }
        ]
      },
      {
        "id": "individual-quotes",
        "title": "Якщо в кошику є товар із індивідуальною ціною",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Для частини Mini, кількох карток понад готові пакети та спеціальних конфігурацій потрібен розрахунок. Якщо змішано картки з відомою ціною й позиції «Індивідуальний розрахунок», показана в кошику сума стосується **лише позицій з відомими цінами**. Вона не є остаточною вартістю всього замовлення. Підтвердимо повну суму до передоплати."
          }
        ]
      },
      {
        "id": "warranty-contact",
        "title": "Гарантія та питання",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Якщо виникне питання щодо налаштування або якості картки, зв’яжіться з нами. Застосовуються опубліковані умови [«Гарантія та повернення»](/warranty-and-returns/). Результати відгуків Google не гарантуються. Для уточнення доставки чи оплати скористайтеся [контактами](/contact/)."
          }
        ]
      }
    ],
    "faq": [
      {
        "id": "q1",
        "question": "Чи можна сплатити карткою одразу на сайті?",
        "answer": "Ні. На сайті ви надсилаєте заявку. Після узгодження деталей повідомимо спосіб оплати."
      },
      {
        "id": "q2",
        "question": "Чи потрібно вносити 200 грн за кожну картку?",
        "answer": "Ні, це одна передоплата за погоджене фізичне замовлення, що входить у підсумкову вартість."
      },
      {
        "id": "q3",
        "question": "Чи потрібно платити за запит на дизайн?",
        "answer": "Ні, перше звернення й початковий безкоштовний макет за умовами Branded-пропозиції не є фізичним замовленням."
      },
      {
        "id": "q4",
        "question": "Чи доставка по Україні безкоштовна?",
        "answer": "Так, стандартна доставка Новою поштою в Україні безкоштовна."
      },
      {
        "id": "q5",
        "question": "Що з доставкою до Польщі?",
        "answer": "Відправляємо з України; доставку оплачує отримувач. Суму та спосіб погоджуємо заздалегідь."
      },
      {
        "id": "q6",
        "question": "Коли сплачується залишок?",
        "answer": "Після відправлення й отримання номера ТТН."
      },
      {
        "id": "q7",
        "question": "Чому в кошику не показана остаточна сума?",
        "answer": "Для позицій з індивідуальним розрахунком загальну вартість потрібно узгодити. На сайті не створюємо умовну ціну."
      }
    ],
    "labels": {
      "faq": "Поширені запитання",
      "catalog": "Переглянути каталог",
      "design": "Зробити свій дизайн",
      "contact": "Уточнити умови"
    },
    "market": "UA",
    "currency": "UAH"
  },
  "en": {
    "title": "Delivery and payment",
    "intro": [
      "Choose your NFC cards or request a custom design first. We confirm the quantity, configuration, price, production timing and delivery before a physical order is accepted. **There is no online payment on this website: your cart sends an enquiry, not a charge.**"
    ],
    "sections": [
      {
        "id": "ordering",
        "title": "How ordering works",
        "blocks": [
          {
            "type": "ordered",
            "items": [
              "**Choose your solution.** Add cards to your cart or open “Create your own design”.",
              "**Send one enquiry.** A cart containing several products becomes one enquiry. Advice and an initial design request are not purchases.",
              "**Confirm the details together.** We clarify the quantities, card purpose and destination link, design materials, delivery address and any outstanding questions. You can provide your Google business location after the first enquiry.",
              "**Approve the order.** We confirm the full cost, production timing and delivery before the deposit. For personalised cards, we agree the artwork first.",
              "**Receive the cards.** We check the configured NFC destination before dispatch and provide shipment information and a tracking number."
            ]
          }
        ]
      },
      {
        "id": "payment",
        "title": "Deposit and balance",
        "blocks": [
          {
            "type": "bullet",
            "items": [
              "A consultation or initial design enquiry does not require payment or create a physical order. The initial personalised mockup is free according to the applicable Branded offer.",
              "Once a physical order is agreed, the **UAH 200 deposit is charged once per entire physical order** and **is included in the agreed total**, not added to it. It is not charged separately for every card or cart line.",
              "The remaining balance is paid **after dispatch and receipt of the tracking number**, under the agreed terms.",
              "Payment details and methods are communicated when the order is confirmed. Do not transfer money before the details are agreed."
            ]
          }
        ]
      },
      {
        "id": "domestic-delivery",
        "title": "Delivery in Ukraine",
        "blocks": [
          {
            "type": "paragraph",
            "text": "**Standard Nova Poshta delivery within Ukraine is free.** We provide the tracking number once dispatched. Alternative carriers or exceptional arrangements are agreed individually before the deposit."
          }
        ]
      },
      {
        "id": "international-delivery",
        "title": "International delivery",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Orders sent from Ukraine to Poland follow separate Polish-market terms: the recipient pays delivery, with the carrier and cost agreed before the deposit. Other countries are handled individually. Polish-market card prices are listed separately in PLN, without automatic conversion from Ukrainian prices."
          }
        ]
      },
      {
        "id": "preparation",
        "title": "Preparation and timing",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Production time depends on the product and approved artwork. The current ready-made Google Review and Instagram offer provides an **indicative period of up to five working days after approval**; we confirm the actual timing before the deposit. Timelines for 3D, Menu, Mini and personalised orders are agreed separately before the deposit. Transit time is separate from production."
          }
        ]
      },
      {
        "id": "individual-quotes",
        "title": "Mixed carts and individual quotations",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Some Mini orders, larger quantities and special configurations require individual quotation. If a cart contains both priced and quote-only lines, its displayed amount represents **only the products with known prices**, not the final total for the entire order. We agree the full total before any deposit is due."
          }
        ]
      },
      {
        "id": "warranty-contact",
        "title": "Warranty and questions",
        "blocks": [
          {
            "type": "paragraph",
            "text": "For questions about the card or NFC setup, contact NFC CARD. The published [Warranty and returns](/warranty-and-returns/) conditions apply. Google review results are not guaranteed. For delivery questions, use [Contact](/contact/)."
          }
        ]
      }
    ],
    "faq": [
      {
        "id": "q1",
        "question": "Can I pay online now?",
        "answer": "No. The website collects an enquiry; payment is arranged after the details are confirmed."
      },
      {
        "id": "q2",
        "question": "Is the deposit UAH 200 per card?",
        "answer": "No. It is one deposit for the agreed physical order, included in its total."
      },
      {
        "id": "q3",
        "question": "Do I pay to request my own design?",
        "answer": "An initial enquiry does not require payment. The initial mockup is free under the relevant Branded offer."
      },
      {
        "id": "q4",
        "question": "Is delivery within Ukraine free?",
        "answer": "Standard Nova Poshta delivery within Ukraine is free."
      },
      {
        "id": "q5",
        "question": "What about Poland?",
        "answer": "We ship from Ukraine. The recipient pays shipping, with cost and carrier agreed before the deposit."
      },
      {
        "id": "q6",
        "question": "When is the remaining balance due?",
        "answer": "After the order has been dispatched and the tracking number has been provided."
      },
      {
        "id": "q7",
        "question": "Why does my cart not show a final total?",
        "answer": "Quote-only products must be priced individually; the displayed known subtotal is not a total for the full order."
      }
    ],
    "labels": {
      "faq": "Frequently asked questions",
      "catalog": "View the catalog",
      "design": "Create your own design",
      "contact": "Ask about delivery"
    },
    "market": "UA",
    "currency": "UAH"
  },
  "pl": {
    "title": "Dostawa i płatność",
    "intro": [
      "Najpierw wybierasz karty NFC lub wysyłasz zapytanie o indywidualny projekt. Następnie uzgadniamy liczbę sztuk, wygląd, cenę, termin wykonania i warunki dostawy. **Na stronie nie ma płatności online: koszyk służy do wysłania zapytania, a nie do obciążenia konta.**"
    ],
    "sections": [
      {
        "id": "ordering",
        "title": "Jak wygląda zamówienie",
        "blocks": [
          {
            "type": "ordered",
            "items": [
              "**Wybierz rozwiązanie.** Dodaj karty do koszyka lub przejdź do sekcji „Stwórz własny projekt”.",
              "**Wyślij jedno zapytanie.** Koszyk z kilkoma produktami jest przesyłany jako jedno zgłoszenie. Prośba o poradę lub wstępny projekt nie jest zakupem.",
              "**Uzgodnij szczegóły.** Potwierdzimy liczbę i rodzaje kart, adres docelowy NFC, materiały do projektu, dane wysyłki i pytania. Link do wizytówki Google możesz przekazać po pierwszym zgłoszeniu.",
              "**Potwierdź zamówienie.** Przed zaliczką uzgodnimy ostateczną cenę, termin wykonania, przewoźnika i koszt dostawy. Przy indywidualnym projekcie najpierw uzgodnimy wygląd.",
              "**Odbierz przesyłkę.** Sprawdzamy skonfigurowany link NFC przed wysyłką i przekazujemy numer przesyłki."
            ]
          }
        ]
      },
      {
        "id": "payment",
        "title": "Zaliczka i pozostała kwota",
        "blocks": [
          {
            "type": "bullet",
            "items": [
              "Samo zapytanie, konsultacja i prośba o wstępny projekt nie wymagają zapłaty. Wstępna wizualizacja jest bezpłatna zgodnie z warunkami odpowiedniej oferty Branded.",
              "Po uzgodnieniu zamówienia fizycznych kart **zaliczka wynosi 20 PLN jeden raz za całe zamówienie**. **Jest już wliczona w uzgodnioną cenę kart**, nie doliczana osobno do każdej sztuki.",
              "**Pozostałą kwotę opłacasz po wysyłce i przekazaniu numeru śledzenia**, zgodnie z uzgodnionymi warunkami.",
              "Metodę i dane do płatności uzgadniamy indywidualnie przed wpłatą."
            ]
          }
        ]
      },
      {
        "id": "domestic-delivery",
        "title": "Dostawa do Polski",
        "blocks": [
          {
            "type": "paragraph",
            "text": "**Wysyłamy z Ukrainy. Koszt dostawy pokrywa odbiorca.** Przewoźnika, sposób oraz koszt potwierdzamy przed wpłatą zaliczki. Dostawa **nie** jest wliczona automatycznie w cenę kart na polskim rynku."
          }
        ]
      },
      {
        "id": "international-delivery",
        "title": "Inne kraje",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Wysyłkę do innych krajów wyceniamy indywidualnie, po uzgodnieniu przewoźnika, warunków i kosztów. Termin, warunki i cenę transportu potwierdzamy indywidualnie przed zaliczką."
          }
        ]
      },
      {
        "id": "preparation",
        "title": "Produkcja i czas realizacji",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Czas przygotowania zależy od wybranego produktu i uzgodnionego projektu. Termin wykonania potwierdzamy przed zaliczką; czas realizacji 3D, Menu, Mini i personalizacji uzgadniamy osobno. Czas dostawy jest osobnym etapem."
          }
        ]
      },
      {
        "id": "individual-quotes",
        "title": "Produkty z indywidualną wyceną",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Część kart Mini, większe liczby sztuk i nietypowe konfiguracje wymagają wyceny. Jeżeli koszyk zawiera zarówno produkty z ceną, jak i pozycje z wyceną indywidualną, widoczna kwota dotyczy **wyłącznie produktów o znanej cenie**. Nie jest to ostateczna cena całego zamówienia. Potwierdzimy ją przed zaliczką."
          }
        ]
      },
      {
        "id": "warranty-contact",
        "title": "Gwarancja, zwroty i kontakt",
        "blocks": [
          {
            "type": "paragraph",
            "text": "W razie problemu z kartą lub ustawieniem NFC skontaktuj się z nami. Obowiązują opublikowane warunki [Gwarancji i zwrotów](/warranty-and-returns/). Nie gwarantujemy określonej liczby opinii Google. Jeśli masz pytania o dostawę, przejdź do [Kontaktu](/contact/)."
          }
        ]
      }
    ],
    "faq": [
      {
        "id": "q1",
        "question": "Czy można zapłacić online?",
        "answer": "Nie. Wysyłasz zapytanie, a szczegóły płatności potwierdzamy później."
      },
      {
        "id": "q2",
        "question": "Czy zaliczka 20 PLN jest za każdą kartę?",
        "answer": "Nie, dotyczy całego uzgodnionego zamówienia fizycznego i jest wliczona w cenę kart."
      },
      {
        "id": "q3",
        "question": "Czy zapytanie o własny projekt jest płatne?",
        "answer": "Pierwsze zgłoszenie nie wymaga zapłaty. Wstępna wizualizacja jest bezpłatna zgodnie z ofertą Branded."
      },
      {
        "id": "q4",
        "question": "Czy dostawa do Polski jest darmowa?",
        "answer": "Nie. Wysyłamy z Ukrainy; odbiorca pokrywa koszt dostawy, a kwotę potwierdzamy przed zaliczką."
      },
      {
        "id": "q5",
        "question": "Kiedy płacę pozostałą kwotę?",
        "answer": "Po wysyłce i otrzymaniu numeru śledzenia."
      },
      {
        "id": "q6",
        "question": "Dlaczego koszyk nie pokazuje pełnej ceny?",
        "answer": "Pozycje z indywidualną wyceną wymagają potwierdzenia. Znana część kwoty nie jest ostateczną ceną całego koszyka."
      }
    ],
    "labels": {
      "faq": "Najczęstsze pytania",
      "catalog": "Zobacz katalog",
      "design": "Stwórz własny projekt",
      "contact": "Zapytaj o dostawę"
    },
    "market": "PL",
    "currency": "PLN"
  }
});
