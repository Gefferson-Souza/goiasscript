import { describe, expect, it } from 'vitest';
import { toCoreDiagnostic } from '../../src/diagnostics/core-report.ts';
import { formatDiagnostic } from '../../src/diagnostics/format.ts';
import type { Tone } from '../../src/api.types.ts';
import type { RawDiagnostic } from '../../src/lexer/token.types.ts';
import { createSourceText } from '../../src/source/source-text.ts';

describe('relato de diagnóstico', () => {
  const source = createSourceText('uai a é nomi', 'programa.gs');
  const report = (raw: RawDiagnostic, tone: Tone) => formatDiagnostic(toCoreDiagnostic(raw, source), tone);
  it('núcleo guarda código, severidade, faixa e argumentos, sem texto', () => {
    const raw = { code: 'GS0301', start: 8, end: 12, args: { name: 'nomi', suggestion: 'nome' } };
    expect(toCoreDiagnostic(raw, source)).toEqual({
      code: 'GS0301',
      severity: 'error',
      range: { start: { offset: 8, line: 1, column: 9 }, end: { offset: 12, line: 1, column: 13 } },
      args: { name: 'nomi', suggestion: 'nome' },
    });
  });
  it('severidade warning vem da tabela de avisos', () => {
    expect(toCoreDiagnostic({ code: 'GS0801', start: 0, end: 1, args: {} }, source).severity).toBe('warning');
  });
  it('monta código, severidade, faixa e mensagem no tom pedido', () => {
    const raw = { code: 'GS0301', start: 8, end: 12, args: { name: 'nomi', suggestion: 'nome' } };
    expect(report(raw, 'neutro')).toEqual({
      code: 'GS0301',
      severity: 'error',
      range: { start: { offset: 8, line: 1, column: 9 }, end: { offset: 12, line: 1, column: 13 } },
      message: 'O nome "nomi" não foi declarado. Você quis dizer "nome"?',
      lesson: 'licao-02',
    });
  });
  it('omite a pergunta quando não há sugestão', () => {
    const raw = { code: 'GS0301', start: 8, end: 12, args: { name: 'nomi' } };
    expect(report(raw, 'neutro').message).toBe('O nome "nomi" não foi declarado.');
  });
  it('código fora do catálogo vira erro com o próprio código na mensagem', () => {
    const raw = { code: 'GS9999', start: 0, end: 0, args: {} };
    expect(report(raw, 'raiz')).toMatchObject({ code: 'GS9999', severity: 'error', message: 'GS9999' });
  });
});
