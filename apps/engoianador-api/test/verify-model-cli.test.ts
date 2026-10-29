import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';
import { KEY_VARIABLE } from '../scripts/verify-model.constants.ts';

const run = promisify(execFile);
const SCRIPT = fileURLToPath(new URL('../scripts/verify-model.ts', import.meta.url));
const CLI_TIMEOUT_MS = 30_000;

describe('verify-model pela linha de comando', () => {
  it('roda direto no Node, como no predeploy, e sem chave só avisa que pulou', async () => {
    const envWithoutKey = Object.fromEntries(Object.entries(process.env).filter(([name]) => name !== KEY_VARIABLE));
    const { stdout } = await run(process.execPath, [SCRIPT], { env: envWithoutKey, timeout: CLI_TIMEOUT_MS });
    expect(stdout).toMatch(/pul/i);
  }, CLI_TIMEOUT_MS);
});
