import { describe, expect, it, vi } from 'vitest';
import { compile } from '../../src/compile.ts';

vi.mock('../../src/analyzer/analyzer.ts', () => ({
  analyze: () => {
    throw new RangeError('pilha');
  },
}));

describe('compile: falha interna', () => {
  it('exceção interna vira GS0901 em 1:1, sem lançar', () => {
    const result = compile('prosa(1)');
    expect(result.ok).toBe(false);
    expect(result.diagnostics[0]).toMatchObject({
      code: 'GS0901',
      range: { start: { offset: 0, line: 1, column: 1 }, end: { offset: 0, line: 1, column: 1 } },
    });
  });
});
