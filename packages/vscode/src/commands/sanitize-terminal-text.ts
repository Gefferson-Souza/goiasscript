const UNSAFE = /[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/gu;
const KEPT = new Set(['\n', '\t']);

// Texto do aluno e do CLI chega ao terminal e ao canal de saída: sem ESC a sequência vira texto visível e não mexe no terminal.
export function sanitizeTerminalText(text: string): string {
  return text.replace(UNSAFE, (character) => (KEPT.has(character) ? character : ''));
}
