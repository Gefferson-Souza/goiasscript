import { describe, expect, it, vi } from 'vitest';
import { createProviderChain } from '../src/engoiana';
import type { LogPort } from '../src/log.types';
import type { ProviderFailure } from '../src/ports.types';
import type { ProviderPort } from '../src/providers/provider.types';

const LIVE_SIGNAL = new AbortController().signal;
const RAW_PROVIDER_BODY = 'corpo-cru-do-provedor-com-segredo';

interface SpiedProvider {
  readonly port: ProviderPort;
  readonly complete: ReturnType<typeof vi.fn>;
}

function succeeding(name: string, text: string): SpiedProvider {
  const complete = vi.fn(() => Promise.resolve({ ok: true as const, text, provider: name }));
  return { port: { name, complete }, complete };
}

function failing(name: string, failure: ProviderFailure): ProviderPort {
  return { name, complete: () => Promise.resolve({ ok: false as const, failure, provider: name }) };
}

function recordingLog(): LogPort & { readonly lines: string[] } {
  const lines: string[] = [];
  const record = (event: string, detail?: string): void => {
    lines.push(`${event} ${detail ?? ''}`);
  };
  return { lines, warn: record, error: record };
}

describe('cadeia de provedores', () => {
  it('usa o segundo provedor quando o primeiro falha', async () => {
    const second = succeeding('segundo', 'bão');
    const chain = createProviderChain([failing('primeiro', 'timeout'), second.port]);

    expect(await chain.complete('oi', LIVE_SIGNAL)).toEqual({ ok: true, text: 'bão', provider: 'segundo' });
    expect(second.complete).toHaveBeenCalledWith('oi', LIVE_SIGNAL);
  });

  it('devolve a falha quando todos falham', async () => {
    const chain = createProviderChain([failing('primeiro', 'server-error'), failing('segundo', 'empty')]);

    expect(await chain.complete('oi', LIVE_SIGNAL)).toEqual({ ok: false, failure: 'empty', provider: 'segundo' });
  });

  it('sem provedores devolve model-disabled', async () => {
    const result = await createProviderChain([]).complete('oi', LIVE_SIGNAL);
    expect(result).toMatchObject({ ok: false, failure: 'model-disabled' });
  });

  it('para de tentar quando o pedido foi abortado', async () => {
    const controller = new AbortController();
    controller.abort();
    const second = succeeding('segundo', 'bão');
    const chain = createProviderChain([failing('primeiro', 'timeout'), second.port]);

    expect(await chain.complete('oi', controller.signal)).toMatchObject({ ok: false, provider: 'primeiro' });
    expect(second.complete).not.toHaveBeenCalled();
  });

  it('não vaza o corpo cru do provedor', async () => {
    const log = recordingLog();
    const leaky: ProviderPort = {
      name: 'vazador',
      complete: () => Promise.resolve({ ok: false as const, failure: 'server-error' as const, provider: 'vazador', body: RAW_PROVIDER_BODY } as never),
    };
    const result = await createProviderChain([leaky], log).complete('texto do usuário', LIVE_SIGNAL);

    expect(log.lines).toEqual(['provider failed vazador:server-error']);
    expect(log.lines.join('')).not.toContain(RAW_PROVIDER_BODY);
    expect(log.lines.join('')).not.toContain('texto do usuário');
    expect(result).toMatchObject({ ok: false });
  });
});
