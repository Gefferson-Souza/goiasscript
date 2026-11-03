import { describe, expect, it } from 'vitest';
import { EXIT_CODE } from '../src/exit-codes.constants.ts';
import { runCli } from '../src/run-cli.ts';
import { brandName, colorEnabled, paint } from '../src/terminal/brand-colors.ts';
import { ANSI } from '../src/terminal/brand-colors.constants.ts';
import { createFakeProcessHost } from './support/fake-process-host.ts';
import { createMemoryIo } from './support/memory-io.ts';

const ESCAPE = '\u001b[';

describe('cores do terminal', () => {
  it('só pinta em terminal de verdade', () => {
    expect(colorEnabled({ isTty: true, variables: {} })).toBe(true);
    expect(colorEnabled({ isTty: false, variables: {} })).toBe(false);
  });

  it('respeita NO_COLOR e terminal burro', () => {
    expect(colorEnabled({ isTty: true, variables: { NO_COLOR: '1' } })).toBe(false);
    expect(colorEnabled({ isTty: true, variables: { TERM: 'dumb' } })).toBe(false);
    expect(colorEnabled({ isTty: true, variables: { NO_COLOR: '' } })).toBe(true);
  });

  it('o nome sai com Goiás em pequi e volta ao normal depois', () => {
    expect(brandName(false)).toBe('GoiásScript');
    expect(brandName(true)).toBe(`${ANSI.pequiBold}Goiás${ANSI.reset}Script`);
    expect(paint('oi', ANSI.pequiBold, false)).toBe('oi');
  });
});

describe('cores nos comandos', () => {
  const runIn = async (argv: readonly string[], terminal: boolean, variables: Readonly<Record<string, string>> = {}) => {
    const io = createMemoryIo({ terminal, variables });
    const code = await runCli(argv, io, { processHost: createFakeProcessHost() });
    return { code, text: io.stdoutText() };
  };

  it('dedo_de_prosa pinta o nome no terminal', async () => {
    const { code, text } = await runIn(['dedo_de_prosa'], true);
    expect(code).toBe(EXIT_CODE.ok);
    expect(text.startsWith(brandName(true))).toBe(true);
  });

  it('dedo_de_prosa sai sem cor em pipe e com NO_COLOR', async () => {
    expect((await runIn(['dedo_de_prosa'], false)).text).not.toContain(ESCAPE);
    expect((await runIn(['dedo_de_prosa'], true, { NO_COLOR: '1' })).text).not.toContain(ESCAPE);
  });

  it('arma_o_barraco pinta a manchete de sucesso no terminal', async () => {
    const { code, text } = await runIn(['arma_o_barraco', 'meu-trem'], true);
    expect(code).toBe(EXIT_CODE.ok);
    expect(text.startsWith(ANSI.pequiBold)).toBe(true);
    expect(text).toContain('cd meu-trem');
  });
});
