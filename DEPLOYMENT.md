> v36.2 update: the current root production build and existing-URL release gate are documented in [PRODUCTION_RELEASE.md](docs/release/v36.2/PRODUCTION_RELEASE.md). The earlier implementation below remains historical reference. No production QA form submissions or new notification permission.

# Current deployment target: GitHub Pages (v17)

The owner's v17 request supersedes the v16 full-stack Railway hosting target.
The public site is built for `https://optidigitalagent.github.io/nfc-card-website/`.
See `PAGES_DEPLOYMENT.md` for the project-path build and explicit static boundaries.
The Python reviews/admin implementation below remains in source for a future
separately configured full-stack deployment; GitHub Pages does not execute it.

# Deployment and publication modes

Deploy from `main` of the dedicated GitHub repository to an existing isolated
NFC CARD full-stack service. GitHub Pages is unsupported. No deployment is
currently verified; consult `DEPLOYMENT_BLOCKERS.md` before infrastructure changes.
Existing unrelated services/databases are not NFC CARD capacity.

## Container contract

- Build: supplied Dockerfile, Node 24 frontend and Python 3.14 runtime.
- Build arguments: `NFC_PUBLIC_ORIGIN` (verified HTTPS origin, required),
  `NFC_PUBLICATION_MODE` (defaults to `PUBLIC_PREVIEW`).
- Start: `gunicorn --bind 0.0.0.0:${PORT:-8000} server.wsgi:application`.
- Health: `GET /healthz` on the configured Host.
- Runtime: `NFC_ENV=production`; configure the same origin and publication mode
  at build time and runtime. Configuration mismatch returns 503.
- PostgreSQL 17 and private S3 credentials are runtime secrets, never build args.
- Run migrations once in a controlled pre-deploy step; app imports do not migrate.

`/healthz` checks migration checksums and DB availability. Its
`storage: configured_not_probed` response does not claim successful S3 connection
or private-bucket verification. Acceptance separately requires authorized synthetic
upload/read/delete and anonymous-access checks. Health/errors/APIs/admin are
noindex/no-store. A Node build does not prove a Docker build or host deployment.

## PUBLIC_PREVIEW — default

Public HTML and WSGI responses are noindex; `robots.txt` disallows all crawling.
Canonical, hreflang, OG, structured-data and sitemap use `NFC_PUBLIC_ORIGIN`.
Sitemap lists public informational/product routes only; forms, admin/API,
thank-you state and draft policies are excluded. Sitemap is route metadata, not
authorization to index the blocked preview.

Production builds reject missing origin, HTTP, IP/loopback/internal hosts,
credentials, paths, query strings and fragments. Local test builds alone may use
HTTP loopback. A public preview must be reported as `PUBLIC_PREVIEW_NOT_INDEXABLE`.

## PUBLIC_INDEXABLE — owner approval required

An environment flag alone cannot enable indexing. A separate owner-authorized
content change must supply and review all of the following:

1. Real legal identity, address and registration in `src/model.mjs`; approved
   privacy/terms and final legal/policy page text replacing all drafts.
2. Confirmed legal identity, warranty and personalized-return verification flags;
   `config.publicationReady=true` after all publication inputs are resolved.
3. `src/publication-approval.json` with explicit owner indexing authorization,
   confirmation of publication inputs, and a nonempty approval reference.
   A local visual acceptance does not provide indexing permission.
4. `reviewedContentSha256` binding the final `src/model.mjs`,
   `src/verification.json` and `src/build.mjs` bytes using exported
   `reviewedContentSha256()`. Changes invalidate this approval receipt.
5. Matching `NFC_PUBLICATION_MODE=PUBLIC_INDEXABLE` and HTTPS origin in build and
   runtime, followed by regression and live SEO/browser checks.

Even with an approval receipt, draft legal/policy HTML or metadata blocks the
build. Current approval is false and the required facts remain unconfirmed.

Only localized home, About, catalogue, both products, delivery/payment,
warranty/returns and finalized privacy/terms may become indexable. Forms, contact,
review submission, admin/moderation, APIs, thank-you, health, errors and direct
index.html aliases stay noindex. Headers, HTML robots and sitemap are tested together.

## Caching and notifications

All HTML stays `no-store, private`: the accepted renderer hydrates forms/request
tokens on multiple public pages. APIs and private assets are also no-store.
Successful static `/assets/` responses cache for one hour; robots/sitemap for five
minutes. Unhashed assets are not immutable.

Keep `NFC_TELEGRAM_ENABLED=false`. Production transports remain disabled;
committed orders/reviews and outboxes survive notification unavailability.
Never enable real sends for CI or smoke tests. Set the repository homepage only
after HTTPS verification. Do not create billable resources or change billing.

The [Railway deployment probe](https://docs.railway.com/deployments/healthchecks)
uses Host `healthcheck.railway.app`. Only exact GET/HEAD `/healthz` accepts that
host; public forms, admin and APIs keep their configured Host/Origin checks.
Unavailable migration readiness returns 503; health remains noindex/no-store.
