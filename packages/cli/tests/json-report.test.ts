import { describe, expect, it } from 'vitest';
import type { Diagnostic } from '@goiasscript/compiler';
import { renderJsonReport } from '../src/diagnostics/json-report.ts';
import { toolDiagnostic } from '../src/diagnostics/tool-diagnostic.ts';

const range: Diagnostic['range'] = { start: { offset: 0, line: 1, column: 1 }, end: { offset: 1, line: 1, column: 2 } };
const error: Diagnostic = { code: 'GS0301', severity: 'error', range, message: 'Esse trem não existe.' };
const warning: Diagnostic = { code: 'GS0101', severity: 'warning', range, message: 'Cuidado.' };

describe('renderJsonReport', () => {
  it('escreve uma linha só, terminada em um único \\n', () => {
    const text = renderJsonReport({ file: 'a.gs', diagnostics: [error] });
    expect(text.endsWith('\n')).toBe(true);
    expect(text.slice(0, -1)).not.toContain('\n');
    expect(JSON.parse(text)).toEqual({ version: 1, file: 'a.gs', ok: false, diagnostics: [error] });
  });
  it('ok é verdadeiro quando só há aviso ou nada', () => {
    expect((JSON.parse(renderJsonReport({ file: 'a.gs', diagnostics: [warning] })) as { ok: boolean }).ok).toBe(true);
    expect((JSON.parse(renderJsonReport({ file: 'a.gs', diagnostics: [] })) as { ok: boolean }).ok).toBe(true);
  });
  it('escapa o ESC e os separadores de linha do nome do arquivo', () => {
    const text = renderJsonReport({ file: 'a\u001b\u2028.gs', diagnostics: [] });
    expect(text).toContain('\\u001b');
    expect(text).toContain('\\u2028');
    expect(text.includes('\u001b') || text.includes('\u2028')).toBe(false);
  });
});

describe('toolDiagnostic', () => {
  it('monta a mensagem do catálogo no tom pedido, com o trecho opcional', () => {
    const root = toolDiagnostic('GS0903', 'raiz', { reason: 'a saída é a própria entrada', override: '--sobrescreve' });
    expect(root).toEqual({ code: 'GS0903', severity: 'error', message: 'Ô sô, essa saída não rola: a saída é a própria entrada. Usa "--sobrescreve" se quiser trocar.' });
    expect(toolDiagnostic('GS0903', 'neutro', { reason: 'x' }).message).toBe('Saída recusada: x.');
  });
  it('carrega o detalhe e a severidade de aviso', () => {
    const warn = toolDiagnostic('GS0904', 'neutro', { minimum: '22.12' }, 'Node 20');
    expect(warn).toMatchObject({ code: 'GS0904', severity: 'warning', detail: 'Node 20' });
  });
  it('código desconhecido cai no próprio código', () => {
    expect(toolDiagnostic('GS9999', 'raiz')).toEqual({ code: 'GS9999', severity: 'error', message: 'GS9999' });
  });
});
