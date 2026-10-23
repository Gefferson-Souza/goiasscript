const MAX_RUN_MS = 10_000;
const IDLE_MS = 400;
const MAX_LOG_LINES = 1_000;
const MAX_LOG_CHARS = 200_000;
const MAX_LINE_CHARS = 10_000;
const MAX_PROMPT_CHARS = 500;
const LOOP_LIMIT = 1_000_000;

export const RUN_LIMITS = {
  maxRunMs: MAX_RUN_MS,
  idleMs: IDLE_MS,
  maxLogLines: MAX_LOG_LINES,
  maxLogChars: MAX_LOG_CHARS,
  maxLineChars: MAX_LINE_CHARS,
  maxPromptChars: MAX_PROMPT_CHARS,
  loopLimit: LOOP_LIMIT,
} as const;
