import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const EXECUTION_TIMEOUT_MS = 10_000;
const PRELOAD = pathToFileURL(path.join(import.meta.dirname, 'deterministic-preload.mjs')).href;

export function executeModule(code: string, stdin: string | null): Promise<string> {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gs-case-'));
  const file = path.join(dir, 'program.mjs');
  fs.writeFileSync(file, code);
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['--import', PRELOAD, file], { timeout: EXECUTION_TIMEOUT_MS });
    let stdout = '';
    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString('utf8');
    });
    child.on('error', reject);
    child.on('close', () => {
      fs.rmSync(dir, { recursive: true, force: true });
      resolve(stdout);
    });
    child.stdin.end(stdin ?? '');
  });
}
