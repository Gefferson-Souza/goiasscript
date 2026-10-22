import { PassThrough } from 'node:stream';
import { describe, expect, it } from 'vitest';
import { runGoias } from '../src/repl/run-goias.ts';
import { createMemoryIo } from './support/memory-io.ts';

const pipedIo = (stdin: string) => {
  const input = new PassThrough();
  const output = new PassThrough();
  const io = { ...createMemoryIo(), streams: { input, output, isTty: false } };
  input.end(stdin);
  return io;
};

describe('goias', () => {
  it('recusa argumento que não é --tom com GS0905 e exit 3', async () => {
    const io = createMemoryIo();
    expect(await runGoias(['x.gs'], io)).toBe(3);
    expect(io.stderrText()).toContain('GS0905');
    expect(await runGoias(['--output', 'a'], io)).toBe(3);
  });
  it('recusa tom inexistente', async () => {
    const io = createMemoryIo();
    expect(await runGoias(['--tom', 'xis'], io)).toBe(3);
    expect(io.stderrText()).toContain('"xis"');
  });
  it('em pipe lê as entradas sem prompt nem banner e sai com 0', async () => {
    const io = pipedIo('uai x é 2\nx vezes 3\n');
    expect(await runGoias(['--tom=neutro'], io)).toBe(0);
    expect(io.stdoutText()).toBe('6\n');
  });
  it('em pipe, pergunta sem resposta vira GS0702 e a sessão termina com 0', async () => {
    const io = pipedIo('prosa(pergunta("Nome?"))\n');
    expect(await runGoias([], io)).toBe(0);
    expect(io.stderrText()).toContain('GS0702');
  });
  it('avisa Node antigo com GS0904 e segue', async () => {
    const io = { ...pipedIo(''), env: { ...createMemoryIo({ nodeVersion: '20.0.0' }).env } };
    expect(await runGoias([], io)).toBe(0);
    expect(io.stderrText()).toContain('GS0904');
  });
});
