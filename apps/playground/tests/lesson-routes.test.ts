import { DIAGNOSTICS } from '@goiasscript/language';
import { describe, expect, it } from 'vitest';
import { AVAILABLE_LESSONS, KNOWN_LESSON_IDS, lessonIdOfTerm, lessonUrlOf } from '../lib/lesson-routes.ts';

describe('lessonUrlOf', () => {
  it('lista as 11 lições mais o-que-mudou', () => {
    expect(AVAILABLE_LESSONS).toHaveLength(12);
    expect(AVAILABLE_LESSONS).toContain('licao-11');
    expect(AVAILABLE_LESSONS).toContain('o-que-mudou');
  });

  it('devolve link das lições disponíveis e nada para id desconhecido', () => {
    expect(lessonUrlOf('licao-02')).toBe('/cartilha/licao-02');
    expect(lessonUrlOf('o-que-mudou')).toBe('/cartilha/o-que-mudou');
    expect(lessonUrlOf('licao-99')).toBeUndefined();
  });

  it('termos da linguagem apontam para a lição que os explica', () => {
    expect(lessonIdOfTerm('prosa')).toBe('licao-01');
    expect(lessonIdOfTerm('uai')).toBe('licao-02');
    expect(lessonIdOfTerm('constructor')).toBeUndefined();
    expect(lessonIdOfTerm('nao_existe')).toBeUndefined();
  });

  it('devolve /cartilha/<id> quando a lição está listada', () => {
    expect(lessonUrlOf('licao-02', ['licao-02'])).toBe('/cartilha/licao-02');
    expect(lessonUrlOf('o-que-mudou', ['licao-02'])).toBeUndefined();
  });

  it('recusa id fora do formato de rota', () => {
    expect(lessonUrlOf('../etc', ['../etc'])).toBeUndefined();
  });

  it('toda lição do catálogo de diagnósticos está em KNOWN_LESSON_IDS', () => {
    const lessons = new Set(DIAGNOSTICS.flatMap((definition) => (definition.lesson === undefined ? [] : [definition.lesson])));
    expect(lessons.size).toBeGreaterThan(0);
    for (const lesson of lessons) expect(KNOWN_LESSON_IDS).toContain(lesson);
  });

  it('toda lição citada pelo catálogo está disponível', () => {
    for (const lesson of KNOWN_LESSON_IDS) expect(AVAILABLE_LESSONS).toContain(lesson);
  });
});
