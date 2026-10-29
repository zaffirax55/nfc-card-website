# Production-base update

Read [CURRENT_BASE_2026-10-29.md](CURRENT_BASE_2026-10-29.md). New design work starts from production v36.2 `main` (`d0e79aa`), not the old handoff branch. The old PR base instruction below is superseded. The fork owner has read-only access to `optidigitalagent`; push to the existing fork design branch and propose upstream changes only after design review.

# Designer branch and PR workflow

Production repository: https://github.com/optidigitalagent/nfc-card-website . Current design branch: `design/visual-refresh-2026-10-28` in https://github.com/zaffirax55/nfc-card-website . Start from the merged production base; verify `git rev-parse HEAD`.

Create a child branch for each design iteration:

```sh
git switch -c design/your-visual-iteration
```

If you have repository write access, push that child branch normally and open a reviewed PR against the current production code after owner visual approval, with before/after screenshots, changed-file list, owner direction, test evidence, content-count/route/price/media non-regression and known limits. No force push. If you do not have write access, use a fork and fetch the exact current upstream production main and integrate it into the fork design branch. No fork or account access is created by this handoff. The designer's GitHub username and collaborator permissions are not known or verified.

Read root `AGENTS.md` together with the explicit designer-only override and this handoff. Earlier default main/deployment directions do not authorize release of this branch. The owner permits source-branch transfer only.

At transfer preflight, existing `.github/workflows/ci.yml` pushes were restricted to `main` and `release/public-v19` (plusv*tags); a push to this designer branch does **not** automatically run that workflow. Pages build is separately gated to `refs/heads/main` and the Pages-enabled variable. Do not claim a green GitHub Actions run for a feature push unless an actual run exists. PR validation may run, but must never merge or trigger deployment without explicit release approval. Do not change workflows, branch protection, default branch, Pages settings or Railway.

Before each PR: build preview/SEO fixture, contract+transport+static checks, real local browser screenshots in all 3languages, narrow widths/native 200%zoom/keyboard/reduced motion, and independent review. Keep generated output, local synthetic state, logs, PII, `.env`, archives, node_modules and credentials out of Git. Public evidence must be sanitized; never publish private owner/CRM logs or real form submissions.

A future production release requires its own owner authorization and production gates. Do not merge to main, create release tags or publish from the designer branch.
