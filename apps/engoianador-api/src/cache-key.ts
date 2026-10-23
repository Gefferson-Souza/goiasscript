import {
  CACHE_KEY_SEPARATOR,
  CACHE_KEY_VERSION,
  HASH_ALGORITHM,
  HEX_BYTE_WIDTH,
  HEX_RADIX,
  SINGLE_SPACE,
  UNICODE_FORM,
  WHITESPACE_RUN,
} from './cache.constants';

export function normalizeForCache(text: string): string {
  return text.normalize(UNICODE_FORM).trim().replace(WHITESPACE_RUN, SINGLE_SPACE);
}

async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest(HASH_ALGORITHM, new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(HEX_RADIX).padStart(HEX_BYTE_WIDTH, '0')).join('');
}

export async function cacheKeyOf(text: string, promptVersion: string, modelId: string): Promise<string> {
  const hash = await sha256Hex(normalizeForCache(text));
  return [CACHE_KEY_VERSION, promptVersion, modelId, hash].join(CACHE_KEY_SEPARATOR);
}
