import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { extractNextSteps } from '../../src/scaffold/next-steps.ts';
import { cleanupWorkspaces, fixture, runInstalled } from './support/tarball.ts';

afterAll(cleanupWorkspaces);

const CD_PREFIX = 'cd ';
const CLI_PREFIX = 'goiasscript ';
const PROJECT_NAME = 'meu-projeto';

describe('passos impressos pelo arma_o_barraco', () => {
  it('seguidos à risca, rodam o projeto gerado', async () => {
    const dir = fixture({});
    const scaffold = await runInstalled(['arma_o_barraco', PROJECT_NAME], { cwd: dir });
    expect(scaffold.exitCode).toBe(0);
    const steps = extractNextSteps(scaffold.stdout);
    expect(steps.length).toBeGreaterThan(0);
    let cwd = dir;
    let lastStdout = '';
    for (const step of steps) {
      if (step.startsWith(CD_PREFIX)) {
        cwd = path.resolve(cwd, step.slice(CD_PREFIX.length));
        continue;
      }
      expect(step.startsWith(CLI_PREFIX)).toBe(true);
      const run = await runInstalled(step.slice(CLI_PREFIX.length).split(' '), { cwd });
      expect(run.exitCode).toBe(0);
      lastStdout = run.stdout;
    }
    expect(lastStdout).toBe('Bão, sô! Olá, mundo\n');
  });
});
