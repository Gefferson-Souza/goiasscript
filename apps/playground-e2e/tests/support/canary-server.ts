import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { CanaryServer } from './canary-server.types.ts';

const LOOPBACK = '127.0.0.1';
const EPHEMERAL_PORT = 0;
const OK_STATUS = 200;

// Responde com CORS aberto de propósito: se algum ataque chegar aqui, só a CSP o impediria de ler a resposta.
export async function startCanaryServer(): Promise<CanaryServer> {
  const received: string[] = [];
  const server = createServer((request, response) => {
    received.push(`${request.method ?? 'GET'} ${request.url ?? '/'}`);
    response.writeHead(OK_STATUS, { 'access-control-allow-origin': '*', 'content-type': 'text/javascript' });
    response.end('export default 1;');
  });
  server.on('upgrade', (request, socket) => {
    received.push(`UPGRADE ${request.url ?? '/'}`);
    socket.destroy();
  });
  await new Promise<void>((resolve) => server.listen(EPHEMERAL_PORT, LOOPBACK, resolve));
  const { port } = server.address() as AddressInfo;
  return {
    url: `http://${LOOPBACK}:${String(port)}`,
    hits: () => [...received],
    close: () =>
      new Promise<void>((resolve) => {
        server.closeAllConnections();
        server.close(() => {
          resolve();
        });
      }),
  };
}
