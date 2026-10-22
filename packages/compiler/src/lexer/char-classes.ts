const LINE_TERMINATORS = new Set(['\n', '\r']);
const ECMA_SPACES = /^\s$/u;
const TRIVIA_SPACE = /^[\t\v\f \u00a0\u1680\u2000-\u200a\u202f\u205f\u3000]$/u;
const FORBIDDEN_SEPARATORS = new Set(['\u2028', '\u2029']);
const DIGIT_ZERO = '0';
const DIGIT_NINE = '9';
const ASCII_SPACES = new Set([' ', '\t']);
const ASCII_LIMIT = '\u007f';

export const isLineBreak = (character: string | undefined): boolean => character !== undefined && LINE_TERMINATORS.has(character);
export const isForbiddenSeparator = (character: string | undefined): boolean => character !== undefined && FORBIDDEN_SEPARATORS.has(character);
export const isTriviaSpace = (character: string | undefined): boolean => {
  if (character === undefined) return false;
  if (character <= ASCII_LIMIT) return ASCII_SPACES.has(character) || character === '\v' || character === '\f';
  return TRIVIA_SPACE.test(character);
};
export const isDigit = (character: string | undefined): boolean => character !== undefined && character.length === 1 && character >= DIGIT_ZERO && character <= DIGIT_NINE;
export const isSpaceOrLineTerminator = (codePoint: number): boolean => ECMA_SPACES.test(String.fromCodePoint(codePoint));

const BMP_MAX = 0xffff;
export const codePointWidth = (codePoint: number): number => (codePoint > BMP_MAX ? 2 : 1);
