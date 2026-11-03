import { LESSON_TITLES } from './lesson-titles.generated.ts';

export const lessonTitleOf = (lessonId: string): string | undefined => LESSON_TITLES[lessonId];
