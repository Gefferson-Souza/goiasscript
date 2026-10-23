import { describe, expect, it } from 'vitest';
import { buildCliInvocation } from '../src/commands/cli-invocation.ts';

const HOSTILE_NAMES = ['a$(touch PWNED).gs', '`touch PWNED`.gs', 'a";touch PWNED;".gs', 'a;b.gs', 'a b.gs', '-x.gs', 'a&b.gs', 'a|b.gs', "a'b.gs", 'a\nb.gs', 'café.gs'] as const;
const CLI_ENTRY = '/ext/dist/cli/goiasscript.mjs';
const RUNTIME = '/usr/bin/node';

const baseInput = { command: 'traduz', documentPath: '/work/programa.gs', cliEntry: CLI_ENTRY, runtimePath: RUNTIME, tone: 'raiz', overwrite: false } as const;

describe('buildCliInvocation', () => {
  it.each(HOSTILE_NAMES)('%s vai como um único argumento, depois de --', (name) => {
    const invocation = buildCliInvocation({ ...baseInput, documentPath: `/work/${name}` });
    expect(invocation.args).toEqual([CLI_ENTRY, 'traduz', '--tom', 'raiz', '--', `/work/${name}`]);
    expect(invocation.args.filter((arg) => arg.includes('PWNED'))).toHaveLength(name.includes('PWNED') ? 1 : 0);
    expect(invocation.options).not.toHaveProperty('shell');
    expect(invocation.options).toMatchObject({ windowsHide: true, cwd: '/work' });
    expect(invocation.file).toBe(RUNTIME);
  });

  it('monta o bota_pra_moer com o mesmo formato e o tom neutro', () => {
    const invocation = buildCliInvocation({ ...baseInput, command: 'bota_pra_moer', tone: 'neutro' });
    expect(invocation.args).toEqual([CLI_ENTRY, 'bota_pra_moer', '--tom', 'neutro', '--', '/work/programa.gs']);
  });

  it('ELECTRON_RUN_AS_NODE vale só para o filho e não herda variável de loader', () => {
    const hostEnv = { PATH: '/bin', HOME: '/home/aluno', LANG: 'pt_BR.UTF-8', TMPDIR: '/tmp', NODE_OPTIONS: '--require /x.js', LD_PRELOAD: '/x.so', DYLD_INSERT_LIBRARIES: '/x.dylib', SECRET_TOKEN: 'abc' };
    const { env } = buildCliInvocation({ ...baseInput, hostEnv }).options;
    expect(env).toEqual({ PATH: '/bin', HOME: '/home/aluno', LANG: 'pt_BR.UTF-8', TMPDIR: '/tmp', ELECTRON_RUN_AS_NODE: '1' });
  });

  it('leva as variáveis do Windows quando existem', () => {
    const hostEnv = { PATH: 'C:\\bin', USERPROFILE: 'C:\\Users\\a', TEMP: 'C:\\tmp', SystemRoot: 'C:\\Windows' };
    expect(buildCliInvocation({ ...baseInput, hostEnv }).options.env).toEqual({ ...hostEnv, ELECTRON_RUN_AS_NODE: '1' });
  });

  it('--sobrescreve entra antes do --, nunca depois', () => {
    const { args } = buildCliInvocation({ ...baseInput, overwrite: true, documentPath: '/work/--sobrescreve' });
    expect(args).toEqual([CLI_ENTRY, 'traduz', '--tom', 'raiz', '--sobrescreve', '--', '/work/--sobrescreve']);
    expect(args.indexOf('--sobrescreve')).toBeLessThan(args.indexOf('--'));
  });

  it('limita a saída acumulada do filho', () => {
    expect(buildCliInvocation(baseInput).options.maxBuffer).toBeGreaterThan(0);
  });
});
