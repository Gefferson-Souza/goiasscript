import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { PACKAGE_ROOT } from './support/manifest.ts';

interface LanguageConfiguration {
  readonly comments: { readonly lineComment: string; readonly blockComment: readonly [string, string] };
  readonly brackets: readonly (readonly [string, string])[];
  readonly wordPattern: string;
  readonly onEnterRules?: unknown;
}

const configuration = JSON.parse(fs.readFileSync(path.join(PACKAGE_ROOT, 'language-configuration.json'), 'utf8')) as LanguageConfiguration;

function wordsIn(text: string): readonly string[] {
  return text.match(new RegExp(configuration.wordPattern, 'gu')) ?? [];
}

describe('language-configuration.json', () => {
  it('tem comentários de linha e de bloco', () => {
    expect(configuration.comments.lineComment).toBe('//');
    expect(configuration.comments.blockComment).toEqual(['/*', '*/']);
  });

  it('tem os três pares de colchetes', () => {
    expect(configuration.brackets).toEqual([['{', '}'], ['[', ']'], ['(', ')']]);
  });

  it.each(['ação', 'se_ocê_quiser', 'lista2', 'faz_trem'])('%s é uma palavra só', (name) => {
    expect(wordsIn(name)).toEqual([name]);
  });

  it('não junta o cifrão a um nome', () => {
    expect(wordsIn('$')).toEqual([]);
    expect(wordsIn('$nome')).toEqual(['nome']);
  });

  it('não aceita nome começando por dígito como palavra inteira', () => {
    expect(wordsIn('1abc')).not.toContain('1abc');
  });

  it('mantém número decimal como uma palavra', () => {
    expect(wordsIn('3.14')).toEqual(['3.14']);
  });

  it('não define onEnterRules', () => {
    expect(configuration).not.toHaveProperty('onEnterRules');
  });
});
