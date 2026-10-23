export const REQUEST_TEXT_FIELD = 'texto';
export const RESPONSE_TEXT_FIELD = 'engoianado';
export const ERROR_FIELD = 'erro';
const VERSION_FIELD = 'versao';

export const STATUS_PAYLOAD = {
  ok: '🪄 Engoianador no ar, sô!',
  [VERSION_FIELD]: '1.5.0',
  endpoints: {
    'POST /engoiana': 'Engoiana um texto. Body: { "texto": "..." }',
  },
} as const;

export const MESSAGES = {
  invalidJson: 'JSON inválido, ô rapaz',
  emptyText: 'Manda um texto de verdade, ô rapaz',
  notFound: 'Cabôu o caminho, sô. Tenta POST /engoiana',
  recess: 'Ô rapaz, o engoianador tá de recesso (config). Volta já já.',
  rateLimited: 'Calma aí, sô! Ocê já engoianou demais hoje. Volta amanhã.',
  providerFailed: 'Ô rapaz! Deu ruim no engoianador. Tenta de novo daqui a pouco.',
} as const;

export const DEFAULT_MAX_INPUT_CHARS = 2000;
export const DECIMAL_RADIX = 10;
