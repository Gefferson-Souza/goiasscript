import { compile } from '@goiasscript/compiler';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { checkLessonBlocks } from '../lib/cartilha/check-lesson-blocks.ts';
import { DIR_FLAG, SKIP_EXECUTION_FLAG } from '../lib/cartilha/lesson.constants.ts';
import { loadLessons } from '../lib/cartilha/load-lessons.ts';
import { runLessonProgram } from '../lib/cartilha/run-lesson-program.ts';
import type { CheckLessonsIo, CheckLessonsOptions } from './check-cartilha.types.ts';

function flagValue(args: readonly string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  return index === -1 ? undefined : args[index + 1];
}

export async function runCheckLessons(options: CheckLessonsOptions, io: CheckLessonsIo): Promise<number> {
  const { lessons, problems: loadProblems } = loadLessons(options.dir);
  const skipExecution = options.args.includes(SKIP_EXECUTION_FLAG);
  const blockProblems = await checkLessonBlocks(lessons, {
    compile: (source) => compile(source, { target: 'module' }),
    ...(skipExecution ? {} : { run: (code: string, stdin: string) => runLessonProgram(code, stdin, {}) }),
  });
  const problems = [...loadProblems, ...blockProblems];
  if (problems.length > 0) {
    for (const problem of problems) io.err(`${problem.message}\n`);
    io.err(`Ô sô, a cartilha tem ${String(problems.length)} trem(ns) torto(s). Arruma e tenta de novo.\n`);
    return 1;
  }
  io.out(`Tá pronto, sô! ${String(lessons.length)} lição(ões) da cartilha conferida(s).\n`);
  return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const dir = flagValue(args, DIR_FLAG) ?? join(import.meta.dirname, '..', 'content', 'cartilha');
  const exitCode = await runCheckLessons({ dir, args }, { out: (text) => process.stdout.write(text), err: (text) => process.stderr.write(text) });
  process.exit(exitCode);
}
