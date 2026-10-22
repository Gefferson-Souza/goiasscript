import type { ClassDeclaration, MethodDefinition } from '../ast/ast.types.ts';
import type { Token } from '../lexer/token.types.ts';
import { parseBindingName, parseParameters } from './declarations.ts';
import { acceptPunctuator, expectPunctuator } from './expect.ts';
import { skipBlockBreak } from './layout.ts';
import { ListBuilder } from './list-builder.ts';
import { identifierOf } from './members.ts';
import { CODES } from './parser.constants.ts';
import type { Parser } from './parser.types.ts';
import { PRECEDENCE } from './precedence.constants.ts';
import { ensureProgress, reportUnexpected } from './recovery.ts';
import { PRIVATE_MARK } from './subset.constants.ts';
import { isKeyword, isPunctuator, isWord, keywordJs } from './token-tests.ts';

const CONSTRUCTOR = 'constructor';
const ACCESSOR_WORDS: ReadonlySet<string> = new Set(['get', 'set']);

interface Modifiers {
  readonly tokens: readonly Token[];
  readonly isStatic: boolean;
  readonly isAsync: boolean;
}

function readModifiers(parser: Parser): Modifiers {
  const state = parser.state;
  const tokens = new ListBuilder<Token>();
  let isStatic = false;
  let isAsync = false;
  for (;;) {
    const token = state.current();
    const js = keywordJs(token);
    const modifier = (js === 'static' || js === 'async') && !isPunctuator(state.visibleAt(1), '(');
    if (!modifier) break;
    isStatic = isStatic || js === 'static';
    isAsync = isAsync || js === 'async';
    tokens.add(state.advance());
  }
  return { tokens: tokens.build(), isStatic, isAsync };
}

function skipFieldInitializer(parser: Parser): void {
  const state = parser.state;
  const assign = state.current();
  if (isKeyword(assign, '=') || isPunctuator(assign, '=')) {
    state.advance();
    parser.parseExpression(PRECEDENCE.assignment);
  }
  acceptPunctuator(parser, ';');
}

function skipPrivateField(parser: Parser): void {
  const state = parser.state;
  const mark = state.advance();
  if (isWord(state.current())) state.advance();
  state.report(CODES.privateField, mark.start, state.lastEnd);
  skipFieldInitializer(parser);
}

function skipAccessorWord(parser: Parser): Token {
  const state = parser.state;
  const word = state.current();
  const isAccessor = word.kind === 'identifier' && ACCESSOR_WORDS.has(word.value) && isWord(state.visibleAt(1)) && isPunctuator(state.visibleAt(2), '(');
  if (!isAccessor) return word;
  state.report(CODES.accessor, word.start, state.visibleAt(1).end);
  state.advance();
  return state.current();
}

function parseMethod(parser: Parser): MethodDefinition | undefined {
  const state = parser.state;
  const modifiers = readModifiers(parser);
  if (isPunctuator(state.current(), PRIVATE_MARK)) {
    skipPrivateField(parser);
    return undefined;
  }
  const nameToken = skipAccessorWord(parser);
  if (!isWord(nameToken)) {
    reportUnexpected(parser);
    return undefined;
  }
  state.advance();
  if (!isPunctuator(state.current(), '(')) {
    state.report(CODES.classField, nameToken.start, nameToken.end);
    skipFieldInitializer(parser);
    return undefined;
  }
  const isConstructor = isKeyword(nameToken, CONSTRUCTOR);
  const key = isConstructor ? { ...identifierOf(nameToken), name: CONSTRUCTOR } : identifierOf(nameToken);
  const params = parseParameters(parser);
  const body = parser.parseBlock();
  const start = modifiers.tokens[0]?.start ?? nameToken.start;
  return {
    type: 'MethodDefinition',
    key,
    params,
    body,
    kind: isConstructor ? 'constructor' : 'method',
    static: modifiers.isStatic,
    async: modifiers.isAsync,
    keywordTokens: isConstructor ? [...modifiers.tokens, nameToken] : modifiers.tokens,
    start,
    end: state.lastEnd,
  };
}

function parseClassBody(parser: Parser): readonly MethodDefinition[] {
  const state = parser.state;
  skipBlockBreak(state);
  const opener = state.current();
  if (opener.kind !== 'end-of-file' && !isPunctuator(opener, '{')) {
    state.report(CODES.bodyWithoutBraces, opener.start, opener.end);
    return [];
  }
  if (expectPunctuator(parser, '{') === undefined) return [];
  state.push('statement');
  const members = new ListBuilder<MethodDefinition>();
  for (;;) {
    state.skipNewlines();
    const token = state.current();
    if (state.aborted || token.kind === 'end-of-file' || isPunctuator(token, '}')) break;
    const before = state.cursor;
    const method = parseMethod(parser);
    if (method !== undefined) members.add(method);
    ensureProgress(parser, before);
  }
  expectPunctuator(parser, '}');
  state.pop();
  return members.build();
}

export function parseClass(parser: Parser): ClassDeclaration {
  const state = parser.state;
  const keywordToken = state.advance();
  const id = parseBindingName(parser);
  const hasParent = isKeyword(state.current(), 'extends');
  if (hasParent) state.advance();
  const superClass = hasParent ? parser.parseExpression(PRECEDENCE.postfix) : null;
  const fallback: readonly MethodDefinition[] = [];
  const body = parser.nested(keywordToken.start, () => parseClassBody(parser), fallback);
  return { type: 'ClassDeclaration', id, superClass, body, keywordToken, start: keywordToken.start, end: state.lastEnd };
}
