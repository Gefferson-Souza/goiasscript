import { describe, expect, it } from 'vitest';
import { JS_RESERVED, KEYWORDS, STDLIB } from '../src/index.ts';

const languageWords = new Set([
  ...KEYWORDS.flatMap((entry) => [entry.spelling, entry.asciiSpelling ?? entry.spelling]),
  ...STDLIB.flatMap((entry) => [entry.name, entry.asciiName ?? entry.name]),
]);

describe('sugestões de palavras do JavaScript', () => {
  it('toda palavra goiana sugerida para keyword ou global existe de verdade na linguagem', () => {
    const suggested = JS_RESERVED
      .filter((entry) => entry.suggestion !== undefined && (entry.kind === 'global' || entry.hasEquivalent))
      .filter((entry) => !languageWords.has(entry.suggestion ?? ''))
      .map((entry) => `${entry.name} -> ${entry.suggestion ?? ''}`);
    expect(suggested).toEqual([]);
  });
  it.each(['require', 'process', 'module', 'window', 'document', 'fetch', 'Array', 'Map', 'Set'])('%s não promete palavra goiana que não existe', (name) => {
    expect(JS_RESERVED.find((entry) => entry.name === name)?.suggestion).toBeUndefined();
  });
  it('mantém as globais com equivalente real', () => {
    expect(JS_RESERVED.find((entry) => entry.name === 'console')?.suggestion).toBe('prosa');
    expect(JS_RESERVED.find((entry) => entry.name === 'JSON')?.suggestion).toBe('Coisa');
    expect(JS_RESERVED.find((entry) => entry.name === 'Math')?.suggestion).toBe('Conta');
  });
});
