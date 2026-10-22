import { describe, expect, it } from 'vitest';
import { EXIT_CODE } from '../src/exit-codes.constants.ts';
import { runRepl } from '../src/repl/run-repl.ts';
import { runCli } from '../src/run-cli.ts';
import { VERSION } from '../src/version.ts';
import { createMemoryIo } from './support/memory-io.ts';

describe('esqueleto do cli', () => {
  it('runCli avisa em goianês no stderr e devolve uso incorreto', async () => {
    const io = createMemoryIo();
    expect(await runCli([], io)).toBe(EXIT_CODE.usage);
    expect(io.stdoutText()).toBe('');
    expect(io.stderrText()).toContain(VERSION);
  });

  it('runRepl devolve uso incorreto até a roda de prosa existir', async () => {
    const io = createMemoryIo();
    expect(await runRepl(io)).toBe(EXIT_CODE.usage);
    expect(io.stderrText()).toContain('roda de prosa');
  });
});
