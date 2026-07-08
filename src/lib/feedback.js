// Feedback widget storage + submit handling.
//
// NOTE (seeded code-quality issue, brief §5.5): this handler does not validate
// its inputs — no empty-check, no length cap. Copilot Code Review should flag
// this as a robustness issue on the live demo. Do not fix ahead of time.

const STORAGE_KEY = 'ship-with-ai-feedback';

export function loadSubmissions() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveSubmission(name, message) {
  const submissions = loadSubmissions();
  submissions.push({ name, message, submittedAt: new Date().toISOString() });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(submissions));
  return submissions;
}
