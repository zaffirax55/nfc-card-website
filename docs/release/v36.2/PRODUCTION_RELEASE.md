# NFC CARD v36.2 — existing URL release

The owner's 2026-10-28 release request supersedes the designer-only publication hold. The approved storefront is integrated from designer commit `26910a0ea2c5774c25b758309e97500f88a1bb47`, preserving that branch and the accepted archive SHA `b6621cd2620bf57270ed2b616bb0ab4cdb609dbbce999319dfc242883c168b35`.

## Build and publication boundary

Node24: `npm ci`, `npm run designer:test:contracts`, `npm run test:production`, then `npm run build`. Root build produces the new store directly in `site/`, with exactly one `/nfc-card-website/` URL base. Historical root source/build remains available through `npm run build:legacy` and the complete legacy regression suite. Designer preview/fixture builds are deliberately synthetic and cannot be the root publication artifact.

CI keeps the existing main-only Pages pipeline. Before either production build it requires a read-only GET of the existing gateway status endpoint, matching `release/gateway-release.json`: exact deployed commit, approved-intake mode, CF-01 contract, approved B05 hash and current UAH/PLN pricing revisions. A missing schema, disabled intake, wrong commit or policy fails closed. `DEPLOYED_VERSION.json` binds public bytes to the workflow's actual Git commit.

## Preserved invariants

Six retail catalog identities, four home priorities, nine active legacy offers and two unavailable Universal drafts remain. All418 product sections,237FAQ, accepted switchable tabs, URLs, UA/EN/PL, media/HOLD slots and current prices are preserved. Ordinary Branded pair remains3600UAH/299PLN; existing2600UAH historical receipts are never recalculated. Styling/assets/product content and commerce code are exact approved source. `release/PRODUCTION_ADAPTATIONS.json` records the four source adaptations for production disclosure/SEO; original archive hashes remain in `designer/SOURCE_ORIGIN.json`.

## Approved privacy and receiving

`release/B05_OWNER_APPROVAL.json` records direct D1–D3 approval, with DP03 public-text SHA `9a247e3320c0b1594374efd103b2e139d344b6b4eff26318c18f0dbe6ca2cb8f` and policy-body SHA `d76bda8aff9b69e79731a2a536254e8c6e6b9d8b62faa986407f06e3e05806b4`. The current policy is rendered once; historical V35 disclosure remains at an explicitly labelled noindex archive. Old source disclosure and old receipt versions stay intact. Current V36 email retains its form identity, binds to the approved current V37 notice/hash, and keeps messenger fallback separate from email requests.

The approved recipient is the seller Artem Antonov through the existing private gateway/PostgreSQL and authenticated Owner Desk. New rich-cart receipts use a separate signed read feed into namespaced tables in the existing Owner Desk store. No automatic separate Cloud CRM bridge, marketing permission, sender enablement or new service is introduced. Browser success requires an actual committed server receipt. Tests use isolated synthetic data; production smoke checks use GET only.

## Release order and rollback

1. Accept isolated gateway, native receiver, privacy, regression, static SEO and browser evidence. Protect the existing PG/Owner Desk backups under private encrypted custody. Backups, credentials and customer records never enter this repository.
2. Release compatible gateway code first, with v2 disabled. Existing automatic migrations001–011 remain unchanged. Apply additive012 only through the separately guarded explicit operation with exact checksum, current deployed commit, verified backup evidence and bounded lock/statement timeouts. Never drop or rewrite legacy data.
3. Activate the approved policy and dedicated signed reader on the existing infrastructure, verify authenticated Owner Desk intake while outbound stays paused, and verify read-only public readiness. Pin that actual gateway commit here.
4. Publish the tested new Pages artifact through the existing pipeline, then verify its exact public commit/HTML/routes/media. Do not create a production test lead or send notifications.

On failure, disable new intake/configuration and restore the previous application/source binding as appropriate. Keep additive tables, accepted receipts and restriction ledgers. Never overwrite a live database with an old backup or erase accepted requests as an automatic rollback. Real-data restoration needs a separate assessed recovery procedure accounting for writes since backup and all rights restrictions.

## Rights operations addendum to immutable DP03

The original DP03 runbook's exact approved bytes remain historical evidence, including its then-current topology and defects. Current implementation has distinct restriction and case-bound physical scrub helpers in both Gateway and native Owner Desk. General D3 approval is not approval to delete a particular customer's data. Each operation requires verified identity, purpose/order-retention review, exact state fingerprints, an explicit owner case record and paired backup/recovery restrictions. No customer erasure is run by this release. Retention remains purpose-based without invented deadlines or promises to erase all backups instantly.
