# RUNSHEET — "Ship with AI" live demo

For anyone re-delivering AI Genius S5E3 in another language/region. This walks through the five
capability beats plus Beat 0, using the issues already seeded in this repo. **Do not pre-fix
anything below** — the demo depends on these being present when you start.

## Before you go live

- Repo is **public**, with Copilot Code Review and Agent Merge enabled (Settings → Copilot).
- Code scanning, Dependabot alerts, dependency review, and secret scanning + push protection are
  all enabled (Settings → Code security).
- Pages → Source is set to **GitHub Actions**.
- Confirm the site is already deployed once (so you have a "before" URL to contrast with the
  "after" at the end).

## Beat 0 — Issue → PR

File this issue (also available as the default template under **New issue**):

> **Title:** Add Episode 3 lesson page / update the feedback widget
>
> Add a short lesson page (or update an existing one) covering the Episode 3 talking point, and
> tighten the feedback widget's markup so it reads cleanly next to the new content.
>
> Acceptance criteria: new/updated page renders under the site nav; feedback widget still submits
> and renders a submission end-to-end; `npm run build` succeeds locally.

Assign it to the **Copilot coding agent**. It drafts the implementation and opens a PR.

**Talking point:** *"AI wrote it fast, and even wired the pipeline — but would you ship it as-is?"*

## Beat 1 — GitHub Copilot Code Review

Copilot reviews the PR and should leave inline comments calling out, wherever they're still
present in the diff:

- `withastro/action@v3` pinned by tag, not a full commit SHA (`.github/workflows/deploy.yml`)
- `permissions: write-all` instead of least privilege (`.github/workflows/deploy.yml`)
- No input validation in the feedback submit handler (`src/lib/feedback.js`)

**Talking point:** *"The AI as your reviewer — it reads intent, not just signatures."*

## Beat 2 — Agent Merge ⭐

Agent Merge pushes fixes for the Beat 1 findings — pin the Action to a SHA, scope the
`permissions` block, add validation — and merges once checks are green.

Separately, once Dependabot opens its version-bump PR for `marked` (Beat 4), Agent Merge merges
that too, the same way.

**Talking point:** *"Agentic supply-chain hygiene — nobody clicked merge on that dependency bump."*

## Beat 3 — GitHub Actions (CI/CD)

Show the now-hardened `deploy.yml` run: build → `npm audit` gate → deploy to Pages.

**Talking point:** *"The pipeline that builds and ships your code needs the same scrutiny as the
code itself."*

## Beat 4 — AI-assisted security review

Point out, in whichever order they've actually surfaced:

- **Dependabot alert** on `marked@0.3.19` (`package.json`) — genuinely used by the feedback widget
  to render submissions; old enough to predate output sanitisation.
- **Secret scanning** flags the fake token in `src/lib/analytics-config.js` — clearly commented as
  a demo placeholder, never a real credential.

**Talking point:** *"This is the supply-chain layer — distinct from Beat 1's code review."*

## Beat 5 — End-to-end lifecycle automation

Zoom out to the architecture slide:

```
Issue → Copilot drafts PR → Copilot Code Review → Agent Merge →
GitHub Actions (build + supply-chain security + deploy) → GitHub Pages
```

**Talking point:** *"Set it up once; every future change keeps the supply chain healthy."*

## Payoff

Visit the deployed site's new/updated page live: *"The lesson you can read was just shipped
through this exact pipeline."*

## Optional beats (skip to stay tight)

- **§5.4 — Missing SRI on a third-party CDN script.** If you add a `<script src="https://cdn…">`
  tag without an `integrity`/`crossorigin` attribute, Copilot Code Review should flag it as a
  second supply-chain beat.
- **§5.6 — XSS via the outdated Markdown renderer.** Before the Beat 2 fix, submitting
  `<img src=x onerror="alert('xss')">` in the feedback widget executes in the browser, because
  `marked@0.3.19` doesn't sanitise. Both Copilot Code Review and CodeQL should flag it. Fix is
  escaping/sanitising the rendered output.

## What each tool is expected to catch

| Seeded issue | Where | Caught by |
|---|---|---|
| Outdated `marked` dependency | `package.json` | Dependabot |
| Unpinned third-party Action | `.github/workflows/deploy.yml` | Copilot Code Review |
| Over-broad `permissions: write-all` | `.github/workflows/deploy.yml` | Copilot Code Review |
| Fake committed token | `src/lib/analytics-config.js` | Secret scanning / push protection |
| Missing input validation | `src/lib/feedback.js` | Copilot Code Review |
