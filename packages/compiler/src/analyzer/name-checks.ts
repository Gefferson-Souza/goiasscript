import { lookupJsReserved, lookupRetiredWord } from '@goiasscript/language';
import type { Identifier } from '../ast/ast.types.ts';
import type { RawDiagnostic } from '../lexer/token.types.ts';
import { GONE_PHRASE } from '../parser/subset.constants.ts';
import { CODES } from './codes.constants.ts';
import { diagnostic } from './diagnostic.ts';
import { CandidatePool, closestInPools } from './candidate-pool.ts';
import { FRESH_NAME_PREFIX } from './name-checks.constants.ts';

export const suggestFreshName = (name: string): string => `${FRESH_NAME_PREFIX}${name}`;

export const closestName = (name: string, candidates: Iterable<string>): string | undefined =>
  closestInPools(name, [CandidatePool.of(candidates)]);

// Nome que não resolve: explica palavra aposentada ou do JavaScript antes de cair no "não declarado".
export function unresolvedNameDiagnostic(identifier: Identifier, pools: Iterable<CandidatePool>): RawDiagnostic {
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
  const suggestion = closestInPools(name, pools);
  return diagnostic(CODES.undeclaredName, start, end, suggestion === undefined ? { name } : { name, suggestion });
}
