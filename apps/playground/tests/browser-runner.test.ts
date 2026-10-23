import { afterEach, describe, expect, it, vi } from 'vitest';
import { createBrowserRunnerClient } from '../lib/run/browser-runner.ts';
import type { RunEvent, RunRequest } from '../lib/run/runner-client.types.ts';

const posted: unknown[] = [];
let terminated = 0;

class FakeWorker {
  onmessage: unknown = null;
  onerror: unknown = null;
  onmessageerror: unknown = null;
  postMessage(message: unknown): void {
    posted.push(message);
  }
  terminate(): void {
    terminated += 1;
  }
}

afterEach(() => {
  vi.unstubAllGlobals();
  posted.length = 0;
  terminated = 0;
});

describe('cliente de execução do navegador', () => {
  it('cria o Worker só ao rodar, manda o código e para com o evento stopped', () => {
    vi.stubGlobal('Worker', FakeWorker);
    const client = createBrowserRunnerClient();
    expect(posted).toEqual([]);
    const events: RunEvent[] = [];
    const request = { compiled: { code: 'console.log(1)' }, source: 'prosa(1)', fileName: 'programa.gs' } as unknown as RunRequest;
    client.run(request, (event) => events.push(event));
    expect(posted).toEqual([{ type: 'gs:executar', runId: 1, code: 'console.log(1)' }]);
    client.stop();
    expect(events).toEqual([{ kind: 'stopped' }]);
    expect(terminated).toBe(1);
    client.dispose();
  });
});
