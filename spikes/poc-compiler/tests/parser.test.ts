import { describe, expect, it } from 'vitest';
import type { ArrowFunction, ForEachStatement, IfStatement } from '../src/ast.types.ts';
import { bodyTypes, firstExpression, parseText, sexp } from './support/parse-helpers.ts';

const expressionOf = (text: string): string => sexp(firstExpression(text), text);
const clean = (text: string): readonly string[] => parseText(text).found;

describe('precedência e associatividade (Pratt)', () => {
  it.each([
    ['a mais b vezes c', '(mais a (vezes b c))'],
    ['a menos b menos c', '(menos (menos a b) c)'],
    ['num_é a é_igualim b', '(é_igualim (num_é a) b)'],
    ['a menor_que b e_mais c maior_que d', '(e_mais (menor_que a b) (maior_que c d))'],
    ['a ou_então b e_mais c', '(ou_então a (e_mais b c))'],
    ['n sobrou 2 é_igualim 0', '(é_igualim (sobrou n 2) 0)'],
    ['a menos -1', '(menos a (- 1))'],
    ['x é y é 3', '(é x (é y 3))'],
    ['ocê.campo é 1', '(é (. ocê campo) 1)'],
  ])('%s', (text, expected) => {
    expect(expressionOf(text)).toBe(expected);
  });
});

describe('fim de instrução (§4.6)', () => {
  it('a quebra, o ; e o } terminam a instrução simples; o ; do aluno não é duplicado', () => {
    expect(bodyTypes(parseText('uai x é 1\ntrem y\nprosa(x)').result.program.body)).toEqual(['VariableDeclaration', 'VariableDeclaration', 'ExpressionStatement']);
    const { result, found } = parseText('uai a é 1; uai b é 2\nfaz_trem soma(a, b) { faz_favor a mais b }');
    expect(found).toEqual([]);
    expect(result.program.body.map((s) => s.type === 'VariableDeclaration' && s.needsTerminator)).toEqual([false, true, false]);
  });

  it('operador, é, vírgula e ponto no fim da linha, e ponto no começo da próxima, continuam a instrução', () => {
    expect(expressionOf('uai t é a mais\n b')).toBe('(mais a b)');
    expect(expressionOf('uai t é\n 5')).toBe('5');
    expect(expressionOf('soma(1,\n 2)')).toBe('(call soma 1 2)');
    expect(expressionOf('lista\n  .mapear(f)\n  // x\n  .filtrar(g)')).toBe('(call (. (call (. lista mapear) f) filtrar) g)');
  });

  it('callback com bloco dentro de chamada, sem ;, separa as instruções', () => {
    const text = 'lista.pra_cada(x => {\n  prosa(x)\n  prosa(x mais 1)\n})\nprosa("fim")';
    const { result, found } = parseText(text);
    expect(found).toEqual([]);
    expect(result.program.body).toHaveLength(2);
    const call = firstExpression(text);
    const arrow = call.type === 'CallExpression' ? (call.args[0] as ArrowFunction) : undefined;
    expect(arrow?.body.type === 'BlockStatement' && arrow.body.body).toHaveLength(2);
  });

  it('callback com bloco dentro de lista, seta com bloco em coisa de várias linhas e seta seguida de [ ou (', () => {
    expect(clean('uai a é [\n  lista.pra_cada(x => {\n    prosa(x)\n    prosa(x)\n  })\n]')).toEqual([]);
    const object = parseText('uai acoes é {\n  dobra: x => {\n    uai d é x vezes 2\n    faz_favor d\n  },\n  nome: "a"\n}\nprosa(1)');
    expect([object.found, object.result.program.body.length]).toEqual([[], 2]);
    expect(parseText('uai f é x => { faz_favor x }\n[1]\n(2)').result.program.body).toHaveLength(3);
  });
});

describe('palavra ou nome pela posição (§5.4)', () => {
  it('palavra goiana serve de chave e de membro; de e em são nomes fora do cabeçalho do vai_indo', () => {
    expect(clean('uai o é { de: "SP", mais: 1 }\nprosa(o.de, o.mais)')).toEqual([]);
    expect(clean('uai de é [1]\nuai em é 5\nvai_indo (uai x de de) { prosa(x mais em) }')).toEqual([]);
  });

  it('vai_indo aceita laço clássico, de e em', () => {
    const classic = parseText('vai_indo (trem i é 0; i menor_que 3; i é i mais 1) { prosa(i) }');
    const each = parseText('vai_indo (uai x de lista) { prosa(x) }\nvai_indo (uai k em coisa) { prosa(k) }');
    expect([classic.found, each.found]).toEqual([[], []]);
    expect(classic.result.program.body[0]?.type).toBe('ForStatement');
    expect((each.result.program.body[0] as ForEachStatement).relationToken.keyword?.spelling).toBe('de');
  });
});

