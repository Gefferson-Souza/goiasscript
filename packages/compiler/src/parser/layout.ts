import type { Token } from '../lexer/token.types.ts';
import type { ParserState } from './parser-state.ts';
import type { Parser } from './parser.types.ts';
import { adoptJsWord } from './subset-checks.ts';
import { isPunctuator, keywordJs } from './token-tests.ts';

export function skipBlockBreak(state: ParserState): void {
  if (state.top === 'statement' && state.rawPeek(0).kind === 'newline' && isPunctuator(state.rawPeek(1), '{')) state.skipNewlines();
}

export function continueAcrossNewline(state: ParserState): void {
  if (state.top === 'statement' && state.rawPeek(0).kind === 'newline' && isPunctuator(state.rawPeek(1), '.')) state.skipNewlines();
}

const isContinuation = (token: Token, allowed: ReadonlySet<string>): boolean =>
  allowed.has(keywordJs(token) ?? '') || (token.kind === 'identifier' && allowed.has(token.value));

export function continuesWith(parser: Parser, allowed: ReadonlySet<string>): boolean {
  const state = parser.state;
  const sameLine = state.rawPeek(0);
  if (!isContinuation(sameLine, allowed)) {
    if (state.target === 'repl' || sameLine.kind !== 'newline' || !isContinuation(state.rawPeek(1), allowed)) return false;
    state.skipNewlines();
  }
  adoptJsWord(parser);
  return true;
}
