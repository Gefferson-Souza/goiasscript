import { DIAGNOSTICS, JS_RESERVED, KEYWORDS, STDLIB } from '../src/index.ts';
import type { GeneratedFile } from './generators.types.ts';
import { compareText, toJson } from './shared.ts';

const JS_SINCE = '3.0.0';

interface Versioned {
  readonly since: string;
  readonly deprecatedIn?: string;
}
const lifecycle = (entry: Versioned) => ({ since: entry.since, ...(entry.deprecatedIn === undefined ? {} : { deprecatedIn: entry.deprecatedIn }) });

export function renderVocabularyLockFiles(): readonly GeneratedFile[] {
  const reserved = [
    ...KEYWORDS.map((entry) => ({ name: entry.spelling, source: 'keyword', ...lifecycle(entry) })),
    ...STDLIB.map((entry) => ({ name: entry.name, source: 'stdlib', ...lifecycle(entry) })),
    ...JS_RESERVED.map((entry) => ({ name: entry.name, source: 'js', since: JS_SINCE })),
  ].toSorted((left, right) => compareText(left.source + left.name, right.source + right.name));
  const diagnostics = DIAGNOSTICS.map((entry) => ({ code: entry.code, severity: entry.severity })).toSorted((left, right) => compareText(left.code, right.code));
  return [{ path: 'docs/spec/vocabulario.lock.json', content: toJson({ reserved, diagnostics }) }];
}
