import { setTimeout as delay } from 'node:timers/promises';
import { afterEach, describe, expect, it } from 'vitest';
import { STALE_WORKSPACE_MS } from '../src/run/temp-workspace.constants.ts';
import { backdateWorkspaces, cleanupFixtures, fixture, orphanWorkspaces, runCliProcess, startCliProcess, tmpWithOddName } from './support/run-real-cli.ts';

afterEach(cleanupFixtures);

describe('bota_pra_moer em processo real', () => {
  it('erro de execução aponta a linha do .gs e sai com 2', async () => {
    const dir = fixture({ 'programa.gs': 'uai p é { x: 1 }\nuai o é nada\nprosa(p.x)\nprosa(o.x)\n' });
    const run = await runCliProcess(['bota_pra_moer', 'programa.gs'], { cwd: dir });
    expect(run.exitCode).toBe(2);
    expect(run.stdout).toBe('1\n');
    expect(run.stderr).toContain('programa.gs:4');
    expect(run.stderr).toContain('GS0710');
    expect(run.stderr).not.toMatch(/Cannot read|is not a function|TypeError/u);
  });

  it('diretório temporário com espaço, # e % também funciona', async () => {
    const dir = fixture({ 'a.gs': 'prosa("oi")\n' });
    const odd = tmpWithOddName();
    const run = await runCliProcess(['bota_pra_moer', 'a.gs'], { cwd: dir, env: { TMPDIR: odd, TEMP: odd, TMP: odd } });
    expect([run.exitCode, run.stdout]).toEqual([0, 'oi\n']);
    expect(orphanWorkspaces(odd)).toEqual([]);
  });

  it('promessa pendente: GS0703 em goianês, exit 2 e nenhum aviso em inglês', async () => {
    const dir = fixture({ 'p.gs': 'espera_um_cadim faz_um Promessa((resolve_aí) => { })\n' });
    const run = await runCliProcess(['bota_pra_moer', 'p.gs'], { cwd: dir });
    expect(run.exitCode).toBe(2);
    expect(run.stderr).toContain('GS0703');
    expect(run.stderr).not.toMatch(/Warning|unsettled/u);
  });

  it('pergunta sem entrada: GS0702, exit 2 e nada de stack', async () => {
    const dir = fixture({ 'q.gs': 'uai a é espera_um_cadim pergunta("nome?")\nprosa(a)\n' });
    const run = await runCliProcess(['bota_pra_moer', 'q.gs'], { cwd: dir });
    expect(run.exitCode).toBe(2);
    expect(run.stderr).toContain('GS0702');
    expect(run.stderr).not.toMatch(/\bat \S+ \(|node:internal/u);
  });

  it('erro de compilação sai com 1 e não executa nada', async () => {
    const dir = fixture({ 'e.gs': 'prosa(nomi)\n' });
    const run = await runCliProcess(['bota_pra_moer', 'e.gs'], { cwd: dir });
    expect([run.exitCode, run.stdout]).toEqual([1, '']);
  });

  it('laço infinito não termina sozinho: GS0802 antes, kill encerra, órfão é varrido', async () => {
    const dir = fixture({ 'laco.gs': 'enquanto_tiver (certeza) {\n}\n' });
    const child = startCliProcess(['bota_pra_moer', 'laco.gs'], { cwd: dir });
    await delay(1500);
    expect(child.exited()).toBe(false);
    expect(child.stderr()).toContain('GS0802');
    child.kill();
    await child.closed;
    expect(orphanWorkspaces(child.tmpDir)).toHaveLength(1);
    backdateWorkspaces(child.tmpDir, STALE_WORKSPACE_MS + 1000);
    const next = await runCliProcess(['bota_pra_moer', 'ok.gs'], { cwd: fixture({ 'ok.gs': 'prosa(1)\n' }), env: { TMPDIR: child.tmpDir, TEMP: child.tmpDir, TMP: child.tmpDir } });
    expect(next.exitCode).toBe(0);
    expect(orphanWorkspaces(child.tmpDir)).toEqual([]);
  });
});
