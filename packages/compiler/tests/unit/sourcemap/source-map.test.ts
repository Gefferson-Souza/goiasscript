import { originalPositionFor, TraceMap } from '@jridgewell/trace-mapping';
import { describe, expect, it } from 'vitest';
import { buildSourceMap } from '../../../src/sourcemap/source-map.ts';
import { createSourceText } from '../../../src/source/source-text.ts';
import { emit } from '../../support/lower.ts';

function mapOf(text: string) {
  const out = emit(text);
  const source = createSourceText(text, 'programa.gs');
  return { out, map: buildSourceMap(source, out.code, out.segments) };
}
const find = (map: ReturnType<typeof mapOf>['map'], line: number, column: number) =>
  originalPositionFor(new TraceMap(JSON.stringify(map)), { line, column });

describe('source map', () => {
  it('mapeia token de keyword trocado e token copiado', () => {
    const { map } = mapOf('uai total é 10\nprosa(total)');
    expect(find(map, 1, 6)).toMatchObject({ source: 'programa.gs', line: 1, column: 4 });
    expect(find(map, 2, 12)).toMatchObject({ line: 2, column: 6 });
  });
  it('arquivo do Windows: BOM e \\r\\n dão as mesmas linhas (Review Focus 1)', () => {
    const lf = mapOf('uai a é 1\nprosa(a)');
    const win = mapOf('﻿uai a é 1\r\nprosa(a)');
    expect(find(win.map, 2, 12)).toMatchObject({ line: 2 });
    expect(find(win.map, 2, 12).line).toBe(find(lf.map, 2, 12).line);
  });
  it('\\r isolado conta como quebra', () => {
    expect(find(mapOf('uai a é 1\rprosa(a)').map, 2, 12)).toMatchObject({ line: 2 });
  });
  it('par substituto antes do token conta 2 unidades', () => {
    const { map } = mapOf('uai t é 1\nprosa("😀", t)');
    expect(find(map, 2, 18)).toMatchObject({ line: 2, column: 12 });
  });
  it('programa vazio gera mapa sem mapeamentos', () => {
    expect(mapOf('').map.mappings).toBe('');
  });
  it('inserção de terminador mapeia sem origem e o arquivo termina em ponto e vírgula', () => {
    const { map, out } = mapOf('prosa(1)');
    expect(out.code.endsWith(';')).toBe(true);
    expect(find(map, 1, out.code.length - 1).source).toBeNull();
  });
  it('arquivo .gs vira .mjs no campo file', () => {
    expect(mapOf('prosa(1)').map.file).toBe('programa.mjs');
  });
  it('código de ajudante não tem origem', () => {
    const { map, out } = mapOf('uai n é pergunta("x")');
    expect(out.helperRange).not.toBeNull();
    const helperLine = out.helperRange?.startLine ?? 0;
    expect(find(map, helperLine, 0).source).toBeNull();
    expect(find(map, helperLine + 1, 0).source).toBeNull();
    expect(map.sourcesContent).toEqual(['uai n é pergunta("x")']);
  });
});
