import { readFileSync } from 'node:fs';
import { validateAuditState } from './lib/audit-state.mjs';

const [expectedState, reportPath = 'audit.json'] = process.argv.slice(2);

const report = JSON.parse(readFileSync(reportPath, 'utf8'));
const result = validateAuditState(report, expectedState);

if (!result.valid) {
  throw new Error(result.message);
}

console.log(result.message);
