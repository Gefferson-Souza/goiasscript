import type { SessionBinding } from '@goiasscript/compiler';
import { toPrintable, toPrintableMultiline } from '../args/printable-text.ts';

const HISTORY_CONTINUATION = '\n    ';
const BINDING_GAP = '  ';

export const formatBindings = (bindings: readonly SessionBinding[]): string => {
  const names = bindings.map((binding) => toPrintable(binding.name));
  const width = Math.max(...names.map((name) => name.length));
  return `${bindings.map((binding, index) => `${(names[index] ?? '').padEnd(width)}${BINDING_GAP}${binding.kind}`).join('\n')}\n`;
};

export const formatHistory = (entries: readonly string[]): string =>
  `${entries.map((entry, index) => `${String(index + 1)}${BINDING_GAP}${toPrintableMultiline(entry).replaceAll('\n', HISTORY_CONTINUATION)}`).join('\n')}\n`;
