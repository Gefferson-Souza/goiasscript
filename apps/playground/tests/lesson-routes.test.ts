import { DIAGNOSTICS } from '@goiasscript/language';
import { describe, expect, it } from 'vitest';
import { AVAILABLE_LESSONS, KNOWN_LESSON_IDS, lessonUrlOf } from '../lib/lesson-routes.ts';

describe('lessonUrlOf', () => {
  it('não devolve link enquanto a lição não existe', () => {
    expect(AVAILABLE_LESSONS).toHaveLength(0);
    expect(lessonUrlOf('licao-02')).toBeUndefined();
    expect(lessonUrlOf('o-que-mudou')).toBeUndefined();
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

  it('toda lição disponível é conhecida', () => {
    for (const lesson of AVAILABLE_LESSONS) expect(KNOWN_LESSON_IDS).toContain(lesson);
  });
});
