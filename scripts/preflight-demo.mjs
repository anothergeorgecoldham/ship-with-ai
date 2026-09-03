import { existsSync, readFileSync } from 'node:fs';
import { validateAuditState } from './lib/audit-state.mjs';
import { ghApi, ghJson, hasFlag, readOption, repositoryDetails, run } from './lib/cli.mjs';
import { versionAtLeast } from './lib/version.mjs';

const args = process.argv.slice(2);
const localOnly = hasFlag(args, '--local-only');
const copilotConfirmed = hasFlag(args, '--confirm-copilot');
const results = [];
let resolvedRepository;
const manifest = JSON.parse(
  readFileSync(new URL('../demo-kit.json', import.meta.url), 'utf8'),
);

function record(status, label, detail = '') {
  results.push({ status, label, detail });
  const suffix = detail ? ` - ${detail}` : '';
  console.log(`[${status}] ${label}${suffix}`);
}

function check(label, operation, status = 'PASS') {
  try {
    const result = operation();
    if (result === false) {
      record('FAIL', label);
      return;
    }
    if (typeof result === 'string') {
      record(status, label, result);
      return;
    }
    record(status, label);
  } catch (error) {
    record('FAIL', label, error.message);
  }
}

function optionalCheck(label, operation) {
  try {
    const result = operation();
    record('PASS', label, typeof result === 'string' ? result : '');
  } catch (error) {
    record('INFO', label, error.message);
  }
}

function checkLocalState() {
  check('Demo kit manifest schema is supported', () => {
    if (manifest.schemaVersion !== 1) {
      throw new Error(`Found schema version ${manifest.schemaVersion}.`);
    }
    return manifest.releaseId;
  });

  check(`Node.js ${manifest.runtime.minimumNode} or newer`, () => {
    if (!versionAtLeast(process.version, manifest.runtime.minimumNode)) {
      throw new Error(`Found ${process.version}.`);
    }
    return process.version;
  });

  check('Required demo files are present', () => {
    const required = [
      '.github/demo/deploy.yml',
      '.github/workflows/initialize-demo.yml',
      '.github/workflows/pull-request-checks.yml',
      '.github/workflows/dependency-policy.yml',
      'AUDIENCE-WALKTHROUGH.md',
      'PRESENTER-RUNSHEET.md',
      'demo-kit.json',
      'scripts/check-audit-state.mjs',
      'src/lib/demo-secret-fixture.js',
    ];
    const missing = required.filter((path) => !existsSync(path));
    if (missing.length > 0) {
      throw new Error(`Missing: ${missing.join(', ')}`);
    }
  });

  check('Production workflow is inactive before recording', () => {
    const isActive = existsSync('.github/workflows/deploy.yml');
    if (isActive !== manifest.startState.productionWorkflowActive) {
      throw new Error(
        manifest.startState.productionWorkflowActive
          ? 'Add .github/workflows/deploy.yml to the start state.'
          : 'Remove .github/workflows/deploy.yml from the start state.',
      );
    }
  });

  check('Dependencies match the intended start state', () => {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
    const mismatches = Object.entries(manifest.startState.dependencies).filter(
      ([name, version]) => packageJson.dependencies?.[name] !== version,
    );
    if (mismatches.length > 0) {
      throw new Error(
        mismatches
          .map(([name, version]) => `${name} must be pinned to ${version}.`)
          .join(' '),
      );
    }
  });

  check('Lockfile is registry-agnostic', () => {
    const lockfile = readFileSync('package-lock.json', 'utf8');
    if (/packagefeedproxy|ms-feed|pkgs\.visualstudio/i.test(lockfile)) {
      throw new Error('The lockfile contains an environment-specific registry URL.');
    }
  });

  check('Clean dependency installation succeeds', () => {
    run('npm', ['ci']);
  });

  check('Audit matches the intentional start state', () => {
    const audit = run('npm', ['audit', '--json'], { allowFailure: true });
    const report = JSON.parse(audit.stdout);
    const validation = validateAuditState(report, 'start', manifest.startState.audit);
    if (!validation.valid) {
      throw new Error(validation.message);
    }
  });

  check('Site builds for the target repository', () => {
    const environment = resolvedRepository
      ? { ...process.env, GITHUB_REPOSITORY: resolvedRepository }
      : process.env;
    run('npm', ['run', 'build'], { env: environment });
  });

  check('Working tree is clean', () => {
    const status = run('git', ['status', '--porcelain']).stdout;
    if (status) {
      throw new Error('Commit or remove local changes before recording.');
    }
  });
}

