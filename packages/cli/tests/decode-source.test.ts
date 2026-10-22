import { describe, expect, it } from 'vitest';
import { decodeSource } from '../src/paths/decode-source.ts';
import { readSource } from '../src/paths/read-source.ts';
import { createMemoryIo } from './support/memory-io.ts';

describe('decodeSource', () => {
  it('decodifica UTF-8', () => {
    expect(decodeSource(new TextEncoder().encode('é'))).toEqual({ ok: true, text: 'é' });
  });

  it('mantém o BOM no começo do texto para o compilador tratar', () => {
    const result = decodeSource(new Uint8Array([0xef, 0xbb, 0xbf, 0x61]));
    expect(result).toEqual({ ok: true, text: '\uFEFFa' });
  });

  it('recusa Latin-1 com orientação sobre UTF-8', () => {
    const result = decodeSource(new Uint8Array([0x63, 0xe9]));
    expect(result.ok).toBe(false);
    expect(result.ok ? '' : result.detail).toContain('UTF-8');
  });

  it.each([
    ['UTF-16 LE', [0xff, 0xfe, 0x61, 0x00]],
    ['UTF-16 BE', [0xfe, 0xff, 0x00, 0x61]],
  ])('recusa %s com BOM', (_name, bytes) => {
    const result = decodeSource(new Uint8Array(bytes));
    expect(result.ok).toBe(false);
    expect(result.ok ? '' : result.detail).toContain('UTF-8');
  });
});

describe('readSource', () => {
  it('lê o stdin quando o argumento é "-"', async () => {
    const io = createMemoryIo({ stdin: 'prosa(1)' });
    const result = await readSource('-', io);
    expect(result).toMatchObject({ ok: true, input: { kind: 'stdin', displayName: '<entrada>' } });
    expect(result.ok && new TextDecoder().decode(result.bytes)).toBe('prosa(1)');
  });

  it('lê um arquivo e guarda o nome para exibição', async () => {
    const io = createMemoryIo({ files: { 'a/x.gs': 'oi' } });
    const result = await readSource('a/x.gs', io);
    expect(result).toMatchObject({ ok: true, input: { kind: 'file', path: 'a/x.gs', displayName: 'a/x.gs' } });
  });

  it('arquivo inexistente é GS0905 com "não achei"', async () => {
    const result = await readSource('nao-existe.gs', createMemoryIo());
    expect(result).toMatchObject({ ok: false, code: 'GS0905' });
    expect(result.ok ? '' : result.detail).toContain('não achei');
  });

  it('pasta no lugar do arquivo é GS0905', async () => {
    const io = createMemoryIo({ files: { 'pasta.gs/x.txt': 'a' } });
    expect(await readSource('pasta.gs', io)).toMatchObject({ ok: false, code: 'GS0905' });
  });
});

describe('readSource com nome hostil', () => {
  it('escapa caracteres de controle na mensagem e no displayName', async () => {
    const missing = await readSource('a\u001b[2Jb.gs', createMemoryIo({}));
    expect(missing).toMatchObject({ ok: false, detail: 'não achei o arquivo "a\\x1b[2Jb.gs"' });
    const found = await readSource('a\u001bb.gs', createMemoryIo({ files: { 'a\u001bb.gs': 'x' } }));
    expect(found).toMatchObject({ ok: true, input: { displayName: 'a\\x1bb.gs' } });
  });
});
