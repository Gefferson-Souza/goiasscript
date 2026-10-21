import fs from 'node:fs';
import path from 'node:path';
import * as compiler from '../packages/compiler/src/index.ts';
import { executeModule } from '../packages/compiler/tests/support/execute-module.ts';
import { blessCase, loadCases, pickCompile } from '../packages/compiler/tests/support/conformance.ts';

const CONFORMANCE_ROOT = path.join(import.meta.dirname, '../packages/compiler/tests/conformance');
const write = (text: string): void => {
  process.stdout.write(`${text}\n`);
};

async function main(ids: readonly string[]): Promise<number> {
  const selected = loadCases(CONFORMANCE_ROOT).filter((testCase) => ids.length === 0 || ids.includes(testCase.id));
  const pending = selected.filter((testCase) => testCase.config.status === 'expected-fail');
  if (pending.length > 0) {
    write(`bless recusa ${String(pending.length)} caso(s) expected-fail; remova o marcador de cada um e rode de novo: ${pending.map((testCase) => testCase.id).join(' ')}`);
    return 1;
  }
  const compile = pickCompile(compiler);
  for (const testCase of selected) {
    const files = await blessCase(testCase, compile, executeModule);
    const dir = path.join(CONFORMANCE_ROOT, testCase.id);
    fs.writeFileSync(path.join(dir, 'diagnostics.json'), files.diagnostics);
    if (files.output !== null) fs.writeFileSync(path.join(dir, 'output.mjs'), files.output);
    if (files.stdout !== null) fs.writeFileSync(path.join(dir, 'stdout.txt'), files.stdout);
  }
  write(`${String(selected.length)} caso(s) abençoado(s)`);
  return 0;
}

process.exit(await main(process.argv.slice(2)));
