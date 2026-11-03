import { describe, expect, it } from 'vitest';
import { diagnosticTexts, lookupDiagnostic } from '../src/index.ts';

const definition = lookupDiagnostic('GS0202');
if (definition === undefined) throw new Error('GS0202 ausente do catálogo');

describe('diagnosticTexts', () => {
  it('usa o texto base quando não há variante', () => {
    const texts = diagnosticTexts(definition, 'raiz', { found: ')' });
    expect(texts.message).toBe('Ô sô, não entendi esse trecho: ")" não cabe aqui.');
    expect(texts.help).toContain('uma instrução por linha');
  });
  it('ignora variante desconhecida e cai no texto base', () => {
    expect(diagnosticTexts(definition, 'raiz', { found: 'x', variant: 'naoExiste' }).message).toContain('não cabe aqui');
  });
  it('troca manchete e ajuda pela variante nos dois tons', () => {
    const args = { found: ')', variant: 'missingOperand', operator: 'mais' };
    expect(diagnosticTexts(definition, 'raiz', args).message).toBe('Ô sô, faltou um valor depois de "mais".');
    expect(diagnosticTexts(definition, 'neutro', args).message).toBe('Falta um valor depois de "mais".');
  });
  it('variante sem ajuda não herda a ajuda do texto base', () => {
    expect(diagnosticTexts(definition, 'raiz', { found: 'vixe', variant: 'bareThrow' }).help).toBeUndefined();
  });
});
