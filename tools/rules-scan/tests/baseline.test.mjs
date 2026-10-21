import { describe, expect, it } from 'vitest';
import { compareWithBaseline, nextBaseline } from '../src/baseline.mjs';

const policy = { severity: { R14: 'error', R16: 'warn' } };
const violation = (count) => ({ count, items: Array.from({ length: count }, (_unused, index) => ({ line: index + 1, text: `ocorrência ${String(index + 1)}` })) });

describe('baseline em catraca', () => {
  it('piora em regra de erro bloqueia e em regra de aviso só avisa', () => {
    const current = { 'apps/a.ts': { R14: violation(3), R16: violation(3) } };
    const comparison = compareWithBaseline(current, { 'apps/a.ts': { R14: 2, R16: 2 } }, policy);
    expect(comparison.errors).toMatchObject([{ file: 'apps/a.ts', id: 'R14', allowed: 2, now: 3, sample: [{ line: 3, text: 'ocorrência 3' }] }]);
    expect(comparison.warnings).toMatchObject([{ file: 'apps/a.ts', id: 'R16', allowed: 2, now: 3 }]);
    expect(comparison.slack).toEqual([]);
  });
  it('melhora vira folga que bloqueia até o baseline ser atualizado', () => {
    const comparison = compareWithBaseline({ 'apps/a.ts': { R14: violation(1) } }, { 'apps/a.ts': { R14: 2 } }, policy);
    expect(comparison.slack).toEqual([{ file: 'apps/a.ts', id: 'R14', allowed: 2, now: 1 }]);
    expect(comparison.errors).toEqual([]);
  });
  it('violação fora do baseline é erro', () => {
    const comparison = compareWithBaseline({ 'packages/compiler/src/a.ts': { R14: violation(1) } }, {}, policy);
    expect(comparison.errors).toMatchObject([{ file: 'packages/compiler/src/a.ts', id: 'R14', allowed: 0, now: 1 }]);
  });
  it('só grava baseline de apps/ e só quando melhora', () => {
    expect(() => nextBaseline({ 'packages/compiler/src/a.ts': { R14: violation(1) } }, undefined, policy)).toThrow(/só vale para apps\//);
    expect(() => nextBaseline({ 'apps/a.ts': { R14: violation(3) } }, { 'apps/a.ts': { R14: 2 } }, policy)).toThrow(/só pode melhorar/);
    expect(nextBaseline({ 'apps/a.ts': { R14: violation(1), R16: violation(5) } }, { 'apps/a.ts': { R14: 2 } }, policy)).toEqual({ version: 1, files: { 'apps/a.ts': { R14: 1 } } });
  });
});
