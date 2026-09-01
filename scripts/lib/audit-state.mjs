export function validateAuditState(report, expectedState) {
  if (!['start', 'clean'].includes(expectedState)) {
    return { valid: false, message: 'Expected audit state must be "start" or "clean".' };
  }

  const findings = Object.entries(report.vulnerabilities ?? {});
  const counts = report.metadata?.vulnerabilities ?? {};

  if (expectedState === 'start') {
    const valid =
      findings.length === 1 &&
      findings[0][0] === 'marked' &&
      findings[0][1].severity === 'high' &&
      counts.high === 1 &&
      counts.critical === 0;

    return {
      valid,
      message: valid
        ? 'Audit matches the expected demo start state.'
        : 'Start state must contain only the expected high-severity marked finding.',
    };
  }

  const valid = (counts.high ?? 0) === 0 && (counts.critical ?? 0) === 0;
  return {
    valid,
    message: valid
      ? 'Audit matches the expected clean state.'
      : 'Clean state must contain no high or critical audit findings.',
  };
}
