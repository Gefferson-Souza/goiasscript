import { describe, expect, it } from 'vitest';
import { compile } from '../src/index.ts';
import { timingEnforced } from './support/timing.ts';

// Sob cobertura o tempo dobra: as medições rodam só no passo sem instrumentação.
const timed = timingEnforced ? it : it.skip;
const ROUNDS = 3;
// Cada medição de razão compila sete vezes, o que passa dos 5 s padrão na máquina da CI.
const SCALE_TEST_TIMEOUT_MS = 30_000;

const distinctNames = (count: number): string =>
  Array.from({ length: count }, (_, index) => `uai valor${String(index)} é nome_${String(index)}`).join('\n');

// Pior caso real: muitos nomes declarados parecidos entre si e usos com erro de digitação.
const similarNames = (count: number): string => {
  const declarations = Array.from({ length: count }, (_, index) => `uai item${String(index)} é 1`);
  const typos = Array.from({ length: count }, (_, index) => `uai copia${String(index)} é itemx${String(index)}`);
  return [...declarations, ...typos].join('\n');
};

const median = (values: readonly number[]): number => [...values].sort((left, right) => left - right)[Math.floor(values.length / 2)] ?? 0;

const measureMs = (source: string, minimumDiagnostics: number): number => {
  const started = performance.now();
  const result = compile(source);
  expect(result.diagnostics.length).toBeGreaterThanOrEqual(minimumDiagnostics);
  return performance.now() - started;
};

const medianMs = (source: string, minimumDiagnostics: number): number =>
  median(Array.from({ length: ROUNDS }, () => measureMs(source, minimumDiagnostics)));

describe('compile com muitos diagnósticos', { timeout: SCALE_TEST_TIMEOUT_MS }, () => {
  timed('cresce de forma linear com a quantidade de diagnósticos', () => {
    measureMs(distinctNames(250), 250);
    const small = Math.max(medianMs(distinctNames(2_000), 2_000), 1);
    const large = medianMs(distinctNames(8_000), 8_000);
    expect(large / small).toBeLessThan(6);
  });
  timed('8 mil diagnósticos saem em menos de 2 s', () => {
    expect(medianMs(distinctNames(8_000), 8_000)).toBeLessThan(2_000);
  });
  timed('cresce de forma linear com nomes declarados parecidos entre si', () => {
    measureMs(similarNames(250), 250);
    const small = Math.max(medianMs(similarNames(2_000), 2_000), 1);
    const large = medianMs(similarNames(8_000), 8_000);
    expect(large / small).toBeLessThan(6);
  });
  timed('16 mil usos com nomes parecidos saem em menos de 3 s', () => {
    expect(measureMs(similarNames(8_000), 8_000)).toBeLessThan(3_000);
  });
});
