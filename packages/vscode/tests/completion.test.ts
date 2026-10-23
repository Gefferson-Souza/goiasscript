import { describe, expect, it } from 'vitest';
import { completionItemsFor } from '../src/language/completion-items.ts';
import { MEMBER_TRIGGER_CHARACTER } from '../src/language/completion-items.constants.ts';
import type { LessonLookup } from '../src/language/lesson-link.types.ts';
import { completionFeature } from '../src/features/completion.feature.ts';
import { createFakeHost } from './support/fake-host.ts';

const BASE_URL = 'https://cartilha.example/licoes';
const LESSONS: LessonLookup = { lessonIdOf: (term) => (term === 'uai' ? 'licao-01' : undefined) };

const labelsOf = (linePrefix: string, lessonBaseUrl: string | null = null): readonly string[] =>
  completionItemsFor({ linePrefix, lessonBaseUrl }).map((item) => item.label);

describe('autocomplete: palavras da linguagem', () => {
  it('oferece a palavra goiana com o equivalente em JS e a variante sem acento', () => {
    const items = completionItemsFor({ linePrefix: 'se_', lessonBaseUrl: null });
    expect(items).toContainEqual(expect.objectContaining({ label: 'se_ocê_quiser', detail: 'if', kind: 'keyword' }));
    expect(items).toContainEqual(expect.objectContaining({ label: 'se_oce_quiser', detail: 'if', kind: 'keyword' }));
  });

  it('casa o prefixo sem diferenciar acento nem caixa', () => {
    expect(labelsOf('SE_OC')).toEqual(expect.arrayContaining(['se_ocê_quiser', 'se_oce_quiser']));
  });

  it('devolve a mesma ordem estável em chamadas repetidas', () => {
    const first = labelsOf('');
    expect(labelsOf('')).toEqual(first);
    expect(first.length).toBeGreaterThan(50);
  });

  it('não oferece itens de membro fora de um ponto', () => {
    expect(labelsOf('bota_no_f')).toEqual([]);
    expect(labelsOf('lista.bota_no_f')).toEqual(['bota_no_final']);
  });

  it('inclui trechos do snippets.json com kind snippet e o corpo como insertText', () => {
    const snippet = completionItemsFor({ linePrefix: 'vai_', lessonBaseUrl: null }).find((item) => item.kind === 'snippet');
    expect(snippet).toMatchObject({ label: 'vai_indo', kind: 'snippet' });
    expect(snippet?.insertText).toContain('vai_indo (trem ${1:i}');
  });
});

describe('autocomplete: depois do ponto', () => {
  it('oferece só itens de membro depois de lista.', () => {
    const items = completionItemsFor({ linePrefix: 'lista.', lessonBaseUrl: null });
    expect(items.length).toBeGreaterThan(0);
    expect(items.some((item) => item.kind === 'snippet' || item.kind === 'keyword')).toBe(false);
    expect(labelsOf('lista.')).not.toContain('uai');
  });

  it('filtra o membro pelo que já foi digitado depois do ponto', () => {
    const all = labelsOf('lista.');
    const some = labelsOf(`lista.${all[0]?.slice(0, 2) ?? ''}`);
    expect(some.length).toBeGreaterThan(0);
    expect(some.length).toBeLessThanOrEqual(all.length);
  });

  it.each(['1.', 'x = 12.', 'total = 3.5.', '..', 'a..', '.'])('não oferece nada depois de %s', (linePrefix) => {
    expect(labelsOf(linePrefix)).toEqual([]);
  });

  it.each(['[...', 'f(...', 'a...'])('trata o espalhamento %s como expressão comum, sem itens de membro', (linePrefix) => {
    const items = completionItemsFor({ linePrefix, lessonBaseUrl: null });
    expect(items.length).toBeGreaterThan(0);
    expect(labelsOf(`${linePrefix}uai`)).toContain('uai');
    expect(labelsOf(`${linePrefix}bota_no_f`)).toEqual([]);
  });

  it('trata identificador terminado em dígito como receptor válido', () => {
    expect(labelsOf('lista2.').length).toBeGreaterThan(0);
  });
});

describe('autocomplete: link da lição', () => {
  it('sem base de lição nenhum item tem link', () => {
    const items = completionItemsFor({ linePrefix: '', lessonBaseUrl: null }, LESSONS);
    expect(items.every((item) => item.lessonUrl === undefined)).toBe(true);
  });

  it('com base, só a palavra que tem lição ganha o link', () => {
    const items = completionItemsFor({ linePrefix: 'ua', lessonBaseUrl: `${BASE_URL}/` }, LESSONS);
    expect(items.find((item) => item.label === 'uai')?.lessonUrl).toBe(`${BASE_URL}/licao-01`);
    expect(items.filter((item) => item.lessonUrl !== undefined)).toHaveLength(1);
  });
});

describe('gatilho do autocomplete', () => {
  it('abre a lista ao digitar o ponto', () => {
    expect(MEMBER_TRIGGER_CHARACTER).toBe('.');
  });
});

describe('feature de autocomplete', () => {
  it('registra o provedor e responde com a base de lição das configurações', () => {
    const host = createFakeHost({ settings: { lessonBaseUrl: BASE_URL } });
    const disposable = completionFeature.activate(host);
    expect(host.completionProviders).toHaveLength(1);
    const items = host.completionProviders[0]?.provide({ linePrefix: 'uai' }) ?? [];
    expect(items.map((item) => item.label)).toContain('uai');
    disposable.dispose();
    expect(host.completionProviders).toHaveLength(0);
  });
});
