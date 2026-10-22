const UNSAFE_CHARACTERS = /[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/gu;
const HEX_RADIX = 16;
const SHORT_ESCAPE_WIDTH = 2;
const LONG_ESCAPE_WIDTH = 4;
const SHORT_ESCAPE_LIMIT = 0xff;

const escapeUnsafe = (character: string): string => {
  const code = character.codePointAt(0) ?? 0;
  const hex = code.toString(HEX_RADIX);
  return code <= SHORT_ESCAPE_LIMIT ? `\\x${hex.padStart(SHORT_ESCAPE_WIDTH, '0')}` : `\\u${hex.padStart(LONG_ESCAPE_WIDTH, '0')}`;
};

// Nome de arquivo é entrada hostil: ESC, OSC, C1, bidi e quebra de linha não podem chegar crus ao terminal.
export const printableName = (name: string): string => name.replace(UNSAFE_CHARACTERS, escapeUnsafe);
