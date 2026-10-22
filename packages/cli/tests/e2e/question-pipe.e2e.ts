import { afterAll, describe, expect, it } from 'vitest';
import { findForbiddenEnglish } from './support/forbidden-english.ts';
import { cleanupWorkspaces, fixture, runInstalled, startInstalled } from './support/tarball.ts';

afterAll(cleanupWorkspaces);

const PROGRAM = 'uai nome é pergunta("Nome?")\nuai cidade é pergunta("Cidade?")\nprosa(nome mais " de " mais cidade)\n';
const EXPECTED_ANSWER = 'Ana de Goiânia\n';
const SECOND_LINE_DELAY_MS = 300;
const MAX_CLOSE_DELAY_MS = 1000;
const STARTUP_GRACE_MS = 1500;
const EXIT_RUNTIME = 2;
const EXIT_SIGPIPE_LIKE = 13;
const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

describe('pergunta com stdin em pipe', () => {
  it.each([
    ['LF', 'Ana\nGoiânia\n'],
    ['CRLF', 'Ana\r\nGoiânia\r\n'],
  ])('tudo de uma vez com %s', async (_label, input) => {
    const dir = fixture({ 'p.gs': PROGRAM });
    const run = await runInstalled(['bota_pra_moer', 'p.gs'], { cwd: dir, input });
    expect(run.exitCode).toBe(0);
    expect(run.stdout.endsWith(EXPECTED_ANSWER)).toBe(true);
    expect(findForbiddenEnglish(run.stdout + run.stderr)).toEqual([]);
  });

  it('segunda linha escrita 300 ms depois', async () => {
    const dir = fixture({ 'p.gs': PROGRAM });
    const running = await startInstalled(['bota_pra_moer', 'p.gs'], { cwd: dir });
    running.stdin.write('Ana\n');
    await sleep(SECOND_LINE_DELAY_MS);
    running.stdin.end('Goiânia\n');
    const run = await running.result;
    expect(run.exitCode).toBe(0);
    expect(run.stdout.endsWith(EXPECTED_ANSWER)).toBe(true);
    expect(findForbiddenEnglish(run.stdout + run.stderr)).toEqual([]);
  });

  it('com o escritor aberto, fecha logo depois da última resposta', async () => {
    const dir = fixture({ 'p.gs': PROGRAM });
    const running = await startInstalled(['bota_pra_moer', 'p.gs'], { cwd: dir });
    await sleep(STARTUP_GRACE_MS);
    running.stdin.write('Ana\nGoiânia\n');
    const answeredAt = Date.now();
    const run = await running.result;
    const closedAfterMs = Date.now() - answeredAt;
    running.stdin.end();
    expect(run.exitCode).toBe(0);
    expect(closedAfterMs).toBeLessThan(MAX_CLOSE_DELAY_MS);
    expect(run.stdout.endsWith(EXPECTED_ANSWER)).toBe(true);
    expect(findForbiddenEnglish(run.stdout + run.stderr)).toEqual([]);
  });

  it('uma linha só e fim de entrada dá GS0702 com exit 2', async () => {
    const dir = fixture({ 'p.gs': PROGRAM });
    const run = await runInstalled(['bota_pra_moer', 'p.gs'], { cwd: dir, input: 'Ana\n' });
    expect(run.exitCode).toBe(EXIT_RUNTIME);
    expect(run.exitCode).not.toBe(EXIT_SIGPIPE_LIKE);
    expect(run.stderr).toContain('GS0702');
    expect(findForbiddenEnglish(run.stdout + run.stderr)).toEqual([]);
  });
});
