import { execFileSync } from 'node:child_process';

const PORT_ENV = 'PLAYGROUND_E2E_PORT';
const PROBE_SCRIPT =
  "const s=require('node:net').createServer();s.listen(0,'127.0.0.1',()=>{process.stdout.write(String(s.address().port));s.close();});";

// O Playwright reavalia a configuração em cada worker: a porta sorteada viaja pelo ambiente para todos usarem a mesma.
export function resolveEphemeralPort(): number {
  const inherited = Number(process.env[PORT_ENV]);
  if (Number.isInteger(inherited) && inherited > 0) return inherited;
  const port = Number(execFileSync(process.execPath, ['-e', PROBE_SCRIPT], { encoding: 'utf8' }));
  process.env[PORT_ENV] = String(port);
  return port;
}
