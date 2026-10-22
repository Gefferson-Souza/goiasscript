import { KEYWORDS, STDLIB } from '@goiasscript/language';
import { CODES } from './parser.constants.ts';

const spellingOf = (js: string): string => KEYWORDS.find((entry) => entry.js === js)?.spelling ?? js;
const powerName = STDLIB.find((entry) => entry.js === 'Math.pow')?.name ?? '';

export const SUBSET_BY_WORD: ReadonlyMap<string, string> = new Map([
  ['switch', CODES.switchStatement],
  ['do', CODES.doWhile],
  ['typeof', CODES.typeofOperator],
  ['delete', CODES.deleteOperator],
  ['void', CODES.voidOperator],
  ['import', CODES.modules],
  ['export', CODES.modules],
  ['yield', CODES.generator],
  ['with', CODES.unsupported],
  ['debugger', CODES.unsupported],
]);

export const PREFIX_WORDS: ReadonlySet<string> = new Set(['typeof', 'delete', 'void', 'yield']);
export const HEADED_WORDS: ReadonlySet<string> = new Set(['switch', 'do', 'with']);
export const LINE_WORDS: ReadonlySet<string> = new Set(['import', 'export']);
export const DO_WORD = 'do';
export const WHILE_WORD = 'while';

const assignWith = (operator: string, amount: number): string => `i ${spellingOf('=')} i ${spellingOf(operator)} ${String(amount)}`;

export const JS_OPERATOR_FORMS: ReadonlyMap<string, string> = new Map([
  ['=', spellingOf('=')],
  ['==', spellingOf('===')],
  ['===', spellingOf('===')],
  ['!=', spellingOf('!==')],
  ['!==', spellingOf('!==')],
  ['&&', spellingOf('&&')],
  ['||', spellingOf('||')],
  ['!', spellingOf('!')],
  ['++', assignWith('+', 1)],
  ['--', assignWith('-', 1)],
  ['+=', assignWith('+', 1)],
  ['-=', assignWith('-', 1)],
  ['*=', assignWith('*', 2)],
  ['/=', assignWith('/', 2)],
  ['%=', assignWith('%', 2)],
  ['**', powerName],
]);

export const OUT_OF_V3_OPERATORS: ReadonlySet<string> = new Set([
  '?', '?.', '??', '&', '|', '^', '~', '<<', '>>', '>>>', '&=', '|=', '^=', '??=', '&&=', '||=', '<<=', '>>=', '>>>=', '**=', ',',
]);

export const TERNARY_OPERATOR = '?';
export const TERNARY_SUGGESTION = spellingOf('if');
export const OPTIONAL_CHAIN = '?.';
export const SPREAD_OPERATOR = '...';
export const PRIVATE_MARK = '#';
export const COMMA = ',';
export const UPDATE_OPERATORS: ReadonlySet<string> = new Set(['++', '--']);
export const FOREIGN_PREFIX_OPERATORS: ReadonlySet<string> = new Set(['~', ...UPDATE_OPERATORS]);

export const GONE_PHRASE = 'saiu da linguagem, sem substituto na v3';
