import { PRECEDENCE } from './precedence.constants.ts';
import type { ForeignOperator } from './operators.types.ts';

const BITWISE_OR = 5;
const BITWISE_XOR = 6;
const BITWISE_AND = 7;
const SHIFT = 10;
const EXPONENT = 13;

const binary = (js: string, precedence: number, logical = false): ForeignOperator => ({ js, precedence, logical, assignment: false });
const compound = (js: string): ForeignOperator => ({ js, precedence: PRECEDENCE.assignment, logical: false, assignment: true });

export const FOREIGN_BINARY_OPERATORS: ReadonlyMap<string, ForeignOperator> = new Map([
  ['=', compound('=')],
  ['==', binary('===', PRECEDENCE.equality)],
  ['===', binary('===', PRECEDENCE.equality)],
  ['!=', binary('!==', PRECEDENCE.equality)],
  ['!==', binary('!==', PRECEDENCE.equality)],
  ['&&', binary('&&', PRECEDENCE.logicalAnd, true)],
  ['||', binary('||', PRECEDENCE.logicalOr, true)],
  ['??', binary('??', PRECEDENCE.logicalOr, true)],
  ['**', binary('**', EXPONENT)],
  ['|', binary('|', BITWISE_OR)],
  ['^', binary('^', BITWISE_XOR)],
  ['&', binary('&', BITWISE_AND)],
  ['<<', binary('<<', SHIFT)],
  ['>>', binary('>>', SHIFT)],
  ['>>>', binary('>>>', SHIFT)],
  ...['+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '??=', '&&=', '||=', '<<=', '>>=', '>>>=', '**='].map(
    (symbol): readonly [string, ForeignOperator] => [symbol, compound(symbol)],
  ),
]);
