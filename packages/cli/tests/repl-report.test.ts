import { describe, expect, it } from 'vitest';
import { reportEvaluation } from '../src/repl/repl-report.ts';
import { createMemoryIo } from './support/memory-io.ts';

const diagnostic = { code: 'GS0714', severity: 'error', message: 'Ô sô, deu um erro que a gente não conhece.', range: { start: { offset: 0, line: 1, column: 1 }, end: { offset: 4, line: 1, column: 5 } } } as const;

describe('relato de avaliação do REPL', () => {
  it('mostra o que o programa disse logo depois do diagnóstico', () => {
    const io = createMemoryIo();
    reportEvaluation(io, 'raiz', { kind: 'threw', diagnostic, source: 'vixe("oi")', programMessage: 'oi' }, 'vixe("oi")');
    expect(io.stderrText()).toContain('GS0714');
    expect(io.stderrText()).toContain('o programa disse: oi');
  });
  it('no tom neutro usa o rótulo neutro', () => {
    const io = createMemoryIo();
    reportEvaluation(io, 'neutro', { kind: 'threw', diagnostic, source: 'vixe("oi")', programMessage: 'oi' }, 'vixe("oi")');
    expect(io.stderrText()).toContain('mensagem do programa: oi');
  });
  it('sem mensagem do programa não inventa a linha', () => {
    const io = createMemoryIo();
    reportEvaluation(io, 'raiz', { kind: 'threw', diagnostic, source: 'x' }, 'x');
    expect(io.stderrText()).not.toContain('o programa disse');
  });
});
