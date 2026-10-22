import { explainDiagnostic } from '@goiasscript/compiler';
import { DIAGNOSTICS } from '@goiasscript/language';
import { describe, expect, it } from 'vitest';
import { EXIT_CODE } from '../src/exit-codes.constants.ts';
import { runCli } from '../src/run-cli.ts';
import { createFakeProcessHost } from './support/fake-process-host.ts';
import { createMemoryIo } from './support/memory-io.ts';

const run = async (argv: readonly string[]) => {
  const io = createMemoryIo();
  const code = await runCli(argv, io, { processHost: createFakeProcessHost() });
  return { io, code };
};

describe('explica com um código', () => {
  it('mostra título, explicação, exemplo e lição', async () => {
    const { io, code } = await run(['explica', 'GS0301']);
    const expected = explainDiagnostic('GS0301', 'raiz');
    expect(code).toBe(EXIT_CODE.ok);
    expect(io.stdoutText()).toContain('GS0301');
    expect(io.stdoutText()).toContain('Nome não declarado');
    expect(io.stdoutText()).toContain(expected?.explanation);
    expect(io.stdoutText()).toContain('prosa(nomi)');
    expect(io.stderrText()).toBe('');
  });
  it('mostra a lição do catálogo quando existe', async () => {
    const { io } = await run(['explica', 'GS0306']);
    expect(io.stdoutText()).toContain('Lição: o-que-mudou');
  });
  it.each(['gs0301', '0301', 'Gs0301', 'GS0301'])('aceita "%s" como GS0301', async (typed) => {
    const { io, code } = await run(['explica', typed]);
    expect(code).toBe(EXIT_CODE.ok);
    expect(io.stdoutText()).toContain('Nome não declarado');
  });
  it('usa a explicação neutra com --tom neutro', async () => {
    const { io } = await run(['explica', 'GS0302', '--tom', 'neutro']);
    expect(io.stdoutText()).toContain(explainDiagnostic('GS0302', 'neutro')?.explanation);
    expect(io.stdoutText()).not.toContain('Ô sô');
  });
  it('indenta o exemplo de várias linhas', async () => {
    const { io } = await run(['explica', 'GS0302']);
    expect(io.stdoutText()).toContain('  uai x é 1\n  x é 2');
  });
  it('mostra texto neutro de lição quando o catálogo não tem lição', async () => {
    const { io } = await run(['explica', 'GS0301']);
    expect(io.stdoutText()).toContain('Lição: sem lição específica, dá uma olhada na cartilha geral.');
  });
});

describe('explica sem argumento', () => {
  it('lista código e título de todos os diagnósticos', async () => {
    const { io, code } = await run(['explica']);
    const lines = io.stdoutText().split('\n').filter((line) => /^GS\d{4} {2}\S/u.test(line));
    expect(code).toBe(EXIT_CODE.ok);
    expect(lines).toHaveLength(DIAGNOSTICS.length);
    expect(lines).toContain('GS0301  Nome não declarado');
  });
});

describe('explica com código inexistente', () => {
  it('GS9999 é GS0905 com exit 3 e nada no stdout', async () => {
    const { io, code } = await run(['explica', 'GS9999']);
    expect(code).toBe(EXIT_CODE.usage);
    expect(io.stderrText()).toContain('GS0905');
    expect(io.stderrText()).toContain('GS9999');
    expect(io.stdoutText()).toBe('');
  });
  it('GS030 sugere GS0301', async () => {
    const { io, code } = await run(['explica', 'GS030']);
    expect(code).toBe(EXIT_CODE.usage);
    expect(io.stderrText()).toContain('Cê quis dizer "GS0301"?');
  });
  it('a sugestão sai neutra com --tom neutro', async () => {
    const { io } = await run(['explica', 'GS030', '--tom', 'neutro']);
    expect(io.stderrText()).toContain('Você quis dizer "GS0301"?');
  });
  it('texto sem número não adivinha nada', async () => {
    const { io, code } = await run(['explica', 'nome']);
    expect(code).toBe(EXIT_CODE.usage);
    expect(io.stderrText()).not.toContain('quis dizer');
  });
  it('escapa controle vindo do argumento', async () => {
    const { io } = await run(['explica', 'GS\u001b[31m']);
    expect(io.stderrText()).not.toContain('\u001b');
  });
});
