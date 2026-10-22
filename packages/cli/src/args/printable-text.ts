const CONTROL_CHARACTERS = /\p{Cc}/gu;
const HEX_RADIX = 16;
const ESCAPE_DIGITS = 4;

export const toPrintable = (text: string): string =>
  text.replace(CONTROL_CHARACTERS, (char) => `\\u${char.charCodeAt(0).toString(HEX_RADIX).padStart(ESCAPE_DIGITS, '0')}`);
