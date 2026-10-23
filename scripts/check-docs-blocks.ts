import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compile } from '../packages/compiler/src/index.ts';
import { checkDocBlocks, extractGoiasscriptBlocks, formatProblem } from './docs-blocks.ts';
import { collectMarkdown } from './docs-files.ts';
import { BLOCK_SOURCES } from './docs-gate.constants.ts';
import { runDocProgram } from './docs-run.ts';

interface Io {
  readonly out: (text: string) => void;
  readonly err: (text: string) => void;
}

export async function runCheckDocBlocks(root: string, io: Io): Promise<number> {
  const blocks = collectMarkdown(root, BLOCK_SOURCES).flatMap((doc) => extractGoiasscriptBlocks(doc.text, doc.file));
  const problems = await checkDocBlocks(blocks, {
    compile: (source) => compile(source, { target: 'module' }),
    run: runDocProgram,
  });
  if (problems.length > 0) {
    for (const item of problems) io.err(`${formatProblem(item)}\n`);
    io.err(`Ô sô, a documentação tem ${String(problems.length)} bloco(s) torto(s). Arruma e tenta de novo.\n`);
    return 1;
  }
  io.out(`Tá pronto, sô! ${String(blocks.length)} bloco(s) da documentação conferido(s).\n`);
  return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = path.resolve(import.meta.dirname, '..');
  const exitCode = await runCheckDocBlocks(root, { out: (text) => process.stdout.write(text), err: (text) => process.stderr.write(text) });
  process.exit(exitCode);
}
