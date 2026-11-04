# Canonical collaboration and exact-source Pages workflow

Repository: `https://github.com/zaffirax55/nfc-card-website.git`.
Current designer integration branch: `optidigital-3d-preview`; root source and
sole publication workflow: `main`. This NFC-COLLAB-01 decision (2026-11-02)
supersedes the earlier `optidigitalagent` upstream/fork and
`design/nfc-card-v36-2` PR-target directions. Do not create a replacement fork.

## Branches and review

Fetch the relevant refs and record their full SHAs before creating separate
worktrees. Branch designer iterations from `optidigital-3d-preview`; target
that branch in the review. Branch root SEO/technical changes from `main`;
storefront SEO implementations target preview separately. Use `design/<task>`,
`seo/<task>` or `codex/<task>-<role>`. Preserve newer work and dirty checkouts.
Do not reset either branch or merge all designer code into main.

PR evidence includes the target/base SHA, narrow diff, owner direction,
applicable test/build results, limitations and independent review. Visual work
also needs before/after screenshots and existing route/locale, price, media,
order, keyboard and responsive checks. Exact public copy and SEO research come
from ChatGPT. Missing write access means retain a local patch for review.

## Coordinated NFC-COLLAB-01 application order

These are proposed local patches, not already applied remote controls:

1. Review and later integrate the preview patch first: convert
   `publish-optidigital-3d.yml` into validation only, remove Pages jobs from its
   `ci.yml`, and update instructions. Preserve every storefront source file.
2. Review and later integrate the main patch: remove the optional Pages jobs
   from `ci.yml`, make its Release job callable for an exact SHA, and replace
   `fork-pages.yml` with the manual main-only entry plus the artifact guard.
3. Verify both remote workflow inventories after integration. Until both
   patches are applied, competing old publishers remain possible. Previously
   queued/in-progress runs use their old workflow bytes; a separately authorized
   release must wait for them to finish or be cancelled before dispatch.
4. Resolve existing Release/manifest/guard failures in a separately approved
   task without weakening validation. This local patch does not make them green.

Commit/push/PR/merge, workflow runs and deployment are excluded from
NFC-COLLAB-01. Neither step 1 nor step 2 authorizes a release.

## Later explicit owner-authorized publication

Only dispatch `main:.github/workflows/fork-pages.yml` on `main`, with the
owner-approved full lowercase 40-character `storefront_sha`. A branch name or
short SHA is rejected. Capture `github.sha` and `github.workflow_sha`; require
them to match, checkout both sources by full SHA and verify their resolutions.
Do not build a moving preview branch. Ordinary pushes/PRs only validate.

The workflow calls the existing complete Release validation for both source
SHAs. Storefront validation retains its production-policy tests and verified
gateway build gate; root validation retains its synthetic-origin preview build.
The separate assembled preview keeps the existing PUBLIC_PREVIEW behavior.
Manifest/history guards, full tests and post-build source checks remain required.
A failure skips artifact upload and deployment; a green preview is insufficient.

After successful validation, build the root with locked npm dependencies and
the committed GLB (no unpinned model regeneration or source mutation), build the
explicit designer preview, run existing contract/transport/static checks, and
mount it under `site/optidigital-3d`. Retain media, storefront paths and the
existing URL rewrite. The final artifact guard requires noindex on every HTML
page, local HTML URL targets and all 12 designer models. Both source trees must
still match their checked-out commits.

`site/PUBLICATION_IDENTITY.json` records main/storefront/workflow SHAs and a
payload digest excluding that identity file. The separate
`pages-source-and-artifact-identity` Actions artifact records checks and a full
file manifest/tree digest including the identity file. The digest is a content
tree identity, not a Git SHA or an uploaded tar checksum. Both uploads depend
on final validation. Deployment consumes that run's Pages artifact.

The single workflow-level `nfc-github-pages` concurrency boundary covers the
whole publication. Only the deploy job has `pages: write` and `id-token: write`;
existing `github-pages` environment protections remain in place.

No publication setting, new domain or production behavior is introduced.
Full Actions execution and a later live identity check require their own
release authorization. Existing historical release statements do not prove
this proposed artifact is deployed. Keep source manifests and private data
separate from generated QA evidence; never test with real production submissions.
