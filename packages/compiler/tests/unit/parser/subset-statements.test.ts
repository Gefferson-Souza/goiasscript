import { describe, expect, it } from 'vitest';
import { codes, parseText } from '../../support/parse.ts';

const shapeOf = (text: string) =>
  parseText(text).program.body.map((node) => (node.type === 'ErrorNode' ? `${node.type}:${node.code}:${String(node.start)}-${String(node.end)}` : node.type));

describe('parser: instruções fora do subconjunto', () => {
  it.each([
    ['switch (x) { }\nuai x é 1', ['ErrorNode:GS0505:0-14', 'VariableDeclaration']],
    ['switch\nuai x é 1', ['ErrorNode:GS0505:0-6', 'VariableDeclaration']],
    ['switch (a) (b) { }\nuai x é 1', ['ErrorNode:GS0505:0-18', 'VariableDeclaration']],
    ['with (o) { x }\nuai x é 1', ['ErrorNode:GS0500:0-14', 'VariableDeclaration']],
    ['import x from "y"\nuai x é 1', ['ErrorNode:GS0515:0-17', 'VariableDeclaration']],
    ['debugger\nuai x é 1', ['ErrorNode:GS0500:0-8', 'VariableDeclaration']],
  ])('%j vira só o nó de erro da instrução: %j', (text, shape) => {
    expect(shapeOf(text)).toEqual(shape);
  });
  it('só o do consome o while que o fecha, e só o primeiro agrupamento dele', () => {
    expect(shapeOf('do { prosa(1) } while (certeza)\nuai x é 1')).toEqual(['ErrorNode:GS0506:0-31', 'VariableDeclaration']);
    expect(shapeOf('do { } while (a) (b)\nuai x é 1')).toEqual(['ErrorNode:GS0506:0-16', 'ExpressionStatement', 'VariableDeclaration']);
    expect(shapeOf('do { } while\nuai x é 1')).toEqual(['ErrorNode:GS0506:0-12', 'VariableDeclaration']);
  });
  it('do sem while e outras instruções seguidas de while não perdem o que vem depois', () => {
    expect(shapeOf('do { }\nuai x é 1')).toEqual(['ErrorNode:GS0506:0-6', 'VariableDeclaration']);
    expect(shapeOf('do { } outro (a)')).toEqual(['ErrorNode:GS0506:0-6', 'ExpressionStatement']);
    expect(shapeOf('switch (x) { }\nwhile (a) { }')).toEqual(['ErrorNode:GS0505:0-14', 'WhileStatement']);
    expect(shapeOf('with (o) { }\nwhile (a) { }')).toEqual(['ErrorNode:GS0500:0-12', 'WhileStatement']);
  });
  it('cada instrução fora do subconjunto dá um diagnóstico só e a seguinte é lida normalmente', () => {
    expect(codes(parseText('debugger\nuai x é 1'))).toEqual(['GS0500']);
    expect(codes(parseText('import x from "y"\nuai x é 1'))).toEqual(['GS0515']);
  });
  it('while na mesma linha de switch ou with não entra no nó de erro', () => {
    expect(shapeOf('switch (x) { } while (a) { }')).toEqual(['ErrorNode:GS0505:0-14', 'WhileStatement']);
    expect(shapeOf('do { } "while" (a)')).toEqual(['ErrorNode:GS0506:0-6', 'ExpressionStatement']);
  });
});
