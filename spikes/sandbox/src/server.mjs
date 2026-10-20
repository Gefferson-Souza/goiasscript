import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { RUNNER_SOURCE } from './runner-source.mjs';

const PUBLIC = new URL('../public/', import.meta.url);
const ISOLATED_CSP = "default-src 'none'; script-src 'self' blob:; worker-src blob:; connect-src 'none'; img-src 'none'";
const CANDIDATES = ['worker-blob', 'worker-file', 'iframe-sandbox'];

const listen = (server) => new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server.address().port)));

function hostPolicy(candidate, canaryUrl, networkOpen) {
  const extra = networkOpen ? ` ${canaryUrl}` : '';
  if (candidate === 'worker-blob') return `${ISOLATED_CSP.replace("connect-src 'none'", `connect-src 'self'${extra}`)}`;
  return `default-src 'self'; script-src 'self'; worker-src 'self'; frame-src 'self'; connect-src 'self'${extra}`;
}

function startCanary(hits) {
  const server = createServer((request, response) => {
    hits.push(`${request.method} ${request.url}`);
    response.writeHead(200, { 'access-control-allow-origin': '*', 'content-type': 'text/javascript' });
    response.end('export default 1;');
  });
  server.on('upgrade', (request, socket) => {
    hits.push(`UPGRADE ${request.url}`);
    socket.destroy();
  });
  return server;
}

function route(url, canaryUrl) {
  const { pathname, searchParams } = new URL(url, 'http://host');
  const candidate = CANDIDATES.find((name) => pathname === `/${name}.html`);
  const page = '<!doctype html><meta charset="utf-8"><title>host</title><body><script src="/host.js"></script>';
  if (candidate) return { type: 'text/html', csp: hostPolicy(candidate, canaryUrl, searchParams.has('net')), body: page };
  if (pathname === '/host.js') return { type: 'text/javascript', body: readFileSync(new URL('host.js', PUBLIC)) };
  if (pathname === '/runner.js') return { type: 'text/javascript', csp: ISOLATED_CSP, body: RUNNER_SOURCE };
  if (pathname === '/runner-source.mjs') {
    return { type: 'text/javascript', body: `export const RUNNER_SOURCE = ${JSON.stringify(RUNNER_SOURCE)};` };
  }
  if (pathname === '/frame.html') {
    return { type: 'text/html', csp: `${ISOLATED_CSP}; sandbox allow-scripts`, body: '<!doctype html><meta charset="utf-8"><script src="/runner.js"></script>' };
  }
  return null;
}

export async function startServers() {
  const hits = [];
  const canary = startCanary(hits);
  const canaryPort = await listen(canary);
  const canaryUrl = `http://127.0.0.1:${canaryPort}`;
  const host = createServer((request, response) => {
    const found = route(request.url, canaryUrl);
    if (!found) return response.writeHead(404).end();
    const headers = { 'content-type': `${found.type}; charset=utf-8` };
    if (found.csp) headers['content-security-policy'] = found.csp;
    response.writeHead(200, headers).end(found.body);
  });
  const hostPort = await listen(host);
  const close = () => Promise.all([host, canary].map((server) => new Promise((resolve) => { server.closeAllConnections(); server.close(resolve); })));
  return { hostUrl: `http://127.0.0.1:${hostPort}`, canaryUrl, canaryHits: () => [...hits], close };
}
