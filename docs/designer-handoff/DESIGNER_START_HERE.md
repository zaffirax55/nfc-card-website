# Production-base update

Read [CURRENT_BASE_2026-10-29.md](CURRENT_BASE_2026-10-29.md) first. The older clone command and claims that default build still targets the legacy site are obsolete. Use the existing fork designer branch after its integration commit, or fetch current `optidigitalagent/main` into a separate design branch. The `designer:*` commands remain the safe local preview path.

# NFC CARD v36.2 — designer source handoff

The current v36.2 source was merged from `optidigitalagent/main` into the existing fork designer branch. Design work stays in the branch; production, GitHub Pages and Railway remain unchanged by this iteration.

The active storefront source is **`src/v36_2/`**. The default build now builds the production v36.2 storefront. Use the explicit `designer:*` commands below for safe local preview.

## Clone and run

Install Node.js **24** from its official distribution. These designer commands use Node built-ins; no npm install, Docker, Python, database service, `.env` or credentials are needed.

```sh
git clone --branch design/visual-refresh-2026-10-28 --single-branch https://github.com/zaffirax55/nfc-card-website.git
cd nfc-card-website
git rev-parse HEAD
node --version
npm run designer:build
npm run designer:preview
```

Open **http://127.0.0.1:4196/nfc-card-website/**. Terminal must stay running; Ctrl-C stops your own preview. The URL is local to your computer and is not available to remote collaborators. If 4196 is occupied, run `node tools/designer-preview.mjs --port 4206` and use that port instead. Do not stop unrelated services.

The server binds loopback only, sets `noindex`, and stores **synthetic-only** enquiries in `work/designer-state/`. No production gateway, PostgreSQL, CRM, Telegram or Gmail is connected. The visible preview banner and form consent deliberately say test details only.

Use name **Synthetic Demo**, email **demo@example.invalid**, optional phone **+12025550123**, messenger **@synthetic_demo**. Real contacts are rejected. Never enter real client data. Synthetic local success means a local SQLite COMMIT with notifications disabled; it does not certify live CRM delivery.

## Build and verify

```sh
npm run designer:build
npm run designer:seo
npm run designer:test:contracts
npm run designer:test:transport
npm run designer:check
```

- Preview output: `work/designer-preview-v36_2/` — full 132 localized routes, interactive synthetic forms, noindex.
- SEO fixture: `work/designer-seo-fixture-v36_2/` — 120 routes,93 sitemap URLs, intake disabled. Its indexable metadata is a test fixture, never publication authorization.
- Contract tests: wire/normalization/digest/prices/immutable receipts/challenge recovery. Transport tests: local persistence/replay/error and V36 safety. These test groups overlap; do not add them into a claimed unique test total.
- `designer:check`: branch-specific deterministic source/static/compatibility checks. Actual completed checks and independent review are in the evidence index delivered with this branch.

There is no hot reload. After editing source, run `designer:build` again and refresh the page. Generated `work/` files are not source and must not be committed. Use the `designer:*` path for local work. `npm run build` now compiles the production v36.2 storefront and is not a preview command.

## Read before editing

1. [Architecture and components](ARCHITECTURE.md)
2. [Approved structure and routes](APPROVED_STRUCTURE.md)
3. [Design freedoms and constraints](DESIGN_CONSTRAINTS.md)
4. [Cart, forms and integration boundaries](CART_AND_FORMS.md)
5. [Media guide](MEDIA_GUIDE.md) and [machine-readable register](MEDIA_REGISTER.json)
6. [Designer AI start prompt](AI_DESIGNER_HANDOFF.md)
7. [Safe branch/PR workflow](GITHUB_WORKFLOW.md)
8. [Provenance and open gates](PROVENANCE_AND_GATES.md)

The immutable delivered SHA is the commit returned with this handoff; confirm it with `git rev-parse HEAD`. The source archive hash is recorded in the provenance file. Do not assume the default `main` contains this storefront.

Completed checks: [QA report](QA_REPORT.md), [independent acceptance](INDEPENDENT_ACCEPTANCE.md), [change register](CHANGE_REGISTER.md) and [screenshots/evidence](evidence/README.md).
