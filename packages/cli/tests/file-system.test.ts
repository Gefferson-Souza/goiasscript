import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { CliFileError } from '../src/cli-file-error.ts';
import { createNodeFileSystem } from '../src/node-file-system.ts';

describe('createNodeFileSystem', () => {
  const nodeFs = createNodeFileSystem();
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'gs-cli-test-'));
  afterAll(() => {
    fs.rmSync(scratch, { recursive: true, force: true });
  });

  it('create-new nunca sobrescreve e devolve EEXIST', async () => {
    const target = path.join(scratch, 'a.mjs');
    await nodeFs.writeText(target, 'um', 'create-new');
    await expect(nodeFs.writeText(target, 'dois', 'create-new')).rejects.toMatchObject({ code: 'EEXIST' });
    await expect(nodeFs.writeText(target, 'dois', 'create-new')).rejects.toBeInstanceOf(CliFileError);
    expect(fs.readFileSync(target, 'utf8')).toBe('um');
  });

  it('replace sobrescreve o destino existente', async () => {
    const target = path.join(scratch, 'b.mjs');
    await nodeFs.writeText(target, 'um', 'create-new');
    await nodeFs.writeText(target, 'dois', 'replace');
    expect(fs.readFileSync(target, 'utf8')).toBe('dois');
  });

  it('replace troca o arquivo por rename atômico e não deixa temporário', async () => {
    const dir = path.join(scratch, 'atomic');
    fs.mkdirSync(dir);
    const target = path.join(dir, 'c.mjs');
    await nodeFs.writeText(target, 'um', 'create-new');
    await nodeFs.writeText(target, 'dois', 'replace');
    expect(fs.readdirSync(dir)).toEqual(['c.mjs']);
  });

  it('replace sobre symlink troca o link e preserva o alvo', async () => {
    const outside = path.join(scratch, 'alvo.txt');
    fs.writeFileSync(outside, 'intacto');
    const link = path.join(scratch, 'link.mjs');
    fs.symlinkSync(outside, link);
    await nodeFs.writeText(link, 'novo', 'replace');
    expect(fs.readFileSync(outside, 'utf8')).toBe('intacto');
    expect(fs.lstatSync(link).isSymbolicLink()).toBe(false);
    expect(fs.readFileSync(link, 'utf8')).toBe('novo');
  });

  it('replace com falha não deixa temporário para trás', async () => {
    const dir = path.join(scratch, 'broken');
    fs.mkdirSync(dir);
    fs.mkdirSync(path.join(dir, 'd.mjs'));
    await expect(nodeFs.writeText(path.join(dir, 'd.mjs'), 'x', 'replace')).rejects.toBeInstanceOf(CliFileError);
    expect(fs.readdirSync(dir)).toEqual(['d.mjs']);
  });

  it('identity iguala link físico ao original e distingue arquivos diferentes', async () => {
    const original = path.join(scratch, 'x.gs');
    fs.writeFileSync(original, 'prosa(1)');
    fs.linkSync(original, path.join(scratch, 'x-link.mjs'));
    fs.writeFileSync(path.join(scratch, 'outro.mjs'), 'prosa(1)');
    const [first, linked, other] = await Promise.all(
      ['x.gs', 'x-link.mjs', 'outro.mjs'].map((name) => nodeFs.identity(path.join(scratch, name))),
    );
    expect(linked).toBe(first);
    expect(other).not.toBe(first);
    expect(await nodeFs.identity(path.join(scratch, 'nao-existe'))).toBeNull();
  });

  it('makeTempDirectory cria diretório novo e remove apaga a árvore', async () => {
    const dir = await nodeFs.makeTempDirectory(path.join(scratch, 'goiasscript-'));
    expect(await nodeFs.stat(dir)).toBe('directory');
    fs.writeFileSync(path.join(dir, 'f.txt'), 'x');
    await nodeFs.remove(dir);
    expect(await nodeFs.stat(dir)).toBe('missing');
  });

  it('stat classifica arquivo, pasta e ausente; leitura e listagem funcionam', async () => {
    const dir = path.join(scratch, 'sub');
    await nodeFs.makeDirectory(dir);
    await expect(nodeFs.makeDirectory(dir)).rejects.toMatchObject({ code: 'EEXIST' });
    await nodeFs.writeText(path.join(dir, 'f.txt'), 'oi', 'create-new');
    expect(await nodeFs.stat(path.join(dir, 'f.txt'))).toBe('file');
    expect(await nodeFs.stat(path.join(scratch, 'nada'))).toBe('missing');
    expect(Buffer.from(await nodeFs.readBytes(path.join(dir, 'f.txt'))).toString('utf8')).toBe('oi');
    expect(await nodeFs.listDirectory(dir)).toEqual(['f.txt']);
    expect(await nodeFs.modifiedAt(path.join(dir, 'f.txt'))).toBeGreaterThan(0);
  });

  it('erros do sistema viram CliFileError com código mapeado', async () => {
    await expect(nodeFs.readBytes(path.join(scratch, 'nada'))).rejects.toMatchObject({ code: 'ENOENT' });
    await expect(nodeFs.readBytes(scratch)).rejects.toMatchObject({ code: 'EISDIR' });
    await expect(nodeFs.listDirectory(path.join(scratch, 'a.mjs'))).rejects.toMatchObject({ code: 'ENOTDIR' });
  });

  it.skipIf(os.platform() === 'win32')('stat de dispositivo devolve other', async () => {
    expect(await nodeFs.stat('/dev/null')).toBe('other');
  });

  it('falhas que não são ausência continuam sendo erro', async () => {
    const tooLong = path.join(scratch, 'x'.repeat(5000));
    await expect(nodeFs.stat(tooLong)).rejects.toMatchObject({ code: 'OTHER' });
    await expect(nodeFs.identity(tooLong)).rejects.toMatchObject({ code: 'OTHER' });
  });

  it('removeSync apaga a árvore e tolera ausência', () => {
    const dir = path.join(scratch, 'sync');
    fs.mkdirSync(dir);
    nodeFs.removeSync(dir);
    expect(fs.existsSync(dir)).toBe(false);
    expect(() => {
      nodeFs.removeSync(dir);
    }).not.toThrow();
  });
});
