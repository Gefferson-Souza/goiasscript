import { execFile } from 'node:child_process';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';

const run = promisify(execFile);
const SCRIPT = fileURLToPath(new URL('../scripts/warm-cache.ts', import.meta.url));
const EXPECTED_REQUESTS = 5;
const CLI_TIMEOUT_MS = 30_000;

describe('warm-cache pela linha de comando', () => {
  it('roda direto no Node e posta as cinco frases na API informada', async () => {
    const received: string[] = [];
    const server = createServer((request, response) => {
      received.push(`${request.method ?? ''} ${request.url ?? ''}`);
      request.resume();
      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end('{"text":"uai"}');
    });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const { port } = server.address() as AddressInfo;
    try {
      const { stdout } = await run(process.execPath, [SCRIPT, `http://127.0.0.1:${String(port)}`], { timeout: CLI_TIMEOUT_MS });
      expect(stdout).toContain('5');
      expect(received).toEqual(Array.from({ length: EXPECTED_REQUESTS }, () => 'POST /engoiana'));
    } finally {
      server.close();
    }
  }, CLI_TIMEOUT_MS);
});
