const CONTROL_CHARACTERS = /\p{Cc}/gu;
const LINE_PRESERVING_CONTROLS = /(?![\n\t])\p{Cc}/gu;
const HEX_RADIX = 16;
const ESCAPE_DIGITS = 4;

const escapeControl = (char: string): string => `\\u${char.charCodeAt(0).toString(HEX_RADIX).padStart(ESCAPE_DIGITS, '0')}`;

export const toPrintable = (text: string): string => text.replace(CONTROL_CHARACTERS, escapeControl);

// Mantém quebra de linha e tabulação: o eco de objetos usa as duas.
export const toPrintableMultiline = (text: string): string => text.replace(LINE_PRESERVING_CONTROLS, escapeControl);
