const LINE_TERMINATORS = new Set(['\n', '\r']);
const ECMA_SPACES = /^\s$/u;
const TRIVIA_SPACE = /^[\t\v\f \u00a0\u1680\u2000-\u200a\u202f\u205f\u3000]$/u;
const FORBIDDEN_SEPARATORS = new Set(['\u2028', '\u2029']);
const DIGIT = /^[0-9]$/u;

export const isLineBreak = (character: string | undefined): boolean => character !== undefined && LINE_TERMINATORS.has(character);
export const isForbiddenSeparator = (character: string | undefined): boolean => character !== undefined && FORBIDDEN_SEPARATORS.has(character);
export const isTriviaSpace = (character: string | undefined): boolean => character !== undefined && TRIVIA_SPACE.test(character);
export const isDigit = (character: string | undefined): boolean => character !== undefined && DIGIT.test(character);
export const isSpaceOrLineTerminator = (codePoint: number): boolean => ECMA_SPACES.test(String.fromCodePoint(codePoint));

const BMP_MAX = 0xffff;
export const codePointWidth = (codePoint: number): number => (codePoint > BMP_MAX ? 2 : 1);
