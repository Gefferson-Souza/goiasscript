import type { Tone } from '@goiasscript/compiler';

const TONE_FLAG = '--tom';
const TONE_INLINE_PREFIX = `${TONE_FLAG}=`;
const END_OF_OPTIONS = '--';
const NEUTRAL_TONE: Tone = 'neutro';
const DEFAULT_TONE: Tone = 'raiz';

export function lastToneValue(argv: readonly string[]): string | undefined {
  let value: string | undefined;
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index] ?? '';
    if (token === END_OF_OPTIONS) break;
    if (token.startsWith(TONE_INLINE_PREFIX)) value = token.slice(TONE_INLINE_PREFIX.length);
    else if (token === TONE_FLAG) {
      value = argv[index + 1];
      index += 1;
    }
  }
  return value;
}

export const toneOf = (argv: readonly string[]): Tone => (lastToneValue(argv) === NEUTRAL_TONE ? NEUTRAL_TONE : DEFAULT_TONE);
