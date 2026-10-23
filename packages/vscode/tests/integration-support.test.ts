import { EventEmitter } from 'node:events';
import { describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import { isValidOnThisPlatform, makeTempDir, removeTempDirs, spyOnChildProcess } from './integration/fixtures.ts';
import type { ChildCall, ChildProcessModule } from './integration/integration.types.ts';
import { HOSTILE_NAMES } from './integration/integration.constants.ts';
import { buildLaunchArgs, buildUserSettings } from './integration/launch-config.ts';

type Callback = (error: Error | null, stdout: string, stderr: string) => void;

function createFakeModule(): { readonly module: { execFile: unknown; spawn: unknown }; readonly pendingCallbacks: Callback[]; readonly child: EventEmitter } {
  const pendingCallbacks: Callback[] = [];
  const child = new EventEmitter();
  const module = {
    execFile: vi.fn((...params: readonly unknown[]) => {
      const callback = params.at(-1) as Callback;
      pendingCallbacks.push(callback);
      return child;
    }),
    spawn: vi.fn(() => child),
  };
  return { module, pendingCallbacks, child };
}

describe('espião de child_process', () => {
  it('registra a chamada de execFile e repassa para a função original', () => {
    const { module, pendingCallbacks } = createFakeModule();
    const calls: ChildCall[] = [];
    const spy = spyOnChildProcess(module as ChildProcessModule, calls);
    (module.execFile as (...params: readonly unknown[]) => unknown)('node', ['a.mjs', '--', 'x.gs'], { cwd: '/tmp' }, () => undefined);
    expect(calls).toEqual([{ api: 'execFile', file: 'node', args: ['a.mjs', '--', 'x.gs'], options: { cwd: '/tmp' } }]);
    expect(pendingCallbacks).toHaveLength(1);
    spy.restore();
  });

  it('só considera assentado depois do callback do execFile', async () => {
    const { module, pendingCallbacks } = createFakeModule();
    const spy = spyOnChildProcess(module as ChildProcessModule, []);
    const callbackSeenByCaller = vi.fn();
    (module.execFile as (...params: readonly unknown[]) => unknown)('node', [], {}, callbackSeenByCaller);
    let settled = false;
    void spy.settled().then(() => {
      settled = true;
    });
    await Promise.resolve();
    expect(settled).toBe(false);
    pendingCallbacks[0]?.(null, 'ok', '');
    await spy.settled();
    expect(callbackSeenByCaller).toHaveBeenCalledWith(null, 'ok', '');
    spy.restore();
  });

  it('registra spawn e espera o encerramento do filho', async () => {
    const { module, child } = createFakeModule();
    const calls: ChildCall[] = [];
    const spy = spyOnChildProcess(module as ChildProcessModule, calls);
    (module.spawn as (...params: readonly unknown[]) => unknown)('node', ['b.mjs'], { shell: undefined });
    expect(calls[0]).toMatchObject({ api: 'spawn', file: 'node', args: ['b.mjs'] });
    let settled = false;
    void spy.settled().then(() => {
      settled = true;
    });
    await Promise.resolve();
    expect(settled).toBe(false);
    child.emit('close', 0);
    await spy.settled();
    spy.restore();
  });

  it('devolve as funções originais ao restaurar', () => {
    const { module } = createFakeModule();
    const originalExecFile = module.execFile;
    const originalSpawn = module.spawn;
    const spy = spyOnChildProcess(module as ChildProcessModule, []);
    expect(module.execFile).not.toBe(originalExecFile);
    spy.restore();
    expect(module.execFile).toBe(originalExecFile);
    expect(module.spawn).toBe(originalSpawn);
  });
});

describe('nomes hostis', () => {
  it('cobre injeção por substituição, crase, aspas, ponto e vírgula e espaço', () => {
    expect(HOSTILE_NAMES).toEqual(expect.arrayContaining(['a$(touch PWNED).gs', 'a`touch PWNED`.gs', 'a";touch PWNED;".gs', 'a;b.gs', 'a b.gs']));
  });

  it('descarta no Windows só os nomes com aspas, inválidos no NTFS', () => {
    const onWindows = HOSTILE_NAMES.filter((name) => isValidOnThisPlatform(name, 'win32'));
    expect(onWindows).toEqual(HOSTILE_NAMES.filter((name) => !name.includes('"')));
    expect(HOSTILE_NAMES.filter((name) => isValidOnThisPlatform(name, 'linux'))).toEqual(HOSTILE_NAMES);
    expect(HOSTILE_NAMES.filter((name) => isValidOnThisPlatform(name, 'darwin'))).toEqual(HOSTILE_NAMES);
  });
});

const launchInput = { extensionDir: '/ext', suiteEntry: '/ext/.integration/suite/index.cjs', userDataDir: '/ud', extensionsDir: '/ed', workspaceDir: '/ws' } as const;

describe('argumentos de lançamento do VS Code', () => {
  it('desliga a confiança do workspace só no cenário confiável', () => {
    expect(buildLaunchArgs({ ...launchInput, scenario: 'trusted' })).toContain('--disable-workspace-trust');
    expect(buildLaunchArgs({ ...launchInput, scenario: 'untrusted' })).not.toContain('--disable-workspace-trust');
  });

  it('carrega só a extensão em desenvolvimento e abre a pasta do workspace', () => {
    const args = buildLaunchArgs({ ...launchInput, scenario: 'untrusted' });
    expect(args).toEqual(expect.arrayContaining(['--disable-extensions', '--extensionDevelopmentPath=/ext', '--extensionTestsPath=/ext/.integration/suite/index.cjs', '--user-data-dir=/ud', '--extensions-dir=/ed']));
    expect(args.at(-1)).toBe('/ws');
  });

  it('liga o Modo Restrito sem pergunta nem faixa no cenário não confiável', () => {
    expect(buildUserSettings('untrusted')).toMatchObject({ 'security.workspace.trust.enabled': true, 'security.workspace.trust.startupPrompt': 'never' });
    expect(buildUserSettings('trusted')).not.toHaveProperty('security.workspace.trust.enabled', true);
  });
});

describe('diretórios temporários dos testes', () => {
  it('remove tudo o que makeTempDir criou, inclusive o conteúdo', () => {
    const first = makeTempDir();
    const second = makeTempDir();
    fs.writeFileSync(`${first}/hostil.gs`, 'x');
    removeTempDirs();
    expect(fs.existsSync(first)).toBe(false);
    expect(fs.existsSync(second)).toBe(false);
  });
});
