import { PassThrough } from 'node:stream';
import { describe, expect, it } from 'vitest';
import { HISTORY_LIMIT } from '../src/repl/repl.constants.ts';
import { runGoias } from '../src/repl/run-goias.ts';
import { createMemoryIo } from './support/memory-io.ts';

const SMALL_LINE_COUNT = 10_000;
const LARGE_LINE_COUNT = 20_000;
const MAX_GROWTH_RATIO = 3.5;
// A razão entre tamanhos prova a linearidade; o teto absoluto só barra desastre e precisa caber na máquina da CI.
const MAX_SECONDS = 8;
const WARMUP_LINE_COUNT = 500;
const SAMPLES_PER_SIZE = 3;
const HUGE_IDENTIFIER_LENGTH = 3_000_000;
const MILLISECONDS_PER_SECOND = 1000;

const pipedIo = (stdin: string) => {
  const input = new PassThrough();
  const output = new PassThrough();
  const io = { ...createMemoryIo(), streams: { input, output, isTty: false } };
  input.end(stdin);
  return io;
};

const timeRun = async (stdin: string): Promise<{ readonly seconds: number; readonly stdout: string }> => {
  const io = pipedIo(stdin);
  const start = performance.now();
  await runGoias(['--tom=neutro'], io);
  return { seconds: (performance.now() - start) / MILLISECONDS_PER_SECOND, stdout: io.stdoutText() };
};

const bestOf = async (stdin: string): Promise<{ readonly seconds: number; readonly stdout: string }> => {
  const runs = [];
  for (let sample = 0; sample < SAMPLES_PER_SIZE; sample += 1) runs.push(await timeRun(stdin));
  return runs.reduce((best, run) => (run.seconds < best.seconds ? run : best));
};

describe('roda de prosa em escala', () => {
  it('cresce de forma linear com o número de linhas por pipe', async () => {
    await timeRun('prosa(1)\n'.repeat(WARMUP_LINE_COUNT));
    const small = await bestOf('prosa(1)\n'.repeat(SMALL_LINE_COUNT));
    const large = await bestOf('prosa(1)\n'.repeat(LARGE_LINE_COUNT));
    expect(large.stdout).toBe('1\n'.repeat(LARGE_LINE_COUNT));
    expect(large.seconds).toBeLessThanOrEqual(MAX_SECONDS);
    expect(large.seconds / small.seconds).toBeLessThan(MAX_GROWTH_RATIO);
  }, 60_000);

  it('responde a uma linha de 3 MB sem pilha do motor', async () => {
    const run = await timeRun(`${'a'.repeat(HUGE_IDENTIFIER_LENGTH)}\n.vaza\n`);
    expect(run.seconds).toBeLessThanOrEqual(MAX_SECONDS);
    expect(run.stdout).not.toMatch(/\bat .*\.(ts|js):\d+/u);
  }, 30_000);

  it('pergunta no meio do fluxo recebe a linha seguinte como resposta', async () => {
    const run = await timeRun('prosa(1)\nuai n é pergunta("Nome?")\nAna\nprosa(n)\nprosa(2)\n');
    expect(run.stdout).toBe('1\nNome? Ana\n2\n');
  });

  it('guarda no histórico só as últimas entradas aceitas', async () => {
    const extra = 5;
    const lines = Array.from({ length: HISTORY_LIMIT + extra }, (_, index) => `prosa(${String(index)})\n`).join('');
    const run = await timeRun(`${lines}.lembra_ai\n`);
    const listing = run.stdout.split('\n').filter((line) => /^\d+\s+prosa\(/u.test(line));
    expect(listing).toHaveLength(HISTORY_LIMIT);
    expect(listing[0]).toContain(`prosa(${String(extra)})`);
  });
});
