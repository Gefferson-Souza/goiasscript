import { describe, expect, it } from 'vitest';
import { emit } from '../../support/lower.ts';

describe('vixe', () => {
  it.each([
    ['vixe("Deu ruim, sô!")', 'throw new Error("Deu ruim, sô!");'],
    ['vixe(faz_um Erro("a"))', 'throw (new Error("a"));'],
    ['tenta_aí { prosa(1) } se_der_ruim (erro) { vixe(erro) }', 'try { console.log(1); } catch (erro) { throw (erro); }'],
    ['uai msg é "a"\nvixe(msg)', 'const msg = "a";\nthrow new Error(msg);'],
  ])('%s', (src, js) => {
    expect(emit(src).code).toBe(js);
  });
});
