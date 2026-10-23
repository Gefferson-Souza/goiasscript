import { LESSON_TERMS } from './lesson-terms.generated.ts';

export const LESSON_ID_PATTERN = /^[a-z0-9-]+$/u;
export const LESSON_LINK_LABEL = 'Dá uma olhada na lição';

export const LESSON_BY_TERM: Readonly<Record<string, string>> = LESSON_TERMS;
