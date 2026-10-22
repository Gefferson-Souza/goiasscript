import type { PnpmInvocation } from './pnpm-invocation.types.ts';

const PNPM_BINARY = /pnpm[^\\/]*$/iu;
const SCRIPT_EXTENSION = /\.c?js$/iu;
const COREPACK = 'corepack';
const PNPM = 'pnpm';

// No Windows o corepack é um .cmd, que execFile sem shell não acha; reaproveita o pnpm que já está rodando.
export function pnpmInvocation(env: NodeJS.ProcessEnv, nodePath: string, args: readonly string[]): PnpmInvocation {
  const running = env['npm_execpath'];
  if (running === undefined || !PNPM_BINARY.test(running)) return { command: COREPACK, args: [PNPM, ...args] };
  return SCRIPT_EXTENSION.test(running) ? { command: nodePath, args: [running, ...args] } : { command: running, args };
}
