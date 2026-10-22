import { afterAll, describe, expect, it } from 'vitest';
import { findForbiddenEnglish } from './support/forbidden-english.ts';
import { cleanupWorkspaces, fixture, runInstalled } from './support/tarball.ts';

afterAll(cleanupWorkspaces);

const EXIT_RUNTIME = 2;
const PENDING_MESSAGE = 'O programa ficou esperando uma resposta que nunca veio, sô.';

describe('promessa que nunca resolve', () => {
  it('termina com exit 2 e mensagem em goianês', async () => {
    const dir = fixture({ 'pendente.gs': 'espera_um_cadim faz_um Promessa((resolve_aí) => { })\n' });
    const run = await runInstalled(['bota_pra_moer', 'pendente.gs'], { cwd: dir });
    expect(run.exitCode).toBe(EXIT_RUNTIME);
    expect(run.stderr).toContain(PENDING_MESSAGE);
    expect(findForbiddenEnglish(run.stdout + run.stderr)).toEqual([]);
  });
});
