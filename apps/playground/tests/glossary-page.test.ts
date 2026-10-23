import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import glossary from '@goiasscript/language/generated/glossary.json' with { type: 'json' };
import { GlossaryList } from '../components/glossary/GlossaryList.tsx';
import { buildGlossaryEntries, termAnchor } from '../lib/glossary.ts';

const lessonOf = (term: string): string | undefined => (term === 'uai' ? 'licao-02' : undefined);
const entries = buildGlossaryEntries(glossary, lessonOf);
const html = renderToStaticMarkup(createElement(GlossaryList, { entries }));

describe('glossário', () => {
  it('lista todos os termos do glossário com âncora', () => {
    const terms = new Set([...glossary.keywords, ...glossary.library].map((entry) => entry.term));
    expect(entries).toHaveLength(terms.size);
    expect(entries.map((entry) => entry.term).sort()).toEqual([...terms].sort());
    for (const entry of entries) {
      expect(html).toContain(`id="${entry.anchor}"`);
      expect(entry.anchor).toBe(termAnchor(entry.term));
    }
    expect(new Set(entries.map((entry) => entry.anchor)).size).toBe(entries.length);
  });

  it('termo com lição ganha link', () => {
    expect(html).toContain('href="/cartilha/licao-02"');
    const withoutLesson = entries.filter((entry) => entry.lessonUrl === undefined);
    expect(withoutLesson.length).toBe(entries.length - 1);
  });

  it('separa palavras da linguagem e biblioteca', () => {
    expect(html).toContain('Palavras da linguagem');
    expect(html).toContain('Biblioteca');
    expect(entries.some((entry) => entry.group === 'library')).toBe(true);
  });

  it('termo malicioso não vira HTML', () => {
    const evil = buildGlossaryEntries({ keywords: [{ term: '<img src=x onerror=1>', js: '<script>', category: 'x' }], library: [] }, () => undefined);
    const out = renderToStaticMarkup(createElement(GlossaryList, { entries: evil }));
    expect(out).not.toContain('<img');
    expect(out).not.toContain('<script');
  });
});
