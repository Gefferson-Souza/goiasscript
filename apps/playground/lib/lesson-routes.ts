import { AVAILABLE_LESSONS, LESSON_BY_TERM, LESSON_ID_PATTERN, LESSON_ROUTE_PREFIX } from './lesson-routes.constants.ts';

export { AVAILABLE_LESSONS, KNOWN_LESSON_IDS } from './lesson-routes.constants.ts';

export function lessonUrlOf(lessonId: string, available: readonly string[] = AVAILABLE_LESSONS): string | undefined {
  if (!LESSON_ID_PATTERN.test(lessonId) || !available.includes(lessonId)) return undefined;
  return `${LESSON_ROUTE_PREFIX}${lessonId}`;
}

export function lessonIdOfTerm(term: string): string | undefined {
  return Object.hasOwn(LESSON_BY_TERM, term) ? LESSON_BY_TERM[term] : undefined;
}
