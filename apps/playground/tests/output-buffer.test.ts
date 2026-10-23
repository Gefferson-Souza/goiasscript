import { describe, expect, it } from 'vitest';
import { RUN_LIMITS } from '../config/run-limits.constants.ts';
import { createOutputBuffer, visibleText } from '../lib/run/output-buffer.ts';

const LIMITS = { ...RUN_LIMITS, maxLogLines: 3, maxLogChars: 40, maxLineChars: 10 };

describe('buffer de saída', () => {
  it('repassa o texto dentro dos tetos', () => {
    const buffer = createOutputBuffer(LIMITS);
    expect(buffer.accept('oi')).toEqual({ text: 'oi', truncated: null });
  });

  it('avisa uma vez ao passar do teto de linhas e descarta o resto', () => {
    const buffer = createOutputBuffer(LIMITS);
    ['a', 'b', 'c'].forEach((line) => buffer.accept(line));
    expect(buffer.accept('d')).toEqual({ text: null, truncated: 'lines' });
    expect(buffer.accept('e')).toEqual({ text: null, truncated: null });
  });

  it('conta as linhas de uma mensagem com várias quebras', () => {
    const buffer = createOutputBuffer(LIMITS);
    expect(buffer.accept('a\nb\nc\nd')).toEqual({ text: null, truncated: 'lines' });
  });

  it('avisa uma vez ao passar do teto de caracteres', () => {
    const buffer = createOutputBuffer({ ...LIMITS, maxLogLines: 100 });
    ['123456789', '123456789', '123456789', '123456789'].forEach((line) => buffer.accept(line));
    expect(buffer.accept('123456789')).toEqual({ text: null, truncated: 'chars' });
    expect(buffer.accept('x')).toEqual({ text: null, truncated: null });
  });

  it('corta linha maior que o teto com reticências', () => {
    const buffer = createOutputBuffer(LIMITS);
    expect(buffer.accept('abcdefghijklmnop')).toEqual({ text: 'abcdefghij…', truncated: null });
  });

  it('normaliza \\r\\n e \\r para \\n', () => {
    const buffer = createOutputBuffer(LIMITS);
    expect(buffer.accept('a\r\nb\rc')).toEqual({ text: 'a\nb\nc', truncated: null });
  });

  it('não cobra a quebra final como linha extra', () => {
    const buffer = createOutputBuffer(LIMITS);
    ['a\n', 'b\n', 'c\n'].forEach((line) => buffer.accept(line));
    expect(buffer.accept('d').truncated).toBe('lines');
  });
});

describe('texto visível', () => {
  it('neutraliza sequência de escape, bidi e separador de linha', () => {
    expect(visibleText('\u001b[31mvermelho')).toBe('\\u{1b}[31mvermelho');
    expect(visibleText('a‮b')).toBe('a\\u{202e}b');
    expect(visibleText('a b')).toBe('a\\u{2028}b');
    expect(visibleText('a\u0000b\u007fc')).toBe('a\\u{0}b\\u{7f}c');
  });

  it('mantém quebra de linha, tabulação, acento e emoji', () => {
    expect(visibleText('olá\n\tmundo 👨‍👩‍👧')).toBe('olá\n\tmundo 👨‍👩‍👧');
  });
});
