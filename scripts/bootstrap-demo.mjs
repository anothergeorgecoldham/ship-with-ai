import { readFileSync } from 'node:fs';
import { ghApi, ghJson, hasFlag, readOption, repositoryDetails, run, sleep } from './lib/cli.mjs';

const manifest = JSON.parse(
  readFileSync(new URL('../demo-kit.json', import.meta.url), 'utf8'),
);
if (manifest.schemaVersion !== 1) {
  throw new Error(`Unsupported demo-kit schema version: ${manifest.schemaVersion}`);
}
const CANONICAL_REPOSITORY = manifest.canonicalRepository;
const args = process.argv.slice(2);
const apply = hasFlag(args, '--apply');
const skipDeploy = hasFlag(args, '--skip-deploy');
const allowCanonical = hasFlag(args, '--allow-canonical');
const failures = [];

function pass(message) {
  console.log(`[PASS] ${message}`);
}

function fail(message, error) {
  const detail = error instanceof Error ? error.message : String(error);
  console.error(`[FAIL] ${message}: ${detail}`);
  failures.push(message);
}

function perform(message, operation) {
  try {
    operation();
    pass(message);
  } catch (error) {
    fail(message, error);
  }
}

async function waitForInitialization(repository, earliestRun) {
  for (let attempt = 0; attempt < 24; attempt += 1) {
    const runs = ghJson([
      'run',
      'list',
      '--repo',
      repository,
      '--workflow',
      'initialize-demo.yml',
      '--limit',
      '5',
      '--json',
      'databaseId,createdAt,status,conclusion,url',
    ]).data;

    const runRecord = runs.find((record) => new Date(record.createdAt) >= earliestRun);
    if (runRecord) {
      console.log(`Initialization run: ${runRecord.url}`);
      run('gh', [
        'run',
        'watch',
        String(runRecord.databaseId),
        '--repo',
        repository,
        '--exit-status',
      ]);
      return;
    }

    await sleep(5000);
  }

  throw new Error('Initialization workflow was not queued within two minutes.');
}

async function main() {
  const requestedRepository = readOption(args, '--repo');
  run('gh', ['auth', 'status']);
  const details = repositoryDetails(requestedRepository);
  const repository = details.nameWithOwner;
  const defaultBranch = details.defaultBranchRef?.name;

  console.log(`Target repository: ${repository}`);

  if (details.visibility !== 'PUBLIC') {
    throw new Error('The demo repository must be public.');
  }
  if (defaultBranch !== manifest.defaultBranch) {
    throw new Error(`The demo repository default branch must be ${manifest.defaultBranch}.`);
  }
  if (apply && repository === CANONICAL_REPOSITORY && !allowCanonical) {
    throw new Error(
      `Refusing to configure the canonical repository. Use a repository created from the template, or pass --allow-canonical intentionally.`,
    );
  }

  if (!apply) {
    console.log('Dry run only. The following settings would be configured:');
    console.log('- auto-merge');
    console.log('- Dependabot alerts and security updates');
    console.log('- secret scanning and push protection');
    console.log('- generic secret patterns when available for the account');
    console.log('- CodeQL default setup');
    console.log('- automatic Copilot code review on the default branch');
    console.log('- GitHub Pages with GitHub Actions');
    if (!skipDeploy) {
      console.log('- dispatch and wait for the Initialize demo site workflow');
    }
    console.log('Run again with --apply after reviewing the target repository.');
    return;
  }

  perform('Enabled auto-merge', () => {
    ghApi(`repos/${repository}`, {
      method: 'PATCH',
      body: { allow_auto_merge: true },
    });
  });

  perform('Enabled Dependabot alerts', () => {
    ghApi(`repos/${repository}/vulnerability-alerts`, { method: 'PUT' });
  });

  perform('Enabled Dependabot security updates', () => {
    ghApi(`repos/${repository}/automated-security-fixes`, { method: 'PUT' });
  });

  perform('Enabled secret scanning and push protection', () => {
    ghApi(`repos/${repository}`, {
      method: 'PATCH',
      body: {
        security_and_analysis: {
          secret_scanning: { status: 'enabled' },
          secret_scanning_push_protection: { status: 'enabled' },
        },
      },
    });
  });

  try {
    ghApi(`repos/${repository}`, {
      method: 'PATCH',
      body: {
        security_and_analysis: {
          secret_scanning_non_provider_patterns: { status: 'enabled' },
        },
      },
    });
    const settings = ghApi(`repos/${repository}`).data.security_and_analysis ?? {};
    if (settings.secret_scanning_non_provider_patterns?.status === 'enabled') {
      pass('Enabled optional generic secret patterns');
    } else {
      console.log('[INFO] Optional generic secret patterns are unavailable; continuing.');
    }
  } catch (error) {
    console.log(`[INFO] Optional generic secret patterns could not be enabled: ${error.message}`);
  }

  perform('Configured CodeQL default setup', () => {
    const current = ghApi(`repos/${repository}/code-scanning/default-setup`, {
      allowFailure: true,
    });
    if (current.status === 0 && current.data?.state === 'configured') {
      return;
    }
    ghApi(`repos/${repository}/code-scanning/default-setup`, {
      method: 'PATCH',
      body: { state: 'configured', query_suite: 'default' },
    });
  });

  perform('Configured automatic Copilot code review', () => {
    const rulesets = ghApi(`repos/${repository}/rulesets`).data;
    const existing = rulesets.find((ruleset) => ruleset.name === 'Automatic Copilot code review');
    const body = {
      name: 'Automatic Copilot code review',
      target: 'branch',
      enforcement: 'active',
      bypass_actors: [],
      conditions: {
        ref_name: {
          include: ['~DEFAULT_BRANCH'],
          exclude: [],
        },
      },
      rules: [
        {
          type: 'copilot_code_review',
          parameters: {
            review_on_push: false,
            review_draft_pull_requests: false,
          },
        },
      ],
    };

    if (existing) {
      ghApi(`repos/${repository}/rulesets/${existing.id}`, {
        method: 'PUT',
        body,
      });
    } else {
      ghApi(`repos/${repository}/rulesets`, {
        method: 'POST',
        body,
      });
    }
  });

  perform('Configured GitHub Pages for Actions', () => {
    const pages = ghApi(`repos/${repository}/pages`, { allowFailure: true });
    if (pages.status === 0) {
      ghApi(`repos/${repository}/pages`, {
        method: 'PUT',
        body: { build_type: 'workflow' },
      });
    } else if (/HTTP 404/i.test(pages.stderr)) {
      ghApi(`repos/${repository}/pages`, {
        method: 'POST',
        body: { build_type: 'workflow' },
      });
    } else {
      throw new Error(pages.stderr || 'Unable to inspect GitHub Pages.');
    }
  });

  if (failures.length > 0) {
    throw new Error(`Bootstrap stopped with ${failures.length} configuration failure(s).`);
  }

  if (!skipDeploy) {
    const earliestRun = new Date(Date.now() - 5000);
    run('gh', [
      'workflow',
      'run',
      'initialize-demo.yml',
      '--repo',
      repository,
      '--ref',
      defaultBranch,
    ]);
    await waitForInitialization(repository, earliestRun);
    pass('Initialized the before-site deployment');
  }

  console.log('Bootstrap complete. Run npm run demo:preflight before recording.');
}

main().catch((error) => {
  console.error(`[FAIL] ${error.message}`);
  process.exitCode = 1;
});
