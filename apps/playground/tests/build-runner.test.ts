import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { RUNNER_MAX_BYTES } from '../sandbox/protocol.constants.ts';
import { buildRunner } from '../scripts/build-runner.ts';

let directory = '';
let bundle = '';

beforeAll(async () => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), 'gs-runner-'));
  const outFile = path.join(directory, 'sandbox', 'runner.js');
  await buildRunner({ outFile });
  bundle = fs.readFileSync(outFile, 'utf8');
});

afterAll(() => {
  fs.rmSync(directory, { recursive: true, force: true });
});

describe('build do runner', () => {
  it('gera um módulo único, sem dependência externa', () => {
    expect(bundle).not.toMatch(/@goiasscript\//u);
    expect(bundle).not.toMatch(/node:/u);
    expect(bundle).not.toMatch(/^\s*import\s[^(]/mu);
  });

  it('só importa por URL de blob criada em tempo de execução', () => {
    expect(bundle).not.toMatch(/import\(\s*["'`]/u);
  });

  it('fica dentro do teto de tamanho', () => {
    expect(Buffer.byteLength(bundle)).toBeLessThanOrEqual(RUNNER_MAX_BYTES);
  });

  it('liga o recebimento de mensagens', () => {
    expect(bundle).toContain('gs:executar');
    expect(bundle).toContain('addEventListener');
  });
});
