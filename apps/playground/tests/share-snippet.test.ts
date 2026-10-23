import { compile } from '@goiasscript/compiler';
import { describe, expect, it } from 'vitest';
import { SHARE_SNIPPET, SHARE_SNIPPET_MAX_COLUMNS, SHARE_SNIPPET_MAX_LINES } from '../lib/share-snippet.constants.ts';

describe('SHARE_SNIPPET', () => {
  it('compila para o alvo playground sem diagnósticos', () => {
    const result = compile(SHARE_SNIPPET, { target: 'playground' });
    expect(result.ok).toBe(true);
    expect(result.diagnostics).toEqual([]);
  });

  it('cabe na imagem de compartilhamento', () => {
    const lines = SHARE_SNIPPET.trimEnd().split('\n');
    expect(lines.length).toBeLessThanOrEqual(SHARE_SNIPPET_MAX_LINES);
    for (const line of lines) expect(line.length).toBeLessThanOrEqual(SHARE_SNIPPET_MAX_COLUMNS);
  });

  it('os limites são os da especificação: 6 linhas e 40 colunas', () => {
    expect(SHARE_SNIPPET_MAX_LINES).toBe(6);
    expect(SHARE_SNIPPET_MAX_COLUMNS).toBe(40);
  });
});
