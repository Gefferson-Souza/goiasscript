import vm from 'node:vm';
import { compileCore } from '@goiasscript/compiler/core';
import { describe, expect, it } from 'vitest';
import { HERO_LINES, HERO_OUTPUT } from '../lib/landing/hero-code.constants.ts';
import { renderSide, sweepCues, swapCount } from '../lib/landing/hero-code.ts';

function runCapturingLogs(code: string): readonly string[] {
  const logs: string[] = [];
  vm.runInNewContext(code, { console: { log: (...values: readonly unknown[]) => logs.push(values.map(String).join(' ')) } });
  return logs;
}

describe('código da vitrine', () => {
  it('o goianês da vitrine compila exatamente no JavaScript que ela mostra', () => {
    const result = compileCore(renderSide(HERO_LINES, 'dialect'));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.code.trim()).toBe(renderSide(HERO_LINES, 'javascript'));
  });

  it('a saída mostrada é a que o JavaScript gerado imprime de verdade', () => {
    expect(runCapturingLogs(renderSide(HERO_LINES, 'javascript'))).toEqual(HERO_OUTPUT);
  });

  it('toda troca muda alguma coisa', () => {
    const swaps = HERO_LINES.flat().filter((segment) => segment.kind === 'swap');
    expect(swaps.length).toBe(swapCount(HERO_LINES));
    for (const swap of swaps) expect(swap.dialect).not.toBe(swap.javascript);
  });
});

describe('varrida do cursor', () => {
  const timing = { lineMs: 300, swapGapMs: 60, emptyLineMs: 100 };

  it('marca uma deixa por troca, em ordem de linha e de posição', () => {
    const cues = sweepCues(HERO_LINES, timing);
    expect(cues).toHaveLength(swapCount(HERO_LINES));
    const order = cues.map((cue) => [cue.line, cue.swap]);
    expect(order).toEqual([...order].sort((a, b) => (a[0] ?? 0) - (b[0] ?? 0) || (a[1] ?? 0) - (b[1] ?? 0)));
  });

  it('o tempo só anda pra frente', () => {
    const times = sweepCues(HERO_LINES, timing).map((cue) => cue.atMs);
    expect(times).toEqual([...times].sort((a, b) => a - b));
    expect(new Set(times).size).toBe(times.length);
  });

  it('trocas da mesma linha ficam separadas pelo intervalo pedido', () => {
    const lines = [[{ kind: 'swap', dialect: 'a', javascript: 'b' }, { kind: 'swap', dialect: 'c', javascript: 'd' }]] as const;
    expect(sweepCues(lines, timing)).toEqual([
      { line: 0, swap: 0, atMs: 0 },
      { line: 0, swap: 1, atMs: 60 },
    ]);
  });

  it('linha vazia só gasta o tempo curto', () => {
    const lines = [[], [{ kind: 'swap', dialect: 'a', javascript: 'b' }]] as const;
    expect(sweepCues(lines, timing)).toEqual([{ line: 1, swap: 0, atMs: 100 }]);
  });
});
