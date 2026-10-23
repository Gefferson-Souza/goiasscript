import type { CompileResult, Diagnostic } from '@goiasscript/compiler';
import { describe, expect, it } from 'vitest';
import { createLiveDiagnostics } from '../src/diagnostics/live-diagnostics.ts';
import type { TimerApi } from '../src/diagnostics/live-diagnostics.types.ts';
import { MAX_DIAGNOSTICS_PER_DOCUMENT, MAX_DOCUMENT_LENGTH } from '../src/diagnostics/diagnostics.constants.ts';
import { createFakeHost } from './support/fake-host.ts';
import type { FakeHost } from './support/fake-host.types.ts';

const URI = 'file:///work/programa.gs';
const DELAY = 300;
const CLEAN_SOURCE = 'uai a é 1';
const BROKEN_SOURCE = 'uai a é 1\nconst b é 2';

interface FakeClock extends TimerApi {
  advance(ms: number): void;
  pending(): number;
}

function createClock(): FakeClock {
  let now = 0;
  let nextId = 0;
  const scheduled = new Map<number, { readonly at: number; readonly callback: () => void }>();
  return {
    set: (callback, delayMs) => {
      nextId += 1;
      scheduled.set(nextId, { at: now + delayMs, callback });
      return nextId;
    },
    clear: (handle) => {
      scheduled.delete(handle as number);
    },
    advance: (ms) => {
      now += ms;
      for (const [id, entry] of [...scheduled]) {
        if (entry.at > now) continue;
        scheduled.delete(id);
        entry.callback();
      }
    },
    pending: () => scheduled.size,
  };
}

function setup(compileImpl?: (text: string) => CompileResult | Promise<CompileResult>): { host: FakeHost; clock: FakeClock } {
  const host = createFakeHost({ settings: { diagnosticsDelayMs: DELAY } });
  const clock = createClock();
  createLiveDiagnostics({ host, timers: clock, ...(compileImpl === undefined ? {} : { compile: compileImpl }) });
  return { host, clock };
}

const flush = (): Promise<void> => new Promise((resolve) => { setImmediate(resolve); });

function failure(count: number): CompileResult {
  const diagnostics: Diagnostic[] = Array.from({ length: count }, (_value, index) => ({
    code: 'GS0401',
    severity: 'error',
    range: { start: { offset: index, line: index + 1, column: 1 }, end: { offset: index + 1, line: index + 1, column: 2 } },
    message: `erro ${String(index)}`,
  }));
  return { ok: false, diagnostics, incomplete: false };
}

