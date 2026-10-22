const UNSAFE = /[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/gu;
const HEX_RADIX = 16;
const ESCAPE_DIGITS = 4;

const escapeCodePoint = (char: string): string => {
  if (char === '\t') return char;
  const code = char.codePointAt(0) ?? 0;
  return `\\u${code.toString(HEX_RADIX).padStart(ESCAPE_DIGITS, '0')}`;
};

export function sanitizeForTerminal(text: string): string {
  return text.replace(UNSAFE, escapeCodePoint);
}
