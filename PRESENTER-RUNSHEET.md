# Presenter runsheet — "Ship with AI"

This is the operational guide for re-delivering AI Genius S5E3 in another language or region.
Audience members should use [`AUDIENCE-WALKTHROUGH.md`](./AUDIENCE-WALKTHROUGH.md).
The release contract is recorded in `demo-kit.json`; do not change its versions in a presenter
repository.

First-time presenters must rehearse with
[`MANUAL-DEMO-GUIDE.md`](./MANUAL-DEMO-GUIDE.md), which includes every setup command and UI action
from template creation through the final deployment. This runsheet is the condensed recording
view.

## Delivery contract

- **Target duration:** 10–12 minutes.
- **Audience story:** issue → AI draft → AI review → automated fix → security gate → deployment.
- **Start only when:** `npm run demo:preflight -- --repo <owner>/<repo> --confirm-copilot` ends
  with `READY TO RECORD`.
- **Do not pre-fix:** the inactive production workflow or `marked@0.3.19`.
- **Optional:** show the demo secret fixture only when Generic patterns is available.

## Translation guidance

Translate the spoken explanation, issue title, and lesson content. Do not translate filenames,
commands, workflow names, setting names, dependency names, or expected status labels. Keep each
talking point to one sentence so subtitles and interpretation remain aligned with the screen.

## Prepare at least one day before

1. Create a new public repository from the released demo template and clone it.
2. Run `npm ci`.
3. Preview bootstrap changes:

   ```bash
   npm run demo:bootstrap -- --repo <owner>/<repo>
   ```

4. Apply the configuration and initialize the "before" site:

   ```bash
   npm run demo:bootstrap -- --repo <owner>/<repo> --apply
   ```

5. Confirm the active default-branch ruleset requires `build` and `audit` from GitHub Actions.
   In a separate rehearsal, confirm **Agent merge** appears in the **Create PR** dropdown of a
   feature implementation session with changes. This is an app check, not a repository setting
   or a check of a Dependabot review session.
6. Wait for the `marked` Dependabot PR. If Generic patterns is available, also wait for the
   optional demo secret-scanning alert.
7. Run preflight. Resolve every failure before recording.

Bootstrap configures Pages, CodeQL, Dependabot, secret scanning, push protection, auto-merge,
required `build` and `audit` checks with zero required human approvals, and automatic Copilot
review. It attempts to enable Generic patterns, but that optional setting is not
available to every account. Repository settings are not inherited from a GitHub template.

## Final check before recording

- The "before" Pages URL loads.
- The feature issue has not been filed.
- `.github/workflows/deploy.yml` does not exist yet.
- Exactly one Dependabot PR is open, for `marked`.
- Both `build` and `audit` are required; `audit` runs even on feature-only PRs.
- The implementation-session **Create PR → Agent merge** route has been rehearsed. Do not
  confuse a **Submit review** session or GitHub's **Enable auto-merge** with that route.
- Any Generic-pattern preflight message is informational, not blocking.
- No unrelated browser tabs, notifications, or credentials are visible.
- Preflight reports `READY TO RECORD`.

## Beat 0 — Issue → PR

**Time:** 2 minutes. Open **New issue** and select the feature-request template. Translate only the
lesson wording if required; preserve filenames and acceptance criteria.

> **Title:** Add Episode 3 lesson page / update the feedback widget
>
> Add a short lesson page (or update an existing one) covering the Episode 3 talking point. Add a
> topic field to the feedback widget and persist it with each submission.
>
> Activate `.github/demo/deploy.yml` as `.github/workflows/deploy.yml` without changing the
> provided workflow. Acceptance criteria: new/updated page renders under the site nav; feedback
> widget captures the topic and renders a submission end-to-end; `npm run build` succeeds.

Creating the issue alone does not create a PR. Use this sequence:

1. Create the issue, then open it in the Copilot app's **My work** and select **New session**.
   Use a local worktree implementation session; do not also assign the issue to the cloud agent.
