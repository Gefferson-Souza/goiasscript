import { LESSON_BY_TERM, LESSON_ID_PATTERN } from './lesson-link.constants.ts';
import type { LessonLookup } from './lesson-link.types.ts';

const TRAILING_SLASHES = /\/+$/u;

export const DEFAULT_LESSONS: LessonLookup = {
  lessonIdOf: (term) => (Object.hasOwn(LESSON_BY_TERM, term) ? LESSON_BY_TERM[term] : undefined),
};

export function lessonUrlFor(term: string, lessonBaseUrl: string | null, lessons: LessonLookup): string | undefined {
  if (lessonBaseUrl === null) return undefined;
  const lessonId = lessons.lessonIdOf(term);
  if (lessonId === undefined || !LESSON_ID_PATTERN.test(lessonId)) return undefined;
  return `${lessonBaseUrl.replace(TRAILING_SLASHES, '')}/${lessonId}`;
}
