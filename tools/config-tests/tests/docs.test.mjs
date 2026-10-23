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

describe('docs/spec final', () => {
  const SPEC_FILES = ['gramatica.md', 'migracao.md', 'o-que-mudou.md', 'referencia.md', 'vocabulario.lock.json'];
  const GRAMMAR_ID = /^(?:## )?(G\d{2})\b/gmu;
  const RETIRED_WORD = /word: '([^']+)'/gu;
  const tableRows = (text) => text.split('\n').filter((line) => line.startsWith('| ') && line.includes('`'));
  it('docs/spec tem os cinco arquivos esperados', () => {
    expect(fs.readdirSync(path.join(ROOT_DIR, 'docs/spec')).sort()).toEqual(SPEC_FILES);
  });
  it('ids Gnn da gramática são únicos', () => {
    const ids = [...readDoc('docs/spec/gramatica.md').matchAll(GRAMMAR_ID)].map((match) => match[1]);
    expect(ids.length).toBeGreaterThan(0);
    expect(ids.filter((id, index) => ids.indexOf(id) !== index)).toEqual([]);
  });
  it('toda palavra aposentada aparece em migracao.md ou em o-que-mudou.md', () => {
    const retired = [...readDoc('packages/language/src/retired/retired-words.data.ts').matchAll(RETIRED_WORD)].map((match) => match[1]);
    const rows = [...tableRows(readDoc('docs/spec/migracao.md')), ...tableRows(readDoc('docs/spec/o-que-mudou.md'))].join('\n');
    expect(retired.length).toBeGreaterThan(0);
    expect(retired.filter((word) => !rows.includes(`\`${word}\``))).toEqual([]);
  });
  it('migracao.md registra a troca de trem e de .tamanho()', () => {
    const rows = tableRows(readDoc('docs/spec/migracao.md')).join('\n');
    expect(rows).toContain('`trem`');
    expect(rows).toContain('`.tamanho()`');
  });
});

describe('docs/piloto', () => {
  const PILOT_DIR = path.join(ROOT_DIR, 'docs/piloto');
  const EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]+/u;
  const ABSOLUTE_PATH = /(?:^|[\s("'`])(?:\/(?:home|Users|root)\/|[A-Za-z]:\\)/mu;
  const PHONE = /(?:\+?\d{2}\s?)?\(?\d{2}\)?[\s.-]?9?\d{4}[\s.-]?\d{4}/u;
  const LEARNER_NAME = /(?:aprendiz|participante|aluno)\s+(?:[A-ZÀ-Ý][a-zà-ÿ]+)\b/u;
  const listFiles = (dir) =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const full = path.join(dir, entry.name);
      return entry.isDirectory() ? listFiles(full) : [full];
    });
  const pilotFiles = listFiles(PILOT_DIR);

  it('traz os quatro documentos do kit e a pasta das respostas', () => {
    const names = pilotFiles.map((file) => path.relative(PILOT_DIR, file).split(path.sep).join('/'));
    expect(names).toEqual(expect.arrayContaining(['README.md', 'roteiro.md', 'formulario-retorno.md', 'modelo-relatorio.md', 'respostas/.gitkeep']));
  });

  it('docs/piloto não tem e-mail, caminho absoluto, telefone nem nome próprio de aprendiz', () => {
    const offenders = pilotFiles.flatMap((file) => {
      const text = fs.readFileSync(file, 'utf8');
      return [EMAIL, ABSOLUTE_PATH, PHONE, LEARNER_NAME].filter((pattern) => pattern.test(text)).map((pattern) => `${path.relative(ROOT_DIR, file)}: ${String(pattern)}`);
    });
    expect(offenders).toEqual([]);
  });
});
