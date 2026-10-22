import { describe, expect, it } from 'vitest';
import { emit } from '../../support/lower.ts';

describe('ponto e vírgula', () => {
  it('callback em bloco sem ; (Review Focus 5)', () => {
    const { code } = emit('uai lista é [1]\nlista.pra_cada(x => {\n  prosa(x)\n  prosa(x mais 1)\n})');
    expect(code).toBe('const lista = [1];\nlista.forEach(x => {\n  console.log(x);\n  console.log(x + 1);\n});');
  });
  it('declaração com seta recebe ; e a linha seguinte começada por ( não vira chamada', () => {
    expect(emit('uai f é x => { faz_favor x }\n(1)').code).toBe('const f = x => { return x; };\n(1);');
  });
  it('não duplica o ; do aluno e não põe ; depois de instrução composta', () => {
    expect(emit('uai a é 1;\nse_ocê_quiser (certeza) { prosa(a) }').code).toBe('const a = 1;\nif (true) { console.log(a); }');
  });
  it('cabeçalho do vai_indo mantém só 2 ;', () => {
    expect(emit('vai_indo (trem i é 0; i menor_que 3; i é i mais 1) { prosa(i) }').code).toBe(
      'for (let i = 0; i < 3; i = i + 1) { console.log(i); }',
    );
  });
  it('o ; entra depois do ) inserido na mesma posição', () => {
    expect(emit('pergunta("a").gritando()').code.split('\n')[0]).toBe('(await $gs_pergunta("a")).toUpperCase();');
  });
});
