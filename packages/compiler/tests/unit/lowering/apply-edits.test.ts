import { describe, expect, it } from 'vitest';
import { applyEdits } from '../../../src/lowering/apply-edits.ts';
import { createSourceText } from '../../../src/source/source-text.ts';

const source = createSourceText('uai a é 1', 'programa.gs');

describe('applyEdits', () => {
  it('ordena por start; inserção de largura zero antes da troca; empate por order', () => {
    const { code } = applyEdits(source, [
      { start: 0, end: 3, text: 'const', order: 1 },
      { start: 0, end: 0, text: '/*i*/', order: 2 },
      { start: 0, end: 0, text: '/*h*/', order: 0 },
    ]);
    expect(code).toBe('/*h*//*i*/const a é 1');
  });
  it('sobreposição é erro interno', () => {
    expect(() =>
      applyEdits(source, [
        { start: 0, end: 3, text: 'x', order: 0 },
        { start: 2, end: 4, text: 'y', order: 1 },
      ]),
    ).toThrow(/sobrepõe/);
  });
  it('segmentos: trecho copiado, trocado e inserido', () => {
    const { segments } = applyEdits(source, [
      { start: 0, end: 3, text: 'const', order: 0 },
      { start: 9, end: 9, text: ';', order: 1 },
    ]);
    expect(segments.map((segment) => segment.kind)).toEqual(['replace', 'copy', 'insert']);
  });
  it('segmentos cobrem o código gerado sem buracos e apontam a origem', () => {
    const { code, segments } = applyEdits(source, [{ start: 0, end: 3, text: 'const', order: 0 }]);
    const covered = segments.reduce((total, segment) => total + segment.length, 0);
    expect(covered).toBe(code.length);
    expect(segments.map((segment) => segment.originalOffset)).toEqual([0, 3]);
    expect(segments.map((segment) => segment.generatedOffset)).toEqual([0, 5]);
  });
});
