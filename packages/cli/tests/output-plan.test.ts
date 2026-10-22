import { describe, expect, it } from 'vitest';
import { planOutput } from '../src/paths/output-plan.ts';
import { createMemoryIo } from './support/memory-io.ts';

const plan = (io: ReturnType<typeof createMemoryIo>, extra: object = {}) =>
  planOutput({ inputPath: 'x.gs', outputStem: 'x', overwrite: false, override: '--sobrescreve', ...extra }, io);

describe('planOutput', () => {
  it('deriva x.mjs ao lado do fonte', async () => {
    expect(await plan(createMemoryIo({ files: { 'x.gs': 'prosa(1)' } }))).toEqual({ ok: true, outputPath: 'x.mjs', replacing: false });
  });

  it('mantém o diretório e não mexe em x.temp.js preexistente', async () => {
    const io = createMemoryIo({ files: { 'pasta/x.gs': 'a', 'pasta/x.temp.js': 'velho' } });
    expect(await plan(io, { inputPath: 'pasta/x.gs' })).toMatchObject({ ok: true, outputPath: 'pasta/x.mjs' });
    expect(io.fileText('pasta/x.temp.js')).toBe('velho');
  });

  it('troca só a extensão final, preservando um .gs no meio do caminho', async () => {
    const io = createMemoryIo({ files: { 'e.gs/f/a.b.gs': 'a' } });
    expect(await plan(io, { inputPath: 'e.gs/f/a.b.gs', outputStem: 'a.b' })).toMatchObject({ ok: true, outputPath: 'e.gs/f/a.b.mjs' });
  });

  it('recusa destino existente sem --sobrescreve e aceita com ele', async () => {
    const io = createMemoryIo({ files: { 'x.gs': 'a', 'x.mjs': 'velho' } });
    expect(await plan(io)).toMatchObject({ ok: false, code: 'GS0903', args: { reason: 'já existe', override: '--sobrescreve' } });
    expect(await plan(io, { overwrite: true })).toEqual({ ok: true, outputPath: 'x.mjs', replacing: true });
  });

  it('usa a saída informada quando ela é válida', async () => {
    const io = createMemoryIo({ files: { 'x.gs': 'a', 'dist/ficha.txt': 'b' } });
    expect(await plan(io, { outputOption: 'dist/x.js' })).toEqual({ ok: true, outputPath: 'dist/x.js', replacing: false });
  });

  it('recusa saída igual à entrada, inclusive em sistema sem diferença de caixa', async () => {
    const io = createMemoryIo({ files: { 'x.gs': 'a' }, caseSensitive: false });
    expect(await plan(io, { outputOption: 'x.gs', overwrite: true })).toMatchObject({ ok: false, code: 'GS0903' });
    expect(await plan(io, { outputOption: 'X.GS', overwrite: true })).toMatchObject({ ok: false, code: 'GS0903' });
  });

  it('recusa saída que é o mesmo arquivo por link físico', async () => {
    const io = createMemoryIo({ files: { 'x.gs': 'a' }, hardLinks: [['x.gs', 'copia.mjs']] });
    expect(await plan(io, { outputOption: 'copia.mjs', overwrite: true })).toMatchObject({ ok: false, code: 'GS0903', args: { reason: 'é o mesmo arquivo da entrada' } });
  });

  it('recusa pasta como destino e destino que termina em .gs, mesmo com --sobrescreve', async () => {
    const io = createMemoryIo({ files: { 'x.gs': 'a', 'saida/dentro.txt': 'b', 'outro.gs': 'c' } });
    expect(await plan(io, { outputOption: 'saida', overwrite: true })).toMatchObject({ ok: false, code: 'GS0903', args: { reason: 'é uma pasta' } });
    expect(await plan(io, { outputOption: 'outro.gs', overwrite: true })).toMatchObject({ ok: false, code: 'GS0903', args: { reason: 'termina em .gs' } });
  });

  it('pasta de saída inexistente é GS0905, sem criar nada', async () => {
    const io = createMemoryIo({ files: { 'x.gs': 'a' } });
    expect(await plan(io, { outputOption: 'nao/existe/x.mjs' })).toMatchObject({ ok: false, code: 'GS0905' });
    expect(io.paths()).toEqual(['x.gs']);
  });
});
