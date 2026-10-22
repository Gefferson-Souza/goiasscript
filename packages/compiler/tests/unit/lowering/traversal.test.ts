import { describe, expect, it } from 'vitest';
import { createLexer } from '../../../src/lexer/lexer.ts';
import { createOrderCounter, flatMapTree } from '../../../src/lowering/traversal.ts';
import { parse } from '../../../src/parser/parser.ts';
import { createSourceText } from '../../../src/source/source-text.ts';

const WIDE_PROGRAM_STATEMENTS = 5000;

function programOf(text: string) {
  const source = createSourceText(text, 'programa.gs');
  return parse(source, createLexer(source), { target: 'module' }).program;
}

describe('traversal', () => {
  it('flatMapTree visita em pré-ordem e entrega o pai de cada nó', () => {
    const found = flatMapTree(programOf('uai a é b mais 1'), (node, parent) =>
      node.type === 'Identifier' ? [`${node.name}<${parent?.type ?? 'raiz'}`] : [],
    );
    expect(found).toEqual(['a<VariableDeclarator', 'b<BinaryExpression']);
  });
  it('programa largo percorre sem custo quadrático', () => {
    const statements = flatMapTree(programOf('prosa(1)\n'.repeat(WIDE_PROGRAM_STATEMENTS)), (node) =>
      node.type === 'ExpressionStatement' ? [node] : [],
    );
    expect(statements).toHaveLength(WIDE_PROGRAM_STATEMENTS);
  });
  it('contador de ordem cresce de um em um', () => {
    const nextOrder = createOrderCounter();
    expect([nextOrder(), nextOrder(), nextOrder()]).toEqual([0, 1, 2]);
  });
});
