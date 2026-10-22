import type { FunctionDeclaration, Identifier, VariableDeclaration } from '../ast/ast.types.ts';
import type { Token } from '../lexer/token.types.ts';
import { parseParenList } from './groups.ts';
import { identifierOf } from './members.ts';
import { ASSIGNMENT_OPERATOR, PRECEDENCE } from './precedence.constants.ts';
import type { Parser } from './parser.types.ts';
import { isKeyword, isWord } from './token-tests.ts';

export function parseBindingName(parser: Parser): Identifier {
  const state = parser.state;
  const token = state.current();
  if (token.kind === 'invalid') return identifierOf(state.advance());
  if (!isWord(token)) {
    parser.unexpected();
    return { type: 'Identifier', name: '', start: token.start, end: token.start };
  }
  const name = identifierOf(state.advance());
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
  const hasInit = isKeyword(state.current(), ASSIGNMENT_OPERATOR);
  if (hasInit) {
    state.advance();
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
  const id = parseBindingName(parser);
  const params = parseParameters(parser);
  const body = parser.parseBlock();
  const isAsync = asyncToken !== undefined || keywordToken.keyword?.js === 'async function';
  const start = asyncToken?.start ?? keywordToken.start;
  const common = { type: 'FunctionDeclaration', id, params, body, async: isAsync, keywordToken, start, end: state.lastEnd } as const;
  return asyncToken === undefined ? common : { ...common, asyncToken };
}
