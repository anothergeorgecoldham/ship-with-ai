# Ship with AI — audience walkthrough

Use this page to follow the demonstration without needing to configure a repository.

## The story in six steps

| Stage | What you see | Why it matters |
|---|---|---|
| 1. Issue | A short description and acceptance criteria | AI starts from a reviewable statement of intent |
| 2. Draft | Copilot creates a branch and pull request | Implementation is visible before it reaches production |
| 3. Review | Copilot comments on code and workflow risks | AI-generated code receives independent scrutiny |
| 4. Fix | Agent Merge applies fixes after checks | Findings become tested changes instead of manual follow-up |
| 5. Gate | The deployment stops on a vulnerable dependency | Security policy is enforced even when the application builds |
| 6. Deploy | Dependabot fixes the dependency and Pages updates | A verified change moves from idea to a live result |

## Follow along during the demonstration

- [ ] The issue explains what success means.
- [ ] The pull request shows exactly what the AI changed.
- [ ] Review identifies unsafe permissions, unpinned Actions, or missing validation.
- [ ] Automated checks stay green before the feature is merged.
- [ ] The production pipeline blocks the vulnerable dependency.
- [ ] The dependency update clears the gate.
- [ ] The final page is deployed successfully.

## Three separate responsibilities

- **Copilot coding agent** implements the requested change.
- **Copilot Code Review and security tools** look for different classes of risk.
- **GitHub Actions and Agent Merge** enforce the result and move verified changes forward.

No single AI decision is treated as sufficient to ship.

Some presenters may also show Generic secret scanning. That is an optional extension because the
setting is not available to every account; it is not required for the six-stage lifecycle.
Every demonstration still shows where **Secret Protection** and **Push protection** are configured
and explains how they detect supported provider secrets and block them before push.

## Why the deployment fails once

The start state deliberately uses `marked@0.3.19`, which has known regular-expression
denial-of-service advisories. The application can build, but the production dependency policy
rejects it. Dependabot proposes the upgrade, the dependency check verifies it, and only then can
deployment continue.

The dependency upgrade does not sanitize arbitrary HTML. Output sanitization is a separate
application-security responsibility.

## Explore after the session

- [`src/pages/pipeline.astro`](./src/pages/pipeline.astro) — the complete lifecycle.
- [`src/pages/secure-supply-chain.astro`](./src/pages/secure-supply-chain.astro) — the security
  concepts in plain language.
- [`src/pages/diy.astro`](./src/pages/diy.astro) — safe local exploration and further resources.

This repository contains deliberate training findings. Run it locally for learning; do not use the
start state as a production template.

## Takeaway

AI can accelerate implementation, review, remediation, and delivery. Reliable shipping comes from
making those capabilities independent, visible, and policy-gated.
