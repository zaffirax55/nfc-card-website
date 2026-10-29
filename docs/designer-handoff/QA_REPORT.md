# Designer transfer QA — local evidence

This report concerns the integrated designer source, not production readiness. Source archive SHA is pinned in `PROVENANCE_AND_GATES.md`. Test groups overlap and are not summed into a unique total.

| Check | Actual result |
|---|---|
| Exact archive + CRC +755manifest payload hashes | PASS;90 exact application/asset/pure-fixture files pinned in `designer/SOURCE_ORIGIN.json`. |
| Approved preview HTML equivalence | PASS; all134HTML bytes match the approved v36.2 input. |
| Main preservation | Existing runtime/build/server/CI source preserved; only integration documentation/package/manifest and exact-hash guard fixtures change. |
| `npm run designer:build` | PASS;132routes, aliases preserved, noindex. |
| `npm run designer:seo` | PASS;120routes/93sitemap entries, disabled intake, no publication. |
| `npm run designer:test:contracts` |103PASS,0FAIL; wire/price/digest/receipts/challenge. |
| `npm run designer:test:transport` |15PASS,0FAIL; real local SQLite COMMIT/replay/restart, synthetic/origin/body/state guards, no notifications. |
| `npm run designer:check` |44PASS,0FAIL;90source hashes, six retail/four home/nine active/two drafts, all content and10,140local links. |
| Original main build | PASS;66localized PUBLIC_PREVIEW routes at a synthetic HTTPS origin, no live gateway. |
| Original V36 email tests |2PASS; actual browser form with every gateway request intercepted locally, error/retry/key stability/no PII storage. |
| Integrated actual browser→loopback forms |25/25PASS product/cart/design/Menu/Instagram/V36; a second25/25PASS includes nine catalog→service contexts and16overlapping regressions. Zero external requests/sends; synthetic records only. |
| Media and docs |35assets match existing public main; font notices present.104original roles+7future briefs; correct27placeholder/30omission/Restaurant/HOLD overlay. Export is deterministic; local document links resolve. |

The additional independent source/static/browser/native200% [report](INDEPENDENT_ACCEPTANCE.md) and27selected screenshots are indexed in [evidence](evidence/README.md).

**Clean clone: PASS.** The exact documented Node24 npm build/SEO/contracts/transport/static commands succeeded from a new clone with no sibling workspace fallback, credentials or npm install. The preview served18actualGET pages across three locales, with exact built HTML/noindex and disabled notifications. Manifest, complete Git history/index/filesystem guard, deterministic media export and clean tracked state passed. [Pre-publication receipt](evidence/PREPUBLICATION_VERIFICATION.json) retains actual command exits. These checks are separate from the independent reviewer's earlier cutoff; the final remote commit/main/Pages receipt accompanies the owner's delivery after push.

Authored integration diff is clean. The exact approved source and two upstream OFL notices retain original final blank line/CRLF/trailing-space formatting; they were deliberately not reformatted for transfer.

## Deliberate limits

Full original PostgreSQL-backed `npm test`, installed Owner Desk runtime, actual CRM delivery, real production POST/Telegram/Gmail, Safari/Firefox and a full formal WCAG certification are NOT_RUN. The designer command suite needs only Node24 and no live integration credentials. B05/media/release approval remain open gates.

An initial static check detected a build manifest made before the source README correction. Rebuilding fixed that stale generated manifest; runtime source/HTML were unchanged. Three credential-pattern findings were Fetch credentials-mode settings, reviewed by exact path/line hash without weakening guard rules. A preliminary provenance QA path typo was corrected in the QA harness; the initial artifact is retained privately. These are test/packaging corrections, not hidden storefront defects.
