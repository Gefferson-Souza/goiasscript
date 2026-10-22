import { describe, expect, it } from 'vitest';
import type { Diagnostic } from '@goiasscript/compiler';
import { renderDiagnostic, sanitizeForTerminal } from '../src/diagnostics/render-diagnostic.ts';

const at = (line: number, column: number, length: number, offset = 0): Diagnostic['range'] => ({
  start: { offset, line, column },
  end: { offset: offset + length, line, column: column + length },
});
const diagnostic = (range: Diagnostic['range']): Diagnostic => ({ code: 'GS0301', severity: 'error', range, message: 'Esse trem "nomi" não existe por aqui.' });

describe('renderDiagnostic', () => {
  it('mostra cabeçalho, linha e sublinhado', () => {
    const text = renderDiagnostic({ diagnostic: diagnostic(at(1, 9, 4, 8)), fileName: 'programa.gs', source: 'uai x é nomi\n' });
    expect(text.split('\n')).toEqual([
      'programa.gs:1:9: erro GS0301: Esse trem "nomi" não existe por aqui.',
      '1 | uai x é nomi',
      `  | ${' '.repeat(8)}^^^^`,
    ]);
  });
  it('alinha o sublinhado quando o nome está em NFD', () => {
    const source = 'uai café é nomi';
    const column = source.indexOf('nomi') + 1;
    const lines = renderDiagnostic({ diagnostic: diagnostic(at(1, column, 4, column - 1)), fileName: 'a.gs', source }).split('\n');
    expect(lines[2]).toBe(`  | ${' '.repeat(11)}^^^^`);
  });
  it('lê a linha certa com BOM e CRLF, sem \\r na tela', () => {
    const source = '\uFEFFuai x é 1\r\nuai y é nomi\r\n';
    const offset = source.indexOf('nomi');
    const lines = renderDiagnostic({ diagnostic: diagnostic(at(2, 9, 4, offset)), fileName: 'a.gs', source }).split('\n');
    expect(lines[1]).toBe('2 | uai y é nomi');
    expect(lines.join('')).not.toMatch(/[\r\uFEFF]/u);
  });
  it('alinha na primeira linha com BOM, que não conta como coluna', () => {
    const source = '\uFEFFuai x é nomi';
    const lines = renderDiagnostic({ diagnostic: diagnostic(at(1, 9, 4, 9)), fileName: 'a.gs', source }).split('\n');
    expect(lines.slice(1)).toEqual(['1 | uai x é nomi', `  | ${' '.repeat(8)}^^^^`]);
  });
  it('diagnóstico de ferramenta não tem linha de código', () => {
    const text = renderDiagnostic({ diagnostic: { code: 'GS0905', severity: 'error', message: 'Ô sô, esse comando não existe.', detail: '"traduza" não é comando.' }, fileName: 'x.gs', source: null });
    expect(text.split('\n')).toEqual(['erro GS0905: Ô sô, esse comando não existe.', '  "traduza" não é comando.']);
  });
  it('mostra ajuda e lição, e usa "aviso" para warning', () => {
    const warning: Diagnostic = { ...diagnostic(at(1, 1, 1)), severity: 'warning', help: 'Troca por "nome".', lesson: 'escopo' };
    const lines = renderDiagnostic({ diagnostic: warning, fileName: 'a.gs', source: 'x' }).split('\n');
    expect(lines[0]).toContain(': aviso GS0301:');
    expect(lines.slice(3)).toEqual(['  ajuda: Troca por "nome".', '  lição: escopo']);
  });
  it('largura da goteira acompanha o número da linha', () => {
    const source = `${'\n'.repeat(11)}uai x é nomi`;
    const lines = renderDiagnostic({ diagnostic: diagnostic(at(12, 9, 4, 20)), fileName: 'a.gs', source }).split('\n');
    expect(lines.slice(1)).toEqual(['12 | uai x é nomi', `   | ${' '.repeat(8)}^^^^`]);
  });
  it('intervalo multilinha sublinha só até o fim da primeira linha', () => {
    const range: Diagnostic['range'] = { start: { offset: 4, line: 1, column: 5 }, end: { offset: 12, line: 2, column: 3 } };
    const lines = renderDiagnostic({ diagnostic: diagnostic(range), fileName: 'a.gs', source: 'uai abc\nxyz' }).split('\n');
    expect(lines[2]).toBe(`  | ${' '.repeat(4)}^^^`);
  });
  it('largura zero vira um acento circunflexo e tab vira um espaço', () => {
    const lines = renderDiagnostic({ diagnostic: diagnostic(at(1, 3, 0, 2)), fileName: 'a.gs', source: '\tx\ty' }).split('\n');
    expect(lines.slice(1)).toEqual(['1 |  x y', `  | ${' '.repeat(2)}^`]);
  });
  it('posição fora do texto mostra só o cabeçalho', () => {
    expect(renderDiagnostic({ diagnostic: diagnostic(at(9, 1, 1)), fileName: 'a.gs', source: 'x' }).split('\n')).toHaveLength(1);
    expect(renderDiagnostic({ diagnostic: diagnostic(at(1, 1, 1)), fileName: 'a.gs', source: null }).split('\n')).toHaveLength(1);
  });
  it('recorta linha gigante em janela e não demora', () => {
    const source = `${'a'.repeat(5000)}nomi${'b'.repeat(5000)}`;
    const started = performance.now();
    const text = renderDiagnostic({ diagnostic: diagnostic(at(1, 5001, 4, 5000)), fileName: 'a.gs', source });
    expect(performance.now() - started).toBeLessThan(200);
    expect(Math.max(...text.split('\n').map((row) => row.length))).toBeLessThanOrEqual(140);
    expect(text).toContain('^^^^');
  });
  it('em linha gigante o sublinhado fica embaixo do trecho', () => {
    const source = `${'a'.repeat(5000)}nomi${'b'.repeat(5000)}`;
    const [, code = '', marks = ''] = renderDiagnostic({ diagnostic: diagnostic(at(1, 5001, 4, 5000)), fileName: 'a.gs', source }).split('\n');
    const caret = marks.indexOf('^');
    expect(code.slice(caret, caret + 4)).toBe('nomi');
  });
  it('janela no começo e no fim da linha, sem partir par substituto', () => {
    const head = renderDiagnostic({ diagnostic: diagnostic(at(1, 1, 4, 0)), fileName: 'a.gs', source: `nomi${'b'.repeat(400)}` }).split('\n');
    expect(head[1]?.endsWith('…')).toBe(true);
    expect(head[1]?.startsWith('1 | nomi')).toBe(true);
    const tail = `${'😀'.repeat(200)}nomi`;
    const text = renderDiagnostic({ diagnostic: diagnostic(at(1, 401, 4, 400)), fileName: 'a.gs', source: tail });
    expect(text).not.toMatch(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u);
  });
  it('linha cheia de controles respeita a janela depois de escapar', () => {
    const source = `${'\u001b'.repeat(5000)}nomi`;
    const text = renderDiagnostic({ diagnostic: diagnostic(at(1, 5001, 4, 5000)), fileName: 'a.gs', source });
    const [, code = '', marks = ''] = text.split('\n');
    expect(Math.max(...text.split('\n').map((row) => row.length))).toBeLessThanOrEqual(140);
    expect(code.length).toBeLessThanOrEqual('1 | '.length + 120 + 2);
    expect(code.slice(marks.indexOf('^'), marks.indexOf('^') + 4)).toBe('nomi');
  });
  it('trecho gigante é recortado e sublinhado dentro da janela', () => {
    const text = renderDiagnostic({ diagnostic: diagnostic(at(1, 1, 3000, 0)), fileName: 'a.gs', source: 'a'.repeat(3000) });
    expect(Math.max(...text.split('\n').map((row) => row.length))).toBeLessThanOrEqual(140);
  });
});

