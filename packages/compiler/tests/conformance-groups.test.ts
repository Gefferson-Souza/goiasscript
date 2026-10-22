import { describe, expect, it } from 'vitest';
import { compile } from '../src/compile.ts';
import { runModule } from './support/run-module.ts';

type Row = readonly [id: string, source: string, codes: readonly string[]];
const codesOf = (source: string): readonly string[] => compile(source).diagnostics.map((d) => d.code);

const NFD = 'cafe\u0301';
const NFC = 'caf\u00e9';
const IF_NFD = 'se_oce\u0302_quiser';
const TYPE_PHRASE = 'Ô sô, deu erro de tipo: um valor não foi usado do jeito certo.';
const REFERENCE_PHRASE = 'Ô sô, o programa usou um nome que ainda não existe.';
const RANGE_PHRASE = 'Ô sô, um número ficou fora do que o trem aceita.';
const TABLE: Readonly<Record<string, readonly Row[]>> = {
  'fim-de-instrução': [
    ['callback-bloco', 'uai l é [1]\nl.pra_cada(x => {\n  prosa(x)\n  prosa(x mais 1)\n})', []],
    ['callback-em-lista', 'uai l é [1]\nuai fs é [x => {\n  prosa(x)\n  prosa(x)\n}]', []],
    ['seta-em-coisa', 'uai acoes é {\n  dobra: x => {\n    prosa(x)\n    faz_favor x vezes 2\n  }\n}', []],
    ['argumentos-quebrados', 'prosa(Conta.maior(1,\n 2))', []],
    ['if-else-mesma-linha', 'se_ocê_quiser (certeza) { prosa(1) } se_não { prosa(2) }', []],
    ['else-linha-nova-com-comentario', 'se_ocê_quiser (certeza) { prosa(1) }\n// c\nse_não { prosa(2) }', []],
    ['try-separado', 'tenta_aí {\n  prosa(1)\n}\nse_der_ruim (erro) {\n  prosa(2)\n}\npor_fim {\n  prosa(3)\n}', []],
    ['allman', 'faz_trem f()\n{\n  faz_favor 1\n}\nenquanto_tiver (de_jeito_nenhum)\n{\n  prosa(1)\n}', []],
    ['faz-favor-vazio', 'faz_trem f() {\n  faz_favor\n  prosa(2)\n}\nprosa(f())', ['GS0803']],
    ['continua-na-linha-de-cima', 'uai a é 1\nmais 2', ['GS0203']],
    ['seta-quebrada', 'uai f é (x)\n=> x', ['GS0204']],
    ['senão-solto', 'se_não { prosa(1) }', ['GS0205']],
    ['async-quebrado', 'vai_na_frente\nfaz_trem f() {}', ['GS0202']],
  ],
  'palavras-e-nomes': [
    ['de-propriedade', 'uai o é { de: "SP" }\nprosa(o.de)', []],
    ['de-variavel', 'uai de é [1]\nvai_indo (uai x de de) { prosa(x) }', []],
    ['em-variavel', 'uai em é { a: 1 }\nvai_indo (uai k em em) { prosa(k) }', []],
    ['mais-como-nome', 'uai mais é 1', ['GS0303']],
    ['catch-nativo', 'uai p é faz_um Promessa(r => r(1))\np.catch(f => f)', ['GS0405']],
    ['new-propriedade', 'uai o é { new: 1 }', ['GS0401']],
    ['default-membro', 'uai o é { a: 1 }\nprosa(o.default)', ['GS0402']],
    ['public', 'uai public é 1', ['GS0402']],
    ['nfd-keyword', `${IF_NFD} (certeza) { prosa(1) }`, []],
    ['letra-grega', 'uai α é 1', ['GS0104']],
    ['cifrao', 'uai $x é 1', ['GS0104']],
    ['cedilha', 'uai ação é 1\nprosa(ação)', []],
    ['nfd-aceito', `uai ${NFD} é 1\nprosa(${NFD})`, []],
  ],
  'regex-template-numeros': [
    ['regex', 'uai r é /ab+/g', ['GS0502']],
    ['regex-com-aspas', 'uai r é /"/', ['GS0502']],
    ['regex-escapada', 'uai r é /a\\//', ['GS0502']],
    ['regex-igual', 'uai r é /=abc/', ['GS0502']],
    ['template', 'uai t é `oi`', ['GS0501']],
    ['divisoes', 'uai a é 8\nuai m é a / 2 / 2\nuai n é a /2/ 2', []],
    ['zero-esquerda', 'uai c é 01310', ['GS0101']],
    ['milhar', 'uai n é 1.000.000', ['GS0101']],
    ['virgula-decimal', 'uai preço é 10,50', ['GS0208']],
    ['milhar-virgula-args', 'prosa(1.000,50)', ['GS0805']],
    ['sem-diagnostico', 'prosa([1,2,3])\nprosa(Conta.maior(2,3))\nuai pi é 3.141', []],
  ],
  'membros-p1': [
    ['some', 'uai l é [1]\nl.some(f => f)', ['GS0405']],
    ['to-string', 'uai x é 1\nprosa(x.toString())', ['GS0406']],
    ['map', 'uai l é [1]\nl.map(f => f)', ['GS0405']],
    ['typo', 'uai p é { nome: 1 }\nprosa(p.nmoe)', ['GS0305']],
    ['constructor', 'uai p é { a: 1 }\nprosa(p.constructor)', ['GS0406']],
    ['indice-nao-literal', 'uai l é [1]\nuai i é 0\nprosa(l[i])', []],
  ],
  'sombreamento-p4': [
    ['classe-conta', 'arruma_trem Conta { aprepara_trem(v) { ocê.v é v } }\nuai c é faz_um Conta(1)\nprosa(c.v)', ['GS0804']],
    ['data-do-usuario', 'uai Data é 5\nprosa(Data)', ['GS0804']],
    ['arruma-com-funcao-propria', 'faz_trem arruma(l) { faz_favor l }\nprosa(arruma([2, 1]))\nprosa([2, 1].arruma())', []],
  ],
  'vixe': [
    ['seta-bloco', 'uai f é x => { vixe("a") }', []],
    ['seta-conciso', 'uai f é x => vixe("a")', ['GS0206']],
    ['ou-entao', 'uai a é nada\nuai b é a ou_então vixe("b")', ['GS0206']],
    ['dois-argumentos', 'vixe("a", "b")', ['GS0206']],
    ['concatenado', 'vixe("a") mais "b"', ['GS0206']],
  ],
  'aposentadas-p13': [
    ['presta-servico', 'presta_serviço soma(a, b) {}', ['GS0306']],
    ['vazio-nome', 'uai vazio é 0\nprosa(vazio)', []],
    ['se-nome', 'uai se é 1', []],
    ['lista-nome', 'uai lista é [1]', []],
  ],
  'avisos': [
    ['incremento', 'vai_indo (trem i é 0; i menor_que 5; i mais 1) { prosa(i) }', ['GS0806']],
    ['soma-solta', 'uai a é 1\na mais 1', ['GS0806']],
    ['prosa-erro', 'tenta_aí { vixe("a") } se_der_ruim (erro) { prosa(erro) }', ['GS0807']],
    ['trocar-dolar-literal', 'prosa("x".trocar("x", "US$&"))', []],
  ],
};

