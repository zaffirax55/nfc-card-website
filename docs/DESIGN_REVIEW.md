# NFC CARD v36.2 visual review

This design candidate is in `design/visual-refresh-2026-10-28` in the existing
`zaffirax55/nfc-card-website` fork. It includes upstream production frontend
`d0e79aab9717b3bb569325f249164a72bc5acd64` and preserves the v36.2 store,
B05, V36 email proposal, cart, and API contracts. It is not published.

## Fresh checkout preview

```sh
git clone --branch design/visual-refresh-2026-10-28 https://github.com/zaffirax55/nfc-card-website.git
cd nfc-card-website
node --version # Node 24
npm run designer:build
npm run designer:preview
```

Open `http://127.0.0.1:4196/nfc-card-website/`. This loopback preview accepts
synthetic contacts only and sends no production requests. Use `demo@example.invalid`
for any form test. Never enter real customer information.

## Visual and functional checks

- Home: approved six-product storefront, four home priorities and a clearly
  labelled, localized NFC phone demonstration. Its review example is not a
  customer testimonial and never submits a review. Reduced-motion visitors
  start with the demonstration paused and may choose to resume.
- Catalog: six discoverable products, existing search and filters, full
  photos inside each frame, approved business/service descriptions.
- Product: local galleries, configuration, in-place tabs, approved prices,
  cart links and all long-form text remain intact.
- About, delivery, privacy and order: three-language content, accessible
  navigation and synthetic-only preview form.

Use desktop and phone widths, keyboard, 200% zoom, reduced motion and the
full `designer:*` checks. The original 3D models and artwork remain in the
legacy source/history; they are not asserted as evidence for the six v36.2
product identities. No new product, testimonial or media claim was invented.

Production `main`, GitHub Pages, Gateway, PostgreSQL and Owner Desk are out of
scope. The PR remains unmerged pending owner review.
