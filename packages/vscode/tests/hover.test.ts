import { describe, expect, it } from 'vitest';
import { hoverFeature } from '../src/features/hover.feature.ts';
import { hoverFor } from '../src/language/hover-content.ts';
import type { LessonLookup } from '../src/language/lesson-link.types.ts';
import { wordAt } from '../src/language/word-at.ts';
import { UNTRUSTED_MARKDOWN_OPTIONS } from '../src/host/untrusted-markdown.constants.ts';
import { createFakeHost } from './support/fake-host.ts';

const BASE_URL = 'https://cartilha.example/licoes';
const LESSONS: LessonLookup = { lessonIdOf: (term) => (term === 'uai' ? 'licao-01' : undefined) };

describe('hover', () => {
  it('mostra o equivalente em JS e a categoria da palavra goiana', () => {
    const hover = hoverFor('uai', null);
    expect(hover?.markdown).toContain('`const`');
    expect(hover?.markdown).toContain('declaração');
  });

  it('entende a variante sem acento e a normalização decomposta', () => {
    expect(hoverFor('se_oce_quiser', null)?.markdown).toContain('`if`');
    expect(hoverFor('se_ocê_quiser'.replace('ocê', 'ocê'.normalize('NFD')), null)?.markdown).toContain('`if`');
  });

  it('cobre palavras da biblioteca', () => {
    expect(hoverFor('prosa', null)?.markdown).toContain('`console.log`');
    expect(hoverFor('mapear', null)?.markdown).toContain('`map`');
  });

  it('palavra do usuário não tem hover', () => {
    expect(hoverFor('ação', null)).toBeNull();
    expect(hoverFor('minha_variavel', null)).toBeNull();
  });

  it('o conteúdo nunca é confiável e não carrega HTML do programa', () => {
    expect(hoverFor('uai', null)?.trusted).toBe(false);
    expect(hoverFor('<script>alert(1)</script>', null)).toBeNull();
    expect(hoverFor('uai<img src=x>', null)).toBeNull();
    expect(hoverFor('uai', null)?.markdown).not.toMatch(/[<>]/u);
  });

  it('só põe link quando há base e lição da palavra', () => {
    expect(hoverFor('uai', null, LESSONS)?.markdown).not.toContain('http');
    expect(hoverFor('uai', BASE_URL, LESSONS)?.markdown).toContain(`(${BASE_URL}/licao-01)`);
    expect(hoverFor('faz_trem', BASE_URL, LESSONS)?.markdown).not.toContain('http');
  });
});

describe('hover com o mapa de termos da cartilha', () => {
  it('prosa e uai levam à lição que as explica', () => {
    expect(hoverFor('prosa', BASE_URL)?.markdown).toContain(`(${BASE_URL}/licao-01)`);
    expect(hoverFor('uai', BASE_URL)?.markdown).toContain(`(${BASE_URL}/licao-02)`);
  });

  it('palavra sem lição continua sem link', () => {
    expect(hoverFor('certeza', BASE_URL)?.markdown).not.toContain('http');
  });
});

describe('defesa do link da lição', () => {
  const HOSTILE_BASE_URL = 'https://cartilha.example/a(b)c]d e<f>/x)(https://evil.example';
  const LINK_LINE = /^\[[^\]]+\]\(([^()\s<>\][]*)\)$/u;

  it('base com parêntese, colchete, espaço e menor-que mantém um único link bem formado', () => {
    const markdown = hoverFor('uai', HOSTILE_BASE_URL, LESSONS)?.markdown ?? '';
    const linkLines = markdown.split('\n\n').filter((line) => line.startsWith('['));
    expect(linkLines).toHaveLength(1);
    const target = LINK_LINE.exec(linkLines[0] ?? '')?.[1];
    expect(target).toBeDefined();
    expect(target).toContain('%28');
    expect(target).toContain('%29');
    expect(target).toContain('%20');
    expect(markdown).not.toMatch(/[<>]/u);
  });

  it('o markdown montado pelo host nunca é confiável e não aceita HTML', () => {
    expect(UNTRUSTED_MARKDOWN_OPTIONS).toEqual({ isTrusted: false, supportHtml: false });
  });
});

describe('wordAt', () => {
  it('acha a palavra sob o cursor e devolve o intervalo em UTF-16', () => {
    expect(wordAt('uai x é 1', 1)).toEqual({ word: 'uai', start: 0, end: 3 });
    expect(wordAt('uai x é 1', 3)).toEqual({ word: 'uai', start: 0, end: 3 });
  });

  it('respeita acento, sublinhado e dígito que não é inicial', () => {
    expect(wordAt('  se_ocê_quiser (a)', 6)).toEqual({ word: 'se_ocê_quiser', start: 2, end: 15 });
    expect(wordAt('lista2 é 1', 2)?.word).toBe('lista2');
    expect(wordAt('ação é 1', 1)?.word).toBe('ação');
  });

  it('junta letra com marca combinante e devolve a palavra em NFC', () => {
    const decomposed = 'ocê';
    expect(wordAt(decomposed, 0)).toEqual({ word: 'ocê', start: 0, end: 4 });
  });

  it('recusa o que não é palavra: dígito inicial, símbolo, espaço, fora da linha', () => {
    expect(wordAt('1abc', 1)).toBeNull();
    expect(wordAt('a $ b', 2)).toBeNull();
    expect(wordAt('a  b', 2)).toBeNull();
    expect(wordAt('', 0)).toBeNull();
    expect(wordAt('abc', 9)).toBeNull();
    expect(wordAt('abc', -1)).toBeNull();
  });

  it('trata texto livre com marcação como pedaços separados', () => {
    expect(wordAt('<script>', 3)).toEqual({ word: 'script', start: 1, end: 7 });
  });
});

describe('feature de hover', () => {
  it('registra o provedor e devolve o intervalo da palavra', () => {
    const host = createFakeHost();
    const disposable = hoverFeature.activate(host);
    const content = host.hoverProviders[0]?.provide({ line: 'uai x é 1', character: 1 });
    expect(content).toMatchObject({ startCharacter: 0, endCharacter: 3 });
    expect(content?.markdown).toContain('`const`');
    expect(host.hoverProviders[0]?.provide({ line: 'uai x é 1', character: 4 })).toBeNull();
    disposable.dispose();
    expect(host.hoverProviders).toHaveLength(0);
  });
});
