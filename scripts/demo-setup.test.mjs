import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { assertMergeRuleset, mergeRuleset } from './lib/merge-rules.mjs';

test('Astro is exactly pinned to the release manifest in package and lockfile', () => {
  const manifest = JSON.parse(readFileSync(new URL('../demo-kit.json', import.meta.url), 'utf8'));
  const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  const lockfile = JSON.parse(readFileSync(new URL('../package-lock.json', import.meta.url), 'utf8'));
  const expected = manifest.startState.dependencies.astro;
  assert.equal(packageJson.dependencies.astro, expected);
  assert.equal(lockfile.packages[''].dependencies.astro, expected);
  assert.equal(lockfile.packages['node_modules/astro'].version, expected);
});

test('merge rules require the exact Actions checks without human approval or bypass', () => {
  assert.equal(mergeRuleset.enforcement, 'active');
  assert.equal(mergeRuleset.target, 'branch');
  assert.deepEqual(mergeRuleset.conditions.ref_name, {
    include: ['~DEFAULT_BRANCH'],
    exclude: [],
  });
  assert.deepEqual(mergeRuleset.bypass_actors, []);
  assert.deepEqual(mergeRuleset.rules.map((rule) => rule.type).sort(), [
    'deletion', 'non_fast_forward', 'pull_request', 'required_status_checks',
  ]);
  const pr = mergeRuleset.rules.find((rule) => rule.type === 'pull_request').parameters;
  assert.equal(pr.required_approving_review_count, 0);
  assert.equal(pr.require_code_owner_review, false);
  assert.equal(pr.require_last_push_approval, false);
  assert.equal(pr.required_review_thread_resolution, false);
  const checks = mergeRuleset.rules.find((rule) => rule.type === 'required_status_checks').parameters;
  assert.equal(checks.strict_required_status_checks_policy, false);
  assert.deepEqual(checks.required_status_checks, [
    { context: 'build', integration_id: 15368 },
    { context: 'audit', integration_id: 15368 },
  ]);
});

test('preflight accepts API metadata and reordered status checks', () => {
  const actual = structuredClone(mergeRuleset);
  actual.id = 42;
  actual.source_type = 'Repository';
  actual.rules.reverse();
  actual.rules[0].parameters.required_status_checks.reverse();
  assert.doesNotThrow(() => assertMergeRuleset(actual));
});

test('preflight rejects missing or misconfigured merge rules', async (t) => {
  const mutations = {
    missing: () => undefined,
    disabled: (ruleset) => ({ ...ruleset, enforcement: 'disabled' }),
    tags: (ruleset) => ({ ...ruleset, target: 'tag' }),
    bypass: (ruleset) => ({ ...ruleset, bypass_actors: [{ actor_id: 5, actor_type: 'RepositoryRole' }] }),
    'wrong branch': (ruleset) => {
      ruleset.conditions.ref_name.include = ['refs/heads/other'];
      return ruleset;
    },
    'excluded default branch': (ruleset) => {
      ruleset.conditions.ref_name.exclude = ['refs/heads/main'];
      return ruleset;
    },
  };
  for (const type of ['deletion', 'non_fast_forward', 'pull_request', 'required_status_checks']) {
    mutations[`missing ${type}`] = (ruleset) => {
      ruleset.rules = ruleset.rules.filter((rule) => rule.type !== type);
      return ruleset;
    };
  }
  for (const [key, value] of Object.entries({
    required_approving_review_count: 1,
    require_code_owner_review: true,
    require_last_push_approval: true,
    required_review_thread_resolution: true,
  })) {
    mutations[key] = (ruleset) => {
      ruleset.rules.find((rule) => rule.type === 'pull_request').parameters[key] = value;
      return ruleset;
    };
  }
  for (const [label, change] of Object.entries({
    'strict checks': (parameters) => { parameters.strict_required_status_checks_policy = true; },
    'missing audit': (parameters) => { parameters.required_status_checks.pop(); },
    'wrong source': (parameters) => { parameters.required_status_checks[1].integration_id = 1; },
    'any source': (parameters) => { delete parameters.required_status_checks[1].integration_id; },
    'wrong check name': (parameters) => { parameters.required_status_checks[1].context = 'Dependency policy'; },
    'extra check': (parameters) => { parameters.required_status_checks.push({ context: 'unknown' }); },
  })) {
    mutations[label] = (ruleset) => {
      change(ruleset.rules.find((rule) => rule.type === 'required_status_checks').parameters);
      return ruleset;
    };
  }
  for (const [name, mutate] of Object.entries(mutations)) {
    await t.test(name, () => {
      assert.throws(() => assertMergeRuleset(mutate(structuredClone(mergeRuleset))), /rerun bootstrap/);
    });
  }
});

test('audit CLI preserves the demo sequence and allows clean follow-up PRs', async (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'ship-with-ai-audit-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  mkdirSync(join(directory, 'scripts', 'lib'), { recursive: true });
  for (const file of [
    'scripts/check-audit-state.mjs',
    'scripts/lib/audit-state.mjs',
    'scripts/lib/version.mjs',
    'demo-kit.json',
  ]) {
    copyFileSync(new URL(`../${file}`, import.meta.url), join(directory, ...file.split('/')));
  }
  const seeded = {
    vulnerabilities: { marked: { severity: 'high' } },
    metadata: { vulnerabilities: { high: 1, critical: 0 } },
  };
  const clean = {
    vulnerabilities: {},
    metadata: { vulnerabilities: { high: 0, critical: 0 } },
  };
  const unexpected = structuredClone(seeded);
  unexpected.vulnerabilities.other = { severity: 'high' };
  unexpected.metadata.vulnerabilities.high = 2;
  const cases = [
    ['seeded feature PR', 'auto', '0.3.19', seeded, true],
    ['explicit start state', 'start', '0.3.19', seeded, true],
    ['unremediated Dependabot PR', 'clean', '0.3.19', seeded, false],
    ['production blocks seed', 'clean', '0.3.19', seeded, false],
    ['remediated Dependabot PR', 'clean', '4.0.10', clean, true],
    ['follow-up feature PR', 'auto', '4.0.10', clean, true],
    ['unexpected start finding', 'auto', '0.3.19', unexpected, false],
    ['unsafe version with clean report', 'auto', '1.0.0', clean, false],
    ['missing dependency', 'auto', undefined, clean, false],
    ['remaining high vulnerability', 'auto', '4.0.10', seeded, false],
    ['failed npm audit', 'auto', '4.0.10', { error: { code: 'ENETUNREACH' } }, false],
    ['missing audit metadata', 'auto', '4.0.10', {}, false],
    ['invalid mode', 'invalid', '4.0.10', clean, false],
  ];
  for (const [name, mode, version, report, passes] of cases) {
    await t.test(name, () => {
      writeFileSync(join(directory, 'package.json'), JSON.stringify({ dependencies: { marked: version } }));
      writeFileSync(join(directory, 'audit.json'), JSON.stringify(report));
      const result = spawnSync(process.execPath, [
        join(directory, 'scripts', 'check-audit-state.mjs'), mode,
      ], { cwd: directory, encoding: 'utf8' });
      assert.ifError(result.error);
      if (passes) {
        assert.equal(result.status, 0, result.stderr);
        assert.match(result.stdout, /Audit matches/);
      } else {
        assert.notEqual(result.status, 0);
        assert.match(result.stderr, /Error:/);
      }
    });
  }
});
