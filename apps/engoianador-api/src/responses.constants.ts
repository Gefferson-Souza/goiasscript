export const REQUEST_TEXT_FIELD = 'text';
export const RESPONSE_TEXT_FIELD = 'text';
export const ERROR_FIELD = 'error';
const VERSION_FIELD = 'version';

export const STATUS_PAYLOAD = {
  ok: '🪄 Engoianador no ar, sô!',
  [VERSION_FIELD]: '1.5.0',
  endpoints: {
    'POST /engoiana': 'Engoiana um texto. Body: { "text": "..." }',
    'GET /health': 'Mostra se o engoianador tá inteiro',
  },
} as const;
