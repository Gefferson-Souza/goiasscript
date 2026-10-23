const NEWLINE = 0x0a;
const TAB = 0x09;
const C0_END = 0x1f;
const DELETE = 0x7f;
const C1_START = 0x80;
const C1_END = 0x9f;

function isDisallowedControl(code: number): boolean {
  if (code === NEWLINE || code === TAB) return false;
  return code <= C0_END || code === DELETE || (code >= C1_START && code <= C1_END);
}

// Diagnósticos e erros do CLI citam o código do aluno: sem ESC, a sequência vira texto visível e deixa de mexer no terminal.
export function sanitizeTerminalText(text: string): string {
  let sanitized = '';
  for (const character of text) {
    const code = character.codePointAt(0) ?? 0;
    if (!isDisallowedControl(code)) sanitized += character;
  }
  return sanitized;
}
