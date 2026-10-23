import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { checkLessonBlocks } from '../lib/cartilha/check-lesson-blocks.ts';
import { loadLessons } from '../lib/cartilha/load-lessons.ts';
import { runLessonProgram } from '../lib/cartilha/run-lesson-program.ts';
import { compile } from '@goiasscript/compiler';

const CONTENT_DIR = join(import.meta.dirname, '..', 'content', 'cartilha');
const { lessons, problems } = loadLessons(CONTENT_DIR);

describe('lições reais da cartilha', () => {
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
