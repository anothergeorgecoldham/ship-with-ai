# Complete manual demonstration guide

This guide takes a presenter from a fresh template repository to the final deployed site. Follow
it once as a rehearsal before recording. Keep
[`PRESENTER-RUNSHEET.md`](./PRESENTER-RUNSHEET.md) open during the recording for the shorter script
and talking points.

GitHub labels can move as the product changes. If a label differs slightly, use the linked GitHub
documentation and preserve the outcome described under **Expected result**.

## 1. Confirm prerequisites

You need:

- A GitHub account that can create public repositories.
- A Copilot plan that includes Copilot coding agent and Copilot Code Review.
- Access to the [GitHub Copilot app](https://github.com/copilot).
- Git, [Node.js 24](https://nodejs.org/) to match CI, npm, and
  [GitHub CLI](https://cli.github.com/) installed.
- Repository administrator permission for the disposable demonstration repository.

Sign in and verify the tools:

```bash
node --version
npm --version
gh auth status
```

Node `22.12.0` is the enforced minimum; Node 24 is recommended. If GitHub CLI reports missing
repository or workflow access,
refresh its authorization:

```bash
gh auth refresh -h github.com -s repo,workflow,read:org
```

Do not use the canonical `anothergeorgecoldham/ship-with-ai` repository for a rehearsal or
recording.

## 2. Create a repository from the template

1. Open <https://github.com/anothergeorgecoldham/ship-with-ai>.
2. Above the file list, select **Use this template**.
3. Select **Create a new repository**.
4. Select your account or presenting organization as **Owner**.
5. Enter a unique name, for example `ship-with-ai-fr-demo`.
6. Select **Public**.
7. Leave **Include all branches** cleared.
8. Select **Create repository**.
9. Wait for the new repository page to load.

**Expected result:** the new repository contains one initial commit on `main`. It is independent
of the source repository and is not a fork.

GitHub reference:
[Creating a repository from a template](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-repository-from-a-template).

## 3. Clone and install the start state

Replace both placeholders below:

```bash
gh repo clone <owner>/<repository>
cd <repository>
npm ci
```

Do not run `npm audit fix`, update dependencies, or copy `.github/demo/deploy.yml` yet. The start
state is intentionally vulnerable.

**Expected result:** installation completes and reports the deliberate `marked` finding.

## 4. Configure the disposable repository

First preview what bootstrap will change:

```bash
npm run demo:bootstrap -- --repo <owner>/<repository>
```

Read the target repository printed on the first line. If it is correct, apply the configuration:

```bash
npm run demo:bootstrap -- --repo <owner>/<repository> --apply
```

Bootstrap enables:

- auto-merge;
- a default-branch ruleset requiring `build` and `audit` from GitHub Actions, with zero required
  approvals, no bypass actors, and deletion and force-push protection;
- Dependabot alerts and security updates;
- secret scanning and push protection;
- Generic patterns when that optional setting is available;
- CodeQL default setup;
- automatic Copilot Code Review;
- GitHub Pages using GitHub Actions;
- the one-time **Initialize demo site** workflow.

**Expected result:** bootstrap ends successfully and prints the initialization workflow URL.

## 5. Confirm GitHub settings manually

Use these checks even though bootstrap configures them. They catch licensing and policy
restrictions that an API response cannot prove.

### Copilot features

1. Open your GitHub profile **Settings**.
2. Open **Copilot**, then **Features**.
3. Confirm **Copilot code review** is enabled.
4. Confirm **Copilot cloud agent** or **Coding agent** is enabled.
5. If an organization supplies the license, a shield icon may indicate an enforced setting.

### Repository behavior

1. Open the disposable repository.
2. Select **Settings**.
3. Under **General → Pull Requests**, confirm **Allow auto-merge** is enabled.
4. Under **Rules → Rulesets**, open **Automatic Copilot code review** and confirm it is active for
   the default branch.
5. Under **Pages**, confirm **Source** is **GitHub Actions**.
6. Under **Security** or **Security and quality**, confirm Dependabot, code scanning, secret
   scanning, and push protection are enabled.
7. Under **Advanced Security → Secret Protection**, look for **Generic patterns**. Enable it if it
   is available. If it is not shown, continue without the optional secret-scanning beat.

### Branch rules and auto-merge

Configure each repository created from the template explicitly; template rulesets and settings
are not assumed to carry over. Bootstrap creates or updates the following ruleset. Under
**Settings → Rules → Rulesets**, confirm it matches:

| Setting | Value |
|---|---|
| Name | `Require build and audit before merge` |
| Enforcement status | **Active** |
| Target branches | **Default branch** |
| Bypass list | Empty |
| Restrict deletions | Enabled |
| Block force pushes | Enabled |
| Require a pull request before merging | Enabled |
| Required approvals | `0` |
| Require code owner review / approval of the most recent push | Disabled |
| Require conversation resolution | Disabled |
| Require status checks to pass | Enabled |
| Required checks | `build` and `audit`, sourced from **GitHub Actions** |
| Require branches to be up to date before merging | Disabled |

If it is missing or incorrect, rerun bootstrap with `--apply` (add `--skip-deploy` to avoid
reinitializing the site), or create/update it manually. If the manual check picker does not list
`build` and `audit`, open a setup PR, let the workflows run, then select those exact check names.
Bootstrap configures them through the API without waiting for the picker.

Use the updated template workflows as well as the ruleset. **Dependency policy** must run on
every PR to `main`, without `paths` or `paths-ignore` filters. Otherwise a feature-only PR will
wait indefinitely for `audit`. Bootstrap changes repository settings, not files in an older copy
of the template; bring the updated workflow and audit scripts into that repository before
enabling the ruleset.

The required `audit` check preserves the teaching sequence: ordinary PRs with the seeded
`marked` version must match the intentional start-state findings. Dependabot PRs, and ordinary
PRs after remediation, require the clean state. The production gate always requires the clean
state. A green demo PR therefore does not mean the seeded dependency is safe for production.

For GitHub's native auto-merge, mark the PR ready for review and, while required checks are pending
or failing, select **Enable auto-merge** and confirm the merge method. If all requirements already
pass, immediate merge is expected. Do not depend on catching a waiting window during recording.
Auto-merge is enabled per PR, manually or through separate automation; the repository setting
does not opt in every PR. Agent Merge in the Copilot app is a separate workflow used below.
Automatic Copilot review remains independent and does not require a human approval.

### Coding agent and Agent Merge

1. Open the [GitHub Copilot app](https://github.com/copilot).
2. Open **My work** and confirm the disposable repository and its issues are accessible.
3. During a separate rehearsal, start an implementation session from the feature issue and let
   it produce the feature changes, as described in Step 8.
4. In that implementation session, open the arrow beside **Create PR**. Confirm **Agent merge**
   is listed. Inspect only; do not select the main action button to start a merge.
5. Keep the recording repository in its untouched start state; do not reuse a repository whose
   feature or dependency PR has already been merged.

An empty session may not expose **Create PR** yet. A session opened from someone else's PR,
including Dependabot's, may show **Submit review** instead. Neither screen confirms Agent Merge
availability. Use the feature's original implementation session with changes, not a PR-review
session, for this check.

If Agent Merge is still missing there, stop and check the app version, Copilot plan, repository
access, and organization policy. Repository rules alone cannot prove that the app control is
available.

## 6. Wait for security preparation

GitHub needs time to scan a new template repository.

1. In the repository, open **Pull requests**.
2. Wait for exactly one Dependabot pull request updating `marked`.
3. Open **Security** or **Security and quality**.
4. Under **Dependabot**, confirm the high-severity alerts refer only to `marked`.
5. If Generic patterns is available, confirm an open HTTP bearer-header alert points to
   `src/lib/demo-secret-fixture.js`. Otherwise, omit this optional check.
6. Under **Actions**, confirm **Initialize demo site** succeeded.
7. Open the Pages URL from that run and confirm the initial site loads.

Do not merge or dismiss the prepared Dependabot finding. If the optional secret alert exists, do
not dismiss it before recording.

## 7. Run recording preflight

Return to the local clone:

```bash
npm run demo:preflight -- --repo <owner>/<repository> --confirm-copilot
```

Resolve every failure. Do not record until the final line is:

```text
READY TO RECORD
```

`[INFO]` messages about unavailable Generic patterns or a missing demo secret alert do not block
the recording.

Close unrelated tabs and notifications. Keep open:

- the repository **Issues**, **Pull requests**, **Actions**, and security pages;
- the initial Pages site;
- the GitHub Copilot app **My work** view;
- `PRESENTER-RUNSHEET.md`.

## 8. Record Beat 0 — issue to pull request

Creating the issue does not itself create a PR. In this walkthrough, the issue supplies the
requirements, the Copilot app session implements them, and **Create PR** publishes the changes.
Keep that same implementation session open through review and Agent Merge.

1. In the disposable repository, select **Issues → New issue**.
2. Select **Get started** for the **Feature request** template.
3. Translate the issue title and lesson prose if needed.
4. Do not translate filenames, commands, dependency names, or acceptance criteria.
5. Select **Create** or **Submit new issue**.
6. In the Copilot app, open **My work**, find that issue, and select **New session**. Use a local
   worktree implementation session so the default branch remains unchanged.
7. Ask the session to implement the issue:

   ```text
   Implement this issue's lesson and feedback-widget changes. Copy .github/demo/deploy.yml
   to .github/workflows/deploy.yml unchanged. Keep dependencies and the lockfile unchanged,
   and preserve the seeded workflow and feedback-validation findings for the review exercise.
   Stop when the diff is ready for inspection. Do not commit, push, create a PR, or merge yet.
   If dependency installation is blocked by this host's registry, report it; do not change
   package versions or registry settings to work around it.
   ```

8. Inspect the implementation diff. Do not create a second implementation session for the issue.
9. Open the arrow beside **Create PR** and point out **Agent merge**. Leave **Create PR** selected
   for now: the audience must see the review before the feature is allowed to merge.
10. Click the main **Create PR** button and follow its confirmation prompts to publish a
    non-draft PR. Ensure its description includes `Closes #<issue-number>`.
11. Keep the original implementation session open. Use the browser or its PR panel to show the
    new PR, but return to this session for Beat 2.

**Expected result:** the pull request updates lesson/widget code and adds
`.github/workflows/deploy.yml` by copying `.github/demo/deploy.yml`.

Before continuing, inspect **Files changed**. If `package.json` or `package-lock.json` changed, tell
Copilot:

```text
Revert all changes to package.json and package-lock.json. Do not change dependencies.
```

Wait for the correction and green `build` and `audit` checks on GitHub. A local registry failure
does not count as a successful local build; use the actual GitHub check results as evidence.

**Alternative, not the primary Agent Merge walkthrough:** assigning an issue to the cloud coding
agent on GitHub can also produce a PR. Do not both assign it and start a separate implementation
for the same issue. Opening the cloud-created PR in a new review session does not guarantee the
same Agent Merge controls; rehearse that handoff separately before choosing it.

GitHub reference:
[Managing issues and pull requests with the GitHub Copilot app](https://docs.github.com/en/copilot/how-tos/github-copilot-app/managing-issues-and-pull-requests).

## 9. Record Beat 1 — Copilot Code Review

1. Open the Copilot-authored pull request on GitHub.
2. Show the green build check and informational dependency audit.
3. Wait for the automatic Copilot review.
4. If no review appears, open **Reviewers** in the right sidebar and request **Copilot** manually.
5. Open **Files changed** and show the inline findings.

The expected findings are:

- tag-pinned Actions rather than full commit SHAs;
- `permissions: write-all`;
- missing input validation in `src/lib/feedback.js`.

Copilot wording may differ. The risk and affected line matter, not exact text. If one finding is
missing, request one re-review. Do not repeatedly rerun review during the recording.

GitHub reference:
[Using GitHub Copilot code review](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/request-a-code-review/use-code-review).

## 10. Record Beat 2 — address review and Agent Merge

1. Return to the **original feature implementation session** from Step 8, not a new PR-review
   session. Confirm its linked PR is the feature PR, not the prepared Dependabot PR.
2. Show the Copilot review findings in the PR panel or browser.
3. In the original implementation session, enter:

   ```text
   Address all Copilot Code Review findings. Pin Actions to full commit SHAs, replace write-all
   with least-privilege Pages permissions, and validate feedback input. Do not change dependencies.
   ```

4. Review the resulting diff and have the session commit and push the fixes to the same PR.
   Keep dependencies unchanged.
5. Confirm both **Pull request checks** (`build`) and **Dependency policy** (`audit`) have started
   for the latest commit or have passed. Do not substitute an older commit's green results.
6. Open the dropdown beside **Create PR** or the current PR action and select **Agent merge**.
   Point out that the main button's label changes to **Agent merge**.
7. Click the main **Agent merge** button to start it. Selecting the menu item alone is not the
   same as starting the action. The session must manage the existing linked feature PR, not
   create a duplicate.
8. Show the Agent Merge action permissions. Permit **Address reviews**, **Fix CI failures**, and
   **Resolve conflicts** as needed. Permit **Merge pull request** only after the intended review
   fixes have been inspected and you are ready for the feature to land. If the UI already
   permits merging when you start it, complete that inspection before starting.
9. Keep the session visible as it checks the PR and merges it when GitHub allows. Show the PR's
   **Merged** state, then switch to the deployment run.

**Expected result:** Agent Merge lands the reviewed feature PR after required checks pass.

Say: "This is Agent Merge in the Copilot app, not GitHub's Enable auto-merge button. The agent
checks the PR and handles allowed follow-up work; GitHub still enforces the required checks."

Green checks do not prevent Agent Merge from working. There is no need to race a pending-check
window. If everything is already satisfied, the merge may happen quickly. Do not silently replace
this beat with native **Enable auto-merge** or a manual merge and describe it as Agent Merge.
If the app control is unavailable, use the prepared Agent Merge recording and label the fallback.

GitHub reference:
[Managing issues and pull requests with the GitHub Copilot app](https://docs.github.com/en/copilot/how-tos/github-copilot-app/managing-issues-and-pull-requests).
The [Agent Merge workshop](https://awesome-copilot.github.com/learning-hub/copilot-workshops/app/6-agent-merge/)
shows the dropdown, start button, and merge permission.

## 11. Record Beat 3 — production gate blocks deployment

1. On GitHub, open **Actions**.
2. Open the new **Build and deploy** run triggered by the merge to `main`.
3. Open the build job.
4. Show `npm ci` completing.
5. Show the `node scripts/check-audit-state.mjs clean` step failing because production requires a
   clean audit.
6. Show the site-build step being skipped and the deploy job not running.

**Expected result:** working application code does not bypass the supply-chain policy.

Do not rerun the failed workflow; it should remain as evidence of the blocked state.

## 12. Record Beat 4 — security findings and dependency remediation

1. Open **Security** or **Security and quality**.
2. Under **Dependabot**, show the `marked@0.3.19` advisories.
3. Open **Settings → Security and quality → Advanced Security**.
4. Under **Secret Protection**, show that secret scanning is enabled.
5. Show that **Push protection** is enabled and explain that it blocks supported provider secrets
   before they reach the repository.
6. If **Generic patterns** is shown, explain that it extends detection beyond provider secrets.
   If it is absent, state that availability varies by account and the core protection is still
   enabled.
7. Optional: if Generic patterns produced the training alert, open **Secret scanning** and show the
   bearer-header fixture. State clearly that it is a non-functional test value.
8. Open **Pull requests** and select the prepared Dependabot `marked` update.
9. Show its green **Dependency policy** and **Pull request checks**.
10. Review the dependency diff, then merge this prepared PR on GitHub after its required checks
    pass. Do not merge it before the feature deployment has demonstrated the failing gate.
11. Explain that Dependabot generated the remediation and GitHub checked it. Agent Merge was
    demonstrated explicitly on the feature PR in Beat 2; this is a separate dependency merge.

Do not assume a new Dependabot review session will expose Agent Merge: it may show **Submit
review** instead. Use Agent Merge for this PR only if you separately rehearsed and verified that
route. A green PR may offer immediate native merge rather than native **Enable auto-merge**.

**Expected result:** the dependency update is independently generated, checked, and merged without
weakening the production gate. The audience also sees where Secret Protection and Push protection
are configured, regardless of Generic-pattern availability.

## 13. Record Beat 5 — successful deployment

1. Return to **Actions**.
2. Open the new **Build and deploy** run triggered by the Dependabot merge.
3. Show build, clean dependency policy, and deploy completing successfully.
4. Open the deployment URL from the workflow or repository **Deployments** section.
5. Navigate to the new or updated lesson page.
6. Submit a feedback item including its topic.
7. Show the item rendered on the page.

**Expected result:** the remediated dependency state reaches GitHub Pages and the completed feature
works end to end.

Finish with:

```text
Issue → AI draft → AI review → automated fix → security gate → deployment
```

## 14. After recording

1. Keep the disposable repository until the recording has been reviewed.
2. Save the repository URL, feature PR, Dependabot PR, failed workflow run, successful workflow
   run, and Pages URL with the recording notes.
3. Do not reset the repository for another take.
4. For a retake or another language, create a new repository from the template and repeat from
   Step 2.

The canonical template remains unchanged and ready for the next presenter.

## Troubleshooting

| Problem | Action |
|---|---|
| `gh` cannot change workflows | Run `gh auth refresh -h github.com -s repo,workflow,read:org` |
| Bootstrap targets the canonical repository | Stop and recreate/clone a disposable template repository |
| Initialization cannot find its workflow | Confirm the template repository uses `main` and contains `.github/workflows/initialize-demo.yml` |
| More than one Dependabot PR appears | Do not record; create a fresh template repository and rerun preflight |
| `marked` PR is missing | Wait for GitHub scanning, then rerun preflight |
| Generic patterns is absent | Continue and omit the optional secret-scanning beat |
| Generic patterns is enabled but its alert is missing | Continue after preflight reports this as informational |
| Copilot is absent from **Assignees** | Confirm the coding-agent license, feature setting, organization policy, and repository access |
| Automatic review is absent | Request Copilot from the PR **Reviewers** sidebar once |
| Session shows **Submit review** instead of Agent Merge | Return to the original feature implementation session; a new Dependabot or cloud-PR review session is not the demonstrated authoring route |
| Empty session has no **Create PR** | Implement the feature and inspect its diff first, then check the implementation session's PR-action dropdown |
| Agent Merge is absent in the implementation session | Confirm the app version, repository access, and Copilot plan; use the prepared Agent Merge recording rather than claim a manual merge is Agent Merge |
| **Enable auto-merge** is absent | Confirm the PR is non-draft, **Allow auto-merge** is enabled, and the active ruleset requires `build` and `audit`; if everything already passes, use immediate merge |
| `audit` remains **Expected** with no run | Remove dependency-path filters from **Dependency policy** using the updated template workflow, then push a new commit to trigger both checks; rerunning a skipped workflow is not sufficient |
| Preflight reports missing or incorrect merge rules | Rerun bootstrap with `--apply --skip-deploy`, then confirm the ruleset above; do not bypass it |
| Feature PR changes dependencies | Ask Copilot to revert `package.json` and `package-lock.json` |
| Feature PR checks fail | Diagnose before recording; do not bypass required checks |
| Final deploy fails | Preserve the failed run and use the approved fallback recording |
