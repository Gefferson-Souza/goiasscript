const UPPER_A = 0x41;
const UPPER_Z = 0x5a;
const LOWER_A = 0x61;
const LOWER_Z = 0x7a;
const DIGIT_ZERO = 0x30;
const DIGIT_NINE = 0x39;
const UNDERSCORE = 0x5f;
const COMBINING_START = 0x300;
const COMBINING_END = 0x36f;
const ACCENTED_LETTERS = 'áàâãéêíóôõúüçÁÀÂÃÉÊÍÓÔÕÚÜÇ';
const ACCENTED_CODE_POINTS: ReadonlySet<number> = new Set(
  Array.from(ACCENTED_LETTERS, (letter) => letter.codePointAt(0) ?? 0),
);
const ASCII_ONLY = /^\p{ASCII}*$/u;

const inRange = (codePoint: number, low: number, high: number): boolean => codePoint >= low && codePoint <= high;

export function isIdentifierStart(codePoint: number): boolean {
  return (
    inRange(codePoint, UPPER_A, UPPER_Z) ||
    inRange(codePoint, LOWER_A, LOWER_Z) ||
    codePoint === UNDERSCORE ||
    ACCENTED_CODE_POINTS.has(codePoint)
  );
}

export function isIdentifierPart(codePoint: number): boolean {
  return isIdentifierStart(codePoint) || inRange(codePoint, DIGIT_ZERO, DIGIT_NINE);
}

export function isCombiningMark(codePoint: number): boolean {
  return inRange(codePoint, COMBINING_START, COMBINING_END);
}

export function canonicalName(text: string): string {
  return ASCII_ONLY.test(text) ? text : text.normalize('NFC');
}

export function isValidName(nfcName: string): boolean {
  const [first, ...rest] = Array.from(nfcName, (character) => character.codePointAt(0) ?? 0);
  return first !== undefined && isIdentifierStart(first) && rest.every(isIdentifierPart);
}
