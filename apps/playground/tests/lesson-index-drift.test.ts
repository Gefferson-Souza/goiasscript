import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildLessonIndex, renderExtensionTerms, renderPlaygroundIndex } from '../lib/cartilha/lesson-index.ts';
import { loadLessons } from '../lib/cartilha/load-lessons.ts';
import { LESSON_TERMS as PLAYGROUND_TERMS } from '../lib/cartilha/lesson-index.generated.ts';
import { runBuildLessonIndex } from '../scripts/build-lesson-index.ts';

const APP_ROOT = join(import.meta.dirname, '..');
const CONTENT_DIR = join(APP_ROOT, 'content', 'cartilha');
const PLAYGROUND_FILE = join(APP_ROOT, 'lib', 'cartilha', 'lesson-index.generated.ts');
const EXTENSION_FILE = join(APP_ROOT, '..', '..', 'packages', 'vscode', 'src', 'language', 'lesson-terms.generated.ts');

const lessons = loadLessons(CONTENT_DIR).lessons;
const index = buildLessonIndex(lessons);

describe('índice de lições gerado', () => {
  it('o índice gerado é igual ao calculado das lições', () => {
    expect(readFileSync(PLAYGROUND_FILE, 'utf8')).toBe(renderPlaygroundIndex(index));
  });

  it('a extensão recebe o mesmo mapa de termos', () => {
    expect(readFileSync(EXTENSION_FILE, 'utf8')).toBe(renderExtensionTerms(index));
    expect(PLAYGROUND_TERMS).toEqual(index.terms);
  });

  it('cada termo aponta para uma lição existente e cada lição entra no índice', () => {
    expect(index.lessonIds).toEqual(lessons.map((lesson) => lesson.id));
    for (const lessonId of Object.values(index.terms)) expect(index.lessonIds).toContain(lessonId);
    expect(index.terms['prosa']).toBe('licao-01');
    expect(index.terms['uai']).toBe('licao-02');
  });

  it('--check falha quando o índice diverge e --write corrige', () => {
    const files = new Map<string, string>([[PLAYGROUND_FILE, 'velho'], [EXTENSION_FILE, renderExtensionTerms(index)]]);
    const io = { read: (path: string) => files.get(path) ?? '', write: (path: string, text: string) => void files.set(path, text), out: () => undefined, err: () => undefined };
    const targets = { contentDir: CONTENT_DIR, playgroundFile: PLAYGROUND_FILE, extensionFile: EXTENSION_FILE };
    expect(runBuildLessonIndex({ ...targets, mode: '--check' }, io)).toBe(1);
    expect(runBuildLessonIndex({ ...targets, mode: '--write' }, io)).toBe(0);
    expect(files.get(PLAYGROUND_FILE)).toBe(renderPlaygroundIndex(index));
    expect(runBuildLessonIndex({ ...targets, mode: '--check' }, io)).toBe(0);
  });

  it('recusa índice quando a cartilha tem problema', () => {
    const io = { read: () => '', write: () => undefined, out: () => undefined, err: () => undefined };
    expect(runBuildLessonIndex({ contentDir: join(APP_ROOT, 'tests', 'fixtures', 'cartilha', 'invalid'), playgroundFile: PLAYGROUND_FILE, extensionFile: EXTENSION_FILE, mode: '--check' }, io)).toBe(1);
  });
});
