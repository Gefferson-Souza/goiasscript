import { join } from 'node:path';
import { loadLessons } from './load-lessons.ts';
import type { Lesson, LessonSummary, LessonView } from './lesson.types.ts';
import { PRIMER_CONTENT_SEGMENTS, PRIMER_LOAD_FAILURE } from './cartilha-content.constants.ts';

export const primerContentDir = (root: string = process.cwd()): string => join(root, ...PRIMER_CONTENT_SEGMENTS);

// Lição torta derruba o build: nunca vai ao ar uma cartilha que o check-cartilha reprovaria.
export function loadPrimer(dir: string = primerContentDir()): readonly Lesson[] {
  const { lessons, problems } = loadLessons(dir);
  if (problems.length > 0) {
    throw new Error(`${PRIMER_LOAD_FAILURE}\n${problems.map((problem) => problem.message).join('\n')}`);
  }
  return [...lessons].sort((a, b) => a.order - b.order);
}

export const lessonStaticParams = (lessons: readonly Lesson[]): readonly { readonly id: string }[] =>
  lessons.map((lesson) => ({ id: lesson.id }));

// A solução fica no servidor: o que vai ao navegador é só o necessário pra rodar e conferir.
export const toLessonView = (lesson: Lesson): LessonView => ({
  id: lesson.id,
  title: lesson.title,
  exampleCode: lesson.example.code,
  exercise: {
    prompt: lesson.exercise.prompt,
    starter: lesson.exercise.starter,
    expectedStdout: lesson.exercise.expectedStdout,
    ...(lesson.exercise.stdin === undefined ? {} : { stdin: lesson.exercise.stdin }),
  },
});

export const toLessonSummary = ({ id, order, title, summary }: Lesson): LessonSummary => ({ id, order, title, summary });
