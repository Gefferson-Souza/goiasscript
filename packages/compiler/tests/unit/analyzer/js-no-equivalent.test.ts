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
  it.each([
    ['uai public é 1', 'publico'],
    ['prosa(public)', 'publico'],
    ['uai eval é 1', 'avaliar'],
    ['prosa(eval)', 'avaliar'],
    ['uai switch é 1', 'opcao'],
    ['faz_trem f(NaN) {}', 'nao_numero'],
    ['faz_trem f() { faz_favor arguments }', 'argumentos'],
  ])('%s diz a mesma coisa na declaração e no uso, sem nome inventado (%s)', (text, invented) => {
    const diagnostic = first(text);
    expect(diagnostic?.code).toBe('GS0402');
    expect(diagnostic?.message).toContain(SAYS_NO_EQUIVALENT);
    expect(diagnostic?.message).not.toContain(invented);
  });
  it('uso e declaração da mesma palavra dão a mesma mensagem', () => {
    expect(first('uai public é 1')?.message).toBe(first('prosa(public)')?.message);
  });
  it('sugestão de membro renomeado não vale para namespace da biblioteca', () => {
    expect(first('prosa(Conta.tamanho)')?.message ?? '').not.toContain('o_tanto');
  });
});

describe('membros que mudaram de nome desde a versão anterior', () => {
  it.each([
    ['prosa("abc".tamanho())', 'o_tanto'],
    ['prosa([3, 1].ordenar())', 'arruma'],
    ['prosa([3, 1].arranca_o_rabo())', 'ranca_o_rabo'],
    ['prosa([1, 2].reduzir((a, b) => a mais b, 0))', 'amontoar'],
    ['prosa([3, 1].inverter())', 'de_trás_pra_frente'],
    ['prosa("abc".pedaco(0, 1))', 'naco'],
    ['uai p é faz_um Promessa((ok) => ok(1))\np.quando_resolver((x) => prosa(x))', 'quando_der_bão'],
    ['uai p é faz_um Promessa((ok) => ok(1))\np.se_der_pobrema((x) => prosa(x))', 'se_der_ruim'],
  ])('%s sugere o nome novo', (text, replacement) => {
    const diagnostic = first(text);
    expect(diagnostic?.code).toBe('GS0305');
    expect(diagnostic?.message).toContain(`".${replacement}"`);
  });
  it('erro de digitação num nome vivo continua sugerindo pela parecença', () => {
    expect(first('prosa([1, 2].amontoa((a, b) => a mais b, 0))')?.message).toContain('".amontoar"');
  });
  it('não inventa sugestão para membro desconhecido qualquer', () => {
    expect(first('prosa("abc".zzzzzzzz())')?.message).not.toContain('Cê quis dizer');
  });
});
