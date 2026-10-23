import { describe, expect, it } from 'vitest';
import { MAX_LOG_MESSAGE_CHARS } from '../sandbox/protocol.constants.ts';
import { runProgram } from '../sandbox/run-program.ts';
import type { RunnerToHost } from '../sandbox/protocol.types.ts';

interface Harness {
  readonly posted: RunnerToHost[];
  readonly scope: Record<string, unknown>;
  readonly imported: string[];
  run(importModule: (url: string) => Promise<unknown>, scopeBody?: (scope: Record<string, unknown>) => void): Promise<void>;
}

function createHarness(): Harness {
  const posted: RunnerToHost[] = [];
  const scope: Record<string, unknown> = { console: { log: () => 'original' } };
  const imported: string[] = [];
  return {
    posted,
    scope,
    imported,
    run: async (importModule, scopeBody) => {
      await runProgram(
        { postMessage: (message) => posted.push(message) },
        { type: 'gs:executar', runId: 4, code: 'export {};' },
        {
          scope,
          importModule: (url) => {
            imported.push(url);
            scopeBody?.(scope);
            return importModule(url);
          },
        },
      );
    },
  };
}

const consoleOf = (scope: Record<string, unknown>) => scope['console'] as Record<string, (...values: unknown[]) => void>;

describe('execução do programa no Worker', () => {

  it('importa o código por URL de blob e responde gs:terminou', async () => {
    const harness = createHarness();
    await harness.run(() => Promise.resolve({}));
    expect(harness.imported).toHaveLength(1);
    expect(harness.imported[0]).toMatch(/^blob:/u);
    expect(harness.posted).toEqual([{ type: 'gs:terminou', runId: 4 }]);
  });

  it('revoga a URL do blob depois de importar, com sucesso ou falha', async () => {
    const revoked: string[] = [];
    const original = URL.revokeObjectURL.bind(URL);
    URL.revokeObjectURL = (url: string) => {
      revoked.push(url);
      original(url);
    };
    try {
      const harness = createHarness();
      await harness.run(() => Promise.reject(new Error('x')));
      expect(revoked).toEqual(harness.imported);
    } finally {
      URL.revokeObjectURL = original;
    }
  });

  it('o coletor leva log, info e debug para out e warn e error para err', async () => {
    const harness = createHarness();
    await harness.run(
      () => {
        const target = consoleOf(harness.scope);
        target['log']?.('a');
        target['info']?.('b');
        target['debug']?.('c');
        target['warn']?.('d');
        target['error']?.('e');
        return Promise.resolve({});
      },
    );
    const logs = harness.posted.filter((message) => message.type === 'gs:log');
    expect(logs.map((message) => [message.stream, message.text])).toEqual([
      ['out', 'a'],
      ['out', 'b'],
      ['out', 'c'],
      ['err', 'd'],
      ['err', 'e'],
    ]);
    expect(logs.every((message) => message.runId === 4)).toBe(true);
  });

  it('formata os valores como o prosa do CLI', async () => {
    const harness = createHarness();
    await harness.run(() => {
      consoleOf(harness.scope)['log']?.(null, undefined, 'texto', 7, { a: 1 }, [1, 2], true, 'x');
      return Promise.resolve({});
    });
    const log = harness.posted.find((message) => message.type === 'gs:log');
    expect(log).toMatchObject({ text: 'nada indefinido texto 7 {"a":1} [1,2] true x' });
  });

  it('valor que não vira JSON não derruba o runner', async () => {
    const harness = createHarness();
    const circular: Record<string, unknown> = {};
    circular['self'] = circular;
    await harness.run(() => {
      consoleOf(harness.scope)['log']?.(circular, 10n, Symbol('s'));
      return Promise.resolve({});
    });
    expect(harness.posted.map((message) => message.type)).toEqual(['gs:log', 'gs:terminou']);
  });

  it('o console do programa é outro objeto, congelado, sem o original', async () => {
    const harness = createHarness();
    const original = harness.scope['console'];
    await harness.run(() => Promise.resolve({}));
    const replaced = harness.scope['console'];
    expect(replaced).not.toBe(original);
    expect(Object.isFrozen(replaced)).toBe(true);
    expect(Object.keys(replaced as object).sort()).toEqual(['debug', 'error', 'info', 'log', 'warn']);
  });

  it('o console não pode ser trocado de volta pelo programa', async () => {
    const harness = createHarness();
    Object.defineProperty(harness.scope, 'console', { value: harness.scope['console'], writable: true, configurable: true });
    await harness.run(() => Promise.resolve({}));
    expect(() => Object.defineProperty(harness.scope, 'console', { value: 1 })).toThrow(TypeError);
  });

  it('erro de execução vira gs:falhou com pilha e nome', async () => {
    const harness = createHarness();
    const error = new TypeError('quebrou');
    await harness.run(() => Promise.reject(error));
    expect(harness.posted).toEqual([{ type: 'gs:falhou', runId: 4, stack: error.stack ?? '', errorName: 'TypeError' }]);
  });

  it('leva o código e a linha da trava de laço', async () => {
    const harness = createHarness();
    const error = Object.assign(new Error('GS0701'), { gsCode: 'GS0701', gsLine: 7 });
    await harness.run(() => Promise.reject(error));
    expect(harness.posted[0]).toMatchObject({ type: 'gs:falhou', gsCode: 'GS0701', gsLine: 7 });
  });

  it('rejeição com valor que não é Error vira gs:falhou genérico, sem lançar', async () => {
    const harness = createHarness();
    // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors -- o teste exige rejeição que não é Error
    await harness.run(() => Promise.reject({ anything: 'value' }));
    expect(harness.posted).toEqual([{ type: 'gs:falhou', runId: 4, stack: '', errorName: 'Error' }]);
  });

  it('rejeição com texto usa o texto como pilha', async () => {
    const harness = createHarness();
    // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors -- o teste exige rejeição que não é Error
    await harness.run(() => Promise.reject('deu ruim'));
    expect(harness.posted).toEqual([{ type: 'gs:falhou', runId: 4, stack: 'deu ruim', errorName: 'Error' }]);
  });

  it('corta no Worker o texto de um log gigante antes de enviar ao host', async () => {
    const harness = createHarness();
    await harness.run(() => Promise.resolve(consoleOf(harness.scope)['log']?.('x'.repeat(MAX_LOG_MESSAGE_CHARS * 3))));
    const logs = harness.posted.filter((message) => message.type === 'gs:log');
    expect(logs).toHaveLength(1);
    expect(logs[0]?.type === 'gs:log' ? logs[0].text.length : 0).toBe(MAX_LOG_MESSAGE_CHARS);
  });

  it('não corta log que cabe no teto de transporte', async () => {
    const harness = createHarness();
    await harness.run(() => Promise.resolve(consoleOf(harness.scope)['log']?.('x'.repeat(MAX_LOG_MESSAGE_CHARS))));
    const log = harness.posted.find((message) => message.type === 'gs:log');
    expect(log?.type === 'gs:log' ? log.text.length : 0).toBe(MAX_LOG_MESSAGE_CHARS);
  });

  it('limita o texto final quando vários argumentos somam mais que o teto', async () => {
    const harness = createHarness();
    const big = 'y'.repeat(MAX_LOG_MESSAGE_CHARS);
    await harness.run(() => Promise.resolve(consoleOf(harness.scope)['log']?.(big, big, big, 'fim')));
    const logs = harness.posted.filter((message) => message.type === 'gs:log');
    expect(logs[0]?.type === 'gs:log' ? logs[0].text.length : 0).toBe(MAX_LOG_MESSAGE_CHARS);
  });

  it('mantém o separador entre argumentos curtos', async () => {
    const harness = createHarness();
    await harness.run(() => Promise.resolve(consoleOf(harness.scope)['log']?.('a', 1, null)));
    const log = harness.posted.find((message) => message.type === 'gs:log');
    expect(log?.type === 'gs:log' ? log.text : '').toBe('a 1 nada');
  });

  it('limita o texto de um objeto grande', async () => {
    const harness = createHarness();
    const bigObject = { payload: 'z'.repeat(MAX_LOG_MESSAGE_CHARS * 2) };
    await harness.run(() => Promise.resolve(consoleOf(harness.scope)['error']?.(bigObject)));
    const log = harness.posted.find((message) => message.type === 'gs:log');
    expect(log?.type === 'gs:log' ? log.text.length : 0).toBe(MAX_LOG_MESSAGE_CHARS);
  });
});
