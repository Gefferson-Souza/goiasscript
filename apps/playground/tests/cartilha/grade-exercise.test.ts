import type { Diagnostic } from '@goiasscript/compiler';
import { describe, expect, it, vi } from 'vitest';
import type { CompileView } from '../../lib/compile-service.types.ts';
import { gradeExercise, normalizeStdout } from '../../lib/cartilha/grade-exercise.ts';
import type { GradeRequest } from '../../lib/cartilha/grade-exercise.types.ts';
import type { RunEvent, RunnerClient } from '../../lib/run/runner-client.types.ts';

const compiledView = { result: { ok: true, code: 'x', diagnostics: [] } } as unknown as CompileView;
const failedDiagnostic = { code: 'GS0208', severity: 'error', message: 'decimal com vírgula', range: { start: { line: 0, column: 0 } } } as unknown as Diagnostic;
const failedView = { result: { ok: false, diagnostics: [failedDiagnostic] } } as unknown as CompileView;

interface FakeRunner {
  readonly runner: Pick<RunnerClient, 'run' | 'answer' | 'stop'>;
  readonly answers: string[];
  readonly stop: ReturnType<typeof vi.fn>;
  readonly run: ReturnType<typeof vi.fn>;
}

// Cada pedaço de eventos sai quando o programa começa ou quando a pergunta anterior é respondida.
function fakeRunner(chunks: readonly (readonly RunEvent[])[]): FakeRunner {
  const answers: string[] = [];
  let index = 0;
  let emit: (event: RunEvent) => void = () => undefined;
  const flush = (): void => {
    const chunk = chunks[index] ?? [];
    index += 1;
    for (const event of chunk) emit(event);
  };
  const run = vi.fn((_request: unknown, onEvent: (event: RunEvent) => void) => {
    emit = onEvent;
    flush();
  });
  const stop = vi.fn();
  const answer = (value: string): void => {
    answers.push(value);
    flush();
  };
  return { runner: { run, answer, stop }, answers, stop, run };
}

const request = (overrides: Partial<GradeRequest['exercise']> = {}): GradeRequest => ({
  source: 'prosa("Olá, Goiás!")',
  exercise: { expectedStdout: 'Olá, Goiás!', ...overrides },
});

describe('normalização da saída', () => {
  it('troca CRLF, tira espaço no fim da linha e as linhas vazias finais', () => {
    expect(normalizeStdout('a  \r\nb\t\r\n\r\n')).toBe('a\nb');
  });
});

describe('correção do exercício', () => {
  it('acerta quando a saída bate ignorando CRLF e espaço no fim da linha', async () => {
    const { runner } = fakeRunner([[{ kind: 'out', text: 'Olá, Goiás!   ' }, { kind: 'finished' }]]);
    const result = await gradeExercise(request({ expectedStdout: 'Olá, Goiás!\r\n' }), { compile: () => Promise.resolve(compiledView), runner });
    expect(result.verdict).toBe('correct');
  });

  it('erra e devolve a saída obtida', async () => {
    const { runner } = fakeRunner([[{ kind: 'out', text: 'Oi' }, { kind: 'out', text: 'sô' }, { kind: 'finished' }]]);
    const result = await gradeExercise(request(), { compile: () => Promise.resolve(compiledView), runner });
    expect(result).toMatchObject({ verdict: 'wrong', actualStdout: 'Oi\nsô', expectedStdout: 'Olá, Goiás!' });
  });

  it('responde as perguntas com as linhas de stdin na ordem', async () => {
    const fake = fakeRunner([
      [{ kind: 'ask', prompt: 'nome?' }],
      [{ kind: 'ask', prompt: 'idade?' }],
      [{ kind: 'out', text: 'Zé 30' }, { kind: 'finished' }],
    ]);
    const result = await gradeExercise(request({ expectedStdout: 'Zé 30', stdin: ['Zé', '30'] }), { compile: () => Promise.resolve(compiledView), runner: fake.runner });
    expect(fake.answers).toEqual(['Zé', '30']);
    expect(result.verdict).toBe('correct');
  });

  it('run-failed quando o programa pergunta mais do que o stdin tem', async () => {
    const fake = fakeRunner([[{ kind: 'ask', prompt: 'nome?' }]]);
    const result = await gradeExercise(request({ stdin: [] }), { compile: () => Promise.resolve(compiledView), runner: fake.runner });
    expect(result.verdict).toBe('run-failed');
    expect(result.reason).toContain('perguntou');
    expect(fake.stop).toHaveBeenCalledTimes(1);
  });

  it('compile-failed com o diagnóstico, sem rodar', async () => {
    const fake = fakeRunner([]);
    const result = await gradeExercise(request(), { compile: () => Promise.resolve(failedView), runner: fake.runner });
    expect(result).toMatchObject({ verdict: 'compile-failed', diagnostic: failedDiagnostic });
    expect(fake.run).not.toHaveBeenCalled();
  });

  it('compile-failed quando a compilação lança', async () => {
    const fake = fakeRunner([]);
    const result = await gradeExercise(request(), { compile: () => Promise.reject(new Error('boom')), runner: fake.runner });
    expect(result.verdict).toBe('compile-failed');
    expect(fake.run).not.toHaveBeenCalled();
  });

  it('timeout do runner vira timeout', async () => {
    const { runner } = fakeRunner([[{ kind: 'out', text: 'a' }, { kind: 'timeout' }]]);
    const result = await gradeExercise(request(), { compile: () => Promise.resolve(compiledView), runner });
    expect(result.verdict).toBe('timeout');
  });

  it('falha de execução vira run-failed com a mensagem do diagnóstico', async () => {
    const { runner } = fakeRunner([[{ kind: 'failed', diagnostic: failedDiagnostic }]]);
    const result = await gradeExercise(request(), { compile: () => Promise.resolve(compiledView), runner });
    expect(result).toMatchObject({ verdict: 'run-failed', reason: failedDiagnostic.message });
  });

  it('parada do programa vira run-failed e o erro do programa não entra na saída', async () => {
    const { runner } = fakeRunner([[{ kind: 'err', text: 'barulho' }, { kind: 'stopped' }]]);
    const result = await gradeExercise(request(), { compile: () => Promise.resolve(compiledView), runner });
    expect(result.verdict).toBe('run-failed');
    expect(result.actualStdout).toBe('');
  });

  it('saída cortada pelo limite nunca conta como acerto', async () => {
    const { runner } = fakeRunner([[{ kind: 'out', text: 'Olá, Goiás!' }, { kind: 'truncated', reason: 'lines' }, { kind: 'finished' }]]);
    const result = await gradeExercise(request(), { compile: () => Promise.resolve(compiledView), runner });
    expect(result.verdict).toBe('wrong');
  });
});
