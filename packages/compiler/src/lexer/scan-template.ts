import { LIMITS } from '@goiasscript/language';
import { isForbiddenSeparator, isLineBreak } from './char-classes.ts';
import type { ScanContext, ScannedToken } from './token.types.ts';

const NOT_CLOSED = -1;
const QUOTES = new Set(['"', "'"]);
const OPERAND_END = /[\p{ID_Continue}$)\]}]/u;

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

function lineCommentEnd(text: string, start: number): number {
  let index = start + 2;
  while (index < text.length && !isLineBreak(text[index])) index += 1;
  return index;
}

function blockCommentEnd(text: string, start: number): number {
  const close = text.indexOf('*/', start + 2);
  return close === NOT_CLOSED ? NOT_CLOSED : close + 2;
}

function regexEnd(text: string, start: number): number {
  let index = start + 1;
  let inClass = false;
  while (index < text.length && !isLineBreak(text[index])) {
    const character = text[index];
    if (character === '\\') index += 1;
    else if (character === '[') inClass = true;
    else if (character === ']') inClass = false;
    else if (character === '/' && !inClass) return index + 1;
    index += 1;
  }
  return start + 1;
}

// Uma barra depois de operando é divisão; nos demais casos abre regex.
function slashEnd(text: string, start: number, previous: string): number {
  const next = text[start + 1];
  if (next === '/') return lineCommentEnd(text, start);
  if (next === '*') return blockCommentEnd(text, start);
  return OPERAND_END.test(previous) ? start + 1 : regexEnd(text, start);
}

function significantBefore(text: string, index: number): string {
  let cursor = index - 1;
  while (cursor >= 0 && /\s/u.test(text.charAt(cursor))) cursor -= 1;
  return cursor >= 0 ? text.charAt(cursor) : '';
}

function nextIndex(context: ScanContext, index: number, depth: number): number {
  const { text } = context;
  const character = text.charAt(index);
  if (QUOTES.has(character)) return quotedEnd(text, index);
  if (character === '`') return templateEnd(context, index + 1, depth);
  if (character === '/') return slashEnd(text, index, significantBefore(text, index));
  return index + 1;
}

function expressionEnd(context: ScanContext, from: number, depth: number): number {
  if (depth > LIMITS.maxNestingDepth) return NOT_CLOSED;
  const { text } = context;
  let braces = 1;
  let index = from;
  while (index < text.length && braces > 0) {
    const character = text.charAt(index);
    index = nextIndex(context, index, depth + 1);
    if (index === NOT_CLOSED) return NOT_CLOSED;
    if (character === '{') braces += 1;
    if (character === '}') braces -= 1;
  }
  return braces === 0 ? index : NOT_CLOSED;
}

function templateEnd(context: ScanContext, from: number, depth: number): number {
  const { text } = context;
  let index = from;
  while (index < text.length) {
    const character = text[index];
    if (character === '`') return index + 1;
    if (character === '$' && text[index + 1] === '{') {
      index = expressionEnd(context, index + 2, depth);
      if (index === NOT_CLOSED) return NOT_CLOSED;
      continue;
    }
    if (isForbiddenSeparator(character)) context.report('GS0105', index, index + 1);
    index += character === '\\' ? 2 : 1;
  }
  return NOT_CLOSED;
}

export function scanTemplate(context: ScanContext, start: number): ScannedToken {
  const end = templateEnd(context, start + 1, 0);
  if (end === NOT_CLOSED) {
    context.report('GS0103', start, context.text.length);
    return { kind: 'invalid', end: context.text.length, value: context.text.slice(start) };
  }
  return { kind: 'template', end, value: context.text.slice(start, end) };
}
