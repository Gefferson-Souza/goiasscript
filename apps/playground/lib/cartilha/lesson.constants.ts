export const LESSON_FILE_PATTERN = /^licao-\d{2}\.md$/u;
export const LESSON_ID_FORMAT = /^licao-\d{2}$/u;
export const STDIN_FILE_PATTERN = /^stdin\/[a-z0-9-]+\.txt$/u;
export const DIAGNOSTIC_CODE_PATTERN = /^GS\d{4}$/u;

export const FRONTMATTER_FENCE = '---';
export const CODE_FENCE = '```';
export const BLOCK_LANGUAGE = 'goiasscript';
export const EXAMPLE_MODIFIER = 'exemplo';
export const EXPECTED_ERROR_MODIFIER = 'erro-esperado';

export const FRONTMATTER_KEYS: readonly string[] = ['id', 'order', 'title', 'summary', 'terms', 'exercise'];
export const EXERCISE_KEYS: readonly string[] = ['prompt', 'starter', 'solution', 'expectedStdout', 'stdinFile'];

export const LESSON_RUN_TIMEOUT_MS = 10_000;
export const LESSON_RUN_MAX_BUFFER_BYTES = 1_048_576;
export const LESSON_RUN_DIR_PREFIX = 'gs-licao-';
export const LESSON_RUN_FILE_NAME = 'programa.mjs';
export const LESSON_RUN_ENV_KEYS: readonly string[] = ['SystemRoot'];

export const SOURCE_LINE_BREAK = /\r?\n/u;
export const SKIP_EXECUTION_FLAG = '--somente-compila';
export const DIR_FLAG = '--dir';
