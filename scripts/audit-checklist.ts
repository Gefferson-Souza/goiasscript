import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ADR_PREFIX, BLOCK_COMMENT, AUDIT_CLOSURE_PATH, AUDIT_REPORTS_DIR, CHECKLIST_DIVIDER, CHECKLIST_HEADER, CONFORMANCE_PREFIX, CORPUS_MARKER, HEADING_FINDING, LINE_COMMENT, LIST_FINDING, REPORT_FILE, TABLE_CELL_BREAK } from './audit-checklist.constants.ts';
import { createExpectedFailPort, listReportNames, realChecklistFs } from './audit-checklist-ports.ts';
import type { ChecklistFs, ChecklistInput, ChecklistProblems, ChecklistRow, Closure, ExpectedFailPort, Finding, FindingSeverity } from './audit-checklist.types.ts';
import { TEST_TITLE } from './gate.constants.ts';
import { processIo } from './gate-report.ts';
import type { GateIo } from './gate.types.ts';

const isSeverity = (value: string | undefined): value is FindingSeverity => value === 'CRITICAL' || value === 'HIGH';
const reportLetter = (reportName: string): string => REPORT_FILE.exec(reportName)?.[1] ?? reportName.slice(0, 1).toUpperCase();

function matchFinding(line: string, reportName: string): Finding | null {
  const match = HEADING_FINDING.exec(line) ?? LIST_FINDING.exec(line);
  const [, severity, localId, title] = match ?? [];
  if (!isSeverity(severity) || localId === undefined || title === undefined) return null;
  return { id: `${reportLetter(reportName)} ${localId}`, severity, title, report: reportName };
}

export function parseFindings(markdown: string, reportName: string): readonly Finding[] {
  return markdown.split(/\r?\n/u).map((line) => matchFinding(line, reportName)).filter((item) => item !== null);
}

const withoutComments = (source: string): string => source.replace(BLOCK_COMMENT, '').replace(LINE_COMMENT, '');
const testTitles = (source: string): readonly string[] => Array.from(withoutComments(source).matchAll(TEST_TITLE), (match) => match[2] ?? '');

function testReasons(closure: Closure, fs: ChecklistFs): readonly string[] {
  if (!fs.exists(closure.ref)) return [`o arquivo ${closure.ref} não existe`];
  const name = closure.testName;
  if (name === undefined) return [`o fechamento por teste em ${closure.ref} não informa testName`];
  if (testTitles(fs.read(closure.ref)).some((title) => title.includes(name))) return [];
  return [`o nome "${name}" não é título de teste em ${closure.ref}`];
}

function goldenReasons(closure: Closure, fs: ChecklistFs): readonly string[] {
  if (!closure.ref.startsWith(CONFORMANCE_PREFIX)) return [`${closure.ref} não está no corpus de conformidade`];
  return fs.exists(`${closure.ref}/${CORPUS_MARKER}`) ? [] : [`o golden ${closure.ref} não existe`];
}

function adrReasons(closure: Closure, fs: ChecklistFs): readonly string[] {
  if (!closure.ref.startsWith(ADR_PREFIX)) return [`${closure.ref} não é um ADR`];
  return fs.exists(closure.ref) ? [] : [`o ADR ${closure.ref} não existe`];
}

const REASONS_BY_KIND = { test: testReasons, intentional: goldenReasons, adr: adrReasons } as const;

export function buildChecklist(findings: readonly Finding[], closures: readonly Closure[], fs: ChecklistFs): readonly ChecklistRow[] {
  return findings.map((finding) => {
    const own = closures.filter((closure) => closure.id === finding.id);
    const reasons = own.length === 0 ? ['sem fechamento registrado'] : own.flatMap((closure) => REASONS_BY_KIND[closure.kind](closure, fs));
    return { finding, closures: own, state: reasons.length === 0 ? 'closed' : 'open', reasons };
  });
}

export function findOrphanClosures(findings: readonly Finding[], closures: readonly Closure[]): readonly string[] {
  const known = new Set(findings.map((finding) => finding.id));
  return [...new Set(closures.map((closure) => closure.id).filter((id) => !known.has(id)))];
}

export function checklistProblems(input: ChecklistInput): ChecklistProblems {
  const file = AUDIT_CLOSURE_PATH;
  return [
    ...input.rows.filter((row) => row.state === 'open').map((row) => ({ file, message: `${row.finding.id} (${row.finding.severity}) está open: ${row.reasons.join('; ')}.` })),
    ...input.orphans.map((id) => ({ file, message: `o fechamento de ${id} não casa com nenhum achado dos relatórios.` })),
    ...input.emptyReports.map((report) => ({ file: `${AUDIT_REPORTS_DIR}/${report}`, message: 'nenhum achado CRITICAL/HIGH reconhecido; o formato do relatório mudou?' })),
    ...input.expectedFail.map((id) => ({ file: 'packages/compiler/tests/conformance', message: `o caso ${id} ainda está expected-fail.` })),
  ];
}

const cell = (text: string): string => text.replace(TABLE_CELL_BREAK, '\\|');

function closureLabel(row: ChecklistRow): string {
  if (row.closures.length === 0) return '—';
  return row.closures.map((closure) => `${closure.kind}: ${closure.ref}${closure.testName === undefined ? '' : ` ("${closure.testName}")`}`).join('<br>');
}

export function renderChecklist(rows: readonly ChecklistRow[]): string {
  const lines = rows.map((row) => `| ${row.finding.id} | ${row.finding.severity} | ${cell(row.finding.title)} | ${cell(closureLabel(row))} | ${row.state} |`);
  return [CHECKLIST_HEADER, CHECKLIST_DIVIDER, ...lines].join('\n');
}

export function loadClosures(fs: ChecklistFs): readonly Closure[] {
  return JSON.parse(fs.read(AUDIT_CLOSURE_PATH)) as readonly Closure[];
}

export function runAuditChecklist(root: string, io: GateIo, expectedFail: ExpectedFailPort): number {
  const fs = realChecklistFs(root);
  const parsed = listReportNames(root).map((report) => ({ report, found: parseFindings(fs.read(`${AUDIT_REPORTS_DIR}/${report}`), report) }));
  const findings = parsed.flatMap((item) => item.found);
  const closures = loadClosures(fs);
  const rows = buildChecklist(findings, closures, fs);
  const problems = checklistProblems({ rows, orphans: findOrphanClosures(findings, closures), emptyReports: parsed.filter((item) => item.found.length === 0).map((item) => item.report), expectedFail: expectedFail.list() });
  io.out(`${renderChecklist(rows)}\n`);
  if (problems.length === 0) return 0;
  for (const item of problems) io.err(`${item.file}: ${item.message}\n`);
  io.err(`Ô sô, ${String(problems.length)} pendência(s) técnica(s) no checklist da auditoria. Isso bloqueia o lançamento.\n`);
  return 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = path.resolve(import.meta.dirname, '..');
  process.exit(runAuditChecklist(root, processIo, createExpectedFailPort(root)));
}
