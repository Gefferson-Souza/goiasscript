import type { ErrorNode } from '../ast/ast.types.ts';
import type { Token } from '../lexer/token.types.ts';
import { skipBalanced } from './balanced.ts';
import { CODES } from './parser.constants.ts';
import type { Parser } from './parser.types.ts';
import { errorNode, synchronize } from './recovery.ts';
import { reportJsWord } from './subset-checks.ts';
import { DO_WORD, HEADED_WORDS, LINE_WORDS, PREFIX_WORDS, SUBSET_BY_WORD, WHILE_WORD } from './subset.constants.ts';
import { isKeyword, isPunctuator } from './token-tests.ts';

function parseLabel(parser: Parser, name: Token): ErrorNode {
  const state = parser.state;
  state.advance();
  const colon = state.advance();
  state.report(CODES.label, name.start, colon.end);
  return errorNode(CODES.label, name.start, colon.end);
}

function skipWhileTail(parser: Parser): void {
  const state = parser.state;
  const next = state.current();
  if (!isKeyword(next, WHILE_WORD) && !(next.kind === 'identifier' && next.value === WHILE_WORD)) return;
  state.advance();
  if (isPunctuator(state.current(), '(')) skipBalanced(parser);
}

function parseHeaded(parser: Parser, word: Token): ErrorNode {
  const state = parser.state;
  reportJsWord(parser, word);
  state.advance();
  while (isPunctuator(state.current(), '(')) skipBalanced(parser);
  if (isPunctuator(state.current(), '{')) skipBalanced(parser);
  if (word.value === DO_WORD) skipWhileTail(parser);
  return errorNode(SUBSET_BY_WORD.get(word.value) ?? CODES.unsupported, word.start, state.lastEnd);
}

function parseToLineEnd(parser: Parser, word: Token): ErrorNode {
  reportJsWord(parser, word);
  parser.state.advance();
  synchronize(parser);
  return errorNode(SUBSET_BY_WORD.get(word.value) ?? CODES.unsupported, word.start, parser.state.lastEnd);
}

function parseBareWord(parser: Parser, word: Token): ErrorNode {
  reportJsWord(parser, word);
  parser.state.advance();
  return errorNode(SUBSET_BY_WORD.get(word.value) ?? CODES.unsupported, word.start, word.end);
}

// Instruções do JavaScript sem forma goiana: rótulo, switch, do, with, módulos e debugger.
export function parseSubsetStatement(parser: Parser): ErrorNode | undefined {
  const token = parser.state.current();
  if (token.kind !== 'identifier') return undefined;
  if (isPunctuator(parser.state.visibleAt(1), ':')) return parseLabel(parser, token);
  if (HEADED_WORDS.has(token.value)) return parseHeaded(parser, token);
  if (LINE_WORDS.has(token.value)) return parseToLineEnd(parser, token);
  const isPrefixWord = PREFIX_WORDS.has(token.value);
  return SUBSET_BY_WORD.has(token.value) && !isPrefixWord ? parseBareWord(parser, token) : undefined;
}
