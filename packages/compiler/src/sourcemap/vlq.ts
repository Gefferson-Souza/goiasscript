const BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const CONTINUATION = 0b100000;
const PAYLOAD_MASK = 0b11111;
const PAYLOAD_BITS = 5;
const SIGN_BIT = 1;

export function encodeVlq(value: number): string {
  let remaining = value < 0 ? (-value << SIGN_BIT) | SIGN_BIT : value << SIGN_BIT;
  let out = '';
  do {
    const digit = remaining & PAYLOAD_MASK;
    remaining >>>= PAYLOAD_BITS;
    out += BASE64.charAt(remaining > 0 ? digit | CONTINUATION : digit);
  } while (remaining > 0);
  return out;
}
