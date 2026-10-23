import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkCompilerDependencies, loadCompilerPackages } from './compiler-dependencies.ts';
import { processIo, reportGate } from './gate-report.ts';
import type { GateIo } from './gate.types.ts';

export function runCheckCompilerDependencies(root: string, io: GateIo): number {
  const { manifests, sources } = loadCompilerPackages(root);
  const problems = checkCompilerDependencies(manifests, sources);
  return reportGate(problems, io, {
    failure: (count) => `Ô sô, o compilador puxou ${String(count)} trem(ns) de fora. Ele tem que ficar sem dependência.`,
    success: `Tá pronto, sô! O compilador não depende de nada além da tabela da linguagem (${String(Object.keys(sources).length)} arquivo(s) conferido(s)).`,
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exit(runCheckCompilerDependencies(path.resolve(import.meta.dirname, '..'), processIo));
}
