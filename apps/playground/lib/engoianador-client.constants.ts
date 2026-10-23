// Igual ao MAX_INPUT_CHARS padrão da API do Engoianador.
export const MAX_INPUT_CHARS = 2_000;
export const REQUEST_TIMEOUT_MS = 15_000;
export const REQUEST_TEXT_FIELD = 'text';
export const ENGOIANAR_PATH = '/engoiana';
export const HEALTH_PATH = '/health';
export const HEALTH_TIMEOUT_MS = 5_000;
export const HEALTH_OK_FIELD = 'ok';
export const ACCEPT_JSON_HEADERS = { Accept: 'application/json' } as const;
export const JSON_HEADERS = { 'Content-Type': 'application/json' } as const;

const STATUS_NOT_FOUND = 404;
const STATUS_TOO_MANY_REQUESTS = 429;
const STATUS_CLIENT_ERROR_MIN = 400;
const STATUS_CLIENT_ERROR_MAX = 499;

export const HTTP_STATUS = {
  notFound: STATUS_NOT_FOUND,
  tooManyRequests: STATUS_TOO_MANY_REQUESTS,
  clientErrorMin: STATUS_CLIENT_ERROR_MIN,
  clientErrorMax: STATUS_CLIENT_ERROR_MAX,
} as const;

export const RESPONSE_TEXT_FIELDS = ['text'] as const;
