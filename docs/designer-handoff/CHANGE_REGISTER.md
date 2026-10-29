# What this handoff changes

This is an additive source transfer from the exact approved v36.2 archive, not another visual or functional revision.

| Path | Purpose |
|---|---|
| `src/v36_2/` | Full editable accepted storefront: application, content, styles, all assets, true tabs, API/V36 compatibility. Runtime modules/CSS/assets are archive-identical. |
| `src/v36_2/README.md` | Correct version-specific pointer replacing a stale historical v35.10 instruction. No runtime change. |
| `src/v36_2/assets/*-OFL.txt` | Existing main licenses supplied alongside identical font copies. |
| `scripts/build-v36_2.mjs` | Archive builder with output paths moved under ignored `work/`. Builds preview and nonpublishing SEO fixture. |
| `tools/designer-preview.mjs` | Archive synthetic SQLite adapter with repository-local paths and owned state under `work/`. No external runtime/sender import or sibling workspace fallback. |
| `tools/designer-preview-test.mjs` | Archive durable/replay/synthetic-guard tests adapted to those paths. |
| `tools/designer-check.mjs` | Dependency-free archive/source/static/route/link/compatibility checks. |
| `designer/fixtures/` | Eight frozen pure gateway contract dependency files plus reserved synthetic request fixture. No gateway server, store, notifier, migrations or CRM. |
| `designer/SOURCE_ORIGIN.json` | SHA provenance for90 exact application/asset/pure-contract files and explicit packaging adaptations. |
| `tests/v36_2-*.test.mjs`, `tests/fixtures/` |103 approved client/pricing/receipts/challenge tests and synthetic examples. |
| `package.json` | Adds six opt-in `designer:*` commands. Five existing main commands and engine semantics preserved. |
| `README.md`, `AGENTS.md` | Adds designer entry point and branch-only/no-publication boundary above the existing content. |
| `scripts/release_guard.py` | Three exact-path/exact-line-SHA reviewed Fetch `credentials: omit` fixtures. Matching rules, private-file rules and history scanning remain intact; no broad exemption. |
| `docs/designer-handoff/` | Complete public-safe onboarding, architecture, IA, constraints, media register, AI task and bounded QA evidence. |
| `SOURCE_MANIFEST.json` | Refreshed using the existing approved manifest tool after final authored changes. |

The existing main `src/` application files, server, legacy build, release approval records, workflows and infrastructure are not replaced. The input v36.2 preview's134HTML files are byte-identical after integration. Generated `work/` is deliberately not committed.

For the exact file list, use the source manifest or `git diff --name-status aab27e99e35aa538e73042249b2195c3129ce551...HEAD`. Compare against the base main SHA in `PROVENANCE_AND_GATES.md`; remote main may advance independently later.

The pinned base works after the documented single-branch clone, where an `origin/main` tracking ref may not exist.
