export const CACHE_KEY_VERSION = 'v1';
export const CACHE_KEY_SEPARATOR = ':';
export const HASH_ALGORITHM = 'SHA-256';
export const HEX_RADIX = 16;
export const HEX_BYTE_WIDTH = 2;
export const UNICODE_FORM = 'NFC';
export const WHITESPACE_RUN = /\s+/gu;
export const SINGLE_SPACE = ' ';
// Piso do Cloudflare KV: expirationTtl abaixo disso é recusado pela API.
export const KV_MIN_TTL_SEC = 60;
export const CACHE_READ_FAILED = 'cache read failed';
export const CACHE_WRITE_FAILED = 'cache write failed';
