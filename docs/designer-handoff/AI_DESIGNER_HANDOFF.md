# Production-base update

Read [CURRENT_BASE_2026-10-29.md](CURRENT_BASE_2026-10-29.md) first. Current production `main` is v36.2; the old handoff branch is historical. The instruction below to open a PR into the handoff branch is superseded. Keep the visual branch separate and never deploy without the owner's approval.

# Start task for the designer's AI

You are the professional designer's frontend partner for **NFC CARD by Antonov Digital**. Work from the exact delivered `design/nfc-card-v36-2` commit in `optidigitalagent/nfc-card-website`. The owner will give the human designer creative direction separately. Your job is a cohesive visual refinement of a functioning accepted storefront, with no loss of content or business behavior.

First read `AGENTS.md`, `docs/designer-handoff/DESIGNER_START_HERE.md`, `ARCHITECTURE.md`, `APPROVED_STRUCTURE.md`, `DESIGN_CONSTRAINTS.md`, `CART_AND_FORMS.md`, `MEDIA_GUIDE.md`/`MEDIA_REGISTER.json`, `GITHUB_WORKFLOW.md` and `PROVENANCE_AND_GATES.md`. Record the starting SHA. Use locally available verified design/UX/accessibility guidance only; never install or run unreviewed skills or change a canonical skill lock. These docs are self-contained and do not require private chat history or private SiteAgent files.

Run Node24 `npm run designer:build`, `npm run designer:preview`. Inspect actual desktop/mobile pages before proposing changes. Use only synthetic form contacts from the start guide. Preview has no real sender or production integration. Default `npm run build/test/start` still refer to the original main application; use `designer:*` commands for this source.

Prepare visual directions reflecting the human designer's owner briefing. You may refine grid, composition, typography with licensed fonts, gallery, cards, tabs, information pages, service storytelling, banners, honest media frames, microinteractions and responsive behavior. Use references for usability principles; never copy third-party code, images, claims or fonts.

Preserve six retail products, four home priorities, three legacy Branded direct pages, all 9 active identities and 2 unavailable Universal drafts; separate custom-design service and exact base contexts; full418product sections/237 FAQ and general FAQ; three languages, prices/market/shipping/deposit truth, true in-place tabs, search/filter/cart, all routes/SEO, V36 email proposal and immutable request/receipt/idempotency contracts. No Branded Instagram. No fabricated customer proof, sizes, prices, Google partnership, promotions or guarantees.

Treat `commerce.mjs`, `api-client.mjs`, release/policy/V36 and pure gateway fixtures as protected. Ask about material business conflicts, never silently change contracts to fit a layout. Do not edit backend/gateway/PostgreSQL/CRM, activate production endpoints, merge main, force push, publish Pages/Railway, send notifications or submit real client requests. Open a reviewed PR into the handoff branch only.

For each design iteration deliver: source changes, before/after local desktop/mobile screenshots UA/EN/PL,9 target widths and native 200%zoom, keyboard/focus/reduced-motion proof, static/no-JS/SEO and content/route/price non-regression, updated media provenance, actual test commands/exit statuses and independent review. Fix Critical/High findings and explain limits. Do not present local-only proof as production acceptance.

Finish: **DESIGN CANDIDATE READY — AWAITING OWNER VISUAL APPROVAL / PRODUCTION HOLD.**
