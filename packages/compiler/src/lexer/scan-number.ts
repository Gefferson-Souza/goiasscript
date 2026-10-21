import { isDigit } from './char-classes.ts';
import type { DigitRun, NumberShape } from './number-shape.types.ts';
import { isWordRunCharacter, wordRunEnd } from './scan-word.ts';
import type { NumberForm, ScanContext, ScannedToken } from './token.types.ts';

const PREFIX_FORMS: Readonly<Record<string, NumberForm>> = { x: 'hex', b: 'binary', o: 'octal' };
const PREFIX_DIGITS: Readonly<Record<string, RegExp>> = { hex: /^[0-9a-fA-F]$/u, binary: /^[01]$/u, octal: /^[0-7]$/u };
const SEPARATOR = '_';
const EXPONENT_MARKS = new Set(['e', 'E']);
const EXPONENT_SIGNS = new Set(['+', '-']);

const isDigitOrSeparator = (character: string | undefined): boolean => isDigit(character) || character === SEPARATOR;
const startsDotGroup = (text: string, index: number): boolean => text[index] === '.' && isDigit(text[index + 1]);

function digitRun(text: string, from: number): DigitRun {
  let index = from;
  let separated = false;
  let malformed = false;
  while (isDigitOrSeparator(text[index])) {
    if (text[index] === SEPARATOR) {
      separated = true;
      malformed = malformed || !isDigit(text[index - 1]) || !isDigit(text[index + 1]);
    }
    index += 1;
  }
  return { end: index, separated, malformed };
}

function scanPrefixed(text: string, start: number): NumberShape | undefined {
  const form = text[start] === '0' ? PREFIX_FORMS[(text[start + 1] ?? '').toLowerCase()] : undefined;
  if (form === undefined) return undefined;
  const accepts = PREFIX_DIGITS[form] ?? /^$/u;
  let end = start + 2;
  while (accepts.test(text[end] ?? '')) end += 1;
  return { end, form, valid: end > start + 2 };
}

function scanExponent(text: string, from: number): { readonly end: number; readonly valid: boolean; readonly separated: boolean } {
  if (!EXPONENT_MARKS.has(text[from] ?? '')) return { end: from, valid: true, separated: false };
  const digitsStart = from + (EXPONENT_SIGNS.has(text[from + 1] ?? '') ? 2 : 1);
  const digits = digitRun(text, digitsStart);
  const hasDigits = digits.end > digitsStart;
  return { end: hasDigits ? digits.end : from, valid: hasDigits && !digits.malformed, separated: digits.separated };
}

function scanDecimal(text: string, start: number): NumberShape {
  const integer = digitRun(text, start);
  const fraction = startsDotGroup(text, integer.end) ? digitRun(text, integer.end + 1) : undefined;
  const leadingZero = text[start] === '0' && integer.end - start > 1;
  if (fraction === undefined && text[integer.end] === 'n') {
    return { end: integer.end + 1, form: 'bigint', valid: !leadingZero && !integer.malformed };
  }
  const exponent = scanExponent(text, fraction?.end ?? integer.end);
  const runs = [integer, fraction].filter((run): run is DigitRun => run !== undefined);
  const separated = runs.some((run) => run.separated) || exponent.separated;
  const valid = !leadingZero && exponent.valid && !runs.some((run) => run.malformed) && !startsDotGroup(text, exponent.end);
  return { end: exponent.end, form: separated ? 'separator' : 'decimal', valid };
}

function invalidEnd(text: string, from: number): number {
  let index = from;
  for (;;) {
    const codePoint = text.codePointAt(index);
    if (startsDotGroup(text, index)) index += 1;
    else if (codePoint !== undefined && isWordRunCharacter(codePoint)) index = wordRunEnd(text, index);
    else return index;
  }
}

export function scanNumber(context: ScanContext, start: number): ScannedToken {
  const { text } = context;
  const shape = scanPrefixed(text, start) ?? scanDecimal(text, start);
  const nextCodePoint = text.codePointAt(shape.end);
  const glued = nextCodePoint !== undefined && isWordRunCharacter(nextCodePoint);
  if (shape.valid && !glued) return { kind: 'number', end: shape.end, value: text.slice(start, shape.end), numberForm: shape.form };
  const end = invalidEnd(text, shape.end);
  context.report('GS0101', start, end);
  return { kind: 'invalid', end, value: text.slice(start, end) };
}
