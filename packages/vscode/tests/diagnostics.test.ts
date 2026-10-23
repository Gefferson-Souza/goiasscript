import { compile } from '@goiasscript/compiler';
import type { Diagnostic } from '@goiasscript/compiler';
import { describe, expect, it } from 'vitest';
import { toHostDiagnostic } from '../src/diagnostics/to-host-diagnostic.ts';

const KEYWORD = 'const';

function firstDiagnostic(text: string): Diagnostic {
  const first = compile(text).diagnostics[0];
  if (first === undefined) throw new Error('o programa de teste devia ter diagnóstico');
  return first;
}

const positionCases: readonly (readonly [string, string])[] = [
  ['ASCII', 'uai a é 1\nconst b é 2'],
  ['ç composto (NFC)', 'uai ç é 1; const b é 2'],
  ['c mais cedilha solta (NFD)', 'uai ç é 1; const b é 2'],
  ['emoji antes do erro', 'uai a é "😀"; const b é 1'],
  ['quebra de linha CRLF', 'uai a é 1\r\nconst b é 2'],
  ['última linha sem quebra', 'uai a é 1\n\nconst b é 2'],
];

describe('toHostDiagnostic', () => {
  it.each(positionCases)('converte a posição para base 0 do editor: %s', (_title, text) => {
    const lines = text.split(/\r\n|\n/u);
    const lineIndex = lines.findIndex((line) => line.includes(KEYWORD));
    const column = (lines[lineIndex] ?? '').indexOf(KEYWORD);
    const converted = toHostDiagnostic(firstDiagnostic(text), null);
    expect(converted).toMatchObject({ startLine: lineIndex, startCharacter: column, endLine: lineIndex, endCharacter: column + KEYWORD.length });
  });

  it('mantém o código e mapeia a severidade', () => {
    const base: Diagnostic = { code: 'GS0001', severity: 'warning', range: { start: { offset: 0, line: 1, column: 1 }, end: { offset: 1, line: 1, column: 2 } }, message: 'aviso' };
    expect(toHostDiagnostic(base, null)).toMatchObject({ code: 'GS0001', severity: 'warning' });
    expect(toHostDiagnostic({ ...base, severity: 'error' }, null).severity).toBe('error');
  });

  it('junta a mensagem e a ajuda em linhas separadas', () => {
    const withoutHelp: Diagnostic = { code: 'GS0001', severity: 'error', range: { start: { offset: 0, line: 1, column: 1 }, end: { offset: 1, line: 1, column: 2 } }, message: 'deu ruim' };
    expect(toHostDiagnostic({ ...withoutHelp, help: 'tenta assim' }, null).message).toBe('deu ruim\ntenta assim');
    expect(toHostDiagnostic(withoutHelp, null).message).toBe('deu ruim');
  });

  it('monta o endereço da lição só com base configurada e sem barra dupla', () => {
    const diagnostic = firstDiagnostic('uai a é 1\nconst b é 2');
    expect(diagnostic.lesson).toBe('licao-02');
    expect(toHostDiagnostic(diagnostic, 'https://exemplo.dev/licoes').lessonUrl).toBe('https://exemplo.dev/licoes/licao-02');
    expect(toHostDiagnostic(diagnostic, 'https://exemplo.dev/licoes/').lessonUrl).toBe('https://exemplo.dev/licoes/licao-02');
    expect(toHostDiagnostic(diagnostic, null)).not.toHaveProperty('lessonUrl');
  });
});
