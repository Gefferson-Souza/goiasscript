import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

interface AuditCase { readonly id: string; readonly group: string; readonly category: string; readonly gs: string | null; readonly expected: string | null }
interface Hit { readonly code: string; readonly line: number }
interface Override { readonly intentional: boolean; readonly diagnostics: readonly Hit[] }
type Triage =
  | { readonly kind: 'intentional'; readonly diagnostics: readonly Hit[]; readonly stdout: null }
  | { readonly kind: 'bug' | 'control'; readonly diagnostics: readonly Hit[]; readonly stdout: string | null }
  | { readonly kind: 'moved'; readonly target: string };

const ROOT_DIR = path.resolve(import.meta.dirname, '..');
const AUDIT_DIR = path.join(ROOT_DIR, 'docs/auditoria/2026-10-13/probes-core');
const CONFORMANCE_ROOT = path.join(ROOT_DIR, 'packages/compiler/tests/conformance');
const ISSUES_FILE = path.join(import.meta.dirname, 'audit-issues.json');
const RFC = 'RFC-0001';
const word = (names: string): RegExp => new RegExp(`(?<![\\w$.])(?:${names})(?![\\w$])`, 'g');
const member = (names: string): RegExp => new RegExp(`(?<=\\.\\s{0,3})(?:${names})(?![\\w$])`, 'g');

