# Ship with AI

Companion site and live demo repository for **AI Genius — Season 5, Episode 3: "Ship with AI:
Review, Secure, and Deploy with Confidence."**

The repository demonstrates this lifecycle:

```text
Issue → Copilot drafts a PR → Copilot Code Review → Agent Merge →
GitHub Actions security gate → Dependabot remediation → GitHub Pages
```

Its security theme is **OWASP Top 10:2025 A03 — Software Supply Chain Failures**. The recordable
start state intentionally contains an outdated dependency, an inactive workflow with unsafe
defaults, and a fake secret-scanning fixture.

The versioned release contract is stored in [`demo-kit.json`](./demo-kit.json). Maintainers publish
new template versions using [`MAINTAINER-RELEASE.md`](./MAINTAINER-RELEASE.md).

## Choose your path

| I want to… | Start here |
|---|---|
| Follow the session | [`AUDIENCE-WALKTHROUGH.md`](./AUDIENCE-WALKTHROUGH.md) |
| Set up and rehearse the full demonstration | [`MANUAL-DEMO-GUIDE.md`](./MANUAL-DEMO-GUIDE.md) |
| Present or record after rehearsing | [`PRESENTER-RUNSHEET.md`](./PRESENTER-RUNSHEET.md) |
| Understand the security lesson | [`src/pages/secure-supply-chain.astro`](./src/pages/secure-supply-chain.astro) |
| Explore the implementation | [`src/pages/pipeline.astro`](./src/pages/pipeline.astro) |

`RUNSHEET.md` remains as a compatibility pointer to the two role-specific guides.

## Run locally

Use Node.js 24, as specified by `.nvmrc`.

```bash
git clone https://github.com/anothergeorgecoldham/ship-with-ai.git
cd ship-with-ai
npm ci
npm run dev
```

The start state contains deliberate training findings. Local execution is suitable for learning;
do not deploy it as a production application. `npm run build` creates the static site in `dist/`.

## Repository structure

```text
src/
  pages/                         learning content
  components/FeedbackWidget.astro
  lib/                           feedback logic and demo-only config
scripts/
  bootstrap-demo.mjs             guarded repository configuration
  preflight-demo.mjs             recording-readiness checks
  check-audit-state.mjs          deterministic dependency policy
.github/
  demo/deploy.yml                inactive review fixture
  workflows/initialize-demo.yml  one-time "before" deployment
  workflows/pull-request-checks.yml
  workflows/dependency-policy.yml
  dependabot.yml
```

## Preparing a demonstration repository

Create a disposable repository from the released template. Preview bootstrap changes:

```bash
npm run demo:bootstrap -- --repo <owner>/<repository>
```

Apply them only after confirming the target:

```bash
npm run demo:bootstrap -- --repo <owner>/<repository> --apply
```

Before recording, manually confirm the Copilot coding agent and Agent Merge are available, then
run:

```bash
npm run demo:preflight -- --repo <owner>/<repository> --confirm-copilot
```

Do not start until the final line is `READY TO RECORD`. The canonical source repository is
protected from bootstrap writes unless `--allow-canonical` is supplied explicitly.
