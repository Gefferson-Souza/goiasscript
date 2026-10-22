import type { FunctionDeclaration, Identifier, VariableDeclaration } from '../ast/ast.types.ts';
import type { Token } from '../lexer/token.types.ts';
import { skipBalanced } from './balanced.ts';
import { parseParenList } from './groups.ts';
import { identifierOf } from './members.ts';
import { CODES } from './parser.constants.ts';
import { ASSIGNMENT_OPERATOR, PRECEDENCE } from './precedence.constants.ts';
import type { Parser } from './parser.types.ts';
import { reportJsOperator } from './subset-checks.ts';
import { isKeyword, isPunctuator, isWord } from './token-tests.ts';

const TYPE_MARK = ':';
const GENERATOR_MARK = '*';

function parsePattern(parser: Parser, open: Token): Identifier {
  skipBalanced(parser);
  parser.state.report(CODES.destructuring, open.start, parser.state.lastEnd);
  return { type: 'Identifier', name: '', start: open.start, end: open.start };
}

function skipTypeAnnotation(parser: Parser): void {
  const state = parser.state;
  if (!isPunctuator(state.current(), TYPE_MARK)) return;
  const mark = state.advance();
  if (isWord(state.current())) state.advance();
  state.report(CODES.typeAnnotation, mark.start, state.lastEnd);
}

export function parseBindingName(parser: Parser): Identifier {
  const state = parser.state;
  const token = state.current();
  if (token.kind === 'invalid') return identifierOf(state.advance());
  if (isPunctuator(token, '[') || isPunctuator(token, '{')) return parsePattern(parser, token);
  if (!isWord(token)) {
    parser.unexpected();
    return { type: 'Identifier', name: '', start: token.start, end: token.start };
  }
  const name = identifierOf(state.advance());
  skipTypeAnnotation(parser);
  const reserved = token.kind === 'keyword' && token.keyword?.keywordClass === 'reserved';
  return reserved ? { ...name, reservedKeyword: token.keyword } : name;
}

export function parseParameters(parser: Parser): readonly Identifier[] {
  return parseParenList(parser, () => parseBindingName(parser));
}

export function parseVariableDeclaration(parser: Parser): VariableDeclaration {
  const state = parser.state;
  const keywordToken = state.advance();
  const id = parseBindingName(parser);
  const assign = state.current();
  const hasInit = isKeyword(assign, ASSIGNMENT_OPERATOR) || isPunctuator(assign, ASSIGNMENT_OPERATOR);
  if (hasInit) {
    reportJsOperator(parser, state.advance());
    state.skipNewlines();
  }
  const init = hasInit ? parser.parseExpression(PRECEDENCE.assignment) : null;
  const declarator = { type: 'VariableDeclarator', id, init, start: id.start, end: state.lastEnd } as const;
  const kind = keywordToken.keyword?.js === 'let' ? 'let' : 'const';
  return { type: 'VariableDeclaration', kind, declarations: [declarator], keywordToken, start: keywordToken.start, end: state.lastEnd };
}

export function parseFunction(parser: Parser, asyncToken?: Token): FunctionDeclaration {
  const state = parser.state;
  const keywordToken = state.advance();
  if (isPunctuator(state.current(), GENERATOR_MARK)) {
    const mark = state.advance();
    state.report(CODES.generator, mark.start, mark.end);
  }
  const id = parseBindingName(parser);
  const params = parseParameters(parser);
  const body = parser.parseBlock();
  const isAsync = asyncToken !== undefined || keywordToken.keyword?.js === 'async function';
  const start = asyncToken?.start ?? keywordToken.start;
  const common = { type: 'FunctionDeclaration', id, params, body, async: isAsync, keywordToken, start, end: state.lastEnd } as const;
  return asyncToken === undefined ? common : { ...common, asyncToken };
}