// Padrões do que a linguagem não aceita; a ordem não importa, o resultado sai ordenado por posição.
const OUTSIDE: readonly (readonly [string, RegExp])[] = [
  ['GS0401', word('const|let|var|function|return|if|else|for|while|break|continue|class|extends|super|this|new|instanceof|try|catch|finally|throw|async|await|static|in|of|true|false|null|undefined')],
  ['GS0512', word('typeof')],
  ['GS0513', word('delete')],
  ['GS0514', word('void')],
  ['GS0505', word('switch|case|default')],
  ['GS0506', word('do')],
  ['GS0511', word('yield')],
  ['GS0515', word('import|export')],
  ['GS0402', word('eval|NaN|Infinity|arguments')],
  ['GS0403', word('console|Math|JSON|Object|Array|String|Number|Boolean|Promise|Date|Error|RegExp|Map|Set|Symbol|setTimeout|setInterval|parseInt|parseFloat|isNaN|globalThis|Function|Reflect|Proxy|Intl')],
  ['GS0306', word('presta_serviço|vixe_que|sei_lá|vazio|senao|fazer|é_igual_a|mexe_assim')],
  ['GS0306', /(?<![\w$.])se(?=\s*\()/g],
  ['GS0301', word('GoianoMath')],
  ['GS0404', /===|!==|==|!=|&&|\|\||\+\+|--|[-+*/%]=|(?<![=!<>])=(?![=>])|!(?!=)/g],
  ['GS0501', /`(?:\\.|[^`\\])*`?/g],
  ['GS0523', /\*\*|\?\.|\?\?|\s\?\s/g],
  ['GS0504', /\.\.\./g],
  ['GS0518', /faz_trem\s*\(/g],
  ['GS0502', /(?<=[(,=:[!&|?{};]|^|return)\s*\/(?![/*])(?:\\.|\[[^\]\n]*\]|[^/\n\\[])+\/[a-z]*/gmu],
  ['GS0516', /\b(?:uai|trem)\s+[\p{L}\w]+\s*:|faz_trem\s+\w+\s*\([^)]*:/gu],
  ['GS0405', member('map|filter|reduce|forEach|push|pop|shift|unshift|length|toUpperCase|toLowerCase|includes|indexOf|split|join|trim|slice|replace|replaceAll|startsWith|endsWith|find|sort|reverse|concat|then|catch|message|keys|values|entries')],
  ['GS0406', member('some|every|flat|at|padStart|toString|valueOf|hasOwnProperty|call|apply|bind|charAt|substring|toFixed|splice|constructor|prototype')],
  ['GS0305', member('reduzir|empurrar|pra_maiusculo|pegar_ano|absoluto|achar|emendar')],
];
const GLOBAL_MEMBER = /\b(?:console|Math|JSON|Object|Array|String|Number|Date|Promise)\s*\.\s*(\w+)/g;

// Revisões feitas à mão onde a heurística não alcança: diagnóstico esperado e se o caso é mudança intencional.
const OVERRIDES: Readonly<Record<string, Override>> = {
  A11: { intentional: true, diagnostics: [{ code: 'GS0303', line: 1 }] },
  A15: { intentional: true, diagnostics: [{ code: 'GS0104', line: 1 }] },
  A16: { intentional: true, diagnostics: [{ code: 'GS0520', line: 1 }] },
  S10: { intentional: true, diagnostics: [{ code: 'GS0103', line: 1 }] },
  O07: { intentional: true, diagnostics: [{ code: 'GS0806', line: 1 }] },
  S13: { intentional: false, diagnostics: [{ code: 'GS0103', line: 2 }] },
  V04: { intentional: false, diagnostics: [{ code: 'GS0202', line: 1 }] },
  V08: { intentional: false, diagnostics: [{ code: 'GS0307', line: 1 }] },
};
const STDOUTS: Readonly<Record<string, string>> = { S12: 'use .replace( pra trocar\n', C01: 'ok\n', E04b: '5\n', L05: '1 2\n', W01: 'oi\n', X03: '', D01: '', D02: '', D03: '' };
const MOVED: Readonly<Record<string, string>> = { K07: 'teste do REPL por PTY', D04: 'API pública de compile()', D05: 'API pública de compile()', D06: 'API pública de compile()', D07: 'diagnóstico de sintaxe do parser' };

const text = (value: unknown): string | null => (typeof value === 'string' ? value : null);

function toAuditCase(value: unknown): AuditCase {
  const record = typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
  const id = text(record['id']);
  const group = text(record['grupo']);
  const category = text(record['classe']);
  if (id === null || group === null || category === null) throw new Error(`caso da auditoria inválido: ${JSON.stringify(value)}`);
  return { id, group, category, gs: text(record['gs']), expected: text(record['esperado']) };
}

export function loadAuditCases(auditDir: string): readonly AuditCase[] {
  return fs.readdirSync(auditDir).filter((name) => /^cases-.*\.js$/.test(name)).sort().flatMap((name) => {
    const sandbox: { exports: unknown } = { exports: [] };
    new vm.Script(fs.readFileSync(path.join(auditDir, name), 'utf8')).runInNewContext({ module: sandbox, require: () => ({}) });
    if (!Array.isArray(sandbox.exports)) throw new Error(`${name} não exporta uma lista`);
    return sandbox.exports.map(toAuditCase);
  });
}

// Mantém o tamanho e as quebras de linha, para o índice valer na linha original.
export function blankLiterals(source: string): string {
  const blank = (value: string): string => value.replace(/[^\n]/g, ' ');
  return source
    .replace(/\/\/.*$|\/\*[\s\S]*?\*\//gm, blank)
    .replace(/"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'/g, (quoted) => `"${blank(quoted.slice(1, -1))}"`)
    .replace(/`(?:\\.|[^`\\])*`/g, (template) => `\`${blank(template.slice(1, -1))}\``);
}

export function findOutsideV3(gs: string): readonly Hit[] {
  const clean = blankLiterals(gs);
  const skipped = new Set([...clean.matchAll(GLOBAL_MEMBER)].map((match) => match.index + match[0].length - (match[1]?.length ?? 0)));
  return OUTSIDE.flatMap(([code, pattern]) =>
    [...clean.matchAll(pattern)].filter((match) => !(code.startsWith('GS040') && skipped.has(match.index))).map((match) => ({ code, index: match.index })),
  )
    .toSorted((left, right) => left.index - right.index)
    .map(({ code, index }) => ({ code, line: clean.slice(0, index).split('\n').length }));
}

export function triageCase(source: AuditCase): Triage {
  const target = MOVED[source.id];
  if (target !== undefined || source.gs === null) return { kind: 'moved', target: target ?? 'caso sem programa .gs' };
  const override = OVERRIDES[source.id];
  const diagnostics = override?.diagnostics ?? findOutsideV3(source.gs);
  if (override?.intentional ?? (override === undefined && diagnostics.length > 0)) return { kind: 'intentional', diagnostics, stdout: null };
  const stdout = STDOUTS[source.id] ?? (source.expected === null || source.expected === '' ? source.expected : `${source.expected}\n`);
  return { kind: source.category === 'controle' ? 'control' : 'bug', diagnostics, stdout };
}

export function planCases(cases: readonly AuditCase[]): readonly { readonly id: string; readonly source: AuditCase; readonly triage: Triage }[] {
  return cases.map((source) => ({ id: `audit-${source.id.toLowerCase()}`, source, triage: triageCase(source) }));
}

export function caseFiles(source: AuditCase, triage: Triage, issues: Readonly<Record<string, number>>): Readonly<Record<string, string>> {
  if (triage.kind === 'moved' || source.gs === null) return {};
  const issue = issues[source.group];
  if (triage.kind === 'bug' && issue === undefined) throw new Error(`falta a issue do grupo "${source.group}" em audit-issues.json`);
  const link = triage.kind === 'bug' ? { issue: String(issue) } : { rfc: RFC };
  const json = (value: unknown): string => `${JSON.stringify(value, null, 2)}\n`;
  return {
    'input.gs': source.gs,
    'diagnostics.json': json(triage.diagnostics),
    'case.json': json({ status: 'expected-fail', triage: triage.kind, source: source.id, ...link }),
    ...(triage.stdout === null ? {} : { 'stdout.txt': triage.stdout }),
  };
}

export function writeCorpus(root: string, cases: readonly AuditCase[], issues: Readonly<Record<string, number>>): number {
  const planned = planCases(cases);
  let written = 0;
  for (const { id, source, triage } of planned) {
    const files = caseFiles(source, triage, issues);
    if (Object.keys(files).length === 0) continue;
    fs.mkdirSync(path.join(root, id), { recursive: true });
    for (const [name, content] of Object.entries(files)) fs.writeFileSync(path.join(root, id, name), content);
    written += 1;
  }
  const moved = planned.flatMap(({ source, triage }) => (triage.kind === 'moved' ? [{ id: source.id, target: triage.target }] : []));
  fs.writeFileSync(path.join(root, '../audit-moved.json'), `${JSON.stringify(moved, null, 2)}\n`);
  return written;
}

function main(command: string | undefined): void {
  const write = (line: string): void => void process.stdout.write(`${line}\n`);
  const planned = planCases(loadAuditCases(AUDIT_DIR));
  if (command === 'plan') {
    for (const kind of new Set(planned.map(({ triage }) => triage.kind))) write(`${kind}: ${String(planned.filter(({ triage }) => triage.kind === kind).length)}`);
    const groups = [...new Set(planned.filter(({ triage }) => triage.kind === 'bug').map(({ source }) => source.group))].sort();
    for (const group of groups) {
      const ids = planned.filter(({ source, triage }) => triage.kind === 'bug' && source.group === group).map(({ source }) => source.id);
      write(`gh issue create --title "Corpus: casos da auditoria do grupo ${group} falham na v3" --body "Casos: ${ids.join(', ')}. Cada case.json liga o expected-fail a esta issue."`);
    }
  } else if (command === 'import') {
    const issues = JSON.parse(fs.readFileSync(ISSUES_FILE, 'utf8')) as Record<string, number>;
    write(`${String(writeCorpus(CONFORMANCE_ROOT, loadAuditCases(AUDIT_DIR), issues))} casos escritos em ${CONFORMANCE_ROOT}`);
  } else {
    write('uso: node scripts/import-audit-cases.ts plan|import');
    process.exit(2);
  }
}

if (process.argv[1] === import.meta.filename) main(process.argv[2]);