describe('sanitizeForTerminal', () => {
  it('troca controles e invisíveis por escape visível', () => {
    expect(sanitizeForTerminal('a\u001b[31mb')).toBe('a\\u001b[31mb');
    expect(sanitizeForTerminal('a\u2028b\u202eb\u009bc')).toBe('a\\u2028b\\u202eb\\u009bc');
    expect(sanitizeForTerminal('nome.gs\n')).toBe('nome.gs\\u000a');
  });
  it('mantém acento, emoji e tab', () => {
    expect(sanitizeForTerminal('café 😀\t')).toBe('café 😀\t');
  });
  it('o nome de arquivo hostil sai sanitizado no cabeçalho', () => {
    const text = renderDiagnostic({ diagnostic: diagnostic(at(1, 1, 1)), fileName: 'a\u001b]0;pwn\u0007.gs', source: 'x' });
    expect(text).not.toContain('\u001b');
  });
  it('mensagem, ajuda e detalhe também saem sanitizados', () => {
    const hostile: Diagnostic = { ...diagnostic(at(1, 1, 1)), message: 'm\u001b[2J', help: 'h\u001b[2J', lesson: 'l\u001b[2J' };
    expect(renderDiagnostic({ diagnostic: hostile, fileName: 'a.gs', source: 'x\u001b[2J' })).not.toContain('\u001b');
    const tool = { code: 'GS0905', severity: 'error', message: 'm', detail: 'd\u0007' } as const;
    expect(renderDiagnostic({ diagnostic: tool, fileName: 'a.gs', source: null })).not.toContain('\u0007');
  });
});
