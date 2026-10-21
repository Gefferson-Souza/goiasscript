import { describe, expect, it } from 'vitest';
import { explainDiagnostic } from '../../src/explain.ts';

describe('explainDiagnostic', () => {
  it('devolve null para código desconhecido', () => {
    expect(explainDiagnostic('GS9999')).toBeNull();
  });
  it('explica no tom raiz por padrão e no neutro quando pedido', () => {
    const rootTone = explainDiagnostic('GS0307');
    expect(rootTone).toMatchObject({ code: 'GS0307', title: 'uai sem valor inicial', example: 'uai x' });
    expect(rootTone?.explanation).toContain('Ô sô');
    expect(explainDiagnostic('GS0307', 'neutro')?.explanation).not.toContain('Ô sô');
  });
  it('troca marcadores sem valor por «nome» e usa lesson vazia quando não há', () => {
    expect(explainDiagnostic('GS0301')?.explanation).toContain('«name»');
    expect(explainDiagnostic('GS0301')?.lesson).toBe('');
  });
});
