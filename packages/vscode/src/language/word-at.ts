import { IDENTIFIER_PART, IDENTIFIER_START } from './word-at.constants.ts';
import type { WordRange } from './word-at.types.ts';

const isPartAt = (line: string, index: number): boolean => index >= 0 && index < line.length && IDENTIFIER_PART.test(line.charAt(index));

export function trailingIdentifier(text: string): string {
  let start = text.length;
  while (isPartAt(text, start - 1)) start -= 1;
  return text.slice(start);
}

export function wordAt(line: string, character: number): WordRange | null {
  if (!Number.isInteger(character) || character < 0 || character > line.length) return null;
  const anchor = isPartAt(line, character) ? character : character - 1;
  if (!isPartAt(line, anchor)) return null;
  let start = anchor;
  while (isPartAt(line, start - 1)) start -= 1;
  let end = anchor + 1;
  while (isPartAt(line, end)) end += 1;
  const word = line.slice(start, end).normalize('NFC');
  return IDENTIFIER_START.test(word) ? { word, start, end } : null;
}
