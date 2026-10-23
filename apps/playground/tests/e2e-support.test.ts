import { request as httpRequest } from 'node:http';
import { describe, expect, it } from 'vitest';
import { compile } from '@goiasscript/compiler';
import { TEST_IDS } from '../lib/test-ids.constants.ts';
import { startCanaryServer } from '../../playground-e2e/tests/support/canary-server.ts';
import { HOSTILE_PROGRAMS } from '../../playground-e2e/tests/support/hostile-programs.ts';

const CANARY_URL = 'http://127.0.0.1:9';
const MINIMUM_ATTACKS = 12;
const MINIMUM_NETWORK_ATTACKS = 5;
const KEBAB_CASE = /^[a-z]+(?:-[a-z]+)*$/u;

describe('TEST_IDS', () => {
  it('traz ids únicos em kebab-case', () => {
    const values = Object.values(TEST_IDS);
    expect(new Set(values).size).toBe(values.length);
    expect(values.filter((value) => !KEBAB_CASE.test(value))).toEqual([]);
  });
});

describe('HOSTILE_PROGRAMS', () => {
  it('cobre pelo menos os doze ataques do spec com nomes únicos', () => {
    const names = HOSTILE_PROGRAMS.map((program) => program.name);
    expect(names.length).toBeGreaterThanOrEqual(MINIMUM_ATTACKS);
    expect(new Set(names).size).toBe(names.length);
  });

  it.each(HOSTILE_PROGRAMS.map((program) => [program.name, program] as const))(
    '%s: o mundo fechado barra só o que declara barrar',
    (_name, program) => {
      const result = compile(program.source(CANARY_URL), { target: 'playground' });
      expect(result.ok).toBe(program.expect !== 'compile-error');
    },
  );

  it.each(HOSTILE_PROGRAMS.filter((program) => program.expect === 'tried-and-failed').map((program) => [program.name, program] as const))(
    '%s: imprime tentei antes e deu ruim depois',
    (_name, program) => {
      const source = program.source(CANARY_URL);
      expect(source.indexOf('tentei')).toBeGreaterThanOrEqual(0);
      expect(source.indexOf('tentei')).toBeLessThan(source.indexOf('deu ruim'));
    },
  );

  it('aponta os ataques de rede para o canário recebido', () => {
    const networkAttacks = HOSTILE_PROGRAMS.filter((program) => program.source(CANARY_URL).includes(CANARY_URL));
    expect(networkAttacks.length).toBeGreaterThanOrEqual(MINIMUM_NETWORK_ATTACKS);
  });
});

describe('startCanaryServer', () => {
  it('registra toda requisição e zera ao fechar', async () => {
    const canary = await startCanaryServer();
    expect(canary.hits()).toEqual([]);
    const response = await fetch(`${canary.url}/rota?x=1`, { method: 'POST' });
    expect(response.status).toBe(200);
    expect(canary.hits()).toEqual(['POST /rota?x=1']);
    await canary.close();
    await expect(fetch(`${canary.url}/depois`)).rejects.toThrow();
  });

  it('registra tentativa de upgrade de WebSocket', async () => {
    const canary = await startCanaryServer();
    const { port } = new URL(canary.url);
    await new Promise<void>((resolve) => {
      const request = httpRequest({ host: '127.0.0.1', port, path: '/socket', headers: { connection: 'Upgrade', upgrade: 'websocket' } });
      request.on('error', () => {
        resolve();
      });
      request.end();
    });
    expect(canary.hits()).toEqual(['UPGRADE /socket']);
    await canary.close();
  });
});
