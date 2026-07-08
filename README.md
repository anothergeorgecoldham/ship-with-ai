# Ship with AI

Companion site + live demo repo for **AI Genius — Season 5, Episode 3: "Ship with AI: Review,
Secure, and Deploy with Confidence."**

This repo does two things at once:

1. **Publishes the learning content** — a small Astro site covering the AI-assisted ship
   pipeline: issue → Copilot-drafted PR → Copilot Code Review → Agent Merge → GitHub Actions
   (build + supply-chain security) → GitHub Pages.
2. **Is the demo subject** — the exact code, dependencies, and workflow reviewed, secured, and
   deployed live on stream.

The security thread running through the demo is **OWASP Top 10:2025 A03 — Software Supply Chain
Failures**: an outdated dependency, an unpinned CI/CD Action with an over-broad token, and a
committed (fake) secret. See [`RUNSHEET.md`](./RUNSHEET.md) for the full walkthrough and
[`src/pages/secure-supply-chain.astro`](./src/pages/secure-supply-chain.astro) for the plain-English
explanation.

## Prerequisites (set these up before you record)

Learned the hard way while standing this repo up — none of this is obvious from the repo alone,
and if any one piece is missing the relevant beat just silently won't fire.

### Account / license

- **An active Copilot license that includes code review + the coding agent** — Copilot Pro, Pro+,
  Max, Business, or Enterprise. Copilot Free does not expose these features at all.
- On your profile → **Settings → Copilot → Features**, confirm these two are **Enabled**:
  - **Copilot code review** — "Use Copilot to review your code and generate pull request summaries."
  - **Copilot cloud agent** — "Delegate tasks to Copilot cloud agent in repositories where it is
    enabled." (This is what backs the coding agent and Agent Merge.)
  - If your seat comes from an org/enterprise, these may show a shield icon meaning the org
    enforces them — that's fine, it just means you can't turn them off, not that they're broken.

### Repo settings (owner/admin access required)

- **Settings → Rules → Rulesets → New ruleset** — add the **"Automatically request Copilot code
  review"** rule targeting your default branch. Without this, Copilot never reviews a PR
  automatically; you'd have to request it by hand every time.
- **Settings → General → Pull Requests → Allow auto-merge** — must be checked, or Agent Merge has
  nothing to merge into even when checks are green. (Also settable via API:
  `gh api -X PATCH /repos/<owner>/<repo> -f allow_auto_merge=true`.)
- **Settings → Pages → Source: GitHub Actions** — required before `deploy.yml` can publish
  anything; if you skip this, every push to `main` fails at the `deploy` job with a 404-style
  error, even though `build` succeeds. Can also be set via API:
  `gh api -X POST /repos/<owner>/<repo>/pages -f build_type=workflow`.
- **Settings → Code security** — turn on Dependabot alerts, Dependabot security updates,
  dependency review, code scanning, and secret scanning with push protection. These are what
  actually surface the seeded issues in `RUNSHEET.md` §5.1 and §5.3.

### Local `gh`/git auth gotcha

If `git push` is rejected with *"refusing to allow an OAuth App to create or update workflow
`.github/workflows/...` without `workflow` scope"*, your active `gh`/git credential doesn't have
the `workflow` OAuth scope. Either `gh auth refresh -h github.com -s workflow`, or push using a
credential/token that already has it (e.g. `gh auth token` from an account with `workflow` in its
scopes, passed via `git -c http.extraHeader=...`).

## Run it locally

```bash
git clone https://github.com/anothergeorgecoldham/ship-with-ai.git
cd ship-with-ai
npm install
npm run dev
```

Then open the printed local URL. `npm run build` produces the static site in `dist/`;
`npm run preview` serves that build locally — the safest way to look at the site without
touching the live repo, its workflow runs, or any seeded issue.

## Structure

```
src/
  pages/            content pages (home, pipeline, one per capability, secure-supply-chain, DIY)
  components/
    FeedbackWidget.astro   the one interactive feature — questions/feedback, client-side only
  lib/                widget logic (submit handler + a demo-only fake config)
astro.config.mjs      static output, `site`/`base` set for GitHub Pages project-page hosting
.github/
  workflows/deploy.yml     build → security gate → deploy to Pages
  dependabot.yml           npm + GitHub Actions version updates
  ISSUE_TEMPLATE/feature-request.md   the issue used to kick off the live demo
```

## Deploying

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds the site and deploys it
to GitHub Pages (repo setting: **Pages → Source: GitHub Actions**). The workflow ships with two
intentionally seeded CI/CD issues used in the live demo — see `RUNSHEET.md`.

## Re-delivering this demo

If you're presenting this session in another language or region, `RUNSHEET.md` has the full
beat-by-beat script, including the exact issue text to file and what each tool should flag.
Nothing in this repo needs to be pre-fixed — the seeded issues are meant to still be present when
you start the recording.
