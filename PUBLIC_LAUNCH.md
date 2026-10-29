> v36.2 update: the current root production build and existing-URL release gate are documented in [PRODUCTION_RELEASE.md](docs/release/v36.2/PRODUCTION_RELEASE.md). The earlier implementation below remains historical reference. No production QA form submissions or new notification permission.

# NFC CARD PUBLIC launch

Site: https://optidigitalagent.github.io/nfc-card-website/

The approved frontend remains static on GitHub Pages with base path `/nfc-card-website`.
Only form requests go to the existing gateway's `/v1/public/leads/nfc-card` endpoint.
The source is fixed server-side to NFC_CARD. The browser never receives a gateway,
database or Telegram secret. The retained Python/S3/reviews/admin implementation
is not exposed or provisioned by this Pages release.

## Configuration

Pages build: NFC_ENV=production, NFC_PUBLICATION_MODE=PUBLIC,
NFC_TELEGRAM_ENABLED=true, NFC_DEPLOYMENT_TARGET=github-pages,
NFC_PUBLIC_ORIGIN=https://optidigitalagent.github.io,
NFC_PUBLIC_BASE_PATH=/nfc-card-website. NFC_LEAD_ENDPOINT is a GitHub repository
variable holding the public HTTPS gateway URL, without credentials. The existing
NFC_PAGES_DEPLOY_ENABLED switch controls publication through Actions.

Gateway: NFC_ENV=production, NFC_PUBLICATION_MODE=PUBLIC,
NFC_PUBLIC_INTAKE_ENABLED=true, NFC_TELEGRAM_ENABLED=true,
NFC_TELEGRAM_MODE=live. Keep existing NFC database/source references and all
existing iADDS/bot/chat variables. No new infrastructure is required.

PUBLIC is an explicit, content-bound Pages authorization in
src/publication-approval.json. The owner confirmed seller Artem Antonov and
returns/refunds for defective cards on 2026-09-12. No address, registration number,
legal status or unconfirmed guarantee is invented. All src content/renderers/assets
are hashed except the receipt itself; source edits invalidate the receipt.
The legacy PUBLIC_INDEXABLE/fullstack approval gate remains separate.
Marketing and policy pages use index,follow and production canonicals/hreflang/OG.
Stateful order/contact/thank-you routes, redirects and the custom 404 remain
excluded from indexing; they are not discovery landing pages.

## Enquiry behavior

The client gets a signed path-bound challenge and waits the required minimum age.
Names, phones, comments and request payloads stay in the open form; browser session
storage holds only opaque attempt/receipt UUIDs and lifecycle state. Arbitrary
attribution/referrer values are not persisted by the Pages client. No form personal
fields enter analytics. Comments are not transmitted; the existing form notice
explains that additional details are agreed in a messenger.

The client sends the existing selected variant/quantity semantics as a constrained
selection, including 3+, bulk and consultation. Prices come from the server.
A 202 durable receipt confirms saving, independently of Telegram delivery.
Unknown outcomes retry the same key/body. Definitive first-attempt rejection can
be corrected. Reload retains uncertainty without storing personal data. A confirmed
old receipt or conflict offers an explicit new-enquiry action; it never silently
sends a second request or claims changed details were saved.

## Validation and release sequence

Run the complete npm test suite with a disposable local PostgreSQL 17 and Chromium;
run the gateway/iADDS audit, lint, TypeScript, unit/integration/build/browser checks.
Run source manifest verification and the full-history release guard. Require
independent source/browser review, green remote CI and fresh GitHub clean clones.
Deploy the gateway from its tested main SHA with controlled additive migration
002_public_commerce (001 remains immutable). Then publish the tested Pages SHA.
Verify the real anonymous HTTPS pages, assets, forms and crawl metadata.

Only then run the owner's one authorized synthetic FINAL TEST through the public
form using a server-allowlisted opaque idempotency key. The gateway persists a
one-shot final-test marker; it does not accept browser test flags. Verify one lead,
one outbox, a sent receipt and no duplicate notification. Stop for owner receipt
confirmation. Automated browser tests use mocked transport, never the live bot.

## Rollback

Set the Pages publication mode to PUBLIC_PREVIEW and NFC_TELEGRAM_ENABLED=false,
rebuild and redeploy through the same validated Actions workflow. That one mode
restores the badge, unavailable message, disabled form and noindex without editing
components. Disable NFC_PUBLIC_INTAKE_ENABLED and NFC_TELEGRAM_ENABLED in the
existing gateway, then deploy its previous known-good SHA. Preserve all database
rows, outbox state, schema and volume; do not undo additive migrations or release
held rows. A private pre-migration dump and restore verification accompany the
operator's acceptance evidence outside Git. Never restore over production as a
routine rollback. No billing/resource or iADDS frontend changes are part of rollback.
