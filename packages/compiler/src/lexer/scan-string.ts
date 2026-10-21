import { isForbiddenSeparator, isLineBreak } from './char-classes.ts';
import { readEscape } from './read-escape.ts';
import type { ScanContext, ScannedToken } from './token.types.ts';

function failUnterminated(context: ScanContext, start: number, end: number): ScannedToken {
  context.report('GS0103', start, end);
  return { kind: 'invalid', end, value: '' };
}

export function scanString(context: ScanContext, start: number): ScannedToken {
  const { text } = context;
  const quote = text[start];
  let index = start + 1;
  let value = '';
  while (index < text.length && text[index] !== quote) {
    const character = text[index] ?? '';
    if (isLineBreak(character)) return failUnterminated(context, start, index);
    if (character === '\\') {
      const escape = readEscape(context, index);
      value += escape.value;
      index = escape.end;
      continue;
    }
    if (isForbiddenSeparator(character)) context.report('GS0105', index, index + 1);
    value += character;
    index += 1;
  }
  return index >= text.length ? failUnterminated(context, start, index) : { kind: 'string', end: index + 1, value };
}
