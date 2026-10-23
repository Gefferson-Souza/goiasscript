import { compile, type Diagnostic } from '@goiasscript/compiler';
import { describe, expect, it } from 'vitest';
import { MARKER_SEVERITY, MAX_MARKERS } from '../lib/diagnostic-markers.constants.ts';
import { toEditorMarkers } from '../lib/diagnostic-markers.ts';

const noLesson = (): undefined => undefined;

function diagnosticsOf(source: string): readonly Diagnostic[] {
  return compile(source, { target: 'playground' }).diagnostics;
}

function fakeDiagnostic(overrides: Partial<Diagnostic>): Diagnostic {
  const position = { offset: 0, line: 1, column: 1 };
  return { code: 'GS0999', severity: 'error', range: { start: position, end: { offset: 1, line: 1, column: 2 } }, message: 'mensagem', ...overrides };
}

describe('toEditorMarkers', () => {
  it('GS0301 com sugestão vira marcador com message, help e code', () => {
    const source = 'uai x é 1; x é função';
    const diagnostic = diagnosticsOf(source).find((item) => item.code === 'GS0301');
    if (diagnostic === undefined) throw new Error('esperava GS0301');
    const { markers } = toEditorMarkers([diagnostic], source, noLesson);
    expect(markers).toHaveLength(1);
    expect(markers[0]).toMatchObject({ code: 'GS0301', severity: MARKER_SEVERITY.error, startLineNumber: 1, startColumn: 16, endColumn: 22 });
    expect(markers[0]?.message.startsWith(diagnostic.message)).toBe(true);
    if (diagnostic.help !== undefined) expect(markers[0]?.message).toContain(diagnostic.help);
  });

  it('mapeia a severidade para as constantes do Monaco', () => {
    expect(MARKER_SEVERITY).toEqual({ error: 8, warning: 4 });
    const { markers } = toEditorMarkers([fakeDiagnostic({ severity: 'warning' }), fakeDiagnostic({ severity: 'error' })], 'ab', noLesson);
    expect(markers.map((marker) => marker.severity)).toEqual([4, 8]);
  });

  it('limita a 200 marcadores e conta os escondidos', () => {
    const many = Array.from({ length: 250 }, () => fakeDiagnostic({}));
    const view = toEditorMarkers(many, 'ab', noLesson);
    expect(MAX_MARKERS).toBe(200);
    expect(view.markers).toHaveLength(200);
    expect(view.hiddenMarkerCount).toBe(50);
    expect(toEditorMarkers(many.slice(0, 3), 'ab', noLesson).hiddenMarkerCount).toBe(0);
  });

  it('só põe lessonUrl quando lessonUrlOf devolve valor', () => {
    const lessonUrlOf = (id: string): string | undefined => (id === 'licao-02' ? '/cartilha/licao-02' : undefined);
    const withLesson = fakeDiagnostic({ lesson: 'licao-02' });
    const unknownLesson = fakeDiagnostic({ lesson: 'nao-existe' });
    const noLessonAtAll = fakeDiagnostic({});
    const { markers } = toEditorMarkers([withLesson, unknownLesson, noLessonAtAll], 'ab', lessonUrlOf);
    expect(markers[0]?.lessonUrl).toBe('/cartilha/licao-02');
    expect(markers[1]).not.toHaveProperty('lessonUrl');
    expect(markers[2]).not.toHaveProperty('lessonUrl');
  });

  it('largura zero no meio do texto vira largura 1', () => {
    const at = { offset: 1, line: 1, column: 2 };
    const { markers } = toEditorMarkers([fakeDiagnostic({ range: { start: at, end: at } })], 'abc', noLesson);
    expect(markers[0]).toMatchObject({ startColumn: 2, endColumn: 3 });
  });

  it('largura zero no fim da linha sublinha o último caractere (GS0901 no fim do arquivo)', () => {
    const source = 'prosa("oi"';
    const diagnostic = diagnosticsOf(source)[0];
    if (diagnostic === undefined) throw new Error('esperava diagnóstico');
    const { markers } = toEditorMarkers([diagnostic], source, noLesson);
    expect(markers[0]).toMatchObject({ startColumn: 10, endColumn: 11 });
  });

  it('largura zero numa linha vazia continua com largura 1', () => {
    const at = { offset: 0, line: 1, column: 1 };
    const { markers } = toEditorMarkers([fakeDiagnostic({ range: { start: at, end: at } })], '', noLesson);
    expect(markers[0]).toMatchObject({ startColumn: 1, endColumn: 2 });
  });

  it('largura zero antes de emoji cobre o par substituto inteiro', () => {
    const at = { offset: 1, line: 1, column: 2 };
    const { markers } = toEditorMarkers([fakeDiagnostic({ range: { start: at, end: at } })], 'a😀b', noLesson);
    expect(markers[0]).toMatchObject({ startColumn: 2, endColumn: 4 });
  });

  it('largura zero depois de emoji, no fim da linha, volta ao par inteiro', () => {
    const at = { offset: 3, line: 1, column: 4 };
    const { markers } = toEditorMarkers([fakeDiagnostic({ range: { start: at, end: at } })], 'a😀', noLesson);
    expect(markers[0]).toMatchObject({ startColumn: 2, endColumn: 4 });
  });
});
