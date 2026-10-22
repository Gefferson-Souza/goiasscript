import { afterAll, describe, expect, it } from 'vitest';
import { cleanupWorkspaces, getInstallDir, runShim } from './support/tarball.ts';

afterAll(cleanupWorkspaces);

describe('goias com stdin em pipe', () => {
  it('avalia as linhas, imprime 6 e sai com 0 (pelo atalho instalado)', async () => {
    await getInstallDir();
    const run = await runShim('goias', [], { input: 'uai x é 5\nx mais 1\n.vaza\n' });
    expect(run.exitCode).toBe(0);
    expect(run.stdout).toContain('6');
  });
});
