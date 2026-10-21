import { KEYWORDS, STDLIB } from '../src/index.ts';
import type { StdlibEntry } from '../src/index.ts';
import type { GeneratedFile } from './generators.types.ts';
import { compareText, keywordSpellings, stdlibSpellings, toJson } from './shared.ts';

type CompletionKind = 'keyword' | 'function' | 'property';
interface Completion {
  readonly label: string;
  readonly detail: string;
  readonly kind: CompletionKind;
}

const kindOf = (entry: StdlibEntry): CompletionKind => (entry.form === 'property' ? 'property' : 'function');

export function renderCompletionsFiles(): readonly GeneratedFile[] {
  const completions: readonly Completion[] = [
    ...KEYWORDS.flatMap((entry) => keywordSpellings([entry]).map((label): Completion => ({ label, detail: entry.js, kind: 'keyword' }))),
    ...STDLIB.flatMap((entry) => stdlibSpellings(entry).map((label): Completion => ({ label, detail: entry.js, kind: kindOf(entry) }))),
  ].toSorted((left, right) => compareText(left.label, right.label) || compareText(left.kind, right.kind));
  return [{ path: 'packages/language/generated/completions.json', content: toJson(completions) }];
}
