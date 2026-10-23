const UNSAFE = /[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/gu;
const KEPT = new Set(['\n', '\t']);

// Texto do aluno e do CLI chega ao terminal e ao canal de saída: sem ESC a sequência vira texto visível e não mexe no terminal.
export function sanitizeTerminalText(text: string): string {
  return text.replace(UNSAFE, (character) => (KEPT.has(character) ? character : ''));
}

const ESC = '\u001b';
const ESCAPE_SEQUENCE = new RegExp(`${ESC}(?:\\[[0-?]*[ -/]*[@-~]|O[@-~]|\\][^${ESC}\\u0007]*(?:\\u0007|${ESC}\\\\)?)`, 'gu');

// Setas, Home, Delete e colar trazem sequências inteiras; tirar só o ESC deixaria "[A" ou "[3~" no eco e no stdin.
export function stripEscapeSequences(text: string): string {
  return text.replace(ESCAPE_SEQUENCE, '');
}
