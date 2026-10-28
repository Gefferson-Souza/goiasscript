import { describe, expect, it } from 'vitest';
import { analyzeSource } from '../../support/analyze.ts';

const hintCodes = (text: string): readonly string[] => analyzeSource(text).codes;

describe('avisos: relançamento e erro capturado', () => {
  it('se_der_ruim sem parâmetro não quebra a análise', () => {
    expect(hintCodes('tenta_aí { prosa(1) } se_der_ruim { prosa(2) }')).toEqual([]);
  });
  it('o erro capturado só vale dentro do se_der_ruim', () => {
    const text = 'tenta_aí { prosa(1) } se_der_ruim (erro) { prosa(2) }\nuai erro é 1\nvixe(erro)';
    expect(analyzeSource(text).analysis.rethrowStatements.size).toBe(0);
  });
  it('se_der_ruim aninhados em três níveis voltam ao parâmetro do nível de fora', () => {
    const text = [
      'tenta_aí { prosa(1) } se_der_ruim (a) {',
      '  tenta_aí { prosa(2) } se_der_ruim (b) {',
      '    tenta_aí { prosa(3) } se_der_ruim (c) { prosa(4) }',
      '    vixe(b)',
      '  }',
      '}',
    ].join('\n');
    expect(analyzeSource(text).analysis.rethrowStatements.size).toBe(1);
  });
  it('vixe com mais de um argumento ou sem argumento não é relançamento', () => {
    const base = 'uai outro é 1\ntenta_aí { prosa(1) } se_der_ruim (erro) { ';
    expect(analyzeSource(`${base}vixe(erro, outro) }`).analysis.rethrowStatements.size).toBe(0);
    expect(analyzeSource(`${base}vixe(outro) }`).analysis.rethrowStatements.size).toBe(0);
    expect(analyzeSource(`${base}vixe() }`).analysis.rethrowStatements.size).toBe(0);
  });
  it('GS0807 só avisa quando a função de saída é do console e recebe o erro inteiro', () => {
    const wrap = (call: string): string => `faz_trem guarda(x) { faz_favor x }\ntenta_aí { prosa(1) } se_der_ruim (erro) { ${call} }`;
    expect(hintCodes(wrap('guarda(erro)'))).toEqual([]);
    expect(hintCodes(wrap('cochila(erro)'))).toEqual([]);
    expect(hintCodes(wrap('naoExiste(erro)'))).toEqual(['GS0301']);
    expect(hintCodes(wrap('prosa(erro.mensagem)'))).toEqual([]);
    expect(hintCodes(wrap('prosa(guarda)'))).toEqual([]);
  });
  it('GS0807 aponta o argumento que é o erro, mesmo depois de outros', () => {
    const text = 'uai outro é 1\ntenta_aí { prosa(1) } se_der_ruim (erro) { prosa(outro, erro) }';
    const found = analyzeSource(text).analysis.diagnostics.find((item) => item.code === 'GS0807');
    expect(found).toBeDefined();
    expect(text.slice(found?.start, found?.end)).toBe('erro');
    expect(found?.args).toEqual({ name: 'prosa' });
  });
});

