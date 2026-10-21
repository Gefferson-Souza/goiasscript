import { LIMITS } from '@goiasscript/language';
import type { ScanContext, ScannedToken } from './token.types.ts';

const NOT_CLOSED = -1;
const QUOTES = new Set(['"', "'"]);

function quotedEnd(text: string, start: number): number {
  const quote = text[start];
  let index = start + 1;
  while (index < text.length) {
    const character = text[index];
    if (character === '\\') index += 2;
    else if (character === quote) return index + 1;
    else index += 1;
  }
  return NOT_CLOSED;
}

function expressionEnd(text: string, from: number, depth: number): number {
  if (depth > LIMITS.maxNestingDepth) return NOT_CLOSED;
  let braces = 1;
  let index = from;
  while (index < text.length && braces > 0) {
    const character = text.charAt(index);
    if (QUOTES.has(character)) index = quotedEnd(text, index);
    else if (character === '`') index = templateEnd(text, index + 1, depth + 1);
    else index += 1;
    if (index === NOT_CLOSED) return NOT_CLOSED;
    if (character === '{') braces += 1;
    if (character === '}') braces -= 1;
  }
  return braces === 0 ? index : NOT_CLOSED;
}

function templateEnd(text: string, from: number, depth: number): number {
  let index = from;
  while (index < text.length) {
    const character = text[index];
    if (character === '`') return index + 1;
    if (character === '$' && text[index + 1] === '{') {
      index = expressionEnd(text, index + 2, depth + 1);
      if (index === NOT_CLOSED) return NOT_CLOSED;
    } else index += character === '\\' ? 2 : 1;
  }
  return NOT_CLOSED;
}

export function scanTemplate(context: ScanContext, start: number): ScannedToken {
  const end = templateEnd(context.text, start + 1, 0);
  if (end === NOT_CLOSED) {
    context.report('GS0103', start, context.text.length);
    return { kind: 'invalid', end: context.text.length, value: context.text.slice(start) };
  }
  return { kind: 'template', end, value: context.text.slice(start, end) };
}
