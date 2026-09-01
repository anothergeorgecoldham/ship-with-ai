export function validateAuditState(report, expectedState, policy = {}) {
  if (!['start', 'clean'].includes(expectedState)) {
    return { valid: false, message: 'Expected audit state must be "start" or "clean".' };
  }

  const findings = Object.entries(report.vulnerabilities ?? {});
  const counts = report.metadata?.vulnerabilities ?? {};

  if (expectedState === 'start') {
    const expectedPackages = [...(policy.packages ?? ['marked'])].sort();
    const actualPackages = findings.map(([name]) => name).sort();
    const valid =
      actualPackages.length === expectedPackages.length &&
      actualPackages.every((name, index) => name === expectedPackages[index]) &&
      findings.every(([, finding]) => finding.severity === 'high') &&
      counts.high === (policy.high ?? 1) &&
      counts.critical === (policy.critical ?? 0);

    return {
      valid,
      message: valid
        ? 'Audit matches the expected demo start state.'
        : 'Start state must contain only the expected high-severity marked finding.',
    };
  }

  const valid =
    (counts.high ?? 0) === (policy.high ?? 0) &&
    (counts.critical ?? 0) === (policy.critical ?? 0);
  return {
    valid,
    message: valid
      ? 'Audit matches the expected clean state.'
      : 'Clean state must contain no high or critical audit findings.',
  };
}
