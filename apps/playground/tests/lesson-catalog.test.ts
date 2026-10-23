import { DIAGNOSTICS } from '@goiasscript/language';
import { describe, expect, it } from 'vitest';
import { join } from 'node:path';
import { lessonStaticParams, loadPrimer } from '../lib/cartilha/cartilha-content.ts';
import { AVAILABLE_LESSONS, KNOWN_LESSON_IDS, lessonUrlOf } from '../lib/lesson-routes.ts';

const catalogLessons = [...new Set(DIAGNOSTICS.flatMap((definition) => (definition.lesson === undefined ? [] : [definition.lesson])))];
const CONTENT_DIR = join(import.meta.dirname, '..', 'content', 'cartilha');
const pageIds = new Set([...lessonStaticParams(loadPrimer(CONTENT_DIR)).map((entry) => entry.id), 'o-que-mudou']);

describe('lições do catálogo de diagnósticos', () => {
  it('todo lesson do catálogo tem página em AVAILABLE_LESSONS', () => {
    expect(catalogLessons.length).toBeGreaterThan(1);
    for (const lesson of catalogLessons) {
      expect(AVAILABLE_LESSONS, lesson).toContain(lesson);
      expect(lessonUrlOf(lesson), lesson).toBe(`/cartilha/${lesson}`);
    }
  });

  it('existe uma página /cartilha/<id> para cada lição disponível', () => {
    for (const lesson of AVAILABLE_LESSONS) expect(pageIds.has(lesson), lesson).toBe(true);
    expect([...pageIds].sort()).toEqual([...AVAILABLE_LESSONS].sort());
  });

  it('KNOWN_LESSON_IDS vem do catálogo, sem lição a mais', () => {
    expect([...KNOWN_LESSON_IDS].sort()).toEqual([...catalogLessons].sort());
  });

  it('o diagnóstico do exemplo da lição 2 aponta para licao-02', () => {
    const definition = DIAGNOSTICS.find((candidate) => candidate.code === 'GS0208');
    expect(definition?.lesson).toBe('licao-02');
  });
});
