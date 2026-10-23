import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkEnglish, loadEnglishRules } from './english-ui.ts';
import { processIo, reportGate } from './gate-report.ts';
import type { GateIo } from './gate.types.ts';
import { collectUserFacingStrings } from './ui-strings.ts';

export function runCheckEnglishUi(root: string, io: GateIo): number {
  const strings = collectUserFacingStrings();
  const rules = loadEnglishRules(root);
  const problems = checkEnglish(strings, rules.forbidden, rules.allowlist);
  return reportGate(problems, io, {
    failure: (count) => `Ô sô, ${String(count)} trem(ns) em inglês vazou pra tela do usuário. Traduz pra goianês e tenta de novo.`,
    success: `Tá pronto, sô! ${String(strings.length)} texto(s) da interface conferido(s), nenhum em inglês.`,
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exit(runCheckEnglishUi(path.resolve(import.meta.dirname, '..'), processIo));
}
