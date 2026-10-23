import { describe, expect, it } from 'vitest';
import { createProviderChain } from '../src/engoiana';
import type { LogPort } from '../src/log.types';
import type { ProviderFailure } from '../src/ports.types';
import { createWorkerProviderChain } from '../src/providers';
import type { ProviderPort } from '../src/providers/provider.types';
import { makeConfig, makeEnv } from './helpers';

const NEVER_ABORTED = new AbortController().signal;

function succeeding(name: string, text: string): ProviderPort {
  return { name, complete: () => Promise.resolve({ ok: true, text, provider: name }) };
}

function failing(name: string, failure: ProviderFailure): ProviderPort {
  return { name, complete: () => Promise.resolve({ ok: false, failure, provider: name }) };
}

function silentLog(): LogPort & { readonly events: string[] } {
  const events: string[] = [];
  return {
    events,
    warn: (event, detail) => {
      events.push(`${event} ${detail ?? ''}`);
    },
    error: (event, detail) => {
      events.push(`${event} ${detail ?? ''}`);
    },
  };
}

describe('createProviderChain', () => {
  it('para na primeira resposta boa', async () => {
    const chain = createProviderChain([succeeding('a', 'primeiro'), succeeding('b', 'segundo')]);
    expect(await chain.complete('oi', NEVER_ABORTED)).toEqual({ ok: true, text: 'primeiro', provider: 'a' });
  });

  it('cai no Workers AI quando a Groq falha', async () => {
    const chain = createProviderChain([failing('groq', 'server-error'), succeeding('workers-ai', 'bão')]);
    expect(await chain.complete('oi', NEVER_ABORTED)).toEqual({ ok: true, text: 'bão', provider: 'workers-ai' });
  });

  it('devolve a última falha quando todos falham', async () => {
    const chain = createProviderChain([failing('groq', 'timeout'), failing('workers-ai', 'empty')]);
    expect(await chain.complete('oi', NEVER_ABORTED)).toEqual({ ok: false, failure: 'empty', provider: 'workers-ai' });
  });

  it('sem provedores devolve model-disabled', async () => {
    const chain = createProviderChain([]);
    const result = await chain.complete('oi', NEVER_ABORTED);
    expect(result).toEqual({ ok: false, failure: 'model-disabled', provider: 'none' });
  });

  it('registra o motivo da falha sem o texto do usuário', async () => {
    const log = silentLog();
    const chain = createProviderChain([failing('groq', 'model-disabled'), succeeding('workers-ai', 'ok')], log);
    await chain.complete('texto secreto do usuário', NEVER_ABORTED);
    expect(log.events.join('|')).toContain('model-disabled');
    expect(log.events.join('|')).not.toContain('texto secreto');
  });
});

describe('createWorkerProviderChain', () => {
  it('sem chave da Groq usa só o Workers AI', async () => {
    const models: string[] = [];
    const ai = {
      run: (model: string) => {
        models.push(model);
        return Promise.resolve({ response: 'bão demais' });
      },
    };
    const fetchFn = () => Promise.reject(new Error('a rede não deveria ser chamada'));
    const chain = createWorkerProviderChain({
      env: makeEnv({ AI: ai, GROQ_API_KEY: undefined }),
      config: makeConfig({ workersAiModel: '@cf/configurado' }),
      log: silentLog(),
      fetchFn,
    });
    const result = await chain.complete('oi', NEVER_ABORTED);
    expect(result).toEqual({ ok: true, text: 'bão demais', provider: 'workers-ai' });
    expect(models).toEqual(['@cf/configurado']);
  });

  it('usa o modelo da Groq vindo da configuração', async () => {
    const bodies: string[] = [];
    const fetchFn = (_url: string, init: RequestInit) => {
      bodies.push(typeof init.body === 'string' ? init.body : '');
      return Promise.resolve(new Response(JSON.stringify({ choices: [{ message: { content: 'uai' } }] })));
    };
    const chain = createWorkerProviderChain({
      env: makeEnv({ GROQ_API_KEY: 'k' }),
      config: makeConfig({ groqModel: 'modelo-configurado' }),
      log: silentLog(),
      fetchFn,
    });
    await chain.complete('oi', NEVER_ABORTED);
    expect(bodies[0]).toContain('modelo-configurado');
  });
});
