import { describe, expect, it } from 'vitest';
import { COMPLETION_ITEM_KIND, SNIPPET_INSERT_RULE } from '../lib/monaco/completion-provider.constants.ts';
import { completionContextAt, provideCompletions } from '../lib/monaco/completion-provider.ts';

const labelsOf = (prefix: string, afterDot = false): readonly string[] => provideCompletions({ prefix, afterDot }).map((item) => item.label);

describe('provideCompletions', () => {
  it('devolve a palavra goiana com o equivalente em JS e o tipo mapeado', () => {
    const item = provideCompletions({ prefix: 'uai', afterDot: false }).find((entry) => entry.label === 'uai');
    expect(item).toMatchObject({ detail: 'const', kind: COMPLETION_ITEM_KIND.keyword });
  });

  it('a variante sem acento aparece ao lado da acentuada', () => {
    const labels = labelsOf('continua_a');
    const accented = labels.indexOf('continua_aí');
    const plain = labels.indexOf('continua_ai');
    expect(accented).toBeGreaterThanOrEqual(0);
    expect(plain).toBeGreaterThanOrEqual(0);
    expect(Math.abs(accented - plain)).toBe(1);
  });

  it('item de membro só aparece depois de ponto', () => {
    const memberLabel = provideCompletions({ prefix: '', afterDot: true }).find((item) => item.detail.includes('push') || item.detail.includes('map'));
    expect(memberLabel).toBeDefined();
    const name = memberLabel?.label ?? '';
    expect(labelsOf(name, false)).not.toContain(name);
    expect(labelsOf(name, true)).toContain(name);
  });

  it('depois de ponto não oferece palavra-chave nem trecho', () => {
    const items = provideCompletions({ prefix: '', afterDot: true });
    expect(items.some((item) => item.kind === COMPLETION_ITEM_KIND.keyword)).toBe(false);
    expect(items.some((item) => item.kind === COMPLETION_ITEM_KIND.snippet)).toBe(false);
  });

  it('a ordem é determinística', () => {
    const first = provideCompletions({ prefix: '', afterDot: false });
    const second = provideCompletions({ prefix: '', afterDot: false });
    expect(second).toEqual(first);
    const sortTexts = first.map((item) => item.sortText);
    expect(sortTexts).toEqual([...sortTexts].toSorted());
  });

  it('trecho vem com regra de snippet e corpo multilinha', () => {
    const snippet = provideCompletions({ prefix: 'vai_indo', afterDot: false }).find((item) => item.kind === COMPLETION_ITEM_KIND.snippet);
    expect(snippet).toMatchObject({ label: 'vai_indo', insertTextRules: SNIPPET_INSERT_RULE });
    expect(snippet?.insertText).toContain('\n');
    expect(snippet?.insertText).toContain('${1:');
  });

  it('põe o link da lição na documentação só quando a lição existe', () => {
    const lessonUrlOf = (id: string): string | undefined => (id === 'licao-02' ? '/cartilha/licao-02' : undefined);
    const lessonIdOf = (term: string): string | undefined => (term === 'uai' ? 'licao-02' : term === 'trem' ? 'licao-03' : undefined);
    const items = provideCompletions({ prefix: '', afterDot: false }, { lessonIdOf, lessonUrlOf });
    expect(items.find((item) => item.label === 'uai' && item.kind === COMPLETION_ITEM_KIND.keyword)?.documentation?.value).toContain('/cartilha/licao-02');
    expect(items.find((item) => item.label === 'trem')?.documentation).toBeUndefined();
  });

  it('filtra pelo prefixo ignorando acento e caixa', () => {
    expect(labelsOf('SE_OCE')).toContain('se_oce_quiser');
    expect(labelsOf('zzzz-nada')).toEqual([]);
  });
});

describe('completionContextAt', () => {
  it('lê o prefixo e detecta o ponto antes dele', () => {
    expect(completionContextAt('uai x é lista.pu')).toEqual({ prefix: 'pu', afterDot: true });
    expect(completionContextAt('  se_oc')).toEqual({ prefix: 'se_oc', afterDot: false });
    expect(completionContextAt('lista.')).toEqual({ prefix: '', afterDot: true });
    expect(completionContextAt('')).toEqual({ prefix: '', afterDot: false });
  });

  it('aceita letra acentuada em NFD no prefixo', () => {
    expect(completionContextAt('ação').prefix).toBe('ação');
  });
});
