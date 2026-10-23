import { describe, expect, it } from 'vitest';
import { DIAGNOSTICS } from '../src/index.ts';
import { LESSON_BY_CODE } from '../src/diagnostics/lesson-map.constants.ts';

const catalogLessonOf = (code: string): string | undefined => DIAGNOSTICS.find((definition) => definition.code === code)?.lesson;

describe('mapa de lições do catálogo', () => {
  it('nenhum código da tabela falta no catálogo', () => {
    const codes = new Set(DIAGNOSTICS.map((definition) => definition.code));
    const missing = Object.keys(LESSON_BY_CODE).filter((code) => !codes.has(code));
    expect(missing).toEqual([]);
  });

  it('a tabela atribui a lição certa a cada código', () => {
    const wrong = Object.entries(LESSON_BY_CODE).filter(([code, lesson]) => catalogLessonOf(code) !== lesson);
    expect(wrong).toEqual([]);
  });

  it('o catálogo não tem lição fora da tabela', () => {
    const extra = DIAGNOSTICS.filter((definition) => definition.lesson !== undefined && !Object.hasOwn(LESSON_BY_CODE, definition.code));
    expect(extra.map((definition) => definition.code)).toEqual([]);
  });

  it('cobre os 39 códigos da tabela fechada', () => {
    expect(Object.keys(LESSON_BY_CODE)).toHaveLength(39);
  });
});
