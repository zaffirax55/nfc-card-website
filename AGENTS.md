# Antonov Digital NFC Card — repository workflow

Canonical repository: `https://github.com/zaffirax55/nfc-card-website.git`.
NFC-COLLAB-01 (2026-11-02) supersedes the earlier upstream repository,
automatic main-release and designer-branch publication instructions.

## Scope and roles

ChatGPT owns SEO research, strategy and exact public copy. Codex implements
supplied decisions and verifies them technically. Preserve design, product
facts, prices, URLs/locales, order behavior, server-authoritative pricing and
the durable lead boundary. Preserve all current designer work. Keep Rozetka
untouched; do not create a second SEO repository or initialize `.seo` here.
Unknown domain, live artifact identity and search/business outcomes stay unknown.

## Isolated collaboration

- Fetch and record the current `main` and `optidigital-3d-preview` full SHAs.
  Preserve dirty work; use a separate branch/worktree instead of resetting it.
- Start designer iterations from refreshed `optidigital-3d-preview` in
  `design/<task>` or `codex/<task>-design`. The storefront lives in `src/v36_2`
  on that branch. Designer PRs target `optidigital-3d-preview`.
- Start SEO/technical work from the approved source for the affected files:
  `main` for the root application/workflows; `optidigital-3d-preview` for the
  storefront. Use `seo/<task>` or `codex/<task>-seo` and state the target branch.
- Integrate only reviewed scoped changes into their intended target. Do not
  merge the entire designer tree into main, replace preview with main, rewrite
  history, force push or overwrite someone else's work.
- Run applicable deterministic/build/browser checks; report actual results and
  limitations. Independent acceptance is required before a later release.
  Refresh source manifests only after approved source review and the existing
  guards; do not suppress a failing guard or seal unrelated unreviewed drift.
- Local work does not imply permission to commit, push, open/merge PRs or release.
  Follow the current task's explicit authorization. NFC-COLLAB-01 is local only.

## Publication boundary

Only `main:.github/workflows/fork-pages.yml` may publish Pages. Pushes, PRs and
designer workflows validate without deployment. `ci.yml` is validation only.
See `docs/designer-handoff/GITHUB_WORKFLOW.md` for coordinated patch order.

A later owner-authorized release must explicitly select main and supply one
full storefront commit SHA. Record the main/workflow SHA, verify both resolved
checkouts, pass complete Release validation for both exact sources and all
preview/final artifact checks, then retain the source/artifact checksums.
No failed Release validation may be bypassed by a green preview build.

Keep the current `site/` plus `site/optidigital-3d/` layout, media and URLs,
`PUBLIC_PREVIEW` and noindex behavior. Use the single `nfc-github-pages`
publication concurrency boundary. Only the deploy job gets Pages/OIDC write.
Changing hosting, repository settings, environment protections, DNS, secrets,
Railway or analytics needs its own authorized task. No future domain is assumed.

Never send real customer/Telegram messages, submit production forms, publish
private records, change billing or create infrastructure during local QA.
Keep generated output, local synthetic state, PII, credentials and archives out
of Git. Report exact blockers; local or CI success is not proof of live identity.
