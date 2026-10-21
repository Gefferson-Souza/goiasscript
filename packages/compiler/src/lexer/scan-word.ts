import { lookupKeyword } from '@goiasscript/language';
import { canonicalName, isCombiningMark, isIdentifierPart, isIdentifierStart, isValidName } from '../source/identifier-alphabet.ts';
import { codePointWidth, isSpaceOrLineTerminator } from './char-classes.ts';
import type { ScanContext, ScannedToken } from './token.types.ts';

const DOLLAR = 0x24;
const ASCII_MAX = 0x7f;

export const isWordRunCharacter = (codePoint: number): boolean =>
  isIdentifierPart(codePoint) ||
  isCombiningMark(codePoint) ||
  codePoint === DOLLAR ||
  (codePoint > ASCII_MAX && !isSpaceOrLineTerminator(codePoint));

export function wordRunEnd(text: string, start: number): number {
  let index = start;
  for (;;) {
    const codePoint = text.codePointAt(index);
    if (codePoint === undefined || !isWordRunCharacter(codePoint)) return index;
    index += codePointWidth(codePoint);
  }
}

function firstInvalidCharacter(name: string): string {
  const characters = Array.from(name);
  const index = characters.findIndex((character, position) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return position === 0 ? !isIdentifierStart(codePoint) : !isIdentifierPart(codePoint);
  });
  return characters[Math.max(index, 0)] ?? '';
}

export function scanWord(context: ScanContext, start: number): ScannedToken {
  const end = wordRunEnd(context.text, start);
  const value = canonicalName(context.text.slice(start, end));
  if (!isValidName(value)) {
    context.report('GS0104', start, end, { character: firstInvalidCharacter(value) });
    return { kind: 'invalid', end, value };
  }
  const keyword = lookupKeyword(value);
  return keyword === undefined ? { kind: 'identifier', end, value } : { kind: 'keyword', end, value, keyword };
}
