import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { KEYWORDS } from '../src/vocabulary.constants.ts';
import { listJsMembers } from './js-members.ts';

export const REPO_ROOT: string = process.env['GS_REPO'] ?? join(import.meta.dirname, '..', '..', '..');
export const SPEC_PATH: string = join(REPO_ROOT, 'docs', 'superpowers', 'specs', '2026-10-14-goiasscript-3-design.md');

const PENDING = 'pendente';
const INHERITED = 'herdado';
const NO_VARIANT = '—';
const MARKER = /<!-- gerado:([a-z-]+) -->/g;
const OWNER_MARK = '✅';
const LEGACY_MARK = '(1.5)';
const RFC_APPROVAL = 'RFC-0001';
const SPEC_APPROVAL = 'Spec';
const NOT_FOUND = -1;
const DATE_GETTERS: readonly string[] = ['getFullYear', 'getMonth', 'getDate', 'getHours', 'getMinutes', 'getSeconds'];
const ESCAPED_PIPE = /\\\|/g;
const UNESCAPED_PIPE = /(?<!\\)\|/;

type Row = readonly string[];
type SectionBuilder = (spec: string) => string;

const splitRow = (line: string): string[] => line.trim().slice(1, -1).split(UNESCAPED_PIPE).map((cell) => cell.trim().replace(ESCAPED_PIPE, '|'));
const escapeCell = (cell: string): string => cell.replaceAll('|', '\\|');
const renderTable = (header: readonly string[], rows: readonly Row[]): string => {
  const line = (cells: readonly string[]): string => `| ${cells.map(escapeCell).join(' | ')} |`;
  return [line(header), line(header.map(() => '---')), ...rows.map(line)].join('\n');
};

export const readTable = (markdown: string, headerPrefix: string): string[][] => {
  const lines = markdown.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim().startsWith(headerPrefix));
  if (start === NOT_FOUND) return [];
  const body = lines.slice(start + 2);
  const end = body.findIndex((line) => !line.trim().startsWith('|'));
  return (end === NOT_FOUND ? body : body.slice(0, end)).map(splitRow);
};

const stripMarks = (cell: string): string => cell.replaceAll('`', '').replace(OWNER_MARK, '').replace(LEGACY_MARK, '').trim();
const asciiVariants = (): ReadonlyMap<string, string> =>
  new Map([...KEYWORDS].filter(([key, info]) => key !== info.spelling).map(([key, info]) => [info.spelling, key]));

const vocabulary: SectionBuilder = (spec) => {
  const variants = asciiVariants();
  const rows = readTable(spec, '| Categoria | GoiásScript').map(([category = '', name = '', js = '', kind = '']): Row => {
    const variant = variants.get(stripMarks(name));
    return [category, name, js, kind, variant ? `\`${variant}\`` : NO_VARIANT, PENDING];
  });
  return renderTable(['Categoria', 'GoiásScript', 'JavaScript', 'Classe', 'Variante sem acento', 'Decisão do dono'], rows);
};

const grammarDecisions: SectionBuilder = (spec) => {
  const decisions = readTable(spec, '| Construção | Decisão').map(([construction = '', decision = '']): Row => [construction, decision, PENDING]);
  const approved = readTable(spec, '| # | Proposta').filter((row) => row[3] === SPEC_APPROVAL).map(([id = '', proposal = '']): Row => [id, proposal, 'aprovada no spec']);
  return [
    renderTable(['Construção', 'Decisão', 'Decisão do dono'], decisions),
    '',
    'Propostas já aprovadas pelo dono no spec (D10); entram aqui só para registro.',
    '',
    renderTable(['Id', 'Proposta', 'Situação'], approved),
  ].join('\n');
};

const originOf = (name: string): string => {
  if (name.includes(OWNER_MARK)) return 'dono';
  return name.includes(LEGACY_MARK) ? '1.5' : 'proposta';
};

const library: SectionBuilder = (spec) => {
  const rows = readTable(spec, '| Área | GoiásScript').map(([area = '', name = '', js = '', semantics = '']): Row => {
    const origin = originOf(name);
    const inherited = origin === 'proposta' ? PENDING : INHERITED;
    return [area, name, js, semantics, origin, inherited, inherited, inherited, PENDING];
  });
  const header = ['Área', 'GoiásScript', 'JavaScript', 'Semântica', 'Origem', 'Forma verbal', 'Prosa (a)', 'Prosa (b)', 'Decisão do dono'];
  return renderTable(header, rows);
};

const retired: SectionBuilder = (spec) =>
  renderTable(['Aposentada', 'Forma na v3', 'Decisão do dono'], readTable(spec, '| Aposentada | Forma na v3').map(([word = '', form = '']): Row => [word, form, PENDING]));

const proposals: SectionBuilder = (spec) => {
  const rows = readTable(spec, '| # | Proposta').filter((row) => row[3] === RFC_APPROVAL).map(([id = '', proposal = '', fallback = '']): Row => [id, proposal, fallback, PENDING]);
  return renderTable(['#', 'Proposta', 'Alternativa se recusada', 'Decisão do dono'], rows);
};

const knownJsNames = (spec: string): ReadonlySet<string> => {
  const cells = readTable(spec, '| Área | GoiásScript').map((row) => row[2] ?? '');
  return new Set([...DATE_GETTERS, ...cells.flatMap((cell) => cell.match(/[A-Za-z_$][\w$]*/g) ?? [])]);
};

const nativeMembers: SectionBuilder = (spec) => {
  const covered = knownJsNames(spec);
  const rows = [...listJsMembers()].map(([receiver, names]): Row => [receiver, names.filter((name) => !covered.has(name)).map((name) => `\`${name}\``).join(', ')]);
  return renderTable(['Receptor', 'Membros sem nome goiano'], rows);
};

const SECTIONS: Readonly<Record<string, SectionBuilder>> = {
  vocabulario: vocabulary, gramatica: grammarDecisions, biblioteca: library, aposentadas: retired, propostas: proposals, 'membros-nativos': nativeMembers,
};

export const fillMarkers = (markdown: string, spec: string): string =>
  markdown.replace(MARKER, (marker, name: string) => SECTIONS[name]?.(spec) ?? marker);

if (process.argv[1]?.endsWith('rfc-tables.ts')) {
  const target = process.argv[2] ?? '';
  writeFileSync(target, fillMarkers(readFileSync(target, 'utf8'), readFileSync(SPEC_PATH, 'utf8')));
}
