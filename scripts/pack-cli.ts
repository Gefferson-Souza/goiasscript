import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import type { PackCliOptions, PackCliResult } from './pack-cli.types.ts';

const execFileAsync = promisify(execFile);
const ROOT = path.join(import.meta.dirname, '..');
const CLI_DIR = path.join(ROOT, 'packages/cli');

export async function packCli(options: PackCliOptions): Promise<PackCliResult> {
  const outDir = path.resolve(options.outDir);
  fs.mkdirSync(outDir, { recursive: true });
  const { stdout } = await execFileAsync('corepack', ['pnpm', 'pack', '--pack-destination', outDir, '--json'], { cwd: CLI_DIR });
  const { filename } = JSON.parse(stdout.slice(stdout.indexOf('{'))) as { readonly filename: string };
  const tarball = path.resolve(filename);
  return { tarball, sha256: createHash('sha256').update(fs.readFileSync(tarball)).digest('hex') };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = await packCli({ outDir: path.join(ROOT, 'packages/cli/pack') });
  process.stdout.write(`${result.tarball}\n${result.sha256}\n`);
}
