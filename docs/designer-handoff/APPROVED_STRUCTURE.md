# Approved structure and routing

All paths below are below `/nfc-card-website/`. UA is the default (`uk` in code); EN adds `/en/`, PL adds `/pl/`. Locale switching must preserve the equivalent page and meaningful product context.

## Six retail products

Unfiltered `/solutions/`, `/catalog/`, `/collections/` and search expose the same ordered list. Categories/filters/related recommendations show subsets, not new Branded merchandise.

| Order | ID | Route |
|---|---|---|
| 1 | `review-card` | `/solutions/review-card/` |
| 2 | `nfc-instagram-card` | `/solutions/instagram-card/` |
| 3 | `nfc-menu-card` | `/solutions/menu-card/` |
| 4 | `review-card-3d` | `/solutions/review-card-3d/` |
| 5 | `beauty-review-card` | `/solutions/beauty-review-card/` |
| 6 | `restaurant-review-card` | `/solutions/restaurant-review-card/` |

Home highlights **Beauty Mini → Restaurant Mini → Google Review → Instagram**, in that order. Menu/3D remain full catalog products, outside the four-product home showcase.

The three legacy Branded offers remain directly available: `/solutions/branded-review-card/`, `/solutions/branded-beauty-review-card/`, `/solutions/branded-restaurant-review-card/`. All9 active IDs and 27 localized detail pages remain valid. Backend IDs and immutable historical receipts cannot be removed because retail discovery changed. The two Universal Mini proposals remain DRAFT, unavailable and excluded from public retail Product/Offer discovery.

## Design is a service

`/services/design/` is one detailed service page and service-only form, not a seventh product. One distinct catalog promo block points there, outside the product grid and ItemList. `/collections/branded/` is a compatible information/service hub with no product cards/prices.

Product links carry these contexts through `?entry=`:

| Physical base | Existing context entry |
|---|---|
| Google Review10×10 | `branded-review-card` |
| Beauty Mini | `branded-beauty-review-card` |
| Restaurant Mini | `branded-restaurant-review-card` |

Preserve examples/placeholders, material checklist, mockup/approval process and meaningful form context. A free first design request must not add a fictitious card line or deposit. Do not create Branded Instagram.

## Product detail

Gallery → approved price or quote → options/quantity/actions → four real in-place tabs: Overview, Specifications, Payment & delivery, FAQ. Product text remains in raw HTML without JavaScript; enhancement switches panels and keyboard focus, never reduces the copy to make a shorter page. Preserve all 418 sections/237 FAQ. Existing shared FAQ contains19items per locale.

## Information and utility routes

| Route | Meaning |
|---|---|
| `/about/` | Про нас / About us / O nas; original company/founder facts/photo. |
| `/what-is-nfc-card/` | Separate How it works educational page. Do not invent `/how-it-works/` as a replacement. |
| `/faq/` | General localized FAQ. |
| `/delivery-and-payment/` | Complete localized order/payment/shipping page and FAQ7/7/6. |
| `/contact/` | Current verified contacts and correct enquiry/V36 transitions. |
| `/cart/`, `/order/`, `/thank-you/` | Inquiry cart, contact form and durable receipt. |
| `/services/quantity-advice/`, `/services/menu-consultation/` | Service-only consultation intents. |
| `/privacy/`, `/terms/`, `/warranty-and-returns/` | Existing protected wording and production privacy gate. |

Historical aliases come from `seo.mjs` and `refinements/instagram-v18/routes.json`. Do not rename or delete routes to simplify design. Internal `/review/*` pages are local review tools only; they do not establish public business claims.
