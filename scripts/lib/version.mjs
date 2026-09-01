export function versionAtLeast(actual, minimum) {
  const parse = (version) =>
    version
      .replace(/^v/, '')
      .split('.')
      .slice(0, 3)
      .map((part) => Number.parseInt(part, 10));
  const actualParts = parse(actual);
  const minimumParts = parse(minimum);

  for (let index = 0; index < 3; index += 1) {
    if (actualParts[index] > minimumParts[index]) return true;
    if (actualParts[index] < minimumParts[index]) return false;
  }
  return true;
}
