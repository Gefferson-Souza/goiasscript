import { KEYWORDS, STDLIB } from '../src/index.ts';
import type { GeneratedFile } from './generators.types.ts';
import { compareText, toJson } from './shared.ts';

export function renderGlossaryFiles(): readonly GeneratedFile[] {
  const keywords = KEYWORDS.map((entry) => ({ term: entry.spelling, js: entry.js, category: entry.category }));
  const library = STDLIB.map((entry) => ({ term: entry.name, js: entry.js, semantics: entry.semantics }));
  const byTerm = (left: { readonly term: string }, right: { readonly term: string }): number => compareText(left.term, right.term);
  return [{ path: 'packages/language/generated/glossary.json', content: toJson({ keywords: keywords.toSorted(byTerm), library: library.toSorted(byTerm) }) }];
}
