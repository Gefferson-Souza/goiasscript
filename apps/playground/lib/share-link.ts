import { BASE64_PAD_MODULUS, BASE64URL_PATTERN, MAX_PAYLOAD_CHARS, SHARE_HASH_PREFIX, SHARE_MAX_BYTES } from './share-link.constants.ts';

const encoder = new TextEncoder();
const strictDecoder = new TextDecoder('utf-8', { fatal: true });

function toBase64Url(bytes: Uint8Array): string {
  const binary = Array.from(bytes, (byte) => String.fromCodePoint(byte)).join('');
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

function fromBase64Url(payload: string): Uint8Array {
  const base64 = payload.replaceAll('-', '+').replaceAll('_', '/');
  const padded = base64.padEnd(Math.ceil(base64.length / BASE64_PAD_MODULUS) * BASE64_PAD_MODULUS, '=');
  return Uint8Array.from(atob(padded), (char) => char.codePointAt(0) ?? 0);
}

// Devolve só o trecho depois de "#codigo=": quem monta a URL decide o resto.
export function encodeShareLink(source: string): string | null {
  const bytes = encoder.encode(source);
  return bytes.length === 0 || bytes.length > SHARE_MAX_BYTES ? null : toBase64Url(bytes);
}

export function decodeShareLink(hash: string): string | null {
  if (!hash.startsWith(SHARE_HASH_PREFIX)) return null;
  const payload = hash.slice(SHARE_HASH_PREFIX.length);
  if (payload.length > MAX_PAYLOAD_CHARS || !BASE64URL_PATTERN.test(payload)) return null;
  try {
    const bytes = fromBase64Url(payload);
    return bytes.length > SHARE_MAX_BYTES ? null : strictDecoder.decode(bytes);
  } catch {
    return null;
  }
}
