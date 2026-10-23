export const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
export const GROQ_MODEL = 'llama-3.1-70b-versatile';
export const WORKERS_AI_MODEL = '@cf/meta/llama-3.1-8b-instruct';
export const GROQ_TEMPERATURE = 0.7;
export const GROQ_MAX_TOKENS = 1024;
export const GROQ_TIMEOUT_MS = 15_000;

export const QUOTE_PAIRS: readonly (readonly [string, string])[] = [
  ['"', '"'],
  ['“', '”'],
  ["'", "'"],
];
