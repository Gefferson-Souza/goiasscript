import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { processIo, reportGate } from './gate-report.ts';
import type { GateIo } from './gate.types.ts';
import { checkTraceability, loadReadmeClaims, loadTraceability, realFiles } from './traceability.ts';
import { readmeProblems, renderReport } from './traceability-report.ts';
import { README_PATH } from './traceability-report.constants.ts';

const REPORT_FLAG = '--report';

export function runCheckTraceability(root: string, io: GateIo, report = false): number {
  const entries = [...loadTraceability(root), ...loadReadmeClaims(root)];
  const readme = fs.readFileSync(path.join(root, README_PATH), 'utf8');
  const problems = [...checkTraceability(entries, realFiles(root)), ...readmeProblems(readme, entries)];
  const code = reportGate(problems, io, {
    failure: (count) => `Ô sô, ${String(count)} promessa(s) sem prova de verdade. Aponta pro teste certo e tenta de novo.`,
    success: `Tá pronto, sô! ${String(entries.length)} promessa(s) com prova no lugar.`,
  });
  if (report) io.out(renderReport(entries));
  return code;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exit(runCheckTraceability(path.resolve(import.meta.dirname, '..'), processIo, process.argv.includes(REPORT_FLAG)));
}
