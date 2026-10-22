import type { CompletionKind, CompletionLabel } from './completions.types.ts';
import { KEYWORDS } from './keywords/keywords.data.ts';
import { STDLIB } from './stdlib/index.ts';
import type { StdlibEntry } from './stdlib/stdlib.types.ts';

const NON_MEMBER_RECEIVERS: ReadonlySet<string> = new Set(['global', 'namespace']);

const compareText = (left: string, right: string): number => {
  if (left < right) return -1;
  return left > right ? 1 : 0;
};

const kindOf = (entry: StdlibEntry): CompletionKind => (entry.form === 'property' ? 'property' : 'function');

const spellingsOf = (official: string, ascii: string | undefined): readonly string[] => (ascii === undefined ? [official] : [official, ascii]);

const keywordLabels = KEYWORDS.flatMap((entry) =>
  spellingsOf(entry.spelling, entry.asciiSpelling).map((label): CompletionLabel => ({ label, canonical: entry.spelling, detail: entry.js, kind: 'keyword', member: false })),
);

const stdlibLabels = STDLIB.flatMap((entry) =>
  spellingsOf(entry.name, entry.asciiName).map(
    (label): CompletionLabel => ({
      label,
      canonical: entry.name,
      detail: entry.js,
      kind: kindOf(entry),
      member: !entry.name.includes('.') && !NON_MEMBER_RECEIVERS.has(entry.receiver),
    }),
  ),
);

export const COMPLETION_LABELS: readonly CompletionLabel[] = [...keywordLabels, ...stdlibLabels].toSorted(
  (left, right) => compareText(left.label, right.label) || compareText(left.kind, right.kind),
);
