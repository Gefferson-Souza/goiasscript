import { describe, expect, it } from 'vitest';
import { parseStackFrames } from '../../../src/runtime-errors/stack-frames.ts';
import { expectWithinBudget } from '../../support/timing.ts';

const HOSTILE_ROW_REPEATS = 20_000;
const HOSTILE_ROW_BUDGET_MS = 200;

describe('parseStackFrames', () => {
  it('lê frames com e sem função, base 1', () => {
    const stack = ['TypeError: x', '    at f (file:///tmp/a.mjs:3:9)', '    at file:///tmp/a.mjs:7:1', '    at async Promise.all (index 0)'].join('\n');
    expect(parseStackFrames(stack)).toEqual([
      { functionName: 'f', line: 3, column: 9 },
      { functionName: null, line: 7, column: 1 },
    ]);
  });
  it('stack ausente ou não-texto devolve lista vazia', () => {
    expect(parseStackFrames(undefined)).toEqual([]);
    expect(parseStackFrames(42)).toEqual([]);
  });
  it('lê caminho do Windows e função com parêntese no nome', () => {
    const stack = ['    at Object.<anonymous> (C:\\aluno\\a.mjs:2:5)', '    at new Fruta (file:///a (cópia).mjs:4:1)'].join('\n');
    expect(parseStackFrames(stack)).toEqual([
      { functionName: 'Object.<anonymous>', line: 2, column: 5 },
      { functionName: 'new Fruta', line: 4, column: 1 },
    ]);
  });
  it('linha hostil de pilha não trava a leitura', () => {
    const hostile = `    at ${' (a:1'.repeat(HOSTILE_ROW_REPEATS)}`;
    const startedAt = performance.now();
    expect(parseStackFrames(hostile)).toEqual([]);
    expectWithinBudget(performance.now() - startedAt, HOSTILE_ROW_BUDGET_MS);
  });
});
