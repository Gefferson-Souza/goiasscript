import { afterAll, describe, expect, it } from 'vitest';
import { cleanupWorkspaces, runShim } from './support/tarball.ts';

afterAll(cleanupWorkspaces);

describe('atalho instalado em node_modules/.bin', () => {
  it('goiasscript dedo_de_prosa sai com 0 e mostra a versão', async () => {
    const run = await runShim('goiasscript', ['dedo_de_prosa']);
    expect(run.exitCode).toBe(0);
    expect(run.stdout).toContain('GoiásScript');
  });
});
