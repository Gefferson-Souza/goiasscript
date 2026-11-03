import { describe, expect, it } from 'vitest';
import { DIAGNOSTICS, lessonTitleOf } from '../src/index.ts';

const PRIMER_LESSON_ID = /^licao-\d{2}$/u;

describe('títulos das lições', () => {
  it('toda lição da cartilha citada pelo catálogo tem título', () => {
    const lessons = new Set(DIAGNOSTICS.flatMap((definition) => (definition.lesson === undefined ? [] : [definition.lesson])).filter((id) => PRIMER_LESSON_ID.test(id)));
    const missing = [...lessons].filter((id) => lessonTitleOf(id) === undefined);
    expect(missing).toEqual([]);
  });
  it('devolve o título da cartilha e nada para id desconhecido', () => {
    expect(lessonTitleOf('licao-02')).toBe('Guardando trem com uai e trem');
    expect(lessonTitleOf('escopo')).toBeUndefined();
  });
});
