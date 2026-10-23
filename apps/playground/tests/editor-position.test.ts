import { compile, type Diagnostic } from '@goiasscript/compiler';
import { describe, expect, it } from 'vitest';
import { toEditorRange } from '../lib/editor-position.ts';

const LINE_BREAK = /\r\n|\r|\n/u;

// Referência independente: a coluna do Monaco é 1-based em unidades UTF-16 e a quebra de linha segue o modelo do editor.
function monacoPositionOf(source: string, offset: number): { readonly lineNumber: number; readonly column: number } {
  const before = source.slice(0, offset);
  const lines = before.split(LINE_BREAK);
  return { lineNumber: lines.length, column: (lines.at(-1) ?? '').length + 1 };
}

function firstDiagnostic(source: string): Diagnostic {
  const result = compile(source, { target: 'playground' });
  const [diagnostic] = result.diagnostics;
  if (diagnostic === undefined) throw new Error('o programa de teste precisava dar diagnóstico');
  return diagnostic;
}

const CASES: readonly (readonly [string, string])[] = [
  ['ASCII', 'prosa("oi"'],
  ['ç em NFC', 'uai ação é'],
  ['ç em NFD (c + U+0327)', 'uai ação é'],
  ['par substituto antes do erro', 'uai 😀 é 1'],
  ['CRLF', 'uai a é 1\r\nuai b é'],
  ['última linha sem quebra', 'uai x é 1\nuai'],
  ['fim de arquivo', 'uai x é'],
];

describe('toEditorRange', () => {
  it.each(CASES)('converte a posição do compilador para a do Monaco: %s', (_title, source) => {
    const diagnostic = firstDiagnostic(source);
    const range = toEditorRange(diagnostic.range);
    expect({ lineNumber: range.startLineNumber, column: range.startColumn }).toEqual(monacoPositionOf(source, diagnostic.range.start.offset));
    expect({ lineNumber: range.endLineNumber, column: range.endColumn }).toEqual(monacoPositionOf(source, diagnostic.range.end.offset));
  });

  it('lê a convenção real do compilador: coluna base 1, sem subtrair nada', () => {
    const range = firstDiagnostic('uai 😀 é 1').range;
    expect(range.start.column).toBe(5);
    expect(toEditorRange(range)).toMatchObject({ startColumn: 5, endColumn: 7 });
  });
});