describe('avisos: laços e condições', () => {
  it('vai_indo sem teste e sem atualização é aceito', () => {
    expect(hintCodes('vai_indo (trem i é 0; ; ) { para_com_isso }')).toEqual([]);
    expect(hintCodes('vai_indo (;;) { para_com_isso }')).toEqual([]);
  });
  it('GS0801 vale também para o teste do vai_indo', () => {
    const { analysis } = analyzeSource('trem i é 0\nvai_indo (trem j é 0; i é 5; j mais 1) { prosa(j) }');
    const found = analysis.diagnostics.find((item) => item.code === 'GS0801');
    expect(found?.args).toEqual({ construct: 'vai_indo' });
  });
  it('GS0802 só avisa para certeza, não para outros valores', () => {
    expect(hintCodes('enquanto_tiver (1) { prosa(1) }')).toEqual([]);
    expect(hintCodes('enquanto_tiver (de_jeito_nenhum) { prosa(1) }')).toEqual([]);
  });
  it('GS0801 em seta só avisa quando a atribuição é a um parâmetro', () => {
    expect(hintCodes('trem x é 0\nuai l é [1]\nl.mapear(n => x é n)')).toEqual([]);
    expect(hintCodes('uai l é [{ a: 1 }]\nl.mapear(n => n.a é 1)')).toEqual([]);
    expect(hintCodes('uai l é [1]\nl.mapear((a, b) => b é 1)')).toContain('GS0801');
    expect(hintCodes('uai l é [1]\nl.mapear((a, b) => a é 1)')).toContain('GS0801');
  });
  it('GS0805 vale também para argumentos de faz_um', () => {
    expect(hintCodes('arruma_trem A { aprepara_trem(a, b) {} }\nfaz_um A(1.000,50)')).toContain('GS0805');
  });
  it('números separados por vírgula que não são decimal com vírgula não avisam', () => {
    expect(hintCodes('prosa(1, "2")')).toEqual([]);
    expect(hintCodes('prosa("1.000", 50)')).toEqual([]);
  });
});

describe('avisos: instruções sem efeito', () => {
  it('só soma de nome ganha sugestão; os outros avisos vêm sem sugestão', () => {
    const argsOf = (text: string): object | undefined => analyzeSource(text).analysis.diagnostics.find((item) => item.code === 'GS0806')?.args;
    expect(Object.keys(argsOf('trem a é 1\n1 mais 2') ?? { x: 1 })).toEqual([]);
    expect(Object.keys(argsOf('trem a é 1\na') ?? { x: 1 })).toEqual([]);
    expect(Object.keys(argsOf('trem a é 1\nnum_é a') ?? { x: 1 })).toEqual([]);
    expect(Object.keys(argsOf('trem a é 1\nuai b é 2\na e_mais b') ?? { x: 1 })).toEqual([]);
    expect(Object.keys(argsOf('trem a é 1\n5') ?? { x: 1 })).toEqual([]);
  });
  it('sugestão de atribuição usa o texto do operando', () => {
    const { analysis } = analyzeSource('trem a é 1\nuai b é 2\na mais b');
    expect(analysis.diagnostics.find((item) => item.code === 'GS0806')?.args).toEqual({ suggestion: 'a é a mais b' });
  });
  it('sem sugestão de atribuição quando o lado esquerdo não é um nome', () => {
    const { analysis } = analyzeSource('1 mais 2');
    const found = analysis.diagnostics.find((item) => item.code === 'GS0806');
    expect(found).toBeDefined();
    expect(found && 'suggestion' in found.args).toBe(false);
  });
});

describe('await no topo', () => {
  it('await depois de uma função continua sendo de topo', () => {
    const { analysis } = analyzeSource('faz_trem f() { faz_favor 1 }\nespera_um_cadim cochila(1)', { target: 'repl' });
    expect(analysis.hasTopLevelAwait).toBe(true);
  });
  it('menos unário solto também não tem efeito, sem sugestão de atribuição', () => {
    const found = analyzeSource('trem a é 1\nmenos a').analysis.diagnostics.find((item) => item.code === 'GS0806');
    expect(found).toBeDefined();
    expect(found && 'suggestion' in found.args).toBe(false);
  });
});

describe('ordem dos diagnósticos', () => {
  it('avisos e erros saem misturados na ordem do texto', () => {
    const { analysis } = analyzeSource('trem a é 1\na mais 1\nprosa(zz)\nprosa(yy)');
    expect(analysis.diagnostics.map((item) => item.code)).toEqual(['GS0806', 'GS0301', 'GS0301']);
    const starts = analysis.diagnostics.map((item) => item.start);
    expect(starts).toEqual([...starts].sort((left, right) => left - right));
  });
});
