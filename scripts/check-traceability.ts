import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { processIo, reportGate } from './gate-report.ts';
import type { GateIo } from './gate.types.ts';
import { checkTraceability, loadTraceability, realFiles } from './traceability.ts';

export function runCheckTraceability(root: string, io: GateIo): number {
  const entries = loadTraceability(root);
  const problems = checkTraceability(entries, realFiles(root));
  return reportGate(problems, io, {
    failure: (count) => `Ô sô, ${String(count)} promessa(s) sem prova de verdade. Aponta pro teste certo e tenta de novo.`,
    success: `Tá pronto, sô! ${String(entries.length)} promessa(s) com prova no lugar.`,
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exit(runCheckTraceability(path.resolve(import.meta.dirname, '..'), processIo));
}
