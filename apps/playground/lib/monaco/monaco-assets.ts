export const GOIASSCRIPT_LANGUAGE_ID = 'goiasscript';
export const MARKER_OWNER = 'goiasscript';

// A CSP não aceita CDN: o loader do Monaco lê tudo do próprio domínio.
export const MONACO_BASE_PATH = '/vs';

// Acento e letra "parecida" são normais em goianês; o destaque de caractere suspeito só atrapalharia.
export const EDITOR_UNICODE_HIGHLIGHT = { ambiguousCharacters: false, invisibleCharacters: false, nonBasicASCII: false } as const;
