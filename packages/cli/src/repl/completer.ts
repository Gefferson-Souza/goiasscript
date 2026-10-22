import { COMPLETION_LABELS } from '@goiasscript/language';
import type { SessionBinding } from '@goiasscript/compiler';
import type { Completion, FoldedLabel } from './completer.types.ts';

const TOKEN_AT_END = /[\p{L}\p{N}_.]*$/u;
const DOT = '.';
const COMBINING_MARKS = /\p{M}/gu;

const fold = (text: string): string => text.normalize('NFD').replace(COMBINING_MARKS, '');

const FOLDED_LABELS: readonly FoldedLabel[] = COMPLETION_LABELS.map((entry) => ({ ...entry, folded: fold(entry.label) }));

const unique = (names: readonly string[]): readonly string[] => [...new Set(names)].toSorted();

const bySpelling = (prefix: string): readonly FoldedLabel[] => FOLDED_LABELS.filter((entry) => entry.folded.startsWith(fold(prefix)));

function completeMember(token: string): readonly string[] {
  const dotAt = token.lastIndexOf(DOT);
  const [receiver, typed] = [token.slice(0, dotAt), token.slice(dotAt + 1)];
  if (typed === '') return [];
  return bySpelling(typed).filter((entry) => entry.member).map((entry) => `${receiver}${DOT}${entry.canonical}`);
}

function completeWord(token: string, bindings: readonly SessionBinding[]): readonly string[] {
  const vocabulary = bySpelling(token).filter((entry) => !entry.label.includes(DOT)).map((entry) => entry.canonical);
  const sessionNames = bindings.map((binding) => binding.name).filter((name) => fold(name).startsWith(fold(token)));
  return [...vocabulary, ...sessionNames];
}

export function completeLine(line: string, bindings: readonly SessionBinding[]): Completion {
  const token = TOKEN_AT_END.exec(line)?.[0] ?? '';
  if (token === '') return [[], ''];
  if (!token.includes(DOT)) return [unique(completeWord(token, bindings)), token];
  const statics = bySpelling(token).filter((entry) => entry.label.includes(DOT)).map((entry) => entry.canonical);
  return [unique(statics.length > 0 ? statics : completeMember(token)), token];
}
