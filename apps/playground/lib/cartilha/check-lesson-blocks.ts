import type { CompileResult, Diagnostic } from '@goiasscript/compiler';
import { lessonProblem } from './lesson-schema.ts';
import type { CheckLessonBlocksDeps, Lesson, LessonBlock, LessonProblem, ProgramToCheck } from './lesson.types.ts';
import type { RunLessonProgramResult } from './run-lesson-program.types.ts';

const TRAILING_SPACE = /[ \t]+$/u;

// Fim de linha, espaço no fim da linha e linhas vazias finais não contam na comparação.
function normalizeOutput(text: string): string {
  return text.replace(/\r\n/gu, '\n').split('\n').map((line) => line.replace(TRAILING_SPACE, '')).join('\n').replace(/\n+$/u, '');
}

const describeDiagnostic = (diagnostic: Diagnostic): string => `${diagnostic.code} (${diagnostic.message})`;

function runProblems(lesson: Lesson, line: number, label: string, result: RunLessonProgramResult): readonly LessonProblem[] {
  if (result.timedOut) return [lessonProblem(lesson.file, line, `${label} estourou o tempo de execução.`)];
  if (result.exitCode === 0) return [];
  const detail = result.stderr.trim().split('\n')[0] ?? '';
  return [lessonProblem(lesson.file, line, `${label} terminou com erro (saída ${String(result.exitCode)}): ${detail}`)];
}

const toStdin = (answers: readonly string[]): string => answers.map((answer) => `${answer}\n`).join('');

function compileProblems(lesson: Lesson, line: number, label: string, compiled: CompileResult): readonly LessonProblem[] {
  if (compiled.diagnostics.length === 0) return [lessonProblem(lesson.file, line, `${label} não compilou.`)];
  return compiled.diagnostics.map((d) => lessonProblem(lesson.file, line + d.range.start.line, `${label} tem diagnóstico: ${describeDiagnostic(d)}.`));
}

async function checkProgram(lesson: Lesson, program: ProgramToCheck, deps: CheckLessonBlocksDeps): Promise<{ readonly problems: readonly LessonProblem[]; readonly stdout?: string }> {
  const { source, line, label, stdin } = program;
  const compiled = deps.compile(source);
  if (!compiled.ok || compiled.diagnostics.length > 0) return { problems: compileProblems(lesson, line, label, compiled) };
  if (deps.run === undefined) return { problems: [] };
  const result = await deps.run(compiled.code, stdin);
  return { problems: runProblems(lesson, line, label, result), stdout: result.stdout };
}

function checkExpectedError(lesson: Lesson, block: LessonBlock, deps: CheckLessonBlocksDeps): readonly LessonProblem[] {
  const codes = deps.compile(block.code).diagnostics.map((diagnostic) => diagnostic.code);
  const exact = codes.length > 0 && codes.every((code) => code === block.expectedCode);
  if (exact) return [];
  const got = codes.length === 0 ? 'nada' : codes.join(', ');
  return [lessonProblem(lesson.file, block.line, `o bloco devia dar ${String(block.expectedCode)}, mas deu ${got}.`)];
}

async function checkBlock(lesson: Lesson, block: LessonBlock, deps: CheckLessonBlocksDeps): Promise<readonly LessonProblem[]> {
  if (block.mode === 'expected-error') return checkExpectedError(lesson, block, deps);
  return (await checkProgram(lesson, { source: block.code, line: block.line, label: 'o bloco', stdin: '' }, deps)).problems;
}

async function checkSolution(lesson: Lesson, deps: CheckLessonBlocksDeps): Promise<readonly LessonProblem[]> {
  const { problems, stdout } = await checkProgram(
    lesson,
    { source: lesson.exercise.solution, line: lesson.solutionLine, label: 'a solução do exercício', stdin: toStdin(lesson.exercise.stdin ?? []) },
    deps,
  );
  if (problems.length > 0 || stdout === undefined) return problems;
  const expected = normalizeOutput(lesson.exercise.expectedStdout);
  const got = normalizeOutput(stdout);
  if (got === expected) return [];
  const text = `a solução imprime ${JSON.stringify(got)} mas o esperado é ${JSON.stringify(expected)}.`;
  return [lessonProblem(lesson.file, lesson.solutionLine, text)];
}

// Sequencial de propósito: cada programa sobe um processo e a CI não aguenta todos juntos.
function inSequence<T>(items: readonly T[], check: (item: T) => Promise<readonly LessonProblem[]>): Promise<readonly LessonProblem[]> {
  return items.reduce<Promise<readonly LessonProblem[]>>(async (previous, item) => [...(await previous), ...(await check(item))], Promise.resolve([]));
}

async function checkLesson(lesson: Lesson, deps: CheckLessonBlocksDeps): Promise<readonly LessonProblem[]> {
  const fromBlocks = await inSequence(lesson.blocks, (block) => checkBlock(lesson, block, deps));
  return [...fromBlocks, ...(await checkSolution(lesson, deps))];
}

export function checkLessonBlocks(lessons: readonly Lesson[], deps: CheckLessonBlocksDeps): Promise<readonly LessonProblem[]> {
  return inSequence(lessons, (lesson) => checkLesson(lesson, deps));
}
