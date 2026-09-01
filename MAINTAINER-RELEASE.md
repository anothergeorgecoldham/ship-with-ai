# Demo kit release procedure

This procedure publishes the canonical start state. It is for maintainers, not presenters.

## Release contract

`demo-kit.json` is the source of truth for the release identifier, runtime, dependency versions,
expected audit state, Dependabot behavior, and secret-scanning signal. Update it only as part of a
fully recertified release.

The canonical repository always publishes the **start state**. The finished state is produced in
each disposable demonstration repository and retained in that repository's pull requests and
history.

## Prepare

1. Confirm `.github/workflows/deploy.yml` is absent.
2. Confirm `.github/demo/deploy.yml` is present.
3. Review all changes and commit them to `main`.
4. Run `npm ci`.
5. Run `npm run demo:preflight -- --local-only` from the clean checkout.
6. Push `main`, then rerun the local preflight.

Do not publish while preflight reports a local failure.
The successful **Initialize demo site** run in a fresh template repository is the authoritative
public npm-registry check; local environments may use an approved registry proxy.

## Publish the start reference

Create and push an annotated tag matching `releaseId` with `-start` appended:

```bash
git tag -a demo-2026.09-start -m "Ship with AI demo start state 2026.09"
git push origin demo-2026.09-start
```

Enable **Template repository** under **Settings → General** only after the tag and default branch
point at the certified start state.

## Certify the template

1. Create a new public repository with **Use this template**.
2. Clone the new repository and run `npm ci`.
3. Run bootstrap in dry-run mode, then with `--apply`.
4. Wait for Dependabot and secret scanning.
5. Require `READY TO RECORD` from full preflight.
6. Perform the complete presenter runsheet twice.
7. Retain the successful disposable repository as the finished-state reference for this release.
8. Record the start tag, finished repository URL, final commit SHA, Pages URL, and timings in the
   GitHub release notes.

If certification exposes a failure, disable **Template repository**, correct the canonical start
state, increment the release identifier, and repeat the process. Never move an already published
start tag.