2. Ask Copilot to implement the issue, preserve the seeded review findings, and stop for diff
   inspection without committing, pushing, or creating/merging a PR.
3. Inspect the diff. If `package.json` or `package-lock.json` changed, have it revert those files.
4. Open the **Create PR** dropdown and show **Agent merge** is available, but leave **Create PR**
   selected. Click the main **Create PR** button to publish the non-draft feature PR, linking
   the issue with `Closes #<issue-number>`.
5. Keep this original implementation session open through Beats 1 and 2.

Cloud assignment can also generate a PR, but it is an alternative path. Opening that PR in a
new review session may show **Submit review**, not the authoring controls used in this walkthrough.

**Talking point:** *"AI wrote it fast, and even wired the pipeline — but would you ship it as-is?"*

## Beat 1 — GitHub Copilot Code Review

**Time:** 2 minutes. Open the Copilot-authored PR and show that the build check is green while the
raw dependency audit in the build job is informational. The separate required `audit` check
enforces the expected demo state rather than requiring remediation before the feature merge.

The activated workflow and updated feedback handler are both in the PR diff. Copilot should leave
inline comments calling out, wherever they're still present:

- Actions pinned by tags rather than full commit SHAs (`.github/workflows/deploy.yml`)
- `permissions: write-all` instead of least privilege (`.github/workflows/deploy.yml`)
- No input validation in the feedback submit handler (`src/lib/feedback.js`)

### Call out the finding scanners cannot catch

In the review comments, pause on the missing input-validation finding: the feedback widget accepts
empty values and has no length cap. Contrast it with the workflow and dependency findings.

Say: *"Notice this one. No scanner would have found it — it isn't a vulnerability, it's just not
very good code. That's the difference between a scanner and a reviewer."*

Preflight verifies that this finding remains in the start state. If that check fails, restore the
seed before recording; without it, Code Review and the security beat tell the same story.

**Talking point:** *"The AI as your reviewer — it reads intent, not just signatures."*

## Beat 2 — Agent Merge ⭐

**Time:** 2 minutes.

1. Return to the **original feature implementation session**, not a new PR-review session.
2. Ask Copilot to address the review findings: pin Actions to SHAs, scope permissions, and add
   validation. Inspect the fixes and have it commit/push them to the same PR, without changing
   dependencies.
3. Open the PR-action dropdown, select **Agent merge**, and show the button label changing.
4. Click the main **Agent merge** button to start it for the linked feature PR.
5. Show its permitted actions. Allow review/CI/conflict fixes as needed, and permit **Merge pull
   request** only when ready to land the inspected changes. If merge permission is already on,
   complete the inspection before starting.
6. Show the agent checking the PR, then the PR's **Merged** state after required checks pass.

**Say explicitly:** *"This is Agent Merge in the Copilot app, not GitHub's Enable auto-merge.
GitHub enforces the checks; the agent manages the permitted follow-up work and merge."*

Do not depend on a visible waiting window. Agent Merge can act when checks are already green,
and the merge may happen quickly. Automatic Copilot review is independent and requires no human
approval. A manual merge or native auto-merge is not a substitute for showing this beat.

**Talking point:** *"Review findings become verified changes, not another manual handoff."*

## Beat 3 — GitHub Actions (CI/CD)

**Time:** 1 minute.

Show the now-hardened `deploy.yml` run stop at the `npm audit` gate. After the Dependabot PR is
merged in Beat 4, the next run will complete.

### Show the workflow, don't just run it

Before opening the failed production run, open `.github/workflows/pull-request-checks.yml`. Point
at only:

- `on: pull_request` — *"This runs on every pull request."*
- `npm audit --audit-level=high` — *"This reports dependency risk before merge; it is informational
  in the seeded state so we can demonstrate the production gate."*
- `permissions: contents: read` — *"This uses a least-privilege token, one of the things Copilot
  told us to fix in the production workflow."*

