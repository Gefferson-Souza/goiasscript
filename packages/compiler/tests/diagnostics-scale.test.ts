import { describe, expect, it } from 'vitest';
import { compile } from '../src/index.ts';
import { timingEnforced } from './support/timing.ts';

// Sob cobertura o tempo dobra: as medições rodam só no passo sem instrumentação.
const timed = timingEnforced ? it : it.skip;

const undeclaredNames = (count: number): string =>
  Array.from({ length: count }, (_, index) => `uai valor${String(index)} é nome_${String(index)}`).join('\n');

const measureMs = (count: number): number => {
  const started = performance.now();
  const result = compile(undeclaredNames(count));
  expect(result.diagnostics.length).toBeGreaterThanOrEqual(count);
  return performance.now() - started;
};

describe('compile com muitos diagnósticos', () => {
  timed('cresce de forma linear com a quantidade de diagnósticos', () => {
    measureMs(250);
    const small = Math.max(measureMs(1_000), 1);
    const large = measureMs(4_000);
    expect(large / small).toBeLessThan(6);
  });
  timed('4 mil diagnósticos saem em menos de 1,2 s', () => {
    expect(measureMs(4_000)).toBeLessThan(1_200);
  });
});