describe.each(Object.entries(TABLE))('grupo %s', (_group, rows) => {
  it.each(rows)('%s', (_id, source, expected) => {
    expect(codesOf(source)).toEqual(expected);
  });
});

describe('unicode e arquivo', () => {
  it('BOM + \\r\\n dá as mesmas linhas de diagnóstico que \\n (Review Focus 1)', () => {
    const lf = compile('uai a é 1\nprosa(nomi)').diagnostics[0]?.range.start.line;
    const win = compile('\uFEFFuai a é 1\r\nprosa(nomi)').diagnostics[0]?.range.start.line;
    expect(win).toBe(lf);
  });
  it('U+2028 e U+2029 em código, texto e comentário dão GS0105', () => {
    for (const source of ['uai a é 1\u2028prosa(a)', 'uai t é "a\u2029b"', '// c\u2028d']) expect(codesOf(source)).toContain('GS0105');
  });
  it('posição com emoji antes do erro, na mesma linha, conta UTF-16', () => {
    const d = compile('uai t é "😀" mais nomi').diagnostics[0];
    expect(d?.range.start).toMatchObject({ line: 1, column: 19 });
  });
  it('identifier-nfd: stdout igual ao NFC e saída em NFC', () => {
    const result = compile(`uai ${NFC} é 1\nprosa(${NFD})`);
    if (!result.ok) throw new Error('esperava ok');
    expect(result.code.normalize('NFC')).toBe(result.code);
    expect(runModule(result.code)).toBe('1\n');
  });
  it('texto e comentário com NFD intactos byte a byte', () => {
    const result = compile(`// ${NFD}\nprosa("${NFD}")`);
    if (!result.ok) throw new Error('esperava ok');
    expect(runModule(result.code)).toBe(`${NFD}\n`);
  });
});

describe('pergunta e erros capturados', () => {
  it('encadeamento de pergunta executa', () => {
    const result = compile('prosa(pergunta("Nome?").gritando())');
    if (!result.ok) throw new Error('esperava ok');
    expect(runModule(result.code, 'ana\n')).toBe('Nome? ANA\n');
  });
  it('fim da entrada antes da resposta termina o programa com o marcador GS0702', () => {
    const result = compile('uai a é pergunta("x")\nuai b é pergunta("y")');
    if (!result.ok) throw new Error('esperava ok');
    expect(() => runModule(result.code, 'um\n')).toThrow(/GS0702/);
  });
  it.each([
    ['leitura de nada', 'uai o é { x: 1 }\nuai a é nada\ntenta_aí { prosa(a.x) } se_der_ruim (erro) { prosa(erro.mensagem) }', TYPE_PHRASE],
    ['chamada de não-função', 'uai a é 5\ntenta_aí { a() } se_der_ruim (erro) { prosa(erro.mensagem) }', TYPE_PHRASE],
    ['uso antes da declaração', 'tenta_aí { prosa(x) } se_der_ruim (erro) { prosa(erro.mensagem) }\ntrem x é 1', REFERENCE_PHRASE],
    ['repete negativo', 'tenta_aí { prosa("a".repete(-1)) } se_der_ruim (erro) { prosa(erro.mensagem) }', RANGE_PHRASE],
    ['casas fora do limite', 'tenta_aí { prosa((1).com_casas(101)) } se_der_ruim (erro) { prosa(erro.mensagem) }', RANGE_PHRASE],
    ['recursão infinita', 'faz_trem f() { faz_favor f() }\ntenta_aí { f() } se_der_ruim (erro) { prosa(erro.mensagem) }', RANGE_PHRASE],
  ])('%s: mensagem genérica da classe, em português', (_name, source, phrase) => {
    const result = compile(source);
    if (!result.ok) throw new Error('esperava ok');
    expect(runModule(result.code)).toBe(`${phrase}\n`);
  });
  it('controle: vixe com mensagem do aluno sai intacta', () => {
    const result = compile('tenta_aí { vixe("Deu ruim, sô!") } se_der_ruim (erro) { prosa(erro.mensagem) }');
    if (!result.ok) throw new Error('esperava ok');
    expect(runModule(result.code)).toBe('Deu ruim, sô!\n');
  });
});
