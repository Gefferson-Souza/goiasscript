export const LEARNER_ID_FORMAT = /^A[1-9]$/u;
export const LESSON_ID_FORMAT = /^licao-\d{2}$/u;
export const DIAGNOSTIC_CODE_FORMAT = /^GS\d{4}$/u;
export const EMAIL_PATTERN = /[^\s@]+@[^\s@]+\.[^\s@]+/u;
export const PHONE_PATTERN = /(?:\+?\d{2}[\s.-]?)?\(?\d{2}\)?[\s.-]?9?\d{4}[\s.-]?\d{4}/u;

export const PILOT_ORIGINS: readonly string[] = ['goias', 'fora'];
export const ANSWER_KEYS: readonly string[] = ['learnerId', 'origin', 'lessonsCompleted', 'confusingMessages', 'confusingLessons'];
export const MESSAGE_KEYS: readonly string[] = ['code', 'comment'];
export const LESSON_KEYS: readonly string[] = ['lessonId', 'comment'];

export const REQUIRED_LESSONS: readonly string[] = ['licao-01', 'licao-02', 'licao-03', 'licao-04', 'licao-05'];
export const REQUIRED_LEARNERS = 3;
export const TOP_LIMIT = 5;

export const ANSWER_FILE_PATTERN = /^A[1-9]\.json$/u;
export const DIR_FLAG = '--dir';
export const KEEP_FILE = '.gitkeep';
export const MAX_COMMENT_LENGTH = 280;
