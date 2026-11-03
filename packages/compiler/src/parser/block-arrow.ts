import { VARIANT_ARG } from '@goiasscript/language';
import type { Expression } from '../ast/ast.types.ts';
import type { Token } from '../lexer/token.types.ts';
import { CODES, VARIANTS } from './parser.constants.ts';
import type { Parser } from './parser.types.ts';
import { isPunctuator } from './token-tests.ts';

const POSTFIX_OPENERS = ['.', '(', '['] as const;

export const isBlockArrow = (node: Expression): boolean => node.type === 'ArrowFunctionExpression' && node.body.type === 'BlockStatement';

// No JavaScript a seta com bloco encerra a expressão: "x => { } + 1" e "x => { }(2)" nem compilam.
export function reportArrowTail(parser: Parser, token: Token): void {
  parser.state.report(CODES.unexpected, token.start, token.end, { found: token.text, [VARIANT_ARG]: VARIANTS.arrowTail });
}

export function reportArrowPostfix(parser: Parser): void {
  const token = parser.state.current();
  if (POSTFIX_OPENERS.some((opener) => isPunctuator(token, opener))) reportArrowTail(parser, token);
}
