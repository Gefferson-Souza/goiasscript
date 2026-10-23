import { describe, expect, it } from 'vitest';
import { validateFrontmatter } from '../../lib/cartilha/lesson-schema.ts';

const base = {
  id: 'licao-01',
  order: 1,
  title: 'Primeiro programa',
  summary: 'Resumo.',
  terms: ['prosa'],
  exercise: { prompt: 'Imprime.', starter: 'prosa("")', solution: 'prosa("a")', expectedStdout: 'a' },
};

const keysOf = (data: unknown): readonly string[] => {
  const result = validateFrontmatter(data);
  return result.ok ? [] : result.issues.map((issue) => issue.key);
};

describe('validateFrontmatter', () => {
  it('aceita o cabeçalho completo', () => {
    expect(validateFrontmatter(base).ok).toBe(true);
  });

  it('recusa id fora do padrão licao-NN', () => {
    for (const id of ['lição-1', 'licao-1', 'licao-001', 'Licao-01', 7]) expect(keysOf({ ...base, id })).toContain('id');
  });

  it('recusa exercício sem saída esperada', () => {
    const withoutOutput = { prompt: 'a', starter: 'b', solution: 'c' };
    expect(keysOf({ ...base, exercise: withoutOutput })).toContain('expectedStdout');
    expect(keysOf({ ...base, exercise: { ...base.exercise, expectedStdout: '  ' } })).toContain('expectedStdout');
    expect(keysOf({ ...base, exercise: undefined })).toContain('exercise');
  });

  it('recusa stdinFile com ../, caminho absoluto ou fora da pasta stdin', () => {
    for (const stdinFile of ['stdin/../segredo.txt', '../x.txt', '/etc/passwd', 'outra/licao-11.txt', 'stdin\\x.txt']) {
      expect(keysOf({ ...base, exercise: { ...base.exercise, stdinFile } })).toContain('stdinFile');
    }
    expect(validateFrontmatter({ ...base, exercise: { ...base.exercise, stdinFile: 'stdin/licao-11.txt' } }).ok).toBe(true);
  });

  it('recusa ordem que não é inteiro positivo, termos tortos e chave extra', () => {
    expect(keysOf({ ...base, order: 0 })).toContain('order');
    expect(keysOf({ ...base, order: 1.5 })).toContain('order');
    expect(keysOf({ ...base, terms: 'prosa' })).toContain('terms');
    expect(keysOf({ ...base, terms: [''] })).toContain('terms');
    expect(keysOf({ ...base, extra: 1 })).toContain('extra');
    expect(keysOf(null)).toHaveLength(1);
  });
});
