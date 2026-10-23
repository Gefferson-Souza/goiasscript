import { compile } from '@goiasscript/compiler';
import { describe, expect, it } from 'vitest';
import { checkLessonBlocks } from '../../lib/cartilha/check-lesson-blocks.ts';
import type { CheckLessonBlocksDeps, Lesson } from '../../lib/cartilha/lesson.types.ts';
import { parseLesson } from '../../lib/cartilha/parse-lesson.ts';
import { runLessonProgram } from '../../lib/cartilha/run-lesson-program.ts';
import { EXAMPLE_BLOCK, fenced, lessonSource } from '../support/lesson-source.ts';
import type { LessonSourceOptions } from '../support/lesson-source.types.ts';

const deps: CheckLessonBlocksDeps = {
  compile: (source) => compile(source, { target: 'module' }),
  run: (code, stdin) => runLessonProgram(code, stdin, {}),
};

function lessonOf(options: LessonSourceOptions, stdin = ''): Lesson {
  const result = parseLesson('licao-01.md', lessonSource(options), () => stdin);
  if (!result.ok) throw new Error(result.problems.map((problem) => problem.message).join('\n'));
  return result.lesson;
}

const check = async (options: LessonSourceOptions, stdin = ''): Promise<string> =>
  (await checkLessonBlocks([lessonOf(options, stdin)], deps)).map((problem) => problem.message).join('\n');

describe('checkLessonBlocks', () => {
  it('aceita bloco que compila sem nenhum diagnóstico', async () => {
    expect(await check({})).toBe('');
  });

  it('recusa aviso inesperado em bloco (classe Conta)', async () => {
    const blocks = [EXAMPLE_BLOCK, fenced('goiasscript', 'arruma_trem Conta {\n  aprepara_trem() {}\n}')];
    const text = await check({ blocks });
    expect(text).toContain('GS0804');
    expect(text).toMatch(/licao-01\.md:2\d/u);
  });

  it('recusa bloco que não compila', async () => {
    const text = await check({ blocks: [EXAMPLE_BLOCK, fenced('goiasscript', 'uai preço é 10,50')] });
    expect(text).toContain('GS0208');
  });

  it('aceita erro-esperado só quando o código bate', async () => {
    const good = [EXAMPLE_BLOCK, fenced('goiasscript erro-esperado GS0208', 'uai preço é 10,50')];
    const wrong = [EXAMPLE_BLOCK, fenced('goiasscript erro-esperado GS0301', 'uai preço é 10,50')];
    const clean = [EXAMPLE_BLOCK, fenced('goiasscript erro-esperado GS0208', 'prosa("ok")')];
    expect(await check({ blocks: good })).toBe('');
    expect(await check({ blocks: wrong })).toContain('GS0301');
    expect(await check({ blocks: clean })).toContain('GS0208');
  });

  it('recusa bloco que roda e termina com erro', async () => {
    const text = await check({ blocks: [EXAMPLE_BLOCK, fenced('goiasscript', 'vixe("quebrou")')] });
    expect(text).toContain('terminou com erro');
  });

  it('recusa solução que imprime saída diferente da esperada', async () => {
    const text = await check({ solution: 'prosa("Tchau")' });
    expect(text).toContain('Olá, Goiás!');
    expect(text).toContain('Tchau');
  });

  it('recusa solução que não compila', async () => {
    expect(await check({ solution: 'uai preço é 10,50' })).toContain('GS0208');
  });

  it('compara ignorando CRLF, espaço no fim da linha e linhas vazias finais', async () => {
    const solution = 'prosa("Linha 1   ")\nprosa("Linha 2")\nprosa("")';
    expect(await check({ solution, expectedStdout: 'Linha 1\r\nLinha 2\r\n\r\n' })).toBe('');
  });

  it('responde pergunta com as linhas do stdin', async () => {
    const solution = 'uai nome é pergunta("Nome?")\nprosa("Oi, " mais nome)';
    expect(await check({ solution, expectedStdout: 'Nome? Oi, Pequi', stdinFile: 'stdin/licao-01.txt' }, 'Pequi\n')).toBe('');
  });

  it('só compila quando não há executor', async () => {
    const lesson = lessonOf({ solution: 'prosa("Tchau")' });
    expect(await checkLessonBlocks([lesson], { compile: deps.compile })).toEqual([]);
  });

  it('mensagens saem em goianês e citam arquivo e linha', async () => {
    const problems = await checkLessonBlocks([lessonOf({ solution: 'prosa("Tchau")' })], deps);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatchObject({ file: 'licao-01.md', line: 11 });
    expect(problems[0]?.message).toMatch(/^Ô sô, licao-01\.md:11/u);
  });
});
