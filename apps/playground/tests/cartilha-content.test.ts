import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { checkLessonBlocks } from '../lib/cartilha/check-lesson-blocks.ts';
import { loadLessons } from '../lib/cartilha/load-lessons.ts';
import { runLessonProgram } from '../lib/cartilha/run-lesson-program.ts';
import { compile } from '@goiasscript/compiler';

const CONTENT_DIR = join(import.meta.dirname, '..', 'content', 'cartilha');
const { lessons, problems } = loadLessons(CONTENT_DIR);

const EXPECTED_ROADMAP: ReadonlyArray<{ readonly id: string; readonly order: number; readonly terms: readonly string[] }> = [
  { id: 'licao-01', order: 1, terms: ['prosa'] },
  { id: 'licao-02', order: 2, terms: ['uai', 'trem'] },
  { id: 'licao-03', order: 3, terms: ['mais', 'gritando'] },
  { id: 'licao-04', order: 4, terms: ['se_ocê_quiser', 'se_não', 'se_num_for'] },
];

describe('lições reais da cartilha', () => {
  it.each(EXPECTED_ROADMAP)('a lição $id existe e cumpre o roteiro', ({ id, order, terms }) => {
    const lesson = lessons.find((candidate) => candidate.id === id);
    expect(lesson?.order).toBe(order);
    expect(lesson?.terms).toEqual(terms);
  });

  it('a lição 2 ensina o decimal com ponto por um bloco erro-esperado GS0208', () => {
    const lesson = lessons.find((candidate) => candidate.id === 'licao-02');
    const expectedErrors = lesson?.blocks.filter((block) => block.mode === 'expected-error') ?? [];
    expect(expectedErrors.map((block) => block.expectedCode)).toEqual(['GS0208']);
  });

  it('carregam sem nenhum problema', () => {
    expect(problems.map((problem) => problem.message)).toEqual([]);
  });

  it('todo bloco e toda solução compilam, executam e batem com a saída esperada', async () => {
    const found = await checkLessonBlocks(lessons, {
      compile: (source) => compile(source, { target: 'module' }),
      run: (code, stdin) => runLessonProgram(code, stdin, {}),
    });
    expect(found.map((problem) => problem.message)).toEqual([]);
  }, 120_000);
});

interface LessonScript {
  readonly id: string;
  readonly order: number;
  readonly terms: readonly string[];
}

const SCRIPT_5_TO_8: readonly LessonScript[] = [
  { id: 'licao-05', order: 5, terms: ['vai_indo', 'enquanto_tiver', 'para_com_isso', 'continua_aí'] },
  { id: 'licao-06', order: 6, terms: ['mapear', 'filtrar', 'bota_no_final', 'o_tanto'] },
  { id: 'licao-07', order: 7, terms: ['faz_trem', 'faz_favor'] },
  { id: 'licao-08', order: 8, terms: ['de', 'em', 'Coisa'] },
];

describe('roteiro das lições 5 a 8', () => {
  it.each(SCRIPT_5_TO_8)('a lição $id existe e cumpre o roteiro', ({ id, order, terms }) => {
    const lesson = lessons.find((candidate) => candidate.id === id);
    expect(lesson).toBeDefined();
    expect(lesson?.order).toBe(order);
    expect(lesson?.terms).toEqual(terms);
  });

  it('a lição licao-05 explica o limite de laço do playground', () => {
    const lesson = lessons.find((candidate) => candidate.id === 'licao-05');
    expect(lesson?.bodyMarkdown).toContain('GS0701');
  });
});
