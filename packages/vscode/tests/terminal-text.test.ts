import { describe, expect, it } from 'vitest';
import { sanitizeTerminalText } from '../src/host/terminal-text.ts';

const ESC = String.fromCharCode(0x1b);
const BEL = String.fromCharCode(0x07);

describe('sanitizeTerminalText', () => {
  it('mantém texto comum, acentos, quebra de linha e tabulação', () => {
    expect(sanitizeTerminalText('uai trem = 1;\n\tprosa("oi, sô")')).toBe('uai trem = 1;\n\tprosa("oi, sô")');
  });

  it('remove o ESC de sequências de cor e de movimento de cursor', () => {
    expect(sanitizeTerminalText(`${ESC}[31mvermelho${ESC}[0m${ESC}[2J`)).toBe('[31mvermelho[0m[2J');
  });

  it('desarma OSC de título, com BEL ou ST no fim', () => {
    const sanitized = sanitizeTerminalText(`${ESC}]0;título falso${BEL}x${ESC}]8;;http://a${ESC}\\y`);
    expect(sanitized).not.toContain(ESC);
    expect(sanitized).not.toContain(BEL);
  });

  it('remove controles C0, DEL e C1, inclusive o retorno de carro isolado', () => {
    const controls = [0x00, 0x08, 0x0d, 0x7f, 0x80, 0x9b, 0x9d].map((code) => String.fromCharCode(code)).join('');
    expect(sanitizeTerminalText(`a${controls}b`)).toBe('ab');
  });

  it('não mexe em caracteres fora do intervalo de controle', () => {
    expect(sanitizeTerminalText(' ação 🚀')).toBe(' ação 🚀');
  });
});
