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

## Run it locally

```bash
git clone https://github.com/anothergeorgecoldham/ship-with-ai.git
cd ship-with-ai
npm install
npm run dev
```

Then open the printed local URL. `npm run build` produces the static site in `dist/`;
`npm run preview` serves that build locally.

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
