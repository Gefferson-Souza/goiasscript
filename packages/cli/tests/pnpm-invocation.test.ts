import { describe, expect, it } from 'vitest';
import { pnpmInvocation } from '../../../scripts/pnpm-invocation.ts';

const NODE = '/usr/bin/node';
const PNPM_SCRIPT = '/opt/pnpm/bin/pnpm.cjs';

describe('pnpmInvocation', () => {
  it('roda o pnpm pelo próprio Node quando o pnpm já está no comando', () => {
    expect(pnpmInvocation({ npm_execpath: PNPM_SCRIPT }, NODE, ['pack'])).toEqual({ command: NODE, args: [PNPM_SCRIPT, 'pack'] });
  });

  it('executa direto o binário nativo do pnpm', () => {
    const native = 'C:\\corepack\\pnpm\\12.6.0\\pnpm-native.exe';
    expect(pnpmInvocation({ npm_execpath: native }, NODE, ['pack'])).toEqual({ command: native, args: ['pack'] });
  });

  it('cai no corepack quando não há pnpm no comando', () => {
    expect(pnpmInvocation({}, NODE, ['pack'])).toEqual({ command: 'corepack', args: ['pnpm', 'pack'] });
  });

  it('ignora npm_execpath que não é o pnpm', () => {
    expect(pnpmInvocation({ npm_execpath: '/opt/npm/bin/npm-cli.js' }, NODE, ['pack'])).toEqual({ command: 'corepack', args: ['pnpm', 'pack'] });
  });
});
