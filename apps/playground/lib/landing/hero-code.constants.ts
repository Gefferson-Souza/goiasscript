import type { HeroLine, HeroSegment, SameTone } from './hero-code.types.ts';

const same = (text: string, tone: SameTone = 'plain'): HeroSegment => ({ kind: 'same', text, tone });
const swap = (dialect: string, javascript: string): HeroSegment => ({ kind: 'swap', dialect, javascript });
const SEMICOLON = swap('', ';');

// Conferido contra o compilador em tests/hero-code.test.ts: a vitrine não pode mostrar JS inventado.
export const HERO_LINES: readonly HeroLine[] = [
  [swap('uai', 'const'), same(' saudacao '), swap('é', '='), same(' '), same('"Bão demais da conta!"', 'string'), SEMICOLON],
  [swap('prosa', 'console.log'), same('(saudacao)'), SEMICOLON],
  [],
  [swap('faz_trem', 'function'), same(' dobra(n) {')],
  [same('  '), swap('faz_favor', 'return'), same(' n '), swap('vezes', '*'), same(' '), same('2', 'number'), SEMICOLON],
  [same('}')],
  [swap('prosa', 'console.log'), same('(dobra('), same('21', 'number'), same('))'), SEMICOLON],
];

export const HERO_OUTPUT: readonly string[] = ['Bão demais da conta!', '42'];

const LINE_MS = 320;
const SWAP_GAP_MS = 70;
const EMPTY_LINE_MS = 120;
const START_DELAY_MS = 900;
const HOLD_MS = 2600;

export const HERO_TIMING = {
  lineMs: LINE_MS,
  swapGapMs: SWAP_GAP_MS,
  emptyLineMs: EMPTY_LINE_MS,
  startDelayMs: START_DELAY_MS,
  holdMs: HOLD_MS,
} as const;
