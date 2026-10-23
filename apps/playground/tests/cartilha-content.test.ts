import { readFileSync } from 'node:fs';
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

const SCRIPT_09_TO_11: readonly { readonly id: string; readonly order: number; readonly terms: readonly string[] }[] = [
  { id: 'licao-09', order: 9, terms: ['arruma_trem', 'a_raiz', 'inherda_de', 'aprepara_trem'] },
  { id: 'licao-10', order: 10, terms: ['tenta_aí', 'se_der_ruim', 'por_fim', 'vixe'] },
  { id: 'licao-11', order: 11, terms: ['pergunta', 'espera_um_cadim', 'vira_número'] },
];

describe('roteiro das lições 9 a 11', () => {
  it.each(SCRIPT_09_TO_11)('a lição $id existe e cumpre o roteiro', ({ id, order, terms }) => {
    const lesson = lessons.find((candidate) => candidate.id === id);
    expect(lesson?.order).toBe(order);
    expect(lesson?.terms).toEqual(terms);
  });

  it('a lição 11 usa stdinFile dentro de content/cartilha/stdin', () => {
    const raw = readFileSync(join(CONTENT_DIR, 'licao-11.md'), 'utf8');
    expect(raw).toMatch(/^ {2}stdinFile: stdin\/licao-11\.txt$/mu);
    expect(readFileSync(join(CONTENT_DIR, 'stdin', 'licao-11.txt'), 'utf8').trim()).toBe('10,50');
    expect(lessons.find((candidate) => candidate.id === 'licao-11')?.exercise.stdin).toEqual(['10,50']);
  });

  it('a lição 9 ensina classe com herança e chamada à raiz', () => {
    const lesson = lessons.find((candidate) => candidate.id === 'licao-09');
    expect(lesson?.exercise.solution).toMatch(/arruma_trem Pequi inherda_de Fruta/u);
    expect(lesson?.exercise.solution).toMatch(/a_raiz\./u);
  });

  it('a lição 10 mostra o erro de execução já em português', () => {
    const lesson = lessons.find((candidate) => candidate.id === 'licao-10');
    expect(lesson?.exercise.solution).toMatch(/erro\.mensagem/u);
  });
});
