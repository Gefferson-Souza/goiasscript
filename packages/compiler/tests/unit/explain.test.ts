import { describe, expect, it } from 'vitest';
import { DIAGNOSTICS } from '@goiasscript/language';
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
  it('troca marcadores por exemplos legíveis e usa lesson vazia quando não há', () => {
    expect(explainDiagnostic('GS0301')?.explanation).toContain('<nome>');
    expect(explainDiagnostic('GS0301')?.explanation).not.toContain('«');
    expect(explainDiagnostic('GS0301')?.lesson).toBe('');
  });
  it('nenhuma explicação do catálogo sai com marcador cru', () => {
    const leaked = DIAGNOSTICS.flatMap((entry) => (['raiz', 'neutro'] as const).map((tone) => explainDiagnostic(entry.code, tone)))
      .filter((explanation) => /«|\{\w+\}/u.test(explanation?.explanation ?? ''));
    expect(leaked).toEqual([]);
  });
});
