import { RUN_LIMITS } from '../../config/run-limits.constants.ts';

const CEILING_MARGIN_MS = 5_000;

export const GRADE_CEILING_MS = RUN_LIMITS.maxRunMs + CEILING_MARGIN_MS;
export const GRADE_FILE_NAME = 'exercicio.gs';
export const TRAILING_BLANKS = /[ \t]+$/u;
export const TRAILING_NEWLINES = /\n+$/u;
export const CRLF = /\r\n/gu;
export const OUTPUT_LINE_JOINER = '\n';

export const GRADE_REASONS = {
  tooManyQuestions: 'Ô sô, o programa perguntou mais do que a lição respondeu.',
  stopped: 'Ô sô, o programa parou antes de acabar.',
  compileCrashed: 'Ô sô, num deu pra conferir o código agora. Tenta de novo.',
} as const;
