import { lookupJsReserved, lookupKeyword } from '@goiasscript/language';
import type { Token } from '../lexer/token.types.ts';
import { CODES } from './parser.constants.ts';
import type { Parser } from './parser.types.ts';
import { JS_OPERATOR_FORMS, OUT_OF_V3_OPERATORS, SPREAD_OPERATOR, SUBSET_BY_WORD, TERNARY_OPERATOR, TERNARY_SUGGESTION } from './subset.constants.ts';

// Palavra do JavaScript em posição de sintaxe: devolve o token já visto como a keyword goiana, ou undefined.
export function reportJsWord(parser: Parser, token: Token): Token | undefined {
  const code = SUBSET_BY_WORD.get(token.value);
  if (code !== undefined) {
    parser.state.report(code, token.start, token.end, { name: token.value });
    return undefined;
  }
  const reserved = lookupJsReserved(token.value);
  if (reserved === undefined || !reserved.hasEquivalent || reserved.kind === 'global') return undefined;
  parser.state.report(CODES.jsKeyword, token.start, token.end, { name: token.value, suggestion: reserved.suggestion });
  const entry = lookupKeyword(reserved.suggestion);
  return entry === undefined ? undefined : { ...token, kind: 'keyword', keyword: entry };
}

// Lê o token atual como a keyword goiana equivalente quando ele é palavra do JavaScript.
export function adoptJsWord(parser: Parser): Token {
  const token = parser.state.current();
  if (token.kind !== 'identifier' || SUBSET_BY_WORD.has(token.value)) return token;
  const adopted = reportJsWord(parser, token);
  if (adopted === undefined) return token;
  parser.state.adopt(token, adopted);
  return adopted;
}

// Operador do JavaScript no lugar do goiano: reporta e diz se o token era um desses.
export function reportJsOperator(parser: Parser, token: Token): boolean {
  if (token.kind !== 'punctuator') return false;
  const suggestion = JS_OPERATOR_FORMS.get(token.value);
  if (suggestion !== undefined) {
    parser.state.report(CODES.jsOperator, token.start, token.end, { name: token.value, suggestion });
    return true;
  }
  if (!OUT_OF_V3_OPERATORS.has(token.value)) return false;
  const hint = token.value === TERNARY_OPERATOR ? { suggestion: TERNARY_SUGGESTION } : {};
  parser.state.report(CODES.foreignOperator, token.start, token.end, { name: token.value, ...hint });
  return true;
}

// Prefixo que o GoiásScript não tem (`typeof`, `...`, `~`, `++`): reporta a forma certa para cada um.
export function reportForeignPrefix(parser: Parser, token: Token): void {
  if (token.kind === 'identifier') reportJsWord(parser, token);
  else if (token.value === SPREAD_OPERATOR) parser.state.report(CODES.spread, token.start, token.end);
  else reportJsOperator(parser, token);
}
