import { codePointWidth, isDigit, isForbiddenSeparator, isLineBreak } from './char-classes.ts';
import type { Escape, ScanContext } from './token.types.ts';

const HEX_RADIX = 16;
const MAX_CODE_POINT = 0x10ffff;
const BYTE_DIGITS = 2;
const UNIT_DIGITS = 4;
const MAX_BRACED_DIGITS = 6;
const HEX_DIGIT = /^[0-9a-fA-F]$/u;
const SIMPLE_ESCAPES: ReadonlyMap<string, string> = new Map([
  ['n', '\n'], ['r', '\r'], ['t', '\t'], ['b', '\b'], ['f', '\f'], ['v', '\v'], ['\\', '\\'], ["'", "'"], ['"', '"'],
]);

function invalid(context: ScanContext, at: number, end: number): Escape {
  context.report('GS0102', at, end);
  return { end, value: '' };
}

function hexDigitsEnd(text: string, from: number): number {
  let index = from;
  while (HEX_DIGIT.test(text[index] ?? '')) index += 1;
  return index;
}

function readFixedHex(context: ScanContext, at: number, from: number, count: number): Escape {
  const digitsEnd = Math.min(hexDigitsEnd(context.text, from), from + count);
  if (digitsEnd - from < count) return invalid(context, at, digitsEnd);
  return { end: digitsEnd, value: String.fromCodePoint(Number.parseInt(context.text.slice(from, digitsEnd), HEX_RADIX)) };
}

function readBracedHex(context: ScanContext, at: number): Escape {
  const { text } = context;
  const from = at + BYTE_DIGITS + 1;
  const digitsEnd = hexDigitsEnd(text, from);
  const closed = text[digitsEnd] === '}';
  const end = closed ? digitsEnd + 1 : digitsEnd;
  const codePoint = Number.parseInt(text.slice(from, digitsEnd), HEX_RADIX);
  const sized = digitsEnd > from && digitsEnd - from <= MAX_BRACED_DIGITS;
  if (!closed || !sized || codePoint > MAX_CODE_POINT) return invalid(context, at, end);
  return { end, value: String.fromCodePoint(codePoint) };
}

export function readEscape(context: ScanContext, at: number): Escape {
  const { text } = context;
  const marker = text[at + 1];
  if (marker === undefined) return { end: at + 1, value: '' };
  const simple = SIMPLE_ESCAPES.get(marker);
  if (simple !== undefined) return { end: at + 2, value: simple };
  if (marker === '0' && !isDigit(text[at + 2])) return { end: at + 2, value: '\0' };
  if (isDigit(marker)) return invalid(context, at, at + 2);
  if (marker === 'x') return readFixedHex(context, at, at + BYTE_DIGITS, BYTE_DIGITS);
  if (marker === 'u') return text[at + BYTE_DIGITS] === '{' ? readBracedHex(context, at) : readFixedHex(context, at, at + BYTE_DIGITS, UNIT_DIGITS);
  if (isLineBreak(marker)) return invalid(context, at, at + 1);
  if (isForbiddenSeparator(marker)) context.report('GS0105', at + 1, at + 2);
  const width = codePointWidth(text.codePointAt(at + 1) ?? 0);
  return { end: at + 1 + width, value: text.slice(at + 1, at + 1 + width) };
}
