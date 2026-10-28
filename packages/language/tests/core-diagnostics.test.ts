import { describe, expect, it } from 'vitest';
import { DIAGNOSTICS, RUNTIME_PHRASES, WARNING_CODES, lookupDiagnostic } from '../src/index.ts';

const RUNTIME_PHRASE_CODES = ['GS0701', 'GS0702', 'GS0703', 'GS0710', 'GS0711', 'GS0712', 'GS0713'];

describe('tabelas do núcleo geradas a partir do catálogo', () => {
  it('WARNING_CODES tem exatamente os códigos de severidade warning', () => {
    const expected = DIAGNOSTICS.filter((entry) => entry.severity === 'warning').map((entry) => entry.code).toSorted();
    expect([...WARNING_CODES].toSorted()).toEqual(expected);
  });
  it('RUNTIME_PHRASES guarda a frase raiz dos códigos que o helper embute', () => {
    expect(Object.keys(RUNTIME_PHRASES).toSorted()).toEqual(RUNTIME_PHRASE_CODES);
    for (const code of RUNTIME_PHRASE_CODES) expect(RUNTIME_PHRASES[code]).toBe(lookupDiagnostic(code)?.messages.raiz);
  });
});
