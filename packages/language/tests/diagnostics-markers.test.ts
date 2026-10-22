import { describe, expect, it } from 'vitest';
import { lookupDiagnostic } from '../src/index.ts';

const OPTIONAL_SEGMENT = /\[\[(.*?)\]\]/gu;
const MARKER = /\{(\w+)\}/gu;

const format = (template: string, args: Readonly<Record<string, string>>): string => {
  const visible = template.replace(OPTIONAL_SEGMENT, (_match, inner: string) =>
    [...inner.matchAll(MARKER)].every((marker) => args[marker[1] ?? ''] !== undefined) ? inner : '');
  return visible.replace(MARKER, (_match, key: string) => args[key] ?? `«${key}»`);
};

const runtimeCodes = ['GS0701', 'GS0702', 'GS0703'];
const toneOf = (code: string, tone: 'raiz' | 'neutro'): string => lookupDiagnostic(code)?.messages[tone] ?? '';

describe('marcadores das frases de execução e do CLI', () => {
  it.each(runtimeCodes)('%s formatado não deixa marcador nem undefined', (code) => {
    for (const tone of ['raiz', 'neutro'] as const) {
      expect(format(toneOf(code, tone), { file: 'a.gs', line: '3' })).not.toMatch(/«|\{|undefined/u);
    }
  });
  it('GS0903 mostra o motivo e só cita o override quando ele vem', () => {
    for (const tone of ['raiz', 'neutro'] as const) {
      const full = format(toneOf('GS0903', tone), { reason: 'já existe', override: '--sobrescreve' });
      expect(full).toContain('já existe');
      expect(full).toContain('--sobrescreve');
      const bare = format(toneOf('GS0903', tone), { reason: 'já existe' });
      expect(bare).toContain('já existe');
      expect(bare).not.toMatch(/sobrescreve|\[\[|«|\{/u);
    }
  });
  it('GS0904 cita o mínimo', () => {
    expect(format(toneOf('GS0904', 'raiz'), { minimum: '22.12' })).toContain('22.12');
    expect(format(toneOf('GS0904', 'neutro'), { minimum: '22.12' })).toContain('22.12');
  });
});
