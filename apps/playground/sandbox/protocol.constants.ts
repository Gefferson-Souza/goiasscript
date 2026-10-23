import { RUN_LIMITS } from '../config/run-limits.constants.ts';

export const MESSAGE_TYPES = {
  execute: 'gs:executar',
  answer: 'gs:resposta',
  ready: 'gs:pronto',
  log: 'gs:log',
  ask: 'gs:pergunta',
  finished: 'gs:terminou',
  failed: 'gs:falhou',
} as const;

export const LOG_STREAMS = { out: 'out', err: 'err' } as const;

export const RUNNER_URL = '/sandbox/runner.js';

// Teto do arquivo gerado: o runner é fino e qualquer crescimento grande indica dependência vazando para dentro dele.
export const RUNNER_MAX_BYTES = 6_144;

export const MAX_STACK_CHARS = 20_000;
export const MAX_ERROR_NAME_CHARS = 100;
export const MAX_ERROR_CODE_CHARS = 16;

// Um caractere acima do teto do host: basta para ele detectar o excesso sem receber o texto gigante inteiro.
export const MAX_LOG_MESSAGE_CHARS = RUN_LIMITS.maxLogChars + 1;
