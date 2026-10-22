import type { ClassDeclaration, MethodDefinition } from '../ast/ast.types.ts';
import type { Token } from '../lexer/token.types.ts';
import { parseBindingName, parseParameters } from './declarations.ts';
import { expectPunctuator } from './expect.ts';
import { skipBlockBreak } from './layout.ts';
import { ListBuilder } from './list-builder.ts';
import { identifierOf } from './members.ts';
import type { Parser } from './parser.types.ts';
import { PRECEDENCE } from './precedence.constants.ts';
import { ensureProgress, reportUnexpected } from './recovery.ts';
import { isKeyword, isPunctuator, isWord, keywordJs } from './token-tests.ts';

const CONSTRUCTOR = 'constructor';

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

function parseMethod(parser: Parser): MethodDefinition | undefined {
  const state = parser.state;
  const modifiers = readModifiers(parser);
  const nameToken = state.current();
  if (!isWord(nameToken)) {
    reportUnexpected(parser);
    return undefined;
  }
  state.advance();
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