Then open the hardened `.github/workflows/deploy.yml` and point at
`node scripts/check-audit-state.mjs clean`: *"This is the enforcement gate. It blocks deployment
until the audit is clean."*

Return to **Actions**. Do not read either file line by line.

Say: *"These two short workflows are the pipeline: pull requests are checked, and only a clean
`main` can deploy. You set it up once, and every change from now on goes through it."*

**Talking point:** *"The pipeline that builds and ships your code needs the same scrutiny as the
code itself."*

## Beat 4 — AI-assisted security review

**Time:** 2 minutes. Show:

- **Dependabot alert** on `marked@0.3.19` (`package.json`) — genuinely used by the feedback widget
  and affected by known regular-expression denial-of-service vulnerabilities.
- **Required settings stop:** open **Settings → Security and quality → Advanced Security** and show
  **Secret Protection** plus enabled **Push protection**. Explain that supported provider secrets
  are detected and blocked before push.
- **Optional:** if Generic patterns is available, show secret scanning flagging the fake bearer
  header in `src/lib/demo-secret-fixture.js`. It is a non-functional training value.

Open the prepared `marked` Dependabot PR, show its green checks, inspect the diff, and merge it
on GitHub. Then open the new **Build and deploy** run. This is the dependency-remediation step;
Agent Merge was demonstrated on the feature PR in Beat 2. Do not assume a Dependabot session
with **Submit review** exposes Agent Merge. Only use that alternative if separately rehearsed.

**Talking point:** *"This is the supply-chain layer — distinct from Beat 1's code review."*

## Beat 5 — End-to-end lifecycle automation

**Time:** 1–2 minutes. Show the successful build → audit → deploy run, then open the Pages URL and
submit feedback on the updated page.

Zoom out to the architecture slide:

```
Issue → Copilot drafts PR → Copilot Code Review → Agent Merge →
GitHub Actions (build + supply-chain security + deploy) → GitHub Pages
```

**Talking point:** *"Set it up once; every future change keeps the supply chain healthy."*

**Payoff:** *"The lesson you can read was shipped through the pipeline you just watched."*

## Expected evidence

| Seeded issue | Where | Caught by |
|---|---|---|
| Outdated `marked` dependency | `package.json` | Dependabot |
| Unpinned Actions | `.github/workflows/deploy.yml` | Copilot Code Review |
| Over-broad `permissions: write-all` | `.github/workflows/deploy.yml` | Copilot Code Review |
| Supported provider secrets | Repository pushes | Secret Protection and Push protection |
| Optional fake bearer-header fixture | `src/lib/demo-secret-fixture.js` | Generic secret scanning, when available |
| Missing input validation | `src/lib/feedback.js` | Copilot Code Review |

`marked` upgrades address its dependency advisories. Sanitizing untrusted rendered HTML is a
separate application-security concern and is not part of the core recording.

## Recovery paths

| Situation | Response |
|---|---|
| Copilot changes dependencies | Ask it to revert `package.json` and `package-lock.json` before review |
| Expected review comment is missing | Request one re-review; then show the seeded line and explain the expected finding |
| Feature PR check is red | Stop and diagnose; do not bypass required build checks |
| Dependabot PR is missing | Stop and rerun preflight after GitHub finishes scanning |
| Generic patterns or its alert is unavailable | Continue and omit the optional secret-scanning beat |
| Toolbar shows **Submit review** | Return to the original feature implementation session; do not use the Dependabot review session to demonstrate the authoring controls |
| Empty session has no **Create PR** | Implement the feature first, then inspect the PR-action dropdown once changes are ready |
| Agent Merge is unavailable | Use the prepared fallback recording; do not silently substitute a manual merge |
| Final deployment fails | Keep the failed run visible and switch to the prepared successful-run recording |

Do not reset, repair, or improvise dependency changes while recording. Use a fresh template
repository for another take.
