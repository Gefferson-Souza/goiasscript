const MINIMUM_MAJOR = 22;
const MINIMUM_MINOR = 12;
const VERSION_PATTERN = /^v?(\d+)\.(\d+)/u;

export const MINIMUM_NODE_LABEL = `${String(MINIMUM_MAJOR)}.${String(MINIMUM_MINOR)}`;

export function isSupportedNode(version: string): boolean {
  const match = VERSION_PATTERN.exec(version);
  if (match === null) return true;
  const major = Number(match[1]);
  const minor = Number(match[2]);
  return major > MINIMUM_MAJOR || (major === MINIMUM_MAJOR && minor >= MINIMUM_MINOR);
}
