import { PUNCTUATORS } from './punctuators.constants.ts';
import type { ScannedToken } from './token.types.ts';

export function scanPunctuator(text: string, start: number): ScannedToken | undefined {
  const found = PUNCTUATORS.find((candidate) => text.startsWith(candidate, start));
  return found === undefined ? undefined : { kind: 'punctuator', end: start + found.length, value: found };
}
