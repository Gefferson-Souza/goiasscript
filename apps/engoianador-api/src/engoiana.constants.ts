export const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
export const GROQ_TEMPERATURE = 0.7;
export const GROQ_MAX_TOKENS = 1024;
export const GROQ_TIMEOUT_MS = 15_000;
export const WORKERS_AI_TIMEOUT_MS = 20_000;

export const QUOTE_PAIRS: readonly (readonly [string, string])[] = [
  ['"', '"'],
  ['“', '”'],
  ["'", "'"],
];
