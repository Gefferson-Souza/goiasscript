import { ERROR_COPY } from '../lib/error-pages.constants.ts';

export const STATUS_OK = 200;
export const STATUS_NOT_FOUND = 404;
export const MAX_REDIRECTS = 3;
export const REQUEST_TIMEOUT_MS = 10_000;
export const MAX_BODY_BYTES = 65_536;
export const REDIRECT_STATUS_MIN = 300;
export const REDIRECT_STATUS_MAX = 399;
export const MISSING_ROUTE = '/rota-que-nao-existe';
export const RUNNER_ROUTE = '/sandbox/runner.js';
export const DONATION_ROUTE = '/doacao';
export const HOME_FRAME_GUARD = "frame-ancestors 'none'";
export const JAVASCRIPT_CONTENT_TYPE = /^(?:text|application)\/(?:x-)?javascript\b/u;
export const NOT_FOUND_MARKER = ERROR_COPY.notFound.title;
export const REQUIRED_PROTOCOL = 'https:';

export const CLI_MESSAGES = {
  missingUrl: 'Ô sô! Faltou o endereço do site. Uso: smoke-playground <https://endereço>.',
  invalidUrl: 'Ô sô! O endereço tem que ser https:// e válido.',
  success: 'Tá pronto, sô! O site respondeu direitinho em tudo.',
} as const;
export const EXIT_OK = 0;
export const EXIT_SMOKE_FAILED = 1;
export const EXIT_USAGE = 2;
