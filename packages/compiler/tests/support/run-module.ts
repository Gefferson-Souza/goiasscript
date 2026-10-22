import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const PRELOAD = new URL('./deterministic-preload.mjs', import.meta.url).href;

export function runModule(code: string, stdin = ''): string {
  const dir = mkdtempSync(join(tmpdir(), 'gs-run-'));
  try {
    const file = join(dir, 'programa.mjs');
    writeFileSync(file, code);
    return execFileSync(process.execPath, ['--import', PRELOAD, file], { input: stdin, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