describe('instruções compostas', () => {
  it('se_num_for e se_não continuam na linha seguinte, com Allman e comentário; outra instrução encerra', () => {
    const text = 'se_ocê_quiser (a)\n{\n  prosa(1)\n}\nse_num_for (b) {\n  prosa(2)\n}\n\n// x\n\nse_não {\n  prosa(3)\n}\nprosa(4)';
    const { result, found } = parseText(text);
    expect(found).toEqual([]);
    expect(bodyTypes(result.program.body)).toEqual(['IfStatement', 'ExpressionStatement']);
    expect((result.program.body[0] as IfStatement).alternate?.type).toBe('IfStatement');
    expect(bodyTypes(parseText('se_ocê_quiser (a) { prosa(1) }\nprosa(2)').result.program.body)).toEqual(['IfStatement', 'ExpressionStatement']);
  });

  it('tenta_aí com se_der_ruim e por_fim em linhas separadas', () => {
    const { result, found } = parseText('tenta_aí {\n  prosa(1)\n}\nse_der_ruim (erro) {\n  prosa(erro)\n}\npor_fim {\n  prosa(3)\n}');
    expect([found, bodyTypes(result.program.body)]).toEqual([[], ['TryStatement']]);
  });

  it('classe com herança, construtor, static e async; função assíncrona e vixe como instrução', () => {
    const text = 'arruma_trem Pequi inherda_de Fruta\n{\n  aprepara_trem(n) { a_raiz(n) }\n  num_muda criar() { faz_favor faz_um Pequi("verde") }\n  vai_na_frente busca() { faz_favor 1 }\n}';
    const { result, found } = parseText(text);
    expect(found).toEqual([]);
    const declaration = result.program.body[0];
    expect(declaration?.type === 'ClassDeclaration' && declaration.members.map((m) => m.key.name)).toEqual(['constructor', 'criar', 'busca']);
    expect(clean('vai_na_frente faz_trem busca() {\n  espera_um_cadim cochila(1)\n  vixe("Deu ruim, sô!")\n}')).toEqual([]);
  });
});

describe('diagnósticos e recuperação', () => {
  it.each([
    ['uai x = 5', ['GS0404@1']],
    ['se_ocê_quiser (x == 1) {\n}', ['GS0404@1']],
    ['const total é 5', ['GS0401@1']],
    ['console.log("oi")', ['GS0403@1']],
    ['uai preço é 10,50', ['GS0208@1']],
    ['uai t é a\n  mais b', ['GS0203@2']],
    ['uai x é 1\nse_não {\n}', ['GS0205@2']],
    ['se_ocê_quiser (a) prosa(a)', ['GS0207@1']],
    ['faz_trem f() {\n  faz_favor 1\n', ['GS0201@3']],
    ['uai mais é 1', ['GS0303@1']],
    ['1 é x', ['GS0209@1']],
    ['vixe("a", "b")', ['GS0206@1']],
    ['uai f é x => vixe("a")', ['GS0206@1']],
    ['uai f é (a, b)\n=> a', ['GS0204@1']],
    ['uai t é `oi ${x}`', ['GS0500@1']],
    ['uai x', ['GS0307@1']],
    ['tenta_aí {\n}', ['GS0202@1']],
  ])('%j', (text, expected) => {
    expect(clean(text)).toEqual(expected);
  });

  it('reporta vários diagnósticos de uma vez e continua depois do erro', () => {
    const text = 'uai nome = "Goiás"\nse_ocê_quiser (nome == "Goiás") {\n  console.log(nome)\n}\nconst idade é 18\nuai preço é 10,50\nprosa("fim")';
    const { found, result } = parseText(text);
    expect(found).toEqual(['GS0404@1', 'GS0404@2', 'GS0403@3', 'GS0401@5', 'GS0208@6']);
    expect(result.program.body).toHaveLength(5);
  });

  it('incomplete só quando todo erro é fim inesperado da entrada', () => {
    expect([parseText('se_ocê_quiser (a) {'), parseText('uai x = 5'), parseText('uai ok é 1'), parseText('tenta_aí {\n}')].map((parsed) => parsed.result.incomplete)).toEqual([true, false, false, false]);
  });

  it('nunca lança nem estoura a pilha com entrada muito aninhada, e limita com GS0500', () => {
    const huge = 100_000;
    const inputs = ['('.repeat(huge), '['.repeat(huge), '{'.repeat(huge), `1${' mais 1'.repeat(huge)}`, `a${'.a'.repeat(huge)}`, `a${'()'.repeat(huge)}`, 'se_ocê_quiser (a) {\n'.repeat(1000)];
    for (const input of inputs) expect(() => parseText(input)).not.toThrow();
    expect(clean('('.repeat(huge))).toContain('GS0500@1');
    expect(clean(`1${' mais 1'.repeat(huge)}`)).toContain('GS0500@1');
  });
});
