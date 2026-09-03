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
- Dependabot alerts and security updates;
- secret scanning, generic non-provider patterns, and push protection;
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

### Coding agent and Agent Merge

1. Start creating an issue, open **Assignees**, and confirm **Copilot** is available. Cancel without
   creating the issue.
2. Open the [GitHub Copilot app](https://github.com/copilot).
3. Open **My work** and confirm the disposable repository is accessible.
4. Confirm a session offers **Agent merge** in the dropdown beside **Create PR** or the pull request
   action. Do not start it.

If either Copilot assignment or Agent Merge is missing, stop. Check the license, organization
policy, repository access, and Copilot feature settings before continuing.

## 6. Wait for security preparation

GitHub needs time to scan a new template repository.

1. In the repository, open **Pull requests**.
2. Wait for exactly one Dependabot pull request updating `marked`.
3. Open **Security** or **Security and quality**.
4. Under **Dependabot**, confirm the high-severity alerts refer only to `marked`.
5. Under **Secret scanning**, confirm an open generic HTTP bearer-header alert points to
   `src/lib/demo-secret-fixture.js`.
6. Under **Actions**, confirm **Initialize demo site** succeeded.
7. Open the Pages URL from that run and confirm the initial site loads.

Do not merge or dismiss either prepared finding.

## 7. Run recording preflight

Return to the local clone:

```bash
npm run demo:preflight -- --repo <owner>/<repository> --confirm-copilot
```

Resolve every failure. Do not record until the final line is:

```text
READY TO RECORD
```

Close unrelated tabs and notifications. Keep open:

- the repository **Issues**, **Pull requests**, **Actions**, and security pages;
- the initial Pages site;
- the GitHub Copilot app **My work** view;
- `PRESENTER-RUNSHEET.md`.

## 8. Record Beat 0 — issue to pull request

1. In the disposable repository, select **Issues → New issue**.
2. Select **Get started** for the **Feature request** template.
3. Translate the issue title and lesson prose if needed.
4. Do not translate filenames, commands, dependency names, or acceptance criteria.
5. Select **Create** or **Submit new issue**.
6. In the issue sidebar, select **Assignees**.
7. Select **Copilot**, add no extra scope, and confirm the assignment.
8. Show that Copilot has started work.
9. Open **Agents** on GitHub, or open **My work** in the Copilot app, and select the new session.
10. Wait for Copilot to open its pull request.

**Expected result:** the pull request updates lesson/widget code and adds
`.github/workflows/deploy.yml` by copying `.github/demo/deploy.yml`.

Before continuing, inspect **Files changed**. If `package.json` or `package-lock.json` changed, tell
Copilot:

```text
Revert all changes to package.json and package-lock.json. Do not change dependencies.
```

Wait for the correction and green **Pull request checks**.

GitHub reference:
[Get started with Copilot agents on GitHub](https://docs.github.com/en/copilot/how-tos/copilot-on-github/use-copilot-agents/overview).

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

1. Open the pull request in **My work** in the GitHub Copilot app.
2. Scroll to each Copilot review comment.
3. Select **Copilot Fix** for each finding, or start a pull-request session and enter:

   ```text
   Address all Copilot Code Review findings. Pin Actions to full commit SHAs, replace write-all
   with least-privilege Pages permissions, and validate feedback input. Do not change dependencies.
   ```

4. Review the resulting diff.
5. Wait for **Pull request checks** to pass.
6. In the session, open the dropdown beside **Create PR** or the current PR action.
7. Select **Agent merge**, then select the **Agent merge** button.
8. Open its dropdown and permit **Address reviews**, **Fix CI failures**, **Resolve conflicts**, and
   **Merge pull request** when those options are shown.
9. Keep the session visible until GitHub merges the pull request.

**Expected result:** Agent Merge lands the reviewed feature PR after required checks pass.

GitHub reference:
[Managing issues and pull requests with the GitHub Copilot app](https://docs.github.com/en/copilot/how-tos/github-copilot-app/managing-issues-and-pull-requests).

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
3. Under **Secret scanning**, show the generic bearer-header training fixture.
4. State clearly that it is a non-functional test value, not a credential.
5. Open **Pull requests** and select the prepared Dependabot `marked` update.
6. Show its green **Dependency policy** and **Pull request checks**.
7. Open that pull request in the GitHub Copilot app **My work** view.
8. Enable **Agent merge** and permit **Merge pull request**.
9. Wait for the dependency pull request to merge.

**Expected result:** the dependency update is independently generated, checked, and merged without
weakening the production gate.

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
| `marked` PR or secret alert is missing | Wait for GitHub scanning, then rerun preflight |
| Copilot is absent from **Assignees** | Confirm the coding-agent license, feature setting, organization policy, and repository access |
| Automatic review is absent | Request Copilot from the PR **Reviewers** sidebar once |
| Agent Merge is absent | Use the GitHub Copilot app, confirm repository access and auto-merge, then verify the Copilot plan |
| Feature PR changes dependencies | Ask Copilot to revert `package.json` and `package-lock.json` |
| Feature PR checks fail | Diagnose before recording; do not bypass required checks |
| Final deploy fails | Preserve the failed run and use the approved fallback recording |
