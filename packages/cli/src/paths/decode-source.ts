import { BYTE_ORDER_MARKS_UTF16, UTF8_GUIDANCE } from './paths.constants.ts';
import type { DecodedSource } from './paths.types.ts';

const utf8 = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true });

const startsWithUtf16Mark = (bytes: Uint8Array): boolean =>
  BYTE_ORDER_MARKS_UTF16.some(([first, second]) => bytes[0] === first && bytes[1] === second);

export function decodeSource(bytes: Uint8Array): DecodedSource {
  if (startsWithUtf16Mark(bytes)) return { ok: false, detail: UTF8_GUIDANCE };
  try {
    return { ok: true, text: utf8.decode(bytes) };
  } catch {
    return { ok: false, detail: UTF8_GUIDANCE };
  }
}
