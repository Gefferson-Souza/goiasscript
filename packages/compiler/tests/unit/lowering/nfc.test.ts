import { describe, expect, it } from 'vitest';
import { emit } from '../../support/lower.ts';

const NFD = 'café';
const NFC = 'café';

describe('NFC na emissão', () => {
  it('declarar em NFC e usar em NFD gera uma variável só, em NFC', () => {
    const { code } = emit(`uai ${NFC} é 1\nprosa(${NFD})`);
    expect(code).toBe(`const ${NFC} = 1;\nconsole.log(${NFC});`);
    expect(code.normalize('NFC')).toBe(code);
  });
  it('propriedade, método e parâmetro também saem em NFC', () => {
    const { code } = emit(`uai o é { ${NFD}: 1 }\nprosa(o.${NFC})\nfaz_trem f(${NFD}) { faz_favor ${NFC} }`);
    expect(code).toBe(`const o = { ${NFC}: 1 };\nconsole.log(o.${NFC});\nfunction f(${NFC}) { return ${NFC}; }`);
  });
  it('texto e comentário com NFD ficam intactos', () => {
    const { code } = emit(`// ${NFD}\nprosa("${NFD}")`);
    expect(code).toBe(`// ${NFD}\nconsole.log("${NFD}");`);
  });
  it('keyword em NFD é reconhecida', () => {
    const elseInNfd = 'se_n' + 'ã' + 'o';
    const { code } = emit(`se_ocê_quiser (certeza) { prosa(1) } ${elseInNfd} { prosa(2) }`);
    expect(code).toBe('if (true) { console.log(1); } else { console.log(2); }');
  });
  it('membro da biblioteca digitado em NFD sai pelo nome nativo, sem sobrepor edições', () => {
    const nfdMonth = 'mês';
    const { code } = emit(`uai d é faz_um Data()\nprosa(d.${nfdMonth}())`);
    expect(code).toBe('const d = new Date();\nconsole.log((d.getMonth() + 1));');
  });
  it('função da biblioteca digitada em NFD sai pelo nome nativo, sem sobrepor edições', () => {
    const nfdName = 'vira_nu\u0301mero';
    expect(emit(`prosa(${nfdName}("1"))`).code.split('\n')[0]).toBe('console.log($gs_vira_numero("1"));');
  });
  it('nome de método de classe em NFD sai em NFC', () => {
    expect(emit(`arruma_trem A { ${NFD}() { faz_favor 1 } }`).code).toBe(`class A { ${NFC}() { return 1; } }`);
  });
  it('variável em NFD usada como receptor de membro da biblioteca sai em NFC', () => {
    const { code } = emit(`uai ${NFC} é "ab"\nprosa(${NFD}.o_tanto)`);
    expect(code).toBe(`const ${NFC} = "ab";\nconsole.log(${NFC}.length);`);
  });
  it('índice computado em NFD sai em NFC', () => {
    expect(emit(`uai t é "ab"\nuai ${NFC} é 0\nprosa(t[${NFD}])`).code).toBe(`const t = "ab";\nconst ${NFC} = 0;\nconsole.log(t[${NFC}]);`);
  });
  it('propriedade em NFD de objeto do aluno sai em NFC', () => {
    const { code } = emit(`uai o é { ${NFC}: 1 }\nprosa(o.${NFD})`);
    expect(code).toBe(`const o = { ${NFC}: 1 };\nconsole.log(o.${NFC});`);
  });
  it('identificador já em NFC não gera edição própria no mapeamento', () => {
    const kinds = emit('uai x é 1').segments.map((segment) => segment.kind);
    expect(kinds).toEqual(['replace', 'copy', 'replace', 'copy', 'insert']);
  });
});
