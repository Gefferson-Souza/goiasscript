import { describe, expect, it } from 'vitest';
import type { ClassDeclaration } from '../../../src/ast/ast.types.ts';
import { parseText } from '../../support/parse.ts';
import { collectNodes, spans } from '../../support/parser-spans.ts';

const classOf = (text: string): ClassDeclaration => {
  const declaration = parseText(text).program.body[0];
  if (declaration?.type !== 'ClassDeclaration') throw new Error('esperava uma classe');
  return declaration;
};

const NESTING_BEYOND_LIMIT = 300;

describe('parser: membros de classe', () => {
  it('trata num_muda seguido de parênteses como nome de método, não como modificador', () => {
    const method = classOf('arruma_trem A { num_muda() { } }').body[0];
    expect(method).toMatchObject({ kind: 'method', static: false, async: false, keywordTokens: [] });
    expect(method?.key.name).toBe('num_muda');
  });
  it('começa o método no primeiro modificador quando há, e no nome quando não há', () => {
    const text = 'arruma_trem A { num_muda vai_na_frente m() { } n() { } }';
    const [first, second] = classOf(text).body;
    expect(first?.start).toBe(text.indexOf('num_muda'));
    expect(second?.start).toBe(text.indexOf('n()'));
  });
  it.each([
    ['com é', 'arruma_trem A { x é 1 }'],
    ['com =', 'arruma_trem A { x = 1 }'],
    ['sem valor', 'arruma_trem A { x }'],
  ])('campo %s reporta GS0509 só no nome e não deixa sobra', (_name, text) => {
    const result = parseText(text);
    expect(spans(result)).toEqual(['GS0509@16-17']);
    expect(classOf(text).body).toEqual([]);
  });
  it.each([
    ['é', 'arruma_trem A { x é 1; m() { } }'],
    ['ponto e vírgula sem valor', 'arruma_trem A { x; m() { } }'],
  ])('consome o ponto e vírgula do campo (%s) e segue para o próximo método', (_name, text) => {
    expect(spans(parseText(text))).toEqual(['GS0509@16-17']);
    expect(classOf(text).body.map((method) => method.key.name)).toEqual(['m']);
  });
  it('reporta campo privado até o fim do nome e só consome o nome quando ele existe', () => {
    expect(spans(parseText('arruma_trem A { #x é 1 }'))).toEqual(['GS0510@16-18']);
    const lonely = parseText('arruma_trem A { # }');
    expect(spans(lonely)).toEqual(['GS0510@16-17']);
    expect(classOf('arruma_trem A { # }').body).toEqual([]);
  });
  it('reconhece get e set com nome e parênteses como acessor', () => {
    expect(spans(parseText('arruma_trem A { get x() { } }'))).toEqual(['GS0508@16-21']);
    expect(spans(parseText('arruma_trem A { set x(v) { } }'))).toEqual(['GS0508@16-21']);
  });
  it('não confunde com acessor um nome comum seguido de outro nome e parênteses', () => {
    const text = 'arruma_trem A { foo bar() { } }';
    expect(spans(parseText(text))).toEqual(['GS0509@16-19']);
    expect(classOf(text).body.map((method) => method.key.name)).toEqual(['bar']);
  });
  it('não toma como acessor um texto "get" no lugar do nome', () => {
    expect(spans(parseText('arruma_trem A { "get" x() { } }'))).toEqual(['GS0202@16-21{"found":"\\"get\\""}']);
  });
  it('não confunde com acessor get sem nome depois', () => {
    expect(spans(parseText('arruma_trem A { get() { } }'))).toEqual([]);
    expect(classOf('arruma_trem A { get() { } }').body[0]?.key.name).toBe('get');
  });
  it('não confunde com acessor get seguido de nome sem parênteses', () => {
    expect(spans(parseText('arruma_trem A { get x\n}'))).toEqual(['GS0509@16-19', 'GS0509@20-21']);
  });
  it('reporta GS0202 para membro que não é palavra e não cria método', () => {
    const text = 'arruma_trem A { 1 }';
    expect(spans(parseText(text))).toEqual(['GS0202@16-17{"found":"1"}']);
    expect(classOf(text).body).toEqual([]);
  });
  it('dá GS0201 e corpo vazio quando a classe termina antes das chaves', () => {
    expect(spans(parseText('arruma_trem A'))).toEqual(['GS0201@13-13']);
    expect(classOf('arruma_trem A').body).toEqual([]);
  });
  it('dá GS0207 e corpo vazio quando falta a chave de abertura', () => {
    const text = 'arruma_trem A foo';
    expect(spans(parseText(text))).toEqual(['GS0207@14-17']);
    expect(classOf(text).body).toEqual([]);
  });
  it('mantém o contexto de instrução no corpo do método para ler o corpo sem chaves da linha seguinte', () => {
    const text = 'arruma_trem A {\n  m()\n  foo()\n}';
    expect(spans(parseText(text))).toEqual(['GS0207@24-27']);
    expect(classOf(text).body[0]?.body.body).toHaveLength(1);
  });
  it('devolve o contexto de agrupamento depois da classe, mantendo as quebras de linha dentro dos parênteses', () => {
    expect(spans(parseText('prosa(x => { arruma_trem A { } },\n  2)'))).toEqual([]);
    expect(spans(parseText('prosa(x => { arruma_trem A { }\n}, 2)'))).toEqual([]);
  });
  it('usa corpo vazio de métodos quando o aninhamento passa do limite', () => {
    const text = 'arruma_trem A { m() { '.repeat(NESTING_BEYOND_LIMIT);
    const classes = collectNodes(parseText(text).program, 'ClassDeclaration');
    expect(classes.length).toBeGreaterThan(0);
    const memberTypes = new Set(classes.flatMap((declaration) => declaration.body.map((method) => method.type)));
    expect([...memberTypes]).toEqual(['MethodDefinition']);
    expect(classes.at(-1)?.body).toEqual([]);
  });
});
