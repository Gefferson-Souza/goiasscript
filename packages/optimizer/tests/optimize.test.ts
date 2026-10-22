import { compile } from '@goiasscript/compiler';
import { originalPositionFor, TraceMap } from '@jridgewell/trace-mapping';
import { describe, expect, it } from 'vitest';
import { optimize } from '../src/optimize.ts';

function compiled(text: string, sourceMap = true) {
  const result = compile(text, { sourceMap });
  if (!result.ok) throw new Error('esperava compilação ok');
  return result;
}

describe('optimize', () => {
  it('await de topo sobrevive (module: true)', async () => {
    const out = await optimize(compiled('uai a é 1\nespera_um_cadim cochila(1)\nprosa(a)'), { minify: false });
    expect(out.code).toContain('await');
  });

  it('minify encurta nomes locais; otimiza não', async () => {
    const result = compiled('trem acumuladorLongo é 0\nvai_indo (trem contadorLongo é 0; contadorLongo menor_que 3; contadorLongo é contadorLongo mais 1) { acumuladorLongo é acumuladorLongo mais contadorLongo }\nprosa(acumuladorLongo)');
    const minified = await optimize(result, { minify: true });
    const plain = await optimize(result, { minify: false });
    expect(minified.code.length).toBeLessThan(plain.code.length);
  });

  it.each([true, false])('mapa composto (minify: %s) aponta linha e coluna originais e preserva sourcesContent', async (minify) => {
    const text = 'uai a é 1\nprosa(a mais 1)';
    const out = await optimize(compiled(text), { minify });
    if (out.map === null) throw new Error('esperava mapa');
    const map = new TraceMap(JSON.stringify(out.map));
    expect(map.sources).toEqual(['programa.gs']);
    expect(map.sourcesContent).toEqual([text]);
    const lines = out.code.split('\n');
    const generatedLine = lines.findIndex((line) => line.includes('console'));
    const generatedColumn = lines[generatedLine]?.indexOf('console') ?? -1;
    expect(originalPositionFor(map, { line: generatedLine + 1, column: generatedColumn })).toMatchObject({
      source: 'programa.gs',
      line: 2,
      column: 0,
    });
  });

  it('sem mapa de entrada, mapa nulo', async () => {
    expect((await optimize(compiled('prosa(1)', false), { minify: false })).map).toBeNull();
  });

  it('falha do Terser rejeita a Promise', async () => {
    const broken = { ...compiled('prosa(1)'), code: 'const = ;' };
    await expect(optimize(broken, { minify: false })).rejects.toThrow();
  });
});
