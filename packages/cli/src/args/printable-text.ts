const UNSAFE_CHARACTERS = /[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/gu;
const LINE_PRESERVING_UNSAFE = /(?![\n\t])[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/gu;
const HEX_RADIX = 16;
const ESCAPE_DIGITS = 4;

const escapeControl = (char: string): string => `\\u${(char.codePointAt(0) ?? 0).toString(HEX_RADIX).padStart(ESCAPE_DIGITS, '0')}`;

export const toPrintable = (text: string): string => text.replace(UNSAFE_CHARACTERS, escapeControl);

// Mantém quebra de linha e tabulação: o eco de objetos usa as duas.
export const toPrintableMultiline = (text: string): string => text.replace(LINE_PRESERVING_UNSAFE, escapeControl);
