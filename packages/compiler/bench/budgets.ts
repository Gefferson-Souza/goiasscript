import { readFileSync } from 'node:fs';
import type { CompileSuccess } from '../src/api.types.ts';
import { compile } from '../src/compile.ts';
import type { BudgetMeasures, Ratchets } from './budgets.types.ts';

const PATHOLOGICAL_SPACES_LIMIT_MS = 100;
const COMPILE_10K_LINES_LIMIT_MS = 150;

export const ABSOLUTE_BUDGETS = {
  runtimeBytesNative: 0,
  pathologicalSpacesMs: PATHOLOGICAL_SPACES_LIMIT_MS,
  compile10kLinesMs: COMPILE_10K_LINES_LIMIT_MS,
} as const;
const WARMUP_RUNS = 2;
const MEASURED_RUNS = 20;
const ROUNDS = 3;
const TEN_THOUSAND = 10_000;
const HUNDRED_THOUSAND = 100_000;
const LINES_PER_BLOCK = 4;
const LINE_BREAK = /\r\n|\r|\n/u;

export const readRatchets = (): Ratchets => JSON.parse(readFileSync(new URL('./budgets.json', import.meta.url), 'utf8')) as Ratchets;

export function helperBytes(result: CompileSuccess): number {
  if (result.helperRange === null) return 0;
  return result.code.split(LINE_BREAK).slice(result.helperRange.startLine - 1).join('\n').length;
}

function timeOnce(run: () => void): number {
  const start = performance.now();
  run();
  return performance.now() - start;
}

export function medianMs(run: () => void): number {
  for (let i = 0; i < WARMUP_RUNS; i += 1) run();
  const samples = Array.from({ length: MEASURED_RUNS }, () => timeOnce(run)).toSorted((a, b) => a - b);
  return samples[Math.floor(samples.length / 2)] ?? 0;
}

// Menor mediana entre as rodadas: o ruído de uma máquina compartilhada só soma tempo, nunca subtrai.
export function bestMedianMs(run: () => void): number {
  return Math.min(...Array.from({ length: ROUNDS }, () => medianMs(run)));
}

export function tenThousandLines(): string {
  const block = (index: number): string => {
    const id = String(index);
    return `uai n${id} é ${id}\nfaz_trem f${id}(a, b) {\n  faz_favor a mais b vezes n${id}\n}`;
  };
  return Array.from({ length: TEN_THOUSAND / LINES_PER_BLOCK }, (_, i) => block(i)).join('\n');
}

export function measureBudgets(): BudgetMeasures {
  const spaces = ' '.repeat(HUNDRED_THOUSAND);
  const lines = tenThousandLines();
  return { pathologicalSpacesMs: bestMedianMs(() => compile(spaces)), compile10kLinesMs: bestMedianMs(() => compile(lines)) };
}
