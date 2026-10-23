import { DIAGNOSTICS } from '@goiasscript/language';
import { AVAILABLE_LESSON_IDS, LESSON_TERMS } from './cartilha/lesson-index.generated.ts';

export const LESSON_ROUTE_PREFIX = '/cartilha/';
export const LESSON_ID_PATTERN = /^[a-z0-9-]+$/u;
export const WHAT_CHANGED_ID = 'o-que-mudou';

export const AVAILABLE_LESSONS: readonly string[] = [...AVAILABLE_LESSON_IDS, WHAT_CHANGED_ID];

// Toda lição citada pelo catálogo de diagnósticos; o link só aparece quando ela também está em AVAILABLE_LESSONS.
export const KNOWN_LESSON_IDS: readonly string[] = [...new Set(DIAGNOSTICS.flatMap((definition) => (definition.lesson === undefined ? [] : [definition.lesson])))];

export const LESSON_BY_TERM: Readonly<Record<string, string>> = LESSON_TERMS;
