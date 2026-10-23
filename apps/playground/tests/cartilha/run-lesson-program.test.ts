import { existsSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { runLessonProgram } from '../../lib/cartilha/run-lesson-program.ts';

const roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe('runLessonProgram', () => {
  it('devolve stdout, stderr e o código de saída', async () => {
    const result = await runLessonProgram('console.log("oi"); console.error("ai"); process.exitCode = 3;', '', {});
    expect(result).toEqual({ stdout: 'oi\n', stderr: 'ai\n', exitCode: 3, timedOut: false });
  });

  it('entrega o stdin ao programa', async () => {
    const code = 'let t = ""; for await (const c of process.stdin) t += c; console.log(t.trim().toUpperCase());';
    expect((await runLessonProgram(code, 'pequi\n', {})).stdout).toBe('PEQUI\n');
  });

  it('estoura o tempo e devolve timedOut', async () => {
    const started = Date.now();
    const result = await runLessonProgram('setInterval(() => {}, 1000);', '', { timeoutMs: 300 });
    expect(result.timedOut).toBe(true);
    expect(result.exitCode).toBeNull();
    expect(Date.now() - started).toBeLessThan(8000);
  });

  it('nome de arquivo não passa pelo shell', async () => {
    const base = mkdtempSync(join(tmpdir(), 'cartilha-run-'));
    roots.push(base);
    const hostile = join(base, "a b; touch pwned; $(touch pwned) '");
    mkdirSync(hostile);
    const result = await runLessonProgram('console.log("ok");', '', { baseDir: hostile });
    expect(result.stdout).toBe('ok\n');
    expect(existsSync(join(base, 'pwned'))).toBe(false);
    expect(existsSync(join(hostile, 'pwned'))).toBe(false);
  });

  it('roda com ambiente mínimo e apaga a pasta temporária', async () => {
    const base = mkdtempSync(join(tmpdir(), 'cartilha-run-'));
    roots.push(base);
    process.env['GS_LESSON_SEGREDO'] = 'nao-pode-vazar';
    const result = await runLessonProgram('console.log(process.env.GS_LESSON_SEGREDO ?? "limpo");', '', { baseDir: base });
    delete process.env['GS_LESSON_SEGREDO'];
    expect(result.stdout).toBe('limpo\n');
    const { readdirSync } = await import('node:fs');
    expect(readdirSync(base)).toEqual([]);
  });
});
