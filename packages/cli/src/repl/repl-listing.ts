import type { SessionBinding } from '@goiasscript/compiler';

const HISTORY_CONTINUATION = '\n    ';
const BINDING_GAP = '  ';

export const formatBindings = (bindings: readonly SessionBinding[]): string => {
  const width = Math.max(...bindings.map((binding) => binding.name.length));
  return `${bindings.map((binding) => `${binding.name.padEnd(width)}${BINDING_GAP}${binding.kind}`).join('\n')}\n`;
};

export const formatHistory = (entries: readonly string[]): string =>
  `${entries.map((entry, index) => `${String(index + 1)}${BINDING_GAP}${entry.replaceAll('\n', HISTORY_CONTINUATION)}`).join('\n')}\n`;
