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
});
