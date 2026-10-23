import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { main, parseDist, realExecPort, runReleaseSmoke } from '../../../scripts/smoke-release.ts';
import type { ExecPort, ExecResult } from '../../../scripts/smoke-release.types.ts';

const TMP_DIR = path.join('prefixo', 'temporario');
const REGISTRY_VERSION = '3.0.0';
const BIN = path.join(TMP_DIR, 'bin', 'goiasscript');
const LICENSE_SUFFIX = path.join('node_modules', 'goiasscript', 'LICENSE');
const OK: ExecResult = { exitCode: 0, stdout: '', stderr: '' };

interface FakeOptions {
  readonly registry?: ExecResult;
  readonly install?: ExecResult;
  readonly version?: ExecResult;
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
      if (args[0] === 'dedo_de_prosa') return Promise.resolve(options.version ?? { ...OK, stdout: `goiasscript ${REGISTRY_VERSION}\n` });
      return Promise.resolve({ exitCode: 3, stdout: '', stderr: 'não existe aqui' });
    },
    exists: (file) => Promise.resolve(file.endsWith(LICENSE_SUFFIX) && (options.license ?? true)),
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
    const result = await smoke(fakeExec({ version: { ...OK, stdout: 'goiasscript 3.0.1\n' } }));
    expect(result).toMatchObject({ ok: false, step: 'version' });
  });

  it('versão que só contém a do registro como pedaço não conta', async () => {
    const result = await smoke(fakeExec({ version: { ...OK, stdout: 'goiasscript 13.0.0\n' } }));
    expect(result).toMatchObject({ ok: false, step: 'version' });
  });

  it('chama dedo_de_prosa no binário instalado', async () => {
    const fake = fakeExec();
    await smoke(fake);
    expect(fake.calls).toContainEqual([BIN, 'dedo_de_prosa']);
    expect(fake.calls.flat()).not.toContain('--version');
  });

  it('exceção do executor vira falha nomeada, sem estourar', async () => {
    const port: ExecPort = { run: () => Promise.reject(new Error('sem rede')), exists: () => Promise.resolve(true) };
    const result = await runReleaseSmoke({ dist: 'latest', exec: port, tmpDir: TMP_DIR });
    expect(result).toMatchObject({ ok: false, step: 'registry' });
    expect(JSON.stringify(result)).toContain('sem rede');
  });
});

describe('parseDist', () => {
  it('aceita latest e next', () => {
    expect(parseDist('latest')).toBe('latest');
    expect(parseDist('next')).toBe('next');
  });

  it('rejeita valor inválido ou ausente', () => {
    expect(() => parseDist('beta')).toThrow(/dist-tag/u);
    expect(() => parseDist(undefined)).toThrow(/dist-tag/u);
  });
});

describe('realExecPort', () => {
  it('captura stdout com exit zero', async () => {
    const result = await realExecPort.run(process.execPath, ['-e', 'process.stdout.write("oi")']);
    expect(result).toEqual({ exitCode: 0, stdout: 'oi', stderr: '' });
  });

  it('mapeia exit diferente de zero e stderr', async () => {
    const result = await realExecPort.run(process.execPath, ['-e', 'process.stderr.write("ruim"); process.exit(3)']);
    expect(result).toMatchObject({ exitCode: 3, stderr: 'ruim' });
  });

  it('comando inexistente vira exit 1 com mensagem', async () => {
    const result = await realExecPort.run('comando-que-nao-existe-goiasscript', []);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).not.toBe('');
  });

  it('exists distingue arquivo presente de ausente', async () => {
    expect(await realExecPort.exists(process.execPath)).toBe(true);
    expect(await realExecPort.exists(path.join(process.execPath, 'nao-existe'))).toBe(false);
  });
});

describe('main', () => {
  const argv = ['node', 'smoke-release.ts', 'latest'];

  it('dist-tag inválida devolve 1 sem tocar no executor', async () => {
    const fake = fakeExec();
    expect(await main(['node', 'smoke-release.ts', 'beta'], fake.port)).toBe(1);
    expect(fake.calls).toHaveLength(0);
  });

  it('sucesso devolve 0 e apaga o diretório temporário', async () => {
    const fake = fakeExec();
    expect(await main(argv, fake.port)).toBe(0);
    const prefix = fake.calls.find(([, verb]) => verb === 'install')?.at(-1);
    expect(prefix).toBeDefined();
    expect(fs.existsSync(prefix ?? '')).toBe(false);
  });

  it('falha devolve 1 e também apaga o diretório temporário', async () => {
    const fake = fakeExec({ install: { exitCode: 1, stdout: '', stderr: 'EACCES' } });
    expect(await main(argv, fake.port)).toBe(1);
    const prefix = fake.calls.find(([, verb]) => verb === 'install')?.at(-1);
    expect(fs.existsSync(prefix ?? '')).toBe(false);
  });
});
