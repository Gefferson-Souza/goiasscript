import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { runReleaseSmoke } from '../../../scripts/smoke-release.ts';
import type { ExecPort, ExecResult } from '../../../scripts/smoke-release.types.ts';

const TMP_DIR = path.join('prefixo', 'temporario');
const REGISTRY_VERSION = '3.0.0';
const BIN = path.join(TMP_DIR, 'bin', 'goiasscript');
const LICENSE = path.join(TMP_DIR, 'lib', 'node_modules', 'goiasscript', 'LICENSE');
const OK: ExecResult = { exitCode: 0, stdout: '', stderr: '' };

interface FakeOptions {
  readonly registry?: ExecResult;
  readonly install?: ExecResult;
  readonly version?: ExecResult;
  readonly info?: ExecResult;
  readonly license?: boolean;
}

interface FakeExec {
  readonly port: ExecPort;
  readonly calls: ReadonlyArray<readonly string[]>;
}

function fakeExec(options: FakeOptions = {}): FakeExec {
  const calls: Array<readonly string[]> = [];
  const port: ExecPort = {
    run: (command, args) => {
      calls.push([command, ...args]);
      if (command === 'npm' && args[0] === 'view') return Promise.resolve(options.registry ?? { ...OK, stdout: `${REGISTRY_VERSION}\n` });
      if (command === 'npm' && args[0] === 'install') return Promise.resolve(options.install ?? OK);
      if (args[0] === '--version') return Promise.resolve(options.version ?? { ...OK, stdout: `GoiásScript (${REGISTRY_VERSION})\n` });
      return Promise.resolve(options.info ?? OK);
    },
    exists: (file) => Promise.resolve(file === LICENSE && (options.license ?? true)),
  };
  return { port, calls };
}

const smoke = (fake: FakeExec, dist: 'latest' | 'next' = 'latest') => runReleaseSmoke({ dist, exec: fake.port, tmpDir: TMP_DIR });

describe('runReleaseSmoke', () => {
  it('passa quando tudo bate', async () => {
    expect(await smoke(fakeExec())).toEqual({ ok: true, version: REGISTRY_VERSION });
  });

  it('instala em prefixo temporário', async () => {
    const fake = fakeExec();
    await smoke(fake, 'next');
    expect(fake.calls).toContainEqual(['npm', 'install', '-g', 'goiasscript@next', '--prefix', TMP_DIR]);
    expect(fake.calls.filter(([command]) => command === BIN)).not.toHaveLength(0);
  });

  it('consulta a versão do registro pela dist-tag pedida', async () => {
    const fake = fakeExec();
    await smoke(fake, 'next');
    expect(fake.calls[0]).toEqual(['npm', 'view', 'goiasscript@next', 'version']);
  });

  it('falha no passo de registro quando o npm view falha', async () => {
    const result = await smoke(fakeExec({ registry: { exitCode: 1, stdout: '', stderr: 'E404' } }));
    expect(result).toMatchObject({ ok: false, step: 'registry' });
  });

  it('falha no passo de instalação quando o npm install falha', async () => {
    const result = await smoke(fakeExec({ install: { exitCode: 1, stdout: '', stderr: 'EACCES' } }));
    expect(result).toMatchObject({ ok: false, step: 'install' });
  });

  it('versão instalada diferente da do registro falha', async () => {
    const result = await smoke(fakeExec({ version: { ...OK, stdout: 'GoiásScript (3.0.1)\n' } }));
    expect(result).toMatchObject({ ok: false, step: 'version' });
  });

  it('versão que só contém a do registro como pedaço não conta', async () => {
    const result = await smoke(fakeExec({ version: { ...OK, stdout: 'GoiásScript (13.0.0)\n' } }));
    expect(result).toMatchObject({ ok: false, step: 'version' });
  });

  it('--version com exit diferente de zero falha', async () => {
    const result = await smoke(fakeExec({ version: { exitCode: 2, stdout: '', stderr: 'boom' } }));
    expect(result).toMatchObject({ ok: false, step: 'version' });
  });

  it('sem LICENSE falha', async () => {
    const result = await smoke(fakeExec({ license: false }));
    expect(result).toMatchObject({ ok: false, step: 'license' });
  });

  it('dedo_de_prosa com exit diferente de zero falha', async () => {
    const result = await smoke(fakeExec({ info: { exitCode: 3, stdout: '', stderr: 'quebrou' } }));
    expect(result).toMatchObject({ ok: false, step: 'info' });
  });

  it('chama dedo_de_prosa no binário instalado', async () => {
    const fake = fakeExec();
    await smoke(fake);
    expect(fake.calls).toContainEqual([BIN, 'dedo_de_prosa']);
  });

  it('exceção do executor vira falha nomeada, sem estourar', async () => {
    const port: ExecPort = { run: () => Promise.reject(new Error('sem rede')), exists: () => Promise.resolve(true) };
    const result = await runReleaseSmoke({ dist: 'latest', exec: port, tmpDir: TMP_DIR });
    expect(result).toMatchObject({ ok: false, step: 'registry' });
    expect(JSON.stringify(result)).toContain('sem rede');
  });
});
