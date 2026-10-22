import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCli } from './build-cli.ts';

const ROOT = path.join(import.meta.dirname, '..');
const CLI_DIR = path.join(ROOT, 'packages/cli');
const LICENSE_TARGET = path.join(CLI_DIR, 'LICENSE');

export async function prepareForPack(): Promise<void> {
  await buildCli({ outDir: path.join(CLI_DIR, 'dist') });
  fs.copyFileSync(path.join(ROOT, 'LICENSE'), LICENSE_TARGET);
}

export function cleanAfterPack(): void {
  fs.rmSync(LICENSE_TARGET, { force: true });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv[2] === 'clean') cleanAfterPack();
  else await prepareForPack();
}
