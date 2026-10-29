# Current production base for design work

This note supersedes the handoff's old references to `main` as the legacy site and to `design/nfc-card-v36-2` as the current technical base. The historical handoff remains useful for approved structure, copy, media provenance, and design boundaries.

- Public site: https://optidigitalagent.github.io/nfc-card-website/
- Frontend production `main`: `d0e79aab9717b3bb569325f249164a72bc5acd64`.
- Production gateway revision reported by the owner: `73072817fa337b0f1530a63cd2ef73e70853c0ab`. This repository does not contain or deploy that gateway.
- Current designer source: `src/v36_2/`; `npm run build` now builds the v36.2 production storefront. Use `npm run designer:build`, `designer:seo`, `designer:test:contracts`, `designer:test:transport`, and `designer:check` for safe local review.
- Work in a separate design branch based on current production `main`. The existing owner design iteration is in `zaffirax55/nfc-card-website`, branch `design/visual-refresh-2026-10-28`. It merges the production base and records only explicitly scoped visual source changes in `designer/VISUAL_CHANGE_REGISTER.json`; the archive and production B05 adaptation ledger are left intact.

Preserve six retail products, four home priorities, three locales, routes, prices, B05, V36 email proposals, request/receipt/idempotency contracts, cart, and protected owner systems. The phone demonstration is a clearly labelled local illustration and sends nothing. Preview uses synthetic contacts only. No production forms, notifications, Gateway changes, merge to `main`, or deployment are part of this design branch.

The old `design/nfc-card-v36-2` handoff commit `26910a0` predates production release. Do not use it as the starting point for a new design change.
