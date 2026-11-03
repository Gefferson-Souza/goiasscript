import { describe, expect, it } from 'vitest';
import { compile } from '../../../src/compile.ts';

const first = (text: string) => compile(text).diagnostics[0];
const SAYS_NO_EQUIVALENT = 'não existe em GoiásScript';

describe('palavras do JavaScript que não existem em GoiásScript', () => {
  it.each([
    ['prosa(require("fs"))', 'GS0403', 'requisito'],
    ['prosa(process)', 'GS0403', 'processo'],
    ['prosa(window)', 'GS0403', 'janela'],
    ['prosa(document)', 'GS0403', 'documento'],
    ['prosa(eval("1"))', 'GS0402', 'avaliar'],
    ['prosa(Array)', 'GS0403', 'lista'],
  ])('%s diz que não existe e não inventa palavra (%s)', (text, code, invented) => {
    const diagnostic = first(text);
    expect(diagnostic?.code).toBe(code);
    expect(diagnostic?.message).toContain(SAYS_NO_EQUIVALENT);
    expect(`${diagnostic?.message ?? ''} ${diagnostic?.help ?? ''}`).not.toContain(invented);
  });
  it.each(['prosa(require("fs"))', 'prosa(process)'])('%s explica que a v3 não mexe com o Node', (text) => {
    expect(first(text)?.help).toContain('não mexe com o Node');
  });
  it.each(['prosa(window)', 'prosa(eval("1"))'])('%s não fala do Node', (text) => {
    expect(first(text)?.help ?? '').not.toContain('Node');
  });
  it('mantém a sugestão quando a global tem equivalente real', () => {
    expect(first('console.log(1)')?.message).toContain('"prosa"');
    expect(first('prosa(JSON)')?.message).toContain('"Coisa"');
  });
  it('mantém a sugestão de nome novo ao declarar com palavra do JavaScript', () => {
    expect(first('uai public é 1')?.message).toContain('"publico"');
  });
});
