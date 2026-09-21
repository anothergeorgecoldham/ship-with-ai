import { isDeepStrictEqual } from 'node:util';

const GITHUB_ACTIONS_APP_ID = 15368;

export const mergeRuleset = {
  name: 'Require build and audit before merge',
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
    { type: 'deletion' },
    { type: 'non_fast_forward' },
    {
      type: 'pull_request',
      parameters: {
        required_approving_review_count: 0,
        dismiss_stale_reviews_on_push: false,
        require_code_owner_review: false,
        require_last_push_approval: false,
        required_review_thread_resolution: false,
      },
    },
    {
      type: 'required_status_checks',
      parameters: {
        strict_required_status_checks_policy: false,
        required_status_checks: [
          { context: 'build', integration_id: GITHUB_ACTIONS_APP_ID },
          { context: 'audit', integration_id: GITHUB_ACTIONS_APP_ID },
        ],
      },
    },
  ],
};

export function assertMergeRuleset(actual) {
  for (const key of ['name', 'target', 'enforcement', 'bypass_actors', 'conditions']) {
    if (!isDeepStrictEqual(actual?.[key], mergeRuleset[key])) {
      throw new Error(`Merge ruleset has incorrect ${key}; rerun bootstrap with --apply.`);
    }
  }

  for (const expected of mergeRuleset.rules) {
    const rule = actual.rules?.find((item) => item.type === expected.type);
    if (!rule) {
      throw new Error(`Merge ruleset is missing ${expected.type}; rerun bootstrap with --apply.`);
    }
    for (const [key, value] of Object.entries(expected.parameters ?? {})) {
      const actualValue = rule.parameters?.[key];
      const matches = key === 'required_status_checks'
        ? Array.isArray(actualValue) &&
          actualValue.length === value.length &&
          value.every((check) => actualValue.some(
            (item) => item.context === check.context && item.integration_id === check.integration_id,
          ))
        : isDeepStrictEqual(actualValue, value);
      if (!matches) {
        throw new Error(
          `Merge ruleset has incorrect ${key}; rerun bootstrap with --apply.`,
        );
      }
    }
  }
}
