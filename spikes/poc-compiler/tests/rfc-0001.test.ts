import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readTable, REPO_ROOT, SPEC_PATH } from '../bench/rfc-tables.ts';
import { KEYWORDS } from '../src/vocabulary.constants.ts';

const read = (...parts: string[]): string => readFileSync(join(REPO_ROOT, ...parts), 'utf8');
const rfc = read('docs', 'rfc', '0001-vocabulario-e-biblioteca.md');
const grammar = read('docs', 'spec', 'gramatica.md');
const spec = readFileSync(SPEC_PATH, 'utf8');
const LIBRARY_HEADER = '| Área | GoiásScript | JavaScript | Semântica | Origem';
const OWNER_PROPOSALS = ['P8', 'P9', 'P10', 'P11', 'P12', 'P13', 'P15', 'P16'];
const REQUIRED_LIBRARY_GAPS = ['JSON.stringify', 'JSON.parse', 'Promise.all', '.some', '.every', '.splice', '.findIndex', 'Date.now'];
const VERBAL_FORMS = new Set(['imperativo', 'infinitivo', 'substantivo']);
const ANSWERS = new Set(['sim', 'não']);
const REQUIRED_HEADINGS = [
  '## 2. Vocabulário', '## 3. Alfabeto', '## 4. Decisões de gramática', '## 5. Biblioteca padrão', '## 6. Propostas',
  '### Anexo A', '### Anexo B', '### Anexo C', '### Anexo D', '### Anexo E', '### Anexo F', '## 8. Notas de migração', '## 9. Aprovação',
];
const STATEMENT_PRODUCTIONS: Readonly<Record<string, string>> = {
  VariableDeclaration: 'G03', FunctionDeclaration: 'G04', IfStatement: 'G07', WhileStatement: 'G08', ForStatement: 'G10',
  ForEachStatement: 'G11', TryStatement: 'G12', ClassDeclaration: 'G15', ReturnStatement: 'G17', JumpStatement: 'G18',
  ThrowStatement: 'G19', ExpressionStatement: 'G20',
};

describe('RFC-0001 (rascunho)', () => {
  it('não deixa marcador de geração e tem as seções e anexos da §9.3', () => {
    expect(rfc).not.toContain('<!-- gerado:');
    for (const heading of REQUIRED_HEADINGS) expect(rfc, heading).toContain(heading);
  });

  it('lista todo nome do vocabulário (§4.2) e da biblioteca (§4.9) do spec', () => {
    const names = [...readTable(spec, '| Categoria | GoiásScript'), ...readTable(spec, '| Área | GoiásScript')].map((row) => row[1] ?? '');
    expect(names.length).toBeGreaterThan(100);
    for (const name of names) expect(rfc, name).toContain(name.replaceAll('|', '\\|'));
  });

  it('registra origem, forma verbal e as duas respostas do teste da prosa por nome', () => {
    const rows = readTable(rfc, LIBRARY_HEADER);
    expect(rows.length).toBe(readTable(spec, '| Área | GoiásScript').length);
    for (const [, name = '', , , origin = '', form = '', proseA = '', proseB = ''] of rows) {
      expect(['dono', '1.5', 'proposta'], name).toContain(origin);
      if (origin !== 'proposta') continue;
      expect(VERBAL_FORMS.has(form), `${name}: forma verbal`).toBe(true);
      expect(ANSWERS.has(proseA) && ANSWERS.has(proseB), `${name}: teste da prosa`).toBe(true);
    }
  });

  it('o anexo A cobre todo nome goiano do runtime da 1.5', () => {
    const builtins = read('packages', 'core', 'src', 'goianoMethods', 'GoianoBuiltins.js');
    const block = /this\.metodosGoianos = \{([\s\S]*?)\n\s{4}\};/.exec(builtins)?.[1] ?? '';
    const names = [...block.matchAll(/^\s+(\w+): '(\w+)',/gm)].map((match) => match[2] ?? '');
    const annex = rfc.slice(rfc.indexOf('### Anexo A'), rfc.indexOf('### Anexo B'));
    expect(names.length).toBeGreaterThan(40);
    for (const name of names) expect(annex, name).toContain(name);
  });

  it('põe as propostas P8–P13, P15 e P16 na decisão do dono', () => {
    expect(readTable(rfc, '| # | Proposta').map((row) => row[0])).toEqual(OWNER_PROPOSALS);
  });

  it('o anexo D traz cada lacuna obrigatória da §4.9 com decisão do dono', () => {
    const annex = rfc.slice(rfc.indexOf('### Anexo D'), rfc.indexOf('### Anexo E'));
    const rows = readTable(annex, '| Item |');
    for (const gap of REQUIRED_LIBRARY_GAPS) {
      const row = rows.find((cells) => cells.some((cell) => cell.includes(gap)));
      expect(row, gap).toBeDefined();
      expect(row?.at(-1), `${gap}: decisão do dono`).toMatch(/^(pendente|aprovad[oa]|fora da v3)/);
    }
  });
});

describe('gramática (EBNF) coerente com o protótipo', () => {
  it('tem uma produção para cada tipo de instrução do parser', () => {
    for (const id of Object.values(STATEMENT_PRODUCTIONS)) expect(grammar, id).toMatch(new RegExp(`^${id} `, 'm'));
  });

  it('cita toda keyword que o parser trata como início de instrução e todo operador da tabela de precedência', () => {
    const parser = readFileSync(join(import.meta.dirname, '..', 'src', 'parser.ts'), 'utf8');
    const statementKeywords = [...parser.matchAll(/case '([a-zçãáéíóúêôõ_]+)'/g)].map((match) => match[1] ?? '').filter((word) => KEYWORDS.has(word));
    expect(statementKeywords.length).toBeGreaterThan(10);
    for (const keyword of statementKeywords) expect(grammar, keyword).toContain(`"${keyword}"`);
    const operatorWords = [...KEYWORDS.values()].filter((entry) => /^[a-zç_é]+$/.test(entry.spelling) && ['+', '-', '*', '/', '%', '<', '>', '<=', '>=', '===', '!==', '&&', '||'].includes(entry.js));
    for (const entry of operatorWords) expect(grammar, entry.spelling).toContain(`\`${entry.spelling}\``);
  });
});
