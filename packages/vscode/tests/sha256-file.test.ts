import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { matchesSha256, sha256OfFile } from '../../../scripts/sha256-file.ts';

const SCRIPT = path.join(import.meta.dirname, '../../../scripts/sha256-file.ts');
const HELLO_SHA256 = '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824';

describe('sha256-file', () => {
  let dir = '';
  let file = '';

  beforeAll(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gs-sha-'));
    file = path.join(dir, 'pacote.vsix');
    fs.writeFileSync(file, 'hello');
  });

  afterAll(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('calcula o sha256 do conteúdo', () => {
    expect(sha256OfFile(file)).toBe(HELLO_SHA256);
  });

  it('compara sem diferenciar maiúsculas e ignora espaços nas pontas', () => {
    expect(matchesSha256(file, ` ${HELLO_SHA256.toUpperCase()}\n`)).toBe(true);
    expect(matchesSha256(file, '0'.repeat(64))).toBe(false);
    expect(matchesSha256(file, '')).toBe(false);
  });

  it('sem hash esperado imprime sha256=<hex> para o GITHUB_OUTPUT', () => {
    const out = execFileSync(process.execPath, [SCRIPT, file], { encoding: 'utf8' });
    expect(out).toBe(`sha256=${HELLO_SHA256}\n`);
  });

  it('com hash esperado confere e sai 0', () => {
    expect(() => execFileSync(process.execPath, [SCRIPT, file, HELLO_SHA256], { stdio: 'pipe' })).not.toThrow();
  });

  it('com hash divergente sai 1 e avisa em goianês', () => {
    const result = spawnSync(process.execPath, [SCRIPT, file, '0'.repeat(64)], { encoding: 'utf8' });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Eita!');
  });

  it('sem o arquivo sai 1', () => {
    expect(spawnSync(process.execPath, [SCRIPT], { encoding: 'utf8' }).status).toBe(1);
  });
});
