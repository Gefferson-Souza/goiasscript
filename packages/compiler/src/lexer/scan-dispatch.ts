import { codePointWidth, isDigit, isForbiddenSeparator } from './char-classes.ts';
import { scanNumber } from './scan-number.ts';
import { scanPunctuator } from './scan-punctuator.ts';
import { scanString } from './scan-string.ts';
import { scanTemplate } from './scan-template.ts';
import { isWordRunCharacter, scanWord } from './scan-word.ts';
import type { ScanContext, ScannedToken } from './token.types.ts';

const BYTE_ORDER_MARK = '\ufeff';
const QUOTES = new Set(['"', "'"]);
const BACKTICK = '`';
const DOT = '.';

function scanSingleCharacter(context: ScanContext, start: number, code: string, args?: Readonly<Record<string, string>>): ScannedToken {
  const codePoint = context.text.codePointAt(start) ?? 0;
  const end = start + codePointWidth(codePoint);
  context.report(code, start, end, args);
  return { kind: 'invalid', end, value: context.text.slice(start, end) };
}

export function scanCode(context: ScanContext, start: number): ScannedToken {
  const { text } = context;
  const character = text.charAt(start);
  const codePoint = text.codePointAt(start) ?? 0;
  if (isDigit(character) || (character === DOT && isDigit(text.charAt(start + 1)))) return scanNumber(context, start);
  if (QUOTES.has(character)) return scanString(context, start);
  if (character === BACKTICK) return scanTemplate(context, start);
  if (isForbiddenSeparator(character) || character === BYTE_ORDER_MARK) return scanSingleCharacter(context, start, 'GS0105');
  if (isWordRunCharacter(codePoint)) return scanWord(context, start);
  const punctuator = scanPunctuator(text, start);
  if (punctuator !== undefined) return punctuator;
  return scanSingleCharacter(context, start, 'GS0107', { character: String.fromCodePoint(codePoint) });
}
