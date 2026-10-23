import { describe, expect, it } from 'vitest';
import { runExtensionSmoke } from '../../../scripts/smoke-extension.ts';
import type { ExtensionIds, SmokeFetch, SmokeResponse } from '../../../scripts/smoke-extension.types.ts';

const IDS: ExtensionIds = { publisher: 'goiasscript', name: 'goiasscript-vscode', version: '0.3.0' };
const MARKETPLACE_HOST = 'marketplace.visualstudio.com';
const OPEN_VSX_HOST = 'open-vsx.org';

const reply = (status: number, body: unknown): SmokeResponse => ({
  ok: status >= 200 && status < 300,
  status,
  json: () => Promise.resolve(body),
});

const marketplaceBody = (versions: readonly string[]): unknown => ({
  results: [{ extensions: [{ versions: versions.map((version) => ({ version })) }] }],
});

function fakeFetch(marketplace: SmokeResponse, openVsx: SmokeResponse): SmokeFetch {
  return (url) => Promise.resolve(url.includes(MARKETPLACE_HOST) ? marketplace : openVsx);
}

describe('runExtensionSmoke', () => {
  it('não acusa falha quando os dois lugares têm a versão', async () => {
    const fetchFn = fakeFetch(reply(200, marketplaceBody(['0.3.0'])), reply(200, { version: '0.3.0' }));
    expect(await runExtensionSmoke(fetchFn, IDS)).toEqual([]);
  });

  it('nomeia o Open VSX quando a versão dá 404', async () => {
    const fetchFn = fakeFetch(reply(200, marketplaceBody(['0.3.0'])), reply(404, {}));
    const failures = await runExtensionSmoke(fetchFn, IDS);
    expect(failures.map((failure) => failure.registry)).toEqual(['open-vsx']);
    expect(failures[0]?.message).toContain('404');
  });

  it('nomeia o Marketplace quando só tem versão antiga', async () => {
    const fetchFn = fakeFetch(reply(200, marketplaceBody(['0.2.0'])), reply(200, { version: '0.3.0' }));
    const failures = await runExtensionSmoke(fetchFn, IDS);
    expect(failures.map((failure) => failure.registry)).toEqual(['marketplace']);
    expect(failures[0]?.message).toContain('0.3.0');
  });

  it('acusa o Marketplace quando a extensão não existe', async () => {
    const fetchFn = fakeFetch(reply(200, { results: [{ extensions: [] }] }), reply(200, { version: '0.3.0' }));
    expect((await runExtensionSmoke(fetchFn, IDS)).map((failure) => failure.registry)).toEqual(['marketplace']);
  });

  it('acusa resposta fora do formato e erro de rede sem estourar', async () => {
    const broken: SmokeFetch = (url) =>
      url.includes(OPEN_VSX_HOST) ? Promise.reject(new Error('sem rede')) : Promise.resolve(reply(200, 'lixo'));
    const failures = await runExtensionSmoke(broken, IDS);
    expect(failures.map((failure) => failure.registry)).toEqual(['marketplace', 'open-vsx']);
    expect(failures[1]?.message).toContain('sem rede');
  });

  it('consulta o Marketplace pelo identificador publisher.nome', async () => {
    const bodies: string[] = [];
    const spy: SmokeFetch = (url, init) => {
      if (init?.body !== undefined) bodies.push(init.body);
      return Promise.resolve(url.includes(MARKETPLACE_HOST) ? reply(200, marketplaceBody(['0.3.0'])) : reply(200, { version: '0.3.0' }));
    };
    await runExtensionSmoke(spy, IDS);
    expect(bodies.join('')).toContain('goiasscript.goiasscript-vscode');
  });
});
