import { describe, expect, it } from 'vitest';
import { createMemoryIo } from './support/memory-io.ts';

describe('createMemoryIo', () => {
  it('sem diferenciar maiúsculas, identity iguala nomes que só diferem na caixa', async () => {
    const io = createMemoryIo({ files: { 'x.gs': 'prosa(1)' }, caseSensitive: false });
    expect(await io.fs.identity('x.gs')).toBe(await io.fs.identity('X.GS'));
  });

  it('diferenciando maiúsculas, nomes com caixa diferente são arquivos diferentes', async () => {
    const io = createMemoryIo({ files: { 'x.gs': 'a', 'X.GS': 'b' }, caseSensitive: true });
    expect(await io.fs.identity('x.gs')).not.toBe(await io.fs.identity('X.GS'));
    expect(await io.fs.identity('nada.gs')).toBeNull();
  });

  it('create-new em arquivo existente falha com EEXIST e não altera o conteúdo', async () => {
    const io = createMemoryIo({ files: { 'a.mjs': 'um' } });
    await expect(io.fs.writeText('a.mjs', 'dois', 'create-new')).rejects.toMatchObject({ name: 'CliFileError', code: 'EEXIST' });
    expect(io.fileText('a.mjs')).toBe('um');
    await io.fs.writeText('a.mjs', 'tres', 'replace');
    expect(io.fileText('a.mjs')).toBe('tres');
  });

  it('failingWrites faz o destino lançar OTHER', async () => {
    const io = createMemoryIo({ failingWrites: ['p/README.md'] });
    await expect(io.fs.writeText('p/README.md', 'x', 'create-new')).rejects.toMatchObject({ code: 'OTHER' });
  });

  it('stdout e stderr são separados', () => {
    const io = createMemoryIo();
    io.out.write('a');
    io.err.write('b');
    io.err.writeSync('c');
    expect(io.stdoutText()).toBe('a');
    expect(io.stderrText()).toBe('bc');
  });

  it('stdin devolve os bytes configurados e o ambiente é configurável', async () => {
    const io = createMemoryIo({ stdin: 'oi', platform: 'win32', nodeVersion: '20.0.0', cwd: '/proj' });
    expect(Buffer.from(await io.stdin.readAll()).toString('utf8')).toBe('oi');
    expect(io.stdin.isTty).toBe(false);
    expect(io.env).toMatchObject({ platform: 'win32', nodeVersion: '20.0.0', cwd: '/proj' });
  });

  it('diretórios, stat, listagem, bytes e remoção funcionam em memória', async () => {
    const io = createMemoryIo({ files: { 'd/f.txt': 'oi' } });
    expect(await io.fs.stat('d/f.txt')).toBe('file');
    expect(await io.fs.stat('d')).toBe('directory');
    expect(await io.fs.stat('nada')).toBe('missing');
    expect(await io.fs.listDirectory('d')).toEqual(['f.txt']);
    expect(Buffer.from(await io.fs.readBytes('d/f.txt')).toString('utf8')).toBe('oi');
    expect(Buffer.from(io.fileBytes('d/f.txt')).toString('utf8')).toBe('oi');
    await io.fs.makeDirectory('novo');
    await expect(io.fs.makeDirectory('novo')).rejects.toMatchObject({ code: 'EEXIST' });
    const temp = await io.fs.makeTempDirectory('gs-');
    expect(await io.fs.stat(temp)).toBe('directory');
    await io.fs.remove('d');
    expect(io.paths()).not.toContain('d/f.txt');
    await expect(io.fs.readBytes('nada')).rejects.toMatchObject({ code: 'ENOENT' });
    expect(await io.fs.modifiedAt('novo')).toBeGreaterThanOrEqual(0);
  });
});
