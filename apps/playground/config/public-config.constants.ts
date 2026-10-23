export const ONLINE_FLAG = '--online';
export const HEAD_TIMEOUT_MS = 10_000;
export const HTTP_FORBIDDEN = 403;
export const HTTP_METHOD_NOT_ALLOWED = 405;
export const PROBE_USER_AGENT = 'goiasscript-link-check/1.0';
export const FIRST_BYTE_RANGE = 'bytes=0-0';
export const HTTP_OK_MIN = 200;
export const HTTP_REDIRECT_MAX = 399;

export const ENV_FILES = ['.env.production.local', '.env.local', '.env.production', '.env'] as const;

export const MESSAGES = {
  configOk: 'Tá tudo certo com a configuração pública, sô.',
  noLinks: 'Não tem link de doação configurado, sô. Nada pra conferir.',
  linksOk: 'Os links de doação responderam direitinho, sô.',
  unexpectedFailure: 'Ô sô! Deu um rolo inesperado ao conferir a configuração pública.',
  badStatus: 'respondeu com status fora de 2xx/3xx',
  unreachable: 'não respondeu a tempo ou a rede caiu',
} as const;