function checkRemoteState(repository) {
  const details = repositoryDetails(repository);
  resolvedRepository = details.nameWithOwner;
  const checkSecretScanningBeat = manifest.secretScanning.required ? check : optionalCheck;

  check('Repository is public with main as default', () => {
    if (
      details.visibility !== 'PUBLIC' ||
      details.defaultBranchRef?.name !== manifest.defaultBranch
    ) {
      throw new Error(`Found ${details.visibility} / ${details.defaultBranchRef?.name}.`);
    }
    return resolvedRepository;
  });

  check('GitHub repository settings are enabled', () => {
    const data = ghApi(`repos/${resolvedRepository}`).data;
    const security = data.security_and_analysis ?? {};
    const required = [
      ['auto-merge', data.allow_auto_merge === true],
      ['secret scanning', security.secret_scanning?.status === 'enabled'],
      ['push protection', security.secret_scanning_push_protection?.status === 'enabled'],
      ['Dependabot security updates', security.dependabot_security_updates?.status === 'enabled'],
    ];
    const disabled = required.filter(([, enabled]) => !enabled).map(([name]) => name);
    if (disabled.length > 0) {
      throw new Error(`Not enabled: ${disabled.join(', ')}`);
    }
  });

  checkSecretScanningBeat('Optional generic secret patterns', () => {
    const data = ghApi(`repos/${resolvedRepository}`).data;
    if (
      data.security_and_analysis?.secret_scanning_non_provider_patterns?.status !== 'enabled'
    ) {
      throw new Error('Unavailable for this repository; omit the optional secret-scanning beat.');
    }
  });

  check('CodeQL default setup is configured', () => {
    const setup = ghApi(`repos/${resolvedRepository}/code-scanning/default-setup`).data;
    if (setup.state !== 'configured') {
      throw new Error(`Found state ${setup.state}.`);
    }
  });

  check('Automatic Copilot review ruleset is active', () => {
    const rulesets = ghApi(`repos/${resolvedRepository}/rulesets`).data;
    const ruleset = rulesets.find((item) => item.name === 'Automatic Copilot code review');
    if (!ruleset || ruleset.enforcement !== 'active') {
      throw new Error('Expected active ruleset was not found.');
    }
    const detail = ghApi(`repos/${resolvedRepository}/rulesets/${ruleset.id}`).data;
    if (!detail.rules.some((rule) => rule.type === 'copilot_code_review')) {
      throw new Error('Ruleset does not contain the Copilot code review rule.');
    }
  });

  check('GitHub Pages uses Actions', () => {
    const pages = ghApi(`repos/${resolvedRepository}/pages`).data;
    if (pages.build_type !== 'workflow' || !pages.html_url) {
      throw new Error('Pages is not configured for a workflow deployment.');
    }
    return pages.html_url;
  });

  check('Before-site initialization completed', () => {
    const runs = ghJson([
      'run',
      'list',
      '--repo',
      resolvedRepository,
      '--workflow',
      'initialize-demo.yml',
      '--limit',
      '1',
      '--json',
      'status,conclusion,url',
    ]).data;
    if (runs.length === 0 || runs[0].status !== 'completed' || runs[0].conclusion !== 'success') {
      throw new Error('No successful initialization run was found.');
    }
    return runs[0].url;
  });

  check('Only the intended high-severity Dependabot alerts are open', () => {
    const alerts = ghApi(
      `repos/${resolvedRepository}/dependabot/alerts?state=open&per_page=100`,
    ).data;
    const highAlerts = alerts.filter((alert) =>
      ['high', 'critical'].includes(alert.security_advisory?.severity),
    );
    if (
      highAlerts.length === 0 ||
      highAlerts.some(
        (alert) => !manifest.startState.audit.packages.includes(alert.dependency?.package?.name),
      )
    ) {
      throw new Error(
        `Expected only high-severity ${manifest.startState.audit.packages.join(', ')} alerts.`,
      );
    }
    return `${highAlerts.length} marked alert(s)`;
  });

  check('Exactly one marked Dependabot PR is ready', () => {
    const pullRequests = ghJson([
      'pr',
      'list',
      '--repo',
      resolvedRepository,
      '--state',
      'open',
      '--limit',
      '100',
      '--json',
      'title,headRefName,author,url',
    ]).data.filter(
      (pullRequest) =>
        pullRequest.author?.login === 'app/dependabot' ||
        pullRequest.headRefName.startsWith('dependabot/'),
    );
    const expectedPullRequests = pullRequests.filter((pullRequest) =>
      pullRequest.headRefName.includes(manifest.dependabot.dependency),
    );
    if (
      pullRequests.length !== manifest.dependabot.expectedOpenPullRequests ||
      expectedPullRequests.length !== manifest.dependabot.expectedOpenPullRequests
    ) {
      throw new Error(
        `Found ${pullRequests.length} Dependabot PR(s), including ${expectedPullRequests.length} for ${manifest.dependabot.dependency}.`,
      );
    }
    return expectedPullRequests[0].url;
  });

  checkSecretScanningBeat('Optional demo secret-scanning alert', () => {
    const alerts = ghApi(
      `repos/${resolvedRepository}/secret-scanning/alerts?state=open&per_page=100`,
    ).data;
    const expectedAlerts = alerts.filter(
      (alert) => alert.secret_type === manifest.secretScanning.expectedType,
    );
    if (expectedAlerts.length === 0) {
      throw new Error(
        `No ${manifest.secretScanning.expectedType} alert; omit the optional secret-scanning beat.`,
      );
    }
    return `${expectedAlerts.length} expected alert(s)`;
  });

  if (copilotConfirmed) {
    record('PASS', 'Copilot coding agent and Agent Merge manually confirmed');
  } else {
    record(
      'WARN',
      'Confirm Copilot coding agent and Agent Merge in repository settings',
      'Rerun with --confirm-copilot after checking.',
    );
  }
}

function main() {
  const requestedRepository = readOption(args, '--repo');
  if (!localOnly) {
    check('GitHub CLI authentication', () => {
      run('gh', ['auth', 'status']);
    });

    try {
      const details = repositoryDetails(requestedRepository);
      resolvedRepository = details.nameWithOwner;
      checkRemoteState(resolvedRepository);
    } catch (error) {
      record('FAIL', 'Resolve target GitHub repository', error.message);
    }
  }

  checkLocalState();

  const failed = results.filter((result) => result.status === 'FAIL').length;
  const warnings = results.filter((result) => result.status === 'WARN').length;

  if (failed > 0) {
    console.error(`NOT READY: ${failed} check(s) failed.`);
    process.exitCode = 1;
  } else if (warnings > 0) {
    console.log(`READY AFTER MANUAL CHECKS: ${warnings} confirmation(s) remain.`);
  } else {
    console.log('READY TO RECORD');
  }
}

try {
  main();
} catch (error) {
  console.error(`[FAIL] ${error.message}`);
  process.exitCode = 1;
}
