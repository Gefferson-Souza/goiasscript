export const SAFE_EXTERNAL_PROTOCOL = 'https:';
// Começa com uma barra só: "//" e "/\" viram endereço de outro site no navegador.
export const INTERNAL_PATH_PATTERN = /^\/(?![/\\])[^\s\\\p{Cc}]*$/u;
