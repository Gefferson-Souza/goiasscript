import { describe, expect, it } from 'vitest';
import { toDiagnostic } from '../../src/diagnostics/report.ts';
import { createSourceText } from '../../src/source/source-text.ts';

describe('toDiagnostic', () => {
  const source = createSourceText('uai a é nomi', 'programa.gs');
  it('monta código, severidade, faixa e mensagem no tom pedido', () => {
    const raw = { code: 'GS0301', start: 8, end: 12, args: { name: 'nomi', suggestion: 'nome' } };
    expect(toDiagnostic(raw, source, 'neutro')).toEqual({
      code: 'GS0301',
      severity: 'error',
      range: { start: { offset: 8, line: 1, column: 9 }, end: { offset: 12, line: 1, column: 13 } },
      message: 'O nome "nomi" não foi declarado. Você quis dizer "nome"?',
    });
  });
  it('omite a pergunta quando não há sugestão', () => {
    const raw = { code: 'GS0301', start: 8, end: 12, args: { name: 'nomi' } };
    expect(toDiagnostic(raw, source, 'neutro').message).toBe('O nome "nomi" não foi declarado.');
  });
  it('código fora do catálogo vira erro com o próprio código na mensagem', () => {
    const raw = { code: 'GS9999', start: 0, end: 0, args: {} };
    expect(toDiagnostic(raw, source, 'raiz')).toMatchObject({ code: 'GS9999', severity: 'error', message: 'GS9999' });
  });
});
