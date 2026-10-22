import type { Token } from '../lexer/token.types.ts';
import type { Parser } from './parser.types.ts';

const OPENERS: ReadonlySet<string> = new Set(['(', '[', '{']);
const CLOSERS: ReadonlySet<string> = new Set([')', ']', '}']);

const delta = (token: Token): number => {
  if (token.kind !== 'punctuator') return 0;
  if (OPENERS.has(token.value)) return 1;
  return CLOSERS.has(token.value) ? -1 : 0;
};

// Consome o agrupamento aberto na posição atual por contagem, sem recursão, para não cascatear erros.
export function skipBalanced(parser: Parser): void {
  const state = parser.state;
  let depth = 0;
  while (state.current().kind !== 'end-of-file' && !state.aborted) {
    depth += delta(state.current());
    state.advance();
    if (depth <= 0) return;
  }
}
