import { readFileSync } from 'node:fs';
import { validateAuditState } from './lib/audit-state.mjs';
import { versionAtLeast } from './lib/version.mjs';

const [expectedState, reportPath = 'audit.json'] = process.argv.slice(2);

const report = JSON.parse(readFileSync(reportPath, 'utf8'));
const manifest = JSON.parse(
  readFileSync(new URL('../demo-kit.json', import.meta.url), 'utf8'),
);
if (manifest.schemaVersion !== 1) {
  throw new Error(`Unsupported demo-kit schema version: ${manifest.schemaVersion}`);
}
const policy =
  expectedState === 'start' ? manifest.startState.audit : manifest.finishedState.audit;
const result = validateAuditState(report, expectedState, policy);

if (!result.valid) {
  throw new Error(result.message);
}

if (expectedState === 'clean') {
  const packageJson = JSON.parse(
    readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
  );
  const actualVersion = packageJson.dependencies?.marked;
  if (
    !actualVersion ||
    !versionAtLeast(actualVersion, manifest.finishedState.minimumSafeMarkedVersion)
  ) {
    throw new Error(
      `Clean state requires marked ${manifest.finishedState.minimumSafeMarkedVersion} or newer.`,
    );
  }
}

console.log(result.message);
