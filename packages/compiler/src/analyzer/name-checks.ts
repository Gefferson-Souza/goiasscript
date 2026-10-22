import { lookupJsReserved, lookupRetiredWord } from '@goiasscript/language';
import type { Identifier } from '../ast/ast.types.ts';
import type { RawDiagnostic } from '../lexer/token.types.ts';
import { GONE_PHRASE } from '../parser/subset.constants.ts';
import { CODES } from './codes.constants.ts';
import { diagnostic } from './diagnostic.ts';
import { FRESH_NAME_PREFIX, MAX_SUGGESTION_DISTANCE } from './name-checks.constants.ts';

export const suggestFreshName = (name: string): string => `${FRESH_NAME_PREFIX}${name}`;

function nextRow(previous: readonly number[], a: string, b: string, rowIndex: number): readonly number[] {
  let left = rowIndex;
  const cells = Array.from({ length: b.length }, (_, column) => {
    const cost = a[rowIndex - 1] === b[column] ? 0 : 1;
    left = Math.min((previous[column + 1] ?? 0) + 1, left + 1, (previous[column] ?? 0) + cost);
    return left;
  });
  return [rowIndex, ...cells];
}

export function editDistance(a: string, b: string): number {
  const firstRow = Array.from({ length: b.length + 1 }, (_, index) => index);
  const rowIndexes = Array.from({ length: a.length }, (_, index) => index + 1);
  const lastRow = rowIndexes.reduce<readonly number[]>((row, rowIndex) => nextRow(row, a, b, rowIndex), firstRow);
  return lastRow[b.length] ?? 0;
}

export function closestName(name: string, candidates: Iterable<string>): string | undefined {
  let best: { readonly name: string; readonly distance: number } | undefined;
  for (const candidate of candidates) {
    const distance = editDistance(name, candidate);
    if (distance <= MAX_SUGGESTION_DISTANCE && (best === undefined || distance < best.distance)) best = { name: candidate, distance };
  }
  return best?.name;
}

// Nome que não resolve: explica palavra aposentada ou do JavaScript antes de cair no "não declarado".
export function unresolvedNameDiagnostic(identifier: Identifier, candidates: Iterable<string>): RawDiagnostic {
  const { name, start, end } = identifier;
  const retired = lookupRetiredWord(name);
  if (retired !== undefined) {
    const detail = retired.replacement === undefined ? { gone: GONE_PHRASE } : { replacement: retired.replacement };
    return diagnostic(CODES.retiredWord, start, end, { word: retired.word, ...detail });
  }
  const reserved = lookupJsReserved(name);
  if (reserved?.kind === 'non-bindable') return diagnostic(CODES.jsWordWithoutEquivalent, start, end, { name, suggestion: reserved.suggestion });
  if (reserved?.kind === 'global') return diagnostic(CODES.jsGlobal, start, end, { name, suggestion: reserved.suggestion });
  if (reserved?.kind === 'keyword' || reserved?.kind === 'strict-reserved') {
    const code = reserved.hasEquivalent ? CODES.jsKeyword : CODES.jsWordWithoutEquivalent;
    return diagnostic(code, start, end, { name, suggestion: reserved.suggestion });
  }
  const suggestion = closestName(name, candidates);
  return diagnostic(CODES.undeclaredName, start, end, suggestion === undefined ? { name } : { name, suggestion });
}