describe('diagnósticos em tempo real', () => {
  it('recompila uma vez só ao fim do atraso quando há várias alterações seguidas', async () => {
    let calls = 0;
    const { host, clock } = setup((text) => {
      calls += 1;
      return failure(text.length > 0 ? 1 : 0);
    });
    host.emit({ kind: 'changed', document: host.makeDocument({ version: 1, text: 'a' }) });
    clock.advance(100);
    host.emit({ kind: 'changed', document: host.makeDocument({ version: 2, text: 'ab' }) });
    clock.advance(DELAY - 1);
    await flush();
    expect(calls).toBe(0);
    clock.advance(1);
    await flush();
    expect(calls).toBe(1);
    expect(host.diagnostics.get(URI)).toHaveLength(1);
  });

  it('compila um documento aberto e publica o resultado real do compilador', async () => {
    const { host, clock } = setup();
    host.emit({ kind: 'opened', document: host.makeDocument({ text: BROKEN_SOURCE }) });
    clock.advance(DELAY);
    await flush();
    expect(host.diagnostics.get(URI)?.[0]).toMatchObject({ code: 'GS0401', startLine: 1, startCharacter: 0 });
  });

  it('publica lista vazia para programa sem erro', async () => {
    const { host, clock } = setup();
    host.emit({ kind: 'opened', document: host.makeDocument({ text: CLEAN_SOURCE }) });
    clock.advance(DELAY);
    await flush();
    expect(host.diagnostics.get(URI)).toEqual([]);
  });

  it('não publica nada quando o documento fecha antes do disparo e limpa o que já havia', async () => {
    const { host, clock } = setup();
    host.emit({ kind: 'opened', document: host.makeDocument({ text: BROKEN_SOURCE }) });
    clock.advance(DELAY);
    await flush();
    expect(host.diagnostics.has(URI)).toBe(true);
    host.emit({ kind: 'changed', document: host.makeDocument({ version: 2, text: BROKEN_SOURCE }) });
    host.emit({ kind: 'closed', document: host.makeDocument({ version: 2 }) });
    expect(host.diagnostics.has(URI)).toBe(false);
    expect(clock.pending()).toBe(0);
    clock.advance(DELAY);
    await flush();
    expect(host.diagnostics.has(URI)).toBe(false);
  });

  it('descarta o resultado de uma versão anterior que termina depois da nova', async () => {
    const releases = new Map<string, (result: CompileResult) => void>();
    const { host, clock } = setup((text) => new Promise<CompileResult>((resolve) => { releases.set(text, resolve); }));
    host.emit({ kind: 'changed', document: host.makeDocument({ version: 4, text: 'v4' }) });
    clock.advance(DELAY);
    host.emit({ kind: 'changed', document: host.makeDocument({ version: 5, text: 'v5' }) });
    clock.advance(DELAY);
    releases.get('v5')?.(failure(1));
    await flush();
    expect(host.diagnostics.get(URI)).toHaveLength(1);
    releases.get('v4')?.(failure(3));
    await flush();
    expect(host.diagnostics.get(URI)).toHaveLength(1);
  });

  it('descarta o resultado que chega depois do documento fechar', async () => {
    let release: (result: CompileResult) => void = () => undefined;
    const { host, clock } = setup(() => new Promise<CompileResult>((resolve) => { release = resolve; }));
    host.emit({ kind: 'changed', document: host.makeDocument({ version: 1, text: 'x' }) });
    clock.advance(DELAY);
    host.emit({ kind: 'closed', document: host.makeDocument({ version: 1 }) });
    release(failure(2));
    await flush();
    expect(host.diagnostics.has(URI)).toBe(false);
  });

  it('limita a lista e avisa quantos ficaram de fora', async () => {
    const { host, clock } = setup(() => failure(MAX_DIAGNOSTICS_PER_DOCUMENT + 200));
    host.emit({ kind: 'changed', document: host.makeDocument({ text: 'x' }) });
    clock.advance(DELAY);
    await flush();
    const published = host.diagnostics.get(URI) ?? [];
    expect(published).toHaveLength(MAX_DIAGNOSTICS_PER_DOCUMENT + 1);
    const last = published.at(-1);
    expect(last?.severity).toBe('info');
    expect(last?.message).toContain('200');
  });

  it('transforma falha do compilador em diagnóstico em goianês sem derrubar o tratador', async () => {
    const { host, clock } = setup(() => {
      throw new Error('quebrou');
    });
    host.emit({ kind: 'changed', document: host.makeDocument({ text: 'x' }) });
    clock.advance(DELAY);
    await flush();
    const published = host.diagnostics.get(URI) ?? [];
    expect(published).toHaveLength(1);
    expect(published[0]).toMatchObject({ code: 'GS0901', severity: 'error', startLine: 0, startCharacter: 0 });
    expect(published[0]?.message).not.toContain('quebrou');
  });

  it('registra a causa da falha na saída sem vazar o texto do programa', async () => {
    const { host, clock } = setup(() => {
      throw new TypeError('quebrou feio');
    });
    host.emit({ kind: 'changed', document: host.makeDocument({ text: 'segredo do programa' }) });
    clock.advance(DELAY);
    await flush();
    const logged = host.output.join('');
    expect(logged).toContain('TypeError: quebrou feio');
    expect(logged).not.toContain('segredo do programa');
  });

  it('pula a compilação de documento grande demais e publica aviso', async () => {
    let calls = 0;
    const { host, clock } = setup(() => {
      calls += 1;
      return failure(0);
    });
    host.emit({ kind: 'changed', document: host.makeDocument({ text: 'a'.repeat(MAX_DOCUMENT_LENGTH + 1) }) });
    clock.advance(DELAY);
    await flush();
    expect(calls).toBe(0);
    expect(host.diagnostics.get(URI)).toMatchObject([{ code: 'GS-GRANDE', severity: 'warning' }]);
  });

  it('compila documento sem título e ignora esquemas que não são arquivo', async () => {
    let calls = 0;
    const { host, clock } = setup(() => {
      calls += 1;
      return failure(0);
    });
    host.emit({ kind: 'changed', document: host.makeDocument({ uri: 'untitled:Untitled-1', scheme: 'untitled', text: 'x' }) });
    host.emit({ kind: 'changed', document: host.makeDocument({ uri: 'output:saida', scheme: 'output', text: 'x' }) });
    clock.advance(DELAY);
    await flush();
    expect(calls).toBe(1);
    expect(host.diagnostics.has('output:saida')).toBe(false);
  });

  it('também trata rejeição assíncrona do compilador', async () => {
    const { host, clock } = setup(() => Promise.reject(new Error('quebrou')));
    host.emit({ kind: 'changed', document: host.makeDocument({ text: 'x' }) });
    clock.advance(DELAY);
    await flush();
    expect(host.diagnostics.get(URI)?.[0]?.code).toBe('GS0901');
  });

  it('ignora documento de outra linguagem', async () => {
    const { host, clock } = setup();
    host.emit({ kind: 'changed', document: host.makeDocument({ languageId: 'javascript', text: BROKEN_SOURCE }) });
    expect(clock.pending()).toBe(0);
    clock.advance(DELAY);
    await flush();
    expect(host.diagnostics.size).toBe(0);
  });

  it('usa o tom e a base de lições das configurações', async () => {
    const host = createFakeHost({ settings: { diagnosticsDelayMs: 0, tone: 'neutro', lessonBaseUrl: 'https://exemplo.dev/l' } });
    const clock = createClock();
    createLiveDiagnostics({ host, timers: clock });
    host.emit({ kind: 'changed', document: host.makeDocument({ text: BROKEN_SOURCE }) });
    clock.advance(0);
    await flush();
    expect(host.diagnostics.get(URI)?.[0]?.lessonUrl).toBe('https://exemplo.dev/l/licao-02');
    expect(host.diagnostics.get(URI)?.[0]?.message).not.toContain('Ô sô');
  });

  it('para de reagir depois de descartado', () => {
    const host = createFakeHost();
    const clock = createClock();
    const live = createLiveDiagnostics({ host, timers: clock });
    host.emit({ kind: 'changed', document: host.makeDocument({ text: BROKEN_SOURCE }) });
    live.dispose();
    expect(clock.pending()).toBe(0);
    host.emit({ kind: 'changed', document: host.makeDocument({ text: BROKEN_SOURCE }) });
    expect(clock.pending()).toBe(0);
  });
});
