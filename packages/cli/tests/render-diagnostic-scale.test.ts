import { describe, expect, it } from 'vitest';
import type { Diagnostic } from '@goiasscript/compiler';
import { renderDiagnostic } from '../src/diagnostics/render-diagnostic.ts';

const LINES = 6000;
const DIAGNOSTICS = 60000;
const BUDGET_MS = 2500;

const diagnosticAt = (line: number): Diagnostic => ({
  code: 'GS0301',
  severity: 'error',
  range: { start: { offset: 0, line, column: 1 }, end: { offset: 3, line, column: 4 } },
  message: 'Esse trem "nomi" não existe por aqui.',
});

describe('renderDiagnostic em escala', () => {
  it('muitos diagnósticos sobre o mesmo arquivo não refazem a quebra de linhas a cada um', () => {
    const source = Array.from({ length: LINES }, () => 'uai x é nomi + nomi + nomi').join('\n');
    const started = performance.now();
    for (let index = 0; index < DIAGNOSTICS; index += 1) {
      renderDiagnostic({ diagnostic: diagnosticAt((index % LINES) + 1), fileName: 'a.gs', source });
    }
    expect(performance.now() - started).toBeLessThan(BUDGET_MS);
  });
});
