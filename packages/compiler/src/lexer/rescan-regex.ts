import { isLineBreak } from './char-classes.ts';

const REGEX_FLAG = /^[A-Za-z]$/u;

function flagsEnd(text: string, from: number): number {
  let index = from;
  while (REGEX_FLAG.test(text[index] ?? '')) index += 1;
  return index;
}

export function regexEnd(text: string, slashIndex: number): number {
  let index = slashIndex + 1;
  let inClass = false;
  while (index < text.length && !isLineBreak(text[index])) {
    const character = text[index];
    if (character === '\\') {
      index += 2;
      continue;
    }
    if (character === '[') inClass = true;
    else if (character === ']') inClass = false;
    else if (character === '/' && !inClass) return flagsEnd(text, index + 1);
    index += 1;
  }
  return -1;
}
