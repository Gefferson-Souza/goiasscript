import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT_DIR = path.resolve(import.meta.dirname, '../../..');
const ADR_DIR = path.join(ROOT_DIR, 'docs/adr');
const ADR_COUNT = 11;
const ADR_FULL_FORMAT_FROM = 2;
const ADR_SECTIONS = ['Contexto', 'Decisão', 'Consequências', 'Confirmação'];
const RFC_SECTIONS = ['Resumo', 'Motivação', 'Delta de EBNF', 'Exemplos', 'Notas de migração', 'Casos de conformidade', 'Revisão'];
const RFC_STATUSES = 'rascunho | proposto | aceito | implementado | lançado';
const STATUS_LINE = /^- (?:\*\*)?Status:(?:\*\*)? (?:proposto|aceito)/m;

const readDoc = (rel) => fs.readFileSync(path.join(ROOT_DIR, rel), 'utf8');
const sectionBody = (text, heading) => text.split(new RegExp(`^## ${heading}\\s*$`, 'm'))[1]?.split(/^## /m)[0]?.trim() ?? '';
const adrFiles = fs.readdirSync(ADR_DIR).filter((name) => /^\d{4}-.+\.md$/.test(name)).sort();
const expectedNumbers = Array.from({ length: ADR_COUNT }, (_unused, index) => String(index + 1).padStart(4, '0'));

describe('docs/adr', () => {
  it('numera os ADRs de 0001 a 0011, um arquivo por número', () => {
    expect(adrFiles.map((name) => name.slice(0, 4))).toEqual(expectedNumbers);
  });
  describe.each(adrFiles)('%s', (file) => {
    const text = readDoc(`docs/adr/${file}`);
    const number = file.slice(0, 4);
    it('tem título com o número e uma linha de status', () => {
      expect(text.startsWith(`# ADR-${number}: `)).toBe(true);
      expect(text).toMatch(STATUS_LINE);
    });
    it('tem as seções preenchidas', () => {
      const required = Number(number) < ADR_FULL_FORMAT_FROM ? ['Decisão'] : ADR_SECTIONS;
      expect(required.filter((heading) => sectionBody(text, heading) === '')).toEqual([]);
    });
  });
});

describe('docs/rfc e docs/spec', () => {
  it('o template de RFC tem as sete seções e o ciclo de status', () => {
    const template = readDoc('docs/rfc/rfc.md');
    expect(RFC_SECTIONS.filter((heading) => sectionBody(template, heading) === '')).toEqual([]);
    expect(template).toContain(RFC_STATUSES);
  });
  it('o spec tem a página de migração e a de mudanças', () => {
    expect(readDoc('docs/spec/migracao.md').startsWith('# Migração entre versões')).toBe(true);
    expect(readDoc('docs/spec/o-que-mudou.md').startsWith('# O que mudou')).toBe(true);
  });
});
