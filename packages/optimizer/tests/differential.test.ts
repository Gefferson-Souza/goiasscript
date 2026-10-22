import { compile } from '@goiasscript/compiler';
import { describe, expect, it } from 'vitest';
import { executeModule } from '../../compiler/tests/support/execute-module.ts';
import { optimize } from '../src/optimize.ts';

type Program = readonly [name: string, source: string, stdin: string | null];

const PROGRAMS: readonly Program[] = [
  ['soma', 'faz_trem soma(a, b) { faz_favor a mais b }\nprosa(soma(2, 3))', null],
  ['laço', 'trem t é 0\nvai_indo (trem i é 1; i pelo_menos 1 e_mais i no_máximo 4; i é i mais 1) { t é t mais i }\nprosa(t)', null],
  ['topo', 'espera_um_cadim cochila(1)\nprosa("depois")', null],
  ['pergunta', 'uai n é pergunta("Nome?")\nprosa(n.gritando())', 'ana\n'],
  ['sorteio', 'prosa(Conta.sorteia_um(1, 6))', null],
  ['ordenar', 'prosa([3, 1, 2].arruma().ajunta(","))', null],
];

describe('diferencial', () => {
  it.each(PROGRAMS)('%s: mesmo stdout nos três modos', async (_name, source, stdin) => {
    const result = compile(source);
    if (!result.ok) throw new Error(`esperava ok: ${JSON.stringify(result.diagnostics)}`);
    const didactic = await executeModule(result.code, stdin);
    const optimized = await executeModule((await optimize(result, { minify: false })).code, stdin);
    const minified = await executeModule((await optimize(result, { minify: true })).code, stdin);
    expect(optimized).toBe(didactic);
    expect(minified).toBe(didactic);
  });
});
